import type {BattleAnimationKindV4, BattleProtocolEventV4, BattleProtocolSeatV4} from "./battleV4Playback";

export type ShowdownAnimationSourceV4 = "BattleMoveAnims" | "BattleOtherAnims" | "BattleStatusAnims" | "fallback" | "native";
export type ShowdownAnimationFidelityV4 = "fallback" | "preset" | "native" | "exact";

export type ShowdownActorAnimPropsV4 = Partial<{
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  xscale: number;
  yscale: number;
}>;

export type ShowdownSpriteActorV4 = {
  seat: BattleProtocolSeatV4;
  ident: string;
  side: "near" | "far" | "";
  slotIndex: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  xscale: number;
  yscale: number;
};

export type ShowdownEffectSpriteV4 = {
  effectId: string;
  assetPath: string;
  width?: number;
  height?: number;
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  blendMode?: "normal" | "screen" | "multiply";
};

export type ShowdownAnimationStepV4 =
  | {type: "showEffect"; effectId: string; from: ShowdownSpriteActorV4; to: ShowdownSpriteActorV4; durationMs: number; delayMs?: number; easing?: string; fade?: "in" | "out" | "both" | "none"; explode?: boolean; sprite: ShowdownEffectSpriteV4}
  | {type: "actorAnim"; actor: ShowdownSpriteActorV4; props: ShowdownActorAnimPropsV4; durationMs: number; easing?: string}
  | {type: "delay"; actor?: ShowdownSpriteActorV4; durationMs: number}
  | {type: "wait"; durationMs: number}
  | {type: "backgroundEffect"; color: string; durationMs: number; opacity: number}
  | {type: "resultAnim"; actor: ShowdownSpriteActorV4; text: string; tone: "good" | "bad" | "neutral" | "status" | "weather" | ""}
  | {type: "damageAnim"; actor: ShowdownSpriteActorV4; damage: number | null}
  | {type: "healAnim"; actor: ShowdownSpriteActorV4; heal: number | null}
  | {type: "checkpoint"; checkpointId: string};

export type ShowdownAnimationTimelineV4 = {
  id: string;
  animationKey: string;
  source: ShowdownAnimationSourceV4;
  protocolSequence: number;
  turn: number | null;
  actorSeat: BattleProtocolSeatV4;
  targetSeats: BattleProtocolSeatV4[];
  effectSprite: string;
  steps: ShowdownAnimationStepV4[];
  checkpoints: string[];
  fallback: boolean;
  adapterFidelity: ShowdownAnimationFidelityV4;
  sourceKey: string;
  aliasTargetKey: string;
  compositeTargets: string[];
  showdownInstructionCount: number;
  missingFxAssets: string[];
};

export type ShowdownAnimationContextV4 = {
  event: BattleProtocolEventV4;
  kind: BattleAnimationKindV4;
  checkpointId: string;
  message: string;
  resultText: string;
  resultTone: "good" | "bad" | "neutral" | "status" | "weather" | "";
  durationMs: number;
};

export type ShowdownAnimationExecutionOptionsV4 = {
  skip?: boolean;
  onStep?: (step: ShowdownAnimationStepV4, timeline: ShowdownAnimationTimelineV4) => void | Promise<void>;
  onCheckpoint?: (checkpointId: string, timeline: ShowdownAnimationTimelineV4) => void | Promise<void>;
};

export type ShowdownAnimationExecutionResultV4 = {
  timelineId: string;
  animationKey: string;
  consumedSteps: number;
  consumedCheckpoints: string[];
  skipped: boolean;
};

export type ShowdownAnimationKeySelectionV4 = {
  animationKey: string;
  source: ShowdownAnimationSourceV4;
  fallback: boolean;
  sourceKey: string;
  aliasTargetKey: string;
  compositeTargets: string[];
};

const FIRST_BATCH_OTHER_ANIMS = new Set([
  "hitmark",
  "attack",
  "contactattack",
  "xattack",
  "slashattack",
  "clawattack",
  "punchattack",
  "bite",
  "kick",
  "fastattack",
  "fastanimattack",
  "fastanimspecial",
  "fastanimself",
  "sneakattack",
  "spinattack",
  "bound",
  "selfstatus",
  "lightstatus",
  "chargestatus",
  "heal",
  "shake",
  "consume",
  "leech",
  "drain",
  "hydroshot",
  "sound",
]);

const SUPPORTED_OTHER_ANIMS = new Set([
  ...FIRST_BATCH_OTHER_ANIMS,
  "shiny",
  "flight",
  "dance",
  "gravity",
  "futuresighthit",
  "doomdesirehit",
  "itemoff",
  "anger",
  "bidecharge",
  "bideunleash",
  "spectralthiefboost",
  "schoolingin",
  "schoolingout",
  "primalalpha",
  "primalomega",
  "megaevo",
  "zpower",
  "teratransform",
  "dynamaxtransform",
  "powerconstruct",
  "ultraburst",
]);

const FIRST_BATCH_STATUS_ANIMS = new Set([
  "brn",
  "psn",
  "slp",
  "par",
  "frz",
  "flinch",
  "attracted",
  "cursed",
  "confused",
  "confusedselfhit",
]);

const SUPPORTED_STATUS_ANIMS = FIRST_BATCH_STATUS_ANIMS;

const FIRST_BATCH_MOVE_ANIMS = new Set([
  "bravebird",
  "acrobatics",
  "flyingpress",
  "steelwing",
  "wingattack",
  "dualwingbeat",
  "dragonbreath",
  "dragonpulse",
  "focusblast",
  "aurasphere",
  "uturn",
  "flipturn",
  "rapidspin",
  "gyroball",
  "mortalspin",
  "icespinner",
  "voltswitch",
  "thunderwave",
  "shockwave",
  "discharge",
  "bugbuzz",
  "swordsdance",
  "dragondance",
  "aerialace",
  "eruption",
  "weatherball",
  "earthquake",
  "bulldoze",
  "gigaimpact",
  "heavyslam",
  "seismictoss",
  "crushclaw",
  "falseswipe",
  "direclaw",
  "dragonclaw",
  "furycutter",
  "cut",
  "nightslash",
  "shadowclaw",
  "holdback",
  "knockdown",
  "peck",
  "drillpeck",
  "irontail",
  "superfang",
  "bugbite",
  "crunch",
  "pursuit",
  "metalclaw",
  "scratch",
  "slash",
  "bite",
  "pound",
  "closecombat",
  "doublekick",
  "quickattack",
  "machpunch",
  "metalsound",
  "thunderbolt",
  "psychic",
  "icebeam",
  "flamethrower",
  "rockslide",
  "fireblast",
  "shadowball",
  "energyball",
  "airslash",
  "surf",
  "hydropump",
  "blastburn",
  "swift",
  "transform",
  "protect",
  "recover",
  "rest",
]);

const SUPPORTED_MOVE_ANIMS = new Set([
  ...FIRST_BATCH_MOVE_ANIMS,
  ..."taunt instruct quash swagger quiverdance victorydance agility doubleteam metronome teeterdance splash encore attract raindance sunnyday hail snowscape chillyreception sandstorm gravity trickroom magicroom wonderroom afteryou allyswitch babydolleyes faketears tearfullook featherdance followme foresight mimic sketch doodle odorsleuth celebrate playnice tailwhip leer kinesis electricterrain grassyterrain mistyterrain lifedew junglehealing topsyturvy embargo healblock flash tailwind orderup technoblast painsplit flail explosion populationbomb auroraveil reflect safeguard lightscreen mist bellydrum aromatherapy healbell magiccoat detect kingsshield spikyshield burningbulwark banefulbunker craftyshield matblock quickguard wideguard endure bide focusenergy rockpolish harden defensecurl irondefense howl acupressure curse autotomize shiftgear bulkup shellsmash stockpile swallow ingrain aquaring coil conversion powertrick ragepowder refresh recycle doomdesire teleport cottonguard defendorder meditate sharpen withdraw roost softboiled milkdrink happyhour snatch acidarmor barrier morningsun moonlight lunarblessing cosmicpower charge luckychant geomancy magnetrise substitute batonpass calmmind nastyplot minimize growth tailglow takeheart trick switcheroo skillswap shadowforce bounce dig dive fly skydrop skullbash skyattack hiddenpower storedpower haze seedflare powerwhip woodhammer ivycudgel ivycudgelwater ivycudgelfire ivycudgelrock multiattack blazekick lowkick stomp thunderouskick tropkick jumpkick highjumpkick ironhead heartstamp slam dragontail reversal punishment forcepalm circlethrow knockoff assurance chipaway bodyslam bloodmoon gigatonhammer steamroller clamp wakeupslap smellingsalts karatechop crosschop lick visegrip headbutt block xscissor crosspoison facade guillotine return leafblade thrash pluck bind dualchop doublehit doubleslap endeavor playrough strength hammerarm icehammer skyuppercut meteormash shadowpunch ragefist focuspunch drainpunch dynamicpunch cometpunch megapunch poweruppunch dizzypunch needlearm rocksmash hornleech absorb megadrain gigadrain bitterblade leechlife extremespeed suckerpunch astonish rollout accelerock bulletpunch wickedblow vacuumwave jetpunch assist mirrormove naturepower copycat sleeptalk megahorn firepunch icepunch thunderpunch poisonfang psychicfangs icefang firefang thunderfang wildcharge spark zapcannon armorcannon torchsong chloroblast hyperbeam shelltrap spinout matchagotcha flamecharge flareblitz burnup beakblast vcreate outrage ragingfury boltstrike fusionflare fusionbolt zenheadbutt fakeout covet feint thief shadowsneak feintattack struggle tickle earthpower drillrun poisongas smog clearsmog bonemerang boneclub shadowbone whirlwind hurricane springtidestorm wildboltstorm sandsearstorm ominouswind magmastorm firespin leaftornado roar round yawn sing perishsong partingshot nobleroar disarmingvoice growl screech snore synchronoise sonicboom eerieimpulse supersonic confide defog grasswhistle hypervoice boomburst heatwave snarl thunder thundercage meanlook nightshade fairylock rockblast geargrind iciclespear tailslap furyswipes furyattack bulletseed spikecannon twineedle razorshell aquastep aquacutter wavecrash crabhammer aquajet iceshard watershuriken freezingglare freezedry icywind ancientpower powergem chargebeam psybeam twinbeam toxic spicyextract sludge sludgewave smokescreen sludgebomb syrupbomb mudbomb magnetbomb seedbomb willowisp confuseray lovelykiss rockwrecker stoneedge avalanche triplearrows thousandarrows thousandwaves iciclecrash spore judgment psystrike hex infernalparade darkpulse fierywrath terrainpulse naturesmadness ruination electroball moonblast mistball present iceball flowertrick wish healingwish stealthrock gmaxsteelsurge spikes toxicspikes stickyweb leechseed mysticalpower psyshock barbbarrage esperwing sandtomb saltcure flashcannon lusterpurge grassknot aeroblast aircutter dracometeor makeitrain brine octazooka waterpledge soak watersport scald steameruption waterpulse bubblebeam muddywater mudshot lavaplume dragonenergy waterspout solarbeam electroshot solarblade lightofruin meteorbeam blizzard sheercold glaciallance freezeshock iceburn razorwind overheat sacredfire blueflare electroweb fling worryseed rockthrow paraboliccharge drainingkiss oblivionwing signalbeam simplebeam triattack tripleaxel hypnosis darkvoid roaroftime spacialrend sacredsword secretsword psychocut precipiceblades originpulse dragonascent diamondstorm dazzlinggleam mistyexplosion payday leafstorm petaldance petalblizzard magicalleaf leafage gunkshot hyperspacehole hyperspacefury poisonjab psychoboost bestow finalgambit forestscurse trickortreat healpulse spite lockon mindreader memento spiritshackle brutalswing revelationdance prismaticlaser firstimpression shoreup firelash powertrip smartstrike spotlight anchorshot clangingscales spectralthief plasmafists collisioncourse electrodrift sunsteelstrike moongeistbeam astralbarrage photongeyser coreenforcer gigavolthavoc infernooverdrive alloutpummeling supersonicskystrike aciddownpour blackholeeclipse continentalcrush neverendingnightmare corkscrewcrash twinkletackle pulverizingpancake stokedsparksurfer catastropika sinisterarrowraid oceanicoperetta extremeevoboost guardianofalola splinteredstormshards letssnuggleforever clangoroussoulblaze soulstealing7starstrike searingsunrazesmash supercellslam psychicnoise fishiousrend stompingtantrum temperflare terastarstorm thunderclap mightycleave spiritbreak stoneaxe malignantchain hardpress dragoncheer upperhand revivalblessing blazingtorque combattorque magicaltorque noxioustorque wickedtorque tachyoncutter ficklebeam ficklebeamallout".split(" "),
]);

const MOVE_NATIVE_OTHER_MAP: Record<string, string> = {
  aerialace: "slashattack",
  crushclaw: "clawattack",
  falseswipe: "slashattack",
  direclaw: "clawattack",
  dragonclaw: "clawattack",
  furycutter: "slashattack",
  cut: "slashattack",
  holdback: "contactattack",
  knockdown: "contactattack",
  peck: "contactattack",
  drillpeck: "contactattack",
  irontail: "contactattack",
  metalclaw: "clawattack",
  scratch: "slashattack",
  slash: "slashattack",
  bite: "bite",
  pound: "contactattack",
  closecombat: "punchattack",
  doublekick: "kick",
  quickattack: "fastattack",
  machpunch: "punchattack",
  metalsound: "sound",
};

const MOVE_ALIAS_ASSIGNMENTS: Record<string, string> = {
  "10000000voltthunderbolt": "triattack",
  "acid": "sludge",
  "acidspray": "sludge",
  "amnesia": "rest",
  "appleacid": "energyball",
  "aquatail": "crabhammer",
  "armthrust": "smellingsalts",
  "aromaticmist": "mistyterrain",
  "attackorder": "bulletseed",
  "aurawheel": "discharge",
  "aurorabeam": "icebeam",
  "axekick": "highjumpkick",
  "barrage": "magnetbomb",
  "beatup": "slam",
  "behemothbash": "smartstrike",
  "behemothblade": "smartstrike",
  "belch": "gunkshot",
  "bittermalice": "spectralthief",
  "bleakwindstorm": "hurricane",
  "bloomdoom": "petaldance",
  "bodypress": "heavyslam",
  "boltbeak": "spark",
  "bonerush": "boneclub",
  "branchpoke": "vinewhip",
  "breakingswipe": "dragonclaw",
  "breakneckblitz": "gigaimpact",
  "brickbreak": "karatechop",
  "bubble": "bubblebeam",
  "burningjealousy": "heatwave",
  "camouflage": "tailglow",
  "captivate": "attract",
  "ceaselessedge": "nightslash",
  "charm": "attract",
  "chatter": "hypervoice",
  "chillingwater": "waterpulse",
  "clangoroussoul": "extremeevoboost",
  "coaching": "bulkup",
  "comeuppance": "darkpulse",
  "confusion": "psychic",
  "constrict": "bind",
  "conversion2": "conversion",
  "corrosivegas": "poisongas",
  "cottonspore": "spore",
  "counter": "slam",
  "courtchange": "skillswap",
  "crushgrip": "quash",
  "darkestlariat": "flareblitz",
  "decorate": "spore",
  "destinybond": "painsplit",
  "devastatingdrake": "dragonpulse",
  "disable": "meanlook",
  "doubleedge": "gigaimpact",
  "doubleshock": "wildcharge",
  "doubleslap": "wakeupslap",
  "dragondarts": "dragonbreath",
  "dragonhammer": "heavyslam",
  "dragonrage": "dragonbreath",
  "dragonrush": "gigaimpact",
  "dreameater": "drainingkiss",
  "drumbeating": "magicalleaf",
  "dynamaxcannon": "dragonpulse",
  "echoedvoice": "hypervoice",
  "eeriespell": "psyshock",
  "eggbomb": "magnetbomb",
  "electrify": "thunderwave",
  "ember": "flamethrower",
  "entrainment": "painsplit",
  "eternabeam": "roaroftime",
  "expandingforce": "psybeam",
  "extrasensory": "psychic",
  "fairywind": "dazzlinggleam",
  "falsesurrender": "feintattack",
  "fellstinger": "bulletseed",
  "fierydance": "magmastorm",
  "filletaway": "bulkup",
  "firelash": "multiattack",
  "firepledge": "flamethrower",
  "fissure": "earthquake",
  "flameburst": "shelltrap",
  "flamewheel": "flamecharge",
  "flatter": "attract",
  "fleurcannon": "diamondstorm",
  "floralhealing": "healpulse",
  "flowershield": "grassyterrain",
  "foulplay": "psyshock",
  "frenzyplant": "leafstorm",
  "frostbreath": "freezedry",
  "frustration": "thrash",
  "futuresight": "doomdesire",
  "gastroacid": "toxic",
  "gearup": "shiftgear",
  "genesissupernova": "psychoboost",
  "glaciate": "freezedry",
  "glaiverush": "outrage",
  "glare": "meanlook",
  "gmaxbefuddle": "savagespinout",
  "gmaxcannonade": "hydrovortex",
  "gmaxcentiferno": "infernooverdrive",
  "gmaxcuddle": "breakneckblitz",
  "gmaxdepletion": "devastatingdrake",
  "gmaxdrumsolo": "bloomdoom",
  "gmaxfinale": "twinkletackle",
  "gmaxfireball": "infernooverdrive",
  "gmaxgravitas": "shatteredpsyche",
  "gmaxhydrosnipe": "hydrovortex",
  "gmaxmalodor": "aciddownpour",
  "gmaxoneblow": "alloutpummeling",
  "gmaxrapidflow": "alloutpummeling",
  "gmaxreplenish": "breakneckblitz",
  "gmaxresonance": "subzeroslammer",
  "gmaxsandblast": "tectonicrage",
  "gmaxsmite": "twinkletackle",
  "gmaxsnooze": "maliciousmoonsault",
  "gmaxvinelash": "bloomdoom",
  "grasspledge": "magicalleaf",
  "grassyglide": "powerwhip",
  "gravapple": "energyball",
  "grudge": "meanlook",
  "guardsplit": "skillswap",
  "guardswap": "skillswap",
  "gust": "whirlwind",
  "headcharge": "gigaimpact",
  "headlongrush": "closecombat + earthpower",
  "headsmash": "gigaimpact",
  "healorder": "recover",
  "heartswap": "skillswap",
  "heatcrash": "flareblitz",
  "helpinghand": "painsplit",
  "highhorsepower": "stomp",
  "holdhands": "painsplit",
  "honeclaws": "rockpolish",
  "hornattack": "megahorn",
  "horndrill": "gigaimpact",
  "hydrocannon": "hydropump",
  "hydrosteam": "steameruption",
  "hydrovortex": "originpulse",
  "hyperdrill": "drillrun",
  "hyperfang": "superfang",
  "imprison": "embargo",
  "incinerate": "flamethrower",
  "inferno": "magmastorm",
  "infestation": "bulletseed",
  "iondeluge": "electricterrain",
  "jawlock": "crunch",
  "kowtowcleave": "nightslash",
  "landswrath": "earthquake",
  "laserfocus": "meanlook",
  "lashout": "nightslash",
  "lastresort": "gigaimpact",
  "lastrespects": "memento",
  "lightthatburnsthesky": "fusionflare",
  "liquidation": "crabhammer",
  "lowsweep": "lowkick",
  "luminacrash": "esperwing",
  "lunardance": "moonlight",
  "lunge": "megahorn",
  "magicpowder": "spore",
  "magikarpsrevenge": "outrage",
  "magneticflux": "electricterrain",
  "magnitude": "earthquake",
  "maliciousmoonsault": "pulverizingpancake",
  "maxairstream": "supersonicskystrike",
  "maxdarkness": "maliciousmoonsault",
  "maxflare": "infernooverdrive",
  "maxflutterby": "savagespinout",
  "maxgeyser": "hydrovortex",
  "maxguard": "banefulbunker",
  "maxhailstorm": "subzeroslammer",
  "maximumpsybreaker": "psychic",
  "maxknuckle": "alloutpummeling",
  "maxlightning": "gigavolthavoc",
  "maxmindstorm": "shatteredpsyche",
  "maxooze": "aciddownpour",
  "maxovergrowth": "bloomdoom",
  "maxphantasm": "neverendingnightmare",
  "maxquake": "tectonicrage",
  "maxrockfall": "continentalcrush",
  "maxstarfall": "twinkletackle",
  "maxsteelspike": "corkscrewcrash",
  "maxstrike": "breakneckblitz",
  "maxwyrmwind": "devastatingdrake",
  "mefirst": "mimic",
  "megakick": "jumpkick",
  "menacingmoonrazemaelstrom": "moongeistbeam",
  "metalburst": "flashcannon",
  "meteorassault": "aurasphere",
  "mindblown": "iceball",
  "miracleeye": "mindreader",
  "mirrorcoat": "flashcannon",
  "mirrorshot": "flashcannon",
  "mountaingale": "powergem",
  "mudslap": "mudshot",
  "mudsport": "mudbomb",
  "mysticalfire": "flamethrower",
  "naturalgift": "technoblast",
  "nightdaze": "darkpulse",
  "nightmare": "nightshade",
  "noretreat": "stockpile",
  "nuzzle": "spark",
  "obstruct": "kingsshield",
  "octolock": "bind",
  "overdrive": "discharge",
  "paleowave": "muddywater",
  "payback": "slam",
  "phantomforce": "shadowforce",
  "pinmissile": "bulletseed",
  "poisonpowder": "spore",
  "poisonsting": "poisonjab",
  "poisontail": "poisonjab",
  "polarflare": "torchsong",
  "pollenpuff": "revelationdance",
  "poltergeist": "neverendingnightmare",
  "pounce": "bodyslam",
  "powder": "spore",
  "powdersnow": "icywind",
  "powershift": "skillswap",
  "powersplit": "skillswap",
  "powerswap": "skillswap",
  "psyblade": "psychocut",
  "psychicterrain": "mistyterrain",
  "psychoshift": "painsplit",
  "psychup": "painsplit",
  "psywave": "psybeam",
  "purify": "weatherball",
  "pyroball": "flameburst",
  "rage": "thrash",
  "ragingbull": "gigaimpact",
  "razorleaf": "magicalleaf",
  "reflecttype": "painsplit",
  "relicsong": "hypervoice",
  "retaliate": "closecombat",
  "revenge": "slam",
  "risingvoltage": "discharge",
  "rockclimb": "slam",
  "rocktomb": "rockslide",
  "roleplay": "painsplit",
  "rollingkick": "doublekick",
  "rototiller": "electricterrain",
  "sandattack": "mudshot",
  "savagespinout": "electroweb",
  "scaleshot": "clangingscales",
  "scaryface": "meanlook",
  "scorchingsands": "earthpower",
  "searingshot": "shelltrap",
  "secretpower": "technoblast",
  "selfdestruct": "explosion",
  "shadowstrike": "shadowforce",
  "shatteredpsyche": "psychic",
  "shedtail": "substitute",
  "shellsidearmphysical": "poisonjab",
  "shellsidearmspecial": "sludgebomb",
  "shelter": "withdraw",
  "silverwind": "whirlwind",
  "skittersmack": "megahorn",
  "slackoff": "rest",
  "sleeppowder": "spore",
  "smackdown": "rockblast",
  "snaptrap": "magicalleaf",
  "snipeshot": "waterpulse",
  "sparklingaria": "bubblebeam",
  "speedswap": "skillswap",
  "spiderweb": "electroweb",
  "spitup": "magnetbomb",
  "steelbeam": "magnetbomb",
  "steelroller": "steamroller",
  "stormthrow": "circlethrow",
  "strangesteam": "dazzlinggleam",
  "strengthsap": "leechlife",
  "stringshot": "electroweb",
  "strugglebug": "bulletseed",
  "stuffcheeks": "stockpile",
  "stunspore": "spore",
  "submission": "closecombat",
  "subzeroslammer": "sheercold",
  "superpower": "closecombat",
  "surgingstrikes": "aquajet",
  "sweetkiss": "lovelykiss",
  "sweetscent": "mistyterrain",
  "synthesis": "recover",
  "tackle": "slam",
  "takedown": "gigaimpact",
  "tarshot": "mudbomb",
  "teatime": "healbell",
  "tectonicrage": "precipiceblades",
  "telekinesis": "kinesis",
  "terablast": "scald",
  "terablastbug": "bugbuzz",
  "terablastdark": "darkpulse",
  "terablastdragon": "dragonpulse",
  "terablastelectric": "thunderbolt",
  "terablastfairy": "moonblast",
  "terablastfighting": "focusblast",
  "terablastfire": "flamethrower",
  "terablastflying": "aeroblast",
  "terablastghost": "infernalparade",
  "terablastgrass": "seedflare",
  "terablastground": "earthpower",
  "terablastice": "icebeam",
  "terablastnormal": "technoblast",
  "terablastpoison": "sludgebomb",
  "terablastpsychic": "psychic",
  "terablastrock": "powergem",
  "terablaststeel": "flashcannon",
  "terablaststellar": "dracometeor",
  "terablastwater": "hydropump",
  "throatchop": "karatechop",
  "thundershock": "electroball",
  "tidyup": "bulkup",
  "torment": "swagger",
  "toxicthread": "electroweb",
  "trailblaze": "powerwhip",
  "tripledive": "dive",
  "triplekick": "doublekick",
  "trumpcard": "gigaimpact",
  "twister": "whirlwind",
  "uproar": "hypervoice",
  "venomdrench": "sludge",
  "venoshock": "sludgebomb",
  "vinewhip": "powerwhip",
  "vitalthrow": "circlethrow",
  "volttackle": "wildcharge",
  "waterfall": "aquajet",
  "watergun": "watersport",
  "whirlpool": "watersport",
  "workup": "bulkup",
  "wrap": "bind",
  "wringout": "forcepalm",
  "zingzap": "wildcharge",
};

const MOVE_COMPOSITE_ASSIGNMENTS: Record<string, string[]> = {
  headlongrush: ["closecombat", "earthpower"],
};

function resolveMoveAnimationProjectionKey(animationKey: string): string {
  let projectedKey = animationKey;
  const seen = new Set<string>();
  while (MOVE_ALIAS_ASSIGNMENTS[projectedKey] && !seen.has(projectedKey)) {
    seen.add(projectedKey);
    projectedKey = MOVE_ALIAS_ASSIGNMENTS[projectedKey];
  }
  return projectedKey;
}

