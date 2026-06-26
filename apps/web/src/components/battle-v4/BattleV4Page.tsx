import {useEffect, useMemo, useState, type CSSProperties} from "react";
import type {AppDebugConfigV4, BattleCommandActionV4, BattleCommandDraftV4, BattleMoveRequestV4, BattleRequestV4, BattleSessionSnapshotV4, BattleViewModelV4, BattleViewSlotV4, ChangeBattleV2Api, DexMoveDetail, LocalPokemonV4, RequestSidePokemonV4, TrainingMoveSlotV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {addBattleCommandChoiceV4, applyBattleSessionToRun, battleDebugLog, createBattleCommandDraftV4, fillBattleCommandPassesV4, isBattleCommandDraftDoneV4, projectBattleViewModelV4, resolveLocalPokemonFromRequestRow, setBattleCommandCurrentMoveV4, stringifyBattleCommandDraftV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./BattleV4Page.css";

export type BattleV4PageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  sessionId: string;
  debugConfig?: AppDebugConfigV4;
  onRunChange: (run: TrainingRunGameV4) => void;
  onBackToRest: () => void;
};

type SwitchActionV4 = Extract<BattleCommandActionV4, {kind: "switch"}>;
type MoveActionV4 = Extract<BattleCommandActionV4, {kind: "move"}>;
type RequestPokemonV4 = RequestSidePokemonV4;

type BattleV4StatusBadge = {
  code: string;
  label: string;
  title: string;
  className: string;
};

type BattleV4MoveCardView = {
  action: MoveActionV4;
  detail: DexMoveDetail | null;
  id: string;
  name: string;
  typeId: string;
  typeLabel: string;
  categoryLabel: string;
  powerLabel: string;
  accuracyLabel: string;
  ppLabel: string;
  effectivenessLabel: string;
  effectivenessTone: "none" | "bad" | "weak" | "normal" | "good" | "great";
};

type BattleV4TargetCardView = {
  key: string;
  slot: BattleViewSlotV4 | null;
  selectable: boolean;
  affected: boolean;
  choiceSuffix: string;
  effectivenessLabel: string;
  effectivenessTone: BattleV4MoveCardView["effectivenessTone"];
};

const STATUS_BADGES: Record<string, Omit<BattleV4StatusBadge, "code">> = {
  brn: {label: "烧", title: "烧伤", className: "brn"},
  par: {label: "麻", title: "麻痹", className: "par"},
  psn: {label: "毒", title: "中毒", className: "psn"},
  tox: {label: "毒", title: "剧毒", className: "tox"},
  slp: {label: "睡", title: "睡眠", className: "slp"},
  frz: {label: "冰", title: "冰冻", className: "frz"},
  fnt: {label: "倒", title: "倒下", className: "fnt"},
};

const STAT_ROWS: Array<[keyof LocalPokemonV4["evs"], string]> = [
  ["hp", "HP"],
  ["atk", "攻击"],
  ["def", "防御"],
  ["spa", "特攻"],
  ["spd", "特防"],
  ["spe", "速度"],
];

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: {rock: 0.5, ghost: 0, steel: 0.5},
  fire: {fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2},
  water: {fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5},
  electric: {water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5},
  grass: {fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5},
  ice: {fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5},
  fighting: {normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5},
  poison: {grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2},
  ground: {fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2},
  flying: {electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5},
  psychic: {fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5},
  bug: {fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5},
  rock: {fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5},
  ghost: {normal: 0, psychic: 2, ghost: 2, dark: 0.5},
  dragon: {dragon: 2, steel: 0.5, fairy: 0},
  dark: {fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5},
  steel: {fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2},
  fairy: {fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5},
};

const TYPE_SHORT_LABEL: Record<string, string> = {
  normal: "普",
  fire: "火",
  water: "水",
  electric: "电",
  grass: "草",
  ice: "冰",
  fighting: "斗",
  poison: "毒",
  ground: "地",
  flying: "飞",
  psychic: "超",
  bug: "虫",
  rock: "岩",
  ghost: "鬼",
  dragon: "龙",
  dark: "恶",
  steel: "钢",
  fairy: "妖",
};

