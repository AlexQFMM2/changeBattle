import {useEffect, useMemo, useRef, useState, type CSSProperties} from "react";
import type {
  ChangeBattleV2Api,
  DexStatId,
  FormalTrainingGroundApplyInputV4,
  FormalTrainingGroundLessonViewV4,
  FormalTrainingGroundResultV4,
  LocalPokemonV4,
  StatTableV4,
  TrainingMoveSlotV4,
  TrainingPlayerDraftV4,
} from "@changebattle-v2/api";
import {MoveCard} from "../formal/move/MoveCard";
import {TrainingRestShopDialogue} from "./TrainingRestShopDialogue";
import {TrainingRestShopInteractionPanel} from "./TrainingRestShopInteractionPanel";
import {assetUrl, styleUrlAssetPath} from "../../lib/assetUrl";
import {localPokemonFrontSpriteUrl} from "../../lib/showdownPokemonSpriteAdapter";
import "./TrainingRestTrainingGroundScene.css";

export type TrainingRestTrainingGroundSceneProps = {
  api: ChangeBattleV2Api;
  open: boolean;
  lesson?: FormalTrainingGroundLessonViewV4 | null;
  lessonOptions?: FormalTrainingGroundLessonViewV4[];
  player?: TrainingPlayerDraftV4 | null;
  money: number;
  busy?: boolean;
  onApply?: (input: FormalTrainingGroundApplyInputV4) => Promise<FormalTrainingGroundResultV4> | FormalTrainingGroundResultV4;
  onBack: () => void;
  onSelectLesson?: (lesson: FormalTrainingGroundLessonViewV4) => void;
  onCancelLesson?: () => void;
  onLessonComplete?: (message: string) => void;
};