const NATIVE_MOVE_ANIMS = new Set([
  "acrobatics",
  "accelerock",
  "aeroblast",
  "aircutter",
  "airslash",
  "aquacutter",
  "aquajet",
  "aquastep",
  "aurasphere",
  "beakblast",
  "bite",
  "blastburn",
  "blazekick",
  "blizzard",
  "blueflare",
  "bravebird",
  "bubblebeam",
  "bugbite",
  "bulletpunch",
  "bulletseed",
  "burnup",
  "closecombat",
  "chloroblast",
  "cometpunch",
  "crunch",
  "crushclaw",
  "darkpulse",
  "darkvoid",
  "direclaw",
  "disarmingvoice",
  "discharge",
  "doublekick",
  "dragonclaw",
  "dragonpulse",
  "drainpunch",
  "dualwingbeat",
  "dynamicpunch",
  "earthpower",
  "electroball",
  "electrodrift",
  "electroshot",
  "electroweb",
  "esperwing",
  "eruption",
  "extremeevoboost",
  "firepunch",
  "fireblast",
  "firefang",
  "firelash",
  "flamecharge",
  "flamethrower",
  "flareblitz",
  "focusblast",
  "focuspunch",
  "flyingpress",
  "freezedry",
  "freezeshock",
  "fusionflare",
  "grassknot",
  "grasswhistle",
  "heatwave",
  "highjumpkick",
  "hypervoice",
  "hurricane",
  "hydropump",
  "icefang",
  "iceball",
  "iceburn",
  "icehammer",
  "icepunch",
  "iceshard",
  "jetpunch",
  "jumpkick",
  "leafblade",
  "leafage",
  "leafstorm",
  "leechseed",
  "lowkick",
  "machpunch",
  "magicalleaf",
  "megapunch",
  "metalclaw",
  "moonblast",
  "mudbomb",
  "mudshot",
  "muddywater",
  "nightslash",
  "oblivionwing",
  "overheat",
  "petalblizzard",
  "petaldance",
  "poweruppunch",
  "precipiceblades",
  "psychoboost",
  "psychicnoise",
  "psychicfangs",
  "rapidspin",
  "rocksmash",
  "rockblast",
  "rockthrow",
  "rockwrecker",
  "sacredfire",
  "seedbomb",
  "seedflare",
  "shadowball",
  "shadowbone",
  "shadowclaw",
  "shadowforce",
  "shadowsneak",
  "shadowpunch",
  "slash",
  "spark",
  "stealthrock",
  "steameruption",
  "steelwing",
  "stoneaxe",
  "stoneedge",
  "suckerpunch",
  "temperflare",
  "thunder",
  "thunderclap",
  "thunderfang",
  "thunderouskick",
  "thunderpunch",
  "thundercage",
  "thunderwave",
  "tropkick",
  "voltswitch",
  "waterpledge",
  "waterpulse",
  "watershuriken",
  "watersport",
  "waterspout",
  "aquaring",
  "brutalswing",
  "bulkup",
  "burningbulwark",
  "calmmind",
  "craftyshield",
  "dizzypunch",
  "dragondance",
  "electricterrain",
  "fairylock",
  "featherdance",
  "forestscurse",
  "firespin",
  "gigavolthavoc",
  "grassyterrain",
  "gravity",
  "healbell",
  "healblock",
  "healingwish",
  "healpulse",
  "icespinner",
  "ivycudgelfire",
  "ivycudgelrock",
  "ivycudgelwater",
  "junglehealing",
  "kingsshield",
  "leaftornado",
  "lightscreen",
  "magicroom",
  "mistyterrain",
  "nastyplot",
  "playnice",
  "psychocut",
  "quiverdance",
  "raindance",
  "reflect",
  "revelationdance",
  "rockpolish",
  "safeguard",
  "shellsmash",
  "smokescreen",
  "spikes",
  "spikyshield",
  "stokedsparksurfer",
  "stickyweb",
  "substitute",
  "tailwind",
  "technoblast",
  "teeterdance",
  "terrainpulse",
  "trickroom",
  "toxicspikes",
  "victorydance",
  "weatherball",
  "wingattack",
  "wonderroom",
  "afteryou",
  "agility",
  "allyswitch",
  "aromatherapy",
  "attract",
  "auroraveil",
  "babydolleyes",
  "banefulbunker",
  "bellydrum",
  "bide",
  "celebrate",
  "chillyreception",
  "coil",
  "conversion",
  "curse",
  "defensecurl",
  "detect",
  "doodle",
  "doubleteam",
  "dragonbreath",
  "encore",
  "faketears",
  "flash",
  "flail",
  "flipturn",
  "focusenergy",
  "followme",
  "foresight",
  "gyroball",
  "hail",
  "harden",
  "howl",
  "ingrain",
  "instruct",
  "irondefense",
  "kinesis",
  "leer",
  "lifedew",
  "magiccoat",
  "matblock",
  "metronome",
  "mimic",
  "mist",
  "mortalspin",
  "populationbomb",
  "painsplit",
  "powertrick",
  "ragepowder",
  "recycle",
  "refresh",
  "shiftgear",
  "shockwave",
  "sketch",
  "snowscape",
  "splash",
  "stockpile",
  "sunnyday",
  "swagger",
  "swallow",
  "tailwhip",
  "taunt",
  "teleport",
  "topsyturvy",
  "transform",
  "uturn",
  "acupressure",
  "acidarmor",
  "aerialace",
  "autotomize",
  "barrier",
  "batonpass",
  "bugbuzz",
  "charge",
  "cosmicpower",
  "cottonguard",
  "defendorder",
  "doomdesire",
  "embargo",
  "endure",
  "explosion",
  "geomancy",
  "growth",
  "happyhour",
  "haze",
  "luckychant",
  "lunarblessing",
  "magnetrise",
  "meditate",
  "milkdrink",
  "minimize",
  "moonlight",
  "morningsun",
  "odorsleuth",
  "quash",
  "quickguard",
  "roost",
  "sandstorm",
  "sharpen",
  "skillswap",
  "snatch",
  "softboiled",
  "storedpower",
  "switcheroo",
  "tailglow",
  "takeheart",
  "tearfullook",
  "trick",
  "wideguard",
  "withdraw",
  "absorb",
  "assurance",
  "astonish",
  "bind",
  "bitterblade",
  "block",
  "bloodmoon",
  "bodyslam",
  "chipaway",
  "circlethrow",
  "clamp",
  "crosschop",
  "crosspoison",
  "cut",
  "dig",
  "dive",
  "doublehit",
  "doubleslap",
  "dragontail",
  "drillpeck",
  "endeavor",
  "extremespeed",
  "facade",
  "falseswipe",
  "fly",
  "forcepalm",
  "furycutter",
  "gigadrain",
  "gigatonhammer",
  "guillotine",
  "hammerarm",
  "headbutt",
  "heartstamp",
  "heavyslam",
  "holdback",
  "hornleech",
  "irontail",
  "ivycudgel",
  "karatechop",
  "knockdown",
  "knockoff",
  "leechlife",
  "lick",
  "megadrain",
  "meteormash",
  "multiattack",
  "needlearm",
  "orderup",
  "peck",
  "pluck",
  "pound",
  "powerwhip",
  "quickattack",
  "ragefist",
  "return",
  "reversal",
  "scratch",
  "seismictoss",
  "skullbash",
  "skydrop",
  "skyattack",
  "skyuppercut",
  "slam",
  "smellingsalts",
  "steamroller",
  "stomp",
  "strength",
  "superfang",
  "thrash",
  "visegrip",
  "wakeupslap",
  "woodhammer",
  "xscissor",
  "armorcannon",
  "assist",
  "bonemerang",
  "boneclub",
  "boomburst",
  "bounce",
  "boltstrike",
  "clearsmog",
  "confide",
  "copycat",
  "covet",
  "defog",
  "drillrun",
  "dualschop",
  "eerieimpulse",
  "fakeout",
  "feint",
  "feintattack",
  "fusionbolt",
  "furyswipes",
  "furyattack",
  "geargrind",
  "gigaimpact",
  "growl",
  "hiddenpower",
  "hyperbeam",
  "iciclespear",
  "ironhead",
  "magmastorm",
  "matchagotcha",
  "meanlook",
  "megahorn",
  "metalsound",
  "mirrormove",
  "naturepower",
  "nightshade",
  "nobleroar",
  "ominouswind",
  "outrage",
  "partingshot",
  "perishsong",
  "playrough",
  "poisongas",
  "poisonfang",
  "punishment",
  "pursuit",
  "razorshell",
  "ragingfury",
  "roar",
  "rollout",
  "round",
  "sandsearstorm",
  "screech",
  "shelltrap",
  "sing",
  "sleeptalk",
  "smog",
  "snarl",
  "snore",
  "sonicboom",
  "spinout",
  "spikecannon",
  "springtidestorm",
  "struggle",
  "supersonic",
  "synchronoise",
  "tailslap",
  "thief",
  "tickle",
  "torchsong",
  "twineedle",
  "vacuumwave",
  "vcreate",
  "wickedblow",
  "whirlwind",
  "wildboltstorm",
  "wildcharge",
  "yawn",
  "zapcannon",
  "zenheadbutt",
  "ancientpower",
  "avalanche",
  "barbbarrage",
  "brine",
  "chargebeam",
  "confuseray",
  "crabhammer",
  "dazzlinggleam",
  "diamondstorm",
  "dragonascent",
  "dragonenergy",
  "dracometeor",
  "drainingkiss",
  "energyball",
  "flashcannon",
  "fling",
  "flowertrick",
  "freezingglare",
  "glaciallance",
  "gmaxsteelsurge",
  "gunkshot",
  "hex",
  "hypnosis",
  "iciclecrash",
  "icywind",
  "infernalparade",
  "judgment",
  "lavaplume",
  "lightofruin",
  "lovelykiss",
  "lusterpurge",
  "magnetbomb",
  "makeitrain",
  "meteorbeam",
  "mistball",
  "mistyexplosion",
  "mysticalpower",
  "naturesmadness",
  "octazooka",
  "originpulse",
  "paraboliccharge",
  "payday",
  "powergem",
  "present",
  "psybeam",
  "psyshock",
  "psystrike",
  "razorwind",
  "roaroftime",
  "ruination",
  "sacredsword",
  "saltcure",
  "sandtomb",
  "scald",
  "secretsword",
  "sheercold",
  "signalbeam",
  "simplebeam",
  "sludge",
  "sludgebomb",
  "sludgewave",
  "soak",
  "solarbeam",
  "solarblade",
  "spacialrend",
  "spicyextract",
  "spore",
  "swift",
  "syrupbomb",
  "thousandarrows",
  "thousandwaves",
  "toxic",
  "triattack",
  "triplearrows",
  "tripleaxel",
  "twinbeam",
  "wavecrash",
  "willowisp",
  "wish",
  "aciddownpour",
  "alloutpummeling",
  "anchorshot",
  "astralbarrage",
  "bestow",
  "blackholeeclipse",
  "blazingtorque",
  "catastropika",
  "clangingscales",
  "clangoroussoulblaze",
  "collisioncourse",
  "combattorque",
  "continentalcrush",
  "coreenforcer",
  "corkscrewcrash",
  "ficklebeam",
  "ficklebeamallout",
  "fierywrath",
  "finalgambit",
  "firstimpression",
  "fishiousrend",
  "guardianofalola",
  "hardpress",
  "hyperspacefury",
  "hyperspacehole",
  "infernooverdrive",
  "letssnuggleforever",
  "lockon",
  "magicaltorque",
  "malignantchain",
  "memento",
  "mightycleave",
  "mindreader",
  "moongeistbeam",
  "neverendingnightmare",
  "noxioustorque",
  "oceanicoperetta",
  "photongeyser",
  "plasmafists",
  "poisonjab",
  "powertrip",
  "prismaticlaser",
  "pulverizingpancake",
  "revivalblessing",
  "searingsunrazesmash",
  "shoreup",
  "sinisterarrowraid",
  "smartstrike",
  "spectralthief",
  "spiritbreak",
  "spiritshackle",
  "spite",
  "splinteredstormshards",
  "spotlight",
  "stompingtantrum",
  "soulstealing7starstrike",
  "sunsteelstrike",
  "supercellslam",
  "supersonicskystrike",
  "tachyoncutter",
  "terastarstorm",
  "trickortreat",
  "twinkletackle",
  "upperhand",
  "wickedtorque",
  "worryseed",
]);

export function selectShowdownAnimationKeyV4(event: BattleProtocolEventV4, kind: BattleAnimationKindV4): ShowdownAnimationKeySelectionV4 {
  const moveId = toId(event.moveId || event.moveName);
  const status = toId(event.status || event.args[2]);
  const aliasedMoveId = MOVE_ALIAS_ASSIGNMENTS[moveId] || moveId;
  if (kind === "damage" || kind === "hit") return selection("hitmark", "BattleOtherAnims", false);
  if (kind === "heal") return selection("heal", "BattleOtherAnims", false);
  if (kind === "status") {
    const key = SUPPORTED_STATUS_ANIMS.has(status) ? status : statusFallbackForEvent(event);
    return selection(key, SUPPORTED_STATUS_ANIMS.has(key) ? "BattleStatusAnims" : "BattleOtherAnims", !SUPPORTED_STATUS_ANIMS.has(key));
  }
  if (kind === "result") return selection(resultAnimationKeyForEvent(event), "BattleOtherAnims", true);
  if (kind === "moveStart") {
    if (moveId && MOVE_ALIAS_ASSIGNMENTS[moveId]) return selection(moveId, "BattleMoveAnims", false, moveId, aliasedMoveId);
    return selection(aliasedMoveId || "attack", aliasedMoveId && SUPPORTED_MOVE_ANIMS.has(aliasedMoveId) ? "BattleMoveAnims" : "fallback", !SUPPORTED_MOVE_ANIMS.has(aliasedMoveId), moveId);
  }
  if (kind === "moveEffect") {
    const compositeTargets = MOVE_COMPOSITE_ASSIGNMENTS[moveId] || [];
    if (moveId && compositeTargets.length) return selection(moveId, "BattleMoveAnims", false, moveId, "", compositeTargets);
    if (moveId && MOVE_ALIAS_ASSIGNMENTS[moveId]) return selection(moveId, "BattleMoveAnims", false, moveId, aliasedMoveId);
    if (aliasedMoveId && SUPPORTED_MOVE_ANIMS.has(aliasedMoveId)) return selection(aliasedMoveId, "BattleMoveAnims", false, moveId);
    const fallbackKey = fallbackMoveAnimationKey(event);
    return selection(fallbackKey, "BattleOtherAnims", true);
  }
  if (kind === "ability") return selection("lightstatus", "BattleOtherAnims", true);
  if (kind === "weather") {
    const key = toId(event.args[0] === "-weather" ? event.args[1] : cleanEffect(event.args[1]));
    return selection(key || "lightstatus", key && (SUPPORTED_MOVE_ANIMS.has(key) || key === "desolateland" || key === "primordialsea" || key === "deltastream") ? "BattleMoveAnims" : "BattleOtherAnims", false);
  }
  if (kind === "transform") return selection(transformAnimationKeyForEvent(event), transformAnimationSourceForEvent(event), false);
  if (kind === "switchIn" || kind === "switchOut" || kind === "faint") return selection(kind, "native", false);
  return selection(kind || "message", "native", true);
}

function transformAnimationKeyForEvent(event: BattleProtocolEventV4): string {
  if (event.eventType === "-zpower") return "zpower";
  if (event.eventType === "-mega") return "megaevo";
  if (event.eventType === "-primal") return primalAnimationKeyForEvent(event);
  if (event.eventType === "-burst") return "ultraburst";
  if (event.eventType === "-terastallize") return "teratransform";
  if (event.eventType === "custom" && (event.rawLine.startsWith("|custom|-endterastallize|") || toId(event.args[1]) === "endterastallize")) return "teratransform";
  if (event.eventType === "-start" && toId(event.args[2]) === "dynamax") return "dynamaxtransform";
  if (event.eventType === "-end" && toId(event.args[2]) === "dynamax") return "dynamaxtransform";
  if (event.eventType === "detailschange" && /mega/i.test(event.args[2] || "")) return "megaevo";
  if (event.eventType === "-transform" || moveIdForTransformEvent(event) === "transform") return "transform";
  return "shiny";
}

function transformAnimationSourceForEvent(event: BattleProtocolEventV4): ShowdownAnimationSourceV4 {
  const key = transformAnimationKeyForEvent(event);
  if (key === "transform") return "BattleMoveAnims";
  if (SUPPORTED_OTHER_ANIMS.has(key)) return "BattleOtherAnims";
  return "native";
}

function primalAnimationKeyForEvent(event: BattleProtocolEventV4): string {
  const text = `${event.args.join(" ")} ${event.actorName}`.toLowerCase();
  if (text.includes("kyogre") || text.includes("blue") || text.includes("alpha")) return "primalalpha";
  return "primalomega";
}

function moveIdForTransformEvent(event: BattleProtocolEventV4): string {
  return toId(event.moveId || event.moveName);
}

export function projectShowdownAnimationTimelineV4(animationKey: string, context: ShowdownAnimationContextV4): ShowdownAnimationTimelineV4 {
  const selection = selectShowdownAnimationKeyV4(context.event, context.kind);
  const sourceKey = selection.sourceKey || animationKey;
  const aliasTargetKey = selection.aliasTargetKey;
  const compositeTargets = selection.compositeTargets;
  const actor = actorForSeat(context.event.seat, context.event.actorName);
  const targetSeat = context.event.targetSeat || context.event.seat;
  const target = actorForSeat(targetSeat, context.event.targetName || context.event.actorName);
  const effectSprite = effectSpriteForAnimationKey(animationKey, context.kind, context.event);
  const checkpointId = context.checkpointId;
  const steps = stepsForAnimation(animationKey, effectSprite, actor, target, context);
  const checkpoints = steps.filter(step => step.type === "checkpoint").map(step => step.checkpointId);
  return {
    id: `${context.event.sequence}-${context.kind}-${animationKey}`,
    animationKey,
    source: sourceForAnimationKey(animationKey, context.kind, selection.source),
    protocolSequence: context.event.sequence,
    turn: context.event.turn || null,
    actorSeat: context.event.seat,
    targetSeats: targetSeat ? [targetSeat] : [],
    effectSprite,
    steps,
    checkpoints: checkpoints.length ? checkpoints : [checkpointId],
    fallback: fallbackForAnimationKey(animationKey, context.kind, selection.fallback),
    adapterFidelity: fidelityForAnimationKey(animationKey, context.kind, selection.fallback),
    sourceKey,
    aliasTargetKey,
    compositeTargets,
    showdownInstructionCount: showdownInstructionCountForAnimationKey(animationKey, context.kind, steps),
    missingFxAssets: missingFxAssetsForSteps(steps),
  };
}

export function effectSpriteForShowdownAnimationV4(animationKey: string, kind: BattleAnimationKindV4, event: BattleProtocolEventV4): string {
  return effectSpriteForAnimationKey(animationKey, kind, event);
}

export async function executeShowdownAnimationTimelineV4(
  timeline: ShowdownAnimationTimelineV4,
  options: ShowdownAnimationExecutionOptionsV4 = {},
): Promise<ShowdownAnimationExecutionResultV4> {
  const consumedCheckpoints: string[] = [];
  for (const step of timeline.steps) {
    await options.onStep?.(step, timeline);
    if (step.type === "checkpoint") {
      consumedCheckpoints.push(step.checkpointId);
      await options.onCheckpoint?.(step.checkpointId, timeline);
    }
    if (!options.skip && (step.type === "wait" || step.type === "delay")) {
      await wait(step.durationMs);
    }
  }
  return {
    timelineId: timeline.id,
    animationKey: timeline.animationKey,
    consumedSteps: timeline.steps.length,
    consumedCheckpoints,
    skipped: Boolean(options.skip),
  };
}

function stepsForAnimation(
  animationKey: string,
  effectSprite: string,
  actor: ShowdownSpriteActorV4,
  target: ShowdownSpriteActorV4,
  context: ShowdownAnimationContextV4,
): ShowdownAnimationStepV4[] {
  const checkpoint = checkpointStep(context.checkpointId);
  if (context.kind === "moveStart") {
    return [
      actorAnimStep(actor, {y: actor.y - 12, scale: 1.08}, 260, "easeOut"),
      waitStep(140),
      checkpoint,
    ];
  }
  if (context.kind === "moveEffect") {
    const projectedAnimationKey = resolveMoveAnimationProjectionKey(animationKey);
    const delegatedOther = MOVE_NATIVE_OTHER_MAP[projectedAnimationKey];
    if (delegatedOther) return [...stepsForOtherAnimation(delegatedOther, actor, target), checkpoint];
    const nativeMoveSteps = stepsForNativeMove(projectedAnimationKey, actor, target);
    if (nativeMoveSteps.length) return [...nativeMoveSteps, checkpoint];
    return [
      ...backgroundStepsForMove(projectedAnimationKey),
      showEffectStep(effectSprite, actor, target, Math.max(420, context.durationMs - 220), {easing: "easeOut", fade: "both"}),
      actorAnimStep(target, {x: target.x + (target.side === "far" ? 10 : -10)}, 180, "easeInOut"),
      checkpoint,
    ];
  }
  if (context.kind === "damage") return [showEffectStep("hitmark", target, target, 280, {spriteId: "impact", fade: "both"}), {type: "damageAnim", actor: target, damage: null}, checkpoint];
  if (context.kind === "heal") return [...stepsForOtherAnimation("heal", actor, actor), {type: "healAnim", actor, heal: null}, checkpoint];
  if (context.kind === "status") return [...stepsForStatusAnimation(animationKey, actor, effectSprite), {type: "resultAnim", actor, text: context.resultText, tone: "status"}, checkpoint];
  if (context.kind === "result") {
    if (SUPPORTED_OTHER_ANIMS.has(animationKey)) return [...stepsForOtherAnimation(animationKey, target, target), {type: "resultAnim", actor: target, text: context.resultText, tone: context.resultTone}, checkpoint];
    return [{type: "resultAnim", actor: target, text: context.resultText, tone: context.resultTone}, waitStep(220), checkpoint];
  }
  if (context.kind === "weather") return [...environmentSteps(animationKey, actor), {type: "resultAnim", actor, text: context.resultText, tone: "weather"}, checkpoint];
  if (context.kind === "ability") return [{type: "backgroundEffect", color: "#b7ff27", durationMs: 560, opacity: .42}, {type: "resultAnim", actor, text: context.resultText, tone: "good"}, checkpoint];
  if (context.kind === "transform") return [showEffectStep("shine", actor, actor, 560, {fade: "both"}), actorAnimStep(actor, {scale: 1.18, opacity: .72}, 420, "easeInOut"), checkpoint];
  return [waitStep(Math.max(180, context.durationMs)), checkpoint];
}

function backgroundStepsForMove(animationKey: string): ShowdownAnimationStepV4[] {
  if (animationKey === "eruption" || /fire|flame|blast|burn/.test(animationKey)) return [{type: "backgroundEffect", color: "#ff7a32", durationMs: 420, opacity: .28}];
  if (animationKey === "earthquake" || animationKey === "bulldoze") return [{type: "backgroundEffect", color: "#b98442", durationMs: 360, opacity: .24}];
  if (/thunder|volt|spark|electro/.test(animationKey)) return [{type: "backgroundEffect", color: "#ffe35a", durationMs: 360, opacity: .3}];
  if (/water|hydro|surf/.test(animationKey)) return [{type: "backgroundEffect", color: "#4aa5ff", durationMs: 360, opacity: .24}];
  return [];
}

