import {useEffect, useRef} from "react";
import type {ChangeBattleV2Api, TrainingRunGameV4} from "@changebattle-v2/api";
import {createBattleGameFromTrainingNode} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";

export type TrainingBattleTransitionPageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  onRunChange: (run: TrainingRunGameV4) => void;
  onReady: (sessionId: string) => void;
  onBackToRest: () => void;
};

export function TrainingBattleTransitionPage({api, run, onRunChange, onReady, onBackToRest}: TrainingBattleTransitionPageProps) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const node = api.getCurrentTrainingNode(run);
      if (!node) {
        onBackToRest();
        return;
      }
      const {battleGame, sessionInput} = createBattleGameFromTrainingNode(run, node);
      console.info("[battle-v4-transition] create session", {
        scenarioMode: run.scenario.mode,
        nodeMode: node.mode,
        sessionMode: sessionInput.mode,
        ruleSet: sessionInput.ruleSet,
        expectedFormatId: expectedBattleFormatId(sessionInput.ruleSet, sessionInput.mode),
        nodeId: node.id,
        playerIds: sessionInput.players.map(player => player.playerId),
        teamSizes: Object.fromEntries(sessionInput.players.map(player => [player.playerId, player.team.length])),
      });
      const preparing = {
        ...run,
        status: "battlePreparing" as const,
        gameMap: run.gameMap.map(entry => entry.id === node.id ? {...entry, state: "preparing" as const, battleGame: {id: battleGame.id, status: "creating" as const}} : entry),
        updatedAt: new Date().toISOString(),
      };
      await api.saveTrainingRun(preparing);
      onRunChange(preparing);
      const snapshot = await api.battleService.createBattleSession(sessionInput);
      const battling = {
        ...preparing,
        status: "battling" as const,
        gameMap: preparing.gameMap.map(entry => entry.id === node.id ? {...entry, state: "running" as const, startedAt: new Date().toISOString(), battleGame: {id: battleGame.id, status: "running" as const}} : entry),
        updatedAt: new Date().toISOString(),
      };
      await api.saveTrainingRun(battling);
      onRunChange(battling);
      onReady(snapshot.id);
    })().catch(async error => {
      const node = api.getCurrentTrainingNode(run);
      const blocked = {
        ...run,
        status: "blocked" as const,
        gameMap: run.gameMap.map(entry => entry.id === node?.id ? {...entry, state: "blocked" as const, battleGame: {id: entry.battleGame?.id || "battle-game-blocked", status: "blocked" as const}} : entry),
        updatedAt: new Date().toISOString(),
      };
      await api.saveTrainingRun(blocked).catch(() => undefined);
      onRunChange(blocked);
      console.error(error);
      onBackToRest();
    });
  }, [api, onBackToRest, onReady, onRunChange, run]);

  return (
    <TrainingRunTransitionPage
      title="准备战斗"
      detail="正在创建 BattleGame V4"
      tip="BattleStream 在本地 Node 服务中运行；页面只接收协议快照和提交指令。"
      onReady={() => undefined}
    />
  );
}

function expectedBattleFormatId(ruleSet: string, mode: string): string {
  const suffix = mode === "doubles" ? "doublescustomgame" : "customgame";
  if (ruleSet === "gen7") return `gen7${suffix}`;
  if (ruleSet === "gen8") return `gen8${suffix}`;
  if (mode === "coop") return "gen9multirandombattle";
  if (ruleSet === "gen9" || ruleSet === "standard") return `gen9${suffix}`;
  return "gen9customgame";
}
