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
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400 text-[#FFD700] text-xs font-black uppercase tracking-wider mb-2">
            <Flame className="w-4 h-4 text-yellow-400" />
            Pure Arcade Action
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#FFD700] tracking-tight font-serif">
            HOW TO PLAY & WIN!
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            "Win What You See" • The Simplest, Most Addictive Slot Ever!
          </p>
        </div>

        {/* Feature 1: Win What You See */}
        <div className="bg-[#141414] border-2 border-yellow-500/50 rounded-2xl p-4 mb-3.5 shadow-md">
          <h3 className="text-sm font-black text-yellow-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            1. Win What You See!
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Forget confusing zig-zag paylines or weird paytables! Whatever digits land across the center line from left to right is <strong className="text-yellow-300">literally your prize in cold hard Credits!</strong>
          </p>
          <div className="space-y-2 text-xs">
            <div className="bg-black/70 p-2.5 rounded-xl border border-yellow-500/30 flex items-center justify-between">
              <span className="font-mono font-black text-yellow-400 text-sm tracking-widest">[ 1 ] [ 0 ] [ 5 ]</span>
              <span className="font-black text-[#39FF14] text-sm">➔ 105 Credits!</span>
            </div>
            <div className="bg-black/70 p-2.5 rounded-xl border border-yellow-500/30 flex items-center justify-between">
              <span className="font-mono font-black text-yellow-400 text-sm tracking-widest">[ 5 ] [ 00 ] [ 0 ]</span>
              <span className="font-black text-[#39FF14] text-sm">➔ 5,000 Credits Jackpot!</span>
            </div>
          </div>
        </div>

        {/* Feature 2: Purple Respin Event */}
        <div className="bg-[#180a22] border-2 border-[#BC13FE]/70 rounded-2xl p-4 mb-3.5 shadow-md">
          <h3 className="text-sm font-black text-[#E040FB] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#BC13FE]" />
            2. Electric Purple Star Respin!
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed">
            Hit <strong className="text-[#E040FB] font-black">the Star</strong> on the 4th reel? The entire machine flashes neon purple! Your winning numbers lock tight with an electric glow while the 4th reel spins again for a monster multiplier up to <strong className="text-[#39FF14]">10X</strong>!
          </p>
        </div>

        {/* Feature 3: Dummy Jackpot */}
        <div className="bg-[#0b2413] border-2 border-[#39FF14]/70 rounded-2xl p-4 mb-4 shadow-md">
          <h3 className="text-sm font-black text-[#39FF14] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#39FF14]" />
            3. Dummy Jackpot Wheel!
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed">
            Land the <strong className="text-yellow-400 font-black">Colorful Wheel</strong> on the 4th reel and watch the giant <strong className="text-[#FFD700]">Dummy Jackpot</strong> prize wheel drop into action! Give it a rip, hear the flapper tick, and snatch huge bonus prizes up to <strong className="text-[#39FF14]">5,000 Credits</strong> with confetti explosions!
          </p>
        </div>

        {/* RTP Notice */}
        <div className="bg-black/70 border border-yellow-500/30 rounded-xl p-3 text-center mb-5">
          <p className="text-xs text-slate-300">
            Certified authentic casino mechanical math • <span className="font-black text-yellow-400">~85.0% RTP</span> • 10 Credits Per Spin
          </p>
        </div>

        {/* Spin CTA */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#FFD700] hover:bg-yellow-400 text-black font-black uppercase text-sm cursor-pointer shadow-[0_4px_16px_rgba(255,215,0,0.5)] transition-all active:scale-98"
        >
          Got It, Let's Spin & Win!
        </button>
      </div>
    </div>
  );
};
