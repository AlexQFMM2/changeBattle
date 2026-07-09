import {useMemo, useState} from "react";
import type {ChangeBattleV2Api, LocalPokemonV4, TrainingPlayerDraftV4} from "@changebattle-v2/api";
import {TrainingRestNewTeamPanel} from "./TrainingRestNewTeamPanel";
import "./TrainingRestNewTeamPanel.preview.css";

export function TrainingRestNewTeamPanelPreview({api}: {api: ChangeBattleV2Api}) {
  const initialTeam = useMemo(() => createPreviewTeam(api), [api]);
  const [team, setTeam] = useState(initialTeam);
  return (
    <section className="training-rest-new-team-preview-canvas" aria-label="我的队伍组件预览">
      <div className="training-rest-new-team-preview-bg" aria-hidden="true" />
      <TrainingRestNewTeamPanel
        api={api}
        open
        localTeam={team}
        onClose={() => undefined}
        onLocalTeamChange={setTeam}
      />
    </section>
  );
}

function createPreviewTeam(api: ChangeBattleV2Api): TrainingPlayerDraftV4["localTeam"] {
  const run = api.createTrainingRunFromScenario(api.createTrainingRunGame({
    id: "team-preview-profile",
    name: "预览训练师",
    avatarAsset: "npc/avatars/6-asset-a73f3e71.webp",
  }));
  const team = run.players.p1?.localTeam;
  const pokemon = (team?.pokemon || []).map((entry, index) => patchPreviewPokemon(entry, index));
  return {
    id: team?.id || "team-preview",
    name: team?.name || "预览队伍",
    pokemon,
  };
}

function patchPreviewPokemon(pokemon: LocalPokemonV4, index: number): LocalPokemonV4 {
  const lowHp = index === 1;
  const longName = index === 2;
  return {
    ...pokemon,
    nickname: index === 0 ? "小海星" : pokemon.nickname,
    formalSourceKind: index === 0 ? "soulmate-vault" : pokemon.formalSourceKind,
    sourcePlayerPokemonId: index === 0 ? "preview-vault-starmie" : pokemon.sourcePlayerPokemonId,
    nameZh: longName ? "很长很长的宝可梦名字" : pokemon.nameZh,
    entryHp: lowHp ? Math.max(1, Math.floor(pokemon.maxHp * 0.28)) : pokemon.entryHp,
    entryStatus: index === 1 ? "brn" : pokemon.entryStatus,
    locks: {moves: {0: index === 0, 2: index === 0}},
  };
}
