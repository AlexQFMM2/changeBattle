// Battle V4 的宝可梦对象来源全面参考 Pokemon Showdown Client：
// side.pokemon[] 持久保存 BattlePokemon，side.active[] 只保存对同一对象的引用。
// 本项目跨 API/React/诊断 JSON，不能传 JS 引用，因此用 battleKey + active slot 指针翻译这个模型。
import {useMemo} from "react";
import type {
  BattleActivePokemonV4,
  BattleRosterPokemonV4,
  BattleSessionSnapshotV4,
  BattleTeamPokemonStateV4,
  BattleViewModelV4,
  BattleViewSlotV4,
  LocalPokemonV4,
  RequestSidePokemonV4,
  ShowdownPlayerIdV4,
  ShowdownTeamPokemonMappingV4,
} from "@changebattle-v2/api";
import {pokemonSpriteResourceUrls} from "../../lib/showdownPokemonSpriteAdapter.js";

export type PokemonBattleOBJ = {
  battleKey: string;
  playerId: ShowdownPlayerIdV4;
  teamIndex: number;
  choiceIndex: number;
  slot: string;
  seat: BattleViewSlotV4["seat"];
  side: BattleViewSlotV4["side"];
  position: BattleViewSlotV4["position"];
  active: boolean;
  localPokemonId: string;
  showdownIdentityToken: string;
  showdownId: string;
  pokeballId: string;
  pokeball: string;
  baseSpeciesId: string;
  battleSpeciesId: string;
  battleDetails: string;
  displayName: string;
  name: string;
  nameZh: string;
  level: number;
  hp: number;
  maxHp: number;
  status: string;
  fainted: boolean;
  shiny: boolean;
  iconUrl: string;
  iconStyle: string;
  spriteUrl: string;
  frontSpriteUrl: string;
  backSpriteUrl: string;
  frontShinySpriteUrl: string;
  backShinySpriteUrl: string;
  types: string[];
  teraType?: string;
  terastallized?: boolean;
  dynamaxActive?: boolean;
  specialFormeKind: BattleViewSlotV4["specialFormeKind"];
  localPokemon: LocalPokemonV4 | null;
  row: RequestSidePokemonV4 | null;
  teamState: BattleTeamPokemonStateV4 | null;
  rosterPokemon: BattleRosterPokemonV4 | null;
};

export type PokemonBattleOBJState = {
  byPlayer: Record<ShowdownPlayerIdV4, PokemonBattleOBJ[]>;
  partyByPlayer: Record<ShowdownPlayerIdV4, PokemonBattleOBJ[]>;
  activeNear: PokemonBattleOBJ[];
  activeFar: PokemonBattleOBJ[];
  nearSlots: BattleViewSlotV4[];
  farSlots: BattleViewSlotV4[];
  slots: BattleViewSlotV4[];
  toViewSlot: (obj: PokemonBattleOBJ) => BattleViewSlotV4;
};

type UsePokemonBattleOBJHookInput = {
  api: PokemonBattleOBJApi;
  snapshot: BattleSessionSnapshotV4 | null;
  viewModel: BattleViewModelV4 | null;
  playback?: {
    hasProtocolState?: boolean;
    nearTeam?: BattleViewSlotV4[];
    farTeam?: BattleViewSlotV4[];
  } | null;
};

export type PokemonBattleOBJApi = {
  getPokemonDetail: (speciesId: string) => {
    name?: string;
    nameZh?: string;
    types?: string[];
    sprites?: {
      iconUrl?: string;
      iconStyle?: string;
    };
  };
};

const PLAYER_IDS: ShowdownPlayerIdV4[] = ["p1", "p2", "p3", "p4"];

export function usePokemonBattleOBJHook(input: UsePokemonBattleOBJHookInput): PokemonBattleOBJState {
  const {api, snapshot, viewModel, playback} = input;
  return useMemo(() => buildPokemonBattleOBJState({api, snapshot, viewModel, playback}), [api, snapshot, viewModel, playback]);
}

export function buildPokemonBattleOBJState(input: UsePokemonBattleOBJHookInput): PokemonBattleOBJState {
  const byPlayer = Object.fromEntries(PLAYER_IDS.map(playerId => [playerId, buildPlayerBattleObjects(input, playerId)])) as Record<ShowdownPlayerIdV4, PokemonBattleOBJ[]>;
  const partyByPlayer = byPlayer;
  const playbackNear = input.playback?.hasProtocolState ? input.playback.nearTeam || [] : [];
  const playbackFar = input.playback?.hasProtocolState ? input.playback.farTeam || [] : [];
  const activeNear = playbackNear.length
    ? objectsFromPlaybackSlots(input.api, byPlayer, playbackNear).filter(obj => obj.active)
    : mergePlaybackActiveObjects(sortActiveBattleObjects([...byPlayer.p1, ...byPlayer.p3].filter(obj => obj.active)), playbackNear).filter(obj => obj.active && !obj.fainted);
  const activeFar = playbackFar.length
    ? objectsFromPlaybackSlots(input.api, byPlayer, playbackFar).filter(obj => obj.active)
    : mergePlaybackActiveObjects(sortActiveBattleObjects([...byPlayer.p2, ...byPlayer.p4].filter(obj => obj.active)), playbackFar).filter(obj => obj.active && !obj.fainted);
  const nearSlots = activeNear.map(obj => toPokemonBattleViewSlot(input.api, obj));
  const farSlots = activeFar.map(obj => toPokemonBattleViewSlot(input.api, obj));
  return {
    byPlayer,
    partyByPlayer,
    activeNear,
    activeFar,
    nearSlots,
    farSlots,
    slots: [...nearSlots, ...farSlots],
    toViewSlot: obj => toPokemonBattleViewSlot(input.api, obj),
  };
}

