import { Tile } from './types';
import { WORLD_W, WORLD_H } from './constants';

export class World {
  public data: Uint8Array;
  public surface: number[] = [];
  public seed: number;

  constructor(seed = Math.random() * 1000) {
    this.seed = seed;
    this.data = new Uint8Array(WORLD_W * WORLD_H);
    this.init();
  }

  private hash(x: number, y: number): number {
    const n = Math.sin(x * 127.1 + y * 311.7 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  private valueNoise(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const top = this.hash(xi, yi) * (1 - u) + this.hash(xi + 1, yi) * u;
    const bottom = this.hash(xi, yi + 1) * (1 - u) + this.hash(xi + 1, yi + 1) * u;
    return top * (1 - v) + bottom * v;
  }

  public init(): void {
    // Surface height for each column
    this.surface = [];
    for (let x = 0; x < WORLD_W; x++) {
      this.surface[x] = Math.floor(
        40 + 8 * Math.sin(x * 0.05 + this.seed) + 5 * Math.sin(x * 0.13 + 2) + 3 * Math.sin(x * 0.31)
      );
    }

    // Terrain
    for (let x = 0; x < WORLD_W; x++) {
      const top = this.surface[x];
      for (let y = top; y < WORLD_H; y++) {
        let tile: Tile;
        if (y === top) tile = Tile.GRASS;
        else if (y < top + 6 + this.hash(x, 7) * 3) tile = Tile.DIRT;
        else tile = Tile.STONE;

        // Caves: carve out air where noise is high
        if (y > top + 5) {
          const n = this.valueNoise(x / 8, y / 8) * 0.67 + this.valueNoise(x / 4, y / 4) * 0.33;
          if (n > 0.62) tile = Tile.AIR;
        }

        // Ore inside stone
        if (tile === Tile.STONE) {
          if (this.hash(x, y) < 0.03) tile = Tile.ORE;
          else if (this.hash(x + 211, y + 97) < 0.04) tile = Tile.SILVER;
        }

        // Solid bedrock floor
        if (y >= WORLD_H - 2) tile = Tile.STONE;

        this.setTile(x, y, tile);
      }
    }

    // Trees
    for (let x = 4; x < WORLD_W - 4; x++) {
      const onGrass = this.getTile(x, this.surface[x]) === Tile.GRASS;
      if (!onGrass || this.hash(x, 99) >= 0.09) continue;

      const height = 3 + Math.floor(this.hash(x, 5) * 3);
      const treeTop = this.surface[x] - height;
      for (let y = this.surface[x] - 1; y >= treeTop; y--) {
        this.setTile(x, y, Tile.WOOD);
      }
      for (let dy = -2; dy <= 1; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const tx = x + dx;
          const ty = treeTop + dy;
          if (this.getTile(tx, ty) === Tile.AIR && Math.abs(dx) + Math.abs(dy) < 4) {
            this.setTile(tx, ty, Tile.LEAVES);
          }
        }
      }
      x += 3;
    }

    // Berry bushes
    for (let x = 2; x < WORLD_W - 2; x++) {
      const y = this.surface[x] - 1;
      if (this.getTile(x, this.surface[x]) === Tile.GRASS && this.getTile(x, y) === Tile.AIR && this.hash(x, 321) < 0.12) {
        this.setTile(x, y, Tile.BUSH);
      }
    }
  }

  public getTile(x: number, y: number): Tile {
    if (x < 0 || x >= WORLD_W || y >= WORLD_H) return Tile.STONE;
    if (y < 0) return Tile.AIR;
    return this.data[y * WORLD_W + x];
  }

  public setTile(x: number, y: number, type: Tile): void {
    if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
      this.data[y * WORLD_W + x] = type;
    }
  }

  public isSolid(x: number, y: number): boolean {
    const t = this.getTile(x, y);
    return (
      t !== Tile.AIR &&
      t !== Tile.LEAVES &&
      t !== Tile.PLATFORM &&
      t !== Tile.DOOR_OPEN &&
      t !== Tile.BUSH
    );
  }

  public isDoor(tile: Tile): boolean {
    return tile === Tile.DOOR || tile === Tile.DOOR_OPEN;
  }

  public forEachDoorTile(x: number, y: number, fn: (ty: number) => void): void {
    let top = y;
    while (this.isDoor(this.getTile(x, top - 1))) top--;
    for (let ty = top; this.isDoor(this.getTile(x, ty)); ty++) {
      fn(ty);
    }
  }

  public removeDoor(x: number, y: number): void {
    this.forEachDoorTile(x, y, (ty) => this.setTile(x, ty, Tile.AIR));
  }

  public toggleDoor(x: number, y: number): boolean {
    const closing = this.getTile(x, y) === Tile.DOOR_OPEN;
    const next = closing ? Tile.DOOR : Tile.DOOR_OPEN;
    this.forEachDoorTile(x, y, (ty) => this.setTile(x, ty, next));
    return closing;
  }

  /**
   * Checks if an upside-down "T" of 5 Gold Ore was placed:
   * 3 horizontal tiles at cy, with 2 vertical tiles extending up (cy-1, cy-2) from cx.
   */
  public checkGoldTSummon(tx: number, ty: number): { x: number; y: number } | null {
    for (let cx = tx - 1; cx <= tx + 1; cx++) {
      for (let cy = ty; cy <= ty + 2; cy++) {
        const cells: [number, number][] = [
          [cx - 1, cy],
          [cx, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy - 2],
        ];
        if (cells.every(([x, y]) => this.getTile(x, y) === Tile.ORE)) {
          // Consume the ore blocks
          cells.forEach(([x, y]) => this.setTile(x, y, Tile.AIR));
          return { x: cx, y: cy - 2 };
        }
      }
    }
    return null;
  }
}
