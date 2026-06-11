#!/usr/bin/env node
import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {createRequire} from "node:module";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const DATA_DIR = path.join(ROOT, "data");
const WORK_DIR = path.join(ROOT, "work", "rainbow_rocket");
const RESOURCE_PATH = path.join(WORK_DIR, "resources.json");
const NPC_TRAINERS_PATH = path.join(DATA_DIR, "npc_trainers.csv");
const POKEMON_TIERS_PATH = path.join(DATA_DIR, "pokemon_tiers.csv");
const REPRESENTATIVES_PATH = path.join(DATA_DIR, "rainbow_rocket_representatives.csv");
const TEAM_POOLS_PATH = path.join(DATA_DIR, "rainbow_rocket_team_pools.csv");
const DIALOGUES_PATH = path.join(DATA_DIR, "rainbow_rocket_dialogues.json");

const showdownPath = process.env.SHOWDOWN_PATH || path.join(ROOT, "vendor", "pokemon-showdown");
const fallbackShowdownPath = "/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown";
const simPath = existsSync(path.join(showdownPath, "dist", "sim")) ? showdownPath : fallbackShowdownPath;
const require = createRequire(import.meta.url);
const Sim = require(path.join(simPath, "dist", "sim"));
const Dex = Sim.Dex.mod("gen9");

