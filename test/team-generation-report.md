# Battle V4 Team Generation Report

- generatedAt: 2026-07-14T14:20:40.166Z
- seed: ai-team-generation
- ruleSet/mode: gen9/singles
- teamSize: 3
- aiLevel: rookie
- samplesPerArchetype: 1
- archetypeAttempts: 64
- includeLoose/includeStrict: true/true
- total/ok/failed: 6/6/0
- looseOk/strictOk/strictFallbacks: 3/3/1
- averageElapsedMs: 811

## Archetype Summary

| archetype | ok/total | avg best | avg structure | fulfilled | missing |
| --- | ---: | ---: | ---: | --- | --- |
| sun | 2/2 | 17 | 11 | off-plan-coverage, sun-abuser, sun-setter | sun-abuser, sun-setter |
| rain | 2/2 | 43.5 | 38 | off-plan-coverage, rain-abuser, rain-setter | - |
| trick-room | 2/2 | 14.5 | 12 | outside-trick-room-failsafe, slow-or-bulky-attacker, trick-room-setter | slow-or-bulky-attacker, trick-room-setter |

## Samples

### sun-loose-1

- ok: true
- elapsedMs: 1415
- bestScore: -10
- structureScore: -10
- fulfilled: off-plan-coverage
- missing: sun-setter, sun-abuser
- moveQuality: rookie, slots=2-2, adjusted=Azelf, Shiftry, Hydreigon
- messages: -

- Azelf L82 @ Choice Specs (Levitate) [uturn / fireblast]
- Shiftry L89 @ Heavy-Duty Boots (Wind Rider) [defog / knockoff]
- Hydreigon L79 @ Life Orb (Levitate) [nastyplot / fireblast]

### sun-strict-1

- ok: true
- elapsedMs: 601
- bestScore: 44
- structureScore: 32
- fulfilled: sun-setter, sun-abuser
- missing: -
- moveQuality: rookie, slots=2-2, adjusted=Groudon, Sunflora, Lilligant
- messages: -

- Groudon L72 @ Leftovers (Drought) [spikes / thunderwave]
- Sunflora L100 @ Life Orb (Chlorophyll) [weatherball / sunnyday]
- Lilligant L86 @ Life Orb (Chlorophyll) [terablast / quiverdance]

### rain-loose-1

- ok: true
- elapsedMs: 703
- bestScore: 45
- structureScore: 39
- fulfilled: rain-setter, rain-abuser, off-plan-coverage
- missing: -
- moveQuality: rookie, slots=2-2, adjusted=Slowking-Galar, Poliwrath, Pelipper
- messages: -

- Slowking-Galar L85 @ Leftovers (Regenerator) [toxicspikes / slackoff]
- Poliwrath L88 @ Leftovers (Water Absorb) [liquidation / knockoff]
- Pelipper L86 @ Choice Specs (Drizzle) [weatherball / hydropump]

### rain-strict-1

- ok: true
- elapsedMs: 1028
- bestScore: 42
- structureScore: 37
- fulfilled: rain-setter, rain-abuser, off-plan-coverage
- missing: -
- moveQuality: rookie, slots=2-2, adjusted=Poliwrath, Victreebel, Frosmoth
- messages: rain strict archetype pool could not produce a team; retried with scored soft archetype generation.

- Poliwrath L88 @ Life Orb (Swift Swim) [liquidation / raindance]
- Victreebel L90 @ Life Orb (Chlorophyll) [suckerpunch / swordsdance]
- Frosmoth L82 @ Heavy-Duty Boots (Ice Scales) [hurricane / quiverdance]

### trick-room-loose-1

- ok: true
- elapsedMs: 588
- bestScore: -14
- structureScore: -14
- fulfilled: outside-trick-room-failsafe
- missing: trick-room-setter, slow-or-bulky-attacker
- moveQuality: rookie, slots=2-2, adjusted=Passimian, Dedenne, Scyther
- messages: -

- Passimian L83 @ Choice Band (Defiant) [knockoff / closecombat]
- Dedenne L88 @ Sitrus Berry (Cheek Pouch) [superfang / dazzlinggleam]
- Scyther L82 @ Heavy-Duty Boots (Technician) [defog / uturn]

### trick-room-strict-1

- ok: true
- elapsedMs: 531
- bestScore: 43
- structureScore: 38
- fulfilled: trick-room-setter, slow-or-bulky-attacker, outside-trick-room-failsafe
- missing: -
- moveQuality: rookie, slots=2-2, adjusted=Rabsca, Uxie, Mamoswine
- messages: -

- Rabsca L91 @ Heavy-Duty Boots (Synchronize) [bugbuzz / trickroom]
- Uxie L83 @ Leftovers (Levitate) [thunderwave / knockoff]
- Mamoswine L81 @ Choice Band (Thick Fat) [knockoff / iceshard]

