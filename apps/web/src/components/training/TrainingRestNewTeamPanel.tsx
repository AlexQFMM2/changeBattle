import {useEffect, useMemo, useState, type CSSProperties} from "react";
import {motion} from "motion/react";
import type {ChangeBattleV2Api, DexStatId, LocalPokemonV4, StatTableV4, TrainingMoveSlotV4, TrainingPlayerDraftV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "../dex/MoveCard.css";
import "./TrainingRestNewTeamPanel.css";

export type TrainingRestNewTeamPanelProps = {
  api: ChangeBattleV2Api;
  open: boolean;
  localTeam: TrainingPlayerDraftV4["localTeam"] | null;
  onClose: () => void;
  onLocalTeamChange: (localTeam: TrainingPlayerDraftV4["localTeam"]) => void;
};

type DexMoveSummaryV4 = ReturnType<ChangeBattleV2Api["getPokemonDetail"]>["learnset"][number];

const STATUS_LABEL: Record<string, string> = {
  "": "正常",
  brn: "灼伤",
  par: "麻痹",
  psn: "中毒",
  tox: "剧毒",
  slp: "睡眠",
  frz: "冰冻",
};

const STAT_ROWS: Array<[DexStatId, string]> = [
  ["hp", "HP"],
  ["atk", "攻击"],
  ["def", "防御"],
  ["spa", "特攻"],
  ["spd", "特防"],
  ["spe", "速度"],
];

const NATURE_LABEL: Record<string, string> = {
  Hardy: "勤奋",
  Lonely: "怕寂寞",
  Brave: "勇敢",
  Adamant: "固执",
  Naughty: "顽皮",
  Bold: "大胆",
  Docile: "坦率",
  Relaxed: "悠闲",
  Impish: "淘气",
  Lax: "乐天",
  Timid: "胆小",
  Hasty: "急躁",
  Serious: "认真",
  Jolly: "爽朗",
  Naive: "天真",
  Modest: "内敛",
  Mild: "慢吞吞",
  Quiet: "冷静",
  Bashful: "害羞",
  Rash: "马虎",
  Calm: "温和",
  Gentle: "温顺",
  Sassy: "自大",
  Careful: "慎重",
  Quirky: "浮躁",
};

const FALLBACK_MOVES = ["tackle", "quickattack", "protect", "rest"];
type LockKindV4 = "ivs" | "evs" | "moves";

export function TrainingRestNewTeamPanel({api, open, localTeam, onClose, onLocalTeamChange}: TrainingRestNewTeamPanelProps) {
  const team = localTeam?.pokemon || [];
  const [selectedPokemonId, setSelectedPokemonId] = useState(team[0]?.localPokemonId || "");
  const selectedPokemon = team.find(pokemon => pokemon.localPokemonId === selectedPokemonId) || team[0] || null;

  useEffect(() => {
    if (!team.length) {
      setSelectedPokemonId("");
      return;
    }
    if (!team.some(pokemon => pokemon.localPokemonId === selectedPokemonId)) {
      setSelectedPokemonId(team[0]?.localPokemonId || "");
    }
  }, [selectedPokemonId, team]);

  function updatePokemon(pokemonId: string, updater: (pokemon: LocalPokemonV4) => LocalPokemonV4) {
    if (!localTeam) return;
    const nextPokemon = localTeam.pokemon.map(pokemon => pokemon.localPokemonId === pokemonId ? finalizePokemon(api, updater(pokemon)) : pokemon);
    onLocalTeamChange({...localTeam, pokemon: nextPokemon});
  }

  function randomizePart(part: "all" | "nature" | "ability" | "ivs" | "evs", pokemon: LocalPokemonV4) {
    updatePokemon(pokemon.localPokemonId, current => {
      const detail = api.getPokemonDetail(current.speciesId);
      const patch: Partial<LocalPokemonV4> = {};
      if (part === "all" || part === "nature") patch.nature = pick(Object.keys(NATURE_LABEL)) || current.nature;
      if (part === "all" || part === "ability") {
        const ability = pick(detail.abilities) || detail.abilities[0];
        patch.abilityId = ability?.id || current.abilityId;
        patch.abilityName = ability?.name || current.abilityName;
        patch.abilityNameZh = ability?.nameZh || ability?.name || current.abilityNameZh;
      }
      if (part === "all" || part === "ivs") patch.ivs = randomIvs(current.ivs, current.locks?.ivs);
      if (part === "all" || part === "evs") patch.evs = randomEvs(current.evs, current.locks?.evs);
      return {...current, ...patch};
    });
  }

  function randomizeMoves(pokemon: LocalPokemonV4) {
    updatePokemon(pokemon.localPokemonId, current => {
      const detail = api.getPokemonDetail(current.speciesId);
      return {...current, moves: randomMoveSlots(api, detail.learnset, current.moves, current.locks?.moves)};
    });
  }

  function toggleLock(pokemon: LocalPokemonV4, kind: LockKindV4, key: DexStatId | number) {
    updatePokemon(pokemon.localPokemonId, current => {
      if (kind === "moves") {
        const moveKey = Number(key);
        return {...current, locks: {...current.locks, moves: {...current.locks?.moves, [moveKey]: !current.locks?.moves?.[moveKey]}}};
      }
      const stat = key as DexStatId;
      return {...current, locks: {...current.locks, [kind]: {...current.locks?.[kind], [stat]: !current.locks?.[kind]?.[stat]}}};
    });
  }

  function movePokemon(fromIndex: number, direction: -1 | 1) {
    if (!localTeam) return;
    const toIndex = fromIndex + direction;
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= localTeam.pokemon.length || toIndex >= localTeam.pokemon.length) return;
    const nextPokemon = [...localTeam.pokemon];
    const [moved] = nextPokemon.splice(fromIndex, 1);
    if (!moved) return;
    nextPokemon.splice(toIndex, 0, moved);
    setSelectedPokemonId(moved.localPokemonId);
    onLocalTeamChange({...localTeam, pokemon: nextPokemon});
  }

  return (
    <>
      <motion.section
        className={`training-rest-new-team-detail training-rest-ui-panel ${open ? "open" : ""}`}
        aria-label="我的队伍宝可梦详情"
        initial={false}
        animate={open ? {opacity: 1, y: 0, scale: 1} : {opacity: 0, y: 8, scale: 0.985}}
        transition={{duration: 0.16}}
      >
        {open ? selectedPokemon ? (
          <TrainingRestNewPokemonDetail
            api={api}
            pokemon={selectedPokemon}
            onClose={onClose}
            onRandomizePart={part => randomizePart(part, selectedPokemon)}
            onRandomizeMoves={() => randomizeMoves(selectedPokemon)}
            onToggleLock={(kind, key) => toggleLock(selectedPokemon, kind, key)}
          />
        ) : <div className="training-rest-new-team-empty">当前队伍里还没有宝可梦。<button type="button" onClick={onClose}>关闭</button></div> : null}
      </motion.section>
      <motion.section
        className={`training-rest-new-team-drawer ${open ? "open" : ""}`}
        aria-label="我的队伍列表"
        initial={false}
        animate={open ? {y: 0, opacity: 1} : {y: "110%", opacity: 0}}
        transition={{duration: 0.18}}
      >
        <div className="training-rest-new-team-slots">
          {team.length ? team.slice(0, 6).map((pokemon, index) => (
            <TrainingRestNewTeamSlot
              pokemon={pokemon}
              index={index}
              canMoveUp={index > 0}
              canMoveDown={index < Math.min(team.length, 6) - 1}
              selected={pokemon.localPokemonId === selectedPokemon?.localPokemonId}
              onSelect={() => setSelectedPokemonId(pokemon.localPokemonId)}
              onMoveUp={() => movePokemon(index, -1)}
              onMoveDown={() => movePokemon(index, 1)}
              key={pokemon.localPokemonId}
            />
          )) : <span className="training-rest-new-team-empty compact">暂无宝可梦</span>}
        </div>
      </motion.section>
    </>
  );
}

