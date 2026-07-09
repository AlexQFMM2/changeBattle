import {useState} from "react";
import type {ChangeBattleV2Api, PlayerVaultV4} from "@changebattle-v2/api";
import {TrainerVaultPage} from "./TrainerVaultPage";
import "./TrainerVaultPage.preview.css";

const PREVIEW_BAG_ITEM_IDS = [
  "potion",
  "superpotion",
  "ether",
  "revive",
  "rarecandy",
  "soothebell",
  "leftovers",
  "lifeorb",
  "sitrusberry",
  "lumberry",
  "tm:earthquake",
  "tm:protect",
  "tm:thunderbolt",
  "system-mega-stone",
  "system-z-crystal",
  "system-tera-orb",
];

export function TrainerVaultPagePreview({api}: {api: ChangeBattleV2Api}) {
  const [playerVaultDirty, setPlayerVaultDirty] = useState(false);
  const [playerVault, setPlayerVault] = useState<PlayerVaultV4>(() => {
    const trainingRun = api.createTrainingRunFromScenario(api.createTrainingRunGame({
      id: "trainer-vault-preview-profile",
      name: "预览训练师",
      avatarAsset: "npc/avatars/6-asset-a73f3e71.webp",
    }));
    const p1 = trainingRun.players.p1;
    return api.normalizePlayerVault({
      version: 1,
      items: PREVIEW_BAG_ITEM_IDS.map((itemId, index) => ({
        itemId,
        quantity: index % 3 === 0 ? 2 + index : 1,
        sourceKind: index === 1 ? "debug" : undefined,
      })),
      pokemon: (p1?.localTeam.pokemon || []).slice(0, 6).map((pokemon, index) => ({
        playerPokemonId: `trainer-vault-preview-pokemon-${index + 1}`,
        speciesId: pokemon.speciesId,
        battleMarked: index === 0 || index === 2,
        gender: pokemon.gender,
        nature: pokemon.nature,
        abilityId: pokemon.abilityId,
        heldItemId: index === 0 ? "leftovers" : undefined,
        evs: pokemon.evs,
        ivs: pokemon.ivs,
        moves: pokemon.moves.map(move => ({moveId: move.moveId, remainingPp: move.remainingPp, maxPp: move.maxPp})),
        friendship: 80 + index,
        shiny: index === 1 ? true : pokemon.shiny,
        metAt: new Date(2026, 0, index + 1).toISOString(),
        honors: previewHonorsForPokemon(index),
      })),
    });
  });

  return (
    <section className="trainer-vault-preview-canvas" aria-label="训练家仓库页面预览">
      <TrainerVaultPage
        api={api}
        playerVault={playerVault}
        playerVaultDirty={playerVaultDirty}
        profileBattlePoints={999}
        debugFeatureEnabled
        onPlayerVaultChange={setPlayerVault}
        onPlayerVaultDirtyChange={setPlayerVaultDirty}
        onSavePlayerVault={async (vault) => {
          setPlayerVaultDirty(false);
          return api.normalizePlayerVault(vault);
        }}
        onUnlockStoragePage={async (targetTab) => {
          const nextVault = api.normalizePlayerVault(targetTab === "bag"
            ? {...playerVault, itemStoragePageCount: playerVault.itemStoragePageCount + 1}
            : {...playerVault, pokemonStoragePageCount: playerVault.pokemonStoragePageCount + 1});
          setPlayerVault(nextVault);
          setPlayerVaultDirty(false);
          return nextVault;
        }}
        onBack={() => undefined}
      />
    </section>
  );
}

function previewHonorsForPokemon(index: number): string[] {
  if (index === 0) {
    return [
      "preview-first-partner",
      "soulmate-honor-medal:kanto",
      "soulmate-honor-target:johto:gym:城都地区:阿速:1",
      "soulmate-honor-target:johto:gym:城都地区:小茜:3",
    ];
  }
  if (index === 1) return ["soulmate-honor-target:villain:villain:彩虹火箭队:坂木:1"];
  return [];
}
