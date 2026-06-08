# 战斗背景生成提示词

## 通用要求

每次只生成一张图。可以把已经满意的山地战斗背景作为参考图一起给 GPT-image2，让它保持同样的像素风、透视、光影和宝可梦战斗场景构图。

推荐尺寸：`1280 x 348`

这是当前桌面端战斗场地的 2 倍尺寸。实际页面中间战斗区域约为 `640 x 174`，上下还有队伍栏和技能/日志 UI。

通用提示词：

```text
Create a 2D pixel-art Pokemon-style battle background.
Canvas size: 1280x348.
Very wide and short battle-field composition for a 640x174 in-game viewport.
Use the provided mountain battle background as the style reference: same pixel-art rendering, same soft-but-clear lighting, same natural battle arena perspective, same level of detail.

No UI, no health bars, no text, no menus, no Pokemon, no trainers, no characters.
Leave clear empty ground for two Pokemon sprites:
- player's back sprite standing area in the lower-left foreground, center around x=410, y=250
- enemy front sprite standing area in the upper-right midground, center around x=920, y=146

The scene should feel like an official Pokemon route battle background, not a full map screenshot.
Do not draw circular platforms unless they are naturally integrated into the terrain.
Keep the foreground readable and not too busy, so Pokemon sprites remain clear.
```

中文补充：

```text
生成宝可梦老世代风格的横向战斗背景图，不要 UI、不要血条、不要文字、不要宝可梦、不要训练师。
画面是战斗场景，不是地图截图。
左下前景预留我方宝可梦背面站位，右上中景预留对手宝可梦正面站位。
参考我提供的山地背景图，保持同样的像素风、色彩、清晰度、透视和战斗场地构图。
```

## 草原

```text
Theme: open grassland route battle background.
Create a bright grassy plain with rolling green hills, short grass patches, small wildflowers, and a few distant trees.
The lower-left foreground should have a clean grassy-dirt standing area for the player's Pokemon.
The upper-right midground should have a slightly raised grassy patch for the enemy Pokemon.
Use warm daylight, clear sky, and gentle depth.
Keep the battlefield open, clean, and readable.
```

## 森林

```text
Theme: forest route battle background.
Create a woodland clearing surrounded by trees, shrubs, mossy rocks, and dappled sunlight.
The lower-left foreground should be an open dirt-and-grass clearing for the player's Pokemon.
The upper-right midground should be another open clearing near tree roots or low shrubs for the enemy Pokemon.
The trees should feel like part of the background, not pasted-on sprites.
Keep the center open enough for battle sprites and effects.
```

## 湖泊

```text
Theme: lakeside route battle background.
Create a calm lakeside battlefield with water in the left or rear background, reeds, stones, distant trees, and a soft reflection on the lake.
The lower-left foreground should be dry ground or short grass near the shore for the player's Pokemon.
The upper-right midground should be a clean shore patch or small raised bank for the enemy Pokemon.
Do not let water cover the Pokemon standing areas.
Keep the lake visible but not visually overwhelming.
```

## 沙滩

```text
Theme: tropical resort beach battle background.
Create a bright Hawaiian-style sunny beach battlefield with white sand, turquoise ocean, an endless flat sea horizon, gentle waves, palm trees, colorful beach umbrellas, and a few lounge chairs or beach towels in the background.
The scene should feel like an open summer vacation beach, not a rocky cliff corner or narrow coastal route.
The lower-left foreground should be a clean sandy standing area for the player's Pokemon.
The upper-right midground should be another clean sandy standing area for the enemy Pokemon, slightly farther away but still on the same open beach.
Use mostly open sky, ocean horizon, beach sand, palms, and resort-beach details.
Avoid cliffs, caves, tall rock walls, enclosed coves, dark rocks, or too many boulders.
Keep the sand subtly textured but not cluttered, so Pokemon sprites remain readable.
```

## 海洋

```text
Theme: open ocean raft battle background.
Create a slightly absurd but charming Pokemon-style battle scene on an endless open ocean.
The background should show a vast blue sea stretching to a flat horizon, bright sky, and visible rolling waves.
There should be two separate wooden rafts floating on the water as the battle standing areas:
- a larger wooden raft in the lower-left foreground for the player's Pokemon
- a smaller/farther wooden raft in the upper-right midground for the enemy Pokemon
The rafts should look stable enough for Pokemon to stand on, with simple planks, rope, and soft water contact.
Add small waves, foam, and gentle splashes around the rafts so they feel floating on the sea.
Keep the composition readable and playful, not realistic-dangerous.
Avoid beaches, islands, cliffs, rocks, docks, ships, piers, or coastline; this should feel like open ocean in every direction.
Do not place Pokemon standing areas directly in water; only the two rafts are battle platforms.
```

