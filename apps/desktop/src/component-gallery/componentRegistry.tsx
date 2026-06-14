import type {CSSProperties, ReactNode} from "react";
import {useState} from "react";
import {PageActionBar} from "../components/player/PageActionBar";
import {PlayerNameEditor} from "../components/player/PlayerNameEditor";
import {PlayerSettingsPage} from "../components/player/PlayerSettingsPage";
import {TrainerAvatarPicker} from "../components/player/TrainerAvatarPicker";
import {TrainerPreviewPanel} from "../components/player/TrainerPreviewPanel";
import {TalentBoardCanvas} from "../components/setup/talent/TalentBoardCanvas";
import {TalentConfigPage} from "../components/setup/talent/TalentConfigPage";
import {TalentNodeDetailDrawer} from "../components/setup/talent/TalentNodeDetailDrawer";
import {TalentToolbar} from "../components/setup/talent/TalentToolbar";
import {BattleRuleDetailPanel} from "../components/setup/battle-setting/BattleRuleDetailPanel";
import {BattleRulePresetList} from "../components/setup/battle-setting/BattleRulePresetList";
import {BattleRuleTabs} from "../components/setup/battle-setting/BattleRuleTabs";
import {BattleSettingActionBar} from "../components/setup/battle-setting/BattleSettingActionBar";
import {BattleSettingPage} from "../components/setup/battle-setting/BattleSettingPage";
import {StarterItemTabs} from "../components/setup/starter-items/StarterItemTabs";
import {StarterItemsActionBar} from "../components/setup/starter-items/StarterItemsActionBar";
import {StarterItemsPage} from "../components/setup/starter-items/StarterItemsPage";
import {StarterOfferDetail} from "../components/setup/starter-items/StarterOfferDetail";
import {StarterOfferList} from "../components/setup/starter-items/StarterOfferList";
import {purchasedIdsForGroup, starterItemGroups} from "../components/setup/starter-items/starterItemsModel";
import {BattleHistoryPage} from "../components/result/history/BattleHistoryPage";
import {HistoryActionBar} from "../components/result/history/HistoryActionBar";
import {RunRecordDetailPanel} from "../components/result/history/RunRecordDetailPanel";
import {RunRecordList} from "../components/result/history/RunRecordList";
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
import {battleHistoryLongPreviewRecords, battleHistoryManyPreviewRecords, battleHistoryPreviewRecords, battleSettingGen9PreviewSetting, battleSettingMinRegionsPreviewSetting, battleSettingPreviewSetting, createMainMenuPreviewSave, createTitlePreviewSave, mainMenuDiscoveryPreviewCards, mainMenuFavoritePreviewCards, mainMenuLongDiscoveryPreviewCards, mainMenuLongFavoritePreviewCards, moveCardPreviewData, playerSettingsManyCatalog, starterItemsEmptyPreviewState, starterItemsPreviewState, starterItemsPurchasedPreviewState, talentLockedPreviewCatalog, talentPreviewCatalog, titlePreviewCatalog} from "./previewData";

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

function TalentBoardPreview({lockedOnly = false, zoomed = false}: {lockedOnly?: boolean; zoomed?: boolean}) {
  const catalog = lockedOnly ? talentLockedPreviewCatalog : talentPreviewCatalog;
  const [selectedId, setSelectedId] = useState("starter_angel_fund");
  return (
    <TalentBoardCanvas
      catalog={catalog}
      selectedId={selectedId}
      view={zoomed ? {x: -60, y: 22, scale: 1.18} : {x: 0, y: 0, scale: 0.78}}
      onSelectNode={node => setSelectedId(node.id)}
      onPointerDown={() => undefined}
      onPointerMove={() => undefined}
      onPointerUp={() => undefined}
      onWheel={event => event.preventDefault()}
    />
  );
}

