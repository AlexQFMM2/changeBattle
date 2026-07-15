# Battle V4 AI Self-Play Exam Report

- generatedAt: 2026-07-15T03:34:50.331Z
- seed: ai-self-play
- ruleSet: gen9
- teamSize: 3
- forceLevel: 50
- archetypeAttempts: 64
- strictArchetype: false
- games: 20
- ended/maxTurns/stalled/failed: 19/1/0/0
- wins p1/p2: 9/10
- averageTurns: 12.05
- averageQuestionElapsedMs: 36827.15
- averageDecisionMs: 1329.77
- timeoutCount: 4
- maxSearchedDepth: 6
- slowestQuestion: q001-rain-vs-sun (117737ms)
- teamCoreCompleteByArchetype: rain:8/8 (100%), sun:8/8 (100%), trick-room:8/8 (100%), balanced:8/8 (100%), setup-offense:8/8 (100%)
- blunders: severe=2, warning=7, info=0, questionsWithSevere=1, questionsWithWarnings=6
- blunderTopKinds: timeout:3, ineffective-move:2, repeat-ineffective-move:2, max-turns:1, high-switch-rate:1

## Questions

| id | matchup | levels | status | winner | turns | elapsed ms | avg decision ms | max depth | notes |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| q001-rain-vs-sun | rain vs sun | champion/gymLeader | max-turns | - | 50 | 117737 | 1154.17 | 4 | warnings:2, switch:88 |
| q002-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 12 | 29874 | 1052.26 | 4 | switch:8 |
| q003-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 9 | 35880 | 1632.86 | 4 | switch:9 |
| q004-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 11 | 39817 | 1529.88 | 4 | timeouts:1, warnings:1, switch:11, weather:1 |
| q005-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p2 | 21 | 67375 | 1465.27 | 4 | switch:21 |
| q006-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p2 | 16 | 33952 | 867.08 | 5 | switch:12 |
| q007-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p1 | 8 | 33765 | 1655.84 | 4 | switch:4 |
| q008-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p1 | 6 | 18207 | 1078.53 | 6 | switch:5 |
| q009-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p2 | 6 | 22749 | 1465.07 | 4 | warnings:1, switch:3 |
| q010-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p2 | 3 | 15547 | 1679.13 | 4 | switch:2 |
| q011-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p1 | 11 | 52281 | 1916.04 | 5 | timeouts:2, warnings:1, switch:7 |
| q012-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p2 | 7 | 17608 | 964.38 | 5 | switch:7 |
| q013-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p2 | 6 | 21302 | 1335.67 | 4 | switch:7 |
| q014-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p1 | 14 | 49556 | 1601.77 | 4 | timeouts:1, warnings:1, switch:11 |
| q015-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p2 | 14 | 35405 | 1129.9 | 4 | switch:13 |
| q016-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p2 | 8 | 11333 | 498.3 | 6 | switch:7 |
| q017-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p1 | 14 | 50109 | 1565.19 | 4 | severe:2, warnings:1, switch:12 |
| q018-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p2 | 6 | 15998 | 979.93 | 6 | switch:7 |
| q019-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p2 | 7 | 27050 | 1503.53 | 4 | switch:7 |
| q020-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p1 | 12 | 40998 | 1520.69 | 4 | switch:13 |

## Per-Question Details

### q001-rain-vs-sun: rain vs sun

- status: max-turns
- winner: -
- turns: 50
- elapsedMs: 117737
- p1 team: Ludicolo L50 @ Life Orb (Swift Swim) [icebeam / raindance / hydropump / gigadrain], Charizard L50 @ Heavy-Duty Boots (Blaze) [outrage / flareblitz / swordsdance / earthquake], Kyogre L50 @ Choice Scarf (Drizzle) [originpulse / waterspout / icebeam / thunder]
- p2 team: Groudon L50 @ Leftovers (Drought) [heatcrash / thunderwave / swordsdance / precipiceblades], Leafeon L50 @ Life Orb (Chlorophyll) [synthesis / swordsdance / knockoff / leafblade], Ninetales L50 @ Heavy-Duty Boots (Drought) [solarbeam / fireblast / nastyplot / scorchingsands]
- metrics: decisions=99, timeouts=0, switches=88, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=2, info=0, score=20
- blunderFindings: warning/max-turns: battle reached max turn limit at turn 50; warning/high-switch-rate: 88 AI switches across 50 turns; review for switch loops or forced-switch churn

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 128.06 | bucket:44, teamHp:31.81, activeHp:31.03, winCondition:28 |
| p2 | switch 3 | gymLeader | minimax | 2 | 125.48 | activeHp:-115.47, bucket:40, teamHp:-39.25, role:-24 |
| p1 | switch 2 | champion | minimax | 3 | 126.4 | activeHp:36.88, bucket:28, winCondition:28, teamHp:27.9 |
| p2 | switch 3 | gymLeader | minimax | 2 | 179.93 | koSwing:-170, winCondition:-140, bucket:-114, activeHp:-99.51 |
| p1 | switch 2 | champion | minimax | 3 | 126.97 | bucket:44, teamHp:31.81, activeHp:31.03, winCondition:28 |
| p2 | switch 3 | gymLeader | minimax | 2 | 130.63 | activeHp:-115.47, bucket:40, teamHp:-39.25, role:-24 |
| p1 | switch 2 | champion | minimax | 3 | 125.82 | activeHp:36.88, bucket:28, winCondition:28, teamHp:27.9 |
| p2 | switch 3 | gymLeader | minimax | 2 | 179.22 | koSwing:-170, winCondition:-140, bucket:-114, activeHp:-99.51 |

