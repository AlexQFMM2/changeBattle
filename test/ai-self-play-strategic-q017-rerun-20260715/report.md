# Battle V4 AI Self-Play Exam Report

- generatedAt: 2026-07-15T03:39:21.182Z
- seed: ai-self-play
- ruleSet: gen9
- teamSize: 3
- forceLevel: 50
- archetypeAttempts: 64
- strictArchetype: false
- games: 2
- ended/maxTurns/stalled/failed: 2/0/0/0
- wins p1/p2: 2/0
- averageTurns: 12
- averageQuestionElapsedMs: 41465
- averageDecisionMs: 1572.44
- timeoutCount: 0
- maxSearchedDepth: 4
- slowestQuestion: q002-rain-vs-setup-offense (48473ms)
- teamCoreCompleteByArchetype: setup-offense:2/2 (100%), rain:2/2 (100%)
- blunders: severe=0, warning=0, info=0, questionsWithSevere=0, questionsWithWarnings=0
- blunderTopKinds: -

## Questions

| id | matchup | levels | status | winner | turns | elapsed ms | avg decision ms | max depth | notes |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| q001-setup-offense-vs-rain | setup-offense vs rain | champion/gymLeader | ended | p1 | 8 | 34457 | 1807.89 | 4 | switch:6 |
| q002-rain-vs-setup-offense | rain vs setup-offense | champion/gymLeader | ended | p1 | 16 | 48473 | 1337 | 4 | switch:14 |

## Per-Question Details

### q001-setup-offense-vs-rain: setup-offense vs rain

- status: ended
- winner: p1
- turns: 8
- elapsedMs: 34457
- p1 team: Meowstic-F L50 @ Life Orb (Competitive) [nastyplot / psychic / alluringvoice / darkpulse], Porygon-Z L50 @ Life Orb (Adaptability) [terablast / agility / nastyplot / shadowball], Flapple L50 @ Wide Lens (Hustle) [dragondance / outrage / gravapple / suckerpunch]
- p2 team: Kingdra L50 @ Life Orb (Swift Swim) [dracometeor / wavecrash / raindance / hurricane], Alomomola L50 @ Heavy-Duty Boots (Regenerator) [wish / protect / scald / flipturn], Oricorio-Sensu L50 @ Heavy-Duty Boots (Dancer) [quiverdance / hurricane / revelationdance / roost]
- metrics: decisions=18, timeouts=0, switches=6, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p1 | move 3 | champion | minimax | 3 | 179.82 | activeHp:-64.67, stability:-26.72, strategic:-14, threat:-12 |
| p2 | move 1 | gymLeader | minimax | 2 | 311.6 | activeHp:64.67, candidateTieBreak:30.52, winCondition:28, strategic:24.5 |
| p1 | move 3 | champion | minimax | 3 | 216.93 | koSwing:140, bucket:82, strategic:44, speed:30 |
| p2 | move 1 | gymLeader | minimax | 2 | 531.7 | koSwing:140, bucket:82, candidateTieBreak:55.35, activeHp:47.7 |
| p2 | switch 2 | gymLeader | numeric-guard | 1 | 179.92 | - |
| p1 | switch 3 | champion | minimax | 3 | 181.61 | bucket:68, winCondition:28, strategic:22, stability:-19.32 |
| p2 | move 3 | gymLeader | minimax | 2 | 370.96 | koSwing:140, activeHp:120, bucket:82, strategic:38.03 |
| p1 | move 3 | champion | minimax | 3 | 273.24 | candidateTieBreak:32.28, winCondition:28, alive:18, lowHpPressure:-8 |

### q002-rain-vs-setup-offense: rain vs setup-offense

- status: ended
- winner: p1
- turns: 16
- elapsedMs: 48473
- p1 team: Golduck L50 @ Life Orb (Cloud Nine) [nastyplot / hydropump / grassknot / icebeam], Kyogre L50 @ Leftovers (Drizzle) [icebeam / thunder / originpulse / calmmind], Noivern L50 @ Heavy-Duty Boots (Infiltrator) [hurricane / dracometeor / defog / flamethrower]
- p2 team: Hitmonchan L50 @ Leftovers (Iron Fist) [bulkup / drainpunch / knockoff / rapidspin], Glimmora L50 @ Air Balloon (Toxic Debris) [earthpower / stealthrock / powergem / sludgewave], Chimecho L50 @ Leftovers (Levitate) [psyshock / recover / dazzlinggleam / calmmind]
- metrics: decisions=35, timeouts=0, switches=14, protect=0, setup=0, hazard=0, weather=0
- blunders: severe=0, warning=0, info=0, score=0

| player | choice | level | strategy | depth | score | value highlights |
| --- | --- | --- | --- | ---: | ---: | --- |
| p2 | move 2 | gymLeader | minimax | 2 | 181.98 | activeHp:-72.36, stability:-26.72, strategic:-14, candidateTieBreak:12.04 |
| p1 | move 3 | champion | minimax | 3 | 250.31 | candidateTieBreak:22.73, bucket:22, threat:12, speed:10 |
| p2 | move 2 | gymLeader | minimax | 2 | 173.09 | bucket:-30, stability:-24.56, strategic:-14, speed:-12 |
| p1 | switch 2 | champion | minimax | 3 | 126.67 | bucket:68, activeHp:34.85, winCondition:28, strategic:22 |
| p2 | move 2 | gymLeader | minimax | 2 | 215.74 | koSwing:140, bucket:82, strategic:44, activeHp:40.59 |
| p1 | move 1 | champion | minimax | 3 | 492.19 | koSwing:140, bucket:82, activeHp:72.28, candidateTieBreak:52.6 |
| p2 | switch 3 | gymLeader | minimax | 2 | 120.22 | bucket:44, speed:-36, winCondition:28, strategic:22 |
| p1 | move 2 | champion | minimax | 3 | 168.3 | koSwing:140, bucket:82, activeHp:72.28, strategic:38.26 |

