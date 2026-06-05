const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const workDir = path.join(repoRoot, "work");
const inputPath = path.join(workDir, "npc_portrait_preview_manifest.json");
const groupedPath = path.join(workDir, "npc_portrait_grouped_manifest.json");
const aliasPath = path.join(workDir, "npc_alias_map_review.json");
const htmlPath = path.join(workDir, "npc_portrait_grouped.html");
const sourceRoot = "/tmp/npcAboutInspect/extract/像素图 140612版";

const manifest = JSON.parse(fs.readFileSync(inputPath, "utf8"));

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function slugFile(value) {
  return String(value || "asset")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 110) || "asset";
}

function copyTrainerFrontAssets() {
  const trainerRoot = path.join(sourceRoot, "正面", "小卒");
  return walkFiles(trainerRoot)
    .filter((file) => /\.(png|gif)$/i.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((sourcePath) => {
      const relSource = path.relative(sourceRoot, sourcePath).replaceAll(path.sep, "/");
      const relFromTrainer = path.relative(trainerRoot, sourcePath);
      const outRel = path.join(
        "npc-preview-assets",
        "trainer-front",
        ...relFromTrainer.split(path.sep).map(slugFile),
      ).replaceAll(path.sep, "/");
      const outPath = path.join(workDir, outRel);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.copyFileSync(sourcePath, outPath);
      const name = path.basename(sourcePath).replace(/\.(png|gif)$/i, "");
      return {
        kind: "trainer-front",
        name,
        source: relSource,
        file: outRel,
        page: "",
        group: path.dirname(relSource),
        width: null,
        height: null,
        role: "normal-npc",
        confidence: "trainer-class",
        default: false,
      };
    });
}

const aliasRows = [
  ["小刚", ["Brock", "小刚", "小剛"]],
  ["小霞", ["Misty", "小霞"]],
  ["马志士", ["Lt Surge", "LtSurge", "Lt_Surge", "马志士", "馬志士"]],
  ["莉佳", ["Erika", "莉佳"]],
  ["阿桔", ["Koga", "阿桔"]],
  ["阿杏", ["Janine", "阿杏"]],
  ["娜姿", ["Sabrina", "娜姿"]],
  ["夏伯", ["Blaine", "夏伯"]],
  ["坂木", ["Giovanni", "坂木"]],
  ["青绿", ["Blue", "Green", "青绿", "青綠"]],
  ["阿速", ["Falkner", "阿速"]],
  ["阿笔", ["Bugsy", "阿笔", "阿筆"]],
  ["小茜", ["Whitney", "小茜"]],
  ["松叶", ["Morty", "松叶", "松葉"]],
  ["阿四", ["Chuck", "阿四"]],
  ["阿蜜", ["Jasmine", "阿蜜"]],
  ["柳伯", ["Pryce", "柳伯"]],
  ["小椿", ["Clair", "小椿"]],
  ["一树", ["Will", "一树", "一樹"]],
  ["希巴", ["Bruno", "希巴"]],
  ["梨花", ["Karen", "梨花"]],
  ["阿渡", ["Lance", "阿渡"]],
  ["赤红", ["Red", "赤红", "赤紅"]],
  ["小银", ["Silver", "小银", "小銀"]],

  ["杜娟", ["Roxanne", "杜娟"]],
  ["藤树", ["Brawly", "藤树", "藤樹"]],
  ["铁旋", ["Wattson", "铁旋", "鐵旋"]],
  ["亚莎", ["Flannery", "亚莎", "亞莎"]],
  ["千里", ["Norman", "千里"]],
  ["娜琪", ["Winona", "娜琪"]],
  ["小枫与小南", ["Tate", "Liza", "小枫与小南", "小楓與小南"]],
  ["亚当", ["Juan", "亚当", "亞當"]],
  ["米可利", ["Wallace", "米可利"]],
  ["大吾", ["Steven", "大吾"]],
  ["花月", ["Sidney", "花月"]],
  ["芙蓉", ["Phoebe", "芙蓉"]],
  ["波妮", ["Glacia", "波妮"]],
  ["源治", ["Drake", "源治"]],

  ["瓢太", ["Roark", "Hyouta", "瓢太"]],
  ["菜种", ["Gardenia", "Natane", "菜种", "菜種"]],
  ["阿李", ["Maylene", "Sumomo", "阿李"]],
  ["吉宪", ["Crasher Wake", "CrasherWake", "Makishi", "吉宪", "吉憲"]],
  ["梅丽莎", ["Fantina", "Merissa", "梅丽莎", "梅麗莎"]],
  ["东瓜", ["Byron", "Tougan", "东瓜", "東瓜"]],
  ["小菘", ["Candice", "Suzuna", "小菘"]],
  ["电次", ["Volkner", "Denji", "电次", "電次"]],
  ["阿柳", ["Aaron", "阿柳"]],
  ["菊野", ["Bertha", "菊野"]],
  ["大叶", ["Flint", "大叶", "大葉"]],
  ["悟松", ["Lucian", "Goyou", "悟松"]],
  ["竹兰", ["Cynthia", "Shirona", "竹兰", "竹蘭"]],
  ["赤日", ["Cyrus", "赤日"]],
  ["伙星", ["Mars", "伙星"]],
  ["岁星", ["Jupiter", "岁星", "歲星"]],
  ["镇星", ["Saturn", "镇星", "鎮星"]],
  ["阿驯", ["Barry", "Jun", "Pearl", "Rival", "阿驯", "阿馴"]],

  ["阿戴克", ["Alder", "Adeku", "阿戴克"]],
  ["芦荟", ["Lenora", "Aloe", "芦荟", "蘆薈"]],
  ["亚堤", ["Burgh", "Arti", "亚堤", "亞堤"]],
  ["白露", ["Bianca", "Bel", "白露"]],
  ["黑连", ["Cheren", "黑连", "黑連"]],
  ["伯特", ["Chili", "Pod", "伯特"]],
  ["天桐", ["Cilan", "Dent", "天桐"]],
  ["寇恩", ["Cress", "Corn", "寇恩"]],
  ["风露", ["Skyla", "Fuuro", "风露", "風露"]],
  ["魁奇思", ["Ghetsis", "Geechisu", "魁奇思"]],
  ["越橘", ["Grimsley", "Giima", "越橘"]],
  ["哈奇库", ["Brycen", "Hachiku", "哈奇库", "哈奇庫"]],
  ["艾莉丝", ["Iris", "艾莉丝", "艾莉絲"]],
  ["小菊儿", ["Elesa", "Kamitsure", "小菊儿", "小菊兒"]],
  ["N", ["N"]],
  ["连武", ["Marshal", "Renbu", "连武", "連武"]],
  ["夏卡", ["Drayden", "Shaga", "夏卡"]],
  ["婉龙", ["Shauntal", "Shikimi", "婉龙", "婉龍"]],
  ["菊老大", ["Clay", "Yacon", "菊老大"]],
  ["嘉德丽雅", ["Caitlin", "Cattleya", "嘉德丽雅", "嘉德麗雅"]],
  ["霍米加", ["Roxie", "霍米加"]],
  ["西子伊", ["Marlon", "西子伊"]],
  ["阿克罗玛", ["Colress", "阿克罗玛", "阿克羅瑪"]],
  ["修", ["Hugh", "修"]],
  ["班吉", ["Benga", "班吉"]],
  ["罗德", ["Rood", "罗德", "羅德"]],
  ["维奥", ["Zinzolin", "维奥", "維奧"]],
  ["北尚", ["Subway Master A", "Subway_Master_A", "Ingo", "北尚"]],
  ["南厦", ["Subway Master B", "Subway_Master_B", "Emmet", "南厦", "南廈"]],

  ["斗子", ["White", "Touko", "Hilda", "斗子", "鬥子"]],
  ["斗也", ["Black", "Touya", "Hilbert", "斗也", "鬥也"]],
  ["鸣依", ["Rosa", "鸣依", "鳴依"]],
  ["共平", ["Nate", "共平"]],
  ["小光", ["Dawn", "小光"]],
  ["光辉", ["Lucas", "光辉", "光輝"]],
  ["响", ["Ethan", "Gold", "Hibiki", "响", "響"]],
  ["琴音", ["Lyra", "Kotone", "琴音"]],
  ["小悠", ["Brendan", "小悠"]],
  ["小遥", ["May", "小遥", "小遙"]],

  ["达莉亚", ["Dahlia", "达莉亚", "達莉亞"]],
  ["桄榔", ["Palmer", "Tower Tycoon Palmer", "桄榔"]],
  ["石兰", ["Darach", "Kochrane", "石兰", "石蘭"]],
  ["凯特", ["Argenta", "Kate", "凯特", "凱特"]],
  ["捩木", ["Thorton", "Nejiki", "捩木"]],
  ["亚玄", ["Riley", "亚玄", "亞玄"]],
  ["芽米", ["Cheryl", "芽米"]],
  ["麦可", ["Buck", "麦可", "麥可"]],
  ["米依", ["Mira", "米依"]],
  ["麦儿", ["Marley", "麦儿", "麥兒"]],
  ["水京", ["Eusine", "水京"]],
  ["阿波罗", ["Archer", "Apollo", "阿波罗", "阿波羅"]],
  ["雅典娜", ["Ariana", "Athena", "雅典娜"]],
  ["兰斯", ["Proton", "Lambda", "兰斯", "蘭斯"]],

  ["卡露妮", ["Diantha", "Karune", "卡露妮", "卡魯妮"]],
  ["库库伊", ["Kukui", "库库伊", "庫庫伊"]],
  ["叶子", ["Leaf", "叶子", "葉子"]],
  ["莎莉娜", ["Serena", "莎莉娜"]],
  ["卡鲁穆", ["Calem", "卡鲁穆", "卡魯穆"]],
  ["玛俐", ["Marnie", "玛俐", "瑪俐"]],
  ["赫普", ["Hop", "赫普"]],
  ["彼特", ["Bede", "彼特"]],
  ["也慈", ["Geeta", "也慈"]],
  ["妮莫", ["Nemona", "妮莫"]],
  ["辛俐", ["Rika", "辛俐"]],
  ["波琵", ["Poppy", "波琵"]],
  ["青木", ["Larry", "青木"]],
  ["八朔", ["Hassel", "八朔"]],
  ["赤松", ["Crispin", "赤松"]],
  ["纳莉", ["Amarys", "纳莉", "納莉"]],
  ["紫竽", ["Lacey", "紫竽"]],
  ["杜若", ["Drayton", "杜若"]],
];

const suspiciousRemoteNames = new Set([
  "宝可梦 旅途",
  "宝可梦 THE ORIGIN",
  "宝可梦联盟",
  "宝可梦世代",
  "宝可梦世界锦标赛（动画）",
  "宝可梦特别篇",
  "精灵宝可梦 Let&#39;s Go! 皮卡丘／Let's Go! 伊布",
  "联盟社",
  "属性",
  "吹寄道馆",
  "烟墨道馆",
  "小智一行人",
  "火箭队三人组",
  "BattleRoadSummer2002finalspromo",
]);

const playerOnlyNames = new Set([
  "共平",
  "鸣依",
  "斗子",
  "斗也",
  "小光",
  "响",
  "琴音",
  "光辉",
]);

const npcRoleNames = new Set([
  "小刚", "小霞", "马志士", "莉佳", "阿桔", "阿杏", "娜姿", "夏伯", "坂木", "青绿",
  "阿速", "阿笔", "小茜", "松叶", "阿四", "阿蜜", "柳伯", "小椿",
  "一树", "希巴", "梨花", "科拿", "菊子", "赤红",
  "杜娟", "藤树", "铁旋", "亚莎", "千里", "娜琪", "小枫与小南", "亚当", "米可利", "大吾",
  "花月", "芙蓉", "波妮", "源治",
  "瓢太", "菜种", "阿李", "吉宪", "梅丽莎", "东瓜", "小菘", "电次",
  "阿柳", "菊野", "大叶", "悟松", "竹兰",
  "天桐", "伯特", "寇恩", "芦荟", "亚堤", "小菊儿", "菊老大", "风露", "哈奇库", "夏卡",
  "艾莉丝", "霍米加", "西子伊", "越橘", "连武", "婉龙", "嘉德丽雅", "阿戴克",
  "紫罗兰", "查克洛", "可尔妮", "福爷", "希特隆", "玛绣", "葛吉花", "得抚",
  "帕琦拉", "志米", "雁铠", "朵拉塞娜", "卡露妮",
  "哈拉", "丽姿", "阿塞萝拉", "卡希丽", "马睿因", "库库伊",
  "亚洛", "露璃娜", "卡芜", "彩豆", "欧尼奥", "波普菈", "玛瓜", "美蓉", "聂梓", "奇巴纳", "丹帝",
  "阿枫", "寇沙", "奇树", "海岱", "莱姆", "莉普", "古鲁夏", "辛俐", "波琵", "青木", "八朔", "也慈", "妮莫",
  "赤松", "纳莉", "紫竽", "杜若",
]);

const importantNpcRegions = [
  {
    region: "关都地区",
    sections: [
      { role: "馆主", members: ["小刚", "小霞", "马志士", "莉佳", "阿桔", "阿杏", "娜姿", "夏伯", "坂木", "青绿"] },
      { role: "四天王", members: ["科拿", "希巴", "菊子", "阿渡"] },
      { role: "冠军", members: [{ name: "小茂 / 青绿", group: "青绿" }, "赤红"] },
    ],
  },
  {
    region: "城都地区",
    sections: [
      { role: "馆主", members: ["阿速", "阿笔", "小茜", "松叶", "阿四", "阿蜜", "柳伯", "小椿"] },
      { role: "四天王", members: ["一树", "阿桔", "希巴", "梨花"] },
      { role: "冠军", members: ["阿渡"] },
    ],
  },
  {
    region: "丰缘地区",
    sections: [
      { role: "馆主", members: ["杜娟", "藤树", "铁旋", "亚莎", "千里", "娜琪", "小枫与小南", "米可利", "亚当"] },
      { role: "四天王", members: ["花月", "芙蓉", "波妮", "源治"] },
      { role: "冠军", members: ["大吾", "米可利"] },
    ],
  },
  {
    region: "神奥地区",
    sections: [
      { role: "馆主", members: ["瓢太", "菜种", "阿李", "吉宪", "梅丽莎", "东瓜", "小菘", "电次"] },
      { role: "四天王", members: ["阿柳", "菊野", "大叶", "悟松"] },
      { role: "冠军", members: ["竹兰"] },
    ],
  },
  {
    region: "合众地区",
    sections: [
      { role: "馆主", members: ["天桐", "伯特", "寇恩", "芦荟", "黑连", "霍米加", "亚堤", "小菊儿", "菊老大", "风露", "哈奇库", "夏卡", "艾莉丝", "西子伊"] },
      { role: "四天王", members: ["越橘", "连武", "婉龙", "嘉德丽雅"] },
      { role: "冠军", members: ["阿戴克", "艾莉丝"] },
    ],
  },
  {
    region: "卡洛斯地区",
    sections: [
      { role: "馆主", members: ["紫罗兰", "查克洛", "可尔妮", "福爷", "希特隆", "玛绣", "葛吉花", "得抚"] },
      { role: "四天王", members: ["帕琦拉", "志米", "雁铠", "朵拉塞娜"] },
      { role: "冠军", members: ["卡露妮"] },
    ],
  },
  {
    region: "阿罗拉地区",
    sections: [
      { role: "馆主", members: [] },
      { role: "四天王", members: ["哈拉", "丽姿", "阿塞萝拉", "卡希丽", "马睿因"] },
      { role: "冠军", members: ["库库伊"] },
    ],
  },
  {
    region: "伽勒尔地区",
    sections: [
      { role: "馆主", members: ["亚洛", "露璃娜", "卡芜", "彩豆", "欧尼奥", "波普菈", "玛瓜", "美蓉", "聂梓", "奇巴纳"] },
      { role: "四天王", members: [] },
      { role: "冠军", members: ["丹帝"] },
    ],
  },
  {
    region: "帕底亚地区",
    sections: [
      { role: "馆主", members: ["阿枫", "寇沙", "奇树", "海岱", "青木", "莱姆", "莉普", "古鲁夏"] },
      { role: "四天王", members: ["辛俐", "波琵", "青木", "八朔"] },
      { role: "冠军", members: ["也慈", "妮莫"] },
    ],
  },
  {
    region: "蓝莓学园",
    sections: [
      { role: "馆主", members: [] },
      { role: "四天王", members: ["赤松", "纳莉", "紫竽", "杜若"] },
      { role: "冠军", members: [] },
    ],
  },
];

function simplify(value) {
  return String(value || "")
    .replaceAll("蘭", "兰")
    .replaceAll("綠", "绿")
    .replaceAll("紅", "红")
    .replaceAll("葉", "叶")
    .replaceAll("遙", "遥")
    .replaceAll("鬥", "斗")
    .replaceAll("鳴", "鸣")
    .replaceAll("連", "连")
    .replaceAll("魯", "鲁")
    .replaceAll("庫", "库")
    .replaceAll("瑪", "玛")
    .replaceAll("麗", "丽")
    .replaceAll("絲", "丝")
    .replaceAll("亞", "亚")
    .replaceAll("樹", "树")
    .replaceAll("風", "风")
    .replaceAll("鐵", "铁")
    .replaceAll("電", "电")
    .replaceAll("夢", "梦")
    .replaceAll("寶", "宝")
    .replaceAll("魁奇思", "魁奇思");
}

function keyOf(value) {
  return simplify(value)
    .toLowerCase()
    .replace(/&[#a-z0-9]+;/g, "")
    .replace(/[（(].*?[）)]/g, "")
    .replace(/\b(vs|spr|sprite|challenge|masters|platinum|hgss|b2w2|bw|dp|pt|oras|bdsp|frlg|lple|xy|sm|swsh|sv|sc|e)\b/gi, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function stripLocalName(name) {
  let value = String(name || "");
  value = value.replace(/^BackSprite[-_]/, "");
  value = value.replace(/^Spr_/, "");
  value = value.replace(/^(B2W2|BW|DP|PT|Pt|HGSS)_/, "");
  value = value.replace(/^VS/, "");
  value = value.replace(/Challenge\d*$/, "");
  value = value.replace(/_Back$/, "");
  value = value.replace(/Back$/, "");
  value = value.replace(/Platinum$/, "");
  value = value.replace(/PtHGSS$/, "");
  value = value.replace(/HGSS$/, "");
  value = value.replace(/_DP$/, "");
  value = value.replace(/^Sprite/, "");
  value = value.replace(/^GalacticBoss/, "");
  value = value.replace(/^Tower_Tycoon_/, "");
  value = value.replace(/_2$/, "");
  value = value.replace(/_/g, " ");
  value = value.replace(/\s+/g, " ").trim();
  if (value === "Crasher Wake") return "Crasher Wake";
  if (value === "Lt Surge") return "Lt Surge";
  return value;
}

function cleanRemoteName(name) {
  return simplify(String(name || ""))
    .replace(/\.(png|gif|jpg|jpeg|webp)$/i, "")
    .replace(/^VS\s+/, "")
    .replace(/\s+Masters$/, "")
    .replace(/[（(]冠军[）)]/g, "")
    .replace(/[（(]冠軍[）)]/g, "")
    .replace(/\s+(BW|B2W2|HGSS|ORAS|BDSP|FRLG|LPLE|XY|SM|SWSH|SV|SC)$/i, "")
    .trim();
}

const aliasByKey = new Map();
const aliasReview = aliasRows.map(([canonical, aliases]) => {
  const keys = [...new Set([canonical, ...aliases].map(keyOf).filter(Boolean))];
  for (const key of keys) aliasByKey.set(key, canonical);
  return { canonical, aliases, keys, confidence: "manual-seed" };
});

function canonicalForLocal(name) {
  const base = stripLocalName(name);
  const key = keyOf(base);
  return aliasByKey.get(key) || base;
}

function canonicalForRemote(name) {
  const cleaned = cleanRemoteName(name);
  const key = keyOf(cleaned);
  return aliasByKey.get(key) || cleaned;
}

function canonicalForRemoteAsset(asset) {
  const nameCanonical = canonicalForRemote(asset.name);
  const fileCanonical = asset.fileName ? canonicalForRemote(asset.fileName) : "";
  if (fileCanonical && (npcRoleNames.has(fileCanonical) || playerOnlyNames.has(fileCanonical) || aliasByKey.has(keyOf(fileCanonical)))) {
    return fileCanonical;
  }
  return nameCanonical;
}

function withCanonicalName(asset, canonical) {
  if (!canonical || canonical === asset.name) return asset;
  return { ...asset, name: canonical };
}

function assetKindLabel(kind) {
  if (kind === "pixel-front") return "本地像素";
  if (kind === "remote-portrait") return "神百立绘";
  if (kind === "pixel-vs") return "头像候选";
  if (kind === "remote-vs") return "头像候选";
  if (kind === "pixel-back") return "玩家背面";
  if (kind === "trainer-front") return "路人 NPC";
  return kind;
}

function assetPath(asset) {
  return asset.localFile || asset.file;
}

function assetExt(asset) {
  return path.extname(assetPath(asset) || "").toLowerCase();
}

function assetName(asset) {
  return asset.name || asset.fileName || asset.source || asset.url;
}

function confidenceFor(asset, canonical, baseName) {
  if (asset.kind === "remote-vs") return "avatar-only";
  if (asset.kind === "pixel-vs") return "avatar-only";
  if (suspiciousRemoteNames.has(asset.name)) return "low";
  if (canonical === baseName || canonical === cleanRemoteName(baseName)) return "auto-name";
  return "alias";
}

function makeAsset(asset, options = {}) {
  return {
    kind: asset.kind,
    name: assetName(asset),
    source: asset.source || asset.fileName || asset.url,
    file: assetPath(asset),
    page: asset.page || "",
    group: asset.group || "",
    width: asset.width || null,
    height: asset.height || null,
    role: options.role || "candidate",
    confidence: options.confidence || "auto-name",
    default: false,
  };
}

const groups = new Map();

function ensureGroup(canonical) {
  const key = keyOf(canonical) || keyOf(`unknown-${groups.size + 1}`);
  if (!groups.has(key)) {
    const aliasRow = aliasReview.find((row) => row.canonical === canonical);
    groups.set(key, {
      id: key,
      name: canonical,
      aliases: aliasRow ? aliasRow.aliases : [canonical],
      default_asset: null,
      assets: [],
      needs_review: false,
      review_reason: "",
    });
  }
  return groups.get(key);
}

for (const asset of manifest.pixelFront || []) {
  const base = stripLocalName(asset.name);
  const canonical = canonicalForLocal(asset.name);
  const group = ensureGroup(canonical);
  const item = makeAsset(asset, {
    role: "battle",
    confidence: confidenceFor(asset, canonical, base),
  });
  group.assets.push(item);
}

for (const asset of (manifest.remote || []).filter((item) => item.kind === "remote-portrait")) {
  const cleaned = cleanRemoteName(asset.name);
  const canonical = canonicalForRemoteAsset(asset);
  const displayAsset = withCanonicalName(asset, canonical);
  const group = ensureGroup(canonical);
  const fileCanonical = asset.fileName ? canonicalForRemote(asset.fileName) : "";
  const trustedFileName = fileCanonical === canonical
    && (npcRoleNames.has(canonical) || playerOnlyNames.has(canonical) || aliasByKey.has(keyOf(canonical)));
  const low = suspiciousRemoteNames.has(asset.name) && !trustedFileName;
  const item = makeAsset(displayAsset, {
    role: low ? "needs-review" : "portrait",
    confidence: low ? "low" : trustedFileName ? "file-name" : confidenceFor(asset, canonical, cleaned),
  });
  group.assets.push(item);
  if (low) {
    group.needs_review = true;
    group.review_reason = "神百页面图名不像角色名，需人工确认。";
  }
}

for (const asset of manifest.pixelVs || []) {
  const base = stripLocalName(asset.name);
  const canonical = canonicalForLocal(asset.name);
  const group = ensureGroup(canonical);
  group.assets.push(makeAsset(asset, {
    role: "avatar",
    confidence: confidenceFor(asset, canonical, base),
  }));
}

for (const asset of (manifest.remote || []).filter((item) => item.kind === "remote-vs")) {
  const cleaned = cleanRemoteName(asset.name);
  const canonical = canonicalForRemoteAsset(asset);
  const displayAsset = withCanonicalName(asset, canonical);
  const group = ensureGroup(canonical);
  group.assets.push(makeAsset(displayAsset, {
    role: "avatar",
    confidence: confidenceFor(asset, canonical, cleaned),
  }));
}

for (const asset of manifest.pixelBack || []) {
  const canonical = canonicalForLocal(asset.name);
  if (!playerOnlyNames.has(canonical)) continue;
  const group = ensureGroup(canonical);
  group.assets.push(makeAsset(asset, {
    role: "player-back",
    confidence: "player-selected",
  }));
}

function defaultSortValue(asset) {
  const ext = assetExt(asset);
  if (asset.kind === "pixel-front" && ext === ".gif") return 0;
  if (asset.kind === "pixel-front") return 1;
  if (asset.kind === "remote-portrait") return 2;
  if (asset.kind === "pixel-vs") return 3;
  if (asset.kind === "remote-vs") return 4;
  if (asset.kind === "pixel-back") return 5;
  return 6;
}

for (const group of groups.values()) {
  group.assets.sort((a, b) => {
    const primary = defaultSortValue(a) - defaultSortValue(b);
    if (primary !== 0) return primary;
    return String(a.name).localeCompare(String(b.name), "zh-CN");
  });
  const defaultAsset = group.assets.find((asset) => asset.kind === "pixel-front" && assetExt(asset) === ".gif")
    || group.assets.find((asset) => asset.kind === "pixel-front")
    || group.assets.find((asset) => asset.kind === "remote-portrait")
    || null;
  if (defaultAsset) {
    defaultAsset.default = true;
    group.default_asset = defaultAsset;
  } else {
    group.needs_review = true;
    group.review_reason = group.review_reason || "没有可用战斗立绘，只有头像/开场候选。";
  }
  if (group.assets.some((asset) => asset.confidence === "low")) {
    group.needs_review = true;
  }
}

const allGrouped = [...groups.values()].sort((a, b) => {
  const aDefault = a.default_asset ? 0 : 1;
  const bDefault = b.default_asset ? 0 : 1;
  if (aDefault !== bDefault) return aDefault - bDefault;
  return a.name.localeCompare(b.name, "zh-CN");
});

const groupByName = new Map(allGrouped.map((group) => [group.name, group]));
function normalizeMember(member) {
  if (typeof member === "string") return { name: member, group_name: member };
  return { name: member.name, group_name: member.group || member.name };
}

const importantNpcRegionsGrouped = importantNpcRegions.map((region) => ({
  region: region.region,
  sections: region.sections.map((section) => ({
    role: section.role,
    members: section.members.map((member) => {
      const normalized = normalizeMember(member);
      const group = groupByName.get(normalized.group_name) || null;
      return {
        name: normalized.name,
        group_name: normalized.group_name,
        group_id: group ? group.id : "",
        missing: !group,
        group,
      };
    }),
  })),
}));
const regionIdentityCount = importantNpcRegionsGrouped.reduce(
  (sum, region) => sum + region.sections.reduce((roleSum, section) => roleSum + section.members.length, 0),
  0,
);
const missingRegionIdentityCount = importantNpcRegionsGrouped.reduce(
  (sum, region) => sum + region.sections.reduce(
    (roleSum, section) => roleSum + section.members.filter((member) => member.missing).length,
    0,
  ),
  0,
);

const npcNameOrder = new Set();
for (const region of importantNpcRegionsGrouped) {
  for (const section of region.sections) {
    for (const member of section.members) {
      if (member.group && !playerOnlyNames.has(member.group.name)) npcNameOrder.add(member.group.name);
    }
  }
}

const playerCharacterGroups = allGrouped.filter((group) => playerOnlyNames.has(group.name));
const npcGroups = [...npcNameOrder].map((name) => groupByName.get(name)).filter(Boolean);
const npcNameSet = new Set(npcGroups.map((group) => group.name));
const excludedGroups = allGrouped.filter((group) => !playerOnlyNames.has(group.name) && !npcNameSet.has(group.name));
const avatarPool = [
  ...(manifest.pixelVs || []).map((asset) => makeAsset(asset, {
    role: "avatar",
    confidence: "keep-all",
  })),
  ...(manifest.remote || []).filter((item) => item.kind === "remote-vs").map((asset) => {
    const canonical = canonicalForRemoteAsset(asset);
    return makeAsset(withCanonicalName(asset, canonical), {
      role: "avatar",
      confidence: "keep-all",
    });
  }),
].sort((a, b) => String(a.name).localeCompare(String(b.name), "zh-CN"));
const normalNpcPool = copyTrainerFrontAssets().sort((a, b) => String(a.name).localeCompare(String(b.name), "zh-CN"));

const output = {
  generated_from: "work/npc_portrait_preview_manifest.json",
  rules: {
    battle_default_priority: ["pixel-front .gif", "pixel-front .png", "remote-portrait"],
    avatar_only: ["pixel-vs", "remote-vs"],
    npc_pool_policy: "only gym leaders, elite four, and champions; player-selected characters are excluded from npc_groups",
    player_character_policy: "circled player-related characters go to player_character_groups, not npc_groups",
    normal_npc_policy: "ordinary trainer-class sprites from 正面/小卒 are kept for normal battles",
  },
  counts: {
    npc_groups: npcGroups.length,
    region_identities: regionIdentityCount,
    missing_region_identities: missingRegionIdentityCount,
    player_character_groups: playerCharacterGroups.length,
    avatar_assets: avatarPool.length,
    normal_npc_assets: normalNpcPool.length,
    excluded_groups: excludedGroups.length,
    review_groups: npcGroups.filter((group) => group.needs_review).length + playerCharacterGroups.filter((group) => group.needs_review).length,
  },
  npc_groups: npcGroups,
  important_npc_regions: importantNpcRegionsGrouped,
  player_character_groups: playerCharacterGroups,
  avatar_pool: avatarPool,
  normal_npc_pool: normalNpcPool,
  excluded_groups: excludedGroups.map((group) => ({
    id: group.id,
    name: group.name,
    asset_count: group.assets.length,
    reason: "不是馆主/四天王/冠军，也不是圈选玩家角色；头像资源已保留在 avatar_pool。",
  })),
};

fs.writeFileSync(groupedPath, JSON.stringify(output, null, 2));
fs.writeFileSync(aliasPath, JSON.stringify({
  notes: [
    "manual-seed 表示脚本内置高置信别名。",
    "auto-name 表示按清理后的同名自动分组。",
    "file-name 表示神百上下文名不稳，但文件名命中正式角色。",
    "low 表示疑似页面杂图或无法确认角色，需要人工看图。",
    "avatar-only 表示仅作为头像/开场候选，不参与战斗默认立绘。",
    "npc_groups 只保留馆主、四天王、冠军；player_character_groups 是圈选玩家角色相关资源。",
  ],
  aliases: aliasReview,
  unmatched_review_groups: [...npcGroups, ...playerCharacterGroups]
    .filter((group) => group.needs_review)
    .map((group) => ({
      name: group.name,
      reason: group.review_reason,
      assets: group.assets.map((asset) => ({
        kind: asset.kind,
        name: asset.name,
        source: asset.source,
        confidence: asset.confidence,
      })),
    })),
}, null, 2));

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[ch]));
}

function card(asset) {
  const label = assetKindLabel(asset.kind);
  const classes = ["asset-card"];
  if (asset.kind.startsWith("pixel")) classes.push("pixel");
  if (asset.default) classes.push("default");
  const badge = asset.default ? `<span class="badge default-badge">默认</span>` : "";
  const review = asset.confidence === "low" ? `<span class="badge review-badge">低置信</span>` : "";
  const avatar = asset.role === "avatar" ? `<span class="badge avatar-badge">头像候选</span>` : "";
  const player = asset.role === "player-back" ? `<span class="badge player-badge">玩家背面</span>` : "";
  return `<article class="${classes.join(" ")}">
    <div class="asset-head"><strong>${esc(asset.name)}</strong>${badge}${review}${avatar}${player}</div>
    <div class="imgbox"><img loading="lazy" src="${esc(asset.file)}" alt="${esc(asset.name)}"></div>
    <div class="asset-meta"><span>${esc(label)}</span><span>${esc(asset.page || asset.group || "")}</span></div>
    <code>${esc(asset.source)}</code>
  </article>`;
}

function groupSection(group, options = {}) {
  const aliases = group.aliases.filter((alias) => alias !== group.name).slice(0, 8).join(" / ");
  const review = group.needs_review ? `<span class="group-review">待确认</span>` : "";
  const prefix = options.prefix || "npc";
  const title = options.title || group.name;
  return `<section class="npc-group" id="${esc(prefix)}-${esc(group.id)}">
    <header class="group-head">
      <div>
        <h2>${esc(title)} ${review}</h2>
        <p>${esc(aliases || "按文件名自动分组")}</p>
      </div>
      <div class="group-count">${group.assets.length} 张</div>
    </header>
    <div class="asset-grid">${group.assets.map(card).join("\n")}</div>
  </section>`;
}

function roleMembersSection(region, section) {
  const members = section.members.map((member) => {
    if (!member.group) {
      return `<section class="npc-group missing-group">
        <header class="group-head"><div><h2>${esc(member.name)} <span class="group-review">缺资源</span></h2><p>${esc(member.group_name)}</p></div><div class="group-count">0 张</div></header>
      </section>`;
    }
    return groupSection(member.group, {
      prefix: `region-${keyOf(region.region)}-${keyOf(section.role)}`,
      title: member.name === member.group.name ? member.group.name : `${member.name}（${member.group.name}）`,
    });
  }).join("\n");
  const empty = section.members.length === 0 ? `<p class="empty-role">本地区没有该分类，暂不展示角色。</p>` : "";
  return `<section class="role-section">
    <header class="role-head"><h3>${esc(section.role)}</h3><span>${section.members.length} 人</span></header>
    ${empty}
    ${members}
  </section>`;
}

function regionSection(region) {
  const memberCount = region.sections.reduce((sum, section) => sum + section.members.length, 0);
  return `<section class="region-section" id="region-${esc(keyOf(region.region))}">
    <header class="region-head"><div><h2>${esc(region.region)}</h2><p>按馆主 / 四天王 / 冠军聚合，同一 NPC 可在多个身份中重复出现。</p></div><div class="group-count">${memberCount} 个身份</div></header>
    ${region.sections.map((section) => roleMembersSection(region, section)).join("\n")}
  </section>`;
}

function simpleAssetSection(id, title, desc, assets) {
  return `<section class="player-pool" id="${esc(id)}">
    <header class="group-head"><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div><div class="group-count">${assets.length} 张</div></header>
    <div class="asset-grid">${assets.map(card).join("\n")}</div>
  </section>`;
}

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>NPC Portrait Grouped Review</title>
  <style>
    :root{color-scheme:light dark;--bg:#f4f1ea;--panel:#fffaf1;--ink:#211d18;--muted:#71675d;--line:#d8cec0;--accent:#2d6cdf;--ok:#1d7f4f;--warn:#aa5b00;--avatar:#7451c8}
    body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .top{position:sticky;top:0;z-index:2;background:rgba(244,241,234,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding:18px 24px}
    h1{margin:0 0 8px;font-size:26px}p{margin:0;color:var(--muted)}nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
    nav a{color:var(--ink);text-decoration:none;border:1px solid var(--line);border-radius:999px;background:var(--panel);padding:6px 10px}
    main{padding:18px 24px 48px}.summary{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px}.pill{border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:8px 12px}
    .npc-group,.player-pool,.region-section{border-top:1px solid var(--line);padding-top:20px;margin-top:22px}
    .region-section{background:color-mix(in srgb,var(--panel) 42%,transparent);border-radius:8px;padding:18px 12px 4px}
    .region-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:10px}
    .role-section{margin:18px 0 24px}.role-head{display:flex;align-items:center;gap:10px;margin:0 0 10px}.role-head h3{margin:0;font-size:19px}.role-head span,.empty-role{color:var(--muted)}
    .missing-group{border-style:dashed}
    .group-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:12px}
    h2{margin:0;font-size:22px}.group-count{white-space:nowrap;color:var(--muted);font-weight:700}.group-review{font-size:13px;color:#fff;background:var(--warn);border-radius:999px;padding:3px 8px;vertical-align:middle}
    .asset-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:12px}
    .asset-card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:10px;min-width:0}.asset-card.default{border-color:var(--ok);box-shadow:0 0 0 2px color-mix(in srgb,var(--ok) 18%,transparent)}
    .asset-head{display:flex;gap:6px;align-items:center;flex-wrap:wrap;min-height:26px}.asset-head strong{font-size:15px}
    .badge{font-size:11px;border-radius:999px;padding:2px 7px;color:#fff}.default-badge{background:var(--ok)}.review-badge{background:var(--warn)}.avatar-badge{background:var(--avatar)}.player-badge{background:var(--accent)}
    .imgbox{height:170px;margin:8px 0;border:1px solid var(--line);border-radius:6px;display:grid;place-items:center;background:linear-gradient(180deg,#fff,#eee7dc);overflow:hidden}
    .imgbox img{max-width:96%;max-height:160px;object-fit:contain}.pixel .imgbox{image-rendering:pixelated}.pixel .imgbox img{image-rendering:pixelated;transform:scale(2.4);transform-origin:center}
    .asset-meta{display:flex;justify-content:space-between;gap:8px;color:var(--muted);font-size:12px;margin-bottom:6px}
    code{display:block;white-space:normal;overflow-wrap:anywhere;font-size:11px;color:#5d5349;background:rgba(0,0,0,.04);border-radius:4px;padding:4px}
    @media (prefers-color-scheme:dark){:root{--bg:#181613;--panel:#24201b;--ink:#f1e9dc;--muted:#b8aa9b;--line:#3d352e}.top{background:rgba(24,22,19,.95)}.imgbox{background:linear-gradient(180deg,#2c2822,#1e1b17)}code{color:#d0c3b6;background:rgba(255,255,255,.06)}}
  </style>
</head>
<body>
  <header class="top">
    <h1>NPC / 玩家资源整合预览</h1>
    <p>NPC 池只保留馆主、四天王、冠军；圈选角色相关资源给玩家用，不进入 NPC 池。头像候选全部保留。</p>
    <nav>
      <a href="#player-characters">玩家角色相关资源</a>
      <a href="#npc-regions">重要 NPC 地区表</a>
      <a href="#normal-npcs">路人 NPC 池</a>
      <a href="#avatars">头像候选池</a>
      <a href="npc_portrait_preview.html">原始分类预览</a>
    </nav>
  </header>
  <main>
    <div class="summary">
      <div class="pill">NPC 正式池：${npcGroups.length} 组</div>
      <div class="pill">地区身份：${regionIdentityCount} 个</div>
      <div class="pill">玩家角色：${playerCharacterGroups.length} 组</div>
      <div class="pill">路人 NPC：${normalNpcPool.length} 张</div>
      <div class="pill">头像候选：${avatarPool.length} 张</div>
      <div class="pill">已排除非 NPC：${excludedGroups.length} 组</div>
    </div>
    <section class="player-pool" id="player-characters">
      <header class="group-head"><div><h2>玩家角色相关资源</h2><p>圈选角色的正面、背面、头像放在这里，后续给玩家配置使用，不进入 NPC 池。</p></div><div class="group-count">${playerCharacterGroups.length} 组</div></header>
    </section>
    ${playerCharacterGroups.map((group) => groupSection(group, { prefix: "player" })).join("\n")}
    <section class="player-pool" id="npc-regions">
      <header class="group-head"><div><h2>重要 NPC 地区表</h2><p>按地区，再按馆主 / 四天王 / 冠军聚合。阿渡等多身份角色会重复出现。</p></div><div class="group-count">${importantNpcRegionsGrouped.length} 个地区</div></header>
    </section>
    ${importantNpcRegionsGrouped.map(regionSection).join("\n")}
    ${simpleAssetSection("normal-npcs", "路人 NPC 池", "来自本地 正面/小卒，用于普通战斗，让非 Boss 对局也能有训练师图。", normalNpcPool)}
    ${simpleAssetSection("avatars", "头像候选池", "本地 VS/Challenge 和神百 Masters/VS 图全部保留，后续可用于玩家头像、NPC 头像或开场卡。", avatarPool)}
  </main>
</body>
</html>`;

fs.writeFileSync(htmlPath, html);

console.log(JSON.stringify({
  grouped: groupedPath,
  aliases: aliasPath,
  html: htmlPath,
  counts: output.counts,
}, null, 2));