function TrainingRestNewTeamSlot({
  pokemon,
  index,
  canMoveUp,
  canMoveDown,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
}: {
  pokemon: LocalPokemonV4;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const hpRate = pokemon.maxHp ? Math.max(0, Math.min(100, pokemon.entryHp / pokemon.maxHp * 100)) : 0;
  const status = STATUS_LABEL[pokemon.entryStatus] || pokemon.entryStatus || "";
  return (
    <div
      className={`training-rest-new-team-slot ${selected ? "selected" : ""} ${pokemon.entryHp <= 0 ? "status-fnt" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onSelect();
      }}
    >
      <span className="training-rest-new-team-slot-index">{index + 1}</span>
      <span className="training-rest-new-team-order-controls" aria-label="调整队伍顺序">
        <button
          type="button"
          disabled={!canMoveUp}
          aria-label={`${pokemon.nameZh || pokemon.name}上移`}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            onMoveUp();
          }}
        >▲</button>
        <button
          type="button"
          disabled={!canMoveDown}
          aria-label={`${pokemon.nameZh || pokemon.name}下移`}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            onMoveDown();
          }}
        >▼</button>
      </span>
      {status && status !== "正常" ? <em>{status}</em> : null}
      <TrainingRestNewPokemonSprite pokemon={pokemon} kind="icon" />
      <strong>{pokemon.nameZh || pokemon.name}</strong>
      <small>Lv.{pokemon.level}</small>
      <i style={{"--rest-new-hp-rate": `${hpRate}%`} as CSSProperties} />
    </div>
  );
}

function TrainingRestNewPokemonDetail({api, pokemon, onClose, onRandomizePart, onRandomizeMoves, onToggleLock}: {
  api: ChangeBattleV2Api;
  pokemon: LocalPokemonV4;
  onClose: () => void;
  onRandomizePart: (part: "all" | "nature" | "ability" | "ivs" | "evs") => void;
  onRandomizeMoves: () => void;
  onToggleLock: (kind: LockKindV4, key: DexStatId | number) => void;
}) {
  const hpRate = pokemon.maxHp ? Math.max(0, Math.min(100, pokemon.entryHp / pokemon.maxHp * 100)) : 0;
  const detail = useMemo(() => api.getPokemonDetail(pokemon.speciesId), [api, pokemon.speciesId]);
  const statsResult = useMemo(() => api.dex.calculatePokemonStats({
    speciesId: pokemon.speciesId,
    level: pokemon.level,
    nature: pokemon.nature,
    evs: pokemon.evs,
    ivs: pokemon.ivs,
  }), [api, pokemon.evs, pokemon.ivs, pokemon.level, pokemon.nature, pokemon.speciesId]);
  const maxStatsResult = useMemo(() => api.dex.getPokemonMaxStats({
    speciesId: pokemon.speciesId,
    level: pokemon.level,
  }), [api, pokemon.level, pokemon.speciesId]);
  const calculated = statsResult.stats;
  const maxPotentialStats = maxStatsResult.stats;
  const heldItemName = itemName(api, pokemon.itemId);
  return (
    <article className="training-rest-new-pokemon-detail-card">
      <button className="training-rest-new-team-close" type="button" onClick={onClose} aria-label="关闭队伍面板">×</button>
      <div className="training-rest-new-pokemon-top-grid">
        <section className="training-rest-new-pokemon-profile-area">
          <h3 className="training-rest-new-pokemon-title">{pokemon.nameZh || pokemon.name}<small>Lv.{pokemon.level}</small></h3>
          <div className="training-rest-new-pokemon-identity">
            <TrainingRestNewPokemonSprite pokemon={pokemon} kind="front" />
            <div className="training-rest-new-pokemon-namebox">
              <div className="training-rest-new-type-row">
                {detail.types.map(type => <b className={`type-${moveTypeId(type) || "normal"}`} key={type}>{typeLabel(type)}</b>)}
              </div>
              <div className="training-rest-new-trait-row">
                <span>特性：{pokemon.abilityNameZh || "特性未定"}</span>
                <span>性格：{natureLabel(pokemon.nature)}</span>
                <span>道具：{heldItemName}</span>
              </div>
            </div>
          </div>
          <div className="training-rest-new-pokemon-hp">
            <span>HP</span>
            <strong>{pokemon.entryHp}/{pokemon.maxHp}</strong>
            <i style={{"--rest-new-hp-rate": `${hpRate}%`} as CSSProperties} />
          </div>
        </section>
        <section className="training-rest-new-pokemon-stat-area">
          <dl className="training-rest-new-stat-list">
          <div className="training-rest-new-stat-head">
            <dt>能力</dt>
            <dd><span>当前数值</span><span>个体值</span><span>努力值</span></dd>
          </div>
          {STAT_ROWS.map(([stat, label]) => {
            const statMax = Math.max(maxPotentialStats[stat] || calculated[stat] || 1, 1);
            const statRate = Math.max(4, Math.min(100, calculated[stat] / statMax * 100));
            return (
              <div className={`training-rest-new-stat-row stat-tone-${stat}`} key={stat}>
                <dt>{label}</dt>
                <dd>
                  <strong style={{"--rest-new-stat-rate": `${statRate}%`} as CSSProperties}>
                    <span>{calculated[stat]}</span>
                    <i aria-hidden="true" />
                  </strong>
                  <span>{pokemon.ivs[stat]}<LockButton locked={Boolean(pokemon.locks?.ivs?.[stat])} onClick={() => onToggleLock("ivs", stat)} /></span>
                  <span>{pokemon.evs[stat]}<LockButton locked={Boolean(pokemon.locks?.evs?.[stat])} onClick={() => onToggleLock("evs", stat)} /></span>
                </dd>
              </div>
            );
            })}
          </dl>
        </section>
      </div>
      <section className="training-rest-new-pokemon-move-area">
        <div className="training-rest-new-move-row">
          {pokemon.moves.map((move, index) => (
            <TrainingRestNewMoveCard move={move} locked={Boolean(pokemon.locks?.moves?.[index])} onToggleLock={() => onToggleLock("moves", index)} key={`${move.moveId}-${index}`} />
          ))}
        </div>
      </section>
      <div className="training-rest-new-detail-actions">
        <button type="button" onClick={() => onRandomizePart("ivs")}>🎲 随机个体（免费）</button>
        <button type="button" onClick={() => onRandomizePart("evs")}>🎲 随机努力（免费）</button>
        <button type="button" onClick={onRandomizeMoves}>🎲 随机技能（免费）</button>
      </div>
    </article>
  );
}

function LockButton({locked, onClick}: {locked: boolean; onClick: () => void}) {
  return (
    <button className={`training-rest-new-lock-button ${locked ? "locked" : ""}`} type="button" onClick={onClick} aria-label={locked ? "取消锁定" : "锁定"}>
      <span aria-hidden="true" />
    </button>
  );
}

function TrainingRestNewMoveCard({move, locked, onToggleLock}: {move: TrainingMoveSlotV4; locked: boolean; onToggleLock: () => void}) {
  const typeId = moveTypeId(move.type) || "normal";
  return (
    <div className={`training-rest-new-move-card move-card move-choice move-card-dex quick-dex-move-card move-type-${typeId}`}>
      <LockButton locked={locked} onClick={onToggleLock} />
      <span className="move-name-row">
        <strong>{move.nameZh || move.name || move.moveId}</strong>
        <i>{categoryLabel(move.category)}</i>
      </span>
      <span className="move-meta-row">
        <b>{move.type || "?"}</b>
        <em>威 {move.power || "-"}</em>
        <em>命 {move.accuracy ?? "-"}</em>
        <em>PP {move.remainingPp}/{move.maxPp || move.pp || "-"}</em>
      </span>
    </div>
  );
}

function TrainingRestNewPokemonSprite({pokemon, kind}: {pokemon: LocalPokemonV4; kind: "icon" | "front"}) {
  if (kind === "icon" && pokemon.iconStyle) {
    return <span className="training-rest-new-pokemon-icon picon" aria-hidden="true" style={styleFromCss(pokemon.iconStyle)} />;
  }
  const src = kind === "front"
    ? ((pokemon.shiny ? pokemon.shinySpriteUrl : pokemon.spriteUrl) || pokemon.iconUrl || "")
    : (pokemon.spriteUrl || pokemon.iconUrl || "");
  return <ImageWithFallback src={src} alt={pokemon.nameZh} fallback={pokemon.nameZh.slice(0, 1) || "?"} />;
}

function natureLabel(nature: string): string {
  return NATURE_LABEL[nature] || nature || "未知";
}

function itemName(api: ChangeBattleV2Api, itemId: string): string {
  if (!itemId) return "无道具";
  try {
    const detail = api.getItemDetail(itemId);
    return detail.nameZh || detail.name || itemId;
  } catch {
    return itemId;
  }
}

function categoryLabel(category: string): string {
  const id = toId(category);
  if (id === "physical") return "物理";
  if (id === "special") return "特殊";
  if (id === "status") return "变化";
  return category || "?";
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function moveTypeId(value: unknown): string {
  const raw = String(value || "").trim();
  const normalized = toId(raw);
  if (normalized) return normalized;
  return TYPE_ID_BY_ZH[raw] || "";
}

function typeLabel(value: string): string {
  return TYPE_ZH_BY_ID[moveTypeId(value)] || value;
}

const TYPE_ID_BY_ZH: Record<string, string> = {
  一般: "normal",
  普通: "normal",
  火: "fire",
  水: "water",
  电: "electric",
  草: "grass",
  冰: "ice",
  格斗: "fighting",
  毒: "poison",
  地面: "ground",
  飞行: "flying",
  超能力: "psychic",
  虫: "bug",
  岩石: "rock",
  幽灵: "ghost",
  龙: "dragon",
  恶: "dark",
  钢: "steel",
  妖精: "fairy",
};

const TYPE_ZH_BY_ID: Record<string, string> = {
  normal: "一般",
  fire: "火",
  water: "水",
  electric: "电",
  grass: "草",
  ice: "冰",
  fighting: "格斗",
  poison: "毒",
  ground: "地面",
  flying: "飞行",
  psychic: "超能力",
  bug: "虫",
  rock: "岩石",
  ghost: "幽灵",
  dragon: "龙",
  dark: "恶",
  steel: "钢",
  fairy: "妖精",
};

function styleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url(${match[1]})`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}

function finalizePokemon(api: ChangeBattleV2Api, pokemon: LocalPokemonV4): LocalPokemonV4 {
  const maxHp = api.dex.calculatePokemonStats({
    speciesId: pokemon.speciesId,
    level: pokemon.level,
    nature: pokemon.nature,
    evs: pokemon.evs,
    ivs: pokemon.ivs,
  }).stats.hp;
  return {...pokemon, maxHp, entryHp: Math.max(0, Math.min(maxHp, pokemon.entryHp))};
}

function randomMoveSlots(api: ChangeBattleV2Api, learnset: DexMoveSummaryV4[], currentMoves: TrainingMoveSlotV4[] = [], locks: Record<number, boolean> = {}): TrainingMoveSlotV4[] {
  const usable = shuffle(learnset.filter(move => move.id && move.pp > 0));
  const selected = usable.slice(0, 4);
  for (const moveId of FALLBACK_MOVES) {
    if (selected.length >= 4) break;
    try {
      selected.push(api.getMoveDetail(moveId));
    } catch {
      // Ignore missing fallback.
    }
  }
  const nextMoves = selected.slice(0, 4).map(moveSlot);
  return Array.from({length: 4}, (_, index) => locks[index] && currentMoves[index] ? currentMoves[index] : nextMoves[index] || currentMoves[index] || nextMoves[0]).filter(Boolean);
}

function moveSlot(move: DexMoveSummaryV4): TrainingMoveSlotV4 {
  return {
    moveId: move.id,
    name: move.name,
    nameZh: move.nameZh,
    type: move.type,
    category: move.category,
    power: move.power,
    accuracy: move.accuracy,
    pp: move.pp,
    maxPp: move.pp,
    remainingPp: move.pp,
  };
}

function randomIvs(current: StatTableV4, locks: Partial<Record<DexStatId, boolean>> = {}): StatTableV4 {
  return Object.fromEntries(STAT_ROWS.map(([stat]) => [stat, locks[stat] ? current[stat] : randomInt(0, 31)])) as StatTableV4;
}

function randomEvs(current: StatTableV4, locks: Partial<Record<DexStatId, boolean>> = {}): StatTableV4 {
  const evs = Object.fromEntries(STAT_ROWS.map(([stat]) => [stat, 0])) as StatTableV4;
  let remaining = 510 - STAT_ROWS.reduce((sum, [stat]) => sum + (locks[stat] ? current[stat] : 0), 0);
  for (const [stat] of STAT_ROWS) {
    if (locks[stat]) evs[stat] = current[stat];
  }
  for (const [stat] of shuffle(STAT_ROWS.filter(([stat]) => !locks[stat]))) {
    if (remaining <= 0) break;
    const value = randomInt(0, Math.min(252, remaining));
    evs[stat] = value;
    remaining -= value;
  }
  return evs;
}

function pick<T>(entries: T[]): T | undefined {
  return entries[Math.floor(Math.random() * entries.length)];
}

function shuffle<T>(entries: T[]): T[] {
  return [...entries].sort(() => Math.random() - 0.5);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
