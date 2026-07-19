import type {CSSProperties} from "react";
import type {ShowdownPlayerIdV4, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import type {TrainingRestNextPreviewModel} from "./TrainingRestLegacyDisplayModel";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {styleUrlAssetPath} from "../../lib/assetUrl";
import "./TrainingRestNextPreviewPanel.css";

export type PreviewPokemon = NonNullable<TrainingPlayerDraftV4["localTeam"]["pokemon"][number]>;

export type PreviewPokemonEntry = {
  pokemon: PreviewPokemon;
  playerId: ShowdownPlayerIdV4;
  unlockKey: string;
};

export function TrainingRestNextPreviewPanel({
  run,
  preview,
  onLockedPokemonClick,
  onUnlockedPokemonClick,
}: {
  run?: TrainingRunGameV4 | null;
  preview?: TrainingRestNextPreviewModel | null;
  onLockedPokemonClick: (entry: PreviewPokemonEntry) => void;
  onUnlockedPokemonClick: (pokemon: PreviewPokemon) => void;
}) {
  const nextPreview = preview || (run ? buildNextOpponentPreview(run) : null);
  return (
    <section className={`training-rest-next-panel mode-${nextPreview?.mode || "singles"}`} aria-label="下一场对手预览">
      {nextPreview ? (
        <NextOpponentPreview
          preview={nextPreview}
          onLockedPokemonClick={onLockedPokemonClick}
          onUnlockedPokemonClick={onUnlockedPokemonClick}
        />
      ) : null}
    </section>
  );
}

function NextOpponentPreview({
  preview,
  onLockedPokemonClick,
  onUnlockedPokemonClick,
}: {
  preview: TrainingRestNextPreviewModel;
  onLockedPokemonClick: (entry: PreviewPokemonEntry) => void;
  onUnlockedPokemonClick: (pokemon: PreviewPokemon) => void;
}) {
  const trainers = preview.trainers.length ? preview.trainers.slice(0, 2) : [];
  const pokemon = trainers.flatMap(entry => previewEntriesForPlayer(preview.nodeId, entry)).slice(0, 4);
  const coopTeams = trainers.slice(0, 2).map(entry => previewEntriesForPlayer(preview.nodeId, entry).slice(0, 2));
  return (
    <div className="training-rest-next-preview">
      <div className={`training-rest-next-npc-grid count-${Math.max(1, trainers.length)}`}>
        {trainers.length ? trainers.map(entry => (
          <div className="training-rest-next-npc-card" key={entry.playerId}>
            <ImageWithFallback src={entry.avatar} alt="" fallback="?" />
            <strong>{entry.name || "未知对手"}</strong>
            <small>{preview.rank}</small>
          </div>
        )) : (
          <div className="training-rest-next-npc-card">
            <span>?</span>
            <strong>未知对手</strong>
            <small>{preview.rank}</small>
          </div>
        )}
      </div>
      {preview.mode === "coop" ? (
        <div className="training-rest-next-coop-teams">
          {coopTeams.map((team, index) => (
            <div className="training-rest-next-coop-column" key={`${trainers[index]?.playerId || "team"}-${index}`}>
              {team.map(entry => (
                <PreviewPokemonCard
                  entry={entry}
                  unlocked={Boolean(preview.unlocks?.[entry.unlockKey])}
                  onLockedClick={onLockedPokemonClick}
                  onUnlockedClick={onUnlockedPokemonClick}
                  key={entry.unlockKey}
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="training-rest-next-pokemon-grid">
          {pokemon.map(entry => (
            <PreviewPokemonCard
              entry={entry}
              unlocked={Boolean(preview.unlocks?.[entry.unlockKey])}
              onLockedClick={onLockedPokemonClick}
              onUnlockedClick={onUnlockedPokemonClick}
              key={entry.unlockKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewPokemonCard({
  entry,
  unlocked,
  onLockedClick,
  onUnlockedClick,
}: {
  entry: PreviewPokemonEntry;
  unlocked: boolean;
  onLockedClick: (entry: PreviewPokemonEntry) => void;
  onUnlockedClick: (pokemon: PreviewPokemon) => void;
}) {
  return (
    <button
      className={`training-rest-next-pokemon-card ${unlocked ? "unlocked" : "locked"}`}
      type="button"
      onClick={() => unlocked ? onUnlockedClick(entry.pokemon) : onLockedClick(entry)}
      aria-label={unlocked ? `查看${entry.pokemon.nameZh || entry.pokemon.name}图鉴` : "解锁未知宝可梦预览"}
    >
      {unlocked ? <TrainingRestNewPokemonIcon pokemon={entry.pokemon} /> : <span className="training-rest-next-unknown">未知</span>}
    </button>
  );
}

function buildNextOpponentPreview(run: TrainingRunGameV4): TrainingRestNextPreviewModel {
  const current = run.gameMap.find(node => node.id === run.currentNodeId) || run.gameMap.find(node => node.state === "ready") || run.gameMap[0] || null;
  const mode = current?.mode || run.scenario.mode;
  const farIds = [current?.p2, current?.p4].filter(Boolean) as ShowdownPlayerIdV4[];
  const trainers = farIds.map(playerId => current?.participants[playerId] || run.players[playerId]).filter(isPlayerDraft);
  return {
    mode,
    trainers,
    rank: formalRoundStageLabel(current?.index || 0),
    nodeId: current?.id || run.currentNodeId || "preview",
    unlocks: run.restPreviewUnlocks,
  };
}

function previewEntriesForPlayer(nodeId: string, player: TrainingPlayerDraftV4): PreviewPokemonEntry[] {
  return player.localTeam.pokemon.map(pokemon => ({
    pokemon,
    playerId: player.playerId,
    unlockKey: `${nodeId}:${player.playerId}:${pokemon.localPokemonId}`,
  }));
}

function isPlayerDraft(player: TrainingPlayerDraftV4 | undefined): player is TrainingPlayerDraftV4 {
  return Boolean(player);
}

function formalRoundStageLabel(index: number): string {
  return [
    "小组赛揭幕战",
    "小组赛出线战",
    "十六强赛",
    "八强赛",
    "四强争夺战",
    "半决赛",
    "决赛",
  ][Math.max(0, Math.min(6, index))] || `第 ${index + 1} 场`;
}

function TrainingRestNewPokemonIcon({pokemon}: {pokemon: PreviewPokemon}) {
  if (pokemon.iconStyle) {
    return <span className="training-rest-next-picon picon" aria-hidden="true" style={styleFromCss(pokemon.iconStyle)} />;
  }
  return <ImageWithFallback src={pokemon.iconUrl || pokemon.spriteUrl || ""} alt="" fallback={pokemon.nameZh.slice(0, 1) || "?"} />;
}

function styleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url("${styleUrlAssetPath(match[1])}")`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}
