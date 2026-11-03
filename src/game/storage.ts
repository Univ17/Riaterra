import { SaveData, ItemId, Tile } from './types';
import { GameEngine } from './engine';
import { WORLD_W, WORLD_H } from './constants';

const SAVE_KEY = 'riaterra_save_v1';

export class StorageManager {
  public static save(engine: GameEngine): boolean {
    try {
      // Find delta tiles compared to clean baseline
      const worldDelta: Record<number, number> = {};
      const currentData = engine.world.data;
      // We can store tiles that are not standard or modified
      for (let i = 0; i < currentData.length; i++) {
        if (engine.initialWorldData && currentData[i] !== engine.initialWorldData[i]) {
          worldDelta[i] = currentData[i];
        }
      }

      const saveData: SaveData = {
        version: 1,
        timestamp: Date.now(),
        player: {
          hp: engine.player.hp,
          maxHp: engine.maxHp,
          x: engine.player.x,
          y: engine.player.y,
        },
        unlocks: {
          hasWings: engine.hasWings,
          hasInfiniteWings: engine.hasInfiniteWings,
          hasSlimeBoots: engine.hasSlimeBoots,
          hasBossSword: engine.hasBossSword,
          hasBetterGun: engine.hasBetterGun,
          slimeKingDefeated: engine.slimeKingDefeated,
          eyeDefeated: engine.eyeDefeated,
          descendantDefeated: engine.descendantDefeated,
          kills: engine.kills,
        },
        hotbar: [...engine.hotbar],
        storage: [...engine.storage],
        inventory: { ...engine.inventory },
        worldDelta,
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (err) {
      console.error('Failed to save Riaterra data:', err);
      return false;
    }
  }

  public static load(engine: GameEngine): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;

      const data: SaveData = JSON.parse(raw);
      if (!data || !data.player) return false;

      engine.player.hp = data.player.hp;
      engine.maxHp = data.player.maxHp || 100;
      engine.player.x = data.player.x;
      engine.player.y = data.player.y;

      if (data.unlocks) {
        engine.hasWings = !!data.unlocks.hasWings;
        engine.hasInfiniteWings = !!data.unlocks.hasInfiniteWings;
        engine.hasSlimeBoots = !!data.unlocks.hasSlimeBoots;
        engine.hasBossSword = !!data.unlocks.hasBossSword;
        engine.hasBetterGun = !!data.unlocks.hasBetterGun;
        engine.slimeKingDefeated = !!data.unlocks.slimeKingDefeated;
        engine.eyeDefeated = !!data.unlocks.eyeDefeated;
        engine.descendantDefeated = !!data.unlocks.descendantDefeated;
        engine.kills = data.unlocks.kills || 0;
      }

      if (data.hotbar && Array.isArray(data.hotbar)) {
        engine.hotbar = data.hotbar.map((id) =>
          id === ('slime_sword' as any) ? null : id
        );
      }

      if (data.storage && Array.isArray(data.storage)) {
        engine.storage = new Array(30).fill(null);
        for (let i = 0; i < Math.min(30, data.storage.length); i++) {
          const id = data.storage[i];
          engine.storage[i] = id === ('slime_sword' as any) ? null : id;
        }
      }

      if (data.inventory) {
        delete (data.inventory as any).slime_sword;
        engine.inventory = { ...data.inventory } as any;
      }

      if (data.worldDelta) {
        for (const [idxStr, tileType] of Object.entries(data.worldDelta)) {
          const idx = Number(idxStr);
          if (idx >= 0 && idx < engine.world.data.length) {
            engine.world.data[idx] = tileType as Tile;
          }
        }
      }

      engine.showToast('Game loaded successfully!');
      return true;
    } catch (err) {
      console.error('Failed to load Riaterra save:', err);
      return false;
    }
  }

  public static hasSave(): boolean {
    return !!localStorage.getItem(SAVE_KEY);
  }

  public static clearSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
