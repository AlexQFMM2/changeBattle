import type {BattleSessionSnapshotV4, BattleViewSlotV4, LocalPokemonV4, RequestSidePokemonV4} from "@changebattle-v2/api";
import {buildPokemonBattleOBJState} from "./usePokemonBattleOBJHook.js";

function smoke() {
  const api = {
    getPokemonDetail: (speciesId: string) => ({
      name: speciesId,
      nameZh: POKEMON_ZH[speciesId.toLowerCase()] || speciesId,
      types: POKEMON_TYPES[speciesId.toLowerCase()] || ["Normal"],
      sprites: {
        iconStyle: `background:url(/icons.png) 0 0`,
        iconUrl: "",
      },
    }),
  };
  const greninja = localPokemon("formal-p1-4-greninja", "Greninja", "甲贺忍蛙", "masterball");
  const megaSnapshot = snapshotWithPlayers([
    {
      playerId: "p1",
      localTeam: [greninja],
      mapping: [{
        playerId: "p1",
        teamIndex: 0,
        choiceIndex: 1,
        localPokemonId: greninja.localPokemonId,
        showdownIdentityToken: "masterball",
        showdownId: "masterball",
        pokeballId: "masterball",
        speciesId: "Greninja",
        displayName: "甲贺忍蛙",
      }],
      rows: [{ident: "p1: Greninja", details: "Greninja-Mega, L50, M", condition: "151/151", active: true, pokeball: "masterball"}],
      roster: {
        pokemonByKey: {
          "formal-p1-4-greninja": {
            key: "formal-p1-4-greninja",
            searchId: "p1: Greninja|Greninja-Mega, L50, M",
            ident: "p1: Greninja",
            canonicalIdent: "p1: Greninja",
            playerId: "p1",
            slot: "p1a",
            localPokemonId: greninja.localPokemonId,
            showdownIdentityToken: "masterball",
            showdownId: "masterball",
            pokeballId: "masterball",
            pokeball: "masterball",
            species: "Greninja-Mega",
            details: "Greninja-Mega, L50, M",
            condition: "151/151",
            hp: 151,
            maxHp: 151,
            status: "",
            fainted: false,
          },
        },
        activeKeyBySlot: {p1a: "formal-p1-4-greninja"},
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      teamState: {
        pokemonByToken: {
          masterball: {
            localPokemonId: greninja.localPokemonId,
            showdownIdentityToken: "masterball",
            showdownId: "masterball",
            pokeballId: "masterball",
            pokeball: "masterball",
            ident: "p1: Greninja",
            details: "Greninja-Mega, L50, M",
            hp: 151,
            maxHp: 151,
            status: "",
            fainted: false,
          },
        },
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  ]);
  const megaState = buildPokemonBattleOBJState({api, snapshot: megaSnapshot, viewModel: null});
  const mega = megaState.partyByPlayer.p1[0];
  assert(mega?.battleKey === "p1:masterball", `battle key should canonicalize to playerId:pokeball: ${mega?.battleKey}`);
  assert(mega?.baseSpeciesId === "Greninja", `base species should stay long-term Greninja: ${mega?.baseSpeciesId}`);
  assert(mega.battleSpeciesId === "Greninja-Mega", `battle species should be Mega: ${mega.battleSpeciesId}`);
  assert(mega.localPokemonId === "formal-p1-4-greninja", `local id should stay Greninja: ${mega.localPokemonId}`);
  assert(megaState.activeNear[0]?.battleKey === mega.battleKey, "active and party should point to same battle object key");
  assert(megaState.nearSlots[0]?.speciesId === "Greninja-Mega", `slot should display Mega: ${megaState.nearSlots[0]?.speciesId}`);
  const stalePlaybackMegaState = buildPokemonBattleOBJState({
    api,
    snapshot: megaSnapshot,
    viewModel: null,
    playback: {
      hasProtocolState: true,
      nearTeam: [viewSlotFor(megaState.nearSlots[0]!, {speciesId: "Greninja", hp: 77, maxHp: 151})],
      farTeam: [],
    },
  });
  assert(stalePlaybackMegaState.nearSlots[0]?.speciesId === "Greninja", `playback-visible species owns the current step before detailschange is consumed: ${stalePlaybackMegaState.nearSlots[0]?.speciesId}`);
  assert(stalePlaybackMegaState.nearSlots[0]?.hp === 77, `playback may update HP only: ${stalePlaybackMegaState.nearSlots[0]?.hp}`);
  const consumedMegaPlaybackState = buildPokemonBattleOBJState({
    api,
    snapshot: megaSnapshot,
    viewModel: null,
    playback: {
      hasProtocolState: true,
      nearTeam: [viewSlotFor(megaState.nearSlots[0]!, {speciesId: "Greninja-Mega", hp: 77, maxHp: 151})],
      farTeam: [],
    },
  });
  assert(consumedMegaPlaybackState.nearSlots[0]?.speciesId === "Greninja-Mega", `after detailschange step is consumed, visible species should be Mega: ${consumedMegaPlaybackState.nearSlots[0]?.speciesId}`);

  const chatot = localPokemon("formal-p2-1-chatot", "Chatot", "聒噪鸟", "luxuryball");
  const stunfisk = localPokemon("formal-p2-2-stunfisk", "Stunfisk", "泥巴鱼", "healball");
  const stunfiskSnapshot = snapshotWithPlayers([
    {
      playerId: "p2",
      localTeam: [chatot, stunfisk],
      mapping: [
        mappingFor("p2", 0, chatot),
        mappingFor("p2", 1, stunfisk),
      ],
      rows: [
        {ident: "p2: Chatot", details: "Chatot, L49, F", condition: "0 fnt", active: false, fainted: true, pokeball: "luxuryball"},
        {ident: "p2: Stunfisk", details: "Stunfisk, L49, M", condition: "183/183", active: true, pokeball: "healball"},
      ],
      roster: {
        pokemonByKey: {
          "formal-p2-1-chatot": rosterFor("p2", "p2b", chatot, "Chatot, L49, F", "0 fnt", true),
          "formal-p2-2-stunfisk": rosterFor("p2", "p2b", stunfisk, "Stunfisk, L49, M", "183/183", false),
        },
        activeKeyBySlot: {p2b: "formal-p2-2-stunfisk"},
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  ]);
  const stunfiskState = buildPokemonBattleOBJState({api, snapshot: stunfiskSnapshot, viewModel: null});
  const activeFar = stunfiskState.activeFar[0];
  assert(activeFar?.battleKey === "p2:healball", `Stunfisk battle key should be canonical playerId:pokeball: ${activeFar?.battleKey}`);
  assert(activeFar?.battleSpeciesId === "Stunfisk", `active far should be Stunfisk, got ${activeFar?.battleSpeciesId}`);
  assert(activeFar.localPokemonId === "formal-p2-2-stunfisk", `Stunfisk should not inherit Chatot local id: ${activeFar.localPokemonId}`);
  assert(stunfiskState.farSlots[0]?.speciesId === "Stunfisk", `far slot should display Stunfisk: ${stunfiskState.farSlots[0]?.speciesId}`);
  const staleFaintedPlaybackState = buildPokemonBattleOBJState({
    api,
    snapshot: stunfiskSnapshot,
    viewModel: null,
    playback: {
      hasProtocolState: true,
      nearTeam: [],
      farTeam: [viewSlotFor(stunfiskState.farSlots[0]!, {
        seat: "p2B",
        active: true,
        fainted: true,
        hp: 0,
        localPokemonId: chatot.localPokemonId,
        showdownIdentityToken: "luxuryball",
        showdownId: "luxuryball",
        pokeballId: "luxuryball",
        speciesId: "Chatot",
      })],
    },
  });
  assert(staleFaintedPlaybackState.farSlots.some(slot => slot.seat === "p2B" && slot.speciesId === "Chatot"), `playback-visible fainted slot should stay Chatot until the switch step is consumed: ${JSON.stringify(staleFaintedPlaybackState.farSlots)}`);

  const slowking = localPokemon("formal-p2-1-slowking", "Slowking-Galar", "呆呆王", "luxuryball");
  const cacturne = localPokemon("formal-p2-3-cacturne", "Cacturne", "梦歌仙人掌", "duskball");
  const playbackLeakSnapshot = snapshotWithPlayers([
    {
      playerId: "p2",
      localTeam: [slowking, cacturne],
      mapping: [
        mappingFor("p2", 0, slowking),
        mappingFor("p2", 1, cacturne),
      ],
      rows: [
        {ident: "p2: Slowking", details: "Slowking-Galar, L48, F", condition: "0 fnt", active: false, fainted: true, pokeball: "luxuryball"},
        {ident: "p2: Cacturne", details: "Cacturne, L48, M", condition: "134/134", active: true, pokeball: "duskball"},
      ],
      roster: {
        pokemonByKey: {
          "formal-p2-1-slowking": rosterFor("p2", "p2a", slowking, "Slowking-Galar, L48, F", "0 fnt", true),
          "formal-p2-3-cacturne": rosterFor("p2", "p2a", cacturne, "Cacturne, L48, M", "134/134", false),
        },
        activeKeyBySlot: {p2a: "formal-p2-3-cacturne"},
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  ]);
  const finalCacturneState = buildPokemonBattleOBJState({api, snapshot: playbackLeakSnapshot, viewModel: null});
  assert(finalCacturneState.farSlots[0]?.speciesId === "Cacturne", `final snapshot should still project Cacturne after switch: ${finalCacturneState.farSlots[0]?.speciesId}`);
  const slowkingVisibleDuringFaint = buildPokemonBattleOBJState({
    api,
    snapshot: playbackLeakSnapshot,
    viewModel: null,
    playback: {
      hasProtocolState: true,
      nearTeam: [],
      farTeam: [viewSlotFor(finalCacturneState.farSlots[0]!, {
        seat: "p2A",
        localPokemonId: slowking.localPokemonId,
        showdownIdentityToken: "luxuryball",
        showdownId: "luxuryball",
        pokeballId: "luxuryball",
        active: true,
        fainted: true,
        name: "Slowking",
        nameZh: "呆呆王",
        speciesId: "Slowking-Galar",
        hp: 0,
        maxHp: 160,
        status: "fnt",
      })],
    },
  });
  assert(slowkingVisibleDuringFaint.farSlots[0]?.speciesId === "Slowking-Galar", `Showdown step playback must not leak future Cacturne before switch step: ${JSON.stringify(slowkingVisibleDuringFaint.farSlots)}`);
  assert(!slowkingVisibleDuringFaint.farSlots.some(slot => slot.speciesId === "Cacturne"), `Cacturne should not appear until switch step is consumed: ${JSON.stringify(slowkingVisibleDuringFaint.farSlots)}`);

  const pikachuA = localPokemon("formal-p1-1-pikachu-a", "Pikachu", "皮卡丘A", "pokeball");
  const pikachuB = localPokemon("formal-p1-2-pikachu-b", "Pikachu", "皮卡丘B", "greatball");
  const duplicateSnapshot = snapshotWithPlayers([
    {
      playerId: "p1",
      localTeam: [pikachuA, pikachuB],
      mapping: [
        mappingFor("p1", 0, pikachuA),
        mappingFor("p1", 1, pikachuB),
      ],
      rows: [
        {ident: "p1: Pikachu", details: "Pikachu, L50, M", condition: "88/100", active: true, pokeball: "greatball"},
        {ident: "p1: Pikachu", details: "Pikachu, L50, M", condition: "90/100", active: true, pokeball: "pokeball"},
      ],
      roster: {
        pokemonByKey: {
          "formal-p1-1-pikachu-a": rosterFor("p1", "p1b", pikachuA, "Pikachu, L50, M", "90/100", false),
          "formal-p1-2-pikachu-b": rosterFor("p1", "p1a", pikachuB, "Pikachu, L50, M", "88/100", false),
        },
        activeKeyBySlot: {
          p1a: "formal-p1-2-pikachu-b",
          p1b: "formal-p1-1-pikachu-a",
        },
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  ]);
  const duplicateState = buildPokemonBattleOBJState({api, snapshot: duplicateSnapshot, viewModel: null});
  assert(duplicateState.partyByPlayer.p1[0]?.battleKey === "p1:pokeball", `Pikachu A key should be p1:pokeball: ${duplicateState.partyByPlayer.p1[0]?.battleKey}`);
  assert(duplicateState.partyByPlayer.p1[1]?.battleKey === "p1:greatball", `Pikachu B key should be p1:greatball: ${duplicateState.partyByPlayer.p1[1]?.battleKey}`);
  assert(duplicateState.partyByPlayer.p1[0]?.localPokemonId === "formal-p1-1-pikachu-a", `party should keep Showdown side.pokemon/team order: ${duplicateState.partyByPlayer.p1.map(item => item.localPokemonId).join(",")}`);
  assert(duplicateState.partyByPlayer.p1[1]?.localPokemonId === "formal-p1-2-pikachu-b", `second party slot should be Pikachu B`);
  assert(duplicateState.activeNear[0]?.localPokemonId === "formal-p1-2-pikachu-b", `p1a active should resolve by token to Pikachu B: ${duplicateState.activeNear.map(item => item.localPokemonId).join(",")}`);
  assert(duplicateState.activeNear[1]?.localPokemonId === "formal-p1-1-pikachu-a", `p1b active should resolve by token to Pikachu A`);
  assert(duplicateState.nearSlots[0]?.seat === "p1A" && duplicateState.nearSlots[1]?.seat === "p1B", `active slots should be arena ordered by seat`);
  console.log("pokemon battle obj hook smoke ok");
}

function viewSlotFor(base: BattleViewSlotV4, patch: Partial<BattleViewSlotV4>): BattleViewSlotV4 {
  return {...base, ...patch};
}

function snapshotWithPlayers(players: Array<{
  playerId: "p1" | "p2" | "p3" | "p4";
  localTeam: LocalPokemonV4[];
  mapping: NonNullable<BattleSessionSnapshotV4["players"][number]["teamMapping"]>;
  rows: RequestSidePokemonV4[];
  roster?: NonNullable<BattleSessionSnapshotV4["battleRosterByPlayer"]>["p1"];
  teamState?: NonNullable<BattleSessionSnapshotV4["teamStateByPlayer"]>["p1"];
}>): BattleSessionSnapshotV4 {
  return {
    id: "test-session",
    runId: "run",
    nodeId: "node",
    status: "running",
    mode: "doubles",
    ruleSet: "standard",
    turn: 1,
    winner: null,
    error: null,
    players: players.map(player => ({
      playerId: player.playerId,
      name: player.playerId,
      controller: player.playerId === "p1" ? "local" : "ai",
      alliance: player.playerId === "p1" || player.playerId === "p3" ? "near" : "far",
      team: [],
      draft: {
        localTeam: {pokemon: player.localTeam},
        bag: {items: [], maxSize: 20, battleBagEnabled: true},
      } as any,
      teamMapping: player.mapping,
    })),
    showdownIdPool: {used: [], available: []},
    requests: Object.fromEntries(players.map(player => [player.playerId, {side: {id: player.playerId, pokemon: player.rows}, active: [], rqid: 1}])) as BattleSessionSnapshotV4["requests"],
    active: [],
    teamStateByPlayer: Object.fromEntries(players.filter(player => player.teamState).map(player => [player.playerId, player.teamState])) as BattleSessionSnapshotV4["teamStateByPlayer"],
    battleRosterByPlayer: Object.fromEntries(players.filter(player => player.roster).map(player => [player.playerId, player.roster])) as BattleSessionSnapshotV4["battleRosterByPlayer"],
    rawLog: [],
    debug: {inputLog: [], lastChoices: [], playerStreams: [], latestSidePokemon: {}},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function localPokemon(localPokemonId: string, speciesId: string, nameZh: string, token: string): LocalPokemonV4 {
  return {
    localPokemonId,
    showdownIdentityToken: token,
    showdownId: token,
    pokeballId: token,
    speciesId,
    name: speciesId,
    nameZh,
    level: 50,
    gender: "M",
    shiny: false,
    itemId: "",
    abilityId: "torrent",
    abilityName: "Torrent",
    abilityNameZh: "激流",
    nature: "Serious",
    moves: [],
    evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
    ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
    entryHp: 100,
    entryStatus: "",
    maxHp: 100,
  };
}

function mappingFor(playerId: "p1" | "p2" | "p3" | "p4", teamIndex: number, pokemon: LocalPokemonV4) {
  return {
    playerId,
    teamIndex,
    choiceIndex: teamIndex + 1,
    localPokemonId: pokemon.localPokemonId,
    showdownIdentityToken: pokemon.showdownIdentityToken || "",
    showdownId: pokemon.showdownId || "",
    pokeballId: pokemon.pokeballId || "",
    speciesId: pokemon.speciesId,
    displayName: pokemon.nameZh || pokemon.name,
  };
}

function rosterFor(playerId: "p1" | "p2" | "p3" | "p4", slot: string, pokemon: LocalPokemonV4, details: string, condition: string, fainted: boolean) {
  const hp = fainted ? 0 : Number(condition.split("/")[0]) || 100;
  const maxHp = fainted ? 100 : Number(condition.split("/")[1]) || 100;
  return {
    key: pokemon.localPokemonId,
    searchId: `${playerId}: ${pokemon.name}|${details}`,
    ident: `${playerId}: ${pokemon.name}`,
    canonicalIdent: `${playerId}: ${pokemon.name}`,
    playerId,
    slot,
    localPokemonId: pokemon.localPokemonId,
    showdownIdentityToken: pokemon.showdownIdentityToken,
    showdownId: pokemon.showdownId,
    pokeballId: pokemon.pokeballId,
    pokeball: pokemon.pokeballId,
    species: details.split(",")[0] || pokemon.speciesId,
    details,
    condition,
    hp,
    maxHp,
    status: "",
    fainted,
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const POKEMON_ZH: Record<string, string> = {
  greninja: "甲贺忍蛙",
  "greninja-mega": "甲贺忍蛙 Mega",
  chatot: "聒噪鸟",
  stunfisk: "泥巴鱼",
  "slowking-galar": "呆呆王",
  cacturne: "梦歌仙人掌",
};

const POKEMON_TYPES: Record<string, string[]> = {
  greninja: ["Water", "Dark"],
  "greninja-mega": ["Water", "Dark"],
  chatot: ["Normal", "Flying"],
  stunfisk: ["Ground", "Electric"],
  "slowking-galar": ["Poison", "Psychic"],
  cacturne: ["Grass", "Dark"],
};

smoke();
