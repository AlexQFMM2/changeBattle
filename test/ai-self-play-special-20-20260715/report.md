# Battle V4 AI Self-Play Exam Report

- generatedAt: 2026-07-15T02:49:29.982Z
- seed: ai-self-play
- ruleSet: gen9
- teamSize: 3
- forceLevel: 50
- archetypeAttempts: 64
- strictArchetype: false
- games: 20
- ended/maxTurns/stalled/failed: 20/0/0/0
- wins p1/p2: 10/10
- averageTurns: 10.9
- averageQuestionElapsedMs: 33785
- averageDecisionMs: 1289.13
- timeoutCount: 6
- maxSearchedDepth: 6
- slowestQuestion: q005-sun-vs-trick-room (72547ms)
- teamCoreCompleteByArchetype: rain:8/8 (100%), sun:8/8 (100%), trick-room:8/8 (100%), balanced:8/8 (100%), setup-offense:8/8 (100%)
- blunders: severe=0, warning=5, info=0, questionsWithSevere=0, questionsWithWarnings=5
- blunderTopKinds: timeout:4, ineffective-move:1

## Questions

| id | matchup | levels | status | winner | turns | elapsed ms | avg decision ms | max depth | notes |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| q001-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 12 | 33313 | 1118.93 | 5 | switch:10 |
| q002-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 12 | 34172 | 1166.71 | 5 | switch:8 |
| q003-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 9 | 22565 | 1052.35 | 5 | switch:6 |
| q004-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p2 | 7 | 25065 | 1392.65 | 4 | switch:6 |
| q005-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p1 | 27 | 72547 | 1196.79 | 5 | switch:26 |
| q006-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p2 | 16 | 36315 | 964.91 | 4 | switch:13 |
| q007-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p2 | 9 | 30267 | 1268.59 | 6 | timeouts:1, warnings:1, switch:5 |
| q008-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p2 | 10 | 14309 | 505.58 | 6 | switch:8 |
| q009-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p2 | 10 | 35180 | 1368.88 | 4 | warnings:1, switch:6 |
| q010-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p2 | 3 | 15257 | 1639.5 | 4 | switch:2 |
| q011-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p1 | 14 | 48682 | 1487.16 | 4 | switch:13 |
| q012-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p2 | 7 | 17390 | 952.25 | 5 | switch:7 |
| q013-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p2 | 8 | 24291 | 1206.05 | 6 | timeouts:1, warnings:1, switch:5 |
| q014-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p1 | 14 | 71508 | 2332.77 | 4 | timeouts:3, warnings:1, switch:10 |
| q015-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p1 | 16 | 50924 | 1450.41 | 4 | switch:18 |
| q016-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p1 | 8 | 12509 | 556.3 | 6 | switch:7 |
| q017-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p1 | 10 | 35760 | 1490.09 | 4 | switch:6 |
| q018-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p2 | 5 | 20836 | 1505.38 | 6 | switch:5 |
| q019-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p2 | 7 | 30372 | 1698.29 | 4 | timeouts:1, warnings:1, switch:6 |
| q020-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p1 | 14 | 44438 | 1428.9 | 4 | switch:14 |

## Per-Question Details

### q001-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 12
- elapsedMs: 33313
- p1 team: Ludicolo L50 @ Life Orb (Swift Swim) [icebeam / raindance / hydropump / gigadrain], Charizard L50 @ Heavy-Duty Boots (Blaze) [outrage / flareblitz / swordsdance / earthquake], Kyogre L50 @ Choice Scarf (Drizzle) [originpulse / waterspout / icebeam / thunder]
- p2 team: Groudon L50 @ Leftovers (Drought) [heatcrash / thunderwave / swordsdance / precipiceblades], Leafeon L50 @ Life Orb (Chlorophyll) [synthesis / swordsdance / knockoff / leafblade], Ninetales L50 @ Heavy-Duty Boots (Drought) [solarbeam / fireblast / nastyplot / scorchingsands]
- metrics: decisions=28, timeouts=0, switches=10, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 182.43 | - |
| p1 | switch 2 | champion | minimax | 3 | 180.39 | bucket:52, activeHp:-46.45, winCondition:28, candidateTieBreak:21.17 |
| p2 | move 1 | gymLeader | minimax | 2 | 320.17 | koSwing:140, activeHp:120, bucket:82, speed:30 |
| p1 | move 4 | champion | minimax | 3 | 284.15 | candidateTieBreak:31.13, activeHp:28.99, winCondition:28, bucket:22 |
| p2 | move 2 | gymLeader | minimax | 2 | 76.9 | activeHp:-28.99, alive:-18, lowHpPressure:10 |
| p1 | switch 3 | champion | minimax | 3 | 126.14 | bucket:28, winCondition:28, activeHp:25.56, alive:18 |
| p2 | switch 2 | gymLeader | minimax | 2 | 121.47 | speed:-36, winCondition:28, alive:-18, risk:-18 |
| p1 | move 2 | champion | minimax | 3 | 256.1 | activeHp:-34.19, candidateTieBreak:19.8, alive:18, lowHpPressure:-8 |