function buildPlayerBattleObjects(input: UsePokemonBattleOBJHookInput, playerId: ShowdownPlayerIdV4): PokemonBattleOBJ[] {
  const snapshot = input.snapshot;
  const viewModel = input.viewModel;
  const player = snapshot?.players.find(entry => entry.playerId === playerId);
  const localTeam = player?.draft.localTeam.pokemon || [];
  const mapping = player?.teamMapping || [];
  const requestRows = snapshot?.requests[playerId]?.side?.pokemon || snapshot?.debug.latestSidePokemon?.[playerId] || [];
  const roster = snapshot?.battleRosterByPlayer?.[playerId] || null;
  const activeEntries = activeEntriesForPlayer(snapshot, playerId);
  const activeKeyToSlot = new Map(Object.entries(roster?.activeKeyBySlot || {}).map(([slot, key]) => [key, slot]));
  const count = Math.max(localTeam.length, requestRows.length, mapping.length, Object.keys(roster?.pokemonByKey || {}).length, activeEntries.length);
  const objects: PokemonBattleOBJ[] = [];
  const usedKeys = new Set<string>();
  for (let index = 0; index < count; index++) {
    const row = requestRows[index] || null;
    const resolved = resolveBattleObjLocalPokemon(row, mapping, localTeam, index);
    const mapped = resolved.mapping || mapping.find(entry => entry.teamIndex === index || entry.choiceIndex === index + 1) || null;
    const localPokemon = resolved.localPokemon || localTeam[index] || localTeam[mapped?.teamIndex ?? -1] || null;
    const identityTokens = identityTokensForObj(localPokemon, mapped, row);
    const rosterPokemon = findRosterPokemon(roster?.pokemonByKey || {}, identityTokens, row, localPokemon);
    const active = findActivePokemon(activeEntries, identityTokens, rosterPokemon, row, localPokemon);
    const teamState = findTeamState(snapshot, playerId, identityTokens);
    const battleKey = canonicalBattleKeyForObj(playerId, row, rosterPokemon, active, teamState, mapped, localPokemon) || acceptedRosterBattleKey(rosterPokemon?.key, playerId) || protocolBattleKey(playerId, index);
    usedKeys.add(battleKey);
    objects.push(createPokemonBattleOBJ(input.api, {
      playerId,
      index,
      row,
      localPokemon,
      mapping: mapped,
      active,
      rosterPokemon,
      teamState,
      activeSlot: rosterPokemon ? activeKeyToSlot.get(rosterPokemon.key) || active?.slot || "" : active?.slot || "",
      battleKey,
      viewSlot: findViewSlot(viewModel, identityTokens, playerId, rosterPokemon, active, row, localPokemon),
    }));
  }
  for (const rosterPokemon of Object.values(roster?.pokemonByKey || {})) {
    const identityTokenList = identityTokensForRoster(rosterPokemon);
    const identityTokens = new Set(identityTokenList);
    const row = requestRows.find(candidate => identityTokens.has(toId(candidate.pokeball || ""))) || null;
    const mapped = mappingEntryForTokens(mapping, identityTokens);
    const localPokemon = mapped ? localTeam[mapped.teamIndex] || null : null;
    const active = findActivePokemon(activeEntries, identityTokens, rosterPokemon, row, localPokemon);
    const teamState = findTeamState(snapshot, playerId, identityTokens);
    const battleKey = canonicalBattleKeyForObj(playerId, row, rosterPokemon, active, teamState, mapped, localPokemon) || acceptedRosterBattleKey(rosterPokemon.key, playerId) || protocolBattleKey(playerId, objects.length);
    if (usedKeys.has(battleKey) || usedKeys.has(rosterPokemon.key)) continue;
    objects.push(createPokemonBattleOBJ(input.api, {
      playerId,
      index: mapped?.teamIndex ?? objects.length,
      row,
      localPokemon,
      mapping: mapped,
      active,
      rosterPokemon,
      teamState,
      activeSlot: activeKeyToSlot.get(rosterPokemon.key) || active?.slot || rosterPokemon.slot || "",
      battleKey,
      viewSlot: findViewSlot(viewModel, identityTokens, playerId, rosterPokemon, active, row, localPokemon),
    }));
  }
  return objects.sort((a, b) => a.teamIndex - b.teamIndex || a.battleKey.localeCompare(b.battleKey));
}

