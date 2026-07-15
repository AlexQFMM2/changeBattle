# Battle V4 AI Self-Play Exam Report

- generatedAt: 2026-07-15T01:48:06.607Z
- seed: ai-self-play
- ruleSet: gen9
- teamSize: 3
- forceLevel: 50
- archetypeAttempts: 64
- strictArchetype: false
- games: 20
- ended/maxTurns/stalled/failed: 20/0/0/0
- wins p1/p2: 13/7
- averageTurns: 16.6
- averageQuestionElapsedMs: 56658.1
- averageDecisionMs: 1478.54
- timeoutCount: 2
- maxSearchedDepth: 6
- slowestQuestion: q011-trick-room-vs-balanced (171164ms)
- teamCoreCompleteByArchetype: rain:8/8 (100%), sun:8/8 (100%), trick-room:8/8 (100%), balanced:8/8 (100%), setup-offense:8/8 (100%)
- blunders: severe=14, warning=12, info=0, questionsWithSevere=2, questionsWithWarnings=9
- blunderTopKinds: repeat-ineffective-move:14, ineffective-move:6, high-switch-rate:5, timeout:1

## Questions

| id | matchup | levels | status | winner | turns | elapsed ms | avg decision ms | max depth | notes |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| q001-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 15 | 65371 | 1979.28 | 4 | warnings:1, switch:8 |
| q002-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 25 | 71841 | 1138.67 | 4 | warnings:1, switch:39, weather:2 |
| q003-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 8 | 26080 | 1290.37 | 5 | switch:7 |
| q004-rain-vs-sun | rain vs sun | champion/gymLeader | ended | p1 | 9 | 36123 | 1731.8 | 4 | switch:9 |
| q005-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p1 | 28 | 111979 | 1811.48 | 5 | timeouts:2, warnings:2, switch:28 |
| q006-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p2 | 19 | 54851 | 1238.98 | 5 | switch:19 |
| q007-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p1 | 13 | 55445 | 1825.45 | 6 | switch:10 |
| q008-sun-vs-trick-room | sun vs trick-room | champion/gymLeader | ended | p1 | 10 | 24579 | 893.32 | 6 | warnings:1, switch:13 |
| q009-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p2 | 7 | 32835 | 1916.81 | 4 | warnings:1, switch:4 |
| q010-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p2 | 3 | 16178 | 1763.13 | 4 | switch:2 |
| q011-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p1 | 47 | 171164 | 1741.63 | 4 | switch:47 |
| q012-trick-room-vs-balanced | trick-room vs balanced | champion/gymLeader | ended | p2 | 8 | 20872 | 1032.89 | 4 | switch:7 |
| q013-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p1 | 14 | 28236 | 859.84 | 6 | warnings:1, switch:21 |
| q014-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p1 | 12 | 38399 | 1317.14 | 4 | warnings:1, switch:15 |
| q015-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p2 | 38 | 122835 | 1521.62 | 5 | severe:13, warnings:2, switch:35 |
| q016-balanced-vs-setup-offense | balanced vs setup-offense | champion/gymLeader | ended | p1 | 4 | 18682 | 1751.1 | 4 | switch:4 |
| q017-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p2 | 42 | 139580 | 1552.84 | 4 | severe:1, warnings:2, switch:57 |
| q018-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p2 | 7 | 24261 | 1433.5 | 5 | switch:7 |
| q019-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p1 | 10 | 33026 | 1366.83 | 4 | switch:7 |
| q020-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p1 | 13 | 40825 | 1404.14 | 4 | switch:13 |

## Per-Question Details

### q001-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 15
- elapsedMs: 65371
- p1 team: Ludicolo L50 @ Life Orb (Swift Swim) [icebeam / raindance / hydropump / gigadrain], Charizard L50 @ Heavy-Duty Boots (Blaze) [outrage / flareblitz / swordsdance / earthquake], Kyogre L50 @ Choice Scarf (Drizzle) [originpulse / waterspout / icebeam / thunder]
- p2 team: Groudon L50 @ Leftovers (Drought) [heatcrash / thunderwave / swordsdance / precipiceblades], Leafeon L50 @ Life Orb (Chlorophyll) [synthesis / swordsdance / knockoff / leafblade], Ninetales L50 @ Heavy-Duty Boots (Drought) [solarbeam / fireblast / nastyplot / scorchingsands]
- metrics: decisions=32, timeouts=0, switches=8, protect=0, setup=10, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/ineffective-move (p2 t6 Precipice Blades): Precipice Blades had no effect on p1a: Charizard

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | switch 2 | gymLeader | minimax | 2 | 128.13 | bucket:44, winCondition:28, alive:-18, lowHpPressure:10 |
| p1 | move 1 | champion | minimax | 3 | 199.06 | candidateTieBreak:21.43, alive:18, speed:-12, bucket:-8 |
| p2 | move 4 | gymLeader | minimax | 2 | 64.17 | alive:-18, lowHpPressure:12, speed:10, activeHp:-9.64 |
| p1 | switch 2 | champion | minimax | 3 | 180.83 | activeHp:63.78, winCondition:28, alive:18, risk:-18 |
| p2 | move 4 | gymLeader | minimax | 2 | 305.01 | koSwing:140, bucket:82, speed:30, threat:28 |
| p1 | move 3 | champion | minimax | 3 | 144.99 | activeHp:92.9, winCondition:28, specialMove:26, alive:18 |
| p2 | switch 2 | gymLeader | minimax | 2 | 181.81 | bucket:52, activeHp:-41.13, winCondition:28, role:22 |
| p1 | move 4 | champion | minimax | 3 | 305.26 | activeHp:62.7, candidateTieBreak:36.55, winCondition:28, bucket:22 |

