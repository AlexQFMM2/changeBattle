import "./TitleCommandMenu.css";

export function TitleCommandMenu({hasProfile, loading, checkingUpdate = false, onLoadProfile, onCreateProfile, onCheckForUpdates}: {
  hasProfile: boolean;
  loading: boolean;
  checkingUpdate?: boolean;
  onLoadProfile: () => void;
  onCreateProfile: () => void;
  onCheckForUpdates?: () => void | Promise<void>;
}) {
  return (
    <nav className="title-command-menu" aria-label="标题菜单">
      <button className="title-menu-item primary" type="button" disabled={!hasProfile || loading} onClick={onLoadProfile}>
        <span>读取资料</span>
      </button>
      <button className="title-menu-item" type="button" onClick={onCreateProfile}>
        <span>开始新游戏</span>
      </button>
      {onCheckForUpdates ? (
        <button className="title-menu-item" type="button" disabled={checkingUpdate} onClick={() => void onCheckForUpdates()}>
          <span>{checkingUpdate ? "检查中..." : "检查更新"}</span>
        </button>
      ) : null}
      <button className="title-menu-item quiet" type="button" onClick={() => window.close()}>
        <span>退出</span>
      </button>
    </nav>
  );
}
