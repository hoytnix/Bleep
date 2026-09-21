import React from 'react';
import { Denomination } from '../game/math';
import { Volume2, VolumeX, HelpCircle, BarChart3, Coins } from 'lucide-react';

interface CommandBarProps {
  balanceCredits: number;
  winCredits: number;
  betCredits: number;
  activeDenom: Denomination;
  isSpinning: boolean;
  isMuted: boolean;
  isMobile: boolean;
  onSpin: () => void;
  onToggleMute: () => void;
  onOpenPaytable: () => void;
  onOpenStats: () => void;
  onOpenBetModal: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  balanceCredits,
  winCredits,
  betCredits,
  activeDenom,
  isSpinning,
  isMuted,
  isMobile,
  onSpin,
  onToggleMute,
  onOpenPaytable,
  onOpenStats,
  onOpenBetModal,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 flex flex-col gap-2.5 select-none">
      {/* Top row controls: Bet Denomination Icon + Utility buttons (Rules, Stats, Sound) */}
      <div className="flex items-center justify-between gap-2 px-1">
        {/* Bet Denomination Icon Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSpinning}
            onClick={onOpenBetModal}
            className={`px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-yellow-300 border-2 border-[#FFD700]/50 hover:border-[#FFD700] flex items-center gap-1.5 text-xs font-black shadow-md transition-all cursor-pointer ${
              isSpinning ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
            }`}
            title="Change Bet Denomination ($1, $10, $100, $1,000)"
          >
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-white/80 uppercase tracking-wider text-[11px] hidden sm:inline">Bet Level:</span>
            <span className="font-mono text-yellow-400 text-xs sm:text-sm font-black">${activeDenom}</span>
          </button>
        </div>

        {/* Action utility buttons: Sound, Rules, Stats */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenStats}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-yellow-300/80 border border-yellow-500/30 flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors"
            title="Monte Carlo RGS Math Stats"
          >
            <BarChart3 className="w-4 h-4 text-yellow-400" />
            <span className="hidden md:inline">Stats</span>
          </button>

          <button
            type="button"
            onClick={onOpenPaytable}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-yellow-300/80 border border-yellow-500/30 flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors"
            title="Rules & Paytable"
          >
            <HelpCircle className="w-4 h-4 text-yellow-400" />
            <span className="hidden md:inline">Rules</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="p-2 sm:p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-yellow-300/80 border border-yellow-500/30 cursor-pointer transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-yellow-400" />}
          </button>
        </div>
      </div>

      {/* Main Bottom Meter Console + Spin Button (Credits) */}
      {isMobile ? (
        /* Mobile Thumb-Zone Layout: Stacked/compact meters on left, oversized button on right */
        <div className="flex items-center justify-between gap-3 bg-black/85 p-2.5 rounded-2xl border-2 border-yellow-500/50 shadow-2xl backdrop-blur-md">
          {/* Meters Column in CREDITS */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {/* BALANCE Pill */}
            <div className="bg-black rounded-lg border-2 border-[#FFD700] px-3 py-1 flex items-center justify-between shadow-inner">
              <span className="text-[10px] font-black text-white uppercase tracking-wider font-mono">
                BALANCE:
              </span>
              <span className="text-xs font-black text-yellow-400 font-mono">
                {balanceCredits.toLocaleString()} CR
              </span>
            </div>

            {/* WIN Pill */}
            <div className="bg-black rounded-lg border-2 border-[#FFD700] px-3 py-1 flex items-center justify-between shadow-inner">
              <span className="text-[10px] font-black text-white uppercase tracking-wider font-mono">
                WIN:
              </span>
              <span className={`text-xs font-black font-mono ${winCredits > 0 ? 'text-[#39FF14] animate-pulse' : 'text-yellow-400'}`}>
                {winCredits.toLocaleString()} CR
              </span>
            </div>

            {/* BET Pill */}
            <div className="bg-black rounded-lg border-2 border-[#FFD700] px-3 py-1 flex items-center justify-between shadow-inner">
              <span className="text-[10px] font-black text-white uppercase tracking-wider font-mono">
                BET:
              </span>
              <span className="text-xs font-black text-yellow-400 font-mono">
                {betCredits} CR
              </span>
            </div>
          </div>

          {/* Oversized Circular Spin Button */}
          <button
            type="button"
            disabled={isSpinning || balanceCredits < betCredits}
            onClick={onSpin}
            className={`w-20 h-20 rounded-full bg-white border-4 border-[#FFD700] flex items-center justify-center relative shadow-[0_4px_16px_rgba(255,215,0,0.6)] active:scale-95 transition-transform ${
              isSpinning || balanceCredits < betCredits ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
            }`}
            aria-label="Spin"
          >
            <div className="w-16 h-16 rounded-full border-2 border-black flex items-center justify-center bg-white shadow-inner">
              <div className="w-0 h-0 border-y-[13px] border-y-transparent border-l-[22px] border-l-black ml-1.5" />
            </div>
          </button>
        </div>
      ) : (
        /* Desktop Landscape Command Bar: Horizontal 3 Pills + Spin Button (Credits) */
        <div className="flex items-center justify-center gap-4 py-1">
          {/* BALANCE Pill */}
          <div className="bg-black rounded-xl border-3 border-[#FFD700] px-6 py-2 flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <span className="text-sm font-black text-white uppercase tracking-wider font-mono">
              BALANCE:
            </span>
            <span className="text-lg font-black text-[#FFD700] font-mono tracking-tight">
              {balanceCredits.toLocaleString()} CR
            </span>
          </div>

          {/* WIN Pill */}
          <div className="bg-black rounded-xl border-3 border-[#FFD700] px-6 py-2 flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <span className="text-sm font-black text-white uppercase tracking-wider font-mono">
              WIN:
            </span>
            <span className={`text-lg font-black font-mono tracking-tight ${winCredits > 0 ? 'text-[#39FF14] animate-pulse' : 'text-[#FFD700]'}`}>
              {winCredits.toLocaleString()} CR
            </span>
          </div>

          {/* BET Pill */}
          <div className="bg-black rounded-xl border-3 border-[#FFD700] px-6 py-2 flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <span className="text-sm font-black text-white uppercase tracking-wider font-mono">
              BET:
            </span>
            <span className="text-lg font-black text-[#FFD700] font-mono tracking-tight">
              {betCredits} CR
            </span>
          </div>

          {/* Oversized Circular Spin Button */}
          <button
            type="button"
            disabled={isSpinning || balanceCredits < betCredits}
            onClick={onSpin}
            className={`w-16 h-16 rounded-full bg-white border-4 border-[#FFD700] flex items-center justify-center relative shadow-[0_4px_18px_rgba(255,215,0,0.5)] active:scale-95 transition-all ${
              isSpinning || balanceCredits < betCredits ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 hover:shadow-[0_6px_22px_rgba(255,215,0,0.8)]'
            }`}
            title="Press SPACE or click to Spin"
            aria-label="Spin"
          >
            <div className="w-13 h-13 rounded-full border-2 border-black flex items-center justify-center bg-white shadow-inner">
              <div className="w-0 h-0 border-y-[11px] border-y-transparent border-l-[18px] border-l-black ml-1" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