### q002-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 12
- elapsedMs: 34172
- p1 team: Zapdos L50 @ Heavy-Duty Boots (Static) [uturn / discharge / roost / hurricane], Politoed L50 @ Choice Specs (Drizzle) [weatherball / icebeam / focusblast / hydropump], Poliwrath L50 @ Assault Vest (Water Absorb) [circlethrow / closecombat / knockoff / liquidation]
- p2 team: Torkoal L50 @ Heavy-Duty Boots (Drought) [yawn / solarbeam / earthquake / fireblast], Sunflora L50 @ Life Orb (Chlorophyll) [solarbeam / earthpower / sunnyday / weatherball], Walking Wake L50 @ Life Orb (Protosynthesis) [dracometeor / sunnyday / flamethrower / hydrosteam]
- metrics: decisions=28, timeouts=0, switches=8, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 2 | champion | minimax | 3 | 187.07 | activeHp:-61.14, teamHp:-18.68, threat:-12, candidateTieBreak:10.88 |
| p2 | move 2 | gymLeader | minimax | 2 | 286.55 | activeHp:61.14, candidateTieBreak:26.94, bucket:22, teamHp:18.68 |
| p1 | switch 2 | champion | minimax | 3 | 182.16 | bucket:-46, activeHp:-30.47, teamHp:-26.66, role:22 |
| p2 | move 2 | gymLeader | minimax | 2 | 490.99 | koSwing:140, bucket:82, activeHp:76.15, candidateTieBreak:48.84 |
| p1 | move 4 | champion | minimax | 4 | 376.58 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:32.28 |
| p2 | move 1 | gymLeader | minimax | 2 | 317.61 | koSwing:-170, bucket:-70, activeHp:-45.68, speed:-36 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 178.51 | - |
| p1 | switch 3 | champion | minimax | 3 | 126.83 | activeHp:-91.36, alive:18, lowHpPressure:-16, bucket:16 |

### q003-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 9
- elapsedMs: 22565
- p1 team: Kyogre L50 @ Leftovers (Drizzle) [thunder / originpulse / icebeam / calmmind], Pelipper L50 @ Choice Specs (Drizzle) [hurricane / uturn / hydropump / weatherball], Victreebel L50 @ Life Orb (Chlorophyll) [suckerpunch / swordsdance / poisonjab / powerwhip]
- p2 team: Groudon L50 @ Leftovers (Drought) [heatcrash / stealthrock / precipiceblades / spikes], Sunflora L50 @ Life Orb (Chlorophyll) [weatherball / solarbeam / sunnyday / earthpower], Ninetales L50 @ Heavy-Duty Boots (Drought) [solarbeam / scorchingsands / nastyplot / fireblast]
- metrics: decisions=20, timeouts=0, switches=6, protect=0, setup=1, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 2 | champion | minimax | 3 | 372.16 | candidateTieBreak:33.69, bucket:22, threat:12, activeHp:11.29 |
| p2 | move 3 | gymLeader | minimax | 2 | 274.4 | bucket:22, candidateTieBreak:18.24, threat:-12, activeHp:-11.29 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 183.32 | - |
| p1 | switch 3 | champion | minimax | 3 | 126.69 | bucket:68, winCondition:28, alive:18, activeHp:-14.46 |
| p2 | move 2 | gymLeader | minimax | 2 | 595.58 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:59.35 |
| p1 | move 4 | champion | minimax | 4 | 150.45 | activeHp:41.82, winCondition:28, bucket:22, alive:18 |
| p2 | move 1 | gymLeader | minimax | 2 | 18.71 | koSwing:-170, winCondition:-140, activeHp:-105.54, bucket:-92 |
| p1 | move 3 | champion | minimax | 3 | 700.06 | koSwing:140, activeHp:96.87, bucket:82, candidateTieBreak:77.3 |

### q004-rain-vs-sun: rain vs sun

- status: ended
- winner: p2
- turns: 7
- elapsedMs: 25065
- p1 team: Luvdisc L50 @ Heavy-Duty Boots (Swift Swim) [substitute / endeavor / surf / whirlpool], Beartic L50 @ Heavy-Duty Boots (Swift Swim) [swordsdance / aquajet / iciclecrash / closecombat], Kingdra L50 @ Life Orb (Swift Swim) [raindance / wavecrash / hurricane / dracometeor]
- p2 team: Bellossom L50 @ Leftovers (Chlorophyll) [quiverdance / strengthsap / gigadrain / sludgebomb], Brute Bonnet L50 @ Leftovers (Protosynthesis) [crunch / suckerpunch / seedbomb / spore], Walking Wake L50 @ Life Orb (Protosynthesis) [hydrosteam / sunnyday / flamethrower / dracometeor]
- metrics: decisions=17, timeouts=0, switches=6, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 128.03 | bucket:44, winCondition:28, activeHp:-24.53, threat:-12 |
| p2 | move 3 | gymLeader | minimax | 2 | 325.13 | activeHp:88.13, candidateTieBreak:34.16, winCondition:28, bucket:22 |
| p1 | move 3 | champion | minimax | 3 | 402.84 | candidateTieBreak:42.39, activeHp:35.79, winCondition:28, bucket:22 |
| p2 | switch 3 | gymLeader | minimax | 2 | 125.7 | bucket:28, winCondition:28, activeHp:-13.58, threat:-12 |
| p1 | move 3 | champion | minimax | 3 | 207.64 | candidateTieBreak:15.5, speed:-12, bucket:-8 |
| p2 | move 4 | gymLeader | minimax | 2 | 232.64 | candidateTieBreak:19.66, speed:10, bucket:-8 |
| p1 | switch 2 | champion | numeric-guard | 1 | 182.26 | - |
| p1 | move 3 | champion | minimax | 3 | -6.75 | activeHp:-42.61, teamHp:-23.49, alive:-18, candidateTieBreak:-12.87 |

