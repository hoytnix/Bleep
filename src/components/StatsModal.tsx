import React, { useState } from 'react';
import { X, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import { runMonteCarlo } from '../game/math';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestWheel?: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, onTestWheel }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    totalWagered: number;
    totalWon: number;
    rtp: number;
    hitFrequency: number;
    winsCount: number;
    simulations: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunSim = (count: number) => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runMonteCarlo(count);
      setResults({ ...res, simulations: count });
      setIsRunning(false);
    }, 50);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#0e0e0e] border-4 border-[#39FF14] rounded-2xl p-5 sm:p-7 shadow-[0_0_40px_rgba(57,255,20,0.3)] text-white"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#39FF14] border border-[#39FF14]/30 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <span className="text-xs font-black text-yellow-400 uppercase tracking-widest font-mono">
            ENGINE VERIFICATION SUITE
          </span>
          <h2 className="text-2xl font-black text-[#39FF14] tracking-tight font-serif mt-1">
            MONTE CARLO RGS VALIDATION
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Verify calibrated 85.0% RTP & ~22.8% Hit Frequency in real-time
          </p>
        </div>

        {/* Benchmark Target Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-center font-mono">
          <div className="bg-black/60 p-3 rounded-xl border border-[#39FF14]/30">
            <span className="text-[10px] text-slate-400 block uppercase">Target RTP</span>
            <span className="text-xl font-black text-[#39FF14]">~85.0%</span>
          </div>
          <div className="bg-black/60 p-3 rounded-xl border border-[#39FF14]/30">
            <span className="text-[10px] text-slate-400 block uppercase">Target Hit Freq</span>
            <span className="text-xl font-black text-[#FFD700]">~22.8%</span>
          </div>
        </div>

        {/* Results Box */}
        {results ? (
          <div className="bg-[#142218] border-2 border-[#39FF14] rounded-xl p-4 mb-5 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#39FF14] font-bold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Simulated {results.simulations.toLocaleString()} Rounds:</span>
            </div>

            <div className="flex justify-between text-slate-300">
              <span>Total Wagered:</span>
              <span className="font-bold text-white">${results.totalWagered.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Total Paid Out:</span>
              <span className="font-bold text-white">${results.totalWon.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Hits / Wins:</span>
              <span className="font-bold text-white">{results.winsCount.toLocaleString()} ({results.hitFrequency}%)</span>
            </div>

            <div className="pt-2 border-t border-[#39FF14]/30 flex justify-between items-center">
              <span className="text-sm font-bold text-[#39FF14]">Observed RTP:</span>
              <span className="text-lg font-black text-[#39FF14]">{results.rtp}%</span>
            </div>
          </div>
        ) : (
          <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center text-xs text-slate-400 mb-5">
            Press a simulation test below to run high-throughput random rounds against the exact stop weights.
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => handleRunSim(10_000)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            10,000 Spins
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={() => handleRunSim(100_000)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#39FF14] hover:bg-lime-400 text-black font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-[0_3px_10px_rgba(57,255,20,0.4)]"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            100,000 Spins (Recommended)
          </button>

          {onTestWheel && (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => {
                onClose();
                onTestWheel();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-[0_3px_10px_rgba(251,191,36,0.3)]"
            >
              🎡 Test Wheel Bonus
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