export function BattleV4Page({api, run, sessionId, debugConfig, onRunChange, onBackToRest}: BattleV4PageProps) {
  const [snapshot, setSnapshot] = useState<BattleSessionSnapshotV4 | null>(null);
  const [message, setMessage] = useState("正在连接 Battle Service...");
  const [busy, setBusy] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [switchPanelOpen, setSwitchPanelOpen] = useState(false);
  const [commandMode, setCommandMode] = useState<"command" | "moves">("command");
  const [pendingMoveAction, setPendingMoveAction] = useState<MoveActionV4 | null>(null);
  const [commandDraft, setCommandDraft] = useState<BattleCommandDraftV4 | null>(null);
  const [choiceStatus, setChoiceStatus] = useState("");
  const rawViewModel = useMemo(() => snapshot ? projectBattleViewModelV4(snapshot, "p1") : null, [snapshot]);
  const viewModel = useMemo(() => snapshot ? projectBattleViewModelV4(snapshot, "p1", commandDraft) : null, [snapshot, commandDraft]);
  const requestResetKey = useMemo(() => requestKeyForCommand(rawViewModel?.command.request || null, rawViewModel?.command.requestType || "none"), [rawViewModel?.command.request, rawViewModel?.command.requestType]);

  useEffect(() => {
    if (!snapshot) return;
    battleDebugLog(debugConfig, "mapping", "showdown-id-pool", {
      used: snapshot.showdownIdPool?.used || [],
      available: snapshot.showdownIdPool?.available || [],
    });
    for (const player of snapshot.players) {
      for (const entry of player.teamMapping || []) {
        battleDebugLog(debugConfig, "mapping", "create-source-map", entry);
      }
    }
  }, [debugConfig, snapshot?.id]);

  useEffect(() => {
    if (!viewModel?.command.request) return;
    battleDebugLog(debugConfig, "request", "normalize-summary", requestDebugSummary(viewModel.command));
  }, [debugConfig, requestResetKey, viewModel?.command.request, viewModel?.command.requestType]);

  useEffect(() => {
    if (!rawViewModel) return;
    const requestType = rawViewModel.command.requestType;
    setCommandDraft(rawViewModel.command.normalizedRequest ? createBattleCommandDraftV4(rawViewModel.command.normalizedRequest) : null);
    setCommandMode("command");
    setPendingMoveAction(null);
    setChoiceStatus("");
    if (rawViewModel.command.requestType === "switch" && rawViewModel.status === "running") {
      setSwitchPanelOpen(true);
      return;
    }
    if (rawViewModel.status !== "running" || (requestType !== "move" && requestType !== "switch")) {
      setSwitchPanelOpen(false);
    }
  }, [requestResetKey, rawViewModel?.status]);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    async function tick() {
      if (!sessionId) {
        setMessage("缺少战斗 session，请从休整页重新进入。");
        return;
      }
      if (busy) {
        timer = window.setTimeout(tick, 250);
        return;
      }
      try {
        const next = await api.battleService.getSnapshot(sessionId);
        if (cancelled) return;
        setSnapshot(next);
        setMessage("");
        if (next.status === "ended" || next.status === "blocked") {
          const patched = applyBattleSessionToRun(run, next);
          await api.saveTrainingRun(patched);
          if (!cancelled) onRunChange(patched);
          return;
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Battle Service 连接失败。");
      }
      timer = window.setTimeout(tick, 700);
    }
    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api, busy, onRunChange, run, sessionId]);

  async function submitChoice(choice: string) {
    if (!choice || busy || !sessionId) return;
    battleDebugLog(debugConfig, "submit", "submit-choice", {
      sessionId,
      playerId: "p1",
      choice,
    });
    setBusy(true);
    setChoiceStatus(`提交中：${choice}`);
    setMessage(`提交指令：${choice}`);
    try {
      const next = await api.battleService.submitChoice(sessionId, "p1", choice);
      setSnapshot(next);
      setCommandDraft(null);
      setSwitchPanelOpen(false);
      setChoiceStatus(`提交成功：${choice}`);
      setMessage("");
      battleDebugLog(debugConfig, "snapshot", "after-submit", snapshotDebugSummary(next));
    } catch (error) {
      battleDebugLog(debugConfig, "error", "submit-choice-failed", {
        sessionId,
        playerId: "p1",
        choice,
        error: error instanceof Error ? error.message : String(error),
      });
      setMessage(error instanceof Error ? error.message : "提交指令失败。");
    } finally {
      setBusy(false);
    }
  }

  function applyDraftChoice(input: string) {
    const normalizedRequest = viewModel?.command.normalizedRequest;
    if (!normalizedRequest) return;
    const before = fillBattleCommandPassesV4(commandDraft || createBattleCommandDraftV4(normalizedRequest), normalizedRequest);
    const after = addBattleCommandChoiceV4(before, normalizedRequest, input);
    const finalChoice = stringifyBattleCommandDraftV4(after);
    battleDebugLog(debugConfig, "draft", "add-choice", {
      before,
      input,
      after,
      isDone: isBattleCommandDraftDoneV4(after),
      finalChoice,
    });
    setPendingMoveAction(null);
    setCommandDraft(after);
    if (isBattleCommandDraftDoneV4(after)) {
      void submitChoice(finalChoice);
      return;
    }
    setChoiceStatus(`选择 ${after.choices.filter(Boolean).length}/${after.requestLength} 完成`);
    setCommandMode(after.requestType === "move" ? "moves" : "command");
    if (after.requestType === "switch") setSwitchPanelOpen(true);
  }

  function draftMoveAction(action: MoveActionV4) {
    const normalizedRequest = viewModel?.command.normalizedRequest;
    if (!normalizedRequest) return;
    if (isUntargetedLockedMove(action.move)) {
      applyDraftChoice(action.choice);
      return;
    }
    const before = fillBattleCommandPassesV4(commandDraft || createBattleCommandDraftV4(normalizedRequest), normalizedRequest);
    const requiresTarget = true;
    const after = setBattleCommandCurrentMoveV4(before, normalizedRequest, action.moveIndex, requiresTarget);
    battleDebugLog(debugConfig, "draft", "current-move", {
      before,
      input: action.choice,
      after,
      requiresTarget,
    });
    setCommandDraft(after);
    setPendingMoveAction(action);
  }

  return (
    <section className="battle-v4-page">
      <BattleArena near={viewModel?.nearTeam || []} far={viewModel?.farTeam || []} commandActiveIndex={viewModel?.command.activeIndex || 0} />
      <header className="battle-v4-hud">
        <button type="button" onClick={() => setDebugOpen(true)}>记录</button>
        <button type="button" onClick={() => exportBattleV4Diagnostics(snapshot, commandDraft)} disabled={!snapshot}>导出诊断</button>
      </header>
      <BattleCommandDock
        api={api}
        viewModel={viewModel}
        snapshot={snapshot}
        busy={busy}
        message={choiceStatus || message}
        actions={viewModel?.command.actions || []}
        mode={viewModel?.mode || "singles"}
        requestType={viewModel?.command.requestType || "none"}
        commandMode={commandMode}
        onCommandModeChange={setCommandMode}
        onOpenSwitch={() => setSwitchPanelOpen(true)}
        onSubmit={applyDraftChoice}
        onMoveDraft={draftMoveAction}
      />
      {pendingMoveAction && viewModel ? (
        <BattleV4TargetPanel
          api={api}
          viewModel={viewModel}
          action={pendingMoveAction}
          request={viewModel.command.request}
          onClose={() => setPendingMoveAction(null)}
          onSubmit={applyDraftChoice}
        />
      ) : null}
      {switchPanelOpen && snapshot && viewModel && (viewModel.command.requestType === "move" || viewModel.command.requestType === "switch") ? (
        <BattleV4SwitchPanel
          api={api}
          snapshot={snapshot}
          switchActions={viewModel.command.switchActions}
          forceSwitch={viewModel.command.requestType === "switch"}
          busy={busy}
          debugConfig={debugConfig}
          onClose={() => setSwitchPanelOpen(false)}
          onConfirm={applyDraftChoice}
        />
      ) : null}
      {snapshot?.status === "ended" ? (
        <div className="battle-v4-result-panel">
          <strong>{snapshot.winner === "p1" || snapshot.winner === "p3" ? "训练胜利" : "训练失败"}</strong>
          <span>节点状态已回写，返回休整区查看下一场。</span>
          <button type="button" onClick={onBackToRest}>返回休整区</button>
        </div>
      ) : null}
      {debugOpen ? <BattleV4DebugModal snapshot={snapshot} draft={commandDraft} onClose={() => setDebugOpen(false)} /> : null}
    </section>
  );
}

function BattleArena({near, far, commandActiveIndex = 0}: {near: BattleViewSlotV4[]; far: BattleViewSlotV4[]; commandActiveIndex?: number}) {
  return (
    <div className="battle-v4-arena" aria-label="战斗场地">
      <div className="battle-v4-scene-overlay" />
      <div className="battle-v4-enemy-panels">
        {far.map(slot => <BattleHpPanel slot={slot} compact key={`${slot.playerId}-${slot.position}-hp`} />)}
      </div>
      <div className="battle-v4-player-panels">
        {near.map((slot, index) => <BattleHpPanel slot={slot} current={slot.active} commanding={index === commandActiveIndex} key={`${slot.playerId}-${slot.position}-hp`} />)}
      </div>
      <div className="battle-v4-model-layer">
        {far.map(slot => <BattlePokemonSlot slot={slot} key={`${slot.playerId}-${slot.position}`} />)}
        {near.map((slot, index) => <BattlePokemonSlot slot={slot} commanding={index === commandActiveIndex} key={`${slot.playerId}-${slot.position}`} />)}
      </div>
    </div>
  );
}

function BattlePokemonSlot({slot, commanding = false}: {slot: BattleViewSlotV4; commanding?: boolean}) {
  return (
    <article className={`battle-v4-pokemon ${slot.side} ${slot.position.toLowerCase()} species-${toId(slot.speciesId)} ${commanding ? "commanding" : ""} ${slot.fainted ? "fainted" : ""}`}>
      <ImageWithFallback src={slot.spriteUrl || slot.iconUrl} alt={slot.nameZh || slot.name} />
    </article>
  );
}

function BattleHpPanel({slot, compact = false, current = false, commanding = false}: {slot: BattleViewSlotV4; compact?: boolean; current?: boolean; commanding?: boolean}) {
  const hpRate = slot.maxHp ? Math.max(0, Math.min(100, slot.hp / slot.maxHp * 100)) : 0;
  const status = statusBadge(slot.status);
  const identity = slotIdentityLabel(slot);
  return (
    <section className={`battle-v4-hp-panel ${slot.side} ${slot.position.toLowerCase()} ${compact ? "compact" : ""} ${current ? "current" : ""} ${commanding ? "commanding" : ""}`} title={identity ? `ID: ${identity}` : undefined}>
      <div className="battle-v4-hp-portrait">
        <BattleV4Icon src={slot.iconUrl || slot.frontSpriteUrl || slot.spriteUrl} iconStyle={slot.iconStyle} alt={slot.nameZh || slot.name} />
      </div>
      <div className="battle-v4-hp-main">
        <div className="battle-v4-hp-name-row">
          <strong>{slot.nameZh || slot.name}</strong>
          {status ? <StatusBadge badge={status} /> : null}
          <em>Lv.{slot.level}</em>
        </div>
        <div className="battle-v4-hp-bar"><b style={{width: `${hpRate}%`}} /></div>
        <div className="battle-v4-hp-value-row">
          <span>{slot.side === "far" ? `${Math.round(hpRate)}%` : `${slot.hp}/${slot.maxHp}`}</span>
          {identity ? <code>{identity}</code> : null}
        </div>
      </div>
    </section>
  );
}

