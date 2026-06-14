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
import {RentalActionBar} from "../components/setup/rental-select/RentalActionBar";
import {RentalCandidateCard} from "../components/setup/rental-select/RentalCandidateCard";
import {RentalCandidateList} from "../components/setup/rental-select/RentalCandidateList";
import {RentalPokemonDetail} from "../components/setup/rental-select/RentalPokemonDetail";
import {RentalSelectPage} from "../components/setup/rental-select/RentalSelectPage";
import {RentalTeamPreview} from "../components/setup/rental-select/RentalTeamPreview";
import {ScoutControls} from "../components/setup/rental-select/ScoutControls";
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
import {BattleRoundList} from "../components/result/BattleRoundList";
import {ResultHeader} from "../components/result/ResultHeader";
import {ResultPage} from "../components/result/ResultPage";
import {ResultProgressList, ProgressDetail} from "../components/result/ResultProgressList";
import {ResultSettlementGrid} from "../components/result/ResultSettlementGrid";
import {ResultTeamSummary, PokemonResultDetail} from "../components/result/ResultTeamSummary";
import {TurnDetailPanel} from "../components/result/TurnDetailPanel";
import {PokemonHpBar} from "../components/common/PokemonHpBar";
import {MoveCard} from "../components/move/MoveCard";
import {DexCategoryTabs} from "../components/dex/DexCategoryTabs";
import {DexDetailPanel} from "../components/dex/DexDetailPanel";
import {DexModal} from "../components/dex/DexModal";
import {DexResultList} from "../components/dex/DexResultList";
import {DexSearchBar} from "../components/dex/DexSearchBar";
import {QuickDexModal} from "../components/dex/QuickDexModal";
import {RestHeader} from "../components/rest/RestHeader";
import {RestToolBar} from "../components/rest/RestToolBar";
import {RestMyTeamPanel} from "../components/rest/team/RestMyTeamPanel";
import {RestPokemonInfoPanel} from "../components/rest/team/RestPokemonInfoPanel";
import {RestPokemonMoveGrid} from "../components/rest/team/RestPokemonMoveGrid";
import {RestPokemonProfileCard} from "../components/rest/team/RestPokemonProfileCard";
import {RestPokemonSlot} from "../components/rest/team/RestPokemonSlot";
import {RestSelectedPokemonDetail} from "../components/rest/team/RestSelectedPokemonDetail";
import {RestTeamMiniCard} from "../components/rest/team/RestTeamMiniCard";
import type {RestPokemonFocus} from "../components/rest/team/restTeamModel";
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
import {RouteTransitionCopyPanel} from "../pages/shell/RouteTransitionCopyPanel";
import {RouteTransitionPage, routeTransitionCopy} from "../pages/shell/RouteTransitionPage";
import {RouteTransitionVideo} from "../pages/shell/RouteTransitionVideo";
import {BagActionPanel, type BagActionStep} from "../components/bag/BagActionPanel";
import {BagFilterTabs} from "../components/bag/BagFilterTabs";
import {BagItemDetailPanel} from "../components/bag/BagItemDetailPanel";
import {BagItemList} from "../components/bag/BagItemList";
import {BagTargetPokemonList, type BagTargetPokemonEntry} from "../components/bag/BagTargetPokemonList";
import {RestBagPanel} from "../components/bag/RestBagPanel";
import {tmFallbackMove} from "../components/bag/bagModel";
import type {BagFilterKey} from "../components/bag/bagModel";
import type {MainMenuDexCard} from "../components/shell/mainMenuTypes";
import {bagPreviewItems, battleHistoryLongPreviewRecords, battleHistoryManyPreviewRecords, battleHistoryPreviewRecords, battleSettingGen9PreviewSetting, battleSettingMinRegionsPreviewSetting, battleSettingPreviewSetting, createBagPreviewCategories, createMainMenuPreviewSave, createTitlePreviewSave, dexPreviewAbility, dexPreviewEntries, dexPreviewItem, dexPreviewLongPokemon, dexPreviewMove, dexPreviewPokemon, dexPreviewTrainerLocked, dexPreviewTrainerUnlocked, mainMenuDiscoveryPreviewCards, mainMenuFavoritePreviewCards, mainMenuLongDiscoveryPreviewCards, mainMenuLongFavoritePreviewCards, moveCardPreviewData, playerSettingsManyCatalog, rentalPreviewCandidates, rentalPreviewLongCandidates, restPreviewStateLong, restPreviewStateLowHp, restPreviewStateNormal, restPreviewStateSix, resultAbortPreviewSummary, resultEmptyPreviewSummary, resultLongPreviewSummary, resultLossPreviewSummary, resultPreviewRecordNoTurns, resultPreviewRecordWithTurns, resultPreviewSummary, starterItemsEmptyPreviewState, starterItemsPreviewState, starterItemsPurchasedPreviewState, talentLockedPreviewCatalog, talentPreviewCatalog, titlePreviewCatalog} from "./previewData";
import {outcomeLabel} from "../components/result/resultUtils";

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

function resultSummaryForState(stateId: string) {
  if (stateId === "loss") return resultLossPreviewSummary;
  if (stateId === "abort") return resultAbortPreviewSummary;
  if (stateId === "longText") return resultLongPreviewSummary;
  if (stateId === "empty") return resultEmptyPreviewSummary;
  return resultPreviewSummary;
}

function resultRecordForState(stateId: string) {
  if (stateId === "noRounds") return resultPreviewRecordNoTurns;
  return resultPreviewRecordWithTurns;
}

function ResultPagePreview({stateId}: {stateId: string}) {
  const summary = resultSummaryForState(stateId);
  const record = resultRecordForState(stateId);
  return <ResultPage message="预览结算" battle={null} summary={summary} onBack={() => undefined} backLabel={stateId === "longText" ? "返回战绩列表" : "返回"} previewRecords={stateId === "empty" ? [] : [record]} />;
}

function ResultProgressPreview({stateId}: {stateId: string}) {
  const summary = resultSummaryForState(stateId);
  const progressRows = summary.progress || [];
  const record = stateId === "noRounds" ? resultPreviewRecordNoTurns : resultPreviewRecordWithTurns;
  const selected = progressRows.find(row => row.battle_no === record.battle_no) || progressRows.at(-1) || null;
  return (
    <ResultProgressList
      progressRows={progressRows}
      selectedBattleNo={selected?.battle_no || 1}
      selectedProgress={selected}
      selectedBattleRecord={stateId === "empty" ? null : record}
      recordsLoaded
      roundPanelOpen={false}
      onSelectProgress={() => undefined}
      onOpenRounds={() => undefined}
    />
  );
}

