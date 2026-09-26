import React, { useState } from 'react';
import { X, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import { runMultiMonteCarlo, runMonteCarlo, Denomination, MultiRunMonteCarloResult } from '../game/math';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestWheel?: () => void;
  onTestRedSpin?: () => void;
  onTestRespin?: () => void;
  onTestNearMissWheel?: () => void;
  onOpenProvablyFair?: () => void;
  currencySymbol?: string;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  onTestWheel,
  onTestRedSpin,
  onTestRespin,
  onTestNearMissWheel,
  onOpenProvablyFair,
  currencySymbol = '$',
}) => {
  const [selectedDenom, setSelectedDenom] = useState<Denomination>(10);
  const [isRunning, setIsRunning] = useState(false);
  const [multiResults, setMultiResults] = useState<MultiRunMonteCarloResult | null>(null);

  if (!isOpen) return null;

  const handleRun3Simulations = (simulationsPerRun = 1_000_000) => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runMultiMonteCarlo(3, simulationsPerRun, selectedDenom);
      setMultiResults(res);
      setIsRunning(false);
    }, 50);
  };

  const handleRunSingleSim = (count = 1_000_000) => {
    setIsRunning(true);
    setTimeout(() => {
      const single = runMonteCarlo(count, selectedDenom);
      setMultiResults({
        runs: [single],
        avgRtp: single.rtp,
        avgHitFrequency: single.hitFrequency,
        totalWagered: single.totalWagered,
        totalWon: single.totalWon,
        totalWinsCount: single.winsCount,
        totalSimulations: single.simulations,
        simulationsPerRun: count,
        runsCount: 1,
      });
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
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0e0e0e] border-4 border-[#39FF14] rounded-2xl p-5 sm:p-7 shadow-[0_0_40px_rgba(57,255,20,0.3)] text-white"
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
        <div className="text-center mb-5 font-comic">
          <span className="text-xs font-black text-yellow-400 uppercase tracking-widest font-comic">
            ENGINE VERIFICATION SUITE
          </span>
          <h2 className="text-2xl font-black text-[#39FF14] tracking-tight font-comic mt-1">
            MONTE CARLO RGS VALIDATION
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-comic">
            Verify calibrated 85.0% RTP & ~22.8% Hit Frequency across 1,000,000 rounds
          </p>
        </div>

        {/* Benchmark Target Comparison */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-center font-comic">
          <div className="bg-black/60 p-3 rounded-xl border border-[#39FF14]/30">
            <span className="text-[10px] text-slate-400 block uppercase font-comic">Target RTP</span>
            <span className="text-xl font-black text-[#39FF14] font-micr">~85.0%</span>
          </div>
          <div className="bg-black/60 p-3 rounded-xl border border-[#39FF14]/30">
            <span className="text-[10px] text-slate-400 block uppercase font-comic">Target Hit Freq</span>
            <span className="text-xl font-black text-[#FFD700] font-micr">~22.8%</span>
          </div>
        </div>

        {/* Denomination Level Selector */}
        <div className="flex items-center justify-between bg-black/50 border border-white/10 rounded-xl p-2 mb-4 font-comic">
          <span className="text-xs font-comic font-bold text-slate-300 ml-1">Test Denomination:</span>
          <div className="flex items-center gap-1.5">
            {([1, 10, 100, 1000] as Denomination[]).map((denom) => (
              <button
                key={denom}
                type="button"
                onClick={() => setSelectedDenom(denom)}
                className={`px-2 py-1 rounded-lg text-xs font-micr font-bold cursor-pointer transition-all ${
                  selectedDenom === denom
                    ? 'bg-[#39FF14] text-black shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                ${denom >= 1000 ? '1K' : denom}
              </button>
            ))}
          </div>
        </div>

        {/* Results Box */}
        {multiResults ? (
          <div className="bg-[#142218] border-2 border-[#39FF14] rounded-xl p-4 mb-5 space-y-3 text-xs font-comic">
            <div className="flex items-center justify-between border-b border-[#39FF14]/30 pb-2">
              <div className="flex items-center gap-1.5 text-[#39FF14] font-bold text-sm font-comic">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {multiResults.runsCount > 1
                    ? `Average of ${multiResults.runsCount} Simulations (${multiResults.simulationsPerRun.toLocaleString()} Rounds Each):`
                    : `Simulated ${multiResults.totalSimulations.toLocaleString()} Rounds:`}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#39FF14]/20 text-[#39FF14] font-bold font-micr">
                ${selectedDenom} Bet
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300 font-comic">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-comic">Total Evaluated:</span>
                <span className="font-bold text-white text-sm font-micr">
                  {multiResults.totalSimulations.toLocaleString()} Rounds
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-comic">Hits / Wins:</span>
                <span className="font-bold text-white text-sm font-micr">
                  {multiResults.totalWinsCount.toLocaleString()} ({multiResults.avgHitFrequency}%)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-comic">Total Wagered:</span>
                <span className="font-bold text-white text-sm font-micr">
                  ${multiResults.totalWagered.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-comic">Total Paid Out:</span>
                <span className="font-bold text-white text-sm font-micr">
                  ${multiResults.totalWon.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#39FF14]/30 flex justify-between items-center bg-black/40 px-3 py-2 rounded-lg font-comic">
              <div>
                <span className="text-xs font-bold text-slate-300 block font-comic">
                  {multiResults.runsCount > 1 ? '3-Run Average RTP:' : 'Observed RTP:'}
                </span>
                <span className="text-[10px] text-slate-400 font-comic">Target Benchmark: ~85.0%</span>
              </div>
              <span className="text-xl font-black text-[#39FF14] font-micr">{multiResults.avgRtp}%</span>
            </div>

            {/* Individual Runs Breakdown (if multiple runs) */}
            {multiResults.runsCount > 1 && (
              <div className="pt-2 border-t border-white/10 font-comic">
                <span className="text-[11px] font-bold text-yellow-400 block mb-2 uppercase tracking-wider font-comic">
                  Individual Simulations (1,000,000 Rounds Each):
                </span>
                <div className="space-y-1.5 font-comic">
                  {multiResults.runs.map((run, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center justify-between bg-black/50 border border-white/10 px-2.5 py-1.5 rounded-lg text-[11px] gap-1"
                    >
                      <span className="font-bold text-slate-200 font-comic">Run #{idx + 1}:</span>
                      <span className="text-slate-400 font-comic">
                        Hits: <b className="text-white font-micr">{run.winsCount.toLocaleString()}</b> ({run.hitFrequency}%)
                      </span>
                      <span className="text-slate-400 font-comic">
                        Paid: <b className="text-white font-micr">${run.totalWon.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b>
                      </span>
                      <span className="font-bold text-[#39FF14] bg-[#39FF14]/15 px-2 py-0.5 rounded border border-[#39FF14]/30 font-micr">
                        {run.rtp}% RTP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center text-xs text-slate-400 mb-5 font-comic">
            Select a bet denomination and run a 1,000,000-round simulation (or 3-run average) to verify payout scaling and calibrated ~85.0% RTP.
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 font-comic">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => handleRunSingleSim(1_000_000)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors font-comic"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            1,000,000 Spins (1 Run)
          </button>

          <button
            type="button"
            disabled={isRunning}
            onClick={() => handleRun3Simulations(1_000_000)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#39FF14] hover:bg-lime-400 text-black font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-[0_3px_10px_rgba(57,255,20,0.4)] font-comic"
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            1,000,000 Spins × 3 (Avg of 3 Runs)
          </button>

          {onTestNearMissWheel && (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => {
                onClose();
                onTestNearMissWheel();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-[0_3px_10px_rgba(16,185,129,0.4)] font-comic"
            >
              🎯 Test Savior + Wheel Combo
            </button>
          )}

          {onTestWheel && (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => {
                onClose();
                onTestWheel();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-[0_3px_10px_rgba(251,191,36,0.3)] font-comic"
            >
              🎡 Test Wheel Bonus
            </button>
          )}

          {onTestRedSpin && (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => {
                onClose();
                onTestRedSpin();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FF0033] hover:bg-red-500 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-[0_3px_10px_rgba(255,0,51,0.4)] font-comic"
            >
              🚨 Test Red-Spin Savior
            </button>
          )}

          {onTestRespin && (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => {
                onClose();
                onTestRespin();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#BC13FE] hover:bg-purple-500 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-[0_3px_10px_rgba(188,19,254,0.4)] font-comic"
            >
              ⚡ Test Star Respin
            </button>
          )}

          {onOpenProvablyFair && (
            <button
              type="button"
              disabled={isRunning}
              onClick={() => {
                onClose();
                onOpenProvablyFair();
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-[0_3px_10px_rgba(6,182,212,0.4)] font-comic"
            >
              🛡️ Provably Fair Verifier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
