import type {CSSProperties} from "react";
import type {PlayerPokemonHonorBadgeViewV4} from "@changebattle-v2/api";
import {assetUrl} from "../../lib/assetUrl";
import {AppModal} from "../shared/AppModal";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./VaultPokemonHonorBadges.css";

export function VaultPokemonHonorBadges({badges, onSelectBadge}: {badges: PlayerPokemonHonorBadgeViewV4[]; onSelectBadge: (badge: PlayerPokemonHonorBadgeViewV4) => void}) {
  return (
    <section className="vault-pokemon-honor-badges" aria-label="荣誉奖章">
      <header>
        <strong>荣誉奖章</strong>
        <span>{badges.filter(badge => badge.earned).length}/{badges.length}</span>
      </header>
      <div className="vault-pokemon-honor-badges-grid">
        {badges.map(badge => {
          const progress = badge.earned ? 1 : Math.max(0, Math.min(1, badge.targetCount > 0 ? badge.completedTargetCount / badge.targetCount : 0));
          const style = {"--vault-pokemon-honor-progress": `${Math.round(progress * 100)}%`} as CSSProperties;
          return (
            <button
              className={progress >= 1 ? "earned" : "locked"}
              type="button"
              title={`${badge.name} · ${badge.statusLabel}`}
              aria-label={`${badge.name}，${badge.statusLabel}`}
              onClick={() => onSelectBadge(badge)}
              style={style}
              key={badge.id}
            >
              <span className="vault-pokemon-honor-badge-visual" aria-hidden="true">
                <img className="vault-pokemon-honor-badge-gray" src={assetUrl(badge.iconPath)} alt="" draggable={false} />
                <img className="vault-pokemon-honor-badge-color" src={assetUrl(badge.iconPath)} alt="" draggable={false} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function VaultPokemonHonorBadgeModal({badge, onClose}: {badge: PlayerPokemonHonorBadgeViewV4; onClose: () => void}) {
  const visibleTargets = badge.earned ? badge.targets : badge.missingTargets;
  return (
    <AppModal className="vault-pokemon-honor-modal" labelledBy="vault-pokemon-honor-modal-title" onClose={onClose}>
      {requestClose => (
        <section className="vault-pokemon-honor-modal-content">
          <div className="vault-pokemon-honor-modal-card">
            <ImageWithFallback src={badge.iconPath} alt={badge.name} fallback={badge.shortName.slice(0, 1)} />
            <small>{badge.earned ? "已点亮" : "未点亮"}</small>
            <h2 id="vault-pokemon-honor-modal-title">{badge.name}</h2>
            <p>{badge.description}</p>
            <b>{badge.completedTargetCount}/{badge.targetCount}</b>
          </div>
          <div className="vault-pokemon-honor-modal-targets">
            <header>
              <strong>{badge.earned ? "已攻克目标" : "待攻克目标"}</strong>
              <span>{visibleTargets.length} 项</span>
            </header>
            <div className="vault-pokemon-honor-modal-target-list">
              {visibleTargets.length ? visibleTargets.map(target => (
                <article className={target.completed ? "completed" : ""} key={target.trainerId}>
                  <strong>{target.name}</strong>
                  <span>{target.region || "特殊目标"} · {trainerTypeLabel(target.trainerType)}</span>
                </article>
              )) : (
                <p>所有目标都已经被这只宝可梦攻克。</p>
              )}
            </div>
            <button type="button" onClick={() => requestClose(true)}>确认</button>
          </div>
        </section>
      )}
    </AppModal>
  );
}

function trainerTypeLabel(type: string): string {
  if (type === "gym") return "馆主";
  if (type === "elite4") return "四天王";
  if (type === "champion") return "冠军";
  if (type === "villain") return "反派头目";
  return type;
}