### q002-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 12
- elapsedMs: 29874
- p1 team: Zapdos L50 @ Heavy-Duty Boots (Static) [uturn / discharge / roost / hurricane], Politoed L50 @ Choice Specs (Drizzle) [weatherball / icebeam / focusblast / hydropump], Poliwrath L50 @ Assault Vest (Water Absorb) [circlethrow / closecombat / knockoff / liquidation]
- p2 team: Torkoal L50 @ Heavy-Duty Boots (Drought) [yawn / solarbeam / earthquake / fireblast], Sunflora L50 @ Life Orb (Chlorophyll) [solarbeam / earthpower / sunnyday / weatherball], Walking Wake L50 @ Life Orb (Protosynthesis) [dracometeor / sunnyday / flamethrower / hydrosteam]
- metrics: decisions=27, timeouts=0, switches=8, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | move 4 | gymLeader | minimax | 2 | 498.76 | koSwing:140, bucket:82, candidateTieBreak:52.08, strategic:44 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 183.56 | - |
| p1 | move 4 | champion | minimax | 3 | 676.23 | koSwing:140, bucket:82, candidateTieBreak:75.04, activeHp:56.59 |
| p2 | switch 3 | gymLeader | minimax | 2 | 122.48 | stability:-31.32, bucket:28, winCondition:28, activeHp:18.65 |
| p1 | switch 3 | champion | minimax | 3 | 127.35 | activeHp:-49.77, stability:-28.12, alive:18, winCondition:18 |
| p2 | move 1 | gymLeader | minimax | 2 | 261.7 | koSwing:140, activeHp:120, bucket:82, strategic:44 |
| p1 | switch 2 | champion | minimax | 3 | 126.45 | stability:-49.32, activeHp:-47.98, bucket:-46, speed:-36 |
| p2 | move 1 | gymLeader | minimax | 2 | 406.79 | koSwing:140, activeHp:108.32, bucket:82, candidateTieBreak:39.02 |

### q003-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 9
- elapsedMs: 35880
- p1 team: Kyogre L50 @ Leftovers (Drizzle) [thunder / originpulse / icebeam / calmmind], Pelipper L50 @ Choice Specs (Drizzle) [hurricane / uturn / hydropump / weatherball], Victreebel L50 @ Life Orb (Chlorophyll) [suckerpunch / swordsdance / poisonjab / powerwhip]
- p2 team: Groudon L50 @ Leftovers (Drought) [heatcrash / stealthrock / precipiceblades / spikes], Sunflora L50 @ Life Orb (Chlorophyll) [weatherball / solarbeam / sunnyday / earthpower], Ninetales L50 @ Heavy-Duty Boots (Drought) [solarbeam / scorchingsands / nastyplot / fireblast]
- metrics: decisions=21, timeouts=0, switches=9, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 2 | champion | minimax | 3 | 372.16 | candidateTieBreak:33.69, bucket:22, stability:-21.32, threat:12 |
| p2 | move 3 | gymLeader | minimax | 2 | 274.4 | bucket:22, stability:-21.32, candidateTieBreak:18.24, threat:-12 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 183.32 | - |
| p1 | move 3 | champion | minimax | 3 | 287.57 | bucket:22, stability:-21.32, candidateTieBreak:18.6, alive:18 |
| p2 | switch 3 | gymLeader | minimax | 2 | 122 | bucket:44, winCondition:28, strategic:22, teamHp:-19.35 |
| p1 | move 2 | champion | minimax | 3 | 249.59 | activeHp:36.65, winCondition:28, strategic:24.5, teamHp:22.63 |
| p2 | switch 3 | gymLeader | minimax | 2 | 127.2 | activeHp:-50.31, role:36, bucket:28, winCondition:28 |
| p1 | move 1 | champion | minimax | 3 | 3.12 | activeHp:-39.73, stability:-26.72, alive:18, candidateTieBreak:-15.6 |