function BattleHistoryPagePreview({stateId}: {stateId: string}) {
  const records = stateId === "empty" || stateId === "loading" || stateId === "error"
    ? []
    : stateId === "longText"
      ? battleHistoryLongPreviewRecords
      : battleHistoryPreviewRecords;
  return (
    <BattleHistoryPage
      onBack={() => undefined}
      previewRecords={records}
      previewLoading={stateId === "loading"}
      previewError={stateId === "error" ? "读取战绩失败：预览错误信息很长时也不能撑破顶部栏。" : null}
      previewNoResultView
    />
  );
}

function BattleSettingPagePreview({stateId}: {stateId: string}) {
  const setting = stateId === "longText" ? battleSettingGen9PreviewSetting : battleSettingPreviewSetting;
  const status = stateId === "saving" ? "saving" : stateId === "error" ? "error" : "idle";
  return (
    <BattleSettingPage
      save={createMainMenuPreviewSave("小遥", 268)}
      onSaved={() => undefined}
      onBack={() => undefined}
      previewSetting={setting}
      previewStatus={status}
      previewNotice={stateId === "error" ? "保存失败：预览错误信息较长时也不能撑破底部动作条。" : stateId === "longText" ? "保存并返回的长文案仍保留在状态区域内部。" : ""}
    />
  );
}

function StarterItemsPreviewState({children}: {children: (value: {stagedOfferIds: Set<string>; setStagedOfferIds: (next: Set<string>) => void}) => ReactNode}) {
  const [stagedOfferIds, setStagedOfferIds] = useState<Set<string>>(() => new Set());
  return children({stagedOfferIds, setStagedOfferIds});
}

function StarterTabsPreview({stateId}: {stateId: string}) {
  const starter = stateId === "purchased" ? starterItemsPurchasedPreviewState : starterItemsPreviewState;
  const groups = starterItemGroups(starter);
  return (
    <StarterItemsPreviewState>
      {({stagedOfferIds}) => (
        <StarterItemTabs starter={starter} groups={groups} activeGroupId={stateId === "battle" ? "battle" : groups[0]?.id || ""} stagedOfferIds={stagedOfferIds} onSelectGroup={() => undefined} />
      )}
    </StarterItemsPreviewState>
  );
}

function StarterOfferListPreview({stateId}: {stateId: string}) {
  const starter = stateId === "purchased" ? starterItemsPurchasedPreviewState : starterItemsPreviewState;
  const groups = starterItemGroups(starter);
  const group = stateId === "empty" ? null : stateId === "longText" ? groups[0] : stateId === "battle" ? groups.find(entry => entry.id === "battle") || groups[0] : groups[0];
  return (
    <StarterItemsPreviewState>
      {({stagedOfferIds, setStagedOfferIds}) => (
        <StarterOfferList
          starter={starter}
          group={group}
          stagedOfferIds={stagedOfferIds}
          focusedOfferId={group?.offers[0]?.offer_id || ""}
          onFocusOffer={() => undefined}
          onToggleOffer={offer => {
            const next = new Set(stagedOfferIds);
            next.has(offer.offer_id) ? next.delete(offer.offer_id) : next.add(offer.offer_id);
            setStagedOfferIds(next);
          }}
        />
      )}
    </StarterItemsPreviewState>
  );
}

