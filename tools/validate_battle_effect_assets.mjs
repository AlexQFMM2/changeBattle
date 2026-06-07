import {existsSync, readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "data", "battle_effect_assets.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const entries = config.entries || {};
const moveTypes = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];

const requiredKeys = [
  ...moveTypes.map(id => `move_type:${id}`),
  ...moveTypes.flatMap(id => [`move_type:${id}:physical`, `move_type:${id}:special`]),
  ...["raindance", "sunnyday", "sandstorm", "hail", "willowisp", "thunderwave", "toxic", "poisonpowder", "sleeppowder", "hypnosis", "confuseray", "swordsdance", "dragondance", "calmmind", "bulkup", "irondefense", "agility", "nastyplot", "growth", "focusenergy", "bellydrum", "growl", "leer", "scaryface", "screech", "faketears", "featherdance", "charm", "reflect", "lightscreen", "safeguard", "tailwind", "trickroom", "spikes", "toxicspikes", "stealthrock"].map(id => `move:${id}`),
  ...["brn", "par", "psn", "tox", "slp", "frz", "confusion", "substitute", "leechseed", "flinch", "trapped", "taunt", "encore", "disable", "volatile", "generic"].map(id => `status:${id}`),
  ...["up", "down", "clear", "swap", "copy", "invert", "generic"].map(id => `boost:${id}`),
  ...["rain", "sun", "sand", "hail", "snow", "none", "generic"].map(id => `weather:${id}`),
  ...["trickroom", "electricterrain", "grassyterrain", "mistyterrain", "psychicterrain", "generic"].map(id => `field:${id}`),
  ...["spikes", "stealthrock", "toxicspikes", "stickyweb", "reflect", "lightscreen", "auroraveil", "tailwind"].map(id => `side_condition:${id}`),
  ...["damage", "heal", "boost", "miss", "crit", "effectiveness", "switch_in", "faint"].map(id => `battle_action:${id}`),
];

const errors = [];
for (const key of requiredKeys) {
  if (!entries[key]) errors.push(`missing required entry: ${key}`);
}

for (const [key, entry] of Object.entries(entries)) {
  if (!entry.visual) errors.push(`${key}: missing visual`);
  if (!["target", "field", "side"].includes(entry.anchor || config.defaults?.anchor)) errors.push(`${key}: invalid anchor`);
  if (entry.renderer === "spritesheet") {
    for (const field of ["asset", "frames", "frame_width", "frame_height"]) {
      if (!entry[field]) errors.push(`${key}: spritesheet missing ${field}`);
    }
  }
  if ((entry.renderer === "spritesheet" || entry.renderer === "image") && entry.asset) {
    const assetPath = path.join(root, entry.asset);
    if (!existsSync(assetPath)) errors.push(`${key}: missing asset ${entry.asset}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`battle_effect_assets OK: ${Object.keys(entries).length} entries`);
