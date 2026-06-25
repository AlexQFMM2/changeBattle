import {useEffect, useMemo, useState} from "react";
import type {BattleCommandActionV4, BattleSessionSnapshotV4, BattleViewSlotV4, ChangeBattleV2Api, TrainingRunGameV4} from "@changebattle-v2/api";
import {applyBattleSessionToRun, projectBattleViewModelV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./BattleV4Page.css";

export type BattleV4PageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  sessionId: string;
  onRunChange: (run: TrainingRunGameV4) => void;
  onBackToRest: () => void;
};

const MODE_LABEL = {
  singles: "单打",
  doubles: "双打",
  coop: "合作",
};

export function BattleV4Page({api, run, sessionId, onRunChange, onBackToRest}: BattleV4PageProps) {
  const [snapshot, setSnapshot] = useState<BattleSessionSnapshotV4 | null>(null);
  const [message, setMessage] = useState("正在连接 Battle Service...");
  const [busy, setBusy] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const viewModel = useMemo(() => snapshot ? projectBattleViewModelV4(snapshot, "p1") : null, [snapshot]);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    async function tick() {
      if (!sessionId) {
        setMessage("缺少战斗 session，请从休整页重新进入。");
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
  }, [api, onRunChange, run, sessionId]);

  async function submitChoice(choice: string) {
    if (!choice || busy || !sessionId) return;
    setBusy(true);
    setMessage(`提交指令：${choice}`);
    try {
      const next = await api.battleService.submitChoice(sessionId, "p1", choice);
      setSnapshot(next);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交指令失败。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="battle-v4-page">
      <BattleArena near={viewModel?.nearTeam || []} far={viewModel?.farTeam || []} />
      <header className="battle-v4-hud">
        <span>Turn {viewModel?.turn ?? "--"}</span>
        <span>{viewModel ? MODE_LABEL[viewModel.mode] : "读取中"}</span>
        <button type="button" onClick={() => setDebugOpen(true)}>记录</button>
      </header>
      <BattleCommandPanel
        snapshot={snapshot}
        busy={busy}
        message={message}
        actions={viewModel?.command.actions || []}
        activeName={viewModel?.command.activePokemon?.name || ""}
        requestType={viewModel?.command.requestType || "none"}
        onSubmit={choice => void submitChoice(choice)}
      />
      {snapshot?.status === "ended" ? (
        <div className="battle-v4-result-panel">
          <strong>{snapshot.winner === "p1" || snapshot.winner === "p3" ? "训练胜利" : "训练失败"}</strong>
          <span>节点状态已回写，返回休整区查看下一场。</span>
          <button type="button" onClick={onBackToRest}>返回休整区</button>
        </div>
      ) : null}
      {debugOpen ? <BattleV4DebugModal snapshot={snapshot} onClose={() => setDebugOpen(false)} /> : null}
    </section>
  );
}

function BattleArena({near, far}: {near: BattleViewSlotV4[]; far: BattleViewSlotV4[]}) {
  return (
    <div className="battle-v4-arena" aria-label="战斗场地">
      <div className="battle-v4-side far">
        {far.map(slot => <BattlePokemonSlot slot={slot} key={`${slot.playerId}-${slot.position}`} />)}
      </div>
      <div className="battle-v4-side near">
        {near.map(slot => <BattlePokemonSlot slot={slot} key={`${slot.playerId}-${slot.position}`} />)}
      </div>
    </div>
  );
}

function BattlePokemonSlot({slot}: {slot: BattleViewSlotV4}) {
  const hpRate = slot.maxHp ? Math.max(0, Math.min(100, slot.hp / slot.maxHp * 100)) : 0;
  return (
    <article className={`battle-v4-pokemon ${slot.side} ${slot.position.toLowerCase()} ${slot.fainted ? "fainted" : ""}`}>
      <div className="battle-v4-pokemon-status">
        <strong>{slot.nameZh || slot.name}</strong>
        <span>Lv.{slot.level}</span>
        {slot.status ? <em>{slot.status}</em> : null}
        <i><b style={{width: `${hpRate}%`}} /></i>
      </div>
      <ImageWithFallback src={slot.spriteUrl || slot.iconUrl} alt={slot.nameZh || slot.name} />
      <div className="battle-v4-team-balls" aria-hidden="true">
        {slot.teamBallStates.map((state, index) => <span className={state} key={index} />)}
      </div>
    </article>
  );
}

function BattleCommandPanel({snapshot, busy, message, actions, activeName, requestType, onSubmit}: {
  snapshot: BattleSessionSnapshotV4 | null;
  busy: boolean;
  message: string;
  actions: BattleCommandActionV4[];
  activeName: string;
  requestType: string;
  onSubmit: (choice: string) => void;
}) {
  const title = requestType === "move" ? `${activeName || "宝可梦"} 要做什么？`
    : requestType === "switch" ? `替换 ${activeName || "宝可梦"}`
      : requestType === "team" ? "选择出场顺序"
        : "等待对局";
  return (
    <section className="battle-v4-command-panel">
      <header>
        <strong>{title}</strong>
        <span>{busy ? "提交中..." : message || snapshot?.error || ""}</span>
      </header>
      <div className={`battle-v4-command-grid ${requestType}`}>
        {actions.length ? actions.map(action => (
          <button type="button" disabled={busy || isDisabledAction(action)} onClick={() => onSubmit(action.choice)} key={`${action.kind}-${action.choice}-${action.label}`}>
            <strong>{action.label}</strong>
            <small>{action.choice}</small>
          </button>
        )) : <p>{message || "等待 Showdown request..."}</p>}
      </div>
    </section>
  );
}

function isDisabledAction(action: BattleCommandActionV4): boolean {
  return action.kind === "move" ? Boolean(action.move.disabled || action.move.pp === 0) : Boolean(action.disabled);
}

function BattleV4DebugModal({snapshot, onClose}: {snapshot: BattleSessionSnapshotV4 | null; onClose: () => void}) {
  return (
    <div className="battle-v4-debug-modal">
      <section>
        <header>
          <strong>BattleStream Debug</strong>
          <button type="button" onClick={onClose}>关闭</button>
        </header>
        <pre>{snapshot?.rawLog.slice(-80).join("\n") || "暂无日志"}</pre>
      </section>
    </div>
  );
}
