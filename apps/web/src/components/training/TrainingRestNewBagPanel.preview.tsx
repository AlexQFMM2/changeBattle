import {useEffect, useMemo, useState} from "react";
import type {ChangeBattleV2Api, PlayerItemInstanceV4, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {TrainingRestNewBagPanel} from "./TrainingRestNewBagPanel";
import "./TrainingRestNewBagPanel.preview.css";

type BagPreviewVariant = "standard" | "empty" | "long";

const TEST_BAG_ITEM_IDS = [
  "leftovers",
  "lifeorb",
  "oranberry",
  "potion",
  "ether",
  "rarecandy",
  "tm:thunderbolt",
  "tm:protect",
  "system-mega-stone",
  "system-z-crystal",
  "system-tera-orb",
];

export function TrainingRestNewBagPanelPreview({api}: {api: ChangeBattleV2Api}) {
  const [variant, setVariant] = useState<BagPreviewVariant>("standard");
  const [open, setOpen] = useState(true);
  const initialRun = useMemo(() => createPreviewRun(api, variant), [api, variant]);
  const [run, setRun] = useState(initialRun);
  const [message, setMessage] = useState("预览：背包组件独立显示。");

  useEffect(() => {
    setRun(initialRun);
    setOpen(true);
    setMessage(variant === "empty" ? "预览：空背包状态。" : "预览：背包组件独立显示。");
  }, [initialRun, variant]);

  function updateRunDraft(nextRun: TrainingRunGameV4, nextMessage: string) {
    setRun(nextRun);
    setMessage(nextMessage);
  }

  return (
    <section className="training-rest-new-bag-preview-canvas" aria-label="我的背包组件预览">
      <div className="training-rest-new-bag-preview-bg" aria-hidden="true" />
      <div className="training-rest-new-bag-preview-controls" aria-label="预览状态">
        {([
          ["standard", "普通"],
          ["empty", "空背包"],
          ["long", "长列表"],
        ] as const).map(([id, label]) => (
          <button className={variant === id ? "active" : ""} type="button" onClick={() => setVariant(id)} key={id}>{label}</button>
        ))}
        {!open ? <button type="button" onClick={() => setOpen(true)}>打开</button> : null}
      </div>
      <TrainingRestNewBagPanel
        api={api}
        open={open}
        run={run}
        onClose={() => setOpen(false)}
        onRunDraftChange={updateRunDraft}
      />
      <span className="training-rest-new-bag-preview-message">{message}</span>
    </section>
  );
}

function createPreviewRun(api: ChangeBattleV2Api, variant: BagPreviewVariant): TrainingRunGameV4 {
  const base = api.createTrainingRunFromScenario(api.createTrainingRunGame({
    id: "component-preview-profile",
    name: "预览训练师",
    avatarAsset: "/npc/avatars/6-asset-a73f3e71.webp",
  }));
  const p1 = base.players.p1;
  if (!p1) return base;
  const items = variant === "empty" ? [] : createPreviewItems(api, variant);
  const team = p1.localTeam.pokemon.slice(0, 4).map((pokemon, index) => ({
    ...pokemon,
    nameZh: index === 1 && variant === "long" ? "超长名字测试宝可梦" : pokemon.nameZh,
    entryHp: Math.max(1, Math.floor(pokemon.maxHp * ([0.92, 0.54, 0.26, 1][index] || 1))),
    itemId: index === 0 && items[0] ? items[0].itemID : "",
    heldItemInstanceId: index === 0 && items[0] ? items[0].id : undefined,
  }));
  const nextP1: TrainingPlayerDraftV4 = {
    ...p1,
    localTeam: {...p1.localTeam, pokemon: team},
    bag: {...api.normalizeBagState(p1.bag), items, maxSize: 50},
  };
  return patchP1(base, nextP1);
}

function createPreviewItems(api: ChangeBattleV2Api, variant: BagPreviewVariant): PlayerItemInstanceV4[] {
  const sourceIds = variant === "long"
    ? [...TEST_BAG_ITEM_IDS, ...TEST_BAG_ITEM_IDS, "choicescarf", "choiceband", "choicespecs", "sitrusberry", "lumberry"]
    : TEST_BAG_ITEM_IDS;
  return sourceIds.map((itemID, index) => api.createItemInstance(itemID, {
    id: `preview-item-${index + 1}-${itemID.replace(/[^a-z0-9]+/gi, "-")}`,
    name: variant === "long" && index === 2 ? "很长很长的树果名字测试" : undefined,
  }));
}

function patchP1(run: TrainingRunGameV4, p1: TrainingPlayerDraftV4): TrainingRunGameV4 {
  const players = {...run.players, p1};
  return {
    ...run,
    players,
    scenario: {
      ...run.scenario,
      players: run.scenario.players.map(player => player.playerId === "p1" ? p1 : player),
    },
  };
}
