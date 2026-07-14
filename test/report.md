# Battle V4 AI Self-Play Exam Report

- generatedAt: 2026-07-14T13:41:46.478Z
- seed: ai-self-play
- ruleSet: gen9
- teamSize: 3
- forceLevel: 50
- archetypeAttempts: 64
- strictArchetype: false
- games: 6
- ended/maxTurns/stalled/failed: 6/0/0/0
- wins p1/p2: 2/4
- averageTurns: 18.33
- averageQuestionElapsedMs: 90960.5
- averageDecisionMs: 1683.57
- timeoutCount: 25
- maxSearchedDepth: 6
- slowestQuestion: q006-balanced-vs-rain (328811ms)

## Questions

| id | matchup | levels | status | winner | turns | elapsed ms | avg decision ms | max depth | notes |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| q001-rain-vs-sand | rain vs sand | champion/gymLeader | ended | p2 | 14 | 41833 | 1203.81 | 5 | switch:9 |
| q002-sand-vs-trick-room | sand vs trick-room | champion/gymLeader | ended | p1 | 19 | 58874 | 1302.88 | 6 | switch:22 |
| q003-trick-room-vs-hazard-stack | trick-room vs hazard-stack | champion/gymLeader | ended | p1 | 23 | 66578 | 1326.54 | 4 | switch:21, hazard:5 |
| q004-hazard-stack-vs-setup-offense | hazard-stack vs setup-offense | champion/gymLeader | ended | p2 | 10 | 36344 | 1409.04 | 5 | switch:9 |
| q005-setup-offense-vs-balanced | setup-offense vs balanced | champion/gymLeader | ended | p2 | 5 | 13323 | 889 | 6 | switch:4 |
| q006-balanced-vs-rain | balanced vs rain | champion/gymLeader | ended | p2 | 39 | 328811 | 3970.16 | 5 | timeouts:25, switch:25 |

## Per-Question Details

### q001-rain-vs-sand: rain vs sand

- status: ended
- winner: p2
- turns: 14
- elapsedMs: 41833
- p1 team: Politoed L50 @ Choice Specs (Drizzle), Piloswine L50 @ Eviolite (Thick Fat), Emboar L50 @ Assault Vest (Reckless)
- p2 team: Tyranitar L50 @ Assault Vest (Sand Stream), Eiscue L50 @ Sitrus Berry (Ice Face), Granbull L50 @ Leftovers (Intimidate)
- metrics: decisions=32, timeouts=0, switches=9, protect=0, setup=0, hazard=0, weather=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 152.22 | activeHp:-33.39, teamHp:-27.96, candidateTieBreak:11.67, lowHpPressure:-8 |
| p2 | move 2 | gymLeader | minimax | 2 | 161.52 | activeHp:33.39, teamHp:27.96, candidateTieBreak:13.4, lowHpPressure:10 |
| p1 | move 2 | champion | minimax | 3 | 87.36 | activeHp:-43.49, teamHp:-29.42, lowHpPressure:-16, speed:8 |
| p2 | switch 3 | gymLeader | minimax | 2 | 120.54 | teamHp:18.33, lowHpPressure:10, activeHp:9.03, candidateTieBreak:8.26 |
| p1 | move 3 | champion | minimax | 3 | 272.09 | activeHp:-37.28, candidateTieBreak:26.61, teamHp:-22.41, bucket:22 |
| p2 | move 4 | gymLeader | minimax | 2 | 153.14 | activeHp:37.28, teamHp:22.41, lowHpPressure:20, speed:10 |
| p1 | switch 3 | champion | minimax | 3 | 181.43 | activeHp:-32.56, bucket:24, teamHp:-23.01, role:22 |
| p2 | move 3 | gymLeader | minimax | 2 | 404.59 | koSwing:140, bucket:82, activeHp:32.9, speed:30 |

### q002-sand-vs-trick-room: sand vs trick-room