function createPokemonBattleOBJ(
  api: PokemonBattleOBJApi,
  input: {
    playerId: ShowdownPlayerIdV4;
    index: number;
    row: RequestSidePokemonV4 | null;
    localPokemon: LocalPokemonV4 | null;
    mapping: ShowdownTeamPokemonMappingV4 | null;
    active: BattleActivePokemonV4 | null;
    rosterPokemon: BattleRosterPokemonV4 | null;
    teamState: BattleTeamPokemonStateV4 | null;
    activeSlot: string;
    battleKey: string;
    viewSlot: BattleViewSlotV4 | null;
  },
): PokemonBattleOBJ {
  const {playerId, index, row, localPokemon, mapping, active, rosterPokemon, teamState, activeSlot, battleKey, viewSlot} = input;
  const battleDetails = firstText(active?.details, rosterPokemon?.details, teamState?.details, row?.details, viewSlot?.speciesId, localPokemon?.speciesId);
  const battleSpeciesId = firstText(active?.species, detailsSpecies(battleDetails), rosterPokemon?.species, detailsSpecies(teamState?.details), detailsSpecies(row?.details), viewSlot?.speciesId, localPokemon?.speciesId);
  const baseSpeciesId = firstText(localPokemon?.speciesId, mapping?.speciesId, battleSpeciesId);
  const level = localPokemon?.level || levelFromDetails(battleDetails) || viewSlot?.level || 50;
  const maxHp = Math.max(0, teamState?.maxHp || active?.maxHp || viewSlot?.maxHp || localPokemon?.maxHp || maxHpFromCondition(row?.condition, 0));
  const hp = displayHp(teamState, active, viewSlot, row, localPokemon, maxHp);
  const status = normalizeStatus(firstText(teamState?.status, active?.status, rowStatus(row), viewSlot?.status, localPokemon?.entryStatus));
  const fainted = Boolean(teamState?.fainted || active?.fainted || row?.fainted || row?.condition?.includes("fnt") || viewSlot?.fainted || hp <= 0);
  const activeFlag = Boolean(active || rosterPokemon && activeSlot || row?.active || viewSlot?.active);
  const sprites = pokemonSpriteResourceUrls(battleSpeciesId || baseSpeciesId);
  const dexDisplay = safePokemonDisplay(api, battleSpeciesId || baseSpeciesId);
  const side = sideForPlayer(playerId);
  const position = positionForSlot(activeSlot, index);
  const shiny = Boolean(localPokemon?.shiny || viewSlot?.shiny);
  const iconStyle = dexDisplay.iconStyle || viewSlot?.iconStyle || localPokemon?.iconStyle || "";
  const iconUrl = dexDisplay.iconUrl || viewSlot?.iconUrl || localPokemon?.iconUrl || localPokemon?.spriteUrl || "";
  return {
    battleKey,
    playerId,
    teamIndex: mapping?.teamIndex ?? index,
    choiceIndex: mapping?.choiceIndex ?? index + 1,
    slot: activeSlot,
    seat: seatFor(playerId, position),
    side,
    position,
    active: activeFlag,
    localPokemonId: firstText(localPokemon?.localPokemonId, mapping?.localPokemonId, active?.localPokemonId, rosterPokemon?.localPokemonId, teamState?.localPokemonId),
    showdownIdentityToken: firstText(mapping?.showdownIdentityToken, localPokemon?.showdownIdentityToken, active?.showdownIdentityToken, rosterPokemon?.showdownIdentityToken, teamState?.showdownIdentityToken, row?.pokeball),
    showdownId: firstText(mapping?.showdownId, localPokemon?.showdownId, active?.showdownId, rosterPokemon?.showdownId, teamState?.showdownId, row?.pokeball),
    pokeballId: firstText(mapping?.pokeballId, localPokemon?.pokeballId, active?.pokeballId, rosterPokemon?.pokeballId, teamState?.pokeballId, row?.pokeball),
    pokeball: firstText(row?.pokeball, active?.pokeball, rosterPokemon?.pokeball, teamState?.pokeball),
    baseSpeciesId,
    battleSpeciesId,
    battleDetails,
    displayName: displayNameForBattlePokemon(api, localPokemon, dexDisplay, battleSpeciesId, row),
    name: localPokemon?.name || dexDisplay.name || row?.name || detailsSpecies(battleDetails) || battleSpeciesId,
    nameZh: localPokemon?.nameZh || dexDisplay.nameZh || "",
    level,
    hp,
    maxHp,
    status,
    fainted,
    shiny,
    iconUrl,
    iconStyle,
    spriteUrl: shiny
      ? side === "near" ? sprites.backShinySpriteUrl : sprites.frontShinySpriteUrl
      : side === "near" ? sprites.backSpriteUrl : sprites.frontSpriteUrl,
    frontSpriteUrl: sprites.frontSpriteUrl,
    backSpriteUrl: sprites.backSpriteUrl,
    frontShinySpriteUrl: sprites.frontShinySpriteUrl,
    backShinySpriteUrl: sprites.backShinySpriteUrl,
    types: dexDisplay.types,
    teraType: viewSlot?.teraType,
    terastallized: viewSlot?.terastallized,
    dynamaxActive: viewSlot?.dynamaxActive,
    specialFormeKind: specialFormeKindForBattleSpecies(battleSpeciesId),
    localPokemon,
    row,
    teamState,
    rosterPokemon,
  };
}

