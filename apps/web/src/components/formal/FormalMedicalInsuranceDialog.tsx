import type {FormalMedicalInsuranceChoiceV4, FormalMedicalInsuranceOfferV4} from "@changebattle-v2/api";
import "./FormalMedicalInsuranceDialog.css";

export function FormalMedicalInsuranceDialog({
  offer,
  money,
  busy,
  error,
  onChoose,
}: {
  offer: FormalMedicalInsuranceOfferV4;
  money: number;
  busy: boolean;
  error?: string | null;
  onChoose: (choice: FormalMedicalInsuranceChoiceV4) => void;
}) {
  return (
    <div className="formal-medical-insurance-dialog" role="dialog" aria-label="医疗保险购买">
      <div className="formal-medical-insurance-card">
        <header>
          <strong>医疗保险</strong>
          <span>第一场战斗前可购买一次，降低之后胜利结算时的救助费用。</span>
        </header>
        <div className="formal-medical-insurance-options">
          {offer.tiers.map(tier => {
            const affordable = money >= tier.cost;
            const reviveText = tier.reviveCostPerPokemon <= 0 ? "救助免费" : `救助 ${tier.reviveCostPerPokemon} 金币/只`;
            const discountText = tier.recoveryShopPriceMultiplier < 1
              ? `恢复药 ${Math.round(tier.recoveryShopPriceMultiplier * 10)}折`
              : "无商店折扣";
            return (
              <button
                key={tier.tier}
                type="button"
                disabled={busy || !affordable}
                onClick={() => onChoose(tier.tier)}
              >
                <strong>{tier.cost} 金币</strong>
                <span>{reviveText}</span>
                <small>{discountText}</small>
              </button>
            );
          })}
        </div>
        {error ? <p className="formal-medical-insurance-error">{error}</p> : null}
        <footer>
          <button type="button" disabled={busy} onClick={() => onChoose("decline")}>暂不购买</button>
        </footer>
      </div>
    </div>
  );
}