### q002-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 25
- elapsedMs: 71841
- p1 team: Zapdos L50 @ Heavy-Duty Boots (Static) [uturn / discharge / roost / hurricane], Politoed L50 @ Choice Specs (Drizzle) [weatherball / icebeam / focusblast / hydropump], Poliwrath L50 @ Assault Vest (Water Absorb) [circlethrow / closecombat / knockoff / liquidation]
- p2 team: Torkoal L50 @ Heavy-Duty Boots (Drought) [yawn / solarbeam / earthquake / fireblast], Sunflora L50 @ Life Orb (Chlorophyll) [solarbeam / earthpower / sunnyday / weatherball], Walking Wake L50 @ Life Orb (Protosynthesis) [dracometeor / sunnyday / flamethrower / hydrosteam]
- metrics: decisions=61, timeouts=0, switches=39, protect=0, setup=0, hazard=0, weather=2
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/high-switch-rate: 39 AI switches across 25 turns; review for switch loops or forced-switch churn

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 292.72 | activeHp:94.59, teamHp:42.25, candidateTieBreak:33.59, lowHpPressure:30 |
| p2 | switch 3 | gymLeader | minimax | 2 | 124.67 | koSwing:-170, bucket:-138, activeHp:-120, role:-36 |
| p1 | switch 2 | champion | numeric-guard | 1 | 126.53 | - |
| p1 | switch 2 | champion | minimax | 3 | 126.4 | activeHp:73.26, bucket:44, teamHp:28.17, winCondition:28 |
| p2 | switch 3 | gymLeader | minimax | 2 | 178.65 | activeHp:-58.88, bucket:44, teamHp:-38.21, speed:-36 |
| p1 | move 1 | champion | minimax | 3 | 291.88 | activeHp:94.59, teamHp:43.37, candidateTieBreak:33.56, lowHpPressure:30 |
| p2 | switch 3 | gymLeader | minimax | 2 | 123.98 | koSwing:-170, bucket:-138, activeHp:-120, role:-36 |
| p1 | switch 2 | champion | numeric-guard | 1 | 128.29 | - |

### q003-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 8
- elapsedMs: 26080
- p1 team: Kyogre L50 @ Leftovers (Drizzle) [thunder / originpulse / icebeam / calmmind], Pelipper L50 @ Choice Specs (Drizzle) [hurricane / uturn / hydropump / weatherball], Victreebel L50 @ Life Orb (Chlorophyll) [suckerpunch / swordsdance / poisonjab / powerwhip]
- p2 team: Groudon L50 @ Leftovers (Drought) [heatcrash / stealthrock / precipiceblades / spikes], Sunflora L50 @ Life Orb (Chlorophyll) [weatherball / solarbeam / sunnyday / earthpower], Ninetales L50 @ Heavy-Duty Boots (Drought) [solarbeam / scorchingsands / nastyplot / fireblast]
- metrics: decisions=19, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 2 | champion | minimax | 3 | 200.8 | winCondition:28, candidateTieBreak:16.97, activeHp:-12.9 |
| p2 | move 3 | gymLeader | minimax | 2 | 178.4 | winCondition:28, role:-18, candidateTieBreak:13.36, activeHp:12.9 |
| p1 | move 2 | champion | minimax | 3 | 217.07 | koSwing:140, bucket:82, activeHp:54.84, winCondition:28 |
| p2 | move 3 | gymLeader | minimax | 2 | 218.11 | koSwing:140, bucket:82, activeHp:63.87, threat:30 |
| p1 | switch 3 | champion | numeric-guard | 1 | 180.73 | - |
| p1 | move 1 | champion | minimax | 3 | 306.92 | koSwing:140, activeHp:120, bucket:82, threat:30 |
| p2 | switch 3 | gymLeader | minimax | 2 | 172.83 | bucket:52, activeHp:-42.26, speed:-36, winCondition:28 |
| p1 | switch 2 | champion | minimax | 3 | 126.82 | activeHp:-20.6, alive:-18, winCondition:18, bucket:16 |

### q004-rain-vs-sun: rain vs sun

- status: ended
- winner: p1
- turns: 9
- elapsedMs: 36123
- p1 team: Luvdisc L50 @ Heavy-Duty Boots (Swift Swim) [substitute / endeavor / surf / whirlpool], Beartic L50 @ Heavy-Duty Boots (Swift Swim) [swordsdance / aquajet / iciclecrash / closecombat], Kingdra L50 @ Life Orb (Swift Swim) [raindance / wavecrash / hurricane / dracometeor]
- p2 team: Bellossom L50 @ Leftovers (Chlorophyll) [quiverdance / strengthsap / gigadrain / sludgebomb], Brute Bonnet L50 @ Leftovers (Protosynthesis) [crunch / suckerpunch / seedbomb / spore], Walking Wake L50 @ Life Orb (Protosynthesis) [hydrosteam / sunnyday / flamethrower / dracometeor]
- metrics: decisions=20, timeouts=0, switches=9, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 128.03 | bucket:44, winCondition:28, activeHp:-16.24, risk:10 |
| p2 | move 3 | gymLeader | minimax | 2 | 245.13 | activeHp:67.5, winCondition:28, candidateTieBreak:24.56, bucket:22 |
| p1 | move 3 | champion | minimax | 3 | 294.87 | candidateTieBreak:31.29, winCondition:28, bucket:22, activeHp:12.58 |
| p2 | switch 3 | gymLeader | minimax | 2 | 128.78 | bucket:28, winCondition:28, activeHp:-10, candidateTieBreak:8.61 |
| p1 | move 4 | champion | minimax | 3 | 183.48 | koSwing:140, activeHp:87.51, bucket:82, winCondition:28 |
| p2 | switch 3 | gymLeader | minimax | 2 | 122.72 | activeHp:-34.97, bucket:-18, risk:-18, teamHp:-11.8 |
| p1 | switch 3 | champion | minimax | 3 | 126.39 | bucket:44, winCondition:28, activeHp:21.24, candidateTieBreak:11.01 |
| p2 | switch 3 | gymLeader | minimax | 2 | 127.01 | activeHp:-56.7, bucket:28, teamHp:-14, candidateTieBreak:8.39 |