function toPokemonBattleViewSlot(api: PokemonBattleOBJApi, obj: PokemonBattleOBJ): BattleViewSlotV4 {
  const teamBallStates: BattleViewSlotV4["teamBallStates"] = [];
  return {
    seat: obj.seat,
    playerId: obj.playerId,
    side: obj.side,
    position: obj.position,
    localPokemonId: obj.localPokemonId,
    showdownIdentityToken: obj.showdownIdentityToken,
    showdownId: obj.showdownId,
    pokeballId: obj.pokeballId,
    active: obj.active,
    fainted: obj.fainted,
    name: obj.name,
    nameZh: obj.nameZh || obj.displayName,
    speciesId: obj.battleSpeciesId,
    level: obj.level,
    nature: obj.localPokemon?.nature,
    friendship: obj.localPokemon?.friendship,
    formalSourceKind: obj.localPokemon?.formalSourceKind,
    sourcePlayerPokemonId: obj.localPokemon?.sourcePlayerPokemonId,
    hp: obj.hp,
    maxHp: obj.maxHp,
    status: obj.status,
    spriteUrl: obj.spriteUrl,
    frontSpriteUrl: obj.frontSpriteUrl,
    backSpriteUrl: obj.backSpriteUrl,
    frontShinySpriteUrl: obj.frontShinySpriteUrl,
    backShinySpriteUrl: obj.backShinySpriteUrl,
    shiny: obj.shiny,
    iconUrl: obj.iconUrl,
    iconStyle: obj.iconStyle,
    teraType: obj.teraType,
    terastallized: obj.terastallized,
    dynamaxActive: obj.dynamaxActive,
    specialFormeKind: obj.specialFormeKind,
    teamBallStates,
  };
}

function sortActiveBattleObjects(objects: PokemonBattleOBJ[]): PokemonBattleOBJ[] {
  return [...objects].sort((a, b) => a.seat.localeCompare(b.seat) || a.teamIndex - b.teamIndex || a.battleKey.localeCompare(b.battleKey));
}

function mergePlaybackActiveObjects(objects: PokemonBattleOBJ[], playbackSlots: BattleViewSlotV4[]): PokemonBattleOBJ[] {
  if (!playbackSlots.length) return objects;
  const merged = objects.map(obj => {
    const playback = playbackSlots.find(slot => sameIdentity(obj, slot));
    if (!playback) return obj;
    return {
      ...obj,
      hp: playback.hp,
      maxHp: playback.maxHp,
      status: playback.status,
      fainted: playback.fainted,
      active: playback.active,
      teraType: playback.teraType,
      terastallized: playback.terastallized,
      dynamaxActive: playback.dynamaxActive,
    };
  });
  const bySeat = new Set(merged.map(obj => obj.seat));
  for (const playback of playbackSlots) {
    if (!playback.active || playback.fainted || bySeat.has(playback.seat)) continue;
    const base = objects.find(obj => obj.playerId === playback.playerId && battleViewSlotBattleKey(playback) && obj.battleKey === battleViewSlotBattleKey(playback)) ||
      objects.find(obj => obj.playerId === playback.playerId && obj.localPokemonId === playback.localPokemonId);
    if (!base) continue;
    merged.push({
      ...base,
      slot: slotForSeat(playback.seat),
      seat: playback.seat,
      position: playback.position,
      active: playback.active,
      fainted: playback.fainted,
      hp: playback.hp,
      maxHp: playback.maxHp,
      status: playback.status,
      teraType: playback.teraType,
      terastallized: playback.terastallized,
      dynamaxActive: playback.dynamaxActive,
    });
    bySeat.add(playback.seat);
  }
  return merged;
}

