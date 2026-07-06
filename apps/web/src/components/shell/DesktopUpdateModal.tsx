import type {DesktopUpdateStatusV4} from "@changebattle-v2/api";
import {AppModal} from "../shared/AppModal";
import "./DesktopUpdateModal.css";

export function DesktopUpdateModal({
  status,
  onClose,
  onCancel,
  onOpenOfficialSite,
}: {
  status: DesktopUpdateStatusV4;
  onClose: () => void;
  onCancel: () => void | Promise<void>;
  onOpenOfficialSite: () => void | Promise<void>;
}) {
  if (!desktopUpdateStatusVisible(status)) return null;
  const title = desktopUpdateTitle(status);
  const totalSize = "totalSize" in status ? status.totalSize : "incrementalSize" in status ? status.incrementalSize : undefined;
  const progress = status.phase === "downloading" && status.totalSize > 0
    ? Math.min(100, Math.round((status.downloadedSize / status.totalSize) * 100))
    : status.phase === "complete"
      ? 100
      : status.phase === "verifying" || status.phase === "replacing"
        ? 100
        : 0;

  return (
    <AppModal className="desktop-update-modal" labelledBy="desktop-update-title" onClose={onClose}>
      {requestClose => (
        <section className="desktop-update-card" aria-label="桌面端更新">
          <header>
            <small>ChangeBattle V2 Desk</small>
            <h2 id="desktop-update-title">{title}</h2>
          </header>
          <dl>
            <div>
              <dt>当前版本</dt>
              <dd>v{status.currentVersion}</dd>
            </div>
            {"remoteVersion" in status && status.remoteVersion ? (
              <div>
                <dt>目标版本</dt>
                <dd>v{status.remoteVersion}</dd>
              </div>
            ) : null}
            {totalSize !== undefined ? (
              <div>
                <dt>增量大小</dt>
                <dd>{formatBytes(totalSize)}</dd>
              </div>
            ) : null}
            {"fullPackageSize" in status && status.fullPackageSize ? (
              <div>
                <dt>完整包</dt>
                <dd>{formatBytes(status.fullPackageSize)}</dd>
              </div>
            ) : null}
          </dl>
          {status.phase === "downloading" || status.phase === "verifying" || status.phase === "replacing" || status.phase === "complete" ? (
            <div className="desktop-update-progress" aria-label={`下载进度 ${progress}%`}>
              <span style={{width: `${progress}%`}} />
              <strong>{status.phase === "downloading" ? `${progress}%` : desktopUpdateStepLabel(status.phase)}</strong>
            </div>
          ) : null}
          {desktopUpdateDetail(status) ? <p>{desktopUpdateDetail(status)}</p> : null}
          {"notes" in status && status.notes?.length ? (
            <ul>
              {status.notes.slice(0, 4).map(note => <li key={note}>{note}</li>)}
            </ul>
          ) : null}
          <footer>
            {status.phase === "downloading" ? (
              <>
                <button type="button" onClick={() => requestClose(true)}>后台下载</button>
                <button type="button" onClick={() => void onCancel()}>取消</button>
                <button type="button" onClick={() => void onOpenOfficialSite()}>前往游戏官网</button>
              </>
            ) : status.phase === "complete" ? (
              <>
                <button type="button" onClick={() => requestClose(true)}>我知道了</button>
                <button type="button" onClick={() => void onOpenOfficialSite()}>前往游戏官网</button>
              </>
            ) : status.phase === "up-to-date" ? (
              <>
                <button type="button" onClick={() => requestClose(true)}>我知道了</button>
                <button type="button" onClick={() => void onOpenOfficialSite()}>前往游戏官网</button>
              </>
            ) : status.phase === "full-package-required" ? (
              <>
                <button type="button" onClick={() => void onOpenOfficialSite()}>前往游戏官网</button>
                <button type="button" onClick={() => requestClose(true)}>稍后</button>
              </>
            ) : status.phase === "failed" || status.phase === "cancelled" ? (
              <>
                <button type="button" onClick={() => requestClose(true)}>我知道了</button>
                <button type="button" onClick={() => void onOpenOfficialSite()}>前往游戏官网</button>
              </>
            ) : (
              <button type="button" onClick={() => requestClose(true)}>后台下载</button>
            )}
          </footer>
        </section>
      )}
    </AppModal>
  );
}

export function desktopUpdateStatusVisible(status: DesktopUpdateStatusV4): boolean {
  return status.phase !== "idle" && status.phase !== "checking";
}

function desktopUpdateTitle(status: DesktopUpdateStatusV4): string {
  switch (status.phase) {
    case "up-to-date": return "当前已是最新版本";
    case "available": return "发现新版本";
    case "full-package-required": return "该版本需要完整包";
    case "downloading": return "下载中";
    case "verifying": return "校验中";
    case "replacing": return "替换中";
    case "complete": return "更新完成，重启后生效";
    case "failed": return "更新失败，本次继续使用当前版本";
    case "cancelled": return "更新已取消";
    default: return "检查更新中";
  }
}

function desktopUpdateDetail(status: DesktopUpdateStatusV4): string {
  if (status.phase === "up-to-date") return "已经是当前更新通道的最新版本。";
  if (status.phase === "full-package-required") return status.reason || "该版本包含启动器或运行时变化，需要下载完整包。";
  if (status.phase === "failed" || status.phase === "cancelled") return status.reason;
  if (status.phase === "complete") return "文件已经替换完成，关闭并重新启动游戏后生效。";
  if (status.phase === "available") return "桌面端将自动下载本次增量更新。";
  return "";
}

function desktopUpdateStepLabel(phase: DesktopUpdateStatusV4["phase"]): string {
  if (phase === "verifying") return "校验中";
  if (phase === "replacing") return "替换中";
  return "完成";
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}
