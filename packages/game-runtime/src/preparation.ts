import type {BattleSetting, DesktopGameState, GeneratedTeam, LocalSave, RentalPokemon, ShopOffer, StarterItemGroupState, StarterUpgradeState, TalentView} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import {
  candidateCountForTalents,
  hasTalent,
  normalizeStarterUpgrades,
  starterCoinsForSeed,
  starterUpgradeLevel,
  activeTalentsForSave,
  starterUpgradesForSave,
  STARTER_ITEM_GROUPS,
  STARTER_ITEM_MAX_LEVEL,
} from "./run-rules.js";

export type PendingStarterState = {
  seed: number;
  coins: number;
  offers: ShopOffer[];
  purchased: ShopOffer[];
  talents: TalentView[];
  upgrades: StarterUpgradeState;
  battleSetting: BattleSetting;
  wholeRerollsUsed: number;
  singleRerollsUsed: number;
};

export type PreparationRuntimeState = {
  pendingCandidates: GeneratedTeam | null;
  pendingStarter: PendingStarterState | null;
};

export type PreparationRuntimeApi = {
  prepareCandidates(seed?: number): Promise<DesktopGameState>;
  rerollStarterCandidate(index: number): Promise<DesktopGameState>;
  prepareStarterItems(seed?: number): Promise<DesktopGameState>;
  chooseStarterItem(offerId: string | null): Promise<DesktopGameState>;
  cancelPreparation(): Promise<DesktopGameState>;
};

