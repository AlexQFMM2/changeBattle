import type {CSSProperties} from "react";
import type {ShowdownPlayerIdV4, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingRestNextPreviewPanel.css";

export type PreviewPokemon = NonNullable<TrainingPlayerDraftV4["localTeam"]["pokemon"][number]>;

export type PreviewPokemonEntry = {
  pokemon: PreviewPokemon;
  playerId: ShowdownPlayerIdV4;
  unlockKey: string;
};

type NextOpponentPreviewModel = {
  mode: TrainingRunGameV4["scenario"]["mode"];
  trainer: TrainingPlayerDraftV4 | null;
  allies: TrainingPlayerDraftV4[];
  rank: string;
  nodeId: string;
};

export function TrainingRestNextPreviewPanel({
  run,
  onLockedPokemonClick,
  onUnlockedPokemonClick,
}: {
  run: TrainingRunGameV4;
  onLockedPokemonClick: (entry: PreviewPokemonEntry) => void;
  onUnlockedPokemonClick: (pokemon: PreviewPokemon) => void;
}) {
  const preview = buildNextOpponentPreview(run);
  return (
    <section className={`training-rest-next-panel mode-${preview.mode}`} aria-label="下一场对手预览">
      <NextOpponentPreview
        preview={preview}
        run={run}
        onLockedPokemonClick={onLockedPokemonClick}
        onUnlockedPokemonClick={onUnlockedPokemonClick}
      />
    </section>
  );
}

function NextOpponentPreview({
  preview,
  run,
  onLockedPokemonClick,
  onUnlockedPokemonClick,
}: {
  preview: NextOpponentPreviewModel;
  run: TrainingRunGameV4;
  onLockedPokemonClick: (entry: PreviewPokemonEntry) => void;
  onUnlockedPokemonClick: (pokemon: PreviewPokemon) => void;
}) {
  const trainer = preview.trainer;
  const trainers = preview.allies.length ? preview.allies.slice(0, 2) : trainer ? [trainer] : [];
  const pokemon = trainers.flatMap(entry => previewEntriesForPlayer(preview.nodeId, entry)).slice(0, 4);
  const coopTeams = trainers.slice(0, 2).map(entry => previewEntriesForPlayer(preview.nodeId, entry).slice(0, 2));
  return (
    <div className="training-rest-next-preview">
      <div className={`training-rest-next-npc-grid count-${Math.max(1, trainers.length)}`}>
        {trainers.length ? trainers.map(entry => (
          <div className="training-rest-next-npc-card" key={entry.playerId}>
            <ImageWithFallback src={fullBodyTrainerImage(entry)} alt="" fallback="?" />
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
                  unlocked={Boolean(run.restPreviewUnlocks?.[entry.unlockKey])}
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
              unlocked={Boolean(run.restPreviewUnlocks?.[entry.unlockKey])}
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

function buildNextOpponentPreview(run: TrainingRunGameV4): NextOpponentPreviewModel {
  const current = run.gameMap.find(node => node.id === run.currentNodeId) || run.gameMap.find(node => node.state === "ready") || run.gameMap[0] || null;
  const mode = current?.mode || run.scenario.mode;
  const farIds = [current?.p2, current?.p4].filter(Boolean) as ShowdownPlayerIdV4[];
  const allies = farIds.map(playerId => current?.participants[playerId] || run.players[playerId]).filter(isPlayerDraft);
  return {mode, trainer: allies[0] || null, allies, rank: aiRankLabel(current?.index || 0), nodeId: current?.id || run.currentNodeId || "preview"};
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

function aiRankLabel(index: number): string {
  if (index >= 5) return "冠军";
  if (index >= 4) return "四天王";
  if (index >= 3) return "馆主";
  if (index >= 2) return "精英";
  return "菜鸟";
}

function fullBodyTrainerImage(trainer: TrainingPlayerDraftV4): string {
  if (trainer.name === "赤红") return "/npc/boss/red-red-c813612f.gif";
  if (trainer.name === "小茂") return "/npc/boss/blue-bluehgss-43e96b09.gif";
  if (trainer.name === "竹兰") return "/npc/avatars/cynthia-vscynthia-7b500adf.png";
  if (trainer.name === "共平") return "/npc/avatars/11-asset-fdb7e61e.webp";
  if (trainer.name === "鸣依") return "/npc/avatars/6-asset-a73f3e71.webp";
  return trainer.avatar;
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
    backgroundImage: `url(${match[1]})`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}
