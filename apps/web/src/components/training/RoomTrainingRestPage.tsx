import {useEffect, useMemo, useState} from "react";
import {motion} from "motion/react";
import type {
  DexStatId,
  FormalRoomRestActionV1,
  FormalRestShopV4,
  FormalShopItemV4,
  FormalTrainingGroundApplyInputV4,
} from "@changebattle-v2/api";
import {assetUrl} from "../../lib/assetUrl";
import type {RoomRestDisplayModel} from "./TrainingRestRoomDisplayModel";
import "./RoomTrainingRestPage.css";

type RoomTrainingRestPageProps = {
  display: RoomRestDisplayModel;
  busyMessage?: string | null;
  initialNotice?: string | null;
  onInitialNoticeConsumed?: () => void;
  onBackToRoom: () => void;
  onStartBattle: () => Promise<void> | void;
  onProceedToSettlement?: () => Promise<void> | void;
  onAbandonRun?: () => Promise<void> | void;
  onOpenDex: () => void;
  onOpenPokemonDex: (speciesId: string) => void;
  onRoundSettlementSeen?: (nodeId: string) => void;
  onTeamReorderSave: (pokemonIds: string[]) => Promise<void> | void;
  onRestAction: (action: FormalRoomRestActionV1) => Promise<{message: string; result?: unknown}> | {message: string; result?: unknown};
};

type RoomRestPanel = "team" | "bag" | "shop" | "training" | "preview" | "exchange" | "log";

