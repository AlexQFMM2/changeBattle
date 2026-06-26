export type BattleDebugScopeV4 =
  | "mapping"
  | "request"
  | "draft"
  | "choice"
  | "submit"
  | "snapshot"
  | "protocol"
  | "ui"
  | "error";

export type AppDebugConfigV4 = {
  isDebug: boolean;
  battle: boolean;
  command: boolean;
  mapping: boolean;
  protocol: boolean;
  ui: boolean;
};

export function battleDebugLog(
  config: boolean | Partial<AppDebugConfigV4> | null | undefined,
  scope: BattleDebugScopeV4,
  label: string,
  payload?: unknown,
): void {
  if (!isBattleDebugEnabled(config, scope)) return;
  const prefix = `[BattleV4][${scope}] ${label}`;
  if (payload === undefined) {
    console.log(prefix);
    return;
  }
  console.log(prefix, payload);
}

function isBattleDebugEnabled(config: boolean | Partial<AppDebugConfigV4> | null | undefined, scope: BattleDebugScopeV4): boolean {
  if (typeof config === "boolean") return config;
  if (!config?.isDebug) return false;
  if (scope === "mapping") return config.mapping !== false && config.battle !== false;
  if (scope === "protocol") return config.protocol !== false && config.battle !== false;
  if (scope === "ui") return config.ui !== false && config.battle !== false;
  if (scope === "request" || scope === "draft" || scope === "choice" || scope === "submit") {
    return config.command !== false && config.battle !== false;
  }
  return config.battle !== false;
}
