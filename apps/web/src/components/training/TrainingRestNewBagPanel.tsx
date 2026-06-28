import {useMemo, useState} from "react";
import type {ChangeBattleV2Api, DexItemDetail, LocalPokemonV4, PlayerItemInstanceV4, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {applyRecoveryItemToPokemonV4, canUseRecoveryItemV4, clearConsumedItemFromTeamV4} from "@changebattle-v2/api";
import {PlayerBagPanel, itemDetailFor, type PlayerBagAction, type PlayerBagPokemonTarget} from "./PlayerBagPanel";

export type TrainingRestNewBagPanelProps = {
  api: ChangeBattleV2Api;
  open: boolean;
  run: TrainingRunGameV4;
  onClose: () => void;
  onRunDraftChange: (run: TrainingRunGameV4, message: string) => void;
};

const EQUIPPABLE_ITEM_KINDS = new Set(["battle", "held", "berry", "special"]);

export function TrainingRestNewBagPanel({api, open, run, onClose, onRunDraftChange}: TrainingRestNewBagPanelProps) {
  const p1 = run.players.p1 || null;
  const bag = useMemo(() => api.normalizeBagState(p1?.bag), [api, p1?.bag]);
  const team = p1?.localTeam.pokemon || [];
  const [selection, setSelection] = useState<{item: PlayerItemInstanceV4 | null; target: PlayerBagPokemonTarget | null}>({item: bag.items[0] || null, target: null});
  const selectedItem = selection.item;
  const selectedPokemon = selection.target ? team.find(pokemon => pokemon.localPokemonId === selection.target?.key) || null : team[0] || null;
  const selectedDetail = useMemo(() => itemDetailFor(api, selectedItem), [api, selectedItem]);
  const equipEligibility = selectedItem ? getBagItemEquipEligibility(selectedItem, selectedDetail) : {canEquip: false, reason: "请选择道具"};
  const canUseRecovery = canUseRecoveryItemV4(selectedItem, selectedDetail);
  const canDiscard = Boolean(selectedItem && !isSystemItem(selectedItem, selectedDetail));
  const selectedHeldItem = selectedPokemon ? itemForPokemon(bag.items, selectedPokemon) : null;
  const canUntake = Boolean(selectedPokemon && (selectedPokemon.heldItemInstanceId || selectedPokemon.itemId));
  const heldItemIds = useMemo(() => buildHeldItemIds(team), [team]);
  const targets = useMemo(() => team.map(pokemonToTarget(bag.items)), [bag.items, team]);

  function equipSelectedItem() {
    if (!p1 || !selectedItem || !selectedPokemon || !equipEligibility.canEquip) return;
    const nextTeam = {
      ...p1.localTeam,
      pokemon: p1.localTeam.pokemon.map(pokemon => {
        if (pokemon.localPokemonId === selectedPokemon.localPokemonId) {
          return {...pokemon, itemId: selectedItem.itemID, heldItemInstanceId: selectedItem.id};
        }
        if (pokemon.heldItemInstanceId === selectedItem.id) {
          return {...pokemon, itemId: "", heldItemInstanceId: undefined};
        }
        return pokemon;
      }),
    };
    const nextRun = patchP1(run, {...p1, localTeam: nextTeam});
    onRunDraftChange(nextRun, "背包已更新，记得手动保存。");
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
    const itemName = selectedHeldItem?.name || "携带道具";
    onRunDraftChange(nextRun, `${selectedPokemon.nameZh || selectedPokemon.name} 已卸下${itemName}，记得手动保存。`);
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

  function useSelectedItem() {
    if (!p1 || !selectedItem || !selectedPokemon || !canUseRecovery) return;
    const result = applyRecoveryItemToPokemonV4({
      item: selectedItem,
      detail: selectedDetail,
      pokemon: selectedPokemon,
      bag,
      team,
    });
    if (!result.ok) {
      onRunDraftChange(run, result.reason);
      return;
    }
    const consumedClearedTeam = clearConsumedItemFromTeamV4(p1.localTeam.pokemon, selectedItem);
    const nextTeam = {
      ...p1.localTeam,
      pokemon: consumedClearedTeam.map(pokemon => pokemon.localPokemonId === selectedPokemon.localPokemonId ? result.pokemon : pokemon),
    };
    const nextRun = patchP1(run, {...p1, bag: result.bag, localTeam: nextTeam});
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
      disabled: !selectedItem || !selectedPokemon || !canUseRecovery,
      title: canUseRecovery ? "对选中宝可梦立即使用" : "该道具当前不能立即使用。",
      onClick: useSelectedItem,
    },
    {
      key: "recast",
      label: "重铸",
      disabled: !selectedItem || !isRecastCandidate(selectedItem, selectedDetail),
      onClick: () => onRunDraftChange(run, "重铸功能后续开放。"),
    },
    {
      key: "discard",
      label: "丢弃",
      danger: true,
      disabled: !selectedItem || !canDiscard,
      onClick: discardSelectedItem,
    },
  ];

  return (
    <PlayerBagPanel
      api={api}
      open={open}
      items={bag.items}
      maxSize={bag.maxSize}
      pokemonTargets={targets}
      heldItemIds={heldItemIds}
      actions={actions}
      onClose={onClose}
      onSelectionChange={nextSelection => {
        setSelection(current => {
          if (current.item?.id === nextSelection.item?.id && current.target?.key === nextSelection.target?.key) return current;
          return nextSelection;
        });
      }}
    />
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

function isRecastCandidate(item: PlayerItemInstanceV4, detail: DexItemDetail | null): boolean {
  return item.itemID === "system-mega-stone" || item.itemID === "system-z-crystal" || item.itemID === "system-tera-orb" || detail?.kind === "system-battle";
}

function pokemonToTarget(items: PlayerItemInstanceV4[]): (pokemon: LocalPokemonV4) => PlayerBagPokemonTarget {
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
    heldItem: itemForPokemon(items, pokemon),
  });
}

function itemForPokemon(items: PlayerItemInstanceV4[], pokemon: LocalPokemonV4): PlayerItemInstanceV4 | null {
  if (pokemon.heldItemInstanceId) return items.find(item => item.id === pokemon.heldItemInstanceId) || null;
  if (pokemon.itemId) return items.find(item => item.itemID === pokemon.itemId) || null;
  return null;
}
