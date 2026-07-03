export type ShowdownSimModuleV4 = {
  BattleStream: new (options?: {keepAlive?: boolean; debug?: boolean}) => unknown;
  Teams: {
    generate(format: string, options?: {seed?: number[] | null} | null): unknown[];
    getGenerator(format: string, seed?: number[] | null): unknown;
    pack(team: unknown[] | null): string;
    export(team: unknown[]): string;
  };
  getPlayerStreams(stream: unknown): unknown;
};

type NodeRuntimeV4 = {
  existsSync(path: string): boolean;
  createRequire(url: string): (path: string) => unknown;
  path: {
    dirname(path: string): string;
    join(...paths: string[]): string;
    resolve(...paths: string[]): string;
  };
  fileURLToPath(url: string): string;
  pathToFileURL(path: string): {href: string};
  cwd(): string;
  env: Record<string, string | undefined>;
};

let cachedVendorRoot: string | null = null;
let cachedSimModule: ShowdownSimModuleV4 | null = null;
let cachedTeamsPromise: Promise<ShowdownSimModuleV4["Teams"]> | null = null;
let nodeRuntimePromise: Promise<NodeRuntimeV4> | null = null;

export async function showdownVendorRootV4(): Promise<string> {
  if (cachedVendorRoot) return cachedVendorRoot;
  const runtime = await loadNodeRuntimeV4();
  const candidates = showdownVendorCandidatesV4(runtime);
  const found = candidates.find(candidate => runtime.existsSync(runtime.path.join(candidate, "sim", "index.js")));
  if (!found) throw new Error(`Showdown vendor 未找到。已检查：${candidates.join(", ")}`);
  cachedVendorRoot = found;
  return cachedVendorRoot;
}

export async function loadShowdownSimV4(): Promise<ShowdownSimModuleV4> {
  if (cachedSimModule) return cachedSimModule;
  const runtime = await loadNodeRuntimeV4();
  const require = runtime.createRequire(import.meta.url);
  cachedSimModule = require(runtime.path.join(await showdownVendorRootV4(), "sim", "index.js")) as ShowdownSimModuleV4;
  return cachedSimModule;
}

export async function loadShowdownTeamsV4(): Promise<ShowdownSimModuleV4["Teams"]> {
  const runtime = await loadNodeRuntimeV4();
  cachedTeamsPromise ||= showdownVendorRootV4()
    .then(root => import(/* @vite-ignore */ runtime.pathToFileURL(runtime.path.join(root, "sim", "index.js")).href))
    .then(module => {
      const loaded = module as unknown as Partial<ShowdownSimModuleV4> & {default?: Partial<ShowdownSimModuleV4>};
      const teams = loaded.default?.Teams || loaded.Teams;
      if (!teams) throw new Error("Showdown Teams vendor 未加载。");
      return teams;
    });
  return cachedTeamsPromise;
}

function showdownVendorCandidatesV4(runtime: NodeRuntimeV4): string[] {
  const candidates: string[] = [];
  addCandidate(runtime, candidates, runtime.env.CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT);
  addCandidate(runtime, candidates, runtime.env.SHOWDOWN_PATH);
  addCandidate(runtime, candidates, runtime.env.CHANGEBATTLE_PROJECT_ROOT && runtime.path.join(runtime.env.CHANGEBATTLE_PROJECT_ROOT, "vendor", "pokemon-showdown"));
  addCandidate(runtime, candidates, runtime.env.CHANGEBATTLE_PROJECT_ROOT && runtime.path.join(runtime.env.CHANGEBATTLE_PROJECT_ROOT, "packages", "showdown-battle-core", "vendor", "showdown"));
  for (const root of parentDirectories(runtime, runtime.path.dirname(runtime.fileURLToPath(import.meta.url)))) {
    addCandidate(runtime, candidates, runtime.path.join(root, "packages", "showdown-battle-core", "vendor", "showdown"));
    addCandidate(runtime, candidates, runtime.path.join(root, "vendor", "pokemon-showdown"));
  }
  for (const root of parentDirectories(runtime, runtime.cwd())) {
    addCandidate(runtime, candidates, runtime.path.join(root, "packages", "showdown-battle-core", "vendor", "showdown"));
    addCandidate(runtime, candidates, runtime.path.join(root, "vendor", "pokemon-showdown"));
  }
  return candidates;
}

function addCandidate(runtime: NodeRuntimeV4, candidates: string[], candidate: string | undefined | false) {
  if (!candidate) return;
  const resolved = runtime.path.resolve(candidate);
  if (!candidates.includes(resolved)) candidates.push(resolved);
}

function parentDirectories(runtime: NodeRuntimeV4, start: string): string[] {
  const roots: string[] = [];
  let current = runtime.path.resolve(start);
  while (true) {
    roots.push(current);
    const parent = runtime.path.dirname(current);
    if (parent === current) return roots;
    current = parent;
  }
}

async function loadNodeRuntimeV4(): Promise<NodeRuntimeV4> {
  if (typeof window !== "undefined") throw new Error("Showdown vendor 只能在 Node 环境加载。");
  nodeRuntimePromise ||= Promise.all([
    import(/* @vite-ignore */ nodeBuiltinSpecifierV4("fs")),
    import(/* @vite-ignore */ nodeBuiltinSpecifierV4("module")),
    import(/* @vite-ignore */ nodeBuiltinSpecifierV4("path")),
    import(/* @vite-ignore */ nodeBuiltinSpecifierV4("url")),
  ]).then(([fsModule, moduleModule, pathModule, urlModule]) => ({
    existsSync: (fsModule as {existsSync: NodeRuntimeV4["existsSync"]}).existsSync,
    createRequire: (moduleModule as {createRequire: NodeRuntimeV4["createRequire"]}).createRequire,
    path: (pathModule as {default: NodeRuntimeV4["path"]}).default,
    fileURLToPath: (urlModule as {fileURLToPath: NodeRuntimeV4["fileURLToPath"]}).fileURLToPath,
    pathToFileURL: (urlModule as {pathToFileURL: NodeRuntimeV4["pathToFileURL"]}).pathToFileURL,
    cwd: () => nodeProcessV4().cwd?.() || ".",
    env: nodeProcessV4().env || {},
  }));
  return nodeRuntimePromise;
}

function nodeBuiltinSpecifierV4(name: string): string {
  return `node:${name}`;
}

function nodeProcessV4(): {cwd?: () => string; env?: Record<string, string | undefined>} {
  return ((globalThis as {process?: {cwd?: () => string; env?: Record<string, string | undefined>}}).process || {});
}
