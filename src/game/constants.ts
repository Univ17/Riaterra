import { Tile } from './types';

export const TILE = 16;
export const WORLD_W = 300;
export const WORLD_H = 110;
export const ZOOM = 2;

export const GRAVITY = 0.3;
export const MAX_FALL = 8;
export const REACH = TILE * 5.5;

export const FLIGHT_MAX = 180;
export const DASH_SPEED = 10;
export const DASH_FRAMES = 16;
export const DASH_COOLDOWN = 180;
export const SLIME_KING_MAX_HP = 200;   // your max HP after defeating the King Slime
export const EYE_MAX_HP = 300;          // your max HP after defeating the Big Bad Eye

export const HOTBAR_SIZE = 10;
export const CZ_SLOT_KEYS = ['+', 'ě', 'š', 'č', 'ř', 'ž', 'ý', 'á', 'í', 'é'];
export const NUM_SLOT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const TILE_COLORS: Record<number, string | null> = {
  [Tile.AIR]: null,
  [Tile.DIRT]: '#8b5a2b',
  [Tile.STONE]: '#7a7f88',
  [Tile.GRASS]: '#8b5a2b',
  [Tile.ORE]: '#7a7f88',
  [Tile.WOOD]: '#6b4423',
  [Tile.LEAVES]: '#2e7d32',
  [Tile.PLATFORM]: '#a0693a',
  [Tile.DOOR]: '#a0693a',
  [Tile.DOOR_OPEN]: '#6b4423',
  [Tile.SILVER]: '#7a7f88',
  [Tile.BUSH]: '#2a6f2e',
};

// 3x3 sheet of 16x16 sprites embedded as base64
export const SPRITE_SHEET_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAC8ElEQVR42u1XzWsTQRR/GRetELSSTQIiVQi9CLmkVC0YjyII+Sd6EMRjLv4B0kuOoX+AIB48FsGDtz3UD7biTQq9lCIEWxpCL+1hx4PMOvsy3zNrVfYHS+ZjX/J7837vvUlt/OQ2TWcdWLmyByIcTU+gsVgHGT49vg4+6H57KFy/t7YGH7a3tfYEAOBW9lX6gox8OuvA0fQEyoIJeQCASEVShV8Rq8OeJ9Efh4fad5pxrI6AKco48WYcQzOOIcuyuYftMUlJI2Cqe5dImaLdajlJitjo3hZ33n7XzmUny0tM9RBRcuqkw88xqQuvLxfWZE6wT12yMnlhqbE5wYRE5RRHBM87r3ZzUrJyrIqEjbzarVZhTkJIRmSvk49OIqrE5deJSeURycr0VHWVSyYNlbz49UhXfRqLdWgYVnupvYFkdFVI2chCVZ+QZdakwUn7gA6qu5OrPb77ZFlmFBWnTuxKXmWP9W4qqUikW5tO7GtvexfCkSL4S9NZx1jLIqK29qI7EH5Ukaq9eXGf+iTbVnfBK1lfDt7XfOxJqKqxvzOB/Z0J/GnkVWhyfPo7ga5dytfYWPaOrZMAAEu9djgH3n30PLXuzeCkGMbDVQoA8Gz0WSqz6NFdvx/esjhtGycZeTaWOUHgLwRPXrU258Dk+LSgc6x7DNXeUq9dOHHTJBfJho1FTvjnwIOrwRIVk/+yOwXeifFwlWI5lZYDoojooEpW2X4UWr9lVCNlIxPpmK3Z5sR5IOJ15tMHbLQfsqGVngNldN9ScsCGYNCrhOjOw+tddxfSnTBeDx0R/z7QW4AKFf5XJElCkyRx/suZHpzR9ODM2X5jtEk3RpvU6S8lT9zFCZ64ixM8cZUTREfexQkRYRsnRIRlThAZ0X6/n9/82NjECUZ05cbF3J6NTZxgRJ8Pn+b2bKyT05zm1wfLdH2wTE1zAmse2+tyAmse24tyonCV4E9dBN0+f+ou+/ypm+6Tf71SVg5UDlQOVA6cL34CZVIYm1raLfYAAAAASUVORK5CYII=';

