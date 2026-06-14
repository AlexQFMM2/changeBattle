import {useEffect, useState} from "react";
import type {LocalSave, TrainerCatalogState} from "@changebattle/shared";
import {profileFromSelection} from "../../lib/ui";
import {PageActionBar} from "./PageActionBar";
import {PlayerNameEditor} from "./PlayerNameEditor";
import {TrainerAvatarPicker} from "./TrainerAvatarPicker";
import {TrainerPreviewPanel} from "./TrainerPreviewPanel";
import "./PlayerSettingsPage.css";

export type PlayerSettingsPageProps = {
  title: string;
  save?: LocalSave | null;
  name: string;
  setName?: (value: string) => void;
  catalog: TrainerCatalogState;
  selectedPlayerId?: string;
  setSelectedPlayerId?: (value: string) => void;
  selectedAvatarAsset?: string;
  setSelectedAvatarAsset?: (value: string) => void;
  onSave?: () => void | Promise<void>;
  onSaved?: (save: LocalSave) => void;
  onBack: () => void;
  saveLabel: string;
};

export function PlayerSettingsPage({title, save, name, setName, catalog, selectedPlayerId, setSelectedPlayerId, selectedAvatarAsset, setSelectedAvatarAsset, onSave, onSaved, onBack, saveLabel}: PlayerSettingsPageProps) {
  const [localName, setLocalName] = useState(name || "训练师");
  const [localPlayerId, setLocalPlayerId] = useState(selectedPlayerId || save?.trainer.player_npc_id || catalog.players[0]?.id || "");
  const [localAvatar, setLocalAvatar] = useState(selectedAvatarAsset || save?.trainer.avatar_asset || catalog.players[0]?.avatar_asset || catalog.avatars[0]?.avatar_asset || "");
  const currentName = setName ? name : localName;
  const currentPlayerId = setSelectedPlayerId ? selectedPlayerId || localPlayerId : localPlayerId;
  const currentAvatar = setSelectedAvatarAsset ? selectedAvatarAsset || localAvatar : localAvatar;
  const player = catalog.players.find(entry => entry.id === currentPlayerId) || catalog.players[0];
  const stats = save?.stats;
  const winRate = stats?.battles ? Math.round((stats.wins / stats.battles) * 1000) / 10 : 0;

  useEffect(() => {
    setLocalName(name || "训练师");
    setLocalPlayerId(selectedPlayerId || save?.trainer.player_npc_id || catalog.players[0]?.id || "");
    setLocalAvatar(selectedAvatarAsset || save?.trainer.avatar_asset || catalog.players[0]?.avatar_asset || catalog.avatars[0]?.avatar_asset || "");
  }, [name, selectedPlayerId, selectedAvatarAsset, save?.trainer.player_npc_id, save?.trainer.avatar_asset, catalog.players, catalog.avatars]);

  function updateName(value: string) {
    setLocalName(value);
    setName?.(value);
  }

  function updatePlayer(id: string) {
    const next = catalog.players.find(entry => entry.id === id);
    setLocalPlayerId(id);
    setSelectedPlayerId?.(id);
    const nextAvatar = currentAvatar || next?.avatar_asset || catalog.avatars[0]?.avatar_asset || "";
    setLocalAvatar(nextAvatar);
    setSelectedAvatarAsset?.(nextAvatar);
  }

  function updateAvatar(asset: string) {
    setLocalAvatar(asset);
    setSelectedAvatarAsset?.(asset);
  }

  async function saveSettings() {
    if (onSave) {
      await onSave();
      return;
    }
    const next = await window.changeBattle!.updateTrainer(profileFromSelection(currentName, player, currentAvatar));
    onSaved?.(next);
    onBack();
  }

  return (
    <div className="player-settings-page">
      <header className="player-settings-page-header">
        <h2>{title}</h2>
        {save ? <span>BP {save.stats.battle_points} / 胜率 {winRate}%</span> : <span>选择你的训练师形象</span>}
      </header>
      <section className="player-settings-page-layout">
        <aside className="player-settings-page-form">
          <PlayerNameEditor value={currentName} onChange={updateName} />
          <TrainerPreviewPanel name={currentName} player={player} />
        </aside>
        <TrainerAvatarPicker title="玩家角色" mode="players" items={catalog.players} selectedId={currentPlayerId} onSelect={entry => updatePlayer(entry.id)} />
        <TrainerAvatarPicker title="头像" mode="avatars" items={catalog.avatars} selectedId={currentAvatar} onSelect={entry => updateAvatar(entry.avatar_asset || "")} />
      </section>
      <PageActionBar saveLabel={saveLabel} saveDisabled={!player} onSave={saveSettings} onBack={onBack} />
    </div>
  );
}
