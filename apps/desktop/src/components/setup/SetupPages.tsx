import {useEffect, useMemo, useState} from "react";
import type {BattleSystemId, DesktopGameState, LocalSave, RentalPokemon, StarterUpgradeView} from "@changebattle/shared";
import {AnimatePresence, motion} from "motion/react";
import {PokemonSprite, bpCostLabel, displayName} from "../../lib/ui";
import {PokemonProfile} from "../pokemon/PokemonProfile";
import {BattleSettingPage as BattleSettingPageComponent} from "./battle-setting/BattleSettingPage";
import {StarterItemsPage} from "./starter-items/StarterItemsPage";
import {TalentConfigPage} from "./talent/TalentConfigPage";

export function TalentConfigView({save, onSaved, onBack}: {save: LocalSave | null; onSaved: (save: LocalSave) => void; onBack: () => void}) {
  return <TalentConfigPage save={save} onSaved={onSaved} onBack={onBack} />;
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

export function BattleSettingPage({save, onSaved, onBack}: {save: LocalSave | null; onSaved: (save: LocalSave) => void; onBack: () => void}) {
  return <BattleSettingPageComponent save={save} onSaved={onSaved} onBack={onBack} />;
}

export function StarterItemsView({starter, onChoose, onBack}: {starter: DesktopGameState["starter"]; onChoose: (offerId: string | null) => void | Promise<void>; onBack: () => void | Promise<void>}) {
  return <StarterItemsPage starter={starter} onChoose={onChoose} onBack={onBack} />;
}

function battleSystemLabel(system: BattleSystemId): string {
  return ({mega: "Mega", zmove: "Z 招式", dynamax: "极巨化", terastal: "太晶化"} as Record<BattleSystemId, string>)[system] || system;
}

function rentalSpecialBadges(pokemon: RentalPokemon): string[] {
  return [
    pokemon.is_mythical ? "幻兽" : "",
    !pokemon.is_mythical && pokemon.is_legendary ? "神兽" : "",
    pokemon.item_battle_system ? battleSystemLabel(pokemon.item_battle_system) : "",
  ].filter(Boolean);
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
  const thumbnailColumns = candidates.length <= 6 ? 6 : 12;
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
        <nav className={`rental-thumbnail-nav columns-${thumbnailColumns} ${candidates.length > 12 ? "overflowing" : ""}`} aria-label="候选宝可梦">
          {candidates.map((candidate, index) => {
            const candidateSelected = selected.includes(index);
            const badges = rentalSpecialBadges(candidate);
            const hasLegendaryBadge = Boolean(candidate.is_legendary || candidate.is_mythical);
            const hasSystemBadge = Boolean(candidate.item_battle_system);
            return (
              <motion.button
                className={`rental-thumbnail ${index === focusIndex ? "active" : ""} ${candidateSelected ? "picked" : ""} ${badges.length ? "special-candidate" : ""} ${hasLegendaryBadge ? "legendary-candidate" : ""} ${hasSystemBadge ? "system-candidate" : ""}`}
                aria-label={`${displayName(candidate)}${badges.length ? `，${badges.join("，")}` : ""}${candidateSelected ? "，已选" : ""}`}
                title={[displayName(candidate), ...badges].join(" / ")}
                onClick={() => setFocusIndex(index)}
                initial={false}
                animate={{opacity: index === focusIndex ? 1 : 0.62, y: index === focusIndex ? -2 : 0}}
                whileHover={{scale: 1.05, opacity: 1}}
                whileTap={{scale: 0.96}}
                key={`${candidate.species_id}-${index}`}
              >
                {index === focusIndex ? <motion.i layoutId="rental-thumbnail-active" transition={{type: "spring", stiffness: 420, damping: 32}} /> : null}
                {candidateSelected ? <motion.em className="rental-thumbnail-check" initial={{scale: 0.35, opacity: 0}} animate={{scale: 1, opacity: 1}} transition={{type: "spring", stiffness: 520, damping: 24}}>✓</motion.em> : null}
                {badges.length ? <span className="rental-thumbnail-badges">{badges.slice(0, 2).map(label => <b key={label}>{label}</b>)}</span> : null}
                <PokemonSprite pokemon={candidate} alt={displayName(candidate)} badge={false} />
              </motion.button>
            );
          })}
        </nav>
      </section>
    </div>
  );
}