- status: ended
- winner: p1
- turns: 19
- elapsedMs: 58874
- p1 team: Greedent L50 @ Sitrus Berry (Cheek Pouch), Azumarill L50 @ Choice Band (Huge Power), Gothitelle L50 @ Leftovers (Shadow Tag)
- p2 team: Yanmega L50 @ Choice Specs (Tinted Lens), Clodsire L50 @ Leftovers (Unaware), Rabsca L50 @ Heavy-Duty Boots (Synchronize)
- metrics: decisions=43, timeouts=0, switches=22, protect=0, setup=0, hazard=0, weather=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | switch 3 | gymLeader | minimax | 2 | 127.6 | activeHp:-60.56, bucket:40, alive:18, candidateTieBreak:10.79 |
| p1 | move 3 | champion | minimax | 3 | 553.07 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:58.51 |
| p2 | switch 2 | gymLeader | minimax | 2 | 117.99 | activeHp:-97.64, bucket:-46, speed:-36, alive:18 |
| p1 | move 4 | champion | minimax | 3 | 223.56 | activeHp:65.36, winCondition:28, candidateTieBreak:23.8, bucket:22 |
| p2 | move 4 | gymLeader | minimax | 2 | 148.45 | activeHp:-76.14, alive:18, field:14, teamHp:-10.22 |
| p1 | move 4 | champion | minimax | 3 | 425.25 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:43.5 |
| p2 | switch 2 | gymLeader | minimax | 2 | 182.62 | activeHp:-90.83, role:22, alive:18, bucket:16 |
| p1 | move 3 | champion | minimax | 3 | 552.21 | koSwing:140, activeHp:120, bucket:82, candidateTieBreak:57.95 |

### q003-trick-room-vs-hazard-stack: trick-room vs hazard-stack

- status: ended
- winner: p1
- turns: 23
- elapsedMs: 66578
- p1 team: Tropius L50 @ Sitrus Berry (Harvest), Toxtricity L50 @ Throat Spray (Punk Rock), Mamoswine L50 @ Life Orb (Thick Fat)
- p2 team: Smeargle L50 @ Focus Sash (Own Tempo), Iron Treads L50 @ Assault Vest (Quark Drive), Donphan L50 @ Leftovers (Sturdy)
- metrics: decisions=48, timeouts=0, switches=21, protect=0, setup=0, hazard=5, weather=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | switch 3 | champion | minimax | 3 | 126.92 | activeHp:53.9, bucket:44, winCondition:28, teamHp:24.69 |
| p2 | move 4 | gymLeader | minimax | 2 | 72.22 | koSwing:-170, bucket:-92, activeHp:-37.41, speed:-36 |
| p1 | switch 2 | champion | minimax | 3 | 126.45 | activeHp:58.98, teamHp:23.08, lowHpPressure:20, winCondition:18 |
| p2 | move 4 | gymLeader | minimax | 2 | 74.32 | koSwing:-170, activeHp:-92.91, bucket:-92, teamHp:-30.32 |
| p1 | switch 2 | champion | minimax | 3 | 127.09 | activeHp:45.46, bucket:44, winCondition:28, lowHpPressure:20 |
| p2 | move 4 | gymLeader | minimax | 2 | 82.32 | koSwing:-170, bucket:-92, activeHp:-73.82, threat:-30 |
| p1 | switch 3 | champion | minimax | 3 | 128.4 | bucket:44, lowHpPressure:20, teamHp:17.83, candidateTieBreak:12.3 |
| p2 | move 2 | gymLeader | minimax | 2 | 52.98 | koSwing:-170, activeHp:-94.7, bucket:-92, threat:-30 |

### q004-hazard-stack-vs-setup-offense: hazard-stack vs setup-offense

- status: ended
- winner: p2
- turns: 10
- elapsedMs: 36344
- p1 team: Klefki L50 @ Leftovers (Prankster), Venomoth L50 @ Heavy-Duty Boots (Tinted Lens), Iron Thorns L50 @ Air Balloon (Quark Drive)
- p2 team: Tentacruel L50 @ Leftovers (Liquid Ooze), Toxicroak L50 @ Life Orb (Dry Skin), Salamence L50 @ Heavy-Duty Boots (Moxie)
- metrics: decisions=24, timeouts=0, switches=9, protect=0, setup=0, hazard=0, weather=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 118.17 | winCondition:18, candidateTieBreak:9.78 |
| p2 | switch 2 | gymLeader | minimax | 2 | 120.24 | bucket:44, winCondition:28, activeHp:-12.43, risk:10 |
| p1 | move 4 | champion | minimax | 3 | 108.14 | activeHp:-21.05, winCondition:18, speed:-12 |
| p2 | move 1 | gymLeader | minimax | 2 | 203.41 | winCondition:28, bucket:22, activeHp:21.05, candidateTieBreak:20.26 |
| p1 | switch 2 | champion | minimax | 3 | 181.36 | activeHp:44.91, bucket:28, winCondition:28, candidateTieBreak:18.74 |
| p2 | move 1 | gymLeader | minimax | 2 | 440.65 | koSwing:140, bucket:82, candidateTieBreak:45.54, activeHp:31.24 |
| p1 | switch 3 | champion | minimax | 3 | 127.5 | activeHp:76.25, winCondition:18, bucket:16, risk:10 |
| p2 | switch 2 | gymLeader | minimax | 2 | 179.5 | bucket:68, winCondition:28, role:22, candidateTieBreak:20.84 |

