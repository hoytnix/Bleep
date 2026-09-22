import React from 'react';
import { X, Sparkles, Zap, Award, Flame } from 'lucide-react';

interface PaytableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaytableModal: React.FC<PaytableModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-4 border-[#FFD700] rounded-3xl p-5 sm:p-7 shadow-[0_0_40px_rgba(255,215,0,0.35)] text-white"
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

        {/* Fun Header */}
        <div className="text-center mb-6 font-comic">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400 text-[#FFD700] text-xs font-black uppercase tracking-wider mb-2 font-comic">
            <Flame className="w-4 h-4 text-yellow-400" />
            Pure Arcade Action
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#FFD700] tracking-tight font-comic">
            HOW TO PLAY & WIN!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-comic">
            "Win What You See" • The Simplest, Most Addictive Slot Ever!
          </p>
        </div>

        {/* Feature 1: Win What You See */}
        <div className="bg-[#141414] border-2 border-yellow-500/50 rounded-2xl p-4 mb-3.5 shadow-md font-comic">
          <h3 className="text-sm font-black text-yellow-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-comic">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            1. Win What You See!
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3 font-comic">
            Forget confusing zig-zag paylines or weird paytables! Whatever digits land across the center line from left to right is <strong className="text-yellow-300">literally your prize in cold hard cash ($)!</strong>
          </p>
          <div className="space-y-2 text-xs font-comic">
            <div className="bg-black/70 p-2.5 rounded-xl border border-yellow-500/30 flex items-center justify-between">
              <span className="font-micr font-bold text-yellow-400 text-sm tracking-widest">[ 1 ] [ 0 ] [ 5 ]</span>
              <span className="font-black text-[#39FF14] text-sm font-comic">➔ <span className="font-micr">$105</span>!</span>
            </div>
            <div className="bg-black/70 p-2.5 rounded-xl border border-yellow-500/30 flex items-center justify-between">
              <span className="font-micr font-bold text-yellow-400 text-sm tracking-widest">[ 5 ] [ 00 ] [ 0 ]</span>
              <span className="font-black text-[#39FF14] text-sm font-comic">➔ <span className="font-micr">$5,000</span> Jackpot!</span>
            </div>
            <div className="bg-black/70 p-2.5 rounded-xl border border-amber-500/30 flex items-center justify-between">
              <span className="font-micr font-bold text-yellow-400 text-sm tracking-widest">[ 5 ] [ - ] [ 0 ]</span>
              <span className="font-black text-amber-300 text-sm font-comic">➔ <span className="font-micr">$5</span> (Reel 2 Blank Stops Win!)</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5 leading-normal font-comic">
            ⚡ <strong className="text-yellow-300">Blanks Stop the Chain:</strong> Wins start strictly on Reel 1, and consecutive digits must touch. If a blank reel lands between digits, concatenation stops immediately (e.g., [5][blank][0] awards $5, not $50).
          </p>
        </div>

        {/* Feature 2: Red-Spin Savior Event */}
        <div className="bg-[#240a0f] border-2 border-[#FF0033]/70 rounded-2xl p-4 mb-3.5 shadow-md font-comic">
          <h3 className="text-sm font-black text-[#FF0033] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-comic">
            <Flame className="w-4 h-4 text-[#FF0033]" />
            2. Red-Spin Savior (Near-Miss Rescue!)
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed font-comic">
            Did Reel 2 land a blank star stop between active numbers (like <strong className="text-yellow-300 font-micr">[1] [ - ] [ 5 ]</strong>)? Don't despair! The <strong className="text-[#FF0033] font-black">Red-Spin Savior</strong> alarm can fire with comic red strobes and siren buzzers, re-spinning Reel 2 to snap in a <strong className="text-[#39FF14] font-micr">0</strong> or <strong className="text-[#39FF14] font-micr">5</strong> to bridge the gap into a contiguous mega-win!
          </p>
        </div>

        {/* Feature 3: Purple Respin Event */}
        <div className="bg-[#180a22] border-2 border-[#BC13FE]/70 rounded-2xl p-4 mb-3.5 shadow-md font-comic">
          <h3 className="text-sm font-black text-[#E040FB] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-comic">
            <Zap className="w-4 h-4 text-[#BC13FE]" />
            3. Electric Purple Star Respin!
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed font-comic">
            Hit <strong className="text-[#E040FB] font-black">the Star</strong> on the 4th reel? Any winning numbers lock tight with an electric purple aura, while <strong className="text-yellow-300">any empty reels and the 4th reel re-spin together</strong> to form fresh digits and lock in a monster multiplier up to <strong className="text-[#39FF14]">10X</strong>!
          </p>
        </div>

        {/* Feature 4: Dummy Jackpot */}
        <div className="bg-[#0b2413] border-2 border-[#39FF14]/70 rounded-2xl p-4 mb-3.5 shadow-md font-comic">
          <h3 className="text-sm font-black text-[#39FF14] uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-comic">
            <Award className="w-4 h-4 text-[#39FF14]" />
            4. Dummy Jackpot Wheel!
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed font-comic">
            Land the <strong className="text-yellow-400 font-black">Colorful Wheel</strong> on the 4th reel and watch the giant <strong className="text-[#FFD700]">Dummy Jackpot</strong> prize wheel drop into action! Give it a rip, hear the flapper tick, and snatch huge bonus prizes up to <strong className="text-[#39FF14]"><span className="font-micr">$5,000</span></strong> with confetti explosions!
          </p>
        </div>

        {/* Feature 5: Regulatory Autoplay & Responsible Gaming */}
        <div className="bg-[#0f172a] border-2 border-cyan-500/60 rounded-2xl p-4 mb-4 shadow-md font-comic">
          <h3 className="text-sm font-black text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 font-comic">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            5. Autoplay & Session Limits
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed font-comic">
            Configure automated batch spins (10, 25, 50, 100) with strict casino regulatory safeguards: <strong className="text-yellow-300">Stop on Bonus Feature</strong>, <strong className="text-yellow-300">Decrease Balance Loss Limits</strong>, and <strong className="text-yellow-300">Single Win Limits</strong>. Click STOP or hit <kbd className="px-1 py-0.5 bg-black rounded border border-white/20 text-cyan-300 font-comic font-bold">SPACE</kbd> anytime to halt immediately.
          </p>
        </div>

        {/* RTP Notice */}
        <div className="bg-black/70 border border-yellow-500/30 rounded-xl p-3 text-center mb-5 font-comic">
          <p className="text-xs text-slate-300 font-comic">
            Certified authentic casino mechanical math • <span className="font-black text-yellow-400">~85.0% RTP</span> • Payouts scale dynamically with selected Bet Level (<span className="font-micr">$1</span> – <span className="font-micr">$1,000</span>)
          </p>
        </div>

        {/* Spin CTA */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#FFD700] hover:bg-yellow-400 text-black font-black uppercase text-sm cursor-pointer shadow-[0_4px_16px_rgba(255,215,0,0.5)] transition-all active:scale-98 font-comic"
        >
          Got It, Let's Spin & Win!
        </button>
      </div>
    </div>
  );
};