### q004-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 11
- elapsedMs: 39817
- p1 team: Luvdisc L50 @ Heavy-Duty Boots (Swift Swim) [substitute / endeavor / surf / whirlpool], Beartic L50 @ Heavy-Duty Boots (Swift Swim) [swordsdance / aquajet / iciclecrash / closecombat], Kingdra L50 @ Life Orb (Swift Swim) [raindance / wavecrash / hurricane / dracometeor]
- p2 team: Bellossom L50 @ Leftovers (Chlorophyll) [quiverdance / strengthsap / gigadrain / sludgebomb], Brute Bonnet L50 @ Leftovers (Protosynthesis) [crunch / suckerpunch / seedbomb / spore], Walking Wake L50 @ Life Orb (Protosynthesis) [hydrosteam / sunnyday / flamethrower / dracometeor]
- metrics: decisions=25, timeouts=1, switches=11, protect=0, setup=0, hazard=0, weather=1
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/timeout: 1 AI decisions hit their search timeout

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | move 3 | gymLeader | minimax | 2 | 325.13 | activeHp:88.13, candidateTieBreak:34.16, winCondition:28, strategic:24.5 |
| p1 | move 3 | champion | minimax | 3 | 402.84 | candidateTieBreak:42.39, activeHp:35.79, winCondition:28, strategic:24.5 |
| p2 | switch 3 | gymLeader | minimax | 2 | 125.7 | bucket:28, winCondition:28, stability:-22.68, activeHp:-13.58 |
| p1 | move 2 | champion | minimax | 3 | -36.54 | activeHp:-58.56, stability:-44.68, strategic:-14, candidateTieBreak:-13.77 |
| p2 | move 4 | gymLeader | minimax | 2 | 238.37 | stability:-21.32, candidateTieBreak:20.35, speed:10, bucket:-8 |
| p1 | move 3 | champion | minimax | 3 | 206.63 | koSwing:140, activeHp:88.18, bucket:82, strategic:43.12 |
| p2 | switch 2 | gymLeader | minimax | 2 | 127.3 | activeHp:-49.19, stability:-40.68, bucket:-18, risk:-18 |
| p1 | switch 3 | champion | minimax | 3 | 127.24 | activeHp:36.6, bucket:28, winCondition:28, stability:-19.8 |

### q005-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p2
- turns: 21
- elapsedMs: 67375
- p1 team: Sandy Shocks L50 @ Heavy-Duty Boots (Protosynthesis) [thunderbolt / voltswitch / earthpower / thunderwave], Bellossom L50 @ Leftovers (Chlorophyll) [quiverdance / gigadrain / terablast / strengthsap], Ninetales L50 @ Heavy-Duty Boots (Drought) [solarbeam / fireblast / scorchingsands / nastyplot]
- p2 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [fireblast / hydropump / icebeam / trickroom]
- metrics: decisions=44, timeouts=0, switches=21, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 221.05 | activeHp:63.28, winCondition:28, strategic:24.5, bucket:22 |
| p2 | switch 3 | gymLeader | minimax | 2 | 130.46 | activeHp:-21.24, bucket:16, speed:-12, risk:10 |
| p1 | move 2 | champion | minimax | 3 | 481.13 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:51.25 |
| p2 | switch 3 | gymLeader | minimax | 2 | 126.16 | activeHp:-19.56, stability:-16.12, bucket:16, speed:-12 |
| p1 | move 1 | champion | minimax | 3 | 222.24 | activeHp:64.38, winCondition:28, strategic:24.5, bucket:22 |
| p2 | switch 3 | gymLeader | minimax | 2 | 127.14 | activeHp:-27.95, bucket:16, speed:-12, teamHp:-10.38 |
| p1 | move 2 | champion | minimax | 3 | 310.87 | activeHp:96.04, candidateTieBreak:34.59, winCondition:28, strategic:22.7 |
| p2 | switch 3 | gymLeader | minimax | 2 | 127.99 | bucket:16, activeHp:-12.6, speed:-12, threat:-12 |

### q006-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p2
- turns: 16
- elapsedMs: 33952
- p1 team: Slither Wing L50 @ Life Orb (Protosynthesis) [wildcharge / firstimpression / closecombat / uturn], Victreebel L50 @ Life Orb (Chlorophyll) [sludgewave / sunnyday / weatherball / powerwhip], Walking Wake L50 @ Choice Specs (Protosynthesis) [dracometeor / hydropump / flipturn / flamethrower]
- p2 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [earthpower / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / psychic / scald / trickroom]
- metrics: decisions=36, timeouts=0, switches=12, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 214.37 | koSwing:140, bucket:82, activeHp:81.08, strategic:43.82 |
| p2 | switch 3 | gymLeader | minimax | 2 | 125.75 | activeHp:-63.51, stability:-22.68, speed:-12, threat:-12 |
| p1 | move 1 | champion | minimax | 3 | 302.04 | koSwing:140, bucket:82, activeHp:81.08, strategic:44 |
| p2 | switch 3 | gymLeader | minimax | 2 | 172.57 | stability:-28.12, role:22, activeHp:-18.1, speed:-12 |
| p1 | move 1 | champion | minimax | 3 | 213.95 | stability:-18.44, candidateTieBreak:17.75, speed:10, bucket:-8 |
| p2 | move 3 | gymLeader | minimax | 2 | 195.46 | strategic:16.5, candidateTieBreak:15.04, lowHpPressure:12, speed:-12 |
| p1 | move 1 | champion | minimax | 3 | 252.8 | koSwing:140, bucket:82, strategic:43.21, activeHp:39.57 |
| p2 | move 2 | gymLeader | minimax | 2 | 274.52 | koSwing:140, bucket:82, activeHp:64.97, strategic:34.42 |