### q005-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p1
- turns: 28
- elapsedMs: 111979
- p1 team: Sandy Shocks L50 @ Heavy-Duty Boots (Protosynthesis) [thunderbolt / voltswitch / earthpower / thunderwave], Bellossom L50 @ Leftovers (Chlorophyll) [quiverdance / gigadrain / terablast / strengthsap], Ninetales L50 @ Heavy-Duty Boots (Drought) [solarbeam / fireblast / scorchingsands / nastyplot]
- p2 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [fireblast / hydropump / icebeam / trickroom]
- metrics: decisions=60, timeouts=2, switches=28, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=2, info=0, score=20
- blunderFindings: warning/timeout: 2 AI decisions hit their search timeout; warning/ineffective-move (p1 t9 Scorching Sands): Scorching Sands had no effect on p1a: Ninetales

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 3 | champion | minimax | 3 | 128.87 | bucket:44, winCondition:28, activeHp:14.09, risk:10 |
| p2 | move 2 | gymLeader | minimax | 2 | 142.26 | koSwing:140, bucket:82, activeHp:78.9, alive:18 |
| p1 | move 3 | champion | minimax | 3 | 218.84 | bucket:-30, candidateTieBreak:21.5, activeHp:-11.35 |
| p2 | move 1 | gymLeader | minimax | 2 | 117.33 | bucket:22, activeHp:11.35 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 181.78 | - |
| p1 | move 1 | champion | minimax | 3 | 101.4 | winCondition:28, activeHp:19.39, alive:18, candidateTieBreak:9.5 |
| p2 | switch 2 | gymLeader | minimax | 2 | 126.83 | activeHp:-29.5, alive:-18, bucket:16, candidateTieBreak:11.08 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 178.81 | - |

### q006-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p2
- turns: 19
- elapsedMs: 54851
- p1 team: Slither Wing L50 @ Life Orb (Protosynthesis) [wildcharge / firstimpression / closecombat / uturn], Victreebel L50 @ Life Orb (Chlorophyll) [sludgewave / sunnyday / weatherball / powerwhip], Walking Wake L50 @ Choice Specs (Protosynthesis) [dracometeor / hydropump / flipturn / flamethrower]
- p2 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [earthpower / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / psychic / scald / trickroom]
- metrics: decisions=42, timeouts=0, switches=19, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 3 | champion | minimax | 3 | 181.44 | bucket:68, role:22, activeHp:-17.41, threat:-12 |
| p2 | move 2 | gymLeader | minimax | 2 | 509.45 | koSwing:140, bucket:82, activeHp:70.28, candidateTieBreak:52.21 |
| p1 | switch 2 | champion | minimax | 3 | 180.1 | activeHp:-32.39, teamHp:-18.2, risk:-18, candidateTieBreak:16.48 |
| p2 | move 3 | gymLeader | minimax | 2 | 128.36 | koSwing:140, bucket:82, activeHp:77.57, threat:30 |
| p1 | switch 2 | champion | minimax | 3 | 126.46 | activeHp:-69.62, role:-24, teamHp:-20.38, lowHpPressure:-16 |
| p2 | move 2 | gymLeader | minimax | 2 | 534.46 | koSwing:140, activeHp:84.86, bucket:82, candidateTieBreak:58.09 |
| p1 | move 1 | champion | minimax | 3 | 178.61 | koSwing:-170, winCondition:-140, bucket:-92, activeHp:-45.97 |
| p2 | move 3 | gymLeader | minimax | 2 | 326.03 | koSwing:140, activeHp:92.15, bucket:82, threat:40 |

### q007-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p1
- turns: 13
- elapsedMs: 55445
- p1 team: Slither Wing L50 @ Life Orb (Protosynthesis) [closecombat / wildcharge / firstimpression / uturn], Sunflora L50 @ Choice Specs (Chlorophyll) [leafstorm / sludgebomb / earthpower / dazzlinggleam], Groudon L50 @ Leftovers (Drought) [precipiceblades / heatcrash / stealthrock / willowisp]
- p2 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / icebeam / psychic / trickroom]
- metrics: decisions=29, timeouts=0, switches=10, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | move 1 | gymLeader | minimax | 2 | 90.05 | activeHp:-31.51, speed:-12, threat:-12, lowHpPressure:-8 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 176.81 | - |
| p1 | move 1 | champion | minimax | 3 | 153.42 | winCondition:28, alive:18, role:-18, teamHp:16.38 |
| p2 | move 1 | gymLeader | minimax | 2 | 205.23 | activeHp:38.53, candidateTieBreak:18.63, alive:-18, teamHp:-11.77 |
| p1 | switch 3 | champion | minimax | 3 | 125.98 | bucket:52, winCondition:28, alive:18, candidateTieBreak:10.84 |
| p2 | move 2 | gymLeader | minimax | 2 | 223.04 | koSwing:140, bucket:82, activeHp:59.01, candidateTieBreak:20.1 |
| p1 | move 3 | champion | minimax | 3 | 551.42 | koSwing:140, activeHp:92.63, bucket:82, candidateTieBreak:54.91 |
| p2 | switch 2 | gymLeader | minimax | 2 | 123.27 | activeHp:-75.86, bucket:-46, speed:-30, teamHp:-25.8 |