const TRAINING_GROUND_WELCOME_TEXT = "今天的课程已经排好了，要让哪只宝可梦进教室呢？";
const TRAINING_GROUND_PICKER_TEXT = "今天教室都空出来了。先在上面的课程牌里选一门课，我会告诉你这堂课适合做什么。";
const STAT_LABELS = {hp: "HP", atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度"} as const;
const STAT_IDS = Object.keys(STAT_LABELS) as DexStatId[];
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
const TYPE_ID_BY_ZH: Record<string, string> = Object.fromEntries(Object.entries(TYPE_ZH_BY_ID).map(([id, label]) => [label, id]));
const NATURE_LABEL: Record<string, string> = {
  hardy: "勤奋",
  lonely: "怕寂寞",
  brave: "勇敢",
  adamant: "固执",
  naughty: "顽皮",
  bold: "大胆",
  docile: "坦率",
  relaxed: "悠闲",
  impish: "淘气",
  lax: "乐天",
  timid: "胆小",
  hasty: "急躁",
  serious: "认真",
  jolly: "爽朗",
  naive: "天真",
  modest: "内敛",
  mild: "慢吞吞",
  quiet: "冷静",
  bashful: "害羞",
  rash: "马虎",
  calm: "温和",
  gentle: "温顺",
  sassy: "自大",
  careful: "慎重",
  quirky: "浮躁",
};
const PANEL_SWAP_MS = 380;
const STUDYING_MS = 2000;

type TrainingGroundStep = "pokemon" | "move" | "replace" | "result";
type TrainingGroundResultState = {
  result: FormalTrainingGroundResultV4;
  pokemonBefore: LocalPokemonV4;
  moveLearned?: ReturnType<ChangeBattleV2Api["getMoveDetail"]>;
  replacedMove?: TrainingMoveSlotV4;
};

export function TrainingRestTrainingGroundScene({api, open, lesson, lessonOptions = [], player, money, busy = false, onApply, onBack, onSelectLesson, onCancelLesson, onLessonComplete}: TrainingRestTrainingGroundSceneProps) {
  const [step, setStep] = useState<TrainingGroundStep | null>(null);
  const [dialogueText, setDialogueText] = useState(TRAINING_GROUND_WELCOME_TEXT);
  const [selectedPokemonId, setSelectedPokemonId] = useState("");
  const [selectedMoveId, setSelectedMoveId] = useState("");
  const [replaceMoveIndex, setReplaceMoveIndex] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [studying, setStudying] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [resultState, setResultState] = useState<TrainingGroundResultState | null>(null);
  const timersRef = useRef<number[]>([]);
  const team = player?.localTeam.pokemon || [];
  const selectedLessonOption = lessonOptions.find(option => option.lessonId === selectedLessonId) || lessonOptions[0] || null;
  const selectedPokemon = team.find(pokemon => pokemon.localPokemonId === selectedPokemonId) || team[0] || null;
  const movePool = useMemo(() => lesson && selectedPokemon ? lessonMovePool(api, lesson, selectedPokemon.speciesId) : [], [api, lesson, selectedPokemon]);
  const availableMoves = useMemo(() => {
    const known = new Set((selectedPokemon?.moves || []).map(move => normalizeId(move.moveId)));
    return movePool.filter(move => !known.has(normalizeId(move.id)));
  }, [movePool, selectedPokemon]);

  useEffect(() => {
    if (!open) return;
    clearTimers();
    setStep(lesson ? "pokemon" : null);
    setDialogueText(lesson ? trainingLessonStartText(team) : trainingLessonPickerText(lessonOptions));
    setSelectedLessonId(lessonOptions[0]?.lessonId || "");
    setSelectedPokemonId(team[0]?.localPokemonId || "");
    setSelectedMoveId("");
    setReplaceMoveIndex(null);
    setStudying(false);
    setResultState(null);
  }, [lesson?.lessonId, lessonOptions.map(option => option.lessonId).join("|"), open]);

  useEffect(() => {
    if (lesson || !lessonOptions.length) return;
    if (!selectedLessonOption) {
      setSelectedLessonId(lessonOptions[0]?.lessonId || "");
      return;
    }
    setDialogueText(courseDialogueText(selectedLessonOption));
  }, [lesson, lessonOptions, selectedLessonOption?.lessonId]);

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (!selectedPokemon && team[0]) setSelectedPokemonId(team[0].localPokemonId);
  }, [selectedPokemon, team]);

  function leaveTrainingGround() {
    clearTimers();
    setStep(null);
    setStudying(false);
    setDialogueText(TRAINING_GROUND_WELCOME_TEXT);
    onBack();
  }

  function enterLesson() {
    if (!lesson) {
      setDialogueText("今天暂时没有课程。");
      return;
    }
    if (!team.length) {
      setDialogueText("队伍里还没有可以上课的宝可梦。");
      return;
    }
    setResultState(null);
    setStep("pokemon");
    setDialogueText("先选择一只宝可梦进入课堂。");
  }

  function clearTimers() {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  }

  function queueTimer(callback: () => void, delayMs: number) {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter(entry => entry !== timer);
      callback();
    }, delayMs);
    timersRef.current.push(timer);
  }

  function swapPanel(nextStep: TrainingGroundStep) {
    setStep(null);
    queueTimer(() => setStep(nextStep), PANEL_SWAP_MS);
  }

  function proceedFromPokemon() {
    if (!lesson || !selectedPokemon) return;
    if (lesson.kind === "self-study") {
      void applyLesson();
      return;
    }
    setSelectedMoveId("");
    setReplaceMoveIndex(null);
    setDialogueText(`给${pokemonName(selectedPokemon)}选一招要学习的课程内容。`);
    swapPanel("move");
  }

  function selectMove(moveId: string) {
    setSelectedMoveId(moveId);
    setReplaceMoveIndex(null);
    const move = movePool.find(entry => normalizeId(entry.id) === normalizeId(moveId));
    setDialogueText(`选择了${move?.nameZh || move?.name || moveId}。接下来选择要忘记的招式。`);
    swapPanel("replace");
  }

  async function applyLesson() {
    if (!lesson || !selectedPokemon || !onApply) {
      setDialogueText("课程功能正在整理中。");
      return;
    }
    const input: FormalTrainingGroundApplyInputV4 = lesson.kind === "self-study"
      ? {pokemonId: selectedPokemon.localPokemonId}
      : {pokemonId: selectedPokemon.localPokemonId, moveId: selectedMoveId, replaceMoveIndex: replaceMoveIndex ?? undefined};
    const pokemonBefore = selectedPokemon;
    const replacedMove = replaceMoveIndex === null ? undefined : selectedPokemon.moves[replaceMoveIndex];
    const moveLearned = selectedMoveId ? safeMoveDetail(api, selectedMoveId) || undefined : undefined;
    setStep(null);
    setStudying(true);
    setApplying(true);
    try {
      await waitForStudyAnimation();
      const result = await onApply(input);
      if (!result.ok) {
        setDialogueText(result.message);
        setStep(lesson.kind === "self-study" ? "pokemon" : "replace");
        return;
      }
      setResultState({result, pokemonBefore, moveLearned, replacedMove});
      setDialogueText(result.message);
      setStep("result");
    } catch (error) {
      setDialogueText(error instanceof Error ? error.message : "课程结算失败。");
      setStep(lesson.kind === "self-study" ? "pokemon" : "replace");
    } finally {
      setStudying(false);
      setApplying(false);
    }
  }

  function waitForStudyAnimation() {
    return new Promise<void>(resolve => queueTimer(resolve, STUDYING_MS));
  }

  const dialogueActions = buildDialogueActions({
    step,
    lesson,
    applying,
    replaceMoveIndex,
    onBack: () => {
      setStep(null);
      setResultState(null);
      setDialogueText(lesson?.introText || trainingLessonPickerText(lessonOptions));
    },
    onEnter: enterLesson,
    onProceedPokemon: proceedFromPokemon,
    onApply: () => void applyLesson(),
    onLessonComplete: () => {
      setStep(null);
      onLessonComplete?.(resultState?.result.message || "课程结束了。");
    },
    onLeave: leaveTrainingGround,
    onCancelLesson: onCancelLesson ? () => {
      clearTimers();
      setStep(null);
      setStudying(false);
      setResultState(null);
      setDialogueText(trainingLessonPickerText(lessonOptions));
      onCancelLesson();
    } : undefined,
    lessonOptions,
    selectedLessonOption,
    onSelectLesson,
  });
  const dialogueSpeaker = lesson ? lesson.teacherLabel : selectedLessonOption ? courseTeacherLabel(selectedLessonOption) : "训练场";
  const dialogueItemName = step && selectedPokemon ? pokemonName(selectedPokemon) : lesson ? courseTitle(lesson) : selectedLessonOption ? courseTitle(selectedLessonOption) : undefined;

  return (
    <section className="training-rest-training-ground-scene" data-open={open ? "true" : "false"} aria-label="训练场场景" aria-hidden={!open}>
      <div className="training-rest-training-ground-back" aria-hidden="true">
        <div className="training-rest-training-ground-board" />
        <div className="training-rest-training-ground-floor" />
      </div>
      <div className="training-rest-training-ground-money" aria-label="当前金币">
        <img src={assetUrl("aboutIcon/coin.png")} alt="" draggable={false} />
        <strong>{Math.max(0, Math.floor(money)).toLocaleString()}</strong>
      </div>
      {lesson ? (
        <div className="training-rest-training-ground-badge">
          <strong>{lesson.teacherLabel}</strong>
          <span>{lesson.fee.toLocaleString()} 金币</span>
        </div>
      ) : null}
      {busy ? <div className="training-rest-training-ground-busy" role="status">整理课堂中</div> : null}
      {!lesson && lessonOptions.length ? (
        <TrainingRestShopInteractionPanel mode="buy">
          <div className="training-rest-training-ground-panel">
            <CoursePickerPanel
              lessons={lessonOptions}
              selectedLessonId={selectedLessonOption?.lessonId || ""}
              onSelect={lessonOption => {
                setSelectedLessonId(lessonOption.lessonId);
                setDialogueText(courseDialogueText(lessonOption));
              }}
            />
          </div>
        </TrainingRestShopInteractionPanel>
      ) : null}
      {step ? (
        <TrainingRestShopInteractionPanel mode="buy">
          <div className="training-rest-training-ground-panel">
            {step === "pokemon" ? (
              <PokemonSelectPanel
                team={team}
                selectedPokemonId={selectedPokemon?.localPokemonId || ""}
                onSelect={pokemonId => {
                  setSelectedPokemonId(pokemonId);
                  setSelectedMoveId("");
                  setReplaceMoveIndex(null);
                }}
              />
            ) : null}
            {step === "move" ? (
              <MoveLessonPanel
                moves={availableMoves}
                selectedMoveId={selectedMoveId}
                onMove={selectMove}
              />
            ) : null}
            {step === "replace" ? (
              <MoveReplacePanel
                currentMoves={selectedPokemon?.moves || []}
                replaceMoveIndex={replaceMoveIndex}
                onReplace={setReplaceMoveIndex}
              />
            ) : null}
            {step === "result" && resultState ? (
              <TrainingResultPanel api={api} state={resultState} />
            ) : null}
          </div>
        </TrainingRestShopInteractionPanel>
      ) : null}
      {studying ? (
        <div className="training-rest-training-ground-study-modal" role="status" aria-label="学习中">
          <div>
            <strong>学习中</strong>
            <span>{selectedPokemon ? `${pokemonName(selectedPokemon)}正在认真听课...` : "课堂正在进行..."}</span>
          </div>
        </div>
      ) : null}
      <TrainingRestShopDialogue
        speaker={dialogueSpeaker}
        itemName={dialogueItemName}
        portraitSrc="npc/staff/teach.png"
        text={dialogueText}
        actions={dialogueActions}
      />
    </section>
  );
}

