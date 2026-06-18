import type {BattleState} from "@changebattle/shared";

type BattleViewModel = NonNullable<BattleState["battle_view"]>;
type BattleViewSide = BattleViewModel["player"];
type BattleViewSlot = BattleViewSide["slots"][number];

function normalizedShowdownId(value: string | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function cloneBattleViewSnapshot(view: BattleState["battle_view"] | undefined): BattleState["battle_view"] | undefined {
  return view ? JSON.parse(JSON.stringify(view)) as BattleViewModel : undefined;
}

function slotIdentityKeys(slot: BattleViewSlot, fallbackKey: string): string[] {
  return [
    `key:${slot.key || fallbackKey}`,
    slot.run_member_id ? `member:${slot.run_member_id}` : "",
    slot.showdown_id ? `showdown:${normalizedShowdownId(slot.showdown_id)}` : "",
  ].filter(Boolean);
}

function dedupeBattleViewSideSlots(side: BattleViewSide | undefined): BattleViewSide | undefined {
  if (!side) return side;
  const seen = new Set<string>();
  const slots: BattleViewSlot[] = [];
  for (const [index, slot] of side.slots.entries()) {
    const keys = slotIdentityKeys(slot, `${side.side}-${slot.slot || index + 1}`);
    if (keys.some(key => seen.has(key))) continue;
    keys.forEach(key => seen.add(key));
    slots.push(slot);
  }
  const activeSlotIndex = slots.findIndex(slot => slot.active);
  const active_index = activeSlotIndex >= 0 ? activeSlotIndex : Math.min(Math.max(0, side.active_index), Math.max(0, slots.length - 1));
  return {...side, slots, active_index};
}

export function dedupeBattleViewPartySnapshot(view: BattleState["battle_view"] | undefined): BattleState["battle_view"] | undefined {
  if (!view) return view;
  return {
    player: dedupeBattleViewSideSlots(view.player) || view.player,
    enemy: dedupeBattleViewSideSlots(view.enemy) || view.enemy,
  };
}