function BattleCommandDock({api, viewModel, snapshot, busy, message, actions, mode, requestType, commandMode, onCommandModeChange, onOpenSwitch, onSubmit, onMoveDraft}: {
  api: ChangeBattleV2Api;
  viewModel: BattleViewModelV4 | null;
  snapshot: BattleSessionSnapshotV4 | null;
  busy: boolean;
  message: string;
  actions: BattleCommandActionV4[];
  mode: string;
  requestType: string;
  commandMode: "command" | "moves";
  onCommandModeChange: (mode: "command" | "moves") => void;
  onOpenSwitch: () => void;
  onSubmit: (choice: string) => void;
  onMoveDraft: (action: MoveActionV4) => void;
}) {
  const canInspectSwitch = requestType === "move" && Boolean(snapshot?.requests.p1?.side?.pokemon?.length);
  const moveActions = actions.filter((action): action is Extract<BattleCommandActionV4, {kind: "move"}> => action.kind === "move");
  const moveCards = useMemo(() => moveActions.map(action => buildBattleV4MoveCard(action, api, viewModel?.farTeam || [])), [api, moveActions, viewModel?.farTeam]);
  const commandStatus = commandStatusText(viewModel, busy, message);
  if (requestType === "switch") {
    return (
      <section className="battle-v4-command-dock waiting" aria-label="等待换人">
        <span>{busy ? "提交中..." : message || "请选择要换上的宝可梦"}</span>
      </section>
    );
  }
  if (requestType !== "move") {
    const waitingLabel = requestType === "wait" ? "等待对手行动 / wait request" : "等待行动";
    const diagnosis = battleV4StallDiagnosis(snapshot);
    const diagnosisLabel = diagnosis.includes("no-obvious-stall-signal") ? "" : ` · ${diagnosis.join(" / ")}`;
    return (
      <section className="battle-v4-command-dock waiting" aria-label="等待指令">
        <span>{busy ? "提交中..." : message || snapshot?.error || `${waitingLabel}${diagnosisLabel}`}</span>
      </section>
    );
  }
  if (commandMode === "moves") {
    return (
      <section className="battle-v4-move-dock" aria-label="技能指令">
        <div className="battle-v4-side-hints">
          <span className="battle-v4-command-progress">{commandStatus}</span>
          <button type="button" onClick={() => onCommandModeChange("command")}>返回</button>
          <button type="button" onClick={() => {}}>招式说明</button>
        </div>
        <div className="battle-v4-move-list">
          {moveCards.length ? moveCards.map(card => (
            <button
              className={`battle-v4-move-card type-${card.typeId} effect-${card.effectivenessTone}`}
              type="button"
              disabled={busy || isDisabledAction(card.action)}
              onClick={() => onMoveDraft(card.action)}
              key={`${card.action.choice}-${card.id}`}
            >
              <span className="battle-v4-move-type">{card.typeLabel}</span>
              <span className="battle-v4-move-body">
                <strong>{card.name}</strong>
                <span className="battle-v4-move-meta">
                  <i>{card.categoryLabel}</i>
                  <i>威力 {card.powerLabel}</i>
                  <i>命中 {card.accuracyLabel}</i>
                </span>
              </span>
              <span className="battle-v4-move-pp">{card.ppLabel}</span>
              <span className="battle-v4-move-effect">{card.effectivenessLabel}</span>
            </button>
          )) : <p>{message || "等待 Showdown request..."}</p>}
        </div>
      </section>
    );
  }
  return (
    <section className="battle-v4-command-dock" aria-label="战斗指令">
      <span className="battle-v4-command-progress">{commandStatus}</span>
      <button className="battle-v4-main-command fight" type="button" disabled={busy || !moveActions.length} onClick={() => onCommandModeChange("moves")}>
        <img src="/battle/command-buttons/fight.webp" alt="" />
        <span>战斗</span>
      </button>
      <button className="battle-v4-main-command switch" type="button" disabled={busy || !canInspectSwitch} onClick={onOpenSwitch}>
        <img src="/battle/command-buttons/switch.webp" alt="" />
        <span>宝可梦</span>
      </button>
    </section>
  );
}

function BattleV4TargetPanel({api, viewModel, action, request, onClose, onSubmit}: {
  api: ChangeBattleV2Api;
  viewModel: BattleViewModelV4;
  action: MoveActionV4;
  request: BattleRequestV4 | null;
  onClose: () => void;
  onSubmit: (choice: string) => void;
}) {
  const moveCard = useMemo(() => buildBattleV4MoveCard(action, api, viewModel.farTeam), [action, api, viewModel.farTeam]);
  const targetable = Boolean(viewModel.command.normalizedRequest?.targetable || request?.targetable);
  const targets = useMemo(() => buildBattleV4TargetCards(viewModel, action, moveCard.detail, targetable, api), [viewModel, action, moveCard.detail, targetable, api]);
  return (
    <section className="battle-v4-target-modal" aria-label="攻击对象选择">
      <div className="battle-v4-target-modal-top" />
      <div className="battle-v4-target-modal-bottom" />
      <div className="battle-v4-target-header"><span>{moveCard.name}</span></div>
      <div className="battle-v4-target-grid">
        {targets.map(target => (
          <BattleV4TargetCard
            target={target}
            key={target.key}
            onSelect={next => {
              const shouldUseTargetSuffix = Boolean(next.choiceSuffix && moveNeedsExplicitTargetForShowdown(action.move.target || moveCard.detail?.target, targetable));
              const choice = shouldUseTargetSuffix ? `${action.choice} ${next.choiceSuffix}` : action.choice;
              onSubmit(choice);
            }}
          />
        ))}
      </div>
      <button className="battle-v4-target-close" type="button" onClick={onClose}><b>B</b><span>关闭</span></button>
    </section>
  );
}

function BattleV4TargetCard({target, onSelect}: {target: BattleV4TargetCardView; onSelect: (target: BattleV4TargetCardView) => void}) {
  const slot = target.slot;
  if (!slot) return <button className="battle-v4-target-card empty" type="button" disabled />;
  const hpRate = slot.maxHp ? Math.max(0, Math.min(100, slot.hp / slot.maxHp * 100)) : 0;
  const status = statusBadge(slot.status);
  return (
    <button
      className={`battle-v4-target-card side-${slot.side} effect-${target.effectivenessTone} ${target.affected ? "affected" : ""} ${target.selectable ? "selectable" : "not-selectable"}`}
      type="button"
      disabled={!target.selectable}
      onClick={() => onSelect(target)}
    >
      {target.selectable ? <span className="battle-v4-target-arrow">›</span> : null}
      <span className="battle-v4-target-effect">{target.effectivenessLabel}</span>
      <span className="battle-v4-target-sprite">
        <BattleV4Icon src={slot.iconUrl || slot.frontSpriteUrl || slot.spriteUrl} iconStyle={slot.iconStyle} alt={slot.nameZh || slot.name} />
      </span>
      <span className="battle-v4-target-info">
        <strong>{slot.nameZh || slot.name}</strong>
        <span className="battle-v4-target-hp"><i><b style={{width: `${hpRate}%`}} /></i></span>
        <span className="battle-v4-target-meta">
          <b>{slot.side === "far" ? `${Math.round(hpRate)}%` : `${slot.hp}/${slot.maxHp}`}</b>
          <em>Lv.{slot.level}</em>
          {status ? <StatusBadge badge={status} /> : null}
        </span>
      </span>
    </button>
  );
}

function isDisabledAction(action: BattleCommandActionV4): boolean {
  return action.kind === "move" ? Boolean(action.move.disabled || action.move.pp === 0) : Boolean(action.disabled);
}

