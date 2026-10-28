import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {ChatBattles, ChatBattleError} from './chatBattle.js';
import {generateChatTeam, chatSetSpecials} from './chatTeam.js';
import {pokemonHttp} from './pokemonHttp.js';
import {createBattleApiServer} from './server.js';
import {generateRandomBattleTeamPreviewV4} from './teamGenerator.js';
import {createShowdownDexService} from '@changebattle-v2/showdown-dex-core';
import {createInMemoryBattleService} from '@changebattle-v2/showdown-battle-core';

const owner = 'owner_aaaaaaaaaaaaaa', other = 'owner_bbbbbbbbbbbbbb';
let sequence = 0;
const op = () => `operation_${String(++sequence).padStart(16, '0')}`;
const dex = createShowdownDexService();
const real = await generateRandomBattleTeamPreviewV4(dex, {seed:'chat-smoke',teamSize:6,includeLocalTeam:false});
assert.equal(real.pokemonSets.length,6); assert.ok(real.diagnostics.ok);
let generated: number[] = [];
const generate: typeof generateRandomBattleTeamPreviewV4 = async (_dex, input={}) => {
  generated.push(input.teamSize!);
  const strong = input.playerId === 'p1';
  return {...real, pokemonSets: Array.from({length:input.teamSize!}, (_,i) => ({species:strong?'Mewtwo':'Magikarp',name:`member${i}`,
    level:strong?100:1,ability:strong?'Pressure':'Swift Swim',nature:'Serious',moves:strong?['Psychic','Tackle','Recover','Protect']:['Splash'],evs:{},ivs:{}}))};
};
const realEngine = createInMemoryBattleService();
let overlay = '';
const engine = {...realEngine, async getSnapshot(id: string) {
  const snapshot = await realEngine.getSnapshot(id);
  snapshot.debug.playerStreams.push({playerId:'p2',at:'private',chunk:'PRIVATE_AI_SECRET',request:false,lines:['|move|p2a|PRIVATE_MOVE_SECRET|p1a']});
  snapshot.rawLog.push('PRIVATE_RAW_SECRET');
  if (overlay === 'disabled' && snapshot.requests.p1?.active?.[0]) {
    snapshot.requests.p1.active[0].moves![0]!.pp=0;
    snapshot.requests.p1.active[0].moves![1]!.disabled=true;
    snapshot.requests.p1.active[0].trapped=true;
  }
  if (overlay === 'switch' && snapshot.requests.p1) snapshot.requests.p1.forceSwitch=[true];
  return snapshot;
}};
const cb = new ChatBattles(dex, engine, generate);
const configure = (service: ChatBattles, v: any, environment='gen9') => service.command(owner,'configure',v.id,{instanceId:service.instanceId,operationId:op(),revision:v.revision,environment});
const create = (id: string, who=owner) => cb.command(who,'start',id,{id,instanceId:cb.instanceId,issuedAt:Date.now(),operationId:op()});
try {
  const starts = await Promise.allSettled([create('battle_aaaaaaaaaaaaaa'),create('battle_bbbbbbbbbbbbbb',other)]);
  assert.equal(starts.filter(x=>x.status==='fulfilled').length,1);
  assert.equal((await cb.availability(other)).status,'busy');
  assert.equal(JSON.stringify(await cb.availability(other)).includes(owner),false);
  let view = await cb.get(owner,'battle_aaaaaaaaaaaaaa',cb.instanceId);
  await assert.rejects(cb.get(other,view.id,cb.instanceId),(e: unknown)=>e instanceof ChatBattleError && e.status===404);
  await assert.rejects(cb.command(owner,'select',view.id,{instanceId:cb.instanceId,operationId:op(),revision:view.revision,selection:[1,1,2]}));
  assert.equal(view.phase,'rules'); assert.deepEqual(generated,[]);
  assert.deepEqual(view.environments.map(e=>e.id),['standard','gen7','gen8','gen9']);
  await assert.rejects(configure(cb,view,'invalid'));
  assert.equal((await cb.get(owner,view.id,cb.instanceId)).expiresAt,view.expiresAt);
  view=await configure(cb,view);
  assert.deepEqual(generated,[6]);
  assert.ok(view.candidates.every((p:any)=>p.level===50 && p.types.length && p.natureEffect && p.item && p.ability));
  const selection = {instanceId:cb.instanceId,operationId:op(),revision:view.revision,selection:[3,1,2]};
  view=await cb.command(owner,'select',view.id,selection);
  assert.equal(view.phase,'active'); assert.deepEqual(generated,[6,3]);
  assert.deepEqual(await cb.command(owner,'select',view.id,selection),view);
  assert.equal((view.team[0] as {active:boolean}).active,true);
  assert.ok(view.team.every((p:any)=>p.level===50));
  assert.ok(view.actions.some(a=>a.special==='terastallize' && a.label.includes('超能力')));
  assert.ok(view.opponent); assert.ok(!JSON.stringify(view).includes('Swift Swim'));
  assert.ok(!('debug' in view)); assert.ok(!('requests' in view)); assert.ok(!('rawLog' in view));
  overlay='disabled'; view=await cb.get(owner,view.id,cb.instanceId);
  assert.ok(!view.actions.some(a=>/move-[12]$|switch-/.test(a.id)));
  assert.ok(!JSON.stringify(view).includes('PRIVATE_'));
  overlay='switch'; view=await cb.get(owner,view.id,cb.instanceId);
  assert.ok(view.actions.length>0 && view.actions.every(a=>a.id.includes('switch-')));
  overlay=''; view=await cb.get(owner,view.id,cb.instanceId);
  const action = view.actions.find(a=>a.id.endsWith('switch-2'))!;
  const move = {instanceId:cb.instanceId,operationId:op(),revision:view.revision,actionId:action.id};
  const oldRevision=view.revision;
  view=await cb.command(owner,'act',view.id,move);
  assert.equal((view.team[1] as {active:boolean}).active,true);
  assert.deepEqual(await cb.command(owner,'act',view.id,move),view);
  await assert.rejects(cb.command(owner,'act',view.id,{...move,actionId:'different'}));
  await assert.rejects(cb.command(owner,'act',view.id,{...move,operationId:op(),revision:oldRevision}));
  const operationView=await cb.get(owner,view.id,cb.instanceId,move.operationId);
  assert.equal(operationView.operation?.status,'done');
  for(let i=0;i<12 && view.phase==='active';i++) {
    const choice=view.actions.find(a=>a.id.endsWith('tera-1')) || view.actions.find(a=>a.id.endsWith('move-1')) || view.actions[0];
    assert.ok(choice);
    view=await cb.command(owner,'act',view.id,{instanceId:cb.instanceId,operationId:op(),revision:view.revision,actionId:choice.id});
  }
  assert.equal(view.phase,'ended'); assert.equal(view.winner,'p1'); assert.ok(view.summary.includes('你获胜'));
  assert.equal((await cb.availability(other)).status,'free');
  const next=await create('battle_cccccccccccccc',other);
  await cb.command(other,'end',next.id,{instanceId:cb.instanceId,operationId:op(),revision:next.revision});
  await assert.rejects(cb.get(owner,view.id,'old-instance'),(e: unknown)=>e instanceof ChatBattleError && e.code==='instance_changed');
} finally {await cb.close();}