### q005-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p1
- turns: 27
- elapsedMs: 72547
- p1 team: Sandy Shocks L50 @ Heavy-Duty Boots (Protosynthesis) [thunderbolt / voltswitch / earthpower / thunderwave], Bellossom L50 @ Leftovers (Chlorophyll) [quiverdance / gigadrain / terablast / strengthsap], Ninetales L50 @ Heavy-Duty Boots (Drought) [solarbeam / fireblast / scorchingsands / nastyplot]
- p2 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [fireblast / hydropump / icebeam / trickroom]
- metrics: decisions=58, timeouts=0, switches=26, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 283.38 | activeHp:-34.02, candidateTieBreak:20.01, threat:-12, lowHpPressure:10 |
| p2 | move 2 | gymLeader | minimax | 2 | 349.2 | activeHp:34.02, candidateTieBreak:30.58, bucket:22, threat:12 |
| p1 | switch 2 | champion | minimax | 3 | 181.31 | activeHp:30.41, winCondition:28, bucket:-24, role:22 |
| p2 | move 3 | gymLeader | minimax | 2 | 469.63 | koSwing:140, bucket:82, speed:-36, candidateTieBreak:35.57 |
| p1 | switch 3 | champion | minimax | 3 | 126.63 | bucket:44, activeHp:36.36, winCondition:28, threat:-12 |
| p2 | move 1 | gymLeader | minimax | 2 | 273.83 | koSwing:140, bucket:82, activeHp:39.12, candidateTieBreak:20.64 |
| p1 | move 1 | champion | minimax | 3 | 237.45 | koSwing:140, bucket:82, activeHp:65.66, speed:30 |
| p2 | move 2 | gymLeader | minimax | 2 | 262.08 | koSwing:140, bucket:82, activeHp:46.41, candidateTieBreak:22.19 |

### q006-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p2
- turns: 16
- elapsedMs: 36315
- p1 team: Slither Wing L50 @ Life Orb (Protosynthesis) [wildcharge / firstimpression / closecombat / uturn], Victreebel L50 @ Life Orb (Chlorophyll) [sludgewave / sunnyday / weatherball / powerwhip], Walking Wake L50 @ Choice Specs (Protosynthesis) [dracometeor / hydropump / flipturn / flamethrower]
- p2 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [earthpower / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / psychic / scald / trickroom]
- metrics: decisions=35, timeouts=0, switches=13, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | switch 3 | gymLeader | minimax | 2 | 118.53 | activeHp:-35.38, speed:-12, threat:-12, lowHpPressure:10 |
| p1 | move 1 | champion | minimax | 3 | 213.18 | koSwing:140, bucket:82, activeHp:79.14, speed:30 |
| p2 | switch 3 | gymLeader | minimax | 2 | 122.81 | activeHp:-21.12, speed:-12, threat:-12, lowHpPressure:10 |
| p1 | move 1 | champion | minimax | 3 | 199.88 | bucket:22, activeHp:17.39, candidateTieBreak:17, speed:10 |
| p2 | switch 3 | gymLeader | minimax | 2 | 119.2 | activeHp:-28.09, speed:-12, lowHpPressure:10 |
| p1 | move 1 | champion | minimax | 3 | 213.65 | activeHp:19.07, candidateTieBreak:17.68, speed:10, teamHp:-9.42 |
| p2 | switch 3 | gymLeader | minimax | 2 | 121.56 | speed:-12, lowHpPressure:10 |
| p1 | move 1 | champion | minimax | 3 | 200 | candidateTieBreak:17.05, lowHpPressure:-16, activeHp:-14.78, teamHp:-13.83 |