### q008-sun-vs-trick-room: sun vs trick-room

- status: ended
- winner: p1
- turns: 10
- elapsedMs: 24579
- p1 team: Walking Wake L50 @ Choice Specs (Protosynthesis) [flamethrower / hydropump / dracometeor / flipturn], Victreebel L50 @ Life Orb (Chlorophyll) [sludgewave / sunnyday / weatherball / powerwhip], Sunflora L50 @ Life Orb (Chlorophyll) [weatherball / earthpower / sunnyday / solarbeam]
- p2 team: Pachirisu L50 @ Heavy-Duty Boots (Volt Absorb) [discharge / uturn / superfang / encore], Tornadus L50 @ Choice Specs (Prankster) [bleakwindstorm / grassknot / heatwave / focusblast], Rabsca L50 @ Heavy-Duty Boots (Synchronize) [revivalblessing / bugbuzz / trickroom / psychic]
- metrics: decisions=25, timeouts=0, switches=13, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/high-switch-rate: 13 AI switches across 10 turns; review for switch loops or forced-switch churn

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | switch 2 | gymLeader | minimax | 2 | 126.03 | activeHp:-44.63, bucket:28, winCondition:28, candidateTieBreak:8.41 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 178.9 | - |
| p1 | move 3 | champion | minimax | 3 | 149.36 | activeHp:31.65, winCondition:28, teamHp:21.91, alive:18 |
| p2 | switch 2 | gymLeader | minimax | 2 | 126.64 | activeHp:-50.14, bucket:28, winCondition:28, teamHp:-24.58 |
| p1 | switch 2 | champion | minimax | 3 | 127.65 | activeHp:45.12, bucket:44, winCondition:28, teamHp:23.85 |
| p2 | switch 2 | gymLeader | minimax | 2 | 123.04 | activeHp:-39.88, teamHp:-32.12, alive:-18, winCondition:18 |
| p1 | move 1 | champion | minimax | 3 | 172.07 | teamHp:28.35, winCondition:28, alive:18, activeHp:13.78 |
| p2 | move 4 | gymLeader | minimax | 2 | 206.18 | teamHp:-28.35, candidateTieBreak:18.06, alive:-18, winCondition:18 |

### q009-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p2
- turns: 7
- elapsedMs: 32835
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [psychic / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [fireblast / icebeam / scald / trickroom]
- p2 team: Iron Treads L50 @ Assault Vest (Quark Drive) [ironhead / voltswitch / rapidspin / earthquake], Krookodile L50 @ Leftovers (Intimidate) [knockoff / gunkshot / earthquake / bulkup], Komala L50 @ Choice Scarf (Comatose) [uturn / earthquake / bodyslam / knockoff]
- metrics: decisions=16, timeouts=0, switches=4, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/ineffective-move (p1 t3 Psychic): Psychic had no effect on p2a: Krookodile

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 251.57 | bucket:22, candidateTieBreak:17.76, speed:-12, activeHp:-9.64 |
| p2 | move 4 | gymLeader | minimax | 2 | 303.34 | winCondition:28, candidateTieBreak:26.48, bucket:22, speed:10 |
| p1 | move 1 | champion | minimax | 3 | 326.61 | koSwing:140, bucket:82, speed:-36, activeHp:30.5 |
| p2 | move 4 | gymLeader | minimax | 2 | 525.13 | koSwing:140, bucket:82, activeHp:61.36, candidateTieBreak:50.02 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.18 | - |
| p1 | move 1 | champion | minimax | 3 | 9.65 | activeHp:39.76, alive:-18, teamHp:-11.59 |
| p2 | switch 2 | gymLeader | minimax | 2 | 127.78 | bucket:44, winCondition:28, alive:18, candidateTieBreak:10.55 |
| p1 | switch 3 | champion | minimax | 3 | 127.86 | activeHp:-39.12, alive:-18, teamHp:-14.51, speed:-12 |

### q010-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p2
- turns: 3
- elapsedMs: 16178
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [earthpower / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / icebeam / scald / trickroom]
- p2 team: Calyrex-Shadow L50 @ Life Orb (As One (Spectrier)) [pollenpuff / nastyplot / psyshock / astralbarrage], Cetitan L50 @ Life Orb (Sheer Force) [earthquake / liquidation / iceshard / iciclecrash], Spectrier L50 @ Leftovers (Grim Neigh) [substitute / terablast / shadowball / nastyplot]
- metrics: decisions=8, timeouts=0, switches=2, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 136.42 | activeHp:-29.25, speed:-12 |
| p2 | move 4 | gymLeader | minimax | 2 | 303.24 | candidateTieBreak:31.08, activeHp:29.25, winCondition:28, bucket:22 |
| p1 | switch 3 | champion | numeric-guard | 1 | 181.73 | - |
| p1 | move 1 | champion | minimax | 3 | 112.89 | teamHp:-19.27, alive:-18, activeHp:-13.39, speed:-12 |
| p2 | move 4 | gymLeader | minimax | 2 | 279.78 | candidateTieBreak:29.09, winCondition:28, bucket:22, teamHp:19.27 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.03 | - |
| p1 | move 1 | champion | minimax | 4 | 101.03 | teamHp:-39.84, alive:-36, activeHp:-35.83, speed:-12 |
| p2 | move 4 | gymLeader | minimax | 2 | 320.9 | teamHp:39.84, alive:36, activeHp:35.83, candidateTieBreak:34.37 |

### q011-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p1
- turns: 47
- elapsedMs: 171164
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / recover / revivalblessing / trickroom], Slowbro L50 @ Leftovers (Regenerator) [fireblast / hydropump / icebeam / trickroom]
- p2 team: Luvdisc L50 @ Heavy-Duty Boots (Swift Swim) [substitute / surf / flipturn / endeavor], Terapagos L50 @ Heavy-Duty Boots (Tera Shift) [darkpulse / terastarstorm / rapidspin / calmmind], Meowscarada L50 @ Life Orb (Protean) [tripleaxel / knockoff / toxicspikes / flowertrick]
- metrics: decisions=96, timeouts=0, switches=47, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 3 | champion | minimax | 4 | 128.57 | activeHp:75.15, teamHp:38.06, alive:36, bucket:16 |
| p2 | move 2 | gymLeader | minimax | 2 | 45.1 | koSwing:-170, winCondition:-140, activeHp:-109.85, bucket:-92 |
| p1 | switch 3 | champion | minimax | 4 | 127.32 | activeHp:69.51, alive:36, teamHp:35.14, bucket:16 |
| p2 | move 2 | gymLeader | minimax | 2 | 119.73 | koSwing:-170, winCondition:-140, bucket:-92, activeHp:-84.97 |
| p1 | switch 3 | champion | minimax | 4 | 128.88 | activeHp:75.15, teamHp:37.96, alive:36, bucket:16 |
| p2 | move 2 | gymLeader | minimax | 2 | 40.17 | koSwing:-170, winCondition:-140, activeHp:-109.15, bucket:-92 |
| p1 | switch 3 | champion | minimax | 4 | 127.45 | activeHp:79.79, teamHp:36.62, alive:36, bucket:16 |
| p2 | move 3 | gymLeader | minimax | 2 | 107.16 | koSwing:-170, winCondition:-140, bucket:-92, activeHp:-90.06 |

