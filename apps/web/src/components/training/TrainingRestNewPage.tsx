import {useState, type CSSProperties} from "react";
import {motion} from "motion/react";
import type {ChangeBattleV2Api, ShowdownPlayerIdV4, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {TrainingRestNewTeamPanel} from "./TrainingRestNewTeamPanel";
import "./TrainingRestNewPage.css";

export type TrainingRestNewPageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  onRunChange: (run: TrainingRunGameV4) => void;
  onBackToConfig: () => void;
  onStartBattle: () => void;
  onOpenDex: () => void;
  onOpenPokemonDex: (speciesId: string) => void;
};

export function TrainingRestNewPage({api, run, onRunChange, onBackToConfig, onStartBattle, onOpenDex, onOpenPokemonDex}: TrainingRestNewPageProps) {
  const [activeAction, setActiveAction] = useState("我的队伍");
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<PreviewPokemonEntry | null>(null);
  const [message, setMessage] = useState("休整中心已就绪。");
  const preview = buildNextOpponentPreview(run);
  const p1Team = run.players.p1?.localTeam || null;

  async function updateP1Team(localTeam: TrainingPlayerDraftV4["localTeam"]) {
    const p1 = run.players.p1;
    if (!p1) return;
    const nextP1 = {...p1, localTeam};
    const nextPlayers = {...run.players, p1: nextP1};
    const nextScenarioPlayers = run.scenario.players.map(player => player.playerId === "p1" ? nextP1 : player);
    const nextRun = {
      ...run,
      players: nextPlayers,
      scenario: {...run.scenario, players: nextScenarioPlayers},
      updatedAt: new Date().toISOString(),
    };
    onRunChange(nextRun);
    const saved = await api.saveTrainingRun(nextRun);
    onRunChange(saved);
    setMessage("队伍调整已保存。");
  }

  async function saveRunGameSnapshot() {
    const saved = await api.saveTrainingRun({...run, updatedAt: new Date().toISOString()});
    onRunChange(saved);
    setMessage("RunGame 快照已保存。");
  }

  async function unlockPreviewPokemon(target: PreviewPokemonEntry) {
    const nextRun = {
      ...run,
      restPreviewUnlocks: {...(run.restPreviewUnlocks || {}), [target.unlockKey]: true as const},
      updatedAt: new Date().toISOString(),
    };
    onRunChange(nextRun);
    const saved = await api.saveTrainingRun(nextRun);
    onRunChange(saved);
    setUnlockTarget(null);
    setMessage(`${target.pokemon.nameZh || target.pokemon.name} 已解锁。`);
  }

  function selectAction(action: string) {
    setActiveAction(action);
    if (action === "我的队伍") {
      setTeamPanelOpen(true);
      return;
    }
    if (["我的背包", "图鉴", "保存"].includes(action)) {
      setTeamPanelOpen(false);
    }
    if (action === "图鉴") {
      onOpenDex();
      return;
    }
    if (action === "保存") {
      void saveRunGameSnapshot();
      return;
    }
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
        <NextOpponentPreview
          preview={preview}
          run={run}
          onLockedPokemonClick={setUnlockTarget}
          onUnlockedPokemonClick={pokemon => onOpenPokemonDex(pokemon.speciesId)}
        />
      </section>
      <section className="training-rest-new-left-action-panel" aria-label="休整图鉴与功能入口">
        <RestPaperAction label="图鉴" iconSrc="/ui/book.png" active={activeAction === "图鉴"} onClick={() => selectAction("图鉴")} />
        {Array.from({length: 7}, (_, index) => <RestPaperAction label="未开放" iconText="?" disabled key={index} />)}
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
      <div className="training-rest-new-save-message" role="status">{message}</div>
      <TrainingRestNewTeamPanel
        api={api}
        open={teamPanelOpen}
        localTeam={p1Team}
        onClose={() => setTeamPanelOpen(false)}
        onLocalTeamChange={nextTeam => void updateP1Team(nextTeam)}
      />
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
      {unlockTarget ? (
        <div className="training-rest-new-confirm" role="dialog" aria-label="确认解锁预览">
          <div>
            <strong>是否解锁？</strong>
            <span>解锁后会显示这只宝可梦，并可打开图鉴详情。</span>
            <footer>
              <button type="button" onClick={() => setUnlockTarget(null)}>取消</button>
              <button type="button" onClick={() => void unlockPreviewPokemon(unlockTarget)}>解锁</button>
            </footer>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}

function RestPaperAction({
  label,
  iconSrc,
  iconText,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  iconSrc?: string;
  iconText?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={active ? "active" : ""} type="button" onClick={onClick} disabled={disabled}>
      {iconSrc ? <img src={iconSrc} alt="" draggable={false} /> : <span>{iconText || "?"}</span>}
      <strong>{label}</strong>
    </button>
  );
}

type NextOpponentPreviewModel = {
  mode: TrainingRunGameV4["scenario"]["mode"];
  trainer: TrainingPlayerDraftV4 | null;
  allies: TrainingPlayerDraftV4[];
  rank: string;
  nodeId: string;
};

type PreviewPokemonEntry = {
  pokemon: PreviewPokemon;
  playerId: ShowdownPlayerIdV4;
  unlockKey: string;
};

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