### q007-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p2
- turns: 9
- elapsedMs: 30267
- p1 team: Slither Wing L50 @ Life Orb (Protosynthesis) [closecombat / wildcharge / firstimpression / uturn], Sunflora L50 @ Choice Specs (Chlorophyll) [leafstorm / sludgebomb / earthpower / dazzlinggleam], Groudon L50 @ Leftovers (Drought) [precipiceblades / heatcrash / stealthrock / willowisp]
- p2 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / icebeam / psychic / trickroom]
- metrics: decisions=22, timeouts=1, switches=5, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/timeout: 1 AI decisions hit their search timeout

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 269.13 | activeHp:-30.78, bucket:22, candidateTieBreak:15.86, threat:-12 |
| p2 | move 2 | gymLeader | minimax | 2 | 407.69 | candidateTieBreak:38.29, activeHp:30.78, threat:12, lowHpPressure:10 |
| p1 | switch 3 | champion | minimax | 3 | 180.13 | bucket:68, activeHp:29.96, winCondition:28, role:22 |
| p2 | move 2 | gymLeader | minimax | 2 | 626.05 | koSwing:140, bucket:82, activeHp:61.66, candidateTieBreak:59.55 |
| p1 | move 1 | champion | minimax | 3 | 675.83 | koSwing:140, activeHp:87.74, bucket:82, candidateTieBreak:73.92 |
| p2 | move 1 | gymLeader | minimax | 2 | 142.72 | koSwing:-170, bucket:-92, activeHp:-40.54, speed:-36 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 176.81 | - |
| p1 | move 1 | champion | minimax | 3 | 242.44 | winCondition:28, bucket:22, candidateTieBreak:21.08, alive:18 |

### q008-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p2
- turns: 10
- elapsedMs: 14309
- p1 team: Walking Wake L50 @ Choice Specs (Protosynthesis) [flamethrower / hydropump / dracometeor / flipturn], Victreebel L50 @ Life Orb (Chlorophyll) [sludgewave / sunnyday / weatherball / powerwhip], Sunflora L50 @ Life Orb (Chlorophyll) [weatherball / earthpower / sunnyday / solarbeam]
- p2 team: Pachirisu L50 @ Heavy-Duty Boots (Volt Absorb) [discharge / uturn / superfang / encore], Tornadus L50 @ Choice Specs (Prankster) [bleakwindstorm / grassknot / heatwave / focusblast], Rabsca L50 @ Heavy-Duty Boots (Synchronize) [revivalblessing / bugbuzz / trickroom / psychic]
- metrics: decisions=24, timeouts=0, switches=8, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 251.57 | activeHp:55.1, winCondition:28, candidateTieBreak:24.64, bucket:22 |
| p2 | move 1 | gymLeader | minimax | 2 | 139.07 | activeHp:-55.1, speed:-12 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 179.62 | - |
| p1 | move 3 | champion | minimax | 3 | 227.36 | activeHp:43.09, winCondition:28, teamHp:23.56, candidateTieBreak:22.27 |
| p2 | move 3 | gymLeader | minimax | 2 | 153.54 | activeHp:-59.63, teamHp:-25.95, alive:-18, winCondition:18 |
| p1 | move 3 | champion | minimax | 3 | 273.4 | koSwing:140, activeHp:120, bucket:82, alive:36 |
| p2 | switch 2 | gymLeader | minimax | 2 | 125.24 | activeHp:-66.95, teamHp:-35.51, alive:-18, bucket:-18 |
| p1 | move 3 | champion | minimax | 3 | 251.29 | koSwing:140, activeHp:120, bucket:82, teamHp:43.17 |

