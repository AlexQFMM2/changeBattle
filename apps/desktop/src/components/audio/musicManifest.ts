export type BgmScene = "nonBattle" | "rest" | "battle" | "boss";

export type MusicTrack = {
  id: string;
  title: string;
  path: string;
};

export const BGM_SCENE_LABELS: Record<BgmScene, string> = {
  nonBattle: "非战斗",
  rest: "休整",
  battle: "战斗",
  boss: "赛点",
};

export const MUSIC_MANIFEST: Record<BgmScene, MusicTrack[]> = {
  nonBattle: [
    {id: "nonbattle-yurenu-omoi", title: "摇れぬ想い", path: "assets/music/非战斗bgm/Kyle Xian - Game Freak - 揺れぬ想い (黑白)_L.ogg"},
    {id: "nonbattle-mishiro-town", title: "未白镇 / 天元镇", path: "assets/music/非战斗bgm/Kyle Xian - Game Freak - 未白镇_天元镇 ~ ミシロタウン (宝石)_L.ogg"},
    {id: "nonbattle-verdanturf-town", title: "绿荫镇", path: "assets/music/非战斗bgm/Kyle Xian - Game Freak - 绿荫镇(西达镇シダケタウン (宝石) (宝石)_L.ogg"},
  ],
  rest: [
    {id: "rest-pokemon-center", title: "宝可梦中心", path: "assets/music/休整bgm/Kyle Xian - Game Freak - 精灵宝可梦中心 ~ ポケモンセンター (历代)_L.ogg"},
  ],
  battle: [
    {id: "battle-galar-gym", title: "战斗！伽勒尔道馆主", path: "assets/music/战斗开局bgm/Kyle Xian - 戦闘! ジムリーダー(ガラル) ~ VS 道馆主（伽勒尔）_L.ogg"},
    {id: "battle-trainer", title: "战斗！训练家", path: "assets/music/战斗开局bgm/増田順一 - 戦闘!トレーナー (战斗！训练家)_L.ogg"},
    {id: "battle-johto-trainer", title: "战斗！城都训练家", path: "assets/music/战斗开局bgm/増田順一 - 戦闘!トレーナー(ジョウト) (战斗！训练家（城都）)_L.ogg"},
    {id: "battle-kanto-trainer", title: "战斗！关都训练家", path: "assets/music/战斗开局bgm/増田順一 - 戦闘！トレーナー（カントー） (战斗！训练家（关都）)_L.ogg"},
  ],
  boss: [
    {id: "boss-together", title: "Together", path: "assets/music/赛点切换bgm/Kyle Xian - Together (Inst_)_L.ogg"},
    {id: "boss-xyz", title: "XY&Z", path: "assets/music/赛点切换bgm/Kyle Xian - XY&Z (Inst_)_L.ogg"},
    {id: "boss-mezase-pokemon-master", title: "目标是宝可梦大师", path: "assets/music/赛点切换bgm/Kyle Xian - めざせポケモンマスター  (目标是宝可梦大师) (Inst_)_L.ogg"},
    {id: "boss-type-wild", title: "Type: Wild", path: "assets/music/赛点切换bgm/Kyle Xian - タイプ_ワイルド ~ Type_ Wild (Inst_)_L.ogg"},
    {id: "boss-battle-frontier", title: "对战开拓区", path: "assets/music/赛点切换bgm/Kyle Xian - バトルフロンティア ~ 对战开拓区 (Inst_)_L.ogg"},
  ],
};
