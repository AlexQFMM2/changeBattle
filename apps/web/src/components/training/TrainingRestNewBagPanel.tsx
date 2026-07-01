import {useMemo, useState} from "react";
import type {ChangeBattleV2Api, DexItemDetail, DexSystemBattleReforgeOption, LocalPokemonV4, PlayerItemInstanceV4, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {applyRecoveryItemToPokemonV4, applyTmItemToPokemonV4, applyTrainingItemToPokemonV4, canUseRecoveryItemV4, canUseTmItemV4, canUseTrainingItemV4, clearConsumedItemFromTeamV4, tmMoveIdForItemV4, tmUseFailureReasonV4} from "@changebattle-v2/api";
import {PlayerBagPanel, itemDetailFor, type PlayerBagAction, type PlayerBagPokemonTarget} from "./PlayerBagPanel";
import {PokemonMoveReplacePanel} from "./PokemonMoveReplacePanel";
import {PokemonSystemReforgePanel} from "./PokemonSystemReforgePanel";

export type TrainingRestNewBagPanelProps = {
  api: ChangeBattleV2Api;
  open: boolean;
  run: TrainingRunGameV4;
  onClose: () => void;
  onRunDraftChange: (run: TrainingRunGameV4, message: string) => void;
  onNotice?: (message: string, tone?: "normal" | "danger") => void;
};

const EQUIPPABLE_ITEM_KINDS = new Set(["battle", "held", "berry", "special"]);

export function TrainingRestNewBagPanel({api, open, run, onClose, onRunDraftChange, onNotice}: TrainingRestNewBagPanelProps) {
  const p1 = run.players.p1 || null;
  const bag = useMemo(() => api.normalizeBagState(p1?.bag), [api, p1?.bag]);
  const team = p1?.localTeam.pokemon || [];
  const [selection, setSelection] = useState<{item: PlayerItemInstanceV4 | null; target: PlayerBagPokemonTarget | null}>({item: bag.items[0] || null, target: null});
  const [tmReplace, setTmReplace] = useState<{item: PlayerItemInstanceV4; pokemonId: string} | null>(null);
  const [systemReforge, setSystemReforge] = useState<{item: PlayerItemInstanceV4; pokemonId: string} | null>(null);
  const selectedItem = selection.item;
  const selectedPokemon = selection.target ? team.find(pokemon => pokemon.localPokemonId === selection.target?.key) || null : team[0] || null;
  const selectedDetail = useMemo(() => itemDetailFor(api, selectedItem), [api, selectedItem]);
  const equipEligibility = selectedItem ? getBagItemEquipEligibility(selectedItem, selectedDetail) : {canEquip: false, reason: "请选择道具"};
  const canUseRecovery = canUseRecoveryItemV4(selectedItem, selectedDetail);
  const canUseTraining = canUseTrainingItemV4(selectedItem, selectedDetail);
  const canUseTm = canUseTmItemV4(selectedItem, selectedDetail);
  const selectedMachineMoves = useMemo(() => selectedPokemon ? api.getPokemonMachineSkills(selectedPokemon.speciesId) : [], [api, selectedPokemon]);
  const tmFailureReason = canUseTm ? tmUseFailureReasonV4({item: selectedItem, detail: selectedDetail, pokemon: selectedPokemon, machineMoves: selectedMachineMoves}) : "";
  const canUseItemKind = canUseRecovery || canUseTraining || canUseTm;
  const canDiscard = Boolean(selectedItem && !isSystemItem(selectedItem, selectedDetail));
  const selectedHeldItem = selectedPokemon ? itemForPokemon(api, bag.items, selectedPokemon) : null;
  const canUntake = Boolean(selectedPokemon && (selectedPokemon.heldItemInstanceId || selectedPokemon.itemId));
  const heldItemIds = useMemo(() => buildHeldItemIds(team), [team]);
  const targets = useMemo(() => team.map(pokemonToTarget(api, bag.items)), [api, bag.items, team]);
  const tmReplaceItem = tmReplace ? bag.items.find(item => item.id === tmReplace.item.id) || null : null;
  const tmReplacePokemon = tmReplace ? team.find(pokemon => pokemon.localPokemonId === tmReplace.pokemonId) || null : null;
  const tmReplaceDetail = useMemo(() => itemDetailFor(api, tmReplaceItem), [api, tmReplaceItem]);
  const tmReplaceMoveId = tmMoveIdForItemV4(tmReplaceItem, tmReplaceDetail);
  const tmReplaceMove = useMemo(() => tmReplaceMoveId ? moveDetailFor(api, tmReplaceMoveId) : null, [api, tmReplaceMoveId]);
  const systemReforgeItem = systemReforge ? bag.items.find(item => item.id === systemReforge.item.id) || null : null;
  const systemReforgePokemon = systemReforge ? team.find(pokemon => pokemon.localPokemonId === systemReforge.pokemonId) || null : null;
  const systemReforgeOptions = useMemo(() => systemReforgeItem && systemReforgePokemon ? api.getSystemBattleReforgeOptions(systemReforgeItem.itemID, systemReforgePokemon) : [], [api, systemReforgeItem, systemReforgePokemon]);

  function equipSelectedItem() {
    if (!p1 || !selectedItem || !selectedPokemon || !equipEligibility.canEquip) return;
    const heldItemPatch = heldItemPatchForEquip(selectedItem);
    const nextTeam = {
      ...p1.localTeam,
      pokemon: p1.localTeam.pokemon.map(pokemon => {
        if (pokemon.localPokemonId === selectedPokemon.localPokemonId) {
          return {...pokemon, ...heldItemPatch};
        }
        if (systemExclusiveKind(selectedItem) && pokemonHasSystemExclusiveKind(pokemon, selectedItem.systemReforgeKind)) return {...pokemon, itemId: "", heldItemInstanceId: undefined};
        if (pokemon.heldItemInstanceId === selectedItem.id) {
          return {...pokemon, itemId: "", heldItemInstanceId: undefined};
        }
        return pokemon;
      }),
    };
    const nextRun = patchP1(run, {...p1, localTeam: nextTeam});
    onRunDraftChange(nextRun, "背包已更新，记得手动保存。");
  }

  function openSystemReforge() {
    if (!selectedItem || !selectedPokemon || !isRecastCandidate(selectedItem)) return;
    setSystemReforge({item: selectedItem, pokemonId: selectedPokemon.localPokemonId});
  }

  function confirmSystemReforge(option: DexSystemBattleReforgeOption) {
    if (!p1 || !systemReforgeItem || !systemReforgePokemon) return;
    const nextSystemItem = applySystemReforgeOption(systemReforgeItem, option);
    const nextBag = {
      ...bag,
      items: bag.items.map(item => item.id === systemReforgeItem.id ? nextSystemItem : item),
    };
    const nextTeam = option.kind === "mega" || option.kind === "z-crystal"
      ? {
        ...p1.localTeam,
        pokemon: p1.localTeam.pokemon.map(pokemon => {
          if (pokemon.localPokemonId === systemReforgePokemon.localPokemonId) {
            return {...pokemon, itemId: option.mappedItemId || "", heldItemInstanceId: undefined};
          }
          if (pokemonHasSystemExclusiveKind(pokemon, option.kind)) return {...pokemon, itemId: "", heldItemInstanceId: undefined};
          return pokemon;
        }),
      }
      : p1.localTeam;
    const nextRun = patchP1(run, {...p1, bag: nextBag, localTeam: nextTeam});
    setSystemReforge(null);
    const message = option.kind === "mega" || option.kind === "z-crystal"
      ? `${systemReforgePokemon.nameZh || systemReforgePokemon.name} 已携带 ${option.nameZh || option.name}。`
      : `${systemReforgeItem.name} 已重铸为 ${option.nameZh || option.name}。`;
    onNotice?.(message);
    onRunDraftChange(nextRun, `${message} 记得手动保存。`);
  }

  function untakeSelectedPokemonItem() {
    if (!p1 || !selectedPokemon || !canUntake) return;
    const nextTeam = {
      ...p1.localTeam,
      pokemon: p1.localTeam.pokemon.map(pokemon => pokemon.localPokemonId === selectedPokemon.localPokemonId
        ? {...pokemon, itemId: "", heldItemInstanceId: undefined}
        : pokemon),
    };
    const nextRun = patchP1(run, {...p1, localTeam: nextTeam});
    const heldName = selectedHeldItem?.name || itemName(api, selectedPokemon.itemId) || "携带道具";
    onRunDraftChange(nextRun, `${selectedPokemon.nameZh || selectedPokemon.name} 已卸下${heldName}，记得手动保存。`);
  }

  function discardSelectedItem() {
    if (!p1 || !selectedItem || !canDiscard) return;
    const nextBag = {...bag, items: bag.items.filter(item => item.id !== selectedItem.id)};
    const nextTeam = {
      ...p1.localTeam,
      pokemon: p1.localTeam.pokemon.map(pokemon => pokemon.heldItemInstanceId === selectedItem.id
        ? {...pokemon, itemId: "", heldItemInstanceId: undefined}
        : pokemon),
    };
    const nextRun = patchP1(run, {...p1, bag: nextBag, localTeam: nextTeam});
    onRunDraftChange(nextRun, "背包已更新，记得手动保存。");
  }

  function noticeUseFailure(reason: string) {
    const message = reason || "该道具当前不能立即使用。";
    onNotice?.(message, "danger");
    onRunDraftChange(run, message);
  }

  function useSelectedItem() {
    if (!p1 || !selectedItem || !selectedPokemon) return;
    if (!canUseItemKind) {
      noticeUseFailure("该道具当前不能立即使用。");
      return;
    }
    if (canUseTm) {
      if (tmFailureReason) {
        noticeUseFailure(tmFailureReason);
        return;
      }
      setTmReplace({item: selectedItem, pokemonId: selectedPokemon.localPokemonId});
      return;
    }
    const result = canUseRecovery
      ? applyRecoveryItemToPokemonV4({
        item: selectedItem,
        detail: selectedDetail,
        pokemon: selectedPokemon,
        bag,
        team,
      })
      : applyTrainingItemToPokemonV4({
        item: selectedItem,
        detail: selectedDetail,
        pokemon: selectedPokemon,
        bag,
        pokemonDetail: pokemonDetailFor(api, selectedPokemon),
        calculateMaxHp: pokemon => calculateMaxHp(api, pokemon),
      });
    if (!result.ok) {
      noticeUseFailure(result.reason);
      return;
    }
    const consumedClearedTeam = clearConsumedItemFromTeamV4(p1.localTeam.pokemon, selectedItem);
    const nextTeam = {
      ...p1.localTeam,
      pokemon: consumedClearedTeam.map(pokemon => pokemon.localPokemonId === selectedPokemon.localPokemonId ? result.pokemon : pokemon),
    };
    const nextRun = patchP1(run, {...p1, bag: result.bag, localTeam: nextTeam});
    onNotice?.(result.message);
    onRunDraftChange(nextRun, `${result.message} 记得手动保存。`);
  }

  function confirmTmReplace(moveSlot: number) {
    if (!p1 || !tmReplaceItem || !tmReplacePokemon) return;
    const result = applyTmItemToPokemonV4({
      item: tmReplaceItem,
      detail: tmReplaceDetail,
      pokemon: tmReplacePokemon,
      bag,
      machineMoves: api.getPokemonMachineSkills(tmReplacePokemon.speciesId),
      moveSlot,
    });
    if (!result.ok) {
      onNotice?.(result.reason, "danger");
      onRunDraftChange(run, result.reason);
      return;
    }
    const consumedClearedTeam = clearConsumedItemFromTeamV4(p1.localTeam.pokemon, tmReplaceItem);
    const nextTeam = {
      ...p1.localTeam,
      pokemon: consumedClearedTeam.map(pokemon => pokemon.localPokemonId === tmReplacePokemon.localPokemonId ? result.pokemon : pokemon),
    };
    const nextRun = patchP1(run, {...p1, bag: result.bag, localTeam: nextTeam});
    setTmReplace(null);
    onNotice?.(result.message);
    onRunDraftChange(nextRun, `${result.message} 记得手动保存。`);
  }

  const actions: PlayerBagAction[] = [
    {
      key: "take",
      label: "立即携带",
      disabled: !selectedItem || !selectedPokemon || !equipEligibility.canEquip,
      title: equipEligibility.reason,
      onClick: equipSelectedItem,
    },
    {
      key: "untake",
      label: "卸下道具",
      disabled: !canUntake,
      title: canUntake ? `卸下${selectedPokemon?.nameZh || selectedPokemon?.name || ""}身上的道具` : "选中宝可梦没有携带道具",
      onClick: untakeSelectedPokemonItem,
    },
    {
      key: "use",
      label: "立即使用",
      disabled: !selectedItem || !selectedPokemon || !canUseItemKind,
      title: canUseItemKind ? tmFailureReason || "对选中宝可梦立即使用" : "该道具当前不能立即使用。",
      onClick: useSelectedItem,
    },
    {
      key: "recast",
      label: selectedItem && selectedItem.itemID !== "system-tera-orb" && isRecastCandidate(selectedItem) ? "重铸并使用" : "重铸",
      disabled: !selectedItem || !isRecastCandidate(selectedItem),
      onClick: openSystemReforge,
    },
    {
      key: "discard",
      label: "丢弃",
      danger: true,
      disabled: !selectedItem || !canDiscard,
      onClick: discardSelectedItem,
    },
  ].filter(action => actionVisibleForItem(action.key, selectedItem, selectedDetail, {canUntake, canUseItem: canUseItemKind, canDiscard}));

  return (
    <>
      <PlayerBagPanel
        api={api}
        open={open}
        items={bag.items}
        maxSize={bag.maxSize}
        pokemonTargets={targets}
        heldItemIds={heldItemIds}
        actions={actions}
        onClose={() => {
          setTmReplace(null);
          setSystemReforge(null);
          onClose();
        }}
        onSelectionChange={nextSelection => {
          setSelection(current => {
            if (current.item?.id === nextSelection.item?.id && current.target?.key === nextSelection.target?.key) return current;
            return nextSelection;
          });
        }}
      />
      {open && tmReplacePokemon && tmReplaceMove ? (
        <PokemonMoveReplacePanel
          pokemon={tmReplacePokemon}
          newMove={tmReplaceMove}
          onCancel={() => setTmReplace(null)}
          onConfirm={confirmTmReplace}
        />
      ) : null}
      {open && systemReforgeItem && systemReforgePokemon ? (
        <PokemonSystemReforgePanel
          pokemon={systemReforgePokemon}
          item={systemReforgeItem}
          options={systemReforgeOptions}
          emptyReason={systemReforgeEmptyReason(systemReforgeItem)}
          onCancel={() => setSystemReforge(null)}
          onConfirm={confirmSystemReforge}
        />
      ) : null}
    </>
  );
}

function patchP1(run: TrainingRunGameV4, p1: TrainingPlayerDraftV4): TrainingRunGameV4 {
  const nextPlayers = {...run.players, p1};
  const nextScenarioPlayers = run.scenario.players.map(player => player.playerId === "p1" ? p1 : player);
  const nextGameMap = run.gameMap.map(node => node.id === run.currentNodeId
    ? {...node, participants: {...node.participants, p1}}
    : node);
  return {
    ...run,
    players: nextPlayers,
    scenario: {...run.scenario, players: nextScenarioPlayers},
    gameMap: nextGameMap,
    updatedAt: new Date().toISOString(),
  };
}

function getBagItemEquipEligibility(item: PlayerItemInstanceV4, detail: DexItemDetail | null): {canEquip: boolean; reason: string} {
  if (isRecastCandidate(item) && !systemItemReadyToEquip(item)) return {canEquip: false, reason: "请先重铸这个系统战斗道具。"};
  if (item.itemID === "system-tera-orb") return {canEquip: false, reason: "太晶珠是玩家级配置，不需要给宝可梦携带。"};
  if (item.canTake || detail?.canTake || (detail && EQUIPPABLE_ITEM_KINDS.has(detail.kind))) return {canEquip: true, reason: ""};
  if (["battle", "held", "berry"].includes(item.type)) return {canEquip: true, reason: ""};
  return {canEquip: false, reason: "该道具当前不能携带。"};
}

function buildHeldItemIds(team: LocalPokemonV4[]): Set<string> {
  const ids = new Set<string>();
  for (const pokemon of team) {
    if (pokemon.heldItemInstanceId) ids.add(pokemon.heldItemInstanceId);
  }
  return ids;
}

function isSystemItem(item: PlayerItemInstanceV4, detail: DexItemDetail | null): boolean {
  return item.type === "system" || item.type === "system-battle" || item.itemID.startsWith("system-") || detail?.source === "system";
}

function isRecastCandidate(item: PlayerItemInstanceV4): boolean {
  return item.itemID === "system-mega-stone" || item.itemID === "system-z-crystal" || item.itemID === "system-tera-orb";
}

function actionVisibleForItem(
  key: string,
  item: PlayerItemInstanceV4 | null,
  detail: DexItemDetail | null,
  state: {canUntake: boolean; canUseItem: boolean; canDiscard: boolean},
): boolean {
  if (!item) return false;
  if (key === "take") return getBagItemEquipEligibility(item, detail).canEquip;
  if (key === "untake") return state.canUntake;
  if (key === "use") return state.canUseItem;
  if (key === "recast") return isRecastCandidate(item);
  if (key === "discard") return state.canDiscard;
  return true;
}

function systemItemReadyToEquip(item: PlayerItemInstanceV4): boolean {
  if (item.itemID === "system-mega-stone" || item.itemID === "system-z-crystal") return Boolean(item.mappedItemId);
  if (item.itemID === "system-tera-orb") return Boolean(item.mappedTeraType);
  return true;
}

function heldItemPatchForEquip(item: PlayerItemInstanceV4): Pick<LocalPokemonV4, "itemId" | "heldItemInstanceId"> {
  if ((item.itemID === "system-mega-stone" || item.itemID === "system-z-crystal") && item.mappedItemId) {
    return {itemId: item.mappedItemId, heldItemInstanceId: undefined};
  }
  return {itemId: item.itemID, heldItemInstanceId: item.id};
}

function systemExclusiveKind(item: PlayerItemInstanceV4): PlayerItemInstanceV4["systemReforgeKind"] {
  return item.systemReforgeKind === "mega" || item.systemReforgeKind === "z-crystal" ? item.systemReforgeKind : undefined;
}

function pokemonHasSystemExclusiveKind(pokemon: LocalPokemonV4, kind: PlayerItemInstanceV4["systemReforgeKind"]): boolean {
  if (!kind || !pokemon.itemId) return false;
  if (kind === "mega") return /ite(?:x|y)?$/.test(pokemon.itemId);
  if (kind === "z-crystal") return /iumz$/.test(pokemon.itemId);
  return false;
}

function applySystemReforgeOption(item: PlayerItemInstanceV4, option: DexSystemBattleReforgeOption): PlayerItemInstanceV4 {
  return {
    ...item,
    mappedItemId: option.mappedItemId,
    mappedItemName: option.mappedItemId ? option.name : undefined,
    mappedItemNameZh: option.mappedItemId ? option.nameZh : undefined,
    mappedItemIconUrl: option.iconUrl,
    mappedTeraType: option.mappedTeraType,
    mappedTeraTypeZh: option.mappedTeraTypeZh,
    systemReforgeKind: option.kind,
  };
}

function systemReforgeEmptyReason(item: PlayerItemInstanceV4): string {
  if (item.itemID === "system-mega-stone") return "当前宝可梦没有可用 Mega 石。";
  if (item.itemID === "system-z-crystal") return "当前宝可梦与技能没有可用 Z 纯晶。";
  if (item.itemID === "system-tera-orb") return "当前没有可用太晶属性。";
  return "当前没有可用重铸选项。";
}

function pokemonDetailFor(api: ChangeBattleV2Api, pokemon: LocalPokemonV4) {
  try {
    return api.getPokemonDetail(pokemon.speciesId);
  } catch {
    return null;
  }
}

function moveDetailFor(api: ChangeBattleV2Api, moveId: string) {
  try {
    return api.getMoveDetail(moveId);
  } catch {
    return null;
  }
}

function calculateMaxHp(api: ChangeBattleV2Api, pokemon: LocalPokemonV4): number {
  try {
    return api.dex.calculatePokemonStats({
      speciesId: pokemon.speciesId,
      level: pokemon.level,
      nature: pokemon.nature,
      evs: pokemon.evs,
      ivs: pokemon.ivs,
    }).stats.hp;
  } catch {
    return pokemon.maxHp;
  }
}

function pokemonToTarget(api: ChangeBattleV2Api, items: PlayerItemInstanceV4[]): (pokemon: LocalPokemonV4) => PlayerBagPokemonTarget {
  return pokemon => ({
    key: pokemon.localPokemonId,
    name: pokemon.name,
    nameZh: pokemon.nameZh,
    level: pokemon.level,
    hp: pokemon.entryHp,
    maxHp: pokemon.maxHp,
    status: pokemon.entryStatus,
    iconUrl: pokemon.iconUrl,
    spriteUrl: pokemon.spriteUrl,
    iconStyle: pokemon.iconStyle,
    heldItem: itemForPokemon(api, items, pokemon),
  });
}

function itemForPokemon(api: ChangeBattleV2Api, items: PlayerItemInstanceV4[], pokemon: LocalPokemonV4): PlayerItemInstanceV4 | null {
  if (pokemon.heldItemInstanceId) return items.find(item => item.id === pokemon.heldItemInstanceId) || null;
  if (pokemon.itemId) return items.find(item => item.itemID === pokemon.itemId) || displayItemInstance(api, pokemon.itemId);
  return null;
}

function displayItemInstance(api: ChangeBattleV2Api, itemId: string): PlayerItemInstanceV4 {
  let name = itemId;
  let image = "";
  try {
    const detail = api.getItemDetail(itemId);
    name = detail.nameZh || detail.name || itemId;
    image = detail.iconUrl || "";
  } catch {
    // Keep item id as fallback display.
  }
  return {
    id: `display-${itemId}`,
    itemID: itemId,
    name,
    image,
    cost: 0,
    canSale: false,
    type: "held",
    canBattleUse: false,
    canUse: false,
    canUseToPokemon: false,
    canTake: true,
    effectRound: null,
    getRound: 0,
    maxUseCount: null,
    useCount: 0,
  };
}

function itemName(api: ChangeBattleV2Api, itemId: string): string {
  if (!itemId) return "";
  try {
    const detail = api.getItemDetail(itemId);
    return detail.nameZh || detail.name || itemId;
  } catch {
    return itemId;
  }
}
