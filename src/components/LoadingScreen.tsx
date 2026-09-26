import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Assets } from 'pixi.js';
import { soundEngine } from '../game/AudioEngine';

interface LoadingScreenProps {
  onLoaded: () => void;
}

type LoadingStep = 'FONTS' | 'BACKDROP' | 'CALIBRATING' | 'DONE' | 'ERROR';

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState<number>(10);
  const [step, setStep] = useState<LoadingStep>('FONTS');
  const [statusText, setStatusText] = useState<string>('Loading Magnetic Ink Fonts...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLoadedRef = useRef(false);

  const runBootSequence = useCallback(async () => {
    isLoadedRef.current = false;
    setErrorMessage(null);
    setProgress(15);
    setStep('FONTS');
    setStatusText('Loading Magnetic Ink Fonts...');

    const timeoutTimer = setTimeout(() => {
      if (!isLoadedRef.current) {
        setErrorMessage('Asset initialization timed out. Tap to retry.');
        setStep('ERROR');
      }
    }, 5000);

    try {
      // Step 1: Font Readiness Gate
      if ('fonts' in document) {
        try {
          await Promise.allSettled([
            document.fonts.load('1em GnuMICR'),
            document.fonts.load('1em "MICR E-13B"'),
            document.fonts.load('32px GnuMICR'),
            document.fonts.ready,
          ]);
        } catch {
          // Graceful fallback if specific font loader rejects
        }
      }

      setProgress(45);
      setStep('BACKDROP');
      setStatusText('Loading Cabinet Backdrop...');

      // Step 2: Cabinet Backdrop Preload via Pixi Assets with image fallback
      try {
        const loadPromise = Assets.load('/bg.jpeg').catch(async () => {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = '/bg.jpeg';
          });
        });
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 800));
        await Promise.race([loadPromise, timeoutPromise]);
      } catch {
        // Continue gracefully even if background asset has network delay
      }

      setProgress(80);
      setStep('CALIBRATING');
      setStatusText('Calibrating Stepper Reels...');

      // Step 3: Stepper Calibration & Canvas Warming
      await new Promise((res) => setTimeout(res, 260));

      setProgress(100);
      setStep('DONE');
      setStatusText('Systems Calibrated & Ready');
      isLoadedRef.current = true;
      clearTimeout(timeoutTimer);

      // Transition to next phase
      setTimeout(() => {
        onLoaded();
      }, 200);
    } catch (err: unknown) {
      clearTimeout(timeoutTimer);
      const msg = err instanceof Error ? err.message : 'Failed to initialize engine assets.';
      setErrorMessage(msg);
      setStep('ERROR');
    }
  }, [onLoaded]);

  useEffect(() => {
    runBootSequence();
  }, [runBootSequence]);

  const handleRetry = () => {
    soundEngine.playButtonPress();
    runBootSequence();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A] text-white p-4 select-none overflow-hidden font-sans">
      {/* Subtle Greenback Guilloche Engraving Accents */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 230, 118, 0.15) 0%, transparent 65%),
            repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 230, 118, 0.04) 3px, rgba(0, 230, 118, 0.04) 6px),
            repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0, 230, 118, 0.03) 3px, rgba(0, 230, 118, 0.03) 6px)
          `,
        }}
      />

      {/* Decorative Guilloche Border Lines */}
      <div className="absolute inset-3 sm:inset-6 border border-emerald-500/30 rounded-2xl pointer-events-none" />
      <div className="absolute inset-4 sm:inset-7 border-2 border-emerald-500/15 rounded-xl pointer-events-none" />

      {/* Main Comic Boot Card */}
      <div className="relative w-full max-w-lg bg-[#141414] border-4 border-[#FFD700] rounded-2xl p-6 sm:p-8 shadow-[8px_8px_0px_#000] text-center z-10">
        {/* Top Currency Seal Ribbon */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFD700] text-black font-black text-xs uppercase tracking-wider rounded-md border-2 border-black mb-5 shadow-[2px_2px_0px_#000]">
          <span>★</span>
          <span>STAKE ENGINE RGS · 84.8% RTP</span>
          <span>★</span>
        </div>

        {/* Brand Headline */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#FFD700] uppercase mb-2 drop-shadow-[4px_4px_0px_#000] font-comic"
        >
          $!#?
        </h1>
        <div className="text-sm sm:text-base font-extrabold tracking-widest text-[#00E676] uppercase mb-6 flex items-center justify-center gap-2">
          <span className="w-6 h-[2px] bg-[#00E676]" />
          <span>CASH MACHINE</span>
          <span className="w-6 h-[2px] bg-[#00E676]" />
        </div>

        {/* Stepper Reel Preview Illustration */}
        <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6 bg-black/60 p-3 sm:p-4 rounded-xl border-2 border-neutral-800">
          {[
            { digit: '1', color: 'bg-white text-black' },
            { digit: '0', color: 'bg-white text-black' },
            { digit: '5', color: 'bg-white text-black' },
            { digit: '10X', color: 'bg-[#00E676] text-black font-black' },
          ].map((reel, idx) => (
            <div
              key={idx}
              className={`w-14 h-16 sm:w-16 sm:h-20 ${reel.color} border-3 border-black rounded-lg flex items-center justify-center text-xl sm:text-2xl font-black shadow-[3px_3px_0px_#000] transition-transform duration-300`}
              style={{
                fontFamily: "'MICR E-13B', 'GnuMICR', monospace, sans-serif",
                transform: step === 'CALIBRATING' ? `translateY(${Math.sin((idx + progress) * 2) * 3}px)` : 'none',
              }}
            >
              {reel.digit}
            </div>
          ))}
        </div>

        {/* Progress Bar Container */}
        <div className="relative w-full mb-3">
          <div className="w-full h-7 bg-neutral-900 border-4 border-black rounded-full overflow-hidden p-0.5 shadow-[3px_3px_0px_#000]">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
              style={{
                width: `${progress}%`,
                backgroundColor: '#FFD700',
                backgroundImage: `repeating-linear-gradient(
                  -45deg,
                  #FFD700,
                  #FFD700 8px,
                  #E6C200 8px,
                  #E6C200 16px
                )`,
              }}
            >
              {progress >= 20 && (
                <span className="text-[10px] font-black text-black leading-none bg-white/90 px-1 py-0.5 rounded border border-black/40">
                  {progress}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status Text & Indicator */}
        <div className="min-h-[28px] flex items-center justify-center text-xs sm:text-sm font-bold text-neutral-300 gap-2 mb-4">
          {step !== 'ERROR' && step !== 'DONE' && (
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse" />
          )}
          <span>{statusText}</span>
        </div>

        {/* Error Fallback & Retry Button */}
        {step === 'ERROR' && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <p className="text-red-400 text-xs sm:text-sm font-semibold mb-3">
              {errorMessage || 'Asset loading failed.'}
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-sm uppercase rounded-xl border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#000] transition-transform cursor-pointer"
            >
              ↻ Tap to Retry
            </button>
          </div>
        )}

        {/* Bottom Vintage Engraved Denomination Bar */}
        <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] font-bold text-neutral-400">
          <span>DENOMINATIONS: $1 · $10 · $100 · $1,000</span>
          <span className="text-emerald-400 font-black">PROVABLY FAIR</span>
        </div>
      </div>
    </div>
  );
};
