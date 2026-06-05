#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const projectRoot = path.resolve(__dirname, "..");
const poolPath = path.join(projectRoot, "data", "shop_pool.csv");
const outputDir = path.join(projectRoot, "assets", "items");
const baseUrl = "https://play.pokemonshowdown.com/sprites/itemicons";
const iconFileAliases = {
  assaultvest: "assault-vest.png",
  paralyzeheal: "parlyz-heal.png",
  safetygoggles: "safety-goggles.png",
  weaknesspolicy: "weakness-policy.png",
};

function itemKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function readPoolIds() {
  if (!fs.existsSync(poolPath)) return [];
  const ids = new Set();
  const lines = fs.readFileSync(poolPath, "utf8").split(/\r?\n/).slice(1);
  for (const line of lines) {
    if (!line.trim()) continue;
    const [idRaw, kindRaw, , , , enabledRaw] = line.split(",");
    if (String(enabledRaw ?? "1").trim() === "0") continue;
    if (itemKey(kindRaw) !== "item") continue;
    const id = itemKey(idRaw);
    if (id) ids.add(id);
  }
  return [...ids].sort();
}

function download(url, filePath) {
  return new Promise(resolve => {
    https.get(url, response => {
      if (response.statusCode !== 200) {
        response.resume();
        resolve(false);
        return;
      }
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => {
        fs.writeFileSync(filePath, Buffer.concat(chunks));
        resolve(true);
      });
    }).on("error", () => resolve(false));
  });
}

function fetchText(url) {
  return new Promise(resolve => {
    https.get(url, response => {
      if (response.statusCode !== 200) {
        response.resume();
        resolve("");
        return;
      }
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    }).on("error", () => resolve(""));
  });
}

async function itemIconFileMap() {
  const html = await fetchText(`${baseUrl}/`);
  const map = new Map();
  for (const match of html.matchAll(/href="([^"]+\.png)"/g)) {
    const fileName = decodeURIComponent(match[1]).split("/").pop();
    if (!fileName) continue;
    map.set(itemKey(fileName.replace(/\.png$/i, "")), fileName);
  }
  return map;
}

async function main() {
  fs.mkdirSync(outputDir, {recursive: true});
  const ids = readPoolIds();
  const iconFiles = await itemIconFileMap();
  let ok = 0;
  let missing = 0;
  for (const id of ids) {
    const filePath = path.join(outputDir, `${id}.png`);
    if (fs.existsSync(filePath)) {
      ok += 1;
      continue;
    }
    const fileName = iconFiles.get(id) || iconFileAliases[id];
    if (!fileName) {
      missing += 1;
      console.warn(`missing ${id}`);
      continue;
    }
    const url = `${baseUrl}/${fileName}`;
    if (await download(url, filePath)) {
      ok += 1;
      console.log(`downloaded ${id}`);
    } else {
      missing += 1;
      console.warn(`missing ${id}`);
    }
  }
  console.log(`item icons ready: ${ok} ok, ${missing} missing`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
