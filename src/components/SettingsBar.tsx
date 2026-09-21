import React from 'react';
import { Denomination } from '../game/math';
import { Volume2, VolumeX, HelpCircle, BarChart3, Coins } from 'lucide-react';

interface SettingsBarProps {
  activeDenom: Denomination;
  isSpinning: boolean;
  isMuted: boolean;
  isMobile: boolean;
  onSelectDenom?: (denom: Denomination) => void;
  onToggleMute: () => void;
  onOpenPaytable: () => void;
  onOpenStats: () => void;
  onOpenBetModal: () => void;
}

export const SettingsBar: React.FC<SettingsBarProps> = ({
  activeDenom,
  isSpinning,
  isMuted,
  onToggleMute,
  onOpenPaytable,
  onOpenStats,
  onOpenBetModal,
}) => {
  return (
    <div className="w-full max-w-5xl h-full flex items-center justify-between px-2.5 sm:px-6 bg-[#0a0a0a]/90 rounded-2xl shadow-xl backdrop-blur-md relative select-none">
      {/* Left: Denomination Selector Button */}
      <div className="flex items-center">
        <button
          type="button"
          disabled={isSpinning}
          onClick={onOpenBetModal}
          className={`h-10 sm:h-11 md:h-12 px-2.5 sm:px-4 md:px-5 rounded-xl sm:rounded-2xl bg-black/80 hover:bg-black text-yellow-300 border-2 sm:border-3 border-yellow-500/50 hover:border-[#FFD700] flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-black font-mono cursor-pointer transition-all shadow-md active:scale-95 hover:shadow-[0_0_12px_rgba(255,215,0,0.3)] ${
            isSpinning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={`Select Bet Denomination (Current: $${activeDenom}.00 - Press B)`}
          aria-label="Select Bet Denomination"
        >
          <Coins className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-yellow-400 shrink-0" />
          <span className="hidden sm:inline font-mono tracking-wider">
            DENOMINATION
          </span>
        </button>
      </div>

      {/* Right: Action Utility Buttons (Stats, Rules, Sound) floating to the right */}
      <div className="ml-auto flex items-center justify-end gap-1.5 sm:gap-2.5 md:gap-3">
        {/* Stats Button */}
        <button
          type="button"
          onClick={onOpenStats}
          className="h-10 sm:h-11 md:h-12 px-2.5 sm:px-4 md:px-5 rounded-xl sm:rounded-2xl bg-black/80 hover:bg-black text-yellow-300 border-2 sm:border-3 border-yellow-500/50 hover:border-[#FFD700] flex items-center gap-1.5 text-xs sm:text-sm md:text-base font-black font-mono cursor-pointer transition-all shadow-md active:scale-95 hover:shadow-[0_0_12px_rgba(255,215,0,0.3)]"
          title="Monte Carlo RGS Math Stats"
        >
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-yellow-400 shrink-0" />
          <span className="font-mono tracking-wider">STATS</span>
        </button>

        {/* Rules & Paytable Button */}
        <button
          type="button"
          onClick={onOpenPaytable}
          className="h-10 sm:h-11 md:h-12 px-2.5 sm:px-4 md:px-5 rounded-xl sm:rounded-2xl bg-black/80 hover:bg-black text-yellow-300 border-2 sm:border-3 border-yellow-500/50 hover:border-[#FFD700] flex items-center gap-1.5 text-xs sm:text-sm md:text-base font-black font-mono cursor-pointer transition-all shadow-md active:scale-95 hover:shadow-[0_0_12px_rgba(255,215,0,0.3)]"
          title="Rules & Paytable (Press P or H)"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-yellow-400 shrink-0" />
          <span className="font-mono tracking-wider">RULES</span>
        </button>

        {/* Sound Toggle Button */}
        <button
          type="button"
          onClick={onToggleMute}
          className="h-10 sm:h-11 md:h-12 px-2.5 sm:px-3.5 md:px-4 rounded-xl sm:rounded-2xl bg-black/80 hover:bg-black text-yellow-300 border-2 sm:border-3 border-yellow-500/50 hover:border-[#FFD700] flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 hover:shadow-[0_0_12px_rgba(255,215,0,0.3)]"
          title={isMuted ? 'Unmute Sound (Press M)' : 'Mute Sound (Press M)'}
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-red-400 shrink-0" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-yellow-400 shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
};
