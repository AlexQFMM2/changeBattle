import type {BattleAiHint, BattleAiHintAlternative} from "@changebattle/shared";
import "./BattleAiHintModal.css";

export function BattleAiHintModal({hint, error, disabled, onExecute, onClose}: {hint: BattleAiHint | null; error: string | null; disabled?: boolean; onExecute: (choice: string) => void | Promise<void>; onClose: () => void}) {
  const alternatives = hint?.alternatives || [];
  return (
    <div className="modal-layer battle-ai-hint-layer">
      <div className="battle-ai-hint-modal">
        <header>
          <h2>AI 提示</h2>
          <button type="button" onClick={onClose}>关闭</button>
        </header>
        {error ? (
          <p className="battle-ai-hint-error">{error}</p>
        ) : hint ? (
          <>
            <section className="battle-ai-hint-primary">
              <strong>{hint.title}</strong>
              <span>指令 {hint.choice_label || hint.choice}</span>
              <p>{hint.reason}</p>
            </section>
            {alternatives.length ? (
              <section className="battle-ai-hint-alternatives">
                <h3>备选</h3>
                {alternatives.map(option => <BattleAiHintAlternativeRow option={option} key={option.choice} />)}
              </section>
            ) : null}
            <footer>
              <button type="button" onClick={onClose}>先看看</button>
              <button className="primary" type="button" disabled={disabled} onClick={() => onExecute(hint.choice)}>执行建议</button>
            </footer>
          </>
        ) : null}
      </div>
    </div>
  );
}

function BattleAiHintAlternativeRow({option}: {option: BattleAiHintAlternative}) {
  return (
    <div className="battle-ai-hint-alt">
      <strong>{option.title}</strong>
      <span>{option.choice_label || option.choice}</span>
      <p>{option.reason}</p>
    </div>
  );
}