function BattleRoundPreview({stateId}: {stateId: string}) {
  const record = stateId === "empty" ? {...resultPreviewRecordNoTurns, turn_records: []} : resultPreviewRecordWithTurns;
  return <BattleRoundList record={record} selectedTurn={record.turn_records?.[1] || null} onSelectTurn={() => undefined} onBack={() => undefined} />;
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

function rentalCandidatesForState(stateId: string) {
  if (stateId === "empty" || stateId === "loading") return [];
  if (stateId === "longText") return rentalPreviewLongCandidates;
  if (stateId === "manyCandidates") return [...rentalPreviewCandidates, ...rentalPreviewLongCandidates.slice(0, 6)];
  if (stateId === "sixCandidates") return rentalPreviewCandidates.slice(0, 6);
  return rentalPreviewCandidates;
}

function RentalPreviewState({stateId, children}: {stateId: string; children: (value: {candidates: typeof rentalPreviewCandidates; selected: number[]; focusIndex: number; setFocusIndex: (index: number) => void; toggle: (index: number) => void}) => ReactNode}) {
  const candidates = rentalCandidatesForState(stateId);
  const [focusIndex, setFocusIndex] = useState(stateId === "battleSystem" ? 1 : 0);
  const initialSelected = stateId === "ready" || stateId === "full" ? [0, 1, 2] : stateId === "partialSelection" || stateId === "partial" || stateId === "selected" ? [0] : [];
  const [selected, setSelected] = useState<number[]>(initialSelected);
  function toggle(index: number) {
    setSelected(current => current.includes(index) ? current.filter(value => value !== index) : current.length < 3 ? [...current, index] : [...current.slice(0, 2), index]);
  }
  return children({candidates, selected, focusIndex, setFocusIndex, toggle});
}

function RentalCandidateCardPreview({stateId}: {stateId: string}) {
  const index = stateId === "legendary" ? 5 : stateId === "battleSystem" ? 1 : stateId === "longName" ? 11 : 0;
  const candidates = stateId === "longName" ? rentalPreviewLongCandidates : rentalPreviewCandidates;
  const pokemon = candidates[index] || candidates[0];
  return <RentalCandidateCard pokemon={pokemon} index={index} focused={stateId === "focused"} selected={stateId === "selected"} onFocus={() => undefined} onToggle={() => undefined} />;
}

function RentalCandidateListPreview({stateId}: {stateId: string}) {
  return (
    <RentalPreviewState stateId={stateId}>
      {({candidates, selected, focusIndex, setFocusIndex, toggle}) => (
        <RentalCandidateList candidates={candidates} selected={selected} focusIndex={focusIndex} onFocus={setFocusIndex} onToggle={toggle} />
      )}
    </RentalPreviewState>
  );
}

function RentalPokemonDetailPreview({stateId}: {stateId: string}) {
  const pokemon = stateId === "longText" ? rentalPreviewLongCandidates[0] : rentalPreviewCandidates[stateId === "selected" ? 1 : 0];
  return <RentalPokemonDetail pokemon={pokemon} selected={stateId === "selected"} revealTraining={stateId === "revealedTraining"} onToggle={() => undefined} />;
}

function RentalTeamPreviewStage({stateId}: {stateId: string}) {
  const candidates = stateId === "longName" ? rentalPreviewLongCandidates : rentalPreviewCandidates;
  const count = stateId === "empty" ? 0 : stateId === "partial" ? 1 : 3;
  return <RentalTeamPreview team={candidates.slice(0, count)} />;
}

function RentalSelectPagePreview({stateId}: {stateId: string}) {
  return (
    <RentalPreviewState stateId={stateId}>
      {({candidates, selected, focusIndex, setFocusIndex, toggle}) => (
        <RentalSelectPage
          candidates={stateId === "loading" ? [] : candidates}
          selected={stateId === "ready" ? [0, 1, 2] : selected}
          focusIndex={focusIndex}
          setFocusIndex={setFocusIndex}
          onToggle={toggle}
          onStart={() => undefined}
          onBack={() => undefined}
          onReroll={() => undefined}
          onSingleReroll={() => undefined}
          onInspect={() => undefined}
          runSeed={260614}
          wholeRerollsRemaining={stateId === "noScoutCharges" ? 0 : 1}
          singleRerollsRemaining={stateId === "noScoutCharges" ? 0 : 2}
          inspectRemaining={stateId === "noScoutCharges" ? 0 : 1}
          revealTraining={stateId !== "loading"}
          inspected={stateId === "noScoutCharges"}
        />
      )}
    </RentalPreviewState>
  );
}

function dexEntriesForState(stateId: string) {
  if (stateId === "empty" || stateId === "error") return [];
  if (stateId === "moves") return [dexPreviewMove, {...dexPreviewMove, id: "thunderbolt", name: "Thunderbolt", name_zh: "十万伏特"}];
  if (stateId === "items") return [dexPreviewItem];
  if (stateId === "trainers" || stateId === "trainerUnlocked") return [dexPreviewTrainerUnlocked, dexPreviewTrainerLocked];
  if (stateId === "trainerLocked") return [dexPreviewTrainerLocked];
  if (stateId === "longText") return [dexPreviewLongPokemon, {...dexPreviewMove, id: "long-move", name_zh: "非常非常长的技能名字测试"}, dexPreviewAbility];
  return [dexPreviewPokemon, dexPreviewMove, dexPreviewItem, dexPreviewAbility, dexPreviewTrainerUnlocked];
}

function dexDetailEntryForState(stateId: string) {
  if (stateId === "empty") return null;
  if (stateId === "trainerLocked") return dexPreviewTrainerLocked;
  if (stateId === "trainerUnlocked") return dexPreviewTrainerUnlocked;
  if (stateId === "move") return dexPreviewMove;
  if (stateId === "item") return dexPreviewItem;
  if (stateId === "ability") return dexPreviewAbility;
  if (stateId === "longText") return dexPreviewLongPokemon;
  return dexPreviewPokemon;
}

function DexResultListPreview({stateId}: {stateId: string}) {
  const entries = dexEntriesForState(stateId);
  const [selectedId, setSelectedId] = useState(entries[0]?.id || "");
  return (
    <DexResultList
      entries={entries}
      selectedId={selectedId || entries[0]?.id}
      loading={stateId === "loading"}
      error={stateId === "error" ? "图鉴读取失败：这是一条较长的错误文案。" : null}
      page={0}
      pageCount={3}
      category={entries[0]?.category || "pokemon"}
      onSelect={entry => setSelectedId(entry.id)}
      onPageChange={() => undefined}
    />
  );
}

function QuickDexResultListPreview({stateId}: {stateId: string}) {
  const entries = dexEntriesForState(stateId);
  const [selectedId, setSelectedId] = useState(entries[0]?.id || "");
  return (
    <DexResultList
      variant="quick"
      entries={entries}
      selectedId={selectedId || entries[0]?.id}
      loading={stateId === "loading"}
      error={stateId === "error" ? "图鉴读取失败。" : null}
      page={0}
      pageCount={3}
      category={entries[0]?.category || "pokemon"}
      onSelect={entry => setSelectedId(entry.id)}
      onPageChange={() => undefined}
    />
  );
}

function restStateForPreview(stateId: string) {
  if (stateId === "sixPokemon" || stateId === "manyTools") return restPreviewStateSix;
  if (stateId === "lowHp" || stateId === "fainted" || stateId === "status" || stateId === "lowHpStatus" || stateId === "lowPp") return restPreviewStateLowHp;
  if (stateId === "longName" || stateId === "longText" || stateId === "longMoveName") return restPreviewStateLong;
  return restPreviewStateNormal;
}

function RestHeaderPreview({stateId}: {stateId: string}) {
  return (
    <RestHeader
      battleNo={stateId === "longText" ? 12 : 3}
      battles={stateId === "longText" ? 120 : 7}
      wins={stateId === "longText" ? 88 : 2}
      coins={stateId === "lowCoins" ? 3 : 420}
      nextDisabled={stateId === "nextDisabled"}
      nextTitle={stateId === "nextDisabled" ? "请先处理当前事件" : undefined}
      onOpenCoinLedger={() => undefined}
      onAbort={() => undefined}
      onNext={() => undefined}
    />
  );
}

function RestToolBarPreview({stateId}: {stateId: string}) {
  const items = [
    {id: "myTeam", label: "我的队伍"},
    {id: "bag", label: "背包"},
    {id: "shop", label: "商店"},
    {id: "forge", label: "熔炉"},
    ...(stateId === "eventTools" || stateId === "manyTools" ? [{id: "doctor", label: "蹩脚医生", event: true}, {id: "tutor", label: "讲师老奶奶", event: true}, {id: "raid", label: "骇人奇袭", event: true}] : []),
    {id: "nightSky", label: stateId === "longText" ? "名字很长的进度图工具入口" : "进度图", badge: "6/21"},
  ];
  return <RestToolBar items={items} activeId={stateId === "eventTools" ? "doctor" : "myTeam"} onSelect={() => undefined} />;
}

function RestSlotPreview({stateId}: {stateId: string}) {
  const rest = restStateForPreview(stateId);
  const index = stateId === "fainted" ? 1 : stateId === "status" || stateId === "lowHp" ? 2 : 0;
  return <RestPokemonSlot pokemon={rest.player_display[index] || rest.player_display[0]} state={rest.player_state[index] || rest.player_state[0]} index={index} selected={stateId === "selected"} onSelect={() => undefined} />;
}

function RestTeamMiniCardPreview({stateId}: {stateId: string}) {
  const rest = restStateForPreview(stateId);
  const index = stateId === "fainted" ? 1 : stateId === "status" || stateId === "lowHp" ? 2 : 0;
  return <RestTeamMiniCard pokemon={rest.player_display[index] || rest.player_display[0]} state={rest.player_state[index] || rest.player_state[0]} index={index} selected={stateId === "selected"} onSelect={() => undefined} />;
}

function RestProfilePreview({stateId}: {stateId: string}) {
  const rest = restStateForPreview(stateId);
  const index = stateId === "noItem" ? 2 : stateId === "lowHp" || stateId === "status" ? 0 : 0;
  const pokemon = stateId === "noItem" ? {...rest.player_display[index], item: "", item_id: "", item_zh: ""} : rest.player_display[index];
  return <RestPokemonProfileCard pokemon={pokemon} state={rest.player_state[index]} />;
}

function RestMoveGridPreview({stateId}: {stateId: string}) {
  const rest = restStateForPreview(stateId);
  const [focus, setFocus] = useState<RestPokemonFocus>({type: "move", moveIndex: 0});
  const pokemon = stateId === "emptyMove" ? {...rest.player_display[0], moves: rest.player_display[0].moves.slice(0, 2)} : rest.player_display[0];
  return <RestPokemonMoveGrid pokemon={pokemon} state={rest.player_state[0]} focus={focus} onFocus={setFocus} />;
}

function RestInfoPanelPreview({stateId}: {stateId: string}) {
  const rest = restStateForPreview(stateId);
  const [focus, setFocus] = useState<RestPokemonFocus>(() => stateId === "item" ? {type: "item"} : stateId === "move" ? {type: "move", moveIndex: 0} : {type: "ability"});
  return <RestPokemonInfoPanel pokemon={rest.player_display[0]} focus={focus} onFocus={setFocus} onMove={() => undefined} onUseItem={() => undefined} onUnequip={() => undefined} onStats={() => undefined} />;
}

function RestSelectedPokemonDetailPreview({stateId}: {stateId: string}) {
  const rest = restStateForPreview(stateId);
  const [focus, setFocus] = useState<RestPokemonFocus>(() => stateId === "move" ? {type: "move", moveIndex: 0} : stateId === "item" ? {type: "item"} : {type: "ability"});
  return <RestSelectedPokemonDetail rest={rest} pokemon={rest.player_display[0]} state={rest.player_state[0]} slot={0} focus={focus} onFocus={setFocus} onMove={() => undefined} onUseItem={() => undefined} onUnequip={() => undefined} onStats={() => undefined} onAction={() => undefined} />;
}

function bagItemForState(stateId: string) {
  if (stateId === "held" || stateId === "heldTarget") return bagPreviewItems.find(item => item.id === "leftovers") || bagPreviewItems[0];
  if (stateId === "tm" || stateId === "tmTarget" || stateId === "moveReplace") return bagPreviewItems.find(item => item.category === "tm") || bagPreviewItems[0];
  if (stateId === "locked") return {...bagPreviewItems[0], locked: true, lock_reason: "预览锁定：该道具来自规则，只能查看。"};
  if (stateId === "noStock") return bagPreviewItems.find(item => item.count === 0) || {...bagPreviewItems[0], count: 0};
  if (stateId === "longText" || stateId === "longName") return bagPreviewItems.find(item => item.id === "long-name-consumable") || bagPreviewItems[0];
  return bagPreviewItems.find(item => item.category === "consumable" && item.count > 0) || bagPreviewItems[0];
}

function bagCountsForState(stateId: string): Record<BagFilterKey, number> {
  if (stateId === "empty") return {recovery: 0, battle: 0, tm: 0, training: 0, system: 0};
  return {
    recovery: createBagPreviewCategories().consumable.length,
    battle: createBagPreviewCategories().held.length,
    tm: createBagPreviewCategories().tm.length,
    training: 1,
    system: stateId === "disabled" ? 0 : 1,
  };
}

function bagItemsForState(stateId: string) {
  if (stateId === "empty" || stateId === "emptyBag") return [];
  if (stateId === "held") return createBagPreviewCategories().held;
  if (stateId === "tm") return createBagPreviewCategories().tm;
  if (stateId === "longName") return [bagItemForState("longName"), ...createBagPreviewCategories().consumable];
  if (stateId === "manyCount") return createBagPreviewCategories().consumable.map(item => ({...item, count: item.id === "potion" ? 99 : item.count}));
  return createBagPreviewCategories().consumable;
}

function bagTargetTeamForState(stateId: string): BagTargetPokemonEntry[] {
  const rest = stateId === "longName" ? restPreviewStateLong : stateId === "lowHp" || stateId === "status" ? restPreviewStateLowHp : restPreviewStateSix;
  return rest.player_display.map((pokemon, index) => ({
    pokemon,
    condition: rest.player_state[index]?.condition,
    status: rest.player_state[index]?.status,
    heldItem: pokemon.item_zh || pokemon.item || "无道具",
    disabled: stateId === "disabledTarget" && index > 1,
    disabledReason: stateId === "disabledTarget" && index > 1 ? "不能学" : index === 1 && stateId === "status" ? "已学会" : "使用",
  }));
}

function bagRestStateForPreview(stateId: string) {
  const base = stateId === "longText" ? restPreviewStateLong : stateId === "emptyBag" ? restPreviewStateNormal : restPreviewStateSix;
  const categories = stateId === "emptyBag" ? {consumable: [], held: [], tm: []} : createBagPreviewCategories();
  if (stateId === "heldFlow") categories.consumable = [];
  if (stateId === "tmFlow") {
    categories.consumable = [];
    categories.held = [];
  }
  return {
    ...base,
    bag_items: Object.fromEntries(Object.values(categories).flat().map(item => [item.id, item.count])),
    bag_categories: categories,
  };
}

function BagActionPanelPreview({stateId}: {stateId: string}) {
  const rest = restPreviewStateSix;
  const item = bagItemForState(stateId);
  const isTm = stateId === "tmTarget" || stateId === "moveReplace";
  const step: BagActionStep = stateId === "moveReplace" ? "moveReplace" : stateId === "consumableTarget" || stateId === "heldTarget" || stateId === "tmTarget" ? "pokemonPicker" : "detail";
  const team = bagTargetTeamForState(isTm ? "disabledTarget" : "normal");
  return (
    <BagActionPanel
      step={step}
      item={item}
      targetTeam={team}
      targetTitle={isTm ? "选择学习者" : stateId === "heldTarget" ? "点击宝可梦携带/替换" : "点击宝可梦直接使用"}
      selectedTarget={0}
      busyIndex={null}
      lockedReason={stateId === "detail" ? undefined : item.lock_reason}
      detailDisabled={stateId === "detail" ? false : item.count <= 0}
      detailUseLabel={item.category === "tm" ? "立即使用" : item.category === "held" ? "立即携带" : "使用"}
      targetPokemon={rest.player_display[0]}
      targetState={rest.player_state[0]}
      displayMove={item.category === "tm" ? tmFallbackMove(item) : undefined}
      selectedMoveSlot={stateId === "moveReplace" ? 1 : null}
      onUseDetail={() => undefined}
      onBackToDetail={() => undefined}
      onSelectTarget={() => undefined}
      onSelectStat={() => undefined}
      onSelectMoveSlot={() => undefined}
      onConfirmMoveReplace={() => undefined}
      onCancelMoveReplace={() => undefined}
    />
  );
}

export const componentRegistry: ComponentRegistryEntry[] = [
  {
    id: "pokemon-hp-bar",
    name: "宝可梦 HP 条",
    group: "common",
    defaultSize: {width: 130, height: 32},
    componentFile: "apps/desktop/src/components/common/PokemonHpBar.tsx",
    cssFile: "apps/desktop/src/components/common/PokemonHpBar.css",
    cssVariablePrefix: "--pokemon-hp-bar-*",
    dependencies: [],
    states: [
      {id: "high", name: "高血量"},
      {id: "mid", name: "中血量"},
      {id: "low", name: "低血量"},
      {id: "empty", name: "空血"},
    ],
    renderPreview(stateId) {
      const hp = stateId === "mid" ? 42 : stateId === "low" ? 12 : stateId === "empty" ? 0 : 78;
      return (
        <div className="component-gallery-hp-bar-stage">
          <PokemonHpBar current={hp} max={100} text={`${hp}/100`} />
        </div>
      );
    },
  },
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
    id: "bag-filter-tabs",
    name: "背包分类 Tabs",
    group: "bag",
    defaultSize: {width: 280, height: 44},
    componentFile: "apps/desktop/src/components/bag/BagFilterTabs.tsx",
    cssFile: "apps/desktop/src/components/bag/BagFilterTabs.css",
    cssVariablePrefix: "--bag-filter-tabs-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "longText", name: "长分类名"},
      {id: "empty", name: "空分类"},
      {id: "disabled", name: "禁用"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-bag-filter-stage">
          <BagFilterTabs activeKey={stateId === "empty" ? "recovery" : "battle"} counts={bagCountsForState(stateId)} disabled={stateId === "disabled"} onSelect={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "bag-item-list",
    name: "背包道具列表",
    group: "bag",
    defaultSize: {width: 280, height: 180},
    componentFile: "apps/desktop/src/components/bag/BagItemList.tsx",
    cssFile: "apps/desktop/src/components/bag/BagItemList.css",
    cssVariablePrefix: "--bag-item-list-*",
    dependencies: ["ItemIcon"],
    states: [
      {id: "recovery", name: "恢复道具"},
      {id: "held", name: "携带物"},
      {id: "tm", name: "技能机器"},
      {id: "empty", name: "空背包"},
      {id: "longName", name: "长名字"},
      {id: "manyCount", name: "多数量"},
    ],
    renderPreview(stateId) {
      const items = bagItemsForState(stateId);
      return (
        <div className="component-gallery-bag-list-stage">
          <BagItemList items={items} selectedId={items[0]?.id} onSelect={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "bag-item-detail-panel",
    name: "背包道具详情",
    group: "bag",
    defaultSize: {width: 340, height: 218},
    componentFile: "apps/desktop/src/components/bag/BagItemDetailPanel.tsx",
    cssFile: "apps/desktop/src/components/bag/BagItemDetailPanel.css",
    cssVariablePrefix: "--bag-item-detail-*",
    dependencies: ["ItemIcon"],
    states: [
      {id: "consumable", name: "消耗品"},
      {id: "held", name: "携带物"},
      {id: "tm", name: "技能机器"},
      {id: "locked", name: "锁定"},
      {id: "noStock", name: "无库存"},
      {id: "longText", name: "长说明"},
    ],
    renderPreview(stateId) {
      const item = bagItemForState(stateId);
      return (
        <div className="component-gallery-bag-detail-stage">
          <BagItemDetailPanel item={item} disabled={stateId === "locked" || stateId === "noStock"} disabledReason={stateId === "locked" ? item.lock_reason : stateId === "noStock" ? "没有库存" : undefined} useLabel={item.category === "tm" ? "立即使用" : item.category === "held" ? "立即携带" : "使用"} onUse={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "bag-target-pokemon-list",
    name: "背包目标队伍列表",
    group: "bag",
    defaultSize: {width: 340, height: 218},
    componentFile: "apps/desktop/src/components/bag/BagTargetPokemonList.tsx",
    cssFile: "apps/desktop/src/components/bag/BagTargetPokemonList.css",
    cssVariablePrefix: "--bag-target-pokemon-list-*",
    dependencies: ["PokemonSprite", "PokemonHpBar"],
    states: [
      {id: "sixPokemon", name: "六只队伍"},
      {id: "lowHp", name: "低血量"},
      {id: "status", name: "异常状态"},
      {id: "disabledTarget", name: "不可用目标"},
      {id: "longName", name: "长名字"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-bag-target-stage">
          <BagTargetPokemonList team={bagTargetTeamForState(stateId)} selectedIndex={0} title={stateId === "disabledTarget" ? "选择学习者" : "点击宝可梦直接使用"} onSelect={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "bag-action-panel",
    name: "背包操作面板",
    group: "bag",
    defaultSize: {width: 340, height: 232},
    componentFile: "apps/desktop/src/components/bag/BagActionPanel.tsx",
    cssFile: "apps/desktop/src/components/bag/BagActionPanel.css",
    cssVariablePrefix: "--bag-action-panel-*",
    dependencies: ["BagItemDetailPanel", "BagTargetPokemonList", "MoveReplacePanel"],
    states: [
      {id: "detail", name: "详情"},
      {id: "consumableTarget", name: "消耗品选目标"},
      {id: "heldTarget", name: "携带物选目标"},
      {id: "tmTarget", name: "技能机器选目标"},
      {id: "moveReplace", name: "技能替换"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-bag-action-stage">
          <BagActionPanelPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-bag-panel",
    name: "休整背包工具区",
    group: "rest",
    defaultSize: {width: 640, height: 260},
    componentFile: "apps/desktop/src/components/bag/RestBagPanel.tsx",
    cssFile: "apps/desktop/src/components/bag/RestBagPanel.css",
    cssVariablePrefix: "--rest-bag-panel-*",
    dependencies: ["BagFilterTabs", "BagItemList", "BagActionPanel"],
    states: [
      {id: "normal", name: "默认"},
      {id: "emptyBag", name: "空背包"},
      {id: "consumableFlow", name: "消耗品流程"},
      {id: "heldFlow", name: "携带物流程"},
      {id: "tmFlow", name: "技能机器流程"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-bag-stage">
          <RestBagPanel rest={bagRestStateForPreview(stateId)} initialTarget={0} onAction={() => undefined} learnableMoves={() => Promise.resolve([tmFallbackMove(bagItemForState("tm"))])} />
        </div>
      );
    },
  },
  {
    id: "dex-search-bar",
    name: "图鉴搜索栏",
    group: "dex",
    defaultSize: {width: 300, height: 50},
    componentFile: "apps/desktop/src/components/dex/DexSearchBar.tsx",
    cssFile: "apps/desktop/src/components/dex/DexSearchBar.css",
    cssVariablePrefix: "--dex-search-bar-*",
    dependencies: [],
    states: [
      {id: "idle", name: "普通"},
      {id: "loading", name: "读取中"},
      {id: "longQuery", name: "长搜索"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-dex-search-stage">
          <DexSearchBar query={stateId === "longQuery" ? "very-long-query-name-type-electric-and-more" : "pikachu"} loading={stateId === "loading"} resultCount={4} total={28} onQueryChange={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "dex-category-tabs",
    name: "图鉴分类标签",
    group: "dex",
    defaultSize: {width: 390, height: 76},
    componentFile: "apps/desktop/src/components/dex/DexCategoryTabs.tsx",
    cssFile: "apps/desktop/src/components/dex/DexCategoryTabs.css",
    cssVariablePrefix: "--dex-category-tabs-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "trainersActive", name: "训练师"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-dex-tabs-stage">
          <DexCategoryTabs category={stateId === "trainersActive" ? "trainers" : "pokemon"} trainerFilter="champion" onCategoryChange={() => undefined} onTrainerFilterChange={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "dex-result-list",
    name: "图鉴结果列表",
    group: "dex",
    defaultSize: {width: 300, height: 150},
    componentFile: "apps/desktop/src/components/dex/DexResultList.tsx",
    cssFile: "apps/desktop/src/components/dex/DexResultList.css",
    cssVariablePrefix: "--dex-result-list-*",
    dependencies: ["ItemIcon", "MoveCard", "DexTrainerAvatar"],
    states: [
      {id: "pokemon", name: "宝可梦"},
      {id: "moves", name: "技能"},
      {id: "items", name: "道具"},
      {id: "trainers", name: "训练师"},
      {id: "empty", name: "空状态"},
      {id: "error", name: "错误"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-dex-list-stage">
          <DexResultListPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "dex-detail-panel",
    name: "图鉴详情面板",
    group: "dex",
    defaultSize: {width: 330, height: 150},
    componentFile: "apps/desktop/src/components/dex/DexDetailPanel.tsx",
    cssFile: "apps/desktop/src/components/dex/DexDetailPanel.css",
    cssVariablePrefix: "--dex-detail-panel-*",
    dependencies: ["PokemonDexDetail", "TrainerDexDetail", "MoveDexDetail", "ItemDexDetail"],
    states: [
      {id: "pokemon", name: "宝可梦"},
      {id: "trainerLocked", name: "训练师锁定"},
      {id: "trainerUnlocked", name: "训练师解锁"},
      {id: "move", name: "技能"},
      {id: "item", name: "道具"},
      {id: "ability", name: "特性"},
      {id: "empty", name: "空状态"},
      {id: "expanded", name: "展开"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-dex-detail-stage">
          <DexDetailPanel entry={dexDetailEntryForState(stateId)} expanded={stateId === "expanded"} onToggleExpanded={() => undefined} onAbilitySelect={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "dex-modal",
    name: "完整图鉴弹窗",
    group: "dex",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/dex/DexModal.tsx",
    cssFile: "apps/desktop/src/components/dex/DexModal.css",
    cssVariablePrefix: "--dex-modal-*",
    dependencies: ["DexSearchBar", "DexCategoryTabs", "DexResultList", "DexDetailPanel"],
    states: [
      {id: "pokemon", name: "宝可梦"},
      {id: "trainers", name: "训练师"},
      {id: "moves", name: "技能"},
      {id: "empty", name: "空状态"},
      {id: "error", name: "错误"},
      {id: "expanded", name: "展开"},
    ],
    renderPreview(stateId) {
      const entries = stateId === "expanded" ? [dexPreviewPokemon] : dexEntriesForState(stateId);
      return (
        <div className="component-gallery-dex-modal-stage">
          <DexModal onClose={() => undefined} preview={{entries, category: entries[0]?.category || "pokemon", error: stateId === "error" ? "读取图鉴失败。" : null, expanded: stateId === "expanded"}} />
        </div>
      );
    },
  },
  {
    id: "quick-dex-modal",
    name: "快捷图鉴弹窗",
    group: "dex",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/dex/QuickDexModal.tsx",
    cssFile: "apps/desktop/src/components/dex/QuickDexModal.css",
    cssVariablePrefix: "--quick-dex-modal-*",
    dependencies: ["DexSearchBar", "DexCategoryTabs", "DexResultList", "DexDetailPanel", "MoveCard"],
    states: [
      {id: "pokemon", name: "宝可梦"},
      {id: "megaMenu", name: "分类菜单"},
      {id: "moves", name: "技能"},
      {id: "trainerLocked", name: "训练师锁定"},
      {id: "expanded", name: "展开"},
    ],
    renderPreview(stateId) {
      const entries = stateId === "expanded" ? [dexPreviewPokemon] : dexEntriesForState(stateId);
      return (
        <div className="component-gallery-quick-dex-modal-stage">
          <QuickDexModal onClose={() => undefined} preview={{entries, category: entries[0]?.category || "pokemon", activeMega: stateId === "megaMenu" ? "pokemon" : null, expanded: stateId === "expanded"}} />
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
    id: "rental-candidate-card",
    name: "租赁候选卡",
    group: "setup",
    defaultSize: {width: 170, height: 54},
    componentFile: "apps/desktop/src/components/setup/rental-select/RentalCandidateCard.tsx",
    cssFile: "apps/desktop/src/components/setup/rental-select/RentalCandidateCard.css",
    cssVariablePrefix: "--rental-candidate-card-*",
    dependencies: ["PokemonSprite"],
    states: [
      {id: "normal", name: "普通"},
      {id: "focused", name: "聚焦"},
      {id: "selected", name: "已选"},
      {id: "legendary", name: "神兽"},
      {id: "battleSystem", name: "战斗系统"},
      {id: "longName", name: "长名字"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rental-card-stage">
          <RentalCandidateCardPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rental-candidate-list",
    name: "租赁候选列表",
    group: "setup",
    defaultSize: {width: 180, height: 210},
    componentFile: "apps/desktop/src/components/setup/rental-select/RentalCandidateList.tsx",
    cssFile: "apps/desktop/src/components/setup/rental-select/RentalCandidateList.css",
    cssVariablePrefix: "--rental-candidate-list-*",
    dependencies: ["RentalCandidateCard"],
    states: [
      {id: "sixCandidates", name: "6 候选"},
      {id: "twelveCandidates", name: "12 候选"},
      {id: "manyCandidates", name: "多候选"},
      {id: "empty", name: "空状态"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rental-list-stage">
          <RentalCandidateListPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rental-pokemon-detail",
    name: "租赁宝可梦详情",
    group: "setup",
    defaultSize: {width: 292, height: 210},
    componentFile: "apps/desktop/src/components/setup/rental-select/RentalPokemonDetail.tsx",
    cssFile: "apps/desktop/src/components/setup/rental-select/RentalPokemonDetail.css",
    cssVariablePrefix: "--rental-pokemon-detail-*",
    dependencies: ["PokemonProfile"],
    states: [
      {id: "normal", name: "普通"},
      {id: "selected", name: "已选"},
      {id: "hiddenTraining", name: "隐藏训练"},
      {id: "revealedTraining", name: "揭示训练"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rental-detail-stage">
          <RentalPokemonDetailPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rental-team-preview",
    name: "租赁队伍预览",
    group: "setup",
    defaultSize: {width: 150, height: 78},
    componentFile: "apps/desktop/src/components/setup/rental-select/RentalTeamPreview.tsx",
    cssFile: "apps/desktop/src/components/setup/rental-select/RentalTeamPreview.css",
    cssVariablePrefix: "--rental-team-preview-*",
    dependencies: ["PokemonSprite"],
    states: [
      {id: "empty", name: "空队伍"},
      {id: "partial", name: "部分选择"},
      {id: "full", name: "已满"},
      {id: "longName", name: "长名字"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rental-team-stage">
          <RentalTeamPreviewStage stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "scout-controls",
    name: "小道消息控制",
    group: "setup",
    defaultSize: {width: 150, height: 86},
    componentFile: "apps/desktop/src/components/setup/rental-select/ScoutControls.tsx",
    cssFile: "apps/desktop/src/components/setup/rental-select/ScoutControls.css",
    cssVariablePrefix: "--scout-controls-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "noCharges", name: "无次数"},
      {id: "inspected", name: "已验牌"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rental-scout-stage">
          <ScoutControls
            onBack={() => undefined}
            onReroll={() => undefined}
            onSingleReroll={() => undefined}
            onInspect={() => undefined}
            wholeRerollsRemaining={stateId === "noCharges" ? 0 : 1}
            singleRerollsRemaining={stateId === "noCharges" ? 0 : 2}
            inspectRemaining={stateId === "noCharges" ? 0 : 1}
            inspected={stateId === "inspected"}
          />
        </div>
      );
    },
  },
  {
    id: "rental-action-bar",
    name: "租赁动作条",
    group: "setup",
    defaultSize: {width: 488, height: 42},
    componentFile: "apps/desktop/src/components/setup/rental-select/RentalActionBar.tsx",
    cssFile: "apps/desktop/src/components/setup/rental-select/RentalActionBar.css",
    cssVariablePrefix: "--rental-action-bar-*",
    dependencies: [],
    states: [
      {id: "emptySelection", name: "未选择"},
      {id: "partialSelection", name: "部分选择"},
      {id: "ready", name: "可开始"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const selectedCount = stateId === "ready" ? 3 : stateId === "partialSelection" ? 1 : 0;
      return (
        <div className="component-gallery-rental-action-stage">
          <RentalActionBar selectedCount={selectedCount} candidateCount={12} focusIndex={0} runSeed={260614} originLabel={stateId === "longText" ? "很长很长的候选来源文案" : "本局候选"} onStart={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "rental-select-page",
    name: "租赁选队页面",
    group: "setup",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/setup/rental-select/RentalSelectPage.tsx",
    cssFile: "apps/desktop/src/components/setup/rental-select/RentalSelectPage.css",
    cssVariablePrefix: "--rental-select-page-*",
    dependencies: ["RentalCandidateList", "RentalPokemonDetail", "RentalTeamPreview", "ScoutControls", "RentalActionBar"],
    states: [
      {id: "normal", name: "普通"},
      {id: "manyCandidates", name: "多候选"},
      {id: "ready", name: "可开始"},
      {id: "noScoutCharges", name: "无次数"},
      {id: "loading", name: "加载中"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rental-page-stage">
          <RentalSelectPagePreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-header",
    name: "休整顶部菜单",
    group: "rest",
    defaultSize: {width: 488, height: 52},
    componentFile: "apps/desktop/src/components/rest/RestHeader.tsx",
    cssFile: "apps/desktop/src/components/rest/RestHeader.css",
    cssVariablePrefix: "--rest-header-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "lowCoins", name: "低金币"},
      {id: "nextDisabled", name: "下一场禁用"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-header-stage">
          <RestHeaderPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-toolbar",
    name: "休整工具切换栏",
    group: "rest",
    defaultSize: {width: 488, height: 48},
    componentFile: "apps/desktop/src/components/rest/RestToolBar.tsx",
    cssFile: "apps/desktop/src/components/rest/RestToolBar.css",
    cssVariablePrefix: "--rest-toolbar-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "manyTools", name: "多工具"},
      {id: "eventTools", name: "事件工具"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-toolbar-stage">
          <RestToolBarPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-pokemon-slot",
    name: "休整宝可梦格子",
    group: "rest",
    defaultSize: {width: 124, height: 60},
    componentFile: "apps/desktop/src/components/rest/team/RestPokemonSlot.tsx",
    cssFile: "apps/desktop/src/components/rest/team/RestPokemonSlot.css",
    cssVariablePrefix: "--rest-pokemon-slot-*",
    dependencies: ["PokemonSprite"],
    states: [
      {id: "normal", name: "普通"},
      {id: "selected", name: "选中"},
      {id: "lowHp", name: "低血量"},
      {id: "fainted", name: "濒死"},
      {id: "status", name: "异常"},
      {id: "longName", name: "长名字"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-slot-stage">
          <RestSlotPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-team-mini-card",
    name: "休整队伍竖版小卡",
    group: "rest",
    defaultSize: {width: 120, height: 90},
    componentFile: "apps/desktop/src/components/rest/team/RestTeamMiniCard.tsx",
    cssFile: "apps/desktop/src/components/rest/team/RestTeamMiniCard.css",
    cssVariablePrefix: "--rest-team-mini-card-*",
    dependencies: ["PokemonSprite"],
    states: [
      {id: "normal", name: "普通"},
      {id: "selected", name: "选中"},
      {id: "lowHp", name: "低血量"},
      {id: "fainted", name: "濒死"},
      {id: "status", name: "异常"},
      {id: "longName", name: "长名字"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-mini-card-stage">
          <RestTeamMiniCardPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-pokemon-profile-card",
    name: "休整宝可梦资料卡",
    group: "rest",
    defaultSize: {width: 154, height: 248},
    componentFile: "apps/desktop/src/components/rest/team/RestPokemonProfileCard.tsx",
    cssFile: "apps/desktop/src/components/rest/team/RestPokemonProfileCard.css",
    cssVariablePrefix: "--rest-pokemon-profile-card-*",
    dependencies: ["PokemonSprite"],
    states: [
      {id: "normal", name: "普通"},
      {id: "lowHp", name: "低血量"},
      {id: "status", name: "异常"},
      {id: "noItem", name: "无道具"},
      {id: "longName", name: "长名字"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-profile-stage">
          <RestProfilePreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-pokemon-move-grid",
    name: "休整技能区",
    group: "rest",
    defaultSize: {width: 244, height: 170},
    componentFile: "apps/desktop/src/components/rest/team/RestPokemonMoveGrid.tsx",
    cssFile: "apps/desktop/src/components/rest/team/RestPokemonMoveGrid.css",
    cssVariablePrefix: "--rest-pokemon-move-grid-*",
    dependencies: ["MoveCard"],
    states: [
      {id: "normal", name: "普通"},
      {id: "lowPp", name: "低 PP"},
      {id: "longMoveName", name: "长技能名"},
      {id: "emptyMove", name: "空技能"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-move-grid-stage">
          <RestMoveGridPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-pokemon-info-panel",
    name: "休整信息说明面板",
    group: "rest",
    defaultSize: {width: 244, height: 96},
    componentFile: "apps/desktop/src/components/rest/team/RestPokemonInfoPanel.tsx",
    cssFile: "apps/desktop/src/components/rest/team/RestPokemonInfoPanel.css",
    cssVariablePrefix: "--rest-pokemon-info-panel-*",
    dependencies: [],
    states: [
      {id: "ability", name: "特性"},
      {id: "item", name: "道具"},
      {id: "move", name: "技能"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-info-stage">
          <RestInfoPanelPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-selected-pokemon-detail",
    name: "休整选中宝可梦详情",
    group: "rest",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/rest/team/RestSelectedPokemonDetail.tsx",
    cssFile: "apps/desktop/src/components/rest/team/RestSelectedPokemonDetail.css",
    cssVariablePrefix: "--rest-selected-pokemon-detail-*",
    dependencies: ["PokemonHpBar", "PokemonSprite", "MoveCard"],
    states: [
      {id: "ability", name: "特性"},
      {id: "item", name: "道具"},
      {id: "move", name: "技能"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-selected-detail-stage">
          <RestSelectedPokemonDetailPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "rest-my-team-panel",
    name: "休整我的队伍",
    group: "rest",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/rest/team/RestMyTeamPanel.tsx",
    cssFile: "apps/desktop/src/components/rest/team/RestMyTeamPanel.css",
    cssVariablePrefix: "--rest-my-team-panel-*",
    dependencies: ["RestTeamMiniCard", "RestSelectedPokemonDetail", "PokemonHpBar", "MoveCard"],
    states: [
      {id: "normal", name: "普通"},
      {id: "sixPokemon", name: "六只队伍"},
      {id: "lowHpStatus", name: "低血量异常"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-rest-my-team-stage">
          <RestMyTeamPanel rest={restStateForPreview(stateId)} selectedSlot={0} onSelectSlot={() => undefined} onMove={() => undefined} onUseItem={() => undefined} onUnequip={() => undefined} onStats={() => undefined} onAction={() => undefined} />
        </div>
      );
    },
  },
  {
    id: "result-header",
    name: "结算标题栏",
    group: "result",
    defaultSize: {width: 360, height: 48},
    componentFile: "apps/desktop/src/components/result/ResultHeader.tsx",
    cssFile: "apps/desktop/src/components/result/ResultHeader.css",
    cssVariablePrefix: "--result-header-*",
    dependencies: [],
    states: [
      {id: "win", name: "胜利"},
      {id: "loss", name: "失败"},
      {id: "abort", name: "中断"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const summary = resultSummaryForState(stateId);
      return (
        <div className="component-gallery-result-header-stage">
          <ResultHeader outcome={summary.outcome} headline={summary.headline} subtitle={summary.subtitle || outcomeLabel(summary.outcome)} onBack={() => undefined} backLabel={stateId === "longText" ? "返回战绩列表" : "返回"} />
        </div>
      );
    },
  },
  {
    id: "result-settlement-grid",
    name: "结算收益网格",
    group: "result",
    defaultSize: {width: 280, height: 72},
    componentFile: "apps/desktop/src/components/result/ResultSettlementGrid.tsx",
    cssFile: "apps/desktop/src/components/result/ResultSettlementGrid.css",
    cssVariablePrefix: "--result-settlement-grid-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "empty", name: "空状态"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const summary = resultSummaryForState(stateId);
      return (
        <div className="component-gallery-result-settlement-stage">
          <ResultSettlementGrid rows={summary.coin_rows || []} />
        </div>
      );
    },
  },
  {
    id: "result-team-summary",
    name: "结算队伍摘要",
    group: "result",
    defaultSize: {width: 300, height: 98},
    componentFile: "apps/desktop/src/components/result/ResultTeamSummary.tsx",
    cssFile: "apps/desktop/src/components/result/ResultTeamSummary.css",
    cssVariablePrefix: "--result-team-summary-*",
    dependencies: ["PokemonSprite"],
    states: [
      {id: "normal", name: "普通"},
      {id: "empty", name: "空队伍"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const summary = resultSummaryForState(stateId);
      return (
        <div className="component-gallery-result-team-stage">
          {stateId === "empty" ? <PokemonResultDetail entry={null} /> : <ResultTeamSummary usedPokemon={summary.used_pokemon || []} />}
        </div>
      );
    },
  },
  {
    id: "result-progress-list",
    name: "结算挑战进度",
    group: "result",
    defaultSize: {width: 190, height: 150},
    componentFile: "apps/desktop/src/components/result/ResultProgressList.tsx",
    cssFile: "apps/desktop/src/components/result/ResultProgressList.css",
    cssVariablePrefix: "--result-progress-list-*",
    dependencies: ["TrainerSprite"],
    states: [
      {id: "normal", name: "普通"},
      {id: "noRounds", name: "无回合"},
      {id: "empty", name: "空状态"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-result-progress-stage">
          {stateId === "empty" ? <ProgressDetail row={null} /> : <ResultProgressPreview stateId={stateId} />}
        </div>
      );
    },
  },
  {
    id: "battle-round-list",
    name: "单场回合列表",
    group: "result",
    defaultSize: {width: 190, height: 150},
    componentFile: "apps/desktop/src/components/result/BattleRoundList.tsx",
    cssFile: "apps/desktop/src/components/result/BattleRoundList.css",
    cssVariablePrefix: "--battle-round-list-*",
    dependencies: ["TurnDetailPanel"],
    states: [
      {id: "normal", name: "普通"},
      {id: "empty", name: "空回合"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-result-round-stage">
          <BattleRoundPreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "turn-detail-panel",
    name: "回合详情面板",
    group: "result",
    defaultSize: {width: 210, height: 92},
    componentFile: "apps/desktop/src/components/result/TurnDetailPanel.tsx",
    cssFile: "apps/desktop/src/components/result/TurnDetailPanel.css",
    cssVariablePrefix: "--turn-detail-panel-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "empty", name: "空状态"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const turn = stateId === "empty" ? null : resultPreviewRecordWithTurns.turn_records?.[stateId === "longText" ? 2 : 1] || null;
      return (
        <div className="component-gallery-result-turn-stage">
          <TurnDetailPanel turn={turn} />
        </div>
      );
    },
  },
  {
    id: "result-page",
    name: "结算页面",
    group: "result",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/components/result/ResultPage.tsx",
    cssFile: "apps/desktop/src/components/result/ResultPage.css",
    cssVariablePrefix: "--result-page-*",
    dependencies: ["ResultHeader", "ResultSettlementGrid", "ResultTeamSummary", "ResultProgressList", "BattleRoundList"],
    states: [
      {id: "normal", name: "普通"},
      {id: "loss", name: "失败"},
      {id: "abort", name: "中断"},
      {id: "empty", name: "空状态"},
      {id: "noRounds", name: "无回合"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-result-page-stage">
          <ResultPagePreview stateId={stateId} />
        </div>
      );
    },
  },
  {
    id: "route-transition-video",
    name: "转场视频背景",
    group: "shell",
    defaultSize: {width: 360, height: 150},
    componentFile: "apps/desktop/src/pages/shell/RouteTransitionVideo.tsx",
    cssFile: "apps/desktop/src/pages/shell/RouteTransitionVideo.css",
    cssVariablePrefix: "--route-transition-video-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "fallback", name: "无视频"},
    ],
    renderPreview(stateId) {
      return (
        <div className="component-gallery-route-video-stage">
          <RouteTransitionVideo disabled={stateId === "fallback"} />
        </div>
      );
    },
  },
  {
    id: "route-transition-copy-panel",
    name: "转场文案面板",
    group: "shell",
    defaultSize: {width: 420, height: 96},
    componentFile: "apps/desktop/src/pages/shell/RouteTransitionCopyPanel.tsx",
    cssFile: "apps/desktop/src/pages/shell/RouteTransitionCopyPanel.css",
    cssVariablePrefix: "--route-transition-copy-panel-*",
    dependencies: [],
    states: [
      {id: "normal", name: "普通"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const copy = stateId === "longText"
        ? {title: "这是一段非常长的转场标题", detail: "正在读取很长很长的路线数据说明", tip: "长提示用于确认中转页底部文案不会遮挡关键画面，也不会把进度条挤出固定区域。"}
        : routeTransitionCopy("battleMain", "battleStart");
      return (
        <div className="component-gallery-route-copy-stage" style={{"--route-transition-duration": "3600ms"} as CSSProperties}>
          <RouteTransitionCopyPanel title={copy.title} detail={copy.detail} tip={copy.tip} />
        </div>
      );
    },
  },
  {
    id: "route-transition-page",
    name: "路线中转页",
    group: "shell",
    defaultSize: {width: 488, height: 150},
    componentFile: "apps/desktop/src/pages/shell/RouteTransitionPage.tsx",
    cssFile: "apps/desktop/src/pages/shell/RouteTransitionPage.css",
    cssVariablePrefix: "--route-transition-page-*",
    dependencies: ["RouteTransitionVideo", "RouteTransitionCopyPanel"],
    states: [
      {id: "battle", name: "进战斗"},
      {id: "rest", name: "进休整"},
      {id: "result", name: "进结算"},
      {id: "fallback", name: "无视频"},
      {id: "longText", name: "长文本"},
    ],
    renderPreview(stateId) {
      const copy = stateId === "rest"
        ? routeTransitionCopy("rest", "battleComplete")
        : stateId === "result"
          ? routeTransitionCopy("result", "settlement")
          : stateId === "longText"
            ? {title: "非常长的路线中转页标题", detail: "正在处理很长很长的转场详情文案", tip: "这条提示非常长，用来确认两行截断和底部区域高度稳定。", durationMs: 4200}
            : routeTransitionCopy("battleMain", "battleStart");
      return (
        <div className="component-gallery-route-page-stage">
          <RouteTransitionPage {...copy} videoDisabled={stateId === "fallback"} />
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