export function RoomTrainingRestPage({display, busyMessage, initialNotice, onInitialNoticeConsumed, onBackToRoom, onStartBattle, onProceedToSettlement, onAbandonRun, onOpenDex, onOpenPokemonDex, onRoundSettlementSeen, onTeamReorderSave, onRestAction}: RoomTrainingRestPageProps) {
  const [panel, setPanel] = useState<RoomRestPanel>("team");
  const [message, setMessage] = useState(initialNotice || "休息室已就绪。");
  const [localBusy, setLocalBusy] = useState<string | null>(null);
  const [orderDraft, setOrderDraft] = useState<string[]>(() => display.team.map(entry => entry.pokemonId));
  const [toast, setToast] = useState<{message: string; tone: "normal" | "danger"} | null>(null);
  const activeBusy = busyMessage || localBusy;
  const firstPokemonId = display.team[0]?.pokemonId || "";
  const firstSellableItemId = display.bag?.items.find(item => item.item.canSale)?.itemInstanceId || "";
  const firstBagItemId = display.bag?.items[0]?.itemInstanceId || "";
  const shopItems = useMemo(() => shopProducts(display.shop), [display.shop]);
  const firstShopProduct = useMemo(() => {
    return shopItems.find(item => Math.floor(Number(item.stock || 0)) > 0) || null;
  }, [shopItems]);
  const selfStudyLesson = display.trainingGround.lessons.find(lesson => lesson.kind === "self-study") || display.trainingGround.lesson || display.trainingGround.lessons[0] || null;

  useEffect(() => {
    setOrderDraft(display.team.map(entry => entry.pokemonId));
  }, [display.id, display.team]);

  useEffect(() => {
    if (!initialNotice) return;
    setMessage(initialNotice);
    setToast({message: initialNotice, tone: "normal"});
    onInitialNoticeConsumed?.();
  }, [initialNotice, onInitialNoticeConsumed]);

  async function withBusy(label: string, task: () => Promise<string> | string) {
    setLocalBusy(label);
    try {
      const nextMessage = await task();
      setMessage(nextMessage);
      setToast({message: nextMessage, tone: "normal"});
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "操作失败。";
      setMessage(nextMessage);
      setToast({message: nextMessage, tone: "danger"});
      throw error;
    } finally {
      setLocalBusy(null);
    }
  }

  async function submitAction(label: string, action: FormalRoomRestActionV1) {
    await withBusy(label, async () => {
      const response = await onRestAction(action);
      return response.message || "操作完成。";
    });
  }

  function moveOrder(pokemonId: string, delta: -1 | 1) {
    setOrderDraft(current => {
      const index = current.indexOf(pokemonId);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  async function saveOrder() {
    await withBusy("正在保存顺序", async () => {
      await onTeamReorderSave(orderDraft);
      return "队伍顺序已保存。";
    });
  }

  async function applyTraining() {
    if (!selfStudyLesson || !firstPokemonId) throw new Error("当前没有可学习的课程或宝可梦。");
    const input: FormalTrainingGroundApplyInputV4 = {
      pokemonId: firstPokemonId,
      lessonId: selfStudyLesson.lessonId,
      lessonKind: selfStudyLesson.kind,
    };
    await submitAction("正在学习中", {type: "training.apply", input: input as unknown as Record<string, unknown>});
  }

  async function rerollFirstPokemon(part: "ivs" | "evs") {
    if (!firstPokemonId) throw new Error("当前队伍没有可重随的宝可梦。");
    await submitAction("正在重随中", {type: "pokemon.reroll-stats", input: {pokemonId: firstPokemonId, part, lockedStats: [] as DexStatId[]}});
  }

  async function unlockFirstPreview() {
    const trainer = display.nextPreview?.trainers[0];
    const pokemon = trainer?.team[0];
    if (!pokemon) throw new Error("当前没有可打听的对手宝可梦。");
    const localPokemon = pokemon.localPokemon;
    const unlockKey = `${display.nextPreview?.nodeId || display.currentNode?.nodeId || "node"}:${trainer.slot}:${localPokemon.localPokemonId || pokemon.pokemonId}`;
    await submitAction("正在打听中", {type: "opponent-preview.unlock", input: {unlockKey}});
  }

  async function exchangeFirstPokemon() {
    const sourcePokemonId = display.exchange?.player?.localTeam.pokemon.find(pokemon => pokemon.localPokemonId)?.localPokemonId || firstPokemonId;
    const targetPokemonId = display.exchange?.opponent?.localTeam.pokemon[0]?.localPokemonId || "";
    if (!display.exchange?.available || !sourcePokemonId || !targetPokemonId) throw new Error(display.exchange?.message || "当前不能交换。");
    await submitAction("正在交换中", {type: "pokemon.exchange", sourcePokemonId, targetPokemonId});
  }

  async function startBattleAfterValidation() {
    const requiredLeadCount = display.mode === "doubles" ? 2 : 1;
    const leads = display.team.slice(0, requiredLeadCount);
    if (leads.length < requiredLeadCount) throw new Error(display.mode === "doubles" ? "双打需要至少两只首发宝可梦。" : "当前队伍没有可首发宝可梦。");
    const faintedLead = leads.find(entry => Math.floor(Number(entry.localPokemon.entryHp || 0)) <= 0);
    if (faintedLead) throw new Error(`首发不能是濒死宝可梦：${pokemonName(faintedLead)}。`);
    await withBusy("正在进入战斗", async () => {
      await onStartBattle();
      return "正在进入战斗。";
    });
  }

  return (
    <motion.section className="room-training-rest-page" initial={{opacity: 0, scale: 0.985}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.18}} aria-label="房间休整页">
      <img className="room-training-rest-bg" src={assetUrl("training/rest-center-bg.png")} alt="" />
      <header className="room-training-rest-topbar">
        <button type="button" onClick={onBackToRoom}>返回房间</button>
        <strong>{display.currentNode ? `第 ${display.currentNode.index + 1} 场休整` : "正式房间休整"}</strong>
        <span>金币 {display.money.toLocaleString()}</span>
      </header>

      <nav className="room-training-rest-nav" aria-label="休整操作">
        <button type="button" data-active={panel === "team"} onClick={() => setPanel("team")}>我的队伍</button>
        <button type="button" data-active={panel === "bag"} onClick={() => setPanel("bag")}>我的背包</button>
        <button type="button" data-active={panel === "shop"} onClick={() => setPanel("shop")}>商店</button>
        <button type="button" data-active={panel === "training"} onClick={() => setPanel("training")}>训练场</button>
        <button type="button" data-active={panel === "preview"} onClick={() => setPanel("preview")}>下一场预览</button>
        <button type="button" data-active={panel === "exchange"} onClick={() => setPanel("exchange")}>交换</button>
        <button type="button" data-active={panel === "log"} onClick={() => setPanel("log")}>记录</button>
      </nav>

      <main className="room-training-rest-panel">
        {panel === "team" ? (
          <section>
            <h2>我的队伍</h2>
            <div className="room-training-rest-team">
              {orderDraft.map((pokemonId, index) => {
                const entry = display.team.find(item => item.pokemonId === pokemonId);
                if (!entry) return null;
                return (
                  <article key={pokemonId} className="room-training-rest-pokemon">
                    <button type="button" onClick={() => onOpenPokemonDex(entry.localPokemon.speciesId)}>{pokemonName(entry)}</button>
                    <span>HP {Math.max(0, Math.floor(Number(entry.localPokemon.entryHp || 0)))}/{Math.max(1, Math.floor(Number(entry.localPokemon.maxHp || 1)))}</span>
                    <div>
                      <button type="button" disabled={index === 0} onClick={() => moveOrder(pokemonId, -1)}>上移</button>
                      <button type="button" disabled={index >= orderDraft.length - 1} onClick={() => moveOrder(pokemonId, 1)}>下移</button>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="room-training-rest-actions">
              <button type="button" onClick={() => void saveOrder()}>保存顺序</button>
              <button type="button" onClick={() => void submitAction("正在治疗中", {type: "team.heal"})}>治疗</button>
              <button type="button" onClick={() => void rerollFirstPokemon("ivs")}>重随个体</button>
              <button type="button" onClick={() => void rerollFirstPokemon("evs")}>重随努力</button>
            </div>
          </section>
        ) : null}

        {panel === "bag" ? (
          <section>
            <h2>我的背包</h2>
            <p>{display.bag ? `${display.bag.items.length}/${display.bag.maxSize}` : "背包未同步"}</p>
            <div className="room-training-rest-list">
              {(display.bag?.items || []).map(item => <span key={item.itemInstanceId}>{item.item.name || item.item.itemID}</span>)}
            </div>
            <div className="room-training-rest-actions">
              <button type="button" disabled={!firstBagItemId || !firstPokemonId} onClick={() => void submitAction("正在使用道具", {type: "bag.use", itemInstanceId: firstBagItemId, pokemonId: firstPokemonId})}>使用首个道具</button>
              <button type="button" disabled={!firstBagItemId || !firstPokemonId} onClick={() => void submitAction("正在携带道具", {type: "bag.equip", itemInstanceId: firstBagItemId, pokemonId: firstPokemonId})}>携带首个道具</button>
              <button type="button" disabled={!firstPokemonId} onClick={() => void submitAction("正在卸下道具", {type: "bag.unequip", pokemonId: firstPokemonId})}>卸下携带物</button>
              <button type="button" disabled={!firstBagItemId} onClick={() => void submitAction("正在丢弃道具", {type: "bag.discard", itemInstanceId: firstBagItemId})}>丢弃首个道具</button>
            </div>
          </section>
        ) : null}

        {panel === "shop" ? (
          <section>
            <h2>商店</h2>
            <div className="room-training-rest-list">
              {shopItems.map(item => <span key={item.slotId}>{item.itemID} x{item.stock}</span>)}
            </div>
            <div className="room-training-rest-actions">
              <button type="button" disabled={!firstShopProduct} onClick={() => firstShopProduct ? void submitAction("正在购买中", {type: "shop.buy", slotId: firstShopProduct.slotId}) : undefined}>购买首个商品</button>
              <button type="button" disabled={!firstSellableItemId} onClick={() => void submitAction("正在出售中", {type: "shop.sell", itemInstanceIds: [firstSellableItemId]})}>出售首个可售道具</button>
            </div>
          </section>
        ) : null}

        {panel === "training" ? (
          <section>
            <h2>训练场</h2>
            <div className="room-training-rest-list">
              {display.trainingGround.lessons.map(lesson => <span key={lesson.lessonId}>{lesson.teacherLabel} {lesson.fee} 金币</span>)}
            </div>
            <div className="room-training-rest-actions">
              <button type="button" disabled={!selfStudyLesson || !firstPokemonId} onClick={() => void applyTraining()}>学习一课</button>
            </div>
          </section>
        ) : null}

        {panel === "preview" ? (
          <section>
            <h2>{display.nextPreview?.rank || "下一场预览"}</h2>
            <div className="room-training-rest-list">
              {(display.nextPreview?.trainers || []).map(trainer => <button key={trainer.playerId} type="button" onClick={() => trainer.team[0] ? onOpenPokemonDex(trainer.team[0].localPokemon.speciesId) : undefined}>{trainer.name}</button>)}
            </div>
            <div className="room-training-rest-actions">
              <button type="button" onClick={() => void unlockFirstPreview()}>打听首个对手</button>
            </div>
          </section>
        ) : null}

        {panel === "exchange" ? (
          <section>
            <h2>交换</h2>
            <p>{display.exchange?.message || "当前没有可交换目标。"}</p>
            <div className="room-training-rest-actions">
              <button type="button" disabled={!display.exchange?.available} onClick={() => void exchangeFirstPokemon()}>交换首个目标</button>
            </div>
          </section>
        ) : null}

        {panel === "log" ? (
          <section>
            <h2>记录</h2>
            <div className="room-training-rest-list">
              {(display.coinLog || []).slice(-8).map(entry => <span key={entry.id}>{entry.label} {entry.amount > 0 ? "+" : ""}{entry.amount}</span>)}
              {(display.battleLog || []).slice(-4).map(entry => <span key={entry.id}>{entry.rawLine}</span>)}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="room-training-rest-footer">
        <span>{message}</span>
        <button type="button" onClick={onOpenDex}>图鉴</button>
        {display.roundSettlement ? <button type="button" onClick={() => onRoundSettlementSeen?.(display.roundSettlement!.nodeId)}>知道了</button> : null}
        {display.pendingSettlement ? (
          <button type="button" onClick={() => void withBusy("正在结算中", async () => {
            await onProceedToSettlement?.();
            return "正在进入结算。";
          })}>去结算</button>
        ) : (
          <button type="button" onClick={() => void startBattleAfterValidation()}>结束休整</button>
        )}
        <button type="button" onClick={() => void withBusy("正在放弃中", async () => {
          await onAbandonRun?.();
          return "正在进入结算。";
        })}>放弃比赛</button>
      </footer>

      {toast ? <div className="room-training-rest-toast" data-tone={toast.tone}>{toast.message}</div> : null}
      {activeBusy ? (
        <div className="room-training-rest-busy" role="alert" aria-live="assertive">
          <section>
            <strong>{activeBusy}</strong>
            <span>等待服务器返回</span>
          </section>
        </div>
      ) : null}
    </motion.section>
  );
}

function pokemonName(entry: RoomRestDisplayModel["team"][number]): string {
  return entry.localPokemon.nickname || entry.localPokemon.nameZh || entry.localPokemon.name || entry.localPokemon.speciesId || "宝可梦";
}

function shopProducts(shop: FormalRestShopV4 | null | undefined): FormalShopItemV4[] {
  if (!shop) return [];
  return Object.values(shop.categories).flatMap(items => items);
}
