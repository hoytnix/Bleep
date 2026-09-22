import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Flame, CheckCircle } from 'lucide-react';
import { WheelWedge, WHEEL_WEDGES } from '../game/math';
import { soundEngine } from '../game/AudioEngine';

interface WheelBonusOverlayProps {
  isOpen: boolean;
  targetWedge: WheelWedge;
  baseCredits?: number;
  totalCreditsWon?: number;
  coinValue?: number;
  onComplete: (wedge: WheelWedge) => void;
}

export const WheelBonusOverlay: React.FC<WheelBonusOverlayProps> = ({
  isOpen,
  targetWedge,
  baseCredits = 0,
  totalCreditsWon,
  coinValue,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<'IDLE' | 'SPINNING' | 'CELEBRATING'>('IDLE');
  const [autoSpinCountdown, setAutoSpinCountdown] = useState<number>(3);
  const [autoCollectCountdown, setAutoCollectCountdown] = useState<number>(5);

  const animationFrameRef = useRef<number | null>(null);
  const rotationRef = useRef<number>(0);
  const flapperAngleRef = useRef<number>(0);
  const targetRotationRef = useRef<number>(0);

  // Calculate total credits won
  const finalCreditsWon = totalCreditsWon !== undefined ? totalCreditsWon : baseCredits + targetWedge.credits;

  // Draw wheel on canvas
  const drawWheel = useCallback((rotation: number, flapperAngle: number, isWinnerGlow: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 26;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(cx, cy);

    // Outer dark chassis ring with gold trim
    ctx.beginPath();
    ctx.arc(0, 0, radius + 22, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#ffd700';
    ctx.stroke();

    // Outer gold chase rim
    ctx.beginPath();
    ctx.arc(0, 0, radius + 15, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#422006';
    ctx.stroke();

    // Rotating Wheel Disc
    ctx.save();
    ctx.rotate(rotation);

    const numWedges = WHEEL_WEDGES.length;
    const arc = (Math.PI * 2) / numWedges;

    // Draw 20 Wedges
    WHEEL_WEDGES.forEach((wedge, idx) => {
      const startAngle = idx * arc - Math.PI / 2;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = wedge.color;
      ctx.fill();

      // Comic wedge border
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0a0a0a';
      ctx.stroke();

      // Highlight winning wedge when landed
      if (isWinnerGlow && idx === targetWedge.index) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      }

      // Wedge Text (Credits amount scaled by denomination coinValue)
      ctx.save();
      const midAngle = startAngle + arc / 2;
      ctx.rotate(midAngle + Math.PI / 2);

      const textY = -(radius * 0.72);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const displayCredits = Math.round(wedge.credits * (coinValue ?? 1));
      const textStr = displayCredits >= 10000 ? `$${Math.round(displayCredits / 1000)}K` : `$${displayCredits}`;
      const isJackpot = displayCredits >= 1000;
      ctx.font = `bold ${isJackpot ? Math.max(13, Math.floor(radius * 0.095)) : Math.max(15, Math.floor(radius * 0.11))}px "MICR E-13B", "GnuMICR", monospace`;

      // Text outline for comic punch
      ctx.lineWidth = 4;
      ctx.strokeStyle = idx === 19 ? '#ffd700' : '#0a0a0a';
      ctx.strokeText(textStr, 0, textY);

      ctx.fillStyle = idx === 19 ? '#0a0a0a' : '#ffffff';
      ctx.fillText(textStr, 0, textY);

      ctx.restore();

      // Metallic Rim Pegs on outer perimeter
      const pegX = Math.cos(startAngle) * (radius - 2);
      const pegY = Math.sin(startAngle) * (radius - 2);

      ctx.beginPath();
      ctx.arc(pegX, pegY, Math.max(3.5, radius * 0.024), 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0a0a0a';
      ctx.stroke();

      // Metallic peg reflection highlight
      ctx.beginPath();
      ctx.arc(pegX - 1, pegY - 1, Math.max(1.2, radius * 0.008), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    // Center Gold Wheel Hub
    const hubRadius = Math.max(32, radius * 0.24);
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, hubRadius);
    grad.addColorStop(0, '#fffbeb');
    grad.addColorStop(0.4, '#ffd700');
    grad.addColorStop(1, '#b45309');

    ctx.beginPath();
    ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0a0a0a';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, hubRadius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffd700';
    ctx.stroke();

    // Center Text
    ctx.font = `bold ${Math.max(10, Math.floor(hubRadius * 0.32))}px "MICR E-13B", "GnuMICR", monospace`;
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WIN', 0, 0);

    ctx.restore(); // restore disc rotation

    // Top Indicator Flapper (at 12 o'clock, pointing down into the wheel)
    ctx.save();
    const flapperY = -(radius + 8);
    ctx.translate(0, flapperY);
    ctx.rotate(flapperAngle);

    // Flapper needle body pointing down
    const fH = Math.max(26, radius * 0.17);
    const fW = Math.max(18, radius * 0.12);

    ctx.beginPath();
    ctx.moveTo(0, fH);
    ctx.lineTo(-fW / 2, 0);
    ctx.lineTo(fW / 2, 0);
    ctx.closePath();
    ctx.fillStyle = '#ff1744';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0a0a0a';
    ctx.stroke();

    // Flapper center gold shine
    ctx.beginPath();
    ctx.moveTo(0, fH - 3);
    ctx.lineTo(-fW / 4, 3);
    ctx.lineTo(fW / 4, 3);
    ctx.closePath();
    ctx.fillStyle = '#ffd700';
    ctx.fill();

    // Flapper mounting pin
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0a0a0a';
    ctx.stroke();

    ctx.restore(); // restore flapper

    ctx.restore(); // restore center translation
  }, [targetWedge]);

  // Handle Resize and Initial Render
  useEffect(() => {
    if (!isOpen) return;

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = Math.min(window.devicePixelRatio || 2, 3);
      const containerW = container.clientWidth || 360;
      const containerH = container.clientHeight || 360;

      // Fit wheel comfortably into viewport
      const size = Math.min(containerW, containerH, 460);
      canvas.width = Math.floor(size * dpr);
      canvas.height = Math.floor(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      drawWheel(rotationRef.current, flapperAngleRef.current, phase === 'CELEBRATING');
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isOpen, drawWheel, phase]);

  // Celebration Confetti
  const triggerConfettiCelebration = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.45 },
        colors: ['#FFD700', '#39FF14', '#BC13FE', '#FF1744', '#00E5FF'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 70,
          origin: { x: 0.1, y: 0.5 },
          colors: ['#FFD700', '#39FF14', '#FFFFFF'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 70,
          origin: { x: 0.9, y: 0.5 },
          colors: ['#FFD700', '#BC13FE', '#FFFFFF'],
        });
      }, 400);
    } catch {
      // Confetti fallback
    }
  }, []);

  // Spin Launch Function
  const handleStartSpin = useCallback(() => {
    if (phase !== 'IDLE') return;

    soundEngine.playButtonPress();
    setPhase('SPINNING');

    const numWedges = WHEEL_WEDGES.length;
    const arc = (Math.PI * 2) / numWedges;

    // Center angle of the target wedge
    const wedgeCenterAngle = targetWedge.index * arc + arc / 2;

    // Calculate exact target rotation so the target wedge lands squarely under the flapper at top
    const landingAngle = (Math.PI * 2 - (wedgeCenterAngle % (Math.PI * 2))) % (Math.PI * 2);
    const fullTurns = (5 + Math.floor(Math.random() * 2)) * Math.PI * 2;
    const finalRot = fullTurns + landingAngle;
    targetRotationRef.current = finalRot;

    const duration = 4800;
    const startTime = performance.now();
    let lastPegIndex = -1;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1.0);

      // Quintic out friction deceleration curve
      const ease = 1 - Math.pow(1 - t, 5);
      const currentRot = finalRot * ease;
      rotationRef.current = currentRot;

      // Peg detection for ratchet sound and flapper deflection
      const currentWheelAngle = (Math.PI * 2 - (currentRot % (Math.PI * 2))) % (Math.PI * 2);
      const pegIndex = Math.floor(currentWheelAngle / arc);

      if (pegIndex !== lastPegIndex) {
        lastPegIndex = pegIndex;
        const speed = Math.max(0.2, 1 - t * 0.85);
        soundEngine.playFlapperClick(speed);

        // Flapper deflection
        flapperAngleRef.current = -0.32 * Math.max(0.3, 1 - t * 0.65);
      } else {
        // Flapper springs back to zero
        flapperAngleRef.current *= 0.82;
      }

      drawWheel(currentRot, flapperAngleRef.current, false);

      if (t < 1.0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        flapperAngleRef.current = 0;
        rotationRef.current = finalRot;
        drawWheel(finalRot, 0, true);

        setPhase('CELEBRATING');
        triggerConfettiCelebration();
        soundEngine.playJackpotFanfare();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [phase, targetWedge, drawWheel, triggerConfettiCelebration]);

  // Handle auto-spin timer
  useEffect(() => {
    if (!isOpen || phase !== 'IDLE') return;

    const timer = setInterval(() => {
      setAutoSpinCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleStartSpin();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, phase, handleStartSpin]);

  // Handle auto-collect timer
  useEffect(() => {
    if (!isOpen || phase !== 'CELEBRATING') return;

    const timer = setInterval(() => {
      setAutoCollectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete(targetWedge);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, phase, targetWedge, onComplete]);

  // Keyboard shortcut (Space/Enter to spin or collect)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (phase === 'IDLE') {
          handleStartSpin();
        } else if (phase === 'CELEBRATING') {
          onComplete(targetWedge);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, phase, handleStartSpin, onComplete, targetWedge]);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      id="wheel-bonus-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#040806]/95 backdrop-blur-md select-none overflow-hidden p-3 sm:p-5 animate-fade-in"
    >
      {/* Radial Gold/Purple Casino Spotlight Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(circle at 50% 48%, rgba(255,215,0,0.22) 0%, rgba(188,19,254,0.15) 45%, transparent 75%)',
        }}
      />

      {/* Decorative Casino Border Flashing Bulbs */}
      <div className="absolute top-2 left-6 right-6 h-1 flex justify-between pointer-events-none opacity-60">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-yellow-400 animate-pulse' : 'bg-white'}`}
          />
        ))}
      </div>

      {/* Top Marquee Header */}
      <header className="relative z-10 w-full max-w-xl text-center pt-2 pb-1 font-comic">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-400/20 border-2 border-yellow-400 text-yellow-300 text-xs sm:text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,0,0.4)] mb-1 font-comic">
          <Flame className="w-4 h-4 text-yellow-400 animate-bounce" />
          ★ BONUS ROUND EVENT ★
          <Flame className="w-4 h-4 text-yellow-400 animate-bounce" />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#FFD700] tracking-tight font-comic drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
          DUMMY JACKPOT!
        </h1>

        <p className="text-xs sm:text-sm text-lime-400 font-black tracking-wide font-comic mt-0.5">
          WIN UP TO <span className="font-micr">${Math.round(5000 * (coinValue ?? 1)).toLocaleString()}</span>!
        </p>
      </header>

      {/* Center Giant Wheel Canvas Area */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 w-full max-w-lg flex items-center justify-center min-h-0 my-1 sm:my-2"
      >
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full drop-shadow-[0_12px_35px_rgba(0,0,0,0.95)]"
        />
      </div>

      {/* Bottom Command Area & Status Banner */}
      <footer className="relative z-10 w-full max-w-md pb-2 sm:pb-4 flex flex-col items-center gap-2 font-comic">
        {phase === 'IDLE' && (
          <div className="w-full flex flex-col items-center gap-2 font-comic">
            <button
              id="spin-wheel-btn"
              type="button"
              onClick={handleStartSpin}
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#FFD700] hover:bg-yellow-400 active:scale-98 text-black font-black text-base sm:text-lg uppercase tracking-wider cursor-pointer shadow-[0_0_30px_rgba(255,215,0,0.6)] border-3 border-black transition-all flex items-center justify-center gap-2 font-comic"
            >
              <Sparkles className="w-6 h-6 text-black" />
              SPIN THE WHEEL!
              <Sparkles className="w-6 h-6 text-black" />
            </button>
            <span className="text-[11px] text-slate-300 font-comic">
              Press SPACE or click to spin • Auto-spins in <span className="font-micr">{autoSpinCountdown}</span>s
            </span>
          </div>
        )}

        {phase === 'SPINNING' && (
          <div className="w-full py-3 px-6 rounded-2xl bg-black/80 border-2 border-yellow-500/50 text-center shadow-lg font-comic">
            <p className="text-sm sm:text-base font-black text-yellow-400 tracking-wider animate-pulse flex items-center justify-center gap-2 font-comic">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
              SPINNING WHEEL... GOOD LUCK!
              <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
            </p>
          </div>
        )}

        {phase === 'CELEBRATING' && (
          <div className="w-full bg-[#0a0a0a] border-3 border-[#39FF14] rounded-2xl p-3 sm:p-4 text-center shadow-[0_0_35px_rgba(57,255,20,0.45)] animate-scale-up font-comic">
            <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-xs font-black uppercase tracking-wider mb-1 font-comic">
              <Trophy className="w-4 h-4 text-yellow-400" />
              WHEEL PRIZE AWARDED!
            </div>

            <div className="text-3xl sm:text-4xl font-black text-[#39FF14] font-micr tracking-tight my-0.5">
              +${targetWedge.credits.toLocaleString()}!
            </div>

            {baseCredits > 0 && (
              <p className="text-xs text-slate-300 font-comic mb-2">
                Reel Win: <span className="text-yellow-400 font-bold font-micr">${baseCredits}</span> + Wheel Prize: <span className="text-[#39FF14] font-bold font-micr">${targetWedge.credits}</span> = <strong className="text-white font-micr">${finalCreditsWon} Total!</strong>
              </p>
            )}

            <button
              id="collect-wheel-prize-btn"
              type="button"
              onClick={() => onComplete(targetWedge)}
              className="w-full mt-1.5 py-3 rounded-xl bg-[#39FF14] hover:bg-lime-400 active:scale-98 text-black font-black text-sm uppercase tracking-wider cursor-pointer shadow-[0_4px_16px_rgba(57,255,20,0.5)] border-2 border-black transition-all flex items-center justify-center gap-2 font-comic"
            >
              <CheckCircle className="w-5 h-5 text-black" />
              <span>COLLECT <span className="font-micr">${finalCreditsWon.toLocaleString()}</span>! ({autoCollectCountdown}s)</span>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
