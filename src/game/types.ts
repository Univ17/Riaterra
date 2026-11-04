export enum Tile {
  AIR = 0,
  DIRT = 1,
  STONE = 2,
  GRASS = 3,
  ORE = 4, // Gold ore
  WOOD = 5,
  LEAVES = 6,
  PLATFORM = 7,
  DOOR = 8,
  DOOR_OPEN = 9,
  SILVER = 10,
  BUSH = 11,
}

export type ItemId =
  | 'sword'
  | 'silver_sword'
  | 'boss_sword'
  | 'angel_blade'
  | 'gun'
  | 'honza'
  | 'pickaxe'
  | 'stone_pickaxe'
  | 'silver_pickaxe'
  | 'dirt'
  | 'stone'
  | 'ore'
  | 'silver'
  | 'wood'
  | 'leaves'
  | 'platform'
  | 'door'
  | 'book'
  | 'relic'
  | 'potion'
  | 'berry'
  | 'angel_tear'
  | 'god_tear'
  | 'ancient_artefact'
  | 'gel';

export interface ItemDef {
  name: string;
  color: string;
  slot?: string;
  pick?: number; // 0=wood, 1=stone, 2=silver
  tile?: Tile;
  counted?: boolean;
  crafted?: boolean;
  desc?: string;
}

export interface Recipe {
  id: string;
  icon: string;
  label: string;
  name: string;
  cost: Partial<Record<ItemId, number>>;
  gives?: number;
  color?: string;
  desc?: string;
  toast?: string;
}

export interface PhysicalBody {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround?: boolean;
  blockedSideways?: boolean;
  dropFrames?: number;
}

export interface Player extends PhysicalBody {
  hp: number;
  facing: 1 | -1;
  invincibleFrames: number;
  flying?: boolean;
}

export type EnemyKind =
  | 'zombie'
  | 'slime'
  | 'green'
  | 'boss' // Slime King
  | 'eye' // Big Bad Eye
  | 'eyelet'
  | 'purple_eyelet'
  | 'golden_eyelet'
  | 'descendant';

export interface Enemy extends PhysicalBody {
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  damage: number;
  hopTimer?: number;
  shootTimer?: number;
  hitFlash?: number;
  state?: 'hover' | 'windup' | 'dash';
  timer?: number;
  dashes?: number;
  t?: number;
  mode?: 'ranged' | 'melee';
  modeTimer?: number;
  throwTimer?: number;
  immuneFlash?: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  honza?: boolean;
}

export interface SlimeBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface AngelSword {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface DebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
}

export interface DashTrail {
  x: number;
  y: number;
  life: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface MiningState {
  x: number;
  y: number;
  progress: number;
  need: number;
}

export interface BossInfo {
  kind: 'boss' | 'eye' | 'descendant';
  name: string;
  hp: number;
  maxHp: number;
  mode?: 'ranged' | 'melee';
  color: string;
}

export interface GameStateSnapshot {
  playerHp: number;
  playerMaxHp: number;
  kills: number;
  selectedSlot: number;
  hotbar: (ItemId | null)[];
  storage: (ItemId | null)[];
  inventory: Record<ItemId, number>;
  hasWings: boolean;
  hasInfiniteWings: boolean;
  flightTime: number;
  flightMax: number;
  hasSlimeBoots: boolean;
  dashCooldown: number;
  dashMaxCooldown: number;
  hasBossSword: boolean;
  hasBetterGun: boolean;
  slimeKingDefeated: boolean;
  eyeDefeated: boolean;
  descendantDefeated: boolean;
  activeBoss: BossInfo | null;
  toastText: string;
  toastId: number;
}

export interface SaveData {
  version: number;
  timestamp: number;
  player: {
    hp: number;
    maxHp: number;
    x: number;
    y: number;
  };
  unlocks: {
    hasWings: boolean;
    hasInfiniteWings: boolean;
    hasSlimeBoots: boolean;
    hasBossSword: boolean;
    hasBetterGun: boolean;
    slimeKingDefeated: boolean;
    eyeDefeated: boolean;
    descendantDefeated: boolean;
    kills: number;
  };
  hotbar: (ItemId | null)[];
  storage?: (ItemId | null)[];
  inventory: Record<string, number>;
  seed?: number; // terrain seed: the world is regenerated from this, then worldDelta is applied on top
  worldDelta?: Record<number, number>; // index -> tile type (if changed)
}
