# Sprites

Drop a PNG in this folder (any subfolder) and the game picks it up. The file name without `.png` is the
sprite key. Until a key has a PNG, the game keeps using its old canvas drawing, so you can replace things
one at a time. Which sprite each thing uses is set in `src/game/spriteBindings.ts`.

Art is drawn 1 pixel = 1 world pixel (the game zooms 2x). A standalone file always wins over a frame cut
from a sheet (see `SPRITE_FRAMES` in `src/game/assets.ts`).

| Key | What | Hitbox | Anchor |
|---|---|---|---|
| `player` | the player (faces right, mirrored when facing left) | 12x26 | bottom-middle of the hitbox |
| `slime_boots` | overlay on the player, same canvas size as `player` | | same as player |
| `wings`, `wings_flap`, `wings_infinite`, `wings_infinite_flap` | wings, centered on the player's back (only `wings` is required) | | center, at the player's shoulders |
| `zombie` | zombie (faces right) | 12x26 | bottom |
| `slime_blue` | slime | 14x12 | bottom |
| `slime_green` | green slime | 16x14 | bottom |
| `king_slime` | King Slime | 48x36 | bottom |
| `big_bad_eye`, `big_bad_eye_enraged` | Big Bad Eye (enraged = below 1500 HP, optional) | 40x40 | center |
| `eyelet`, `eyelet_purple`, `eyelet_golden` | eyelets | 14x14 | center |
| `descendant` | the Descendant (already done) | 56x56 | body center (see `SPRITE_PIVOTS`) |
| `descendant_sword_blue`, `descendant_sword_red` | his swords (already done, point left) | | center |
| `tile_dirt`, `tile_grass`, `tile_stone`, `tile_ore`, `tile_silver`, `tile_wood`, `tile_leaves`, `tile_platform`, `tile_door`, `tile_door_open`, `tile_bush` | tiles, 16x16 each (platform may be shorter) | | top-left corner on the tile |
| `held_<itemId>` or `<itemId>` | item held in the hand, e.g. `held_sword`, `held_gun`, `held_angel_blade`, `held_pickaxe` | | the grip is at the hand |
| `angel_blade_thrown` | the Angel Blade while it flies (optional, defaults to its held sprite) | | center |
| `bullet`, `bullet_honza`, `slime_ball` | projectiles; bullets point right | | center |

Held items point along `points` in `HELD_SPRITES` (right by default; pickaxes point up). To add a new held
item, add a line there if it does not point right.

Not sprites yet (still canvas): debris particles, mining cracks, the tile cursor, floating texts, the sword
swing arc, health bars. The hotbar, inventory and crafting icons are unchanged.
