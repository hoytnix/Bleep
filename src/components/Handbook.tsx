import React from 'react';

export interface HandbookState {
  mode: 'IDLE' | 'WIN' | 'RESPIN' | 'WHEEL' | 'RED_SPIN' | 'NEAR_MISS';
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

export const Handbook: React.FC<HandbookProps> = ({ state }) => {
  const isRedSpin = state.mode === 'RED_SPIN';
  const isNearMiss = state.mode === 'NEAR_MISS';
  const isRespin = state.mode === 'RESPIN';
  const isWin = state.mode === 'WIN' || state.mode === 'WHEEL';

  return (
    <div className="relative flex items-center justify-center select-none w-full max-w-4xl h-full max-h-[95%]">
      {/* Book Cover Spine Underlay */}
      <div
        className={`absolute inset-0 rounded-2xl border-3 sm:border-4 border-black translate-y-1 transition-colors duration-200 ${
          isRedSpin
            ? 'bg-[#FF0033] shadow-[0_5px_0_#7f1d1d]'
            : isNearMiss
            ? 'bg-[#f59e0b] shadow-[0_5px_0_#78350f]'
            : isRespin
            ? 'bg-[#BC13FE] shadow-[0_5px_0_#581c87]'
            : 'bg-[#FFD700] shadow-[0_5px_0_#000000]'
        }`}
      />

      {/* Book Container with Two Dotted Graph Paper Pages */}
      <div
        className={`relative flex w-full h-full bg-[#FAF8F5] bg-[radial-gradient(#94a3b8_1.25px,transparent_1.25px)] [background-size:13px_13px] rounded-xl border-3 border-black overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.12)] m-1 ${
          isRedSpin ? 'ring-2 ring-[#FF0033]' : isRespin ? 'ring-2 ring-[#BC13FE]' : ''
        }`}
      >
        {/* Left Page (Dotted Graph Paper) */}
        <div className="flex-1 h-full flex flex-col items-center justify-center text-center px-2.5 sm:px-5 py-1 sm:py-2 border-r border-slate-300/80 relative shadow-[inset_-6px_0_8px_rgba(0,0,0,0.04)]">
          {/* Subtle notebook punch hole & header line */}
          <div className="absolute top-1.5 left-2.5 w-1.5 h-1.5 rounded-full bg-slate-300/90 border border-slate-400/40" />
          <div
            className={`absolute top-4 left-2 right-2 border-b ${
              isRedSpin ? 'border-red-400/60' : isRespin ? 'border-purple-400/60' : 'border-rose-300/40'
            } pointer-events-none`}
          />

          {/* Instructional / Status Label (Font Comic) */}
          <div className="flex flex-col items-center justify-center font-comic leading-tight relative z-10">
            <span
              className={`font-black uppercase tracking-wide text-[11px] sm:text-xs md:text-sm ${
                isRedSpin
                  ? 'text-[#FF0033] drop-shadow-[0_1px_0_rgba(0,0,0,0.1)]'
                  : isRespin
                  ? 'text-[#6b0994] drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]'
                  : 'text-zinc-600 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]'
              }`}
            >
              {state.leftLine1}
            </span>
            {state.leftLine2 && (
              <span
                className={`font-black uppercase tracking-wide text-[11px] sm:text-xs md:text-sm mt-0.5 ${
                  isRedSpin ? 'text-[#FF0033]' : isRespin ? 'text-[#8b15be]' : 'text-zinc-700'
                } drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]`}
              >
                {state.leftLine2}
              </span>
            )}
          </div>

          {/* Bracketed Reel Readout (Font MICR strictly for numbers / brackets) */}
          {state.leftValue && (
            <div
              className={`mt-1 px-2.5 sm:px-3.5 py-0.5 sm:py-1 border-2 border-black rounded-lg flex items-center justify-center shadow-xs backdrop-blur-[1px] relative z-10 ${
                isRedSpin
                  ? 'bg-[#FF0033] text-white animate-pulse'
                  : isNearMiss
                  ? 'bg-[#f59e0b]/30 text-black'
                  : isRespin
                  ? 'bg-[#BC13FE] text-white shadow-sm'
                  : 'bg-[#FFD700]/30 text-black'
              }`}
            >
              <span className="font-micr font-bold text-sm sm:text-base md:text-xl tracking-wider text-black">
                {state.leftValue}
              </span>
            </div>
          )}
        </div>

        {/* Center Spine Stitch & Fold Crease */}
        <div className="w-1.5 bg-gradient-to-r from-black/20 via-black/45 to-black/20 shadow-sm relative z-20" />

        {/* Right Page (Dotted Graph Paper) */}
        <div className="flex-1 h-full flex flex-col items-center justify-center text-center px-2.5 sm:px-5 py-1 sm:py-2 relative shadow-[inset_6px_0_8px_rgba(0,0,0,0.04)]">
          {/* Subtle notebook punch hole & header line */}
          <div className="absolute top-1.5 right-2.5 w-1.5 h-1.5 rounded-full bg-slate-300/90 border border-slate-400/40" />
          <div
            className={`absolute top-4 left-2 right-2 border-b ${
              isRedSpin ? 'border-red-400/60' : isRespin ? 'border-purple-400/60' : 'border-rose-300/40'
            } pointer-events-none`}
          />

          {/* Win Figure or Top Prose */}
          {state.rightLine1.startsWith('Won $') ? (
            <span className="font-micr font-bold text-base sm:text-lg md:text-xl text-emerald-600 drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] relative z-10">
              {state.rightLine1}
            </span>
          ) : (
            <span
              className={`font-comic font-extrabold text-xs sm:text-sm md:text-base leading-snug relative z-10 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] ${
                isRedSpin
                  ? 'text-[#FF0033]'
                  : isRespin
                  ? 'text-[#6b0994]'
                  : isWin
                  ? 'text-emerald-700 font-black'
                  : 'text-zinc-800'
              }`}
            >
              {state.rightLine1}
            </span>
          )}

          {/* Secondary Instructional / Outcome Copy (Font Comic) */}
          {state.rightLine2 && (
            <span
              className={`font-comic font-bold text-[11px] sm:text-xs md:text-sm leading-snug mt-0.5 sm:mt-1 relative z-10 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] ${
                isRedSpin ? 'text-[#7f1d1d]' : isRespin ? 'text-[#4a0269]' : 'text-zinc-600'
              }`}
            >
              {state.rightLine2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