### q012-trick-room-vs-balanced: trick-room vs balanced

- status: ended
- winner: p2
- turns: 8
- elapsedMs: 20872
- p1 team: Slowbro-Galar L50 @ Leftovers (Regenerator) [fireblast / psychic / shellsidearm / trickroom], Rabsca L50 @ Leftovers (Synchronize) [bugbuzz / earthpower / recover / trickroom], Slowbro L50 @ Leftovers (Regenerator) [hydropump / psychic / scald / trickroom]
- p2 team: Enamorus-Therian L50 @ Choice Specs (Overcoat) [earthpower / psychic / moonblast / mysticalfire], Morpeko L50 @ Leftovers (Hunger Switch) [rapidspin / knockoff / protect / aurawheel], Breloom L50 @ Life Orb (Technician) [rocktomb / spore / machpunch / bulletseed]
- metrics: decisions=18, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 256.71 | bucket:22, candidateTieBreak:20.29 |
| p2 | move 1 | gymLeader | minimax | 2 | 253.12 | candidateTieBreak:20.44, winCondition:18 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.87 | - |
| p1 | switch 3 | champion | minimax | 3 | 127.33 | activeHp:-21.22, teamHp:-20.4, alive:-18, bucket:16 |
| p2 | switch 3 | gymLeader | minimax | 2 | 126.54 | bucket:44, winCondition:28, activeHp:-22.6, alive:18 |
| p1 | move 2 | champion | minimax | 3 | 263.53 | candidateTieBreak:25.48, activeHp:24.9, bucket:22, alive:-18 |
| p2 | switch 3 | gymLeader | minimax | 2 | 120.81 | activeHp:-21.37, alive:18, winCondition:18, bucket:16 |
| p1 | move 1 | champion | minimax | 3 | 90.71 | activeHp:56.14, alive:-18, teamHp:-9.22 |

### q013-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p1
- turns: 14
- elapsedMs: 28236
- p1 team: Overqwil L50 @ Choice Band (Intimidate) [crunch / gunkshot / aquajet / liquidation], Basculin-Blue-Striped L50 @ Choice Band (Adaptability) [wavecrash / doubleedge / flipturn / aquajet], Mesprit L50 @ Choice Scarf (Levitate) [trick / dazzlinggleam / psychic / shadowball]
- p2 team: Veluza L50 @ Sitrus Berry (Sharpness) [aquacutter / nightslash / filletaway / psychocut], Magnezone L50 @ Leftovers (Analytic) [flashcannon / thunderbolt / bodypress / irondefense], Copperajah L50 @ Choice Band (Heavy Metal) [stoneedge / knockoff / heavyslam / heatcrash]
- metrics: decisions=31, timeouts=0, switches=21, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/high-switch-rate: 21 AI switches across 14 turns; review for switch loops or forced-switch churn

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | switch 2 | gymLeader | minimax | 2 | 126.08 | activeHp:-49.09, teamHp:-27.45, candidateTieBreak:11.44, lowHpPressure:-8 |
| p1 | switch 3 | champion | minimax | 3 | 127.62 | bucket:44, activeHp:36.88, winCondition:28, teamHp:25.69 |
| p2 | switch 2 | gymLeader | minimax | 2 | 122.58 | activeHp:-61.92, teamHp:-31.66, bucket:16, speed:-12 |
| p1 | move 4 | champion | minimax | 3 | 118.37 | activeHp:60.19, teamHp:31.41, winCondition:28, candidateTieBreak:10.67 |
| p2 | move 2 | gymLeader | minimax | 2 | 86.23 | activeHp:-60.19, teamHp:-31.41, lowHpPressure:-8 |
| p1 | switch 2 | champion | numeric-guard | 1 | 181.57 | - |
| p1 | switch 3 | champion | minimax | 3 | 128.17 | activeHp:53.28, bucket:44, winCondition:28, alive:-18 |
| p2 | switch 2 | gymLeader | minimax | 2 | 121.76 | activeHp:-78.75, teamHp:-18.18, alive:18, bucket:16 |

