import {useState, type CSSProperties} from "react";
import {motion} from "motion/react";
import type {ShowdownPlayerIdV4, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingRestNewPage.css";

export type TrainingRestNewPageProps = {
  run: TrainingRunGameV4;
  onBackToConfig: () => void;
  onStartBattle: () => void;
};

export function TrainingRestNewPage({run, onBackToConfig, onStartBattle}: TrainingRestNewPageProps) {
  const [activeAction, setActiveAction] = useState("我的队伍");
  const [abandonOpen, setAbandonOpen] = useState(false);
  const preview = buildNextOpponentPreview(run);

  function selectAction(action: string) {
    setActiveAction(action);
    if (action === "结束休整") {
      onStartBattle();
      return;
    }
    if (action === "放弃比赛") setAbandonOpen(true);
  }

  return (
    <motion.section
      className="training-rest-new-page"
      initial={{opacity: 0, scale: 0.985}}
      animate={{opacity: 1, scale: 1}}
      transition={{duration: 0.18}}
      aria-label="新休整页预览"
    >
      <img className="training-rest-new-bg" src="/training/rest-center-bg.png" alt="休整中心背景预览" />
      <section className="training-rest-new-notice-region left" aria-label="休整菜单区域" />
      <section className={`training-rest-new-notice-region right mode-${preview.mode}`} aria-label="下一场对手预览">
        <NextOpponentPreview preview={preview} />
      </section>
      <span className="training-rest-new-region training-rest-new-board-title left">休整菜单</span>
      <span className="training-rest-new-region training-rest-new-board-title right">下一场预览</span>
      <nav className="training-rest-new-region training-rest-new-side-board left" aria-label="左侧休整操作">
        <div>
          {["我的队伍", "我的背包", "保存"].map(action => (
            <button className={activeAction === action ? "active" : ""} type="button" onClick={() => selectAction(action)} key={action}>{action}</button>
          ))}
        </div>
      </nav>
      <nav className="training-rest-new-region training-rest-new-side-board right" aria-label="右侧休整操作">
        <div>
          {["结束休整", "放弃比赛"].map(action => (
            <button className={`${activeAction === action ? "active" : ""} ${action === "放弃比赛" ? "danger" : ""}`} type="button" onClick={() => selectAction(action)} key={action}>{action}</button>
          ))}
        </div>
      </nav>
      {abandonOpen ? (
        <div className="training-rest-new-confirm" role="dialog" aria-label="确认放弃比赛">
          <div>
            <strong>是否放弃？</strong>
            <span>当前只是确认弹窗预览，暂不执行实际效果。</span>
            <footer>
              <button type="button" onClick={() => setAbandonOpen(false)}>取消</button>
              <button type="button" className="danger" onClick={onBackToConfig}>放弃</button>
            </footer>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}

type NextOpponentPreviewModel = {
  mode: TrainingRunGameV4["scenario"]["mode"];
  trainer: TrainingPlayerDraftV4 | null;
  allies: TrainingPlayerDraftV4[];
  rank: string;
};

function NextOpponentPreview({preview}: {preview: NextOpponentPreviewModel}) {
  const trainer = preview.trainer;
  const trainers = preview.allies.length ? preview.allies.slice(0, 2) : trainer ? [trainer] : [];
  const pokemon = trainers.flatMap(entry => entry.localTeam.pokemon).slice(0, 4);
  const coopTeams = trainers.slice(0, 2).map(entry => entry.localTeam.pokemon.slice(0, 2));
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
                <div className="training-rest-next-pokemon-card" key={entry.localPokemonId}>
                  <TrainingRestNewPokemonIcon pokemon={entry} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="training-rest-next-pokemon-grid">
          {pokemon.map(entry => (
            <div className="training-rest-next-pokemon-card" key={entry.localPokemonId}>
              <TrainingRestNewPokemonIcon pokemon={entry} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildNextOpponentPreview(run: TrainingRunGameV4): NextOpponentPreviewModel {
  const current = run.gameMap.find(node => node.id === run.currentNodeId) || run.gameMap.find(node => node.state === "ready") || run.gameMap[0] || null;
  const mode = current?.mode || run.scenario.mode;
  const farIds = [current?.p2, current?.p4].filter(Boolean) as ShowdownPlayerIdV4[];
  const allies = farIds.map(playerId => current?.participants[playerId] || run.players[playerId]).filter(isPlayerDraft);
  return {mode, trainer: allies[0] || null, allies, rank: aiRankLabel(current?.index || 0)};
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

type PreviewPokemon = NonNullable<TrainingPlayerDraftV4["localTeam"]["pokemon"][number]>;

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
