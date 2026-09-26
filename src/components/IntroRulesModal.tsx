import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { soundEngine } from '../game/AudioEngine';

interface IntroRulesModalProps {
  isOpen?: boolean;
  onClose: () => void;
  isInitialBoot?: boolean;
}

export const IntroRulesModal: React.FC<IntroRulesModalProps> = ({
  isOpen = true,
  onClose,
  isInitialBoot = false,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cash_machine_hide_intro_rules') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleDontShowAgain = () => {
    soundEngine.playButtonPress();
    setDontShowAgain((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.setItem('cash_machine_hide_intro_rules', 'true');
        } else {
          localStorage.removeItem('cash_machine_hide_intro_rules');
        }
      } catch {
        // LocalStorage access handling
      }
      return next;
    });
  };

  const handleActionClick = async () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem('cash_machine_hide_intro_rules', 'true');
      } else {
        localStorage.removeItem('cash_machine_hide_intro_rules');
      }
    } catch {
      // LocalStorage access handling
    }

    if (isInitialBoot) {
      // Unlock Web Audio context
      try {
        await soundEngine.init();
        soundEngine.playSpinLeverPull();
      } catch {
        // Audio unlock fallback
      }
    } else {
      soundEngine.playButtonPress();
    }

    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto select-none font-sans"
    >
      {/* Comic Handbook Card / Open Instructional Booklet */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#FFFDE7] border-4 border-black rounded-2xl shadow-[10px_10px_0px_#000] overflow-hidden my-auto"
      >
        {/* Handbook Header Band */}
        <div className="bg-[#FFD700] border-b-4 border-black p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-[#FFD700] rounded-xl border-2 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_rgba(0,0,0,0.3)] shrink-0">
              📖
            </div>
            <div>
              <div className="text-[11px] font-black tracking-widest uppercase text-black/70">
                OFFICIAL $!#? PLAYER'S HANDBOOK
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase leading-none drop-shadow-[1px_1px_0px_#fff]"
                style={{ fontFamily: "'MICR E-13B', 'GnuMICR', monospace, sans-serif" }}
              >
                HOW TO PLAY
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-black rounded-lg text-xs font-black uppercase text-black shadow-[2px_2px_0px_#000]">
              <span>STAKE ENGINE</span>
              <span>·</span>
              <span className="text-emerald-700">84.8% RTP</span>
            </div>
            {/* Direct Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-neutral-200 text-black border-2 border-black flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-transform"
              title="Close Handbook (Esc)"
              aria-label="Close Handbook"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Comic Rules Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 text-black">
          {/* Rule 1: Win What You See */}
          <div className="bg-white border-3 border-black rounded-xl p-3.5 shadow-[4px_4px_0px_#000] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black tracking-wide text-black uppercase bg-[#FFD700] px-2 py-0.5 rounded border-2 border-black shadow-[1px_1px_0px_#000]">
                  RULE 1
                </span>
                <span className="text-xs font-bold text-neutral-500">$!#? Payout</span>
              </div>
              <h3 className="text-base font-black text-black mb-1">$!#? (Win What You See!)</h3>
              <p className="text-xs font-medium text-neutral-700 leading-relaxed mb-3">
                Numbers concatenate left-to-right into your exact credit win. No paylines!
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-neutral-100 p-2 rounded-lg border-2 border-black/20">
              <span className="w-8 h-9 bg-white border-2 border-black rounded font-black flex items-center justify-center text-sm shadow-[1px_1px_0px_#000]">
                1
              </span>
              <span className="w-8 h-9 bg-white border-2 border-black rounded font-black flex items-center justify-center text-sm shadow-[1px_1px_0px_#000]">
                0
              </span>
              <span className="w-8 h-9 bg-white border-2 border-black rounded font-black flex items-center justify-center text-sm shadow-[1px_1px_0px_#000]">
                5
              </span>
              <span className="text-xs font-black text-neutral-400 mx-1">=</span>
              <span className="px-2 py-1 bg-[#00E676] text-black font-black text-xs rounded border border-black shadow-[1px_1px_0px_#000]">
                $105.00
              </span>
            </div>
          </div>

          {/* Rule 2: 10-Credit Stepper Engine */}
          <div className="bg-white border-3 border-black rounded-xl p-3.5 shadow-[4px_4px_0px_#000] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black tracking-wide text-black uppercase bg-[#FFD700] px-2 py-0.5 rounded border-2 border-black shadow-[1px_1px_0px_#000]">
                  RULE 2
                </span>
                <span className="text-xs font-bold text-neutral-500">Fixed Wager</span>
              </div>
              <h3 className="text-base font-black text-black mb-1">10-Credit Stepper</h3>
              <p className="text-xs font-medium text-neutral-700 leading-relaxed mb-3">
                Fixed 10-credit wager per spin. Choose between 4 distinct denominations:
              </p>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                { denom: '$1', val: '10¢/cr' },
                { denom: '$10', val: '$1/cr' },
                { denom: '$100', val: '$10/cr' },
                { denom: '$1K', val: '$100/cr' },
              ].map((d, i) => (
                <div key={i} className="bg-neutral-100 border border-black rounded p-1">
                  <div className="text-xs font-black text-black">{d.denom}</div>
                  <div className="text-[9px] font-semibold text-neutral-500">{d.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rule 3: Booster Reel 4 */}
          <div className="bg-white border-3 border-black rounded-xl p-3.5 shadow-[4px_4px_0px_#000] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black tracking-wide text-black uppercase bg-[#00E676] px-2 py-0.5 rounded border-2 border-black shadow-[1px_1px_0px_#000]">
                  RULE 3
                </span>
                <span className="text-xs font-bold text-neutral-500">Reel 4 Power</span>
              </div>
              <h3 className="text-base font-black text-black mb-1">Booster Reel 4</h3>
              <p className="text-xs font-medium text-neutral-700 leading-relaxed mb-3">
                Powers your payout with multipliers up to 10X, locked Respins, or the Big Wheel!
              </p>
            </div>
            <div className="flex items-center justify-around bg-neutral-100 p-2 rounded-lg border-2 border-black/20">
              <span className="px-2 py-0.5 bg-yellow-300 border border-black rounded text-xs font-black">2X-10X</span>
              <span className="px-2 py-0.5 bg-purple-300 border border-black rounded text-xs font-black">RESPIN</span>
              <span className="px-2 py-0.5 bg-red-400 text-white border border-black rounded text-xs font-black">WHEEL</span>
            </div>
          </div>

          {/* Rule 4: Red-Spin Savior */}
          <div className="bg-white border-3 border-black rounded-xl p-3.5 shadow-[4px_4px_0px_#000] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black tracking-wide text-white uppercase bg-[#FF1744] px-2 py-0.5 rounded border-2 border-black shadow-[1px_1px_0px_#000]">
                  FEATURE
                </span>
                <span className="text-xs font-bold text-neutral-500">Second Chance</span>
              </div>
              <h3 className="text-base font-black text-black mb-1">Red-Spin Savior</h3>
              <p className="text-xs font-medium text-neutral-700 leading-relaxed mb-3">
                A gap on Reel 2 triggers an alarm! Reel 2 re-spins to bridge the winning sequence.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 bg-red-50 p-2 rounded-lg border-2 border-red-200">
              <span className="text-xs font-black text-red-600">🚨 EMERGENCY RESCUE 🚨</span>
            </div>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="bg-neutral-100 border-t-4 border-black p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Custom Comic Checkbox */}
          <label
            onClick={handleToggleDontShowAgain}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div
              className={`w-6 h-6 rounded-lg border-3 border-black flex items-center justify-center transition-colors shadow-[2px_2px_0px_#000] ${
                dontShowAgain ? 'bg-[#00E676]' : 'bg-white'
              }`}
            >
              {dontShowAgain && (
                <svg
                  className="w-4 h-4 text-black stroke-[3.5]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-neutral-800 group-hover:text-black">
              {isInitialBoot ? "Don't show on game launch" : "Don't show on startup"}
            </span>
          </label>

          {/* Action Button: PLAY NOW / BACK TO REELS */}
          <button
            onClick={handleActionClick}
            className="w-full sm:w-auto px-8 sm:px-10 py-3.5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-base uppercase rounded-xl border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#000] transition-transform cursor-pointer tracking-wider"
          >
            {isInitialBoot ? 'PLAY NOW ▶' : 'BACK TO REELS ▶'}
          </button>
        </div>
      </div>
    </div>
  );
};
