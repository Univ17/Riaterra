import React, { useEffect, useMemo, useState } from 'react';
import { StorageManager } from '../game/storage';
import logo from '../assets/riaterra-logo.png';

interface MainMenuProps {
  inGame: boolean;          // true when opened with Esc during play (shows Resume instead of Play)
  onPlay: () => void;       // start / resume playing
  onNewGame: () => void;    // wipe the save, generate a new world, start playing
  onSave: () => void;       // save now (only offered while in game)
}

type Panel = null | 'controls' | 'confirm-new';

// Clouds: [top %, width px, seconds per crossing, start delay s]
const CLOUDS: [number, number, number, number][] = [
  [8, 160, 90, -20],
  [18, 110, 120, -70],
  [30, 200, 100, -45],
  [12, 90, 140, -100],
];

const Tree: React.FC<{ left: string; h: number }> = ({ left, h }) => (
  <div className="absolute bottom-full flex flex-col items-center" style={{ left }}>
    <div style={{ width: h * 0.9, height: h * 0.55, background: '#2e7d32', boxShadow: 'inset -6px -6px 0 #1f5d23, inset 6px 6px 0 #43a047' }} />
    <div style={{ width: h * 0.7, height: h * 0.3, background: '#2e7d32', marginTop: -2, boxShadow: 'inset -6px -4px 0 #1f5d23' }} />
    <div style={{ width: 16, height: h * 0.5, background: '#6b4423', boxShadow: 'inset -4px 0 0 #523318' }} />
  </div>
);

