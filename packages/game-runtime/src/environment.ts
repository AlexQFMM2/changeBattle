import type {LocalSave, SaveBattleRecordsTable, TrainerProfile} from "@changebattle/shared";
import type {RuntimeDataProvider} from "./data-provider.js";

export type RuntimeTextFile = {
  path: string;
  text: string;
};

export type RuntimeBinaryFile = {
  path: string;
  bytes: Uint8Array;
};

export type RuntimeSaveStore = {
  load(): Promise<LocalSave | null>;
  createNew(trainer: TrainerProfile): Promise<LocalSave>;
  save(save: LocalSave): Promise<LocalSave>;
  updateTrainer(trainer: TrainerProfile): Promise<LocalSave>;
  delete(): Promise<void>;
  battleRecords(): Promise<SaveBattleRecordsTable>;
  appendBattleRecord(record: SaveBattleRecordsTable["records"][number]): Promise<void>;
};

export type RuntimeAssetResolver = {
  assetUrl(relativePath: string): string;
  exists?(relativePath: string): Promise<boolean>;
};

export type RuntimeLogger = {
  debug(scope: string, message: string, data?: unknown): void;
  battle?(entry: unknown): void;
};

export type RuntimeUuidProvider = {
  randomUUID(): string;
};

export type RuntimeShowdownLoader<TModule = unknown> = {
  load(): Promise<TModule>;
};

export type RuntimeEnvironment<TShowdown = unknown> = {
  data: RuntimeDataProvider;
  saves: RuntimeSaveStore;
  assets: RuntimeAssetResolver;
  showdown: RuntimeShowdownLoader<TShowdown>;
  logger: RuntimeLogger;
  uuid: RuntimeUuidProvider;
  now(): Date;
};
