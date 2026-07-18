import net from "node:net";

export type RedisLikeCommandProvider = {
  readonly storageKind: "redis" | "memory";
  command(...parts: string[]): Promise<unknown>;
  close?(): Promise<void>;
};

export function createRedisSocketProvider(redisUrl: string): RedisLikeCommandProvider {
  return {
    storageKind: "redis",
    command: (...parts) => redisSocketCommand(redisUrl, ...parts),
  };
}

export function createMemoryRedisLikeProvider(options: {maxmemory?: number} = {}): RedisLikeCommandProvider {
  const strings = new Map<string, {value: string; expiresAt: number | null}>();
  const sets = new Map<string, {value: Set<string>; expiresAt: number | null}>();
  const maxmemory = Math.max(0, Math.floor(Number(options.maxmemory || 0)));

  const lazyExpire = (key?: string) => {
    const now = Date.now();
    const expireString = (entryKey: string, entry: {expiresAt: number | null}) => {
      if (entry.expiresAt !== null && entry.expiresAt <= now) strings.delete(entryKey);
    };
    const expireSet = (entryKey: string, entry: {expiresAt: number | null}) => {
      if (entry.expiresAt !== null && entry.expiresAt <= now) sets.delete(entryKey);
    };
    if (key) {
      const stringEntry = strings.get(key);
      if (stringEntry) expireString(key, stringEntry);
      const setEntry = sets.get(key);
      if (setEntry) expireSet(key, setEntry);
      return;
    }
    for (const [entryKey, entry] of strings) expireString(entryKey, entry);
    for (const [entryKey, entry] of sets) expireSet(entryKey, entry);
  };

  const usedMemory = () => {
    lazyExpire();
    let bytes = 0;
    for (const [key, entry] of strings) bytes += Buffer.byteLength(key, "utf8") + Buffer.byteLength(entry.value, "utf8") + 32;
    for (const [key, entry] of sets) {
      bytes += Buffer.byteLength(key, "utf8") + 32;
      for (const value of entry.value) bytes += Buffer.byteLength(value, "utf8") + 8;
    }
    return bytes;
  };

  return {
    storageKind: "memory",
    async command(...parts: string[]): Promise<unknown> {
      const command = (parts[0] || "").toUpperCase();
      const key = parts[1] || "";
      if (key) lazyExpire(key);
      if (command === "PING") return "PONG";
      if (command === "INFO" && (parts[1] || "").toLowerCase() === "memory") {
        return `# Memory\r\nused_memory:${usedMemory()}\r\nmaxmemory:${maxmemory}\r\n`;
      }
      if (command === "GET") {
        return strings.get(key)?.value ?? null;
      }
      if (command === "SET") {
        const value = parts[2] || "";
        let expiresAt: number | null = null;
        for (let index = 3; index < parts.length; index += 1) {
          if ((parts[index] || "").toUpperCase() === "PX") {
            const ttl = Number(parts[index + 1]);
            expiresAt = Number.isFinite(ttl) && ttl > 0 ? Date.now() + ttl : null;
            index += 1;
          }
        }
        strings.set(key, {value, expiresAt});
        sets.delete(key);
        return "OK";
      }
      if (command === "DEL") {
        let removed = 0;
        for (const entryKey of parts.slice(1)) {
          lazyExpire(entryKey);
          if (strings.delete(entryKey)) removed += 1;
          if (sets.delete(entryKey)) removed += 1;
        }
        return removed;
      }
      if (command === "SADD") {
        const values = parts.slice(2);
        const entry = sets.get(key) || {value: new Set<string>(), expiresAt: null};
        strings.delete(key);
        let added = 0;
        for (const value of values) {
          if (!entry.value.has(value)) {
            entry.value.add(value);
            added += 1;
          }
        }
        sets.set(key, entry);
        return added;
      }
      if (command === "SREM") {
        const entry = sets.get(key);
        if (!entry) return 0;
        let removed = 0;
        for (const value of parts.slice(2)) {
          if (entry.value.delete(value)) removed += 1;
        }
        return removed;
      }
      if (command === "SMEMBERS") {
        return Array.from(sets.get(key)?.value || []);
      }
      if (command === "SCARD") {
        return sets.get(key)?.value.size || 0;
      }
      if (command === "PTTL") {
        const entry = strings.get(key) || sets.get(key);
        if (!entry) return -2;
        if (entry.expiresAt === null) return -1;
        return Math.max(0, entry.expiresAt - Date.now());
      }
      throw new Error(`memory_redis_unsupported_command:${command}`);
    },
  };
}

async function redisSocketCommand(redisUrl: string, ...parts: string[]): Promise<unknown> {
  const url = new URL(redisUrl);
  const host = url.hostname;
  const port = Number(url.port || 6379);
  const password = decodeURIComponent(url.password || "");
  const database = url.pathname && url.pathname !== "/" ? Number(url.pathname.slice(1)) : 0;
  const commands: string[][] = [];
  if (password) commands.push(["AUTH", password]);
  if (database) commands.push(["SELECT", String(database)]);
  commands.push(parts);
  const socket = net.createConnection({host, port});
  try {
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
      socket.setTimeout(5000, () => reject(new Error("redis_timeout")));
    });
    let last: unknown = null;
    for (const command of commands) {
      socket.write(encodeRedisCommand(command));
      last = await readRedisResponse(socket);
      if (last instanceof Error) throw last;
    }
    return last;
  } finally {
    socket.end();
  }
}

function encodeRedisCommand(parts: string[]): Buffer {
  const chunks = [`*${parts.length}\r\n`];
  for (const part of parts) {
    const value = String(part);
    chunks.push(`$${Buffer.byteLength(value)}\r\n${value}\r\n`);
  }
  return Buffer.from(chunks.join(""), "utf8");
}

function readRedisResponse(socket: net.Socket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0);
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onData = (chunk: Buffer) => {
      buffer = Buffer.concat([buffer, chunk]);
      const parsed = parseRedisValue(buffer, 0);
      if (!parsed) return;
      cleanup();
      resolve(parsed.value);
    };
    socket.on("data", onData);
    socket.once("error", onError);
  });
}

function parseRedisValue(buffer: Buffer, offset: number): {value: unknown; next: number} | null {
  if (offset >= buffer.length) return null;
  const prefix = String.fromCharCode(buffer[offset]!);
  const lineEnd = buffer.indexOf("\r\n", offset);
  if (lineEnd < 0) return null;
  const line = buffer.slice(offset + 1, lineEnd).toString("utf8");
  const next = lineEnd + 2;
  if (prefix === "+") return {value: line, next};
  if (prefix === "-") return {value: new Error(line), next};
  if (prefix === ":") return {value: Number(line), next};
  if (prefix === "$") {
    const length = Number(line);
    if (length < 0) return {value: null, next};
    const end = next + length;
    if (buffer.length < end + 2) return null;
    return {value: buffer.slice(next, end).toString("utf8"), next: end + 2};
  }
  if (prefix === "*") {
    const length = Number(line);
    if (length < 0) return {value: null, next};
    const values: unknown[] = [];
    let cursor = next;
    for (let index = 0; index < length; index += 1) {
      const parsed = parseRedisValue(buffer, cursor);
      if (!parsed) return null;
      values.push(parsed.value);
      cursor = parsed.next;
    }
    return {value: values, next: cursor};
  }
  return null;
}