function stepsForOtherAnimation(animationKey: string, actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, fallbackSprite = "wisp"): ShowdownAnimationStepV4[] {
  switch (animationKey) {
  case "hitmark":
    return [showEffectStep("hitmark", target, target, 280, {spriteId: "impact", fade: "both"})];
  case "attack":
    return [actorAnimStep(actor, {x: leftOf(target, -18), y: target.y + 16, z: behind(target, -18)}, 280, "ballistic"), actorAnimStep(target, {x: leftOf(target, 10)}, 180, "swing")];
  case "contactattack":
    return [actorAnimStep(actor, {x: target.x, y: target.y + 12, z: behind(target, -18)}, 260, "ballistic"), showEffectStep("impact", target, {...target, scale: 1.6, opacity: 0}, 260, {fade: "both"}), actorAnimStep(target, {x: leftOf(target, 12)}, 180, "swing")];
  case "xattack":
    return [
      showEffectStep("wisp", target, {...target, x: leftOf(target, -20), z: behind(target, 20), scale: 3, opacity: 0}, 700),
      showEffectStep("wisp", target, {...target, x: leftOf(target, 20), z: behind(target, 20), scale: 3, opacity: 0}, 860),
      actorAnimStep(actor, {x: leftOf(target, -30), y: target.y + 64, z: behind(target, -30)}, 300, "ballistic"),
      actorAnimStep(actor, {x: leftOf(target, 28), y: target.y + 5, z: target.z}, 110),
      actorAnimStep(target, {z: behind(target, 20)}, 220, "swing"),
    ];
  case "slashattack":
    return [
      actorAnimStep(actor, {x: target.x, y: target.y + 58, z: behind(target, -30)}, 320, "ballistic"),
      actorAnimStep(actor, {x: target.x, y: target.y + 5, z: target.z}, 110),
      showEffectStep("rightslash", target, {...target, scale: 3, opacity: 0}, 360, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 20)}, 220, "swing"),
    ];
  case "clawattack":
    return [
      actorAnimStep(actor, {x: leftOf(target, -30), y: target.y + 58, z: behind(target, -30)}, 300, "ballistic"),
      actorAnimStep(actor, {x: leftOf(target, 28), y: target.y + 5, z: target.z}, 90),
      showEffectStep("leftclaw", target, {...target, x: target.x - 12, y: target.y + 8, scale: 2.5, opacity: 0}, 330, {fade: "both"}),
      showEffectStep("rightclaw", target, {...target, x: target.x + 12, y: target.y - 8, scale: 2.5, opacity: 0}, 420, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, -10), z: behind(target, 15)}, 180, "swing"),
    ];
  case "punchattack":
    return [
      showEffectStep("wisp", target, {...target, x: leftOf(target, -20), z: behind(target, 20), scale: 3, opacity: 0}, 430),
      showEffectStep("fist", target, {...target, x: leftOf(target, -20), z: behind(target, 20), scale: 2, opacity: 0}, 480),
      actorAnimStep(actor, {x: leftOf(target, 20), y: target.y, z: behind(target, -20)}, 320, "ballistic2Under"),
      actorAnimStep(target, {x: leftOf(target, -15), z: behind(target, 15)}, 180, "swing"),
    ];
  case "bite":
    return [
      showEffectStep("topbite", {...target, y: target.y + 42, opacity: 0}, {...target, y: target.y + 10, opacity: 1, scale: .5}, 260, {fade: "in"}),
      showEffectStep("bottombite", {...target, y: target.y - 42, opacity: 0}, {...target, y: target.y - 10, opacity: 1, scale: .5}, 260, {fade: "in"}),
      actorAnimStep(target, {scale: .94, y: target.y + 3}, 180, "swing"),
    ];
  case "kick":
    return [showEffectStep("foot", target, {...target, y: target.y - 20, z: behind(target, 15), scale: 2, opacity: 0}, 420), actorAnimStep(target, {x: leftOf(target, 10)}, 180, "swing")];
  case "fastattack":
    return [actorAnimStep(actor, {x: leftOf(target, -18), y: target.y + 6, z: behind(target, -28), opacity: .85}, 120, "accel"), showEffectStep("wisp", actor, target, 220, {fade: "both"}), actorAnimStep(target, {x: leftOf(target, 12)}, 160, "swing")];
  case "fastanimattack":
    return [actorAnimStep(actor, {z: behind(actor, -70)}, 120, "decel"), actorAnimStep(target, {z: behind(target, 30)}, 160, "decel")];
  case "fastanimspecial":
    return [showEffectStep("shine", actor, target, 260, {fade: "both"}), actorAnimStep(target, {scale: .96}, 160, "decel")];
  case "fastanimself":
    return [actorAnimStep(actor, {scale: 1.5}, 120, "decel"), actorAnimStep(actor, {scale: 1}, 170, "accel")];
  case "sneakattack":
    return [
      actorAnimStep(actor, {x: leftOf(actor, -20), z: behind(actor, -20), opacity: 0}, 180),
      actorAnimStep(actor, {x: target.x, y: target.y, z: behind(target, 40), opacity: 1}, 260),
      showEffectStep("shadowball", target, {...target, scale: 1.8, opacity: 0}, 360, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 25)}, 180, "swing"),
    ];
  case "spinattack":
    return [actorAnimStep(actor, {x: target.x, y: target.y, scale: 1.18, xscale: -1}, 360, "swing"), showEffectStep("wisp", target, {...target, scale: 2.2, opacity: 0}, 420), actorAnimStep(target, {z: behind(target, 20)}, 180)];
  case "bound":
    return [showEffectStep("wisp", target, {...target, scale: 2.4, opacity: 0}, 480), actorAnimStep(target, {scale: .86, y: target.y + 6}, 260, "swing")];
  case "selfstatus":
    return [showEffectStep("wisp", {...actor, scale: 2, opacity: .2}, {...actor, scale: 0, opacity: 1}, 300), showEffectStep("wisp", {...actor, scale: 2, opacity: .2}, {...actor, scale: 0, opacity: 1}, 500)];
  case "lightstatus":
    return [showEffectStep("electroball", {...actor, scale: 2, opacity: .1}, {...actor, scale: 0, opacity: .5}, 600)];
  case "chargestatus":
    return [
      showEffectStep("electroball", {...actor, x: actor.x - 54, y: actor.y + 34, scale: .7, opacity: .7}, {...actor, scale: .2, opacity: .2}, 320, {fade: "both"}),
      showEffectStep("electroball", {...actor, x: actor.x + 52, y: actor.y - 5, scale: .7, opacity: .7}, {...actor, scale: .2, opacity: .2}, 420, {fade: "both"}),
      showEffectStep("electroball", {...actor, x: actor.x - 35, y: actor.y - 45, scale: .7, opacity: .7}, {...actor, scale: .2, opacity: .2}, 520, {fade: "both"}),
    ];
  case "consume":
    return [showEffectStep("wisp", {...actor, x: leftOf(actor, -25), y: actor.y + 40, z: behind(actor, -20), scale: .5}, {...actor, x: leftOf(actor, -15), y: actor.y + 35, scale: 0, opacity: .2}, 500, {fade: "both"}), actorAnimStep(actor, {y: actor.y + 5, yscale: 1.1}, 280, "swing")];
  case "heal":
    return [showEffectStep("shine", actor, actor, 520, {fade: "both"}), showEffectStep("wisp", {...actor, y: actor.y - 20, scale: .4, opacity: .75}, {...actor, y: actor.y + 30, scale: 0, opacity: .15}, 460, {fade: "both"})];
  case "shake":
    return [actorAnimStep(actor, {x: actor.x - 8}, 80, "swing"), actorAnimStep(actor, {x: actor.x + 8}, 80, "swing"), actorAnimStep(actor, {x: actor.x}, 80, "swing")];
  case "leech":
  case "drain":
    return [
      showEffectStep("energyball", {...target, x: target.x - 28, y: target.y - 34, scale: .35, opacity: .7}, {...actor, opacity: .1}, 500, {fade: "both"}),
      showEffectStep("energyball", {...target, x: target.x + 32, y: target.y - 26, scale: .35, opacity: .7}, {...actor, opacity: .1}, 600, {fade: "both"}),
      actorAnimStep(actor, {scale: 1.08}, 200, "decel"),
    ];
  case "hydroshot":
    return [
      showEffectStep("waterwisp", actor, {...target, x: target.x + 10, y: target.y + 5, z: behind(target, 30), scale: 1, opacity: .6}, 360, {fade: "both"}),
      showEffectStep("waterwisp", actor, {...target, x: target.x - 10, y: target.y + 2, z: behind(target, 30), scale: 1, opacity: .6}, 450, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 20)}, 180, "swing"),
    ];
  case "sound":
    return [showEffectStep("sound", actor, {...target, scale: 1.6, opacity: 0}, 520, {fade: "both"}), actorAnimStep(target, {x: leftOf(target, 8)}, 160, "swing")];
  case "shiny":
  case "megaevo":
  case "powerconstruct":
  case "ultraburst":
  case "teratransform":
  case "dynamaxtransform":
    return formChangeSteps(actor, animationKey);
  case "flight":
    return flightSteps(actor, target, animationKey);
  case "dance":
    return danceSteps(actor);
  case "gravity":
    return roomSteps(actor, "#6b4aa8", "gravity");
  case "futuresighthit":
  case "doomdesirehit":
    return beamSteps(actor, target, animationKey === "doomdesirehit" ? "shine" : "mistball", "#fff1a6");
  case "itemoff":
    return [showEffectStep("item", actor, {...target, y: target.y - 30, opacity: 0}, 520, {fade: "both"}), ...stepsForOtherAnimation("contactattack", actor, target)];
  case "anger":
    return [showEffectStep("angry", actor, {...actor, y: actor.y - 24, scale: 1.4, opacity: 0}, 520, {fade: "both"}), ...stepsForOtherAnimation("shake", actor, actor)];
  case "bidecharge":
    return boostSteps(actor, "wisp", "#ffda4d");
  case "bideunleash":
    return explosionSteps(actor, target, "#ffda4d", "impact");
  case "spectralthiefboost":
    return ghostDarkSteps(actor, target, "shadowball");
  case "schoolingin":
  case "schoolingout":
    return formChangeSteps(actor, animationKey);
  case "primalalpha":
    return primalSteps(actor, "#d93131", "alpha");
  case "primalomega":
    return primalSteps(actor, "#315fff", "omega");
  case "zpower":
    return zMoveSteps(actor, target, "#050505");
  default:
    return [showEffectStep(fallbackSprite, actor, target, 520, {fade: "both"}), actorAnimStep(target, {x: target.x + (target.side === "far" ? 10 : -10)}, 180, "easeInOut")];
  }
}

function stepsForStatusAnimation(animationKey: string, actor: ShowdownSpriteActorV4, fallbackSprite = "wisp"): ShowdownAnimationStepV4[] {
  switch (animationKey) {
  case "brn":
    return [
      showEffectStep("fireball", {...actor, x: actor.x - 20, y: actor.y - 15, scale: .2, opacity: .3}, {...actor, x: actor.x + 40, y: actor.y + 15, scale: 1, opacity: 1}, 300, {easing: "swing", fade: "both"}),
      showEffectStep("fireball", {...actor, x: actor.x + 18, y: actor.y + 10, scale: .15, opacity: .22}, {...actor, x: actor.x - 28, y: actor.y - 12, scale: .9, opacity: 0}, 420, {easing: "swing", fade: "both"}),
      actorAnimStep(actor, {scale: .98}, 120, "swing"),
    ];
  case "psn":
    return [
      showEffectStep("poisonwisp", {...actor, x: actor.x + 30, y: actor.y - 40, scale: .2, opacity: 1}, {...actor, x: actor.x + 30, y: actor.y, scale: 1, opacity: .5}, 300, {easing: "decel", fade: "both"}),
      showEffectStep("poisonwisp", {...actor, x: actor.x - 30, y: actor.y - 40, scale: .2, opacity: 1}, {...actor, x: actor.x - 30, y: actor.y, scale: 1, opacity: .5}, 400, {easing: "decel", fade: "both", delayMs: 100}),
      showEffectStep("poisonwisp", {...actor, x: actor.x, y: actor.y - 40, scale: .2, opacity: 1}, {...actor, x: actor.x, y: actor.y, scale: 1, opacity: .5}, 500, {easing: "decel", fade: "both", delayMs: 200}),
    ];
  case "slp":
    return [
      showEffectStep("wisp", {...actor, y: actor.y + 20, scale: .5, opacity: .1}, {...actor, y: actor.y + 20, z: behind(actor, -50), scale: 1.5, opacity: 1}, 400, {easing: "ballistic2Under", fade: "both"}),
      showEffectStep("wisp", {...actor, y: actor.y + 20, scale: .5, opacity: .1}, {...actor, y: actor.y + 20, z: behind(actor, -50), scale: 1.5, opacity: 1}, 600, {easing: "ballistic2Under", fade: "both", delayMs: 200}),
      actorAnimStep(actor, {y: actor.y + 5, opacity: .86}, 180, "swing"),
    ];
  case "par":
    return [
      showEffectStep("electroball", {...actor, scale: 1.5, opacity: .2}, {...actor, scale: 2, opacity: .1}, 300, {fade: "both"}),
      actorAnimStep(actor, {x: actor.x - 3}, 75, "swing"),
      actorAnimStep(actor, {x: actor.x + 3}, 75, "swing"),
      actorAnimStep(actor, {x: actor.x - 2}, 75, "swing"),
      actorAnimStep(actor, {x: actor.x + 2}, 75, "swing"),
      actorAnimStep(actor, {x: actor.x}, 100, "accel"),
    ];
  case "frz":
    return [
      showEffectStep("icicle", {...actor, x: actor.x - 30, y: actor.y, scale: .5, opacity: .5}, {...actor, x: actor.x - 30, y: actor.y, scale: .9, opacity: 0}, 600, {fade: "both", delayMs: 200}),
      showEffectStep("icicle", {...actor, x: actor.x, y: actor.y - 30, scale: .5, opacity: .5}, {...actor, x: actor.x, y: actor.y - 30, scale: .9, opacity: 0}, 650, {fade: "both", delayMs: 300}),
      showEffectStep("icicle", {...actor, x: actor.x + 15, y: actor.y, scale: .5, opacity: .5}, {...actor, x: actor.x + 15, y: actor.y, scale: .9, opacity: 0}, 700, {fade: "both", delayMs: 400}),
      showEffectStep("wisp", {...actor, scale: 1, opacity: .5}, {...actor, scale: 3, opacity: 0}, 600, {fade: "both"}),
    ];
  case "flinch":
    return [showEffectStep("shadowball", {...actor, scale: 1, opacity: .2}, {...actor, scale: 3, opacity: .1}, 300, {fade: "both"}), ...stepsForOtherAnimation("shake", actor, actor)];
  case "attracted":
    return [
      showEffectStep("heart", {...actor, x: actor.x + 20, y: actor.y + 20, scale: .5, opacity: .5}, {...actor, x: actor.x + 20, y: actor.y + 20, scale: 1, opacity: 1}, 300, {easing: "ballistic2Under", fade: "both"}),
      showEffectStep("heart", {...actor, x: actor.x - 20, y: actor.y + 10, scale: .5, opacity: .5}, {...actor, x: actor.x - 20, y: actor.y + 10, scale: 1, opacity: 1}, 400, {easing: "ballistic2Under", fade: "both", delayMs: 100}),
      showEffectStep("heart", {...actor, x: actor.x, y: actor.y + 40, scale: .5, opacity: .5}, {...actor, x: actor.x, y: actor.y + 40, scale: 1, opacity: 1}, 500, {easing: "ballistic2Under", fade: "both", delayMs: 200}),
    ];
  case "cursed":
    return [
      {type: "backgroundEffect", color: "#000000", durationMs: 700, opacity: .2},
      actorAnimStep(actor, {x: actor.x - 5}, 50),
      actorAnimStep(actor, {x: actor.x + 5}, 50),
      actorAnimStep(actor, {x: actor.x - 5}, 50),
      actorAnimStep(actor, {x: actor.x + 5}, 50),
      actorAnimStep(actor, {x: actor.x}, 50),
      showEffectStep("shadowball", {...actor, opacity: .5}, {...actor, z: behind(actor, 20), opacity: 0}, 600, {easing: "decel", fade: "out"}),
    ];
  case "confused":
    return nativeConfusionSteps(actor);
  case "confusedselfhit":
    return [...nativeConfusionSteps(actor), ...stepsForOtherAnimation("hitmark", actor, actor), actorAnimStep(actor, {x: leftOf(actor, 10), z: behind(actor, 20)}, 180, "swing")];
  default:
    return [showEffectStep(fallbackSprite, actor, actor, 520, {fade: "both"}), ...stepsForOtherAnimation("shake", actor, actor)];
  }
}

function nativeConfusionSteps(actor: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    showEffectStep("electroball", {...actor, x: actor.x + 50, y: actor.y + 30, scale: .1, opacity: 1}, {...actor, x: actor.x - 50, y: actor.y + 30, scale: .15, opacity: .4}, 600, {fade: "both", delayMs: 400}),
    showEffectStep("electroball", {...actor, x: actor.x - 50, y: actor.y + 30, scale: .1, opacity: 1}, {...actor, x: actor.x + 50, y: actor.y + 30, scale: .15, opacity: .4}, 600, {fade: "both", delayMs: 400}),
    showEffectStep("electroball", {...actor, x: actor.x + 50, y: actor.y + 30, scale: .1, opacity: 1}, {...actor, x: actor.x - 50, y: actor.y + 30, scale: .4, opacity: .4}, 600, {fade: "both", delayMs: 600}),
    showEffectStep("electroball", {...actor, x: actor.x - 50, y: actor.y + 30, scale: .1, opacity: 1}, {...actor, x: actor.x + 50, y: actor.y + 30, scale: .4, opacity: .4}, 600, {fade: "both", delayMs: 600}),
  ];
}

function stepsForNativeMove(animationKey: string, actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  switch (animationKey) {
  case "bravebird":
  case "acrobatics":
  case "aerialace":
  case "flyingpress":
  case "steelwing":
  case "wingattack":
  case "dualwingbeat":
  case "aeroblast":
  case "aircutter":
  case "hurricane":
  case "fly":
  case "bounce":
  case "skyattack":
  case "skydrop":
  case "peck":
  case "drillpeck":
  case "pluck":
    return nativeFlyingStrikeSteps(actor, target, animationKey);
  case "dragonbreath":
    return pulseProjectileSteps(actor, target, "poisonwisp", {count: 3, background: "#5f44aa", compact: true});
  case "dragonpulse":
    return pulseProjectileSteps(actor, target, "shadowball", {count: 5, background: "#5f44aa", secondarySprite: "poisonwisp"});
  case "focusblast":
    return pulseProjectileSteps(actor, target, "electroball", {count: 2, background: "#b84038", charge: true});
  case "aurasphere":
    return pulseProjectileSteps(actor, target, "wisp", {count: 3, background: "#124763", charge: true});
  case "uturn":
  case "rapidspin":
  case "gyroball":
  case "steamroller":
    return stepsForOtherAnimation("spinattack", actor, target);
  case "mortalspin":
    return spinWithElementSteps(actor, target, "poisonwisp");
  case "accelerock":
  case "aquajet":
  case "iceshard":
  case "shadowsneak":
  case "jetpunch":
  case "aquastep":
  case "extremespeed":
  case "quickattack":
    return nativeFastStrikeSteps(actor, target, animationKey);
  case "flipturn":
    return spinWithElementSteps(actor, target, "waterwisp");
  case "icespinner":
    return spinWithElementSteps(actor, target, "iceball");
  case "voltswitch":
    return [...electricWaveSteps(actor, target, {projectile: true}), actorAnimStep(actor, {z: behind(actor, 15)}, 200, "decel"), actorAnimStep(actor, {z: behind(target, -170), opacity: .75}, 120, "accel")];
  case "thunderwave":
    return electricWaveSteps(actor, target, {wide: true, status: true});
  case "shockwave":
    return electricWaveSteps(actor, target, {wide: true, projectile: true});
  case "discharge":
    return electricWaveSteps(actor, target, {wide: true, background: "#ffe35a"});
  case "thunder":
  case "thundercage":
  case "electroball":
  case "electroweb":
  case "electrodrift":
  case "electroshot":
  case "thunderclap":
    return nativeElectricMoveSteps(actor, target, animationKey);
  case "bugbuzz":
    return [showEffectStep("sound", actor, {...target, scale: 1.9, opacity: 0}, 520, {fade: "both"}), showEffectStep("wisp", {...target, scale: .5, opacity: .4}, {...target, scale: 2.4, opacity: 0}, 580, {fade: "both"}), actorAnimStep(target, {x: leftOf(target, 10)}, 180, "swing")];
  case "hypervoice":
  case "disarmingvoice":
  case "grasswhistle":
  case "psychicnoise":
  case "boomburst":
  case "roar":
  case "round":
  case "snore":
  case "synchronoise":
  case "sonicboom":
  case "metalsound":
  case "supersonic":
  case "snarl":
  case "perishsong":
  case "sing":
    return nativeSoundVoiceSteps(actor, target, animationKey);
  case "playnice":
  case "worryseed":
  case "fairylock":
  case "aquaring":
  case "featherdance":
  case "healblock":
  case "smokescreen":
  case "forestscurse":
  case "taunt":
  case "swagger":
  case "encore":
  case "attract":
  case "babydolleyes":
  case "faketears":
  case "tailwhip":
  case "leer":
  case "kinesis":
  case "flash":
  case "followme":
  case "spotlight":
  case "foresight":
  case "doodle":
  case "topsyturvy":
  case "ragepowder":
  case "afteryou":
  case "allyswitch":
  case "instruct":
  case "quash":
  case "tearfullook":
  case "odorsleuth":
  case "embargo":
  case "haze":
  case "assist":
  case "mirrormove":
  case "naturepower":
  case "copycat":
  case "sleeptalk":
  case "tickle":
  case "yawn":
  case "partingshot":
  case "nobleroar":
  case "growl":
  case "screech":
  case "eerieimpulse":
  case "confide":
  case "defog":
  case "meanlook":
  case "bestow":
  case "trickortreat":
  case "spite":
  case "lockon":
  case "mindreader":
  case "memento":
  case "dragoncheer":
  case "upperhand":
  case "toxic":
  case "spicyextract":
  case "willowisp":
  case "confuseray":
  case "lovelykiss":
  case "spore":
  case "hypnosis":
  case "soak":
    return nativeUtilityStatusSteps(actor, target, animationKey);
  case "junglehealing":
  case "healbell":
  case "healingwish":
  case "healpulse":
  case "wish":
  case "aromatherapy":
  case "lifedew":
  case "refresh":
  case "roost":
  case "softboiled":
  case "milkdrink":
  case "morningsun":
  case "moonlight":
  case "lunarblessing":
  case "shoreup":
  case "revivalblessing":
    return nativeP2HealingSteps(actor, target, animationKey);
  case "tailwind":
    return nativeTailwindSteps(actor);
  case "substitute":
    return nativeSubstituteSteps(actor);
  case "transform":
  case "conversion":
  case "mimic":
  case "sketch":
  case "teleport":
  case "recycle":
  case "batonpass":
  case "trick":
  case "switcheroo":
  case "skillswap":
    return formChangeSteps(actor, animationKey);
  case "dig":
  case "dive":
    return nativeDiveDigSteps(actor, target, animationKey);
  case "spikes":
  case "toxicspikes":
  case "stickyweb":
    return nativeFieldHazardSetupSteps(actor, target, animationKey);
  case "terrainpulse":
  case "weatherball":
    return nativeWeatherTerrainPulseSteps(actor, target, animationKey);
  case "raindance":
  case "sunnyday":
  case "hail":
  case "snowscape":
  case "chillyreception":
  case "sandstorm":
  case "grassyterrain":
  case "electricterrain":
  case "mistyterrain":
  case "gravity":
  case "trickroom":
  case "magicroom":
  case "wonderroom":
    return nativeEnvironmentMoveSteps(actor, animationKey);
  case "swordsdance":
    return exactSwordsDanceSteps(actor);
  case "dragondance":
  case "quiverdance":
  case "victorydance":
  case "rockpolish":
  case "bulkup":
  case "calmmind":
  case "nastyplot":
  case "shellsmash":
  case "teeterdance":
  case "agility":
  case "doubleteam":
  case "metronome":
  case "splash":
  case "celebrate":
  case "bellydrum":
  case "focusenergy":
  case "harden":
  case "defensecurl":
  case "irondefense":
  case "howl":
  case "curse":
  case "shiftgear":
  case "stockpile":
  case "swallow":
  case "ingrain":
  case "coil":
  case "powertrick":
  case "acupressure":
  case "autotomize":
  case "cottonguard":
  case "defendorder":
  case "meditate":
  case "sharpen":
  case "withdraw":
  case "acidarmor":
  case "barrier":
  case "cosmicpower":
  case "charge":
  case "luckychant":
  case "geomancy":
  case "magnetrise":
  case "minimize":
  case "growth":
  case "tailglow":
  case "takeheart":
  case "happyhour":
    return nativeBoostDanceSteps(actor, animationKey);
  case "reflect":
  case "lightscreen":
  case "safeguard":
  case "kingsshield":
  case "spikyshield":
  case "craftyshield":
  case "burningbulwark":
  case "auroraveil":
  case "mist":
  case "detect":
  case "banefulbunker":
  case "matblock":
  case "magiccoat":
  case "quickguard":
  case "wideguard":
  case "endure":
    return nativeShieldGuardSteps(actor, animationKey);
  case "earthquake":
  case "magnitude":
  case "fissure":
  case "landswrath":
    return nativeEarthquakeSteps(actor, target, animationKey);
  case "bulldoze":
    return nativeBulldozeSteps(actor, target);
  case "protect":
    return nativeProtectSteps(actor);
  case "recover":
    return nativeRecoverSteps(actor, "recover");
  case "rest":
    return nativeRestSteps(actor);
  case "painsplit":
    return nativePainSplitSteps(actor, target);
  case "thunderbolt":
    return nativeThunderboltSteps(actor, target);
  case "psychic":
    return nativePsychicSteps(actor, target);
  case "storedpower":
    return nativePsychicSteps(actor, target);
  case "icebeam":
    return nativeIceBeamSteps(actor, target);
  case "flamethrower":
  case "armorcannon":
  case "fireblast":
  case "blastburn":
  case "overheat":
  case "sacredfire":
  case "blueflare":
  case "beakblast":
  case "burnup":
  case "fusionflare":
  case "heatwave":
  case "eruption":
  case "temperflare":
  case "torchsong":
  case "vcreate":
  case "ragingfury":
  case "shelltrap":
  case "matchagotcha":
  case "magmastorm":
  case "lavaplume":
    return nativeFireProjectileSteps(actor, target, animationKey);
  case "technoblast":
  case "ivycudgelwater":
  case "ivycudgelfire":
  case "ivycudgelrock":
  case "dizzypunch":
  case "psychocut":
  case "brutalswing":
  case "firespin":
  case "leaftornado":
  case "hiddenpower":
  case "hyperbeam":
  case "gigaimpact":
  case "judgment":
  case "chargebeam":
  case "psybeam":
  case "twinbeam":
  case "signalbeam":
  case "simplebeam":
  case "flashcannon":
  case "lusterpurge":
  case "mistball":
  case "mysticalpower":
  case "psyshock":
  case "psystrike":
  case "lightofruin":
  case "roaroftime":
  case "dracometeor":
  case "dragonenergy":
  case "meteorbeam":
  case "prismaticlaser":
  case "photongeyser":
  case "coreenforcer":
  case "moongeistbeam":
  case "ficklebeam":
  case "ficklebeamallout":
    return nativeSpecialWeaponSteps(actor, target, animationKey);
  case "gigavolthavoc":
  case "stokedsparksurfer":
  case "extremeevoboost":
    return nativeZMoveSparkSteps(actor, target, animationKey);
  case "flail":
  case "populationbomb":
  case "bide":
  case "orderup":
  case "multiattack":
  case "seismictoss":
  case "holdback":
  case "knockdown":
  case "stomp":
  case "ironhead":
  case "heartstamp":
  case "slam":
  case "dragontail":
  case "reversal":
  case "punishment":
  case "circlethrow":
  case "knockoff":
  case "assurance":
  case "chipaway":
  case "bodyslam":
  case "gigatonhammer":
  case "heavyslam":
  case "pound":
  case "wakeupslap":
  case "smellingsalts":
  case "lick":
  case "visegrip":
  case "headbutt":
  case "block":
  case "facade":
  case "return":
  case "thrash":
  case "doublehit":
  case "doubleslap":
  case "endeavor":
  case "strength":
  case "playrough":
  case "zenheadbutt":
  case "fakeout":
  case "covet":
  case "feint":
  case "struggle":
  case "outrage":
  case "hardpress":
    return stepsForOtherAnimation("contactattack", actor, target);
  case "present":
  case "payday":
  case "fling":
    return nativeThrownItemSteps(actor, target, animationKey);
  case "rollout":
  case "spinout":
    return spinWithElementSteps(actor, target, animationKey === "rollout" ? "rocks" : "impact");
  case "dualschop":
  case "megahorn":
  case "geargrind":
  case "iciclespear":
  case "tailslap":
  case "furyswipes":
  case "furyattack":
  case "spikecannon":
  case "twineedle":
    return nativeMultiHitPhysicalSteps(actor, target, animationKey);
  case "wickedblow":
  case "thief":
  case "feintattack":
    return nativeDarkContactSteps(actor, target, animationKey);
  case "vacuumwave":
    return pulseProjectileSteps(actor, target, "wisp", {count: 2, background: "#d8f4ff", compact: true});
  case "zapcannon":
  case "wildcharge":
  case "boltstrike":
  case "fusionbolt":
    return nativeElectricMoveSteps(actor, target, animationKey);
  case "poisonfang":
  case "poisongas":
  case "smog":
  case "clearsmog":
  case "sludge":
  case "sludgewave":
  case "sludgebomb":
  case "barbbarrage":
  case "gunkshot":
  case "poisonjab":
  case "malignantchain":
  case "noxioustorque":
    return nativePoisonMoveSteps(actor, target, animationKey);
  case "drillrun":
  case "bonemerang":
  case "boneclub":
  case "triplearrows":
  case "thousandarrows":
  case "thousandwaves":
  case "sandtomb":
  case "stompingtantrum":
  case "collisioncourse":
    return nativeGroundWeaponSteps(actor, target, animationKey);
  case "whirlwind":
  case "springtidestorm":
  case "wildboltstorm":
  case "sandsearstorm":
  case "ominouswind":
    return nativeWindStormSteps(actor, target, animationKey);
  case "nightshade":
  case "hex":
  case "infernalparade":
  case "fierywrath":
  case "hyperspacehole":
  case "hyperspacefury":
  case "spiritshackle":
  case "powertrip":
  case "spectralthief":
  case "astralbarrage":
    return nativeShadowSpecialSteps(actor, target, animationKey);
  case "bloodmoon":
    return beamSteps(actor, target, "mistball", "#cc2f44");
  case "explosion":
    return explosionSteps(actor, target, "#ff7845", "impact");
  case "doomdesire":
    return beamSteps(actor, target, "shine", "#fff4a8");
  case "rockslide":
  case "rockblast":
  case "stoneedge":
  case "rockwrecker":
    return nativeRockSlideSteps(actor, target);
  case "rockthrow":
  case "rocksmash":
  case "stealthrock":
  case "precipiceblades":
  case "ancientpower":
  case "powergem":
  case "diamondstorm":
  case "saltcure":
  case "gmaxsteelsurge":
    return nativeRockGroundSetupSteps(actor, target, animationKey);
  case "shadowball":
  case "darkpulse":
    return ghostDarkSteps(actor, target, animationKey === "darkpulse" ? "blackwisp" : "shadowball");
  case "shadowforce":
  case "shadowbone":
  case "oblivionwing":
  case "darkvoid":
  case "psychoboost":
  case "esperwing":
    return nativeShadowSpecialSteps(actor, target, animationKey);
  case "energyball":
  case "seedflare":
  case "leafstorm":
  case "magicalleaf":
  case "petaldance":
    return nativeGrassMoveSteps(actor, target, animationKey);
  case "solarbeam":
    return beamSteps(actor, target, "energyball", "#69d879");
  case "bulletseed":
  case "seedbomb":
  case "leechseed":
  case "grassknot":
  case "leafage":
  case "petalblizzard":
  case "chloroblast":
    return nativeSeedLeafSteps(actor, target, animationKey);
  case "moonblast":
    return nativeMoonblastSteps(actor, target);
  case "earthpower":
  case "mudbomb":
  case "mudshot":
    return nativeEarthPowerSteps(actor, target, animationKey);
  case "waterpulse":
  case "bubblebeam":
  case "muddywater":
  case "waterspout":
  case "steameruption":
  case "waterpledge":
  case "watersport":
  case "watershuriken":
  case "wavecrash":
  case "crabhammer":
  case "brine":
  case "octazooka":
  case "scald":
  case "originpulse":
    return nativeWaterMoveSteps(actor, target, animationKey);
  case "blizzard":
  case "freezedry":
  case "iceball":
  case "freezeshock":
  case "iceburn":
  case "freezingglare":
  case "icywind":
  case "avalanche":
  case "iciclecrash":
  case "sheercold":
  case "glaciallance":
    return nativeIceStormSteps(actor, target, animationKey);
  case "leafblade":
  case "firelash":
  case "stoneaxe":
  case "aquacutter":
  case "razorshell":
  case "flowertrick":
  case "solarblade":
  case "razorwind":
  case "spacialrend":
  case "sacredsword":
  case "secretsword":
  case "falseswipe":
  case "furycutter":
  case "scratch":
  case "cut":
  case "irontail":
  case "xscissor":
  case "crosspoison":
  case "guillotine":
    return nativeClawSlashSteps(actor, target, animationKey);
  case "psychicfangs":
  case "firefang":
  case "icefang":
  case "thunderfang":
    return nativeFangSteps(actor, target, animationKey);
  case "blazekick":
  case "firepunch":
  case "spark":
  case "flamecharge":
  case "flareblitz":
    return nativeElementalContactSteps(actor, target, animationKey);
  case "lowkick":
  case "thunderouskick":
  case "tropkick":
  case "jumpkick":
  case "highjumpkick":
  case "icehammer":
  case "shadowpunch":
  case "focuspunch":
  case "drainpunch":
  case "dynamicpunch":
  case "cometpunch":
  case "megapunch":
  case "poweruppunch":
  case "bulletpunch":
  case "suckerpunch":
  case "icepunch":
  case "thunderpunch":
  case "forcepalm":
  case "karatechop":
  case "crosschop":
  case "hammerarm":
  case "skyuppercut":
  case "meteormash":
  case "ragefist":
  case "tripleaxel":
    return nativePunchKickSteps(actor, target, animationKey);
  case "powerwhip":
  case "woodhammer":
  case "ivycudgel":
  case "needlearm":
    return nativeSeedLeafSteps(actor, target, animationKey);
  case "hornleech":
  case "absorb":
  case "megadrain":
  case "gigadrain":
  case "bitterblade":
  case "leechlife":
  case "paraboliccharge":
  case "drainingkiss":
    return stepsForOtherAnimation("drain", actor, target);
  case "superfang":
    return [...stepsForOtherAnimation("bite", actor, target), ...stepsForOtherAnimation("contactattack", actor, target)];
  case "astonish":
    return ghostDarkSteps(actor, target, "shadowball");
  case "bind":
  case "clamp":
    return stepsForOtherAnimation("bound", actor, target);
  case "airslash":
    return [showEffectStep("rightslash", actor, target, 380, {fade: "both"}), showEffectStep("feather", {...target, y: target.y + 20}, {...target, y: target.y - 26, opacity: 0}, 520, {fade: "both"}), actorAnimStep(target, {z: behind(target, 18)}, 180)];
  case "surf":
    return nativeSurfSteps(actor, target);
  case "hydropump":
    return stepsForOtherAnimation("hydroshot", actor, target);
  case "swift":
    return [showEffectStep("shine", actor, target, 360, {fade: "both"}), showEffectStep("shine", {...actor, x: actor.x + 16}, {...target, x: target.x - 18, opacity: .2}, 460, {fade: "both"}), showEffectStep("shine", {...actor, x: actor.x - 18}, {...target, x: target.x + 22, opacity: .2}, 540, {fade: "both"})];
  case "triattack":
    return nativeTriAttackSteps(actor, target);
  case "dazzlinggleam":
  case "naturesmadness":
  case "ruination":
    return nativeFairyLightSteps(actor, target, animationKey);
  case "magnetbomb":
  case "makeitrain":
  case "sunsteelstrike":
    return nativeMetalProjectileSteps(actor, target, animationKey);
  case "mistyexplosion":
    return explosionSteps(actor, target, "#ffc7f5", "mistball");
  case "dragonascent":
    return nativeFlyingStrikeSteps(actor, target, animationKey);
  case "supersonicskystrike":
  case "sinisterarrowraid":
    return zMoveSteps(actor, target, "#bfefff");
  case "syrupbomb":
    return nativeSeedLeafSteps(actor, target, animationKey);
  case "smartstrike":
  case "anchorshot":
  case "mightycleave":
  case "tachyoncutter":
    return nativeClawSlashSteps(actor, target, animationKey);
  case "firstimpression":
    return nativeFastStrikeSteps(actor, target, animationKey);
  case "plasmafists":
  case "supercellslam":
  case "catastropika":
    return nativeElectricMoveSteps(actor, target, animationKey);
  case "blazingtorque":
  case "infernooverdrive":
  case "searingsunrazesmash":
    return nativeFireProjectileSteps(actor, target, animationKey);
  case "combattorque":
  case "alloutpummeling":
    return nativePunchKickSteps(actor, target, animationKey);
  case "clangingscales":
  case "clangoroussoulblaze":
    return nativeSoundVoiceSteps(actor, target, animationKey);
  case "fishiousrend":
    return nativeWaterMoveSteps(actor, target, "wavecrash");
  case "spiritbreak":
  case "twinkletackle":
  case "letssnuggleforever":
  case "guardianofalola":
  case "magicaltorque":
    return nativeFairyLightSteps(actor, target, animationKey);
  case "continentalcrush":
  case "splinteredstormshards":
    return zMoveSteps(actor, target, "#8c7255");
  case "wickedtorque":
  case "blackholeeclipse":
  case "neverendingnightmare":
  case "soulstealing7starstrike":
    return zMoveSteps(actor, target, "#05000a");
  case "aciddownpour":
    return zMoveSteps(actor, target, "#8c40c8");
  case "corkscrewcrash":
    return zMoveSteps(actor, target, "#d9f3ff");
  case "pulverizingpancake":
    return zMoveSteps(actor, target, "#f4d28a");
  case "oceanicoperetta":
    return zMoveSteps(actor, target, "#3d9dff");
  case "terastarstorm":
    return zMoveSteps(actor, target, "#f4f7ff");
  case "nightslash":
    return darkSlashSteps(actor, target, "rightslash");
  case "shadowclaw":
    return [{type: "backgroundEffect", color: "#000000", durationMs: 700, opacity: .3}, ...stepsForOtherAnimation("clawattack", actor, target)];
  case "superfang":
  case "bugbite":
    return [...stepsForOtherAnimation("bite", actor, target), ...stepsForOtherAnimation("contactattack", actor, target)];
  case "crunch":
    return darkBiteSteps(actor, target);
  case "pursuit":
    return [showEffectStep("shadowball", {...target, scale: 0, opacity: .2}, {...target, scale: 1.5, opacity: 0}, 520, {fade: "both"}), actorAnimStep(actor, {x: leftOf(target, 20), y: target.y, z: behind(target, -20)}, 300, "ballistic2Under"), actorAnimStep(target, {x: leftOf(target, 10)}, 180, "swing")];
  case "revelationdance":
    return nativeRevelationDanceSteps(actor, target);
  default:
    return SUPPORTED_MOVE_ANIMS.has(animationKey) ? presetRouterSteps(animationKey, actor, target) : [];
  }
}

function flightSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, animationKey: string): ShowdownAnimationStepV4[] {
  const isSteel = animationKey === "steelwing";
  return [
    actorAnimStep(actor, {y: actor.y - 72, z: behind(actor, 40), opacity: .82}, 220, "decel"),
    showEffectStep("feather", {...actor, y: actor.y - 44, scale: .8, opacity: .8}, {...actor, y: actor.y - 92, opacity: 0}, 360, {fade: "both"}),
    actorAnimStep(actor, {x: target.x, y: target.y + 12, z: behind(target, -24), scale: animationKey === "flyingpress" ? 1.18 : 1}, 260, "accel"),
    showEffectStep(isSteel ? "leftslash" : "rightslash", target, {...target, scale: 2.4, opacity: 0}, 360, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 22)}, 180, "swing"),
  ];
}

function darkSlashSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, slashSprite: string): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#000000", durationMs: 700, opacity: .3},
    showEffectStep(slashSprite, {...target, x: target.x + 5, y: target.y + 20}, {...target, scale: 3, opacity: 0}, 360, {fade: "both"}),
    showEffectStep(slashSprite, {...target, x: target.x - 5, y: target.y - 20}, {...target, scale: 3, opacity: 0}, 460, {fade: "both"}),
    ...stepsForOtherAnimation("contactattack", actor, target),
  ];
}

function darkBiteSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#000000", durationMs: 800, opacity: .3},
    showEffectStep("topbite", {...target, y: target.y + 70, scale: .65, opacity: 0}, {...target, y: target.y + 20, opacity: 1}, 360, {fade: "in"}),
    showEffectStep("bottombite", {...target, y: target.y - 70, scale: .65, opacity: 0}, {...target, y: target.y - 20, opacity: 1}, 360, {fade: "in"}),
    ...stepsForOtherAnimation("contactattack", actor, target),
  ];
}

function spinWithElementSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, spriteId: string): ShowdownAnimationStepV4[] {
  return [
    showEffectStep(spriteId, {...actor, scale: 1.4, opacity: .55}, {...target, y: target.y + 42, z: behind(target, -30), opacity: .75}, 420, {fade: "both"}),
    showEffectStep(spriteId, {...target, y: target.y + 42, z: behind(target, -30), scale: 1.5, opacity: .75}, {...target, y: target.y + 5, z: target.z, opacity: 1}, 520, {fade: "both"}),
    ...stepsForOtherAnimation("spinattack", actor, target),
  ];
}

function electricWaveSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, options: {wide?: boolean; projectile?: boolean; status?: boolean; background?: string} = {}): ShowdownAnimationStepV4[] {
  const steps: ShowdownAnimationStepV4[] = [];
  if (options.background) steps.push({type: "backgroundEffect", color: options.background, durationMs: 520, opacity: .24});
  if (options.wide) {
    steps.push(showEffectStep("electroball", {...actor, scale: 1, opacity: .2}, {...actor, scale: 8, opacity: .1}, 600, {fade: "both"}));
    steps.push(showEffectStep("electroball", {...actor, scale: 1, opacity: .2}, {...actor, scale: 8, opacity: .1}, 760, {fade: "both"}));
  }
  if (options.projectile) steps.push(showEffectStep("electroball", {...actor, opacity: .8}, {...target, opacity: .7}, 420, {fade: "both"}));
  steps.push(showEffectStep("electroball", {...target, scale: options.status ? 1 : 0, opacity: .3}, {...target, scale: options.status ? 4 : 3, opacity: 0}, 520, {fade: "both"}));
  steps.push(actorAnimStep(target, {x: leftOf(target, 8)}, 160, "swing"));
  return steps;
}

function pulseProjectileSteps(
  actor: ShowdownSpriteActorV4,
  target: ShowdownSpriteActorV4,
  spriteId: string,
  options: {count?: number; background?: string; secondarySprite?: string; charge?: boolean; compact?: boolean} = {},
): ShowdownAnimationStepV4[] {
  const count = options.count || 3;
  const steps: ShowdownAnimationStepV4[] = [];
  if (options.background) steps.push({type: "backgroundEffect", color: options.background, durationMs: options.compact ? 480 : 700, opacity: options.compact ? .2 : .34});
  if (options.charge) steps.push(showEffectStep(spriteId, {...actor, scale: 2.8, opacity: .25}, {...actor, scale: .65, opacity: .85}, 340, {fade: "both"}));
  for (let i = 0; i < count; i++) {
    const drift = (i - Math.floor(count / 2)) * 12;
    steps.push(showEffectStep(spriteId, {...actor, x: actor.x + drift, scale: .35 + i * .05, opacity: .65}, {...target, x: target.x - drift, scale: 1.15, opacity: .1}, 360 + i * 70, {fade: "both"}));
    if (options.secondarySprite) steps.push(showEffectStep(options.secondarySprite, {...actor, x: actor.x - drift, scale: .3, opacity: .35}, {...target, x: target.x + drift, scale: 1.7, opacity: 0}, 420 + i * 70, {fade: "both"}));
  }
  steps.push(actorAnimStep(target, {z: behind(target, 18)}, 180, "swing"));
  return steps;
}

function exactSwordsDanceSteps(actor: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  const high = actor.y - 58;
  const mid = actor.y - 12;
  return [
    ...stepsForOtherAnimation("shake", actor, actor),
    showEffectStep("sword", {...actor, x: actor.x + 50, y: mid, scale: .5, opacity: 1}, {...actor, x: actor.x - 50, y: mid, scale: 1, opacity: .35}, 520, {easing: "ballistic2", fade: "out", delayMs: 0}),
    showEffectStep("sword", {...actor, x: actor.x - 50, y: mid, scale: .5, opacity: 1}, {...actor, x: actor.x + 50, y: mid, scale: 1, opacity: .35}, 520, {easing: "ballistic2back", fade: "out", delayMs: 80}),
    showEffectStep("sword", {...actor, x: actor.x + 36, y: actor.y + 8, scale: .55, opacity: .95}, {...actor, x: actor.x - 22, y: high, scale: 1.18, opacity: 0}, 620, {easing: "ballistic2", fade: "out", delayMs: 120}),
    showEffectStep("sword", {...actor, x: actor.x - 36, y: actor.y + 8, scale: .55, opacity: .95}, {...actor, x: actor.x + 22, y: high, scale: 1.18, opacity: 0}, 620, {easing: "ballistic2back", fade: "out", delayMs: 80}),
    showEffectStep("sword", {...actor, x: actor.x, y: actor.y + 16, scale: .72, opacity: .9}, {...actor, x: actor.x, y: high - 8, scale: 1.34, opacity: 0}, 680, {easing: "ballistic2Under", fade: "out", delayMs: 120}),
    actorAnimStep(actor, {y: actor.y - 8, scale: 1.08}, 220, "decel"),
    actorAnimStep(actor, {y: actor.y, scale: 1}, 220, "swing"),
  ];
}

function nativeEarthquakeSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const isFissure = key === "fissure";
  return [
    {type: "backgroundEffect", color: isFissure ? "#3d2615" : "#9b6a35", durationMs: 920, opacity: isFissure ? .46 : .34},
    actorAnimStep(actor, {x: leftOf(actor, -10), y: actor.y + 6}, 120, "swing"),
    actorAnimStep(actor, {x: leftOf(actor, 12), y: actor.y - 4}, 120, "swing"),
    showEffectStep("mudwisp", {...target, x: target.x - 52, y: target.y + 76, scale: .7, opacity: .55}, {...target, x: target.x - 22, y: target.y + 14, scale: 2.1, opacity: 0}, 520, {easing: "ballistic2Under", fade: "both"}),
    showEffectStep("impact", {...target, x: target.x + 8, y: target.y + 58, scale: .35, opacity: .55}, {...target, x: target.x + 8, y: target.y + 8, scale: 2.2, opacity: 0}, 440, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 14), y: target.y - 8, z: behind(target, 20)}, 110, "swing"),
    showEffectStep("rocks", {...target, x: target.x + 44, y: target.y + 84, scale: .82, opacity: .72}, {...target, x: target.x + 12, y: target.y + 4, scale: 1.3, opacity: .12}, 520, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, -12), y: target.y + 8}, 110, "swing"),
    showEffectStep("mudwisp", {...target, x: target.x + 42, y: target.y + 72, scale: .7, opacity: .48}, {...target, x: target.x + 8, y: target.y + 10, scale: 2.4, opacity: 0}, 620, {fade: "both"}),
    actorAnimStep(target, {x: target.x, y: target.y, z: target.z}, 160, "swing"),
  ];
}

function nativeBulldozeSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#b98442", durationMs: 720, opacity: .28},
    actorAnimStep(actor, {x: leftOf(target, -34), y: target.y + 24, z: behind(target, -28)}, 340, "ballistic2Under"),
    showEffectStep("mudwisp", {...target, y: target.y + 68, scale: .8, opacity: .55}, {...target, y: target.y + 8, scale: 2.1, opacity: 0}, 520, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 16), z: behind(target, 18)}, 180, "swing"),
  ];
}

function nativeProtectSteps(actor: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#61d889", durationMs: 520, opacity: .18},
    showEffectStep("shine", {...actor, scale: 1.6, opacity: .28}, {...actor, scale: 2.6, opacity: 0}, 620, {fade: "both"}),
    showEffectStep("wisp", {...actor, y: actor.y + 18, scale: 2.2, opacity: .22}, {...actor, y: actor.y - 10, scale: 3.2, opacity: 0}, 520, {fade: "both"}),
    actorAnimStep(actor, {scale: 1.04}, 180, "decel"),
  ];
}

function nativeRecoverSteps(actor: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const color = key === "rest" ? "#a7c8ff" : "#8dffb0";
  return [
    {type: "backgroundEffect", color, durationMs: 680, opacity: .24},
    showEffectStep("shine", {...actor, y: actor.y + 36, scale: 1.4, opacity: .18}, {...actor, y: actor.y - 24, scale: 2.2, opacity: 0}, 620, {fade: "both"}),
    showEffectStep("wisp", {...actor, x: actor.x - 18, y: actor.y + 24, scale: .5, opacity: .56}, {...actor, x: actor.x + 12, y: actor.y - 42, scale: 1.3, opacity: 0}, 620, {fade: "both"}),
    showEffectStep("wisp", {...actor, x: actor.x + 18, y: actor.y + 24, scale: .5, opacity: .56}, {...actor, x: actor.x - 12, y: actor.y - 42, scale: 1.3, opacity: 0}, 720, {fade: "both"}),
    actorAnimStep(actor, {scale: 1.08}, 180, "decel"),
    {type: "healAnim", actor, heal: null},
  ];
}

function nativeRestSteps(actor: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    ...nativeRecoverSteps(actor, "rest"),
    showEffectStep("wisp", {...actor, y: actor.y - 18, scale: .4, opacity: .35}, {...actor, y: actor.y - 52, scale: 1.2, opacity: 0}, 760, {fade: "both"}),
    actorAnimStep(actor, {y: actor.y + 8, opacity: .82}, 240, "swing"),
  ];
}

function nativeThunderboltSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#05070d", durationMs: 700, opacity: .34},
    showEffectStep("electroball", {...actor, scale: .45, opacity: .6}, {...target, scale: 1.4, opacity: .18}, 420, {fade: "both"}),
    showEffectStep("lightning", {...target, y: target.y + 160, yscale: 0, xscale: 2.2, opacity: .92}, {...target, y: target.y + 44, yscale: 1.2, xscale: 1.35, opacity: .72}, 260, {fade: "both"}),
    showEffectStep("lightning", {...target, x: target.x - 18, y: target.y + 150, yscale: 0, xscale: 1.7, opacity: .86}, {...target, x: target.x + 8, y: target.y + 40, yscale: 1, xscale: 1.15, opacity: .62}, 420, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, -10)}, 90, "swing"),
    actorAnimStep(target, {x: leftOf(target, 10)}, 90, "swing"),
    actorAnimStep(target, {x: target.x}, 90, "swing"),
  ];
}

function nativePsychicSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#aa44ff", durationMs: 760, opacity: .34},
    showEffectStep("mistball", {...actor, scale: .4, opacity: .35}, {...target, scale: 1.65, opacity: .18}, 540, {fade: "both"}),
    actorAnimStep(target, {y: target.y - 18, scale: 1.16}, 180, "decel"),
    showEffectStep("wisp", {...target, scale: 1.1, opacity: .22}, {...target, scale: 3.1, opacity: 0}, 620, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 14), y: target.y - 8, scale: 1.22}, 130, "swing"),
    actorAnimStep(target, {x: leftOf(target, -14), y: target.y + 4, scale: 1.08}, 130, "swing"),
    actorAnimStep(target, {x: target.x, y: target.y, scale: 1}, 160, "swing"),
  ];
}

function nativeIceBeamSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#bfefff", durationMs: 520, opacity: .2},
    showEffectStep("iceball", {...actor, scale: .35, opacity: .72}, {...target, scale: 1.15, opacity: .15}, 440, {fade: "both"}),
    showEffectStep("icicle", {...target, x: target.x - 22, y: target.y + 78, opacity: .85}, {...target, x: target.x - 8, y: target.y + 8, opacity: .08, scale: .85}, 520, {fade: "both"}),
    showEffectStep("icicle", {...target, x: target.x + 24, y: target.y + 72, opacity: .75}, {...target, x: target.x + 8, y: target.y + 4, opacity: .08, scale: .85}, 620, {fade: "both"}),
    actorAnimStep(target, {scale: .94, opacity: .9}, 180, "swing"),
    actorAnimStep(target, {scale: 1, opacity: 1}, 180, "swing"),
  ];
}

function nativeFireProjectileSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const sprite = key === "fireblast" ? "flareball" : key.includes("blue") ? "bluefireball" : "fireball";
  return [
    {type: "backgroundEffect", color: "#ff652f", durationMs: key === "blastburn" ? 860 : 620, opacity: key === "blastburn" ? .42 : .3},
    showEffectStep(sprite, {...actor, scale: .5, opacity: .78}, {...target, scale: 1.28, opacity: .18}, key === "blastburn" ? 720 : 520, {fade: "both"}),
    showEffectStep("fireball", {...target, x: target.x - 18, y: target.y + 10, scale: .7, opacity: .52}, {...target, x: target.x + 14, y: target.y - 16, scale: 2.2, opacity: 0}, 520, {fade: "both"}),
    showEffectStep("fireball", {...target, x: target.x + 18, y: target.y + 18, scale: .62, opacity: .45}, {...target, x: target.x - 10, y: target.y - 18, scale: 2.1, opacity: 0}, 620, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 18)}, 170, "swing"),
  ];
}

function nativeRockSlideSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#8c7255", durationMs: 640, opacity: .22},
    showEffectStep("rocks", {...target, y: target.y + 95, opacity: .85}, target, 520, {fade: "both"}),
    showEffectStep("rock1", {...target, x: target.x - 42, y: target.y + 84, scale: .9}, {...target, x: target.x - 10, y: target.y + 8, scale: 1.1, opacity: .1}, 420, {fade: "both"}),
    showEffectStep("rock2", {...target, x: target.x + 38, y: target.y + 92, scale: .9}, {...target, x: target.x + 10, y: target.y + 6, scale: 1.1, opacity: .1}, 520, {fade: "both"}),
    showEffectStep("rock3", {...target, x: target.x + 4, y: target.y + 110, scale: .78}, {...target, x: target.x + 2, y: target.y + 12, scale: 1.06, opacity: .1}, 620, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 25), x: leftOf(target, 8)}, 180, "swing"),
  ];
}

function nativeSurfSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#3d9dff", durationMs: 760, opacity: .3},
    showEffectStep("waterwisp", {...actor, x: actor.x - 24, y: actor.y + 20, scale: 1.3, opacity: .45}, {...target, x: target.x - 34, y: target.y + 22, scale: 2.4, opacity: .12}, 620, {fade: "both"}),
    showEffectStep("waterwisp", {...actor, x: actor.x + 18, y: actor.y + 30, scale: 1.1, opacity: .4}, {...target, x: target.x + 32, y: target.y + 12, scale: 2.2, opacity: .1}, 720, {fade: "both"}),
    showEffectStep("waterwisp", {...target, x: target.x - 30, y: target.y + 44, scale: .9, opacity: .5}, {...target, x: target.x + 30, y: target.y - 12, scale: 1.6, opacity: 0}, 620, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 22), y: target.y - 6}, 180, "swing"),
  ];
}

function nativeFlyingStrikeSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "hurricane") {
    return [
      {type: "backgroundEffect", color: "#9fd5ff", durationMs: 820, opacity: .24},
      showEffectStep("wisp", {...target, x: target.x - 58, y: target.y + 78, scale: .5, opacity: .38}, {...target, x: target.x + 24, y: target.y - 42, scale: 2.2, opacity: 0}, 720, {easing: "ballistic2", fade: "both"}),
      showEffectStep("wisp", {...target, x: target.x + 50, y: target.y + 72, scale: .5, opacity: .34}, {...target, x: target.x - 22, y: target.y - 36, scale: 2.1, opacity: 0}, 760, {easing: "ballistic2back", fade: "both"}),
      showEffectStep("feather", {...target, y: target.y + 36, scale: .8, opacity: .72}, {...target, y: target.y - 48, scale: 1.6, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(target, {y: target.y - 16, x: leftOf(target, 12), z: behind(target, 24)}, 180, "swing"),
      actorAnimStep(target, {y: target.y, x: target.x, z: target.z}, 180, "swing"),
    ];
  }
  if (key === "aeroblast") {
    return [
      {type: "backgroundEffect", color: "#d9f3ff", durationMs: 620, opacity: .24},
      showEffectStep("wisp", {...actor, scale: .45, opacity: .7}, {...target, scale: 1.5, opacity: .12}, 620, {fade: "both"}),
      showEffectStep("feather", {...target, x: target.x - 20, y: target.y + 38, opacity: .7}, {...target, x: target.x + 20, y: target.y - 35, opacity: 0}, 580, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 22), x: leftOf(target, 10)}, 180, "swing"),
    ];
  }
  if (key === "airslash" || key === "aircutter") {
    const slash = key === "aircutter" ? "leftslash" : "rightslash";
    return [
      {type: "backgroundEffect", color: "#d8f3ff", durationMs: 520, opacity: .18},
      showEffectStep(slash, {...actor, scale: .7, opacity: .65}, {...target, scale: 2.4, opacity: 0}, 440, {fade: "both"}),
      showEffectStep("feather", {...target, y: target.y + 22, opacity: .58}, {...target, y: target.y - 30, scale: 1.4, opacity: 0}, 520, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 18)}, 180, "swing"),
    ];
  }
  return flightSteps(actor, target, key);
}

function nativeElectricMoveSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "thunder") {
    return [
      {type: "backgroundEffect", color: "#05070d", durationMs: 820, opacity: .42},
      showEffectStep("electroball", {...actor, scale: .4, opacity: .65}, {...target, scale: 1.7, opacity: .18}, 420, {fade: "both"}),
      showEffectStep("lightning", {...target, y: target.y + 180, yscale: 0, xscale: 2.5, opacity: .95}, {...target, y: target.y + 34, yscale: 1.4, xscale: 1.45, opacity: .72}, 320, {fade: "both"}),
      showEffectStep("lightning", {...target, x: target.x - 22, y: target.y + 165, yscale: 0, xscale: 1.9, opacity: .82}, {...target, x: target.x + 12, y: target.y + 28, yscale: 1.15, xscale: 1.2, opacity: .58}, 420, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, -12)}, 90, "swing"),
      actorAnimStep(target, {x: leftOf(target, 12)}, 90, "swing"),
      actorAnimStep(target, {x: target.x}, 90, "swing"),
    ];
  }
  if (key === "electroweb" || key === "thundercage") {
    return [
      {type: "backgroundEffect", color: "#ffe35a", durationMs: 700, opacity: .24},
      showEffectStep("web", {...actor, scale: .4, opacity: .65}, {...target, scale: key === "thundercage" ? 2.6 : 2.1, opacity: .26}, 560, {fade: "both"}),
      showEffectStep("electroball", {...target, scale: .4, opacity: .42}, {...target, scale: 3.2, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(target, {scale: .94, x: leftOf(target, 8)}, 180, "swing"),
      actorAnimStep(target, {scale: 1, x: target.x}, 180, "swing"),
    ];
  }
  if (key === "electrodrift") {
    return [
      {type: "backgroundEffect", color: "#5ff6ff", durationMs: 720, opacity: .28},
      showEffectStep("electroball", {...actor, scale: 1.4, opacity: .28}, {...actor, scale: 2.8, opacity: 0}, 320, {fade: "both"}),
      actorAnimStep(actor, {x: target.x, y: target.y + 8, z: behind(target, -24), scale: 1.08}, 280, "accel"),
      showEffectStep("lightning", {...target, y: target.y + 130, yscale: 0, opacity: .86}, {...target, y: target.y + 28, yscale: 1.15, opacity: .62}, 360, {fade: "both"}),
      showEffectStep("impact", target, {...target, scale: 2.2, opacity: 0}, 260, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 22)}, 180, "swing"),
    ];
  }
  if (key === "thunderclap") {
    return [
      {type: "backgroundEffect", color: "#fff35c", durationMs: 520, opacity: .32},
      showEffectStep("electroball", {...actor, scale: 2, opacity: .18}, {...target, scale: .7, opacity: .62}, 240, {fade: "both"}),
      showEffectStep("lightning", {...target, y: target.y + 120, yscale: 0, opacity: .8}, {...target, y: target.y + 28, yscale: .95, opacity: .55}, 300, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, 10)}, 140, "swing"),
    ];
  }
  return electricWaveSteps(actor, target, {wide: key === "discharge", projectile: key !== "discharge" && key !== "thunderwave", status: key === "thunderwave", background: "#ffe35a"});
}

function nativeGrassMoveSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "petaldance") {
    return [
      {type: "backgroundEffect", color: "#ffb0dc", durationMs: 820, opacity: .24},
      showEffectStep("petal", {...actor, x: actor.x - 20, scale: .8, opacity: .72}, {...target, x: target.x + 26, y: target.y - 22, scale: 1.5, opacity: 0}, 620, {fade: "both"}),
      showEffectStep("petal", {...actor, x: actor.x + 20, scale: .8, opacity: .66}, {...target, x: target.x - 22, y: target.y - 18, scale: 1.5, opacity: 0}, 700, {fade: "both"}),
      showEffectStep("petal", {...target, y: target.y + 24, opacity: .58}, {...target, y: target.y - 34, scale: 1.7, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, 10)}, 170, "swing"),
    ];
  }
  if (key === "leafstorm") {
    return [
      {type: "backgroundEffect", color: "#4fc66c", durationMs: 820, opacity: .28},
      showEffectStep("leaf1", {...target, x: target.x - 70, y: target.y + 80, scale: .8, opacity: .72}, {...target, x: target.x + 22, y: target.y - 38, scale: 1.5, opacity: 0}, 720, {fade: "both"}),
      showEffectStep("leaf2", {...target, x: target.x + 64, y: target.y + 76, scale: .8, opacity: .66}, {...target, x: target.x - 18, y: target.y - 32, scale: 1.5, opacity: 0}, 760, {fade: "both"}),
      showEffectStep("energyball", {...actor, scale: .45, opacity: .6}, {...target, scale: 1.5, opacity: .12}, 540, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 22), y: target.y - 8}, 180, "swing"),
    ];
  }
  if (key === "seedflare") {
    return [
      {type: "backgroundEffect", color: "#dfffb6", durationMs: 760, opacity: .28},
      showEffectStep("energyball", {...actor, scale: .42, opacity: .75}, {...target, scale: 1.25, opacity: .18}, 520, {fade: "both"}),
      showEffectStep("shine", {...target, scale: .7, opacity: .58}, {...target, scale: 2.8, opacity: 0}, 620, {fade: "both"}),
      showEffectStep("leaf1", {...target, x: target.x - 22, y: target.y + 22, opacity: .55}, {...target, x: target.x + 16, y: target.y - 28, opacity: 0}, 520, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 20)}, 180, "swing"),
    ];
  }
  if (key === "magicalleaf") {
    return [
      {type: "backgroundEffect", color: "#86f0a0", durationMs: 560, opacity: .18},
      showEffectStep("leaf1", {...actor, x: actor.x - 16, scale: .75, opacity: .72}, {...target, x: target.x + 18, scale: 1.2, opacity: .18}, 480, {fade: "both"}),
      showEffectStep("leaf2", {...actor, x: actor.x + 20, scale: .7, opacity: .66}, {...target, x: target.x - 18, scale: 1.2, opacity: .18}, 560, {fade: "both"}),
      showEffectStep("shine", target, {...target, scale: 1.6, opacity: 0}, 340, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, 8)}, 160, "swing"),
    ];
  }
  return [
    {type: "backgroundEffect", color: "#69d879", durationMs: 560, opacity: .18},
    showEffectStep("energyball", {...actor, scale: .45, opacity: .72}, {...target, scale: 1.2, opacity: .16}, 520, {fade: "both"}),
    showEffectStep("leaf1", target, {...target, x: target.x + 18, y: target.y - 18, opacity: 0}, 420, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 18)}, 180, "swing"),
  ];
}

function nativeMoonblastSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#ffd6fb", durationMs: 760, opacity: .32},
    showEffectStep("moon", {...actor, y: actor.y - 40, scale: .7, opacity: .8}, {...target, y: target.y - 36, scale: 1.5, opacity: .18}, 620, {fade: "both"}),
    showEffectStep("shine", {...target, scale: .8, opacity: .52}, {...target, scale: 2.8, opacity: 0}, 620, {fade: "both"}),
    showEffectStep("wisp", {...target, x: target.x - 20, opacity: .36}, {...target, x: target.x + 16, y: target.y - 24, scale: 1.8, opacity: 0}, 520, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 18)}, 180, "swing"),
  ];
}

function nativeEarthPowerSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const sprite = key === "mudbomb" ? "mudwisp" : "rocks";
  return [
    {type: "backgroundEffect", color: "#b98442", durationMs: 700, opacity: .3},
    showEffectStep(sprite, {...target, x: target.x - 34, y: target.y + 84, scale: .7, opacity: .68}, {...target, x: target.x - 8, y: target.y + 8, scale: 1.8, opacity: .08}, 520, {easing: "ballistic2Under", fade: "both"}),
    showEffectStep("mudwisp", {...target, x: target.x + 28, y: target.y + 76, scale: .65, opacity: .52}, {...target, x: target.x + 8, y: target.y - 4, scale: 2.1, opacity: 0}, 620, {fade: "both"}),
    showEffectStep("impact", target, {...target, scale: 2.1, opacity: 0}, 320, {fade: "both"}),
    actorAnimStep(target, {y: target.y - 8, z: behind(target, 22)}, 150, "swing"),
    actorAnimStep(target, {y: target.y, z: target.z}, 150, "swing"),
  ];
}

function nativeWaterMoveSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "wavecrash") {
    return [
      {type: "backgroundEffect", color: "#3d9dff", durationMs: 760, opacity: .3},
      showEffectStep("waterwisp", {...actor, scale: 1.5, opacity: .36}, {...actor, scale: 2.8, opacity: 0}, 320, {fade: "both"}),
      actorAnimStep(actor, {x: target.x, y: target.y + 12, z: behind(target, -26), scale: 1.12}, 280, "accel"),
      showEffectStep("waterwisp", {...target, scale: .8, opacity: .72}, {...target, scale: 2.7, opacity: 0}, 440, {fade: "both", explode: true}),
      actorAnimStep(target, {z: behind(target, 26), x: leftOf(target, 14)}, 180, "swing"),
    ];
  }
  if (key === "crabhammer") {
    return [
      {type: "backgroundEffect", color: "#3d9dff", durationMs: 560, opacity: .2},
      showEffectStep("waterwisp", {...actor, scale: .52, opacity: .62}, {...target, scale: 1.25, opacity: .12}, 360, {fade: "both"}),
      actorAnimStep(actor, {x: target.x, y: target.y + 10, z: behind(target, -22)}, 240, "accel"),
      showEffectStep("impact", {...target, scale: .6, opacity: .78}, {...target, scale: 2.2, opacity: 0}, 320, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, 12), z: behind(target, 20)}, 170, "swing"),
    ];
  }
  if (key === "originpulse") {
    return [
      {type: "backgroundEffect", color: "#3d9dff", durationMs: 840, opacity: .34},
      showEffectStep("waterwisp", {...actor, x: actor.x - 22, scale: .55, opacity: .74}, {...target, x: target.x + 20, scale: 1.45, opacity: .12}, 620, {fade: "both"}),
      showEffectStep("waterwisp", {...actor, x: actor.x + 22, scale: .5, opacity: .68}, {...target, x: target.x - 20, scale: 1.45, opacity: .12}, 700, {fade: "both"}),
      showEffectStep("impact", {...target, scale: .65, opacity: .65}, {...target, scale: 2.4, opacity: 0}, 400, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 24)}, 180, "swing"),
    ];
  }
  if (key === "scald" || key === "brine" || key === "octazooka") {
    const muddy = key === "octazooka";
    return [
      {type: "backgroundEffect", color: key === "scald" ? "#9de7ff" : muddy ? "#8b7650" : "#3d9dff", durationMs: 620, opacity: .24},
      showEffectStep(muddy ? "mudwisp" : "waterwisp", {...actor, scale: .5, opacity: .72}, {...target, scale: 1.35, opacity: .14}, 560, {fade: "both"}),
      showEffectStep(key === "scald" ? "wisp" : "impact", {...target, scale: .55, opacity: .52}, {...target, scale: 2.1, opacity: 0}, 420, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, 8), z: behind(target, 18)}, 160, "swing"),
    ];
  }
  if (key === "waterspout" || key === "muddywater") {
    const color = key === "muddywater" ? "#8b7650" : "#3d9dff";
    return [
      {type: "backgroundEffect", color, durationMs: 780, opacity: .3},
      showEffectStep(key === "muddywater" ? "mudwisp" : "waterwisp", {...actor, x: actor.x - 22, y: actor.y + 30, scale: 1.2, opacity: .5}, {...target, x: target.x - 34, y: target.y + 16, scale: 2.4, opacity: .12}, 620, {fade: "both"}),
      showEffectStep(key === "muddywater" ? "mudwisp" : "waterwisp", {...actor, x: actor.x + 24, y: actor.y + 34, scale: 1.1, opacity: .45}, {...target, x: target.x + 34, y: target.y + 10, scale: 2.2, opacity: .1}, 720, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 22), y: target.y - 6}, 180, "swing"),
    ];
  }
  if (key === "bubblebeam") {
    return [
      {type: "backgroundEffect", color: "#9de7ff", durationMs: 560, opacity: .18},
      showEffectStep("waterwisp", {...actor, x: actor.x - 14, scale: .42, opacity: .55}, {...target, x: target.x + 18, scale: 1.2, opacity: .12}, 420, {fade: "both"}),
      showEffectStep("waterwisp", {...actor, x: actor.x + 14, scale: .38, opacity: .48}, {...target, x: target.x - 18, scale: 1.2, opacity: .12}, 520, {fade: "both"}),
      showEffectStep("waterwisp", target, {...target, scale: 1.8, opacity: 0}, 360, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, 8)}, 160, "swing"),
    ];
  }
  return [
    {type: "backgroundEffect", color: "#3d9dff", durationMs: 560, opacity: .2},
    showEffectStep("waterwisp", {...actor, scale: .5, opacity: .75}, {...target, scale: 1.35, opacity: .16}, 560, {fade: "both"}),
    showEffectStep("waterwisp", target, {...target, scale: 2.1, opacity: 0}, 420, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 18)}, 180, "swing"),
  ];
}

function nativeIceStormSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "icywind" || key === "freezingglare") {
    return [
      {type: "backgroundEffect", color: "#d8f6ff", durationMs: 700, opacity: .26},
      showEffectStep("iceball", {...actor, scale: .5, opacity: .62}, {...target, scale: 1.5, opacity: .08}, 620, {fade: "both"}),
      showEffectStep("wisp", {...target, x: target.x - 54, y: target.y + 50, scale: .55, opacity: .38}, {...target, x: target.x + 24, y: target.y - 34, scale: 2, opacity: 0}, 700, {fade: "both"}),
      actorAnimStep(target, {scale: .94, opacity: .86, x: leftOf(target, 10)}, 190, "swing"),
      actorAnimStep(target, {scale: 1, opacity: 1, x: target.x}, 180, "swing"),
    ];
  }
  if (key === "sheercold" || key === "glaciallance" || key === "iciclecrash") {
    return [
      {type: "backgroundEffect", color: "#d8f6ff", durationMs: 820, opacity: .34},
      showEffectStep("icicle", {...target, x: target.x - 32, y: target.y + 110, opacity: .86}, {...target, x: target.x - 8, y: target.y + 6, opacity: .08, scale: 1.1}, 580, {fade: "both"}),
      showEffectStep("icicle", {...target, x: target.x + 30, y: target.y + 104, opacity: .78}, {...target, x: target.x + 8, y: target.y + 4, opacity: .08, scale: 1.1}, 660, {fade: "both"}),
      showEffectStep("iceball", {...actor, scale: .55, opacity: .58}, {...target, scale: 1.5, opacity: .08}, 620, {fade: "both"}),
      actorAnimStep(target, {scale: .92, opacity: .82, z: behind(target, 22)}, 190, "swing"),
      actorAnimStep(target, {scale: 1, opacity: 1, z: target.z}, 180, "swing"),
    ];
  }
  return [
    {type: "backgroundEffect", color: "#d8f6ff", durationMs: key === "blizzard" ? 860 : 620, opacity: key === "blizzard" ? .34 : .24},
    showEffectStep("iceball", {...actor, scale: .7, opacity: .55}, {...target, scale: 1.8, opacity: .08}, 620, {fade: "both"}),
    showEffectStep("icicle", {...target, x: target.x - 36, y: target.y + 92, opacity: .8}, {...target, x: target.x - 12, y: target.y + 6, opacity: .08, scale: .9}, 520, {fade: "both"}),
    showEffectStep("icicle", {...target, x: target.x + 34, y: target.y + 82, opacity: .72}, {...target, x: target.x + 10, y: target.y + 4, opacity: .08, scale: .9}, 620, {fade: "both"}),
    actorAnimStep(target, {scale: .94, opacity: .86}, 190, "swing"),
    actorAnimStep(target, {scale: 1, opacity: 1}, 180, "swing"),
  ];
}

function nativeClawSlashSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "firelash") {
    return [
      {type: "backgroundEffect", color: "#ff652f", durationMs: 620, opacity: .24},
      showEffectStep("fireball", {...actor, scale: .5, opacity: .7}, {...target, scale: 1.35, opacity: .1}, 420, {fade: "both"}),
      showEffectStep("rightslash", {...target, x: target.x - 10, y: target.y + 18}, {...target, scale: 2.7, opacity: 0}, 380, {fade: "both"}),
      showEffectStep("fireball", target, {...target, y: target.y - 18, scale: 1.8, opacity: 0}, 420, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 18)}, 180, "swing"),
    ];
  }
  if (key === "stoneaxe") {
    return [
      {type: "backgroundEffect", color: "#8c7255", durationMs: 520, opacity: .22},
      showEffectStep("rocks", {...target, y: target.y + 70, opacity: .6}, {...target, y: target.y + 8, scale: 1.7, opacity: .08}, 520, {fade: "both"}),
      showEffectStep("leftslash", {...target, x: target.x + 12, y: target.y + 20}, {...target, scale: 2.8, opacity: 0}, 380, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, 10), z: behind(target, 20)}, 180, "swing"),
    ];
  }
  if (key === "leafblade") {
    return [
      {type: "backgroundEffect", color: "#69d879", durationMs: 520, opacity: .18},
      showEffectStep("leaf1", {...actor, scale: .8, opacity: .72}, {...target, scale: 1.4, opacity: .16}, 440, {fade: "both"}),
      showEffectStep("rightslash", {...target, x: target.x - 8, y: target.y + 18}, {...target, scale: 2.8, opacity: 0}, 380, {fade: "both"}),
      showEffectStep("leaf2", target, {...target, y: target.y - 22, opacity: 0}, 420, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 18)}, 180, "swing"),
    ];
  }
  if (key === "nightslash") return darkSlashSteps(actor, target, "rightslash");
  if (key === "shadowclaw") return [{type: "backgroundEffect", color: "#000000", durationMs: 700, opacity: .3}, ...stepsForOtherAnimation("clawattack", actor, target)];
  if (key === "direclaw") return [
    {type: "backgroundEffect", color: "#8c40c8", durationMs: 560, opacity: .22},
    showEffectStep("poisonwisp", {...actor, scale: .5, opacity: .58}, {...target, scale: 1.3, opacity: .08}, 420, {fade: "both"}),
    ...stepsForOtherAnimation("clawattack", actor, target),
  ];
  return /claw/.test(key) ? stepsForOtherAnimation("clawattack", actor, target) : stepsForOtherAnimation("slashattack", actor, target);
}

function nativeFangSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const elemental = key === "firefang" ? "fireball" : key === "icefang" ? "iceball" : key === "thunderfang" ? "electroball" : key === "psychicfangs" ? "mistball" : "";
  const color = key === "firefang" ? "#ff652f" : key === "icefang" ? "#d8f6ff" : key === "thunderfang" ? "#ffe35a" : key === "psychicfangs" ? "#aa44ff" : "#000000";
  return [
    {type: "backgroundEffect", color, durationMs: 560, opacity: .22},
    ...(elemental ? [showEffectStep(elemental, {...actor, scale: .45, opacity: .62}, {...target, scale: 1.25, opacity: .12}, 360, {fade: "both"})] : []),
    showEffectStep("topbite", {...target, y: target.y + 70, scale: .65, opacity: 0}, {...target, y: target.y + 20, opacity: 1}, 320, {fade: "in"}),
    showEffectStep("bottombite", {...target, y: target.y - 70, scale: .65, opacity: 0}, {...target, y: target.y - 20, opacity: 1}, 320, {fade: "in"}),
    actorAnimStep(target, {x: leftOf(target, 10), z: behind(target, 16)}, 170, "swing"),
  ];
}

function nativePunchKickSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const isKick = /kick|tropkick/.test(key);
  const sprite = key.includes("ice") ? "iceball" : key.includes("thunder") ? "electroball" : key.includes("shadow") || key.includes("sucker") ? "shadowball" : key.includes("drain") ? "wisp" : key.includes("blaze") ? "fireball" : "";
  const color = key.includes("ice") ? "#d8f6ff" : key.includes("thunder") ? "#ffe35a" : key.includes("shadow") || key.includes("sucker") ? "#22002f" : key.includes("drain") ? "#69d879" : key.includes("blaze") ? "#ff652f" : "#f4d28a";
  const steps: ShowdownAnimationStepV4[] = [
    {type: "backgroundEffect", color, durationMs: /focus|dynamic|closecombat|highjump/.test(key) ? 700 : 480, opacity: /focus|dynamic|closecombat/.test(key) ? .28 : .18},
  ];
  if (sprite) steps.push(showEffectStep(sprite, {...actor, scale: .45, opacity: .62}, {...target, scale: 1.25, opacity: .12}, 360, {fade: "both"}));
  if (key === "closecombat" || key === "dynamicpunch" || key === "cometpunch") {
    steps.push(actorAnimStep(actor, {x: target.x, y: target.y + 10, z: behind(target, -20)}, 230, "accel"));
    steps.push(showEffectStep("fist", {...target, x: target.x - 18, y: target.y + 8}, {...target, scale: 1.8, opacity: 0}, 220, {fade: "both"}));
    steps.push(showEffectStep("fist1", {...target, x: target.x + 18, y: target.y - 8}, {...target, scale: 1.8, opacity: 0}, 260, {fade: "both"}));
    steps.push(actorAnimStep(target, {x: leftOf(target, 12), z: behind(target, 22)}, 160, "swing"));
    return steps;
  }
  steps.push(...stepsForOtherAnimation(isKick ? "kick" : "punchattack", actor, target));
  if (key.includes("drain")) steps.push(showEffectStep("wisp", {...target, scale: .8, opacity: .55}, {...actor, scale: 1.4, opacity: 0}, 540, {fade: "both"}));
  return steps;
}

function nativeUtilityStatusSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "featherdance") {
    return [
      {type: "backgroundEffect", color: "#d8f3ff", durationMs: 680, opacity: .18},
      showEffectStep("feather", {...actor, x: actor.x - 32, y: actor.y - 26, opacity: .72}, {...target, x: target.x + 18, y: target.y - 20, scale: 1.6, opacity: 0}, 620, {fade: "both", easing: "ballistic2"}),
      showEffectStep("feather", {...actor, x: actor.x + 22, y: actor.y - 18, opacity: .64}, {...target, x: target.x - 24, y: target.y - 12, scale: 1.5, opacity: 0}, 700, {fade: "both", easing: "ballistic2back"}),
      {type: "resultAnim", actor: target, text: "", tone: "bad"},
      actorAnimStep(target, {scale: .96, y: target.y + 5}, 190, "swing"),
    ];
  }
  if (key === "smokescreen" || key === "healblock") {
    const smoke = key === "smokescreen";
    return [
      {type: "backgroundEffect", color: smoke ? "#24212a" : "#7b2bb8", durationMs: 680, opacity: smoke ? .32 : .24},
      showEffectStep(smoke ? "blackwisp" : "mistball", {...actor, scale: .55, opacity: .56}, {...target, scale: 2.25, opacity: 0}, 660, {fade: "both"}),
      showEffectStep("wisp", {...target, scale: .7, opacity: .36}, {...target, scale: 2.6, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(target, {opacity: smoke ? .76 : .9, scale: .96}, 220, "swing"),
    ];
  }
  if (key === "forestscurse") {
    return [
      {type: "backgroundEffect", color: "#174b25", durationMs: 720, opacity: .28},
      showEffectStep("leaf1", {...target, x: target.x - 42, y: target.y + 58, opacity: .72}, {...target, x: target.x - 8, y: target.y - 20, scale: 1.8, opacity: 0}, 680, {fade: "both"}),
      showEffectStep("leaf2", {...target, x: target.x + 38, y: target.y + 58, opacity: .66}, {...target, x: target.x + 6, y: target.y - 24, scale: 1.8, opacity: 0}, 760, {fade: "both"}),
      showEffectStep("blackwisp", {...target, scale: .5, opacity: .38}, {...target, scale: 2.1, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(target, {scale: .97}, 180, "swing"),
    ];
  }
  if (key === "aquaring") {
    return [
      {type: "backgroundEffect", color: "#3d9dff", durationMs: 680, opacity: .2},
      showEffectStep("waterwisp", {...actor, x: actor.x - 34, y: actor.y + 38, scale: .7, opacity: .58}, {...actor, x: actor.x + 34, y: actor.y - 12, scale: 1.8, opacity: 0}, 620, {fade: "both", easing: "ballistic2"}),
      showEffectStep("waterwisp", {...actor, x: actor.x + 34, y: actor.y + 38, scale: .7, opacity: .52}, {...actor, x: actor.x - 34, y: actor.y - 12, scale: 1.8, opacity: 0}, 720, {fade: "both", easing: "ballistic2back"}),
      showEffectStep("shine", {...actor, scale: 1.4, opacity: .25}, {...actor, scale: 2.3, opacity: 0}, 560, {fade: "both"}),
      actorAnimStep(actor, {scale: 1.06}, 190, "decel"),
    ];
  }
  if (key === "worryseed") {
    return [
      {type: "backgroundEffect", color: "#69d879", durationMs: 620, opacity: .18},
      showEffectStep("energyball", {...actor, scale: .36, opacity: .72}, {...target, scale: 1.05, opacity: .16}, 500, {fade: "both"}),
      showEffectStep("leaf1", {...target, x: target.x - 24, y: target.y + 24, opacity: .62}, {...target, x: target.x + 12, y: target.y - 28, scale: 1.5, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(target, {scale: .96, x: leftOf(target, 8)}, 180, "swing"),
    ];
  }
  if (key === "fairylock") {
    return [
      {type: "backgroundEffect", color: "#ffc7f5", durationMs: 680, opacity: .22},
      showEffectStep("rainbow", {...target, scale: 1.7, opacity: .22}, {...target, scale: 2.7, opacity: 0}, 680, {fade: "both"}),
      showEffectStep("shine", {...target, x: target.x - 34, y: target.y + 24, opacity: .6}, {...target, x: target.x + 18, y: target.y - 28, opacity: 0}, 620, {fade: "both"}),
      showEffectStep("shine", {...target, x: target.x + 34, y: target.y + 24, opacity: .55}, {...target, x: target.x - 18, y: target.y - 28, opacity: 0}, 700, {fade: "both"}),
      actorAnimStep(target, {scale: .98}, 180, "swing"),
    ];
  }
  return [
    {type: "backgroundEffect", color: "#ffd6f4", durationMs: 520, opacity: .16},
    showEffectStep("wisp", {...actor, scale: .45, opacity: .5}, {...target, scale: 1.6, opacity: 0}, 560, {fade: "both"}),
    showEffectStep("shine", {...target, scale: .8, opacity: .5}, {...target, scale: 2.1, opacity: 0}, 520, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 8)}, 150, "swing"),
  ];
}

function nativeP2HealingSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "healpulse") {
    return [
      {type: "backgroundEffect", color: "#8dffb0", durationMs: 680, opacity: .2},
      showEffectStep("wisp", {...actor, scale: .45, opacity: .62}, {...target, scale: 1.55, opacity: .08}, 620, {fade: "both"}),
      showEffectStep("shine", {...target, y: target.y + 36, scale: 1.2, opacity: .28}, {...target, y: target.y - 26, scale: 2.1, opacity: 0}, 640, {fade: "both"}),
      actorAnimStep(target, {scale: 1.06}, 180, "decel"),
      {type: "healAnim", actor: target, heal: null},
    ];
  }
  const actorOnly = key === "junglehealing" || key === "healbell" || key === "healingwish";
  const color = key === "junglehealing" ? "#69d879" : key === "healingwish" ? "#ffc7f5" : "#d8fff0";
  const sprite = key === "junglehealing" ? "leaf1" : key === "healbell" ? "sound" : "shine";
  return [
    {type: "backgroundEffect", color, durationMs: key === "healingwish" ? 820 : 680, opacity: .24},
    showEffectStep(sprite, {...actor, y: actor.y + 34, scale: 1.1, opacity: .42}, {...actor, y: actor.y - 34, scale: 2.2, opacity: 0}, 700, {fade: "both"}),
    showEffectStep("wisp", {...actor, x: actor.x - 24, y: actor.y + 20, scale: .5, opacity: .55}, {...actor, x: actor.x + 16, y: actor.y - 46, scale: 1.4, opacity: 0}, 640, {fade: "both"}),
    showEffectStep("wisp", {...actor, x: actor.x + 24, y: actor.y + 20, scale: .5, opacity: .48}, {...actor, x: actor.x - 16, y: actor.y - 46, scale: 1.4, opacity: 0}, 720, {fade: "both"}),
    actorAnimStep(actor, {scale: actorOnly ? 1.08 : 1.04, y: actor.y - 6}, 200, "decel"),
    {type: "healAnim", actor, heal: null},
  ];
}

function nativePainSplitSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#aa44ff", durationMs: 720, opacity: .26},
    showEffectStep("wisp", {...actor, scale: .45, opacity: .58}, {...target, scale: 1.35, opacity: .12}, 560, {fade: "both"}),
    showEffectStep("wisp", {...target, scale: .45, opacity: .54}, {...actor, scale: 1.35, opacity: .12}, 640, {fade: "both"}),
    showEffectStep("mistball", {...actor, scale: .9, opacity: .2}, {...target, scale: 1.8, opacity: 0}, 700, {fade: "both"}),
    actorAnimStep(actor, {scale: 1.04, y: actor.y - 4}, 180, "decel"),
    actorAnimStep(target, {scale: .97, y: target.y + 4}, 180, "swing"),
  ];
}

function nativeDiveDigSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const water = key === "dive";
  const sprite = water ? "waterwisp" : "mudwisp";
  const color = water ? "#3d9dff" : "#8c7255";
  return [
    {type: "backgroundEffect", color, durationMs: 720, opacity: .26},
    actorAnimStep(actor, {opacity: .28, y: actor.y + 22, z: behind(actor, 40)}, 220, "decel"),
    showEffectStep(sprite, {...actor, y: actor.y + 36, scale: .65, opacity: .58}, {...target, y: target.y + 22, scale: 1.6, opacity: .08}, 620, {fade: "both"}),
    actorAnimStep(actor, {x: target.x, y: target.y + 16, z: behind(target, -24), opacity: 1}, 240, "accel"),
    showEffectStep("impact", target, {...target, scale: 2.1, opacity: 0}, 320, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 22), x: leftOf(target, 10)}, 180, "swing"),
  ];
}

function nativeTailwindSteps(actor: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#bfefff", durationMs: 760, opacity: .22},
    showEffectStep("wisp", {...actor, x: actor.x - 80, y: actor.y + 44, scale: .7, opacity: .42}, {...actor, x: actor.x + 82, y: actor.y - 18, scale: 2.2, opacity: 0}, 700, {fade: "both"}),
    showEffectStep("feather", {...actor, x: actor.x - 58, y: actor.y + 10, opacity: .68}, {...actor, x: actor.x + 70, y: actor.y - 52, scale: 1.4, opacity: 0}, 760, {fade: "both"}),
    actorAnimStep(actor, {y: actor.y - 8, scale: 1.05}, 190, "decel"),
  ];
}

function nativeSubstituteSteps(actor: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#8dffb0", durationMs: 620, opacity: .18},
    showEffectStep("pokeball", {...actor, y: actor.y - 8, scale: .55, opacity: .75}, {...actor, y: actor.y + 12, scale: 1.25, opacity: 0}, 420, {fade: "both"}),
    showEffectStep("shine", {...actor, scale: .8, opacity: .65}, {...actor, scale: 2.6, opacity: 0}, 560, {fade: "both", explode: true}),
    actorAnimStep(actor, {opacity: .55, scale: .88}, 180, "decel"),
    actorAnimStep(actor, {opacity: 1, scale: 1}, 180, "swing"),
  ];
}

function nativeFieldHazardSetupSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const toxic = key === "toxicspikes";
  const web = key === "stickyweb";
  const sprite = web ? "web" : toxic ? "poisoncaltrop" : "caltrop";
  const color = web ? "#f4f7ff" : toxic ? "#8c40c8" : "#8c7255";
  return [
    {type: "backgroundEffect", color, durationMs: 620, opacity: .2},
    showEffectStep(sprite, {...target, x: target.x - 58, y: target.y + 96, scale: .48, opacity: .78}, {...target, x: target.x - 42, y: target.y + 34, scale: web ? 1.25 : .96, opacity: .42}, 580, {fade: "both"}),
    showEffectStep(sprite, {...target, x: target.x + 48, y: target.y + 100, scale: .48, opacity: .72}, {...target, x: target.x + 32, y: target.y + 36, scale: web ? 1.22 : .94, opacity: .38}, 680, {fade: "both"}),
    showEffectStep(web ? "wisp" : "rocks", {...target, y: target.y + 92, opacity: .34}, {...target, y: target.y + 24, scale: 1.6, opacity: 0}, 680, {fade: "both"}),
    actorAnimStep(actor, {scale: 1.04}, 170, "decel"),
  ];
}

function nativeWeatherTerrainPulseSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const weather = key === "weatherball";
  const color = weather ? "#d8f6ff" : "#68d878";
  const primary = weather ? "shine" : "wisp";
  return [
    {type: "backgroundEffect", color, durationMs: 620, opacity: .22},
    showEffectStep(primary, {...actor, scale: .42, opacity: .72}, {...target, scale: 1.45, opacity: .12}, 560, {fade: "both"}),
    showEffectStep(weather ? "waterwisp" : "leaf1", {...actor, x: actor.x + 16, scale: .35, opacity: .48}, {...target, x: target.x - 18, scale: 1.2, opacity: 0}, 640, {fade: "both"}),
    showEffectStep("impact", target, {...target, scale: 1.9, opacity: 0}, 300, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 18)}, 170, "swing"),
  ];
}

function nativeRevelationDanceSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#ffcf5a", durationMs: 760, opacity: .26},
    showEffectStep("rainbow", {...actor, scale: 1.2, opacity: .38}, {...actor, scale: 2.4, opacity: 0}, 520, {fade: "both"}),
    actorAnimStep(actor, {x: leftOf(actor, 14), scale: 1.08}, 160, "swing"),
    actorAnimStep(actor, {x: leftOf(actor, -14), scale: 1.08}, 160, "swing"),
    showEffectStep("shine", {...actor, scale: .45, opacity: .72}, {...target, scale: 1.45, opacity: .1}, 560, {fade: "both"}),
    showEffectStep("impact", target, {...target, scale: 2, opacity: 0}, 300, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 10), z: behind(target, 18)}, 170, "swing"),
  ];
}

function nativeEnvironmentMoveSteps(actor: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const base = key === "raindance" ? weatherSteps(actor, key)
    : key.endsWith("terrain") ? terrainSteps(actor, key)
    : roomSteps(actor, key === "gravity" ? "#413760" : "#6b4aa8", key);
  const accent = key === "raindance" ? "waterwisp"
    : key.includes("electric") ? "electroball"
    : key.includes("grassy") ? "leaf1"
    : key.includes("misty") ? "mistball"
    : key === "gravity" ? "weather-gravity"
    : "wisp";
  return [
    ...base,
    showEffectStep(accent, {...actor, y: actor.y + 54, scale: 1.4, opacity: .32}, {...actor, y: actor.y - 8, scale: 2.8, opacity: 0}, 700, {fade: "both"}),
    actorAnimStep(actor, {scale: 1.04, y: actor.y - 4}, 180, "decel"),
  ];
}

function nativeBoostDanceSteps(actor: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "shellsmash") {
    return [
      {type: "backgroundEffect", color: "#f4d28a", durationMs: 700, opacity: .24},
      showEffectStep("rocks", {...actor, y: actor.y + 52, scale: 1.4, opacity: .52}, {...actor, y: actor.y - 10, scale: 2.1, opacity: 0}, 580, {fade: "both"}),
      showEffectStep("impact", {...actor, scale: .6, opacity: .65}, {...actor, scale: 2.5, opacity: 0}, 420, {fade: "both", explode: true}),
      actorAnimStep(actor, {scale: 1.16, y: actor.y - 8}, 220, "decel"),
    ];
  }
  if (key === "rockpolish") {
    return [
      {type: "backgroundEffect", color: "#d9f3ff", durationMs: 560, opacity: .16},
      showEffectStep("shine", {...actor, x: actor.x - 28, y: actor.y + 24, opacity: .6}, {...actor, x: actor.x + 24, y: actor.y - 30, opacity: 0}, 540, {fade: "both"}),
      showEffectStep("shine", {...actor, x: actor.x + 28, y: actor.y + 24, opacity: .54}, {...actor, x: actor.x - 24, y: actor.y - 30, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(actor, {scale: 1.08}, 180, "decel"),
    ];
  }
  const color = key === "dragondance" ? "#7c4dff" : key === "quiverdance" ? "#ffc7f5" : key === "victorydance" ? "#ffcf5a" : key === "calmmind" ? "#aa44ff" : key === "nastyplot" ? "#22002f" : "#f4d28a";
  const sprite = key === "dragondance" || key === "victorydance" ? "rainbow" : key === "quiverdance" ? "feather" : key === "calmmind" || key === "nastyplot" ? "mistball" : "shine";
  return [
    {type: "backgroundEffect", color, durationMs: 680, opacity: key === "nastyplot" ? .3 : .22},
    showEffectStep(sprite, {...actor, scale: 1.6, opacity: .24}, {...actor, scale: .55, opacity: .72}, 360, {fade: "both"}),
    showEffectStep("shine", {...actor, x: actor.x - 30, y: actor.y + 28, opacity: .56}, {...actor, x: actor.x + 16, y: actor.y - 44, scale: 1.3, opacity: 0}, 620, {fade: "both"}),
    showEffectStep("shine", {...actor, x: actor.x + 30, y: actor.y + 28, opacity: .48}, {...actor, x: actor.x - 16, y: actor.y - 44, scale: 1.3, opacity: 0}, 700, {fade: "both"}),
    actorAnimStep(actor, {x: leftOf(actor, 12), y: actor.y - 6, scale: 1.1}, 180, "swing"),
    actorAnimStep(actor, {x: leftOf(actor, -10), y: actor.y - 4, scale: 1.08}, 180, "swing"),
    actorAnimStep(actor, {x: actor.x, y: actor.y, scale: 1}, 180, "swing"),
  ];
}

function nativeShieldGuardSteps(actor: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const color = key === "burningbulwark" ? "#ff652f"
    : key === "kingsshield" ? "#ffd45a"
    : key === "spikyshield" ? "#69d879"
    : key === "craftyshield" ? "#ffc7f5"
    : key === "lightscreen" ? "#aaecff"
    : key === "reflect" ? "#ffb0dc"
    : "#d8fff0";
  const sprite = key === "burningbulwark" ? "fireball"
    : key === "kingsshield" ? "sword"
    : key === "spikyshield" ? "caltrop"
    : key === "craftyshield" ? "rainbow"
    : "shine";
  return [
    {type: "backgroundEffect", color, durationMs: 620, opacity: .24},
    showEffectStep("shine", {...actor, y: actor.y + 36, scale: 2.2, opacity: .24}, {...actor, y: actor.y - 14, scale: 3.2, opacity: 0}, 620, {fade: "both"}),
    showEffectStep(sprite, {...actor, x: actor.x - 34, y: actor.y + 28, scale: .65, opacity: .72}, {...actor, x: actor.x - 6, y: actor.y - 18, scale: 1.45, opacity: 0}, 560, {fade: "both"}),
    showEffectStep(sprite, {...actor, x: actor.x + 34, y: actor.y + 28, scale: .65, opacity: .64}, {...actor, x: actor.x + 6, y: actor.y - 18, scale: 1.45, opacity: 0}, 640, {fade: "both"}),
    actorAnimStep(actor, {scale: 1.05}, 180, "decel"),
  ];
}

function nativeSpecialWeaponSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "hiddenpower") {
    return [
      {type: "backgroundEffect", color: "#f4f7ff", durationMs: 620, opacity: .22},
      showEffectStep("shine", {...actor, scale: 1.8, opacity: .22}, {...actor, scale: .45, opacity: .82}, 300, {fade: "both"}),
      showEffectStep("wisp", {...actor, scale: .38, opacity: .7}, {...target, scale: 1.25, opacity: .12}, 520, {fade: "both"}),
      showEffectStep("shine", {...target, scale: .65, opacity: .58}, {...target, scale: 2.2, opacity: 0}, 480, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 18)}, 180, "swing"),
    ];
  }
  if (key === "hyperbeam") {
    return [
      {type: "backgroundEffect", color: "#fff0aa", durationMs: 840, opacity: .34},
      showEffectStep("shine", {...actor, scale: 2.2, opacity: .22}, {...actor, scale: .55, opacity: .85}, 320, {fade: "both"}),
      showEffectStep("hyperbeam", {...actor, scale: .6, opacity: .82}, {...target, scale: 1.65, opacity: .12}, 720, {fade: "both"}),
      showEffectStep("impact", {...target, scale: .6, opacity: .8}, {...target, scale: 2.8, opacity: 0}, 420, {fade: "both", explode: true}),
      actorAnimStep(target, {z: behind(target, 28), x: leftOf(target, 12)}, 190, "swing"),
    ];
  }
  if (key === "gigaimpact") {
    return [
      {type: "backgroundEffect", color: "#f4d28a", durationMs: 820, opacity: .3},
      showEffectStep("impact", {...actor, scale: 1.7, opacity: .24}, {...actor, scale: 2.6, opacity: 0}, 300, {fade: "both"}),
      actorAnimStep(actor, {x: target.x, y: target.y + 10, z: behind(target, -28), scale: 1.18}, 280, "accel"),
      showEffectStep("impact", {...target, scale: .6, opacity: .86}, {...target, scale: 3, opacity: 0}, 440, {fade: "both", explode: true}),
      showEffectStep("shine", {...target, scale: .8, opacity: .58}, {...target, scale: 2.5, opacity: 0}, 420, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, 16), z: behind(target, 30)}, 180, "swing"),
    ];
  }
  if (/beam|cannon|purge|mistball|psystrike|psyshock|mysticalpower|judgment|lightofruin|roaroftime|dracometeor|dragonenergy|meteorbeam/.test(key)) {
    const dragon = /dragon|draco|roaroftime/.test(key);
    const psychic = /psy|mist|luster|mystical/.test(key);
    const steel = /flashcannon/.test(key);
    const rock = /meteorbeam/.test(key);
    const sprite = dragon ? "shadowball" : psychic ? "mistball" : steel ? "impact" : rock ? "rocks" : /charge/.test(key) ? "electroball" : "shine";
    const color = dragon ? "#5f44aa" : psychic ? "#aa44ff" : steel ? "#d9f3ff" : rock ? "#8c7255" : /charge/.test(key) ? "#ffe35a" : "#f4f7ff";
    return [
      {type: "backgroundEffect", color, durationMs: /draco|roaroftime|lightofruin/.test(key) ? 820 : 620, opacity: /draco|roaroftime/.test(key) ? .36 : .24},
      showEffectStep(sprite, {...actor, scale: .45, opacity: .74}, {...target, scale: 1.45, opacity: .12}, 560, {fade: "both"}),
      showEffectStep(dragon ? "wisp" : "impact", {...target, scale: .55, opacity: .6}, {...target, scale: dragon ? 2.5 : 2, opacity: 0}, 420, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 20), x: leftOf(target, 8)}, 170, "swing"),
    ];
  }
  if (key === "technoblast") {
    return beamSteps(actor, target, "shine", "#f4f7ff");
  }
  if (key.startsWith("ivycudgel")) {
    const sprite = key.includes("water") ? "waterwisp" : key.includes("fire") ? "fireball" : "rocks";
    const color = key.includes("water") ? "#3d9dff" : key.includes("fire") ? "#ff652f" : "#8c7255";
    return [
      {type: "backgroundEffect", color, durationMs: 620, opacity: .24},
      showEffectStep(sprite, {...actor, scale: .48, opacity: .68}, {...target, scale: 1.3, opacity: .12}, 440, {fade: "both"}),
      actorAnimStep(actor, {x: target.x, y: target.y + 12, z: behind(target, -24), scale: 1.08}, 250, "accel"),
      showEffectStep("impact", {...target, scale: .55, opacity: .78}, {...target, scale: 2.2, opacity: 0}, 320, {fade: "both"}),
      actorAnimStep(target, {x: leftOf(target, 12), z: behind(target, 22)}, 170, "swing"),
    ];
  }
  if (key === "dizzypunch") {
    return [
      ...nativePunchKickSteps(actor, target, key),
      showEffectStep("wisp", {...target, x: target.x - 26, y: target.y - 16, scale: .4, opacity: .5}, {...target, x: target.x + 24, y: target.y - 42, scale: 1.2, opacity: 0}, 540, {fade: "both"}),
      showEffectStep("wisp", {...target, x: target.x + 26, y: target.y - 12, scale: .4, opacity: .45}, {...target, x: target.x - 22, y: target.y - 38, scale: 1.2, opacity: 0}, 620, {fade: "both"}),
    ];
  }
  if (key === "psychocut") {
    return [
      {type: "backgroundEffect", color: "#aa44ff", durationMs: 560, opacity: .24},
      showEffectStep("mistball", {...actor, scale: .38, opacity: .56}, {...target, scale: 1.3, opacity: .1}, 420, {fade: "both"}),
      showEffectStep("rightslash", {...target, x: target.x - 20, y: target.y + 20, opacity: .72}, {...target, x: target.x + 16, y: target.y - 18, scale: 2.4, opacity: 0}, 440, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 20)}, 180, "swing"),
    ];
  }
  if (key === "brutalswing") {
    return [
      {type: "backgroundEffect", color: "#22002f", durationMs: 680, opacity: .3},
      showEffectStep("blackwisp", {...actor, scale: 1.1, opacity: .3}, {...target, scale: 1.8, opacity: .06}, 520, {fade: "both"}),
      ...stepsForOtherAnimation("spinattack", actor, target),
    ];
  }
  if (key === "firespin") {
    return [
      {type: "backgroundEffect", color: "#ff652f", durationMs: 760, opacity: .3},
      showEffectStep("fireball", {...target, x: target.x - 48, y: target.y + 52, scale: .65, opacity: .62}, {...target, x: target.x + 26, y: target.y - 18, scale: 1.9, opacity: 0}, 680, {fade: "both", easing: "ballistic2"}),
      showEffectStep("fireball", {...target, x: target.x + 48, y: target.y + 52, scale: .65, opacity: .56}, {...target, x: target.x - 26, y: target.y - 18, scale: 1.9, opacity: 0}, 760, {fade: "both", easing: "ballistic2back"}),
      actorAnimStep(target, {scale: .96, z: behind(target, 20)}, 180, "swing"),
    ];
  }
  if (key === "leaftornado") {
    return [
      {type: "backgroundEffect", color: "#69d879", durationMs: 760, opacity: .24},
      showEffectStep("leaf1", {...target, x: target.x - 58, y: target.y + 78, scale: .7, opacity: .7}, {...target, x: target.x + 22, y: target.y - 40, scale: 1.8, opacity: 0}, 720, {fade: "both", easing: "ballistic2"}),
      showEffectStep("leaf2", {...target, x: target.x + 54, y: target.y + 72, scale: .7, opacity: .62}, {...target, x: target.x - 22, y: target.y - 34, scale: 1.8, opacity: 0}, 760, {fade: "both", easing: "ballistic2back"}),
      actorAnimStep(target, {y: target.y - 12, x: leftOf(target, 10), z: behind(target, 22)}, 180, "swing"),
      actorAnimStep(target, {y: target.y, x: target.x, z: target.z}, 180, "swing"),
    ];
  }
  return projectileSteps(actor, target, effectSpriteIdForMove(key), "#f4f7ff");
}

function nativeZMoveSparkSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const surf = key === "stokedsparksurfer";
  return [
    {type: "backgroundEffect", color: surf ? "#3d9dff" : "#05070d", durationMs: 980, opacity: surf ? .42 : .55},
    showEffectStep("z-symbol", {...actor, scale: .75, opacity: .86}, {...actor, scale: 2.4, opacity: 0}, 560, {fade: "both"}),
    showEffectStep(surf ? "waterwisp" : "electroball", {...actor, scale: .55, opacity: .78}, {...target, scale: 1.7, opacity: .12}, 660, {fade: "both"}),
    showEffectStep("lightning", {...target, y: target.y + 170, yscale: 0, xscale: 2.4, opacity: .9}, {...target, y: target.y + 34, yscale: 1.35, xscale: 1.4, opacity: .7}, 360, {fade: "both"}),
    showEffectStep("electroball", {...target, scale: .42, opacity: .62}, {...target, scale: 3.2, opacity: 0}, 620, {fade: "both", explode: true}),
    actorAnimStep(target, {x: leftOf(target, -14), z: behind(target, 26)}, 100, "swing"),
    actorAnimStep(target, {x: leftOf(target, 14)}, 100, "swing"),
    actorAnimStep(target, {x: target.x, z: target.z}, 140, "swing"),
  ];
}

function nativeFastStrikeSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const sprite = key === "aquajet" || key === "jetpunch" || key === "aquastep" ? "waterwisp" : key === "iceshard" ? "iceball" : key === "shadowsneak" ? "shadowball" : "rocks";
  const color = key === "shadowsneak" ? "#160021" : key === "iceshard" ? "#d8f6ff" : key === "accelerock" ? "#8c7255" : "#3d9dff";
  const chargeY = key === "aquastep" ? actor.y - 10 : actor.y;
  return [
    {type: "backgroundEffect", color, durationMs: 480, opacity: .2},
    showEffectStep(sprite, {...actor, x: actor.x - 18, y: chargeY, scale: .45, opacity: .55}, {...target, x: target.x + 16, y: target.y + 8, scale: 1.35, opacity: .1}, 360, {fade: "both", delayMs: 0}),
    actorAnimStep(actor, {x: target.x, y: target.y + 12, z: behind(target, -26), scale: key === "aquastep" ? 1.08 : 1}, 220, "accel"),
    showEffectStep(key === "accelerock" ? "rock1" : key === "iceshard" ? "icicle" : "impact", {...target, scale: .5, opacity: .72}, {...target, scale: 2, opacity: 0}, 260, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 12), z: behind(target, 18)}, 150, "swing"),
  ];
}

function nativeElementalContactSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const sprite = key === "spark" ? "electroball" : "fireball";
  const color = key === "spark" ? "#ffe35a" : "#ff652f";
  const impactSprite = key === "spark" ? "lightning" : key === "flareblitz" || key === "flamecharge" ? "flareball" : "fireball";
  return [
    {type: "backgroundEffect", color, durationMs: key === "flareblitz" ? 760 : 560, opacity: key === "flareblitz" ? .34 : .22},
    showEffectStep(sprite, {...actor, scale: .55, opacity: .58}, {...actor, scale: 2.1, opacity: 0}, 360, {fade: "both"}),
    actorAnimStep(actor, {x: target.x, y: target.y + 12, z: behind(target, -24), scale: key === "flareblitz" ? 1.14 : 1.06}, 260, "accel"),
    showEffectStep(impactSprite, {...target, scale: .55, opacity: .7}, {...target, scale: key === "flareblitz" ? 2.6 : 2, opacity: 0}, 420, {fade: "both"}),
    showEffectStep("impact", target, {...target, scale: 1.8, opacity: 0}, 260, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 14), z: behind(target, 22)}, 170, "swing"),
  ];
}

function nativeMultiHitPhysicalSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const ice = key === "iciclespear";
  const steel = key === "geargrind" || key === "spikecannon";
  const bug = key === "twineedle" || key === "megahorn";
  const sprite = ice ? "icicle" : steel ? "impact" : bug ? "poisoncaltrop" : /chop|swipe/.test(key) ? "rightslash" : "impact";
  const color = ice ? "#d8f6ff" : steel ? "#d9f3ff" : bug ? "#8ee66c" : "#f4d28a";
  return [
    {type: "backgroundEffect", color, durationMs: 680, opacity: .22},
    showEffectStep(sprite, {...actor, x: actor.x - 12, scale: .48, opacity: .72}, {...target, x: target.x + 18, scale: 1.25, opacity: .12}, 360, {fade: "both"}),
    showEffectStep(sprite, {...actor, x: actor.x + 14, scale: .44, opacity: .66}, {...target, x: target.x - 16, scale: 1.22, opacity: .12}, 440, {fade: "both", delayMs: 60}),
    showEffectStep(sprite, {...actor, scale: .42, opacity: .6}, {...target, scale: 1.25, opacity: .1}, 520, {fade: "both", delayMs: 80}),
    showEffectStep("impact", {...target, scale: .45, opacity: .64}, {...target, scale: 1.8, opacity: 0}, 280, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 10), z: behind(target, 18)}, 120, "swing"),
    actorAnimStep(target, {x: leftOf(target, -8), z: target.z}, 120, "swing"),
    actorAnimStep(target, {x: target.x}, 120, "swing"),
  ];
}

function nativeDarkContactSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const sneaky = key === "thief" || key === "feintattack";
  return [
    {type: "backgroundEffect", color: "#05000a", durationMs: 640, opacity: .32},
    ...(sneaky ? [actorAnimStep(actor, {opacity: .42, z: behind(actor, 42)}, 180, "decel")] : []),
    showEffectStep("blackwisp", {...actor, scale: .55, opacity: .5}, {...target, scale: 1.6, opacity: 0}, 520, {fade: "both"}),
    actorAnimStep(actor, {x: target.x, y: target.y + 10, z: behind(target, -24)}, 240, "accel"),
    showEffectStep("rightslash", {...target, x: target.x - 10, y: target.y + 12, opacity: .72}, {...target, scale: 2.5, opacity: 0}, 340, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 12), z: behind(target, 20)}, 170, "swing"),
  ];
}

function nativeThrownItemSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const coin = key === "payday";
  const gift = key === "present";
  const sprite = coin ? "shine" : gift ? "pokeball" : "impact";
  return [
    {type: "backgroundEffect", color: coin ? "#ffd45a" : gift ? "#ffc7f5" : "#f4d28a", durationMs: 540, opacity: .18},
    showEffectStep(sprite, {...actor, y: actor.y - 8, scale: .5, opacity: .78}, {...target, y: target.y + 6, scale: 1.15, opacity: .18}, 520, {fade: "both", easing: "ballistic2Under"}),
    showEffectStep(coin ? "shine" : "impact", {...target, scale: .55, opacity: .7}, {...target, scale: 2, opacity: 0}, 320, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 8), z: behind(target, 16)}, 150, "swing"),
  ];
}

function nativePoisonMoveSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "poisonfang") {
    return [
      {type: "backgroundEffect", color: "#8c40c8", durationMs: 560, opacity: .24},
      showEffectStep("poisonwisp", {...actor, scale: .45, opacity: .56}, {...target, scale: 1.2, opacity: .1}, 380, {fade: "both"}),
      ...nativeFangSteps(actor, target, "poisonfang"),
    ];
  }
  const clear = key === "clearsmog";
  return [
    {type: "backgroundEffect", color: clear ? "#d8f4ff" : "#5b326f", durationMs: 700, opacity: clear ? .18 : .32},
    showEffectStep(clear ? "wisp" : "poisonwisp", {...actor, scale: .65, opacity: .5}, {...target, scale: 2.3, opacity: 0}, 680, {fade: "both"}),
    showEffectStep(clear ? "shine" : "blackwisp", {...target, scale: .65, opacity: .34}, {...target, scale: 2.4, opacity: 0}, 620, {fade: "both"}),
    actorAnimStep(target, {opacity: clear ? .92 : .82, scale: .96}, 190, "swing"),
  ];
}

function nativeGroundWeaponSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "drillrun") {
    return [
      {type: "backgroundEffect", color: "#b98442", durationMs: 620, opacity: .22},
      showEffectStep("mudwisp", {...actor, scale: .45, opacity: .55}, {...target, scale: 1.4, opacity: .08}, 420, {fade: "both"}),
      ...stepsForOtherAnimation("spinattack", actor, target),
      actorAnimStep(target, {z: behind(target, 20)}, 170, "swing"),
    ];
  }
  return [
    {type: "backgroundEffect", color: "#b98442", durationMs: 620, opacity: .24},
    showEffectStep("bone", {...actor, x: actor.x - 8, scale: .72, opacity: .78}, {...target, x: target.x + 18, scale: 1.15, opacity: .18}, 460, {fade: "both"}),
    showEffectStep(key === "bonemerang" ? "bone" : "impact", {...target, x: target.x - 20, scale: .55, opacity: .65}, {...target, x: target.x + 18, scale: 1.6, opacity: 0}, 500, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 10), z: behind(target, 18)}, 170, "swing"),
  ];
}

function nativeWindStormSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const electric = key === "wildboltstorm";
  const sand = key === "sandsearstorm";
  const fire = key === "magmastorm";
  const dark = key === "ominouswind";
  const color = electric ? "#ffe35a" : sand ? "#c9a46b" : fire ? "#ff652f" : dark ? "#22002f" : "#bfefff";
  const sprite = electric ? "electroball" : sand ? "mudwisp" : fire ? "fireball" : dark ? "blackwisp" : "wisp";
  return [
    {type: "backgroundEffect", color, durationMs: 820, opacity: dark ? .34 : .26},
    showEffectStep(sprite, {...target, x: target.x - 68, y: target.y + 78, scale: .62, opacity: .62}, {...target, x: target.x + 26, y: target.y - 42, scale: 2.1, opacity: 0}, 720, {easing: "ballistic2", fade: "both"}),
    showEffectStep(sprite, {...target, x: target.x + 62, y: target.y + 72, scale: .58, opacity: .56}, {...target, x: target.x - 24, y: target.y - 34, scale: 2, opacity: 0}, 780, {easing: "ballistic2back", fade: "both"}),
    showEffectStep(electric ? "lightning" : "impact", {...target, scale: .4, opacity: .46}, {...target, scale: 1.8, opacity: 0}, 360, {fade: "both"}),
    actorAnimStep(target, {y: target.y - 10, x: leftOf(target, 10), z: behind(target, 22)}, 180, "swing"),
    actorAnimStep(target, {y: target.y, x: target.x, z: target.z}, 180, "swing"),
  ];
}

function nativeTriAttackSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [
    {type: "backgroundEffect", color: "#f4f7ff", durationMs: 680, opacity: .22},
    showEffectStep("fireball", {...actor, x: actor.x - 18, scale: .42, opacity: .72}, {...target, x: target.x + 18, scale: 1.15, opacity: .12}, 500, {fade: "both"}),
    showEffectStep("iceball", {...actor, x: actor.x + 18, scale: .42, opacity: .68}, {...target, x: target.x - 18, scale: 1.15, opacity: .12}, 560, {fade: "both"}),
    showEffectStep("electroball", {...actor, scale: .38, opacity: .64}, {...target, scale: 1.2, opacity: .1}, 620, {fade: "both"}),
    showEffectStep("impact", {...target, scale: .55, opacity: .66}, {...target, scale: 2.2, opacity: 0}, 360, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 20), x: leftOf(target, 10)}, 170, "swing"),
  ];
}

function nativeFairyLightSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const dark = key === "ruination" || key === "naturesmadness";
  return [
    {type: "backgroundEffect", color: dark ? "#22002f" : "#ffd6fb", durationMs: 760, opacity: dark ? .34 : .28},
    showEffectStep(dark ? "blackwisp" : "shine", {...actor, scale: .55, opacity: .62}, {...target, scale: 1.55, opacity: .1}, 580, {fade: "both"}),
    showEffectStep(dark ? "mistball" : "rainbow", {...target, scale: .75, opacity: .5}, {...target, scale: 2.8, opacity: 0}, 620, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 20), y: target.y - 8}, 180, "swing"),
  ];
}

function nativeMetalProjectileSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const rain = key === "makeitrain";
  return [
    {type: "backgroundEffect", color: rain ? "#ffd45a" : "#d9f3ff", durationMs: rain ? 760 : 560, opacity: rain ? .26 : .2},
    showEffectStep(rain ? "shine" : "impact", {...actor, x: actor.x - 10, scale: .42, opacity: .7}, {...target, x: target.x + 18, y: target.y + 8, scale: 1.2, opacity: .14}, 460, {fade: "both"}),
    showEffectStep(rain ? "shine" : "impact", {...actor, x: actor.x + 12, scale: .38, opacity: .62}, {...target, x: target.x - 18, y: target.y + 10, scale: 1.2, opacity: .12}, 540, {fade: "both", delayMs: 60}),
    showEffectStep("impact", {...target, scale: .5, opacity: .62}, {...target, scale: 1.9, opacity: 0}, 300, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 10), z: behind(target, 18)}, 160, "swing"),
  ];
}

function nativeSeedLeafSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "leechseed") {
    return [
      {type: "backgroundEffect", color: "#69d879", durationMs: 620, opacity: .18},
      showEffectStep("energyball", {...actor, scale: .35, opacity: .68}, {...target, scale: .95, opacity: .22}, 480, {fade: "both"}),
      showEffectStep("leaf1", {...target, x: target.x - 26, y: target.y + 28, opacity: .55}, {...target, x: target.x + 12, y: target.y - 18, scale: 1.4, opacity: 0}, 620, {fade: "both"}),
      showEffectStep("wisp", {...target, scale: .8, opacity: .44}, {...actor, scale: 1.3, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(target, {scale: .96}, 180, "swing"),
    ];
  }
  if (key === "grassknot") {
    return [
      {type: "backgroundEffect", color: "#4fc66c", durationMs: 560, opacity: .18},
      showEffectStep("leaf1", {...target, x: target.x - 40, y: target.y + 64, opacity: .62}, {...target, x: target.x - 10, y: target.y + 8, scale: 1.5, opacity: .12}, 520, {fade: "both"}),
      showEffectStep("leaf2", {...target, x: target.x + 36, y: target.y + 66, opacity: .58}, {...target, x: target.x + 8, y: target.y + 10, scale: 1.5, opacity: .12}, 620, {fade: "both"}),
      actorAnimStep(target, {y: target.y + 8, x: leftOf(target, 10)}, 180, "swing"),
    ];
  }
  if (key === "petalblizzard") {
    return [
      {type: "backgroundEffect", color: "#ffb0dc", durationMs: 820, opacity: .25},
      showEffectStep("petal", {...target, x: target.x - 68, y: target.y + 72, scale: .72, opacity: .72}, {...target, x: target.x + 28, y: target.y - 36, scale: 1.6, opacity: 0}, 720, {fade: "both"}),
      showEffectStep("petal", {...target, x: target.x + 64, y: target.y + 66, scale: .72, opacity: .66}, {...target, x: target.x - 24, y: target.y - 28, scale: 1.6, opacity: 0}, 760, {fade: "both"}),
      showEffectStep("leaf1", {...actor, scale: .7, opacity: .55}, {...target, scale: 1.3, opacity: .14}, 520, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 22), x: leftOf(target, 10)}, 180, "swing"),
    ];
  }
  if (key === "chloroblast") {
    return [
      {type: "backgroundEffect", color: "#b8ff58", durationMs: 820, opacity: .34},
      showEffectStep("energyball", {...actor, scale: 2.2, opacity: .22}, {...actor, scale: .55, opacity: .82}, 360, {fade: "both"}),
      showEffectStep("energyball", {...actor, scale: .6, opacity: .82}, {...target, scale: 1.8, opacity: .12}, 620, {fade: "both"}),
      showEffectStep("shine", {...target, scale: .8, opacity: .6}, {...target, scale: 3, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 24)}, 180, "swing"),
    ];
  }
  if (key === "bulletseed") {
    return [
      {type: "backgroundEffect", color: "#69d879", durationMs: 560, opacity: .16},
      showEffectStep("energyball", {...actor, x: actor.x - 10, scale: .28, opacity: .72}, {...target, x: target.x + 16, scale: .9, opacity: .12}, 360, {fade: "both", delayMs: 0}),
      showEffectStep("energyball", {...actor, x: actor.x + 10, scale: .25, opacity: .66}, {...target, x: target.x - 12, scale: .9, opacity: .12}, 420, {fade: "both", delayMs: 80}),
      showEffectStep("energyball", {...actor, scale: .25, opacity: .6}, {...target, scale: .95, opacity: .1}, 480, {fade: "both", delayMs: 80}),
      actorAnimStep(target, {x: leftOf(target, 8)}, 160, "swing"),
    ];
  }
  return [
    {type: "backgroundEffect", color: "#69d879", durationMs: 560, opacity: .18},
    showEffectStep(key === "seedbomb" ? "energyball" : "leaf1", {...actor, scale: .48, opacity: .7}, {...target, scale: 1.25, opacity: .14}, 520, {fade: "both"}),
    showEffectStep("leaf2", target, {...target, x: target.x + 22, y: target.y - 20, opacity: 0}, 440, {fade: "both"}),
    actorAnimStep(target, {z: behind(target, 18)}, 180, "swing"),
  ];
}

function nativeRockGroundSetupSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "powergem" || key === "diamondstorm" || key === "ancientpower" || key === "saltcure") {
    const gem = key === "powergem" || key === "diamondstorm";
    return [
      {type: "backgroundEffect", color: gem ? "#d9f3ff" : "#8c7255", durationMs: key === "diamondstorm" ? 820 : 640, opacity: gem ? .24 : .22},
      showEffectStep(gem ? "shine" : "rocks", {...actor, scale: .45, opacity: .72}, {...target, scale: 1.35, opacity: .12}, 520, {fade: "both"}),
      showEffectStep(gem ? "shine" : "rock1", {...target, x: target.x - 24, y: target.y + 74, scale: .7, opacity: .68}, {...target, x: target.x - 8, y: target.y + 6, scale: 1.4, opacity: 0}, 520, {fade: "both"}),
      showEffectStep(gem ? "shine" : "rock2", {...target, x: target.x + 24, y: target.y + 76, scale: .7, opacity: .62}, {...target, x: target.x + 8, y: target.y + 6, scale: 1.4, opacity: 0}, 600, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 20), x: leftOf(target, 8)}, 170, "swing"),
    ];
  }
  if (key === "gmaxsteelsurge") {
    return [
      {type: "backgroundEffect", color: "#d9f3ff", durationMs: 760, opacity: .26},
      showEffectStep("caltrop", {...target, x: target.x - 50, y: target.y + 94, scale: .48, opacity: .76}, {...target, x: target.x - 36, y: target.y + 28, scale: 1.05, opacity: .48}, 560, {fade: "both"}),
      showEffectStep("caltrop", {...target, x: target.x + 46, y: target.y + 98, scale: .48, opacity: .7}, {...target, x: target.x + 32, y: target.y + 30, scale: 1.05, opacity: .42}, 660, {fade: "both"}),
      showEffectStep("impact", {...target, scale: .6, opacity: .55}, {...target, scale: 2.2, opacity: 0}, 360, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 20)}, 170, "swing"),
    ];
  }
  if (key === "stealthrock") {
    return [
      {type: "backgroundEffect", color: "#8c7255", durationMs: 620, opacity: .2},
      showEffectStep("caltrop", {...target, x: target.x - 46, y: target.y + 84, scale: .5, opacity: .8}, {...target, x: target.x - 38, y: target.y + 28, scale: .95, opacity: .58}, 520, {fade: "both"}),
      showEffectStep("caltrop", {...target, x: target.x + 40, y: target.y + 88, scale: .5, opacity: .74}, {...target, x: target.x + 32, y: target.y + 32, scale: .95, opacity: .52}, 620, {fade: "both"}),
      showEffectStep("rocks", {...target, y: target.y + 90, opacity: .55}, {...target, y: target.y + 18, scale: 1.4, opacity: .12}, 620, {fade: "both"}),
    ];
  }
  if (key === "precipiceblades") {
    return [
      {type: "backgroundEffect", color: "#9b6a35", durationMs: 860, opacity: .36},
      showEffectStep("rock1", {...target, x: target.x - 52, y: target.y + 96, scale: .7, opacity: .7}, {...target, x: target.x - 22, y: target.y + 2, scale: 1.5, opacity: .18}, 620, {easing: "ballistic2Under", fade: "both"}),
      showEffectStep("rock2", {...target, x: target.x + 4, y: target.y + 106, scale: .74, opacity: .7}, {...target, x: target.x + 4, y: target.y - 4, scale: 1.6, opacity: .18}, 700, {easing: "ballistic2Under", fade: "both"}),
      showEffectStep("rock3", {...target, x: target.x + 52, y: target.y + 96, scale: .7, opacity: .66}, {...target, x: target.x + 22, y: target.y + 4, scale: 1.5, opacity: .16}, 780, {easing: "ballistic2Under", fade: "both"}),
      actorAnimStep(target, {y: target.y - 10, z: behind(target, 24)}, 170, "swing"),
    ];
  }
  if (key === "rocksmash") {
    return [
      {type: "backgroundEffect", color: "#8c7255", durationMs: 480, opacity: .18},
      actorAnimStep(actor, {x: target.x, y: target.y + 12, z: behind(target, -22)}, 240, "accel"),
      showEffectStep("rock1", target, {...target, x: target.x - 24, y: target.y - 18, opacity: 0}, 360, {fade: "both"}),
      showEffectStep("impact", target, {...target, scale: 2.1, opacity: 0}, 260, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 22)}, 160, "swing"),
    ];
  }
  return [
    {type: "backgroundEffect", color: "#8c7255", durationMs: 520, opacity: .2},
    showEffectStep(key === "rockthrow" ? "rock1" : "rocks", {...actor, y: actor.y - 10, scale: .7, opacity: .75}, {...target, y: target.y + 6, scale: 1.25, opacity: .12}, 520, {fade: "both"}),
    showEffectStep("impact", target, {...target, scale: 1.8, opacity: 0}, 300, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 10), z: behind(target, 18)}, 160, "swing"),
  ];
}

function nativeSoundVoiceSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const color = key === "psychicnoise" ? "#aa44ff" : key === "disarmingvoice" ? "#ffc7f5" : key === "grasswhistle" ? "#7ee38e" : "#d8f4ff";
  const sprite = key === "grasswhistle" ? "leaf1" : key === "psychicnoise" ? "mistball" : "sound";
  return [
    {type: "backgroundEffect", color, durationMs: 620, opacity: .2},
    showEffectStep("sound", {...actor, scale: .6, opacity: .52}, {...target, scale: 2.2, opacity: 0}, 560, {fade: "both"}),
    showEffectStep(sprite, {...actor, x: actor.x + 10, scale: .42, opacity: .45}, {...target, x: target.x - 16, scale: 1.5, opacity: 0}, 620, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 10)}, 100, "swing"),
    actorAnimStep(target, {x: leftOf(target, -8)}, 100, "swing"),
    actorAnimStep(target, {x: target.x}, 120, "swing"),
  ];
}

function nativeShadowSpecialSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "oblivionwing") {
    return [
      {type: "backgroundEffect", color: "#22002f", durationMs: 820, opacity: .34},
      showEffectStep("shadowball", {...actor, scale: .5, opacity: .68}, {...target, scale: 1.5, opacity: .14}, 620, {fade: "both"}),
      showEffectStep("wisp", {...target, scale: .8, opacity: .52}, {...actor, scale: 1.6, opacity: 0}, 720, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 20)}, 180, "swing"),
    ];
  }
  if (key === "darkvoid") {
    return [
      {type: "backgroundEffect", color: "#05000a", durationMs: 900, opacity: .48},
      showEffectStep("blackwisp", {...target, scale: .7, opacity: .5}, {...target, scale: 3.4, opacity: 0}, 760, {fade: "both"}),
      showEffectStep("shadowball", {...actor, scale: .45, opacity: .58}, {...target, scale: 1.6, opacity: .08}, 620, {fade: "both"}),
      actorAnimStep(target, {y: target.y + 8, opacity: .82}, 220, "swing"),
    ];
  }
  if (key === "shadowbone") {
    return [
      {type: "backgroundEffect", color: "#22002f", durationMs: 640, opacity: .28},
      showEffectStep("bone", {...actor, scale: .7, opacity: .74}, {...target, scale: 1.35, opacity: .18}, 520, {fade: "both"}),
      showEffectStep("shadowball", target, {...target, scale: 2, opacity: 0}, 420, {fade: "both"}),
      actorAnimStep(target, {z: behind(target, 22)}, 180, "swing"),
    ];
  }
  if (key === "psychoboost" || key === "esperwing") {
    return [
      {type: "backgroundEffect", color: key === "esperwing" ? "#d8f3ff" : "#aa44ff", durationMs: 760, opacity: .3},
      showEffectStep(key === "esperwing" ? "feather" : "mistball", {...actor, scale: .55, opacity: .72}, {...target, scale: 1.5, opacity: .12}, 620, {fade: "both"}),
      showEffectStep("shine", target, {...target, scale: 2.6, opacity: 0}, 520, {fade: "both"}),
      actorAnimStep(target, {y: target.y - 12, z: behind(target, 20)}, 180, "swing"),
    ];
  }
  return [
    {type: "backgroundEffect", color: "#05000a", durationMs: 760, opacity: .38},
    actorAnimStep(actor, {opacity: .32, z: behind(actor, 60)}, 220, "decel"),
    showEffectStep("shadowball", {...actor, scale: .45, opacity: .6}, {...target, scale: 1.5, opacity: .12}, 520, {fade: "both"}),
    showEffectStep("blackwisp", target, {...target, scale: 2.2, opacity: 0}, 460, {fade: "both"}),
    actorAnimStep(target, {x: leftOf(target, 12), z: behind(target, 22)}, 170, "swing"),
  ];
}

function presetRouterSteps(animationKey: string, actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  const preset = movePresetForKey(animationKey);
  switch (preset) {
  case "contact": return stepsForOtherAnimation("contactattack", actor, target);
  case "slash": return stepsForOtherAnimation("slashattack", actor, target);
  case "claw": return stepsForOtherAnimation("clawattack", actor, target);
  case "bite": return [...stepsForOtherAnimation("bite", actor, target), ...stepsForOtherAnimation("contactattack", actor, target)];
  case "punch": return stepsForOtherAnimation("punchattack", actor, target);
  case "kick": return stepsForOtherAnimation("kick", actor, target);
  case "fast": return stepsForOtherAnimation("fastattack", actor, target);
  case "spin": return stepsForOtherAnimation("spinattack", actor, target);
  case "drain": return stepsForOtherAnimation("drain", actor, target);
  case "heal": return healPresetSteps(actor);
  case "status": return statusPresetSteps(actor, target, animationKey);
  case "dance": return danceSteps(actor);
  case "shield": return shieldSteps(actor, animationKey);
  case "terrain": return terrainSteps(actor, animationKey);
  case "weather": return weatherSteps(actor, animationKey);
  case "room": return roomSteps(actor, "#6b4aa8", animationKey);
  case "fireProjectile": return fireSteps(actor, target, animationKey);
  case "waterProjectile": return waterSteps(actor, target, animationKey);
  case "electricWave": return electricSteps(actor, target, animationKey);
  case "iceProjectile": return iceSteps(actor, target, animationKey);
  case "grassProjectile": return grassSteps(actor, target, animationKey);
  case "rockProjectile": return rockSteps(actor, target, animationKey);
  case "groundImpact": return groundSteps(actor, target, animationKey);
  case "psychicPulse": return psychicSteps(actor, target, animationKey);
  case "ghostDarkPulse": return ghostDarkSteps(actor, target, "shadowball");
  case "poisonCloud": return poisonSteps(actor, target, animationKey);
  case "soundWave": return soundSteps(actor, target);
  case "beam": return beamSteps(actor, target, effectSpriteIdForMove(animationKey), "#f4f7ff");
  case "explosion": return explosionSteps(actor, target, "#ff7845", "impact");
  case "transformForm": return formChangeSteps(actor, animationKey);
  case "zMove": return zMoveSteps(actor, target, "#050505");
  default: return projectileSteps(actor, target, effectSpriteIdForMove(animationKey), "#f4f7ff");
  }
}

