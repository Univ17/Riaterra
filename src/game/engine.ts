import {
  Tile,
  ItemId,
  Enemy,
  Bullet,
  SlimeBall,
  AngelSword,
  DebrisParticle,
  DashTrail,
  MiningState,
  GameStateSnapshot,
  BossInfo,
  FloatingText,
} from './types';
import {
  TILE,
  WORLD_W,
  WORLD_H,
  ZOOM,
  GRAVITY,
  MAX_FALL,
  REACH,
  FLIGHT_MAX,
  DASH_SPEED,
  DASH_FRAMES,
  DASH_COOLDOWN,
  HOTBAR_SIZE,
  CZ_SLOT_KEYS,
  MINE_FRAMES,
  DEBRIS_COLORS,
  CRACK_PIXELS,
  TILE_SPRITES,
  TILE_COLORS,
  PICK_SPRITES,
  SPRITE_SHEET_SRC,
} from './constants';
import { ITEMS, getDropForTile, RECIPES } from './items';
import { World } from './world';
import { Physics } from './physics';
import { StorageManager } from './storage';

export class GameEngine {
  public world: World;
  public initialWorldData: Uint8Array;

  // Player
  public player = {
    x: (WORLD_W / 2) * TILE,
    y: 0,
    w: 12,
    h: 26,
    vx: 0,
    vy: 0,
    hp: 100,
    facing: 1 as 1 | -1,
    invincibleFrames: 0,
    dropFrames: 0,
    onGround: false,
    flying: false,
  };
  public maxHp = 100;

  // Equipment & Unlocks
  public hasWings = false;
  public hasInfiniteWings = false;
  public flightTime = FLIGHT_MAX;
  public wingsArmed = false;

  public hasSlimeBoots = false;
  public dashFrames = 0;
  public dashCooldown = 0;
  public dashDir = 1;
  public dashWasDown = false;
  public dashEndPending = false;
  public dashTrail: DashTrail[] = [];

  public hasBossSword = false;
  public hasBetterGun = false;

  // Progression milestones
  public slimeKingDefeated = false;
  public eyeDefeated = false;
  public descendantDefeated = false;
  public kills = 0;

  // Inventory & Hotbar
  public hotbar: (ItemId | null)[] = ['sword', 'pickaxe', null, null, null, null, null, null, null, null];
  public storage: (ItemId | null)[] = new Array(30).fill(null);
  public inventory: Record<ItemId, number> = { sword: 1, pickaxe: 1 } as any;
  public selectedSlot = 0;

  // Entities & Combat
  public enemies: Enemy[] = [];
  public bullets: Bullet[] = [];
  public slimeBalls: SlimeBall[] = [];
  public angelSwords: AngelSword[] = [];
  public debris: DebrisParticle[] = [];
  public floatingTexts: FloatingText[] = [];
  private nextFloatingTextId = 1;

  public cooldown = 0;
  public swingFrames = 0;
  public swingItem: ItemId = 'sword';
  public swingAlreadyHit = new Set<Enemy>();
  public mining: MiningState = { x: -1, y: -1, progress: 0, need: 1 };
  public spawnTimer = 60;

  // Camera & View
  public camera = { x: 0, y: 0 };
  public viewW = 0;
  public viewH = 0;

  // Input
  public keys: Record<string, boolean> = {};
  public mouseX = 0;
  public mouseY = 0;
  public leftDown = false;
  public rightDown = false;
  public isPaused = false;
  public isInventoryOpen = false;

  // Toast notifications
  public toastText = '';
  public toastFrames = 0;
  public toastId = 0;

  // Autosave timer (every 30s at 60fps)
  public autosaveTimer = 1800;

  // Textures
  public spriteSheet: HTMLImageElement;

  // State synchronization listeners for React UI
  private listeners = new Set<(snapshot: GameStateSnapshot) => void>();

  constructor() {
    this.world = new World();
    this.initialWorldData = new Uint8Array(this.world.data);

    // Initial spawn coordinates
    const spawnTileY = this.world.surface[Math.floor(WORLD_W / 2)] - 3;
    this.player.x = (WORLD_W / 2) * TILE;
    this.player.y = spawnTileY * TILE;

    this.spriteSheet = new Image();
    this.spriteSheet.src = SPRITE_SHEET_SRC;

    // Check for saved data in localStorage
    if (StorageManager.hasSave()) {
      StorageManager.load(this);
    }
  }

  public subscribe(fn: (snapshot: GameStateSnapshot) => void): () => void {
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => this.listeners.delete(fn);
  }

