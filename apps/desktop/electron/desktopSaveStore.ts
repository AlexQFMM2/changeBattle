import {existsSync} from "node:fs";
import crypto from "node:crypto";
import {copyFile, mkdir, readFile, rename, rm, writeFile} from "node:fs/promises";
import path from "node:path";
import {gunzipSync, gzipSync} from "node:zlib";
import type {FormalGameRunV4, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";

const SPLIT_SAVE_VERSION = 1 as const;
const DEFAULT_SLOT_ID = "slot-001";
const APP_SAVE_SECRET = "changebattle-v2-local-save-v1";

const TABLE_FILES = {
  profile: "profile.dat",
  trainingRun: "training_run.dat",
  formalRun: "formal_run.dat",
} as const;

type SaveTableName = keyof typeof TABLE_FILES;

type SaveManifest = {
  version: typeof SPLIT_SAVE_VERSION;
  slot_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  tables: Partial<Record<SaveTableName, {updated_at: string}>>;
};

type SaveEnvelope = {
  v: 1;
  alg: "AES-256-GCM";
  kdf: "scrypt";
  salt: string;
  iv: string;
  tag: string;
  data: string;
};

export class DesktopSaveStoreV2 {
  private readonly userDataPath: string;
  private readonly slotId: string;
  private readonly slotDir: string;

  constructor(userDataPath: string, slotId = DEFAULT_SLOT_ID) {
    this.userDataPath = userDataPath;
    this.slotId = slotId;
    this.slotDir = path.join(userDataPath, "saves-v2", slotId);
  }

  path(): string {
    return this.slotDir;
  }

  manifestPath(): string {
    return path.join(this.slotDir, "manifest.json");
  }

  legacyProfilePath(): string {
    return path.join(this.userDataPath, "profile", "user-profile.json");
  }

  legacyProfileBackupPath(): string {
    return path.join(this.userDataPath, "profile", "user-profile.legacy.json");
  }

  async loadUserProfile(): Promise<UserProfileV2 | null> {
    const profile = await this.readNullableTable<UserProfileV2>("profile");
    if (profile) return profile;
    return this.migrateLegacyUserProfile();
  }

  async saveUserProfile(profile: UserProfileV2): Promise<UserProfileV2> {
    await this.writeTable("profile", profile);
    return clone(profile);
  }

  async deleteUserProfile(): Promise<void> {
    await this.deleteTable("profile");
  }

  async loadTrainingRun(): Promise<TrainingRunGameV4 | null> {
    return this.readNullableTable<TrainingRunGameV4>("trainingRun");
  }

  async saveTrainingRun(run: TrainingRunGameV4): Promise<TrainingRunGameV4> {
    await this.writeTable("trainingRun", run);
    return clone(run);
  }

  async deleteTrainingRun(): Promise<void> {
    await this.deleteTable("trainingRun");
  }

  async loadFormalGameRun(): Promise<FormalGameRunV4 | null> {
    return this.readNullableTable<FormalGameRunV4>("formalRun");
  }

  async saveFormalGameRun(run: FormalGameRunV4): Promise<FormalGameRunV4> {
    await this.writeTable("formalRun", run);
    return clone(run);
  }

  async deleteFormalGameRun(): Promise<void> {
    await this.deleteTable("formalRun");
  }

  async deleteAll(): Promise<void> {
    await rm(this.slotDir, {recursive: true, force: true});
  }

  private async migrateLegacyUserProfile(): Promise<UserProfileV2 | null> {
    const filePath = this.legacyProfilePath();
    if (!existsSync(filePath)) return null;
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as UserProfileV2;
    await this.saveUserProfile(parsed);
    const backupPath = this.legacyProfileBackupPath();
    if (!existsSync(backupPath)) await copyFile(filePath, backupPath);
    return clone(parsed);
  }

  private async readNullableTable<T>(name: SaveTableName): Promise<T | null> {
    const filePath = this.tablePath(name);
    if (!existsSync(filePath)) return null;
    try {
      const envelope = JSON.parse(await readFile(filePath, "utf8")) as SaveEnvelope;
      const payload = decryptTable(envelope, this.slotId, name);
      return JSON.parse(payload) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`存档表 ${TABLE_FILES[name]} 损坏或被修改：${message}`);
    }
  }

  private async writeTable<T>(name: SaveTableName, value: T): Promise<void> {
    await mkdir(this.slotDir, {recursive: true});
    const envelope = encryptTable(JSON.stringify(value), this.slotId, name);
    await atomicWriteFile(this.tablePath(name), JSON.stringify(envelope) + "\n");
    await this.touchManifest(name, extractDisplayName(value));
  }

  private async deleteTable(name: SaveTableName): Promise<void> {
    const filePath = this.tablePath(name);
    const shouldTouchManifest = existsSync(filePath) || existsSync(this.manifestPath());
    await rm(filePath, {force: true});
    if (shouldTouchManifest) await this.touchManifest(name, undefined, true);
  }

  private async touchManifest(name: SaveTableName, displayName?: string, deleted = false): Promise<void> {
    await mkdir(this.slotDir, {recursive: true});
    const now = new Date().toISOString();
    const existing = await this.readManifest();
    const tables = {...(existing?.tables || {})};
    if (deleted) delete tables[name];
    else tables[name] = {updated_at: now};
    const manifest: SaveManifest = {
      version: SPLIT_SAVE_VERSION,
      slot_id: this.slotId,
      display_name: displayName || existing?.display_name || "训练师",
      created_at: existing?.created_at || now,
      updated_at: now,
      tables,
    };
    await atomicWriteFile(this.manifestPath(), JSON.stringify(manifest, null, 2) + "\n");
  }

  private async readManifest(): Promise<SaveManifest | null> {
    const filePath = this.manifestPath();
    if (!existsSync(filePath)) return null;
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as SaveManifest;
    if (parsed.version !== SPLIT_SAVE_VERSION) {
      throw new Error(`不支持的 V2 存档版本: ${parsed.version}`);
    }
    return parsed;
  }

  private tablePath(name: SaveTableName): string {
    return path.join(this.slotDir, TABLE_FILES[name]);
  }
}

function encryptTable(payload: string, slotId: string, tableName: string): SaveEnvelope {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(slotId, tableName, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`${slotId}:${tableName}`, "utf8"));
  const compressed = gzipSync(Buffer.from(payload, "utf8"));
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  return {
    v: 1,
    alg: "AES-256-GCM",
    kdf: "scrypt",
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function decryptTable(envelope: SaveEnvelope, slotId: string, tableName: string): string {
  if (envelope.v !== 1 || envelope.alg !== "AES-256-GCM" || envelope.kdf !== "scrypt") {
    throw new Error("加密格式不受支持");
  }
  const salt = Buffer.from(envelope.salt, "base64");
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  const encrypted = Buffer.from(envelope.data, "base64");
  const key = deriveKey(slotId, tableName, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(Buffer.from(`${slotId}:${tableName}`, "utf8"));
  decipher.setAuthTag(tag);
  const compressed = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return gunzipSync(compressed).toString("utf8");
}

function deriveKey(slotId: string, tableName: string, salt: Buffer): Buffer {
  return crypto.scryptSync(`${APP_SAVE_SECRET}:${slotId}:${tableName}`, salt, 32);
}

async function atomicWriteFile(filePath: string, text: string): Promise<void> {
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmpPath, text, "utf8");
  await rename(tmpPath, filePath);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function extractDisplayName(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const maybeProfile = value as Partial<UserProfileV2>;
  return typeof maybeProfile.name === "string" && maybeProfile.name.trim()
    ? maybeProfile.name.trim()
    : undefined;
}