// A real faint must offer only replacements; preserve chosen slot identity after it.
const forcedGenerator: typeof generateRandomBattleTeamPreviewV4 = async (_dex,input={}) => ({...real,
  pokemonSets:Array.from({length:input.teamSize!},(_,i)=>{
    const weak=input.playerId==='p1' && i===0;
    return {species:weak?'Magikarp':'Mewtwo',name:`slot${i}`,level:weak?1:100,
      ability:weak?'Swift Swim':'Pressure',nature:'Serious',moves:weak?['Splash']:['Psychic'],evs:{},ivs:{}};
  })});
const forced=new ChatBattles(dex,createInMemoryBattleService(),forcedGenerator);
try {
  let view=await forced.command(owner,'start','battle_forced_switch',{instanceId:forced.instanceId,issuedAt:Date.now(),operationId:op()});
  view=await configure(forced,view,'standard');
  view=await forced.command(owner,'select',view.id,{instanceId:forced.instanceId,revision:view.revision,operationId:op(),selection:[1,2,3]});
  view=await forced.command(owner,'act',view.id,{instanceId:forced.instanceId,revision:view.revision,operationId:op(),actionId:view.actions.find(a=>a.id.endsWith('move-1'))!.id});
  assert.equal(view.phase,'active');
  assert.ok(view.events.some(e=>e.text==='你方出场宝可梦倒下了'));
  assert.ok(view.actions.length===2 && view.actions.every(a=>a.id.includes('switch-')));
  view=await forced.command(owner,'act',view.id,{instanceId:forced.instanceId,revision:view.revision,operationId:op(),actionId:view.actions.find(a=>a.id.endsWith('switch-2'))!.id});
  assert.equal((view.team[1] as {active:boolean}).active,true);
  view=await forced.command(owner,'end',view.id,{instanceId:forced.instanceId,revision:view.revision,operationId:op()});
  assert.equal(view.phase,'ended');assert.equal(view.winner,'p2');
} finally {await forced.close();}

