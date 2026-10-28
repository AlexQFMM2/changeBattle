import {ChatBattles, ChatBattleError, type ChatCommand} from './chatBattle.js';

const CATEGORIES = ['pokemon', 'moves', 'abilities', 'items'] as const;
type Category = typeof CATEGORIES[number];
function category(value: unknown): Category {
  if (!CATEGORIES.includes(value as Category)) throw new ChatBattleError(400, 'invalid_category', '不支持的图鉴分类');
  return value as Category;
}
function integer(value: string | null, fallback: number, max: number) {
  const n = value === null ? fallback : Number(value);
  if (!Number.isInteger(n) || n < 0 || n > max) throw new ChatBattleError(400, 'invalid_input', '分页参数超出范围');
  return n;
}
function pick(value: object, fields: string[]) { return Object.fromEntries(fields.filter(k => k in value).map(k => [k, (value as Record<string, unknown>)[k]])); }
export async function pokemonHttp(battles: ChatBattles, method: string, url: URL, owner: string, instance: string, body: unknown, version: string) {
  const path = url.pathname;
  try {
    if (method === 'GET' && path.startsWith('/dex/')) {
      const dex = battles.dex; const source = {source: 'ChangeBattle', version, ruleset: 'current-project-data'};
      if (path === '/dex/search') {
        const query = url.searchParams.get('query') || '';
        if (query.length > 120) throw new ChatBattleError(400, 'invalid_input', '查询文字过长');
        const result = dex.searchDex({category: category(url.searchParams.get('category') || 'pokemon'), query,
          offset: integer(url.searchParams.get('offset'), 0, 10000), limit: Math.max(1, integer(url.searchParams.get('limit'), 10, 20))});
        return {status: 200, body: {...source, ...result, rows: result.rows.map(r => pick(r, ['id', 'category', 'name', 'nameZh', 'subtitle', 'description', 'tags']))}};
      }
      const match = /^\/dex\/([^/]+)\/([a-zA-Z0-9-]{1,100})$/.exec(path);
      if (!match) throw new ChatBattleError(400, 'invalid_input', '图鉴身份无效');
      const type = category(match[1]); const id = match[2]!;
      let detail: object;
      try {
        detail = type === 'pokemon' ? dex.getPokemonDetail(id) : type === 'moves' ? dex.getMoveDetail(id) : type === 'abilities' ? dex.getAbilityDetail(id) : dex.getItemDetail(id);
      } catch { throw new ChatBattleError(404, 'not_found', '没有找到这条图鉴记录'); }
      const fields = ['id','name','nameZh','num','baseSpecies','forme','types','baseStats','abilities','evolutionChain','evolutionEdges','formes','type','category','power','accuracy','pp','priority','target','description','kindLabel','effectSummary'];
      const result = pick(detail, fields);
      if (type === 'pokemon' && url.searchParams.get('section') === 'learnset') {
        const moves = (detail as ReturnType<typeof dex.getPokemonDetail>).learnset;
        const offset = integer(url.searchParams.get('offset'), 0, 10000);
        result.learnset = moves.slice(offset, offset + 20); result.total = moves.length; result.hasMore = offset + 20 < moves.length;
      }
      return {status: 200, body: {...source, category: type, detail: result}};
    }
    if (method === 'GET' && path === '/chat-battles/availability') return {status: 200, body: await battles.availability(owner)};
    const match = /^\/chat-battles\/([a-zA-Z0-9_-]{16,100})(?:\/(select|actions|end))?$/.exec(path);
    if (method === 'GET' && match && !match[2]) return {status: 200, body: await battles.get(owner, match[1]!, instance, url.searchParams.get('operationId') || undefined)};
    if (method === 'POST' && (path === '/chat-battles' || match?.[2])) {
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ChatBattleError(400, 'invalid_input', '请求格式无效');
      const data = body as Record<string, unknown>;
      const allowed = new Set(['id','instanceId','operationId','issuedAt','revision','selection','actionId']);
      if (Object.keys(data).some(k => !allowed.has(k))) throw new ChatBattleError(400, 'invalid_input', '包含不支持的参数');
      const kind = path === '/chat-battles' ? 'start' : match![2] === 'actions' ? 'act' : match![2] as 'select' | 'end';
      return {status: 200, body: await battles.command(owner, kind, path === '/chat-battles' ? data.id as string : match![1]!, data as ChatCommand)};
    }
    throw new ChatBattleError(404, 'not_found', '没有这个接口');
  } catch (error) {
    if (error instanceof ChatBattleError) return {status: error.status, body: {error: error.code, message: error.message}};
    return {status: 500, body: {error: 'pokemon_service_error', message: '宝可梦服务暂时不可用'}};
  }
}
