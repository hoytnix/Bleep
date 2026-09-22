import React, { useState } from 'react';
import { Play, X, ShieldCheck, AlertCircle, RotateCw, Check } from 'lucide-react';
import { Denomination } from '../game/math';

export interface AutoplayConfig {
  totalSpins: number; // 10, 25, 50, 100
  stopOnBonus: boolean;
  lossLimit: number | null; // e.g. $100
  singleWinLimit: number | null; // e.g. $250
  winLimit: number | null; // profit limit e.g. $500
}

interface AutoplayDrawerProps {
  isOpen: boolean;
  activeDenom: Denomination;
  balanceCredits: number;
  onClose: () => void;
  onStartAutoplay: (config: AutoplayConfig) => void;
}

export const AutoplayDrawer: React.FC<AutoplayDrawerProps> = ({
  isOpen,
  activeDenom,
  balanceCredits,
  onClose,
  onStartAutoplay,
}) => {
  const betAmount = activeDenom; // $ bet per spin
  const [selectedSpins, setSelectedSpins] = useState<number>(25);
  const [stopOnBonus, setStopOnBonus] = useState<boolean>(true);
  const [selectedLossLimit, setSelectedLossLimit] = useState<number | null>(betAmount * 10);
  const [selectedSingleWinLimit, setSelectedSingleWinLimit] = useState<number | null>(null);

  if (!isOpen) return null;

  const spinOptions = [10, 25, 50, 100];
  const lossLimitOptions: { label: string; value: number | null }[] = [
    { label: `$${(betAmount * 5).toLocaleString()}`, value: betAmount * 5 },
    { label: `$${(betAmount * 10).toLocaleString()}`, value: betAmount * 10 },
    { label: `$${(betAmount * 25).toLocaleString()}`, value: betAmount * 25 },
    { label: `$${(betAmount * 50).toLocaleString()}`, value: betAmount * 50 },
    { label: 'NO LIMIT', value: null },
  ];

  const singleWinLimitOptions: { label: string; value: number | null }[] = [
    { label: `$${(betAmount * 10).toLocaleString()}`, value: betAmount * 10 },
    { label: `$${(betAmount * 25).toLocaleString()}`, value: betAmount * 25 },
    { label: `$${(betAmount * 50).toLocaleString()}`, value: betAmount * 50 },
    { label: `$${(betAmount * 100).toLocaleString()}`, value: betAmount * 100 },
    { label: 'NO LIMIT', value: null },
  ];

  const handleStart = () => {
    onStartAutoplay({
      totalSpins: selectedSpins,
      stopOnBonus,
      lossLimit: selectedLossLimit,
      singleWinLimit: selectedSingleWinLimit,
      winLimit: null,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none font-comic"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0a0a0a] border-3 sm:border-4 border-[#FFD700] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(255,215,0,0.35)] flex flex-col gap-3.5 sm:gap-4 max-h-[92vh] overflow-y-auto font-comic"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Regulatory Badge & Close button */}
        <div className="flex items-center justify-between border-b-2 border-yellow-500/40 pb-3">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-yellow-400/10 border-2 border-[#FFD700] flex items-center justify-center text-yellow-400">
              <RotateCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-black text-[#FFD700] tracking-wider uppercase flex items-center gap-1.5 font-comic">
                AUTOPLAY SETTINGS
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400 flex items-center gap-1 font-comic">
                <ShieldCheck className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                <span>Standard Casino Responsible Gaming Limits</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Autoplay Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Number of Rounds */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-comic">
              NUMBER OF SPINS
            </label>
            <span className="text-[11px] text-yellow-400/90 font-bold font-comic">
              Total Bet: <span className="font-micr">${(selectedSpins * betAmount).toLocaleString()}</span>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {spinOptions.map((spins) => {
              const isSelected = selectedSpins === spins;
              return (
                <button
                  key={spins}
                  type="button"
                  onClick={() => setSelectedSpins(spins)}
                  className={`py-2.5 sm:py-3 rounded-xl border-2 sm:border-3 font-black text-sm sm:text-base flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 font-comic ${
                    isSelected
                      ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.5)] font-black'
                      : 'bg-black/60 text-zinc-300 border-zinc-700 hover:border-yellow-500/60 hover:text-white'
                  }`}
                >
                  <span className="font-micr text-base sm:text-lg">{spins}</span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-tight opacity-80 font-comic">
                    Spins
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Stop on Bonus (Mandatory Standard Requirement) */}
        <div className="bg-zinc-950/80 p-3 sm:p-3.5 rounded-xl border border-yellow-500/30 flex items-center justify-between gap-3 font-comic">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-comic">
                STOP ON BONUS FEATURE
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40 font-comic">
                WHEEL / RESPIN
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 font-comic">
              Halts autoplay when Bonus Wheel, Star Respin, or Savior triggers.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStopOnBonus((prev) => !prev)}
            className={`w-13 h-7 sm:w-14 sm:h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 flex items-center ${
              stopOnBonus ? 'bg-lime-500 justify-end' : 'bg-zinc-700 justify-start'
            }`}
            aria-label="Toggle Stop on Bonus"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-md flex items-center justify-center">
              {stopOnBonus && <Check className="w-3.5 h-3.5 text-lime-600 stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* Section 3: Stop if Balance Decreases By (Loss Limit) */}
        <div className="flex flex-col gap-1.5 font-comic">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-comic">
              <span>STOP IF BALANCE DECREASES BY:</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-400/40 font-comic">
                LOSS LIMIT
              </span>
            </label>
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 font-comic">
            Autoplay immediately stops if net session loss exceeds this limit.
          </p>
          <div className="grid grid-cols-5 gap-1.5 font-comic">
            {lossLimitOptions.map((opt, i) => {
              const isSelected = selectedLossLimit === opt.value;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedLossLimit(opt.value)}
                  className={`py-2 px-1 rounded-lg border-2 font-black text-[11px] sm:text-xs flex items-center justify-center text-center cursor-pointer transition-all active:scale-95 font-comic ${
                    isSelected
                      ? 'bg-red-500 text-white border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : 'bg-black/60 text-zinc-300 border-zinc-700 hover:border-red-400/60 hover:text-white'
                  }`}
                >
                  <span className={opt.value ? 'font-micr' : 'font-comic'}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Stop if Single Win Exceeds (Optional Regulatory Safeguard) */}
        <div className="flex flex-col gap-1.5 font-comic">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 font-comic">
              <span>STOP IF SINGLE WIN EXCEEDS:</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-comic">
                BIG WIN
              </span>
            </label>
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 font-comic">
            Pauses autoplay so you can celebrate when a single payout hits this threshold.
          </p>
          <div className="grid grid-cols-5 gap-1.5 font-comic">
            {singleWinLimitOptions.map((opt, i) => {
              const isSelected = selectedSingleWinLimit === opt.value;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedSingleWinLimit(opt.value)}
                  className={`py-2 px-1 rounded-lg border-2 font-black text-[11px] sm:text-xs flex items-center justify-center text-center cursor-pointer transition-all active:scale-95 font-comic ${
                    isSelected
                      ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-black/60 text-zinc-300 border-zinc-700 hover:border-emerald-400/60 hover:text-white'
                  }`}
                >
                  <span className={opt.value ? 'font-micr' : 'font-comic'}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Info Banner */}
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-2.5 flex items-start gap-2 text-yellow-300 text-[10px] sm:text-[11px] font-comic">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-400" />
          <div className="leading-tight font-comic">
            <span>
              Session: <strong className="text-white"><span className="font-micr">{selectedSpins}</span> Spins</strong> at{' '}
              <strong className="text-white font-micr">${betAmount}</strong> / spin.
            </span>{' '}
            <span>
              {stopOnBonus ? 'Stop on Bonus: ON.' : 'Stop on Bonus: OFF.'}{' '}
              {selectedLossLimit !== null
                ? `Loss Limit: -$${selectedLossLimit.toLocaleString()}.`
                : 'No Loss Limit.'}{' '}
              {selectedSingleWinLimit !== null
                ? `Single Win Limit: $${selectedSingleWinLimit.toLocaleString()}.`
                : ''}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1 font-comic">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl sm:rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-2 border-zinc-600 font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer transition-all active:scale-95 font-comic"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleStart}
            disabled={balanceCredits < betAmount}
            className={`flex-2 py-3 rounded-xl sm:rounded-2xl bg-[#FFD700] hover:bg-yellow-300 text-black border-3 border-white font-black text-xs sm:text-sm md:text-base uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,215,0,0.6)] transition-all active:scale-95 font-comic ${
              balanceCredits < betAmount ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
            <span>START (<span className="font-micr">{selectedSpins}</span> SPINS)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