const ROSTER = [
  {
    order: 1,
    name: "坂木",
    name_en: "Giovanni",
    organization: "火箭队",
    page: "坂木",
    front_asset: "assets/npc/boss/giovanni-giovannihgss-e63c106b.gif",
    front_gif_asset: "assets/npc/boss/giovanni-gif-giovannihgss-e63c106b.gif",
    avatar_asset: "assets/npc/avatars/giovanni-vsgiovanni-2173e9b0.png",
    representatives: ["mewtwo", "nidoking", "nidoqueen", "rhyperior", "persian", "dugtrio"],
    teams: [
      ["mewtwo", "nidoking", "nidoqueen", "rhyperior"],
      ["mewtwo", "persian", "rhyperior", "nidoking"],
    ],
    dialogue: {
      intro: ["所有世界都能被支配。", "让我看看你有没有资格站在彩虹火箭队面前。"],
      defeat: ["连这条世界线也会出现变量吗。", "你的名字，我会记住。"],
      victory: ["支配者不会为一次阻碍停下。", "退下吧，这个世界还轮不到你守护。"],
    },
  },
  {
    order: 2,
    name: "赤焰松",
    name_en: "Maxie",
    organization: "熔岩队",
    page: "赤焰松",
    representatives: ["groudon", "camerupt", "crobat", "mightyena", "weezing", "houndoom"],
    teams: [
      ["groudon", "camerupt", "crobat", "mightyena"],
      ["groudon", "camerupt", "houndoom", "weezing"],
    ],
    dialogue: {
      intro: ["扩张大地，才是让生命走向未来的答案。", "你的干涉，只会拖慢理想的完成。"],
      defeat: ["计算之外的结果……我必须重新修正计划。"],
      victory: ["理想不会被感情左右。", "这就是大地给予你的结论。"],
    },
  },
  {
    order: 3,
    name: "水梧桐",
    name_en: "Archie",
    organization: "海洋队",
    page: "水梧桐",
    representatives: ["kyogre", "sharpedo", "crobat", "mightyena", "muk", "walrein"],
    teams: [
      ["kyogre", "sharpedo", "crobat", "mightyena"],
      ["kyogre", "sharpedo", "walrein", "muk"],
    ],
    dialogue: {
      intro: ["海洋会吞下所有傲慢。", "来吧，让我看看你能不能逆着浪头站稳！"],
      defeat: ["哈哈哈！居然能越过这片海。", "你的胆量，我认可了。"],
      victory: ["被浪卷走也是旅行的一部分。", "下次带着更大的器量回来吧。"],
    },
  },
  {
    order: 4,
    name: "赤日",
    name_en: "Cyrus",
    organization: "银河队",
    page: "赤日",
    work_front: "npc-preview-assets/pixel-front/asset/PT/CyrusPlatinum.gif",
    work_alt_front: "npc-preview-assets/pixel-front/asset/DP/GalacticBossCyrus.png",
    representatives: ["dialga", "palkia", "giratina", "honchkrow", "weavile", "crobat"],
    teams: [
      ["dialga", "palkia", "honchkrow", "weavile"],
      ["giratina", "crobat", "weavile", "honchkrow"],
    ],
    dialogue: {
      intro: ["感情是不完整世界的噪音。", "我会用这场战斗证明你的意志同样多余。"],
      defeat: ["矛盾的结果。", "你用不稳定的心，撬动了我的秩序。"],
      victory: ["看吧。意志只会带来失败。", "安静地从我的新世界退场。"],
    },
  },
  {
    order: 5,
    name: "魁奇思",
    name_en: "Ghetsis",
    organization: "等离子队",
    page: "魁奇思",
    work_front: "npc-preview-assets/pixel-front/asset/B2W2/Spr_B2W2_Ghetsis.png",
    avatar_asset: "assets/npc/avatars/vsghetsis-2-71-vsghetsis-2-16e074af.png",
    representatives: ["kyurem", "hydreigon", "cofagrigus", "seismitoad", "eelektross", "bisharp"],
    teams: [
      ["kyurem", "hydreigon", "cofagrigus", "seismitoad"],
      ["kyurem", "hydreigon", "eelektross", "bisharp"],
    ],
    dialogue: {
      intro: ["所有人都会被正确的言辞引导。", "而不肯服从的人，只需要被击倒。"],
      defeat: ["不可能……我不承认这种结果！"],
      victory: ["你只是又一个被理想淘汰的人。", "跪下，承认自己的无力吧。"],
    },
  },
  {
    order: 6,
    name: "弗拉达利",
    name_en: "Lysandre",
    organization: "闪焰队",
    page: "弗拉达利",
    representatives: ["xerneas", "yveltal", "gyarados", "pyroar", "mienshao", "honchkrow"],
    teams: [
      ["xerneas", "gyarados", "pyroar", "mienshao"],
      ["yveltal", "gyarados", "honchkrow", "pyroar"],
    ],
    dialogue: {
      intro: ["丑陋会不断增殖。", "所以我必须亲手筛选能留下的美丽。"],
      defeat: ["你守住的世界，真的值得吗。", "那就继续证明给我看。"],
      victory: ["美丽的世界不需要多余的噪声。", "你的失败，正是一种筛选。"],
    },
  },
  {
    order: 7,
    name: "露莎米奈",
    name_en: "Lusamine",
    organization: "以太基金会",
    page: "露莎米奈",
    representatives: ["nihilego", "pheromosa", "clefable", "milotic", "bewear", "lilligant"],
    teams: [
      ["nihilego", "pheromosa", "clefable", "milotic"],
      ["nihilego", "bewear", "lilligant", "milotic"],
    ],
    dialogue: {
      intro: ["美丽的事物应当永远属于我。", "你的宝可梦，也会成为这份收藏的一部分。"],
      defeat: ["为什么……美丽居然会从我手中溜走。"],
      victory: ["别害怕。", "被完美地收藏，也是一种幸福。"],
    },
  },
];

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

function readCsv(filePath) {
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] || "");
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
  });
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(filePath, header, rows) {
  mkdirSync(path.dirname(filePath), {recursive: true});
  const csv = [header.join(","), ...rows.map(row => header.map(key => csvCell(row[key])).join(","))].join("\n") + "\n";
  writeFileSync(filePath, csv, "utf8");
}