### q007-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p1
- turns: 8
- elapsedMs: 33765
- p1 team: Slither Wing L50 @ Life Orb (Protosynthesis) [closecombat / wildcharge / firstimpression / uturn], Sunflora L50 @ Choice Specs (Chlorophyll) [leafstorm / sludgebomb / earthpower / dazzlinggleam], Groudon L50 @ Leftovers (Drought) [precipiceblades / heatcrash / stealthrock / willowisp]
- p2 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / icebeam / psychic / trickroom]
- metrics: decisions=19, timeouts=0, switches=4, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 269.13 | activeHp:-30.78, bucket:22, stability:-21.32, candidateTieBreak:15.86 |
| p2 | move 2 | gymLeader | minimax | 2 | 407.69 | candidateTieBreak:38.29, activeHp:30.78, strategic:16.5, threat:12 |
| p1 | switch 3 | champion | minimax | 3 | 180.84 | bucket:68, winCondition:28, activeHp:26.64, role:22 |
| p2 | move 2 | gymLeader | minimax | 2 | 630.97 | koSwing:140, bucket:82, activeHp:64.97, candidateTieBreak:61.48 |
| p1 | move 1 | champion | minimax | 3 | 674.31 | koSwing:140, activeHp:91.61, bucket:82, candidateTieBreak:74.33 |
| p2 | move 1 | gymLeader | minimax | 2 | 121.96 | koSwing:-170, bucket:-92, activeHp:-46.4, stability:-37.2 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 176.81 | - |
| p1 | move 1 | champion | minimax | 3 | 240.77 | winCondition:28, strategic:24.5, bucket:22, candidateTieBreak:20.88 |

### q008-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p1
- turns: 6
- elapsedMs: 18207
- p1 team: Walking Wake L50 @ Choice Specs (Protosynthesis) [flamethrower / hydropump / dracometeor / flipturn], Victreebel L50 @ Life Orb (Chlorophyll) [sludgewave / sunnyday / weatherball / powerwhip], Sunflora L50 @ Life Orb (Chlorophyll) [weatherball / earthpower / sunnyday / solarbeam]
- p2 team: Pachirisu L50 @ Heavy-Duty Boots (Volt Absorb) [discharge / uturn / superfang / encore], Tornadus L50 @ Choice Specs (Prankster) [bleakwindstorm / grassknot / heatwave / focusblast], Rabsca L50 @ Heavy-Duty Boots (Synchronize) [revivalblessing / bugbuzz / trickroom / psychic]
- metrics: decisions=15, timeouts=0, switches=5, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 251.57 | activeHp:55.1, winCondition:28, candidateTieBreak:24.64, strategic:22.78 |
| p2 | move 1 | gymLeader | minimax | 2 | 139.07 | activeHp:-55.1, stability:-26.72, strategic:-14, speed:-12 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 179.62 | - |
| p1 | move 3 | champion | minimax | 3 | 227.36 | activeHp:43.09, winCondition:28, teamHp:23.56, strategic:23.4 |
| p2 | move 4 | gymLeader | minimax | 2 | 124.71 | activeHp:-43.09, teamHp:-23.56, alive:-18, winCondition:18 |
| p1 | switch 2 | champion | minimax | 3 | 126.15 | bucket:28, winCondition:28, alive:18, stability:-17.88 |
| p2 | switch 2 | gymLeader | minimax | 2 | 123.93 | stability:-43.88, teamHp:-27.75, activeHp:-22.19, alive:-18 |
| p1 | move 1 | champion | minimax | 3 | 284.99 | activeHp:-37.75, stability:-26.76, bucket:22, alive:18 |

