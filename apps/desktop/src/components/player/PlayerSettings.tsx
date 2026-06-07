import {useEffect, useState} from "react";
import type {LocalSave, TrainerCatalogState, TrainerNpcView} from "@changebattle/shared";
import {profileFromSelection, trainerImageUrl} from "../../lib/ui";

export function PlayerSettings({title, save, name, setName, catalog, selectedPlayerId, setSelectedPlayerId, selectedAvatarAsset, setSelectedAvatarAsset, onSave, onSaved, onBack, saveLabel}: {title: string; save?: LocalSave | null; name: string; setName?: (value: string) => void; catalog: TrainerCatalogState; selectedPlayerId?: string; setSelectedPlayerId?: (value: string) => void; selectedAvatarAsset?: string; setSelectedAvatarAsset?: (value: string) => void; onSave?: () => void | Promise<void>; onSaved?: (save: LocalSave) => void; onBack: () => void; saveLabel: string}) {
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
      <header className="settings-header">
        <h2>{title}</h2>
        {save ? <span>BP {save.stats.battle_points}　胜率 {winRate}%</span> : <span>选择你的训练师形象</span>}
      </header>
      <section className="player-settings-layout">
        <aside className="player-name-panel">
          <label>昵称<input value={currentName} onChange={event => updateName(event.target.value)} /></label>
          <div className="selected-trainer-preview">
            {player ? <img src={trainerImageUrl(player, "frontGif")} alt={player.name_zh} /> : null}
            <strong>{currentName || "训练师"}</strong>
            <small>{player?.name_zh || "请选择角色"}</small>
          </div>
        </aside>
        <section className="player-picker">
          <h3>玩家角色</h3>
          <div className="player-character-grid">
            {catalog.players.length ? catalog.players.map(entry => {
              const active = entry.id === currentPlayerId;
              return <button className={active ? "selected" : ""} onClick={() => updatePlayer(entry.id)} key={entry.id}><img src={trainerImageUrl(entry, active ? "frontGif" : "front")} alt={entry.name_zh} /><span>{entry.name_zh}</span></button>;
            }) : <p>没有找到玩家角色资源。</p>}
          </div>
        </section>
        <section className="avatar-picker">
          <h3>头像</h3>
          <div className="avatar-grid">
            {catalog.avatars.length ? catalog.avatars.map(entry => {
              const asset = entry.avatar_asset || "";
              return <button className={asset === currentAvatar ? "selected" : ""} onClick={() => updateAvatar(asset)} key={entry.id}><img src={trainerImageUrl(entry, "avatar")} alt={entry.name_zh} /></button>;
            }) : <p>没有找到头像资源。</p>}
          </div>
        </section>
      </section>
      <div className="command-row"><button disabled={!player} onClick={saveSettings}>{saveLabel}</button><button onClick={onBack}>返回</button></div>
    </div>
  );
}