function commandStatusText(viewModel: BattleViewModelV4 | null, busy: boolean, message: string): string {
  if (busy) return message || "提交中...";
  const command = viewModel?.command;
  if (!command || command.requestType === "none") return "等待 request";
  if (command.waiting) return "等待对局推进";
  const doneCount = command.choices.filter(Boolean).length;
  const total = Math.max(1, command.requestLength);
  if (command.isDone) return `已完成 ${doneCount}/${total}`;
  const activeName = command.activePokemon?.name || `第 ${command.activeIndex + 1} 只`;
  return `已选 ${doneCount}/${total} · 操作 ${activeName}`;
}

function StatusBadge({badge, className = "battle-v4-status-badge"}: {badge: BattleV4StatusBadge; className?: string}) {
  return <i className={`${className} status-${badge.className}`} title={badge.title}>{badge.label}</i>;
}

function buildBattleV4MoveCard(action: MoveActionV4, api: ChangeBattleV2Api, targetSlots: BattleViewSlotV4[]): BattleV4MoveCardView {
  const detail = moveDetailFor(api, action.move);
  const id = toId(detail?.id || action.move.id || action.move.move || action.label);
  const typeId = typeIdFor(detail?.typeId || detail?.type || action.move.id || "");
  const category = detail?.categoryId || detail?.category || "";
  const categoryId = toId(category);
  const effectiveness = moveEffectiveness(detail, api, targetSlots);
  const currentPp = action.move.pp ?? detail?.pp;
  const maxPp = action.move.maxpp ?? detail?.pp;
  return {
    action,
    detail,
    id,
    name: detail?.nameZh || detail?.name || action.label || action.move.move || action.move.id || "技能",
    typeId: typeId || "unknown",
    typeLabel: TYPE_SHORT_LABEL[typeId] || detail?.type || "?",
    categoryLabel: categoryLabel(categoryId, detail?.category),
    powerLabel: detail ? Number(detail.power || 0) ? String(detail.power) : "—" : "—",
    accuracyLabel: detail ? detail.accuracy == null ? "必中" : String(detail.accuracy) : "—",
    ppLabel: `${currentPp ?? "—"}/${maxPp ?? "—"}`,
    effectivenessLabel: effectiveness.label,
    effectivenessTone: effectiveness.tone,
  };
}

function buildBattleV4TargetCards(viewModel: BattleViewModelV4, action: MoveActionV4, detail: DexMoveDetail | null, targetable: boolean, api: ChangeBattleV2Api): BattleV4TargetCardView[] {
  const active = viewModel.nearTeam[action.activeIndex] || viewModel.nearTeam.find(slot => slot.active) || viewModel.nearTeam[0] || null;
  const slots: Array<BattleViewSlotV4 | null> = [
    viewModel.farTeam[0] || null,
    viewModel.farTeam[1] || null,
    viewModel.nearTeam[0] || null,
    viewModel.nearTeam[1] || null,
  ];
  const target = normalizeMoveTarget(action.move.target || detail?.target || "normal");
  return slots.map((slot, index) => {
    if (!slot) {
      return {key: `empty-${index}`, slot: null, selectable: false, affected: false, choiceSuffix: "", effectivenessLabel: "效果一般", effectivenessTone: "normal"};
    }
    const state = targetStateForV4(target, active, slot);
    const multiplier = moveMultiplier(detail, slot, api);
    const effectiveness = detail ? effectivenessFromMultiplier(multiplier) : {label: "效果一般", tone: "normal" as const};
    return {
      key: `${slot.seat}-${slot.localPokemonId}`,
      slot,
      selectable: state.selectable,
      affected: state.affected,
      choiceSuffix: targetable ? targetChoiceSuffix(active, slot, viewModel) : "",
      effectivenessLabel: effectiveness.label,
      effectivenessTone: effectiveness.tone,
    };
  });
}

function moveDetailFor(api: ChangeBattleV2Api, move: BattleMoveRequestV4): DexMoveDetail | null {
  const id = move.id || move.move;
  if (!id) return null;
  try {
    return api.getMoveDetail(id);
  } catch {
    try {
      return api.getMoveDetail(toId(id));
    } catch {
      return null;
    }
  }
}

function moveEffectiveness(detail: DexMoveDetail | null, api: ChangeBattleV2Api, targetSlots: BattleViewSlotV4[]): {label: string; tone: BattleV4MoveCardView["effectivenessTone"]} {
  if (!detail || toId(detail.categoryId || detail.category) === "status" || !Number(detail.power || 0)) return {label: "效果一般", tone: "normal"};
  const targets = targetSlots.filter(slot => slot.active && !slot.fainted);
  if (!targets.length) return {label: "效果一般", tone: "normal"};
  const multipliers = targets.map(slot => moveMultiplier(detail, slot, api));
  const best = multipliers.includes(0) && multipliers.every(value => value <= 0) ? 0 : Math.max(...multipliers);
  return effectivenessFromMultiplier(best);
}

function moveMultiplier(detail: DexMoveDetail | null, target: BattleViewSlotV4, api?: ChangeBattleV2Api): number {
  const attackType = typeIdFor(detail?.typeId || detail?.type || "");
  if (!detail || !attackType || !target || target.fainted) return 1;
  let targetTypes: string[] = [];
  try {
    targetTypes = api?.getPokemonDetail(target.speciesId).types || [];
  } catch {
    targetTypes = [];
  }
  const uniqueTypes = [...new Set(targetTypes.map(typeIdFor).filter(Boolean))];
  if (!uniqueTypes.length) return 1;
  return uniqueTypes.reduce((multiplier, defenseType) => multiplier * (TYPE_CHART[attackType]?.[defenseType] ?? 1), 1);
}

function effectivenessFromMultiplier(multiplier: number): {label: string; tone: BattleV4MoveCardView["effectivenessTone"]} {
  if (multiplier <= 0) return {label: "没有效果", tone: "none"};
  if (multiplier <= 0.25) return {label: "效果非常不好", tone: "bad"};
  if (multiplier < 1) return {label: "效果不好", tone: "weak"};
  if (multiplier >= 4) return {label: "效果无比绝佳", tone: "great"};
  if (multiplier > 1) return {label: "效果拔群", tone: "good"};
  return {label: "效果一般", tone: "normal"};
}

function categoryLabel(categoryId: string, fallback?: string): string {
  if (categoryId === "physical") return "物理";
  if (categoryId === "special") return "特殊";
  if (categoryId === "status") return "变化";
  return fallback || "?";
}

function targetStateForV4(target: string, active: BattleViewSlotV4 | null, slot: BattleViewSlotV4): {selectable: boolean; affected: boolean} {
  const exists = slot.active && !slot.fainted;
  if (!exists || !active) return {selectable: false, affected: false};
  const isSelf = slot.seat === active.seat;
  const sameSide = slot.side === active.side;
  if (target === "self") return {selectable: isSelf, affected: isSelf};
  if (target === "adjacentally") return {selectable: sameSide && !isSelf, affected: sameSide && !isSelf};
  if (target === "alladjacentfoes") return {selectable: !sameSide, affected: !sameSide};
  if (target === "alladjacent") return {selectable: !isSelf, affected: !isSelf};
  if (target === "foeside") return {selectable: !sameSide, affected: !sameSide};
  if (target === "allyside" || target === "allyteam") return {selectable: sameSide, affected: sameSide};
  if (FIELD_TARGETS.has(target)) return {selectable: true, affected: true};
  return {selectable: !isSelf, affected: !isSelf};
}

const FIELD_TARGETS = new Set(["all", "field", "scripted", "randomnormal"]);

