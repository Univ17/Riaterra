import { ItemId, ItemDef, Recipe, Tile } from './types';

export const ITEMS: Record<ItemId, ItemDef> = {
  sword: { name: 'Sword', color: '#ccd' },
  silver_sword: { name: 'Silver Sword', slot: 'S. Sword', color: '#cde', crafted: true, desc: 'Deals 28 damage' },
  boss_sword: {
    name: 'Big Bad Sword',
    slot: 'B.B. Sword',
    color: '#ff3344',
    counted: true,
    desc: 'Dropped by Big Bad Eye. Deals 55 damage with extended reach.',
  },
  angel_blade: {
    name: 'Angel Blade',
    slot: 'A. Blade',
    color: '#fff0b3',
    counted: true,
    desc: 'Dropped by the Descendant. Thrown like a boomerang: pierces everything, then returns.',
  },
  gun: { name: 'Gun', color: '#777', crafted: true, desc: 'Fires high-velocity bullets toward your cursor.' },
  honza: { name: 'Honza', color: '#3ecf8e', crafted: true, desc: 'Overpowered developer gun.' },
  pickaxe: { name: 'Wood Pick', color: '#bbb', pick: 0 },
  stone_pickaxe: { name: 'Stone Pick', color: '#889', pick: 1, crafted: true },
  silver_pickaxe: { name: 'Silver Pick', color: '#cde', pick: 2, crafted: true },
  dirt: { name: 'Dirt', color: '#8b5a2b', tile: Tile.DIRT },
  stone: { name: 'Stone', color: '#7a7f88', tile: Tile.STONE },
  ore: { name: 'Gold', color: '#f0c040', tile: Tile.ORE },
  silver: { name: 'Silver', color: '#d6dde6', counted: true },
  berry: { name: 'Berry', color: '#c2185b', counted: true },
  angel_tear: { name: "Angel's Tear", slot: 'Tear', color: '#bfe6ff', counted: true },
  god_tear: { name: "God's Tear", slot: 'G. Tear', color: '#e9c8ff', counted: true },
  ancient_artefact: { name: 'Ancient Artefact', slot: 'Anc. Art.', color: '#ffd24a', counted: true },
  relic: { name: 'The Relic', slot: 'Relic', color: '#fff0b3', counted: true, desc: 'Summons The Descendant celestial boss.' },
  gel: { name: 'Gel', color: '#3ecf8e', counted: true },
  wood: { name: 'Wood', color: '#6b4423', tile: Tile.WOOD },
  leaves: { name: 'Leaves', color: '#2e7d32', tile: Tile.LEAVES },
  platform: { name: 'Platform', color: '#a0693a', tile: Tile.PLATFORM },
  door: { name: 'Door', color: '#a0693a', tile: Tile.DOOR },
  book: { name: 'Occult Book', slot: 'Book', color: '#8a2be2', counted: true, desc: 'Summons the Big Bad Eye.' },
  potion: { name: 'Potion', color: '#e33', counted: true, desc: 'Restores 25 health.' },
};

export const ITEM_ORDER: ItemId[] = [
  'sword',
  'silver_sword',
  'boss_sword',
  'angel_blade',
  'gun',
  'pickaxe',
  'stone_pickaxe',
  'silver_pickaxe',
  'dirt',
  'stone',
  'ore',
  'silver',
  'wood',
  'leaves',
  'platform',
  'door',
  'potion',
  'berry',
  'gel',
  'angel_tear',
  'god_tear',
  'book',
  'ancient_artefact',
  'relic',
  'honza',
];

export const RECIPES: Recipe[] = [
  {
    id: 'stone_pickaxe',
    icon: 'stone_pickaxe',
    label: 'Stone Pick',
    name: 'Stone Pickaxe',
    cost: { wood: 2, stone: 8 },
    desc: 'Mines stone faster and allows harvesting silver ore.',
  },
  {
    id: 'silver_pickaxe',
    icon: 'silver_pickaxe',
    label: 'Silver Pick',
    name: 'Silver Pickaxe',
    cost: { wood: 2, silver: 8 },
    desc: 'Mines at maximum speed and harvests gold ore.',
  },
  {
    id: 'silver_sword',
    icon: 'silver_sword',
    label: 'S. Sword',
    name: 'Silver Sword',
    cost: { wood: 2, silver: 8 },
    desc: 'Upgraded melee weapon. Deals 28 damage.',
  },
  {
    id: 'platform',
    icon: 'platform',
    label: 'Platform',
    name: 'Platform',
    cost: { wood: 1 },
    gives: 2,
    desc: 'Walk on top or jump through from below.',
  },
  {
    id: 'potion',
    icon: 'potion',
    label: 'Potion',
    name: 'Health Potion',
    cost: { berry: 3 },
    gives: 1,
    desc: 'Restores 25 health. Use with H key.',
  },
  {
    id: 'gun',
    icon: 'gun',
    label: 'Gun',
    name: 'Rifle',
    cost: { ore: 10, silver: 5 },
    color: '#777',
    desc: 'Fires bullets towards your cursor.',
  },
  {
    id: 'wings',
    icon: 'wings',
    label: 'Wings',
    name: 'Wings',
    cost: { angel_tear: 4 },
    color: '#f4f4ff',
    desc: 'Release jump in air, then hold to fly for up to 3s.',
    toast: 'Crafted Wings! Release jump in air, then hold to fly.',
  },
  {
    id: 'god_tear',
    icon: 'god_tear',
    label: 'Inf Wings',
    name: 'Infinite Wings',
    cost: { god_tear: 4 },
    color: '#c77dff',
    desc: 'Removes all flight time limits on your Wings.',
    toast: 'Crafted Infinite Wings! Unlimited flight enabled.',
  },
  {
    id: 'boots',
    icon: 'boots',
    label: 'Boots',
    name: 'Slime Boots',
    cost: { gel: 10 },
    color: '#3ecf8e',
    desc: 'Press Shift to dash forward 10 tiles.',
    toast: 'Crafted Slime Boots! Press Shift to dash.',
  },
  {
    id: 'relic',
    icon: 'relic',
    label: 'The Relic',
    name: 'The Relic',
    cost: { ancient_artefact: 3 },
    gives: 1,
    color: '#fff0b3',
    desc: 'Click with it to summon The Descendant boss.',
    toast: 'Crafted The Relic! Click with it to summon The Descendant.',
  },
];

export function getDropForTile(tile: Tile): ItemId | null {
  switch (tile) {
    case Tile.DIRT:
    case Tile.GRASS:
      return 'dirt';
    case Tile.STONE:
      return 'stone';
    case Tile.ORE:
      return 'ore';
    case Tile.SILVER:
      return 'silver';
    case Tile.WOOD:
      return 'wood';
    case Tile.LEAVES:
      return 'leaves';
    case Tile.PLATFORM:
      return 'platform';
    case Tile.DOOR:
    case Tile.DOOR_OPEN:
      return 'door';
    case Tile.BUSH:
      return 'berry';
    default:
      return null;
  }
}