function objectsFromPlaybackSlots(api: PokemonBattleOBJApi, byPlayer: Record<ShowdownPlayerIdV4, PokemonBattleOBJ[]>, playbackSlots: BattleViewSlotV4[]): PokemonBattleOBJ[] {
  return playbackSlots
    .filter(slot => slot.active)
    .map((slot, index) => {
      const playerObjects = byPlayer[slot.playerId] || [];
      const base = playerObjects.find(obj => obj.battleKey && battleViewSlotBattleKey(slot) && obj.battleKey === battleViewSlotBattleKey(slot)) ||
        playerObjects.find(obj => obj.localPokemonId && obj.localPokemonId === slot.localPokemonId) ||
        playerObjects.find(obj => sameIdentity(obj, slot)) ||
        null;
      const speciesId = slot.speciesId || base?.battleSpeciesId || base?.baseSpeciesId || "";
      const dexDisplay = safePokemonDisplay(api, speciesId);
      const sprites = pokemonSpriteResourceUrls(speciesId);
      const side = slot.side;
      return {
        ...(base || fallbackPokemonBattleOBJ(api, slot, index)),
        battleKey: base?.battleKey || battleViewSlotBattleKey(slot) || protocolBattleKey(slot.playerId, index),
        playerId: slot.playerId,
        slot: slotForSeat(slot.seat),
        seat: slot.seat,
        side,
        position: slot.position,
        active: slot.active,
        localPokemonId: slot.localPokemonId || base?.localPokemonId || "",
        showdownIdentityToken: slot.showdownIdentityToken || base?.showdownIdentityToken || "",
        showdownId: slot.showdownId || base?.showdownId || "",
        pokeballId: slot.pokeballId || base?.pokeballId || "",
        pokeball: base?.pokeball || slot.pokeballId || slot.showdownIdentityToken || slot.showdownId || "",
        battleSpeciesId: speciesId,
        battleDetails: base?.battleDetails || speciesId,
        displayName: slot.nameZh || slot.name || base?.displayName || dexDisplay.nameZh || dexDisplay.name || speciesId,
        name: slot.name || base?.name || dexDisplay.name || speciesId,
        nameZh: slot.nameZh || base?.nameZh || dexDisplay.nameZh || "",
        level: slot.level || base?.level || 50,
        hp: slot.hp,
        maxHp: slot.maxHp,
        status: slot.status,
        fainted: slot.fainted,
        shiny: slot.shiny || base?.shiny || false,
        iconUrl: slot.iconUrl || base?.iconUrl || dexDisplay.iconUrl,
        iconStyle: slot.iconStyle || base?.iconStyle || dexDisplay.iconStyle,
        spriteUrl: slot.spriteUrl || (side === "near" ? sprites.backSpriteUrl : sprites.frontSpriteUrl),
        frontSpriteUrl: slot.frontSpriteUrl || sprites.frontSpriteUrl,
        backSpriteUrl: slot.backSpriteUrl || sprites.backSpriteUrl,
        frontShinySpriteUrl: slot.frontShinySpriteUrl || sprites.frontShinySpriteUrl,
        backShinySpriteUrl: slot.backShinySpriteUrl || sprites.backShinySpriteUrl,
        types: base?.types || dexDisplay.types,
        teraType: slot.teraType || base?.teraType,
        terastallized: slot.terastallized ?? base?.terastallized,
        dynamaxActive: slot.dynamaxActive ?? base?.dynamaxActive,
        specialFormeKind: slot.specialFormeKind || specialFormeKindForBattleSpecies(speciesId),
      };
    })
    .sort((a, b) => a.seat.localeCompare(b.seat) || a.teamIndex - b.teamIndex || a.battleKey.localeCompare(b.battleKey));
}

function fallbackPokemonBattleOBJ(api: PokemonBattleOBJApi, slot: BattleViewSlotV4, index: number): PokemonBattleOBJ {
  const speciesId = slot.speciesId || "";
  const dexDisplay = safePokemonDisplay(api, speciesId);
  return {
    battleKey: battleViewSlotBattleKey(slot) || protocolBattleKey(slot.playerId, index),
    playerId: slot.playerId,
    teamIndex: index,
    choiceIndex: index + 1,
    slot: slotForSeat(slot.seat),
    seat: slot.seat,
    side: slot.side,
    position: slot.position,
    active: slot.active,
    localPokemonId: slot.localPokemonId || "",
    showdownIdentityToken: slot.showdownIdentityToken || "",
    showdownId: slot.showdownId || "",
    pokeballId: slot.pokeballId || "",
    pokeball: slot.pokeballId || slot.showdownIdentityToken || slot.showdownId || "",
    baseSpeciesId: speciesId,
    battleSpeciesId: speciesId,
    battleDetails: speciesId,
    displayName: slot.nameZh || slot.name || dexDisplay.nameZh || dexDisplay.name || speciesId,
    name: slot.name || dexDisplay.name || speciesId,
    nameZh: slot.nameZh || dexDisplay.nameZh || "",
    level: slot.level || 50,
    hp: slot.hp,
    maxHp: slot.maxHp,
    status: slot.status,
    fainted: slot.fainted,
    shiny: slot.shiny || false,
    iconUrl: slot.iconUrl || dexDisplay.iconUrl,
    iconStyle: slot.iconStyle || dexDisplay.iconStyle,
    spriteUrl: slot.spriteUrl,
    frontSpriteUrl: slot.frontSpriteUrl,
    backSpriteUrl: slot.backSpriteUrl,
    frontShinySpriteUrl: slot.frontShinySpriteUrl,
    backShinySpriteUrl: slot.backShinySpriteUrl,
    types: dexDisplay.types,
    teraType: slot.teraType,
    terastallized: slot.terastallized,
    dynamaxActive: slot.dynamaxActive,
    specialFormeKind: slot.specialFormeKind || specialFormeKindForBattleSpecies(speciesId),
    localPokemon: null,
    row: null,
    teamState: null,
    rosterPokemon: null,
  };
}

