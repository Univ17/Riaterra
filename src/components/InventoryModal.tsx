import React, { useState, useEffect } from 'react';
import { ItemId, GameStateSnapshot, Recipe } from '../game/types';
import { ITEMS, RECIPES } from '../game/items';
import { X, Hammer, Package, Trash2, ArrowUpDown, Info } from 'lucide-react';

interface SlotRef {
  container: 'hotbar' | 'storage';
  index: number;
}

interface InventoryModalProps {
  snapshot: GameStateSnapshot;
  onClose: () => void;
  onSelectSlot: (slot: number) => void;
  onSwapSlots: (from: SlotRef, to: SlotRef) => void;
  onQuickMove: (container: 'hotbar' | 'storage', index: number) => void;
  onDiscardSlot: (container: 'hotbar' | 'storage', index: number) => void;
  onCraft: (recipeId: string, craftAll: boolean) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  snapshot,
  onClose,
  onSelectSlot,
  onSwapSlots,
  onQuickMove,
  onDiscardSlot,
  onCraft,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting'>('inventory');
  const [carriedItem, setCarriedItem] = useState<{ ref: SlotRef; id: ItemId } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<ItemId | null>(null);
  const [hoveredRecipe, setHoveredRecipe] = useState<Recipe | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Update cursor position for held item ghost
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Keyboard shortcut E or Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'e' || e.key === 'E') {
        if (carriedItem) {
          setCarriedItem(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [carriedItem, onClose]);

  // If carried item quantity is 0 or no longer exists, drop it
  useEffect(() => {
    if (carriedItem) {
      const count = snapshot.inventory[carriedItem.id] || 0;
      if (count <= 0) {
        setCarriedItem(null);
      }
    }
  }, [snapshot.inventory, carriedItem]);

  const getItemCount = (id: ItemId | null) => {
    if (!id) return 0;
    return snapshot.inventory[id] || 0;
  };

  const getItemColor = (id: ItemId | null) => {
    if (!id) return '#333';
    if (id === 'gun' && snapshot.hasBetterGun) return '#3ecf8e';
    return ITEMS[id]?.color || '#888';
  };

  const getItemName = (id: ItemId | null) => {
    if (!id) return '';
    if (id === 'gun' && snapshot.hasBetterGun) return 'Slime Gun';
    const def = ITEMS[id];
    return def?.name || id;
  };

  const getItemStats = (id: ItemId | null) => {
    if (!id) return '';
    if (id === 'boss_sword') return '55 Melee Damage • Extended Reach';
    if (id === 'angel_blade') return '60 Melee Damage • Boomerang, pierces everything';
    if (id === 'silver_sword') return '28 Melee Damage';
    if (id === 'sword') return '15 Melee Damage';
    if (id === 'gun') return snapshot.hasBetterGun ? 'High Velocity Rapid Slime Blaster' : '18 Ranged Damage';
    if (id === 'silver_pickaxe') return 'Pick Power: 2 (Mines Gold & Silver)';
    if (id === 'stone_pickaxe') return 'Pick Power: 1 (Mines Silver)';
    if (id === 'pickaxe') return 'Pick Power: 0 (Basic Mining)';
    if (id === 'potion') return 'Restores 25 Health';
    if (id === 'book') return 'Summons the Big Bad Eye';
    if (id === 'relic') return 'Summons the Descendant';
    const def = ITEMS[id];
    if (def?.tile !== undefined) return 'Placeable World Block';
    return def?.desc || 'Material';
  };

  // Click slot handler (Minecraft / Terraria cursor pickup & drop)
  const handleSlotClick = (container: 'hotbar' | 'storage', index: number, e: React.MouseEvent) => {
    const list = container === 'hotbar' ? snapshot.hotbar : snapshot.storage;
    const currentItem = list[index];

    // Shift-click quick move
    if (e.shiftKey) {
      if (currentItem) {
        onQuickMove(container, index);
      }
      return;
    }

    if (carriedItem) {
      // Drop/swap carried item with target slot
      onSwapSlots(carriedItem.ref, { container, index });
      setCarriedItem(null);
    } else if (currentItem && getItemCount(currentItem) > 0) {
      // Pick up item onto cursor
      setCarriedItem({ ref: { container, index }, id: currentItem });
    } else if (container === 'hotbar') {
      onSelectSlot(index);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, container: 'hotbar' | 'storage', index: number) => {
    const list = container === 'hotbar' ? snapshot.hotbar : snapshot.storage;
    const id = list[index];
    if (!id || getItemCount(id) <= 0) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ container, index }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slotKey) {
      setDragOverSlot(slotKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, toContainer: 'hotbar' | 'storage', toIndex: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data && data.container && typeof data.index === 'number') {
        onSwapSlots({ container: data.container, index: data.index }, { container: toContainer, index: toIndex });
      }
    } catch {
      // ignore
    }
  };

  const handleDropTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSlot(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data && data.container && typeof data.index === 'number') {
        onDiscardSlot(data.container, data.index);
      }
    } catch {
      // ignore
    }
  };

  const handleTrashClick = () => {
    if (carriedItem) {
      onDiscardSlot(carriedItem.ref.container, carriedItem.ref.index);
      setCarriedItem(null);
    }
  };

  const canCraftRecipe = (r: Recipe) => {
    return Object.entries(r.cost).every(
      ([id, count]) => (snapshot.inventory[id as ItemId] || 0) >= (count || 0)
    );
  };

  const isOneTimeDone = (r: Recipe) => {
    if (r.id === 'wings') return snapshot.hasWings;
    if (r.id === 'god_tear') return snapshot.hasInfiniteWings;
    if (r.id === 'boots') return snapshot.hasSlimeBoots;
    if (r.id === 'stone_pickaxe') return (snapshot.inventory.stone_pickaxe || 0) > 0;
    if (r.id === 'silver_pickaxe') return (snapshot.inventory.silver_pickaxe || 0) > 0;
    if (r.id === 'silver_sword') return (snapshot.inventory.silver_sword || 0) > 0;
    if (r.id === 'gun') return (snapshot.inventory.gun || 0) > 0 || snapshot.hasBetterGun;
    return false;
  };

  return (
    <div
      onClick={(e) => {
        // If clicking outside slots while carrying item, cancel carry
        if (e.target === e.currentTarget && carriedItem) {
          setCarriedItem(null);
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none"
    >
      {/* Floating Ghost for carried item */}
      {carriedItem && (
        <div
          className="fixed pointer-events-none z-50 flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div
            className="w-8 h-8 rounded-xs border-2 border-white shadow-2xl"
            style={{ backgroundColor: getItemColor(carriedItem.id) }}
          />
          <span className="text-[8px] font-silkscreen font-bold text-white bg-black/80 px-1 rounded mt-0.5 shadow-md">
            {getItemCount(carriedItem.id)}
          </span>
        </div>
      )}

      {/* Main Modal Box (Shades of Grey Palette) */}
      <div className="w-full max-w-2xl bg-neutral-900 border-2 border-neutral-600 rounded-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-neutral-200 font-pixel">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-850 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xs cursor-pointer transition-colors border ${
                activeTab === 'inventory'
                  ? 'bg-neutral-700 text-white border-neutral-400 font-bold shadow-xs'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200 hover:bg-neutral-750'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>INVENTORY</span>
            </button>
            <button
              onClick={() => setActiveTab('crafting')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xs cursor-pointer transition-colors border ${
                activeTab === 'crafting'
                  ? 'bg-neutral-700 text-white border-neutral-400 font-bold shadow-xs'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200 hover:bg-neutral-750'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>CRAFTING</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] text-neutral-400 hidden sm:inline">
              [E] or [Esc] to Close • Shift-Click to Quick Move
            </span>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-750 rounded-xs cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-900">
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* Top: Storage Grid (30 Slots: 3 rows of 10) */}
              <div>
                <div className="text-[10px] text-neutral-400 mb-2 flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>BACKPACK STORAGE</span>
                    <span className="text-[8px] text-neutral-500 font-normal">(Drag & Drop or Click to Move)</span>
                  </span>
                  {carriedItem && (
                    <span className="text-neutral-200 animate-pulse text-[9px] bg-neutral-800 px-2 py-0.5 border border-neutral-600 rounded-xs">
                      Holding: {getItemName(carriedItem.id)} (x{getItemCount(carriedItem.id)})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-neutral-950/70 rounded-xs border border-neutral-800">
                  {snapshot.storage.map((id, idx) => {
                    const count = id ? getItemCount(id) : 0;
                    const isValidItem = id && count > 0;
                    const isHeld = carriedItem?.ref.container === 'storage' && carriedItem.ref.index === idx;
                    const isDragTarget = dragOverSlot === `storage-${idx}`;

                    return (
                      <div
                        key={`storage-${idx}`}
                        draggable={!!isValidItem}
                        onDragStart={(e) => handleDragStart(e, 'storage', idx)}
                        onDragOver={(e) => handleDragOver(e, `storage-${idx}`)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'storage', idx)}
                        onClick={(e) => handleSlotClick('storage', idx, e)}
                        onMouseEnter={() => isValidItem && setHoveredItemId(id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        className={`h-13 sm:h-14 p-1 rounded-xs flex flex-col justify-between items-center cursor-pointer transition-all border ${
                          isDragTarget
                            ? 'bg-neutral-700/80 border-2 border-neutral-200 scale-105 z-10'
                            : isHeld
                              ? 'bg-neutral-800 border-2 border-neutral-400 opacity-60'
                              : 'bg-neutral-900 border-neutral-750 hover:border-neutral-500 hover:bg-neutral-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
                        }`}
                      >
                        <span className="text-[7px] text-neutral-600 self-start">{idx + 1}</span>

                        {isValidItem ? (
                          <div
                            className="w-5 h-5 rounded-xs border border-black/50 shadow-xs pointer-events-none"
                            style={{ backgroundColor: getItemColor(id) }}
                          />
                        ) : (
                          <div className="w-5 h-5 border border-dashed border-neutral-800 rounded-xs" />
                        )}

                        <span className="text-[8px] font-silkscreen font-bold text-neutral-200 self-end">
                          {isValidItem ? (ITEMS[id]?.tile || ITEMS[id]?.counted ? count : '1') : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom: Hotbar Row (10 Slots) */}
              <div>
                <div className="text-[10px] text-neutral-400 mb-2 flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>HOTBAR (SLOTS 1-10)</span>
                    <span className="text-[8px] text-neutral-500 font-normal">Active in Hand</span>
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 bg-neutral-950/70 rounded-xs border border-neutral-800">
                  {snapshot.hotbar.map((id, idx) => {
                    const count = id ? getItemCount(id) : 0;
                    const isValidItem = id && count > 0;
                    const isSelected = snapshot.selectedSlot === idx;
                    const isHeld = carriedItem?.ref.container === 'hotbar' && carriedItem.ref.index === idx;
                    const isDragTarget = dragOverSlot === `hotbar-${idx}`;

                    return (
                      <div
                        key={`hotbar-${idx}`}
                        draggable={!!isValidItem}
                        onDragStart={(e) => handleDragStart(e, 'hotbar', idx)}
                        onDragOver={(e) => handleDragOver(e, `hotbar-${idx}`)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'hotbar', idx)}
                        onClick={(e) => handleSlotClick('hotbar', idx, e)}
                        onMouseEnter={() => isValidItem && setHoveredItemId(id)}
                        onMouseLeave={() => setHoveredItemId(null)}
                        className={`h-13 sm:h-14 p-1 rounded-xs flex flex-col justify-between items-center cursor-pointer transition-all border ${
                          isDragTarget
                            ? 'bg-neutral-700/80 border-2 border-neutral-200 scale-105 z-10'
                            : isSelected
                              ? 'bg-neutral-700/90 border-2 border-neutral-200 shadow-[0_0_8px_rgba(255,255,255,0.35)]'
                              : isHeld
                                ? 'bg-neutral-800 border-2 border-neutral-400 opacity-60'
                                : 'bg-neutral-900 border-neutral-750 hover:border-neutral-500 hover:bg-neutral-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]'
                        }`}
                      >
                        <div className="w-full flex justify-between items-center text-[7px] text-neutral-500">
                          <span className={isSelected ? 'text-white font-bold' : ''}>{idx + 1}</span>
                          {isSelected && <span className="text-[6px] text-neutral-300">ACTIVE</span>}
                        </div>

                        {isValidItem ? (
                          <div
                            className="w-5 h-5 rounded-xs border border-black/50 shadow-xs pointer-events-none"
                            style={{ backgroundColor: getItemColor(id) }}
                          />
                        ) : (
                          <div className="w-5 h-5 border border-dashed border-neutral-800 rounded-xs" />
                        )}

                        <span className="text-[8px] font-silkscreen font-bold text-neutral-200 self-end">
                          {isValidItem ? (ITEMS[id]?.tile || ITEMS[id]?.counted ? count : '1') : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Utilities: Trash Slot & Tooltip Panel */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-neutral-950/60 border border-neutral-800 rounded-xs">
                {/* Item Details Info */}
                <div className="flex-1 min-h-[44px] flex items-center gap-3">
                  {hoveredItemId ? (
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-xs border border-neutral-600 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: getItemColor(hoveredItemId) }}
                      />
                      <div>
                        <div className="text-[10px] text-white font-bold">
                          {getItemName(hoveredItemId)}
                          <span className="ml-2 text-neutral-400 font-normal text-[8px]">
                            Count: {getItemCount(hoveredItemId)}
                          </span>
                        </div>
                        <div className="text-[8px] text-neutral-400">
                          {getItemStats(hoveredItemId)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[8px] text-neutral-500 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Hover any item slot to inspect details, damage stats, or block info.</span>
                    </div>
                  )}
                </div>

                {/* Classic Trash Slot */}
                <div
                  onDragOver={(e) => handleDragOver(e, 'trash')}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDropTrash}
                  onClick={handleTrashClick}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xs border cursor-pointer transition-all ${
                    dragOverSlot === 'trash' || (carriedItem && dragOverSlot === 'trash')
                      ? 'bg-neutral-700 border-neutral-200 text-white scale-105'
                      : 'bg-neutral-900 border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Drag an item here or click with carried item to permanently delete it"
                >
                  <Trash2 className="w-4 h-4 text-neutral-400" />
                  <div className="flex flex-col text-[8px] leading-tight">
                    <span className="font-bold text-neutral-300">TRASH CAN</span>
                    <span className="text-[7px] text-neutral-500">Drop to Discard</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Crafting Tab (Shades of Grey Palette) */}
          {activeTab === 'crafting' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RECIPES.map((r) => {
                const canCraft = canCraftRecipe(r);
                const done = isOneTimeDone(r);

                return (
                  <div
                    key={r.id}
                    onMouseEnter={() => setHoveredRecipe(r)}
                    className={`p-3 rounded-xs border flex flex-col justify-between gap-2.5 transition-all ${
                      done
                        ? 'bg-neutral-950/40 border-neutral-800 opacity-60'
                        : canCraft
                          ? 'bg-neutral-850 border-neutral-500 hover:border-neutral-300 shadow-sm'
                          : 'bg-neutral-950/60 border-neutral-800/80 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-xs border border-neutral-700 flex-shrink-0"
                          style={{ backgroundColor: r.color || ITEMS[r.icon as ItemId]?.color || '#888' }}
                        />
                        <div>
                          <div className="text-[10px] text-white flex items-center gap-1.5 font-bold">
                            <span>{r.name}</span>
                            {r.gives && r.gives > 1 && (
                              <span className="text-neutral-300 font-silkscreen font-bold">
                                x{r.gives}
                              </span>
                            )}
                          </div>
                          {r.desc && (
                            <div className="text-[8px] text-neutral-400 mt-0.5 leading-snug">
                              {r.desc}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Requirements checklist */}
                    <div className="flex flex-wrap gap-2 text-[8px] bg-neutral-950/80 p-2 rounded-xs border border-neutral-800">
                      {Object.entries(r.cost).map(([matId, needed]) => {
                        const current = snapshot.inventory[matId as ItemId] || 0;
                        const hasEnough = current >= (needed || 0);

                        return (
                          <div
                            key={matId}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xs border ${
                              hasEnough
                                ? 'bg-neutral-800 text-neutral-200 border-neutral-600'
                                : 'bg-neutral-900/60 text-neutral-500 border-neutral-800'
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-[1px] inline-block"
                              style={{ backgroundColor: ITEMS[matId as ItemId]?.color || '#888' }}
                            />
                            <span>{ITEMS[matId as ItemId]?.name || matId}:</span>
                            <span className="font-silkscreen font-bold">
                              {current}/{needed}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Crafting Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800">
                      <span className="text-[8px] text-neutral-400">
                        {done ? 'ALREADY UNLOCKED' : canCraft ? 'Ready to craft' : 'Missing ingredients'}
                      </span>

                      {!done && (
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={!canCraft}
                            onClick={() => onCraft(r.id, false)}
                            className={`px-3 py-1.5 text-[8px] rounded-xs cursor-pointer transition-colors border ${
                              canCraft
                                ? 'bg-neutral-750 hover:bg-neutral-650 text-white border-neutral-500 active:scale-95'
                                : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
                            }`}
                          >
                            CRAFT
                          </button>
                          <button
                            disabled={!canCraft}
                            onClick={() => onCraft(r.id, true)}
                            className={`px-2.5 py-1.5 text-[8px] rounded-xs cursor-pointer transition-colors border ${
                              canCraft
                                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-600 active:scale-95'
                                : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
                            }`}
                          >
                            ALL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
