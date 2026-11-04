// =====================================================================
// SPRITE ASSETS
//
// How to add a new sprite (item, monster, anything):
//   1. Drop a PNG into src/assets/sprites/ (any subfolder, e.g. items/ or monsters/).
//      The file name without ".png" is the sprite key, so keep names unique:
//          src/assets/sprites/items/angel_blade.png  ->  key 'angel_blade'
//   2. Draw it from the engine:
//          Assets.draw(ctx, 'angel_blade', x, y);
//      It returns false until the image has loaded (or if it does not exist), so you can
//      keep the old canvas drawing as a fallback:
//          if (!Assets.draw(ctx, 'angel_blade', x, y)) { /* canvas drawing */ }
//   3. Optional: add the key to SPRITE_PIVOTS to change the point the sprite is drawn around,
//      or to SPRITE_FRAMES to cut one sprite out of a sprite sheet.
//
// Draw options: angle (radians), scale, flipX, alpha, tint (e.g. '#ffe9a8') and tintAlpha.
// =====================================================================

// Every PNG under src/assets/sprites/ is picked up automatically (resolved to a URL by Vite).
const files = import.meta.glob('../assets/sprites/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export interface SpriteFrame {
  sheet: string; // key of the sheet image (its file name without .png)
  x: number;
  y: number;
  w: number;
  h: number;
}

// Sprites that are a rectangle cut out of a bigger sheet image.
export const SPRITE_FRAMES: Record<string, SpriteFrame> = {
  descendant_sword_blue: { sheet: 'descendant_swords', x: 0, y: 0, w: 24, h: 9 },
  descendant_sword_red: { sheet: 'descendant_swords', x: 0, y: 9, w: 24, h: 9 },
};

// The point of the sprite (in sprite pixels) that is placed at the x,y you draw at.
// Default is the center of the sprite.
export const SPRITE_PIVOTS: Record<string, [number, number]> = {
  descendant: [28, 41], // center of the round body (the halo sits above it)
};

export interface DrawOptions {
  angle?: number;
  scale?: number;
  flipX?: boolean;
  alpha?: number;
  tint?: string; // flash color laid over the sprite's opaque pixels
  tintAlpha?: number; // strength of the tint (default 0.55)
}

interface Resolved {
  img: HTMLImageElement;
  x: number;
  y: number;
  w: number;
  h: number;
}

const keyOf = (path: string): string => (path.split('/').pop() ?? path).replace(/\.png$/i, '');

class AssetLoader {
  private images = new Map<string, HTMLImageElement>();
  private tintCache = new Map<string, HTMLCanvasElement>();
  private started: Promise<void> | null = null;

  // Starts loading every sprite. Safe to call more than once.
  public load(): Promise<void> {
    if (!this.started) {
      this.started = Promise.all(
        Object.entries(files).map(
          ([path, url]) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => {
                this.images.set(keyOf(path), img);
                resolve();
              };
              img.onerror = () => {
                console.warn('Could not load sprite:', path);
                resolve();
              };
              img.src = url;
            })
        )
      ).then(() => undefined);
    }
    return this.started;
  }

  public has(key: string): boolean {
    return this.resolve(key) !== null;
  }

  private resolve(key: string): Resolved | null {
    const frame = SPRITE_FRAMES[key];
    const img = this.images.get(frame ? frame.sheet : key);
    if (!img) return null;
    if (frame) return { img, x: frame.x, y: frame.y, w: frame.w, h: frame.h };
    return { img, x: 0, y: 0, w: img.width, h: img.height };
  }

  // Draws the sprite with its pivot at (x, y). Returns false if it is not available.
  public draw(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, opts: DrawOptions = {}): boolean {
    const s = this.resolve(key);
    if (!s) return false;
    const { angle = 0, scale = 1, flipX = false, alpha = 1, tint, tintAlpha = 0.55 } = opts;
    const [px, py] = SPRITE_PIVOTS[key] ?? [s.w / 2, s.h / 2];

    ctx.save();
    ctx.imageSmoothingEnabled = false; // keep pixel art sharp
    ctx.translate(x, y);
    if (angle) ctx.rotate(angle);
    ctx.scale(flipX ? -scale : scale, scale);
    ctx.globalAlpha *= alpha;
    ctx.drawImage(s.img, s.x, s.y, s.w, s.h, -px, -py, s.w, s.h);
    if (tint) {
      ctx.globalAlpha *= tintAlpha;
      ctx.drawImage(this.tinted(key, s, tint), -px, -py);
    }
    ctx.restore();
    return true;
  }

  // A copy of the sprite filled with one color (only where the sprite is opaque), cached.
  private tinted(key: string, s: Resolved, color: string): HTMLCanvasElement {
    const id = key + '|' + color;
    let c = this.tintCache.get(id);
    if (!c) {
      c = document.createElement('canvas');
      c.width = s.w;
      c.height = s.h;
      const g = c.getContext('2d')!;
      g.drawImage(s.img, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h);
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = color;
      g.fillRect(0, 0, s.w, s.h);
      this.tintCache.set(id, c);
    }
    return c;
  }
}

export const Assets = new AssetLoader();
