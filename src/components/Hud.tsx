import React from 'react';
import { GameStateSnapshot } from '../game/types';
import { Heart, Wind, Zap, Skull } from 'lucide-react';

interface HudProps {
  snapshot: GameStateSnapshot;
  onQuickHeal: () => void;
  onToggleInventory: () => void;
}

export const Hud: React.FC<HudProps> = ({ snapshot, onQuickHeal, onToggleInventory }) => {
  const hpPercent = Math.max(0, Math.min(100, (snapshot.playerHp / snapshot.playerMaxHp) * 100));
  const flightPercent = snapshot.hasInfiniteWings
    ? 100
    : Math.max(0, Math.min(100, (snapshot.flightTime / snapshot.flightMax) * 100));
  const dashPercent = Math.max(
    0,
    Math.min(100, (1 - snapshot.dashCooldown / snapshot.dashMaxCooldown) * 100)
  );

  return (
    <div className="absolute top-3 left-3 flex flex-col gap-2 z-20 pointer-events-none select-none">
      {/* Top Status Bars */}
      <div className="flex items-center gap-3">
        {/* Health Bar */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] font-pixel text-red-300 pixel-shadow">
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              <span>HEALTH</span>
            </span>
            <span className="font-silkscreen tabular-nums text-white">
              {snapshot.playerHp}/{snapshot.playerMaxHp}
            </span>
          </div>
          <div className="w-48 h-4 bg-black/80 border-2 border-slate-700 rounded-sm p-0.5 relative overflow-hidden shadow-md">
            <div
              className="h-full bg-gradient-to-r from-red-700 via-red-600 to-red-500 rounded-[1px] transition-all duration-150"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Flight Meter (Wings) */}
        {snapshot.hasWings && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-pixel text-purple-300 pixel-shadow">
              <span className="flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-purple-400" />
                <span>{snapshot.hasInfiniteWings ? 'INF WINGS' : 'FLIGHT'}</span>
              </span>
            </div>
            <div className="w-28 h-4 bg-black/80 border-2 border-purple-900 rounded-sm p-0.5 relative overflow-hidden shadow-md">
              <div
                className={`h-full rounded-[1px] transition-all duration-150 ${
                  snapshot.hasInfiniteWings
                    ? 'bg-gradient-to-r from-purple-500 via-pink-400 to-purple-300 animate-pulse'
                    : 'bg-gradient-to-r from-purple-700 to-purple-400'
                }`}
                style={{ width: `${flightPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Dash Meter (Slime Boots) */}
        {snapshot.hasSlimeBoots && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-pixel text-emerald-300 pixel-shadow">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>DASH (SHIFT)</span>
              </span>
            </div>
            <div className="w-28 h-4 bg-black/80 border-2 border-emerald-900 rounded-sm p-0.5 relative overflow-hidden shadow-md">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-[1px] transition-all duration-100"
                style={{ width: `${dashPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats & Quick Actions info */}
      <div className="flex items-center gap-2.5 mt-1 text-[9px] font-pixel text-neutral-300 pixel-shadow">
        <div className="flex items-center gap-1.5 bg-neutral-900/90 px-2 py-1 border border-neutral-700 rounded-xs">
          <Skull className="w-3 h-3 text-neutral-400" />
          <span>KILLS: {snapshot.kills}</span>
        </div>

        <button
          onClick={onQuickHeal}
          className="pointer-events-auto px-2 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-xs text-neutral-200 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
        >
          <span>[H] HEAL ({snapshot.inventory.potion || 0})</span>
        </button>

        <button
          onClick={onToggleInventory}
          className="pointer-events-auto px-2 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-xs text-neutral-200 transition-colors flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
        >
          <span>[E] INVENTORY</span>
        </button>
      </div>
    </div>
  );
};