function targetChoiceSuffix(active: BattleViewSlotV4 | null, target: BattleViewSlotV4, viewModel: BattleViewModelV4): string {
  if (!active) return target.side === "far" ? "+1" : "-1";
  const sideSlots = target.side === "far" ? viewModel.farTeam : viewModel.nearTeam;
  const activeTargets = sideSlots.filter(slot => slot.active);
  const position = Math.max(1, activeTargets.findIndex(slot => slot.seat === target.seat) + 1 || (target.position === "B" ? 2 : 1));
  return target.side === active.side ? `-${position}` : `+${position}`;
}

function normalizeMoveTarget(value: string | undefined): string {
  return String(value || "normal").replace(/[^a-z]/gi, "").toLowerCase() || "normal";
}

function moveNeedsExplicitTargetForShowdown(target: string | undefined, targetable: boolean): boolean {
  if (!targetable) return false;
  const id = normalizeMoveTarget(target);
  return id === "normal" ||
    id === "any" ||
    id === "adjacentally" ||
    id === "adjacentallyorself" ||
    id === "adjacentfoe";
}

function isUntargetedLockedMove(move: BattleMoveRequestV4): boolean {
  return toId(move.id || move.move) === "recharge" || !move.target;
}

function typeIdFor(value: string | undefined): string {
  const id = toId(value);
  if (id === "electric" || id === "elec") return "electric";
  if (id === "fighting" || id === "fight") return "fighting";
  if (id === "psychic" || id === "psy") return "psychic";
  return id;
}

function statusBadge(status: string | undefined): BattleV4StatusBadge | null {
  const code = String(status || "").toLowerCase();
  const badge = STATUS_BADGES[code];
  return badge ? {code, ...badge} : null;
}

type SwitchCandidateV4 = {
  key: string;
  index: number;
  row: RequestPokemonV4 | null;
  localPokemon: LocalPokemonV4 | null;
  action: SwitchActionV4 | null;
  label: string;
  status: string;
  hp: number;
  maxHp: number;
  active: boolean;
  fainted: boolean;
  canSwitch: boolean;
  reason: string;
};

type SwitchPanelTeamV4 = {
  playerId: string;
  title: string;
  side: "near" | "far";
  relation: "self" | "ally" | "foe";
  candidates: SwitchCandidateV4[];
};

function BattleV4SwitchPanel({api, snapshot, switchActions, forceSwitch, busy, debugConfig, onClose, onConfirm}: {
  api: ChangeBattleV2Api;
  snapshot: BattleSessionSnapshotV4;
  switchActions: SwitchActionV4[];
  forceSwitch: boolean;
  busy: boolean;
  debugConfig?: AppDebugConfigV4;
  onClose: () => void;
  onConfirm: (choice: string) => void;
}) {
  const candidates = useMemo(() => buildSwitchCandidates(snapshot, switchActions, debugConfig), [snapshot, switchActions, debugConfig]);
  const panelTeams = useMemo(() => buildSwitchPanelTeams(snapshot, candidates), [snapshot, candidates]);
  const flatCandidates = panelTeams.flatMap(team => team.candidates);
  const firstSelectable = flatCandidates.find(candidate => candidate.canSwitch);
  const [selectedKey, setSelectedKey] = useState(firstSelectable?.key || flatCandidates.find(candidate => candidate.row || candidate.localPokemon)?.key || flatCandidates[0]?.key || "");
  const selected = flatCandidates.find(candidate => candidate.key === selectedKey) || firstSelectable || flatCandidates[0] || null;
  const enemies = useMemo(() => buildEnemyRows(snapshot), [snapshot]);
  const isCoop = snapshot.mode === "coop";
  return (
    <section className={`battle-v4-switch-selector ${isCoop ? "coop" : ""}`} aria-label="换人选择">
      <div className="battle-v4-switch-title">
        <span>查看状态</span>
        <strong>{forceSwitch ? "必须换人" : "选择交换对象"}</strong>
      </div>
      {isCoop ? (
        <>
          <aside className="battle-v4-switch-team-stack left" aria-label="P1 和 P2 队伍">
            {panelTeams.filter(team => team.playerId === "p1" || team.playerId === "p2").map(team => (
              <BattleV4SwitchTeamList team={team} selectedKey={selected?.key || ""} onSelect={setSelectedKey} key={team.playerId} />
            ))}
          </aside>
        </>
      ) : (
        <aside className="battle-v4-switch-list ally-list" aria-label="我方队伍">
          <h3>我方队伍</h3>
          {candidates.map(candidate => (
            <BattleV4SwitchPartyCard
              candidate={candidate}
              selected={candidate.key === selected?.key}
              onSelect={setSelectedKey}
              key={candidate.key}
            />
          ))}
        </aside>
      )}
      <BattleV4SwitchDetailPanel api={api} candidate={selected} />
      {isCoop ? (
        <aside className="battle-v4-switch-team-stack right" aria-label="P3 和 P4 队伍">
          {panelTeams.filter(team => team.playerId === "p3" || team.playerId === "p4").map(team => (
            <BattleV4SwitchTeamList team={team} selectedKey={selected?.key || ""} onSelect={setSelectedKey} key={team.playerId} />
          ))}
        </aside>
      ) : (
        <aside className="battle-v4-switch-list enemy-list" aria-label="敌方队伍">
          <h3>敌方队伍</h3>
          {enemies.map((pokemon, index) => <BattleV4EnemyPartyCard pokemon={pokemon} index={index} key={pokemon?.localPokemonId || index} />)}
        </aside>
      )}
      <footer className="battle-v4-switch-footer">
        <button type="button" disabled={busy || forceSwitch} onClick={onClose}>返回</button>
        {selected?.canSwitch && selected.action ? (
          <button className="confirm" type="button" disabled={busy} onClick={() => selected.action && onConfirm(selected.action.choice)}>
            确认交换
          </button>
        ) : <span>{selected?.reason || "不可交换"}</span>}
      </footer>
    </section>
  );
}

function BattleV4SwitchTeamList({team, selectedKey, onSelect}: {team: SwitchPanelTeamV4; selectedKey: string; onSelect: (key: string) => void}) {
  return (
    <section className={`battle-v4-switch-list battle-v4-switch-team ${team.side} ${team.relation}`} aria-label={`${team.title}队伍`}>
      <h3>{team.title}</h3>
      {team.candidates.map(candidate => (
        <BattleV4SwitchPartyCard
          candidate={candidate}
          selected={candidate.key === selectedKey}
          onSelect={onSelect}
          key={candidate.key}
        />
      ))}
    </section>
  );
}

