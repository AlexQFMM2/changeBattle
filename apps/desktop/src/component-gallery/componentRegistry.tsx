import type {CSSProperties, ReactNode} from "react";
import {MoveCard} from "../components/move/MoveCard";
import {ScreenToast} from "../components/feedback/ScreenToast";
import {QuickDexButton} from "../components/shell/QuickDexButton";
import {SaveSelectPanel} from "../components/shell/SaveSelectPanel";
import {TitleCommandMenu} from "../components/shell/TitleCommandMenu";
import {TitleLogo} from "../components/shell/TitleLogo";
import {TitleVideoBackground} from "../components/shell/TitleVideoBackground";
import {createTitlePreviewSave, moveCardPreviewData, titlePreviewCatalog} from "./previewData";

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
];