function activeEntriesForPlayer(snapshot: BattleSessionSnapshotV4 | null, playerId: ShowdownPlayerIdV4): BattleActivePokemonV4[] {
  const roster = snapshot?.battleRosterByPlayer?.[playerId];
  if (roster) {
    return Object.entries(roster.activeKeyBySlot || {}).map((entry): BattleActivePokemonV4 | null => {
      const [slot, key] = entry;
      const pokemon = roster.pokemonByKey?.[key];
      return pokemon ? {
        ident: pokemon.ident,
        playerId: pokemon.playerId,
        slot,
        localPokemonId: pokemon.localPokemonId,
        showdownIdentityToken: pokemon.showdownIdentityToken,
        showdownId: pokemon.showdownId,
        pokeballId: pokemon.pokeballId,
        pokeball: pokemon.pokeball,
        species: pokemon.species,
        details: pokemon.details,
        condition: pokemon.condition,
        hp: pokemon.hp,
        maxHp: pokemon.maxHp,
        status: pokemon.status,
        fainted: pokemon.fainted,
      } satisfies BattleActivePokemonV4 : null;
    }).filter((entry): entry is BattleActivePokemonV4 => Boolean(entry));
  }
  return snapshot?.active.filter(active => active.playerId === playerId) || [];
}

function findRosterPokemon(
  rosterByKey: Record<string, BattleRosterPokemonV4>,
  tokens: Set<string>,
  row: RequestSidePokemonV4 | null,
  localPokemon: LocalPokemonV4 | null,
): BattleRosterPokemonV4 | null {
  const entries = Object.values(rosterByKey);
  return entries.find(entry => identityTokensForRoster(entry).some(token => tokens.has(token))) ||
    entries.find(entry => row && row.details && detailsSpecies(entry.details) === detailsSpecies(row.details)) ||
    entries.find(entry => localPokemon && toId(entry.localPokemonId) === toId(localPokemon.localPokemonId)) ||
    null;
}

function findActivePokemon(
  activeEntries: BattleActivePokemonV4[],
  tokens: Set<string>,
  rosterPokemon: BattleRosterPokemonV4 | null,
  row: RequestSidePokemonV4 | null,
  localPokemon: LocalPokemonV4 | null,
): BattleActivePokemonV4 | null {
  return activeEntries.find(active => identityTokensForActive(active).some(token => tokens.has(token))) ||
    activeEntries.find(active => rosterPokemon && identityTokensForActive(active).some(token => identityTokensForRoster(rosterPokemon).includes(token))) ||
    activeEntries.find(active => row && row.active && detailsSpecies(active.details) === detailsSpecies(row.details)) ||
    activeEntries.find(active => localPokemon && toId(active.localPokemonId) === toId(localPokemon.localPokemonId)) ||
    null;
}

function findTeamState(snapshot: BattleSessionSnapshotV4 | null, playerId: ShowdownPlayerIdV4, tokens: Set<string>): BattleTeamPokemonStateV4 | null {
  const state = snapshot?.teamStateByPlayer?.[playerId];
  if (!state) return null;
  for (const token of tokens) {
    const entry = state.pokemonByToken[token];
    if (entry) return entry;
  }
  return null;
}

function findViewSlot(
  viewModel: BattleViewModelV4 | null,
  tokens: Set<string>,
  playerId: ShowdownPlayerIdV4,
  rosterPokemon: BattleRosterPokemonV4 | null,
  active: BattleActivePokemonV4 | null,
  row: RequestSidePokemonV4 | null,
  localPokemon: LocalPokemonV4 | null,
): BattleViewSlotV4 | null {
  const slots = viewModel?.slots || [];
  return slots.find(slot => slot.playerId === playerId && identityTokensForSlot(slot).some(token => tokens.has(token))) ||
    slots.find(slot => slot.playerId === playerId && rosterPokemon && identityTokensForSlot(slot).some(token => identityTokensForRoster(rosterPokemon).includes(token))) ||
    slots.find(slot => slot.playerId === playerId && active && slot.seat === seatFor(playerId, positionForSlot(active.slot, 0))) ||
    slots.find(slot => slot.playerId === playerId && row && detailsSpecies(slot.speciesId) === detailsSpecies(row.details)) ||
    slots.find(slot => slot.playerId === playerId && localPokemon && slot.localPokemonId === localPokemon.localPokemonId) ||
    null;
}

function identityTokensForObj(localPokemon: LocalPokemonV4 | null, mapping: ShowdownTeamPokemonMappingV4 | null, row: RequestSidePokemonV4 | null): Set<string> {
  return new Set([
    localPokemon?.localPokemonId,
    localPokemon?.showdownIdentityToken,
    localPokemon?.showdownId,
    localPokemon?.pokeballId,
    mapping?.localPokemonId,
    mapping?.showdownIdentityToken,
    mapping?.showdownId,
    mapping?.pokeballId,
    row?.pokeball,
  ].map(value => toId(value || "")).filter(Boolean));
}