### q014-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p1
- turns: 12
- elapsedMs: 38399
- p1 team: Qwilfish-Hisui L50 @ Eviolite (Intimidate) [gunkshot / toxicspikes / crunch / spikes], Regice L50 @ Heavy-Duty Boots (Clear Body) [bodypress / icebeam / thunderwave / thunderbolt], Dragapult L50 @ Heavy-Duty Boots (Infiltrator) [uturn / hex / dragondarts / willowisp]
- p2 team: Victreebel L50 @ Life Orb (Chlorophyll) [swordsdance / suckerpunch / powerwhip / poisonjab], Cresselia L50 @ Leftovers (Levitate) [calmmind / psyshock / moonlight / thunderbolt], Mewtwo L50 @ Life Orb (Pressure) [aurasphere / nastyplot / darkpulse / psystrike]
- metrics: decisions=28, timeouts=0, switches=15, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=1, info=0, score=10
- blunderFindings: warning/high-switch-rate: 15 AI switches across 12 turns; review for switch loops or forced-switch churn

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 3 | champion | minimax | 3 | 127.6 | bucket:44, winCondition:28, activeHp:17.61, candidateTieBreak:13.45 |
| p2 | switch 3 | gymLeader | minimax | 2 | 126.25 | activeHp:-43.75, bucket:28, winCondition:28, teamHp:-20.05 |
| p1 | move 1 | champion | minimax | 3 | 265.36 | activeHp:-21.79, candidateTieBreak:19.36, teamHp:10.58 |
| p2 | move 3 | gymLeader | minimax | 2 | 313.25 | winCondition:28, candidateTieBreak:26.97, bucket:22, activeHp:21.79 |
| p1 | switch 2 | champion | numeric-guard | 1 | 129.06 | - |
| p1 | switch 3 | champion | minimax | 3 | 127.81 | bucket:28, winCondition:28, activeHp:12.53, teamHp:11.89 |
| p2 | move 1 | gymLeader | minimax | 2 | 279.87 | candidateTieBreak:30.45, bucket:22, activeHp:17.62, teamHp:-11.18 |
| p1 | move 3 | champion | minimax | 3 | 330.39 | koSwing:140, bucket:82, activeHp:72.32, candidateTieBreak:33.17 |

### q015-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p2
- turns: 38
- elapsedMs: 122835
- p1 team: Maushold L50 @ Wide Lens (Technician) [tidyup / populationbomb / encore / bite], Ho-Oh L50 @ Heavy-Duty Boots (Regenerator) [sacredfire / recover / bravebird / earthquake], Sawsbuck-Winter L50 @ Life Orb (Serene Grace) [hornleech / swordsdance / highhorsepower / headbutt]
- p2 team: Lunala L50 @ Leftovers (Shadow Shield) [moonlight / calmmind / moongeistbeam / moonblast], Bronzong L50 @ Chesto Berry (Levitate) [ironhead / bodypress / irondefense / rest], Volcarona L50 @ Heavy-Duty Boots (Flame Body) [bugbuzz / morningsun / quiverdance / fireblast]
- metrics: decisions=79, timeouts=0, switches=35, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=13, warning=2, info=0, score=1320
- blunderFindings: warning/ineffective-move (p1 t17 Earthquake): Earthquake had no effect on p2a: Bronzong; severe/repeat-ineffective-move (p1 t18 Earthquake): Earthquake had no effect on p2a: Bronzong (2 repeats for same target); severe/repeat-ineffective-move (p1 t19 Earthquake): Earthquake had no effect on p2a: Bronzong (3 repeats for same target); severe/repeat-ineffective-move (p1 t20 Earthquake): Earthquake had no effect on p2a: Bronzong (4 repeats for same target); warning/ineffective-move (p1 t23 High Horsepower): High Horsepower had no effect on p2a: Bronzong

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | move 2 | gymLeader | minimax | 2 | 20.37 | activeHp:36.65, winCondition:18, speed:-12, threat:-12 |
| p1 | switch 3 | champion | minimax | 3 | 181.79 | activeHp:-108.07, bucket:40, role:-24, candidateTieBreak:20.82 |
| p2 | move 2 | gymLeader | minimax | 2 | 23.37 | koSwing:140, activeHp:120, bucket:82, teamHp:18.92 |
| p1 | switch 3 | champion | numeric-guard | 1 | 181.23 | - |
| p1 | move 4 | champion | minimax | 3 | 317.96 | candidateTieBreak:37.19, bucket:22, alive:-18, threat:12 |
| p2 | move 1 | gymLeader | minimax | 2 | 21.81 | alive:18, winCondition:18, speed:-12, threat:-12 |
| p1 | move 4 | champion | minimax | 3 | 320.16 | candidateTieBreak:37.38, bucket:22, activeHp:-19.71, alive:-18 |
| p2 | move 2 | gymLeader | minimax | 2 | 27.03 | bucket:-30, activeHp:19.71, alive:18, winCondition:18 |