### q009-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p2
- turns: 10
- elapsedMs: 35180
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [psychic / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [fireblast / icebeam / scald / trickroom]
- p2 team: Iron Treads L50 @ Assault Vest (Quark Drive) [ironhead / voltswitch / rapidspin / earthquake], Krookodile L50 @ Leftovers (Intimidate) [knockoff / gunkshot / earthquake / bulkup], Komala L50 @ Choice Scarf (Comatose) [uturn / earthquake / bodyslam / knockoff]
- metrics: decisions=24, timeouts=0, switches=6, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/ineffective-move (p1 t3 Psychic): Psychic had no effect on p2a: Krookodile

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 237.57 | activeHp:-39.61, bucket:22, speed:-12, threat:-12 |
| p2 | move 4 | gymLeader | minimax | 2 | 415.34 | candidateTieBreak:40.48, activeHp:39.61, winCondition:28, threat:12 |
| p1 | move 1 | champion | minimax | 3 | 279.28 | koSwing:140, bucket:82, speed:-36, activeHp:34.48 |
| p2 | move 4 | gymLeader | minimax | 2 | 640.22 | koSwing:140, bucket:82, candidateTieBreak:65.62, activeHp:65.45 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.18 | - |
| p1 | move 1 | champion | minimax | 3 | 54.08 | activeHp:28.08, alive:-18, teamHp:-13.28 |
| p2 | switch 2 | gymLeader | minimax | 2 | 129.14 | bucket:44, winCondition:28, activeHp:-19.37, alive:18 |
| p1 | move 4 | champion | minimax | 3 | 161.98 | activeHp:-78.26, teamHp:-20.76, alive:-18, threat:-12 |

### q010-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p2
- turns: 3
- elapsedMs: 15257
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [earthpower / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / icebeam / scald / trickroom]
- p2 team: Calyrex-Shadow L50 @ Life Orb (As One (Spectrier)) [pollenpuff / nastyplot / psyshock / astralbarrage], Cetitan L50 @ Life Orb (Sheer Force) [earthquake / liquidation / iceshard / iciclecrash], Spectrier L50 @ Leftovers (Grim Neigh) [substitute / terablast / shadowball / nastyplot]
- metrics: decisions=8, timeouts=0, switches=2, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 125.34 | activeHp:-57.99, speed:-12, threat:-12, teamHp:-8.38 |
| p2 | move 4 | gymLeader | minimax | 2 | 415.24 | activeHp:57.99, candidateTieBreak:44.85, winCondition:28, bucket:22 |
| p1 | switch 3 | champion | numeric-guard | 1 | 181.73 | - |
| p1 | move 1 | champion | minimax | 3 | 185.59 | activeHp:-24.09, teamHp:-20.81, alive:-18, speed:-12 |
| p2 | move 4 | gymLeader | minimax | 2 | 385.78 | candidateTieBreak:39.08, winCondition:28, activeHp:24.09, bucket:22 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.03 | - |
| p1 | move 1 | champion | minimax | 4 | 94.03 | activeHp:-66.95, teamHp:-44.34, alive:-36, speed:-12 |
| p2 | move 4 | gymLeader | minimax | 2 | 449.4 | activeHp:66.95, candidateTieBreak:50.07, teamHp:44.34, alive:36 |

### q011-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p1
- turns: 14
- elapsedMs: 48682
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [fireblast / hydropump / icebeam / trickroom]
- p2 team: Luvdisc L50 @ Heavy-Duty Boots (Swift Swim) [substitute / surf / flipturn / endeavor], Terapagos L50 @ Heavy-Duty Boots (Tera Shift) [darkpulse / terastarstorm / rapidspin / calmmind], Meowscarada L50 @ Life Orb (Protean) [tripleaxel / knockoff / toxicspikes / flowertrick]
- metrics: decisions=31, timeouts=0, switches=13, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | switch 3 | gymLeader | minimax | 2 | 174.88 | bucket:68, winCondition:28, activeHp:17.75, candidateTieBreak:14.97 |
| p1 | switch 2 | champion | minimax | 3 | 127.03 | activeHp:-96.52, bucket:-46, risk:-18, speed:-12 |
| p2 | move 4 | gymLeader | minimax | 2 | 369.5 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:33.6 |
| p1 | move 1 | champion | minimax | 3 | 738.46 | koSwing:140, activeHp:87.95, bucket:82, candidateTieBreak:64.69 |
| p2 | move 2 | gymLeader | minimax | 2 | 596.99 | koSwing:140, activeHp:108.15, bucket:82, candidateTieBreak:42.24 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.5 | - |
| p1 | move 2 | champion | minimax | 3 | 71.72 | activeHp:-18.98, alive:-18, speed:-12, teamHp:-11.65 |
| p2 | switch 2 | gymLeader | minimax | 2 | 121.36 | bucket:44, winCondition:28, activeHp:-25.78, alive:18 |

### q012-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p2
- turns: 7
- elapsedMs: 17390
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / earthpower / recover / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / psychic / scald / trickroom]
- p2 team: Enamorus-Therian L50 @ Choice Specs (Overcoat) [earthpower / psychic / moonblast / mysticalfire], Morpeko L50 @ Leftovers (Hunger Switch) [rapidspin / knockoff / protect / aurawheel], Breloom L50 @ Life Orb (Technician) [rocktomb / spore / machpunch / bulletseed]
- metrics: decisions=16, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 351.71 | candidateTieBreak:32.29, activeHp:31.02, bucket:22, threat:12 |
| p2 | move 1 | gymLeader | minimax | 2 | 238.12 | activeHp:-31.02, winCondition:18, candidateTieBreak:14.84, threat:-12 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.87 | - |
| p1 | switch 3 | champion | minimax | 3 | 127.33 | activeHp:-21.22, teamHp:-20.4, alive:-18, bucket:16 |
| p2 | switch 3 | gymLeader | minimax | 2 | 126.54 | bucket:44, activeHp:-34.11, winCondition:28, alive:18 |
| p1 | move 2 | champion | minimax | 3 | 356.53 | activeHp:39.37, candidateTieBreak:31.19, bucket:22, alive:-18 |
| p2 | switch 3 | gymLeader | minimax | 2 | 120.81 | activeHp:-31.87, alive:18, winCondition:18, bucket:16 |
| p1 | move 1 | champion | minimax | 3 | 155.9 | activeHp:66.45, bucket:22, alive:-18, candidateTieBreak:11.64 |

