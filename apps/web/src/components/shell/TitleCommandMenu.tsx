import "./TitleCommandMenu.css";

export function TitleCommandMenu({hasProfile, loading, onLoadProfile, onCreateProfile}: {
  hasProfile: boolean;
  loading: boolean;
  onLoadProfile: () => void;
  onCreateProfile: () => void;
}) {
  return (
    <nav className="title-command-menu" aria-label="标题菜单">
      <button className="title-menu-item primary" type="button" disabled={!hasProfile || loading} onClick={onLoadProfile}>
        <span>读取资料</span>
      </button>
      <button className="title-menu-item" type="button" onClick={onCreateProfile}>
        <span>开始新游戏</span>
      </button>
      <button className="title-menu-item quiet" type="button" onClick={() => window.close()}>
        <span>退出</span>
      </button>
    </nav>
  );
}
