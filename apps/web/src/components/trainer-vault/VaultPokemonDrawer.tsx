import {useEffect, useMemo, useState} from "react";
import type {ChangeBattleV2Api, PlayerPokemonHonorBadgeViewV4, PlayerPokemonRecordV4, PlayerVaultPokemonDetailViewV4} from "@changebattle-v2/api";
import {GameDrawer} from "../shared/GameDrawer";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import type {TrainerVaultPokemonDetailTab, VaultPokemonEntry} from "./TrainerVaultModel";
import {VaultPokemonHonorBadges} from "./VaultPokemonHonorBadges";
import "./VaultPokemonDrawer.css";

export function VaultPokemonDrawer({api, entry, saving, useModeActive, onClose, onToggleBattleMarked, onUnequipHeldItem, onReleasePokemon, onSelectHonorBadge}: {
  api: ChangeBattleV2Api;
  entry: VaultPokemonEntry | null;
  saving: boolean;
  useModeActive: boolean;
  onClose: () => void;
  onToggleBattleMarked: (pokemonId: string, marked: boolean) => void;
  onUnequipHeldItem: (pokemonId: string) => void;
  onReleasePokemon: (pokemon: PlayerPokemonRecordV4) => void;
  onSelectHonorBadge: (badge: PlayerPokemonHonorBadgeViewV4) => void;
}) {
  const selectedPokemonId = entry?.pokemon.playerPokemonId || "";
  const [pokemonDetailTab, setPokemonDetailTab] = useState<TrainerVaultPokemonDetailTab>("overview");
  const pokemonView = useMemo(() => entry ? api.createPlayerVaultPokemonDetailView(entry.pokemon) : null, [api, entry, selectedPokemonId]);
  const honorBadges = useMemo(() => entry ? api.getPlayerPokemonHonorBadges(entry.pokemon) : [], [api, entry, selectedPokemonId]);
  useEffect(() => {
    setPokemonDetailTab("overview");
  }, [selectedPokemonId]);
  const pokemon = entry?.pokemon;
  return (
    <GameDrawer open={Boolean(entry && pokemonView && pokemon)} placement="left" title="宝可梦详情" width={220} onClose={onClose}>
      {entry && pokemonView && pokemon ? (
        <section className="vault-pokemon-drawer">
          {!useModeActive ? (
            <div className="vault-pokemon-drawer-top-actions" aria-label="宝可梦操作">
              <button type="button" onClick={() => onToggleBattleMarked(pokemon.playerPokemonId, !pokemon.battleMarked)} disabled={saving}>{pokemon.battleMarked ? "取消出战" : "标记出战"}</button>
              {pokemon.heldItemId ? <button type="button" onClick={() => onUnequipHeldItem(pokemon.playerPokemonId)} disabled={saving}>卸下道具</button> : null}
              <button className="danger" type="button" onClick={() => onReleasePokemon(pokemon)} disabled={saving}>放生</button>
            </div>
          ) : null}
          <div className="vault-pokemon-drawer-hero">
            <ImageWithFallback src={pokemonView.spriteUrl} alt={pokemonView.title} fallback={pokemonView.title.slice(0, 1) || "?"} />
            <div>
              <strong>{pokemonView.title}</strong>
              <span>{pokemonView.subtitle}</span>
            </div>
          </div>
          <div className="vault-pokemon-drawer-tabs" role="tablist" aria-label="宝可梦详情分页">
            {POKEMON_DETAIL_TABS.map(detailTab => (
              <button className={pokemonDetailTab === detailTab.id ? "active" : ""} type="button" role="tab" aria-selected={pokemonDetailTab === detailTab.id} onClick={() => setPokemonDetailTab(detailTab.id)} key={detailTab.id}>
                {detailTab.label}
              </button>
            ))}
          </div>
          <PokemonDetailTabPanel view={pokemonView} tab={pokemonDetailTab} honorBadges={honorBadges} onSelectHonorBadge={onSelectHonorBadge} />
        </section>
      ) : null}
    </GameDrawer>
  );
}

const POKEMON_DETAIL_TABS: Array<{id: TrainerVaultPokemonDetailTab; label: string}> = [
  {id: "overview", label: "概览"},
  {id: "stats", label: "数值"},
  {id: "moves", label: "技能"},
  {id: "honors", label: "荣誉"},
];

function PokemonDetailTabPanel({view, tab, honorBadges, onSelectHonorBadge}: {view: PlayerVaultPokemonDetailViewV4; tab: TrainerVaultPokemonDetailTab; honorBadges: ReturnType<ChangeBattleV2Api["getPlayerPokemonHonorBadges"]>; onSelectHonorBadge: (badge: PlayerPokemonHonorBadgeViewV4) => void}) {
  if (tab === "overview") {
    return (
      <div className="vault-pokemon-drawer-tab-panel">
        <dl className="vault-pokemon-drawer-overview">
          {view.overview.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
        </dl>
      </div>
    );
  }
  if (tab === "stats") {
    return (
      <div className="vault-pokemon-drawer-tab-panel">
        <table className="vault-pokemon-drawer-stat-table">
          <thead><tr><th>能力</th><th>实数</th><th>个体</th><th>努力</th></tr></thead>
          <tbody>
            {view.stats.map(row => <tr key={row.id}><td>{row.label}</td><td>{row.actual}</td><td>{row.iv}</td><td>{row.ev}</td></tr>)}
          </tbody>
        </table>
      </div>
    );
  }
  if (tab === "moves") {
    return (
      <div className="vault-pokemon-drawer-tab-panel">
        <div className="vault-pokemon-drawer-move-list">
          {view.moves.length ? view.moves.map(move => (
            <article key={`${move.slot}:${move.id}`}>
              <strong>{move.slot}. {move.name}</strong>
              <span>{move.type} · {move.category} · 威力 {move.power} · PP {move.pp}</span>
            </article>
          )) : <p>暂无技能记录。</p>}
        </div>
      </div>
    );
  }
  if (tab === "honors") {
    return (
      <div className="vault-pokemon-drawer-tab-panel vault-pokemon-drawer-tab-panel-honors">
        <VaultPokemonHonorBadges badges={honorBadges} onSelectBadge={onSelectHonorBadge} />
      </div>
    );
  }
  return null;
}
