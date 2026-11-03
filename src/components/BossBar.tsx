import React from 'react';
import { BossInfo } from '../game/types';
import { Skull } from 'lucide-react';

interface BossBarProps {
  boss: BossInfo | null;
}

export const BossBar: React.FC<BossBarProps> = ({ boss }) => {
  if (!boss) return null;

  const percent = Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100));

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 w-full max-w-md px-4 pointer-events-none select-none animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="flex items-center gap-2 text-xs font-pixel text-white pixel-shadow">
        <Skull className="w-4 h-4 text-neutral-300" />
        <span className="font-bold tracking-wider">{boss.name.toUpperCase()}</span>
      </div>

      <div className="w-full h-5 bg-neutral-950/90 border-2 border-neutral-500 rounded-xs p-0.5 relative shadow-2xl overflow-hidden">
        <div
          className="h-full rounded-xs transition-all duration-150 relative"
          style={{
            width: `${percent}%`,
            backgroundColor: boss.color,
          }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center text-[9px] font-pixel text-white pixel-shadow font-bold">
          {boss.hp} / {boss.maxHp}
        </div>
      </div>
    </div>
  );
};