function StarterDetailPreview({stateId}: {stateId: string}) {
  const starter = stateId === "purchased" ? starterItemsPurchasedPreviewState : starterItemsPreviewState;
  const group = starterItemGroups(starter)[0] || null;
  const offer = stateId === "empty" ? null : stateId === "longText" ? group?.offers[3] || null : group?.offers[0] || null;
  const purchased = Boolean(group && offer && purchasedIdsForGroup(group).includes(offer.offer_id));
  return <StarterOfferDetail group={group} offer={offer} selected={stateId === "selected" || purchased} locked={purchased} />;
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
  {
    id: "talent-toolbar",
    name: "星图工具栏",
    group: "setup",
    defaultSize: {width: 330, height: 42},
    componentFile: "apps/desktop/src/components/setup/talent/TalentToolbar.tsx",
    cssFile: "apps/desktop/src/components/setup/talent/TalentToolbar.css",
    cssVariablePrefix: "--talent-toolbar-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "lowBp", name: "低 BP"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-talent-toolbar-stage">
          <TalentToolbar unlockedCount={stateId === "lowBp" ? 1 : 6} bp={stateId === "lowBp" ? 3 : 268} longTitle={stateId === "longText"} onZoomOut={() => undefined} onActualSize={() => undefined} onZoomIn={() => undefined} onReset={() => undefined} onBack={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "talent-board-canvas",
    name: "星图画布",
    group: "setup",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/setup/talent/TalentBoardCanvas.tsx",
    cssFile: "apps/desktop/src/components/setup/talent/TalentBoardCanvas.css",
    cssVariablePrefix: "--talent-board-*",
    dependencies: [],
    states: [
      {id: "mixedNodes", name: "混合节点"},
      {id: "lockedOnly", name: "锁定节点"},
      {id: "zoomed", name: "缩放视角"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-talent-board-stage">
          <TalentBoardPreview lockedOnly={stateId === "lockedOnly"} zoomed={stateId === "zoomed"} />
        </div>
      );
    },
  },
  {
    id: "talent-node-detail-drawer",
    name: "星图节点详情",
    group: "setup",
    defaultSize: {width: 160, height: 150},
    componentFile: "apps/desktop/src/components/setup/talent/TalentNodeDetailDrawer.tsx",
    cssFile: "apps/desktop/src/components/setup/talent/TalentNodeDetailDrawer.css",
    cssVariablePrefix: "--talent-node-detail-drawer-*",
    dependencies: ["motion/react"],
    states: [
      {id: "available", name: "可点亮"},
      {id: "locked", name: "锁定"},
      {id: "maxed", name: "满级"},
      {id: "eventPreview", name: "预览节点"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const node = stateId === "locked"
        ? talentPreviewCatalog.find(entry => entry.id === "exchange_trust")!
        : stateId === "maxed"
          ? talentPreviewCatalog.find(entry => entry.id === "intel_god_eye")!
          : stateId === "eventPreview" || stateId === "longText"
            ? talentPreviewCatalog.find(entry => entry.id === "event_preview_meteor")!
            : talentPreviewCatalog.find(entry => entry.id === "gear_bag")!;
      return (
        <div className="component-gallery-talent-drawer-stage">
          <TalentNodeDetailDrawer node={node} catalog={talentPreviewCatalog} bp={stateId === "available" ? 268 : 3} onClose={() => undefined} onUpgrade={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "talent-config-page",
    name: "星图页面",
    group: "setup",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/setup/talent/TalentConfigPage.tsx",
    cssFile: "apps/desktop/src/components/setup/talent/TalentConfigPage.css",
    cssVariablePrefix: "--talent-config-page-*",
    dependencies: ["TalentToolbar", "TalentBoardCanvas", "TalentNodeDetailDrawer"],
    states: [
      {id: "normal", name: "普通"},
      {id: "detailClosed", name: "关闭详情"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-talent-page-stage">
          <TalentConfigPage
            save={createMainMenuPreviewSave("小遥", stateId === "longText" ? 16 : 268)}
            onSaved={() => undefined}
            onBack={() => undefined}
            previewCatalog={talentPreviewCatalog}
            previewBp={stateId === "longText" ? 16 : 268}
            previewDetailOpen={stateId !== "detailClosed"}
            previewSelectedId={stateId === "longText" ? "event_preview_meteor" : "starter_angel_fund"}
          />
        </div>
      );
    },
  },
  {
    id: "battle-rule-tabs",
    name: "规则分类 Tabs",
    group: "setup",
    defaultSize: {width: 230, height: 42},
    componentFile: "apps/desktop/src/components/setup/battle-setting/BattleRuleTabs.tsx",
    cssFile: "apps/desktop/src/components/setup/battle-setting/BattleRuleTabs.css",
    cssVariablePrefix: "--battle-rule-tabs-*",
    dependencies: [],
    states: [
      {id: "regions", name: "地区"},
      {id: "systems", name: "规则"},
      {id: "legendary", name: "神战"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const activeTab = stateId === "systems" ? "systems" : stateId === "legendary" ? "legendary" : "regions";
      return (
        <div className="component-gallery-battle-setting-tabs-stage">
          <BattleRuleTabs activeTab={activeTab} longText={stateId === "longText"} onSelectTab={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "battle-rule-preset-list",
    name: "规则预设列表",
    group: "setup",
    defaultSize: {width: 292, height: 130},
    componentFile: "apps/desktop/src/components/setup/battle-setting/BattleRulePresetList.tsx",
    cssFile: "apps/desktop/src/components/setup/battle-setting/BattleRulePresetList.css",
    cssVariablePrefix: "--battle-rule-preset-list-*",
    dependencies: [],
    states: [
      {id: "regions", name: "地区"},
      {id: "systems", name: "规则"},
      {id: "legendary", name: "神战"},
      {id: "minRegions", name: "最少地区"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const tab = stateId === "systems" || stateId === "longText" ? "systems" : stateId === "legendary" ? "legendary" : "regions";
      const setting = stateId === "minRegions" ? battleSettingMinRegionsPreviewSetting : stateId === "legendary" || stateId === "longText" ? battleSettingGen9PreviewSetting : battleSettingPreviewSetting;
      return (
        <div className="component-gallery-battle-setting-list-stage">
          <BattleRulePresetList tab={tab} setting={setting} selectedPresetId={setting.battle_rule_preset} longText={stateId === "longText"} onToggleGeneration={() => undefined} onSelectPreset={() => undefined} onSetLegendary={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "battle-rule-detail-panel",
    name: "规则详情面板",
    group: "setup",
    defaultSize: {width: 190, height: 130},
    componentFile: "apps/desktop/src/components/setup/battle-setting/BattleRuleDetailPanel.tsx",
    cssFile: "apps/desktop/src/components/setup/battle-setting/BattleRuleDetailPanel.css",
    cssVariablePrefix: "--battle-rule-detail-panel-*",
    dependencies: [],
    states: [
      {id: "regions", name: "地区"},
      {id: "systems", name: "规则"},
      {id: "legendaryOn", name: "神战开"},
      {id: "saving", name: "保存中"},
      {id: "error", name: "错误"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const tab = stateId === "systems" || stateId === "saving" || stateId === "error" || stateId === "longText" ? "systems" : stateId === "legendaryOn" ? "legendary" : "regions";
      const setting = stateId === "legendaryOn" || stateId === "longText" ? battleSettingGen9PreviewSetting : battleSettingPreviewSetting;
      const saveStatus = stateId === "saving" ? "saving" : stateId === "error" ? "error" : "idle";
      return (
        <div className="component-gallery-battle-setting-detail-stage">
          <BattleRuleDetailPanel tab={tab} setting={setting} selectedPresetId={setting.battle_rule_preset} saveStatus={saveStatus} notice={stateId === "error" ? "保存失败：网络或本地存档暂不可用。" : ""} longText={stateId === "longText"} />
        </div>
      );
    },
  },
  {
    id: "battle-setting-action-bar",
    name: "对局偏好动作条",
    group: "setup",
    defaultSize: {width: 330, height: 44},
    componentFile: "apps/desktop/src/components/setup/battle-setting/BattleSettingActionBar.tsx",
    cssFile: "apps/desktop/src/components/setup/battle-setting/BattleSettingActionBar.css",
    cssVariablePrefix: "--battle-setting-action-bar-*",
    dependencies: [],
    states: [
      {id: "idle", name: "待保存"},
      {id: "saving", name: "保存中"},
      {id: "saved", name: "已保存"},
      {id: "error", name: "错误"},
    ],
    renderPreview(stateId) {
      const status = stateId === "saving" ? "saving" : stateId === "saved" ? "saved" : stateId === "error" ? "error" : "idle";
      return (
        <div className="component-gallery-battle-setting-action-stage">
          <BattleSettingActionBar status={status} notice={stateId === "error" ? "保存失败，请重试。" : ""} onSaveAndBack={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "battle-setting-page",
    name: "对局偏好页面",
    group: "setup",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/setup/battle-setting/BattleSettingPage.tsx",
    cssFile: "apps/desktop/src/components/setup/battle-setting/BattleSettingPage.css",
    cssVariablePrefix: "--battle-setting-page-*",
    dependencies: ["BattleRuleTabs", "BattleRulePresetList", "BattleRuleDetailPanel", "BattleSettingActionBar"],
    states: [
      {id: "normal", name: "普通"},
      {id: "saving", name: "保存中"},
      {id: "error", name: "错误"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-battle-setting-page-stage">
          <BattleSettingPagePreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "starter-item-tabs",
    name: "开局道具分类",
    group: "setup",
    defaultSize: {width: 360, height: 48},
    componentFile: "apps/desktop/src/components/setup/starter-items/StarterItemTabs.tsx",
    cssFile: "apps/desktop/src/components/setup/starter-items/StarterItemTabs.css",
    cssVariablePrefix: "--starter-item-tabs-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "battle", name: "战斗分类"},
      {id: "purchased", name: "已购买"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-starter-tabs-stage">
          <StarterTabsPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "starter-offer-list",
    name: "开局道具列表",
    group: "setup",
    defaultSize: {width: 330, height: 126},
    componentFile: "apps/desktop/src/components/setup/starter-items/StarterOfferList.tsx",
    cssFile: "apps/desktop/src/components/setup/starter-items/StarterOfferList.css",
    cssVariablePrefix: "--starter-offer-list-*",
    dependencies: ["ItemIcon"],
    states: [
      {id: "filled", name: "有道具"},
      {id: "battle", name: "战斗道具"},
      {id: "purchased", name: "已购买"},
      {id: "empty", name: "空状态"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-starter-list-stage">
          <StarterOfferListPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "starter-offer-detail",
    name: "开局道具详情",
    group: "setup",
    defaultSize: {width: 150, height: 126},
    componentFile: "apps/desktop/src/components/setup/starter-items/StarterOfferDetail.tsx",
    cssFile: "apps/desktop/src/components/setup/starter-items/StarterOfferDetail.css",
    cssVariablePrefix: "--starter-offer-detail-*",
    dependencies: ["ItemIcon"],
    states: [
      {id: "normal", name: "普通"},
      {id: "selected", name: "已暂选"},
      {id: "purchased", name: "已购买"},
      {id: "empty", name: "空状态"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-starter-detail-stage">
          <StarterDetailPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "starter-items-action-bar",
    name: "开局道具动作条",
    group: "setup",
    defaultSize: {width: 360, height: 44},
    componentFile: "apps/desktop/src/components/setup/starter-items/StarterItemsActionBar.tsx",
    cssFile: "apps/desktop/src/components/setup/starter-items/StarterItemsActionBar.css",
    cssVariablePrefix: "--starter-items-action-bar-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "starting", name: "准备中"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-starter-action-stage">
          <StarterItemsActionBar summary={stateId === "longText" ? "这是一段很长的开局道具选择汇总，用来确认按钮不会偏移。" : "已选择 1/4 个开局道具，可直接开始游戏。"} starting={stateId === "starting"} onBack={() => undefined} onStart={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "starter-items-page",
    name: "开局道具页面",
    group: "setup",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/setup/starter-items/StarterItemsPage.tsx",
    cssFile: "apps/desktop/src/components/setup/starter-items/StarterItemsPage.css",
    cssVariablePrefix: "--starter-items-page-*",
    dependencies: ["StarterItemTabs", "StarterOfferList", "StarterOfferDetail", "StarterItemsActionBar"],
    states: [
      {id: "normal", name: "普通"},
      {id: "purchased", name: "已购买"},
      {id: "empty", name: "空状态"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const starter = stateId === "empty" ? starterItemsEmptyPreviewState : stateId === "purchased" ? starterItemsPurchasedPreviewState : starterItemsPreviewState;
      return (
        <div className="component-gallery-starter-page-stage">
          <StarterItemsPage starter={starter} onChoose={() => undefined} onBack={() => undefined} previewNoSubmit />
        </div>
      );
    },
  },
  {
    id: "run-record-list",
    name: "整局记录列表",
    group: "result",
    defaultSize: {width: 292, height: 130},
    componentFile: "apps/desktop/src/components/result/history/RunRecordList.tsx",
    cssFile: "apps/desktop/src/components/result/history/RunRecordList.css",
    cssVariablePrefix: "--run-record-list-*",
    dependencies: ["PokemonSprite"],
    states: [
      {id: "filled", name: "有记录"},
      {id: "empty", name: "空状态"},
      {id: "longText", name: "长文本"},
      {id: "manyRecords", name: "多记录"},
    ],
    renderPreview(stateId) {
      const records = stateId === "empty" ? [] : stateId === "longText" ? battleHistoryLongPreviewRecords : stateId === "manyRecords" ? battleHistoryManyPreviewRecords : battleHistoryPreviewRecords;
      return (
        <div className="component-gallery-history-list-stage">
          <RunRecordList records={records} activeRecordId={records[0]?.id} onPreviewRecord={() => undefined} onOpenRecord={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "run-record-detail-panel",
    name: "整局记录摘要",
    group: "result",
    defaultSize: {width: 174, height: 130},
    componentFile: "apps/desktop/src/components/result/history/RunRecordDetailPanel.tsx",
    cssFile: "apps/desktop/src/components/result/history/RunRecordDetailPanel.css",
    cssVariablePrefix: "--run-record-detail-panel-*",
    dependencies: ["PokemonSprite"],
    states: [
      {id: "win", name: "通关"},
      {id: "loss", name: "失败"},
      {id: "abort", name: "中断"},
      {id: "longText", name: "长文本"},
      {id: "empty", name: "空状态"},
    ],
    renderPreview(stateId) {
      const record = stateId === "empty"
        ? null
        : stateId === "longText"
          ? battleHistoryLongPreviewRecords[0]
          : battleHistoryPreviewRecords.find(entry => entry.outcome === stateId) || battleHistoryPreviewRecords[0];
      return (
        <div className="component-gallery-history-detail-stage">
          <RunRecordDetailPanel record={record} />
        </div>
      );
    },
  },
  {
    id: "history-action-bar",
    name: "战绩动作栏",
    group: "result",
    defaultSize: {width: 330, height: 54},
    componentFile: "apps/desktop/src/components/result/history/HistoryActionBar.tsx",
    cssFile: "apps/desktop/src/components/result/history/HistoryActionBar.css",
    cssVariablePrefix: "--history-action-bar-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "loading", name: "加载中"},
      {id: "error", name: "错误"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-history-action-stage">
          <HistoryActionBar
            tone={stateId === "error" ? "error" : stateId === "loading" ? "loading" : "normal"}
            status={stateId === "error" ? "ERROR" : stateId === "loading" ? "LOADING" : "RECORDS"}
            title={stateId === "longText" ? "很长很长的战绩页面标题测试" : "战绩"}
            subtitle={stateId === "longText" ? "这是一段很长的战绩页说明文字，用来确认顶部栏不会撑破布局。" : stateId === "loading" ? "读取历史战绩中..." : stateId === "error" ? "读取战绩失败。" : "查看历史挑战的完整结算记录。"}
            onBack={() => undefined}
          />
        </div>
      );
    },
  },
  {
    id: "battle-history-page",
    name: "战绩页面",
    group: "result",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/result/history/BattleHistoryPage.tsx",
    cssFile: "apps/desktop/src/components/result/history/BattleHistoryPage.css",
    cssVariablePrefix: "--battle-history-page-*",
    dependencies: ["HistoryActionBar", "RunRecordList", "RunRecordDetailPanel", "ResultView"],
    states: [
      {id: "normal", name: "普通"},
      {id: "loading", name: "加载中"},
      {id: "empty", name: "空状态"},
      {id: "error", name: "错误"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-history-page-stage">
          <BattleHistoryPagePreview stateId={stateId} />
        </div>
      );
    },
  },
];
