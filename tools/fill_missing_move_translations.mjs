import {readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
import {GameService} from "../packages/game-service/src/index.ts";

const projectRoot = path.resolve(import.meta.dirname, "..");
const detailsPath = path.join(projectRoot, "data", "zh_cn_details.json");
const overridesPath = path.join(projectRoot, "data", "zh_cn_overrides.json");

const TYPE_ZH = {
  Normal: "一般",
  Fighting: "格斗",
  Flying: "飞行",
  Poison: "毒",
  Ground: "地面",
  Rock: "岩石",
  Bug: "虫",
  Ghost: "幽灵",
  Steel: "钢",
  Fire: "火",
  Water: "水",
  Grass: "草",
  Electric: "电",
  Psychic: "超能力",
  Ice: "冰",
  Dragon: "龙",
  Dark: "恶",
  Fairy: "妖精",
};

const CATEGORY_ZH = {
  Physical: "物理",
  Special: "特殊",
  Status: "变化",
};

const MANUAL_DESCRIPTIONS = {
  "Alluring Voice": "用引人入胜的声音攻击对手。若对手本回合能力提高，则必定使其混乱。",
  "Apple Acid": "用酸液攻击对手。必定降低对手的特防。",
  "Aqua Cutter": "用水之刀刃切开对手。容易击中要害。",
  "Armor Cannon": "用盔甲化作的炮弹猛烈攻击。使用后自己的防御和特防会降低。",
  "Astral Barrage": "用幽灵般的冲击攻击相邻的对手。没有追加效果。",
  "Aura Wheel": "莫鲁贝可满腹花纹时为电属性，空腹花纹时为恶属性。攻击后必定提高自己的速度。",
  "Axe Kick": "用斧头般的踢击攻击对手。有时使对手混乱；如果攻击落空，自己会损失最大 HP 的一半。",
  "Barb Barrage": "用有毒倒刺攻击对手。有时使对手中毒；若对手已中毒，威力会变成 2 倍。",
  "Behemoth Bash": "用巨兽般的冲撞攻击对手。没有追加效果。",
  "Behemoth Blade": "用巨兽般的利刃斩击对手。没有追加效果。",
  "Bitter Blade": "用苦涩的火刃劈开对手。可以回复给予对手伤害的一半 HP。",
  "Bitter Malice": "用怨念攻击对手。必定降低对手的攻击。",
  "Bleakwind Storm": "用冷冽暴风攻击对手。有时降低对手的速度；下雨时必定命中。",
  "Blood Moon": "释放血月般的光芒攻击对手。使用后的下一回合无法选择此招式。",
  "Body Press": "用身体压向对手。伤害计算时会用自己的防御代替攻击。",
  "Branch Poke": "用尖锐树枝戳刺对手。没有追加效果。",
  "Breaking Swipe": "用强力扫击攻击对手。必定降低对手的攻击。",
  "Burning Bulwark": "防住对手的攻击。若对手使用接触类招式，会让其陷入灼伤状态。",
  "Burning Jealousy": "用嫉妒的火焰攻击对手。若对手本回合能力提高，则必定使其灼伤。",
  "Ceaseless Edge": "用连绵不断的利刃攻击对手，并在对方场地撒下一层撒菱。",
  "Chilling Water": "用冰冷的水攻击对手。必定降低对手的攻击。",
  "Chloroblast": "释放叶绿素能量猛烈攻击。使用后自己会损失最大 HP 的一半。",
  "Clangorous Soul": "削减自己最大 HP 的三分之一，让所有能力提高 1 级。",
  "Coaching": "指导同伴作战，提高同伴的攻击和防御。",
  "Collision Course": "以全力撞击对手。击中效果绝佳时，伤害会进一步提高。",
  "Comeuppance": "若本回合受到攻击，会返还所受伤害 1.5 倍的伤害。",
  "Court Change": "互换己方和对方场地上的场地效果。",
  "Decorate": "装饰目标，大幅提高目标的攻击和特攻。",
  "Dire Claw": "用凶险利爪攻击对手。有时让对手陷入睡眠、中毒或麻痹状态。",
  "Doodle": "模仿目标的特性，让自己和同伴的特性变成目标的特性。",
  "Double Shock": "放出体内的全部电力攻击。使用者必须是电属性，使用后会失去电属性。",
  "Dragon Cheer": "鼓舞同伴，提高同伴的击中要害率；若同伴是龙属性，提升效果更强。",
  "Dragon Darts": "发射多龙梅西亚进行 2 次攻击。双打时会尝试分别攻击两个对手。",
  "Dragon Energy": "将生命力转化为龙之能量攻击对手。自己的 HP 越少，威力越低。",
  "Drum Beating": "用鼓点般的节奏攻击对手。必定降低对手的速度。",
  "Dual Wingbeat": "用双翼连续攻击对手。1 回合内攻击 2 次。",
  "Dynamax Cannon": "发射极巨化能量炮攻击对手。没有追加效果。",
  "Eerie Spell": "用诡异咒语攻击对手，并减少对手最后使用招式的 3 点 PP。",
  "Electro Drift": "以电力漂移撞向对手。击中效果绝佳时，伤害会进一步提高。",
  "Electro Shot": "第 1 回合提高自己的特攻并蓄电，第 2 回合攻击。下雨时无需蓄力。",
  "Esper Wing": "用意念之翼攻击对手。必定提高自己的速度，也容易击中要害。",
  "Expanding Force": "用扩散的精神力量攻击。在精神场地上威力提高，并会攻击多个对手。",
  "False Surrender": "假装认输后发动突袭。攻击必定命中。",
  "Fickle Beam": "发射变化不定的光束攻击。有时威力会变成 2 倍。",
  "Fiery Wrath": "用燃烧般的愤怒攻击对手。有时使对手畏缩。",
  "Flower Trick": "用花束机关攻击对手。攻击必定命中，并且必定击中要害。",
  "Freezing Glare": "用冰冷的视线攻击对手。有时让对手陷入冰冻状态。",
  "Gigaton Hammer": "挥动巨大的锤子攻击。使用后的下一回合无法选择此招式。",
  "Glacial Lance": "用冰之长枪攻击相邻的对手。没有追加效果。",
  "Glaive Rush": "不顾一切地突击对手。直到自己下回合行动前，受到的攻击必定命中且伤害变成 2 倍。",
  "Grassy Glide": "在草地上滑行攻击。处于青草场地时，优先度提高。",
  "Grav Apple": "让苹果从上方砸向对手。必定降低对手的防御；重力状态下威力提高。",
  "Hard Press": "用沉重压力攻击对手。对手剩余 HP 越多，威力越高。",
  "Headlong Rush": "头也不回地猛冲攻击。使用后自己的防御和特防会降低。",
  "Hydro Steam": "喷出高温水蒸气攻击。大晴天时威力不会减半，反而会提高。",
  "Hyper Drill": "用高速钻头攻击。可以穿过守住等防护效果。",
  "Ice Spinner": "旋转身体用冰攻击对手，并清除场地效果。",
  "Infernal Parade": "用鬼火队列攻击对手。有时使对手灼伤；若对手已有异常状态，威力会变成 2 倍。",
  "Ivy Cudgel": "用藤蔓棍棒攻击对手。容易击中要害，属性会根据使用者的样子改变。",
  "Jaw Lock": "咬住对手锁定战局，使自己和对手都无法替换。",
  "Jet Punch": "用喷射般的拳头攻击。通常能够先制攻击。",
  "Jungle Healing": "用丛林的治愈力量回复自己和同伴最大 HP 的四分之一，并治愈异常状态。",
  "Kowtow Cleave": "低头行礼后劈向对手。攻击必定命中。",
  "Lash Out": "发泄怒火攻击。若本回合自己的能力被降低，威力会变成 2 倍。",
  "Last Respects": "怀着对倒下同伴的敬意攻击。每有 1 次同伴濒死，威力都会提高。",
  "Life Dew": "洒下生命水滴，回复自己和同伴最大 HP 的四分之一。",
  "Lumina Crash": "用精神光芒冲击对手。必定大幅降低对手的特防。",
  "Lunar Blessing": "用月光祝福自己和同伴，回复最大 HP 的四分之一并治愈异常状态。",
  "Magic Powder": "撒出魔法粉末，将对手的属性变为超能力属性。",
  "Malignant Chain": "用恶意锁链攻击对手。有时让对手陷入剧毒状态。",
  "Matcha Gotcha": "泼洒抹茶攻击对手。有时使对手灼伤，并回复给予伤害的一半 HP；还能解除对手冰冻。",
  "Meteor Beam": "第 1 回合提高自己的特攻并聚集宇宙力量，第 2 回合发射光束攻击。",
  "Mighty Cleave": "用强力斩击攻击。可以穿过守住等防护效果。",
  "Misty Explosion": "引发薄雾爆炸攻击。使用后自己会濒死；在薄雾场地上威力提高。",
  "Mountain Gale": "用山岳般的寒风攻击对手。有时使对手畏缩。",
  "Mystical Power": "用神秘力量攻击对手。必定提高自己的特攻。",
  "No Retreat": "背水一战，提高除命中和闪避外的所有能力，但自己无法替换。",
  "Order Up": "发号施令攻击对手。根据吃下的米立龙样子，提高攻击、防御或速度。",
  "Overdrive": "用轰鸣电音攻击对手。会攻击多个对手，没有追加效果。",
  "Poltergeist": "操纵对手的道具攻击。若对手没有携带道具，则招式会失败。",
  "Population Bomb": "伙伴们连续撞击对手。最多攻击 10 次，每次攻击都可能落空。",
  "Pounce": "扑向对手进行攻击。必定降低对手的速度。",
  "Psyblade": "用精神利刃斩击对手。处于电气场地时威力提高。",
  "Psychic Noise": "用精神噪音攻击对手。2 回合内阻止对手回复 HP。",
  "Psyshield Bash": "用精神护盾撞击对手。必定提高自己的防御。",
  "Pyro Ball": "踢出燃烧的球攻击对手。有时使对手灼伤，并解除自己的冰冻。",
  "Raging Bull": "像愤怒的牛一样冲撞。会破坏光墙、反射壁等，属性会根据使用者的样子改变。",
  "Raging Fury": "狂怒地连续攻击 2～3 回合。之后自己会陷入混乱。",
  "Revival Blessing": "送上复苏的祝福，让 1 只濒死的同行宝可梦以一半 HP 复活。",
  "Rising Voltage": "释放升腾的电压攻击。若对手接地且处于电气场地，威力会变成 2 倍。",
  "Ruination": "以灾祸之力攻击，造成相当于对手当前 HP 一半的伤害。",
  "Salt Cure": "用盐腌制对手。每回合削减 HP；对钢属性和水属性效果更强。",
  "Sandsear Storm": "用灼热沙暴攻击对手。有时使对手灼伤；下雨时必定命中。",
  "Scorching Sands": "用滚烫沙子攻击对手。有时使对手灼伤，并解除目标冰冻。",
  "Shed Tail": "削减自己最大 HP 的一半制造替身，并将替身交给换上的同伴。",
  "Shell Side Arm": "用贝壳武装攻击对手。有时使对手中毒；若物理攻击更有效，会改为接触类物理攻击。",
  "Shelter": "让自己缩入壳中，大幅提高自己的防御。",
  "Silk Trap": "用丝设置陷阱防住攻击。若对手使用接触类招式，会降低其速度。",
  "Skitter Smack": "迅速拍打对手。必定降低对手的特攻。",
  "Snipe Shot": "瞄准对手射击。容易击中要害，且不会被其他宝可梦吸引目标。",
  "Snowscape": "让雪连续下 5 回合。雪中冰属性宝可梦的防御会提高。",
  "Spicy Extract": "用辛辣精华刺激目标。大幅提高目标攻击，但大幅降低目标防御。",
  "Spin Out": "高速旋转攻击对手。使用后自己的速度会大幅降低。",
  "Spirit Break": "用破坏精神的力量攻击对手。必定降低对手的特攻。",
  "Springtide Storm": "用春潮般的风暴攻击对手。有时降低对手的攻击。",
  "Steel Beam": "发射钢铁光束攻击。使用后自己会损失最大 HP 的一半。",
  "Steel Roller": "用钢铁滚轮碾压。若没有场地效果则失败，使用后会清除场地效果。",
  "Stone Axe": "用石斧攻击对手，并在对方场地布下隐形岩。",
  "Strange Steam": "喷出奇妙蒸汽攻击对手。有时使对手混乱。",
  "Stuff Cheeks": "吃掉自己携带的树果，并大幅提高自己的防御。没有树果时无法使用。",
  "Supercell Slam": "用超强电流猛撞对手。如果攻击落空，自己会损失最大 HP 的一半。",
  "Surging Strikes": "连续打出水流连击。攻击 3 次，并且每次都必定击中要害。",
  "Syrup Bomb": "用糖浆炸弹攻击对手。接下来 3 回合内，每回合降低对手的速度。",
  "Tachyon Cutter": "发射超高速粒子切割对手。攻击 2 次，并且必定命中。",
  "Take Heart": "鼓起勇气，治愈自己的异常状态，并提高特攻和特防。",
  "Tar Shot": "向对手泼洒焦油，降低其速度，并使其更怕火属性招式。",
  "Teatime": "开茶会，让场上所有宝可梦吃掉自己携带的树果。",
  "Temper Flare": "因受挫而燃起怒火攻击。若自己上一次招式失败，威力会变成 2 倍。",
  "Tera Starstorm": "释放太晶星暴攻击。太乐巴戈斯为星晶形态时变为星晶属性，并攻击两个对手。",
  "Terrain Pulse": "借助场地力量攻击。处于场地效果中时，威力变成 2 倍，属性也会改变。",
  "Thunder Cage": "用电牢笼困住对手，在 4～5 回合内持续造成伤害。",
  "Thunderclap": "用迅雷般的电击先制攻击。若目标没有选择攻击招式，则招式会失败。",
  "Thunderous Kick": "用雷鸣般的踢击攻击对手。必定降低对手的防御。",
  "Tidy Up": "整理战场，提高自己的攻击和速度，并清除替身、撒菱等场地障碍。",
  "Torch Song": "唱出燃烧的歌声攻击对手。必定提高自己的特攻。",
  "Trailblaze": "开辟道路般地攻击对手。必定提高自己的速度。",
  "Triple Arrows": "射出三支箭攻击。容易击中要害，有时降低对手防御或使其畏缩。",
  "Triple Axel": "连续旋转踢攻击 3 次。每次都可能落空，命中时威力逐渐提高。",
  "Triple Dive": "连续潜水攻击对手。1 回合内攻击 3 次。",
  "Twin Beam": "发射双重光束攻击对手。1 回合内攻击 2 次。",
  "Upper Hand": "抢先压制对手。若对手正要使用先制招式，会使其畏缩；否则失败。",
  "Victory Dance": "跳起胜利之舞，提高自己的攻击、防御和速度。",
  "Vise Grip": "用钳子或爪子夹住对手进行攻击。没有追加效果。",
  "Wicked Blow": "用恶意一击攻击对手。必定击中要害。",
  "Wildbolt Storm": "用狂暴电击风暴攻击对手。有时使对手麻痹；下雨时必定命中。",
};

function toId(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function fallbackDescription(move, nameZh) {
  if (move.category === "Status") return `使出${nameZh}，产生对应的战斗效果。`;
  const typeZh = TYPE_ZH[move.type] || move.type || "未知属性";
  return `用${typeZh}属性的力量攻击对手。`;
}

const details = JSON.parse(readFileSync(detailsPath, "utf8"));
const overrides = JSON.parse(readFileSync(overridesPath, "utf8"));
details.moves ||= {};
overrides.moves ||= {};

const service = new GameService({projectRoot});
await service.generateRentalCandidates(1, "gen7randombattle", 1);
const dex = service.dataDex();

const detailKeysById = new Map(Object.keys(details.moves).map(key => [toId(key), key]));
let filled = 0;
let fallback = 0;

for (const move of dex.moves.all()) {
  if (!move.exists || !move.id) continue;
  const existingKey = detailKeysById.get(toId(move.name)) || move.name;
  const existing = details.moves[existingKey] || {};
  if (existing.description) continue;

  const nameZh = overrides.moves[move.name] || move.name;
  const description = MANUAL_DESCRIPTIONS[move.name] || fallbackDescription(move, nameZh);
  if (!MANUAL_DESCRIPTIONS[move.name]) fallback += 1;
  details.moves[existingKey] = {
    ...existing,
    description,
    power: move.basePower || existing.power || 0,
    ...(move.accuracy === true ? {} : {accuracy: move.accuracy || existing.accuracy || 0}),
    pp: move.pp || existing.pp || 0,
    priority: move.priority || existing.priority || 0,
    type: existing.type || {en: move.type || "", zh_cn: TYPE_ZH[move.type] || move.type || ""},
    category: existing.category || {en: move.category || "", zh_cn: CATEGORY_ZH[move.category] || move.category || ""},
  };
  filled += 1;
}

writeFileSync(detailsPath, `${JSON.stringify(details, null, 2)}\n`);
console.log(`Filled ${filled} move descriptions (${fallback} fallback).`);