export const MainMenu: React.FC<MainMenuProps> = ({ inGame, onPlay, onNewGame, onSave }) => {
  const hasSave = useMemo(() => StorageManager.hasSave(), []);
  // Defensive: if storage.ts is an older copy without this helper, skip the "last saved" line
  // instead of crashing the whole page.
  const savedAt = useMemo(
    () => (typeof StorageManager.getSaveTimestamp === 'function' ? StorageManager.getSaveTimestamp() : null),
    []
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [selected, setSelected] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);

  const items = useMemo(() => {
    const list: { id: string; label: string }[] = [
      { id: 'play', label: inGame ? 'Resume' : hasSave ? 'Continue' : 'Play' },
    ];
    if (inGame) list.push({ id: 'save', label: savedFlash ? 'Saved!' : 'Save Game' });
    list.push({ id: 'new', label: 'New Game' }, { id: 'controls', label: 'Controls' });
    return list;
  }, [inGame, hasSave, savedFlash]);

  const activate = (id: string) => {
    if (id === 'play') onPlay();
    else if (id === 'save') {
      onSave();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } else if (id === 'new') {
      if (hasSave || inGame) setPanel('confirm-new');
      else onNewGame();
    } else if (id === 'controls') setPanel('controls');
  };

  // Keyboard: arrows / W S to move, Enter or Space to choose, Esc to go back (or resume)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key === 'Escape') {
        if (e.repeat) return;
        if (panel) setPanel(null);
        else if (inGame) onPlay();
        return;
      }
      if (panel) return;
      if (key === 'arrowdown' || key === 's') setSelected((i) => (i + 1) % items.length);
      else if (key === 'arrowup' || key === 'w') setSelected((i) => (i + items.length - 1) % items.length);
      else if (key === 'enter' || key === ' ') {
        e.preventDefault();
        activate(items[selected].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const key = (k: string) => (
    <span className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-500 text-white rounded-xs">{k}</span>
  );

  return (
    <div
      className="fixed inset-0 z-[60] overflow-hidden select-none font-pixel"
      style={{ background: 'linear-gradient(to bottom, #0a1530 0%, #162c55 45%, #2b4d82 80%)' }}
    >
      {/* Drifting clouds */}
      {CLOUDS.map(([top, w, dur, delay], i) => (
        <div
          key={i}
          className="menu-cloud absolute"
          style={{ top: `${top}%`, left: 0, animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
        >
          <div style={{ width: w, height: w * 0.22, background: '#8fa6cf', opacity: 0.4, boxShadow: `0 -${w * 0.12}px 0 -${w * 0.06}px #8fa6cf` }} />
        </div>
      ))}

      {/* Ground: grass, dirt, stone */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '26vh' }}>
        <Tree left="8%" h={90} />
        <Tree left="82%" h={110} />
        <Tree left="68%" h={70} />
        <div style={{ height: 20, background: '#4caf50', borderBottom: '6px solid #3d8c40', boxShadow: 'inset 0 4px 0 #6cc470' }} />
        <div style={{ height: '55%', background: 'repeating-conic-gradient(#8b5a2b 0% 25%, #7d5026 0% 50%) 0 0 / 32px 32px' }} />
        <div style={{ height: '45%', background: 'repeating-conic-gradient(#7a7f88 0% 25%, #6b7078 0% 50%) 0 0 / 32px 32px' }} />
      </div>

      {/* Title + menu */}
      <div className="relative z-10 flex flex-col items-center pt-[8vh] px-4 h-full">
        <h1 className="menu-title leading-none">
          <img
            src={logo}
            alt="Riaterra"
            draggable={false}
            style={{
              display: 'block',
              width: 'auto',
              height: 'auto',
              maxWidth: 'min(88vw, 620px)',
              maxHeight: '30vh',
              filter: 'drop-shadow(0 0 10px rgba(255,255,255,.3))',   // lifts the black outline off the dark sky
            }}
          />
        </h1>
        <p className="mt-4 text-[10px] md:text-xs text-white" style={{ textShadow: '2px 2px 0 #000' }}>
          A 2D SANDBOX ADVENTURE
        </p>

        <nav className="mt-[7vh] flex flex-col items-center gap-3">
          {items.map((it, i) => {
            const active = i === selected;
            return (
              <button
                key={it.id}
                onMouseEnter={() => setSelected(i)}
                onClick={() => activate(it.id)}
                className="cursor-pointer transition-transform"
                style={{
                  fontSize: 'clamp(1rem, 3.2vw, 1.6rem)',
                  color: active ? '#ffe45c' : '#e8e8e8',
                  textShadow: '3px 3px 0 #000',
                  transform: active ? 'scale(1.12)' : 'scale(1)',
                }}
              >
                <span className={`inline-block w-6 text-right mr-2 ${active ? 'menu-blink' : 'opacity-0'}`}>▶</span>
                {it.label}
                <span className="inline-block w-6 ml-2 opacity-0">▶</span>
              </button>
            );
          })}
        </nav>

        {hasSave && !inGame && savedAt && (
          <p className="mt-6 text-[9px] text-white" style={{ textShadow: '2px 2px 0 #000' }}>
            LAST SAVED: {new Date(savedAt).toLocaleString()}
          </p>
        )}
      </div>

      <p className="absolute bottom-2 left-0 right-0 text-center text-[8px] text-white/90 z-10" style={{ textShadow: '1px 1px 0 #000' }}>
        PROGRESS SAVES AUTOMATICALLY IN THIS BROWSER
      </p>

      {/* New game confirmation */}
      {panel === 'confirm-new' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-neutral-900 border-2 border-neutral-400 p-5 flex flex-col gap-4 text-center">
            <div className="text-xs text-white pixel-shadow">START A NEW GAME?</div>
            <p className="text-[10px] text-neutral-300 leading-relaxed">
              This erases your saved world, items and boss progress and generates a fresh world.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPanel(null)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-500 text-[10px] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={onNewGame}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-300 text-[10px] cursor-pointer"
              >
                YES, NEW GAME
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {panel === 'controls' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-neutral-900 border-2 border-neutral-400 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
              <span className="text-xs text-white pixel-shadow">CONTROLS</span>
              <button onClick={() => setPanel(null)} className="text-neutral-400 hover:text-white text-xs cursor-pointer">✕</button>
            </div>
            <ul className="space-y-2 text-[10px] text-neutral-300 leading-relaxed">
              <li className="flex gap-2 items-center flex-wrap">{key('A')} {key('D')} or arrows: move</li>
              <li className="flex gap-2 items-center flex-wrap">{key('W')} {key('Space')}: jump (hold in the air with Wings to fly)</li>
              <li className="flex gap-2 items-center flex-wrap">{key('S')}: drop through platforms</li>
              <li className="flex gap-2 items-center flex-wrap">{key('Shift')}: dash (needs Slime Boots)</li>
              <li className="flex gap-2 items-center flex-wrap">{key('Left Click')}: mine, attack, shoot</li>
              <li className="flex gap-2 items-center flex-wrap">{key('Right Click')}: place block, open door</li>
              <li className="flex gap-2 items-center flex-wrap">{key('1')}-{key('0')} or scroll wheel: pick a hotbar slot</li>
              <li className="flex gap-2 items-center flex-wrap">{key('E')} {key('Tab')}: inventory and crafting</li>
              <li className="flex gap-2 items-center flex-wrap">{key('H')}: drink a health potion</li>
              <li className="flex gap-2 items-center flex-wrap">{key('Esc')}: close inventory, or open this menu</li>
            </ul>
            <button
              onClick={() => setPanel(null)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] border border-neutral-500 cursor-pointer"
            >
              BACK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