### q016-balanced-vs-setup-offense: balanced vs setup-offense

- status: ended
- winner: p1
- turns: 4
- elapsedMs: 18682
- p1 team: Avalugg-Hisui L50 @ Heavy-Duty Boots (Sturdy) [avalanche / recover / bodypress / stoneedge], Perrserker L50 @ Choice Band (Tough Claws) [knockoff / ironhead / uturn / closecombat], Basculin-Blue-Striped L50 @ Choice Band (Adaptability) [flipturn / doubleedge / wavecrash / aquajet]
- p2 team: Moltres-Galar L50 @ Weakness Policy (Berserk) [hurricane / nastyplot / fierywrath / agility], Oricorio-Sensu L50 @ Heavy-Duty Boots (Dancer) [quiverdance / hurricane / revelationdance / roost], Groudon L50 @ Leftovers (Drought) [swordsdance / precipiceblades / thunderwave / heatcrash]
- metrics: decisions=10, timeouts=0, switches=4, protect=0, setup=1, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 4 | champion | minimax | 3 | 319.77 | activeHp:70.68, candidateTieBreak:35.43, bucket:22, winCondition:18 |
| p2 | switch 3 | gymLeader | minimax | 2 | 128.73 | bucket:44, winCondition:28, activeHp:-12.26, threat:-12 |
| p1 | move 1 | champion | minimax | 3 | 207.54 | activeHp:-25.45, winCondition:18, candidateTieBreak:14.67, speed:-8 |
| p2 | move 2 | gymLeader | minimax | 2 | 252.67 | winCondition:28, activeHp:25.45, candidateTieBreak:22.47, bucket:22 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 176.88 | - |
| p1 | move 4 | champion | minimax | 3 | 412.41 | candidateTieBreak:50.98, bucket:22, teamHp:19.02, alive:18 |
| p2 | switch 3 | gymLeader | minimax | 2 | 127.65 | alive:-18, bucket:-18, risk:-18, teamHp:-16.45 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 179.43 | - |

### q017-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p2
- turns: 42
- elapsedMs: 139580
- p1 team: Meowstic-F L50 @ Life Orb (Competitive) [nastyplot / psychic / alluringvoice / darkpulse], Porygon-Z L50 @ Life Orb (Adaptability) [terablast / agility / nastyplot / shadowball], Flapple L50 @ Wide Lens (Hustle) [dragondance / outrage / gravapple / suckerpunch]
- p2 team: Kingdra L50 @ Life Orb (Swift Swim) [dracometeor / wavecrash / raindance / hurricane], Alomomola L50 @ Heavy-Duty Boots (Regenerator) [wish / protect / scald / flipturn], Oricorio-Sensu L50 @ Heavy-Duty Boots (Dancer) [quiverdance / hurricane / revelationdance / roost]
- metrics: decisions=88, timeouts=0, switches=57, protect=2, setup=0, hazard=0, weather=0
- blunders: severe=1, warning=2, info=0, score=120
- blunderFindings: warning/high-switch-rate: 57 AI switches across 42 turns; review for switch loops or forced-switch churn; warning/ineffective-move (p2 t37 Revelation Dance): Revelation Dance had no effect on p1a: Porygon-Z; severe/repeat-ineffective-move (p2 t39 Revelation Dance): Revelation Dance had no effect on p1a: Porygon-Z (2 repeats for same target)

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 3 | champion | minimax | 3 | 126.56 | bucket:68, activeHp:-52.65, candidateTieBreak:16.47, teamHp:-15.63 |
| p2 | switch 3 | gymLeader | minimax | 2 | 124.09 | bucket:44, winCondition:28, activeHp:13.59, candidateTieBreak:10.08 |
| p1 | move 4 | champion | minimax | 3 | 224.15 | candidateTieBreak:24.05, bucket:22, activeHp:-15.9, teamHp:-15.82 |
| p2 | switch 3 | gymLeader | minimax | 2 | 125.28 | activeHp:48.46, winCondition:18, bucket:16, teamHp:15.03 |
| p1 | switch 3 | champion | minimax | 3 | 128.15 | activeHp:-48.05, bucket:40, teamHp:-13.93, candidateTieBreak:10.41 |
| p2 | move 3 | gymLeader | minimax | 2 | 114.45 | koSwing:140, activeHp:90.36, bucket:82, teamHp:21.08 |
| p1 | switch 3 | champion | minimax | 3 | 181.15 | activeHp:-65.61, bucket:40, candidateTieBreak:22.99, teamHp:-19.62 |
| p2 | switch 3 | gymLeader | minimax | 2 | 129.35 | activeHp:45.35, bucket:44, winCondition:28, teamHp:14.75 |

