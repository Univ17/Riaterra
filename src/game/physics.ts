import { PhysicalBody, Tile } from './types';
import { TILE } from './constants';
import { World } from './world';

export class Physics {
  public static collides(body: PhysicalBody, world: World): boolean {
    const x0 = Math.floor(body.x / TILE);
    const x1 = Math.floor((body.x + body.w - 0.01) / TILE);
    const y0 = Math.floor(body.y / TILE);
    const y1 = Math.floor((body.y + body.h - 0.01) / TILE);

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (world.isSolid(x, y)) return true;
      }
    }
    return false;
  }

  public static moveBody(body: PhysicalBody, world: World): void {
    body.onGround = false;
    body.blockedSideways = false;

    // Horizontal movement
    body.x += body.vx;
    if (body.vx !== 0 && this.collides(body, world)) {
      const dir = Math.sign(body.vx);
      while (this.collides(body, world)) {
        body.x -= dir * 0.25;
      }
      body.vx = 0;
      body.blockedSideways = true;
    }

    // Vertical movement
    const prevBottom = body.y + body.h;
    body.y += body.vy;
    if (body.vy !== 0 && this.collides(body, world)) {
      const dir = Math.sign(body.vy);
      while (this.collides(body, world)) {
        body.y -= dir * 0.25;
      }
      if (dir > 0) {
        body.onGround = true;
      }
      body.vy = 0;
    }

    // Platform one-way logic
    this.landOnPlatform(body, prevBottom, world);
  }

  public static landOnPlatform(body: PhysicalBody, prevBottom: number, world: World): void {
    if (body.vy <= 0 || (body.dropFrames && body.dropFrames > 0)) return;
    const row = Math.floor((body.y + body.h) / TILE);
    if (row * TILE < prevBottom - 0.5) return; // Feet were already lower than platform surface

    const x0 = Math.floor(body.x / TILE);
    const x1 = Math.floor((body.x + body.w - 0.01) / TILE);

    for (let x = x0; x <= x1; x++) {
      if (world.getTile(x, row) === Tile.PLATFORM) {
        body.y = row * TILE - body.h;
        body.vy = 0;
        body.onGround = true;
        return;
      }
    }
  }

  public static aabbOverlaps(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
}
