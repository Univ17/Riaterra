import React, { useState } from 'react';
import { GameEngine } from '../game/engine';
import { Wrench, ChevronUp, ChevronDown } from 'lucide-react';

interface DebugPanelProps {
  engine: GameEngine;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ engine }) => {
  const [isOpen, setIsOpen] = useState(false);

  const debugActions = [
    {
      label: 'Spawn King Slime',
      action: () => engine.spawnKingSlime(),
    },
    {
      label: 'Spawn Big Bad Eye',
      action: () => engine.spawnEyeBoss(),
    },
    {
      label: 'Spawn Descendant',
      action: () => engine.spawnDescendant(),
    },
    {
      label: 'Slime Gun',
      action: () => {
        engine.hasBetterGun = true;
        engine.addItem('gun');
        engine.showToast('Slime Gun unlocked!');
      },
    },
    {
      label: 'Big Bad Sword',
      action: () => {
        engine.hasBossSword = true;
        engine.addItem('boss_sword', 1);
        engine.showToast('Big Bad Sword granted!');
      },
    },
    {
      label: 'Angel Blade',
      action: () => {
        engine.addItem('angel_blade', 1);
        engine.showToast('Angel Blade granted!');
      },
    },
    {
      label: 'Infinite Wings',
      action: () => {
        engine.hasWings = true;
        engine.hasInfiniteWings = true;
        engine.showToast('Infinite Wings granted!');
      },
    },
    {
      label: 'Slime Boots',
      action: () => {
        engine.hasSlimeBoots = true;
        engine.showToast('Slime Boots granted! Press Shift to dash.');
      },
    },
    {
      label: 'Best Gun',
      action: () => {
        engine.hasBetterGun = true;
        engine.addItem('gun');
        engine.showToast('Upgraded Gun granted!');
      },
    },
    {
      label: 'Honza Gun',
      action: () => {
        engine.addItem('honza');
        engine.showToast('Honza Dev Gun granted!');
      },
    },
    {
      label: 'Full Heal',
      action: () => {
        engine.player.hp = engine.maxHp;
        engine.showToast('Health fully restored!');
      },
    },
    {
      label: '+50 Max HP',
      action: () => {
        engine.maxHp += 50;
        engine.player.hp = engine.maxHp;
        engine.showToast(`Max HP set to ${engine.maxHp}!`);
      },
    },
    {
      label: 'Silver Pickaxe',
      action: () => {
        engine.upgradeTool('silver_pickaxe', 'pickaxe');
        engine.showToast('Silver Pickaxe unlocked!');
      },
    },
    {
      label: '+100 Platforms',
      action: () => {
        engine.addItem('platform', 100);
        engine.showToast('+100 Platforms added!');
      },
    },
    {
      label: '+10 Gold Ore',
      action: () => {
        engine.addItem('ore', 10);
        engine.showToast('+10 Gold Ore added! Build upside-down T to summon King Slime.');
      },
    },
    {
      label: 'Reset World',
      action: () => {
        engine.resetWorldAndProgress();
      },
    },
  ];

  return (
    <div className="fixed bottom-3 right-3 z-30 flex flex-col items-end select-none font-pixel">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-xs text-neutral-300 text-[10px] shadow-lg cursor-pointer transition-colors active:scale-95"
      >
        <Wrench className="w-3.5 h-3.5 text-neutral-400" />
        <span>DEBUG CHEATS</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-2 w-72 bg-neutral-900 border-2 border-neutral-600 rounded-xs p-2.5 shadow-2xl flex flex-col gap-1.5 max-h-80 overflow-y-auto">
          <div className="text-[9px] text-neutral-300 pb-1 border-b border-neutral-700 font-bold">
            TEST CHEATS & SPAWNERS
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {debugActions.map((item, idx) => (
              <button
                key={idx}
                onClick={item.action}
                className="p-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-650 border border-neutral-700 rounded-xs text-[8px] text-neutral-200 hover:text-white transition-all cursor-pointer text-left truncate shadow-xs"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
