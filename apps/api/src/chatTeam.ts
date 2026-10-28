/** Reuse the formal Gen7 starter guarantee without creating a formal run. */
import {randomInt, randomUUID} from 'node:crypto';
import {createShowdownDexService, toID} from '@changebattle-v2/showdown-dex-core';
import type {ShowdownRandomTeamPokemonSetV4} from '@changebattle-v2/showdown-battle-core/teamGenerator';
import type {BattleServicePokemonSetV4} from '@changebattle-v2/showdown-battle-core/types';
import {createFormalStarterCandidatesV4} from './formalGame.js';
import {normalizeBattlePreferenceV4} from './training.js';
import {generateRandomBattleTeamPreviewV4, type RandomBattleTeamPreviewInputV4} from './teamGenerator.js';

type Dex = ReturnType<typeof createShowdownDexService>;
export function chatSetSpecials(dex: Dex, set: Pick<BattleServicePokemonSetV4, 'species' | 'moves' | 'item'>) {
  const pokemon = {speciesId: set.species, moves: set.moves.map(moveId => ({moveId}))};
  return (['system-mega-stone', 'system-z-crystal'] as const).flatMap(system =>
    dex.getSystemBattleReforgeOptions(system, pokemon).some(o => o.mappedItemId && toID(o.mappedItemId) === toID(set.item || ''))
      ? [system === 'system-mega-stone' ? 'Mega进化' : 'Z招式'] : []);
}

export async function generateChatTeam(dex: Dex, input: RandomBattleTeamPreviewInputV4 = {}): Promise<{
  pokemonSets: ShowdownRandomTeamPokemonSetV4[]; diagnostics: {ok: boolean};
}> {
  if (input.ruleSet !== 'gen7') return generateRandomBattleTeamPreviewV4(dex, input);
  const candidates = createFormalStarterCandidatesV4(dex, {
    mode: 'singles', streak: 0, count: input.teamSize || 6, seed: String(input.seed || randomUUID()),
    battlePreference: normalizeBattlePreferenceV4({ruleSet: 'gen7', allowedGenerations: [1,2,3,4,5,6,7]}),
  });
  let megaCount = 0;
  const pokemonSets = candidates.map(({pokemon: p}) => {
    const probe = {speciesId: p.speciesId, moves: p.moves.map(m => ({moveId: m.moveId}))};
    const mega = dex.getSystemBattleReforgeOptions('system-mega-stone', probe).filter(o => o.mappedItemId);
    const useMega = mega.length > 0 && megaCount < 2;
    if (useMega) megaCount++;
    const options = useMega ? mega : dex.getSystemBattleReforgeOptions('system-z-crystal', probe).filter(o => o.mappedItemId);
    const item = options.length ? options[randomInt(options.length)]!.mappedItemId : p.itemId;
    return {species: p.speciesId, name: p.name, level: 50, nature: p.nature,
      ability: p.abilityId || p.abilityName, moves: p.moves.map(m => m.moveId), item,
      evs: p.evs, ivs: p.ivs} satisfies BattleServicePokemonSetV4;
  });
  // Do not silently advertise a rule when its guaranteed usable team could not be prepared.
  const ok = megaCount >= Math.min(2, pokemonSets.length)
    && pokemonSets.some(s => chatSetSpecials(dex, s).includes('Z招式'));
  return {pokemonSets, diagnostics: {ok}};
}
