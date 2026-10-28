/** Standalone chat battles; deliberately separate from formal V5 rooms. */
import {randomUUID} from 'node:crypto';
import {createShowdownDexService} from '@changebattle-v2/showdown-dex-core';
import {createInMemoryBattleService} from '@changebattle-v2/showdown-battle-core';
import {validateShowdownChoiceCommandV4} from '@changebattle-v2/showdown-battle-core/showdownCommand';
import type {BattleServiceSnapshotV4, BattleServiceSessionInputV4, BattleServicePokemonSetV4} from '@changebattle-v2/showdown-battle-core/types';
import {generateRandomBattleTeamPreviewV4} from './teamGenerator.js';

export class ChatBattleError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const CHAT_IDLE_MS = 5 * 60_000;
const RETENTION_MS = 24 * 60 * 60_000;
const MAX_RECORDS = 200;
type Dex = ReturnType<typeof createShowdownDexService>;
type Engine = ReturnType<typeof createInMemoryBattleService>;
type Phase = 'preparing' | 'selecting' | 'starting' | 'active' | 'ended' | 'cancelled' | 'expired' | 'failed';
export type ChatBattleView = {
  id: string; instanceId: string; phase: Phase; revision: number; expiresAt: number;
  turn: number; winner: string | null; reason: string; summary: string;
  opponent: {name: string; condition: string} | null;
  candidates: unknown[]; team: unknown[]; actions: Array<{id: string; label: string}>;
  events: Array<{id: number; text: string}>; eventsTruncated: boolean;
};
type RecordState = {
  id: string; owner: string; phase: Phase; revision: number; deadline: number; finished: number;
  candidates: BattleServicePokemonSetV4[]; chosen: BattleServicePokemonSetV4[];
  sessionId?: string; snapshot?: BattleServiceSnapshotV4; roster: string[];
  opponent: {name: string; condition: string} | null;
  seenStreams: string[]; events: Array<{id: number; text: string}>; eventCount: number; truncated: boolean;
  commands: Map<string, {fingerprint: string; view?: ChatBattleView; error?: ChatBattleError}>;
  reason: string; summary: string; timer?: ReturnType<typeof setTimeout>;
};
export type ChatCommand = {operationId: string; instanceId: string; revision?: number; id?: string; issuedAt?: number; selection?: number[]; actionId?: string};
const terminal = (r: RecordState) => ['ended', 'cancelled', 'expired', 'failed'].includes(r.phase);
export function chatIdentifier(value: unknown, name: string): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(value)) throw new ChatBattleError(400, 'invalid_input', `${name} 无效`);
  return value;
}

export class ChatBattles {
  readonly instanceId = randomUUID();
  private records = new Map<string, RecordState>();
  private active?: string;
  private tail: Promise<unknown> = Promise.resolve();
  constructor(readonly dex: Dex = createShowdownDexService(), private engine: Engine = createInMemoryBattleService(),
    private generate = generateRandomBattleTeamPreviewV4, private now = Date.now, private idleMs = CHAT_IDLE_MS) {}

