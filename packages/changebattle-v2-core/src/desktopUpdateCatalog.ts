export type ChangeBattleDesktopUpdateChannelV4 = "stable" | "beta" | "dev" | string;

export type ChangeBattleDesktopUpdateMirrorV4 = {
  name: string;
  url: string;
};

export type ChangeBattleDesktopUpdateFullPackageV4 = {
  url: string;
  sha256?: string;
  size?: number;
};

export type ChangeBattleDesktopUpdateManifestV4 = {
  manifestVersion: 1;
  channel: ChangeBattleDesktopUpdateChannelV4;
  version: string;
  date?: string;
  title?: string;
  notes?: string[];
  officialSiteUrl?: string;
  downloadPageUrl?: string;
  fullPackage?: ChangeBattleDesktopUpdateFullPackageV4;
  fileManifestUrl?: string;
  incrementalBaseUrl?: string;
  requiresFullPackage?: boolean;
  requiresFullPackageReason?: string;
  mirrors?: ChangeBattleDesktopUpdateMirrorV4[];
  sha256?: string;
  mandatory?: boolean;
};

export type DesktopUpdateManagedFileV4 = {
  path: string;
  sha256: string;
  size: number;
  url?: string;
};

export type DesktopUpdateFileManifestV4 = {
  manifestVersion: 1;
  version: string;
  files: DesktopUpdateManagedFileV4[];
};

export type DesktopUpdateFileDiffV4 = {
  changedFiles: DesktopUpdateManagedFileV4[];
  totalSize: number;
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
  "https://65h26i.top/changebattle/latest.json",
] as const;

export const CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_DOWNLOAD_PAGE_URL_V4 = "https://65h26i.top/changebattle/";
export const CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4 = CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_DOWNLOAD_PAGE_URL_V4;

export const DESKTOP_UPDATE_ALLOWED_PATH_PREFIXES_V4 = ["apps/", "assets/", "vendor/"] as const;
export const DESKTOP_UPDATE_ALLOWED_ROOT_FILES_V4 = ["package.json", "update-manifest.json"] as const;

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
  return changeBattleDesktopUpdateOfficialSiteUrlV4(manifest);
}

export function changeBattleDesktopUpdateOfficialSiteUrlV4(manifest: ChangeBattleDesktopUpdateManifestV4): string {
  return manifest.officialSiteUrl || manifest.downloadPageUrl || manifest.mirrors?.find(mirror => mirror.url)?.url || CHANGEBATTLE_DESKTOP_UPDATE_DEFAULT_OFFICIAL_SITE_URL_V4;
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
  if (manifest.officialSiteUrl !== undefined && typeof manifest.officialSiteUrl !== "string") return null;
  if (manifest.downloadPageUrl !== undefined && typeof manifest.downloadPageUrl !== "string") return null;
  if (manifest.fileManifestUrl !== undefined && typeof manifest.fileManifestUrl !== "string") return null;
  if (manifest.incrementalBaseUrl !== undefined && typeof manifest.incrementalBaseUrl !== "string") return null;
  if (manifest.requiresFullPackage !== undefined && typeof manifest.requiresFullPackage !== "boolean") return null;
  if (manifest.requiresFullPackageReason !== undefined && typeof manifest.requiresFullPackageReason !== "string") return null;
  if (manifest.mandatory !== undefined && typeof manifest.mandatory !== "boolean") return null;
  if (manifest.fullPackage !== undefined) {
    if (!manifest.fullPackage || typeof manifest.fullPackage !== "object") return null;
    if (typeof manifest.fullPackage.url !== "string") return null;
    if (manifest.fullPackage.sha256 !== undefined && typeof manifest.fullPackage.sha256 !== "string") return null;
    if (manifest.fullPackage.size !== undefined && (typeof manifest.fullPackage.size !== "number" || !Number.isFinite(manifest.fullPackage.size) || manifest.fullPackage.size < 0)) return null;
  }
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
    officialSiteUrl: manifest.officialSiteUrl,
    downloadPageUrl: manifest.downloadPageUrl,
    fullPackage: manifest.fullPackage,
    fileManifestUrl: manifest.fileManifestUrl,
    incrementalBaseUrl: manifest.incrementalBaseUrl,
    requiresFullPackage: manifest.requiresFullPackage,
    requiresFullPackageReason: manifest.requiresFullPackageReason,
    mirrors: manifest.mirrors,
    sha256: manifest.sha256,
    mandatory: manifest.mandatory,
  };
}