export const TILE_SPRITES: Partial<Record<Tile, [number, number]>> = {
  [Tile.DIRT]: [0, 0],
  [Tile.GRASS]: [1, 0],
  [Tile.STONE]: [2, 0],
  [Tile.ORE]: [2, 0],
  [Tile.SILVER]: [2, 0],
  [Tile.WOOD]: [0, 1],
  [Tile.LEAVES]: [1, 1],
};

export const ITEM_SPRITES: Record<string, [number, number]> = {
  dirt: [0, 0],
  stone: [2, 0],
  wood: [0, 1],
  leaves: [1, 1],
};

export const PICK_SPRITES: Record<string, [number, number]> = {
  pickaxe: [2, 1],
  stone_pickaxe: [2, 2],
  silver_pickaxe: [1, 2],
};

export const CRACK_PIXELS: [number, number][] = (() => {
  let r = 12345;
  const rnd = () => (r = (r * 1664525 + 1013904223) >>> 0) / 4294967296;
  const seen = new Set<string>();
  const out: [number, number][] = [];
  const add = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= TILE || y >= TILE || seen.has(x + ',' + y)) return false;
    seen.add(x + ',' + y);
    out.push([x, y]);
    return true;
  };
  const branches: { x: number; y: number; ang: number; len: number }[] = [];
  for (let b = 0; b < 7; b++) {
    const ang = (b / 7) * Math.PI * 2 + rnd() * 0.6;
    branches.push({ x: 7.5, y: 7.5, ang, len: 6 + Math.floor(rnd() * 4) });
  }
  for (let step = 0; step < 10; step++) {
    for (const br of branches) {
      if (step >= br.len) continue;
      br.ang += (rnd() - 0.5) * 0.9;
      br.x += Math.cos(br.ang);
      br.y += Math.sin(br.ang);
      add(Math.round(br.x), Math.round(br.y));
      if (rnd() < 0.25) add(Math.round(br.x) + (rnd() < 0.5 ? 1 : 0), Math.round(br.y));
    }
  }
  add(7, 7);
  add(8, 7);
  add(7, 8);
  add(8, 8);
  const p1 = out.pop();
  const p2 = out.pop();
  const p3 = out.pop();
  const p4 = out.pop();
  if (p4) out.unshift(p4);
  if (p3) out.unshift(p3);
  if (p2) out.unshift(p2);
  if (p1) out.unshift(p1);
  return out;
})();

export const DEBRIS_COLORS: Partial<Record<Tile, string[]>> = {
  [Tile.DIRT]: ['#8b5a2b', '#6e4520', '#a06a35'],
  [Tile.GRASS]: ['#4caf50', '#3d8c40', '#8b5a2b'],
  [Tile.STONE]: ['#7a7f88', '#5f646c', '#969ba3'],
  [Tile.ORE]: ['#7a7f88', '#f0c040', '#5f646c'],
  [Tile.SILVER]: ['#7a7f88', '#e8f0fa', '#5f646c'],
  [Tile.WOOD]: ['#6b4423', '#523318', '#85572d'],
  [Tile.LEAVES]: ['#2e7d32', '#1f5d23', '#43a047'],
  [Tile.BUSH]: ['#2a6f2e', '#c2185b', '#1f5d23'],
  [Tile.PLATFORM]: ['#9b6a3a', '#7a4f26'],
  [Tile.DOOR]: ['#9b6a3a', '#7a4f26'],
  [Tile.DOOR_OPEN]: ['#9b6a3a', '#7a4f26'],
};

export const MINE_FRAMES: Record<string, (number | null)[]> = {
  soft: [12, 8, 6],
  [Tile.STONE]: [20, 14, 10],
  [Tile.SILVER]: [null, 20, 12],
  [Tile.ORE]: [null, null, 14],
  [Tile.BUSH]: [4, 3, 2],
};