### q013-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p2
- turns: 8
- elapsedMs: 24291
- p1 team: Overqwil L50 @ Choice Band (Intimidate) [crunch / gunkshot / aquajet / liquidation], Basculin-Blue-Striped L50 @ Choice Band (Adaptability) [wavecrash / doubleedge / flipturn / aquajet], Mesprit L50 @ Choice Scarf (Levitate) [trick / dazzlinggleam / psychic / shadowball]
- p2 team: Veluza L50 @ Sitrus Berry (Sharpness) [aquacutter / nightslash / filletaway / psychocut], Magnezone L50 @ Leftovers (Analytic) [flashcannon / thunderbolt / bodypress / irondefense], Copperajah L50 @ Choice Band (Heavy Metal) [stoneedge / knockoff / heavyslam / heatcrash]
- metrics: decisions=19, timeouts=1, switches=5, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/timeout: 1 AI decisions hit their search timeout

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 422.01 | activeHp:63.49, candidateTieBreak:43.87, winCondition:28, bucket:22 |
| p2 | move 1 | gymLeader | minimax | 2 | 168.95 | activeHp:-63.49, speed:-12, threat:-12, teamHp:-9.17 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 184.7 | - |
| p1 | switch 3 | champion | minimax | 3 | 126.55 | bucket:44, winCondition:28, activeHp:-22.41, alive:18 |
| p2 | move 2 | gymLeader | minimax | 2 | 139.46 | teamHp:-19.5, alive:-18, activeHp:-14.99, candidateTieBreak:9.82 |
| p1 | move 4 | champion | minimax | 3 | 106.31 | activeHp:-45.44, winCondition:28, alive:18, teamHp:10.77 |
| p2 | move 2 | gymLeader | minimax | 2 | 130.37 | activeHp:94.39, bucket:22, alive:-18, candidateTieBreak:11.31 |
| p1 | switch 2 | champion | numeric-guard | 1 | 180.92 | - |

### q014-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p1
- turns: 14
- elapsedMs: 71508
- p1 team: Qwilfish-Hisui L50 @ Eviolite (Intimidate) [gunkshot / toxicspikes / crunch / spikes], Regice L50 @ Heavy-Duty Boots (Clear Body) [bodypress / icebeam / thunderwave / thunderbolt], Dragapult L50 @ Heavy-Duty Boots (Infiltrator) [uturn / hex / dragondarts / willowisp]
- p2 team: Victreebel L50 @ Life Orb (Chlorophyll) [swordsdance / suckerpunch / powerwhip / poisonjab], Cresselia L50 @ Leftovers (Levitate) [calmmind / psyshock / moonlight / thunderbolt], Mewtwo L50 @ Life Orb (Pressure) [aurasphere / nastyplot / darkpulse / psystrike]
- metrics: decisions=30, timeouts=3, switches=10, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/timeout: 3 AI decisions hit their search timeout

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 3 | champion | minimax | 3 | 127.21 | activeHp:69.91, bucket:44, winCondition:28, teamHp:18.77 |
| p2 | switch 2 | gymLeader | minimax | 2 | 183.58 | activeHp:-70.84, teamHp:-30.34, candidateTieBreak:13.39, speed:-12 |
| p1 | move 2 | champion | minimax | 3 | 203.25 | winCondition:28, teamHp:20.61, candidateTieBreak:19.5 |
| p2 | move 2 | gymLeader | minimax | 2 | 293.78 | winCondition:28, candidateTieBreak:27.21, bucket:22, activeHp:21.68 |
| p1 | switch 3 | champion | minimax | 3 | 125.52 | bucket:44, activeHp:33.84, speed:-30, winCondition:28 |
| p2 | move 2 | gymLeader | minimax | 2 | 512.93 | koSwing:140, bucket:82, activeHp:68.67, candidateTieBreak:53 |
| p1 | move 1 | champion | minimax | 3 | 325.39 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:32.6 |
| p2 | move 3 | gymLeader | minimax | 2 | 127.22 | koSwing:-170, winCondition:-140, bucket:-92, activeHp:-75.5 |

### q015-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p1
- turns: 16
- elapsedMs: 50924
- p1 team: Maushold L50 @ Wide Lens (Technician) [tidyup / populationbomb / encore / bite], Ho-Oh L50 @ Heavy-Duty Boots (Regenerator) [sacredfire / recover / bravebird / earthquake], Sawsbuck-Winter L50 @ Life Orb (Serene Grace) [hornleech / swordsdance / highhorsepower / headbutt]
- p2 team: Lunala L50 @ Leftovers (Shadow Shield) [moonlight / calmmind / moongeistbeam / moonblast], Bronzong L50 @ Chesto Berry (Levitate) [ironhead / bodypress / irondefense / rest], Volcarona L50 @ Heavy-Duty Boots (Flame Body) [bugbuzz / morningsun / quiverdance / fireblast]
- metrics: decisions=34, timeouts=0, switches=18, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 126.16 | bucket:44, winCondition:28, risk:10, candidateTieBreak:9.92 |
| p2 | switch 2 | gymLeader | minimax | 2 | 127.26 | winCondition:18, bucket:16, teamHp:-11.61, risk:10 |
| p1 | move 1 | champion | minimax | 3 | 410.38 | activeHp:93.31, candidateTieBreak:46.35, winCondition:28, bucket:22 |
| p2 | switch 2 | gymLeader | minimax | 2 | 120.17 | activeHp:-57.04, bucket:28, winCondition:28, teamHp:-14.69 |
| p1 | move 3 | champion | minimax | 3 | 275.44 | koSwing:140, activeHp:120, bucket:82, threat:30 |
| p2 | switch 2 | gymLeader | minimax | 2 | 121.96 | activeHp:-108.63, bucket:-46, teamHp:-29.84, winCondition:18 |
| p1 | move 1 | champion | minimax | 3 | 609.12 | koSwing:140, activeHp:111.88, bucket:82, candidateTieBreak:67.97 |
| p2 | switch 2 | gymLeader | minimax | 2 | 129.43 | activeHp:-90.35, bucket:28, teamHp:-24.03, threat:-12 |

