import type {CSSProperties, ReactNode} from "react";
import {useState} from "react";
import {PageActionBar} from "../components/player/PageActionBar";
import {PlayerNameEditor} from "../components/player/PlayerNameEditor";
import {PlayerSettingsPage} from "../components/player/PlayerSettingsPage";
import {TrainerAvatarPicker} from "../components/player/TrainerAvatarPicker";
import {TrainerPreviewPanel} from "../components/player/TrainerPreviewPanel";
import {MoveCard} from "../components/move/MoveCard";
import {ScreenToast} from "../components/feedback/ScreenToast";
import {ComponentGalleryButton} from "../components/shell/ComponentGalleryButton";
import {DiscoveryPanel} from "../components/shell/DiscoveryPanel";
import {FavoritePokemonPanel} from "../components/shell/FavoritePokemonPanel";
import {MainMenuCommandBar, type MainMenuCommandItem} from "../components/shell/MainMenuCommandBar";
import {QuickDexButton} from "../components/shell/QuickDexButton";
import {SaveSelectPanel} from "../components/shell/SaveSelectPanel";
import {TitleCommandMenu} from "../components/shell/TitleCommandMenu";
import {TitleLogo} from "../components/shell/TitleLogo";
import {TitleVideoBackground} from "../components/shell/TitleVideoBackground";
import {TrainerSummaryPanel} from "../components/shell/TrainerSummaryPanel";
import type {MainMenuDexCard} from "../components/shell/mainMenuTypes";
import {createMainMenuPreviewSave, createTitlePreviewSave, mainMenuDiscoveryPreviewCards, mainMenuFavoritePreviewCards, mainMenuLongDiscoveryPreviewCards, mainMenuLongFavoritePreviewCards, moveCardPreviewData, playerSettingsManyCatalog, titlePreviewCatalog} from "./previewData";

export type ComponentPreviewState = {
  id: string;
  name: string;
};

export type ComponentRegistryEntry = {
  id: string;
  name: string;
  group: string;
  defaultSize: {
    width: number;
    height: number;
  };
  componentFile: string;
  cssFile: string;
  cssVariablePrefix: string;
  dependencies: string[];
  states: ComponentPreviewState[];
  renderPreview(stateId: string): ReactNode;
};

const moveCardStates: ComponentPreviewState[] = [
  {id: "dex", name: "图鉴态"},
  {id: "battle", name: "战斗态"},
  {id: "complete", name: "完全体"},
  {id: "longText", name: "长文本"},
  {id: "disabled", name: "禁用态"},
  {id: "compact", name: "紧凑尺寸"},
  {id: "wide", name: "宽版尺寸"},
  {id: "tall", name: "高版尺寸"},
];

function DiscoveryPanelPreview({cards}: {cards: MainMenuDexCard[]}) {
  const [items, setItems] = useState(cards);
  return <DiscoveryPanel cards={items} onCardsChange={setItems} onOpenCard={() => undefined} />;
}

