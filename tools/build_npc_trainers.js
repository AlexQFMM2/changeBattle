const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "work", "npc_portrait_grouped_manifest.json");
const assetRoot = path.join(root, "assets", "npc");
const dataPath = path.join(root, "data", "npc_trainers.csv");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const rows = [];
const copied = new Map();

function slug(raw) {
  return String(raw || "")
    .normalize("NFKD")
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "npc";
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function copyAsset(asset, bucket, prefix) {
  if (!asset?.file) return "";
  const source = path.join(root, "work", asset.file);
  if (!fs.existsSync(source)) return "";
  const ext = path.extname(source) || ".png";
  const name = `${slug(prefix)}-${slug(asset.name || path.basename(source, ext))}${ext.toLowerCase()}`;
  const relative = path.posix.join("assets", "npc", bucket, name);
  const target = path.join(root, relative);
  if (!copied.has(relative)) {
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.copyFileSync(source, target);
    copied.set(relative, true);
  }
  return relative;
}

function firstAsset(group, predicate) {
  return (group?.assets || []).find(predicate);
}

function avatarForName(name) {
  return (manifest.avatar_pool || []).find(asset => asset.name === name)
    || (manifest.avatar_pool || []).find(asset => String(asset.name || "").includes(name) || name.includes(String(asset.name || "")));
}

function pushRow(row) {
  rows.push({
    id: row.id,
    type: row.type,
    region: row.region || "",
    role: row.role || "",
    tier: row.tier || "",
    name_zh: row.name_zh || "",
    name_en: row.name_en || "",
    front_asset: row.front_asset || "",
    front_gif_asset: row.front_gif_asset || "",
    back_asset: row.back_asset || "",
    avatar_asset: row.avatar_asset || "",
    team_pool_ids: row.team_pool_ids || "",
    enabled: row.enabled ?? "1",
    notes: row.notes || "",
  });
}

for (const group of manifest.player_character_groups || []) {
  if (["阿渡", "黑连", "小银", "阿驯"].includes(group.name)) continue;
  const front = firstAsset(group, asset => asset.kind === "pixel-front" && !String(asset.file || "").endsWith(".gif")) || group.default_asset;
  const gif = firstAsset(group, asset => asset.kind === "pixel-front" && String(asset.file || "").endsWith(".gif"));
  const back = firstAsset(group, asset => asset.kind === "pixel-back");
  const avatar = firstAsset(group, asset => asset.kind === "remote-vs" || asset.kind === "pixel-vs") || avatarForName(group.name);
  if (!front || !back) continue;
  pushRow({
    id: `player:${slug(group.name)}`,
    type: "player",
    role: "玩家",
    name_zh: group.name,
    name_en: (group.aliases || []).find(alias => /^[A-Za-z]/.test(alias)) || "",
    front_asset: copyAsset(front, "player-front", group.name),
    front_gif_asset: copyAsset(gif, "player-front", `${group.name}-gif`),
    back_asset: copyAsset(back, "player-back", group.name),
    avatar_asset: copyAsset(avatar, "avatars", group.name),
    notes: (group.aliases || []).join("|"),
  });
}

for (const region of manifest.important_npc_regions || []) {
  for (const section of region.sections || []) {
    const members = section.members || [];
    for (let index = 0; index < members.length; index += 1) {
      const member = members[index];
      if (!member?.group || member.missing) continue;
      const group = member.group;
      const battle = group.default_asset || firstAsset(group, asset => asset.role === "battle") || firstAsset(group, asset => asset.kind === "remote-portrait");
      const gif = firstAsset(group, asset => asset.kind === "pixel-front" && String(asset.file || "").endsWith(".gif"));
      const avatar = firstAsset(group, asset => asset.kind === "remote-vs" || asset.kind === "pixel-vs") || avatarForName(member.name);
      const role = section.role;
      const type = role === "馆主" ? "gym" : role === "四天王" ? "elite4" : role === "冠军" ? "champion" : "normal";
      let tier = "";
      if (type === "gym") {
        const cut1 = Math.ceil(members.length / 3);
        const cut2 = Math.ceil((members.length * 2) / 3);
        tier = index < cut1 ? "tier1" : index < cut2 ? "tier2" : "tier3";
      } else if (type === "elite4") tier = "elite4";
      else if (type === "champion") tier = "champion";
      pushRow({
        id: `${type}:${slug(region.region)}:${slug(member.name)}:${index + 1}`,
        type,
        region: region.region,
        role,
        tier,
        name_zh: member.name,
        name_en: (group.aliases || []).find(alias => /^[A-Za-z]/.test(alias)) || "",
        front_asset: copyAsset(battle, type === "normal" ? "normal" : "boss", member.name),
        front_gif_asset: copyAsset(gif, "boss", `${member.name}-gif`),
        avatar_asset: copyAsset(avatar, "avatars", member.name),
        team_pool_ids: type === "normal" ? "" : `${type}:${tier}:${slug(member.name)}`,
        notes: `${region.region}|${role}|${(group.aliases || []).join("|")}`,
      });
    }
  }
}

for (const [index, asset] of (manifest.normal_npc_pool || []).entries()) {
  pushRow({
    id: `normal:${slug(asset.name)}:${index + 1}`,
    type: "normal",
    role: "路人",
    name_zh: asset.name || `路人训练师${index + 1}`,
    name_en: asset.name || "",
    front_asset: copyAsset(asset, "normal", `${asset.name}-${index + 1}`),
    notes: asset.group || asset.source || "",
  });
}

for (const [index, asset] of (manifest.avatar_pool || []).entries()) {
  pushRow({
    id: `avatar:${slug(asset.name)}:${index + 1}`,
    type: "avatar",
    role: "头像",
    name_zh: asset.name || `头像${index + 1}`,
    name_en: asset.name || "",
    avatar_asset: copyAsset(asset, "avatars", `${asset.name}-${index + 1}`),
    enabled: "1",
    notes: asset.source || "",
  });
}

fs.mkdirSync(path.dirname(dataPath), {recursive: true});
const header = ["id", "type", "region", "role", "tier", "name_zh", "name_en", "front_asset", "front_gif_asset", "back_asset", "avatar_asset", "team_pool_ids", "enabled", "notes"];
const csv = [header.join(","), ...rows.map(row => header.map(key => csvCell(row[key])).join(","))].join("\n") + "\n";
fs.writeFileSync(dataPath, csv, "utf8");
console.log(`Wrote ${rows.length} NPC rows to ${path.relative(root, dataPath)}`);
console.log(`Copied ${copied.size} assets to ${path.relative(root, assetRoot)}`);
