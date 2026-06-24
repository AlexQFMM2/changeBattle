import {useState} from "react";
import type {TrainerCatalogEntryV2, UserProfileDraftV2, UserProfileV2} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";

export function PlayerSettingsPage({title, profile, catalog, onSave, onBack, saveLabel}: {
  title: string;
  profile: UserProfileV2 | null;
  catalog: TrainerCatalogEntryV2[];
  onSave: (draft: UserProfileDraftV2) => void | Promise<void>;
  onBack: () => void;
  saveLabel: string;
}) {
  const initialTrainer = catalog.find(entry => entry.id === profile?.trainerId) || catalog[0]!;
  const [name, setName] = useState(profile?.name || "训练师");
  const [trainerId, setTrainerId] = useState(initialTrainer.id);
  const [avatarAsset, setAvatarAsset] = useState(profile?.avatarAsset || initialTrainer.avatarAsset);
  const [saving, setSaving] = useState(false);
  const trainer = catalog.find(entry => entry.id === trainerId) || initialTrainer;

  function chooseTrainer(next: TrainerCatalogEntryV2) {
    setTrainerId(next.id);
    setAvatarAsset(next.avatarAsset);
  }

  async function save() {
    setSaving(true);
    try {
      await onSave({name, trainerId, avatarAsset});
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="player-settings-page">
      <header className="player-settings-page-header">
        <h2>{title}</h2>
        <span>{profile ? "编辑本地用户资料" : "选择你的训练师形象"}</span>
      </header>
      <section className="player-settings-page-layout">
        <aside className="player-settings-page-form">
          <label className="player-name-editor">
            <span>训练师名字</span>
            <input maxLength={16} value={name} onChange={event => setName(event.target.value)} />
          </label>
          <div className="trainer-preview-panel">
            <ImageWithFallback src={trainer.frontAsset} alt={trainer.name} />
            <strong>{name.trim() || "训练师"}</strong>
            <small>{trainer.title}</small>
          </div>
        </aside>
        <TrainerPicker title="玩家角色" items={catalog} selectedId={trainerId} onSelect={chooseTrainer} />
        <AvatarPicker title="头像" items={catalog} selectedAsset={avatarAsset} onSelect={setAvatarAsset} />
      </section>
      <footer className="page-action-bar">
        <button type="button" onClick={onBack}>返回</button>
        <button type="button" disabled={saving || !name.trim()} onClick={() => void save()}>{saving ? "保存中..." : saveLabel}</button>
      </footer>
    </main>
  );
}

function TrainerPicker({title, items, selectedId, onSelect}: {
  title: string;
  items: TrainerCatalogEntryV2[];
  selectedId: string;
  onSelect: (item: TrainerCatalogEntryV2) => void;
}) {
  return (
    <section className="trainer-avatar-picker">
      <h3>{title}</h3>
      <div className="trainer-avatar-picker-grid players">
        {items.map(item => (
          <button className={item.id === selectedId ? "selected" : ""} type="button" key={item.id} onClick={() => onSelect(item)}>
            <ImageWithFallback src={item.frontAsset} alt={item.name} />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function AvatarPicker({title, items, selectedAsset, onSelect}: {
  title: string;
  items: TrainerCatalogEntryV2[];
  selectedAsset: string;
  onSelect: (asset: string) => void;
}) {
  return (
    <section className="trainer-avatar-picker">
      <h3>{title}</h3>
      <div className="trainer-avatar-picker-grid avatars">
        {items.map(item => (
          <button className={item.avatarAsset === selectedAsset ? "selected" : ""} type="button" key={item.avatarAsset} onClick={() => onSelect(item.avatarAsset)}>
            <ImageWithFallback src={item.avatarAsset} alt={`${item.name}头像`} />
          </button>
        ))}
      </div>
    </section>
  );
}
