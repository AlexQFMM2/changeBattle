export type PokemonSpeciesRankData = "rank1" | "rank2" | "rank3" | "rank4" | "rank5" | "rank6" | "legendary";

export type PokemonSpeciesRankEntryData = {
  id: string;
  species: string;
  baseSpecies: string;
  rank: PokemonSpeciesRankData;
  sourceTier: number;
  score: number;
};

export const PokemonSpeciesRankEntries: PokemonSpeciesRankEntryData[] = [
  {
    "id": "abomasnow",
    "species": "Abomasnow",
    "baseSpecies": "Abomasnow",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 578
  },
  {
    "id": "abra",
    "species": "Abra",
    "baseSpecies": "Abra",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "absol",
    "species": "Absol",
    "baseSpecies": "Absol",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 552
  },
  {
    "id": "accelgor",
    "species": "Accelgor",
    "baseSpecies": "Accelgor",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 570
  },
  {
    "id": "aegislash",
    "species": "Aegislash",
    "baseSpecies": "Aegislash",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 614
  },
  {
    "id": "aerodactyl",
    "species": "Aerodactyl",
    "baseSpecies": "Aerodactyl",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 617
  },
  {
    "id": "aggron",
    "species": "Aggron",
    "baseSpecies": "Aggron",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 614
  },
  {
    "id": "aipom",
    "species": "Aipom",
    "baseSpecies": "Aipom",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 315
  },
  {
    "id": "alakazam",
    "species": "Alakazam",
    "baseSpecies": "Alakazam",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 602
  },
  {
    "id": "alcremie",
    "species": "Alcremie",
    "baseSpecies": "Alcremie",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 540
  },
  {
    "id": "alomomola",
    "species": "Alomomola",
    "baseSpecies": "Alomomola",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 554
  },
  {
    "id": "altaria",
    "species": "Altaria",
    "baseSpecies": "Altaria",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 559
  },
  {
    "id": "amaura",
    "species": "Amaura",
    "baseSpecies": "Amaura",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 317
  },
  {
    "id": "ambipom",
    "species": "Ambipom",
    "baseSpecies": "Ambipom",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "amoonguss",
    "species": "Amoonguss",
    "baseSpecies": "Amoonguss",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 560
  },
  {
    "id": "ampharos",
    "species": "Ampharos",
    "baseSpecies": "Ampharos",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 591
  },
  {
    "id": "annihilape",
    "species": "Annihilape",
    "baseSpecies": "Annihilape",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 580
  },
  {
    "id": "anorith",
    "species": "Anorith",
    "baseSpecies": "Anorith",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 310
  },
  {
    "id": "appletun",
    "species": "Appletun",
    "baseSpecies": "Appletun",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 530
  },
  {
    "id": "applin",
    "species": "Applin",
    "baseSpecies": "Applin",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 215
  },
  {
    "id": "araquanid",
    "species": "Araquanid",
    "baseSpecies": "Araquanid",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 556
  },
  {
    "id": "araquanidtotem",
    "species": "Araquanid-Totem",
    "baseSpecies": "Araquanid",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 499
  },
  {
    "id": "arbok",
    "species": "Arbok",
    "baseSpecies": "Arbok",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 523
  },
  {
    "id": "arboliva",
    "species": "Arboliva",
    "baseSpecies": "Arboliva",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "arcanine",
    "species": "Arcanine",
    "baseSpecies": "Arcanine",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 648
  },
  {
    "id": "arcaninehisui",
    "species": "Arcanine-Hisui",
    "baseSpecies": "Arcanine",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 600
  },
  {
    "id": "arceus",
    "species": "Arceus",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusbug",
    "species": "Arceus-Bug",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusdark",
    "species": "Arceus-Dark",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusdragon",
    "species": "Arceus-Dragon",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceuselectric",
    "species": "Arceus-Electric",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusfairy",
    "species": "Arceus-Fairy",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusfighting",
    "species": "Arceus-Fighting",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusfire",
    "species": "Arceus-Fire",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusflying",
    "species": "Arceus-Flying",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusghost",
    "species": "Arceus-Ghost",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusgrass",
    "species": "Arceus-Grass",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusground",
    "species": "Arceus-Ground",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusice",
    "species": "Arceus-Ice",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceuspoison",
    "species": "Arceus-Poison",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceuspsychic",
    "species": "Arceus-Psychic",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceusrock",
    "species": "Arceus-Rock",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceussteel",
    "species": "Arceus-Steel",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "arceuswater",
    "species": "Arceus-Water",
    "baseSpecies": "Arceus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 939
  },
  {
    "id": "archaludon",
    "species": "Archaludon",
    "baseSpecies": "Archaludon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 645
  },
  {
    "id": "archen",
    "species": "Archen",
    "baseSpecies": "Archen",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 356
  },
  {
    "id": "archeops",
    "species": "Archeops",
    "baseSpecies": "Archeops",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 666
  },
  {
    "id": "arctibax",
    "species": "Arctibax",
    "baseSpecies": "Arctibax",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 379
  },
  {
    "id": "arctovish",
    "species": "Arctovish",
    "baseSpecies": "Arctovish",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "arctozolt",
    "species": "Arctozolt",
    "baseSpecies": "Arctozolt",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "ariados",
    "species": "Ariados",
    "baseSpecies": "Ariados",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 469
  },
  {
    "id": "armaldo",
    "species": "Armaldo",
    "baseSpecies": "Armaldo",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 573
  },
  {
    "id": "armarouge",
    "species": "Armarouge",
    "baseSpecies": "Armarouge",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 570
  },
  {
    "id": "aromatisse",
    "species": "Aromatisse",
    "baseSpecies": "Aromatisse",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 534
  },
  {
    "id": "aron",
    "species": "Aron",
    "baseSpecies": "Aron",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "arrokuda",
    "species": "Arrokuda",
    "baseSpecies": "Arrokuda",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "articuno",
    "species": "Articuno",
    "baseSpecies": "Articuno",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 760
  },
  {
    "id": "articunogalar",
    "species": "Articuno-Galar",
    "baseSpecies": "Articuno",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "audino",
    "species": "Audino",
    "baseSpecies": "Audino",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 517
  },
  {
    "id": "aurorus",
    "species": "Aurorus",
    "baseSpecies": "Aurorus",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 602
  },
  {
    "id": "avalugg",
    "species": "Avalugg",
    "baseSpecies": "Avalugg",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 589
  },
  {
    "id": "avalugghisui",
    "species": "Avalugg-Hisui",
    "baseSpecies": "Avalugg",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 559
  },
  {
    "id": "axew",
    "species": "Axew",
    "baseSpecies": "Axew",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "azelf",
    "species": "Azelf",
    "baseSpecies": "Azelf",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 769
  },
  {
    "id": "azumarill",
    "species": "Azumarill",
    "baseSpecies": "Azumarill",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 522
  },
  {
    "id": "azurill",
    "species": "Azurill",
    "baseSpecies": "Azurill",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 145
  },
  {
    "id": "bagon",
    "species": "Bagon",
    "baseSpecies": "Bagon",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "baltoy",
    "species": "Baltoy",
    "baseSpecies": "Baltoy",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "banette",
    "species": "Banette",
    "baseSpecies": "Banette",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 521
  },
  {
    "id": "barbaracle",
    "species": "Barbaracle",
    "baseSpecies": "Barbaracle",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 602
  },
  {
    "id": "barboach",
    "species": "Barboach",
    "baseSpecies": "Barboach",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 243
  },
  {
    "id": "barraskewda",
    "species": "Barraskewda",
    "baseSpecies": "Barraskewda",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "basculegion",
    "species": "Basculegion",
    "baseSpecies": "Basculegion",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "basculegionf",
    "species": "Basculegion-F",
    "baseSpecies": "Basculegion",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "basculin",
    "species": "Basculin",
    "baseSpecies": "Basculin",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 547
  },
  {
    "id": "basculinbluestriped",
    "species": "Basculin-Blue-Striped",
    "baseSpecies": "Basculin",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 505
  },
  {
    "id": "basculinwhitestriped",
    "species": "Basculin-White-Striped",
    "baseSpecies": "Basculin",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 415
  },
  {
    "id": "bastiodon",
    "species": "Bastiodon",
    "baseSpecies": "Bastiodon",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 561
  },
  {
    "id": "baxcalibur",
    "species": "Baxcalibur",
    "baseSpecies": "Baxcalibur",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 645
  },
  {
    "id": "bayleef",
    "species": "Bayleef",
    "baseSpecies": "Bayleef",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "beartic",
    "species": "Beartic",
    "baseSpecies": "Beartic",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 574
  },
  {
    "id": "beautifly",
    "species": "Beautifly",
    "baseSpecies": "Beautifly",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 446
  },
  {
    "id": "beedrill",
    "species": "Beedrill",
    "baseSpecies": "Beedrill",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 458
  },
  {
    "id": "beheeyem",
    "species": "Beheeyem",
    "baseSpecies": "Beheeyem",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 551
  },
  {
    "id": "beldum",
    "species": "Beldum",
    "baseSpecies": "Beldum",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "bellibolt",
    "species": "Bellibolt",
    "baseSpecies": "Bellibolt",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 540
  },
  {
    "id": "bellossom",
    "species": "Bellossom",
    "baseSpecies": "Bellossom",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 571
  },
  {
    "id": "bellsprout",
    "species": "Bellsprout",
    "baseSpecies": "Bellsprout",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "bergmite",
    "species": "Bergmite",
    "baseSpecies": "Bergmite",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 259
  },
  {
    "id": "bewear",
    "species": "Bewear",
    "baseSpecies": "Bewear",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 593
  },
  {
    "id": "bibarel",
    "species": "Bibarel",
    "baseSpecies": "Bibarel",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 485
  },
  {
    "id": "bidoof",
    "species": "Bidoof",
    "baseSpecies": "Bidoof",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 205
  },
  {
    "id": "binacle",
    "species": "Binacle",
    "baseSpecies": "Binacle",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 261
  },
  {
    "id": "bisharp",
    "species": "Bisharp",
    "baseSpecies": "Bisharp",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "blacephalon",
    "species": "Blacephalon",
    "baseSpecies": "Blacephalon",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 675
  },
  {
    "id": "blastoise",
    "species": "Blastoise",
    "baseSpecies": "Blastoise",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 617
  },
  {
    "id": "blaziken",
    "species": "Blaziken",
    "baseSpecies": "Blaziken",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 641
  },
  {
    "id": "blipbug",
    "species": "Blipbug",
    "baseSpecies": "Blipbug",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 135
  },
  {
    "id": "blissey",
    "species": "Blissey",
    "baseSpecies": "Blissey",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 630
  },
  {
    "id": "blitzle",
    "species": "Blitzle",
    "baseSpecies": "Blitzle",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 250
  },
  {
    "id": "boldore",
    "species": "Boldore",
    "baseSpecies": "Boldore",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 345
  },
  {
    "id": "boltund",
    "species": "Boltund",
    "baseSpecies": "Boltund",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "bombirdier",
    "species": "Bombirdier",
    "baseSpecies": "Bombirdier",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 530
  },
  {
    "id": "bonsly",
    "species": "Bonsly",
    "baseSpecies": "Bonsly",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "bouffalant",
    "species": "Bouffalant",
    "baseSpecies": "Bouffalant",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 574
  },
  {
    "id": "bounsweet",
    "species": "Bounsweet",
    "baseSpecies": "Bounsweet",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 165
  },
  {
    "id": "braixen",
    "species": "Braixen",
    "baseSpecies": "Braixen",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 364
  },
  {
    "id": "brambleghast",
    "species": "Brambleghast",
    "baseSpecies": "Brambleghast",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 525
  },
  {
    "id": "bramblin",
    "species": "Bramblin",
    "baseSpecies": "Bramblin",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 230
  },
  {
    "id": "braviary",
    "species": "Braviary",
    "baseSpecies": "Braviary",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 606
  },
  {
    "id": "braviaryhisui",
    "species": "Braviary-Hisui",
    "baseSpecies": "Braviary",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "breloom",
    "species": "Breloom",
    "baseSpecies": "Breloom",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 553
  },
  {
    "id": "brionne",
    "species": "Brionne",
    "baseSpecies": "Brionne",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "bronzong",
    "species": "Bronzong",
    "baseSpecies": "Bronzong",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 587
  },
  {
    "id": "bronzor",
    "species": "Bronzor",
    "baseSpecies": "Bronzor",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "brutebonnet",
    "species": "Brute Bonnet",
    "baseSpecies": "Brute Bonnet",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "bruxish",
    "species": "Bruxish",
    "baseSpecies": "Bruxish",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 565
  },
  {
    "id": "budew",
    "species": "Budew",
    "baseSpecies": "Budew",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "buizel",
    "species": "Buizel",
    "baseSpecies": "Buizel",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "bulbasaur",
    "species": "Bulbasaur",
    "baseSpecies": "Bulbasaur",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 273
  },
  {
    "id": "buneary",
    "species": "Buneary",
    "baseSpecies": "Buneary",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 305
  },
  {
    "id": "bunnelby",
    "species": "Bunnelby",
    "baseSpecies": "Bunnelby",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 192
  },
  {
    "id": "burmy",
    "species": "Burmy",
    "baseSpecies": "Burmy",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 179
  },
  {
    "id": "butterfree",
    "species": "Butterfree",
    "baseSpecies": "Butterfree",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 470
  },
  {
    "id": "buzzwole",
    "species": "Buzzwole",
    "baseSpecies": "Buzzwole",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 678
  },
  {
    "id": "cacnea",
    "species": "Cacnea",
    "baseSpecies": "Cacnea",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "cacturne",
    "species": "Cacturne",
    "baseSpecies": "Cacturne",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 541
  },
  {
    "id": "calyrex",
    "species": "Calyrex",
    "baseSpecies": "Calyrex",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 635
  },
  {
    "id": "calyrexice",
    "species": "Calyrex-Ice",
    "baseSpecies": "Calyrex",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 815
  },
  {
    "id": "calyrexshadow",
    "species": "Calyrex-Shadow",
    "baseSpecies": "Calyrex",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 815
  },
  {
    "id": "camerupt",
    "species": "Camerupt",
    "baseSpecies": "Camerupt",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 532
  },
  {
    "id": "capsakid",
    "species": "Capsakid",
    "baseSpecies": "Capsakid",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 259
  },
  {
    "id": "carbink",
    "species": "Carbink",
    "baseSpecies": "Carbink",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 569
  },
  {
    "id": "carkol",
    "species": "Carkol",
    "baseSpecies": "Carkol",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "carnivine",
    "species": "Carnivine",
    "baseSpecies": "Carnivine",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 499
  },
  {
    "id": "carracosta",
    "species": "Carracosta",
    "baseSpecies": "Carracosta",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 576
  },
  {
    "id": "carvanha",
    "species": "Carvanha",
    "baseSpecies": "Carvanha",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "cascoon",
    "species": "Cascoon",
    "baseSpecies": "Cascoon",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 160
  },
  {
    "id": "castform",
    "species": "Castform",
    "baseSpecies": "Castform",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 468
  },
  {
    "id": "caterpie",
    "species": "Caterpie",
    "baseSpecies": "Caterpie",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 150
  },
  {
    "id": "celebi",
    "species": "Celebi",
    "baseSpecies": "Celebi",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 789
  },
  {
    "id": "celesteela",
    "species": "Celesteela",
    "baseSpecies": "Celesteela",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 681
  },
  {
    "id": "centiskorch",
    "species": "Centiskorch",
    "baseSpecies": "Centiskorch",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 570
  },
  {
    "id": "ceruledge",
    "species": "Ceruledge",
    "baseSpecies": "Ceruledge",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 570
  },
  {
    "id": "cetitan",
    "species": "Cetitan",
    "baseSpecies": "Cetitan",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "cetoddle",
    "species": "Cetoddle",
    "baseSpecies": "Cetoddle",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 289
  },
  {
    "id": "chandelure",
    "species": "Chandelure",
    "baseSpecies": "Chandelure",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 613
  },
  {
    "id": "chansey",
    "species": "Chansey",
    "baseSpecies": "Chansey",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 560
  },
  {
    "id": "charcadet",
    "species": "Charcadet",
    "baseSpecies": "Charcadet",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 210
  },
  {
    "id": "charizard",
    "species": "Charizard",
    "baseSpecies": "Charizard",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 630
  },
  {
    "id": "charjabug",
    "species": "Charjabug",
    "baseSpecies": "Charjabug",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 359
  },
  {
    "id": "charmander",
    "species": "Charmander",
    "baseSpecies": "Charmander",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 264
  },
  {
    "id": "charmeleon",
    "species": "Charmeleon",
    "baseSpecies": "Charmeleon",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "chatot",
    "species": "Chatot",
    "baseSpecies": "Chatot",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 489
  },
  {
    "id": "cherrim",
    "species": "Cherrim",
    "baseSpecies": "Cherrim",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 498
  },
  {
    "id": "cherubi",
    "species": "Cherubi",
    "baseSpecies": "Cherubi",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 230
  },
  {
    "id": "chesnaught",
    "species": "Chesnaught",
    "baseSpecies": "Chesnaught",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 608
  },
  {
    "id": "chespin",
    "species": "Chespin",
    "baseSpecies": "Chespin",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 268
  },
  {
    "id": "chewtle",
    "species": "Chewtle",
    "baseSpecies": "Chewtle",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 239
  },
  {
    "id": "chienpao",
    "species": "Chien-Pao",
    "baseSpecies": "Chien-Pao",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 705
  },
  {
    "id": "chikorita",
    "species": "Chikorita",
    "baseSpecies": "Chikorita",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 273
  },
  {
    "id": "chimchar",
    "species": "Chimchar",
    "baseSpecies": "Chimchar",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 264
  },
  {
    "id": "chimecho",
    "species": "Chimecho",
    "baseSpecies": "Chimecho",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 515
  },
  {
    "id": "chinchou",
    "species": "Chinchou",
    "baseSpecies": "Chinchou",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "chingling",
    "species": "Chingling",
    "baseSpecies": "Chingling",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 240
  },
  {
    "id": "chiyu",
    "species": "Chi-Yu",
    "baseSpecies": "Chi-Yu",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 705
  },
  {
    "id": "cinccino",
    "species": "Cinccino",
    "baseSpecies": "Cinccino",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 563
  },
  {
    "id": "cinderace",
    "species": "Cinderace",
    "baseSpecies": "Cinderace",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "clamperl",
    "species": "Clamperl",
    "baseSpecies": "Clamperl",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 300
  },
  {
    "id": "clauncher",
    "species": "Clauncher",
    "baseSpecies": "Clauncher",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "clawitzer",
    "species": "Clawitzer",
    "baseSpecies": "Clawitzer",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 584
  },
  {
    "id": "claydol",
    "species": "Claydol",
    "baseSpecies": "Claydol",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 578
  },
  {
    "id": "clefable",
    "species": "Clefable",
    "baseSpecies": "Clefable",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 579
  },
  {
    "id": "clefairy",
    "species": "Clefairy",
    "baseSpecies": "Clefairy",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 278
  },
  {
    "id": "cleffa",
    "species": "Cleffa",
    "baseSpecies": "Cleffa",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 173
  },
  {
    "id": "clobbopus",
    "species": "Clobbopus",
    "baseSpecies": "Clobbopus",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "clodsire",
    "species": "Clodsire",
    "baseSpecies": "Clodsire",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 475
  },
  {
    "id": "cloyster",
    "species": "Cloyster",
    "baseSpecies": "Cloyster",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 630
  },
  {
    "id": "coalossal",
    "species": "Coalossal",
    "baseSpecies": "Coalossal",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "cobalion",
    "species": "Cobalion",
    "baseSpecies": "Cobalion",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 781
  },
  {
    "id": "cofagrigus",
    "species": "Cofagrigus",
    "baseSpecies": "Cofagrigus",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 561
  },
  {
    "id": "combee",
    "species": "Combee",
    "baseSpecies": "Combee",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 199
  },
  {
    "id": "combusken",
    "species": "Combusken",
    "baseSpecies": "Combusken",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "comfey",
    "species": "Comfey",
    "baseSpecies": "Comfey",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "conkeldurr",
    "species": "Conkeldurr",
    "baseSpecies": "Conkeldurr",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 607
  },
  {
    "id": "copperajah",
    "species": "Copperajah",
    "baseSpecies": "Copperajah",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 545
  },
  {
    "id": "corphish",
    "species": "Corphish",
    "baseSpecies": "Corphish",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 263
  },
  {
    "id": "corsola",
    "species": "Corsola",
    "baseSpecies": "Corsola",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 467
  },
  {
    "id": "corsolagalar",
    "species": "Corsola-Galar",
    "baseSpecies": "Corsola",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 385
  },
  {
    "id": "corviknight",
    "species": "Corviknight",
    "baseSpecies": "Corviknight",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 540
  },
  {
    "id": "corvisquire",
    "species": "Corvisquire",
    "baseSpecies": "Corvisquire",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 320
  },
  {
    "id": "cosmoem",
    "species": "Cosmoem",
    "baseSpecies": "Cosmoem",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 488
  },
  {
    "id": "cosmog",
    "species": "Cosmog",
    "baseSpecies": "Cosmog",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 245
  },
  {
    "id": "cottonee",
    "species": "Cottonee",
    "baseSpecies": "Cottonee",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "crabominable",
    "species": "Crabominable",
    "baseSpecies": "Crabominable",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "crabrawler",
    "species": "Crabrawler",
    "baseSpecies": "Crabrawler",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 293
  },
  {
    "id": "cradily",
    "species": "Cradily",
    "baseSpecies": "Cradily",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 573
  },
  {
    "id": "cramorant",
    "species": "Cramorant",
    "baseSpecies": "Cramorant",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 520
  },
  {
    "id": "cranidos",
    "species": "Cranidos",
    "baseSpecies": "Cranidos",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 305
  },
  {
    "id": "crawdaunt",
    "species": "Crawdaunt",
    "baseSpecies": "Crawdaunt",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 558
  },
  {
    "id": "cresselia",
    "species": "Cresselia",
    "baseSpecies": "Cresselia",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 769
  },
  {
    "id": "croagunk",
    "species": "Croagunk",
    "baseSpecies": "Croagunk",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "crobat",
    "species": "Crobat",
    "baseSpecies": "Crobat",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 634
  },
  {
    "id": "crocalor",
    "species": "Crocalor",
    "baseSpecies": "Crocalor",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 366
  },
  {
    "id": "croconaw",
    "species": "Croconaw",
    "baseSpecies": "Croconaw",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "crustle",
    "species": "Crustle",
    "baseSpecies": "Crustle",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 584
  },
  {
    "id": "cryogonal",
    "species": "Cryogonal",
    "baseSpecies": "Cryogonal",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 599
  },
  {
    "id": "cubchoo",
    "species": "Cubchoo",
    "baseSpecies": "Cubchoo",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "cubone",
    "species": "Cubone",
    "baseSpecies": "Cubone",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "cufant",
    "species": "Cufant",
    "baseSpecies": "Cufant",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "cursola",
    "species": "Cursola",
    "baseSpecies": "Cursola",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "cutiefly",
    "species": "Cutiefly",
    "baseSpecies": "Cutiefly",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 259
  },
  {
    "id": "cyclizar",
    "species": "Cyclizar",
    "baseSpecies": "Cyclizar",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 546
  },
  {
    "id": "cyndaquil",
    "species": "Cyndaquil",
    "baseSpecies": "Cyndaquil",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 264
  },
  {
    "id": "dachsbun",
    "species": "Dachsbun",
    "baseSpecies": "Dachsbun",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 522
  },
  {
    "id": "darkrai",
    "species": "Darkrai",
    "baseSpecies": "Darkrai",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 810
  },
  {
    "id": "darmanitan",
    "species": "Darmanitan",
    "baseSpecies": "Darmanitan",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 579
  },
  {
    "id": "darmanitangalar",
    "species": "Darmanitan-Galar",
    "baseSpecies": "Darmanitan",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 525
  },
  {
    "id": "dartrix",
    "species": "Dartrix",
    "baseSpecies": "Dartrix",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 377
  },
  {
    "id": "darumaka",
    "species": "Darumaka",
    "baseSpecies": "Darumaka",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 270
  },
  {
    "id": "darumakagalar",
    "species": "Darumaka-Galar",
    "baseSpecies": "Darumaka",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 270
  },
  {
    "id": "decidueye",
    "species": "Decidueye",
    "baseSpecies": "Decidueye",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 614
  },
  {
    "id": "decidueyehisui",
    "species": "Decidueye-Hisui",
    "baseSpecies": "Decidueye",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "dedenne",
    "species": "Dedenne",
    "baseSpecies": "Dedenne",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 503
  },
  {
    "id": "deerling",
    "species": "Deerling",
    "baseSpecies": "Deerling",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "deino",
    "species": "Deino",
    "baseSpecies": "Deino",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "delcatty",
    "species": "Delcatty",
    "baseSpecies": "Delcatty",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 448
  },
  {
    "id": "delibird",
    "species": "Delibird",
    "baseSpecies": "Delibird",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "delphox",
    "species": "Delphox",
    "baseSpecies": "Delphox",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 621
  },
  {
    "id": "deoxys",
    "species": "Deoxys",
    "baseSpecies": "Deoxys",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 810
  },
  {
    "id": "deoxysattack",
    "species": "Deoxys-Attack",
    "baseSpecies": "Deoxys",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 819
  },
  {
    "id": "deoxysdefense",
    "species": "Deoxys-Defense",
    "baseSpecies": "Deoxys",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 780
  },
  {
    "id": "deoxysspeed",
    "species": "Deoxys-Speed",
    "baseSpecies": "Deoxys",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 792
  },
  {
    "id": "dewgong",
    "species": "Dewgong",
    "baseSpecies": "Dewgong",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 532
  },
  {
    "id": "dewott",
    "species": "Dewott",
    "baseSpecies": "Dewott",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 368
  },
  {
    "id": "dewpider",
    "species": "Dewpider",
    "baseSpecies": "Dewpider",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 224
  },
  {
    "id": "dhelmise",
    "species": "Dhelmise",
    "baseSpecies": "Dhelmise",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 589
  },
  {
    "id": "dialga",
    "species": "Dialga",
    "baseSpecies": "Dialga",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 893
  },
  {
    "id": "diancie",
    "species": "Diancie",
    "baseSpecies": "Diancie",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 792
  },
  {
    "id": "diggersby",
    "species": "Diggersby",
    "baseSpecies": "Diggersby",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 522
  },
  {
    "id": "diglett",
    "species": "Diglett",
    "baseSpecies": "Diglett",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 220
  },
  {
    "id": "diglettalola",
    "species": "Diglett-Alola",
    "baseSpecies": "Diglett",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 220
  },
  {
    "id": "dipplin",
    "species": "Dipplin",
    "baseSpecies": "Dipplin",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 465
  },
  {
    "id": "ditto",
    "species": "Ditto",
    "baseSpecies": "Ditto",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 704
  },
  {
    "id": "dodrio",
    "species": "Dodrio",
    "baseSpecies": "Dodrio",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 569
  },
  {
    "id": "doduo",
    "species": "Doduo",
    "baseSpecies": "Doduo",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "dolliv",
    "species": "Dolliv",
    "baseSpecies": "Dolliv",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 309
  },
  {
    "id": "dondozo",
    "species": "Dondozo",
    "baseSpecies": "Dondozo",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "donphan",
    "species": "Donphan",
    "baseSpecies": "Donphan",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 593
  },
  {
    "id": "dottler",
    "species": "Dottler",
    "baseSpecies": "Dottler",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "doublade",
    "species": "Doublade",
    "baseSpecies": "Doublade",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 507
  },
  {
    "id": "dracovish",
    "species": "Dracovish",
    "baseSpecies": "Dracovish",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "dracozolt",
    "species": "Dracozolt",
    "baseSpecies": "Dracozolt",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "dragalge",
    "species": "Dragalge",
    "baseSpecies": "Dragalge",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 578
  },
  {
    "id": "dragapult",
    "species": "Dragapult",
    "baseSpecies": "Dragapult",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 645
  },
  {
    "id": "dragonair",
    "species": "Dragonair",
    "baseSpecies": "Dragonair",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "dragonite",
    "species": "Dragonite",
    "baseSpecies": "Dragonite",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 729
  },
  {
    "id": "drakloak",
    "species": "Drakloak",
    "baseSpecies": "Drakloak",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "drampa",
    "species": "Drampa",
    "baseSpecies": "Drampa",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 557
  },
  {
    "id": "drapion",
    "species": "Drapion",
    "baseSpecies": "Drapion",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 596
  },
  {
    "id": "dratini",
    "species": "Dratini",
    "baseSpecies": "Dratini",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "drednaw",
    "species": "Drednaw",
    "baseSpecies": "Drednaw",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 530
  },
  {
    "id": "dreepy",
    "species": "Dreepy",
    "baseSpecies": "Dreepy",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 225
  },
  {
    "id": "drifblim",
    "species": "Drifblim",
    "baseSpecies": "Drifblim",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 588
  },
  {
    "id": "drifloon",
    "species": "Drifloon",
    "baseSpecies": "Drifloon",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 303
  },
  {
    "id": "drilbur",
    "species": "Drilbur",
    "baseSpecies": "Drilbur",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 283
  },
  {
    "id": "drizzile",
    "species": "Drizzile",
    "baseSpecies": "Drizzile",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "drowzee",
    "species": "Drowzee",
    "baseSpecies": "Drowzee",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 283
  },
  {
    "id": "druddigon",
    "species": "Druddigon",
    "baseSpecies": "Druddigon",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 572
  },
  {
    "id": "dubwool",
    "species": "Dubwool",
    "baseSpecies": "Dubwool",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "ducklett",
    "species": "Ducklett",
    "baseSpecies": "Ducklett",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "dudunsparce",
    "species": "Dudunsparce",
    "baseSpecies": "Dudunsparce",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 565
  },
  {
    "id": "dudunsparcethreesegment",
    "species": "Dudunsparce-Three-Segment",
    "baseSpecies": "Dudunsparce",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 565
  },
  {
    "id": "dugtrio",
    "species": "Dugtrio",
    "baseSpecies": "Dugtrio",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 518
  },
  {
    "id": "dugtrioalola",
    "species": "Dugtrio-Alola",
    "baseSpecies": "Dugtrio",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 518
  },
  {
    "id": "dunsparce",
    "species": "Dunsparce",
    "baseSpecies": "Dunsparce",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 433
  },
  {
    "id": "duosion",
    "species": "Duosion",
    "baseSpecies": "Duosion",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 325
  },
  {
    "id": "duraludon",
    "species": "Duraludon",
    "baseSpecies": "Duraludon",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 498
  },
  {
    "id": "durant",
    "species": "Durant",
    "baseSpecies": "Durant",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 589
  },
  {
    "id": "dusclops",
    "species": "Dusclops",
    "baseSpecies": "Dusclops",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 450
  },
  {
    "id": "dusknoir",
    "species": "Dusknoir",
    "baseSpecies": "Dusknoir",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 603
  },
  {
    "id": "duskull",
    "species": "Duskull",
    "baseSpecies": "Duskull",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 250
  },
  {
    "id": "dustox",
    "species": "Dustox",
    "baseSpecies": "Dustox",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 442
  },
  {
    "id": "dwebble",
    "species": "Dwebble",
    "baseSpecies": "Dwebble",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "eelektrik",
    "species": "Eelektrik",
    "baseSpecies": "Eelektrik",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "eelektross",
    "species": "Eelektross",
    "baseSpecies": "Eelektross",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 596
  },
  {
    "id": "eevee",
    "species": "Eevee",
    "baseSpecies": "Eevee",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "eiscue",
    "species": "Eiscue",
    "baseSpecies": "Eiscue",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 515
  },
  {
    "id": "ekans",
    "species": "Ekans",
    "baseSpecies": "Ekans",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 243
  },
  {
    "id": "eldegoss",
    "species": "Eldegoss",
    "baseSpecies": "Eldegoss",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 505
  },
  {
    "id": "electabuzz",
    "species": "Electabuzz",
    "baseSpecies": "Electabuzz",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 445
  },
  {
    "id": "electivire",
    "species": "Electivire",
    "baseSpecies": "Electivire",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 627
  },
  {
    "id": "electrike",
    "species": "Electrike",
    "baseSpecies": "Electrike",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 250
  },
  {
    "id": "electrode",
    "species": "Electrode",
    "baseSpecies": "Electrode",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 568
  },
  {
    "id": "electrodehisui",
    "species": "Electrode-Hisui",
    "baseSpecies": "Electrode",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "elekid",
    "species": "Elekid",
    "baseSpecies": "Elekid",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 315
  },
  {
    "id": "elgyem",
    "species": "Elgyem",
    "baseSpecies": "Elgyem",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "emboar",
    "species": "Emboar",
    "baseSpecies": "Emboar",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 618
  },
  {
    "id": "emolga",
    "species": "Emolga",
    "baseSpecies": "Emolga",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 503
  },
  {
    "id": "empoleon",
    "species": "Empoleon",
    "baseSpecies": "Empoleon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 626
  },
  {
    "id": "enamorus",
    "species": "Enamorus",
    "baseSpecies": "Enamorus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "enamorustherian",
    "species": "Enamorus-Therian",
    "baseSpecies": "Enamorus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "entei",
    "species": "Entei",
    "baseSpecies": "Entei",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 781
  },
  {
    "id": "escavalier",
    "species": "Escavalier",
    "baseSpecies": "Escavalier",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 585
  },
  {
    "id": "espathra",
    "species": "Espathra",
    "baseSpecies": "Espathra",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 526
  },
  {
    "id": "espeon",
    "species": "Espeon",
    "baseSpecies": "Espeon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 621
  },
  {
    "id": "espurr",
    "species": "Espurr",
    "baseSpecies": "Espurr",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 310
  },
  {
    "id": "eternatus",
    "species": "Eternatus",
    "baseSpecies": "Eternatus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 825
  },
  {
    "id": "eternatuseternamax",
    "species": "Eternatus-Eternamax",
    "baseSpecies": "Eternatus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 1260
  },
  {
    "id": "excadrill",
    "species": "Excadrill",
    "baseSpecies": "Excadrill",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 610
  },
  {
    "id": "exeggcute",
    "species": "Exeggcute",
    "baseSpecies": "Exeggcute",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "exeggutor",
    "species": "Exeggutor",
    "baseSpecies": "Exeggutor",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 605
  },
  {
    "id": "exeggutoralola",
    "species": "Exeggutor-Alola",
    "baseSpecies": "Exeggutor",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 602
  },
  {
    "id": "exploud",
    "species": "Exploud",
    "baseSpecies": "Exploud",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 577
  },
  {
    "id": "falinks",
    "species": "Falinks",
    "baseSpecies": "Falinks",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 515
  },
  {
    "id": "farfetchd",
    "species": "Farfetch’d",
    "baseSpecies": "Farfetch’d",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 422
  },
  {
    "id": "farfetchdgalar",
    "species": "Farfetch’d-Galar",
    "baseSpecies": "Farfetch’d",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 332
  },
  {
    "id": "farigiraf",
    "species": "Farigiraf",
    "baseSpecies": "Farigiraf",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 565
  },
  {
    "id": "fearow",
    "species": "Fearow",
    "baseSpecies": "Fearow",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 523
  },
  {
    "id": "feebas",
    "species": "Feebas",
    "baseSpecies": "Feebas",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 155
  },
  {
    "id": "fennekin",
    "species": "Fennekin",
    "baseSpecies": "Fennekin",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 262
  },
  {
    "id": "feraligatr",
    "species": "Feraligatr",
    "baseSpecies": "Feraligatr",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 638
  },
  {
    "id": "ferroseed",
    "species": "Ferroseed",
    "baseSpecies": "Ferroseed",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 261
  },
  {
    "id": "ferrothorn",
    "species": "Ferrothorn",
    "baseSpecies": "Ferrothorn",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 618
  },
  {
    "id": "fezandipiti",
    "species": "Fezandipiti",
    "baseSpecies": "Fezandipiti",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 690
  },
  {
    "id": "fidough",
    "species": "Fidough",
    "baseSpecies": "Fidough",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 267
  },
  {
    "id": "finizen",
    "species": "Finizen",
    "baseSpecies": "Finizen",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 270
  },
  {
    "id": "finneon",
    "species": "Finneon",
    "baseSpecies": "Finneon",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "flaaffy",
    "species": "Flaaffy",
    "baseSpecies": "Flaaffy",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 320
  },
  {
    "id": "flabebe",
    "species": "Flabébé",
    "baseSpecies": "Flabébé",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 258
  },
  {
    "id": "flamigo",
    "species": "Flamigo",
    "baseSpecies": "Flamigo",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 545
  },
  {
    "id": "flapple",
    "species": "Flapple",
    "baseSpecies": "Flapple",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 530
  },
  {
    "id": "flareon",
    "species": "Flareon",
    "baseSpecies": "Flareon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 606
  },
  {
    "id": "fletchinder",
    "species": "Fletchinder",
    "baseSpecies": "Fletchinder",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 337
  },
  {
    "id": "fletchling",
    "species": "Fletchling",
    "baseSpecies": "Fletchling",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 233
  },
  {
    "id": "flittle",
    "species": "Flittle",
    "baseSpecies": "Flittle",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 210
  },
  {
    "id": "floatzel",
    "species": "Floatzel",
    "baseSpecies": "Floatzel",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 582
  },
  {
    "id": "floette",
    "species": "Floette",
    "baseSpecies": "Floette",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 326
  },
  {
    "id": "floetteeternal",
    "species": "Floette-Eternal",
    "baseSpecies": "Floette",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 647
  },
  {
    "id": "floragato",
    "species": "Floragato",
    "baseSpecies": "Floragato",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "florges",
    "species": "Florges",
    "baseSpecies": "Florges",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 642
  },
  {
    "id": "fluttermane",
    "species": "Flutter Mane",
    "baseSpecies": "Flutter Mane",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "flygon",
    "species": "Flygon",
    "baseSpecies": "Flygon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 619
  },
  {
    "id": "fomantis",
    "species": "Fomantis",
    "baseSpecies": "Fomantis",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 205
  },
  {
    "id": "foongus",
    "species": "Foongus",
    "baseSpecies": "Foongus",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 249
  },
  {
    "id": "forretress",
    "species": "Forretress",
    "baseSpecies": "Forretress",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 567
  },
  {
    "id": "fraxure",
    "species": "Fraxure",
    "baseSpecies": "Fraxure",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "frigibax",
    "species": "Frigibax",
    "baseSpecies": "Frigibax",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "frillish",
    "species": "Frillish",
    "baseSpecies": "Frillish",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "froakie",
    "species": "Froakie",
    "baseSpecies": "Froakie",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 269
  },
  {
    "id": "frogadier",
    "species": "Frogadier",
    "baseSpecies": "Frogadier",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "froslass",
    "species": "Froslass",
    "baseSpecies": "Froslass",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 564
  },
  {
    "id": "frosmoth",
    "species": "Frosmoth",
    "baseSpecies": "Frosmoth",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 520
  },
  {
    "id": "fuecoco",
    "species": "Fuecoco",
    "baseSpecies": "Fuecoco",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "furfrou",
    "species": "Furfrou",
    "baseSpecies": "Furfrou",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 556
  },
  {
    "id": "furret",
    "species": "Furret",
    "baseSpecies": "Furret",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 478
  },
  {
    "id": "gabite",
    "species": "Gabite",
    "baseSpecies": "Gabite",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "gallade",
    "species": "Gallade",
    "baseSpecies": "Gallade",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 611
  },
  {
    "id": "galvantula",
    "species": "Galvantula",
    "baseSpecies": "Galvantula",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 577
  },
  {
    "id": "garbodor",
    "species": "Garbodor",
    "baseSpecies": "Garbodor",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "garchomp",
    "species": "Garchomp",
    "baseSpecies": "Garchomp",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 720
  },
  {
    "id": "gardevoir",
    "species": "Gardevoir",
    "baseSpecies": "Gardevoir",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 614
  },
  {
    "id": "garganacl",
    "species": "Garganacl",
    "baseSpecies": "Garganacl",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 545
  },
  {
    "id": "gastly",
    "species": "Gastly",
    "baseSpecies": "Gastly",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "gastrodon",
    "species": "Gastrodon",
    "baseSpecies": "Gastrodon",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 556
  },
  {
    "id": "genesect",
    "species": "Genesect",
    "baseSpecies": "Genesect",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 816
  },
  {
    "id": "gengar",
    "species": "Gengar",
    "baseSpecies": "Gengar",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 599
  },
  {
    "id": "geodude",
    "species": "Geodude",
    "baseSpecies": "Geodude",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "geodudealola",
    "species": "Geodude-Alola",
    "baseSpecies": "Geodude",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "gholdengo",
    "species": "Gholdengo",
    "baseSpecies": "Gholdengo",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 595
  },
  {
    "id": "gible",
    "species": "Gible",
    "baseSpecies": "Gible",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "gigalith",
    "species": "Gigalith",
    "baseSpecies": "Gigalith",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 614
  },
  {
    "id": "gimmighoul",
    "species": "Gimmighoul",
    "baseSpecies": "Gimmighoul",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "gimmighoulroaming",
    "species": "Gimmighoul-Roaming",
    "baseSpecies": "Gimmighoul",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "girafarig",
    "species": "Girafarig",
    "baseSpecies": "Girafarig",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 465
  },
  {
    "id": "giratina",
    "species": "Giratina",
    "baseSpecies": "Giratina",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 887
  },
  {
    "id": "glaceon",
    "species": "Glaceon",
    "baseSpecies": "Glaceon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 600
  },
  {
    "id": "glalie",
    "species": "Glalie",
    "baseSpecies": "Glalie",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 549
  },
  {
    "id": "glameow",
    "species": "Glameow",
    "baseSpecies": "Glameow",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "glastrier",
    "species": "Glastrier",
    "baseSpecies": "Glastrier",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "gligar",
    "species": "Gligar",
    "baseSpecies": "Gligar",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 487
  },
  {
    "id": "glimmet",
    "species": "Glimmet",
    "baseSpecies": "Glimmet",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 305
  },
  {
    "id": "glimmora",
    "species": "Glimmora",
    "baseSpecies": "Glimmora",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 570
  },
  {
    "id": "gliscor",
    "species": "Gliscor",
    "baseSpecies": "Gliscor",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 621
  },
  {
    "id": "gloom",
    "species": "Gloom",
    "baseSpecies": "Gloom",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 350
  },
  {
    "id": "gogoat",
    "species": "Gogoat",
    "baseSpecies": "Gogoat",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 603
  },
  {
    "id": "golbat",
    "species": "Golbat",
    "baseSpecies": "Golbat",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 410
  },
  {
    "id": "goldeen",
    "species": "Goldeen",
    "baseSpecies": "Goldeen",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "golduck",
    "species": "Golduck",
    "baseSpecies": "Golduck",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 569
  },
  {
    "id": "golem",
    "species": "Golem",
    "baseSpecies": "Golem",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 582
  },
  {
    "id": "golemalola",
    "species": "Golem-Alola",
    "baseSpecies": "Golem",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 570
  },
  {
    "id": "golett",
    "species": "Golett",
    "baseSpecies": "Golett",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 258
  },
  {
    "id": "golisopod",
    "species": "Golisopod",
    "baseSpecies": "Golisopod",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 623
  },
  {
    "id": "golurk",
    "species": "Golurk",
    "baseSpecies": "Golurk",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 567
  },
  {
    "id": "goodra",
    "species": "Goodra",
    "baseSpecies": "Goodra",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 690
  },
  {
    "id": "goodrahisui",
    "species": "Goodra-Hisui",
    "baseSpecies": "Goodra",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 645
  },
  {
    "id": "goomy",
    "species": "Goomy",
    "baseSpecies": "Goomy",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "gorebyss",
    "species": "Gorebyss",
    "baseSpecies": "Gorebyss",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "gossifleur",
    "species": "Gossifleur",
    "baseSpecies": "Gossifleur",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 205
  },
  {
    "id": "gothita",
    "species": "Gothita",
    "baseSpecies": "Gothita",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "gothitelle",
    "species": "Gothitelle",
    "baseSpecies": "Gothitelle",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 562
  },
  {
    "id": "gothorita",
    "species": "Gothorita",
    "baseSpecies": "Gothorita",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 345
  },
  {
    "id": "gougingfire",
    "species": "Gouging Fire",
    "baseSpecies": "Gouging Fire",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 635
  },
  {
    "id": "gourgeist",
    "species": "Gourgeist",
    "baseSpecies": "Gourgeist",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "gourgeistlarge",
    "species": "Gourgeist-Large",
    "baseSpecies": "Gourgeist",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "gourgeistsmall",
    "species": "Gourgeist-Small",
    "baseSpecies": "Gourgeist",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "gourgeistsuper",
    "species": "Gourgeist-Super",
    "baseSpecies": "Gourgeist",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 572
  },
  {
    "id": "grafaiai",
    "species": "Grafaiai",
    "baseSpecies": "Grafaiai",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 530
  },
  {
    "id": "granbull",
    "species": "Granbull",
    "baseSpecies": "Granbull",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 528
  },
  {
    "id": "grapploct",
    "species": "Grapploct",
    "baseSpecies": "Grapploct",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 525
  },
  {
    "id": "graveler",
    "species": "Graveler",
    "baseSpecies": "Graveler",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 345
  },
  {
    "id": "graveleralola",
    "species": "Graveler-Alola",
    "baseSpecies": "Graveler",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 345
  },
  {
    "id": "greattusk",
    "species": "Great Tusk",
    "baseSpecies": "Great Tusk",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "greavard",
    "species": "Greavard",
    "baseSpecies": "Greavard",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "greedent",
    "species": "Greedent",
    "baseSpecies": "Greedent",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 505
  },
  {
    "id": "greninja",
    "species": "Greninja",
    "baseSpecies": "Greninja",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 638
  },
  {
    "id": "greninjabond",
    "species": "Greninja-Bond",
    "baseSpecies": "Greninja",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 638
  },
  {
    "id": "grimer",
    "species": "Grimer",
    "baseSpecies": "Grimer",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "grimeralola",
    "species": "Grimer-Alola",
    "baseSpecies": "Grimer",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "grimmsnarl",
    "species": "Grimmsnarl",
    "baseSpecies": "Grimmsnarl",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "grookey",
    "species": "Grookey",
    "baseSpecies": "Grookey",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "grotle",
    "species": "Grotle",
    "baseSpecies": "Grotle",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 363
  },
  {
    "id": "groudon",
    "species": "Groudon",
    "baseSpecies": "Groudon",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 883
  },
  {
    "id": "grovyle",
    "species": "Grovyle",
    "baseSpecies": "Grovyle",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "growlithe",
    "species": "Growlithe",
    "baseSpecies": "Growlithe",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 305
  },
  {
    "id": "growlithehisui",
    "species": "Growlithe-Hisui",
    "baseSpecies": "Growlithe",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 305
  },
  {
    "id": "grubbin",
    "species": "Grubbin",
    "baseSpecies": "Grubbin",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "grumpig",
    "species": "Grumpig",
    "baseSpecies": "Grumpig",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 536
  },
  {
    "id": "gulpin",
    "species": "Gulpin",
    "baseSpecies": "Gulpin",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 257
  },
  {
    "id": "gumshoos",
    "species": "Gumshoos",
    "baseSpecies": "Gumshoos",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 481
  },
  {
    "id": "gumshoostotem",
    "species": "Gumshoos-Totem",
    "baseSpecies": "Gumshoos",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 463
  },
  {
    "id": "gurdurr",
    "species": "Gurdurr",
    "baseSpecies": "Gurdurr",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 439
  },
  {
    "id": "guzzlord",
    "species": "Guzzlord",
    "baseSpecies": "Guzzlord",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 657
  },
  {
    "id": "gyarados",
    "species": "Gyarados",
    "baseSpecies": "Gyarados",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 666
  },
  {
    "id": "hakamoo",
    "species": "Hakamo-o",
    "baseSpecies": "Hakamo-o",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "happiny",
    "species": "Happiny",
    "baseSpecies": "Happiny",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 175
  },
  {
    "id": "hariyama",
    "species": "Hariyama",
    "baseSpecies": "Hariyama",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 558
  },
  {
    "id": "hatenna",
    "species": "Hatenna",
    "baseSpecies": "Hatenna",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 220
  },
  {
    "id": "hatterene",
    "species": "Hatterene",
    "baseSpecies": "Hatterene",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "hattrem",
    "species": "Hattrem",
    "baseSpecies": "Hattrem",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 325
  },
  {
    "id": "haunter",
    "species": "Haunter",
    "baseSpecies": "Haunter",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "hawlucha",
    "species": "Hawlucha",
    "baseSpecies": "Hawlucha",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 611
  },
  {
    "id": "haxorus",
    "species": "Haxorus",
    "baseSpecies": "Haxorus",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 660
  },
  {
    "id": "heatmor",
    "species": "Heatmor",
    "baseSpecies": "Heatmor",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "heatran",
    "species": "Heatran",
    "baseSpecies": "Heatran",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 795
  },
  {
    "id": "heliolisk",
    "species": "Heliolisk",
    "baseSpecies": "Heliolisk",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 571
  },
  {
    "id": "helioptile",
    "species": "Helioptile",
    "baseSpecies": "Helioptile",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 244
  },
  {
    "id": "heracross",
    "species": "Heracross",
    "baseSpecies": "Heracross",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 599
  },
  {
    "id": "herdier",
    "species": "Herdier",
    "baseSpecies": "Herdier",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 325
  },
  {
    "id": "hippopotas",
    "species": "Hippopotas",
    "baseSpecies": "Hippopotas",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "hippowdon",
    "species": "Hippowdon",
    "baseSpecies": "Hippowdon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 624
  },
  {
    "id": "hitmonchan",
    "species": "Hitmonchan",
    "baseSpecies": "Hitmonchan",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 539
  },
  {
    "id": "hitmonlee",
    "species": "Hitmonlee",
    "baseSpecies": "Hitmonlee",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 542
  },
  {
    "id": "hitmontop",
    "species": "Hitmontop",
    "baseSpecies": "Hitmontop",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 530
  },
  {
    "id": "honchkrow",
    "species": "Honchkrow",
    "baseSpecies": "Honchkrow",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 601
  },
  {
    "id": "honedge",
    "species": "Honedge",
    "baseSpecies": "Honedge",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "hooh",
    "species": "Ho-Oh",
    "baseSpecies": "Ho-Oh",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 899
  },
  {
    "id": "hoopa",
    "species": "Hoopa",
    "baseSpecies": "Hoopa",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 777
  },
  {
    "id": "hoopaunbound",
    "species": "Hoopa-Unbound",
    "baseSpecies": "Hoopa",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 872
  },
  {
    "id": "hoothoot",
    "species": "Hoothoot",
    "baseSpecies": "Hoothoot",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 217
  },
  {
    "id": "hoppip",
    "species": "Hoppip",
    "baseSpecies": "Hoppip",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 205
  },
  {
    "id": "horsea",
    "species": "Horsea",
    "baseSpecies": "Horsea",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 250
  },
  {
    "id": "houndoom",
    "species": "Houndoom",
    "baseSpecies": "Houndoom",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 584
  },
  {
    "id": "houndour",
    "species": "Houndour",
    "baseSpecies": "Houndour",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "houndstone",
    "species": "Houndstone",
    "baseSpecies": "Houndstone",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 533
  },
  {
    "id": "huntail",
    "species": "Huntail",
    "baseSpecies": "Huntail",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "hydrapple",
    "species": "Hydrapple",
    "baseSpecies": "Hydrapple",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 585
  },
  {
    "id": "hydreigon",
    "species": "Hydreigon",
    "baseSpecies": "Hydreigon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 699
  },
  {
    "id": "hypno",
    "species": "Hypno",
    "baseSpecies": "Hypno",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 537
  },
  {
    "id": "igglybuff",
    "species": "Igglybuff",
    "baseSpecies": "Igglybuff",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 165
  },
  {
    "id": "illumise",
    "species": "Illumise",
    "baseSpecies": "Illumise",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 499
  },
  {
    "id": "impidimp",
    "species": "Impidimp",
    "baseSpecies": "Impidimp",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 220
  },
  {
    "id": "incineroar",
    "species": "Incineroar",
    "baseSpecies": "Incineroar",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 629
  },
  {
    "id": "indeedee",
    "species": "Indeedee",
    "baseSpecies": "Indeedee",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 520
  },
  {
    "id": "indeedeef",
    "species": "Indeedee-F",
    "baseSpecies": "Indeedee",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 520
  },
  {
    "id": "infernape",
    "species": "Infernape",
    "baseSpecies": "Infernape",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 636
  },
  {
    "id": "inkay",
    "species": "Inkay",
    "baseSpecies": "Inkay",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 243
  },
  {
    "id": "inteleon",
    "species": "Inteleon",
    "baseSpecies": "Inteleon",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "ironboulder",
    "species": "Iron Boulder",
    "baseSpecies": "Iron Boulder",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 635
  },
  {
    "id": "ironbundle",
    "species": "Iron Bundle",
    "baseSpecies": "Iron Bundle",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "ironcrown",
    "species": "Iron Crown",
    "baseSpecies": "Iron Crown",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 635
  },
  {
    "id": "ironhands",
    "species": "Iron Hands",
    "baseSpecies": "Iron Hands",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "ironjugulis",
    "species": "Iron Jugulis",
    "baseSpecies": "Iron Jugulis",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "ironleaves",
    "species": "Iron Leaves",
    "baseSpecies": "Iron Leaves",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 635
  },
  {
    "id": "ironmoth",
    "species": "Iron Moth",
    "baseSpecies": "Iron Moth",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "ironthorns",
    "species": "Iron Thorns",
    "baseSpecies": "Iron Thorns",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "irontreads",
    "species": "Iron Treads",
    "baseSpecies": "Iron Treads",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "ironvaliant",
    "species": "Iron Valiant",
    "baseSpecies": "Iron Valiant",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 635
  },
  {
    "id": "ivysaur",
    "species": "Ivysaur",
    "baseSpecies": "Ivysaur",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "jangmoo",
    "species": "Jangmo-o",
    "baseSpecies": "Jangmo-o",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "jellicent",
    "species": "Jellicent",
    "baseSpecies": "Jellicent",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 561
  },
  {
    "id": "jigglypuff",
    "species": "Jigglypuff",
    "baseSpecies": "Jigglypuff",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 225
  },
  {
    "id": "jirachi",
    "species": "Jirachi",
    "baseSpecies": "Jirachi",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 807
  },
  {
    "id": "jolteon",
    "species": "Jolteon",
    "baseSpecies": "Jolteon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 627
  },
  {
    "id": "joltik",
    "species": "Joltik",
    "baseSpecies": "Joltik",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 274
  },
  {
    "id": "jumpluff",
    "species": "Jumpluff",
    "baseSpecies": "Jumpluff",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 538
  },
  {
    "id": "jynx",
    "species": "Jynx",
    "baseSpecies": "Jynx",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 533
  },
  {
    "id": "kabuto",
    "species": "Kabuto",
    "baseSpecies": "Kabuto",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 310
  },
  {
    "id": "kabutops",
    "species": "Kabutops",
    "baseSpecies": "Kabutops",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 579
  },
  {
    "id": "kadabra",
    "species": "Kadabra",
    "baseSpecies": "Kadabra",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 355
  },
  {
    "id": "kakuna",
    "species": "Kakuna",
    "baseSpecies": "Kakuna",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 160
  },
  {
    "id": "kangaskhan",
    "species": "Kangaskhan",
    "baseSpecies": "Kangaskhan",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 571
  },
  {
    "id": "karrablast",
    "species": "Karrablast",
    "baseSpecies": "Karrablast",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 270
  },
  {
    "id": "kartana",
    "species": "Kartana",
    "baseSpecies": "Kartana",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 693
  },
  {
    "id": "kecleon",
    "species": "Kecleon",
    "baseSpecies": "Kecleon",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 515
  },
  {
    "id": "keldeo",
    "species": "Keldeo",
    "baseSpecies": "Keldeo",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 775
  },
  {
    "id": "keldeoresolute",
    "species": "Keldeo-Resolute",
    "baseSpecies": "Keldeo",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "kilowattrel",
    "species": "Kilowattrel",
    "baseSpecies": "Kilowattrel",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "kingambit",
    "species": "Kingambit",
    "baseSpecies": "Kingambit",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 595
  },
  {
    "id": "kingdra",
    "species": "Kingdra",
    "baseSpecies": "Kingdra",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 630
  },
  {
    "id": "kingler",
    "species": "Kingler",
    "baseSpecies": "Kingler",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 556
  },
  {
    "id": "kirlia",
    "species": "Kirlia",
    "baseSpecies": "Kirlia",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 233
  },
  {
    "id": "klang",
    "species": "Klang",
    "baseSpecies": "Klang",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 405
  },
  {
    "id": "klawf",
    "species": "Klawf",
    "baseSpecies": "Klawf",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 495
  },
  {
    "id": "kleavor",
    "species": "Kleavor",
    "baseSpecies": "Kleavor",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 545
  },
  {
    "id": "klefki",
    "species": "Klefki",
    "baseSpecies": "Klefki",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "klink",
    "species": "Klink",
    "baseSpecies": "Klink",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "klinklang",
    "species": "Klinklang",
    "baseSpecies": "Klinklang",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 604
  },
  {
    "id": "koffing",
    "species": "Koffing",
    "baseSpecies": "Koffing",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "komala",
    "species": "Komala",
    "baseSpecies": "Komala",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 561
  },
  {
    "id": "kommoo",
    "species": "Kommo-o",
    "baseSpecies": "Kommo-o",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 723
  },
  {
    "id": "kommoototem",
    "species": "Kommo-o-Totem",
    "baseSpecies": "Kommo-o",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 645
  },
  {
    "id": "koraidon",
    "species": "Koraidon",
    "baseSpecies": "Koraidon",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 805
  },
  {
    "id": "krabby",
    "species": "Krabby",
    "baseSpecies": "Krabby",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "kricketot",
    "species": "Kricketot",
    "baseSpecies": "Kricketot",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 149
  },
  {
    "id": "kricketune",
    "species": "Kricketune",
    "baseSpecies": "Kricketune",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 438
  },
  {
    "id": "krokorok",
    "species": "Krokorok",
    "baseSpecies": "Krokorok",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 306
  },
  {
    "id": "krookodile",
    "species": "Krookodile",
    "baseSpecies": "Krookodile",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 627
  },
  {
    "id": "kubfu",
    "species": "Kubfu",
    "baseSpecies": "Kubfu",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 430
  },
  {
    "id": "kyogre",
    "species": "Kyogre",
    "baseSpecies": "Kyogre",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 898
  },
  {
    "id": "kyurem",
    "species": "Kyurem",
    "baseSpecies": "Kyurem",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 858
  },
  {
    "id": "kyuremblack",
    "species": "Kyurem-Black",
    "baseSpecies": "Kyurem",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 904
  },
  {
    "id": "kyuremwhite",
    "species": "Kyurem-White",
    "baseSpecies": "Kyurem",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 910
  },
  {
    "id": "lairon",
    "species": "Lairon",
    "baseSpecies": "Lairon",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 400
  },
  {
    "id": "lampent",
    "species": "Lampent",
    "baseSpecies": "Lampent",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 325
  },
  {
    "id": "landorus",
    "species": "Landorus",
    "baseSpecies": "Landorus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 804
  },
  {
    "id": "landorustherian",
    "species": "Landorus-Therian",
    "baseSpecies": "Landorus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 813
  },
  {
    "id": "lanturn",
    "species": "Lanturn",
    "baseSpecies": "Lanturn",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 538
  },
  {
    "id": "lapras",
    "species": "Lapras",
    "baseSpecies": "Lapras",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 616
  },
  {
    "id": "larvesta",
    "species": "Larvesta",
    "baseSpecies": "Larvesta",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 315
  },
  {
    "id": "larvitar",
    "species": "Larvitar",
    "baseSpecies": "Larvitar",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "latias",
    "species": "Latias",
    "baseSpecies": "Latias",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 798
  },
  {
    "id": "latios",
    "species": "Latios",
    "baseSpecies": "Latios",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 801
  },
  {
    "id": "leafeon",
    "species": "Leafeon",
    "baseSpecies": "Leafeon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 606
  },
  {
    "id": "leavanny",
    "species": "Leavanny",
    "baseSpecies": "Leavanny",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 584
  },
  {
    "id": "lechonk",
    "species": "Lechonk",
    "baseSpecies": "Lechonk",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 209
  },
  {
    "id": "ledian",
    "species": "Ledian",
    "baseSpecies": "Ledian",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 435
  },
  {
    "id": "ledyba",
    "species": "Ledyba",
    "baseSpecies": "Ledyba",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 220
  },
  {
    "id": "lickilicky",
    "species": "Lickilicky",
    "baseSpecies": "Lickilicky",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 593
  },
  {
    "id": "lickitung",
    "species": "Lickitung",
    "baseSpecies": "Lickitung",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 350
  },
  {
    "id": "liepard",
    "species": "Liepard",
    "baseSpecies": "Liepard",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 518
  },
  {
    "id": "lileep",
    "species": "Lileep",
    "baseSpecies": "Lileep",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 315
  },
  {
    "id": "lilligant",
    "species": "Lilligant",
    "baseSpecies": "Lilligant",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 564
  },
  {
    "id": "lilliganthisui",
    "species": "Lilligant-Hisui",
    "baseSpecies": "Lilligant",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 525
  },
  {
    "id": "lillipup",
    "species": "Lillipup",
    "baseSpecies": "Lillipup",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 230
  },
  {
    "id": "linoone",
    "species": "Linoone",
    "baseSpecies": "Linoone",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 522
  },
  {
    "id": "linoonegalar",
    "species": "Linoone-Galar",
    "baseSpecies": "Linoone",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "litleo",
    "species": "Litleo",
    "baseSpecies": "Litleo",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 324
  },
  {
    "id": "litten",
    "species": "Litten",
    "baseSpecies": "Litten",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "litwick",
    "species": "Litwick",
    "baseSpecies": "Litwick",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 230
  },
  {
    "id": "lokix",
    "species": "Lokix",
    "baseSpecies": "Lokix",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 495
  },
  {
    "id": "lombre",
    "species": "Lombre",
    "baseSpecies": "Lombre",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "lopunny",
    "species": "Lopunny",
    "baseSpecies": "Lopunny",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 564
  },
  {
    "id": "lotad",
    "species": "Lotad",
    "baseSpecies": "Lotad",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 175
  },
  {
    "id": "loudred",
    "species": "Loudred",
    "baseSpecies": "Loudred",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 315
  },
  {
    "id": "lucario",
    "species": "Lucario",
    "baseSpecies": "Lucario",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 624
  },
  {
    "id": "ludicolo",
    "species": "Ludicolo",
    "baseSpecies": "Ludicolo",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 558
  },
  {
    "id": "lugia",
    "species": "Lugia",
    "baseSpecies": "Lugia",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 902
  },
  {
    "id": "lumineon",
    "species": "Lumineon",
    "baseSpecies": "Lumineon",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 526
  },
  {
    "id": "lunala",
    "species": "Lunala",
    "baseSpecies": "Lunala",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 899
  },
  {
    "id": "lunatone",
    "species": "Lunatone",
    "baseSpecies": "Lunatone",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 526
  },
  {
    "id": "lurantis",
    "species": "Lurantis",
    "baseSpecies": "Lurantis",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "lurantistotem",
    "species": "Lurantis-Totem",
    "baseSpecies": "Lurantis",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 525
  },
  {
    "id": "luvdisc",
    "species": "Luvdisc",
    "baseSpecies": "Luvdisc",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "luxio",
    "species": "Luxio",
    "baseSpecies": "Luxio",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 318
  },
  {
    "id": "luxray",
    "species": "Luxray",
    "baseSpecies": "Luxray",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 604
  },
  {
    "id": "lycanroc",
    "species": "Lycanroc",
    "baseSpecies": "Lycanroc",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 577
  },
  {
    "id": "lycanrocdusk",
    "species": "Lycanroc-Dusk",
    "baseSpecies": "Lycanroc",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 583
  },
  {
    "id": "lycanrocmidnight",
    "species": "Lycanroc-Midnight",
    "baseSpecies": "Lycanroc",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 574
  },
  {
    "id": "mabosstiff",
    "species": "Mabosstiff",
    "baseSpecies": "Mabosstiff",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "machamp",
    "species": "Machamp",
    "baseSpecies": "Machamp",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 598
  },
  {
    "id": "machoke",
    "species": "Machoke",
    "baseSpecies": "Machoke",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "machop",
    "species": "Machop",
    "baseSpecies": "Machop",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "magby",
    "species": "Magby",
    "baseSpecies": "Magby",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 320
  },
  {
    "id": "magcargo",
    "species": "Magcargo",
    "baseSpecies": "Magcargo",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 487
  },
  {
    "id": "magearna",
    "species": "Magearna",
    "baseSpecies": "Magearna",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 804
  },
  {
    "id": "magearnaoriginal",
    "species": "Magearna-Original",
    "baseSpecies": "Magearna",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 735
  },
  {
    "id": "magikarp",
    "species": "Magikarp",
    "baseSpecies": "Magikarp",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 155
  },
  {
    "id": "magmar",
    "species": "Magmar",
    "baseSpecies": "Magmar",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 450
  },
  {
    "id": "magmortar",
    "species": "Magmortar",
    "baseSpecies": "Magmortar",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 621
  },
  {
    "id": "magnemite",
    "species": "Magnemite",
    "baseSpecies": "Magnemite",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "magneton",
    "species": "Magneton",
    "baseSpecies": "Magneton",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 420
  },
  {
    "id": "magnezone",
    "species": "Magnezone",
    "baseSpecies": "Magnezone",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 628
  },
  {
    "id": "makuhita",
    "species": "Makuhita",
    "baseSpecies": "Makuhita",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 192
  },
  {
    "id": "malamar",
    "species": "Malamar",
    "baseSpecies": "Malamar",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 587
  },
  {
    "id": "mamoswine",
    "species": "Mamoswine",
    "baseSpecies": "Mamoswine",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 638
  },
  {
    "id": "manaphy",
    "species": "Manaphy",
    "baseSpecies": "Manaphy",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 804
  },
  {
    "id": "mandibuzz",
    "species": "Mandibuzz",
    "baseSpecies": "Mandibuzz",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 603
  },
  {
    "id": "manectric",
    "species": "Manectric",
    "baseSpecies": "Manectric",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 568
  },
  {
    "id": "mankey",
    "species": "Mankey",
    "baseSpecies": "Mankey",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "mantine",
    "species": "Mantine",
    "baseSpecies": "Mantine",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 569
  },
  {
    "id": "mantyke",
    "species": "Mantyke",
    "baseSpecies": "Mantyke",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 300
  },
  {
    "id": "maractus",
    "species": "Maractus",
    "baseSpecies": "Maractus",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 506
  },
  {
    "id": "mareanie",
    "species": "Mareanie",
    "baseSpecies": "Mareanie",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "mareep",
    "species": "Mareep",
    "baseSpecies": "Mareep",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "marill",
    "species": "Marill",
    "baseSpecies": "Marill",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 205
  },
  {
    "id": "marowak",
    "species": "Marowak",
    "baseSpecies": "Marowak",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 503
  },
  {
    "id": "marowakalola",
    "species": "Marowak-Alola",
    "baseSpecies": "Marowak",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 512
  },
  {
    "id": "marowakalolatotem",
    "species": "Marowak-Alola-Totem",
    "baseSpecies": "Marowak",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 470
  },
  {
    "id": "marshadow",
    "species": "Marshadow",
    "baseSpecies": "Marshadow",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 828
  },
  {
    "id": "marshtomp",
    "species": "Marshtomp",
    "baseSpecies": "Marshtomp",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "maschiff",
    "species": "Maschiff",
    "baseSpecies": "Maschiff",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "masquerain",
    "species": "Masquerain",
    "baseSpecies": "Masquerain",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 538
  },
  {
    "id": "maushold",
    "species": "Maushold",
    "baseSpecies": "Maushold",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 515
  },
  {
    "id": "mausholdfour",
    "species": "Maushold-Four",
    "baseSpecies": "Maushold",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 515
  },
  {
    "id": "mawile",
    "species": "Mawile",
    "baseSpecies": "Mawile",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 455
  },
  {
    "id": "medicham",
    "species": "Medicham",
    "baseSpecies": "Medicham",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 500
  },
  {
    "id": "meditite",
    "species": "Meditite",
    "baseSpecies": "Meditite",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "meganium",
    "species": "Meganium",
    "baseSpecies": "Meganium",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 594
  },
  {
    "id": "melmetal",
    "species": "Melmetal",
    "baseSpecies": "Melmetal",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 735
  },
  {
    "id": "meloetta",
    "species": "Meloetta",
    "baseSpecies": "Meloetta",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 792
  },
  {
    "id": "meltan",
    "species": "Meltan",
    "baseSpecies": "Meltan",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 435
  },
  {
    "id": "meowscarada",
    "species": "Meowscarada",
    "baseSpecies": "Meowscarada",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "meowstic",
    "species": "Meowstic",
    "baseSpecies": "Meowstic",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 538
  },
  {
    "id": "meowsticf",
    "species": "Meowstic-F",
    "baseSpecies": "Meowstic",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 538
  },
  {
    "id": "meowth",
    "species": "Meowth",
    "baseSpecies": "Meowth",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "meowthalola",
    "species": "Meowth-Alola",
    "baseSpecies": "Meowth",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "meowthgalar",
    "species": "Meowth-Galar",
    "baseSpecies": "Meowth",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "mesprit",
    "species": "Mesprit",
    "baseSpecies": "Mesprit",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 757
  },
  {
    "id": "metagross",
    "species": "Metagross",
    "baseSpecies": "Metagross",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 708
  },
  {
    "id": "metang",
    "species": "Metang",
    "baseSpecies": "Metang",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 385
  },
  {
    "id": "metapod",
    "species": "Metapod",
    "baseSpecies": "Metapod",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 160
  },
  {
    "id": "mew",
    "species": "Mew",
    "baseSpecies": "Mew",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 795
  },
  {
    "id": "mewtwo",
    "species": "Mewtwo",
    "baseSpecies": "Mewtwo",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 899
  },
  {
    "id": "mienfoo",
    "species": "Mienfoo",
    "baseSpecies": "Mienfoo",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 305
  },
  {
    "id": "mienshao",
    "species": "Mienshao",
    "baseSpecies": "Mienshao",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 606
  },
  {
    "id": "mightyena",
    "species": "Mightyena",
    "baseSpecies": "Mightyena",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 483
  },
  {
    "id": "milcery",
    "species": "Milcery",
    "baseSpecies": "Milcery",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 225
  },
  {
    "id": "milotic",
    "species": "Milotic",
    "baseSpecies": "Milotic",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 633
  },
  {
    "id": "miltank",
    "species": "Miltank",
    "baseSpecies": "Miltank",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 580
  },
  {
    "id": "mimejr",
    "species": "Mime Jr.",
    "baseSpecies": "Mime Jr.",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "mimikyu",
    "species": "Mimikyu",
    "baseSpecies": "Mimikyu",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 602
  },
  {
    "id": "mimikyutotem",
    "species": "Mimikyu-Totem",
    "baseSpecies": "Mimikyu",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 521
  },
  {
    "id": "minccino",
    "species": "Minccino",
    "baseSpecies": "Minccino",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "minior",
    "species": "Minior",
    "baseSpecies": "Minior",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 608
  },
  {
    "id": "minun",
    "species": "Minun",
    "baseSpecies": "Minun",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 465
  },
  {
    "id": "miraidon",
    "species": "Miraidon",
    "baseSpecies": "Miraidon",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 805
  },
  {
    "id": "misdreavus",
    "species": "Misdreavus",
    "baseSpecies": "Misdreavus",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 390
  },
  {
    "id": "mismagius",
    "species": "Mismagius",
    "baseSpecies": "Mismagius",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 579
  },
  {
    "id": "moltres",
    "species": "Moltres",
    "baseSpecies": "Moltres",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 769
  },
  {
    "id": "moltresgalar",
    "species": "Moltres-Galar",
    "baseSpecies": "Moltres",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "monferno",
    "species": "Monferno",
    "baseSpecies": "Monferno",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "morelull",
    "species": "Morelull",
    "baseSpecies": "Morelull",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 240
  },
  {
    "id": "morgrem",
    "species": "Morgrem",
    "baseSpecies": "Morgrem",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 325
  },
  {
    "id": "morpeko",
    "species": "Morpeko",
    "baseSpecies": "Morpeko",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 481
  },
  {
    "id": "mothim",
    "species": "Mothim",
    "baseSpecies": "Mothim",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 490
  },
  {
    "id": "mrmime",
    "species": "Mr. Mime",
    "baseSpecies": "Mr. Mime",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "mrmimegalar",
    "species": "Mr. Mime-Galar",
    "baseSpecies": "Mr. Mime",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 415
  },
  {
    "id": "mrrime",
    "species": "Mr. Rime",
    "baseSpecies": "Mr. Rime",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 565
  },
  {
    "id": "mudbray",
    "species": "Mudbray",
    "baseSpecies": "Mudbray",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 340
  },
  {
    "id": "mudkip",
    "species": "Mudkip",
    "baseSpecies": "Mudkip",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "mudsdale",
    "species": "Mudsdale",
    "baseSpecies": "Mudsdale",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 596
  },
  {
    "id": "muk",
    "species": "Muk",
    "baseSpecies": "Muk",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 581
  },
  {
    "id": "mukalola",
    "species": "Muk-Alola",
    "baseSpecies": "Muk",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 605
  },
  {
    "id": "munchlax",
    "species": "Munchlax",
    "baseSpecies": "Munchlax",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "munkidori",
    "species": "Munkidori",
    "baseSpecies": "Munkidori",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 690
  },
  {
    "id": "munna",
    "species": "Munna",
    "baseSpecies": "Munna",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 247
  },
  {
    "id": "murkrow",
    "species": "Murkrow",
    "baseSpecies": "Murkrow",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "musharna",
    "species": "Musharna",
    "baseSpecies": "Musharna",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 565
  },
  {
    "id": "nacli",
    "species": "Nacli",
    "baseSpecies": "Nacli",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "naclstack",
    "species": "Naclstack",
    "baseSpecies": "Naclstack",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 313
  },
  {
    "id": "naganadel",
    "species": "Naganadel",
    "baseSpecies": "Naganadel",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 663
  },
  {
    "id": "natu",
    "species": "Natu",
    "baseSpecies": "Natu",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "necrozma",
    "species": "Necrozma",
    "baseSpecies": "Necrozma",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 792
  },
  {
    "id": "necrozmadawnwings",
    "species": "Necrozma-Dawn-Wings",
    "baseSpecies": "Necrozma",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 902
  },
  {
    "id": "necrozmaduskmane",
    "species": "Necrozma-Dusk-Mane",
    "baseSpecies": "Necrozma",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 908
  },
  {
    "id": "nickit",
    "species": "Nickit",
    "baseSpecies": "Nickit",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 200
  },
  {
    "id": "nidoking",
    "species": "Nidoking",
    "baseSpecies": "Nidoking",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 604
  },
  {
    "id": "nidoqueen",
    "species": "Nidoqueen",
    "baseSpecies": "Nidoqueen",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 601
  },
  {
    "id": "nidoranf",
    "species": "Nidoran-F",
    "baseSpecies": "Nidoran-F",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 230
  },
  {
    "id": "nidoranm",
    "species": "Nidoran-M",
    "baseSpecies": "Nidoran-M",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 228
  },
  {
    "id": "nidorina",
    "species": "Nidorina",
    "baseSpecies": "Nidorina",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 320
  },
  {
    "id": "nidorino",
    "species": "Nidorino",
    "baseSpecies": "Nidorino",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 320
  },
  {
    "id": "nihilego",
    "species": "Nihilego",
    "baseSpecies": "Nihilego",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 678
  },
  {
    "id": "nincada",
    "species": "Nincada",
    "baseSpecies": "Nincada",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 221
  },
  {
    "id": "ninetales",
    "species": "Ninetales",
    "baseSpecies": "Ninetales",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 598
  },
  {
    "id": "ninetalesalola",
    "species": "Ninetales-Alola",
    "baseSpecies": "Ninetales",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 616
  },
  {
    "id": "ninjask",
    "species": "Ninjask",
    "baseSpecies": "Ninjask",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 537
  },
  {
    "id": "noctowl",
    "species": "Noctowl",
    "baseSpecies": "Noctowl",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 515
  },
  {
    "id": "noibat",
    "species": "Noibat",
    "baseSpecies": "Noibat",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 200
  },
  {
    "id": "noivern",
    "species": "Noivern",
    "baseSpecies": "Noivern",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 631
  },
  {
    "id": "nosepass",
    "species": "Nosepass",
    "baseSpecies": "Nosepass",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 348
  },
  {
    "id": "numel",
    "species": "Numel",
    "baseSpecies": "Numel",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "nuzleaf",
    "species": "Nuzleaf",
    "baseSpecies": "Nuzleaf",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "nymble",
    "species": "Nymble",
    "baseSpecies": "Nymble",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 165
  },
  {
    "id": "obstagoon",
    "species": "Obstagoon",
    "baseSpecies": "Obstagoon",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 565
  },
  {
    "id": "octillery",
    "species": "Octillery",
    "baseSpecies": "Octillery",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 537
  },
  {
    "id": "oddish",
    "species": "Oddish",
    "baseSpecies": "Oddish",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "ogerpon",
    "species": "Ogerpon",
    "baseSpecies": "Ogerpon",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 685
  },
  {
    "id": "oinkologne",
    "species": "Oinkologne",
    "baseSpecies": "Oinkologne",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 534
  },
  {
    "id": "oinkolognef",
    "species": "Oinkologne-F",
    "baseSpecies": "Oinkologne",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 534
  },
  {
    "id": "okidogi",
    "species": "Okidogi",
    "baseSpecies": "Okidogi",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 690
  },
  {
    "id": "omanyte",
    "species": "Omanyte",
    "baseSpecies": "Omanyte",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 310
  },
  {
    "id": "omastar",
    "species": "Omastar",
    "baseSpecies": "Omastar",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 588
  },
  {
    "id": "onix",
    "species": "Onix",
    "baseSpecies": "Onix",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 350
  },
  {
    "id": "oranguru",
    "species": "Oranguru",
    "baseSpecies": "Oranguru",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 556
  },
  {
    "id": "orbeetle",
    "species": "Orbeetle",
    "baseSpecies": "Orbeetle",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "oricorio",
    "species": "Oricorio",
    "baseSpecies": "Oricorio",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 551
  },
  {
    "id": "oricoriopau",
    "species": "Oricorio-Pa'u",
    "baseSpecies": "Oricorio",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 548
  },
  {
    "id": "oricoriopompom",
    "species": "Oricorio-Pom-Pom",
    "baseSpecies": "Oricorio",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 563
  },
  {
    "id": "oricoriosensu",
    "species": "Oricorio-Sensu",
    "baseSpecies": "Oricorio",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 554
  },
  {
    "id": "orthworm",
    "species": "Orthworm",
    "baseSpecies": "Orthworm",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 525
  },
  {
    "id": "oshawott",
    "species": "Oshawott",
    "baseSpecies": "Oshawott",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 263
  },
  {
    "id": "overqwil",
    "species": "Overqwil",
    "baseSpecies": "Overqwil",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "pachirisu",
    "species": "Pachirisu",
    "baseSpecies": "Pachirisu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 462
  },
  {
    "id": "palafin",
    "species": "Palafin",
    "baseSpecies": "Palafin",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 502
  },
  {
    "id": "palkia",
    "species": "Palkia",
    "baseSpecies": "Palkia",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 890
  },
  {
    "id": "palossand",
    "species": "Palossand",
    "baseSpecies": "Palossand",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 558
  },
  {
    "id": "palpitoad",
    "species": "Palpitoad",
    "baseSpecies": "Palpitoad",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 339
  },
  {
    "id": "pancham",
    "species": "Pancham",
    "baseSpecies": "Pancham",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 303
  },
  {
    "id": "pangoro",
    "species": "Pangoro",
    "baseSpecies": "Pangoro",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 582
  },
  {
    "id": "panpour",
    "species": "Panpour",
    "baseSpecies": "Panpour",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 271
  },
  {
    "id": "pansage",
    "species": "Pansage",
    "baseSpecies": "Pansage",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 271
  },
  {
    "id": "pansear",
    "species": "Pansear",
    "baseSpecies": "Pansear",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 271
  },
  {
    "id": "paras",
    "species": "Paras",
    "baseSpecies": "Paras",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 240
  },
  {
    "id": "parasect",
    "species": "Parasect",
    "baseSpecies": "Parasect",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 453
  },
  {
    "id": "passimian",
    "species": "Passimian",
    "baseSpecies": "Passimian",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 583
  },
  {
    "id": "patrat",
    "species": "Patrat",
    "baseSpecies": "Patrat",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 210
  },
  {
    "id": "pawmi",
    "species": "Pawmi",
    "baseSpecies": "Pawmi",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 195
  },
  {
    "id": "pawmo",
    "species": "Pawmo",
    "baseSpecies": "Pawmo",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 305
  },
  {
    "id": "pawmot",
    "species": "Pawmot",
    "baseSpecies": "Pawmot",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "pawniard",
    "species": "Pawniard",
    "baseSpecies": "Pawniard",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "pecharunt",
    "species": "Pecharunt",
    "baseSpecies": "Pecharunt",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 735
  },
  {
    "id": "pelipper",
    "species": "Pelipper",
    "baseSpecies": "Pelipper",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 524
  },
  {
    "id": "perrserker",
    "species": "Perrserker",
    "baseSpecies": "Perrserker",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 485
  },
  {
    "id": "persian",
    "species": "Persian",
    "baseSpecies": "Persian",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 506
  },
  {
    "id": "persianalola",
    "species": "Persian-Alola",
    "baseSpecies": "Persian",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 533
  },
  {
    "id": "petilil",
    "species": "Petilil",
    "baseSpecies": "Petilil",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "phanpy",
    "species": "Phanpy",
    "baseSpecies": "Phanpy",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "phantump",
    "species": "Phantump",
    "baseSpecies": "Phantump",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 264
  },
  {
    "id": "pheromosa",
    "species": "Pheromosa",
    "baseSpecies": "Pheromosa",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 690
  },
  {
    "id": "phione",
    "species": "Phione",
    "baseSpecies": "Phione",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 636
  },
  {
    "id": "pichu",
    "species": "Pichu",
    "baseSpecies": "Pichu",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 160
  },
  {
    "id": "pichuspikyeared",
    "species": "Pichu-Spiky-eared",
    "baseSpecies": "Pichu",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 250
  },
  {
    "id": "pidgeot",
    "species": "Pidgeot",
    "baseSpecies": "Pidgeot",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 554
  },
  {
    "id": "pidgeotto",
    "species": "Pidgeotto",
    "baseSpecies": "Pidgeotto",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 304
  },
  {
    "id": "pidgey",
    "species": "Pidgey",
    "baseSpecies": "Pidgey",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 206
  },
  {
    "id": "pidove",
    "species": "Pidove",
    "baseSpecies": "Pidove",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 219
  },
  {
    "id": "pignite",
    "species": "Pignite",
    "baseSpecies": "Pignite",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 373
  },
  {
    "id": "pikachu",
    "species": "Pikachu",
    "baseSpecies": "Pikachu",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 296
  },
  {
    "id": "pikachualola",
    "species": "Pikachu-Alola",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachubelle",
    "species": "Pikachu-Belle",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachucosplay",
    "species": "Pikachu-Cosplay",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachuhoenn",
    "species": "Pikachu-Hoenn",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachukalos",
    "species": "Pikachu-Kalos",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachulibre",
    "species": "Pikachu-Libre",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachuoriginal",
    "species": "Pikachu-Original",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachupartner",
    "species": "Pikachu-Partner",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachuphd",
    "species": "Pikachu-PhD",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachupopstar",
    "species": "Pikachu-Pop-Star",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachurockstar",
    "species": "Pikachu-Rock-Star",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachusinnoh",
    "species": "Pikachu-Sinnoh",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachuunova",
    "species": "Pikachu-Unova",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikachuworld",
    "species": "Pikachu-World",
    "baseSpecies": "Pikachu",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "pikipek",
    "species": "Pikipek",
    "baseSpecies": "Pikipek",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 220
  },
  {
    "id": "piloswine",
    "species": "Piloswine",
    "baseSpecies": "Piloswine",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 415
  },
  {
    "id": "pincurchin",
    "species": "Pincurchin",
    "baseSpecies": "Pincurchin",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 480
  },
  {
    "id": "pineco",
    "species": "Pineco",
    "baseSpecies": "Pineco",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "pinsir",
    "species": "Pinsir",
    "baseSpecies": "Pinsir",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 590
  },
  {
    "id": "piplup",
    "species": "Piplup",
    "baseSpecies": "Piplup",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 269
  },
  {
    "id": "plusle",
    "species": "Plusle",
    "baseSpecies": "Plusle",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 465
  },
  {
    "id": "poipole",
    "species": "Poipole",
    "baseSpecies": "Poipole",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "politoed",
    "species": "Politoed",
    "baseSpecies": "Politoed",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 581
  },
  {
    "id": "poliwag",
    "species": "Poliwag",
    "baseSpecies": "Poliwag",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "poliwhirl",
    "species": "Poliwhirl",
    "baseSpecies": "Poliwhirl",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 340
  },
  {
    "id": "poliwrath",
    "species": "Poliwrath",
    "baseSpecies": "Poliwrath",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 582
  },
  {
    "id": "poltchageist",
    "species": "Poltchageist",
    "baseSpecies": "Poltchageist",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 263
  },
  {
    "id": "poltchageistartisan",
    "species": "Poltchageist-Artisan",
    "baseSpecies": "Poltchageist",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 263
  },
  {
    "id": "polteageist",
    "species": "Polteageist",
    "baseSpecies": "Polteageist",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 553
  },
  {
    "id": "polteageistantique",
    "species": "Polteageist-Antique",
    "baseSpecies": "Polteageist",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 553
  },
  {
    "id": "ponyta",
    "species": "Ponyta",
    "baseSpecies": "Ponyta",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "ponytagalar",
    "species": "Ponyta-Galar",
    "baseSpecies": "Ponyta",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "poochyena",
    "species": "Poochyena",
    "baseSpecies": "Poochyena",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 175
  },
  {
    "id": "popplio",
    "species": "Popplio",
    "baseSpecies": "Popplio",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "porygon",
    "species": "Porygon",
    "baseSpecies": "Porygon",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 350
  },
  {
    "id": "porygon2",
    "species": "Porygon2",
    "baseSpecies": "Porygon2",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 589
  },
  {
    "id": "porygonz",
    "species": "Porygon-Z",
    "baseSpecies": "Porygon-Z",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 640
  },
  {
    "id": "primarina",
    "species": "Primarina",
    "baseSpecies": "Primarina",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 626
  },
  {
    "id": "primeape",
    "species": "Primeape",
    "baseSpecies": "Primeape",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 483
  },
  {
    "id": "prinplup",
    "species": "Prinplup",
    "baseSpecies": "Prinplup",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "probopass",
    "species": "Probopass",
    "baseSpecies": "Probopass",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 594
  },
  {
    "id": "psyduck",
    "species": "Psyduck",
    "baseSpecies": "Psyduck",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "pumpkaboo",
    "species": "Pumpkaboo",
    "baseSpecies": "Pumpkaboo",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "pumpkaboolarge",
    "species": "Pumpkaboo-Large",
    "baseSpecies": "Pumpkaboo",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "pumpkaboosmall",
    "species": "Pumpkaboo-Small",
    "baseSpecies": "Pumpkaboo",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "pumpkaboosuper",
    "species": "Pumpkaboo-Super",
    "baseSpecies": "Pumpkaboo",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "pupitar",
    "species": "Pupitar",
    "baseSpecies": "Pupitar",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "purrloin",
    "species": "Purrloin",
    "baseSpecies": "Purrloin",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 236
  },
  {
    "id": "purugly",
    "species": "Purugly",
    "baseSpecies": "Purugly",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 530
  },
  {
    "id": "pyroar",
    "species": "Pyroar",
    "baseSpecies": "Pyroar",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 588
  },
  {
    "id": "pyukumuku",
    "species": "Pyukumuku",
    "baseSpecies": "Pyukumuku",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 479
  },
  {
    "id": "quagsire",
    "species": "Quagsire",
    "baseSpecies": "Quagsire",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 514
  },
  {
    "id": "quaquaval",
    "species": "Quaquaval",
    "baseSpecies": "Quaquaval",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "quaxly",
    "species": "Quaxly",
    "baseSpecies": "Quaxly",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "quaxwell",
    "species": "Quaxwell",
    "baseSpecies": "Quaxwell",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 365
  },
  {
    "id": "quilava",
    "species": "Quilava",
    "baseSpecies": "Quilava",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "quilladin",
    "species": "Quilladin",
    "baseSpecies": "Quilladin",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "qwilfish",
    "species": "Qwilfish",
    "baseSpecies": "Qwilfish",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 527
  },
  {
    "id": "qwilfishhisui",
    "species": "Qwilfish-Hisui",
    "baseSpecies": "Qwilfish",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 395
  },
  {
    "id": "raboot",
    "species": "Raboot",
    "baseSpecies": "Raboot",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "rabsca",
    "species": "Rabsca",
    "baseSpecies": "Rabsca",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 515
  },
  {
    "id": "ragingbolt",
    "species": "Raging Bolt",
    "baseSpecies": "Raging Bolt",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 635
  },
  {
    "id": "raichu",
    "species": "Raichu",
    "baseSpecies": "Raichu",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "raichualola",
    "species": "Raichu-Alola",
    "baseSpecies": "Raichu",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 572
  },
  {
    "id": "raikou",
    "species": "Raikou",
    "baseSpecies": "Raikou",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 772
  },
  {
    "id": "ralts",
    "species": "Ralts",
    "baseSpecies": "Ralts",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 153
  },
  {
    "id": "rampardos",
    "species": "Rampardos",
    "baseSpecies": "Rampardos",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 576
  },
  {
    "id": "rapidash",
    "species": "Rapidash",
    "baseSpecies": "Rapidash",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 584
  },
  {
    "id": "rapidashgalar",
    "species": "Rapidash-Galar",
    "baseSpecies": "Rapidash",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 545
  },
  {
    "id": "raticate",
    "species": "Raticate",
    "baseSpecies": "Raticate",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 494
  },
  {
    "id": "raticatealola",
    "species": "Raticate-Alola",
    "baseSpecies": "Raticate",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 491
  },
  {
    "id": "raticatealolatotem",
    "species": "Raticate-Alola-Totem",
    "baseSpecies": "Raticate",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 458
  },
  {
    "id": "rattata",
    "species": "Rattata",
    "baseSpecies": "Rattata",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 208
  },
  {
    "id": "rattataalola",
    "species": "Rattata-Alola",
    "baseSpecies": "Rattata",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 208
  },
  {
    "id": "rayquaza",
    "species": "Rayquaza",
    "baseSpecies": "Rayquaza",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 908
  },
  {
    "id": "regice",
    "species": "Regice",
    "baseSpecies": "Regice",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 754
  },
  {
    "id": "regidrago",
    "species": "Regidrago",
    "baseSpecies": "Regidrago",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "regieleki",
    "species": "Regieleki",
    "baseSpecies": "Regieleki",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "regigigas",
    "species": "Regigigas",
    "baseSpecies": "Regigigas",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 847
  },
  {
    "id": "regirock",
    "species": "Regirock",
    "baseSpecies": "Regirock",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 754
  },
  {
    "id": "registeel",
    "species": "Registeel",
    "baseSpecies": "Registeel",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 766
  },
  {
    "id": "relicanth",
    "species": "Relicanth",
    "baseSpecies": "Relicanth",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "rellor",
    "species": "Rellor",
    "baseSpecies": "Rellor",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 225
  },
  {
    "id": "remoraid",
    "species": "Remoraid",
    "baseSpecies": "Remoraid",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "reshiram",
    "species": "Reshiram",
    "baseSpecies": "Reshiram",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 890
  },
  {
    "id": "reuniclus",
    "species": "Reuniclus",
    "baseSpecies": "Reuniclus",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 574
  },
  {
    "id": "revavroom",
    "species": "Revavroom",
    "baseSpecies": "Revavroom",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 545
  },
  {
    "id": "rhydon",
    "species": "Rhydon",
    "baseSpecies": "Rhydon",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "rhyhorn",
    "species": "Rhyhorn",
    "baseSpecies": "Rhyhorn",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 300
  },
  {
    "id": "rhyperior",
    "species": "Rhyperior",
    "baseSpecies": "Rhyperior",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 628
  },
  {
    "id": "ribombee",
    "species": "Ribombee",
    "baseSpecies": "Ribombee",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 557
  },
  {
    "id": "ribombeetotem",
    "species": "Ribombee-Totem",
    "baseSpecies": "Ribombee",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 509
  },
  {
    "id": "rillaboom",
    "species": "Rillaboom",
    "baseSpecies": "Rillaboom",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "riolu",
    "species": "Riolu",
    "baseSpecies": "Riolu",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 240
  },
  {
    "id": "roaringmoon",
    "species": "Roaring Moon",
    "baseSpecies": "Roaring Moon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 635
  },
  {
    "id": "rockruff",
    "species": "Rockruff",
    "baseSpecies": "Rockruff",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "rockruffdusk",
    "species": "Rockruff-Dusk",
    "baseSpecies": "Rockruff",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "roggenrola",
    "species": "Roggenrola",
    "baseSpecies": "Roggenrola",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "rolycoly",
    "species": "Rolycoly",
    "baseSpecies": "Rolycoly",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 195
  },
  {
    "id": "rookidee",
    "species": "Rookidee",
    "baseSpecies": "Rookidee",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 200
  },
  {
    "id": "roselia",
    "species": "Roselia",
    "baseSpecies": "Roselia",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 355
  },
  {
    "id": "roserade",
    "species": "Roserade",
    "baseSpecies": "Roserade",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 608
  },
  {
    "id": "rotom",
    "species": "Rotom",
    "baseSpecies": "Rotom",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 521
  },
  {
    "id": "rotomfan",
    "species": "Rotom-Fan",
    "baseSpecies": "Rotom",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 613
  },
  {
    "id": "rotomfrost",
    "species": "Rotom-Frost",
    "baseSpecies": "Rotom",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 610
  },
  {
    "id": "rotomheat",
    "species": "Rotom-Heat",
    "baseSpecies": "Rotom",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 613
  },
  {
    "id": "rotommow",
    "species": "Rotom-Mow",
    "baseSpecies": "Rotom",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 607
  },
  {
    "id": "rotomwash",
    "species": "Rotom-Wash",
    "baseSpecies": "Rotom",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 616
  },
  {
    "id": "rowlet",
    "species": "Rowlet",
    "baseSpecies": "Rowlet",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "rufflet",
    "species": "Rufflet",
    "baseSpecies": "Rufflet",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 305
  },
  {
    "id": "runerigus",
    "species": "Runerigus",
    "baseSpecies": "Runerigus",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 528
  },
  {
    "id": "sableye",
    "species": "Sableye",
    "baseSpecies": "Sableye",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 446
  },
  {
    "id": "salamence",
    "species": "Salamence",
    "baseSpecies": "Salamence",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 729
  },
  {
    "id": "salandit",
    "species": "Salandit",
    "baseSpecies": "Salandit",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "salazzle",
    "species": "Salazzle",
    "baseSpecies": "Salazzle",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 573
  },
  {
    "id": "salazzletotem",
    "species": "Salazzle-Totem",
    "baseSpecies": "Salazzle",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 525
  },
  {
    "id": "samurott",
    "species": "Samurott",
    "baseSpecies": "Samurott",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 609
  },
  {
    "id": "samurotthisui",
    "species": "Samurott-Hisui",
    "baseSpecies": "Samurott",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 573
  },
  {
    "id": "sandaconda",
    "species": "Sandaconda",
    "baseSpecies": "Sandaconda",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "sandile",
    "species": "Sandile",
    "baseSpecies": "Sandile",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 247
  },
  {
    "id": "sandshrew",
    "species": "Sandshrew",
    "baseSpecies": "Sandshrew",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "sandshrewalola",
    "species": "Sandshrew-Alola",
    "baseSpecies": "Sandshrew",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "sandslash",
    "species": "Sandslash",
    "baseSpecies": "Sandslash",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 525
  },
  {
    "id": "sandslashalola",
    "species": "Sandslash-Alola",
    "baseSpecies": "Sandslash",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 522
  },
  {
    "id": "sandygast",
    "species": "Sandygast",
    "baseSpecies": "Sandygast",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "sandyshocks",
    "species": "Sandy Shocks",
    "baseSpecies": "Sandy Shocks",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "sawk",
    "species": "Sawk",
    "baseSpecies": "Sawk",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 552
  },
  {
    "id": "sawsbuck",
    "species": "Sawsbuck",
    "baseSpecies": "Sawsbuck",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 556
  },
  {
    "id": "scatterbug",
    "species": "Scatterbug",
    "baseSpecies": "Scatterbug",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 155
  },
  {
    "id": "sceptile",
    "species": "Sceptile",
    "baseSpecies": "Sceptile",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 614
  },
  {
    "id": "scizor",
    "species": "Scizor",
    "baseSpecies": "Scizor",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 605
  },
  {
    "id": "scolipede",
    "species": "Scolipede",
    "baseSpecies": "Scolipede",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 590
  },
  {
    "id": "scorbunny",
    "species": "Scorbunny",
    "baseSpecies": "Scorbunny",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "scovillain",
    "species": "Scovillain",
    "baseSpecies": "Scovillain",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 531
  },
  {
    "id": "scrafty",
    "species": "Scrafty",
    "baseSpecies": "Scrafty",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 581
  },
  {
    "id": "scraggy",
    "species": "Scraggy",
    "baseSpecies": "Scraggy",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 303
  },
  {
    "id": "screamtail",
    "species": "Scream Tail",
    "baseSpecies": "Scream Tail",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "scyther",
    "species": "Scyther",
    "baseSpecies": "Scyther",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 554
  },
  {
    "id": "seadra",
    "species": "Seadra",
    "baseSpecies": "Seadra",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 395
  },
  {
    "id": "seaking",
    "species": "Seaking",
    "baseSpecies": "Seaking",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 510
  },
  {
    "id": "sealeo",
    "species": "Sealeo",
    "baseSpecies": "Sealeo",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 370
  },
  {
    "id": "seedot",
    "species": "Seedot",
    "baseSpecies": "Seedot",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 175
  },
  {
    "id": "seel",
    "species": "Seel",
    "baseSpecies": "Seel",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "seismitoad",
    "species": "Seismitoad",
    "baseSpecies": "Seismitoad",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 599
  },
  {
    "id": "sentret",
    "species": "Sentret",
    "baseSpecies": "Sentret",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 170
  },
  {
    "id": "serperior",
    "species": "Serperior",
    "baseSpecies": "Serperior",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 633
  },
  {
    "id": "servine",
    "species": "Servine",
    "baseSpecies": "Servine",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 368
  },
  {
    "id": "seviper",
    "species": "Seviper",
    "baseSpecies": "Seviper",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 521
  },
  {
    "id": "sewaddle",
    "species": "Sewaddle",
    "baseSpecies": "Sewaddle",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "sharpedo",
    "species": "Sharpedo",
    "baseSpecies": "Sharpedo",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 553
  },
  {
    "id": "shaymin",
    "species": "Shaymin",
    "baseSpecies": "Shaymin",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 783
  },
  {
    "id": "shayminsky",
    "species": "Shaymin-Sky",
    "baseSpecies": "Shaymin",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 816
  },
  {
    "id": "shedinja",
    "species": "Shedinja",
    "baseSpecies": "Shedinja",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 470
  },
  {
    "id": "shelgon",
    "species": "Shelgon",
    "baseSpecies": "Shelgon",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "shellder",
    "species": "Shellder",
    "baseSpecies": "Shellder",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "shellos",
    "species": "Shellos",
    "baseSpecies": "Shellos",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 280
  },
  {
    "id": "shelmet",
    "species": "Shelmet",
    "baseSpecies": "Shelmet",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "shieldon",
    "species": "Shieldon",
    "baseSpecies": "Shieldon",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 313
  },
  {
    "id": "shiftry",
    "species": "Shiftry",
    "baseSpecies": "Shiftry",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "shiinotic",
    "species": "Shiinotic",
    "baseSpecies": "Shiinotic",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 477
  },
  {
    "id": "shinx",
    "species": "Shinx",
    "baseSpecies": "Shinx",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 218
  },
  {
    "id": "shroodle",
    "species": "Shroodle",
    "baseSpecies": "Shroodle",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "shroomish",
    "species": "Shroomish",
    "baseSpecies": "Shroomish",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 250
  },
  {
    "id": "shuckle",
    "species": "Shuckle",
    "baseSpecies": "Shuckle",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 592
  },
  {
    "id": "shuppet",
    "species": "Shuppet",
    "baseSpecies": "Shuppet",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 250
  },
  {
    "id": "sigilyph",
    "species": "Sigilyph",
    "baseSpecies": "Sigilyph",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 580
  },
  {
    "id": "silcoon",
    "species": "Silcoon",
    "baseSpecies": "Silcoon",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 160
  },
  {
    "id": "silicobra",
    "species": "Silicobra",
    "baseSpecies": "Silicobra",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 270
  },
  {
    "id": "silvally",
    "species": "Silvally",
    "baseSpecies": "Silvally",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 744
  },
  {
    "id": "simipour",
    "species": "Simipour",
    "baseSpecies": "Simipour",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 579
  },
  {
    "id": "simisage",
    "species": "Simisage",
    "baseSpecies": "Simisage",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 576
  },
  {
    "id": "simisear",
    "species": "Simisear",
    "baseSpecies": "Simisear",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 576
  },
  {
    "id": "sinistcha",
    "species": "Sinistcha",
    "baseSpecies": "Sinistcha",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 553
  },
  {
    "id": "sinistchamasterpiece",
    "species": "Sinistcha-Masterpiece",
    "baseSpecies": "Sinistcha",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 553
  },
  {
    "id": "sinistea",
    "species": "Sinistea",
    "baseSpecies": "Sinistea",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 263
  },
  {
    "id": "sinisteaantique",
    "species": "Sinistea-Antique",
    "baseSpecies": "Sinistea",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 263
  },
  {
    "id": "sirfetchd",
    "species": "Sirfetch’d",
    "baseSpecies": "Sirfetch’d",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 552
  },
  {
    "id": "sizzlipede",
    "species": "Sizzlipede",
    "baseSpecies": "Sizzlipede",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "skarmory",
    "species": "Skarmory",
    "baseSpecies": "Skarmory",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 585
  },
  {
    "id": "skeledirge",
    "species": "Skeledirge",
    "baseSpecies": "Skeledirge",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 575
  },
  {
    "id": "skiddo",
    "species": "Skiddo",
    "baseSpecies": "Skiddo",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 305
  },
  {
    "id": "skiploom",
    "species": "Skiploom",
    "baseSpecies": "Skiploom",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "skitty",
    "species": "Skitty",
    "baseSpecies": "Skitty",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 215
  },
  {
    "id": "skorupi",
    "species": "Skorupi",
    "baseSpecies": "Skorupi",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "skrelp",
    "species": "Skrelp",
    "baseSpecies": "Skrelp",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 275
  },
  {
    "id": "skuntank",
    "species": "Skuntank",
    "baseSpecies": "Skuntank",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 563
  },
  {
    "id": "skwovet",
    "species": "Skwovet",
    "baseSpecies": "Skwovet",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 230
  },
  {
    "id": "slaking",
    "species": "Slaking",
    "baseSpecies": "Slaking",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 763
  },
  {
    "id": "slakoth",
    "species": "Slakoth",
    "baseSpecies": "Slakoth",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "sliggoo",
    "species": "Sliggoo",
    "baseSpecies": "Sliggoo",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 414
  },
  {
    "id": "sliggoohisui",
    "species": "Sliggoo-Hisui",
    "baseSpecies": "Sliggoo",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 424
  },
  {
    "id": "slitherwing",
    "species": "Slither Wing",
    "baseSpecies": "Slither Wing",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "slowbro",
    "species": "Slowbro",
    "baseSpecies": "Slowbro",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 580
  },
  {
    "id": "slowbrogalar",
    "species": "Slowbro-Galar",
    "baseSpecies": "Slowbro",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "slowking",
    "species": "Slowking",
    "baseSpecies": "Slowking",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 568
  },
  {
    "id": "slowkinggalar",
    "species": "Slowking-Galar",
    "baseSpecies": "Slowking",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "slowpoke",
    "species": "Slowpoke",
    "baseSpecies": "Slowpoke",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 270
  },
  {
    "id": "slowpokegalar",
    "species": "Slowpoke-Galar",
    "baseSpecies": "Slowpoke",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 270
  },
  {
    "id": "slugma",
    "species": "Slugma",
    "baseSpecies": "Slugma",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 205
  },
  {
    "id": "slurpuff",
    "species": "Slurpuff",
    "baseSpecies": "Slurpuff",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 588
  },
  {
    "id": "smeargle",
    "species": "Smeargle",
    "baseSpecies": "Smeargle",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 651
  },
  {
    "id": "smoliv",
    "species": "Smoliv",
    "baseSpecies": "Smoliv",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 215
  },
  {
    "id": "smoochum",
    "species": "Smoochum",
    "baseSpecies": "Smoochum",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "sneasel",
    "species": "Sneasel",
    "baseSpecies": "Sneasel",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 385
  },
  {
    "id": "sneaselhisui",
    "species": "Sneasel-Hisui",
    "baseSpecies": "Sneasel",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 385
  },
  {
    "id": "sneasler",
    "species": "Sneasler",
    "baseSpecies": "Sneasler",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "snivy",
    "species": "Snivy",
    "baseSpecies": "Snivy",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 263
  },
  {
    "id": "snom",
    "species": "Snom",
    "baseSpecies": "Snom",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 140
  },
  {
    "id": "snorlax",
    "species": "Snorlax",
    "baseSpecies": "Snorlax",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 636
  },
  {
    "id": "snorunt",
    "species": "Snorunt",
    "baseSpecies": "Snorunt",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "snover",
    "species": "Snover",
    "baseSpecies": "Snover",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 289
  },
  {
    "id": "snubbull",
    "species": "Snubbull",
    "baseSpecies": "Snubbull",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "sobble",
    "species": "Sobble",
    "baseSpecies": "Sobble",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "solgaleo",
    "species": "Solgaleo",
    "baseSpecies": "Solgaleo",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 896
  },
  {
    "id": "solosis",
    "species": "Solosis",
    "baseSpecies": "Solosis",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "solrock",
    "species": "Solrock",
    "baseSpecies": "Solrock",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "spearow",
    "species": "Spearow",
    "baseSpecies": "Spearow",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 217
  },
  {
    "id": "spectrier",
    "species": "Spectrier",
    "baseSpecies": "Spectrier",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "spewpa",
    "species": "Spewpa",
    "baseSpecies": "Spewpa",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 168
  },
  {
    "id": "spheal",
    "species": "Spheal",
    "baseSpecies": "Spheal",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "spidops",
    "species": "Spidops",
    "baseSpecies": "Spidops",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 449
  },
  {
    "id": "spinarak",
    "species": "Spinarak",
    "baseSpecies": "Spinarak",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 205
  },
  {
    "id": "spinda",
    "species": "Spinda",
    "baseSpecies": "Spinda",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 408
  },
  {
    "id": "spiritomb",
    "species": "Spiritomb",
    "baseSpecies": "Spiritomb",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 557
  },
  {
    "id": "spoink",
    "species": "Spoink",
    "baseSpecies": "Spoink",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "sprigatito",
    "species": "Sprigatito",
    "baseSpecies": "Sprigatito",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "spritzee",
    "species": "Spritzee",
    "baseSpecies": "Spritzee",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 296
  },
  {
    "id": "squawkabilly",
    "species": "Squawkabilly",
    "baseSpecies": "Squawkabilly",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 462
  },
  {
    "id": "squawkabillyblue",
    "species": "Squawkabilly-Blue",
    "baseSpecies": "Squawkabilly",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 462
  },
  {
    "id": "squawkabillywhite",
    "species": "Squawkabilly-White",
    "baseSpecies": "Squawkabilly",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 462
  },
  {
    "id": "squawkabillyyellow",
    "species": "Squawkabilly-Yellow",
    "baseSpecies": "Squawkabilly",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 462
  },
  {
    "id": "squirtle",
    "species": "Squirtle",
    "baseSpecies": "Squirtle",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 269
  },
  {
    "id": "stakataka",
    "species": "Stakataka",
    "baseSpecies": "Stakataka",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 666
  },
  {
    "id": "stantler",
    "species": "Stantler",
    "baseSpecies": "Stantler",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 484
  },
  {
    "id": "staraptor",
    "species": "Staraptor",
    "baseSpecies": "Staraptor",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 590
  },
  {
    "id": "staravia",
    "species": "Staravia",
    "baseSpecies": "Staravia",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "starly",
    "species": "Starly",
    "baseSpecies": "Starly",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 200
  },
  {
    "id": "starmie",
    "species": "Starmie",
    "baseSpecies": "Starmie",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 613
  },
  {
    "id": "staryu",
    "species": "Staryu",
    "baseSpecies": "Staryu",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "steelix",
    "species": "Steelix",
    "baseSpecies": "Steelix",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 609
  },
  {
    "id": "steenee",
    "species": "Steenee",
    "baseSpecies": "Steenee",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "stonjourner",
    "species": "Stonjourner",
    "baseSpecies": "Stonjourner",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 515
  },
  {
    "id": "stoutland",
    "species": "Stoutland",
    "baseSpecies": "Stoutland",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 587
  },
  {
    "id": "stufful",
    "species": "Stufful",
    "baseSpecies": "Stufful",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "stunfisk",
    "species": "Stunfisk",
    "baseSpecies": "Stunfisk",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 552
  },
  {
    "id": "stunfiskgalar",
    "species": "Stunfisk-Galar",
    "baseSpecies": "Stunfisk",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 516
  },
  {
    "id": "stunky",
    "species": "Stunky",
    "baseSpecies": "Stunky",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 284
  },
  {
    "id": "sudowoodo",
    "species": "Sudowoodo",
    "baseSpecies": "Sudowoodo",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 476
  },
  {
    "id": "suicune",
    "species": "Suicune",
    "baseSpecies": "Suicune",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 769
  },
  {
    "id": "sunflora",
    "species": "Sunflora",
    "baseSpecies": "Sunflora",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 470
  },
  {
    "id": "sunkern",
    "species": "Sunkern",
    "baseSpecies": "Sunkern",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 135
  },
  {
    "id": "surskit",
    "species": "Surskit",
    "baseSpecies": "Surskit",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 224
  },
  {
    "id": "swablu",
    "species": "Swablu",
    "baseSpecies": "Swablu",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "swadloon",
    "species": "Swadloon",
    "baseSpecies": "Swadloon",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 338
  },
  {
    "id": "swalot",
    "species": "Swalot",
    "baseSpecies": "Swalot",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 539
  },
  {
    "id": "swampert",
    "species": "Swampert",
    "baseSpecies": "Swampert",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 634
  },
  {
    "id": "swanna",
    "species": "Swanna",
    "baseSpecies": "Swanna",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 554
  },
  {
    "id": "swellow",
    "species": "Swellow",
    "baseSpecies": "Swellow",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 554
  },
  {
    "id": "swinub",
    "species": "Swinub",
    "baseSpecies": "Swinub",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 205
  },
  {
    "id": "swirlix",
    "species": "Swirlix",
    "baseSpecies": "Swirlix",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 296
  },
  {
    "id": "swoobat",
    "species": "Swoobat",
    "baseSpecies": "Swoobat",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 506
  },
  {
    "id": "sylveon",
    "species": "Sylveon",
    "baseSpecies": "Sylveon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 615
  },
  {
    "id": "tadbulb",
    "species": "Tadbulb",
    "baseSpecies": "Tadbulb",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 227
  },
  {
    "id": "taillow",
    "species": "Taillow",
    "baseSpecies": "Taillow",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 225
  },
  {
    "id": "talonflame",
    "species": "Talonflame",
    "baseSpecies": "Talonflame",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 598
  },
  {
    "id": "tandemaus",
    "species": "Tandemaus",
    "baseSpecies": "Tandemaus",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "tangela",
    "species": "Tangela",
    "baseSpecies": "Tangela",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 390
  },
  {
    "id": "tangrowth",
    "species": "Tangrowth",
    "baseSpecies": "Tangrowth",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 613
  },
  {
    "id": "tapubulu",
    "species": "Tapu Bulu",
    "baseSpecies": "Tapu Bulu",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 759
  },
  {
    "id": "tapufini",
    "species": "Tapu Fini",
    "baseSpecies": "Tapu Fini",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 765
  },
  {
    "id": "tapukoko",
    "species": "Tapu Koko",
    "baseSpecies": "Tapu Koko",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 774
  },
  {
    "id": "tapulele",
    "species": "Tapu Lele",
    "baseSpecies": "Tapu Lele",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 774
  },
  {
    "id": "tarountula",
    "species": "Tarountula",
    "baseSpecies": "Tarountula",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 165
  },
  {
    "id": "tatsugiri",
    "species": "Tatsugiri",
    "baseSpecies": "Tatsugiri",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 520
  },
  {
    "id": "tatsugiridroopy",
    "species": "Tatsugiri-Droopy",
    "baseSpecies": "Tatsugiri",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 520
  },
  {
    "id": "tatsugiristretchy",
    "species": "Tatsugiri-Stretchy",
    "baseSpecies": "Tatsugiri",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 520
  },
  {
    "id": "tauros",
    "species": "Tauros",
    "baseSpecies": "Tauros",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 583
  },
  {
    "id": "taurospaldeaaqua",
    "species": "Tauros-Paldea-Aqua",
    "baseSpecies": "Tauros",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "taurospaldeablaze",
    "species": "Tauros-Paldea-Blaze",
    "baseSpecies": "Tauros",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "taurospaldeacombat",
    "species": "Tauros-Paldea-Combat",
    "baseSpecies": "Tauros",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "teddiursa",
    "species": "Teddiursa",
    "baseSpecies": "Teddiursa",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "tentacool",
    "species": "Tentacool",
    "baseSpecies": "Tentacool",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "tentacruel",
    "species": "Tentacruel",
    "baseSpecies": "Tentacruel",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 611
  },
  {
    "id": "tepig",
    "species": "Tepig",
    "baseSpecies": "Tepig",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 263
  },
  {
    "id": "terapagos",
    "species": "Terapagos",
    "baseSpecies": "Terapagos",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 585
  },
  {
    "id": "terrakion",
    "species": "Terrakion",
    "baseSpecies": "Terrakion",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 781
  },
  {
    "id": "thievul",
    "species": "Thievul",
    "baseSpecies": "Thievul",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 500
  },
  {
    "id": "throh",
    "species": "Throh",
    "baseSpecies": "Throh",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 543
  },
  {
    "id": "thundurus",
    "species": "Thundurus",
    "baseSpecies": "Thundurus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 772
  },
  {
    "id": "thundurustherian",
    "species": "Thundurus-Therian",
    "baseSpecies": "Thundurus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 775
  },
  {
    "id": "thwackey",
    "species": "Thwackey",
    "baseSpecies": "Thwackey",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "timburr",
    "species": "Timburr",
    "baseSpecies": "Timburr",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "tinglu",
    "species": "Ting-Lu",
    "baseSpecies": "Ting-Lu",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 705
  },
  {
    "id": "tinkatink",
    "species": "Tinkatink",
    "baseSpecies": "Tinkatink",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 252
  },
  {
    "id": "tinkaton",
    "species": "Tinkaton",
    "baseSpecies": "Tinkaton",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 551
  },
  {
    "id": "tinkatuff",
    "species": "Tinkatuff",
    "baseSpecies": "Tinkatuff",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 335
  },
  {
    "id": "tirtouga",
    "species": "Tirtouga",
    "baseSpecies": "Tirtouga",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 310
  },
  {
    "id": "toedscool",
    "species": "Toedscool",
    "baseSpecies": "Toedscool",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 290
  },
  {
    "id": "toedscruel",
    "species": "Toedscruel",
    "baseSpecies": "Toedscruel",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 560
  },
  {
    "id": "togedemaru",
    "species": "Togedemaru",
    "baseSpecies": "Togedemaru",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 522
  },
  {
    "id": "togedemarutotem",
    "species": "Togedemaru-Totem",
    "baseSpecies": "Togedemaru",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 480
  },
  {
    "id": "togekiss",
    "species": "Togekiss",
    "baseSpecies": "Togekiss",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 647
  },
  {
    "id": "togepi",
    "species": "Togepi",
    "baseSpecies": "Togepi",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 200
  },
  {
    "id": "togetic",
    "species": "Togetic",
    "baseSpecies": "Togetic",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 373
  },
  {
    "id": "torchic",
    "species": "Torchic",
    "baseSpecies": "Torchic",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "torkoal",
    "species": "Torkoal",
    "baseSpecies": "Torkoal",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 563
  },
  {
    "id": "tornadus",
    "species": "Tornadus",
    "baseSpecies": "Tornadus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 769
  },
  {
    "id": "tornadustherian",
    "species": "Tornadus-Therian",
    "baseSpecies": "Tornadus",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 775
  },
  {
    "id": "torracat",
    "species": "Torracat",
    "baseSpecies": "Torracat",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "torterra",
    "species": "Torterra",
    "baseSpecies": "Torterra",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 606
  },
  {
    "id": "totodile",
    "species": "Totodile",
    "baseSpecies": "Totodile",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 269
  },
  {
    "id": "toucannon",
    "species": "Toucannon",
    "baseSpecies": "Toucannon",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "toxapex",
    "species": "Toxapex",
    "baseSpecies": "Toxapex",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 600
  },
  {
    "id": "toxel",
    "species": "Toxel",
    "baseSpecies": "Toxel",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 197
  },
  {
    "id": "toxicroak",
    "species": "Toxicroak",
    "baseSpecies": "Toxicroak",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 583
  },
  {
    "id": "toxtricity",
    "species": "Toxtricity",
    "baseSpecies": "Toxtricity",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 547
  },
  {
    "id": "toxtricitylowkey",
    "species": "Toxtricity-Low-Key",
    "baseSpecies": "Toxtricity",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 547
  },
  {
    "id": "tranquill",
    "species": "Tranquill",
    "baseSpecies": "Tranquill",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 313
  },
  {
    "id": "trapinch",
    "species": "Trapinch",
    "baseSpecies": "Trapinch",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 245
  },
  {
    "id": "treecko",
    "species": "Treecko",
    "baseSpecies": "Treecko",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 265
  },
  {
    "id": "trevenant",
    "species": "Trevenant",
    "baseSpecies": "Trevenant",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 546
  },
  {
    "id": "tropius",
    "species": "Tropius",
    "baseSpecies": "Tropius",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 523
  },
  {
    "id": "trubbish",
    "species": "Trubbish",
    "baseSpecies": "Trubbish",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 284
  },
  {
    "id": "trumbeak",
    "species": "Trumbeak",
    "baseSpecies": "Trumbeak",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 310
  },
  {
    "id": "tsareena",
    "species": "Tsareena",
    "baseSpecies": "Tsareena",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 594
  },
  {
    "id": "turtonator",
    "species": "Turtonator",
    "baseSpecies": "Turtonator",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 566
  },
  {
    "id": "turtwig",
    "species": "Turtwig",
    "baseSpecies": "Turtwig",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 273
  },
  {
    "id": "tympole",
    "species": "Tympole",
    "baseSpecies": "Tympole",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 249
  },
  {
    "id": "tynamo",
    "species": "Tynamo",
    "baseSpecies": "Tynamo",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 230
  },
  {
    "id": "typenull",
    "species": "Type: Null",
    "baseSpecies": "Type: Null",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 697
  },
  {
    "id": "typhlosion",
    "species": "Typhlosion",
    "baseSpecies": "Typhlosion",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 624
  },
  {
    "id": "typhlosionhisui",
    "species": "Typhlosion-Hisui",
    "baseSpecies": "Typhlosion",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 579
  },
  {
    "id": "tyranitar",
    "species": "Tyranitar",
    "baseSpecies": "Tyranitar",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 705
  },
  {
    "id": "tyrantrum",
    "species": "Tyrantrum",
    "baseSpecies": "Tyrantrum",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 626
  },
  {
    "id": "tyrogue",
    "species": "Tyrogue",
    "baseSpecies": "Tyrogue",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 165
  },
  {
    "id": "tyrunt",
    "species": "Tyrunt",
    "baseSpecies": "Tyrunt",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 317
  },
  {
    "id": "umbreon",
    "species": "Umbreon",
    "baseSpecies": "Umbreon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 618
  },
  {
    "id": "unfezant",
    "species": "Unfezant",
    "baseSpecies": "Unfezant",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 569
  },
  {
    "id": "unown",
    "species": "Unown",
    "baseSpecies": "Unown",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 381
  },
  {
    "id": "ursaluna",
    "species": "Ursaluna",
    "baseSpecies": "Ursaluna",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 595
  },
  {
    "id": "ursalunabloodmoon",
    "species": "Ursaluna-Bloodmoon",
    "baseSpecies": "Ursaluna",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 600
  },
  {
    "id": "ursaring",
    "species": "Ursaring",
    "baseSpecies": "Ursaring",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 550
  },
  {
    "id": "urshifu",
    "species": "Urshifu",
    "baseSpecies": "Urshifu",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 685
  },
  {
    "id": "urshifurapidstrike",
    "species": "Urshifu-Rapid-Strike",
    "baseSpecies": "Urshifu",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 685
  },
  {
    "id": "uxie",
    "species": "Uxie",
    "baseSpecies": "Uxie",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 769
  },
  {
    "id": "vanillish",
    "species": "Vanillish",
    "baseSpecies": "Vanillish",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 350
  },
  {
    "id": "vanillite",
    "species": "Vanillite",
    "baseSpecies": "Vanillite",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "vanilluxe",
    "species": "Vanilluxe",
    "baseSpecies": "Vanilluxe",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 622
  },
  {
    "id": "vaporeon",
    "species": "Vaporeon",
    "baseSpecies": "Vaporeon",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 612
  },
  {
    "id": "varoom",
    "species": "Varoom",
    "baseSpecies": "Varoom",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 255
  },
  {
    "id": "veluza",
    "species": "Veluza",
    "baseSpecies": "Veluza",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 523
  },
  {
    "id": "venipede",
    "species": "Venipede",
    "baseSpecies": "Venipede",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 215
  },
  {
    "id": "venomoth",
    "species": "Venomoth",
    "baseSpecies": "Venomoth",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 549
  },
  {
    "id": "venonat",
    "species": "Venonat",
    "baseSpecies": "Venonat",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 260
  },
  {
    "id": "venusaur",
    "species": "Venusaur",
    "baseSpecies": "Venusaur",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 618
  },
  {
    "id": "vespiquen",
    "species": "Vespiquen",
    "baseSpecies": "Vespiquen",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 519
  },
  {
    "id": "vibrava",
    "species": "Vibrava",
    "baseSpecies": "Vibrava",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 295
  },
  {
    "id": "victini",
    "species": "Victini",
    "baseSpecies": "Victini",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 807
  },
  {
    "id": "victreebel",
    "species": "Victreebel",
    "baseSpecies": "Victreebel",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 565
  },
  {
    "id": "vigoroth",
    "species": "Vigoroth",
    "baseSpecies": "Vigoroth",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 471
  },
  {
    "id": "vikavolt",
    "species": "Vikavolt",
    "baseSpecies": "Vikavolt",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 587
  },
  {
    "id": "vikavolttotem",
    "species": "Vikavolt-Totem",
    "baseSpecies": "Vikavolt",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 545
  },
  {
    "id": "vileplume",
    "species": "Vileplume",
    "baseSpecies": "Vileplume",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 574
  },
  {
    "id": "virizion",
    "species": "Virizion",
    "baseSpecies": "Virizion",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 772
  },
  {
    "id": "vivillon",
    "species": "Vivillon",
    "baseSpecies": "Vivillon",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 501
  },
  {
    "id": "vivillonfancy",
    "species": "Vivillon-Fancy",
    "baseSpecies": "Vivillon",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 456
  },
  {
    "id": "vivillonpokeball",
    "species": "Vivillon-Pokeball",
    "baseSpecies": "Vivillon",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 456
  },
  {
    "id": "volbeat",
    "species": "Volbeat",
    "baseSpecies": "Volbeat",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 502
  },
  {
    "id": "volcanion",
    "species": "Volcanion",
    "baseSpecies": "Volcanion",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 792
  },
  {
    "id": "volcarona",
    "species": "Volcarona",
    "baseSpecies": "Volcarona",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 667
  },
  {
    "id": "voltorb",
    "species": "Voltorb",
    "baseSpecies": "Voltorb",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "voltorbhisui",
    "species": "Voltorb-Hisui",
    "baseSpecies": "Voltorb",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "vullaby",
    "species": "Vullaby",
    "baseSpecies": "Vullaby",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 325
  },
  {
    "id": "vulpix",
    "species": "Vulpix",
    "baseSpecies": "Vulpix",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 254
  },
  {
    "id": "vulpixalola",
    "species": "Vulpix-Alola",
    "baseSpecies": "Vulpix",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 254
  },
  {
    "id": "wailmer",
    "species": "Wailmer",
    "baseSpecies": "Wailmer",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 355
  },
  {
    "id": "wailord",
    "species": "Wailord",
    "baseSpecies": "Wailord",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 563
  },
  {
    "id": "walkingwake",
    "species": "Walking Wake",
    "baseSpecies": "Walking Wake",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 635
  },
  {
    "id": "walrein",
    "species": "Walrein",
    "baseSpecies": "Walrein",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 605
  },
  {
    "id": "wartortle",
    "species": "Wartortle",
    "baseSpecies": "Wartortle",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 360
  },
  {
    "id": "watchog",
    "species": "Watchog",
    "baseSpecies": "Watchog",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 477
  },
  {
    "id": "wattrel",
    "species": "Wattrel",
    "baseSpecies": "Wattrel",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 235
  },
  {
    "id": "weavile",
    "species": "Weavile",
    "baseSpecies": "Weavile",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 618
  },
  {
    "id": "weedle",
    "species": "Weedle",
    "baseSpecies": "Weedle",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 150
  },
  {
    "id": "weepinbell",
    "species": "Weepinbell",
    "baseSpecies": "Weepinbell",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 345
  },
  {
    "id": "weezing",
    "species": "Weezing",
    "baseSpecies": "Weezing",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 574
  },
  {
    "id": "weezinggalar",
    "species": "Weezing-Galar",
    "baseSpecies": "Weezing",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 535
  },
  {
    "id": "whimsicott",
    "species": "Whimsicott",
    "baseSpecies": "Whimsicott",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 564
  },
  {
    "id": "whirlipede",
    "species": "Whirlipede",
    "baseSpecies": "Whirlipede",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 315
  },
  {
    "id": "whiscash",
    "species": "Whiscash",
    "baseSpecies": "Whiscash",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 546
  },
  {
    "id": "whismur",
    "species": "Whismur",
    "baseSpecies": "Whismur",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 195
  },
  {
    "id": "wigglytuff",
    "species": "Wigglytuff",
    "baseSpecies": "Wigglytuff",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 495
  },
  {
    "id": "wiglett",
    "species": "Wiglett",
    "baseSpecies": "Wiglett",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 200
  },
  {
    "id": "wimpod",
    "species": "Wimpod",
    "baseSpecies": "Wimpod",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 185
  },
  {
    "id": "wingull",
    "species": "Wingull",
    "baseSpecies": "Wingull",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 225
  },
  {
    "id": "wishiwashi",
    "species": "Wishiwashi",
    "baseSpecies": "Wishiwashi",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 253
  },
  {
    "id": "wobbuffet",
    "species": "Wobbuffet",
    "baseSpecies": "Wobbuffet",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 625
  },
  {
    "id": "wochien",
    "species": "Wo-Chien",
    "baseSpecies": "Wo-Chien",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 705
  },
  {
    "id": "woobat",
    "species": "Woobat",
    "baseSpecies": "Woobat",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 278
  },
  {
    "id": "wooloo",
    "species": "Wooloo",
    "baseSpecies": "Wooloo",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 225
  },
  {
    "id": "wooper",
    "species": "Wooper",
    "baseSpecies": "Wooper",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 165
  },
  {
    "id": "wooperpaldea",
    "species": "Wooper-Paldea",
    "baseSpecies": "Wooper",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 165
  },
  {
    "id": "wormadam",
    "species": "Wormadam",
    "baseSpecies": "Wormadam",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 469
  },
  {
    "id": "wormadamsandy",
    "species": "Wormadam-Sandy",
    "baseSpecies": "Wormadam",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 496
  },
  {
    "id": "wormadamtrash",
    "species": "Wormadam-Trash",
    "baseSpecies": "Wormadam",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 511
  },
  {
    "id": "wugtrio",
    "species": "Wugtrio",
    "baseSpecies": "Wugtrio",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 470
  },
  {
    "id": "wurmple",
    "species": "Wurmple",
    "baseSpecies": "Wurmple",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 150
  },
  {
    "id": "wynaut",
    "species": "Wynaut",
    "baseSpecies": "Wynaut",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 215
  },
  {
    "id": "wyrdeer",
    "species": "Wyrdeer",
    "baseSpecies": "Wyrdeer",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 570
  },
  {
    "id": "xatu",
    "species": "Xatu",
    "baseSpecies": "Xatu",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 548
  },
  {
    "id": "xerneas",
    "species": "Xerneas",
    "baseSpecies": "Xerneas",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 920
  },
  {
    "id": "xurkitree",
    "species": "Xurkitree",
    "baseSpecies": "Xurkitree",
    "rank": "legendary",
    "sourceTier": 6,
    "score": 675
  },
  {
    "id": "yamask",
    "species": "Yamask",
    "baseSpecies": "Yamask",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 258
  },
  {
    "id": "yamaskgalar",
    "species": "Yamask-Galar",
    "baseSpecies": "Yamask",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 258
  },
  {
    "id": "yamper",
    "species": "Yamper",
    "baseSpecies": "Yamper",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 225
  },
  {
    "id": "yanma",
    "species": "Yanma",
    "baseSpecies": "Yanma",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 345
  },
  {
    "id": "yungoos",
    "species": "Yungoos",
    "baseSpecies": "Yungoos",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 208
  },
  {
    "id": "yveltal",
    "species": "Yveltal",
    "baseSpecies": "Yveltal",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 905
  },
  {
    "id": "zacian",
    "species": "Zacian",
    "baseSpecies": "Zacian",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 795
  },
  {
    "id": "zamazenta",
    "species": "Zamazenta",
    "baseSpecies": "Zamazenta",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 795
  },
  {
    "id": "zangoose",
    "species": "Zangoose",
    "baseSpecies": "Zangoose",
    "rank": "rank4",
    "sourceTier": 4,
    "score": 545
  },
  {
    "id": "zapdos",
    "species": "Zapdos",
    "baseSpecies": "Zapdos",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 778
  },
  {
    "id": "zapdosgalar",
    "species": "Zapdos-Galar",
    "baseSpecies": "Zapdos",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 715
  },
  {
    "id": "zarude",
    "species": "Zarude",
    "baseSpecies": "Zarude",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 735
  },
  {
    "id": "zarudedada",
    "species": "Zarude-Dada",
    "baseSpecies": "Zarude",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 735
  },
  {
    "id": "zebstrika",
    "species": "Zebstrika",
    "baseSpecies": "Zebstrika",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 578
  },
  {
    "id": "zekrom",
    "species": "Zekrom",
    "baseSpecies": "Zekrom",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 890
  },
  {
    "id": "zeraora",
    "species": "Zeraora",
    "baseSpecies": "Zeraora",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 804
  },
  {
    "id": "zigzagoon",
    "species": "Zigzagoon",
    "baseSpecies": "Zigzagoon",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 195
  },
  {
    "id": "zigzagoongalar",
    "species": "Zigzagoon-Galar",
    "baseSpecies": "Zigzagoon",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 195
  },
  {
    "id": "zoroark",
    "species": "Zoroark",
    "baseSpecies": "Zoroark",
    "rank": "rank6",
    "sourceTier": 6,
    "score": 603
  },
  {
    "id": "zoroarkhisui",
    "species": "Zoroark-Hisui",
    "baseSpecies": "Zoroark",
    "rank": "rank5",
    "sourceTier": 5,
    "score": 555
  },
  {
    "id": "zorua",
    "species": "Zorua",
    "baseSpecies": "Zorua",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "zoruahisui",
    "species": "Zorua-Hisui",
    "baseSpecies": "Zorua",
    "rank": "rank2",
    "sourceTier": 2,
    "score": 285
  },
  {
    "id": "zubat",
    "species": "Zubat",
    "baseSpecies": "Zubat",
    "rank": "rank1",
    "sourceTier": 1,
    "score": 200
  },
  {
    "id": "zweilous",
    "species": "Zweilous",
    "baseSpecies": "Zweilous",
    "rank": "rank3",
    "sourceTier": 3,
    "score": 375
  },
  {
    "id": "zygarde",
    "species": "Zygarde",
    "baseSpecies": "Zygarde",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 816
  },
  {
    "id": "zygarde10",
    "species": "Zygarde-10%",
    "baseSpecies": "Zygarde",
    "rank": "legendary",
    "sourceTier": 10,
    "score": 678
  }
];

export const PokemonSpeciesRankById: Record<string, PokemonSpeciesRankData> = Object.fromEntries(PokemonSpeciesRankEntries.map(entry => [entry.id, entry.rank]));
