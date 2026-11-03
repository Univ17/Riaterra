import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { CZ_SLOT_KEYS, HOTBAR_SIZE } from '../game/constants';

interface GameCanvasProps {
  engine: GameEngine;
  onOpenInventory: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onOpenInventory }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse handlers
    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      engine.mouseX = e.clientX - r.left;
      engine.mouseY = e.clientY - r.top;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (engine.isInventoryOpen) return;
      if (e.button === 0) engine.leftDown = true;
      else if (e.button === 2) engine.rightDown = true;
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) engine.leftDown = false;
      else if (e.button === 2) engine.rightDown = false;
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onWheel = (e: WheelEvent) => {
      engine.selectedSlot =
        (engine.selectedSlot + (e.deltaY > 0 ? 1 : HOTBAR_SIZE - 1)) % HOTBAR_SIZE;
      engine.notify();
    };

    // Keyboard handlers
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      engine.keys[key] = true;

      // Hotbar selection with Czech keys or Digits
      const czSlot = CZ_SLOT_KEYS.indexOf(key);
      if (czSlot >= 0) {
        engine.selectedSlot = czSlot;
        engine.notify();
      } else if (/^Digit\d$/.test(e.code)) {
        engine.selectedSlot = (Number(e.code.slice(5)) + 9) % 10;
        engine.notify();
      }

      if (e.key === 'Escape') {
        engine.isInventoryOpen = false;
        engine.notify();
      }

      if (key === 'h' && !e.repeat && !engine.isInventoryOpen) {
        engine.usePotion();
      }

      if ((key === 'e' || e.key === 'Tab') && !e.repeat) {
        e.preventDefault();
        onOpenInventory();
      }

      if (e.key === ' ') e.preventDefault();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      engine.keys[e.key.toLowerCase()] = false;
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Fixed 60 Hz Loop
    let animationId: number;
    let lastTime = performance.now();
    let accumulator = 0;

    const loop = (now: number) => {
      accumulator += Math.min(100, now - lastTime);
      lastTime = now;

      while (accumulator >= 1000 / 60) {
        engine.update();
        accumulator -= 1000 / 60;
      }

      engine.render(ctx, canvas.width, canvas.height);
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [engine, onOpenInventory]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-crosshair touch-none select-none"
    />
  );
};