export function createPreparationRuntime(options: {
  loadSave(): Promise<LocalSave | null>;
  getState(): PreparationRuntimeState;
  setState(state: Partial<PreparationRuntimeState>): void;
  setConfiguredTalents(talents: TalentView[]): void;
  gameState(partial: Partial<DesktopGameState>): DesktopGameState;
  randomSeed(): number;
  generateStarterCandidatesForSave(save: LocalSave, seed: number, talents: TalentView[], count: number, setting?: BattleSetting): Promise<GeneratedTeam>;
  starterItemOffers(runSeed: number, talents: TalentView[], upgrades: StarterUpgradeState, battleSetting: BattleSetting): Promise<ShopOffer[]>;
  starterChoiceState(starter: PendingStarterState): DesktopGameState["starter"];
  starterGroupName(groupId: NonNullable<ShopOffer["starter_group"]>): string;
  deriveSeed(seed: number, salt: number): number;
  generateSingleStarterCandidate(input: {
    seed: number;
    profile: string;
    speciesTier: number;
    battleSetting: BattleSetting;
    talents: TalentView[];
    setStreak: number;
  }): Promise<GeneratedTeam>;
  starterProfilesForStreak(setStreak: number, count: number, talents: TalentView[]): string[];
  starterSpeciesTiersForStreak(setStreak: number, count: number): number[];
}): PreparationRuntimeApi {
  const requireSave = async () => {
    const save = await options.loadSave();
    if (!save) throw new Error("请先创建或读取存档。");
    return save;
  };

  const chooseStarterItem = async (offerId: string | null): Promise<DesktopGameState> => {
    const save = await requireSave();
    let {pendingStarter} = options.getState();
    if (!pendingStarter) {
      const seed = options.randomSeed();
      const talents = activeTalentsForSave(save);
      const upgrades = starterUpgradesForSave(save);
      const battleSetting = normalizeBattleSetting(save.battle_setting || DEFAULT_BATTLE_SETTING);
      pendingStarter = {seed, coins: starterCoinsForSeed(seed, talents), offers: await options.starterItemOffers(seed, talents, upgrades, battleSetting), purchased: [], talents, upgrades, battleSetting, wholeRerollsUsed: 0, singleRerollsUsed: 0};
    }
    const starter = {...pendingStarter, purchased: [...pendingStarter.purchased]};
    if (offerId) {
      const offer = starter.offers.find(item => item.offer_id === offerId);
      if (!offer) throw new Error("开局道具不存在。");
      if (starter.purchased.some(item => item.offer_id === offer.offer_id)) throw new Error("这个开局道具已经购买过了。");
      const groupLimit = hasTalent(starter.talents, "starter_bag_expansion") ? 2 : 1;
      if (offer.starter_group && starter.purchased.filter(item => item.starter_group === offer.starter_group).length >= groupLimit) throw new Error(`${offer.starter_group_label || options.starterGroupName(offer.starter_group)}最多选择 ${groupLimit} 个。`);
      starter.purchased.push(offer);
      const groups = Array.from(new Set(starter.offers.map(offer => offer.starter_group).filter(Boolean)));
      const maxPurchases = groups.reduce((sum, group) => sum + Math.min(groupLimit, starter.offers.filter(offer => offer.starter_group === group).length), 0);
      options.setState({pendingStarter: starter});
      if (starter.purchased.length < maxPurchases) {
        return options.gameState({
          screen: "starterItems",
          save,
          starter: options.starterChoiceState(starter),
          message: `已选择 ${offer.name_zh || offer.name}。还可以继续选择其他类别，或点击跳过进入选队。`,
        });
      }
    }
    const count = candidateCountForTalents(starter.talents);
    const pendingCandidates = await options.generateStarterCandidatesForSave(save, starter.seed, starter.talents, count, starter.battleSetting);
    options.setState({pendingStarter: starter, pendingCandidates});
    return options.gameState({screen: "rentalSelect", save, starter: options.starterChoiceState(starter), candidates: pendingCandidates, selected_indexes: [], message: `随机种子：${starter.seed}`});
  };

  return {
    async prepareCandidates(seed) {
      const save = await requireSave();
      const current = options.getState();
      const runSeed = seed || options.randomSeed();
      const talents = current.pendingStarter?.talents || activeTalentsForSave(save);
      const count = candidateCountForTalents(talents);
      let pendingStarter = current.pendingStarter;
      const existingCandidates = current.pendingCandidates;
      if (pendingStarter) {
        const limit = starterUpgradeLevel(pendingStarter.upgrades, "pokemon_reroll");
        if (existingCandidates && pendingStarter.wholeRerollsUsed >= limit) throw new Error("牌有问题次数不足，无法整体重换。");
        pendingStarter = {...pendingStarter, seed: runSeed, wholeRerollsUsed: existingCandidates ? pendingStarter.wholeRerollsUsed + 1 : pendingStarter.wholeRerollsUsed};
      }
      const pendingCandidates = await options.generateStarterCandidatesForSave(save, runSeed, talents, count, pendingStarter?.battleSetting);
      options.setState({pendingStarter, pendingCandidates});
      return options.gameState({
        screen: "rentalSelect",
        save,
        starter: pendingStarter ? options.starterChoiceState(pendingStarter) : undefined,
        candidates: pendingCandidates,
        selected_indexes: [],
        message: `随机种子：${runSeed}`,
      });
    },
    async rerollStarterCandidate(index) {
      const save = await requireSave();
      const current = options.getState();
      const pendingStarter = current.pendingStarter;
      const pendingCandidates = current.pendingCandidates;
      if (!pendingStarter || !pendingCandidates) throw new Error("当前不在开局选队阶段。");
      const slot = Math.floor(Number(index || 0));
      if (slot < 0 || slot >= pendingCandidates.display.length) throw new Error("候选编号无效。");
      if ((pendingCandidates.display[slot] as RentalPokemon & {starter_origin?: string}).starter_origin === "memory") throw new Error("回忆候选不能单独重随。");
      const limit = starterUpgradeLevel(pendingStarter.upgrades, "pokemon_single_reroll");
      if (pendingStarter.singleRerollsUsed >= limit) throw new Error("我要发功次数不足，无法单独重随。");
      const count = candidateCountForTalents(pendingStarter.talents);
      const setStreak = Number(save.stats?.set_win_streak || 0);
      const profiles = options.starterProfilesForStreak(setStreak, count, pendingStarter.talents);
      const speciesTiers = options.starterSpeciesTiersForStreak(setStreak, count);
      const nextSeed = options.deriveSeed(pendingStarter.seed, 5000 + pendingStarter.singleRerollsUsed * 97 + slot);
      const generated = await options.generateSingleStarterCandidate({
        seed: nextSeed,
        profile: profiles[slot % profiles.length] || "tier1",
        speciesTier: speciesTiers[slot % speciesTiers.length] || 2,
        battleSetting: pendingStarter.battleSetting,
        talents: pendingStarter.talents,
        setStreak,
      });
      const nextCandidates = {
        ...pendingCandidates,
        team: [...pendingCandidates.team],
        display: [...pendingCandidates.display],
      };
      nextCandidates.team[slot] = generated.team[0];
      nextCandidates.display[slot] = generated.display[0];
      const nextStarter = {...pendingStarter, singleRerollsUsed: pendingStarter.singleRerollsUsed + 1};
      options.setState({pendingStarter: nextStarter, pendingCandidates: nextCandidates});
      return options.gameState({
        screen: "rentalSelect",
        save,
        starter: options.starterChoiceState(nextStarter),
        candidates: nextCandidates,
        selected_indexes: [],
        message: `我要发功发动，已重随第 ${slot + 1} 只候选。`,
      });
    },
    async prepareStarterItems(seed) {
      const save = await requireSave();
      const runSeed = seed || options.randomSeed();
      const talents = activeTalentsForSave(save);
      const upgrades = starterUpgradesForSave(save);
      const battleSetting = normalizeBattleSetting(save.battle_setting || DEFAULT_BATTLE_SETTING);
      options.setConfiguredTalents(talents);
      const offers = await options.starterItemOffers(runSeed, talents, upgrades, battleSetting);
      const pendingStarter: PendingStarterState = {seed: runSeed, coins: starterCoinsForSeed(runSeed, talents), offers, purchased: [], talents, upgrades, battleSetting, wholeRerollsUsed: 0, singleRerollsUsed: 0};
      options.setState({pendingStarter, pendingCandidates: null});
      if (!offers.length) return chooseStarterItem(null);
      return options.gameState({screen: "starterItems", save, starter: options.starterChoiceState(pendingStarter), message: "选择一个开局道具，或跳过。"});
    },
    chooseStarterItem,
    async cancelPreparation() {
      const save = await requireSave();
      options.setState({pendingStarter: null, pendingCandidates: null});
      return options.gameState({screen: "mainMenu", save, message: "已返回主菜单，本次准备已取消。"});
    },
  };
}

