import React from 'react';

interface ToastProps {
  text: string;
}

export const Toast: React.FC<ToastProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="fixed top-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none max-w-lg px-4 text-center animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-neutral-900/95 border-2 border-neutral-400 px-4 py-2.5 rounded-xs shadow-2xl backdrop-blur-xs">
        {text.split('\n').map((line, idx) => (
          <p key={idx} className="text-xs md:text-sm font-pixel text-neutral-100 pixel-shadow leading-relaxed font-bold">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
};