export function parseDesktopUpdateFileManifestV4(value: unknown): DesktopUpdateFileManifestV4 | null {
  if (!value || typeof value !== "object") return null;
  const manifest = value as Partial<DesktopUpdateFileManifestV4>;
  if (manifest.manifestVersion !== CHANGEBATTLE_DESKTOP_UPDATE_MANIFEST_VERSION_V4) return null;
  if (typeof manifest.version !== "string" || !isChangeBattleDesktopVersionLikeV4(manifest.version)) return null;
  if (!Array.isArray(manifest.files)) return null;
  const files: DesktopUpdateManagedFileV4[] = [];
  const seen = new Set<string>();
  for (const file of manifest.files) {
    const parsed = parseDesktopUpdateManagedFileV4(file);
    if (!parsed || seen.has(parsed.path)) return null;
    seen.add(parsed.path);
    files.push(parsed);
  }
  return {
    manifestVersion: CHANGEBATTLE_DESKTOP_UPDATE_MANIFEST_VERSION_V4,
    version: normalizeChangeBattleDesktopVersionV4(manifest.version),
    files,
  };
}

export function validateDesktopUpdateManagedPathV4(filePath: string): boolean {
  const normalized = normalizeDesktopUpdateManagedPathV4(filePath);
  if (!normalized) return false;
  if (normalized.startsWith("/") || normalized.startsWith("\\") || /^[A-Za-z]:/.test(normalized)) return false;
  if (normalized.split("/").some(part => part === ".." || part === "")) return false;
  return true;
}

export function isDesktopUpdateIncrementalManagedPathV4(filePath: string): boolean {
  const normalized = normalizeDesktopUpdateManagedPathV4(filePath);
  if (!validateDesktopUpdateManagedPathV4(normalized)) return false;
  if ((DESKTOP_UPDATE_ALLOWED_ROOT_FILES_V4 as readonly string[]).includes(normalized)) return true;
  return DESKTOP_UPDATE_ALLOWED_PATH_PREFIXES_V4.some(prefix => normalized.startsWith(prefix));
}

export function compareDesktopUpdateFileManifestsV4(
  localManifest: DesktopUpdateFileManifestV4 | null | undefined,
  remoteManifest: DesktopUpdateFileManifestV4,
): DesktopUpdateFileDiffV4 {
  const localByPath = new Map((localManifest?.files || []).map(file => [file.path, file]));
  const changedFiles = remoteManifest.files.filter(file => {
    const localFile = localByPath.get(file.path);
    return !localFile || localFile.sha256 !== file.sha256;
  });
  return {
    changedFiles,
    totalSize: changedFiles.reduce((sum, file) => sum + file.size, 0),
  };
}

export function estimateDesktopIncrementalDownloadSizeV4(
  localManifest: DesktopUpdateFileManifestV4 | null | undefined,
  remoteManifest: DesktopUpdateFileManifestV4,
): number {
  return compareDesktopUpdateFileManifestsV4(localManifest, remoteManifest).totalSize;
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

function parseDesktopUpdateManagedFileV4(value: unknown): DesktopUpdateManagedFileV4 | null {
  if (!value || typeof value !== "object") return null;
  const file = value as Partial<DesktopUpdateManagedFileV4>;
  if (typeof file.path !== "string") return null;
  const normalizedPath = normalizeDesktopUpdateManagedPathV4(file.path);
  if (!isDesktopUpdateIncrementalManagedPathV4(normalizedPath)) return null;
  if (typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(file.sha256)) return null;
  if (typeof file.size !== "number" || !Number.isFinite(file.size) || file.size < 0) return null;
  if (file.url !== undefined && typeof file.url !== "string") return null;
  return {
    path: normalizedPath,
    sha256: file.sha256.toLowerCase(),
    size: Math.trunc(file.size),
    url: file.url,
  };
}

function normalizeDesktopUpdateManagedPathV4(filePath: string): string {
  return filePath.trim().replaceAll("\\", "/").replace(/^\.\/+/, "");
}