function BattleV4SwitchPartyCard({candidate, selected, onSelect}: {
  candidate: SwitchCandidateV4;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  const pokemon = candidate.localPokemon;
  const status = statusBadge(candidate.status);
  const hpRate = candidate.maxHp ? Math.max(0, Math.min(100, candidate.hp / candidate.maxHp * 100)) : 0;
  const identity = switchCandidateIdentity(candidate);
  return (
    <button
      className={`battle-v4-switch-card ${candidate.canSwitch ? "operable" : "readonly"} ${selected ? "selected" : ""} ${candidate.active ? "active" : ""} ${candidate.fainted ? "fainted" : ""} ${candidate.status && !candidate.fainted ? "statused" : ""}`}
      type="button"
      onClick={() => onSelect(candidate.key)}
      title={[candidate.reason, identity ? `ID: ${identity}` : ""].filter(Boolean).join(" · ")}
    >
      <span className="battle-v4-switch-sprite">
        <BattleV4Icon src={pokemon?.iconUrl || pokemon?.frontSpriteUrl || pokemon?.spriteUrl || ""} iconStyle={pokemon?.iconStyle} alt={candidate.label} />
      </span>
      <span className="battle-v4-switch-info">
        <strong>{candidate.label}</strong>
        <span className="battle-v4-switch-hp">
          <i><b style={{width: `${hpRate}%`}} /></i>
          <b>{candidate.maxHp ? `${candidate.hp}/${candidate.maxHp}` : candidate.row?.condition || "--"}</b>
        </span>
        <small>{pokemon?.itemId || candidate.row?.item || "无道具"}</small>
      </span>
      {candidate.active ? <em className="battle-v4-switch-mark active">出战</em> : null}
      {status ? <StatusBadge badge={status} className="battle-v4-switch-mark status" /> : null}
      {!candidate.canSwitch && !candidate.active && !candidate.fainted ? <em className="battle-v4-switch-mark reason">{candidate.reason}</em> : null}
    </button>
  );
}

function BattleV4EnemyPartyCard({pokemon, index}: {pokemon: LocalPokemonV4 | null; index: number}) {
  if (!pokemon) {
    return (
      <article className="battle-v4-switch-card enemy empty">
        <span className="battle-v4-switch-question">?</span>
      </article>
    );
  }
  const status = statusBadge(pokemon.entryHp <= 0 ? "fnt" : pokemon.entryStatus);
  return (
    <article className={`battle-v4-switch-card enemy owned ${pokemon.entryHp <= 0 ? "fainted" : ""} ${status && pokemon.entryHp > 0 ? "statused" : ""}`} title={pokemon.showdownIdentityToken || pokemon.showdownId || pokemon.pokeballId || pokemon.localPokemonId}>
      <span className="battle-v4-switch-sprite">
        <BattleV4Icon src={pokemon.iconUrl || pokemon.frontSpriteUrl || pokemon.spriteUrl || ""} iconStyle={pokemon.iconStyle} alt={pokemon.nameZh || pokemon.name || `对手${index + 1}`} />
      </span>
      <span className="battle-v4-switch-info">
        <strong>{pokemon.nameZh || pokemon.name || `对手${index + 1}`}</strong>
        <small>Lv.{pokemon.level}</small>
      </span>
      {status ? <StatusBadge badge={status} className="battle-v4-switch-mark status" /> : null}
    </article>
  );
}

function BattleV4SwitchDetailPanel({api, candidate}: {api: ChangeBattleV2Api; candidate: SwitchCandidateV4 | null}) {
  const pokemon = candidate?.localPokemon || null;
  const detail = useMemo(() => {
    if (!pokemon) return null;
    try {
      return api.getPokemonDetail(pokemon.speciesId);
    } catch {
      return null;
    }
  }, [api, pokemon]);
  const stats = useMemo(() => {
    if (!pokemon) return null;
    try {
      return api.dex.calculatePokemonStats({
        speciesId: pokemon.speciesId,
        level: pokemon.level,
        nature: pokemon.nature,
        evs: pokemon.evs,
        ivs: pokemon.ivs,
      }).stats;
    } catch {
      return null;
    }
  }, [api, pokemon]);
  if (!candidate || !pokemon) {
    return (
      <section className="battle-v4-switch-detail empty">
        <header><strong>能力</strong></header>
        <div className="battle-v4-switch-empty-detail">
          <strong>{candidate?.label || "请选择我方宝可梦"}</strong>
          <span>{candidate?.row?.details || "暂无本地详情"}</span>
        </div>
      </section>
    );
  }
  return (
    <section className="battle-v4-switch-detail">
      <header>
        <strong>能力</strong>
        <span>{pokemon.nameZh || pokemon.name} Lv.{pokemon.level}</span>
      </header>
      <div className="battle-v4-switch-detail-types">
        {(detail?.types || []).slice(0, 2).map(type => <i key={type}>{type}</i>)}
        <b>{pokemon.nature || "性格未知"}</b>
      </div>
      <div className="battle-v4-switch-moves">
        {pokemon.moves.slice(0, 4).map((move, index) => <BattleV4SwitchMove move={move} key={`${move.moveId}-${index}`} />)}
      </div>
      <div className="battle-v4-switch-ability-item">
        <span>
          <b>特性</b>
          <strong>{pokemon.abilityNameZh || pokemon.abilityName || pokemon.abilityId || "未知"}</strong>
          <em>{pokemon.abilityId || "暂无说明"}</em>
        </span>
        <span>
          <b>持有物</b>
          <strong>{pokemon.itemId || "无"}</strong>
          <em>{pokemon.itemId ? "已携带道具" : "没有持有道具"}</em>
        </span>
      </div>
      <div className="battle-v4-switch-stats">
        {STAT_ROWS.map(([stat, label]) => (
          <span key={stat}><b>{label}</b><strong>{stats?.[stat] ?? pokemon[stat === "hp" ? "maxHp" : "level"] ?? "?"}</strong></span>
        ))}
      </div>
      <small className="battle-v4-switch-identity-note">
        ID {shortIdentity(pokemon.showdownIdentityToken || pokemon.showdownId || pokemon.pokeballId || candidate?.row?.pokeball || pokemon.localPokemonId)}
      </small>
    </section>
  );
}

function BattleV4SwitchMove({move}: {move: TrainingMoveSlotV4}) {
  return (
    <span>
      <b>{move.type || "?"}</b>
      <strong>{move.nameZh || move.name || move.moveId}</strong>
      <i>威 {move.power || "—"}</i>
      <em>PP {move.remainingPp}/{move.maxPp}</em>
    </span>
  );
}

function buildSwitchCandidates(snapshot: BattleSessionSnapshotV4, switchActions: SwitchActionV4[], debugConfig?: AppDebugConfigV4): SwitchCandidateV4[] {
  const request = snapshot.requests.p1;
  const rows = request?.side?.pokemon || [];
  const player = snapshot.players.find(entry => entry.playerId === "p1");
  const localTeam = player?.draft.localTeam.pokemon || [];
  const mapping = player?.teamMapping || [];
  const actionByIndex = new Map(switchActions.map(action => [action.pokemonIndex, action]));
  const requestLength = request?.forceSwitch?.length || request?.active?.length || 1;
  const trapped = Boolean(request?.active?.[0]?.trapped && !request?.forceSwitch);
  const hasActiveFlags = rows.some(row => row.active);
  const count = Math.max(6, rows.length, localTeam.length);
  return Array.from({length: count}, (_, index) => {
    const row = rows[index] || null;
    const resolved = resolveLocalPokemonFromRequestRow(row, mapping, localTeam, index);
    const localPokemon = resolved.localPokemon;
    const action = actionByIndex.get(index) || null;
    battleDebugLog(debugConfig, "ui", "resolve-switch-candidate", {
      requestIndex: index,
      choiceIndex: resolved.choiceIndex,
      rowPokeball: row?.pokeball || "",
      resolvedLocalPokemonId: localPokemon?.localPokemonId || null,
      resolvedToken: resolved.token || resolved.mapping?.showdownIdentityToken || "",
      fallbackReason: resolved.fallbackReason,
      finalChoice: action?.choice || null,
    });
    const label = localPokemon?.nameZh || localPokemon?.name || row?.name || row?.details?.split(",")[0] || row?.ident || `空位 ${index + 1}`;
    const status = rowStatus(row) || localPokemon?.entryStatus || "";
    const hp = hpFromCondition(row?.condition, localPokemon?.entryHp || 0);
    const maxHp = maxHpFromCondition(row?.condition, localPokemon?.maxHp || 0);
    const active = Boolean(hasActiveFlags ? row?.active : index < requestLength);
    const fainted = Boolean(row?.fainted || row?.condition?.includes("fnt") || localPokemon && localPokemon.entryHp <= 0);
    let reason = "";
    if (!row && !localPokemon) reason = "空位";
    else if (active) reason = "当前出战";
    else if (fainted) reason = "已经倒下";
    else if (trapped) reason = "无法逃脱";
    else if (!action) reason = "无法定位";
    return {
      key: row?.ident || localPokemon?.localPokemonId || String(index),
      index,
      row,
      localPokemon,
      action,
      label,
      status,
      hp,
      maxHp,
      active,
      fainted,
      canSwitch: Boolean(action && !reason),
      reason,
    };
  });
}

function buildSwitchPanelTeams(snapshot: BattleSessionSnapshotV4, selfCandidates: SwitchCandidateV4[]): SwitchPanelTeamV4[] {
  const playerIds = ["p1", "p2", "p3", "p4"] as const;
  const titles: Record<(typeof playerIds)[number], string> = {
    p1: "P1 队伍",
    p2: "P2 队伍",
    p3: "P3 队伍",
    p4: "P4 队伍",
  };
  return playerIds.map(playerId => {
    const relation = playerId === "p1" ? "self" : playerId === "p3" ? "ally" : "foe";
    const side = playerId === "p1" || playerId === "p3" ? "near" : "far";
    const candidates = playerId === "p1"
      ? selfCandidates.slice(0, 2)
      : buildReadonlySwitchCandidatesForPlayer(snapshot, playerId, playerId === "p3" ? "ally" : "foe");
    return {
      playerId,
      title: titles[playerId],
      side,
      relation,
      candidates,
    };
  });
}

function buildReadonlySwitchCandidatesForPlayer(
  snapshot: BattleSessionSnapshotV4,
  playerId: "p2" | "p3" | "p4",
  relation: "ally" | "foe",
): SwitchCandidateV4[] {
  const player = snapshot.players.find(entry => entry.playerId === playerId);
  const localTeam = player?.draft.localTeam.pokemon || [];
  const rows = snapshot.requests[playerId]?.side?.pokemon || snapshot.debug.latestSidePokemon?.[playerId] || [];
  const mapping = player?.teamMapping || [];
  const count = Math.max(2, Math.min(2, localTeam.length || rows.length || 2));
  return Array.from({length: count}, (_, index) => {
    const row = rows[index] || null;
    const resolved = resolveLocalPokemonFromRequestRow(row, mapping, localTeam, index);
    const localPokemon = resolved.localPokemon || localTeam[index] || null;
    const label = localPokemon?.nameZh || localPokemon?.name || row?.name || row?.details?.split(",")[0] || row?.ident || `空位 ${index + 1}`;
    const status = rowStatus(row) || localPokemon?.entryStatus || "";
    const hp = hpFromCondition(row?.condition, localPokemon?.entryHp || 0);
    const maxHp = maxHpFromCondition(row?.condition, localPokemon?.maxHp || 0);
    const active = Boolean(row?.active || activeContainsPokemon(snapshot, playerId, localPokemon, row));
    const fainted = Boolean(row?.fainted || row?.condition?.includes("fnt") || localPokemon && localPokemon.entryHp <= 0);
    return {
      key: `${playerId}-${row?.ident || localPokemon?.localPokemonId || index}`,
      index,
      row,
      localPokemon,
      action: null,
      label,
      status,
      hp,
      maxHp,
      active,
      fainted,
      canSwitch: false,
      reason: relation === "ally" ? "队友只读" : "对方只读",
    };
  });
}

function activeContainsPokemon(
  snapshot: BattleSessionSnapshotV4,
  playerId: string,
  pokemon: LocalPokemonV4 | null,
  row: RequestPokemonV4 | null,
): boolean {
  const token = pokemon?.showdownIdentityToken || pokemon?.showdownId || pokemon?.pokeballId || row?.pokeball || "";
  const names = new Set([pokemon?.speciesId, pokemon?.name, pokemon?.nameZh, pokemon?.nickname, row?.details, row?.ident, row?.name].map(value => toId(value || "")).filter(Boolean));
  return snapshot.active.some(active => {
    if (active.playerId !== playerId || active.fainted) return false;
    if (token && active.ident.includes(token)) return true;
    const activeNames = [active.species, active.details, active.ident].map(value => toId(value || ""));
    return activeNames.some(value => names.has(value));
  });
}

function buildEnemyRows(snapshot: BattleSessionSnapshotV4): Array<LocalPokemonV4 | null> {
  const far = snapshot.players.find(player => player.playerId === "p2") || snapshot.players.find(player => player.alliance === "far");
  const team = far?.draft.localTeam.pokemon || [];
  return Array.from({length: 6}, (_, index) => team[index] || null);
}

function rowStatus(row: RequestPokemonV4 | null): string {
  if (!row?.condition) return "";
  if (row.condition.includes("fnt")) return "fnt";
  const parts = row.condition.split(" ");
  return parts.length > 1 ? parts[1] || "" : "";
}

function hpFromCondition(condition: string | undefined, fallback: number): number {
  if (!condition) return fallback;
  if (condition.includes("fnt")) return 0;
  const match = condition.match(/^(\d+)\/(\d+)/);
  return match ? Number(match[1]) : fallback;
}

function maxHpFromCondition(condition: string | undefined, fallback: number): number {
  if (!condition) return fallback;
  const match = condition.match(/^(\d+)\/(\d+)/);
  return match ? Number(match[2]) : fallback;
}

function slotIdentityLabel(slot: BattleViewSlotV4): string {
  return shortIdentity(slot.showdownIdentityToken || slot.showdownId || slot.pokeballId || slot.localPokemonId);
}

function switchCandidateIdentity(candidate: SwitchCandidateV4): string {
  const token = candidate.localPokemon?.showdownIdentityToken
    || candidate.localPokemon?.showdownId
    || candidate.localPokemon?.pokeballId
    || candidate.row?.pokeball
    || "";
  const localId = candidate.localPokemon?.localPokemonId || "";
  if (token && localId) return `${shortIdentity(token)} · ${shortIdentity(localId)}`;
  return shortIdentity(token || localId);
}

function shortIdentity(value: string): string {
  if (!value) return "";
  return value.length > 10 ? `${value.slice(0, 10)}…` : value;
}

function BattleV4Icon({src, iconStyle, alt}: {src?: string; iconStyle?: string; alt: string}) {
  if (iconStyle) return <span className="battle-v4-picon" aria-label={alt} style={styleFromCss(iconStyle)} />;
  if (!src || src.includes("pokemonicons-sheet")) return <span className="battle-v4-picon empty" aria-label={alt}>?</span>;
  return <ImageWithFallback src={src} alt={alt} fallback={alt.slice(0, 1) || "?"} />;
}

function styleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url(${match[1]})`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}

function requestKeyForCommand(request: BattleRequestV4 | null, requestType: string): string {
  if (!request) return "none";
  if (request.rqid !== undefined) return `${requestType}:${request.rqid}`;
  const moves = (request.active || []).map(active => (active?.moves || []).map(move => `${move.id || move.move}:${move.pp ?? ""}:${move.disabled ? 1 : 0}`).join("/")).join("|");
  const switches = (request.forceSwitch || []).map(Boolean).join(",");
  const side = (request.side?.pokemon || []).map(pokemon => `${pokemon.ident}:${pokemon.pokeball || ""}:${pokemon.condition}:${pokemon.active ? 1 : 0}`).join("|");
  return `${requestType}:${moves}:${switches}:${side}`;
}

function requestDebugSummary(command: BattleViewModelV4["command"]) {
  const request = command.request;
  const normalized = command.normalizedRequest;
  if (!request) return null;
  return {
    requestType: normalized?.requestType || command.requestType,
    rqid: request.rqid,
    noCancel: normalized?.noCancel ?? Boolean(request.noCancel),
    targetable: normalized?.targetable ?? Boolean(request.targetable),
    requestLength: normalized?.requestLength ?? command.requestLength,
    activeIndex: normalized?.activeIndex ?? command.activeIndex,
    activeLength: request.active?.length || 0,
    forceSwitch: request.forceSwitch || null,
    ally: Boolean(normalized?.readonlyAlly || request.ally),
    readonlyAllyPokemon: normalized?.readonlyAlly?.pokemon?.length || 0,
    sidePokemon: (normalized?.sidePokemon || request.side?.pokemon || []).map((pokemon, index) => ({
      requestIndex: index,
      choiceIndex: normalized?.choiceIndexByTeamIndex?.[index] || index + 1,
      ident: pokemon.ident,
      details: pokemon.details,
      condition: pokemon.condition,
      active: Boolean(pokemon.active),
      pokeball: pokemon.pokeball || "",
    })),
  };
}

function snapshotDebugSummary(snapshot: BattleSessionSnapshotV4) {
  const request = snapshot.requests.p1 || null;
  const command = projectBattleViewModelV4(snapshot, "p1").command;
  return {
    status: snapshot.status,
    turn: snapshot.turn,
    winner: snapshot.winner,
    request: request ? requestDebugSummary(command) : null,
    requests: Object.fromEntries(Object.entries(snapshot.requests).map(([playerId, playerRequest]) => [
      playerId,
      playerRequest ? summarizeRawRequest(playerRequest) : null,
    ])),
    lastChoices: snapshot.debug.lastChoices.slice(-12),
    inputLogTail: snapshot.debug.inputLog.slice(-12),
    playerStreamTail: snapshot.debug.playerStreams.slice(-20),
    activeSlots: snapshot.active.map(active => ({
      ident: active.ident,
      playerId: active.playerId,
      slot: active.slot,
      species: active.species,
      condition: active.condition,
      hp: active.hp,
      maxHp: active.maxHp,
      status: active.status,
      fainted: active.fainted,
    })),
    recordTail: snapshot.rawLog.slice(-12),
  };
}

function summarizeRawRequest(request: BattleRequestV4) {
  return {
    wait: Boolean(request.wait),
    teamPreview: Boolean(request.teamPreview),
    targetable: Boolean(request.targetable),
    rqid: request.rqid,
    activeLength: request.active?.length || 0,
    forceSwitch: request.forceSwitch || null,
    side: request.side ? {
      id: request.side.id,
      pokemon: request.side.pokemon.map((pokemon, index) => ({
        index,
        ident: pokemon.ident,
        details: pokemon.details,
        condition: pokemon.condition,
        active: Boolean(pokemon.active),
        fainted: Boolean(pokemon.fainted),
        pokeball: pokemon.pokeball || "",
      })),
    } : null,
  };
}

function battleV4StallDiagnosis(snapshot: BattleSessionSnapshotV4 | null): string[] {
  if (!snapshot) return ["missing-snapshot"];
  const diagnosis: string[] = [];
  const p1 = snapshot.requests.p1;
  const aiRequests = Object.entries(snapshot.requests)
    .filter(([playerId]) => playerId !== "p1")
    .filter(([, request]) => request && !request.wait);
  if (snapshot.status === "running" && !p1) diagnosis.push("p1-request-missing");
  if (p1?.wait) diagnosis.push("p1-wait-request");
  for (const [playerId, request] of aiRequests) {
    if (request?.forceSwitch?.some(Boolean)) diagnosis.push(`${playerId}-pending-force-switch`);
    else if (request?.teamPreview) diagnosis.push(`${playerId}-pending-team-preview`);
    else diagnosis.push(`${playerId}-pending-action`);
  }
  const lastRaw = snapshot.rawLog.slice(-20);
  if (lastRaw.some(line => line.startsWith("|faint|"))) diagnosis.push("recent-faint");
  if (lastRaw.some(line => line.startsWith("|turn|"))) diagnosis.push(`last-turn-${snapshot.turn}`);
  return diagnosis.length ? diagnosis : ["no-obvious-stall-signal"];
}

function buildBattleV4Diagnostics(snapshot: BattleSessionSnapshotV4 | null, draft: BattleCommandDraftV4 | null) {
  const command = snapshot ? projectBattleViewModelV4(snapshot, "p1", draft).command : null;
  return {
    exportedAt: new Date().toISOString(),
    diagnosis: battleV4StallDiagnosis(snapshot),
    snapshotSummary: snapshot ? snapshotDebugSummary(snapshot) : null,
    draft,
    p1RawRequest: command?.request || null,
    p1NormalizedRequest: command ? requestDebugSummary(command) : null,
    allRequests: snapshot?.requests || {},
    players: snapshot?.players.map(player => ({
      playerId: player.playerId,
      controller: player.controller,
      alliance: player.alliance,
      teamMapping: player.teamMapping || [],
      team: player.team.map((pokemon, index) => ({
        index,
        species: pokemon.species,
        name: pokemon.name,
        pokeball: pokemon.pokeball,
        entryHp: pokemon.entryHp,
        entryStatus: pokemon.entryStatus,
      })),
    })) || [],
    active: snapshot?.active || [],
    lastChoices: snapshot?.debug.lastChoices || [],
    inputLog: snapshot?.debug.inputLog || [],
    playerStreams: snapshot?.debug.playerStreams || [],
    playerStreamTail: snapshot?.debug.playerStreams.slice(-80) || [],
    rawLog: snapshot?.rawLog || [],
  };
}

function exportBattleV4Diagnostics(snapshot: BattleSessionSnapshotV4 | null, draft: BattleCommandDraftV4 | null) {
  if (!snapshot) return;
  const diagnostics = buildBattleV4Diagnostics(snapshot, draft);
  const blob = new Blob([JSON.stringify(diagnostics, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `battle-v4-diagnostics-${snapshot.id}-turn-${snapshot.turn}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function BattleV4DebugModal({snapshot, draft, onClose}: {snapshot: BattleSessionSnapshotV4 | null; draft: BattleCommandDraftV4 | null; onClose: () => void}) {
  const command = snapshot ? projectBattleViewModelV4(snapshot, "p1", draft).command : null;
  const rawRequest = command?.request || null;
  const normalizedRequest = command ? requestDebugSummary(command) : null;
  const diagnostics = buildBattleV4Diagnostics(snapshot, draft);
  return (
    <div className="battle-v4-debug-modal">
      <section>
        <header>
          <strong>BattleStream Debug</strong>
          <button type="button" onClick={() => exportBattleV4Diagnostics(snapshot, draft)} disabled={!snapshot}>导出诊断</button>
          <button type="button" onClick={onClose}>关闭</button>
        </header>
        <div className="battle-v4-debug-content">
          <article>
            <h3>Diagnosis</h3>
            <pre>{JSON.stringify(diagnostics.diagnosis, null, 2)}</pre>
          </article>
          <article>
            <h3>Raw Request</h3>
            <pre>{rawRequest ? JSON.stringify(rawRequest, null, 2) : "暂无 request"}</pre>
          </article>
          <article>
            <h3>All Requests</h3>
            <pre>{snapshot ? JSON.stringify(snapshot.requests, null, 2) : "暂无 requests"}</pre>
          </article>
          <article>
            <h3>Normalized Request</h3>
            <pre>{normalizedRequest ? JSON.stringify(normalizedRequest, null, 2) : "暂无 normalized request"}</pre>
          </article>
          <article>
            <h3>Draft</h3>
            <pre>{draft ? JSON.stringify(draft, null, 2) : "暂无 draft"}</pre>
          </article>
          <article>
            <h3>Last Choices</h3>
            <pre>{snapshot?.debug.lastChoices.length ? JSON.stringify(snapshot.debug.lastChoices.slice(-12), null, 2) : "暂无提交记录"}</pre>
          </article>
          <article>
            <h3>Input Log</h3>
            <pre>{snapshot?.debug.inputLog.slice(-20).join("\n\n") || "暂无 input log"}</pre>
          </article>
          <article>
            <h3>Player Streams</h3>
            <pre>{snapshot?.debug.playerStreams.length ? JSON.stringify(snapshot.debug.playerStreams.slice(-40), null, 2) : "暂无 player stream"}</pre>
          </article>
          <article>
            <h3>Raw Protocol</h3>
            <pre>{snapshot?.rawLog.slice(-80).join("\n") || "暂无日志"}</pre>
          </article>
        </div>
      </section>
    </div>
  );
}