### q009-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p2
- turns: 6
- elapsedMs: 22749
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [psychic / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [fireblast / icebeam / scald / trickroom]
- p2 team: Iron Treads L50 @ Assault Vest (Quark Drive) [ironhead / voltswitch / rapidspin / earthquake], Krookodile L50 @ Leftovers (Intimidate) [knockoff / gunkshot / earthquake / bulkup], Komala L50 @ Choice Scarf (Comatose) [uturn / earthquake / bodyslam / knockoff]
- metrics: decisions=14, timeouts=0, switches=3, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/ineffective-move (p1 t3 Psychic): Psychic had no effect on p2a: Krookodile

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 237.57 | activeHp:-39.61, bucket:22, strategic:16.5, speed:-12 |
| p2 | move 4 | gymLeader | minimax | 2 | 415.34 | candidateTieBreak:40.48, activeHp:39.61, winCondition:28, strategic:24.5 |
| p1 | move 1 | champion | minimax | 3 | 279.26 | koSwing:140, bucket:82, activeHp:38.45, speed:-36 |
| p2 | move 4 | gymLeader | minimax | 2 | 634.66 | koSwing:140, bucket:82, activeHp:70.91, candidateTieBreak:64.95 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.18 | - |
| p1 | move 1 | champion | minimax | 3 | 54.08 | activeHp:21.14, alive:-18, teamHp:-14.28 |
| p2 | switch 2 | gymLeader | minimax | 2 | 120.7 | bucket:44, winCondition:28, strategic:22, alive:18 |
| p1 | move 4 | champion | minimax | 3 | 161.98 | activeHp:-78.26, teamHp:-21.55, alive:-18, threat:-12 |

### q010-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p2
- turns: 3
- elapsedMs: 15547
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [earthpower / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / icebeam / scald / trickroom]
- p2 team: Calyrex-Shadow L50 @ Life Orb (As One (Spectrier)) [pollenpuff / nastyplot / psyshock / astralbarrage], Cetitan L50 @ Life Orb (Sheer Force) [earthquake / liquidation / iceshard / iciclecrash], Spectrier L50 @ Leftovers (Grim Neigh) [substitute / terablast / shadowball / nastyplot]
- metrics: decisions=8, timeouts=0, switches=2, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 125.34 | activeHp:-57.99, speed:-12, threat:-12, teamHp:-8.38 |
| p2 | move 4 | gymLeader | minimax | 2 | 415.24 | activeHp:57.99, candidateTieBreak:44.85, winCondition:28, strategic:24.5 |
| p1 | switch 3 | champion | numeric-guard | 1 | 181.73 | - |
| p1 | move 1 | champion | minimax | 3 | 185.59 | activeHp:-24.09, teamHp:-20.81, alive:-18, speed:-12 |
| p2 | move 4 | gymLeader | minimax | 2 | 385.78 | candidateTieBreak:39.08, winCondition:28, strategic:24.5, activeHp:24.09 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.03 | - |
| p1 | move 1 | champion | minimax | 4 | 94.03 | activeHp:-66.95, teamHp:-44.34, stability:-36.16, alive:-36 |
| p2 | move 4 | gymLeader | minimax | 2 | 449.4 | activeHp:66.95, candidateTieBreak:50.07, teamHp:44.34, alive:36 |

### q011-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p1
- turns: 11
- elapsedMs: 52281
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [fireblast / hydropump / icebeam / trickroom]
- p2 team: Luvdisc L50 @ Heavy-Duty Boots (Swift Swim) [substitute / surf / flipturn / endeavor], Terapagos L50 @ Heavy-Duty Boots (Tera Shift) [darkpulse / terastarstorm / rapidspin / calmmind], Meowscarada L50 @ Life Orb (Protean) [tripleaxel / knockoff / toxicspikes / flowertrick]
- metrics: decisions=26, timeouts=2, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/timeout: 2 AI decisions hit their search timeout

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 181.93 | candidateTieBreak:12.88, activeHp:9.42 |
| p2 | move 2 | gymLeader | minimax | 2 | 223.38 | winCondition:28, candidateTieBreak:19.52, activeHp:-9.42, strategic:8 |
| p1 | switch 3 | champion | minimax | 3 | 126.02 | activeHp:54.7, stability:-25.88, speed:-12, threat:-12 |
| p2 | move 2 | gymLeader | minimax | 2 | 261.83 | koSwing:140, bucket:82, strategic:42.54, speed:30 |
| p1 | move 1 | champion | minimax | 3 | 301.12 | koSwing:140, bucket:82, activeHp:71.6, strategic:36 |
| p2 | move 2 | gymLeader | minimax | 2 | 253.3 | koSwing:140, bucket:82, strategic:44, speed:30 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 178.69 | - |
| p1 | switch 2 | champion | minimax | 3 | 180.16 | activeHp:-96.52, stability:-49.32, bucket:-46, speed:-36 |

### q012-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p2
- turns: 7
- elapsedMs: 17608
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / earthpower / recover / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / psychic / scald / trickroom]
- p2 team: Enamorus-Therian L50 @ Choice Specs (Overcoat) [earthpower / psychic / moonblast / mysticalfire], Morpeko L50 @ Leftovers (Hunger Switch) [rapidspin / knockoff / protect / aurawheel], Breloom L50 @ Life Orb (Technician) [rocktomb / spore / machpunch / bulletseed]
- metrics: decisions=16, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 351.71 | candidateTieBreak:32.29, activeHp:31.02, bucket:22, strategic:15.01 |
| p2 | move 1 | gymLeader | minimax | 2 | 238.12 | activeHp:-31.02, winCondition:18, candidateTieBreak:14.84, threat:-12 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.87 | - |
| p1 | switch 3 | champion | minimax | 3 | 127.33 | activeHp:-21.22, teamHp:-20.4, alive:-18, bucket:16 |
| p2 | switch 3 | gymLeader | minimax | 2 | 126.54 | bucket:44, activeHp:-34.11, winCondition:28, alive:18 |
| p1 | move 2 | champion | minimax | 3 | 356.53 | activeHp:39.37, candidateTieBreak:31.19, bucket:22, alive:-18 |
| p2 | switch 3 | gymLeader | minimax | 2 | 120.81 | activeHp:-31.87, strategic:22, alive:18, winCondition:18 |
| p1 | move 2 | champion | minimax | 3 | 161.47 | activeHp:63.78, bucket:22, alive:-18, strategic:13.09 |

