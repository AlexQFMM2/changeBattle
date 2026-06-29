import "./BattleV4SurrenderPanel.css";

export type BattleV4SurrenderParticipant = {
  id: string;
  name: string;
  avatar: string;
};

export function BattleV4SurrenderPanel({
  participants,
  approvedIds,
  remainingMs,
  durationMs,
  submitting,
  onConfirm,
  onCancel,
}: {
  participants: BattleV4SurrenderParticipant[];
  approvedIds: Set<string>;
  remainingMs: number;
  durationMs: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const progress = Math.max(0, Math.min(100, durationMs ? remainingMs / durationMs * 100 : 0));
  const approvedCount = participants.filter(participant => approvedIds.has(participant.id)).length;
  return (
    <div className="battle-v4-surrender-panel" role="dialog" aria-label="投降确认">
      <section>
        <header>发起投降</header>
        <div className="battle-v4-surrender-votes" aria-label={`投降确认票 ${approvedCount}/${participants.length}`}>
          {participants.map(participant => {
            const approved = approvedIds.has(participant.id);
            return (
              <span
                className={approved ? "approved" : ""}
                title={`${participant.name}${approved ? " 已同意" : " 未同意"}`}
                key={participant.id}
              />
            );
          })}
        </div>
        <div className="battle-v4-surrender-progress" aria-label="投降确认倒计时">
          <b style={{width: `${progress}%`}} />
        </div>
        <footer>
          <button type="button" disabled={submitting || approvedIds.has("p1")} onClick={onConfirm}>是</button>
          <button type="button" disabled={submitting} onClick={onCancel}>否</button>
        </footer>
      </section>
    </div>
  );
}
