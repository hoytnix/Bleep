import React from 'react';

export interface HandbookState {
  mode: 'IDLE' | 'WIN' | 'RESPIN' | 'WHEEL';
  leftLine1: string;
  leftLine2?: string;
  leftValue?: string;
  rightLine1: string;
  rightLine2?: string;
}

interface HandbookProps {
  state: HandbookState;
  isMobile?: boolean;
}

export const Handbook: React.FC<HandbookProps> = ({ state, isMobile = false }) => {
  return (
    <div className="relative flex items-center justify-center select-none w-full max-w-4xl h-full max-h-[92%]">
      {/* Yellow Book Cover Spine Underlay */}
      <div className="absolute inset-0 bg-[#FFD700] rounded-2xl border-3 sm:border-4 border-black translate-y-1 shadow-[0_5px_0_#000000]" />

      {/* Book Container with Two Pages */}
      <div className="relative flex w-full h-full bg-[#FFFDF7] rounded-xl border-3 border-black overflow-hidden shadow-inner m-1">
        {/* Left Page */}
        <div className="flex-1 h-full flex flex-col items-center justify-center text-center px-3 sm:px-5 py-1 sm:py-2 border-r-2 border-slate-300 relative">
          {/* Subtle page lines */}
          <div className="absolute top-1.5 left-2.5 w-1.5 h-1.5 rounded-full bg-slate-200" />
          
          <span className="font-extrabold text-black uppercase tracking-tight text-xs sm:text-sm md:text-base leading-tight">
            {state.leftLine1}
          </span>
          {state.leftLine2 && (
            <span className="font-black text-black uppercase tracking-tight text-xs sm:text-sm md:text-base leading-tight">
              {state.leftLine2}
            </span>
          )}

          {state.leftValue && (
            <div className="mt-1 px-3 py-0.5 sm:py-1 bg-[#FFD700]/25 border-2 border-black rounded-lg flex items-center justify-center shadow-xs">
              <span className="font-black text-black text-sm sm:text-lg md:text-xl tracking-wider font-mono">
                {state.leftValue}
              </span>
            </div>
          )}
        </div>

        {/* Center Spine Stitch Shadow */}
        <div className="w-[3px] bg-gradient-to-r from-black/20 via-black/40 to-black/20 shadow-sm" />

        {/* Right Page */}
        <div className="flex-1 h-full flex flex-col items-center justify-center text-center px-3 sm:px-5 py-1 sm:py-2 relative">
          <div className="absolute top-1.5 right-2.5 w-1.5 h-1.5 rounded-full bg-slate-200" />

          <span className="font-bold text-slate-800 text-xs sm:text-sm md:text-base leading-snug">
            {state.rightLine1}
          </span>
          {state.rightLine2 && (
            <span className="font-black text-black text-xs sm:text-sm md:text-base leading-snug mt-0.5 sm:mt-1">
              {state.rightLine2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
