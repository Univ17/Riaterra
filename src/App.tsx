import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameStateSnapshot, ItemId } from './game/types';
import { GameCanvas } from './components/GameCanvas';
import { Hud } from './components/Hud';
import { Hotbar } from './components/Hotbar';
import { InventoryModal } from './components/InventoryModal';
import { BossBar } from './components/BossBar';
import { DebugPanel } from './components/DebugPanel';
import { SaveControls } from './components/SaveControls';
import { Toast } from './components/Toast';
import { MainMenu } from './components/MainMenu';
import { StorageManager } from './game/storage';

export default function App() {
  const engine = useMemo(() => new GameEngine(), []);
  const [snapshot, setSnapshot] = useState<GameStateSnapshot>(() => engine.getSnapshot());
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(true);   // the main menu is shown first
  const [hasStarted, setHasStarted] = useState(false);   // false until the player presses Play once

  // The game is frozen while the menu is up; drop any held keys / mouse buttons so nothing sticks
  useEffect(() => {
    engine.isPaused = showMenu;
    if (showMenu) {
      engine.keys = {};
      engine.leftDown = false;
      engine.rightDown = false;
    }
  }, [engine, showMenu]);

  const handlePlay = useCallback(() => {
    setHasStarted(true);
    setShowMenu(false);
  }, []);

  const handleNewGame = useCallback(() => {
    engine.resetWorldAndProgress();
    engine.isInventoryOpen = false;
    setIsInventoryOpen(false);
    setHasStarted(true);
    setShowMenu(false);
  }, [engine]);

  const handleMenuSave = useCallback(() => {
    StorageManager.save(engine);
  }, [engine]);

  // Esc opens the menu (when no inventory is open, and the menu isn't already up)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.repeat) return;
      if (showMenu || isInventoryOpen) return;   // Esc closes the inventory first
      setShowMenu(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showMenu, isInventoryOpen]);

  useEffect(() => {
    const unsubscribe = engine.subscribe((newSnap) => {
      setSnapshot(newSnap);
      setIsInventoryOpen(engine.isInventoryOpen);
    });
    return unsubscribe;
  }, [engine]);

  const handleOpenInventory = useCallback(() => {
    engine.isInventoryOpen = true;
    engine.leftDown = false;
    engine.rightDown = false;
    setIsInventoryOpen(true);
    engine.notify();
  }, [engine]);

  const handleCloseInventory = useCallback(() => {
    engine.isInventoryOpen = false;
    setIsInventoryOpen(false);
    engine.notify();
  }, [engine]);

  const handleToggleInventory = useCallback(() => {
    if (engine.isInventoryOpen) {
      handleCloseInventory();
    } else {
      handleOpenInventory();
    }
  }, [engine, handleCloseInventory, handleOpenInventory]);

  const handleSelectSlot = useCallback(
    (slot: number) => {
      engine.selectedSlot = slot;
      engine.notify();
    },
    [engine]
  );

  const handleSwapSlots = useCallback(
    (
      from: { container: 'hotbar' | 'storage'; index: number },
      to: { container: 'hotbar' | 'storage'; index: number }
    ) => {
      engine.swapSlots(from, to);
    },
    [engine]
  );

  const handleSwapHotbarSlots = useCallback(
    (fromIndex: number, toIndex: number) => {
      engine.swapSlots(
        { container: 'hotbar', index: fromIndex },
        { container: 'hotbar', index: toIndex }
      );
    },
    [engine]
  );

  const handleQuickMove = useCallback(
    (container: 'hotbar' | 'storage', index: number) => {
      engine.quickMove(container, index);
    },
    [engine]
  );

  const handleDiscardSlot = useCallback(
    (container: 'hotbar' | 'storage', index: number) => {
      engine.discardSlot(container, index);
    },
    [engine]
  );

  const handleCraft = useCallback(
    (recipeId: string, craftAll: boolean) => {
      engine.craft(recipeId, craftAll);
    },
    [engine]
  );

  const handleQuickHeal = useCallback(() => {
    engine.usePotion();
  }, [engine]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#10141c] select-none font-pixel">
      {/* Canvas Viewport */}
      <GameCanvas engine={engine} onOpenInventory={handleToggleInventory} />

      {/* Top HUD */}
      <Hud
        snapshot={snapshot}
        onQuickHeal={handleQuickHeal}
        onToggleInventory={handleToggleInventory}
      />

      {/* Top Right Save & Controls */}
      <SaveControls engine={engine} />

      {/* Boss Health Bar */}
      <BossBar boss={snapshot.activeBoss} />

      {/* Notification Toast */}
      <Toast text={snapshot.toastText} />

      {/* Bottom Hotbar */}
      <Hotbar
        hotbar={snapshot.hotbar}
        selectedSlot={snapshot.selectedSlot}
        inventory={snapshot.inventory}
        hasBossSword={snapshot.hasBossSword}
        hasBetterGun={snapshot.hasBetterGun}
        onSelectSlot={handleSelectSlot}
        onSwapSlots={handleSwapHotbarSlots}
      />

      {/* Debug Cheats Menu */}
      <DebugPanel engine={engine} />

      {/* Inventory & Crafting Station Modal */}
      {isInventoryOpen && (
        <InventoryModal
          snapshot={snapshot}
          onClose={handleCloseInventory}
          onSelectSlot={handleSelectSlot}
          onSwapSlots={handleSwapSlots}
          onQuickMove={handleQuickMove}
          onDiscardSlot={handleDiscardSlot}
          onCraft={handleCraft}
        />
      )}

      {/* Main menu (first screen, and the pause menu on Esc) */}
      {showMenu && (
        <MainMenu inGame={hasStarted} onPlay={handlePlay} onNewGame={handleNewGame} onSave={handleMenuSave} />
      )}
    </div>
  );
}
