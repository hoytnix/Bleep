import React from 'react';

interface CreditsBarProps {
  balanceCredits: number;
  winCredits: number;
  betCredits: number;
  isSpinning: boolean;
  isMobile: boolean;
  onSpin: () => void;
  onRefill?: () => void;
}

export const CreditsBar: React.FC<CreditsBarProps> = ({
  balanceCredits,
  winCredits,
  betCredits,
  isSpinning,
  isMobile,
  onSpin,
  onRefill,
}) => {
  const isSpinDisabled = isSpinning || balanceCredits < betCredits;

  return (
    <div className="w-full max-w-5xl h-full flex items-center justify-between px-2.5 sm:px-6 relative select-none">
      {/* Credit Meters (Left & Center) */}
      {isMobile ? (
        /* Mobile Portrait View: Dedicated clearance so spin button NEVER overlaps credits */
        <div className="flex flex-col justify-center gap-1 sm:gap-1.5 flex-1 min-w-0 mr-[96px] sm:mr-[126px]">
          {/* BALANCE */}
          <div className="bg-black/90 rounded-lg border-2 border-[#FFD700] px-2.5 py-1 flex items-center justify-between shadow-inner">
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider font-mono shrink-0">
              BALANCE:
            </span>
            <div className="flex items-center gap-1.5 ml-1 min-w-0">
              <span className="text-xs sm:text-sm font-black text-[#FFD700] font-mono tracking-tight truncate">
                ${balanceCredits.toLocaleString()}
              </span>
              {balanceCredits < betCredits && onRefill && (
                <button
                  type="button"
                  onClick={onRefill}
                  className="px-1.5 py-0.5 rounded bg-lime-400 hover:bg-lime-300 text-black font-black text-[9px] uppercase tracking-wider cursor-pointer animate-pulse"
                >
                  +REFILL
                </button>
              )}
            </div>
          </div>

          {/* WIN */}
          <div className="bg-black/90 rounded-lg border-2 border-[#FFD700] px-2.5 py-1 flex items-center justify-between shadow-inner">
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider font-mono shrink-0">
              WIN:
            </span>
            <span
              className={`text-xs sm:text-sm font-black font-mono tracking-tight ml-1 truncate ${
                winCredits > 0 ? 'text-[#39FF14] animate-pulse' : 'text-[#FFD700]'
              }`}
            >
              ${winCredits.toLocaleString()}
            </span>
          </div>

          {/* BET */}
          <div className="bg-black/90 rounded-lg border-2 border-[#FFD700] px-2.5 py-1 flex items-center justify-between shadow-inner">
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider font-mono shrink-0">
              BET:
            </span>
            <span className="text-xs sm:text-sm font-black text-[#FFD700] font-mono tracking-tight ml-1 truncate">
              ${betCredits.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        /* Desktop/Tablet View: Horizontal Pills with guaranteed clearance from Spin Button */
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap mr-[120px] md:mr-[150px] lg:mr-[165px]">
          {/* BALANCE Pill */}
          <div className="bg-black rounded-xl border-2 sm:border-3 border-[#FFD700] px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono">
              BALANCE:
            </span>
            <span className="text-sm sm:text-lg md:text-xl font-black text-[#FFD700] font-mono tracking-tight">
              ${balanceCredits.toLocaleString()}
            </span>
            {balanceCredits < betCredits && onRefill && (
              <button
                type="button"
                onClick={onRefill}
                className="px-2 py-0.5 rounded bg-lime-400 hover:bg-lime-300 text-black font-black text-xs uppercase tracking-wider cursor-pointer animate-pulse shadow-sm"
                title="Refill +$2,500"
              >
                +REFILL
              </button>
            )}
          </div>

          {/* WIN Pill */}
          <div className="bg-black rounded-xl border-2 sm:border-3 border-[#FFD700] px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono">
              WIN:
            </span>
            <span
              className={`text-sm sm:text-lg md:text-xl font-black font-mono tracking-tight ${
                winCredits > 0 ? 'text-[#39FF14] animate-pulse' : 'text-[#FFD700]'
              }`}
            >
              ${winCredits.toLocaleString()}
            </span>
          </div>

          {/* BET Pill */}
          <div className="bg-black rounded-xl border-2 sm:border-3 border-[#FFD700] px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono">
              BET:
            </span>
            <span className="text-sm sm:text-lg md:text-xl font-black text-[#FFD700] font-mono tracking-tight">
              ${betCredits.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* 
        Tactile Arcade Spin Button
        Vertically centered inside CreditsBar, ensuring complete clearance from Settings buttons above.
      */}
      <button
        type="button"
        disabled={isSpinDisabled}
        onClick={() => onSpin()}
        className={`absolute right-2 sm:right-5 md:right-8 top-1/2 -translate-y-1/2 z-30 w-[86px] h-[86px] sm:w-[110px] sm:h-[110px] md:w-[130px] md:h-[130px] lg:w-[140px] lg:h-[140px] aspect-square rounded-full bg-white border-4 sm:border-6 border-[#FFD700] flex items-center justify-center shadow-[0_6px_28px_rgba(255,215,0,0.75)] transition-all ${
          isSpinDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:scale-105 hover:shadow-[0_8px_36px_rgba(255,215,0,0.95)] active:scale-95'
        }`}
        title="Press SPACE, ENTER or Click to Spin"
        aria-label="Spin slot reels"
      >
        {/* Outer Bevel Frame */}
        <div className="w-[82%] h-[82%] rounded-full border-2 sm:border-3 border-black flex items-center justify-center bg-white shadow-inner">
          {/* Black High-Contrast Play Triangle */}
          <div className="w-0 h-0 border-y-[14px] sm:border-y-[20px] md:border-y-[26px] border-y-transparent border-l-[24px] sm:border-l-[32px] md:border-l-[42px] border-l-black ml-1.5 sm:ml-2.5" />
        </div>
      </button>
    </div>
  );
};
