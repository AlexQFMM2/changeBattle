#!/usr/bin/env node
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

const DEFAULT_MOVES_CSV = "work/pokeapi-csv/moves.csv";
const DEFAULT_NAMES_CSV = "work/pokeapi-csv/move_names.csv";
const DEFAULT_OUT = "work/move-animation-targets-gen1-5.txt";
const SIMPLIFIED_CHINESE_LANGUAGE_ID = "12";
const TRADITIONAL_CHINESE_LANGUAGE_ID = "4";

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines.map(line => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseArgs(argv) {
  const options = {
    movesCsv: DEFAULT_MOVES_CSV,
    namesCsv: DEFAULT_NAMES_CSV,
    out: DEFAULT_OUT,
    maxGeneration: 5,
    includeShadow: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = () => {
      const value = argv[index + 1];
      if (!value) throw new Error(`Missing value for ${arg}`);
      index += 1;
      return value;
    };
    if (arg === "--moves") options.movesCsv = readValue();
    else if (arg === "--names") options.namesCsv = readValue();
    else if (arg === "--out") options.out = readValue();
    else if (arg === "--max-generation") options.maxGeneration = Number(readValue());
    else if (arg === "--include-shadow") options.includeShadow = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
const moves = parseCsv(await readFile(options.movesCsv, "utf8"));
const names = parseCsv(await readFile(options.namesCsv, "utf8"));

const namesByMoveId = new Map();
for (const row of names) {
  const current = namesByMoveId.get(row.move_id) || {};
  current[row.local_language_id] = row.name;
  namesByMoveId.set(row.move_id, current);
}

const targets = moves
  .filter(row => Number(row.generation_id) <= options.maxGeneration)
  .filter(row => options.includeShadow || !row.identifier.startsWith("shadow-"))
  .map(row => {
    const localized = namesByMoveId.get(row.id) || {};
    return {
      id: Number(row.id),
      identifier: row.identifier,
      generation_id: Number(row.generation_id),
      name: localized[SIMPLIFIED_CHINESE_LANGUAGE_ID] || localized[TRADITIONAL_CHINESE_LANGUAGE_ID] || row.identifier,
    };
  })
  .filter(row => row.name && !row.name.includes("???"))
  .sort((a, b) => a.generation_id - b.generation_id || a.id - b.id);

await mkdir(path.dirname(options.out), {recursive: true});
await writeFile(options.out, `${targets.map(row => row.name).join("\n")}\n`);
await writeFile(options.out.replace(/\.txt$/, ".json"), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  maxGeneration: options.maxGeneration,
  includeShadow: options.includeShadow,
  count: targets.length,
  targets,
}, null, 2)}\n`);

const counts = new Map();
for (const target of targets) counts.set(target.generation_id, (counts.get(target.generation_id) || 0) + 1);
console.log(`Wrote ${targets.length} targets to ${options.out}`);
console.log([...counts.entries()].map(([generation, count]) => `gen${generation}:${count}`).join(" "));