function CoursePickerPanel({lessons, selectedLessonId, onSelect}: {
  lessons: FormalTrainingGroundLessonViewV4[];
  selectedLessonId: string;
  onSelect: (lesson: FormalTrainingGroundLessonViewV4) => void;
}) {
  return (
    <div className="training-rest-training-ground-course-grid" role="list" aria-label="课程选择">
      {lessons.slice(0, 4).map(lesson => {
        const detail = courseDetail(lesson);
        return (
          <button
            type="button"
            className="training-rest-training-ground-course-card"
            data-selected={lesson.lessonId === selectedLessonId ? "true" : "false"}
            key={lesson.lessonId}
            onClick={() => onSelect(lesson)}
          >
            <span className="training-rest-training-ground-course-head">
              <strong>{detail.title}</strong>
              <small>{lesson.fee.toLocaleString()} 金币</small>
            </span>
            <span className="training-rest-training-ground-course-teacher">{detail.teacher}</span>
            <span className="training-rest-training-ground-course-desc">{detail.summary}</span>
          </button>
        );
      })}
    </div>
  );
}

function PokemonSelectPanel({team, selectedPokemonId, onSelect}: {team: LocalPokemonV4[]; selectedPokemonId: string; onSelect: (pokemonId: string) => void}) {
  return (
    <div className="training-rest-training-ground-pokemon-only">
      {team.map((pokemon, index) => (
        <button
          type="button"
          data-selected={pokemon.localPokemonId === selectedPokemonId ? "true" : "false"}
          key={pokemon.localPokemonId}
          onClick={() => onSelect(pokemon.localPokemonId)}
        >
          <span className="training-rest-training-ground-pokemon-slot">{index + 1}</span>
          <PokemonCardSprite pokemon={pokemon} />
          <span className="training-rest-training-ground-pokemon-info">
            <strong>{pokemonName(pokemon)}</strong>
            <small>Lv.{pokemon.level}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function PokemonCardSprite({pokemon}: {pokemon: LocalPokemonV4}) {
  const alt = pokemonName(pokemon);
  if (pokemon.iconStyle) {
    return <span className="training-rest-training-ground-pokemon-sprite" aria-label={alt} style={spriteStyleFromCss(pokemon.iconStyle)} />;
  }
  const src = pokemon.iconUrl || pokemon.spriteUrl || pokemon.frontSpriteUrl || "";
  if (!src) return <span className="training-rest-training-ground-pokemon-sprite" aria-label={alt}>{alt.slice(0, 1) || "?"}</span>;
  return <span className="training-rest-training-ground-pokemon-sprite"><img src={src} alt="" /></span>;
}

function MoveLessonPanel({moves, selectedMoveId, onMove}: {
  moves: Array<{id: string; name: string; nameZh: string; type: string; category: string; power: number; pp: number}>;
  selectedMoveId: string;
  onMove: (moveId: string) => void;
}) {
  return (
    <div className="training-rest-training-ground-move-list" data-layout="single">
      {moves.length ? moves.map(move => (
        <MoveCard
          className="training-rest-training-ground-move-card"
          size="sheet"
          selected={normalizeId(move.id) === normalizeId(selectedMoveId)}
          name={move.nameZh || move.name}
          moveType={move.type}
          typeLabel={typeLabel(move.type)}
          category={categoryLabel(move.category)}
          power={move.power}
          pp={move.pp}
          meta={[`威力 ${move.power || "--"}`, `PP ${move.pp}`]}
          data-selected={normalizeId(move.id) === normalizeId(selectedMoveId) ? "true" : "false"}
          key={move.id}
          onClick={() => onMove(move.id)}
        />
      )) : <p>这堂课暂时没有新的可学招式。</p>}
    </div>
  );
}

function MoveReplacePanel({currentMoves, replaceMoveIndex, onReplace}: {
  currentMoves: TrainingMoveSlotV4[];
  replaceMoveIndex: number | null;
  onReplace: (index: number) => void;
}) {
  return (
    <div className="training-rest-training-ground-replace-only">
      <section>
        <h3>选择要忘记的招式</h3>
        <div className="training-rest-training-ground-current-moves">
          {currentMoves.map((move, index) => (
            <MoveCard
              className="training-rest-training-ground-move-card"
              size="sheet"
              selected={replaceMoveIndex === index}
              name={move.nameZh || move.name || move.moveId}
              moveType={move.type}
              typeLabel={typeLabel(move.type)}
              category={categoryLabel(move.category)}
              power={move.power}
              accuracy={move.accuracy}
              pp={move.remainingPp}
              maxPp={move.maxPp}
              meta={[`威力 ${move.power || "--"}`, `命中 ${move.accuracy ?? "必中"}`, `PP ${move.remainingPp}/${move.maxPp || move.pp || "-"}`]}
              data-selected={replaceMoveIndex === index ? "true" : "false"}
              key={`${move.moveId}-${index}`}
              onClick={() => onReplace(index)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function TrainingResultPanel({api, state}: {api: ChangeBattleV2Api; state: TrainingGroundResultState}) {
  const after = findResultPokemon(state.result, state.pokemonBefore.localPokemonId) || state.pokemonBefore;
  if (state.result.lesson?.kind === "self-study") {
    return <SelfStudyResultPanel api={api} before={state.pokemonBefore} after={after} result={state.result} />;
  }
  return (
    <TrainingGroundPokemonDetailCard
      api={api}
      before={state.pokemonBefore}
      after={after}
      headline="学习成果"
      summary={[
        `学会：${state.moveLearned?.nameZh || state.moveLearned?.name || "新的招式"}`,
        state.replacedMove ? `忘记：${state.replacedMove.nameZh || state.replacedMove.name}` : "课程结束",
      ]}
    />
  );
}

function SelfStudyResultPanel({api, before, after, result}: {api: ChangeBattleV2Api; before: LocalPokemonV4; after: LocalPokemonV4; result: FormalTrainingGroundResultV4}) {
  const eventText = result.selfStudyEvent === "playful"
    ? "贪玩"
    : result.selfStudyEvent === "focused"
      ? "认真学习"
      : "普通自习";
  const summaryText = result.selfStudyEvent === "playful"
    ? "这节课有点分心，但还是有收获。"
    : result.selfStudyEvent === "focused"
      ? "这堂课收获很明显，具体提升看右侧能力表。"
      : "完成了一节自习，具体变化看右侧能力表。";
  return (
    <TrainingGroundPokemonDetailCard
      api={api}
      before={before}
      after={after}
      headline={eventText}
      summary={[summaryText, "课程结束了。"]}
    />
  );
}

function TrainingGroundPokemonDetailCard({api, before, after, headline, summary}: {
  api: ChangeBattleV2Api;
  before: LocalPokemonV4;
  after: LocalPokemonV4;
  headline: string;
  summary: string[];
}) {
  const detail = safePokemonDetail(api, after.speciesId);
  const beforeStats = calculateStats(api, before);
  const afterStats = calculateStats(api, after);
  const maxStats = maxPotentialStats(api, after, afterStats);
  const levelDelta = after.level - before.level;
  const types = detail?.types?.length ? detail.types : [];
  return (
    <article className="training-rest-training-ground-detail-card">
      <section className="training-rest-training-ground-detail-profile">
        <h3 className="training-rest-training-ground-detail-title">
          <span>{pokemonName(after)}</span>
          <small>Lv.{after.level}{levelDelta ? ` ${formatDelta(levelDelta)}` : ""}</small>
        </h3>
        <div className="training-rest-training-ground-detail-identity">
          <TrainingGroundDetailSprite pokemon={after} />
          <div className="training-rest-training-ground-detail-namebox">
            <div className="training-rest-training-ground-type-row">
              {types.length ? types.map(type => (
                <b className="training-rest-training-ground-type-badge" data-type={moveTypeId(type) || "normal"} key={type}>{typeLabel(type)}</b>
              )) : <b className="training-rest-training-ground-type-badge" data-type="normal">一般</b>}
            </div>
            <div className="training-rest-training-ground-trait-row">
              <span>特性：{after.abilityNameZh || after.abilityName || "特性未定"}</span>
              <span>性格：{natureLabel(after.nature)}</span>
              <span>道具：{itemName(api, after.itemId)}</span>
            </div>
          </div>
        </div>
        <div className="training-rest-training-ground-result-notes">
          <strong>{headline}</strong>
          {summary.slice(0, 3).map(line => <span key={line}>{line}</span>)}
        </div>
      </section>
      <section className="training-rest-training-ground-detail-stats">
        <dl className="training-rest-training-ground-stat-list">
          <div className="training-rest-training-ground-stat-head">
            <dt>能力</dt>
            <dd><span>当前数值</span><span>个体值</span><span>努力值</span></dd>
          </div>
          {STAT_IDS.map(stat => {
            const value = afterStats[stat] || 0;
            const beforeValue = beforeStats[stat] || 0;
            const statMax = Math.max(maxStats[stat] || value || 1, 1);
            const statRate = Math.max(4, Math.min(100, value / statMax * 100));
            return (
              <div className="training-rest-training-ground-stat-row" data-stat={stat} key={stat}>
                <dt>{STAT_LABELS[stat]}</dt>
                <dd>
                  <strong style={{"--training-rest-training-ground-stat-rate": `${statRate}%`} as CSSProperties}>
                    <span>{value}<StatDelta value={value - beforeValue} /></span>
                    <i aria-hidden="true" />
                  </strong>
                  <span>{after.ivs[stat]}<StatDelta value={(after.ivs[stat] || 0) - (before.ivs[stat] || 0)} /></span>
                  <span>{after.evs[stat]}<StatDelta value={(after.evs[stat] || 0) - (before.evs[stat] || 0)} /></span>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </article>
  );
}

function TrainingGroundDetailSprite({pokemon}: {pokemon: LocalPokemonV4}) {
  const src = localPokemonFrontSpriteUrl(pokemon);
  if (!src && pokemon.iconStyle) {
    return <span className="training-rest-training-ground-detail-sprite" aria-label={pokemonName(pokemon)} style={spriteStyleFromCss(pokemon.iconStyle)} />;
  }
  if (!src) return <span className="training-rest-training-ground-detail-sprite" aria-label={pokemonName(pokemon)}>{pokemonName(pokemon).slice(0, 1) || "?"}</span>;
  return <span className="training-rest-training-ground-detail-sprite"><img src={src} alt="" draggable={false} /></span>;
}

function StatDelta({value}: {value: number}) {
  if (!value) return null;
  return <em data-delta={value > 0 ? "positive" : "negative"}>{formatDelta(value)}</em>;
}

function buildDialogueActions({
  step,
  lesson,
  applying,
  replaceMoveIndex,
  onBack,
  onEnter,
  onProceedPokemon,
  onApply,
  onLessonComplete,
  onLeave,
  onCancelLesson,
  lessonOptions,
  selectedLessonOption,
  onSelectLesson,
}: {
  step: TrainingGroundStep | null;
  lesson?: FormalTrainingGroundLessonViewV4 | null;
  applying: boolean;
  replaceMoveIndex: number | null;
  onBack: () => void;
  onEnter: () => void;
  onProceedPokemon: () => void;
  onApply: () => void;
  onLessonComplete: () => void;
  onLeave: () => void;
  onCancelLesson?: () => void;
  lessonOptions: FormalTrainingGroundLessonViewV4[];
  selectedLessonOption?: FormalTrainingGroundLessonViewV4 | null;
  onSelectLesson?: (lesson: FormalTrainingGroundLessonViewV4) => void;
}) {
  if (!step) {
    if (!lesson && lessonOptions.length && onSelectLesson) {
      return [
        {label: "返回", onClick: onLeave},
        {
          label: "确认上课",
          meta: selectedLessonOption ? `${selectedLessonOption.fee.toLocaleString()} 金币` : undefined,
          primary: true,
          onClick: selectedLessonOption ? () => onSelectLesson(selectedLessonOption) : () => undefined,
        },
      ];
    }
    return [
      {label: "返回", onClick: onLeave},
      {label: "进入学习", meta: lesson ? `${lesson.fee} 金币` : undefined, primary: true, onClick: onEnter},
    ];
  }
  if (step === "pokemon") {
    return [
      {label: onCancelLesson ? "返回课程选择" : "返回", onClick: onCancelLesson || onBack},
      {label: lesson?.kind === "self-study" ? "开始自习" : "下一步", primary: true, onClick: onProceedPokemon},
    ];
  }
  if (step === "move") {
    return [
      {label: "返回", onClick: onBack},
    ];
  }
  if (step === "replace") {
    return [
      {label: "返回", onClick: onBack},
      {label: applying ? "结算中" : "确认学习", primary: true, onClick: replaceMoveIndex === null ? () => undefined : onApply},
    ];
  }
  return [
    {label: "课程结束", primary: true, onClick: onLessonComplete},
  ];
}

function lessonMovePool(api: ChangeBattleV2Api, lesson: FormalTrainingGroundLessonViewV4, speciesId: string) {
  try {
    if (lesson.kind === "tutor") return api.getPokemonTutorSkills(speciesId);
    if (lesson.kind === "egg") return api.getPokemonEggSkills(speciesId);
    if (lesson.kind === "self-learn") return api.getPokemonSelfLearnSkills(speciesId);
  } catch {
    return [];
  }
  return [];
}

function trainingLessonPickerText(lessonOptions: FormalTrainingGroundLessonViewV4[]): string {
  if (!lessonOptions.length) return TRAINING_GROUND_WELCOME_TEXT;
  const firstLesson = lessonOptions[0];
  return firstLesson ? courseDialogueText(firstLesson) : TRAINING_GROUND_PICKER_TEXT;
}

function trainingLessonStartText(team: LocalPokemonV4[]): string {
  return team.length ? "先选择一只宝可梦进入课堂。" : "队伍里还没有可以上课的宝可梦。";
}

function courseTitle(lesson: FormalTrainingGroundLessonViewV4): string {
  return courseDetail(lesson).title;
}

function courseTeacherLabel(lesson: FormalTrainingGroundLessonViewV4): string {
  return courseDetail(lesson).teacher;
}

function courseDialogueText(lesson: FormalTrainingGroundLessonViewV4): string {
  return courseDetail(lesson).dialogue;
}

function courseDetail(lesson: FormalTrainingGroundLessonViewV4): {title: string; teacher: string; summary: string; dialogue: string} {
  if (lesson.kind === "egg") {
    return {
      title: "遗传学",
      teacher: "老爷爷",
      summary: "由培育屋的老爷爷上课，能令宝可梦学会那些与生俱来的招式。",
      dialogue: "培育屋的老爷爷会讲解招式的遗传来源，让宝可梦学会那些与生俱来的招式。想让哪只宝可梦来听课？",
    };
  }
  if (lesson.kind === "tutor") {
    return {
      title: "实践课",
      teacher: "老奶奶",
      summary: "由联盟来的老奶奶上课，能教授宝可梦难以学习的招式。",
      dialogue: "联盟来的老奶奶会带来实战课程，教授宝可梦那些平时难以学习的招式。想让哪只宝可梦上课？",
    };
  }
  if (lesson.kind === "self-learn") {
    return {
      title: "冥想课",
      teacher: "年轻姐姐",
      summary: "由年轻的姐姐上课，能让宝可梦静下心来修炼，说不定能回忆一些招式。",
      dialogue: "年轻的姐姐会引导宝可梦静下心来修炼，说不定能回忆起一些曾经掌握或能够领悟的招式。",
    };
  }
  return {
    title: "自习课",
    teacher: "自主学习",
    summary: "由宝可梦自主学习，可以靠努力自学突破自己的上限。",
    dialogue: "自习课交给宝可梦自主学习。只要足够努力，它们就有机会靠训练突破自己的上限。",
  };
}

function findResultPokemon(result: FormalTrainingGroundResultV4, pokemonId: string): LocalPokemonV4 | null {
  return result.run.restRunSnapshot?.players.p1?.localTeam.pokemon.find(pokemon => pokemon.localPokemonId === pokemonId) || null;
}

function safeMoveDetail(api: ChangeBattleV2Api, moveId: string) {
  try {
    return api.getMoveDetail(moveId);
  } catch {
    return null;
  }
}

function safePokemonDetail(api: ChangeBattleV2Api, speciesId: string) {
  try {
    return api.getPokemonDetail(speciesId);
  } catch {
    return null;
  }
}

function calculateStats(api: ChangeBattleV2Api, pokemon: LocalPokemonV4): StatTableV4 {
  try {
    return api.dex.calculatePokemonStats({
      speciesId: pokemon.speciesId,
      level: pokemon.level,
      nature: pokemon.nature,
      evs: pokemon.evs,
      ivs: pokemon.ivs,
    }).stats;
  } catch {
    return {
      hp: pokemon.maxHp,
      atk: pokemon.ivs.atk + pokemon.evs.atk,
      def: pokemon.ivs.def + pokemon.evs.def,
      spa: pokemon.ivs.spa + pokemon.evs.spa,
      spd: pokemon.ivs.spd + pokemon.evs.spd,
      spe: pokemon.ivs.spe + pokemon.evs.spe,
    };
  }
}

function maxPotentialStats(api: ChangeBattleV2Api, pokemon: LocalPokemonV4, fallback: StatTableV4): StatTableV4 {
  try {
    return api.dex.getPokemonMaxStats({
      speciesId: pokemon.speciesId,
      level: pokemon.level,
    }).stats;
  } catch {
    return fallback;
  }
}

function formatDelta(delta: number): string {
  if (!delta) return "(+0)";
  return delta > 0 ? `(+${delta})` : `(${delta})`;
}

function pokemonName(pokemon: LocalPokemonV4): string {
  return pokemon.nickname || pokemon.nameZh || pokemon.name || pokemon.speciesId;
}

function statTotal(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, value) => sum + Math.max(0, Math.floor(Number(value || 0))), 0);
}

function natureLabel(nature: string): string {
  return NATURE_LABEL[normalizeId(nature)] || nature || "未知";
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
  const id = normalizeId(category);
  if (id === "physical") return "物理";
  if (id === "special") return "特殊";
  if (id === "status") return "变化";
  return category || "?";
}

function moveTypeId(value: unknown): string {
  const raw = String(value || "").trim();
  const normalized = normalizeId(raw);
  if (normalized) return normalized;
  return TYPE_ID_BY_ZH[raw] || "";
}

function typeLabel(value: string): string {
  return TYPE_ZH_BY_ID[moveTypeId(value)] || value;
}

function spriteStyleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url("${styleUrlAssetPath(match[1])}")`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}

function normalizeId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