### q018-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p2
- turns: 7
- elapsedMs: 24261
- p1 team: Flareon L50 @ Toxic Orb (Guts) [trailblaze / facade / flareblitz / willowisp], Terrakion L50 @ Life Orb (Justified) [stoneedge / earthquake / closecombat / swordsdance], Hawlucha L50 @ White Herb (Unburden) [acrobatics / encore / closecombat / swordsdance]
- p2 team: Oricorio L50 @ Heavy-Duty Boots (Dancer) [hurricane / revelationdance / quiverdance / roost], Kyogre L50 @ Choice Scarf (Drizzle) [icebeam / originpulse / waterspout / thunder], Kingdra L50 @ Lum Berry (Sniper) [wavecrash / outrage / waterfall / dragondance]
- metrics: decisions=16, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 126.82 | bucket:44, winCondition:28, activeHp:-20, candidateTieBreak:11.79 |
| p2 | switch 2 | gymLeader | minimax | 2 | 128.96 | bucket:44, winCondition:28, activeHp:-24.84, risk:10 |
| p1 | move 3 | champion | minimax | 3 | 226.57 | bucket:22, activeHp:-21.36, candidateTieBreak:13.51, speed:-12 |
| p2 | move 3 | gymLeader | minimax | 2 | 341.29 | candidateTieBreak:32.31, winCondition:28, bucket:22, activeHp:21.36 |
| p1 | switch 3 | champion | numeric-guard | 1 | 182.79 | - |
| p1 | move 3 | champion | minimax | 3 | 151.61 | winCondition:28, teamHp:-19.3, alive:-18, activeHp:-13.63 |
| p2 | switch 2 | gymLeader | minimax | 2 | 122.52 | bucket:44, winCondition:28, activeHp:-22.73, alive:18 |
| p1 | move 3 | champion | minimax | 3 | 41.36 | winCondition:28, alive:-18, activeHp:15.62, teamHp:-15.08 |

### q019-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p1
- turns: 10
- elapsedMs: 33026
- p1 team: Probopass L50 @ Leftovers (Magnet Pull) [flashcannon / bodypress / powergem / irondefense], Zapdos-Galar L50 @ Life Orb (Defiant) [closecombat / knockoff / bravebird / bulkup], Blastoise L50 @ White Herb (Torrent) [icebeam / shellsmash / earthquake / hydropump]
- p2 team: Barraskewda L50 @ Choice Band (Swift Swim) [poisonjab / flipturn / waterfall / closecombat], Poliwrath L50 @ Life Orb (Swift Swim) [liquidation / closecombat / knockoff / raindance], Beartic L50 @ Heavy-Duty Boots (Swift Swim) [earthquake / swordsdance / aquajet / iciclecrash]
- metrics: decisions=23, timeouts=0, switches=7, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 2 | champion | minimax | 3 | 127.6 | bucket:44, speed:-36, winCondition:28, activeHp:-21.14 |
| p2 | move 4 | gymLeader | minimax | 2 | 700.46 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:79.17 |
| p1 | move 1 | champion | minimax | 3 | 289.59 | activeHp:37.96, candidateTieBreak:32.53, winCondition:28, bucket:22 |
| p2 | move 4 | gymLeader | minimax | 2 | 58.87 | activeHp:-37.96, threat:-12, lowHpPressure:-8 |
| p2 | switch 3 | gymLeader | numeric-guard | 1 | 177.9 | - |
| p1 | switch 3 | champion | minimax | 3 | 127.12 | bucket:68, winCondition:28, alive:18, candidateTieBreak:11.67 |
| p2 | move 4 | gymLeader | minimax | 2 | 495.16 | koSwing:140, activeHp:120, bucket:82, speed:-36 |
| p1 | move 4 | champion | minimax | 3 | 119.23 | activeHp:-38.99, alive:18, candidateTieBreak:8.31 |

### q020-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p1
- turns: 13
- elapsedMs: 40825
- p1 team: Clefable L50 @ Leftovers (Unaware) [moonblast / stealthrock / moonlight / knockoff], Gogoat L50 @ Leftovers (Sap Sipper) [bulkup / hornleech / milkdrink / earthquake], Plusle L50 @ Life Orb (Lightning Rod) [nastyplot / grassknot / alluringvoice / thunderbolt]
- p2 team: Barraskewda L50 @ Choice Band (Swift Swim) [throatchop / closecombat / flipturn / waterfall], Politoed L50 @ Chesto Berry (Drizzle) [encore / rest / surf / icebeam], Charizard L50 @ Heavy-Duty Boots (Blaze) [flamethrower / focusblast / hurricane / earthquake]
- metrics: decisions=28, timeouts=0, switches=13, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 1 | champion | minimax | 3 | 138.61 | activeHp:62.39, bucket:22, winCondition:18, teamHp:14.4 |
| p2 | switch 3 | gymLeader | minimax | 2 | 127.96 | activeHp:-55.98, bucket:44, winCondition:28, teamHp:-13.75 |
| p1 | move 4 | champion | minimax | 3 | 96.57 | activeHp:63.35, bucket:22, winCondition:18, teamHp:14.81 |
| p2 | switch 2 | gymLeader | minimax | 2 | 126.29 | activeHp:-18.07, winCondition:18, teamHp:-16.83, bucket:16 |
| p1 | move 1 | champion | minimax | 3 | 124.31 | activeHp:39.1, teamHp:19.87, winCondition:18, candidateTieBreak:11.22 |
| p2 | switch 3 | gymLeader | minimax | 2 | 109.81 | activeHp:-75.1, bucket:44, role:36, teamHp:-22.95 |
| p1 | move 1 | champion | minimax | 3 | 339.82 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:33.52 |
| p2 | switch 3 | gymLeader | minimax | 2 | 172.63 | activeHp:-50.11, bucket:40, teamHp:-32.07, role:22 |