function resolveBattleObjLocalPokemon(
  row: RequestSidePokemonV4 | null,
  mapping: ShowdownTeamPokemonMappingV4[],
  localTeam: LocalPokemonV4[],
  index: number,
): {localPokemon: LocalPokemonV4 | null; mapping: ShowdownTeamPokemonMappingV4 | null} {
  const rowToken = toId(row?.pokeball || "");
  const mapped = rowToken
    ? mapping.find(entry =>
      toId(entry.showdownIdentityToken) === rowToken ||
      toId(entry.showdownId) === rowToken ||
      toId(entry.pokeballId) === rowToken
    ) || null
    : null;
  const fallbackMapping = mapped || mapping.find(entry => entry.teamIndex === index || entry.choiceIndex === index + 1) || null;
  const localPokemon = fallbackMapping
    ? localTeam.find(pokemon => pokemon.localPokemonId === fallbackMapping.localPokemonId) || localTeam[fallbackMapping.teamIndex] || null
    : localTeam[index] || null;
  return {localPokemon, mapping: fallbackMapping};
}

function identityTokensForRoster(pokemon: BattleRosterPokemonV4): string[] {
  return [
    pokemon.localPokemonId,
    pokemon.showdownIdentityToken,
    pokemon.showdownId,
    pokemon.pokeballId,
    pokemon.pokeball,
  ].map(value => toId(value || "")).filter(Boolean);
}

function identityTokensForActive(active: BattleActivePokemonV4): string[] {
  return [
    active.localPokemonId,
    active.showdownIdentityToken,
    active.showdownId,
    active.pokeballId,
    active.pokeball,
  ].map(value => toId(value || "")).filter(Boolean);
}

function identityTokensForSlot(slot: BattleViewSlotV4): string[] {
  return [
    slot.localPokemonId,
    slot.showdownIdentityToken,
    slot.showdownId,
    slot.pokeballId,
  ].map(value => toId(value || "")).filter(Boolean);
}

function mappingEntryForTokens(mapping: ShowdownTeamPokemonMappingV4[], tokens: Set<string>): ShowdownTeamPokemonMappingV4 | null {
  return mapping.find(entry => [
    entry.localPokemonId,
    entry.showdownIdentityToken,
    entry.showdownId,
    entry.pokeballId,
  ].some(value => tokens.has(toId(value || "")))) || null;
}

function canonicalBattleKeyForObj(
  playerId: ShowdownPlayerIdV4,
  row: RequestSidePokemonV4 | null,
  roster: BattleRosterPokemonV4 | null,
  active: BattleActivePokemonV4 | null,
  teamState: BattleTeamPokemonStateV4 | null,
  mapping: ShowdownTeamPokemonMappingV4 | null,
  localPokemon: LocalPokemonV4 | null,
): string {
  return canonicalBattleKey(playerId, firstText(
    row?.pokeball,
    roster?.pokeball,
    active?.pokeball,
    teamState?.pokeball,
    mapping?.showdownIdentityToken,
    mapping?.showdownId,
    mapping?.pokeballId,
    localPokemon?.showdownIdentityToken,
    localPokemon?.showdownId,
    localPokemon?.pokeballId,
  ));
}

function canonicalBattleKey(playerId: ShowdownPlayerIdV4, pokeball: unknown): string {
  const token = toId(pokeball);
  return token ? `${playerId}:${token}` : "";
}

function protocolBattleKey(playerId: ShowdownPlayerIdV4, index: number): string {
  return `protocol:${playerId}:${index + 1}`;
}

function acceptedRosterBattleKey(key: string | undefined, playerId: ShowdownPlayerIdV4): string {
  if (!key) return "";
  if (key.startsWith(`${playerId}:`)) return key;
  if (new RegExp(`^protocol:${playerId}:\\d+$`, "i").test(key)) return key;
  return "";
}

function sameIdentity(obj: PokemonBattleOBJ, slot: BattleViewSlotV4): boolean {
  if (obj.battleKey && battleViewSlotBattleKey(slot) && obj.battleKey === battleViewSlotBattleKey(slot)) return true;
  if (obj.localPokemonId && slot.localPokemonId && obj.localPokemonId === slot.localPokemonId) return true;
  if (obj.showdownIdentityToken && slot.showdownIdentityToken && obj.showdownIdentityToken === slot.showdownIdentityToken) return true;
  if (obj.showdownId && slot.showdownId && obj.showdownId === slot.showdownId) return true;
  if (obj.pokeballId && slot.pokeballId && obj.pokeballId === slot.pokeballId) return true;
  return false;
}

function battleViewSlotBattleKey(slot: BattleViewSlotV4): string {
  return canonicalBattleKey(slot.playerId, slot.showdownIdentityToken || slot.showdownId || slot.pokeballId);
}

function slotForSeat(seat: string): string {
  const match = /^(p[1-4])([A-Z])$/i.exec(seat || "");
  return match ? `${match[1]!.toLowerCase()}${match[2]!.toLowerCase()}` : "";
}

function safePokemonDisplay(api: PokemonBattleOBJApi, speciesId: string): {name: string; nameZh: string; types: string[]; iconUrl: string; iconStyle: string} {
  try {
    const detail = api.getPokemonDetail(speciesId);
    return {
      name: detail.name || speciesId,
      nameZh: detail.nameZh || "",
      types: detail.types || [],
      iconUrl: detail.sprites?.iconUrl || "",
      iconStyle: detail.sprites?.iconStyle || "",
    };
  } catch {
    return {name: speciesId, nameZh: "", types: [], iconUrl: "", iconStyle: ""};
  }
}