### q005-setup-offense-vs-balanced: setup-offense vs balanced

- status: ended
- winner: p2
- turns: 5
- elapsedMs: 13323
- p1 team: Gallade L50 @ Life Orb (Sharpness), Hitmontop L50 @ Leftovers (Technician), Clawitzer L50 @ Choice Specs (Mega Launcher)
- p2 team: Mabosstiff L50 @ Choice Band (Stakeout), Heatran L50 @ Air Balloon (Flash Fire), Dewgong L50 @ Heavy-Duty Boots (Thick Fat)
- metrics: decisions=13, timeouts=0, switches=4, protect=0, setup=0, hazard=0, weather=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 2 | champion | minimax | 3 | 380.19 | candidateTieBreak:31.13, speed:-12, bucket:-8 |
| p2 | move 3 | gymLeader | minimax | 2 | 359.1 | candidateTieBreak:28.13, speed:10, bucket:-8 |
| p1 | switch 3 | champion | numeric-guard | 1 | 181.18 | - |
| p1 | move 4 | champion | minimax | 3 | 93.07 | teamHp:-20.26, activeHp:-20.25, alive:-18, winCondition:18 |
| p2 | move 3 | gymLeader | minimax | 2 | 129.39 | winCondition:28, teamHp:20.26, activeHp:20.25, alive:18 |
| p1 | switch 2 | champion | minimax | 3 | 127.92 | teamHp:-27.5, activeHp:-18.41, alive:-18, bucket:-18 |
| p2 | move 3 | gymLeader | minimax | 2 | 150.38 | koSwing:140, bucket:82, activeHp:58.55, alive:36 |
| p1 | switch 2 | champion | numeric-guard | 1 | 179.77 | - |

### q006-balanced-vs-rain: balanced vs rain

- status: ended
- winner: p2
- turns: 39
- elapsedMs: 328811
- p1 team: Suicune L50 @ Leftovers (Pressure), Vikavolt L50 @ Heavy-Duty Boots (Levitate), Blastoise L50 @ White Herb (Torrent)
- p2 team: Pelipper L50 @ Heavy-Duty Boots (Drizzle), Groudon L50 @ Leftovers (Drought), Primarina L50 @ Leftovers (Torrent)
- metrics: decisions=82, timeouts=25, switches=25, protect=0, setup=18, hazard=0, weather=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 4 | champion | minimax | 5 | 102.51 | activeHp:65.78, winCondition:28, teamHp:9.5 |
| p2 | move 2 | gymLeader | minimax | 2 | 151.73 | activeHp:-87.38, specialMove:18, candidateTieBreak:17.86, teamHp:-12.62 |
| p1 | move 1 | champion | minimax | 5 | 145.34 | activeHp:58.04, winCondition:28, specialMove:26, candidateTieBreak:14.23 |
| p2 | move 2 | gymLeader | minimax | 2 | 155.58 | activeHp:-87.38, candidateTieBreak:18.26, specialMove:18, teamHp:-12.62 |
| p1 | move 1 | champion | minimax | 5 | 144.77 | activeHp:58.04, winCondition:28, specialMove:26, candidateTieBreak:14.12 |
| p2 | move 2 | gymLeader | minimax | 2 | 152.45 | activeHp:-87.38, specialMove:18, candidateTieBreak:17.82, teamHp:-12.62 |
| p1 | move 4 | champion | minimax | 5 | 103.58 | activeHp:65.78, winCondition:28, teamHp:9.5 |
| p2 | move 2 | gymLeader | minimax | 2 | 153.65 | activeHp:-87.38, specialMove:18, candidateTieBreak:17.95, teamHp:-12.62 |