### q013-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p2
- turns: 6
- elapsedMs: 21302
- p1 team: Overqwil L50 @ Choice Band (Intimidate) [crunch / gunkshot / aquajet / liquidation], Basculin-Blue-Striped L50 @ Choice Band (Adaptability) [wavecrash / doubleedge / flipturn / aquajet], Mesprit L50 @ Choice Scarf (Levitate) [trick / dazzlinggleam / psychic / shadowball]
- p2 team: Veluza L50 @ Sitrus Berry (Sharpness) [aquacutter / nightslash / filletaway / psychocut], Magnezone L50 @ Leftovers (Analytic) [flashcannon / thunderbolt / bodypress / irondefense], Copperajah L50 @ Choice Band (Heavy Metal) [stoneedge / knockoff / heavyslam / heatcrash]
- metrics: decisions=15, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 422.01 | activeHp:63.49, candidateTieBreak:43.87, winCondition:28, strategic:22.19 |
| p2 | move 1 | gymLeader | minimax | 2 | 168.95 | activeHp:-63.49, speed:-12, threat:-12, teamHp:-9.17 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 184.7 | - |
| p1 | switch 3 | champion | minimax | 3 | 126.55 | bucket:44, winCondition:28, activeHp:-22.41, strategic:22 |
| p2 | move 2 | gymLeader | minimax | 2 | 139.46 | teamHp:-19.5, alive:-18, activeHp:-14.99, candidateTieBreak:9.82 |
| p1 | switch 3 | champion | minimax | 3 | 126.9 | bucket:68, winCondition:28, activeHp:-23.86, strategic:22 |
| p2 | move 2 | gymLeader | minimax | 2 | 130.37 | activeHp:98.57, bucket:22, alive:-18, strategic:13.4 |
| p1 | switch 3 | champion | minimax | 3 | 180.94 | activeHp:-89.64, bucket:40, role:22, alive:18 |

### q014-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p1
- turns: 14
- elapsedMs: 49556
- p1 team: Qwilfish-Hisui L50 @ Eviolite (Intimidate) [gunkshot / toxicspikes / crunch / spikes], Regice L50 @ Heavy-Duty Boots (Clear Body) [bodypress / icebeam / thunderwave / thunderbolt], Dragapult L50 @ Heavy-Duty Boots (Infiltrator) [uturn / hex / dragondarts / willowisp]
- p2 team: Victreebel L50 @ Life Orb (Chlorophyll) [swordsdance / suckerpunch / powerwhip / poisonjab], Cresselia L50 @ Leftovers (Levitate) [calmmind / psyshock / moonlight / thunderbolt], Mewtwo L50 @ Life Orb (Pressure) [aurasphere / nastyplot / darkpulse / psystrike]
- metrics: decisions=30, timeouts=1, switches=11, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/timeout: 1 AI decisions hit their search timeout

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 3 | champion | minimax | 3 | 127.21 | activeHp:65.25, bucket:44, winCondition:28, strategic:22 |
| p2 | switch 2 | gymLeader | minimax | 2 | 117.82 | activeHp:-70.84, stability:-43.88, teamHp:-30.21, risk:-18 |
| p1 | move 2 | champion | minimax | 3 | 203.25 | stability:-24.56, activeHp:-21.68, teamHp:16.85, strategic:-14 |
| p2 | move 2 | gymLeader | minimax | 2 | 296.78 | winCondition:28, candidateTieBreak:27.57, strategic:24.5, bucket:22 |
| p1 | switch 3 | champion | minimax | 3 | 127.29 | bucket:68, activeHp:33.12, speed:-30, winCondition:28 |
| p2 | move 2 | gymLeader | minimax | 2 | 509.76 | koSwing:140, bucket:82, activeHp:69.4, candidateTieBreak:52.5 |
| p1 | move 1 | champion | minimax | 3 | 318.43 | koSwing:140, activeHp:120, bucket:82, strategic:44 |
| p2 | switch 3 | gymLeader | minimax | 2 | 122.51 | koSwing:-170, winCondition:-140, activeHp:-120, bucket:-110 |

### q015-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p2
- turns: 14
- elapsedMs: 35405
- p1 team: Maushold L50 @ Wide Lens (Technician) [tidyup / populationbomb / encore / bite], Ho-Oh L50 @ Heavy-Duty Boots (Regenerator) [sacredfire / recover / bravebird / earthquake], Sawsbuck-Winter L50 @ Life Orb (Serene Grace) [hornleech / swordsdance / highhorsepower / headbutt]
- p2 team: Lunala L50 @ Leftovers (Shadow Shield) [moonlight / calmmind / moongeistbeam / moonblast], Bronzong L50 @ Chesto Berry (Levitate) [ironhead / bodypress / irondefense / rest], Volcarona L50 @ Heavy-Duty Boots (Flame Body) [bugbuzz / morningsun / quiverdance / fireblast]
- metrics: decisions=30, timeouts=0, switches=13, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 126.64 | activeHp:64.69, bucket:44, winCondition:28, strategic:22 |
| p2 | switch 2 | gymLeader | minimax | 2 | 180.98 | activeHp:-61.4, bucket:44, speed:-36, winCondition:28 |
| p1 | switch 2 | champion | minimax | 3 | 126.96 | bucket:44, winCondition:28, strategic:22, candidateTieBreak:13.71 |
| p2 | switch 3 | gymLeader | minimax | 2 | 125.7 | activeHp:-53.54, stability:-31.32, bucket:28, winCondition:28 |
| p1 | move 4 | champion | minimax | 3 | 420.94 | candidateTieBreak:45.23, activeHp:40.03, winCondition:28, strategic:24.5 |
| p2 | switch 3 | gymLeader | minimax | 2 | 123.61 | activeHp:-61.4, bucket:44, winCondition:28, strategic:22 |
| p1 | switch 2 | champion | minimax | 3 | 127.32 | activeHp:49.88, bucket:44, winCondition:28, strategic:22 |
| p2 | switch 3 | gymLeader | minimax | 2 | 126.25 | activeHp:-74.53, stability:-40.68, teamHp:-31.24, bucket:-18 |

