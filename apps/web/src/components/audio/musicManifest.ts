export type BgmSceneV2 = "nonBattle" | "rest" | "battle" | "boss";

export type MusicTrackV2 = {
  id: string;
  title: string;
  path: string;
};

export const BGM_SCENE_LABELS_V2: Record<BgmSceneV2, string> = {
  nonBattle: "非战斗",
  rest: "休息室",
  battle: "战斗",
  boss: "决胜",
};

export const MUSIC_MANIFEST_V2: Record<BgmSceneV2, MusicTrackV2[]> = {
  nonBattle: [
    {id: "nonbattle-yurenu-omoi", title: "摇れぬ想い", path: "music/nonbattle/yurenu-omoi.ogg"},
    {id: "nonbattle-mishiro-town", title: "未白镇 / 天元镇", path: "music/nonbattle/mishiro-town.ogg"},
    {id: "nonbattle-verdanturf-town", title: "绿荫镇", path: "music/nonbattle/verdanturf-town.ogg"},
  ],
  rest: [
    {id: "rest-pokemon-center", title: "宝可梦中心", path: "music/rest/pokemon-center.ogg"},
  ],
  battle: [
    {id: "battle-galar-gym", title: "战斗！伽勒尔道馆主", path: "music/battle/galar-gym-leader.ogg"},
    {id: "battle-trainer", title: "战斗！训练家", path: "music/battle/trainer.ogg"},
    {id: "battle-johto-trainer", title: "战斗！城都训练家", path: "music/battle/johto-trainer.ogg"},
    {id: "battle-kanto-trainer", title: "战斗！关都训练家", path: "music/battle/kanto-trainer.ogg"},
  ],
  boss: [
    {id: "boss-together", title: "Together", path: "music/boss/together.ogg"},
    {id: "boss-xyz", title: "XY&Z", path: "music/boss/xyz.ogg"},
    {id: "boss-mezase-pokemon-master", title: "目标是宝可梦大师", path: "music/boss/mezase-pokemon-master.ogg"},
    {id: "boss-type-wild", title: "Type: Wild", path: "music/boss/type-wild.ogg"},
    {id: "boss-battle-frontier", title: "对战开拓区", path: "music/boss/battle-frontier.ogg"},
  ],
};
