import {useEffect, useMemo, useState} from "react";
import {
  battleServerBaseUrlForConfigV4,
  normalizeBattleServerConfigV4,
  type BattleServerConfigV4,
  type BattleServerHealthResultV4,
} from "@changebattle-v2/api";
import {AppModal} from "../shared/AppModal";
import "./NetworkOfflineSettingsModal.css";

export function NetworkOfflineSettingsModal({
  runtime,
  config,
  configLoading = false,
  onClose,
  onSave,
  onTestServer,
  onClearAssetCache,
}: {
  runtime: "web" | "desktop" | "mobile";
  config: BattleServerConfigV4;
  configLoading?: boolean;
  onClose: () => void;
  onSave: (config: BattleServerConfigV4) => Promise<BattleServerConfigV4>;
  onTestServer: (url: string) => Promise<BattleServerHealthResultV4>;
  onClearAssetCache: () => Promise<BattleServerConfigV4>;
}) {
  const [draft, setDraft] = useState(() => normalizeBattleServerConfigV4(config));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [health, setHealth] = useState<BattleServerHealthResultV4 | null>(null);
  const customUrl = useMemo(() => {
    const host = draft.custom.host.trim();
    if (!host) return "";
    return `${draft.custom.protocol}://${host}:${draft.custom.port}${draft.custom.basePath || ""}`;
  }, [draft.custom.basePath, draft.custom.host, draft.custom.port, draft.custom.protocol]);
  const offlineAvailable = runtime === "desktop" && Boolean(draft.desktopOffline.actualBaseUrl);

  useEffect(() => {
    if (configLoading) return;
    setDraft(normalizeBattleServerConfigV4(config));
  }, [config, configLoading]);

  async function saveDraft() {
    setSaving(true);
    setNotice(null);
    setHealth(null);
    try {
      let next = normalizeBattleServerConfigV4(draft);
      if (next.mode === "custom") {
        const result = await onTestServer(customUrl);
        setHealth(result);
        if (!result.ok) {
          setNotice(result.message);
          return;
        }
        next = normalizeBattleServerConfigV4({
          ...next,
          custom: {...next.custom, lastVerifiedAt: new Date().toISOString()},
        });
      }
      const saved = await onSave(next);
      setDraft(saved);
      setNotice("设置已保存。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "设置保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function testCustom() {
    setTesting(true);
    setNotice(null);
    try {
      const result = await onTestServer(customUrl);
      setHealth(result);
      setNotice(result.ok ? `自建服务器可用：${result.elapsedMs}ms` : result.message);
    } finally {
      setTesting(false);
    }
  }

  async function clearCache() {
    setClearing(true);
    setNotice(null);
    try {
      const saved = await onClearAssetCache();
      setDraft(saved);
      setNotice("本地资源缓存已清除。");
    } catch {
      setNotice("清除缓存失败。");
    } finally {
      setClearing(false);
    }
  }

  return (
    <AppModal className="network-offline-modal" labelledBy="network-offline-title" onClose={onClose}>
      <section className="network-offline-panel" aria-label="网络与离线">
        <header>
          <small>设置</small>
          <h2 id="network-offline-title">网络与离线</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>x</button>
        </header>

        {configLoading ? (
          <div className="network-offline-loading" role="status">正在读取设置...</div>
        ) : (
        <div className="network-offline-content">
          <section className="network-offline-section">
            <h3>战斗服务器</h3>
            <div className="network-server-modes" role="group" aria-label="战斗服务器模式">
              <button className={draft.mode === "official" ? "selected" : ""} type="button" disabled={saving} onClick={() => setDraft({...draft, mode: "official"})}>官方服务器</button>
              <button className={draft.mode === "custom" ? "selected" : ""} type="button" disabled={saving} onClick={() => setDraft({...draft, mode: "custom"})}>自建服务器</button>
              <button className={draft.mode === "desktop-offline" ? "selected" : ""} type="button" disabled={saving || runtime !== "desktop" || !offlineAvailable} onClick={() => setDraft({...draft, mode: "desktop-offline"})}>离线服务</button>
            </div>
            {draft.mode === "custom" ? (
              <>
                <p className="network-custom-preview">{battleServerBaseUrlForConfigV4(draft)}</p>
                <div className="network-custom-grid">
                  <label>
                    <span>协议</span>
                    <select value={draft.custom.protocol} onChange={event => setDraft({...draft, custom: {...draft.custom, protocol: event.currentTarget.value === "https" ? "https" : "http"}})}>
                      <option value="http">http</option>
                      <option value="https">https</option>
                    </select>
                  </label>
                  <label>
                    <span>地址</span>
                    <input value={draft.custom.host} placeholder="192.168.1.20" onChange={event => setDraft({...draft, custom: {...draft.custom, host: event.currentTarget.value}})} />
                  </label>
                  <label>
                    <span>端口</span>
                    <input type="number" min={1} max={65535} value={draft.custom.port} onChange={event => setDraft({...draft, custom: {...draft.custom, port: Number(event.currentTarget.value) || 5191}})} />
                  </label>
                  <label>
                    <span>路径</span>
                    <input value={draft.custom.basePath} onChange={event => setDraft({...draft, custom: {...draft.custom, basePath: event.currentTarget.value}})} />
                  </label>
                </div>
                <footer>
                  <button type="button" disabled={testing || saving || !draft.custom.host.trim()} onClick={() => void testCustom()}>{testing ? "测试中..." : "测试连接"}</button>
                </footer>
              </>
            ) : draft.mode === "desktop-offline" ? (
              runtime !== "desktop" ? <p className="network-offline-hint">离线服务仅桌面端支持。</p> : !offlineAvailable ? <p className="network-offline-hint">离线服务组件未安装，后续版本支持。</p> : null
            ) : null}
          </section>

          <section className="network-offline-section">
            <h3>资源缓存</h3>
            <label className="network-cache-toggle">
              <input
                type="checkbox"
                checked={draft.assetCache.enabled}
                disabled={saving}
                onChange={event => setDraft({...draft, assetCache: {...draft.assetCache, enabled: event.currentTarget.checked}})}
              />
              <span>缓存到本地 assets/</span>
            </label>
            <dl className="network-cache-stats">
              <div><dt>目录</dt><dd>{draft.assetCache.rootDir || "assets"}</dd></div>
              <div><dt>文件</dt><dd>{draft.assetCache.cachedFileCount}</dd></div>
              <div><dt>大小</dt><dd>{formatBytes(draft.assetCache.cachedBytes)}</dd></div>
            </dl>
            <footer>
              <button type="button" disabled={clearing} onClick={() => void clearCache()}>{clearing ? "清理中..." : "清除缓存"}</button>
            </footer>
          </section>
        </div>
        )}

        {health ? <p className={health.ok ? "network-status ok" : "network-status bad"}>{health.ok ? `健康检查通过：${health.elapsedMs}ms` : health.message}</p> : null}
        {notice ? <p className="network-status">{notice}</p> : null}
        <footer className="network-offline-actions">
          <button type="button" disabled={saving || configLoading} onClick={() => void saveDraft()}>{saving ? "保存中..." : "保存设置"}</button>
        </footer>
        {saving ? <div className="network-saving-overlay" role="status">正在保存设定...</div> : null}
      </section>
    </AppModal>
  );
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${bytes}B`;
}