### q016-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p2
- turns: 8
- elapsedMs: 11333
- p1 team: Avalugg-Hisui L50 @ Heavy-Duty Boots (Sturdy) [avalanche / recover / bodypress / stoneedge], Perrserker L50 @ Choice Band (Tough Claws) [knockoff / ironhead / uturn / closecombat], Basculin-Blue-Striped L50 @ Choice Band (Adaptability) [flipturn / doubleedge / wavecrash / aquajet]
- p2 team: Moltres-Galar L50 @ Weakness Policy (Berserk) [hurricane / nastyplot / fierywrath / agility], Oricorio-Sensu L50 @ Heavy-Duty Boots (Dancer) [quiverdance / hurricane / revelationdance / roost], Groudon L50 @ Leftovers (Drought) [swordsdance / precipiceblades / thunderwave / heatcrash]
- metrics: decisions=20, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 4 | champion | minimax | 3 | 459.27 | activeHp:95.87, candidateTieBreak:50.17, strategic:24.5, bucket:22 |
| p2 | switch 3 | gymLeader | minimax | 2 | 128.73 | activeHp:-46.45, bucket:28, winCondition:28, stability:-22.68 |
| p1 | move 1 | champion | minimax | 3 | 284.54 | activeHp:-21.49, candidateTieBreak:19.31, winCondition:18, threat:-12 |
| p2 | move 2 | gymLeader | minimax | 2 | 373.51 | candidateTieBreak:33.89, winCondition:28, bucket:22, activeHp:21.49 |
| p1 | move 1 | champion | minimax | 3 | 523.07 | koSwing:140, bucket:82, strategic:44, candidateTieBreak:38.33 |
| p2 | move 2 | gymLeader | minimax | 2 | 603.03 | koSwing:140, bucket:82, candidateTieBreak:51.39, strategic:28.78 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.11 | - |
| p1 | move 2 | champion | minimax | 3 | 201.09 | koSwing:140, activeHp:120, bucket:82, strategic:44 |

### q017-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p1
- turns: 14
- elapsedMs: 50109
- p1 team: Meowstic-F L50 @ Life Orb (Competitive) [nastyplot / psychic / alluringvoice / darkpulse], Porygon-Z L50 @ Life Orb (Adaptability) [terablast / agility / nastyplot / shadowball], Flapple L50 @ Wide Lens (Hustle) [dragondance / outrage / gravapple / suckerpunch]
- p2 team: Kingdra L50 @ Life Orb (Swift Swim) [dracometeor / wavecrash / raindance / hurricane], Alomomola L50 @ Heavy-Duty Boots (Regenerator) [wish / protect / scald / flipturn], Oricorio-Sensu L50 @ Heavy-Duty Boots (Dancer) [quiverdance / hurricane / revelationdance / roost]
- metrics: decisions=31, timeouts=0, switches=12, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=2, warning=1, info=0, score=210
- blunderFindings: warning/ineffective-move (p1 t6 Tera Blast): Tera Blast had no effect on p2a: Oricorio; severe/repeat-ineffective-move (p1 t8 Tera Blast): Tera Blast had no effect on p2a: Oricorio (2 repeats for same target); severe/repeat-ineffective-move (p1 t10 Tera Blast): Tera Blast had no effect on p2a: Oricorio (3 repeats for same target)

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 127.78 | activeHp:-62.43, stability:-40.68, winCondition:28, alive:18 |
| p2 | move 2 | gymLeader | minimax | 2 | 483.74 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:46.14 |
| p1 | move 4 | champion | minimax | 3 | 251.35 | winCondition:28, candidateTieBreak:24.7, strategic:24.5, bucket:22 |
| p2 | switch 2 | gymLeader | minimax | 2 | 126.11 | strategic:22, alive:-18, winCondition:18, bucket:16 |
| p1 | move 1 | champion | minimax | 3 | 174.1 | winCondition:28, activeHp:27.79, alive:18, candidateTieBreak:13.66 |
| p2 | switch 2 | gymLeader | minimax | 2 | 123.54 | bucket:28, winCondition:28, activeHp:-25.2, stability:-19.8 |
| p1 | move 4 | champion | minimax | 3 | 252.48 | winCondition:28, candidateTieBreak:24.84, strategic:24.5, bucket:22 |
| p2 | switch 2 | gymLeader | minimax | 2 | 130.63 | strategic:22, alive:-18, winCondition:18, bucket:16 |