### q016-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p1
- turns: 8
- elapsedMs: 12509
- p1 team: Avalugg-Hisui L50 @ Heavy-Duty Boots (Sturdy) [avalanche / recover / bodypress / stoneedge], Perrserker L50 @ Choice Band (Tough Claws) [knockoff / ironhead / uturn / closecombat], Basculin-Blue-Striped L50 @ Choice Band (Adaptability) [flipturn / doubleedge / wavecrash / aquajet]
- p2 team: Moltres-Galar L50 @ Weakness Policy (Berserk) [hurricane / nastyplot / fierywrath / agility], Oricorio-Sensu L50 @ Heavy-Duty Boots (Dancer) [quiverdance / hurricane / revelationdance / roost], Groudon L50 @ Leftovers (Drought) [swordsdance / precipiceblades / thunderwave / heatcrash]
- metrics: decisions=20, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 4 | champion | minimax | 3 | 459.27 | activeHp:95.87, candidateTieBreak:50.17, bucket:22, winCondition:18 |
| p2 | switch 3 | gymLeader | minimax | 2 | 128.73 | activeHp:-46.45, bucket:28, winCondition:28, speed:8 |
| p1 | move 1 | champion | minimax | 3 | 284.54 | activeHp:-22.44, candidateTieBreak:19.36, winCondition:18, threat:-12 |
| p2 | move 2 | gymLeader | minimax | 2 | 372.27 | candidateTieBreak:33.74, winCondition:28, activeHp:22.44, bucket:22 |
| p1 | move 1 | champion | minimax | 3 | 523.73 | koSwing:140, bucket:82, activeHp:39.12, candidateTieBreak:38.42 |
| p2 | move 2 | gymLeader | minimax | 2 | 608.67 | koSwing:140, bucket:82, candidateTieBreak:52.25, speed:28 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.11 | - |
| p1 | move 2 | champion | minimax | 3 | 159.84 | koSwing:140, activeHp:120, bucket:82, speed:-36 |

### q017-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p1
- turns: 10
- elapsedMs: 35760
- p1 team: Meowstic-F L50 @ Life Orb (Competitive) [nastyplot / psychic / alluringvoice / darkpulse], Porygon-Z L50 @ Life Orb (Adaptability) [terablast / agility / nastyplot / shadowball], Flapple L50 @ Wide Lens (Hustle) [dragondance / outrage / gravapple / suckerpunch]
- p2 team: Kingdra L50 @ Life Orb (Swift Swim) [dracometeor / wavecrash / raindance / hurricane], Alomomola L50 @ Heavy-Duty Boots (Regenerator) [wish / protect / scald / flipturn], Oricorio-Sensu L50 @ Heavy-Duty Boots (Dancer) [quiverdance / hurricane / revelationdance / roost]
- metrics: decisions=23, timeouts=0, switches=6, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 177.74 | activeHp:-64.67, threat:-12, teamHp:-9.34, candidateTieBreak:8.72 |
| p2 | move 1 | gymLeader | minimax | 2 | 308.18 | activeHp:64.67, candidateTieBreak:30.06, winCondition:28, bucket:22 |
| p1 | move 3 | champion | minimax | 3 | 220.04 | koSwing:140, bucket:82, speed:30, activeHp:26.25 |
| p2 | move 1 | gymLeader | minimax | 2 | 529.83 | koSwing:140, bucket:82, candidateTieBreak:55.1, activeHp:46.21 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 178.75 | - |
| p1 | switch 3 | champion | minimax | 3 | 181.57 | activeHp:-72.31, speed:-36, alive:18, threat:-12 |
| p2 | move 3 | gymLeader | minimax | 2 | 497.94 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:50.22 |
| p1 | switch 2 | champion | minimax | 3 | 126.59 | activeHp:-57.75, winCondition:28, alive:18, bucket:-18 |

