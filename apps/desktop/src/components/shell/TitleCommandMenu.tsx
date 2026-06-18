import "./TitleCommandMenu.css";

export type TitleCommandMenuProps = {
  onLoadSave: () => void;
  onNewGame: () => void;
  onExit?: () => void;
  disabledLongText?: boolean;
};

export function TitleCommandMenu({onLoadSave, onNewGame, onExit = () => window.close(), disabledLongText = false}: TitleCommandMenuProps) {
  return (
    <nav className="title-command-menu" aria-label="标题菜单">
      <button className="title-menu-item primary" type="button" disabled={disabledLongText} onClick={onLoadSave}>
        <span>{disabledLongText ? "读取一个名字很长很长的测试存档" : "读取存档"}</span>
      </button>
      <button className="title-menu-item" type="button" onClick={onNewGame}>
        <span>开始新游戏</span>
      </button>
      <button className="title-menu-item quiet" type="button" onClick={onExit}>
        <span>退出</span>
      </button>
    </nav>
  );
}