## 雪地

```text
Theme: endless white snowfield battle background.
Create a vast open snowfield that feels almost completely white, quiet, and boundless.
The scene should show a pale sky, a soft low horizon, wide untouched snow, faint snowdrifts, subtle wind lines, and light falling snow.
The lower-left foreground should be a slightly packed snow standing area for the player's Pokemon.
The upper-right midground should be another subtle packed snow standing area for the enemy Pokemon.
Use very soft blue-gray shadows and minimal texture so the field feels like a white expanse, not a busy winter forest.
Add only a few tiny details such as faint footprints, low snow ridges, or distant mist.
Avoid pine forests, large rocks, caves, buildings, ice crystals, or strong dark objects.
Keep enough contrast around the two standing areas so Pokemon sprites remain readable.
```

## 洞窟

```text
Theme: cave battle background.
Create an underground cave battlefield with stone floor, layered cave walls, small crystals, stalagmites, and dim natural light from an opening or glowing minerals.
The lower-left foreground should be a flat stone standing area for the player's Pokemon.
The upper-right midground should be another flat stone ledge for the enemy Pokemon.
Keep the cave dark but not muddy; sprites must remain visible.
Avoid heavy black shadows in the standing areas.
```

## 火山

```text
Theme: volcanic route battle background.
Create a volcanic battlefield with dark rock, warm orange lava glow in the distance, cracked ground, ash, and smoky atmosphere.
The lower-left foreground should be a safe dark-rock standing area for the player's Pokemon.
The upper-right midground should be a raised rock patch for the enemy Pokemon.
Do not put lava directly under Pokemon standing areas.
Keep the lava as background accent lighting, not the whole image.
```

## 遗迹

```text
Theme: ancient ruins battle background.
Create an old stone ruin battlefield with broken pillars, mossy tiles, carved stone walls, vines, and distant trees or sky.
The lower-left foreground should be a flat worn-stone standing area for the player's Pokemon.
The upper-right midground should be a raised broken-tile platform for the enemy Pokemon.
The scene should feel mysterious and ancient, but still clean and readable for battle.
Avoid modern buildings or UI-like shapes.
```

## 城市夜景

```text
Theme: neon downtown street battle background.
Create a lively city downtown night battle scene with neon lights, colorful shopfront glow, street lamps, wet pavement reflections, and a cheering crowd around the battle area.
The atmosphere should feel energetic, loud, and glamorous, like a street battle in a busy entertainment district.
The lower-left foreground should be a clear pavement standing area for the player's Pokemon.
The upper-right midground should be another clear pavement or street-plaza standing area for the enemy Pokemon.
Put cheering spectators around the edges and in the background, but keep them small and non-distracting.
Use bright neon colors, warm street lighting, and reflections, but keep the two Pokemon standing areas readable.
Avoid readable text, logos, UI, health bars, menus, modern cars blocking the field, or detailed individual faces.
The crowd should read as silhouettes or small pixel-art people cheering from the sidelines.
```

## 冠军专属舞台

```text
Theme: Champion final battle arena.
Create a dedicated Pokemon Champion battle stage, like an official tournament final arena rather than a palace.
It should feel prestigious, dramatic, and ceremonial, but still clearly built for Pokemon battles.
Use a wide polished battle floor, subtle glowing floor lines, spotlights, distant audience stands, large screens or abstract champion emblems, and a clean stadium-like backdrop.

Canvas size: 1280x348.
No UI, no health bars, no text, no menus, no Pokemon, no trainers, no characters.
Leave clear empty ground for two Pokemon sprites:
- player's back sprite standing area in the lower-left foreground, center around x=410, y=250
- enemy front sprite standing area in the upper-right midground, center around x=920, y=146

The stage should feel like a special final battle venue, not a royal palace.
Keep it fancy and champion-level, but not too busy.
Keep the Pokemon standing areas clean and readable.
Avoid castles, palaces, throne rooms, royal halls, giant marble staircases, fantasy temples, or overly ornate columns.
Avoid drawing circular UI platforms; if there are platforms, make them part of the floor architecture.
Use the provided mountain battle background as style reference for pixel-art rendering and perspective, but make this scene feel like a professional champion battle arena.
```

## 暂不处理

馆主暂时不单独做专属背景。先使用通用场地或冠军之外的普通主题，避免背景数量和维护成本一下子膨胀。
