// =====================================================================
// SPRITE BINDINGS: which sprite each thing in the game uses.
//
// To give something a sprite, drop a PNG with the right file name into src/assets/sprites/
// (see the keys below, or src/assets/sprites/README.md). Nothing else is needed: while a key has
// no PNG, the old canvas drawing is used. To add a NEW monster or item, add one line here.
// Sprite keys are file names without ".png". Art is drawn at 1 pixel = 1 world pixel
// (the game zooms 2x), so draw it at the size of the hitbox or a little bigger.
// =====================================================================
import { Tile, Enemy } from './types';
import type { Anchor } from './assets';

// ---- Monsters ----------------------------------------------------------------
export interface MonsterBinding {
  // One key, or a function returning key(s) to try in order (use it for states, e.g. enraged).
  sprite: string | ((e: Enemy) => string | string[]);
  anchor?: Anchor;           // 'bottom' for things that stand on the ground, 'center' (default) for flyers
  faces?: 'left' | 'right';  // direction the art faces; it is mirrored when the monster goes the other way
}

export const MONSTER_SPRITES: Record<string, MonsterBinding> = {
  zombie: { sprite: 'zombie', anchor: 'bottom', faces: 'right' },                // hitbox 12x26
  slime: { sprite: 'slime_blue', anchor: 'bottom' },                             // hitbox 14x12
  green: { sprite: 'slime_green', anchor: 'bottom' },                            // hitbox 16x14
  boss: { sprite: 'king_slime', anchor: 'bottom' },                              // King Slime, hitbox 48x36
  eye: { sprite: (e) => (e.hp <= 1500 ? ['big_bad_eye_enraged', 'big_bad_eye'] : 'big_bad_eye') }, // hitbox 40x40
  eyelet: { sprite: 'eyelet' },                                                  // hitbox 14x14
  purple_eyelet: { sprite: 'eyelet_purple' },
  golden_eyelet: { sprite: 'eyelet_golden' },
  // The Descendant (+ his swords) is drawn by renderDescendant: 'descendant', 'descendant_sword_blue/red'.
};

// ---- Held items --------------------------------------------------------------
// Looks for 'held_<itemId>' first, then '<itemId>'. 'points' is the direction the art points in
// (the grip is the opposite end), so it can be aimed at the cursor.
export interface HeldBinding {
  points: 'right' | 'up' | 'left' | 'down';
  scale?: number;
  flipWhenAimingLeft?: boolean; // guns: mirror vertically so they are not upside down
}
export const HELD_DEFAULT: HeldBinding = { points: 'right' };
export const HELD_SPRITES: Record<string, HeldBinding> = {
  sword: { points: 'right' },
  silver_sword: { points: 'right' },
  boss_sword: { points: 'right' },
  angel_blade: { points: 'right' },
  gun: { points: 'right', flipWhenAimingLeft: true },
  honza: { points: 'right', flipWhenAimingLeft: true },
  pickaxe: { points: 'up', scale: 1.25 },
  stone_pickaxe: { points: 'up', scale: 1.25 },
  silver_pickaxe: { points: 'up', scale: 1.25 },
};
export const SWORD_ITEMS = ['sword', 'silver_sword', 'boss_sword']; // these swing in an arc when used

// ---- Tiles -------------------------------------------------------------------
// Drawn with their top-left corner on the tile. A tile with no sprite keeps its canvas drawing.
// Ore and silver fall back to the stone sprite plus canvas speckles until they get their own sprite.
export const TILE_SPRITE_KEYS: Partial<Record<Tile, string>> = {
  [Tile.DIRT]: 'tile_dirt',
  [Tile.GRASS]: 'tile_grass',
  [Tile.STONE]: 'tile_stone',
  [Tile.ORE]: 'tile_ore',
  [Tile.SILVER]: 'tile_silver',
  [Tile.WOOD]: 'tile_wood',
  [Tile.LEAVES]: 'tile_leaves',
  [Tile.PLATFORM]: 'tile_platform',
  [Tile.DOOR]: 'tile_door',
  [Tile.DOOR_OPEN]: 'tile_door_open',
  [Tile.BUSH]: 'tile_bush',
};

// ---- Player ------------------------------------------------------------------
// The player art faces right and is mirrored when facing left. 'player' is anchored at the bottom of the hitbox (12x26).
export const PLAYER_SPRITE = 'player';
export const BOOTS_SPRITE = 'slime_boots'; // overlay, same canvas size as the player
// Wings are centered on the player's back. Keys are tried in this order of "most specific first".
export const wingKeys = (infinite: boolean, flapping: boolean): string[] => [
  infinite && flapping ? 'wings_infinite_flap' : '',
  infinite ? 'wings_infinite' : '',
  flapping ? 'wings_flap' : '',
  'wings',
].filter(Boolean);

// ---- Projectiles ---------------------------------------------------------------
// Drawn pointing right and rotated along their direction of travel.
export const BULLET_SPRITE = 'bullet';
export const HONZA_BULLET_SPRITE = 'bullet_honza';
export const SLIME_BALL_SPRITE = 'slime_ball';
export const THROWN_BLADE_SPRITES = ['angel_blade_thrown', 'held_angel_blade', 'angel_blade'];