  private serial<T>(fn: () => Promise<T>): Promise<T> {
    const task = this.tail.then(fn, fn); this.tail = task.catch(() => {}); return task;
  }
  private prune() {
    for (const [id, r] of this.records) if (terminal(r) && this.now() - r.finished > RETENTION_MS) this.records.delete(id);
  }
  private owned(owner: string, id: string): RecordState {
    chatIdentifier(owner, 'owner'); chatIdentifier(id, 'id');
    const r = this.records.get(id);
    if (!r || r.owner !== owner) throw new ChatBattleError(404, 'not_found', '本局不存在或已失效');
    return r;
  }
  private arm(r: RecordState) {
    clearTimeout(r.timer); r.deadline = this.now() + this.idleMs;
    r.timer = setTimeout(() => { void this.serial(async () => { await this.expire(r); }).catch(() => {}); }, this.idleMs + 1);
    r.timer.unref?.();
  }
  private async expire(r: RecordState) {
    if (!terminal(r) && r.deadline && this.now() >= r.deadline) {
      if (r.sessionId) {
        try { this.ingest(r, await this.engine.getSnapshot(r.sessionId)); await this.checkEnded(r); }
        catch { await this.finish(r, 'failed', '对战状态丢失，本局中断，不判胜负。'); }
      }
      if (!terminal(r)) await this.finish(r, 'expired', '等待操作超过 5 分钟，超时中断，不判胜负。');
    }
  }
  private async finish(r: RecordState, phase: Phase, reason: string) {
    if (terminal(r)) return;
    r.phase = phase; r.reason = reason; r.finished = this.now(); r.revision++; clearTimeout(r.timer);
    const winner = r.snapshot?.winner;
    const result = phase === 'ended' ? (winner === 'p1' ? '你获胜了！' : winner === 'p2' ? '夏莉获胜。' : '本局平局。') : reason;
    const highlights = r.events.slice(-4).map(e => e.text).join('；');
    r.summary = `宝可梦对战结束：${result}\n引擎回合：${r.snapshot?.turn || 0}。${highlights ? `\n战况：${highlights}` : ''}`;
    if (this.active === r.id) this.active = undefined;
    if (r.sessionId) await this.engine.closeSession(r.sessionId).catch(() => {});
  }
  async availability(owner: string) {
    chatIdentifier(owner, 'owner');
    return this.serial(async () => {
      this.prune(); const r = this.active ? this.records.get(this.active) : undefined;
      if (r) await this.expire(r);
      return {instanceId: this.instanceId, status: !r || terminal(r) ? 'free' : r.owner === owner ? 'self' : 'busy',
        ...((r && !terminal(r) && r.owner === owner) ? {battle: this.view(r)} : {})};
    });
  }
  async get(owner: string, id: string, instanceId: string, operationId?: string) {
    return this.serial(async () => {
      this.epoch(instanceId); const r = this.owned(owner, id); await this.expire(r);
      if (!terminal(r) && r.sessionId) {
        try { this.ingest(r, await this.engine.getSnapshot(r.sessionId)); await this.checkEnded(r); }
        catch { await this.finish(r, 'failed', '对战服务状态丢失，本局中断，不判胜负。'); }
      }
      const command = operationId ? r.commands.get(operationId) : undefined;
      return {...this.view(r), ...(operationId ? {operation: {status: !command ? 'not_found' : command.error ? 'rejected' : 'done'}} : {})};
    });
  }
  private epoch(id: string) { if (id !== this.instanceId) throw new ChatBattleError(409, 'instance_changed', '对战服务已重启，本局中断'); }
  async command(owner: string, kind: 'start' | 'select' | 'act' | 'end', id: string, input: ChatCommand) {
    chatIdentifier(owner, 'owner'); chatIdentifier(id, 'id'); chatIdentifier(input.operationId, 'operationId');
    return this.serial(async () => {
      this.epoch(input.instanceId); this.prune();
      let r = this.records.get(id);
      if (r && r.owner !== owner) throw new ChatBattleError(404, 'not_found', '本局不存在');
      const fingerprint = JSON.stringify([kind, input.revision ?? null, input.selection ?? null, input.actionId ?? null, input.issuedAt ?? null]);
      const old = r?.commands.get(input.operationId);
      if (old) {
        if (old.fingerprint !== fingerprint) throw new ChatBattleError(409, 'operation_conflict', '同一消息不能执行不同操作');
        if (old.error) throw old.error;
        return structuredClone(old.view || this.view(r!));
      }
      if (kind === 'start') {
        if (r) return this.view(r);
        if (!Number.isFinite(input.issuedAt) || this.now() - input.issuedAt! > 300_000 || input.issuedAt! > this.now() + 30_000)
          throw new ChatBattleError(409, 'start_expired', '开局请求已过期，请重新发起');
        const active = this.active && this.records.get(this.active);
        if (active) { await this.expire(active); if (!terminal(active)) {
          if (active.owner === owner) return this.view(active);
          throw new ChatBattleError(409, 'busy', '正在和其他人进行宝可梦对战，等结束再说吧。');
        } }
        if (this.records.size >= MAX_RECORDS) throw new ChatBattleError(503, 'capacity', '对局记录容量已满，请稍后再试');
        r = {id, owner, phase: 'preparing', revision: 0, deadline: 0, finished: 0, candidates: [], chosen: [], roster: [],
          opponent: null, seenStreams: [], events: [], eventCount: 0, truncated: false, commands: new Map(), reason: '', summary: ''};
        this.records.set(id, r); this.active = id;
      } else {
        r = this.owned(owner, id); await this.expire(r);
        if (terminal(r)) return this.view(r);
        if (input.revision !== r.revision) throw new ChatBattleError(409, 'stale', '战况已变化，请查看当前选项后重新指令');
      }
      if (r.commands.size >= 1000) { await this.finish(r, 'failed', '本局操作数量达到上限，已中断。'); return this.view(r); }
      const command: {fingerprint: string; view?: ChatBattleView; error?: ChatBattleError} = {fingerprint};
      r.commands.set(input.operationId, command);
      try {
        if (kind === 'start') { r.candidates = await this.team(6, 'p1'); r.phase = 'selecting'; r.revision++; this.arm(r); }
        if (kind === 'select') {
          const selection = input.selection;
          if (r.phase !== 'selecting' || !Array.isArray(selection) || selection.length !== 3 || new Set(selection).size !== 3 || selection.some(n => !Number.isInteger(n) || n < 1 || n > 6))
            throw new ChatBattleError(400, 'invalid_selection', '请选择三个不同的编号（1～6），第一只是首发');
          r.phase = 'starting'; r.chosen = selection.map(n => r!.candidates[n - 1]!);
          const opponent = await this.team(3, 'p2');
          const players = [r.chosen, opponent].map((team, index) => {
            const playerId = index === 0 ? 'p1' as const : 'p2' as const;
            const controller = index === 0 ? 'local' as const : 'ai' as const;
            const name = index === 0 ? '玩家' : '夏莉'; const alliance = index === 0 ? 'near' as const : 'far' as const;
            return {playerId, controller, name, alliance, team, allowedSpecialSystems: ['terastallize' as const], aiProfile: {level: 'normal' as const, preference: 'balanced' as const},
              draft: {playerId, controller, name, alliance, avatar: '', localTeam: {id: playerId, name, pokemon: []}, bag: {items: []}}};
          });
          const snapshot = await this.engine.createBattleSession({runId: id, nodeId: 'chat', mode: 'singles', ruleSet: 'gen9', seed: randomUUID(), players} satisfies BattleServiceSessionInputV4);
          r.sessionId = snapshot.id; r.phase = 'active'; this.ingest(r, snapshot); r.revision++; this.arm(r); await this.checkEnded(r);
        }
        if (kind === 'act') {
          if (r.phase !== 'active' || !r.sessionId) throw new ChatBattleError(409, 'wrong_phase', '请先选择出战队伍');
          const action = this.choices(r).find(a => a.id === input.actionId);
          if (!action) throw new ChatBattleError(400, 'invalid_action', '请选择当前合法招式或换人选项');
          this.ingest(r, await this.engine.submitChoice({sessionId: r.sessionId, playerId: 'p1', choice: action.choice}));
          r.revision++; this.arm(r); await this.checkEnded(r);
        }
        if (kind === 'end') {
          if (r.sessionId) { this.ingest(r, await this.engine.submitChoice({sessionId: r.sessionId, playerId: 'p1', choice: 'forfeit'})); await this.finish(r, 'ended', '玩家认输'); }
          else await this.finish(r, 'cancelled', '已取消选队，不判胜负。');
        }
        command.view = this.view(r);
        for (const previous of Array.from(r.commands.values()).slice(0, -16)) delete previous.view;
        return structuredClone(command.view);
      } catch (error) {
        if (error instanceof ChatBattleError) { command.error = error; throw error; }
        await this.finish(r, 'failed', '引擎操作未能确认，本局中断，不判胜负。');
        command.view = this.view(r);
        for (const previous of Array.from(r.commands.values()).slice(0, -16)) delete previous.view;
        return structuredClone(command.view);
      }
    });
  }
  private async team(size: number, playerId: 'p1' | 'p2'): Promise<BattleServicePokemonSetV4[]> {
    const result = await this.generate(this.dex, {ruleSet: 'gen9', mode: 'singles', teamSize: size, playerId, seed: randomUUID(), includeLocalTeam: false});
    if (!result.diagnostics.ok || result.pokemonSets.length !== size) throw new Error('team generation failed');
    return result.pokemonSets.map(s => {
      this.dex.getPokemonDetail(s.species); this.dex.getAbilityDetail(s.ability); s.moves.forEach(m => this.dex.getMoveDetail(m));
      if (s.item) this.dex.getItemDetail(s.item);
      return {...s, evs: s.evs || {}, ivs: s.ivs || {}};
    });
  }
  private async checkEnded(r: RecordState) {
    if (r.snapshot?.status === 'ended') await this.finish(r, 'ended', '引擎结算');
    else if (r.snapshot?.status === 'blocked') await this.finish(r, 'failed', '引擎中断，不判胜负。');
  }
  private label(category: 'pokemon' | 'moves' | 'abilities' | 'items', name: string) {
    try { return this.dex.translateDexLabel(category, name); } catch { return name; }
  }
  private ingest(r: RecordState, snapshot: BattleServiceSnapshotV4) {
    const before = JSON.stringify(r.snapshot?.requests.p1);
    r.snapshot = snapshot;
    if (before !== JSON.stringify(snapshot.requests.p1)) r.revision++;
    const side = snapshot.requests.p1?.side?.pokemon || snapshot.debug.latestSidePokemon?.p1 || [];
    if (!r.roster.length) r.roster = side.map(p => p.ident);
    const streams = snapshot.debug.playerStreams.filter(s => s.playerId === 'p1');
    const keys = streams.map(s => JSON.stringify([s.at, s.chunk]));
    let overlap = Math.min(keys.length, r.seenStreams.length);
    while (overlap && !r.seenStreams.slice(-overlap).every((k, i) => k === keys[i])) overlap--;
    if (!overlap && r.seenStreams.length && keys.length) r.truncated = true;
    for (const entry of streams.slice(overlap)) for (const line of entry.lines) {
      const p = line.split('|'); let text = '';
      const who = (s: string) => s?.startsWith('p1') ? '你方' : s?.startsWith('p2') ? '夏莉方' : '';
      if (p[1] === 'move') text = `${who(p[2]!)}使用了${this.label('moves', p[3] || '')}`;
      if (p[1] === 'faint') text = `${who(p[2]!)}出场宝可梦倒下了`;
      if (p[1] === 'switch' || p[1] === 'drag') text = `${who(p[2]!)}换上${this.label('pokemon', (p[3] || '').split(',')[0]!)}`;
      if (p[1] === '-terastallize') text = `${who(p[2]!)}进行了太晶化`;
      if ((p[1] === 'switch' || p[1] === 'drag') && p[2]?.startsWith('p2'))
        r.opponent = {name: this.label('pokemon', (p[3] || '').split(',')[0]!), condition: p[4] || ''};
      if (['-damage', '-heal', 'faint'].includes(p[1] || '') && p[2]?.startsWith('p2') && r.opponent)
        r.opponent.condition = p[1] === 'faint' ? '0 fnt' : (p[3] || '');
      if (text) r.events.push({id: ++r.eventCount, text});
    }
    r.events = r.events.slice(-24); r.seenStreams = keys;
  }
  private choices(r: RecordState) {
    const request = r.snapshot?.requests.p1;
    if (r.phase !== 'active' || !request || request.wait) return [];
    const choices: Array<{id: string; label: string; choice: string}> = [];
    const add = (id: string, label: string, choice: string) => {
      if (validateShowdownChoiceCommandV4({request, choice}).ok) choices.push({id: `${r.revision}-${id}`, label, choice});
    };
    request.active?.[0]?.moves?.forEach((m, i) => {
      add(`move-${i + 1}`, `第${i + 1}招 ${this.label('moves', m.move || m.id || '')}（PP ${m.pp ?? '?'}）`, `move ${i + 1}`);
      if (request.active?.[0]?.canTerastallize) add(`tera-${i + 1}`, `太晶化并使用第${i + 1}招 ${this.label('moves', m.move || m.id || '')}`, `move ${i + 1} terastallize`);
    });
    request.side?.pokemon.forEach((p, i) => {
      const slot = r.roster.indexOf(p.ident) + 1;
      if (slot) add(`switch-${slot}`, `换第${slot}只 ${this.label('pokemon', p.details.split(',')[0]!)}`, `switch ${i + 1}`);
    });
    return choices;
  }
  private view(r: RecordState): ChatBattleView {
    const side = r.snapshot?.requests.p1?.side?.pokemon || r.snapshot?.debug.latestSidePokemon?.p1 || [];
    return {id: r.id, instanceId: this.instanceId, phase: r.phase, revision: r.revision, expiresAt: r.deadline,
      turn: r.snapshot?.turn || 0, winner: r.phase === 'ended' ? r.snapshot?.winner || null : null, reason: r.reason, summary: r.summary,
      candidates: r.phase === 'selecting' ? r.candidates.map((s, i) => ({slot: i + 1, name: this.label('pokemon', s.species), level: s.level,
        types: this.dex.getPokemonDetail(s.species).types, moves: s.moves.map(m => this.label('moves', m)), ability: this.label('abilities', s.ability), item: this.label('items', s.item || '')})) : [],
      team: r.roster.map((ident, i) => { const p = side.find(p => p.ident === ident); return {slot: i + 1, name: this.label('pokemon', (p?.details || r.chosen[i]?.species || '').split(',')[0]!), condition: p?.condition || '', active: Boolean(p?.active)}; }),
      opponent: r.opponent,
      actions: this.choices(r).map(({id, label}) => ({id, label})), events: r.events, eventsTruncated: r.truncated};
  }
  async close() { await this.serial(async () => { for (const r of this.records.values()) await this.finish(r, 'failed', '服务关闭，本局中断。'); }); }
}