// Expiry happens without any incoming message; invalid operations/reads cannot renew it.
const expiryEngine=createInMemoryBattleService();let expiryCloses=0;
const expiry=new ChatBattles(dex,{...expiryEngine,async closeSession(id:string){expiryCloses++;await expiryEngine.closeSession(id);}},generate,Date.now,80);
try {
  let v=await expiry.command(owner,'start','battle_timeoutaaaaaa',{instanceId:expiry.instanceId,id:'battle_timeoutaaaaaa',issuedAt:Date.now(),operationId:op()});
  await assert.rejects(expiry.command(owner,'select',v.id,{instanceId:expiry.instanceId,revision:v.revision,operationId:op(),selection:[0,1,2]}));
  assert.equal((await expiry.get(owner,v.id,expiry.instanceId)).expiresAt,v.expiresAt);
  v=await configure(expiry,v);
  const active=await expiry.command(owner,'select',v.id,{instanceId:expiry.instanceId,revision:v.revision,operationId:op(),selection:[1,2,3]});
  await delay(110);
  assert.equal(expiryCloses,1,'the timer must close the engine without a state read');
  const ended=await expiry.get(owner,v.id,expiry.instanceId);
  assert.equal(ended.phase,'expired');assert.equal(ended.winner,null);assert.ok(ended.summary.includes('不判胜负'));
  assert.equal((await expiry.availability(other)).status,'free');
  const next=await expiry.command(other,'start','battle_after_timeout',{instanceId:expiry.instanceId,issuedAt:Date.now(),operationId:op()});
  const late=await expiry.command(owner,'act',v.id,{instanceId:expiry.instanceId,revision:active.revision,operationId:op(),actionId:active.actions[0]!.id});
  assert.equal(late.phase,'expired');assert.equal((await expiry.availability(other)).battle?.id,next.id);
} finally {await expiry.close();}

