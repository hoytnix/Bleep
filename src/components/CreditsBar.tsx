import React from 'react';
import { SpinState } from '../game/math';

interface CreditsBarProps {
  balanceCredits: number;
  winCredits: number;
  betCredits: number;
  isSpinning: boolean;
  spinState?: SpinState;
  currencySymbol?: string;
  isMobile: boolean;
  isAutoplayRunning?: boolean;
  autoplaySpinsRemaining?: number;
  onSpin: () => void;
  onStopAutoplay?: () => void;
  onRefill?: () => void;
}

export const CreditsBar: React.FC<CreditsBarProps> = ({
  balanceCredits,
  winCredits,
  betCredits,
  isSpinning,
  spinState = 'IDLE',
  currencySymbol = '$',
  isMobile,
  isAutoplayRunning = false,
  autoplaySpinsRemaining = 0,
  onSpin,
  onStopAutoplay,
  onRefill,
}) => {
  const isLockedByState = spinState !== 'IDLE';
  const isSpinDisabled = !isAutoplayRunning && (isSpinning || isLockedByState || balanceCredits < betCredits);

  const handleButtonClick = () => {
    if (isAutoplayRunning && onStopAutoplay) {
      onStopAutoplay();
    } else {
      if (isSpinDisabled) return;
      onSpin();
    }
  };

  return (
    <div className="w-full max-w-5xl h-full flex items-center justify-between px-2.5 sm:px-6 relative select-none">
      {/* Credit Meters (Left & Center) */}
      {isMobile ? (
        /* Mobile Portrait View: Dedicated clearance so spin button NEVER overlaps credits */
        <div className="flex flex-col justify-center gap-1 sm:gap-1.5 flex-1 min-w-0 mr-[96px] sm:mr-[126px]">
          {/* BALANCE */}
          <div className="bg-black/90 rounded-lg border-2 border-[#FFD700] px-2.5 py-1 flex items-center justify-between shadow-inner">
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider font-comic shrink-0">
              BALANCE:
            </span>
            <div className="flex items-center gap-1.5 ml-1 min-w-0">
              <span className="text-xs sm:text-sm font-black text-[#FFD700] font-micr tracking-tight truncate">
                {currencySymbol}{balanceCredits.toLocaleString()}
              </span>
              {balanceCredits < betCredits && onRefill && (
                <button
                  type="button"
                  onClick={onRefill}
                  className="px-1.5 py-0.5 rounded bg-lime-400 hover:bg-lime-300 text-black font-black text-[9px] uppercase tracking-wider font-comic cursor-pointer animate-pulse"
                >
                  +REFILL
                </button>
              )}
            </div>
          </div>

          {/* WIN */}
          <div className="bg-black/90 rounded-lg border-2 border-[#FFD700] px-2.5 py-1 flex items-center justify-between shadow-inner">
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider font-comic shrink-0">
              WIN:
            </span>
            <span
              className={`text-xs sm:text-sm font-black font-micr tracking-tight ml-1 truncate ${
                winCredits > 0 ? 'text-[#39FF14] animate-pulse' : 'text-[#FFD700]'
              }`}
            >
              {currencySymbol}{winCredits.toLocaleString()}
            </span>
          </div>

          {/* BET */}
          <div className="bg-black/90 rounded-lg border-2 border-[#FFD700] px-2.5 py-1 flex items-center justify-between shadow-inner">
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider font-comic shrink-0">
              BET:
            </span>
            <span className="text-xs sm:text-sm font-black text-[#FFD700] font-micr tracking-tight ml-1 truncate">
              {currencySymbol}{betCredits.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        /* Desktop/Tablet View: Horizontal Pills with guaranteed clearance from Spin Button */
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap mr-[120px] md:mr-[150px] lg:mr-[165px]">
          {/* BALANCE Pill */}
          <div className="bg-black rounded-xl border-2 sm:border-3 border-[#FFD700] px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-comic">
              BALANCE:
            </span>
            <span className="text-sm sm:text-lg md:text-xl font-black text-[#FFD700] font-micr tracking-tight">
              {currencySymbol}{balanceCredits.toLocaleString()}
            </span>
            {balanceCredits < betCredits && onRefill && (
              <button
                type="button"
                onClick={onRefill}
                className="px-2 py-0.5 rounded bg-lime-400 hover:bg-lime-300 text-black font-black text-xs uppercase tracking-wider font-comic cursor-pointer animate-pulse shadow-sm"
                title="Refill"
              >
                +REFILL
              </button>
            )}
          </div>

          {/* WIN Pill */}
          <div className="bg-black rounded-xl border-2 sm:border-3 border-[#FFD700] px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-comic">
              WIN:
            </span>
            <span
              className={`text-sm sm:text-lg md:text-xl font-black font-micr tracking-tight ${
                winCredits > 0 ? 'text-[#39FF14] animate-pulse' : 'text-[#FFD700]'
              }`}
            >
              {currencySymbol}{winCredits.toLocaleString()}
            </span>
          </div>

          {/* BET Pill */}
          <div className="bg-black rounded-xl border-2 sm:border-3 border-[#FFD700] px-3 sm:px-5 md:px-6 py-1.5 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-comic">
              BET:
            </span>
            <span className="text-sm sm:text-lg md:text-xl font-black text-[#FFD700] font-micr tracking-tight">
              {currencySymbol}{betCredits.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* 
        Tactile Arcade Spin Button / Autoplay Stop Button
        Vertically centered inside CreditsBar, ensuring complete clearance from Settings buttons above.
      */}
      <button
        type="button"
        disabled={isSpinDisabled}
        onClick={handleButtonClick}
        className={`absolute right-2 sm:right-5 md:right-8 top-1/2 -translate-y-1/2 z-30 w-[86px] h-[86px] sm:w-[110px] sm:h-[110px] md:w-[130px] md:h-[130px] lg:w-[140px] lg:h-[140px] aspect-square rounded-full border-4 sm:border-6 flex items-center justify-center transition-all ${
          isAutoplayRunning
            ? 'bg-red-600 border-white shadow-[0_0_36px_rgba(239,68,68,0.9)] cursor-pointer hover:scale-105 active:scale-95 animate-pulse'
            : isSpinDisabled
            ? 'bg-white border-[#FFD700] opacity-50 cursor-not-allowed shadow-[0_6px_28px_rgba(255,215,0,0.75)]'
            : 'bg-white border-[#FFD700] cursor-pointer hover:scale-105 hover:shadow-[0_8px_36px_rgba(255,215,0,0.95)] active:scale-95 shadow-[0_6px_28px_rgba(255,215,0,0.75)]'
        }`}
        title={
          isAutoplayRunning
            ? `Autoplay Running (${autoplaySpinsRemaining} spins left) - Click to STOP (Press Space or Escape)`
            : 'Press SPACE, ENTER or Click to Spin'
        }
        aria-label={isAutoplayRunning ? 'Stop Autoplay' : 'Spin slot reels'}
      >
        {isAutoplayRunning ? (
          /* Autoplay Active Stop Graphic */
          <div className="w-[82%] h-[82%] rounded-full border-2 sm:border-3 border-white flex flex-col items-center justify-center bg-black/90 shadow-inner font-comic text-white">
            <div className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-red-500 rounded-sm sm:rounded flex items-center justify-center mb-0.5 sm:mb-1">
              <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-white rounded-xs" />
            </div>
            <span className="text-[9px] sm:text-xs md:text-sm font-black text-red-400 tracking-wider">
              STOP
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm font-black text-white font-micr tracking-tight">
              {autoplaySpinsRemaining}
            </span>
          </div>
        ) : (
          /* Normal Play Graphic */
          <div className="w-[82%] h-[82%] rounded-full border-2 sm:border-3 border-black flex items-center justify-center bg-white shadow-inner">
            {/* Black High-Contrast Play Triangle */}
            <div className="w-0 h-0 border-y-[14px] sm:border-y-[20px] md:border-y-[26px] border-y-transparent border-l-[24px] sm:border-l-[32px] md:border-l-[42px] border-l-black ml-1.5 sm:ml-2.5" />
          </div>
        )}
      </button>
    </div>
  );
};