function movePresetForKey(key: string): string {
  if (/gigavolthavoc|infernooverdrive|alloutpummeling|supersonicskystrike|aciddownpour|blackholeeclipse|continentalcrush|neverendingnightmare|corkscrewcrash|twinkletackle|pulverizingpancake|stokedsparksurfer|catastropika|sinisterarrowraid|oceanicoperetta|extremeevoboost|guardianofalola|splinteredstormshards|letssnuggleforever|clangoroussoulblaze|soulstealing7starstrike|searingsunrazesmash/.test(key)) return "zMove";
  if (/explosion|mistyexplosion|finalgambit|selfdestruct|mindblown/.test(key)) return "explosion";
  if (/recover|rest|roost|softboiled|milkdrink|morningsun|moonlight|lunarblessing|shoreup|wish|healingwish|revivalblessing|healpulse|lifedew|junglehealing|aromatherapy|healbell|refresh/.test(key)) return "heal";
  if (/drain|leech|absorb|oblivionwing|paraboliccharge|drainingkiss|hornleech|bitterblade|matchagotcha/.test(key)) return "drain";
  if (/protect|detect|shield|guard|endure|matblock|banefulbunker|spikyshield|burningbulwark|craftyshield|kingsshield|auroraveil|reflect|lightscreen|safeguard|mist/.test(key)) return "shield";
  if (/terrain/.test(key)) return "terrain";
  if (/raindance|sunnyday|hail|snowscape|sandstorm|chillyreception/.test(key)) return "weather";
  if (/trickroom|magicroom|wonderroom|gravity/.test(key)) return "room";
  if (/dance|agility|doubleteam|splash|celebrate|teeter|metronome|tailglow|growth|howl|focusenergy|calmmind|nastyplot|bulkup|shellsmash|coil|geomancy|rockpolish|irondefense|harden|defensecurl|stockpile|charge|bellydrum|acupressure|sharpen|withdraw|meditate|cosmicpower|shiftgear|autotomize|dragoncheer/.test(key)) return "dance";
  if (/taunt|swagger|encore|attract|followme|foresight|mimic|sketch|doodle|odorsleuth|playnice|tailwhip|leer|kinesis|topsyturvy|embargo|healblock|flash|tailwind|babydolleyes|faketears|tearfullook|featherdance|tickle|worryseed|hypnosis|darkvoid|lovelykiss|spore|yawn|sing|confuseray|willowisp|toxic|poisongas|smokescreen|partingshot|nobleroar|growl|screech|confide|defog|grasswhistle|supersonic|eerieimpulse|lockon|mindreader|spite|memento|forestscurse|trickortreat|spotlight|upperhand/.test(key)) return "status";
  if (/punch|fist|comet|mega|dynamic|shadowpunch|meteormash|hammer|skyuppercut|forcepalm|karatechop|crosschop|rocksmash/.test(key)) return "punch";
  if (/kick|stomp|tropkick|lowkick|jumpkick|highjumpkick/.test(key)) return "kick";
  if (/claw|furycutter|cut|slash|xscissor|leafblade|psychocut|mightycleave|tachyoncutter|aircutter|spacialrend|sacredsword|secretsword|precipiceblades|bitterblade|firelash|stoneaxe|razorshell|aquacutter|smartstrike/.test(key)) return /claw/.test(key) ? "claw" : "slash";
  if (/bite|fang|crunch|jaw/.test(key)) return "bite";
  if (/quick|speed|sneak|suckerpunch|accelerock|bulletpunch|vacuumwave|jetpunch|firstimpression|thunderclap|aquajet|iceshard|watershuriken|shadowsneak|feint|fakeout/.test(key)) return "fast";
  if (/spin|rollout|gyroball|steamroller|iceball|tripleaxel|brutalswing/.test(key)) return "spin";
  if (/fire|flame|burn|flare|heat|overheat|eruption|lava|vcreate|blueflare|sacredfire|pyro|torch|blazing|temperflare/.test(key)) return "fireProjectile";
  if (/water|hydro|aqua|surf|brine|bubble|scald|steam|muddywater|originpulse|fishiousrend|soak|watersport|wavecrash|crabhammer|octazooka/.test(key)) return "waterProjectile";
  if (/thunder|volt|spark|electro|zap|chargebeam|discharge|bolt|plasma|parabolic|wildcharge|supercell/.test(key)) return "electricWave";
  if (/ice|freeze|frost|blizzard|glacial|sheercold|avalanche|icicle|freezy|freezing|freezedry|icywind/.test(key)) return "iceProjectile";
  if (/leaf|grass|seed|petal|wood|powerwhip|chloroblast|flower|magicalleaf|leafstorm|leafage|grassknot|seedflare/.test(key)) return "grassProjectile";
  if (/rock|stone|diamondstorm|ancientpower|powergem|continental|saltcure/.test(key)) return "rockProjectile";
  if (/earth|ground|mud|sand|bone|dig|drillrun|stomping|thousand|land|precipice/.test(key)) return "groundImpact";
  if (/psych|psy|confusion|mind|dream|storedpower|mysticalpower|lusterpurge|mistball|esper|photongeyser|prismatic|ficklebeam/.test(key)) return "psychicPulse";
  if (/shadow|ghost|dark|night|hex|spirit|astral|moongeist|hyperspace|wicked|malignant|blackhole|sinister|spectral|thief|knockoff|assurance|punishment|powertrip/.test(key)) return "ghostDarkPulse";
  if (/poison|toxic|sludge|venom|gunk|acid|smog|barb|noxious|malignantchain/.test(key)) return "poisonCloud";
  if (/sound|voice|song|buzz|boomburst|roar|round|snore|sonic|synchronoise|perishsong|hypervoice|clang|psychicnoise/.test(key)) return "soundWave";
  if (/beam|laser|cannon|pulse|blast|ball|meteor|judgment|techno|doomdesire|future|prismatic|coreenforcer|roaroftime|lightofruin|solarbeam|electroshot|hyperbeam|flashcannon|aeroblast|moonblast|signalbeam|simplebeam|triattack/.test(key)) return "beam";
  if (/transform|conversion|substitute|batonpass|teleport|switcheroo|skillswap|recycle|snatch|bestow|fling|item|schooling|powerconstruct|mega|ultra|primal|revelationdance|terastarstorm/.test(key)) return "transformForm";
  if (/spin|bind|clamp|wrap|whirlpool|firespin|sandtomb|magmastorm|leaftornado|hurricane|whirlwind|storm/.test(key)) return "spin";
  return "contact";
}

function statusPresetSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (/tail|leer|fake|tear|feather|growl|screech|confide|defog/.test(key)) return [showEffectStep("wisp", actor, target, 420, {fade: "both"}), {type: "resultAnim", actor: target, text: "", tone: "bad"}, ...stepsForOtherAnimation("shake", target, target)];
  if (/hypnosis|sleep|yawn|sing|kiss|spore|darkvoid/.test(key)) return [showEffectStep("wisp", {...actor, scale: .5, opacity: .5}, {...target, scale: 2, opacity: 0}, 620, {fade: "both"}), actorAnimStep(target, {y: target.y + 5, opacity: .85}, 180, "swing")];
  return [showEffectStep(effectSpriteIdForMove(key), actor, target, 520, {fade: "both"}), actorAnimStep(target, {scale: .97}, 160, "swing")];
}

function boostSteps(actor: ShowdownSpriteActorV4, spriteId = "wisp", color = "#f4f7ff"): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color, durationMs: 420, opacity: .18}, showEffectStep(spriteId, {...actor, scale: 1.7, opacity: .2}, {...actor, scale: .25, opacity: .85}, 420, {fade: "both"}), actorAnimStep(actor, {scale: 1.08, y: actor.y - 8}, 220, "decel")];
}

function danceSteps(actor: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [showEffectStep("shine", actor, {...actor, scale: 1.45, opacity: 0}, 420, {fade: "both"}), actorAnimStep(actor, {x: leftOf(actor, 12), scale: 1.08}, 160, "swing"), actorAnimStep(actor, {x: leftOf(actor, -12)}, 160, "swing"), actorAnimStep(actor, {x: actor.x, scale: 1}, 160, "swing")];
}

function shieldSteps(actor: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const color = /aurora|reflect|screen|safeguard/.test(key) ? "#a6e8ff" : "#64d58a";
  return [{type: "backgroundEffect", color, durationMs: 480, opacity: .18}, showEffectStep("shine", {...actor, scale: 1.8, opacity: .4}, {...actor, scale: 2.5, opacity: 0}, 520, {fade: "both"}), actorAnimStep(actor, {scale: 1.04}, 180, "decel")];
}

function terrainSteps(actor: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const color = key.includes("electric") ? "#ffe35a" : key.includes("grassy") ? "#68d878" : key.includes("misty") ? "#e5a8ff" : "#9bc7ff";
  return [{type: "backgroundEffect", color, durationMs: 720, opacity: .32}, showEffectStep("wisp", {...actor, y: actor.y + 35, scale: 2, opacity: .3}, {...actor, y: actor.y + 5, scale: 3, opacity: 0}, 620, {fade: "both"})];
}

function weatherSteps(actor: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  const color = key.includes("rain") ? "#4aa5ff" : key.includes("sun") ? "#ffd45a" : key.includes("sand") ? "#c9a46b" : "#d8f6ff";
  const sprite = key.includes("rain") ? "waterwisp" : key.includes("sand") ? "mudwisp" : key.includes("hail") || key.includes("snow") ? "icicle" : "shine";
  return [{type: "backgroundEffect", color, durationMs: 760, opacity: .34}, showEffectStep(sprite, {...actor, y: actor.y + 60, scale: 1.2, opacity: .7}, {...actor, y: actor.y - 30, scale: 2, opacity: 0}, 640, {fade: "both"})];
}

function roomSteps(actor: ShowdownSpriteActorV4, color: string, key: string): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color, durationMs: 760, opacity: .34}, showEffectStep(key.includes("gravity") ? "weather-gravity" : "wisp", {...actor, scale: 2, opacity: .2}, {...actor, scale: 3.2, opacity: 0}, 620, {fade: "both"})];
}

function environmentSteps(key: string, actor: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  if (key.endsWith("terrain")) return terrainSteps(actor, key);
  if (key.endsWith("room") || key === "gravity") return roomSteps(actor, "#6b4aa8", key);
  return weatherSteps(actor, key);
}

function healPresetSteps(actor: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [...stepsForOtherAnimation("heal", actor, actor), {type: "healAnim", actor, heal: null}];
}

function fireSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color: "#ff652f", durationMs: /blast|vcreate|overheat|eruption/.test(key) ? 760 : 520, opacity: .3}, ...projectileSteps(actor, target, /blue/.test(key) ? "bluefireball" : /blast|flare/.test(key) ? "flareball" : "fireball", "#ff652f")];
}

function waterSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (/surf|muddywater|wavecrash|waterspout/.test(key)) return [{type: "backgroundEffect", color: "#3d9dff", durationMs: 660, opacity: .28}, showEffectStep("waterwisp", {...actor, scale: 1.4}, {...target, scale: 2.3, opacity: .12}, 620, {fade: "both"}), actorAnimStep(target, {z: behind(target, 20)}, 180, "swing")];
  return projectileSteps(actor, target, "waterwisp", "#3d9dff");
}

function electricSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  return electricWaveSteps(actor, target, {wide: /discharge|web|cage|wave/.test(key), projectile: !/discharge|wave/.test(key), background: "#ffe35a"});
}

function iceSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  return [showEffectStep(/icicle|glacial/.test(key) ? "icicle" : "iceball", actor, target, 480, {fade: "both"}), showEffectStep("icicle", {...target, y: target.y + 70, opacity: .8}, {...target, y: target.y + 8, opacity: 0, scale: .8}, 520, {fade: "both"}), actorAnimStep(target, {scale: .96}, 200)];
}

function grassSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (/petal|flower/.test(key)) return [showEffectStep("petal", actor, target, 520, {fade: "both"}), showEffectStep("petal", {...target, x: target.x - 24}, {...target, x: target.x + 24, opacity: 0}, 560, {fade: "both"})];
  return [showEffectStep(/seed/.test(key) ? "energyball" : "leaf1", actor, target, 520, {fade: "both"}), showEffectStep("leaf2", target, {...target, x: target.x + 18, y: target.y + 12, opacity: 0}, 420, {fade: "both"})];
}

function rockSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  return [showEffectStep(/gem|diamond/.test(key) ? "shine" : "rocks", {...target, y: target.y + 85, opacity: .85}, target, 460, {fade: "both"}), showEffectStep("rock1", {...target, x: target.x - 28, y: target.y + 70}, {...target, x: target.x - 8, y: target.y + 5}, 420, {fade: "both"}), actorAnimStep(target, {z: behind(target, 25)}, 180)];
}

function groundSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color: "#b98442", durationMs: 460, opacity: .24}, showEffectStep(/bone/.test(key) ? "bone" : "mudwisp", actor, {...target, y: target.y + 10}, 520, {fade: "both"}), actorAnimStep(target, {y: target.y + 8, z: behind(target, 25)}, 180, "swing")];
}

function psychicSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color: "#aa44ff", durationMs: 620, opacity: .3}, ...pulseProjectileSteps(actor, target, /beam|laser|fickle/.test(key) ? "mistball" : "wisp", {count: 3, secondarySprite: "mistball"})];
}

function ghostDarkSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, spriteId = "shadowball"): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color: "#22002f", durationMs: 620, opacity: .25}, showEffectStep(spriteId, actor, target, 560, {fade: "both"}), showEffectStep("blackwisp", target, {...target, scale: 1.7, opacity: 0}, 440, {fade: "both"}), actorAnimStep(target, {z: behind(target, 18)}, 180, "swing")];
}

function poisonSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  return [showEffectStep(/gunk|sludge|bomb/.test(key) ? "poisonwisp" : "poisoncaltrop", actor, target, 520, {fade: "both"}), showEffectStep("poisonwisp", target, {...target, scale: 2, opacity: 0}, 520, {fade: "both"}), actorAnimStep(target, {scale: .96}, 180)];
}

function soundSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4): ShowdownAnimationStepV4[] {
  return [showEffectStep("sound", actor, {...target, scale: 1.8, opacity: 0}, 520, {fade: "both"}), showEffectStep("wisp", {...target, scale: .5, opacity: .4}, {...target, scale: 2.4, opacity: 0}, 580, {fade: "both"}), actorAnimStep(target, {x: leftOf(target, 10)}, 180, "swing")];
}

function beamSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, spriteId: string, color: string): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color, durationMs: 460, opacity: .2}, showEffectStep(spriteId, {...actor, scale: .45, opacity: .75}, {...target, scale: 1.3, opacity: .15}, 560, {fade: "both"}), showEffectStep("impact", target, {...target, scale: 1.8, opacity: 0}, 320, {fade: "both"}), actorAnimStep(target, {z: behind(target, 18)}, 180, "swing")];
}

function projectileSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, spriteId: string, color: string): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color, durationMs: 360, opacity: .14}, showEffectStep(spriteId, actor, target, 520, {fade: "both"}), showEffectStep("impact", target, {...target, scale: 1.5, opacity: 0}, 280, {fade: "both"}), actorAnimStep(target, {x: leftOf(target, 8)}, 160, "swing")];
}

function explosionSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, color: string, spriteId: string): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color, durationMs: 760, opacity: .42}, showEffectStep(spriteId, {...target, scale: .4, opacity: .9}, {...target, scale: 3.5, opacity: 0}, 680, {fade: "both"}), actorAnimStep(target, {z: behind(target, 30)}, 220, "swing")];
}

function zMoveSteps(actor: ShowdownSpriteActorV4, target: ShowdownSpriteActorV4, color: string): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color, durationMs: 860, opacity: .55}, showEffectStep("z-symbol", {...actor, scale: .8, opacity: .8}, {...actor, scale: 2.2, opacity: 0}, 520, {fade: "both"}), showEffectStep(effectSpriteIdForMove(target.ident), actor, target, 620, {fade: "both"}), showEffectStep("impact", target, {...target, scale: 2.4, opacity: 0}, 460, {fade: "both"}), actorAnimStep(target, {z: behind(target, 28)}, 220, "swing")];
}

function primalSteps(actor: ShowdownSpriteActorV4, color: string, spriteId: string): ShowdownAnimationStepV4[] {
  return [{type: "backgroundEffect", color, durationMs: 900, opacity: .38}, showEffectStep(spriteId, {...actor, scale: .6, opacity: .9}, {...actor, scale: 2.4, opacity: 0}, 720, {fade: "both"}), actorAnimStep(actor, {scale: 1.16}, 260, "decel")];
}

function formChangeSteps(actor: ShowdownSpriteActorV4, key: string): ShowdownAnimationStepV4[] {
  if (key === "teratransform") {
    return [
      {type: "backgroundEffect", color: "#d8f6ff", durationMs: 820, opacity: .34},
      showEffectStep("shine", {...actor, scale: .55, opacity: .75}, {...actor, scale: 2.8, opacity: 0}, 620, {fade: "both"}),
      showEffectStep("z-symbol", {...actor, y: actor.y - 26, scale: .42, opacity: .82}, {...actor, y: actor.y - 42, scale: 1.4, opacity: 0}, 680, {fade: "both"}),
      actorAnimStep(actor, {scale: 1.12, y: actor.y - 8}, 260, "easeInOut"),
    ];
  }
  if (key === "dynamaxtransform") {
    return [
      {type: "backgroundEffect", color: "#7b1438", durationMs: 940, opacity: .48},
      showEffectStep("blackwisp", {...actor, scale: 1.2, opacity: .3}, {...actor, scale: 4, opacity: 0}, 760, {fade: "both"}),
      showEffectStep("impact", {...actor, y: actor.y + 36, scale: .55, opacity: .85}, {...actor, y: actor.y + 36, scale: 2.8, opacity: 0}, 620, {fade: "both"}),
      actorAnimStep(actor, {scale: 1.28, y: actor.y - 16}, 360, "decel"),
    ];
  }
  const sprite = key.includes("mega") ? "alpha" : key.includes("ultra") ? "ultra" : "shine";
  return [{type: "backgroundEffect", color: "#fff4a8", durationMs: 620, opacity: .24}, showEffectStep(sprite, {...actor, scale: .8, opacity: .8}, {...actor, scale: 2.2, opacity: 0}, 620, {fade: "both"}), actorAnimStep(actor, {scale: 1.14, opacity: .72}, 260, "easeInOut")];
}

function effectSpriteIdForMove(key: string): string {
  if (/fire|flame|burn|blast|flare|heat|eruption|lava|torch|blueflare/.test(key)) return key.includes("blue") ? "bluefireball" : "fireball";
  if (/water|hydro|aqua|surf|bubble|brine|steam|soak|pulse|muddywater/.test(key)) return "waterwisp";
  if (/thunder|volt|spark|electro|zap|charge|bolt/.test(key)) return "electroball";
  if (/ice|freeze|blizzard|glacial|snow|hail/.test(key)) return "iceball";
  if (/leaf|grass|seed|petal|flower|wood/.test(key)) return "leaf1";
  if (/rock|stone|ancient|gem|diamond/.test(key)) return "rock1";
  if (/poison|toxic|sludge|venom|gunk|acid|smog/.test(key)) return "poisonwisp";
  if (/shadow|dark|ghost|night|hex|spirit/.test(key)) return "shadowball";
  if (/psych|psy|mind|beam|laser|mist|confusion/.test(key)) return "mistball";
  if (/sound|voice|song|buzz|roar/.test(key)) return "sound";
  return "wisp";
}

function fallbackMoveAnimationKey(event: BattleProtocolEventV4): string {
  const moveId = toId(event.moveId || event.moveName);
  if (/punch|kick|slam|tackle|impact|claw|slash|bite|seismic|heavy/.test(moveId)) return "contactattack";
  if (/sound|voice|song|metal/.test(moveId)) return "sound";
  if (/quick|aqua|shadow|sneak/.test(moveId)) return "fastattack";
  return "fastanimspecial";
}

function resultAnimationKeyForEvent(event: BattleProtocolEventV4): string {
  if (event.eventType === "-miss" || event.eventType === "-immune" || event.eventType === "-fail") return "shake";
  if (event.eventType === "-supereffective" || event.eventType === "-crit") return "hitmark";
  return "lightstatus";
}

function statusFallbackForEvent(event: BattleProtocolEventV4): string {
  const status = toId(event.status || event.args[2]);
  if (status === "recharge" || status === "flinch") return "shake";
  if (status === "confusion") return "confused";
  return "selfstatus";
}

function effectSpriteForAnimationKey(animationKey: string, kind: BattleAnimationKindV4, event: BattleProtocolEventV4): string {
  const key = toId(animationKey || event.moveId || event.moveName);
  if (kind === "damage" || key === "hitmark" || key === "contactattack" || key === "attack") return "impact";
  if (kind === "heal" || key === "heal" || key === "recover" || key === "rest") return "shine";
  if (kind === "status" || key === "lightstatus" || key === "selfstatus") return "wisp";
  if (key === "brn" || /eruption|fire|flame|burn|blast|heat|flare|pyro/.test(key)) return "fireball";
  if (key === "psn" || /poison|sludge|toxic|venom/.test(key)) return "poisonwisp";
  if (key === "par" || /thunder|volt|spark|shock|electro|bolt/.test(key)) return "electroball";
  if (key === "frz" || /ice|snow|freeze|blizzard/.test(key)) return "iceball";
  if (/water|aqua|hydro|surf|steam/.test(key)) return "waterwisp";
  if (/leaf|grass|seed|petal|vine/.test(key)) return "leaf1";
  if (/shadow|ghost|dark|night/.test(key)) return "shadowball";
  if (/psych|confusion|psy|confused/.test(key)) return "mistball";
  if (/slash|cut|claw/.test(key)) return "leftslash";
  if (kind === "transform" || key === "transform" || key === "shiny") return "shine";
  if (kind === "weather") return "shine";
  if (kind === "switchIn" || kind === "switchOut") return "pokeball";
  return "impact";
}

function actorForSeat(seat: BattleProtocolSeatV4, ident: string): ShowdownSpriteActorV4 {
  const coords = actorCoords(seat);
  return {
    seat,
    ident,
    side: seat.startsWith("p1") ? "near" : seat.startsWith("p2") ? "far" : "",
    slotIndex: seat.endsWith("B") ? 1 : 0,
    ...coords,
    scale: 1,
    opacity: 1,
    xscale: 1,
    yscale: 1,
  };
}

function actorCoords(seat: BattleProtocolSeatV4): Pick<ShowdownSpriteActorV4, "x" | "y" | "z"> {
  if (seat === "p1A") return {x: 86, y: 191, z: 20};
  if (seat === "p1B") return {x: 244, y: 191, z: 20};
  if (seat === "p2A") return {x: 489, y: 95, z: 20};
  if (seat === "p2B") return {x: 357, y: 95, z: 20};
  return {x: 320, y: 132, z: 20};
}

function effectSpriteFor(effectId: string, actor: ShowdownSpriteActorV4): ShowdownEffectSpriteV4 {
  return {
    effectId,
    assetPath: `/showdown/fx/${effectId}.png`,
    x: actor.x,
    y: actor.y,
    z: actor.z + 10,
    scale: 1,
    opacity: 1,
    blendMode: "screen",
  };
}

function showEffectStep(
  effectId: string,
  from: ShowdownSpriteActorV4,
  to: ShowdownSpriteActorV4,
  durationMs: number,
  options: {easing?: string; fade?: "in" | "out" | "both" | "none"; spriteId?: string; delayMs?: number; explode?: boolean} = {},
): ShowdownAnimationStepV4 {
  return {
    type: "showEffect",
    effectId,
    from,
    to,
    durationMs,
    delayMs: options.delayMs,
    easing: options.easing || "linear",
    fade: options.fade || "both",
    explode: options.explode,
    sprite: effectSpriteFor(options.spriteId || effectId, from),
  };
}

function actorAnimStep(actor: ShowdownSpriteActorV4, props: ShowdownActorAnimPropsV4, durationMs: number, easing?: string): ShowdownAnimationStepV4 {
  return {type: "actorAnim", actor, props, durationMs, easing};
}

function waitStep(durationMs: number): ShowdownAnimationStepV4 {
  return {type: "wait", durationMs};
}

function checkpointStep(checkpointId: string): ShowdownAnimationStepV4 {
  return {type: "checkpoint", checkpointId};
}

function leftOf(actor: ShowdownSpriteActorV4, offset: number): number {
  return actor.side === "far" ? actor.x - offset : actor.x + offset;
}

function behind(actor: ShowdownSpriteActorV4, offset: number): number {
  return actor.z + offset;
}

function sourceForAnimationKey(animationKey: string, kind: BattleAnimationKindV4, fallbackSource: ShowdownAnimationSourceV4): ShowdownAnimationSourceV4 {
  if ((kind === "moveEffect" || kind === "moveStart") && SUPPORTED_MOVE_ANIMS.has(animationKey)) return "BattleMoveAnims";
  if (SUPPORTED_STATUS_ANIMS.has(animationKey)) return "BattleStatusAnims";
  if (SUPPORTED_OTHER_ANIMS.has(animationKey)) return "BattleOtherAnims";
  return fallbackSource;
}

function fallbackForAnimationKey(animationKey: string, kind: BattleAnimationKindV4, fallback: boolean): boolean {
  if ((kind === "moveEffect" || kind === "moveStart") && SUPPORTED_MOVE_ANIMS.has(animationKey)) return false;
  if (SUPPORTED_STATUS_ANIMS.has(animationKey)) return false;
  if (SUPPORTED_OTHER_ANIMS.has(animationKey)) return false;
  return fallback;
}

function selection(
  animationKey: string,
  source: ShowdownAnimationSourceV4,
  fallback: boolean,
  sourceKey = animationKey,
  explicitAliasTarget = "",
  compositeTargets: string[] = [],
): ShowdownAnimationKeySelectionV4 {
  const aliasTargetKey = explicitAliasTarget || (sourceKey && animationKey !== sourceKey ? animationKey : "");
  return {
    animationKey,
    source,
    fallback,
    sourceKey: sourceKey || animationKey,
    aliasTargetKey,
    compositeTargets,
  };
}

function fidelityForAnimationKey(animationKey: string, kind: BattleAnimationKindV4, fallback: boolean): ShowdownAnimationFidelityV4 {
  if (fallback) return "fallback";
  if (kind === "weather") return "native";
  if (kind === "status" && SUPPORTED_STATUS_ANIMS.has(animationKey)) return "native";
  if (animationKey === "swordsdance") return "exact";
  if (NATIVE_MOVE_ANIMS.has(animationKey)) return "native";
  if (/^(earthquake|magnitude|fissure|landswrath|bulldoze|protect|recover|rest|thunderbolt|flamethrower|icebeam|surf|rockslide|psychic)$/.test(animationKey)) return "native";
  if (MOVE_NATIVE_OTHER_MAP[animationKey] || SUPPORTED_OTHER_ANIMS.has(animationKey)) return "native";
  if (SUPPORTED_MOVE_ANIMS.has(animationKey)) return "preset";
  if (kind === "switchIn" || kind === "switchOut" || kind === "faint" || kind === "transform") return "native";
  return "preset";
}

function showdownInstructionCountForAnimationKey(animationKey: string, kind: BattleAnimationKindV4, steps: ShowdownAnimationStepV4[]): number {
  if (animationKey === "swordsdance") return 7;
  if (/^(earthquake|magnitude|fissure|landswrath)$/.test(animationKey)) return 10;
  if (kind === "weather") return 3;
  return steps.filter(step => step.type !== "checkpoint").length;
}

const KNOWN_FX_SPRITES = new Set([
  "alpha", "angry", "blackwisp", "bluefireball", "bone", "bottombite", "caltrop", "electroball",
  "energyball", "feather", "fireball", "fist", "fist1", "flareball", "foot", "gear", "greenmetal1",
  "greenmetal2", "heart", "hitmark", "hitmarker", "icicle", "icicle-pink", "iceball", "impact", "item",
  "leaf1", "leaf2", "leftchop", "leftclaw", "leftslash", "lightning", "mistball", "moon", "mudwisp",
  "omega", "petal", "poisoncaltrop", "poisonwisp", "pokeball", "rainbow", "rightchop", "rightclaw",
  "rightslash", "rock1", "rock2", "rock3", "rocks", "shadowball", "shell", "shine", "sound", "stare",
  "sword", "topbite", "ultra", "waterwisp", "weather-gravity", "web", "wisp", "z-symbol"
]);

function missingFxAssetsForSteps(steps: ShowdownAnimationStepV4[]): string[] {
  const missing = new Set<string>();
  for (const step of steps) {
    if (step.type !== "showEffect") continue;
    const id = step.sprite.effectId || step.effectId;
    if (id && !KNOWN_FX_SPRITES.has(id)) missing.add(`/showdown/fx/${id}.png`);
  }
  return [...missing];
}

function wait(durationMs: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, Math.max(0, durationMs)));
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function cleanEffect(value: string): string {
  return String(value || "").replace(/^(move|ability|item):/i, "").trim();
}
