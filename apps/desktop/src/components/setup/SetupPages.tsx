import {useEffect, useMemo, useRef, useState} from "react";
import type {CSSProperties, PointerEvent, WheelEvent} from "react";
import type {BattleRulePreset, BattleSetting, BattleSystemId, DesktopGameState, LocalSave, RentalPokemon, StarterUpgradeView, TalentView} from "@changebattle/shared";
import {BATTLE_GENERATION_OPTIONS, BATTLE_RULE_PRESET_OPTIONS, DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import {AnimatePresence, motion} from "motion/react";
import {ItemIcon, PokemonSprite, bpCostLabel, coinCostLabel, displayName, hasStarterItemChoices, itemCategoryLabel, statMarker} from "../../lib/ui";
import {PokemonProfile} from "../pokemon/PokemonProfile";

export function TalentConfigView({save, onSaved, onBack}: {save: LocalSave | null; onSaved: (save: LocalSave) => void; onBack: () => void}) {
  const [catalog, setCatalog] = useState<TalentView[]>([]);
  const [selectedId, setSelectedId] = useState("root_trainer_star");
  const [detailOpen, setDetailOpen] = useState(false);
  const [view, setView] = useState({x: 0, y: 0, scale: 0.78});
  const dragRef = useRef<{x: number; y: number; originX: number; originY: number} | null>(null);
  const selected = catalog.find(node => node.id === selectedId) || catalog[0];
  const bp = save?.stats.battle_points || 0;
  const nodeById = useMemo(() => new Map(catalog.map(node => [node.id, node])), [catalog]);
  const unlockedCount = catalog.filter(node => Number(node.level || 0) > 0 && node.kind !== "root").length;

  useEffect(() => {
    let cancelled = false;
    void window.changeBattle?.getTalentConfig().then(config => {
      if (cancelled) return;
      const nextCatalog = config.catalog || [];
      setCatalog(nextCatalog);
      if (config.save) onSaved(config.save);
      setSelectedId(current => nextCatalog.some(node => node.id === current) ? current : nextCatalog.find(node => node.id === "root_trainer_star")?.id || nextCatalog[0]?.id || "");
    });
    return () => { cancelled = true; };
  }, [onSaved]);

  function nodeLevel(id: string): number {
    return Math.max(0, Math.floor(Number(nodeById.get(id)?.level || 0)));
  }

  function nodeReady(node: TalentView): boolean {
    return (node.requires || []).every(requirement => nodeLevel(requirement.id) >= Math.max(1, Number(requirement.level || 1)));
  }

  function nodeCost(node?: TalentView): number | null {
    if (!node || node.disabled || node.kind === "root" || node.kind === "event_preview") return null;
    const level = Math.max(0, Math.floor(Number(node.level || 0)));
    const max = Math.max(1, Number(node.max_level || 1));
    if (level >= max) return null;
    return node.costs?.[level] ?? node.cost ?? null;
  }

  function nodeState(node: TalentView): string {
    const level = nodeLevel(node.id);
    if (node.kind === "event_preview" || node.disabled) return "preview";
    if (level > 0) return level >= Number(node.max_level || 1) ? "maxed" : "active";
    return nodeReady(node) ? "available" : "locked";
  }

  function routeClass(category?: string): string {
    if (category === "开局筹备") return "starter";
    if (category === "整备器械") return "gear";
    if (category === "情报规划") return "intel";
    if (category === "交换筑队") return "exchange";
    if (category === "养成改造") return "growth";
    if (category === "经济运营") return "economy";
    if (category === "奇遇预留") return "event";
    return "root";
  }

  async function upgradeSelected() {
    if (!selected || nodeCost(selected) === null || !nodeReady(selected) || bp < Number(nodeCost(selected))) return;
    const config = await window.changeBattle?.unlockTalent(selected.id);
    if (!config) return;
    setCatalog(config.catalog || []);
    if (config.save) onSaved(config.save);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    dragRef.current = {x: event.clientX, y: event.clientY, originX: view.x, originY: view.y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setView(current => ({...current, x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y}));
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    setView(current => ({...current, scale: Math.max(0.55, Math.min(1.8, Math.round((current.scale + delta) * 100) / 100))}));
  }

  function resetView() {
    setView({x: 0, y: 0, scale: 0.78});
  }

  const graphBounds = useMemo(() => {
    const xs = catalog.map(node => Number(node.x || 0));
    const ys = catalog.map(node => Number(node.y || 0));
    return {
      minX: Math.min(-760, ...xs) - 140,
      maxX: Math.max(760, ...xs) + 140,
      minY: Math.min(-620, ...ys) - 140,
      maxY: Math.max(620, ...ys) + 140,
    };
  }, [catalog]);
  const graphWidth = graphBounds.maxX - graphBounds.minX;
  const graphHeight = graphBounds.maxY - graphBounds.minY;
  const selectedLevel = selected ? nodeLevel(selected.id) : 0;
  const selectedMax = selected ? Math.max(1, Number(selected.max_level || 1)) : 1;
  const selectedCost = nodeCost(selected);
  const selectedReady = selected ? nodeReady(selected) : false;
  const selectedState = selected ? nodeState(selected) : "locked";
  const selectedEffects = selected?.effects?.filter(Boolean) || [];
  const currentEffect = selectedLevel > 0
    ? selectedEffects[Math.min(selectedLevel - 1, selectedEffects.length - 1)] || selected?.desc || `Lv${selectedLevel} 已点亮。`
    : "尚未点亮。";
  const nextEffect = selectedLevel >= selectedMax
    ? "已满级。"
    : selectedEffects[Math.min(selectedLevel, selectedEffects.length - 1)] || selected?.desc || `点亮后提升到 Lv${selectedLevel + 1}。`;
  const requirements = selected?.requires || [];
  const canUpgrade = Boolean(selected && selectedCost !== null && selectedReady && bp >= Number(selectedCost) && selectedState !== "preview");
  const categoryHubs = useMemo(() => {
    const root = catalog.find(node => node.id === "root_trainer_star");
    if (!root) return new Map<string, {category: string; x: number; y: number; active: boolean}>();
    const rootX = Number(root.x || 0);
    const rootY = Number(root.y || 0);
    const groups = new Map<string, TalentView[]>();
    for (const node of catalog) {
      if (node.id === "root_trainer_star") continue;
      if (!(node.requires || []).some(requirement => requirement.id === "root_trainer_star")) continue;
      const next = groups.get(node.category) || [];
      next.push(node);
      groups.set(node.category, next);
    }
    const hubs = new Map<string, {category: string; x: number; y: number; active: boolean}>();
    for (const [category, nodes] of groups) {
      const avgX = nodes.reduce((sum, node) => sum + Number(node.x || 0), 0) / nodes.length;
      const avgY = nodes.reduce((sum, node) => sum + Number(node.y || 0), 0) / nodes.length;
      const dx = avgX - rootX;
      const dy = avgY - rootY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const trunkLength = Math.max(92, Math.min(155, distance * 0.44));
      hubs.set(category, {
        category,
        x: rootX + (dx / distance) * trunkLength,
        y: rootY + (dy / distance) * trunkLength,
        active: nodes.some(node => Number(node.level || 0) > 0),
      });
    }
    return hubs;
  }, [catalog]);

  function requirementText(requirement: {id: string; level?: number}) {
    const node = nodeById.get(requirement.id);
    const level = Math.max(1, Number(requirement.level || 1));
    return `${node?.name || requirement.id} Lv${level}`;
  }

  function linkPath(from: {x?: number; y?: number}, to: {x?: number; y?: number}): string {
    const x1 = Number(from.x || 0);
    const y1 = Number(from.y || 0);
    const x2 = Number(to.x || 0);
    const y2 = Number(to.y || 0);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const bend = Math.max(-70, Math.min(70, (Math.abs(dx) - Math.abs(dy)) * 0.12));
    const cx = x1 + dx * 0.52 - dy * 0.08;
    const cy = y1 + dy * 0.52 + bend;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }

  function selectNode(node: TalentView) {
    setSelectedId(node.id);
    setDetailOpen(true);
  }

  return (
    <div className="talent-page star-chart-page">
      <section className="talent-board star-chart-board">
        <div className="star-chart-hud">
          <div>
            <strong>训练家星图</strong>
            <span>点亮 {unlockedCount} · BP {bp}</span>
          </div>
          <button onClick={resetView}>重置</button>
          <button onClick={onBack}>返回</button>
        </div>
        <div className="star-chart-viewport" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
          <div
            className="star-chart-canvas"
            style={{
              width: graphWidth,
              height: graphHeight,
              left: `calc(50% + ${view.x}px)`,
              top: `calc(50% + ${view.y}px)`,
              transform: `translate(-50%, -50%) scale(${view.scale})`,
            }}
          >
            <svg className="star-chart-links" viewBox={`${graphBounds.minX} ${graphBounds.minY} ${graphWidth} ${graphHeight}`} aria-hidden="true">
              {(() => {
                const root = catalog.find(node => node.id === "root_trainer_star");
                if (!root) return null;
                return Array.from(categoryHubs.values()).map(hub => (
                  <path className={`trunk ${hub.active ? "active" : "available"}`} d={linkPath(root, hub)} key={`trunk-${hub.category}`} />
                ));
              })()}
              {catalog.flatMap(node => (node.requires || []).map(requirement => {
                const from = nodeById.get(requirement.id);
                if (!from) return null;
                const hub = requirement.id === "root_trainer_star" ? categoryHubs.get(node.category) : null;
                const requirementMet = nodeLevel(from.id) >= Math.max(1, Number(requirement.level || 1));
                const childActive = nodeLevel(node.id) > 0;
                const stateClass = childActive ? "active" : requirementMet ? "available" : "locked";
                return <path className={`${stateClass} ${hub ? "branch" : ""}`} d={linkPath(hub || from, node)} key={`${from.id}-${node.id}-${requirement.level || 1}`} />;
              }))}
            </svg>
            {catalog.map(node => {
              const level = nodeLevel(node.id);
              const max = Math.max(1, Number(node.max_level || 1));
              return (
                <button
                  className={`star-chart-node ${routeClass(node.category)} ${nodeState(node)} ${selectedId === node.id ? "selected" : ""}`}
                  style={{
                    left: Number(node.x || 0) - graphBounds.minX,
                    top: Number(node.y || 0) - graphBounds.minY,
                    "--progress": `${max ? Math.max(0, Math.min(1, level / max)) : 0}`,
                    "--progress-pct": `${max ? Math.max(0, Math.min(100, (level / max) * 100)) : 0}%`,
                  } as CSSProperties}
                  title={`${node.name} Lv${level}/${max}`}
                  aria-label={`${node.name} Lv${level}/${max}`}
                  onClick={() => selectNode(node)}
                  key={node.id}
                />
              );
            })}
          </div>
        </div>
      </section>
      <AnimatePresence>
        {detailOpen && selected ? (
          <motion.section
            className="talent-detail-panel star-chart-detail"
            initial={{x: 420, opacity: 0}}
            animate={{x: 0, opacity: 1}}
            exit={{x: 420, opacity: 0}}
            transition={{duration: 0.22, ease: "easeOut"}}
          >
          <div className="talent-detail-copy">
            <button className="star-chart-drawer-close" onClick={() => setDetailOpen(false)} aria-label="关闭详情">×</button>
            <span>{selected.category}</span>
            <h3>{selected.name}</h3>
            <strong>Lv{selectedLevel}/{selectedMax}</strong>
            <p>{selected.desc}</p>
            <div className="star-chart-effect-box">
              <span>当前效果</span>
              <p>{currentEffect}</p>
            </div>
            <div className="star-chart-effect-box next">
              <span>下级效果</span>
              <p>{nextEffect}</p>
            </div>
            <div className="star-chart-requirements">
              <span>前置</span>
              {requirements.length ? requirements.map(requirement => (
                <b className={nodeLevel(requirement.id) >= Math.max(1, Number(requirement.level || 1)) ? "met" : ""} key={`${selected.id}-${requirement.id}-${requirement.level || 1}`}>
                  {requirementText(requirement)}
                </b>
              )) : <b className="met">无</b>}
            </div>
            <small>
              {selected.kind === "event_preview" || selected.disabled ? "后续奇遇池预留，暂不能点亮。" : selectedCost === null ? "已满级或默认点亮。" : !selectedReady ? "前置节点未满足。" : bp < Number(selectedCost) ? "BP 不足。" : `可花费 ${bpCostLabel(Number(selectedCost))} 点亮/升级。`}
            </small>
          </div>
          <div className="talent-actions">
            <button disabled={!canUpgrade} onClick={upgradeSelected}>{selectedLevel > 0 ? "升级" : "点亮"}</button>
            <span>{selectedCost === null ? "MAX" : bpCostLabel(Number(selectedCost || 0))}</span>
          </div>
        </motion.section>
        ) : null}
      </AnimatePresence>
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

type BattleSettingTab = "regions" | "systems" | "legendary";

const BATTLE_SETTING_TABS: Array<{id: BattleSettingTab; label: string}> = [
  {id: "regions", label: "地区专爱"},
  {id: "systems", label: "战斗系统"},
  {id: "legendary", label: "神战"},
];

const BATTLE_RULE_PRESET_STATE: Record<BattleRulePreset, {ready: boolean; summary: string; detail: string}> = {
  none: {ready: true, summary: "默认", detail: "不开放 Mega、Z 招式、极巨化或太晶化。适合保留最朴素的随机对战体验。"},
  gen7: {ready: true, summary: "Mega + Z", detail: "开放 Mega 进化与 Z 招式。随机池最多到第七世代；Mega 石与 Z 纯晶会进入道具池。"},
  gen8: {ready: true, summary: "极巨 / 超极巨", detail: "开放极巨化与超极巨化。随机池最多到第八世代；对战使用第八世代 Showdown 规则。"},
  gen9: {ready: true, summary: "太晶化", detail: "开放太晶珠。每场战斗每方可太晶化一次，太晶爆发会按当前太晶属性展示。"},
};

export function BattleSettingPage({save, onSaved, onBack}: {save: LocalSave | null; onSaved: (save: LocalSave) => void; onBack: () => void}) {
  const [setting, setSetting] = useState<BattleSetting>(() => normalizeBattleSetting(save?.battle_setting || DEFAULT_BATTLE_SETTING));
  const [activeTab, setActiveTab] = useState<BattleSettingTab>("regions");
  const [selectedPresetId, setSelectedPresetId] = useState<BattleRulePreset>(() => setting.battle_rule_preset || "none");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    void window.changeBattle?.getBattleSetting().then(result => {
      if (cancelled || !result) return;
      const normalized = normalizeBattleSetting(result.setting);
      setSetting(normalized);
      setSelectedPresetId(normalized.battle_rule_preset);
      if (result.save) onSaved(result.save);
    }).catch(() => {
      if (!cancelled) {
        const normalized = normalizeBattleSetting(save?.battle_setting || DEFAULT_BATTLE_SETTING);
        setSetting(normalized);
        setSelectedPresetId(normalized.battle_rule_preset);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRegionCount = setting.allowed_generations.length;
  const canSave = selectedRegionCount >= 3;

  function toggleGeneration(generation: number) {
    setNotice("");
    setSetting(current => {
      const selected = current.allowed_generations.includes(generation);
      if (selected && current.allowed_generations.length <= 3) {
        setNotice("地区专爱至少保留 3 个地区。");
        return current;
      }
      const allowed_generations = selected
        ? current.allowed_generations.filter(value => value !== generation)
        : [...current.allowed_generations, generation].sort((a, b) => a - b);
      return {...current, allowed_generations};
    });
  }

  function selectPreset(preset: BattleRulePreset) {
    setNotice("");
    setSelectedPresetId(preset);
    setSetting(current => normalizeBattleSetting({...current, battle_rule_preset: preset}));
  }

  async function saveSetting() {
    if (!canSave || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const result = await window.changeBattle!.updateBattleSetting(setting);
      const normalized = normalizeBattleSetting(result.setting);
      setSetting(normalized);
      setSelectedPresetId(normalized.battle_rule_preset);
      if (result.save) onSaved(result.save);
      setNotice("对局偏好已保存，下一局开始生效。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  const detailTitle = activeTab === "regions" ? "地区专爱" : activeTab === "systems" ? "战斗系统" : "神战";
  const selectedPreset = BATTLE_RULE_PRESET_OPTIONS.find(option => option.id === selectedPresetId) || BATTLE_RULE_PRESET_OPTIONS[0];
  const selectedPresetState = BATTLE_RULE_PRESET_STATE[selectedPreset.id];
  const selectedPresetOpen = setting.battle_rule_preset === selectedPreset.id;
  const detailText = activeTab === "regions"
    ? `已选择 ${selectedRegionCount}/9 个地区，随机宝可梦只会来自这些世代。`
    : activeTab === "systems"
      ? selectedPresetState.detail
      : setting.legendary_battle ? "神战开启：随机池允许 tier10 神兽/幻兽档，每队最多 1 只。" : "神战关闭：随机池排除 tier10 神兽/幻兽档。";
  const detailStrong = activeTab === "systems"
    ? selectedPresetState.ready
      ? selectedPresetOpen ? `${selectedPreset.name} 已启用` : `${selectedPreset.name} 可启用`
      : `${selectedPreset.name} 未接入`
    : canSave ? "配置有效" : "配置未完成";

  return (
    <div className="starter-upgrade-page battle-setting-page">
      <section className="starter-upgrade-shell battle-setting-shell">
        <div className="starter-upgrade-main">
          <nav className="starter-upgrade-tabs">
            {BATTLE_SETTING_TABS.map(tab => (
              <button className={activeTab === tab.id ? "selected" : ""} onClick={() => { setActiveTab(tab.id); setNotice(""); }} key={tab.id}>
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="starter-upgrade-list battle-setting-list">
            {activeTab === "regions" ? BATTLE_GENERATION_OPTIONS.map(option => {
              const selected = setting.allowed_generations.includes(option.generation);
              return (
                <button className={`starter-upgrade-row battle-setting-row ${selected ? "selected" : ""}`} onClick={() => toggleGeneration(option.generation)} key={option.generation}>
                  <span>{option.region}</span>
                  <small>第 {option.generation} 世代</small>
                  <b>{selected ? "已选" : "未选"}</b>
                </button>
              );
            }) : null}
            {activeTab === "systems" ? BATTLE_RULE_PRESET_OPTIONS.map(option => {
              const selected = setting.battle_rule_preset === option.id;
              const presetState = BATTLE_RULE_PRESET_STATE[option.id];
              const selectedForDetail = selectedPresetId === option.id;
              return (
                <button className={`starter-upgrade-row battle-setting-row ${selected ? "selected" : ""} ${selectedForDetail ? "focused" : ""} ${!presetState.ready ? "unavailable" : ""}`} onClick={() => selectPreset(option.id)} key={option.id}>
                  <span>{option.name}</span>
                  <small>{presetState.summary}</small>
                  <b>{presetState.ready ? (selected ? "当前" : "选择") : "未接入"}</b>
                </button>
              );
            }) : null}
            {activeTab === "legendary" ? (
              <>
                <button className={`starter-upgrade-row battle-setting-row ${!setting.legendary_battle ? "selected" : ""}`} onClick={() => setSetting(current => ({...current, legendary_battle: false}))}>
                  <span>关闭神战</span>
                  <small>随机池排除 tier10 神兽/幻兽档。</small>
                  <b>{!setting.legendary_battle ? "当前" : "选择"}</b>
                </button>
                <button className={`starter-upgrade-row battle-setting-row ${setting.legendary_battle ? "selected" : ""}`} onClick={() => setSetting(current => ({...current, legendary_battle: true}))}>
                  <span>开启神战</span>
                  <small>随机池允许 tier10 神兽/幻兽档，每队最多 1 只。</small>
                  <b>{setting.legendary_battle ? "当前" : "选择"}</b>
                </button>
              </>
            ) : null}
          </div>
        </div>
        <aside className="starter-upgrade-detail battle-setting-detail">
          <div>
            <span>对局偏好</span>
            <h3>{activeTab === "systems" ? selectedPreset.name : detailTitle}</h3>
            <p>{detailText}</p>
            <strong>{detailStrong}</strong>
            <small>{notice || "保存后从下一局新挑战开始生效。"}</small>
          </div>
          <div className="starter-upgrade-actions">
            <button disabled={!canSave || saving} onClick={saveSetting}>{saving ? "保存中" : "保存"}</button>
            <button onClick={onBack}>返回</button>
          </div>
          <footer>地区 {selectedRegionCount}/9　规则 {selectedPreset.name}</footer>
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

function battleSystemLabel(system: BattleSystemId): string {
  return ({mega: "Mega", zmove: "Z 招式", dynamax: "极巨化", terastal: "太晶化"} as Record<BattleSystemId, string>)[system] || system;
}

function rentalSpecialBadges(pokemon: RentalPokemon): string[] {
  return [
    pokemon.is_mythical ? "幻兽" : "",
    !pokemon.is_mythical && pokemon.is_legendary ? "神兽" : "",
    pokemon.item_battle_system ? battleSystemLabel(pokemon.item_battle_system) : "",
    pokemon.tera_type_zh ? `太晶珠:${pokemon.tera_type_zh}` : "",
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
            const badges = rentalSpecialBadges(candidate);
            const hasLegendaryBadge = Boolean(candidate.is_legendary || candidate.is_mythical);
            const hasSystemBadge = Boolean(candidate.item_battle_system || candidate.tera_type);
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
