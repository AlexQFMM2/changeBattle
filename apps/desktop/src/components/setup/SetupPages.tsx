import {useEffect, useMemo, useState} from "react";
import type {DesktopGameState, LocalSave, RentalPokemon, StarterUpgradeView} from "@changebattle/shared";
import {bpCostLabel} from "../../lib/ui";
import {BattleSettingPage as BattleSettingPageComponent} from "./battle-setting/BattleSettingPage";
import {RentalSelectPage} from "./rental-select/RentalSelectPage";
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

export function RentalSelect({candidates, selected, focusIndex, setFocusIndex, onToggle, onStart, onBack, onReroll, onSingleReroll, onInspect, runSeed, wholeRerollsRemaining = 0, singleRerollsRemaining = 0, inspectRemaining = 0, revealTraining = false, inspected = false}: {candidates: RentalPokemon[]; selected: number[]; focusIndex: number; setFocusIndex: (index: number) => void; onToggle: (index: number) => void; onStart: () => void | Promise<void>; onBack?: () => void | Promise<void>; onReroll?: () => void | Promise<void>; onSingleReroll?: () => void | Promise<void>; onInspect?: () => void; runSeed?: number; wholeRerollsRemaining?: number; singleRerollsRemaining?: number; inspectRemaining?: number; revealTraining?: boolean; inspected?: boolean}) {
  return (
    <RentalSelectPage
      candidates={candidates}
      selected={selected}
      focusIndex={focusIndex}
      setFocusIndex={setFocusIndex}
      onToggle={onToggle}
      onStart={onStart}
      onBack={onBack}
      onReroll={onReroll}
      onSingleReroll={onSingleReroll}
      onInspect={onInspect}
      runSeed={runSeed}
      wholeRerollsRemaining={wholeRerollsRemaining}
      singleRerollsRemaining={singleRerollsRemaining}
      inspectRemaining={inspectRemaining}
      revealTraining={revealTraining}
      inspected={inspected}
    />
  );
}
