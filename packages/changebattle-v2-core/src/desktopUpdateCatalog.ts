export type ChangeBattleDesktopUpdateChannelV4 = "stable" | "beta" | "dev" | string;

export type ChangeBattleDesktopUpdateMirrorV4 = {
  name: string;
  url: string;
};

export type ChangeBattleDesktopUpdateManifestV4 = {
  manifestVersion: 1;
  channel: ChangeBattleDesktopUpdateChannelV4;
  version: string;
  date?: string;
  title?: string;
  notes?: string[];
  downloadPageUrl?: string;
  mirrors?: ChangeBattleDesktopUpdateMirrorV4[];
  sha256?: string;
  mandatory?: boolean;
};

export type ChangeBattleDesktopUpdateCheckResultV4 =
  | {
      ok: true;
      currentVersion: string;
      manifestUrl: string;
      manifest: ChangeBattleDesktopUpdateManifestV4;
      updateAvailable: boolean;
      downloadUrl: string;
    }
  | {
      ok: false;
      currentVersion: string;
      reason: string;
    };

export const CHANGEBATTLE_DESKTOP_UPDATE_MANIFEST_VERSION_V4 = 1;

export const CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_MANIFEST_URLS_V4 = [
  "https://update.65h26i.top/changebattle/latest.json",
  "https://65h26i.top/changebattle/latest.json",
  "http://119.45.240.157/changebattle/latest.json",
] as const;

export const CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_DOWNLOAD_PAGE_URL_V4 = "https://65h26i.top/changebattle/";

export function changeBattleDesktopUpdateManifestUrlsV4(raw?: string): string[] {
  const parsed = (raw || "")
    .split(",")
    .map(url => url.trim())
    .filter(Boolean);
  return parsed.length ? parsed : [...CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_MANIFEST_URLS_V4];
}

export function normalizeChangeBattleDesktopVersionV4(version: string): string {
  return version.trim().replace(/^v/i, "");
}

export function compareChangeBattleDesktopVersionsV4(left: string, right: string): number {
  const leftParts = parseChangeBattleDesktopVersionPartsV4(left);
  const rightParts = parseChangeBattleDesktopVersionPartsV4(right);
  const count = Math.max(leftParts.length, rightParts.length, 3);
  for (let index = 0; index < count; index += 1) {
    const delta = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (delta !== 0) return delta > 0 ? 1 : -1;
  }
  return 0;
}

export function changeBattleDesktopUpdateIsNewerV4(currentVersion: string, remoteVersion: string): boolean {
  return compareChangeBattleDesktopVersionsV4(remoteVersion, currentVersion) > 0;
}

export function changeBattleDesktopUpdatePrimaryDownloadUrlV4(manifest: ChangeBattleDesktopUpdateManifestV4): string {
  return manifest.downloadPageUrl || manifest.mirrors?.find(mirror => mirror.url)?.url || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_DOWNLOAD_PAGE_URL_V4;
}

export function parseChangeBattleDesktopUpdateManifestV4(value: unknown): ChangeBattleDesktopUpdateManifestV4 | null {
  if (!value || typeof value !== "object") return null;
  const manifest = value as Partial<ChangeBattleDesktopUpdateManifestV4>;
  if (manifest.manifestVersion !== CHANGEBATTLE_DESKTOP_UPDATE_MANIFEST_VERSION_V4) return null;
  if (typeof manifest.channel !== "string" || !manifest.channel.trim()) return null;
  if (typeof manifest.version !== "string" || !isChangeBattleDesktopVersionLikeV4(manifest.version)) return null;
  if (manifest.date !== undefined && typeof manifest.date !== "string") return null;
  if (manifest.title !== undefined && typeof manifest.title !== "string") return null;
  if (manifest.sha256 !== undefined && typeof manifest.sha256 !== "string") return null;
  if (manifest.downloadPageUrl !== undefined && typeof manifest.downloadPageUrl !== "string") return null;
  if (manifest.mandatory !== undefined && typeof manifest.mandatory !== "boolean") return null;
  if (manifest.notes !== undefined && (!Array.isArray(manifest.notes) || manifest.notes.some(note => typeof note !== "string"))) return null;
  if (manifest.mirrors !== undefined) {
    if (!Array.isArray(manifest.mirrors)) return null;
    if (manifest.mirrors.some(mirror => !mirror || typeof mirror.name !== "string" || typeof mirror.url !== "string")) return null;
  }
  return {
    manifestVersion: CHANGEBATTLE_DESKTOP_UPDATE_MANIFEST_VERSION_V4,
    channel: manifest.channel.trim(),
    version: normalizeChangeBattleDesktopVersionV4(manifest.version),
    date: manifest.date,
    title: manifest.title,
    notes: manifest.notes,
    downloadPageUrl: manifest.downloadPageUrl,
    mirrors: manifest.mirrors,
    sha256: manifest.sha256,
    mandatory: manifest.mandatory,
  };
}

export function isChangeBattleDesktopVersionLikeV4(version: string): boolean {
  return /^\s*v?\d+(?:\.\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?\s*$/.test(version);
}

function parseChangeBattleDesktopVersionPartsV4(version: string): number[] {
  const normalized = normalizeChangeBattleDesktopVersionV4(version).split(/[-+]/, 1)[0] || "";
  return normalized.split(".").map(part => {
    const parsed = Number.parseInt(part, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });
}