function displayNameForBattlePokemon(api: PokemonBattleOBJApi, pokemon: LocalPokemonV4 | null, dexDisplay: ReturnType<typeof safePokemonDisplay>, battleSpeciesId: string, row: RequestSidePokemonV4 | null): string {
  const base = pokemon?.nameZh || pokemon?.name || row?.name || dexDisplay.nameZh || dexDisplay.name || battleSpeciesId;
  const formLabel = specialFormeLabel(battleSpeciesId);
  if (!formLabel) return base;
  if (new RegExp(`${formLabel.replace(/\s+/g, "[-\\s]?")}$`, "i").test(base)) return base;
  const baseSpeciesName = battleSpeciesId.replace(/-mega-x$/i, "").replace(/-mega-y$/i, "").replace(/-mega$/i, "").replace(/-primal$/i, "").replace(/-ultra$/i, "");
  if (toId(base) === toId(battleSpeciesId) || toId(base) === toId(baseSpeciesName)) {
    try {
      const detail = api.getPokemonDetail(baseSpeciesName);
      return `${detail.nameZh || detail.name || baseSpeciesName} ${formLabel}`;
    } catch {
      return `${baseSpeciesName} ${formLabel}`;
    }
  }
  return `${base} ${formLabel}`;
}

function specialFormeLabel(species: string): string {
  if (/-mega-x$/i.test(species)) return "Mega X";
  if (/-mega-y$/i.test(species)) return "Mega Y";
  if (/-mega$/i.test(species)) return "Mega";
  if (/-primal$/i.test(species)) return "原始回归";
  if (/-ultra$/i.test(species)) return "究极爆发";
  return "";
}

function specialFormeKindForBattleSpecies(species: string): BattleViewSlotV4["specialFormeKind"] {
  const id = toId(species);
  if (id.endsWith("megax") || id.endsWith("megay") || id.endsWith("mega")) return "mega";
  if (id.endsWith("primal")) return "primal";
  if (id.endsWith("ultra")) return "ultra";
  return "";
}

function displayHp(
  teamState: BattleTeamPokemonStateV4 | null,
  active: BattleActivePokemonV4 | null,
  viewSlot: BattleViewSlotV4 | null,
  row: RequestSidePokemonV4 | null,
  pokemon: LocalPokemonV4 | null,
  maxHp: number,
): number {
  if (teamState) return scaleHp(teamState.hp, teamState.maxHp, maxHp);
  if (active) return scaleHp(active.hp, active.maxHp, maxHp);
  if (viewSlot) return viewSlot.hp;
  return hpFromCondition(row?.condition, pokemon?.entryHp || 0);
}

function scaleHp(hp: number, sourceMaxHp: number, targetMaxHp: number): number {
  if (hp <= 0) return 0;
  if (!sourceMaxHp || !targetMaxHp || sourceMaxHp === targetMaxHp) return Math.max(0, Math.min(targetMaxHp || hp, hp));
  return Math.max(1, Math.min(targetMaxHp, Math.round(hp / sourceMaxHp * targetMaxHp)));
}

function maxHpFromCondition(condition = "", fallback = 0): number {
  const [hpPart] = condition.split(" ");
  const [, max] = hpPart.split("/");
  return Number(max) || fallback;
}

function hpFromCondition(condition = "", fallback = 0): number {
  const [hpPart] = condition.split(" ");
  const [hp] = hpPart.split("/");
  return Number(hp) || (condition.includes("fnt") ? 0 : fallback);
}

function rowStatus(row: RequestSidePokemonV4 | null): string {
  const parts = String(row?.condition || "").split(" ");
  return parts.find(part => ["brn", "par", "psn", "tox", "slp", "frz"].includes(part)) || "";
}

function normalizeStatus(status: string): string {
  return status === "fnt" ? "" : status || "";
}

function detailsSpecies(details = ""): string {
  return String(details || "").split(",")[0]?.trim() || "";
}

function levelFromDetails(details = ""): number {
  const match = /,\s*L(\d+)/i.exec(details);
  return match ? Number(match[1]) || 50 : 50;
}

function sideForPlayer(playerId: ShowdownPlayerIdV4): BattleViewSlotV4["side"] {
  return playerId === "p1" || playerId === "p3" ? "near" : "far";
}

function positionForSlot(slot: string, index: number): BattleViewSlotV4["position"] {
  if (/b:/i.test(slot) || /b$/i.test(slot)) return "B";
  if (/a:/i.test(slot) || /a$/i.test(slot)) return "A";
  return index % 2 === 1 ? "B" : "A";
}

function seatFor(playerId: ShowdownPlayerIdV4, position: BattleViewSlotV4["position"]): BattleViewSlotV4["seat"] {
  return `${playerId}${position}` as BattleViewSlotV4["seat"];
}

function firstText(...values: Array<string | undefined | null>): string {
  return values.find(value => String(value || "").trim())?.trim() || "";
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
