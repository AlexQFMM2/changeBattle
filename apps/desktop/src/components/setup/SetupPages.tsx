import {useEffect, useMemo, useState} from "react";
import type {CSSProperties} from "react";
import type {DesktopGameState, LocalSave, RentalPokemon, StarterUpgradeView, TalentView, TrainerNpcView} from "@changebattle/shared";
import {AnimatePresence, motion} from "motion/react";
import {ItemIcon, PokemonSprite, TALENT_CATALOG, TALENT_EQUIP_LIMIT, bpCostLabel, coinCostLabel, displayName, hasStarterItemChoices, itemCategoryLabel, statMarker, talentShortText} from "../../lib/ui";
import {PokemonProfile} from "../pokemon/PokemonProfile";

export function TalentConfigView({save, onSaved, onBack}: {save: LocalSave | null; onSaved: (save: LocalSave) => void; onBack: () => void}) {
  const talentPageSize = 20;
  const [catalog, setCatalog] = useState<TalentView[]>(TALENT_CATALOG);
  const [selectedId, setSelectedId] = useState(TALENT_CATALOG[0]?.id || "");
  const [unlocked, setUnlocked] = useState<Set<string>>(() => new Set());
  const [equipped, setEquipped] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [talentPage, setTalentPage] = useState(0);
  const [champions, setChampions] = useState<TrainerNpcView[]>([]);
  const selected = catalog.find(talent => talent.id === selectedId) || catalog[0];
  const talentDisabled = Boolean(selected?.disabled);
  const selectedUnlocked = selected ? unlocked.has(selected.id) : false;
  const selectedEquipped = selected ? equipped.includes(selected.id) : false;
  const selectedAffordable = selected && !talentDisabled ? (save?.stats.battle_points || 0) >= (selected.cost || 0) : false;
  const categories = ["全部", ...new Set(catalog.map(talent => talent.category))];
  const visibleCategory = categories.includes(activeCategory) ? activeCategory : categories[0] || activeCategory;
  const sortTalents = (talents: TalentView[]) => [...talents].sort((a, b) => Number(a.cost || 0) - Number(b.cost || 0) || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const visibleTalents = sortTalents(visibleCategory === "全部" ? catalog : catalog.filter(talent => talent.category === visibleCategory));
  const pageCount = Math.max(1, Math.ceil(visibleTalents.length / talentPageSize));
  const currentPage = Math.min(talentPage, pageCount - 1);
  const pagedTalents = visibleTalents.slice(currentPage * talentPageSize, (currentPage + 1) * talentPageSize);
  const gridSlots = Array.from({length: talentPageSize}, (_, index) => pagedTalents[index] || null);
  const equippedSlots = Array.from({length: TALENT_EQUIP_LIMIT}, (_, index) => catalog.find(talent => talent.id === equipped[index]) || null);

  useEffect(() => {
    let cancelled = false;
    void window.changeBattle?.getTalentConfig().then(config => {
      if (cancelled) return;
      const unlockedIds = (config.unlocked || []).map(talent => talent.id);
      const equippedIds = (config.equipped || []).map(talent => talent.id);
      const nextCatalog = config.catalog?.length ? config.catalog : TALENT_CATALOG;
      setCatalog(nextCatalog);
      setEquipped(equippedIds);
      setUnlocked(new Set([...unlockedIds, ...equippedIds]));
      if (config.save) onSaved(config.save);
      const nextSelected = nextCatalog.find(talent => talent.id === equippedIds[0]) || nextCatalog[0];
      if (nextSelected) {
        setSelectedId(nextSelected.id);
      }
    });
    return () => { cancelled = true; };
  }, [onSaved]);

  useEffect(() => {
    let cancelled = false;
    void window.changeBattle?.trainerCatalog().then(catalog => {
      if (!cancelled) setChampions(catalog.champions || []);
    });
    return () => { cancelled = true; };
  }, []);

  function selectTalent(talent: TalentView) {
    setSelectedId(talent.id);
    if (visibleCategory !== "全部" && visibleCategory !== talent.category) setActiveCategory(talent.category);
  }

  function switchTalentCategory(category: string) {
    setActiveCategory(category);
    setTalentPage(0);
  }

  function talentClass(talent: TalentView | null): string {
    if (!talent) return "empty";
    const routeClass = talent.category === "开局筹备" ? "starter" : talent.category === "交换筑队" ? "exchange" : talent.category === "情报规划" ? "intel" : talent.category === "养成改造" ? "growth" : "economy";
    return `${routeClass} ${selectedId === talent.id ? "selected" : ""} ${unlocked.has(talent.id) ? "unlocked" : "locked"} ${equipped.includes(talent.id) ? "equipped" : ""} ${talent.disabled ? "disabled" : ""}`;
  }

  async function unlockSelected() {
    if (!selected || talentDisabled || selectedUnlocked || !selectedAffordable) return;
    const config = await window.changeBattle?.unlockTalent(selected.id);
    if (!config) return;
    setUnlocked(new Set((config.unlocked || []).map(talent => talent.id)));
    setEquipped((config.equipped || []).map(talent => talent.id));
    if (config.save) onSaved(config.save);
  }

  async function equipSelected() {
    if (!selected || talentDisabled || !selectedUnlocked || selectedEquipped || equipped.length >= TALENT_EQUIP_LIMIT) return;
    const nextIds = [...equipped, selected.id];
    const config = await window.changeBattle?.configureTalents(nextIds);
    setEquipped((config?.equipped || []).map(talent => talent.id));
    if (config?.save) onSaved(config.save);
  }

  async function unequipSelected() {
    if (!selected || talentDisabled) return;
    const nextIds = equipped.filter(id => id !== selected.id);
    const config = await window.changeBattle?.configureTalents(nextIds);
    setEquipped((config?.equipped || []).map(talent => talent.id));
    if (config?.save) onSaved(config.save);
  }

  async function chooseNamedChampion(trainerId: string) {
    const config = await window.changeBattle?.setNamedChallenge(trainerId || null);
    if (config?.save) onSaved(config.save);
  }

  return (
    <div className="talent-page">
      <section className="talent-board">
        <header className="talent-title-row">
          <h2>天赋配置</h2>
          <span>BP {save?.stats.battle_points || 0}</span>
        </header>
        <section className="equipped-talent-panel">
          <header>
            <strong>已装备天赋</strong>
            <span>{equipped.length}/{TALENT_EQUIP_LIMIT}</span>
          </header>
          <div className="equipped-talents">
            {equippedSlots.map((talent, index) => (
              <button className={`talent-slot ${talentClass(talent)}`} disabled={!talent} onClick={() => talent && selectTalent(talent)} key={`equipped-${index}`}>
                {talent ? <><span>{talent.category}</span><strong>{talent.name}</strong></> : <><span>空</span><strong>空槽</strong></>}
              </button>
            ))}
          </div>
        </section>
        <nav className="talent-tabs" aria-label="路线视图">
          {categories.map(category => (
            <button className={visibleCategory === category ? "selected" : ""} onClick={() => switchTalentCategory(category)} key={category}>
              {category}
            </button>
          ))}
        </nav>
        <div className="talent-grid">
          {gridSlots.map((talent, index) => (
            <button className={`talent-node ${talentClass(talent)}`} disabled={!talent} onClick={() => talent && selectTalent(talent)} key={talent?.id || `${visibleCategory}-empty-${index}`}>
              {talent ? <><span>{talent.category}</span><strong>{talent.name}</strong><small>{unlocked.has(talent.id) ? bpCostLabel(talent.cost || 0) : `锁定 ${bpCostLabel(talent.cost || 0)}`}</small></> : <span />}
            </button>
          ))}
        </div>
        <nav className="talent-pager">
          <button disabled={currentPage <= 0} onClick={() => setTalentPage(page => Math.max(0, page - 1))}>上一页</button>
          <span>{currentPage + 1}/{pageCount}</span>
          <button disabled={currentPage >= pageCount - 1} onClick={() => setTalentPage(page => Math.min(pageCount - 1, page + 1))}>下一页</button>
        </nav>
        <footer className="talent-footer-note">路线视图会影响开局、交换、情报、养成与经济运营。</footer>
      </section>
      <section className="talent-detail-panel">
        {selected ? (
          <div className="talent-detail-copy">
            <span>{selected.category}</span>
            <h3>{selected.name}</h3>
            <strong>{bpCostLabel(selected.cost || 0)} 需要</strong>
            <p>{talentShortText(selected)}</p>
            {selected.id === "intel_named_challenge" ? (
              <div className="talent-champion-picker">
                <label>最终 Boss</label>
                <select value={save?.named_champion_id || ""} onChange={event => chooseNamedChampion(event.target.value)}>
                  <option value="">默认随机冠军</option>
                  {champions.map(champion => <option value={champion.id} key={champion.id}>{champion.name_zh}</option>)}
                </select>
              </div>
            ) : null}
            <small>{talentDisabled ? "暂不可用" : selectedEquipped ? "已携带" : selectedUnlocked ? "已解锁" : selectedAffordable ? "可解锁" : "BP 不足"}</small>
          </div>
        ) : null}
        <div className="talent-actions">
          <button disabled={!selected || talentDisabled || selectedUnlocked || !selectedAffordable} onClick={unlockSelected}>解锁</button>
          <button disabled={!selected || talentDisabled || !selectedUnlocked || selectedEquipped || equipped.length >= TALENT_EQUIP_LIMIT} onClick={equipSelected}>装备</button>
          <button disabled={talentDisabled || !selectedEquipped} onClick={unequipSelected}>卸下</button>
          <button onClick={onBack}>返回</button>
        </div>
      </section>
    </div>
  );
}

export function StarterUpgradePage({save, onSaved, onBack}: {save: LocalSave | null; onSaved: (save: LocalSave) => void; onBack: () => void}) {
  const [catalog, setCatalog] = useState<StarterUpgradeView[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeGroup, setActiveGroup] = useState("道具数量");
  const groups = [{id: "道具数量", label: "道具数量"}, {id: "道具质量", label: "道具质量"}, {id: "开局选牌", label: "开局选牌"}];
  const visible = catalog.filter(entry => entry.group === activeGroup);
  const selected = visible.find(entry => entry.id === selectedId) || visible[0] || catalog[0];
  const selectedAffordable = selected ? (save?.stats.battle_points || 0) >= (selected.cost || 0) : false;

  useEffect(() => {
    let cancelled = false;
    void window.changeBattle?.getStarterUpgrades().then(config => {
      if (cancelled) return;
      const nextCatalog = config.catalog || [];
      setCatalog(nextCatalog);
      if (config.save) onSaved(config.save);
      setSelectedId(current => current && nextCatalog.some(entry => entry.id === current) ? current : nextCatalog.find(entry => entry.group === activeGroup)?.id || nextCatalog[0]?.id || "");
    });
    return () => { cancelled = true; };
  }, [onSaved]);

  async function upgradeSelected() {
    if (!selected || selected.cost === null || selected.cost === undefined || !selectedAffordable) return;
    const config = await window.changeBattle?.upgradeStarter(selected.id);
    if (!config) return;
    const nextCatalog = config.catalog || [];
    setCatalog(nextCatalog);
    setSelectedId(current => current && nextCatalog.some(entry => entry.id === current) ? current : nextCatalog.find(entry => entry.group === activeGroup)?.id || nextCatalog[0]?.id || "");
    if (config.save) onSaved(config.save);
  }

  function selectGroup(group: string) {
    setActiveGroup(group);
    const first = catalog.find(entry => entry.group === group);
    if (first) setSelectedId(first.id);
  }

  function upgradeBar(entry: StarterUpgradeView) {
    return Array.from({length: entry.max_level}, (_value, index) => (
      <i className={index < entry.level ? "filled" : ""} key={`${entry.id}-${index}`} />
    ));
  }

  return (
    <div className="starter-upgrade-page">
      <section className="starter-upgrade-shell">
        <div className="starter-upgrade-main">
          <nav className="starter-upgrade-tabs">
          {groups.map(group => (
            <button className={activeGroup === group.id ? "selected" : ""} onClick={() => selectGroup(group.id)} key={group.id}>
              {group.label}
            </button>
          ))}
          </nav>
          <div className="starter-upgrade-list">
          {visible.length ? visible.map(entry => (
            <button className={`starter-upgrade-row ${selectedId === entry.id ? "selected" : ""}`} onClick={() => setSelectedId(entry.id)} key={entry.id}>
              <span>{entry.name}</span>
              <div className="starter-upgrade-bars">{upgradeBar(entry)}</div>
              <b>{entry.level >= entry.max_level ? "MAX" : entry.cost === null || entry.cost === undefined ? "MAX" : `${entry.cost}BP`}</b>
            </button>
          )) : <p className="starter-upgrade-empty">暂无可升级项目。</p>}
          </div>
        </div>
        <aside className="starter-upgrade-detail">
        {selected ? (
          <div>
            <span>{selected.group}</span>
            <h3>{selected.name}</h3>
            <p>{selected.desc}</p>
            <strong>{selected.cost === null || selected.cost === undefined ? "已满级" : `花费 ${bpCostLabel(selected.cost)}`}</strong>
            <small>{selected.cost === null || selected.cost === undefined ? "已满级" : selectedAffordable ? `升级需要 ${bpCostLabel(selected.cost)}` : "BP 不足"}</small>
          </div>
        ) : null}
        <div className="starter-upgrade-actions">
          <button disabled={!selected || selected.cost === null || selected.cost === undefined || !selectedAffordable} onClick={upgradeSelected}>升级</button>
          <button onClick={onBack}>返回</button>
        </div>
        <footer>BP {save?.stats.battle_points || 0}</footer>
        </aside>
      </section>
    </div>
  );
}

export function StarterItemsView({starter, onChoose, onBack}: {starter: DesktopGameState["starter"]; onChoose: (offerId: string | null) => void | Promise<void>; onBack: () => void | Promise<void>}) {
  const groupOrder = ["recovery", "berry", "tm", "battle"];
  const purchasedOffers = starter?.purchased_list || (starter?.purchased ? [starter.purchased] : []);
  const purchasedIds = new Set(purchasedOffers.map(offer => offer.offer_id));
  const groups = [...(starter?.item_groups || [])]
    .filter(group => group.offers.length > 0)
    .sort((a, b) => groupOrder.indexOf(a.id) - groupOrder.indexOf(b.id));
  const [pageIndex, setPageIndex] = useState(0);
  const [stagedOfferId, setStagedOfferId] = useState<string | null>(null);
  const [skipConfirmOpen, setSkipConfirmOpen] = useState(false);
  const currentIndex = Math.min(pageIndex, Math.max(0, groups.length - 1));
  const currentGroup = groups[currentIndex] || null;
  const perGroupLimit = (starter?.max_purchases || 0) > groups.length ? 2 : 1;
  const currentPurchasedIds = currentGroup?.purchased_offer_ids || (currentGroup?.purchased_offer_id ? [currentGroup.purchased_offer_id] : []);
  const groupLimit = Math.min(perGroupLimit, currentGroup?.offers.length || perGroupLimit);
  const groupLocked = currentPurchasedIds.length >= groupLimit;
  const selectedOfferId = stagedOfferId;
  const selectedOffer = currentGroup?.offers.find(offer => offer.offer_id === selectedOfferId) || null;
  const stagedCount = selectedOffer && !currentPurchasedIds.includes(selectedOffer.offer_id) ? 1 : 0;
  const selectedCount = Math.min(groupLimit, currentPurchasedIds.length + stagedCount);
  const isLastPage = currentIndex >= groups.length - 1;
  const progress = groups.length ? `${currentIndex + 1}/${groups.length}` : "0/0";

  useEffect(() => {
    setPageIndex(index => Math.min(index, Math.max(0, groups.length - 1)));
  }, [groups.length]);

  useEffect(() => {
    setStagedOfferId(null);
    setSkipConfirmOpen(false);
  }, [currentGroup?.id]);

  async function continueWithoutSelection() {
    setSkipConfirmOpen(false);
    if (isLastPage) {
      await onChoose(null);
      return;
    }
    setPageIndex(index => Math.min(groups.length - 1, index + 1));
  }

  async function nextStep() {
    if (!currentGroup) {
      await onChoose(null);
      return;
    }
    if (selectedOffer && !currentPurchasedIds.includes(selectedOffer.offer_id)) {
      const willCompleteAllChoices = purchasedOffers.length + 1 >= (starter?.max_purchases || groups.length);
      const willLockGroup = currentPurchasedIds.length + 1 >= groupLimit;
      await onChoose(selectedOffer.offer_id);
      if (isLastPage && !willCompleteAllChoices) await onChoose(null);
      setStagedOfferId(null);
      if (!isLastPage && willLockGroup) setPageIndex(index => Math.min(groups.length - 1, index + 1));
      return;
    }
    if (!groupLocked) {
      setSkipConfirmOpen(true);
      return;
    }
    await continueWithoutSelection();
  }

  if (!currentGroup) {
    return (
      <div className="starter-page starter-wizard-page">
        <section className="starter-wizard-empty">
          <h2>开局道具</h2>
          <p>当前没有可选择的开局道具，直接进入选队。</p>
          <button onClick={() => onChoose(null)}>开始</button>
        </section>
      </div>
    );
  }

  return (
    <div className="starter-page starter-wizard-page">
      <header>
        <div>
          <h2>开局道具</h2>
          <p>{currentGroup.name}　{progress}　每类最多免费带走 {groupLimit} 个</p>
        </div>
        <div className="starter-actions">
          <button onClick={onBack}>返回</button>
          <button onClick={nextStep}>{isLastPage ? "开始" : "下一步"}</button>
        </div>
      </header>
      <section className="starter-wizard">
        <nav className="starter-wizard-steps">
          {groups.map((group, index) => (
            <span className={`${index < currentIndex ? "done" : ""} ${index === currentIndex ? "current" : ""}`} key={group.id}>{group.name}</span>
          ))}
        </nav>
        <div className="starter-group starter-wizard-card">
          <header>
            <strong>{currentGroup.name}（质量 Lv{currentGroup.quality_level} / 数量 Lv{currentGroup.quantity_level}）</strong>
            <span>{selectedCount}/{groupLimit}　{groupLocked ? "已锁定" : selectedOffer ? "待锁定" : "可跳过"}</span>
          </header>
          <div className="starter-group-offers">
            {Array.from({length: 4}, (_value, slotIndex) => {
              const offer = currentGroup.offers[slotIndex];
              if (!offer) return <div className="starter-offer-placeholder" key={`empty-${currentGroup.id}-${slotIndex}`} />;
              const selected = selectedOfferId === offer.offer_id;
              const purchased = currentPurchasedIds.includes(offer.offer_id);
              const locked = groupLocked || purchased;
              return (
                <button className={`starter-offer ${selected ? "selected" : ""}`} disabled={locked} onClick={() => setStagedOfferId(current => current === offer.offer_id ? null : offer.offer_id)} key={offer.offer_id}>
                  <ItemIcon item={offer} />
                  <strong>{offer.name_zh || offer.name}</strong>
                  <span><b className="price-badge">Lv{offer.item_tier || 1}</b><i>{purchasedIds.has(offer.offer_id) ? "已选择" : selected ? "已选中" : "免费"}</i></span>
                  <small>{itemCategoryLabel(offer.category)}　{offer.desc_zh || offer.desc || offer.name}</small>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      {skipConfirmOpen ? (
        <div className="starter-skip-confirm" role="dialog" aria-modal="true">
          <div>
            <span>{currentGroup.name}</span>
            <h3>本页还没有选择道具</h3>
            <p>继续后将跳过这一类开局道具，本页不能返回重选。</p>
            <div>
              <button onClick={() => setSkipConfirmOpen(false)}>取消</button>
              <button onClick={continueWithoutSelection}>{isLastPage ? "跳过并开始" : "继续"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function RentalSelect({candidates, selected, focusIndex, setFocusIndex, onToggle, onStart, onBack, onReroll, onSingleReroll, onInspect, runSeed, wholeRerollsRemaining = 0, singleRerollsRemaining = 0, inspectRemaining = 0, revealTraining = false, inspected = false}: {candidates: RentalPokemon[]; selected: number[]; focusIndex: number; setFocusIndex: (index: number) => void; onToggle: (index: number) => void; onStart: () => void | Promise<void>; onBack?: () => void | Promise<void>; onReroll?: () => void | Promise<void>; onSingleReroll?: () => void | Promise<void>; onInspect?: () => void; runSeed?: number; wholeRerollsRemaining?: number; singleRerollsRemaining?: number; inspectRemaining?: number; revealTraining?: boolean; inspected?: boolean}) {
  const pokemon = candidates[focusIndex];
  if (!pokemon) return <div className="loading-panel"><strong>正在生成租赁候选...</strong></div>;
  const focusedSelected = selected.includes(focusIndex);
  const focusedOrigin = (pokemon as RentalPokemon & {starter_origin?: string}).starter_origin || "current";
  const originLabel = focusedOrigin === "memory" ? "回忆候选" : "本局候选";
  const visibleSkillBadges = [
    wholeRerollsRemaining > 0 ? `牌 ${wholeRerollsRemaining}` : "",
    singleRerollsRemaining > 0 ? `发功 ${singleRerollsRemaining}` : "",
    inspectRemaining > 0 ? `验牌 ${inspectRemaining}` : ""
  ].filter(Boolean);
  return (
    <div className="dex-layout rental-select-layout">
      <section className="rental-gallery-panel">
        <header className="rental-select-topbar">
          <div className="rental-run-meta">
            <span>随机种子 {typeof runSeed === "number" ? runSeed : "--"}</span>
            <span>候选 {focusIndex + 1}/{candidates.length}</span>
            <span>{originLabel}</span>
            <span>已选 {selected.length}/3</span>
          </div>
          <div className="rental-skill-actions" aria-label="开局能力">
            {visibleSkillBadges.length ? (
              <div className="rental-skill-badges" aria-label="可用技能">
                {visibleSkillBadges.map(label => <span key={label}>{label}</span>)}
              </div>
            ) : null}
            {onBack ? <button className="rental-utility-button" onClick={onBack}>返回</button> : null}
            <button className="rental-utility-button" disabled={!onReroll || wholeRerollsRemaining <= 0} onClick={() => void onReroll?.()}>换人 {wholeRerollsRemaining}</button>
            <button className="rental-utility-button" disabled={!onSingleReroll || singleRerollsRemaining <= 0} onClick={() => void onSingleReroll?.()}>发功 {singleRerollsRemaining}</button>
            <button className="rental-utility-button" disabled={!onInspect || inspectRemaining <= 0 || inspected} onClick={() => onInspect?.()}>{inspected ? "已验牌" : `验牌 ${inspectRemaining}`}</button>
          </div>
          <button className="rental-start-button" disabled={selected.length !== 3} onClick={() => void onStart()}>开始游戏</button>
        </header>
        <AnimatePresence mode="wait">
          <motion.div className="rental-profile-stage" initial={{opacity: 0, x: 16}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -16}} transition={{type: "spring", stiffness: 330, damping: 30}} key={pokemon.run_member_id || pokemon.species_id || focusIndex}>
            <button className="rental-profile-pick" onClick={() => onToggle(focusIndex)}>{focusedSelected ? "取消选中" : "选中"}</button>
            <PokemonProfile pokemon={pokemon} selected={focusedSelected} revealTraining={revealTraining} compact />
          </motion.div>
        </AnimatePresence>
        <nav className={`rental-thumbnail-nav ${candidates.length > 12 ? "crowded" : ""}`} aria-label="候选宝可梦">
          {candidates.map((candidate, index) => {
            const candidateSelected = selected.includes(index);
            return (
              <motion.button
                className={`rental-thumbnail ${index === focusIndex ? "active" : ""} ${candidateSelected ? "picked" : ""}`}
                aria-label={`${displayName(candidate)}${candidateSelected ? "，已选" : ""}`}
                title={displayName(candidate)}
                onClick={() => setFocusIndex(index)}
                initial={false}
                animate={{opacity: index === focusIndex ? 1 : 0.62, y: index === focusIndex ? -2 : 0}}
                whileHover={{scale: 1.05, opacity: 1}}
                whileTap={{scale: 0.96}}
                key={`${candidate.species_id}-${index}`}
              >
                {index === focusIndex ? <motion.i layoutId="rental-thumbnail-active" transition={{type: "spring", stiffness: 420, damping: 32}} /> : null}
                {candidateSelected ? <motion.em className="rental-thumbnail-check" initial={{scale: 0.35, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{type: "spring", stiffness: 520, damping: 24}}>✓</motion.em> : null}
                <PokemonSprite pokemon={candidate} alt={displayName(candidate)} badge={false} />
              </motion.button>
            );
          })}
        </nav>
      </section>
    </div>
  );
}