// Exercise each actual engine environment and transformation, not fabricated request flags.
for (const [environment, special, species, item, move, event] of [
  ['standard','','Charizard','Leftovers','Flamethrower',''],
  ['gen7','mega','Charizard','Charizardite X','Flamethrower','Mega进化'],
  ['gen7','zmove','Pikachu','Electrium Z','Thunderbolt','Z力量'],
  ['gen8','max','Charizard','Leftovers','Flamethrower','极巨化'],
  ['gen9','terastallize','Charizard','Leftovers','Flamethrower','太晶化为水属性'],
] as const) {
  const baseEngine=createInMemoryBattleService();
  const checkedEngine={...baseEngine,async createBattleSession(input: Parameters<typeof baseEngine.createBattleSession>[0]) {
    assert.ok('ruleSet' in input);
    assert.ok(input.players.every(p=>p.team.every(s=>s.level===50)));
    assert.equal(input.ruleSet,environment);
    const snapshot=await baseEngine.createBattleSession(input);
    assert.ok(snapshot.requests.p1?.side?.pokemon.every(p=>p.details.includes('L50')));
    return snapshot;
  }};
  const generator: typeof generateRandomBattleTeamPreviewV4 = async (_dex,input={}) => ({...real,
    pokemonSets:Array.from({length:input.teamSize!},()=>input.playerId==='p1'
      ? {species,name:species,item,ability:species==='Pikachu'?'Static':'Blaze',nature:'Modest',level:99,teraType:'Water',moves:[move,'Protect'],evs:{},ivs:{}}
      : {species:'Magikarp',name:'Magikarp',ability:'Swift Swim',nature:'Serious',level:1,moves:['Splash'],evs:{},ivs:{}})});
  const service=new ChatBattles(dex,checkedEngine,generator);
  try {
    let v=await service.command(owner,'start',`special_${environment}_${special||'none'}`,{instanceId:service.instanceId,issuedAt:Date.now(),operationId:op()});
    v=await configure(service,v,environment);
    const card=v.candidates[0] as any;
    assert.equal(card.nature,'内敛');assert.match(card.natureEffect,/特攻↑10%/);assert.match(card.natureEffect,/攻击↓10%/);
    assert.ok(card.item && card.types.length && card.ability);
    v=await service.command(owner,'select',v.id,{instanceId:service.instanceId,revision:v.revision,operationId:op(),selection:[1,2,3]});
    assert.ok(v.actions.filter(a=>a.id.endsWith('-move-1')).every(a=>!a.special));
    if (special) {
      const choice=v.actions.find(a=>a.special===special)!;
      assert.ok(choice,`${environment} must expose ${special}`);
      if(special==='terastallize') assert.match(choice.label,/水/);
      v=await service.command(owner,'act',v.id,{instanceId:service.instanceId,revision:v.revision,operationId:op(),actionId:choice.id});
      assert.equal(v.phase,'active',`${special} execution failed: ${v.summary}`);
      assert.ok(v.events.some(e=>e.text.includes(event)),JSON.stringify(v.events));
    } else assert.ok(v.actions.every(a=>!a.special),'ordinary rules must never expose special actions');
  } finally {await service.close();}
}
// Production Gen7 generation reuses CB's formal guarantee, with usable held items.
for (const size of [6,3]) {
  const generated=await generateChatTeam(dex,{ruleSet:'gen7',teamSize:size,seed:`guarantee-${size}`});
  assert.ok(generated.diagnostics.ok);assert.equal(generated.pokemonSets.length,size);
  assert.ok(generated.pokemonSets.filter(s=>chatSetSpecials(dex,s).includes('Mega进化')).length>=2);
  assert.ok(generated.pokemonSets.some(s=>chatSetSpecials(dex,s).includes('Z招式')));
  const service=new ChatBattles(dex);
  try {
    let v=await service.command(owner,'start',`guaranteed_gen7_${size}`,{instanceId:service.instanceId,issuedAt:Date.now(),operationId:op()});
    v=await configure(service,v,'gen7');
    const megaSlot=v.candidates.findIndex((p:any)=>p.mechanics.includes('Mega进化'))+1;
    const rest=[1,2,3,4,5,6].filter(n=>n!==megaSlot).slice(0,2);
    v=await service.command(owner,'select',v.id,{instanceId:service.instanceId,revision:v.revision,operationId:op(),selection:[megaSlot,...rest]});
    assert.equal(v.phase,'active');assert.ok(v.actions.some(a=>a.special==='mega'));
    v=await service.command(owner,'act',v.id,{instanceId:service.instanceId,revision:v.revision,operationId:op(),actionId:v.actions.find(a=>a.special==='mega')!.id});
    assert.notEqual(v.phase,'failed');assert.ok(v.events.some(e=>e.text==='你方进行了Mega进化'));
  }finally{await service.close();}
}
// Rules selection is itself exclusive and expires with no further incoming request.
const rulesExpiry=new ChatBattles(dex,createInMemoryBattleService(),generate,Date.now,30);
try {
  const v=await rulesExpiry.command(owner,'start','battle_rules_expiry',{instanceId:rulesExpiry.instanceId,issuedAt:Date.now(),operationId:op()});
  await delay(60);
  assert.equal((await rulesExpiry.availability(other)).status,'free');
  const ended=await rulesExpiry.get(owner,v.id,rulesExpiry.instanceId);
  assert.equal(ended.phase,'expired'); assert.equal(ended.winner,null);
} finally {await rulesExpiry.close();}

