import React, { useState } from 'react';
import { ItemId } from '../game/types';
import { ITEMS } from '../game/items';
import { CZ_SLOT_KEYS, NUM_SLOT_KEYS } from '../game/constants';

interface HotbarProps {
  hotbar: (ItemId | null)[];
  selectedSlot: number;
  inventory: Record<ItemId, number>;
  hasBossSword: boolean;
  hasBetterGun: boolean;
  onSelectSlot: (index: number) => void;
  onSwapSlots?: (fromIndex: number, toIndex: number) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({
  hotbar,
  selectedSlot,
  inventory,
  hasBossSword,
  hasBetterGun,
  onSelectSlot,
  onSwapSlots,
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const getItemDisplayName = (id: ItemId | null) => {
    if (!id) return '';
    if (id === 'gun' && hasBetterGun) return 'Slime Gun';
    const def = ITEMS[id];
    return def?.slot || def?.name || id;
  };

  const getItemCount = (id: ItemId | null) => {
    if (!id) return null;
    const def = ITEMS[id];
    if (def?.tile !== undefined || def?.counted) {
      return inventory[id] || 0;
    }
    return null;
  };

  const getItemColor = (id: ItemId | null) => {
    if (!id) return '#333';
    if (id === 'gun' && hasBetterGun) return '#3ecf8e';
    return ITEMS[id]?.color || '#aaa';
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!hotbar[index]) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ container: 'hotbar', index }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data && typeof data.index === 'number' && onSwapSlots) {
        onSwapSlots(data.index, targetIndex);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 p-1.5 bg-neutral-900/90 backdrop-blur-md border-2 border-neutral-600 rounded-sm select-none shadow-2xl">
      {hotbar.map((id, index) => {
        const isSelected = selectedSlot === index;
        const count = getItemCount(id);
        const name = getItemDisplayName(id);
        const color = getItemColor(id);
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={index}
            draggable={!!id}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => onSelectSlot(index)}
            className={`w-12 h-12 md:w-13 md:h-13 relative flex flex-col items-center justify-between p-1 rounded-xs cursor-pointer transition-all ${
              isSelected
                ? 'bg-neutral-700/95 border-2 border-neutral-200 shadow-[0_0_10px_rgba(255,255,255,0.45)] scale-105 z-10'
                : isDragOver
                  ? 'bg-neutral-700/80 border-2 border-neutral-300 scale-105'
                  : 'bg-neutral-950/85 border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-850 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
            }`}
          >
            {/* Hotkey label */}
            <div className="w-full flex justify-between items-center text-[8px] font-pixel text-neutral-400">
              <span className={isSelected ? 'text-white font-bold' : ''}>{NUM_SLOT_KEYS[index]}</span>
              <span className="text-[7px] text-neutral-500">{CZ_SLOT_KEYS[index]}</span>
            </div>

            {/* Item preview swatch / sprite */}
            {id ? (
              <div className="flex-1 flex items-center justify-center">
                <div
                  className="w-5 h-5 rounded-xs border border-black/50 shadow-sm flex items-center justify-center pointer-events-none"
                  style={{ backgroundColor: color }}
                />
              </div>
            ) : (
              <div className="flex-1" />
            )}

            {/* Item name and count */}
            <div className="w-full flex justify-between items-center text-[7px] font-pixel leading-none">
              <span className="truncate max-w-[34px] text-neutral-300 pixel-shadow">{name}</span>
              {count !== null && (
                <span className="text-neutral-100 font-silkscreen font-bold tabular-nums pixel-shadow">
                  {count}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