export function starterChoiceState(starter: PendingStarterState): DesktopGameState["starter"] {
  const upgrades = normalizeStarterUpgrades(starter.upgrades);
  const groupLimit = hasTalent(starter.talents, "starter_bag_expansion") ? 2 : 1;
  const groups: StarterItemGroupState[] = STARTER_ITEM_GROUPS.map(group => ({
    id: group.id,
    name: group.name,
    quality_level: Number(upgrades.item_quality?.[group.id] || 1),
    quantity_level: Number(upgrades.item_quantity?.[group.id] || 0),
    max_quality_level: STARTER_ITEM_MAX_LEVEL,
    max_quantity_level: STARTER_ITEM_MAX_LEVEL,
    offers: starter.offers.filter(offer => offer.starter_group === group.id),
    purchased_offer_id: starter.purchased.find(offer => offer.starter_group === group.id)?.offer_id || null,
    purchased_offer_ids: starter.purchased.filter(offer => offer.starter_group === group.id).map(offer => offer.offer_id),
  }));
  const wholeRerollLimit = starterUpgradeLevel(upgrades, "pokemon_reroll");
  const singleRerollLimit = starterUpgradeLevel(upgrades, "pokemon_single_reroll");
  return {
    seed: starter.seed,
    coins: starter.coins,
    offers: starter.offers,
    purchased: starter.purchased[starter.purchased.length - 1] || null,
    purchased_list: starter.purchased,
    max_purchases: STARTER_ITEM_GROUPS.filter(group => Number(upgrades.item_quantity?.[group.id] || 0) > 0).length * groupLimit,
    item_groups: groups,
    whole_rerolls_remaining: Math.max(0, wholeRerollLimit - starter.wholeRerollsUsed),
    single_rerolls_remaining: Math.max(0, singleRerollLimit - starter.singleRerollsUsed),
    inspect_count: 0,
  };
}