function slug(raw) {
  return String(raw || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "npc";
}

function shortHash(raw) {
  return crypto.createHash("sha1").update(String(raw || "")).digest("hex").slice(0, 8);
}

function copyFormalAsset(source, bucket, prefix, kind) {
  if (!source) return "";
  const sourcePath = path.isAbsolute(source) ? source : path.join(ROOT, source);
  if (!existsSync(sourcePath)) return "";
  const ext = path.extname(sourcePath).toLowerCase() || ".png";
  const name = `${slug(prefix)}-${kind}-${shortHash(source)}${ext}`;
  const relative = path.posix.join("assets", "npc", bucket, name);
  const targetPath = path.join(ROOT, relative);
  mkdirSync(path.dirname(targetPath), {recursive: true});
  if (!existsSync(targetPath)) copyFileSync(sourcePath, targetPath);
  return relative;
}

function resources() {
  if (!existsSync(RESOURCE_PATH)) return {entries: {}};
  try {
    return JSON.parse(readFileSync(RESOURCE_PATH, "utf8"));
  } catch {
    return {entries: {}};
  }
}

function downloadedAsset(entry, kind) {
  const asset = (entry?.downloaded_assets || []).find(item => item.kind === kind);
  return asset?.file ? path.join(WORK_DIR, asset.file) : "";
}

function existingOrCopiedAsset(trainer, entry, field, bucket, kind) {
  if (trainer[field] && existsSync(path.join(ROOT, trainer[field]))) return trainer[field];
  const workKey = kind === "front" ? "work_front" : "work_avatar";
  const altKey = kind === "front" ? "work_alt_front" : "work_alt_avatar";
  const workAsset = trainer[workKey] ? path.join(ROOT, "work", trainer[workKey]) : "";
  const copiedWork = copyFormalAsset(workAsset, bucket, trainer.name_en, kind);
  if (copiedWork) return copiedWork;
  const altAsset = trainer[altKey] ? path.join(ROOT, "work", trainer[altKey]) : "";
  const copiedAlt = copyFormalAsset(altAsset, bucket, trainer.name_en, kind);
  if (copiedAlt) return copiedAlt;
  const downloaded = downloadedAsset(entry, kind);
  return copyFormalAsset(downloaded, bucket, trainer.name_en, kind);
}

function speciesName(speciesId) {
  const species = Dex.species.get(speciesId);
  return species.exists ? species.name : speciesId;
}

function loadTierMap() {
  const rows = readCsv(POKEMON_TIERS_PATH);
  return new Map(rows.map(row => [row.species_id, Number(row.override_tier || row.tier || 0)]));
}

function sourceUrl(entry, section) {
  return entry?.sections?.[section]?.source_url || "";
}

function updateNpcTrainers(resourceData) {
  const header = ["id", "type", "region", "role", "tier", "name_zh", "name_en", "front_asset", "front_gif_asset", "back_asset", "avatar_asset", "team_pool_ids", "enabled", "notes"];
  const existing = readCsv(NPC_TRAINERS_PATH).filter(row => row.type !== "villain");
  const villainRows = ROSTER.map(trainer => {
    const entry = resourceData.entries?.[trainer.name];
    const front = existingOrCopiedAsset(trainer, entry, "front_asset", "boss", "front");
    const avatar = existingOrCopiedAsset(trainer, entry, "avatar_asset", "avatars", "avatar");
    const notes = [
      trainer.name_en,
      trainer.organization,
      sourceUrl(entry, "pokemon"),
      sourceUrl(entry, "dialogue"),
      sourceUrl(entry, "portrait"),
    ].filter(Boolean).join("|");
    return {
      id: `villain:彩虹火箭队:${trainer.name}:${trainer.order}`,
      type: "villain",
      region: "彩虹火箭队",
      role: "彩虹火箭队",
      tier: "rainbow_rocket",
      name_zh: trainer.name,
      name_en: trainer.name_en,
      front_asset: front,
      front_gif_asset: trainer.front_gif_asset || "",
      back_asset: "",
      avatar_asset: avatar,
      team_pool_ids: `rainbow_rocket:${trainer.name}`,
      enabled: "1",
      notes,
    };
  });
  writeCsv(NPC_TRAINERS_PATH, header, [...existing, ...villainRows]);
  return villainRows;
}

function writeRepresentatives(villainRows) {
  const rows = [];
  for (const trainer of ROSTER) {
    const trainerId = villainRows.find(row => row.name_zh === trainer.name)?.id || "";
    for (const speciesId of trainer.representatives) {
      rows.push({
        trainer_id: trainerId,
        trainer_name_zh: trainer.name,
        trainer_type: "villain",
        trainer_tier: "rainbow_rocket",
        species_id: speciesId,
        species: speciesName(speciesId),
        count: trainer.teams.flat().filter(id => id === speciesId).length || 1,
        source_names: "rainbow-rocket-curated",
      });
    }
  }
  writeCsv(REPRESENTATIVES_PATH, ["trainer_id", "trainer_name_zh", "trainer_type", "trainer_tier", "species_id", "species", "count", "source_names"], rows);
  return rows;
}

function writeTeamPools(villainRows) {
  const tierBySpecies = loadTierMap();
  const presets = ["none", "gen7", "gen8", "gen9"];
  const rows = [];
  for (const trainer of ROSTER) {
    const trainerId = villainRows.find(row => row.name_zh === trainer.name)?.id || "";
    for (const preset of presets) {
      trainer.teams.forEach((team, teamIndex) => {
        team.forEach((speciesId, slotIndex) => {
          rows.push({
            pool_id: `rainbow_rocket:${trainer.name}`,
            battle_rule_preset: preset,
            trainer_id: trainerId,
            trainer_name_zh: trainer.name,
            team_index: teamIndex + 1,
            slot: slotIndex + 1,
            species_id: speciesId,
            species: speciesName(speciesId),
            species_tier: tierBySpecies.get(speciesId) || 10,
            stage_tier: 10,
            generation_profile: "champion",
            source: "rainbow-rocket-curated",
          });
        });
      });
    }
  }
  writeCsv(TEAM_POOLS_PATH, ["pool_id", "battle_rule_preset", "trainer_id", "trainer_name_zh", "team_index", "slot", "species_id", "species", "species_tier", "stage_tier", "generation_profile", "source"], rows);
  return rows;
}

function dialogueVariants(dialogue) {
  return {
    default: [dialogue],
    first_meeting: [dialogue],
    after_player_win: [dialogue],
    after_player_loss: [dialogue],
    rematch: [dialogue],
  };
}

function writeDialogues(villainRows) {
  const output = {};
  for (const trainer of ROSTER) {
    const row = villainRows.find(item => item.name_zh === trainer.name);
    output[row.id] = dialogueVariants(trainer.dialogue);
  }
  writeFileSync(DIALOGUES_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
  return output;
}

function validate(villainRows, reps, pools) {
  const errors = [];
  if (villainRows.length !== 7) errors.push(`villain rows ${villainRows.length}/7`);
  for (const row of villainRows) {
    if (!row.team_pool_ids) errors.push(`${row.name_zh} missing team_pool_ids`);
    for (const field of ["front_asset", "avatar_asset"]) {
      if (row[field] && !existsSync(path.join(ROOT, row[field]))) errors.push(`${row.name_zh} ${field} missing: ${row[field]}`);
    }
  }
  for (const row of villainRows) {
    const count = reps.filter(rep => rep.trainer_id === row.id).length;
    if (count < 3) errors.push(`${row.name_zh} representatives ${count}/3`);
    const poolCount = pools.filter(pool => pool.trainer_id === row.id && pool.battle_rule_preset === "none").length;
    if (poolCount < 4) errors.push(`${row.name_zh} team pool slots ${poolCount}/4`);
  }
  if (errors.length) throw new Error(`Rainbow Rocket data validation failed:\n${errors.join("\n")}`);
}

function main() {
  const resourceData = resources();
  const villainRows = updateNpcTrainers(resourceData);
  const reps = writeRepresentatives(villainRows);
  const pools = writeTeamPools(villainRows);
  const dialogues = writeDialogues(villainRows);
  validate(villainRows, reps, pools);
  console.log(`Wrote ${villainRows.length} villain trainers to ${path.relative(ROOT, NPC_TRAINERS_PATH)}`);
  console.log(`Wrote ${reps.length} representative rows to ${path.relative(ROOT, REPRESENTATIVES_PATH)}`);
  console.log(`Wrote ${pools.length} team pool rows to ${path.relative(ROOT, TEAM_POOLS_PATH)}`);
  console.log(`Wrote ${Object.keys(dialogues).length} dialogue entries to ${path.relative(ROOT, DIALOGUES_PATH)}`);
}

main();
