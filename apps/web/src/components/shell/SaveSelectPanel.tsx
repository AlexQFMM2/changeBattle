import type {TrainerCatalogEntryV2, UserProfileV2} from "@changebattle-v2/api";
import {TrainerAvatar} from "./TrainerAvatar";
import "./SaveSelectPanel.css";

export function SaveSelectPanel({active, profile, catalog, loading, message, onBack, onLoad, onCreate, onDelete}: {
  active: boolean;
  profile: UserProfileV2 | null;
  catalog: TrainerCatalogEntryV2[];
  loading: boolean;
  message: string;
  onBack: () => void;
  onLoad: () => void;
  onCreate: () => void;
  onDelete: () => void | Promise<void>;
}) {
  const trainer = catalog.find(item => item.id === profile?.trainerId);
  const slots = [0, 1, 2];

  return (
    <section className={`save-select-page ${active ? "active" : ""}`} aria-labelledby="save-select-title">
      <header className="save-select-page-header">
        <button className="save-back-button" type="button" onClick={onBack}>返回</button>
        <div>
          <span>Save Data</span>
          <h2 id="save-select-title">选择资料</h2>
        </div>
      </header>
      <div className="save-card-grid">
        {slots.map(slot => {
          const filled = slot === 0 && profile;
          return (
            <article className={`save-card ${filled ? "filled" : "empty"}`} key={slot}>
              <button className="save-card-main" type="button" disabled={!filled && slot !== 0} onClick={filled ? onLoad : onCreate}>
                <span className="save-card-index">{String(slot + 1).padStart(2, "0")}</span>
                {filled ? (
                  <>
                    <span className="save-card-avatar">
                      <TrainerAvatar profile={profile} />
                    </span>
                    <span className="save-card-info">
                      <strong>{profile.name}</strong>
                      <small>{trainer?.name || "训练师"} / 本地资料</small>
                    </span>
                  </>
                ) : slot === 0 ? (
                  <>
                    <span className="save-card-plus">+</span>
                    <span className="save-card-empty-copy">
                      <strong>空资料位</strong>
                      <small>新建训练师</small>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="save-card-plus muted">-</span>
                    <span className="save-card-empty-copy">
                      <strong>暂未开放</strong>
                      <small>第一阶段只启用一个资料位</small>
                    </span>
                  </>
                )}
              </button>
              {filled ? <button className="save-card-delete" type="button" onClick={() => void onDelete()} aria-label={`删除 ${profile.name} 的资料`}>×</button> : null}
            </article>
          );
        })}
      </div>
      <p className="save-select-message">{loading ? "正在读取本地资料..." : message}</p>
    </section>
  );
}
