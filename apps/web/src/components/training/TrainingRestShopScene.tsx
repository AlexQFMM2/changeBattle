import {useEffect, useMemo, useRef, useState} from "react";
import type {ChangeBattleV2Api, DexItemDetail, DexItemRecoveryEffect, DexItemTrainingEffect, FormalRestShopV4, FormalShopProductViewV4, LocalPokemonV4, TrainingMoveSlotV4, TrainingPlayerDraftV4} from "@changebattle-v2/api";
import {TrainingRestShopBuyList} from "./TrainingRestShopBuyList";
import {TrainingRestShopDialogue} from "./TrainingRestShopDialogue";
import {TrainingRestShopInteractionPanel, type TrainingRestShopInteractionMode} from "./TrainingRestShopInteractionPanel";
import "./TrainingRestShopScene.css";

export type TrainingRestShopSceneProps = {
  api?: ChangeBattleV2Api;
  open: boolean;
  shop?: FormalRestShopV4 | null;
  player?: TrainingPlayerDraftV4 | null;
  money: number;
  busy?: boolean;
  onBuy?: (slotId: string) => Promise<string> | string;
  onBack: () => void;
};

const SHOP_WELCOME_TEXT = "欢迎光临，今天想要做些什么呢";
const SHOP_BUY_TEXT = "想看看今天的货物吗？";
const SHOP_SELL_TEXT = "需要整理背包里的道具吗？";
const SHOP_BREAK_ANIMATION_MS = 840;
const SHOP_RESTOCK_ANIMATION_MS = 720;
const SHOP_STAT_LABELS = {hp: "HP", atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度"} as const;
const SHOP_CONFUSION_HEAL_BERRY_IDS = new Set(["figyberry", "wikiberry", "magoberry", "aguavberry", "iapapaberry"]);
const SHOP_RESIST_BERRY_EFFECTS: Record<string, {attackType: string; attackTypeZh: string; weakTo: string[]; superEffective?: boolean}> = {
  occaberry: {attackType: "Fire", attackTypeZh: "火", weakTo: ["Grass", "Ice", "Bug", "Steel"]},
  passhoberry: {attackType: "Water", attackTypeZh: "水", weakTo: ["Fire", "Ground", "Rock"]},
  wacanberry: {attackType: "Electric", attackTypeZh: "电", weakTo: ["Water", "Flying"]},
  rindoberry: {attackType: "Grass", attackTypeZh: "草", weakTo: ["Water", "Ground", "Rock"]},
  yacheberry: {attackType: "Ice", attackTypeZh: "冰", weakTo: ["Grass", "Ground", "Flying", "Dragon"]},
  chopleberry: {attackType: "Fighting", attackTypeZh: "格斗", weakTo: ["Normal", "Ice", "Rock", "Dark", "Steel"]},
  kebiaberry: {attackType: "Poison", attackTypeZh: "毒", weakTo: ["Grass", "Fairy"]},
  shucaberry: {attackType: "Ground", attackTypeZh: "地面", weakTo: ["Fire", "Electric", "Poison", "Rock", "Steel"]},
  cobaberry: {attackType: "Flying", attackTypeZh: "飞行", weakTo: ["Grass", "Fighting", "Bug"]},
  payapaberry: {attackType: "Psychic", attackTypeZh: "超能力", weakTo: ["Fighting", "Poison"]},
  tangaberry: {attackType: "Bug", attackTypeZh: "虫", weakTo: ["Grass", "Psychic", "Dark"]},
  chartiberry: {attackType: "Rock", attackTypeZh: "岩石", weakTo: ["Fire", "Ice", "Flying", "Bug"]},
  kasibberry: {attackType: "Ghost", attackTypeZh: "幽灵", weakTo: ["Psychic", "Ghost"]},
  habanberry: {attackType: "Dragon", attackTypeZh: "龙", weakTo: ["Dragon"]},
  colburberry: {attackType: "Dark", attackTypeZh: "恶", weakTo: ["Psychic", "Ghost"]},
  babiriberry: {attackType: "Steel", attackTypeZh: "钢", weakTo: ["Ice", "Rock", "Fairy"]},
  chilanberry: {attackType: "Normal", attackTypeZh: "一般", weakTo: [], superEffective: false},
  roseliberry: {attackType: "Fairy", attackTypeZh: "妖精", weakTo: ["Fighting", "Dragon", "Dark"]},
};

export function TrainingRestShopScene({api, open, shop, player, money, busy = false, onBuy, onBack}: TrainingRestShopSceneProps) {
  const [dialogueText, setDialogueText] = useState(SHOP_WELCOME_TEXT);
  const [interactionMode, setInteractionMode] = useState<TrainingRestShopInteractionMode | null>(null);
  const [selectedShopItem, setSelectedShopItem] = useState<FormalShopProductViewV4 | null>(null);
  const [buyingSlotId, setBuyingSlotId] = useState<string | null>(null);
  const [breakingSlotId, setBreakingSlotId] = useState<string | null>(null);
  const [breakingProduct, setBreakingProduct] = useState<FormalShopProductViewV4 | null>(null);
  const [restockingSlotId, setRestockingSlotId] = useState<string | null>(null);
  const pendingRestockRef = useRef<{slotId: string; itemID: string} | null>(null);
  const animationTimersRef = useRef<number[]>([]);
  const shopProducts = useMemo(() => api?.createFormalShopProductViews ? api.createFormalShopProductViews(shop) : [], [api, shop]);
  const slotItemIds = useMemo(() => new Map(shopProducts.map(product => [product.slotId, product.itemID])), [shopProducts]);
  const latestSlotItemIdsRef = useRef(slotItemIds);

  useEffect(() => {
    latestSlotItemIdsRef.current = slotItemIds;
    playRestockIfReady();
  }, [slotItemIds]);

  useEffect(() => {
    return () => {
      for (const timer of animationTimersRef.current) window.clearTimeout(timer);
      animationTimersRef.current = [];
    };
  }, []);

  function queueAnimationTimer(callback: () => void, delayMs: number) {
    const timer = window.setTimeout(() => {
      animationTimersRef.current = animationTimersRef.current.filter(entry => entry !== timer);
      callback();
    }, delayMs);
    animationTimersRef.current.push(timer);
  }

  function playRestockIfReady() {
    const pending = pendingRestockRef.current;
    if (!pending) return;
    const nextItemID = latestSlotItemIdsRef.current.get(pending.slotId);
    if (!nextItemID || nextItemID === pending.itemID) return;
    pendingRestockRef.current = null;
    setRestockingSlotId(pending.slotId);
    queueAnimationTimer(() => {
      setBreakingSlotId(current => current === pending.slotId ? null : current);
      setBreakingProduct(current => current?.slotId === pending.slotId ? null : current);
    }, 80);
    queueAnimationTimer(() => setRestockingSlotId(current => current === pending.slotId ? null : current), SHOP_RESTOCK_ANIMATION_MS);
  }

  function leaveShop() {
    setDialogueText(SHOP_WELCOME_TEXT);
    setInteractionMode(null);
    setSelectedShopItem(null);
    setBreakingSlotId(null);
    setBreakingProduct(null);
    setRestockingSlotId(null);
    pendingRestockRef.current = null;
    onBack();
  }

  function openInteractionMode(mode: TrainingRestShopInteractionMode) {
    setInteractionMode(mode);
    setSelectedShopItem(null);
    setDialogueText(mode === "buy" ? SHOP_BUY_TEXT : SHOP_SELL_TEXT);
  }

  function closeInteractionMode() {
    setInteractionMode(null);
    setSelectedShopItem(null);
    setDialogueText(SHOP_WELCOME_TEXT);
    setBreakingSlotId(null);
    setBreakingProduct(null);
    setRestockingSlotId(null);
    pendingRestockRef.current = null;
  }

  function showShopItemDetail(item: FormalShopProductViewV4) {
    setSelectedShopItem(item);
    setDialogueText(buildShopItemPitch(api, player, item));
  }

  function closeShopItemDetail() {
    setSelectedShopItem(null);
    setDialogueText(SHOP_BUY_TEXT);
  }

  async function buyShopItem(item: FormalShopProductViewV4) {
    if (!onBuy) {
      setDialogueText("购买功能正在整理中。");
      return;
    }
    setBuyingSlotId(item.slotId);
    try {
      const message = await onBuy(item.slotId);
      pendingRestockRef.current = {slotId: item.slotId, itemID: item.itemID};
      setBreakingProduct(item);
      setBreakingSlotId(item.slotId);
      queueAnimationTimer(playRestockIfReady, 0);
      queueAnimationTimer(() => {
        setBreakingSlotId(current => current === item.slotId ? null : current);
        setBreakingProduct(current => current?.slotId === item.slotId ? null : current);
        pendingRestockRef.current = pendingRestockRef.current?.slotId === item.slotId ? null : pendingRestockRef.current;
      }, SHOP_BREAK_ANIMATION_MS);
      setSelectedShopItem(null);
      setDialogueText(message || "购买完成。");
    } catch (error) {
      setDialogueText(shopBuyErrorMessage(error));
    } finally {
      setBuyingSlotId(null);
    }
  }

  const selectedItemName = selectedShopItem?.name;
  const dialogueActions = selectedShopItem
    ? [
        {label: "返回", onClick: closeShopItemDetail},
        {label: "立即购买", primary: true, onClick: () => void buyShopItem(selectedShopItem)},
      ]
    : interactionMode
    ? [{label: "返回", onClick: closeInteractionMode}]
    : [
        {label: "离开", onClick: leaveShop},
        {label: "售出", onClick: () => openInteractionMode("sell")},
        {label: "购买", primary: true, onClick: () => openInteractionMode("buy")},
      ];

  return (
    <section className="training-rest-shop-scene" data-open={open ? "true" : "false"} aria-label="休整商店场景" aria-hidden={!open}>
      <img className="training-rest-shop-scene-back" src="/shop/rest-store/back-lounge-menu-v4-640.png" alt="" draggable={false} />
      <div className="training-rest-shop-scene-money" aria-label="当前金币">
        <img src="/aboutIcon/coin.png" alt="" draggable={false} />
        <strong>{Math.max(0, Math.floor(money)).toLocaleString()}</strong>
      </div>
      {busy ? <div className="training-rest-shop-scene-busy" role="status">整理商店中</div> : null}
      <TrainingRestShopInteractionPanel mode={interactionMode}>
        {interactionMode === "buy" ? (
          <TrainingRestShopBuyList
            products={shopProducts}
            selectedSlotId={selectedShopItem?.slotId}
            buyingSlotId={buyingSlotId}
            breakingSlotId={breakingSlotId}
            breakingProduct={breakingProduct}
            restockingSlotId={restockingSlotId}
            onDetail={showShopItemDetail}
            onBuy={item => void buyShopItem(item)}
          />
        ) : null}
      </TrainingRestShopInteractionPanel>
      <TrainingRestShopDialogue
        speaker="店员"
        itemName={selectedItemName}
        text={dialogueText}
        actions={dialogueActions}
      />
    </section>
  );
}

function buildShopItemPitch(api: ChangeBattleV2Api | undefined, player: TrainingPlayerDraftV4 | null | undefined, item: FormalShopProductViewV4): string {
  if (!api || !player) return item.summary;
  const team = player.localTeam.pokemon || [];
  if (!team.length) return item.summary;
  if (item.type === "recovery" || item.type === "berry") {
    const pitch = buildRecoveryItemPitch(api, team, item);
    if (pitch) return pitch;
  }
  if (item.type === "training") {
    const pitch = buildTrainingItemPitch(api, team, item);
    if (pitch) return pitch;
  }
  if (item.type === "battle") return buildBattleItemPitch(api, team, item);
  if (item.type === "tm") return buildTmItemPitch(api, team, item);
  return item.summary;
}

function buildRecoveryItemPitch(api: ChangeBattleV2Api, team: LocalPokemonV4[], item: FormalShopProductViewV4): string {
  const detail = safeItemDetail(api, item.itemID);
  const effect = detail?.recoveryEffect;
  if (!effect) {
    const berryPitch = item.type === "berry" ? buildHeldBerryPitch(api, team, item) : "";
    if (berryPitch) return berryPitch;
    return "";
  }
  const effectText = recoveryEffectText(effect);
  if (effect.revive) {
    const fainted = team.find(pokemon => pokemon.entryHp <= 0);
    if (fainted) return `我的天，${pokemonName(fainted)}已经撑不住了。${item.name}能${effectText}，现在买一份很合适。`;
    return `${item.name}能${effectText}。现在队伍还站得住，但备一个，真到倒下的时候就不会慌。`;
  }
  if (effect.hp) {
    const wounded = team
      .filter(pokemon => pokemon.entryHp > 0 && pokemon.entryHp < pokemon.maxHp)
      .sort((a, b) => a.entryHp / Math.max(1, a.maxHp) - b.entryHp / Math.max(1, b.maxHp))[0];
    if (wounded) return `我的天，你的${pokemonName(wounded)}受伤了。${item.name}能${effectText}，这时候买很实在。`;
    return `${item.name}能${effectText}。现在大家状态不错，带着以防万一就很安心。`;
  }
  if (effect.pp) {
    const ppNeed = lowestTeamPpNeed(team);
    if (ppNeed) return `${pokemonName(ppNeed.pokemon)}的${moveName(ppNeed.move)}快用干了。${item.name}能${effectText}，关键战前补一下很值。`;
    return `${item.name}能${effectText}。现在 PP 压力不大，但长线作战时很容易派上用场。`;
  }
  if (effect.cureStatus) {
    const statusPokemon = team.find(pokemon => pokemon.entryStatus);
    if (statusPokemon) return `${pokemonName(statusPokemon)}身上有异常状态。${item.name}能${effectText}，买了马上就能安心很多。`;
    return `${item.name}能${effectText}。现在用不上最好，真遇到麻烦时手里有它就不怕。`;
  }
  return `${item.name}能${item.summary}。带着以防万一吧。`;
}

function buildHeldBerryPitch(api: ChangeBattleV2Api, team: LocalPokemonV4[], item: FormalShopProductViewV4): string {
  const itemID = normalizeShopId(item.itemID);
  const resistBerry = SHOP_RESIST_BERRY_EFFECTS[itemID];
  if (resistBerry) {
    const target = pickTypeWeakPokemon(api, team, resistBerry.weakTo);
    const trigger = resistBerry.superEffective === false
      ? `受到${resistBerry.attackTypeZh}属性招式时`
      : `受到效果绝佳的${resistBerry.attackTypeZh}属性招式时`;
    const effect = `${item.name}可以让携带者在${trigger}，减轻一次伤害。`;
    if (target) return `${effect}你的${pokemonName(target)}比较怕${resistBerry.attackTypeZh}系招式，带着它能少吃一次关键伤害。`;
    return `${effect}如果之后队伍里有怕${resistBerry.attackTypeZh}系的宝可梦，它就是很便宜的保险。`;
  }
  if (SHOP_CONFUSION_HEAL_BERRY_IDS.has(itemID)) {
    const target = pickProfiledPokemon(api, team, ["bulky", "support", "pivot"]) || team.find(pokemon => pokemon.entryHp > 0) || team[0];
    const effect = `${item.name}会在携带者血量很低时回复大量 HP，但性格不合可能会混乱。`;
    if (target) return `${effect}像${pokemonName(target)}这种需要多站一回合的队员，可以考虑备一颗。`;
    return `${effect}给耐久宝可梦带着，常常能多撑一回合。`;
  }
  return item.summary ? `${item.name}的效果是：${item.summary}。想让宝可梦携带时，先看清触发条件再买最稳。` : "";
}

function buildTrainingItemPitch(api: ChangeBattleV2Api, team: LocalPokemonV4[], item: FormalShopProductViewV4): string {
  const detail = safeItemDetail(api, item.itemID);
  const effect = detail?.trainingEffect;
  if (!effect) return item.summary ? `${item.name}挺实用的。${item.summary}，后面整理队伍时用得上。` : "";
  if (effect.kind === "level") {
    const target = team.filter(pokemon => pokemon.level < 100).sort((a, b) => a.level - b.level)[0];
    if (target) return `${item.name}能让宝可梦提升等级。你的${pokemonName(target)}现在 Lv.${target.level}，给它用会很划算。`;
    return `${item.name}能提升等级，不过你的队伍等级已经很漂亮了，先备着也可以。`;
  }
  if (effect.kind === "ev") {
    const statLabel = SHOP_STAT_LABELS[effect.stat] || effect.stat;
    const target = pickEvTrainingTarget(team, effect);
    if (target) return `${item.name}能调整${statLabel}努力值。你的${pokemonName(target)}还有提升空间，训练一下会更稳。`;
    return `${item.name}能调整${statLabel}努力值。现在队伍这项暂时不急，之后换配置时可以备着。`;
  }
  if (effect.kind === "nature") {
    const target = pickProfiledPokemon(api, team, ["attacker", "sweeper", "support", "bulky"]);
    return target
      ? `${item.name}能调整性格。像${pokemonName(target)}这种有明确定位的宝可梦，性格调对了手感会差很多。`
      : `${item.name}能调整性格。想微调速度线或输出手感时，它会很方便。`;
  }
  if (effect.kind === "ability") {
    const target = team.find(pokemon => pokemon.entryHp > 0) || team[0];
    return target
      ? `${item.name}能切换特性。你的${pokemonName(target)}如果有备用特性路线，可以用它试出新的打法。`
      : `${item.name}能切换特性。现在先备着，之后遇到合适队员就能用。`;
  }
  if (effect.kind === "iv") {
    const target = pickIvTrainingTarget(team, effect.mode);
    if (target) return `${item.name}能调整个体值。给${pokemonName(target)}打磨一下，细节会更漂亮。`;
    return `${item.name}能调整个体值。队伍现在不一定急用，但培养核心时很关键。`;
  }
  return item.summary;
}

function buildBattleItemPitch(api: ChangeBattleV2Api, team: LocalPokemonV4[], item: FormalShopProductViewV4): string {
  const target = pickBattleItemTarget(api, team, item.itemID);
  const effect = item.summary || "能帮队伍多一个战术选择";
  if (!target) return `这是${item.name}，${effect}。带着说不定用得上呢。`;
  const roles = api.getPokemonBattleProfile(target.speciesId).roles.map(role => role.label).slice(0, 2).join("、");
  const roleText = roles ? `这种${roles}定位` : "它现在的定位";
  return `这是${item.name}，${effect}，很适合你的${pokemonName(target)}。${roleText}带上它，会更有发挥空间。`;
}

function recoveryEffectText(effect: DexItemRecoveryEffect): string {
  const chunks: string[] = [];
  if (effect.revive === "full") chunks.push("让濒死宝可梦复活并恢复满血");
  else if (effect.revive === "half") chunks.push("让濒死宝可梦复活并恢复一半 HP");
  if (effect.hp?.kind === "full") chunks.push("恢复满血");
  else if (effect.hp?.kind === "fixed") chunks.push(`恢复 ${effect.hp.amount} 点 HP`);
  else if (effect.hp?.kind === "fraction") chunks.push("按最大 HP 比例回血");
  if (effect.pp?.scope === "all" && effect.pp.full) chunks.push("让所有招式 PP 全部恢复");
  else if (effect.pp?.scope === "all") chunks.push(`让所有招式恢复 ${effect.pp.amount || 10} 点 PP`);
  else if (effect.pp?.scope === "one" && effect.pp.full) chunks.push("让一个招式 PP 全部恢复");
  else if (effect.pp?.scope === "one") chunks.push(`让一个招式恢复 ${effect.pp.amount || 10} 点 PP`);
  if (effect.cureStatus === "all") chunks.push("解除所有异常状态");
  else if (Array.isArray(effect.cureStatus) && effect.cureStatus.length) chunks.push("解除对应异常状态");
  return chunks.join("，还能") || "帮队伍恢复状态";
}

function lowestTeamPpNeed(team: LocalPokemonV4[]): {pokemon: LocalPokemonV4; move: TrainingMoveSlotV4; ratio: number} | null {
  let best: {pokemon: LocalPokemonV4; move: TrainingMoveSlotV4; ratio: number} | null = null;
  for (const pokemon of team) {
    if (pokemon.entryHp <= 0) continue;
    for (const move of pokemon.moves || []) {
      if (move.maxPp <= 0 || move.remainingPp >= move.maxPp) continue;
      const ratio = move.remainingPp / move.maxPp;
      if (!best || ratio < best.ratio) best = {pokemon, move, ratio};
    }
  }
  return best;
}

function pickEvTrainingTarget(team: LocalPokemonV4[], effect: Extract<DexItemTrainingEffect, {kind: "ev"}>): LocalPokemonV4 | null {
  const sorted = team
    .filter(pokemon => pokemon.entryHp > 0)
    .map(pokemon => {
      const current = clampShopNumber(pokemon.evs[effect.stat], 0, 252);
      const target = effect.mode === "add"
        ? effect.target !== undefined ? Math.max(current, effect.target) : current + Math.max(0, effect.amount || 0)
        : effect.target !== undefined ? Math.min(current, effect.target) : current - Math.max(0, effect.amount || 0);
      const useful = effect.mode === "add" ? target > current && current < 252 : target < current && current > 0;
      return {pokemon, current, useful};
    })
    .filter(entry => entry.useful)
    .sort((a, b) => a.current - b.current);
  return sorted[0]?.pokemon || null;
}

function pickIvTrainingTarget(team: LocalPokemonV4[], mode: "silver" | "gold" | "gray"): LocalPokemonV4 | null {
  if (mode === "gold") return team.find(pokemon => Object.values(pokemon.ivs).some(value => value < 31)) || null;
  if (mode === "gray") return team.find(pokemon => Object.values(pokemon.ivs).some(value => value > 0)) || null;
  return team.find(pokemon => Object.values(pokemon.ivs).some(value => value < 31)) || null;
}

function pickProfiledPokemon(api: ChangeBattleV2Api, team: LocalPokemonV4[], roleNeedles: string[]): LocalPokemonV4 | null {
  return team.find(pokemon => {
    const roleText = api.getPokemonBattleProfile(pokemon.speciesId).roles.map(role => normalizeShopId(role.id)).join(" ");
    return roleNeedles.some(needle => roleText.includes(needle));
  }) || team.find(pokemon => pokemon.entryHp > 0) || team[0] || null;
}

function pickBattleItemTarget(api: ChangeBattleV2Api, team: LocalPokemonV4[], itemID: string): LocalPokemonV4 | null {
  const candidates = team.filter(pokemon => pokemon.entryHp > 0);
  if (!candidates.length) return null;
  const item = normalizeShopId(itemID);
  const scored = candidates.map(pokemon => ({pokemon, score: battleItemFitScore(api, pokemon, item)}));
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score ? scored[0].pokemon : candidates.find(pokemon => !pokemon.itemId) || candidates[0] || null;
}

function battleItemFitScore(api: ChangeBattleV2Api, pokemon: LocalPokemonV4, itemID: string): number {
  const profile = api.getPokemonBattleProfile(pokemon.speciesId);
  const roleIds = profile.roles.map(role => normalizeShopId(role.id));
  const roleText = roleIds.join(" ");
  const moves = pokemon.moves || [];
  const physicalMoves = moves.filter(move => move.category === "物理" || /physical/i.test(move.category)).length;
  const specialMoves = moves.filter(move => move.category === "特殊" || /special/i.test(move.category)).length;
  const damagingMoves = moves.filter(move => Number(move.power || 0) > 0).length;
  const emptyItemBonus = pokemon.itemId ? 0 : 2;
  const hpRatio = pokemon.maxHp ? pokemon.entryHp / pokemon.maxHp : 1;
  let score = emptyItemBonus;
  if (["choiceband"].includes(itemID)) score += physicalMoves * 3 + roleMatch(roleText, ["attacker", "sweeper", "wallbreaker"]);
  else if (["choicespecs"].includes(itemID)) score += specialMoves * 3 + roleMatch(roleText, ["attacker", "sweeper", "wallbreaker"]);
  else if (["choicescarf", "lifeorb", "expertbelt"].includes(itemID)) score += damagingMoves * 2 + roleMatch(roleText, ["fastattacker", "attacker", "sweeper", "wallbreaker"]);
  else if (["leftovers", "rockyhelmet", "eviolite", "assaultvest"].includes(itemID)) score += roleMatch(roleText, ["bulky", "support", "pivot"]) + (hpRatio > .45 ? 2 : 0);
  else if (itemID === "blacksludge") score += pokemonHasType(api, pokemon, "Poison", "毒") ? 10 : 0;
  else if (itemID === "focussash") score += roleMatch(roleText, ["fastattacker", "fastsupport", "sweeper"]) + (hpRatio >= 1 ? 2 : 0);
  else if (itemID === "shellbell" || itemID === "airballoon") score += damagingMoves + emptyItemBonus;
  return score;
}

function roleMatch(roleText: string, needles: string[]): number {
  return needles.some(needle => roleText.includes(needle)) ? 6 : 0;
}

function buildTmItemPitch(api: ChangeBattleV2Api, team: LocalPokemonV4[], item: FormalShopProductViewV4): string {
  const detail = safeItemDetail(api, item.itemID);
  const moveId = detail?.moveId || normalizeShopId(item.itemID.replace(/^tm:/i, ""));
  const moveName = detail?.moveNameZh || detail?.moveName || item.name;
  const learners = team.filter(pokemon => canLearnMachineMove(api, pokemon, moveId));
  const newLearner = learners.find(pokemon => !pokemon.moves.some(move => normalizeShopId(move.moveId) === moveId));
  if (newLearner) {
    const profile = api.getPokemonBattleProfile(newLearner.speciesId);
    const role = profile.roles[0]?.label;
    const roleText = role ? `，和它的${role}定位挺搭` : "";
    return `这能让你的${pokemonName(newLearner)}学会${moveName}${roleText}。要补盲或者换招的话，这张很值得考虑。`;
  }
  const known = learners.find(pokemon => pokemon.moves.some(move => normalizeShopId(move.moveId) === moveId));
  if (known) return `${pokemonName(known)}已经会${moveName}了。再备一张也不是坏事，之后换队友时说不定正好用上。`;
  return `你的队伍里好像没有能学${moveName}的，不过可以先带着，说不定之后有奇效哦。`;
}

function canLearnMachineMove(api: ChangeBattleV2Api, pokemon: LocalPokemonV4, moveId: string): boolean {
  try {
    return api.getPokemonMachineSkills(pokemon.speciesId).some(move => normalizeShopId(move.id) === moveId);
  } catch {
    return false;
  }
}

function safeItemDetail(api: ChangeBattleV2Api, itemID: string) {
  try {
    return api.getItemDetail(itemID);
  } catch {
    return null;
  }
}

function pokemonHasType(api: ChangeBattleV2Api, pokemon: LocalPokemonV4, ...types: string[]): boolean {
  try {
    const wanted = new Set(types.map(type => normalizeShopId(type)));
    return api.getPokemonDetail(pokemon.speciesId).types.some(type => wanted.has(normalizeShopId(type)));
  } catch {
    return false;
  }
}

function pickTypeWeakPokemon(api: ChangeBattleV2Api, team: LocalPokemonV4[], weakTo: string[]): LocalPokemonV4 | null {
  if (!weakTo.length) return team.find(pokemon => pokemon.entryHp > 0 && !pokemon.itemId) || team.find(pokemon => pokemon.entryHp > 0) || team[0] || null;
  const aliveTeam = team.filter(pokemon => pokemon.entryHp > 0);
  return aliveTeam.find(pokemon => pokemonHasType(api, pokemon, ...weakTo) && !pokemon.itemId)
    || aliveTeam.find(pokemon => pokemonHasType(api, pokemon, ...weakTo))
    || null;
}

function pokemonName(pokemon: LocalPokemonV4): string {
  return pokemon.nickname || pokemon.nameZh || pokemon.name || pokemon.speciesId;
}

function moveName(move: TrainingMoveSlotV4): string {
  return move.nameZh || move.name || move.moveId;
}

function normalizeShopId(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function clampShopNumber(value: unknown, min: number, max: number): number {
  const numberValue = Math.floor(Number(value || 0));
  if (!Number.isFinite(numberValue)) return min;
  return Math.min(max, Math.max(min, numberValue));
}

function shopBuyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message.includes("金币不足")) return "噢，太可惜了，你的钱好像不太够。";
  if (message.includes("背包已满")) return "你的背包好像已经满了，先整理一下再来吧。";
  return message || "购买失败，请稍后再试。";
}
