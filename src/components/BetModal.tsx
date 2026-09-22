import React from 'react';
import { X, Coins, Check } from 'lucide-react';
import { Denomination, BET_CONFIGS } from '../game/math';

interface BetModalProps {
  isOpen: boolean;
  activeBet: Denomination;
  onSelectBet: (bet: Denomination) => void;
  onClose: () => void;
}

export const BetModal: React.FC<BetModalProps> = ({
  isOpen,
  activeBet,
  onSelectBet,
  onClose,
}) => {
  if (!isOpen) return null;

  const denominations: Denomination[] = [1, 10, 100, 1000];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0a0a0a] border-4 border-[#FFD700] rounded-2xl p-5 sm:p-6 shadow-[0_0_35px_rgba(255,215,0,0.35)] text-white"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-yellow-400 border border-yellow-400/30 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFD700]/20 border-2 border-[#FFD700] text-yellow-400 mb-2">
            <Coins className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#FFD700] tracking-tight font-serif">
            SELECT BET LEVEL
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Choose your dollar wager and payout tier per spin
          </p>
        </div>

        {/* Denomination Cards */}
        <div className="grid grid-cols-1 gap-2.5 mb-5">
          {denominations.map((denom) => {
            const config = BET_CONFIGS[denom];
            const isSelected = activeBet === denom;

            const tierDescriptions: Record<Denomination, string> = {
              1: 'Micro Stakes • 0.1x Payout Scale',
              10: 'Standard Stakes • 1.0x Base Payout',
              100: 'High Roller • 10.0x Payout Boost',
              1000: 'VIP Max Bet • 100.0x Mega Payout',
            };

            return (
              <button
                key={denom}
                type="button"
                onClick={() => {
                  onSelectBet(denom);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl border-2 flex items-center justify-between transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#FFD700]/20 border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.25)]'
                    : 'bg-[#141414] border-white/15 hover:border-yellow-500/50 hover:bg-[#1a1a1a]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-10 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm font-mono border ${
                      isSelected
                        ? 'bg-[#FFD700] text-black border-yellow-300'
                        : 'bg-black/60 text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    ${denom >= 1000 ? '1K' : denom}
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block">
                      ${config.bet.toLocaleString()} Wager
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {tierDescriptions[denom]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-yellow-400 font-mono">
                    ${config.bet.toLocaleString()}
                  </span>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center text-black">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center text-[11px] text-slate-400">
          Tip: You can also use keyboard keys <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-yellow-400">1</kbd>–<kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-yellow-400">4</kbd> to quick-switch!
        </div>
      </div>
    </div>
  );
};
