import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Denomination, spinRound, SpinResult, WheelWedge, WHEEL_WEDGES, BET_CONFIGS } from './game/math';
import { PixiSlotEngine } from './game/PixiSlotEngine';
import { soundEngine } from './game/AudioEngine';
import { CurrencyBackdrop } from './components/CurrencyBackdrop';
import { Handbook, HandbookState } from './components/Handbook';
import { SettingsBar } from './components/SettingsBar';
import { CreditsBar } from './components/CreditsBar';
import { PaytableModal } from './components/PaytableModal';
import { StatsModal } from './components/StatsModal';
import { BetModal } from './components/BetModal';
import { WheelBonusOverlay } from './components/WheelBonusOverlay';

export default function App() {
  // Credits-based meters (Fixed 10 Credits wagered per spin)
  const [balanceCredits, setBalanceCredits] = useState<number>(1000);
  const [displayedWinCredits, setDisplayedWinCredits] = useState<number>(210);
  const [betDenom, setBetDenom] = useState<Denomination>(10);
  const betCredits = 10; // Fixed 10-credit wager

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRespinActive, setIsRespinActive] = useState<boolean>(false);
  const [isPaytableOpen, setIsPaytableOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isBetModalOpen, setIsBetModalOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Full-screen Wheel Bonus Overlay session
  const [activeWheelBonus, setActiveWheelBonus] = useState<{
    wedge: WheelWedge;
    baseCredits: number;
    totalCreditsWon: number;
    resolve: () => void;
  } | null>(null);
  const activeSpinResultRef = useRef<SpinResult | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PixiSlotEngine | null>(null);

  // Dynamic Handbook State (in Credits)
  const [handbookState, setHandbookState] = useState<HandbookState>({
    mode: 'IDLE',
    leftLine1: 'Win What',
    leftLine2: 'You See:',
    leftValue: '[1 0 5]',
    rightLine1: 'If you see 105,',
    rightLine2: 'you win 105 Credits!',
  });

  // Update idle handbook text when bet changes
  const updateIdleHandbook = useCallback(() => {
    setHandbookState({
      mode: 'IDLE',
      leftLine1: 'Win What',
      leftLine2: 'You See:',
      leftValue: '[1 0 5]',
      rightLine1: 'If you see 105,',
      rightLine2: 'you win 105 Credits!',
    });
  }, []);

  // Animate Win Ticker Counting Up (in Credits)
  const animateWinTicker = useCallback((targetWin: number) => {
    if (targetWin <= 0) {
      setDisplayedWinCredits(0);
      return;
    }

    const duration = Math.min(1800, Math.max(500, targetWin * 8));
    const startTime = performance.now();
    let stepCount = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const current = Math.floor(targetWin * progress);
      setDisplayedWinCredits(current);

      if (Math.floor(progress * 15) > stepCount) {
        stepCount = Math.floor(progress * 15);
        soundEngine.playWinChime(stepCount);
      }

      if (progress < 1.0) {
        requestAnimationFrame(tick);
      } else {
        setDisplayedWinCredits(targetWin);
      }
    };

    requestAnimationFrame(tick);
  }, []);

  // Spin Action Handler
  const handleSpin = useCallback(
    async (forceWheel: boolean = false) => {
      if (isSpinning || activeWheelBonus || balanceCredits < betCredits || !engineRef.current) return;

      soundEngine.playButtonPress();
      setIsSpinning(true);
      setIsRespinActive(false);

      // Deduct 10 Credits from balance
      setBalanceCredits((prev) => Math.max(0, prev - betCredits));
      setDisplayedWinCredits(0);

      // Update handbook to spinning
      setHandbookState({
        mode: 'IDLE',
        leftLine1: 'Spinning...',
        leftLine2: 'Good Luck!',
        leftValue: '[ ? ? ? ]',
        rightLine1: 'Win What You See',
        rightLine2: `Bet: 10 Credits`,
      });

      // Generate outcome from Stake RGS Math Model (or forced Wheel for verification)
      let result: SpinResult;
      if (forceWheel) {
        const wedge = WHEEL_WEDGES[Math.floor(Math.random() * WHEEL_WEDGES.length)];
        const base = 105;
        const totalCredits = base + wedge.credits;
        result = {
          stops: ['1', '0', '5', 'WHEEL'],
          baseCredits: base,
          multiplier: 1,
          creditsWon: totalCredits,
          payout: Number((totalCredits * BET_CONFIGS[betDenom].coinValue).toFixed(2)),
          denomination: betDenom,
          coinValue: BET_CONFIGS[betDenom].coinValue,
          events: [{ type: 'WHEEL_BONUS', details: { wedgeIndex: wedge.index, wedgeCredits: wedge.credits } }],
          isRespin: false,
          isWheel: true,
          wheelWedge: wedge,
        };
      } else {
        result = spinRound(betDenom);
      }

      activeSpinResultRef.current = result;

      // Execute animation in PixiSlotEngine
      await engineRef.current.spin(result);

      // Process final round outcome in Credits
      if (result.creditsWon > 0) {
        setBalanceCredits((prev) => prev + result.creditsWon);
        animateWinTicker(result.creditsWon);

        if (result.isWheel && result.wheelWedge) {
          setHandbookState({
            mode: 'WHEEL',
            leftLine1: 'WHEEL PRIZE!',
            leftLine2: 'Bonus Complete',
            leftValue: `${result.wheelWedge.credits} CR`,
            rightLine1: `Won ${result.creditsWon} Credits!`,
            rightLine2: result.baseCredits > 0 ? `Reel (${result.baseCredits} CR) + Wheel!` : 'Huge Bonus Win!',
          });
        } else {
          const activeDigits = result.stops.slice(0, 3).filter((s) => s !== '').join(' ') || '0';
          setHandbookState({
            mode: 'WIN',
            leftLine1: 'You Landed:',
            leftLine2: '',
            leftValue: `[ ${activeDigits} ]`,
            rightLine1: `Won ${result.creditsWon} Credits!`,
            rightLine2: result.multiplier > 1 ? `(${result.multiplier}X Boosted!)` : 'Great Win!',
          });
        }
      } else {
        setHandbookState({
          mode: 'IDLE',
          leftLine1: 'No Line Win',
          leftLine2: 'Try Again!',
          leftValue: '[ - - - ]',
          rightLine1: 'First Reel Blank',
          rightLine2: 'Needs active digit',
        });
      }

      setIsSpinning(false);
      setIsRespinActive(false);
      activeSpinResultRef.current = null;
    },
    [isSpinning, activeWheelBonus, balanceCredits, betCredits, betDenom, animateWinTicker]
  );

  // Wheel Bonus Completion Handler
  const handleWheelBonusComplete = useCallback(() => {
    if (activeWheelBonus) {
      activeWheelBonus.resolve();
      setActiveWheelBonus(null);
    }
  }, [activeWheelBonus]);

  // Denomination Switcher
  const handleSelectDenom = useCallback(
    (newDenom: Denomination) => {
      if (isSpinning) return;
      soundEngine.playButtonPress();
      setBetDenom(newDenom);
      updateIdleHandbook();
    },
    [isSpinning, updateIdleHandbook]
  );

  // Sound Toggle
  const handleToggleMute = useCallback(() => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  // Initialize Pixi Engine
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const engine = new PixiSlotEngine({
      onRespinStart: () => {
        setIsRespinActive(true);
        setHandbookState({
          mode: 'RESPIN',
          leftLine1: 'STAR RESPIN!',
          leftLine2: 'Reels Locked!',
          leftValue: '★ LOCKED',
          rightLine1: 'Multiplier Respin!',
          rightLine2: 'Up to 10X Boost!',
        });
      },
      onRespinEnd: (multiplier) => {
        setHandbookState({
          mode: 'RESPIN',
          leftLine1: 'RESPIN BOOST!',
          leftLine2: 'Win Multiplied!',
          leftValue: `${multiplier}X`,
          rightLine1: `Multiplier: ${multiplier}X!`,
          rightLine2: `Huge Win Coming!`,
        });
      },
      onWheelStart: (wedge) => {
        setHandbookState({
          mode: 'WHEEL',
          leftLine1: 'WHEEL BONUS!',
          leftLine2: 'Big Wheel',
          leftValue: 'PRIZE',
          rightLine1: 'Spinning the Wheel!',
          rightLine2: 'Up to 5,000 Credits!',
        });
      },
      onWheelTrigger: (wedge) => {
        return new Promise<void>((resolve) => {
          const currentResult = activeSpinResultRef.current;
          setActiveWheelBonus({
            wedge,
            baseCredits: currentResult?.baseCredits || 0,
            totalCreditsWon: currentResult?.creditsWon || wedge.credits,
            resolve,
          });
        });
      },
      onWheelEnd: (wedge) => {
        setHandbookState({
          mode: 'WHEEL',
          leftLine1: 'WHEEL PRIZE!',
          leftLine2: 'Congratulations!',
          leftValue: `${wedge.credits} CR`,
          rightLine1: `Won ${wedge.credits} Credits!`,
          rightLine2: `Huge Bonus Win!`,
        });
      },
    });

    engineRef.current = engine;
    engine.init(container);

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (container && engineRef.current && container.clientWidth > 0 && container.clientHeight > 0) {
        engineRef.current.resize(container.clientWidth, container.clientHeight);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && engineRef.current) {
          engineRef.current.resize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener('resize', checkMobile);
      resizeObserver.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keyboard Shortcuts (Space/Enter: Spin, W: Test Wheel, 1-4: Denominations, M: Mute, P: Paytable, B: Bet)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (activeWheelBonus) return; // Allow overlay to handle its own key actions

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleSpin();
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleSpin(true);
      } else if (e.key === '1') {
        handleSelectDenom(1);
      } else if (e.key === '2') {
        handleSelectDenom(10);
      } else if (e.key === '3') {
        handleSelectDenom(100);
      } else if (e.key === '4') {
        handleSelectDenom(1000);
      } else if (e.key.toLowerCase() === 'b') {
        setIsBetModalOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMute();
      } else if (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'h') {
        setIsPaytableOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpin, handleSelectDenom, handleToggleMute, activeWheelBonus]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-between font-sans bg-[#04120b] select-none text-white">
      {/* Background Guilloche Engraved Dollar Wallpaper */}
      <CurrencyBackdrop isRespin={isRespinActive} />

      {/* Main Arcade Frame: 4 equal 25% height sections */}
      <main className="relative z-10 w-full h-screen max-w-6xl mx-auto flex flex-col justify-between overflow-hidden">
        {/* Section 1: Call-out at top (25% tall) */}
        <header className="h-[25vh] w-full flex items-center justify-center px-2 sm:px-4 py-1.5 relative z-10">
          <Handbook state={handbookState} isMobile={isMobile} />
        </header>

        {/* Section 2: Reels (37.5% tall - taller reels) */}
        <section className="h-[37.5vh] w-full flex items-center justify-center px-2 sm:px-4 py-1 relative z-10">
          {/* Black Arcade Cabinet Chassis Background (without outer card border) */}
          <div className="w-full h-full max-w-5xl relative bg-[#0a0a0a] rounded-2xl sm:rounded-3xl shadow-[0_8px_25px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center">
            {/* Subtle chassis carbon line */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/60 pointer-events-none" />
            <div className="absolute top-1 left-4 right-4 h-0.5 bg-yellow-400/20 rounded-full pointer-events-none" />

            {/* Pixi Canvas Mounting Container */}
            <div
              ref={canvasContainerRef}
              className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden"
            />
          </div>
        </section>

        {/* Section 3: Settings (12.5% tall - half previous height) */}
        <section className="h-[12.5vh] w-full flex items-center justify-center px-2 sm:px-4 py-1 relative z-10">
          <SettingsBar
            activeDenom={betDenom}
            isSpinning={isSpinning}
            isMuted={isMuted}
            isMobile={isMobile}
            onSelectDenom={handleSelectDenom}
            onToggleMute={handleToggleMute}
            onOpenPaytable={() => setIsPaytableOpen(true)}
            onOpenStats={() => setIsStatsOpen(true)}
            onOpenBetModal={() => setIsBetModalOpen(true)}
          />
        </section>

        {/* Section 4: Credits (25% tall) with centered Spin button */}
        <footer className="h-[25vh] w-full flex items-center justify-center px-2 sm:px-4 py-1.5 relative z-20">
          <CreditsBar
            balanceCredits={balanceCredits}
            winCredits={displayedWinCredits}
            betCredits={betCredits}
            isSpinning={isSpinning}
            isMobile={isMobile}
            onSpin={handleSpin}
          />
        </footer>
      </main>

      {/* Bet Denomination Modal */}
      <BetModal
        isOpen={isBetModalOpen}
        activeBet={betDenom}
        onSelectBet={handleSelectDenom}
        onClose={() => setIsBetModalOpen(false)}
      />

      {/* Paytable & Fun Rules Modal */}
      <PaytableModal isOpen={isPaytableOpen} onClose={() => setIsPaytableOpen(false)} />

      {/* Monte Carlo Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        onTestWheel={() => handleSpin(true)}
      />

      {/* Full-Screen Wheel Bonus Overlay Scene */}
      {activeWheelBonus && (
        <WheelBonusOverlay
          isOpen={true}
          targetWedge={activeWheelBonus.wedge}
          baseCredits={activeWheelBonus.baseCredits}
          totalCreditsWon={activeWheelBonus.totalCreditsWon}
          coinValue={BET_CONFIGS[betDenom].coinValue}
          onComplete={handleWheelBonusComplete}
        />
      )}
    </div>
  );
}