const queryCb=new ChatBattles(dex);
for (const [path,status] of [['/dex/search?query=烈咬陆鲨',200],['/dex/pokemon/garchomp',200],['/dex/moves/psychic',200],['/dex/abilities/pressure',200],['/dex/items/leftovers',200],['/dex/pokemon/notapokemon',404],['/dex/search?category=trainers',400],['/dex/search?limit=200',400]] as const) {
  assert.equal((await pokemonHttp(queryCb,'GET',new URL(path,'http://localhost'),owner,'',null,'test')).status,status);
}
const dexRead=async(path:string)=>(await pokemonHttp(queryCb,'GET',new URL(path,'http://localhost'),owner,'',null,'test')).body as any;
const forms=await dexRead('/dex/search?query=喷火龙');
assert.ok(forms.rows.some((r:any)=>r.id==='charizard'));
assert.ok(forms.rows.some((r:any)=>r.id==='charizardmegax'));
assert.equal((await dexRead('/dex/search?query=notapokemonzzzz')).rows.length,0);
const first=await dexRead('/dex/pokemon/charizard?section=learnset&offset=0');
const second=await dexRead('/dex/pokemon/charizard?section=learnset&offset=20');
assert.equal(first.detail.learnset.length,20);assert.equal(first.detail.hasMore,true);
assert.equal(second.detail.learnset.length,20);assert.notDeepEqual(first.detail.learnset,second.detail.learnset);
assert.ok(first.detail.formes.length>1);assert.equal(first.detail.nameZh,'喷火龙');
assert.equal((await dexRead('/dex/moves/psychic')).detail.power,90);
await queryCb.close();

// Actual HTTP mounting and auth; legacy health remains compatible.
const server=createBattleApiServer({host:'127.0.0.1',port:0,storageKind:'memory',configOverrides:{token:'',pokemonToken:'test-token',pokemonEnabled:true}});
try {
  await server.start();
  assert.equal((await fetch(server.baseUrl+'/dex/search')).status,401);
  const headers={authorization:'Bearer test-token','x-changebattle-chat-owner':owner};
  const health=await (await fetch(server.baseUrl+'/health')).json() as any;
  assert.equal(health.ok,true);assert.equal(health.chatContractVersion,2);
  assert.equal((await fetch(server.baseUrl+'/dex/search?query=pikachu',{headers})).status,200);
  assert.equal((await fetch(server.baseUrl+'/chat-battles/availability',{headers})).status,200);
  assert.equal((await fetch(server.baseUrl+'/chat-battles/availability',{headers:{authorization:'Bearer wrong'}})).status,401);
}finally{await server.close();}
const disabled=createBattleApiServer({host:'127.0.0.1',port:0,storageKind:'memory',configOverrides:{token:'',pokemonToken:'',pokemonEnabled:true}});
try {
  await disabled.start();
  assert.equal((await fetch(disabled.baseUrl+'/dex/search')).status,503);
  const health=await (await fetch(disabled.baseUrl+'/health')).json() as any;
  assert.equal(health.ok,true);assert.equal(health.pokemonEnabled,false);
}finally{await disabled.close();}
console.log('PASS chat battles: rules selection, level50, nature/item/type cards, real Mega/Z/Max/Tera, random generator, global slot, selection, natural 3v3 finish, forced switch, forfeit, identity, actions, idempotency, idle timer, projection, dex and HTTP auth');