  public notify(): void {
    const snap = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snap);
    }
  }

  public showToast(text: string): void {
    this.toastText = text;
    this.toastFrames = 180;
    this.toastId++;
    this.notify();
  }

  public getSnapshot(): GameStateSnapshot {
    const activeBoss = this.getActiveBoss();
    return {
      playerHp: Math.max(0, Math.ceil(this.player.hp)),
      playerMaxHp: this.maxHp,
      kills: this.kills,
      selectedSlot: this.selectedSlot,
      hotbar: [...this.hotbar],
      storage: [...this.storage],
      inventory: { ...this.inventory },
      hasWings: this.hasWings,
      hasInfiniteWings: this.hasInfiniteWings,
      flightTime: this.flightTime,
      flightMax: FLIGHT_MAX,
      hasSlimeBoots: this.hasSlimeBoots,
      dashCooldown: this.dashCooldown,
      dashMaxCooldown: DASH_COOLDOWN,
      hasBossSword: this.hasBossSword,
      hasBetterGun: this.hasBetterGun,
      slimeKingDefeated: this.slimeKingDefeated,
      eyeDefeated: this.eyeDefeated,
      descendantDefeated: this.descendantDefeated,
      activeBoss,
      toastText: this.toastText,
      toastId: this.toastId,
    };
  }

  public getActiveBoss(): BossInfo | null {
    const b = this.enemies.find((e) => e.kind === 'boss' || e.kind === 'eye' || e.kind === 'descendant');
    if (!b) return null;
    let name = 'Slime King';
    let color = '#2bd4c0';
    if (b.kind === 'eye') {
      name = 'Big Bad Eye';
      color = '#ef4444';
    } else if (b.kind === 'descendant') {
      name = b.mode === 'ranged' ? 'The Descendant (Ranged Only)' : 'The Descendant (Melee Only)';
      color = b.mode === 'ranged' ? '#6aa0ff' : '#ff4d4d';
    }
    return {
      kind: b.kind as any,
      name,
      hp: Math.max(0, Math.ceil(b.hp)),
      maxHp: b.maxHp,
      mode: b.mode,
      color,
    };
  }

  public heldItem(): ItemId | null {
    return this.hotbar[this.selectedSlot];
  }

  public itemCount(id: ItemId): number {
    return this.inventory[id] || 0;
  }

  public spawnFloatingText(x: number, y: number, text: string, color = '#ffd34d'): void {
    this.floatingTexts.push({
      id: this.nextFloatingTextId++,
      x: x + (Math.random() - 0.5) * 4,
      y,
      vy: -1.0,
      text,
      color,
      life: 65,
      maxLife: 65,
    });
  }

  public consumeItem(id: ItemId, count = 1): void {
    if (!this.inventory[id]) return;
    this.inventory[id] -= count;
    if (this.inventory[id] <= 0) {
      delete this.inventory[id];
      for (let i = 0; i < this.hotbar.length; i++) {
        if (this.hotbar[i] === id) {
          this.hotbar[i] = null;
        }
      }
      for (let i = 0; i < this.storage.length; i++) {
        if (this.storage[i] === id) {
          this.storage[i] = null;
        }
      }
    }
  }

  public cleanupZeroItems(): void {
    for (const key of Object.keys(this.inventory)) {
      const id = key as ItemId;
      if (!this.inventory[id] || this.inventory[id] <= 0) {
        delete this.inventory[id];
        for (let i = 0; i < this.hotbar.length; i++) {
          if (this.hotbar[i] === id) this.hotbar[i] = null;
        }
        for (let i = 0; i < this.storage.length; i++) {
          if (this.storage[i] === id) this.storage[i] = null;
        }
      }
    }
  }

  public addItem(id: ItemId, count = 1): void {
    this.inventory[id] = (this.inventory[id] || 0) + count;
    if (!this.hotbar.includes(id) && !this.storage.includes(id)) {
      const hotbarFree = this.hotbar.indexOf(null);
      if (hotbarFree >= 0) {
        this.hotbar[hotbarFree] = id;
      } else {
        const storageFree = this.storage.indexOf(null);
        if (storageFree >= 0) {
          this.storage[storageFree] = id;
        }
      }
    }
    const itemDef = ITEMS[id];
    const name = itemDef?.name || id;
    const text = `+${count} ${name}`;
    this.spawnFloatingText(
      this.player.x + this.player.w / 2,
      this.player.y - 6,
      text,
      itemDef?.color || '#ffd34d'
    );
    this.notify();
  }

  public swapSlots(
    from: { container: 'hotbar' | 'storage'; index: number },
    to: { container: 'hotbar' | 'storage'; index: number }
  ): void {
    const fromList = from.container === 'hotbar' ? this.hotbar : this.storage;
    const toList = to.container === 'hotbar' ? this.hotbar : this.storage;
    if (
      from.index < 0 ||
      from.index >= fromList.length ||
      to.index < 0 ||
      to.index >= toList.length
    )
      return;

    const temp = fromList[from.index];
    fromList[from.index] = toList[to.index];
    toList[to.index] = temp;
    this.notify();
  }

  public setSlot(
    container: 'hotbar' | 'storage',
    index: number,
    item: ItemId | null
  ): void {
    const list = container === 'hotbar' ? this.hotbar : this.storage;
    if (index >= 0 && index < list.length) {
      list[index] = item;
      this.notify();
    }
  }

  public quickMove(container: 'hotbar' | 'storage', index: number): void {
    const fromList = container === 'hotbar' ? this.hotbar : this.storage;
    const targetList = container === 'hotbar' ? this.storage : this.hotbar;
    const item = fromList[index];
    if (!item) return;

    const targetEmpty = targetList.indexOf(null);
    if (targetEmpty >= 0) {
      targetList[targetEmpty] = item;
      fromList[index] = null;
      this.notify();
    }
  }

  public discardSlot(container: 'hotbar' | 'storage', index: number): void {
    const list = container === 'hotbar' ? this.hotbar : this.storage;
    const item = list[index];
    if (item) {
      delete this.inventory[item];
      list[index] = null;
      // also clear from any duplicate slot
      for (let i = 0; i < this.hotbar.length; i++) {
        if (this.hotbar[i] === item) this.hotbar[i] = null;
      }
      for (let i = 0; i < this.storage.length; i++) {
        if (this.storage[i] === item) this.storage[i] = null;
      }
      this.notify();
    }
  }

  public craft(recipeId: string, craftAll = false): void {
    const r = RECIPES.find((rec) => rec.id === recipeId);
    if (!r) return;

    const canCraftOnce = () => Object.entries(r.cost).every(([id, n]) => this.itemCount(id as ItemId) >= (n || 0));
    if (!canCraftOnce()) return;

    let countMade = 0;
    while (canCraftOnce()) {
      for (const [id, n] of Object.entries(r.cost)) {
        this.consumeItem(id as ItemId, n || 0);
      }

      if (r.id === 'wings') {
        this.hasWings = true;
      } else if (r.id === 'god_tear') {
        this.hasInfiniteWings = true;
      } else if (r.id === 'boots') {
        this.hasSlimeBoots = true;
      } else if (r.id === 'stone_pickaxe') {
        this.upgradeTool('stone_pickaxe', 'pickaxe');
      } else if (r.id === 'silver_pickaxe') {
        this.upgradeTool('silver_pickaxe', 'stone_pickaxe');
      } else {
        const itemToGive = r.id === 'relic' ? 'relic' : (r.id as ItemId);
        this.addItem(itemToGive, r.gives || 1);
      }

      countMade += r.gives || 1;
      if (!craftAll) break;
    }

    this.showToast(r.toast || `Crafted ${r.name}${countMade > 1 ? ` x${countMade}` : ''}!`);
    this.notify();
  }

  public upgradeTool(newId: ItemId, oldId: ItemId): void {
    this.consumeItem(oldId, this.inventory[oldId] || 1);
    this.inventory[newId] = 1;
    const hotbarSlot = this.hotbar.indexOf(oldId);
    if (hotbarSlot >= 0) {
      this.hotbar[hotbarSlot] = newId;
    } else {
      const storageSlot = this.storage.indexOf(oldId);
      if (storageSlot >= 0) {
        this.storage[storageSlot] = newId;
      } else {
        this.addItem(newId);
      }
    }
  }

  public usePotion(): void {
    if (!this.hotbar.includes('potion') || this.itemCount('potion') < 1 || this.player.hp >= this.maxHp || this.cooldown > 0)
      return;

    this.player.hp = Math.min(this.maxHp, this.player.hp + 25);
    this.consumeItem('potion', 1);

    this.cooldown = 30;
    this.showToast(`Healed +25 HP! (${Math.ceil(this.player.hp)}/${this.maxHp})`);
    this.notify();
  }

  public useBook(): void {
    if (this.itemCount('book') < 1 || !this.slimeKingDefeated) {
      this.showToast('The Occult Book trembles, but King Slime must be slain first.');
      return;
    }
    if (this.enemies.some((e) => e.kind === 'eye')) {
      this.showToast('The Big Bad Eye is already watching you!');
      return;
    }
    this.consumeItem('book', 1);
    this.cooldown = 30;
    this.spawnEyeBoss();
    this.showToast('The Big Bad Eye watches you...');
    this.notify();
  }

  public useRelic(): void {
    if (this.itemCount('relic') < 1) return;
    if (!this.eyeDefeated) {
      this.cooldown = 30;
      this.showToast('The Relic stays dark...\nDefeat the Big Bad Eye first!');
      return;
    }
    if (this.enemies.some((e) => e.kind === 'descendant')) {
      this.showToast('The Descendant is already here!');
      return;
    }
    this.consumeItem('relic', 1);
    this.cooldown = 30;
    this.spawnDescendant();
    this.showToast('The Descendant descends from the heavens...');
    this.notify();
  }

  // --- Boss Spawners ---
  public spawnKingSlime(centerX = this.player.x, topY = this.player.y - 60): void {
    if (this.enemies.some((e) => e.kind === 'boss')) return;
    const boss: Enemy = {
      kind: 'boss',
      x: centerX - 24,
      y: topY - 40,
      w: 48,
      h: 36,
      vx: 0,
      vy: 0,
      hp: 1000,
      maxHp: 1000,
      damage: 25,
      hopTimer: 60,
      shootTimer: 150,
    };
    for (let i = 0; i < 40 && Physics.collides(boss, this.world); i++) {
      boss.y -= TILE;
    }
    this.enemies.push(boss);
    this.showToast('The King Slime awakens!');
    this.notify();
  }

  public spawnEyeBoss(): void {
    this.enemies.push({
      kind: 'eye',
      x: this.player.x - 20,
      y: this.player.y - 260,
      w: 40,
      h: 40,
      vx: 0,
      vy: 0,
      hp: 5000,
      maxHp: 5000,
      damage: 25,
      state: 'hover',
      timer: 120,
      dashes: 0,
      t: 0,
    });
    this.notify();
  }

  public spawnDescendant(): void {
    if (this.enemies.some((e) => e.kind === 'descendant')) return;
    this.enemies.push({
      kind: 'descendant',
      x: this.player.x - 28,
      y: this.player.y - 260,
      w: 56,
      h: 56,
      vx: 0,
      vy: 0,
      hp: 6000,
      maxHp: 6000,
      damage: 50,
      mode: 'ranged',
      modeTimer: 900,
      state: 'hover',
      timer: 150,
      throwTimer: 90,
      t: 0,
      immuneFlash: 0,
    });
    this.notify();
  }

  public spawnGoldenEyelet(): void {
    const side = Math.random() < 0.5 ? -1 : 1;
    this.enemies.push({
      kind: 'golden_eyelet',
      x: this.player.x + side * (260 + Math.random() * 120),
      y: this.player.y - 40 - Math.random() * 100,
      w: 14,
      h: 14,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      damage: 20,
      t: Math.random() * 100,
    });
  }

  public spawnEyelet(): void {
    const side = Math.random() < 0.5 ? -1 : 1;
    this.enemies.push({
      kind: 'eyelet',
      x: this.player.x + side * (260 + Math.random() * 120),
      y: this.player.y - 40 - Math.random() * 100,
      w: 14,
      h: 14,
      vx: 0,
      vy: 0,
      hp: 15,
      maxHp: 15,
      damage: 8,
      t: Math.random() * 100,
    });
  }

  public spawnPurpleEyelet(): void {
    const side = Math.random() < 0.5 ? -1 : 1;
    this.enemies.push({
      kind: 'purple_eyelet',
      x: this.player.x + side * (260 + Math.random() * 120),
      y: this.player.y - 40 - Math.random() * 100,
      w: 14,
      h: 14,
      vx: 0,
      vy: 0,
      hp: 35,
      maxHp: 35,
      damage: 14,
      t: Math.random() * 100,
    });
  }

  public spawnRegularEnemy(): void {
    const flyerCount = this.enemies.filter(
      (e) => e.kind === 'eyelet' || e.kind === 'purple_eyelet' || e.kind === 'golden_eyelet'
    ).length;

    // Flyers start spawning after King Slime is defeated
    if (this.slimeKingDefeated && Math.random() < 0.28 && flyerCount < 4) {
      if (this.eyeDefeated && Math.random() < 0.35) {
        // Golden eyelets drop ancient artefacts!
        this.spawnGoldenEyelet();
      } else if (this.eyeDefeated && !this.hasInfiniteWings && Math.random() < 0.4) {
        this.spawnPurpleEyelet();
      } else {
        this.spawnEyelet();
      }
      return;
    }

    const playerTileX = Math.floor(this.player.x / TILE);
    const playerTileY = Math.floor(this.player.y / TILE);
    const side = Math.random() < 0.5 ? -1 : 1;
    const tx = playerTileX + side * (20 + Math.floor(Math.random() * 15));
    if (tx < 2 || tx > WORLD_W - 3) return;

    for (let ty = playerTileY - 15; ty < playerTileY + 15; ty++) {
      const roomAbove =
        this.world.getTile(tx, ty) === Tile.AIR &&
        this.world.getTile(tx, ty - 1) === Tile.AIR &&
        this.world.getTile(tx, ty - 2) === Tile.AIR;
      const ground = this.world.isSolid(tx, ty + 1);
      if (!roomAbove || !ground) continue;

      const roll = Math.random();
      if (roll < 0.35) {
        // Zombie
        this.enemies.push({
          kind: 'zombie',
          x: tx * TILE,
          y: (ty - 1) * TILE,
          w: 12,
          h: 26,
          vx: 0,
          vy: 0,
          hp: 50,
          maxHp: 50,
          damage: 15,
          hopTimer: 0,
        });
      } else if (roll < 0.6) {
        // Green slime
        this.enemies.push({
          kind: 'green',
          x: tx * TILE,
          y: (ty + 1) * TILE - 14,
          w: 16,
          h: 14,
          vx: 0,
          vy: 0,
          hp: 40,
          maxHp: 40,
          damage: 12,
          hopTimer: 30,
        });
      } else {
        // Blue slime
        this.enemies.push({
          kind: 'slime',
          x: tx * TILE,
          y: (ty + 1) * TILE - 12,
          w: 14,
          h: 12,
          vx: 0,
          vy: 0,
          hp: 30,
          maxHp: 30,
          damage: 10,
          hopTimer: 30,
        });
      }
      return;
    }
  }

  // --- Debris Particles ---
  public spawnDebris(tx: number, ty: number, type: Tile, count: number): void {
    const cols = DEBRIS_COLORS[type] || ['#8b5a2b'];
    for (let i = 0; i < count; i++) {
      this.debris.push({
        x: tx * TILE + 2 + Math.random() * (TILE - 4),
        y: ty * TILE + 2 + Math.random() * (TILE - 4),
        vx: (Math.random() - 0.5) * (count > 1 ? 3 : 1.6),
        vy: -Math.random() * (count > 1 ? 3 : 1.8) - 0.3,
        size: Math.random() < 0.5 ? 2 : 3,
        life: 24 + Math.floor(Math.random() * 16),
        color: cols[Math.floor(Math.random() * cols.length)],
      });
    }
    if (this.debris.length > 300) {
      this.debris.splice(0, this.debris.length - 300);
    }
  }

  public updateDebris(): void {
    for (const d of this.debris) {
      d.vy += 0.2;
      d.x += d.vx;
      d.y += d.vy;
      d.vx *= 0.98;
      d.life--;
      if (this.world.isSolid(Math.floor(d.x / TILE), Math.floor((d.y + d.vy) / TILE)) && d.vy > 0) {
        d.vy *= -0.3;
        d.vx *= 0.6;
      }
    }
    this.debris = this.debris.filter((d) => d.life > 0);
  }

  // --- Item usage & Mining ---
  public useItem(): void {
    if (this.cooldown > 0) return;
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + 8;
    const aimX = this.mouseWorldX() - px;
    const aimY = this.mouseWorldY() - py;
    const aimLen = Math.hypot(aimX, aimY) || 1;
    this.player.facing = aimX >= 0 ? 1 : -1;

    const item = this.heldItem();
    if (item === 'sword' || item === 'silver_sword' || item === 'boss_sword') {
      this.swingItem = item;
      this.swingFrames = 14;
      this.swingAlreadyHit.clear();
      this.cooldown = 18;
    } else if (item === 'gun' || item === 'honza') {
      const speed = this.hasBetterGun ? 12 : 9;
      this.bullets.push({
        x: px,
        y: py,
        vx: (aimX / aimLen) * speed,
        vy: (aimY / aimLen) * speed,
        life: 70,
        honza: item === 'honza',
      });
      this.cooldown = this.hasBetterGun ? 14 : 24;
    } else if (item && ITEMS[item].pick !== undefined) {
      this.mineTile(ITEMS[item].pick!);
    } else if (item === 'book') {
      this.useBook();
    } else if (item === 'relic') {
      this.useRelic();
    } else if (item === 'potion') {
      this.usePotion();
    } else if (item && ITEMS[item].tile !== undefined) {
      this.placeItem(item);
    }
  }

  public mineTile(power: number): void {
    const tx = Math.floor(this.mouseWorldX() / TILE);
    const ty = Math.floor(this.mouseWorldY() / TILE);
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + 8;
    const inReach = Math.hypot(tx * TILE + 8 - px, ty * TILE + 8 - py) < REACH;

    if (!inReach || this.world.getTile(tx, ty) === Tile.AIR) return;
    const type = this.world.getTile(tx, ty);

    const framesTable = MINE_FRAMES[type] || MINE_FRAMES.soft;
    const framesNeeded = framesTable[power];

    if (framesNeeded === null || framesNeeded === undefined) {
      if (this.toastFrames <= 0) {
        if (type === Tile.SILVER) this.showToast('Silver ore requires a Stone Pickaxe or better!');
        else if (type === Tile.ORE) this.showToast('Gold ore requires a Silver Pickaxe!');
      }
      return;
    }

    if (this.mining.x !== tx || this.mining.y !== ty) {
      this.mining = { x: tx, y: ty, progress: 0, need: framesNeeded };
    }
    this.mining.need = framesNeeded;
    this.mining.progress++;

    if (this.mining.progress % 4 === 1) {
      this.spawnDebris(tx, ty, type, 1);
    }

    if (this.mining.progress >= framesNeeded) {
      this.mining.progress = 0;
      this.spawnDebris(tx, ty, type, 12);

      if (this.world.isDoor(type)) {
        this.world.removeDoor(tx, ty);
      } else {
        this.world.setTile(tx, ty, Tile.AIR);
      }

      const drop = getDropForTile(type);
      if (drop) {
        const count = type === Tile.BUSH ? 1 + (Math.random() < 0.5 ? 1 : 0) : 1;
        this.addItem(drop, count);
      }
    }
  }

  public placeItem(id: ItemId): void {
    const tx = Math.floor(this.mouseWorldX() / TILE);
    const ty = Math.floor(this.mouseWorldY() / TILE);
    if (!ITEMS[id].tile || this.itemCount(id) < 1 || ty < 2 || !this.mouseInReach(tx, ty)) return;

    const cells: [number, number][] = id === 'door' ? [[tx, ty], [tx, ty - 1]] : [[tx, ty]];
    const type = ITEMS[id].tile!;
    if (cells.some(([x, y]) => this.world.getTile(x, y) !== Tile.AIR)) return;

    cells.forEach(([x, y]) => this.world.setTile(x, y, type));
    if (Physics.collides(this.player, this.world)) {
      cells.forEach(([x, y]) => this.world.setTile(x, y, Tile.AIR));
      return;
    }

    this.consumeItem(id, 1);
    this.cooldown = 5;

    // Check if placing gold ore completed the King Slime altar (upside-down "T")
    if (id === 'ore') {
      const summonPos = this.world.checkGoldTSummon(tx, ty);
      if (summonPos) {
        this.spawnKingSlime(summonPos.x * TILE + TILE / 2, summonPos.y * TILE);
      }
    }
    this.notify();
  }

  public rightClick(): void {
    const tx = Math.floor(this.mouseWorldX() / TILE);
    const ty = Math.floor(this.mouseWorldY() / TILE);
    if (this.world.isDoor(this.world.getTile(tx, ty)) && this.mouseInReach(tx, ty)) {
      if (this.cooldown <= 0) {
        const closing = this.world.toggleDoor(tx, ty);
        if (closing && Physics.collides(this.player, this.world)) {
          this.world.toggleDoor(tx, ty); // revert if closing onto player
        }
        this.cooldown = 15;
      }
      return;
    }

    const held = this.heldItem();
    if (held && ITEMS[held].tile) {
      this.placeItem(held);
    } else {
      this.placeItem('dirt');
    }
  }

  public mouseInReach(tx: number, ty: number): boolean {
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + 8;
    return Math.hypot(tx * TILE + 8 - px, ty * TILE + 8 - py) <= REACH;
  }

  public mouseWorldX(): number {
    return this.mouseX / ZOOM + this.camera.x;
  }

  public mouseWorldY(): number {
    return this.mouseY / ZOOM + this.camera.y;
  }

  // --- Main Tick Simulation ---
  public update(): void {
    if (this.isPaused) return;

    this.updatePlayer();
    this.updateSwordHits();
    this.updateBullets();
    this.updateEnemies();
    this.updateSlimeBalls();
    this.updateAngelSwords();

    // Floating pickup text physics
    for (const ft of this.floatingTexts) {
      ft.y += ft.vy;
      ft.vy *= 0.96;
      ft.life--;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);

    // Check boss deaths and cleanup
    this.enemies = this.enemies.filter((e) => {
      if (e.hp <= 0) {
        this.onEnemyKilled(e);
        return false;
      }
      const isBoss = e.kind === 'boss' || e.kind === 'eye' || e.kind === 'descendant';
      return isBoss || Math.hypot(e.x - this.player.x, e.y - this.player.y) < 700;
    });

    if (--this.spawnTimer <= 0) {
      this.spawnTimer = 110;
      if (this.enemies.length < 7) {
        this.spawnRegularEnemy();
      }
    }

    if (this.player.hp <= 0) {
      this.respawn();
    }

    // Camera follow player with world bounds clamping
    this.camera.x = Math.max(0, Math.min(WORLD_W * TILE - this.viewW, this.player.x - this.viewW / 2));
    this.camera.y = Math.max(0, Math.min(WORLD_H * TILE - this.viewH, this.player.y - this.viewH / 2));

    // Autosave timer
    if (--this.autosaveTimer <= 0) {
      this.autosaveTimer = 1800;
      StorageManager.save(this);
    }

    // Decrement toast
    if (this.toastFrames > 0) {
      this.toastFrames--;
      if (this.toastFrames === 0) {
        this.toastText = '';
        this.notify();
      }
    }
  }

  public updatePlayer(): void {
    if (this.dashEndPending) {
      this.player.vx = 0;
      this.dashEndPending = false;
    }

    const left = this.keys['a'] || this.keys['arrowleft'];
    const right = this.keys['d'] || this.keys['arrowright'];

    if (left) {
      this.player.vx = Math.max(this.player.vx - 0.5, -2.2);
      this.player.facing = -1;
    } else if (right) {
      this.player.vx = Math.min(this.player.vx + 0.5, 2.2);
      this.player.facing = 1;
    } else {
      this.player.vx *= 0.7;
    }

    // Slime boots dash
    const dashKey = !!this.keys['shift'];
    if (dashKey && !this.dashWasDown && this.hasSlimeBoots && this.dashCooldown <= 0 && !this.isInventoryOpen) {
      this.dashDir = this.player.facing;
      this.dashFrames = DASH_FRAMES;
      this.dashCooldown = DASH_COOLDOWN;
    }
    this.dashWasDown = dashKey;
    if (this.dashCooldown > 0) this.dashCooldown--;

    if (this.dashFrames > 0) {
      this.dashFrames--;
      if (this.dashFrames === 0) this.dashEndPending = true;
      this.player.vx = this.dashDir * DASH_SPEED;
      if (this.player.vy > 0) this.player.vy = 0;
      this.dashTrail.push({ x: this.player.x, y: this.player.y, life: 12 });
    }
    this.dashTrail.forEach((t) => t.life--);
    this.dashTrail = this.dashTrail.filter((t) => t.life > 0);

    const jumpPressed = this.keys['w'] || this.keys[' '] || this.keys['arrowup'];
    if (jumpPressed && this.player.onGround) {
      this.player.vy = -6.3;
    }

    // Wings flight: release in air, then hold to fly
    if (this.player.onGround) {
      this.flightTime = FLIGHT_MAX;
      this.wingsArmed = false;
    } else if (!jumpPressed) {
      this.wingsArmed = true;
    }

    this.player.flying =
      this.hasWings &&
      this.wingsArmed &&
      jumpPressed &&
      !this.player.onGround &&
      (this.hasInfiniteWings || this.flightTime > 0);

    if (this.player.flying) {
      this.player.vy = Math.max(this.player.vy - 0.6, -3);
      if (!this.hasInfiniteWings) this.flightTime--;
    }

    if (this.keys['s'] || this.keys['arrowdown']) {
      this.player.dropFrames = 8;
    }

    this.player.vy = Math.min(this.player.vy + GRAVITY, MAX_FALL);
    Physics.moveBody(this.player, this.world);

    if (this.player.dropFrames && this.player.dropFrames > 0) this.player.dropFrames--;
    if (this.player.y > WORLD_H * TILE) this.player.y = 0;

    if (this.cooldown > 0) this.cooldown--;
    if (this.player.invincibleFrames > 0) this.player.invincibleFrames--;
    if (this.swingFrames > 0) this.swingFrames--;

    if (this.leftDown) this.useItem();
    if (!this.leftDown) this.mining.progress = 0;
    this.updateDebris();
    if (this.rightDown) this.rightClick();
  }

  public updateSwordHits(): void {
    if (this.swingFrames <= 0) return;
    const cx = this.player.x + this.player.w / 2;
    const cy = this.player.y + this.player.h / 2;
    const aimX = this.mouseWorldX() - cx;
    const aimY = this.mouseWorldY() - (this.player.y + 8);
    const aimLen = Math.hypot(aimX, aimY) || 1;

    for (const e of this.enemies) {
      if (this.swingAlreadyHit.has(e)) continue;
      const dx = e.x + e.w / 2 - cx;
      const dy = e.y + e.h / 2 - cy;
      const inFront = (dx * aimX + dy * aimY) / aimLen > -6;

      const reach = this.swingItem === 'boss_sword' ? 58 : 46;
      if (Math.hypot(dx, dy) < reach && inFront) {
        this.swingAlreadyHit.add(e);
        if (e.kind === 'descendant' && e.mode !== 'melee') {
          e.immuneFlash = 10;
          continue;
        }

        let damage = 10;
        if (this.swingItem === 'silver_sword') damage = 28;
        else if (this.swingItem === 'boss_sword') damage = 55;

        e.hp -= damage;
        e.hitFlash = 8;

        const isBoss = e.kind === 'boss' || e.kind === 'eye' || e.kind === 'descendant';
        if (!isBoss) {
          e.vx = Math.sign(dx || 1) * 4;
          e.vy = -3.5;
        }
      }
    }
  }

  public updateBullets(): void {
    for (const b of this.bullets) {
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      if (this.world.isSolid(Math.floor(b.x / TILE), Math.floor(b.y / TILE))) {
        b.life = 0;
      }

      for (const e of this.enemies) {
        const hit = b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h;
        if (b.life > 0 && hit) {
          if (e.kind === 'descendant' && e.mode !== 'ranged') {
            e.immuneFlash = 10;
            b.life = 0;
            continue;
          }

          e.hp -= b.honza ? 10000 : this.hasBetterGun ? 50 : 14;
          e.hitFlash = 8;

          const isBoss = e.kind === 'boss' || e.kind === 'eye' || e.kind === 'descendant';
          if (!isBoss) {
            e.vx = Math.sign(b.vx) * 2;
            e.vy = -2;
          }
          b.life = 0;
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
  }

  public updateEnemies(): void {
    const playerCenterX = this.player.x + this.player.w / 2;

    for (const e of this.enemies) {
      if (e.hitFlash && e.hitFlash > 0) e.hitFlash--;
      const dir = Math.sign(playerCenterX - (e.x + e.w / 2));

      if (e.kind === 'boss') {
        this.updateKingSlime(e);
      } else if (e.kind === 'descendant') {
        this.updateDescendant(e, dir);
        continue;
      } else if (
        e.kind === 'eye' ||
        e.kind === 'eyelet' ||
        e.kind === 'purple_eyelet' ||
        e.kind === 'golden_eyelet'
      ) {
        this.updateFlyer(e);
        this.touchPlayer(e, dir);
        continue;
      }

      if (e.kind === 'zombie') {
        if (e.onGround) e.vx = dir * 0.9 + e.vx * 0.2;
        if (e.blockedSideways && e.onGround) e.vy = -5.5;
      } else {
        // Slimes
        if (e.hopTimer !== undefined) e.hopTimer--;
        if (e.onGround) {
          e.vx *= 0.8;
          if (e.hopTimer! <= 0) {
            const isBoss = e.kind === 'boss';
            e.vy = isBoss ? -6.5 : -5.5;
            e.vx = dir * (isBoss ? 1.3 : 2);
            e.hopTimer = isBoss ? 100 + Math.random() * 50 : 50 + Math.random() * 30;
          }
        }
      }

      e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
      Physics.moveBody(e, this.world);
      this.touchPlayer(e, dir);
    }
  }

  public updateKingSlime(e: Enemy): void {
    if (e.shootTimer !== undefined) {
      if (--e.shootTimer <= 0) {
        const enraged = e.hp < e.maxHp / 2;
        e.shootTimer = enraged ? 50 + Math.random() * 50 : 110 + Math.random() * 110;

        const sx = e.x + e.w / 2;
        const sy = e.y + 8;
        const dx = this.player.x + this.player.w / 2 - sx;
        const dy = this.player.y + this.player.h / 2 - sy;
        const len = Math.hypot(dx, dy) || 1;
        if (len <= 500) {
          this.slimeBalls.push({
            x: sx,
            y: sy,
            vx: (dx / len) * 3,
            vy: (dy / len) * 3,
            life: 240,
          });
        }
      }
    }
  }

  public updateSlimeBalls(): void {
    for (const b of this.slimeBalls) {
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      const hitsPlayer =
        b.x > this.player.x - 4 &&
        b.x < this.player.x + this.player.w + 4 &&
        b.y > this.player.y - 4 &&
        b.y < this.player.y + this.player.h + 4;

      if (hitsPlayer && this.player.invincibleFrames <= 0) {
        this.player.hp -= 25;
        this.player.invincibleFrames = 45;
        this.player.vx = Math.sign(b.vx) * 2.5;
        this.player.vy = -2.5;
        b.life = 0;
      }
    }
    this.slimeBalls = this.slimeBalls.filter((b) => b.life > 0);
  }

  public updateFlyer(e: Enemy): void {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;
    if (e.t === undefined) e.t = 0;
    e.t++;

    if (e.kind === 'eyelet' || e.kind === 'purple_eyelet' || e.kind === 'golden_eyelet') {
      const a = Math.atan2(py - cy, px - cx);
      const speed = e.kind === 'golden_eyelet' ? 2.0 : e.kind === 'purple_eyelet' ? 1.8 : 1.5;
      e.vx += (Math.cos(a) * speed - e.vx) * 0.05;
      e.vy += (Math.sin(a) * speed + Math.sin(e.t * 0.12) * 0.7 - e.vy) * 0.05;
    } else {
      // Big Bad Eye Boss
      this.updateEyeBoss(e, cx, cy, px, py);
    }

    e.x += e.vx;
    e.y += e.vy;
  }

  public updateEyeBoss(e: Enemy, cx: number, cy: number, px: number, py: number): void {
    const enraged = e.hp <= 2000;
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    if (e.timer !== undefined) e.timer--;

    if (e.state === 'hover') {
      const tx = px + Math.sin((e.t || 0) * 0.03) * 160;
      const ty = py - 120;
      const hoverSpeed = enraged ? 4.5 : 2.6;
      e.vx += (clamp((tx - cx) * 0.03, hoverSpeed) - e.vx) * 0.08;
      e.vy += (clamp((ty - cy) * 0.03, hoverSpeed) - e.vy) * 0.08;

      if (e.timer! <= 0) {
        e.state = 'windup';
        e.timer = enraged ? 18 : 28;
        e.dashes = enraged ? 4 : 3;
      }
    } else if (e.state === 'windup') {
      e.vx *= 0.88;
      e.vy *= 0.88;
      if (e.timer! <= 0) {
        const a = Math.atan2(py - cy, px - cx);
        const speed = enraged ? 9 : 7;
        e.vx = Math.cos(a) * speed;
        e.vy = Math.sin(a) * speed;
        e.state = 'dash';
        e.timer = 32;
      }
    } else if (e.timer! <= 0) {
      if (e.dashes && --e.dashes > 0) {
        e.state = 'windup';
        e.timer = enraged ? 10 : 16;
      } else {
        e.state = 'hover';
        e.timer = enraged ? 40 : 110 + Math.random() * 40;
      }
    }
  }

  public updateDescendant(e: Enemy, dir: number): void {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h / 2;
    const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

    if (e.t === undefined) e.t = 0;
    e.t++;
    if (e.immuneFlash && e.immuneFlash > 0) e.immuneFlash--;

    // Mode alternate every 15s (900 frames)
    if (e.modeTimer !== undefined) {
      if (--e.modeTimer <= 0) {
        e.mode = e.mode === 'ranged' ? 'melee' : 'ranged';
        e.modeTimer = 900;
        this.showToast(`The Descendant shifted to ${e.mode.toUpperCase()} ONLY vulnerability!`);
      }
    }

    if (e.timer !== undefined) e.timer--;

    if (e.state === 'hover') {
      const near = e.mode === 'melee';
      const rx = near ? 110 : 260;
      const ry = near ? 30 : 110;
      const tx = px + Math.cos(e.t * 0.02) * rx;
      const ty = py - ry + Math.sin(e.t * 0.035) * 40;
      e.vx += (clamp((tx - cx) * 0.03, 3) - e.vx) * 0.08;
      e.vy += (clamp((ty - cy) * 0.03, 3) - e.vy) * 0.08;

      if (e.throwTimer !== undefined && --e.throwTimer <= 0) {
        this.throwAngelSwords(e, cx, cy, px, py);
        e.throwTimer = 50 + Math.random() * 40;
      }
      if (e.timer! <= 0) {
        e.state = 'windup';
        e.timer = 35;
      }
    } else if (e.state === 'windup') {
      e.vx *= 0.88;
      e.vy *= 0.88;
      if (e.timer! <= 0) {
        const a = Math.atan2(py - cy, px - cx);
        e.vx = Math.cos(a) * 11;
        e.vy = Math.sin(a) * 11;
        e.state = 'dash';
        e.timer = 28;
      }
    } else {
      // Dash
      this.touchPlayer(e, dir);
      if (e.timer! <= 0) {
        e.state = 'hover';
        e.timer = 180 + Math.random() * 120;
        e.throwTimer = 40;
      }
    }

    e.x += e.vx;
    e.y += e.vy;
  }

  public throwAngelSwords(e: Enemy, cx: number, cy: number, px: number, py: number): void {
    const count = e.hp < e.maxHp / 2 ? 3 : 1;
    const base = Math.atan2(py - cy, px - cx);
    const color = e.mode === 'ranged' ? '#6aa0ff' : '#ff4d4d';

    for (let k = 0; k < count; k++) {
      const a = base + (k - (count - 1) / 2) * 0.28;
      const ring = (e.t || 0) * 0.03 + Math.floor(Math.random() * 8) * (Math.PI / 4);
      this.angelSwords.push({
        x: cx + Math.cos(ring) * 48,
        y: cy + Math.sin(ring) * 48,
        vx: Math.cos(a) * 4.5,
        vy: Math.sin(a) * 4.5,
        life: 300,
        color,
      });
    }
  }

  public updateAngelSwords(): void {
    for (const sw of this.angelSwords) {
      sw.x += sw.vx;
      sw.y += sw.vy;
      sw.life--;

      const hit =
        sw.x > this.player.x - 5 &&
        sw.x < this.player.x + this.player.w + 5 &&
        sw.y > this.player.y - 5 &&
        sw.y < this.player.y + this.player.h + 5;

      if (hit && this.player.invincibleFrames <= 0) {
        this.player.hp -= 20;
        this.player.invincibleFrames = 45;
        this.player.vx = Math.sign(sw.vx) * 2.5;
        this.player.vy = -2.5;
        sw.life = 0;
      }
    }
    this.angelSwords = this.angelSwords.filter((sw) => sw.life > 0);
  }

  public touchPlayer(e: Enemy, dir: number): void {
    const touching =
      this.player.x < e.x + e.w &&
      this.player.x + this.player.w > e.x &&
      this.player.y < e.y + e.h &&
      this.player.y + this.player.h > e.y;

    if (touching && this.player.invincibleFrames <= 0) {
      this.player.hp -= e.damage;
      this.player.invincibleFrames = 45;
      this.player.vx = -dir * 3.5;
      this.player.vy = -3.5;
      this.notify();
    }
  }

  // --- Progression Drops & Milestones ---
  public onEnemyKilled(e: Enemy): void {
    this.kills++;
    const eyeAlive = this.enemies.some((en) => en.kind === 'eye');

    // 1. King Slime -> 1 in 6 chance to drop Slime Gun & unlocks Tier 2
    if (e.kind === 'boss') {
      this.slimeKingDefeated = true;
      if (!this.hasBetterGun && Math.random() < 1 / 6) {
        this.hasBetterGun = true;
        this.addItem('gun');
        this.showToast('King Slime defeated!\nThe King Slime dropped the Slime Gun! Zombies now carry Occult Books.');
      } else {
        this.showToast('King Slime defeated! Zombies now carry Occult Books.');
      }
      StorageManager.save(this);
    }

    // 2. Zombies drop Occult Book after King Slime is defeated
    if (e.kind === 'zombie' && this.slimeKingDefeated && this.itemCount('book') < 1 && !eyeAlive && Math.random() < 0.35) {
      this.addItem('book');
      this.showToast('Zombie dropped an Occult Book! Click with it to summon the Big Bad Eye.');
    }

    // 3. Eyelets drop Angel Tears
    if (e.kind === 'eyelet' && !this.hasWings && this.itemCount('angel_tear') < 4 && Math.random() < 0.3) {
      this.addItem('angel_tear');
      this.showToast(
        this.itemCount('angel_tear') >= 4
          ? 'You have 4 Angel Tears! Craft Wings in your Inventory (E).'
          : `Eyelet dropped an Angel Tear! (${this.itemCount('angel_tear')}/4)`
      );
    }

    // 4. Slimes drop Gel
    if ((e.kind === 'slime' || e.kind === 'green') && !this.hasSlimeBoots && this.itemCount('gel') < 10 && Math.random() < 0.5) {
      this.addItem('gel');
      if (this.itemCount('gel') >= 10) {
        this.showToast('You have 10 Gel! Craft the Slime Boots in your Inventory (E).');
      }
    }

    // 5. Purple Eyelets drop God's Tears
    if (e.kind === 'purple_eyelet' && !this.hasInfiniteWings && this.itemCount('god_tear') < 4 && Math.random() < 0.3) {
      this.addItem('god_tear');
      this.showToast(
        this.itemCount('god_tear') >= 4
          ? "You have 4 God's Tears! Craft Infinite Wings (E)."
          : `Purple eyelet dropped a God's Tear! (${this.itemCount('god_tear')}/4)`
      );
    }

    // 6. Big Bad Eye -> 1 in 6 chance to drop Big Bad Sword, +50 Max HP, and unlocks Golden Eyelets
    if (e.kind === 'eye') {
      this.eyeDefeated = true;
      if (this.maxHp < 150) this.maxHp = 150;
      this.player.hp = this.maxHp;

      if (this.itemCount('boss_sword') === 0 && Math.random() < 1 / 6) {
        this.hasBossSword = true;
        this.addItem('boss_sword', 1);
        this.showToast('Big Bad Eye defeated!\nThe Big Bad Eye dropped the Big Bad Sword!\nMax HP raised to 150. Golden Eyelets now appear in the skies!');
      } else {
        this.showToast('Big Bad Eye defeated! Max HP raised to 150.\nGolden Eyelets now appear in the skies!');
      }
      StorageManager.save(this);
    }

    // 7. Golden Eyelets drop Ancient Artefacts (3 needed for Relic)
    if (e.kind === 'golden_eyelet' && this.itemCount('ancient_artefact') < 3 && Math.random() < 0.4) {
      this.addItem('ancient_artefact');
      this.showToast(
        this.itemCount('ancient_artefact') >= 3
          ? 'You have 3 Ancient Artefacts! Craft The Relic (E) to summon The Descendant.'
          : `Golden Eyelet dropped an Ancient Artefact! (${this.itemCount('ancient_artefact')}/3)`
      );
    }

    // 8. The Descendant defeated
    if (e.kind === 'descendant') {
      this.descendantDefeated = true;
      this.angelSwords = [];
      this.showToast('VICTORY! The Descendant has been defeated! The realm is at peace.');
      StorageManager.save(this);
    }

    this.notify();
  }

  public respawn(): void {
    this.player.hp = this.maxHp;
    this.player.x = (WORLD_W / 2) * TILE;
    this.player.y = (this.world.surface[Math.floor(WORLD_W / 2)] - 3) * TILE;
    this.player.vx = 0;
    this.player.vy = 0;
    this.angelSwords = [];
    if (this.enemies.some((e) => e.kind === 'eye')) this.addItem('book');
    if (this.enemies.some((e) => e.kind === 'descendant')) this.addItem('relic');
    this.enemies = [];
    this.slimeBalls = [];
    this.showToast('You perished! Respawned at base camp.');
    this.notify();
  }

  public resetWorldAndProgress(): void {
    StorageManager.clearSave();
    this.world = new World();
    this.initialWorldData = new Uint8Array(this.world.data);

    this.player.hp = 100;
    this.maxHp = 100;
    const spawnTileY = this.world.surface[Math.floor(WORLD_W / 2)] - 3;
    this.player.x = (WORLD_W / 2) * TILE;
    this.player.y = spawnTileY * TILE;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invincibleFrames = 0;
    this.player.dropFrames = 0;
    this.player.flying = false;

    this.hasWings = false;
    this.hasInfiniteWings = false;
    this.flightTime = FLIGHT_MAX;
    this.wingsArmed = false;

    this.hasSlimeBoots = false;
    this.dashFrames = 0;
    this.dashCooldown = 0;
    this.dashTrail = [];

    this.hasBossSword = false;
    this.hasBetterGun = false;

    this.slimeKingDefeated = false;
    this.eyeDefeated = false;
    this.descendantDefeated = false;
    this.kills = 0;

    this.hotbar = ['sword', 'pickaxe', null, null, null, null, null, null, null, null];
    this.storage = new Array(30).fill(null);
    this.inventory = { sword: 1, pickaxe: 1 } as any;
    this.selectedSlot = 0;

    this.enemies = [];
    this.bullets = [];
    this.slimeBalls = [];
    this.angelSwords = [];
    this.debris = [];
    this.floatingTexts = [];

    this.showToast('New world generated! All progression reset.');
    this.notify();
  }

  // --- Canvas 2D World Render Pipeline ---
  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.imageSmoothingEnabled = false;

    // Viewport dimensions
    this.viewW = width / ZOOM;
    this.viewH = height / ZOOM;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a2a4a');
    grad.addColorStop(1, '#2c3f66');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Camera transform
    ctx.save();
    ctx.scale(ZOOM, ZOOM);
    ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // Render world tiles
    this.renderTiles(ctx);

    // Mining cracks
    this.renderBreakCracks(ctx);

    // Enemies
    for (const e of this.enemies) {
      this.renderEnemy(ctx, e);
    }

    // Projectiles
    ctx.fillStyle = '#ffd34d';
    for (const b of this.bullets) {
      ctx.fillRect(b.x - 1.5, b.y - 1.5, 3, 3);
    }

    ctx.fillStyle = '#5be07a';
    for (const b of this.slimeBalls) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const sw of this.angelSwords) {
      this.renderAngelSword(ctx, sw.x, sw.y, Math.atan2(sw.vy, sw.vx), 14, sw.color);
    }

    // Player & Held weapon
    this.renderPlayer(ctx);
    this.renderHeldItem(ctx);

    // Debris
    this.renderDebris(ctx);

    // Tile cursor outline
    this.renderTileCursor(ctx);

    // Terraria-style floating pickup texts
    this.renderFloatingTexts(ctx);

    ctx.restore();
  }

  private renderTiles(ctx: CanvasRenderingContext2D): void {
    const x0 = Math.max(0, Math.floor(this.camera.x / TILE));
    const x1 = Math.min(WORLD_W - 1, Math.ceil((this.camera.x + this.viewW) / TILE));
    const y0 = Math.max(0, Math.floor(this.camera.y / TILE));
    const y1 = Math.min(WORLD_H - 1, Math.ceil((this.camera.y + this.viewH) / TILE));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const tile = this.world.getTile(x, y);
        const seeThrough = tile === Tile.AIR || tile === Tile.PLATFORM || tile === Tile.DOOR_OPEN;

        // Cave backdrop
        if (seeThrough && y > this.world.surface[x] + 4) {
          ctx.fillStyle = '#14161c';
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }

        if (tile === Tile.AIR) continue;

        if (tile === Tile.PLATFORM) {
          ctx.fillStyle = '#a0693a';
          ctx.fillRect(x * TILE, y * TILE, TILE, 4);
          ctx.fillStyle = '#6b4423';
          ctx.fillRect(x * TILE, y * TILE + 3, TILE, 1);
          continue;
        }

        if (tile === Tile.DOOR) {
          ctx.fillStyle = '#a0693a';
          ctx.fillRect(x * TILE + 2, y * TILE, TILE - 4, TILE);
          ctx.fillStyle = '#6b4423';
          ctx.fillRect(x * TILE + 2, y * TILE, 2, TILE);
          ctx.fillStyle = '#ffd34d';
          ctx.fillRect(x * TILE + TILE - 6, y * TILE + 7, 2, 2);
          continue;
        }

        if (tile === Tile.DOOR_OPEN) {
          ctx.fillStyle = '#6b4423';
          ctx.fillRect(x * TILE + 2, y * TILE, 3, TILE);
          continue;
        }

        if (tile === Tile.BUSH) {
          const bx = x * TILE;
          const by = y * TILE;
          ctx.fillStyle = '#2a6f2e';
          ctx.fillRect(bx + 1, by + 8, 14, 8);
          ctx.fillStyle = '#3a9a3f';
          ctx.fillRect(bx + 3, by + 4, 10, 6);
          ctx.fillRect(bx + 5, by + 2, 6, 3);
          ctx.fillStyle = '#d1264a';
          for (const [dx, dy] of [
            [3, 9],
            [9, 6],
            [11, 11],
            [6, 12],
          ]) {
            ctx.fillRect(bx + dx, by + dy, 3, 3);
          }
          ctx.fillStyle = '#ff9db5';
          for (const [dx, dy] of [
            [3, 9],
            [9, 6],
            [11, 11],
            [6, 12],
          ]) {
            ctx.fillRect(bx + dx, by + dy, 1, 1);
          }
          continue;
        }

        const spritePos = TILE_SPRITES[tile];
        if (spritePos && this.spriteSheet.complete) {
          ctx.drawImage(
            this.spriteSheet,
            spritePos[0] * 16,
            spritePos[1] * 16,
            16,
            16,
            x * TILE,
            y * TILE,
            TILE,
            TILE
          );
        } else {
          ctx.fillStyle = TILE_COLORS[tile] || '#8b5a2b';
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          if (tile === Tile.GRASS) {
            ctx.fillStyle = '#4caf50';
            ctx.fillRect(x * TILE, y * TILE, TILE, 4);
          }
        }

        if (tile === Tile.ORE) {
          ctx.fillStyle = '#f0c040';
          ctx.fillRect(x * TILE + 3, y * TILE + 3, 4, 4);
          ctx.fillRect(x * TILE + 9, y * TILE + 8, 4, 4);
        }

        if (tile === Tile.SILVER) {
          for (const [dx, dy] of [
            [9, 2],
            [3, 9],
          ]) {
            ctx.fillStyle = '#6f7b8a';
            ctx.fillRect(x * TILE + dx - 1, y * TILE + dy - 1, 6, 6);
            ctx.fillStyle = '#e8f0fa';
            ctx.fillRect(x * TILE + dx, y * TILE + dy, 4, 4);
          }
        }
      }
    }
  }

  private renderBreakCracks(ctx: CanvasRenderingContext2D): void {
    if (!this.leftDown || this.mining.progress <= 0 || this.world.getTile(this.mining.x, this.mining.y) === Tile.AIR)
      return;

    const frac = Math.min(1, this.mining.progress / this.mining.need);
    const stage = Math.min(9, Math.floor(frac * 10));
    const px = this.mining.x * TILE;
    const py = this.mining.y * TILE;

    ctx.fillStyle = `rgba(0,0,0,${0.08 + frac * 0.22})`;
    ctx.fillRect(px, py, TILE, TILE);

    const count = Math.ceil((CRACK_PIXELS.length * (stage + 1)) / 10);
    for (let i = 0; i < count; i++) {
      const [cx, cy] = CRACK_PIXELS[i];
      ctx.fillStyle = 'rgba(0,0,0,.75)';
      ctx.fillRect(px + cx, py + cy, 1, 1);
      if (i % 3 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        ctx.fillRect(px + cx + 1, py + cy + 1, 1, 1);
      }
    }
  }

  private renderEnemy(ctx: CanvasRenderingContext2D, e: Enemy): void {
    if (e.kind === 'descendant') {
      this.renderDescendant(ctx, e);
      return;
    }
    if (e.kind === 'eye' || e.kind === 'eyelet' || e.kind === 'purple_eyelet' || e.kind === 'golden_eyelet') {
      this.renderEye(ctx, e);
      return;
    }

    const colors: Record<string, string> = {
      zombie: '#7f8c6f',
      slime: '#4aa3ff',
      green: '#3fe05a',
      boss: '#2bd4c0',
    };

    ctx.fillStyle = e.hitFlash && e.hitFlash > 0 ? '#ff4d4d' : colors[e.kind] || '#fff';
    ctx.fillRect(e.x, e.y, e.w, e.h);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(e.x + 3, e.y + 3, 2, 2);
    ctx.fillRect(e.x + e.w - 5, e.y + 3, 2, 2);

    if (e.kind === 'boss') {
      // King Slime Crown
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(e.x + e.w / 2 - 8, e.y - 6, 16, 6);
      return;
    }

    // Health bar above regular enemy
    ctx.fillStyle = '#a22';
    ctx.fillRect(e.x, e.y - 4, e.w, 2);
    ctx.fillStyle = '#2c2';
    ctx.fillRect(e.x, e.y - 4, (e.w * e.hp) / e.maxHp, 2);
  }

  private renderEye(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const r = e.w / 2;
    const enraged = e.kind === 'eye' && e.hp <= 1500;
    const isPurple = e.kind === 'purple_eyelet';
    const isGold = e.kind === 'golden_eyelet';
    const flash = e.state === 'windup' && Math.floor((e.t || 0) / 3) % 2 === 1;

    ctx.fillStyle =
      e.hitFlash && e.hitFlash > 0
        ? '#ff4d4d'
        : flash
          ? '#ff9a9a'
          : isGold
            ? '#fff1b8'
            : isPurple
              ? '#e2c8ff'
              : enraged
                ? '#e8b4b4'
                : '#f2f2f2';

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle =
      e.hitFlash && e.hitFlash > 0 ? '#ff0000' : isGold ? '#b8860b' : isPurple ? '#7b2cbf' : '#b22';
    ctx.lineWidth = 1;
    ctx.stroke();

    const a = Math.atan2(this.player.y + 13 - cy, this.player.x + 6 - cx);
    const ix = cx + Math.cos(a) * r * 0.35;
    const iy = cy + Math.sin(a) * r * 0.35;

    ctx.fillStyle = isGold ? '#e0a800' : isPurple ? '#9d4edd' : '#c22';
    ctx.beginPath();
    ctx.arc(ix, iy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(ix, iy, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    if (e.kind === 'eyelet' || e.kind === 'purple_eyelet' || e.kind === 'golden_eyelet') {
      ctx.fillStyle = '#a22';
      ctx.fillRect(e.x, e.y - 5, e.w, 2);
      ctx.fillStyle = '#2c2';
      ctx.fillRect(e.x, e.y - 5, (e.w * e.hp) / e.maxHp, 2);
    }
  }

  private renderDescendant(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const cx = e.x + e.w / 2;
    const cy = e.y + e.h / 2;
    const col = e.mode === 'ranged' ? '#6aa0ff' : '#ff4d4d';

    for (let i = 0; i < 8; i++) {
      const a = (e.t || 0) * 0.03 + (i * Math.PI) / 4;
      this.renderAngelSword(ctx, cx + Math.cos(a) * 48, cy + Math.sin(a) * 48, a, 16, col);
    }

    const flashing = e.state === 'windup' && Math.floor((e.t || 0) / 3) % 2 === 1;
    ctx.fillStyle = e.hitFlash && e.hitFlash > 0 ? '#ffd0d0' : flashing ? '#ffe9a8' : '#ffffff';
    ctx.fillRect(e.x, e.y, e.w, e.h);

    ctx.strokeStyle = '#cfd8e8';
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);

    // Golden Crown
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.moveTo(cx - 14, e.y - 2);
    ctx.lineTo(cx - 14, e.y - 14);
    ctx.lineTo(cx - 7, e.y - 7);
    ctx.lineTo(cx, e.y - 16);
    ctx.lineTo(cx + 7, e.y - 7);
    ctx.lineTo(cx + 14, e.y - 14);
    ctx.lineTo(cx + 14, e.y - 2);
    ctx.closePath();
    ctx.fill();

    if (e.immuneFlash && e.immuneFlash > 0) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.strokeRect(e.x - 4, e.y - 4, e.w + 8, e.h + 8);
    }
  }

  public renderAngelSword(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    len: number,
    color: string
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(-len * 0.3, -3);
    ctx.lineTo(-len * 0.3, 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(-len * 0.3 - 2, -5, 3, 10);
    ctx.restore();
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    const visible = this.player.invincibleFrames <= 0 || Math.floor(this.player.invincibleFrames / 4) % 2 === 0;
    if (!visible) return;

    // Dash trail
    for (const t of this.dashTrail) {
      ctx.globalAlpha = (t.life / 12) * 0.45;
      ctx.fillStyle = '#3ecf8e';
      ctx.fillRect(t.x, t.y, this.player.w, this.player.h);
    }
    ctx.globalAlpha = 1;

    // Wings
    if (this.hasWings) {
      const cx = this.player.x + this.player.w / 2;
      const cy = this.player.y + 12;
      const up =
        this.player.flying && Math.floor((this.hasInfiniteWings ? Date.now() / 60 : this.flightTime) / 4) % 2 === 1
          ? -5
          : 0;

      ctx.fillStyle = this.hasInfiniteWings ? '#f3e8ff' : '#f4f4ff';
      ctx.strokeStyle = this.hasInfiniteWings ? '#a855f7' : '#9aa6c8';
      ctx.lineWidth = 1;

      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + side * 2, cy);
        ctx.lineTo(cx + side * 16, cy - 8 + up);
        ctx.lineTo(cx + side * 13, cy + 2 + up / 2);
        ctx.lineTo(cx + side * 15, cy + 9);
        ctx.lineTo(cx + side * 2, cy + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Body
    ctx.fillStyle = '#d9a066';
    ctx.fillRect(this.player.x + 1, this.player.y, 10, 9); // head
    ctx.fillStyle = '#3a6ad0';
    ctx.fillRect(this.player.x, this.player.y + 9, 12, 17); // body
    ctx.fillStyle = '#000';
    ctx.fillRect(this.player.x + (this.player.facing > 0 ? 7 : 3), this.player.y + 3, 2, 2); // eye

    // Slime boots
    if (this.hasSlimeBoots) {
      ctx.fillStyle = '#3ecf8e';
      ctx.fillRect(this.player.x, this.player.y + 22, 5, 4);
      ctx.fillRect(this.player.x + 7, this.player.y + 22, 5, 4);
    }
  }

  private renderHeldItem(ctx: CanvasRenderingContext2D): void {
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + 8;
    const angle = Math.atan2(this.mouseWorldY() - py, this.mouseWorldX() - px);

    ctx.save();
    ctx.translate(px, py);

    const held = this.heldItem();
    if (held === 'sword' || held === 'silver_sword' || held === 'boss_sword') {
      const swordAngle = this.swingFrames > 0 ? angle + ((this.swingFrames - 7) / 7) * 1.4 : angle - 0.9;
      ctx.rotate(swordAngle);

      const isBigBad = held === 'boss_sword';
      const bladeColor = isBigBad ? '#ff3344' : held === 'silver_sword' ? '#cde' : '#ccd';
      const bladeLen = isBigBad ? 28 : held === 'silver_sword' ? 24 : 22;

      ctx.fillStyle = bladeColor;
      ctx.fillRect(4, -1.5, bladeLen, 3);
      ctx.fillStyle = '#a63';
      ctx.fillRect(1, -2, 4, 4);

      if (this.swingFrames > 0) {
        ctx.strokeStyle = isBigBad ? 'rgba(255, 60, 60, 0.7)' : 'rgba(255,255,255,.5)';
        ctx.beginPath();
        ctx.arc(0, 0, bladeLen + 6, -1.5, 1.4);
        ctx.stroke();
      }
    } else if (held === 'gun' || held === 'honza') {
      ctx.rotate(angle);
      if (Math.abs(angle) > Math.PI / 2) ctx.scale(1, -1);
      ctx.fillStyle = this.hasBetterGun ? '#3ecf8e' : '#555';
      ctx.fillRect(3, -2, 16, 4);
      ctx.fillRect(3, 0, 5, 6);
    } else if (held && ITEMS[held].pick !== undefined) {
      ctx.rotate(angle + Math.PI / 2);
      const sprite = PICK_SPRITES[held];
      if (sprite && this.spriteSheet.complete) {
        ctx.drawImage(this.spriteSheet, sprite[0] * 16, sprite[1] * 16, 16, 16, -10, -21, 20, 20);
      }
    }

    ctx.restore();
  }

  private renderDebris(ctx: CanvasRenderingContext2D): void {
    for (const d of this.debris) {
      ctx.globalAlpha = Math.min(1, d.life / 10);
      ctx.fillStyle = d.color;
      ctx.fillRect(Math.round(d.x), Math.round(d.y), d.size, d.size);
    }
    ctx.globalAlpha = 1;
  }

  private renderTileCursor(ctx: CanvasRenderingContext2D): void {
    const held = this.heldItem();
    if (
      !held ||
      held === 'sword' ||
      held === 'silver_sword' ||
      held === 'boss_sword' ||
      held === 'gun' ||
      held === 'honza'
    )
      return;

    const tx = Math.floor(this.mouseWorldX() / TILE);
    const ty = Math.floor(this.mouseWorldY() / TILE);
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    if (this.floatingTexts.length === 0) return;
    ctx.save();
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const ft of this.floatingTexts) {
      const alpha = Math.min(1, ft.life / 15);
      ctx.globalAlpha = alpha;

      // Dark outline / shadow for crisp Terraria pixel readability
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeText(ft.text, Math.round(ft.x), Math.round(ft.y));

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
    }
    ctx.restore();
  }
}