### q018-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p2
- turns: 5
- elapsedMs: 20836
- p1 team: Flareon L50 @ Toxic Orb (Guts) [trailblaze / facade / flareblitz / willowisp], Terrakion L50 @ Life Orb (Justified) [stoneedge / earthquake / closecombat / swordsdance], Hawlucha L50 @ White Herb (Unburden) [acrobatics / encore / closecombat / swordsdance]
- p2 team: Oricorio L50 @ Heavy-Duty Boots (Dancer) [hurricane / revelationdance / quiverdance / roost], Kyogre L50 @ Choice Scarf (Drizzle) [icebeam / originpulse / waterspout / thunder], Kingdra L50 @ Lum Berry (Sniper) [wavecrash / outrage / waterfall / dragondance]
- metrics: decisions=13, timeouts=0, switches=5, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 140.44 | winCondition:18, candidateTieBreak:10.93 |
| p2 | switch 3 | gymLeader | minimax | 2 | 121.08 | bucket:44, winCondition:28, activeHp:-27.95, risk:10 |
| p1 | switch 3 | champion | minimax | 3 | 126.11 | activeHp:-48.36, winCondition:28, bucket:-18, risk:-18 |
| p2 | move 1 | gymLeader | minimax | 2 | 695.65 | koSwing:140, activeHp:103.6, bucket:82, candidateTieBreak:78.5 |
| p1 | move 3 | champion | minimax | 3 | 236.99 | koSwing:140, bucket:82, activeHp:51.95, speed:30 |
| p2 | move 1 | gymLeader | minimax | 2 | 453.04 | koSwing:140, bucket:82, activeHp:80.5, candidateTieBreak:45.05 |
| p1 | switch 3 | champion | numeric-guard | 1 | 181.41 | - |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 180.53 | - |

### q019-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p2
- turns: 7
- elapsedMs: 30372
- p1 team: Probopass L50 @ Leftovers (Magnet Pull) [flashcannon / bodypress / powergem / irondefense], Zapdos-Galar L50 @ Life Orb (Defiant) [closecombat / knockoff / bravebird / bulkup], Blastoise L50 @ White Herb (Torrent) [icebeam / shellsmash / earthquake / hydropump]
- p2 team: Barraskewda L50 @ Choice Band (Swift Swim) [poisonjab / flipturn / waterfall / closecombat], Poliwrath L50 @ Life Orb (Swift Swim) [liquidation / closecombat / knockoff / raindance], Beartic L50 @ Heavy-Duty Boots (Swift Swim) [earthquake / swordsdance / aquajet / iciclecrash]
- metrics: decisions=17, timeouts=1, switches=6, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/timeout: 1 AI decisions hit their search timeout

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 125.72 | bucket:44, speed:-36, winCondition:28, activeHp:-21.14 |
| p2 | move 4 | gymLeader | minimax | 2 | 695.46 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:77.83 |
| p1 | switch 3 | champion | minimax | 3 | 127.22 | activeHp:-42.91, bucket:28, winCondition:28, candidateTieBreak:13.29 |
| p2 | move 4 | gymLeader | minimax | 2 | 52.87 | koSwing:-170, winCondition:-140, bucket:-92, activeHp:-62.71 |
| p1 | switch 3 | champion | minimax | 3 | 126.54 | activeHp:-50.45, bucket:44, winCondition:28, teamHp:-15.69 |
| p2 | move 4 | gymLeader | minimax | 2 | 152.64 | koSwing:140, activeHp:120, bucket:82, speed:30 |
| p1 | move 3 | champion | minimax | 3 | 623.79 | koSwing:140, bucket:82, candidateTieBreak:69.78, activeHp:57.95 |
| p2 | move 4 | gymLeader | minimax | 2 | 43.66 | koSwing:-170, winCondition:-140, bucket:-100, threat:-30 |

### q020-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p1
- turns: 14
- elapsedMs: 44438
- p1 team: Clefable L50 @ Leftovers (Unaware) [moonblast / stealthrock / moonlight / knockoff], Gogoat L50 @ Leftovers (Sap Sipper) [bulkup / hornleech / milkdrink / earthquake], Plusle L50 @ Life Orb (Lightning Rod) [nastyplot / grassknot / alluringvoice / thunderbolt]
- p2 team: Barraskewda L50 @ Choice Band (Swift Swim) [throatchop / closecombat / flipturn / waterfall], Politoed L50 @ Chesto Berry (Drizzle) [encore / rest / surf / icebeam], Charizard L50 @ Heavy-Duty Boots (Blaze) [flamethrower / focusblast / hurricane / earthquake]
- metrics: decisions=30, timeouts=0, switches=14, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 78.56 | activeHp:29.77, winCondition:18, teamHp:14.32 |
| p2 | switch 2 | gymLeader | minimax | 2 | 125.02 | teamHp:-19.4, activeHp:-18.07, winCondition:18, bucket:16 |
| p1 | move 1 | champion | minimax | 3 | 186.59 | activeHp:47.81, teamHp:23.69, bucket:22, winCondition:18 |
| p2 | switch 2 | gymLeader | minimax | 2 | 120.7 | activeHp:-66.95, bucket:44, teamHp:-25.01, risk:10 |
| p1 | move 4 | champion | minimax | 3 | 91 | activeHp:63.8, teamHp:24.56, bucket:22, winCondition:18 |
| p2 | switch 2 | gymLeader | minimax | 2 | 126.86 | activeHp:-54.89, bucket:40, teamHp:-27.99, candidateTieBreak:11.53 |
| p1 | move 1 | champion | minimax | 3 | 186.72 | koSwing:140, activeHp:120, bucket:82, teamHp:37.4 |
| p2 | switch 2 | gymLeader | minimax | 2 | 123.82 | activeHp:-89.63, teamHp:-32.33, bucket:16, threat:-12 |