export const componentRegistry: ComponentRegistryEntry[] = [
  {
    id: "move-card",
    name: "技能卡片",
    group: "move",
    defaultSize: {width: 300, height: 72},
    componentFile: "apps/desktop/src/components/move/MoveCard.tsx",
    cssFile: "apps/desktop/src/components/move/MoveCard.css",
    cssVariablePrefix: "--move-card-*",
    dependencies: [],
    states: moveCardStates,
    renderPreview(stateId) {
      const data = moveCardPreviewData[stateId] || moveCardPreviewData.dex;
      return (
        <div className={`component-gallery-move-card-stage component-gallery-move-card-stage-${data.size || "sheet"}`} style={{width: data.previewWidth ? `${data.previewWidth}px` : undefined}}>
          <MoveCard
            name={data.name}
            moveType={data.moveType}
            typeLabel={data.typeLabel}
            category={data.category}
            pp={data.pp}
            maxPp={data.maxPp}
            power={data.power}
            accuracy={data.accuracy}
            badge={data.badge}
            damageRange={data.damageRange}
            meta={data.meta}
            size={data.size}
            selected={data.selected}
            disabled={data.disabled}
            className={data.className}
            style={data.style}
            onClick={() => undefined}
          />
        </div>
      );
    },
  },
  {
    id: "quick-dex-button",
    name: "快捷图鉴按钮",
    group: "shell",
    defaultSize: {width: 120, height: 72},
    componentFile: "apps/desktop/src/components/shell/QuickDexButton.tsx",
    cssFile: "apps/desktop/src/components/shell/QuickDexButton.css",
    cssVariablePrefix: "--quick-dex-button-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "disabled", name: "禁用态"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-shell-stage">
          <QuickDexButton disabled={stateId === "disabled"} title={stateId === "disabled" ? "当前页面不能打开图鉴" : "打开图鉴"} onClick={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "screen-toast",
    name: "屏幕提示",
    group: "feedback",
    defaultSize: {width: 240, height: 64},
    componentFile: "apps/desktop/src/components/feedback/ScreenToast.tsx",
    cssFile: "apps/desktop/src/components/feedback/ScreenToast.css",
    cssVariablePrefix: "--screen-toast-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "longText", name: "长文本"},
      {id: "danger", name: "危险"},
    ],
    renderPreview(stateId) {
      const message = stateId === "longText"
        ? "这是一条用于检查宽度、省略和换行表现的长提示：当前页面状态已失效，已返回可用页面。"
        : stateId === "danger"
          ? "操作失败，请稍后再试。"
          : "欢迎来到 ChangeBattle。";
      return (
        <div className="component-gallery-toast-stage">
          <ScreenToast message={message} tone={stateId === "danger" ? "danger" : "normal"} durationMs={1600} inline />
        </div>
      );
    },
  },
  {
    id: "title-video-background",
    name: "标题视频背景",
    group: "shell",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/shell/TitleVideoBackground.tsx",
    cssFile: "apps/desktop/src/components/shell/TitleVideoBackground.css",
    cssVariablePrefix: "--title-video-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "masked", name: "遮罩入场"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-title-video-stage">
          <TitleVideoBackground masked={stateId === "masked"} />
        </div>
      );
    },
  },
  {
    id: "title-command-menu",
    name: "标题命令菜单",
    group: "shell",
    defaultSize: {width: 160, height: 116},
    componentFile: "apps/desktop/src/components/shell/TitleCommandMenu.tsx",
    cssFile: "apps/desktop/src/components/shell/TitleCommandMenu.css",
    cssVariablePrefix: "--title-command-menu-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "withGallery", name: "带预览入口"},
      {id: "disabledLongText", name: "禁用长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-title-menu-stage">
          <TitleCommandMenu
            showComponentGallery={stateId === "withGallery"}
            disabledLongText={stateId === "disabledLongText"}
            onLoadSave={() => undefined}
            onNewGame={() => undefined}
            onComponentGallery={() => undefined}
            onExit={() => undefined}
          />
        </div>
      );
    },
  },
  {
    id: "title-logo",
    name: "标题 Logo",
    group: "shell",
    defaultSize: {width: 210, height: 82},
    componentFile: "apps/desktop/src/components/shell/TitleLogo.tsx",
    cssFile: "apps/desktop/src/components/shell/TitleLogo.css",
    cssVariablePrefix: "--title-logo-*",
    dependencies: ["motion/react"],
    states: [
      {id: "normal", name: "普通"},
      {id: "compactWidth", name: "窄宽度"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-title-logo-stage" style={stateId === "compactWidth" ? ({"--title-logo-width": "132px"} as CSSProperties) : undefined}>
          <TitleLogo />
        </div>
      );
    },
  },
  {
    id: "save-select-panel",
    name: "存档选择面板",
    group: "shell",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/shell/SaveSelectPanel.tsx",
    cssFile: "apps/desktop/src/components/shell/SaveSelectPanel.css",
    cssVariablePrefix: "--save-select-*",
    dependencies: ["TrainerAvatar", "PokopiaModal", "motion/react"],
    states: [
      {id: "slots", name: "存档列表"},
      {id: "emptyOnly", name: "空存档"},
      {id: "longTrainerName", name: "长名字"},
    ],
    renderPreview(stateId) {
      const save = stateId === "emptyOnly" ? null : createTitlePreviewSave(stateId === "longTrainerName" ? "很长很长的训练师名字测试" : "小遥", 268);
      return (
        <div className="component-gallery-save-select-stage">
          <SaveSelectPanel active save={save} catalog={titlePreviewCatalog} defaultAvatarAsset={titlePreviewCatalog.players[0]?.avatar_asset} onBack={() => undefined} onLoad={() => undefined} onNew={() => undefined} onCreate={async () => save} onDelete={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "trainer-summary-panel",
    name: "训练师摘要面板",
    group: "shell",
    defaultSize: {width: 260, height: 64},
    componentFile: "apps/desktop/src/components/shell/TrainerSummaryPanel.tsx",
    cssFile: "apps/desktop/src/components/shell/TrainerSummaryPanel.css",
    cssVariablePrefix: "--trainer-summary-panel-*",
    dependencies: ["TrainerAvatar", "motion/react"],
    states: [
      {id: "normal", name: "普通"},
      {id: "emptySave", name: "无存档"},
      {id: "longName", name: "长名字"},
    ],
    renderPreview(stateId) {
      const save = stateId === "emptySave" ? null : createMainMenuPreviewSave(stateId === "longName" ? "很长很长的训练师名字测试" : "小遥", 268);
      return (
        <div className="component-gallery-main-menu-stage">
          <TrainerSummaryPanel save={save} />
        </div>
      );
    },
  },
  {
    id: "favorite-pokemon-panel",
    name: "常用宝可梦面板",
    group: "shell",
    defaultSize: {width: 190, height: 98},
    componentFile: "apps/desktop/src/components/shell/FavoritePokemonPanel.tsx",
    cssFile: "apps/desktop/src/components/shell/FavoritePokemonPanel.css",
    cssVariablePrefix: "--favorite-pokemon-panel-*",
    dependencies: ["motion/react"],
    states: [
      {id: "filled", name: "有数据"},
      {id: "empty", name: "空状态"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const cards = stateId === "empty" ? [] : stateId === "longText" ? mainMenuLongFavoritePreviewCards : mainMenuFavoritePreviewCards;
      return (
        <div className="component-gallery-main-menu-stage">
          <FavoritePokemonPanel cards={cards} onOpenCard={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "discovery-panel",
    name: "发现面板",
    group: "shell",
    defaultSize: {width: 210, height: 126},
    componentFile: "apps/desktop/src/components/shell/DiscoveryPanel.tsx",
    cssFile: "apps/desktop/src/components/shell/DiscoveryPanel.css",
    cssVariablePrefix: "--discovery-panel-*",
    dependencies: ["ItemIcon", "motion/react"],
    states: [
      {id: "filled", name: "有数据"},
      {id: "fewItems", name: "少量数据"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const cards = stateId === "fewItems" ? mainMenuDiscoveryPreviewCards.slice(0, 2) : stateId === "longText" ? mainMenuLongDiscoveryPreviewCards : mainMenuDiscoveryPreviewCards;
      return (
        <div className="component-gallery-main-menu-stage">
          <DiscoveryPanelPreview cards={cards} />
        </div>
      );
    },
  },
  {
    id: "main-menu-command-bar",
    name: "主页命令栏",
    group: "shell",
    defaultSize: {width: 220, height: 220},
    componentFile: "apps/desktop/src/components/shell/MainMenuCommandBar.tsx",
    cssFile: "apps/desktop/src/components/shell/MainMenuCommandBar.css",
    cssVariablePrefix: "--main-menu-command-bar-*",
    dependencies: ["ComponentGalleryButton", "motion/react"],
    states: [
      {id: "normal", name: "普通"},
      {id: "withGallery", name: "带组件入口"},
      {id: "longLabels", name: "长标签"},
    ],
    renderPreview(stateId) {
      const items: MainMenuCommandItem[] = stateId === "longLabels"
        ? [
            {label: "继续一场名字很长的挑战", action: () => undefined},
            {label: "训练家星图扩展测试", action: () => undefined},
            {label: "玩家设置长标签测试", action: () => undefined},
            {label: "回到主页", action: () => undefined},
          ]
        : [
            {label: "开始游戏", action: () => undefined},
            {label: "训练家星图", action: () => undefined},
            {label: "玩家设置", action: () => undefined},
            {label: "战绩", action: () => undefined},
            {label: "对局偏好", action: () => undefined},
            {label: "图鉴", action: () => undefined, instant: true},
          ];
      return (
        <div className="component-gallery-main-menu-stage">
          <MainMenuCommandBar items={items} showComponentGallery={stateId === "withGallery"} onChoose={() => undefined} onComponentGallery={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "component-gallery-button",
    name: "查看组件按钮",
    group: "shell",
    defaultSize: {width: 150, height: 44},
    componentFile: "apps/desktop/src/components/shell/ComponentGalleryButton.tsx",
    cssFile: "apps/desktop/src/components/shell/ComponentGalleryButton.css",
    cssVariablePrefix: "--component-gallery-button-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "disabled", name: "禁用"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-main-menu-button-stage">
          <ComponentGalleryButton disabled={stateId === "disabled"} onClick={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "player-name-editor",
    name: "玩家昵称编辑",
    group: "player",
    defaultSize: {width: 122, height: 34},
    componentFile: "apps/desktop/src/components/player/PlayerNameEditor.tsx",
    cssFile: "apps/desktop/src/components/player/PlayerNameEditor.css",
    cssVariablePrefix: "--player-name-editor-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "longName", name: "长名字"},
      {id: "disabled", name: "禁用"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-player-field-stage">
          <PlayerNameEditor value={stateId === "longName" ? "很长很长的训练师名字测试" : "小遥"} disabled={stateId === "disabled"} onChange={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "trainer-preview-panel",
    name: "训练师预览面板",
    group: "player",
    defaultSize: {width: 122, height: 118},
    componentFile: "apps/desktop/src/components/player/TrainerPreviewPanel.tsx",
    cssFile: "apps/desktop/src/components/player/TrainerPreviewPanel.css",
    cssVariablePrefix: "--trainer-preview-panel-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "emptyPlayer", name: "空角色"},
      {id: "longName", name: "长名字"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-player-preview-stage">
          <TrainerPreviewPanel name={stateId === "longName" ? "很长很长的训练师名字测试" : "小遥"} player={stateId === "emptyPlayer" ? undefined : titlePreviewCatalog.players[0]} />
        </div>
      );
    },
  },
  {
    id: "trainer-avatar-picker",
    name: "训练师头像选择器",
    group: "player",
    defaultSize: {width: 220, height: 150},
    componentFile: "apps/desktop/src/components/player/TrainerAvatarPicker.tsx",
    cssFile: "apps/desktop/src/components/player/TrainerAvatarPicker.css",
    cssVariablePrefix: "--trainer-avatar-picker-*",
    dependencies: [],
    states: [
      {id: "players", name: "角色"},
      {id: "avatars", name: "头像"},
      {id: "empty", name: "空状态"},
      {id: "manyItems", name: "多项目"},
    ],
    renderPreview(stateId) {
      const mode = stateId === "avatars" || stateId === "manyItems" ? "avatars" : "players";
      const items = stateId === "empty" ? [] : stateId === "manyItems" ? playerSettingsManyCatalog.avatars : mode === "avatars" ? titlePreviewCatalog.avatars : titlePreviewCatalog.players;
      const selectedId = mode === "avatars" ? titlePreviewCatalog.avatars[0]?.avatar_asset : titlePreviewCatalog.players[0]?.id;
      return (
        <div className="component-gallery-player-picker-stage">
          <TrainerAvatarPicker title={mode === "avatars" ? "头像" : "玩家角色"} mode={mode} items={items} selectedId={selectedId} onSelect={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "page-action-bar",
    name: "页面动作条",
    group: "player",
    defaultSize: {width: 180, height: 28},
    componentFile: "apps/desktop/src/components/player/PageActionBar.tsx",
    cssFile: "apps/desktop/src/components/player/PageActionBar.css",
    cssVariablePrefix: "--page-action-bar-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "disabledSave", name: "禁用保存"},
      {id: "longLabels", name: "长标签"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-player-action-stage">
          <PageActionBar saveLabel={stateId === "longLabels" ? "保存当前训练师资料" : "保存设置"} backLabel={stateId === "longLabels" ? "返回上一页" : "返回"} saveDisabled={stateId === "disabledSave"} onSave={() => undefined} onBack={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "player-settings-page",
    name: "玩家设置页",
    group: "player",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/player/PlayerSettingsPage.tsx",
    cssFile: "apps/desktop/src/components/player/PlayerSettingsPage.css",
    cssVariablePrefix: "--player-settings-page-*",
    dependencies: ["PlayerNameEditor", "TrainerPreviewPanel", "TrainerAvatarPicker", "PageActionBar"],
    states: [
      {id: "newGame", name: "新建存档"},
      {id: "editSave", name: "编辑存档"},
      {id: "longName", name: "长名字"},
    ],
    renderPreview(stateId) {
      const save = stateId === "newGame" ? null : createMainMenuPreviewSave(stateId === "longName" ? "很长很长的训练师名字测试" : "小遥", 268);
      return (
        <div className="component-gallery-player-page-stage">
          <PlayerSettingsPage
            title={stateId === "newGame" ? "训练师登记" : "玩家设置"}
            save={save}
            name={stateId === "longName" ? "很长很长的训练师名字测试" : "小遥"}
            catalog={stateId === "longName" ? playerSettingsManyCatalog : titlePreviewCatalog}
            selectedPlayerId="may"
            selectedAvatarAsset={titlePreviewCatalog.avatars[0]?.avatar_asset}
            onSave={() => undefined}
            onBack={() => undefined}
            saveLabel={stateId === "newGame" ? "创建存档" : "保存设置"}
          />
        </div>
      );
    },
  },
];