### q018-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p2
- turns: 6
- elapsedMs: 15998
- p1 team: Flareon L50 @ Toxic Orb (Guts) [trailblaze / facade / flareblitz / willowisp], Terrakion L50 @ Life Orb (Justified) [stoneedge / earthquake / closecombat / swordsdance], Hawlucha L50 @ White Herb (Unburden) [acrobatics / encore / closecombat / swordsdance]
- p2 team: Oricorio L50 @ Heavy-Duty Boots (Dancer) [hurricane / revelationdance / quiverdance / roost], Kyogre L50 @ Choice Scarf (Drizzle) [icebeam / originpulse / waterspout / thunder], Kingdra L50 @ Lum Berry (Sniper) [wavecrash / outrage / waterfall / dragondance]
- metrics: decisions=15, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 127.74 | bucket:44, activeHp:-29.83, winCondition:28, risk:10 |
| p2 | switch 3 | gymLeader | minimax | 2 | 121.08 | bucket:44, winCondition:28, activeHp:-27.95, strategic:22 |
| p1 | move 1 | champion | minimax | 3 | 256.29 | activeHp:-28.69, stability:-24.52, bucket:22, candidateTieBreak:12.78 |
| p2 | move 1 | gymLeader | minimax | 2 | 447.5 | candidateTieBreak:41.18, stability:-17.72, activeHp:13.04, speed:-12 |
| p1 | switch 3 | champion | minimax | 3 | 181.58 | activeHp:50.77, stability:-49.32, winCondition:28, bucket:-24 |
| p2 | move 1 | gymLeader | minimax | 2 | 683.77 | koSwing:140, bucket:82, candidateTieBreak:59.63, strategic:44 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 180.53 | - |
| p1 | switch 2 | champion | minimax | 3 | 125.94 | activeHp:-110.07, stability:-49.32, speed:-36, teamHp:-24.54 |

### q019-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p2
- turns: 7
- elapsedMs: 27050
- p1 team: Probopass L50 @ Leftovers (Magnet Pull) [flashcannon / bodypress / powergem / irondefense], Zapdos-Galar L50 @ Life Orb (Defiant) [closecombat / knockoff / bravebird / bulkup], Blastoise L50 @ White Herb (Torrent) [icebeam / shellsmash / earthquake / hydropump]
- p2 team: Barraskewda L50 @ Choice Band (Swift Swim) [poisonjab / flipturn / waterfall / closecombat], Poliwrath L50 @ Life Orb (Swift Swim) [liquidation / closecombat / knockoff / raindance], Beartic L50 @ Heavy-Duty Boots (Swift Swim) [earthquake / swordsdance / aquajet / iciclecrash]
- metrics: decisions=17, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 125.72 | bucket:44, speed:-36, winCondition:28, activeHp:-21.14 |
| p2 | move 4 | gymLeader | minimax | 2 | 695.46 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:77.83 |
| p1 | switch 3 | champion | minimax | 3 | 126.18 | activeHp:-42.91, bucket:28, winCondition:28, stability:-17.88 |
| p2 | move 4 | gymLeader | minimax | 2 | 52.87 | koSwing:-170, winCondition:-140, bucket:-92, stability:-61.36 |
| p1 | switch 3 | champion | minimax | 3 | 128.39 | activeHp:-51.82, bucket:44, winCondition:28, strategic:22 |
| p2 | move 4 | gymLeader | minimax | 2 | 152.64 | koSwing:140, activeHp:120, bucket:82, strategic:42.74 |
| p1 | move 3 | champion | minimax | 3 | 622.58 | koSwing:140, bucket:82, candidateTieBreak:69.64, activeHp:60 |
| p2 | move 4 | gymLeader | minimax | 2 | 43.66 | koSwing:-170, winCondition:-140, bucket:-100, stability:-59.2 |

### q020-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p1
- turns: 12
- elapsedMs: 40998
- p1 team: Clefable L50 @ Leftovers (Unaware) [moonblast / stealthrock / moonlight / knockoff], Gogoat L50 @ Leftovers (Sap Sipper) [bulkup / hornleech / milkdrink / earthquake], Plusle L50 @ Life Orb (Lightning Rod) [nastyplot / grassknot / alluringvoice / thunderbolt]
- p2 team: Barraskewda L50 @ Choice Band (Swift Swim) [throatchop / closecombat / flipturn / waterfall], Politoed L50 @ Chesto Berry (Drizzle) [encore / rest / surf / icebeam], Charizard L50 @ Heavy-Duty Boots (Blaze) [flamethrower / focusblast / hurricane / earthquake]
- metrics: decisions=26, timeouts=0, switches=13, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 79.37 | winCondition:18, strategic:8 |
| p2 | switch 3 | gymLeader | minimax | 2 | 122.59 | bucket:44, winCondition:28, activeHp:-24.9, strategic:22 |
| p1 | move 1 | champion | minimax | 3 | 409.27 | koSwing:140, activeHp:120, bucket:82, strategic:44 |
| p2 | switch 3 | gymLeader | minimax | 2 | 127.45 | bucket:68, activeHp:-42.8, winCondition:28, strategic:22 |
| p1 | move 1 | champion | minimax | 3 | 78.56 | activeHp:26.62, winCondition:18, teamHp:14.81, strategic:8 |
| p2 | switch 2 | gymLeader | minimax | 2 | 123.83 | strategic:22, teamHp:-20.02, activeHp:-18.07, winCondition:18 |
| p1 | move 1 | champion | minimax | 3 | 186.59 | activeHp:48.95, teamHp:24.48, bucket:22, strategic:19.35 |
| p2 | switch 2 | gymLeader | minimax | 2 | 130.69 | activeHp:-64.76, bucket:44, winCondition:28, teamHp:-25.74 |

