import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { StorageManager } from '../game/storage';
import { Save, RefreshCw, HelpCircle, Check, RotateCcw, AlertTriangle } from 'lucide-react';

interface SaveControlsProps {
  engine: GameEngine;
}

export const SaveControls: React.FC<SaveControlsProps> = ({ engine }) => {
  const [savedTick, setSavedTick] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = () => {
    const ok = StorageManager.save(engine);
    if (ok) {
      engine.showToast('Game saved to browser storage!');
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2000);
    }
  };

  const handleLoad = () => {
    if (StorageManager.hasSave()) {
      StorageManager.load(engine);
    } else {
      engine.showToast('No saved game found!');
    }
  };

  const handleConfirmReset = () => {
    engine.resetWorldAndProgress();
    setShowResetConfirm(false);
  };

  return (
    <>
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 select-none font-pixel">
        <button
          onClick={handleSave}
          title="Save progress"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-xs text-neutral-200 text-[9px] transition-colors active:scale-95 cursor-pointer shadow-xs"
        >
          {savedTick ? <Check className="w-3.5 h-3.5 text-neutral-200" /> : <Save className="w-3.5 h-3.5 text-neutral-400" />}
          <span>{savedTick ? 'SAVED!' : 'SAVE'}</span>
        </button>

        <button
          onClick={handleLoad}
          title="Load saved game"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-xs text-neutral-200 text-[9px] transition-colors active:scale-95 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
          <span>LOAD</span>
        </button>

        <button
          onClick={() => setShowResetConfirm(true)}
          title="Reset progression and generate a new world"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-850 hover:bg-neutral-750 border border-neutral-600 rounded-xs text-neutral-300 text-[9px] transition-colors active:scale-95 cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
          <span>RESET WORLD</span>
        </button>

        <button
          onClick={() => setShowHelp(true)}
          title="Controls & Progression Guide"
          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-xs text-neutral-300 transition-colors active:scale-95 cursor-pointer shadow-xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
          <div className="w-full max-w-md bg-neutral-900 border-2 border-neutral-500 rounded-xs p-5 shadow-2xl flex flex-col gap-4 text-center font-pixel">
            <div className="flex justify-center text-neutral-300">
              <AlertTriangle className="w-10 h-10 animate-pulse text-neutral-400" />
            </div>

            <div className="text-xs text-white pixel-shadow font-bold">
              RESET WORLD & PROGRESSION?
            </div>

            <p className="text-[10px] text-neutral-300 leading-relaxed">
              This will permanently erase all saved inventory, unlocked abilities, and defeated boss milestones, and generate a completely fresh procedural world.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-600 text-[10px] rounded-xs cursor-pointer transition-colors active:scale-95"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-bold text-[10px] rounded-xs cursor-pointer transition-colors active:scale-95 border border-neutral-400 shadow-lg"
              >
                YES, RESET WORLD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide & Controls Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
          <div className="w-full max-w-lg bg-neutral-900 border-2 border-neutral-600 rounded-xs p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto font-pixel text-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
              <span className="text-xs text-white font-bold">RIATERRA GUIDE & CONTROLS</span>
              <button
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[10px] text-neutral-300 leading-relaxed">
              <div>
                <div className="text-white font-bold mb-1">CONTROLS:</div>
                <ul className="list-disc list-inside space-y-1 text-neutral-400">
                  <li><strong className="text-neutral-100">A / D</strong> or <strong className="text-neutral-100">Arrows</strong>: Move Left / Right</li>
                  <li><strong className="text-neutral-100">W / Space</strong>: Jump (hold in air with Wings to fly)</li>
                  <li><strong className="text-neutral-100">S / Down</strong>: Drop down through platforms</li>
                  <li><strong className="text-neutral-100">Shift</strong>: Dash (requires Slime Boots)</li>
                  <li><strong className="text-neutral-100">Left Click</strong>: Mine block / Attack / Shoot weapon</li>
                  <li><strong className="text-neutral-100">Right Click</strong>: Place block / Open door</li>
                  <li><strong className="text-neutral-100">1 - 0</strong> or <strong className="text-neutral-100">+ ě š č...</strong>: Select hotbar slot</li>
                  <li><strong className="text-neutral-100">E / Tab</strong>: Open Minecraft/Terraria Inventory & Crafting</li>
                  <li><strong className="text-neutral-100">H</strong>: Quick heal with potion</li>
                </ul>
              </div>

              <div>
                <div className="text-white font-bold mb-1">INVENTORY & DRAG-AND-DROP:</div>
                <p className="text-neutral-400">
                  Open inventory with <strong className="text-neutral-200">E</strong>. Drag and drop items between hotbar and backpack slots to organize them. Shift-click any item to instantly move it between storage and hotbar. Items disappear automatically when count drops to 0. Drop unwanted items into the Trash Can.
                </p>
              </div>

              <div>
                <div className="text-white font-bold mb-1">BOSS PROGRESSION:</div>
                <ol className="list-decimal list-inside space-y-1 text-neutral-400">
                  <li><strong className="text-neutral-200">King Slime</strong>: Build an upside-down "T" out of 5 Gold Ore blocks. Has a 1 in 6 chance to drop the Slime Gun!</li>
                  <li><strong className="text-neutral-200">Occult Book & Big Bad Eye</strong>: Hunt zombies after King Slime to find the Book. Click to summon the Big Bad Eye. Has a 1 in 6 chance to drop the Big Bad Sword!</li>
                  <li><strong className="text-neutral-200">The Relic & Descendant</strong>: Golden Eyelets now appear. Slay them for 3 Ancient Artefacts, craft The Relic, and summon The Descendant!</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] rounded-xs cursor-pointer transition-colors border border-neutral-600"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </>
  );
};
