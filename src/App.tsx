import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Denomination, TurboMode, spinRound, SpinResult, WheelWedge, WHEEL_WEDGES, BET_CONFIGS } from './game/math';
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
import { AutoplayDrawer, AutoplayConfig } from './components/AutoplayDrawer';

const formatStop = (s?: string) => (!s || s === 'BLANK' || s === '—' || s === '-' ? '-' : s);

export default function App() {
  // Credits-based meters (Dynamic Bet Credits based on selected denomination)
  const [balanceCredits, setBalanceCredits] = useState<number>(5000);
  const [displayedWinCredits, setDisplayedWinCredits] = useState<number>(210);
  const [betDenom, setBetDenom] = useState<Denomination>(10);
  const betCredits = BET_CONFIGS[betDenom].bet; // 1, 10, 100, or 1,000 Credits

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRespinActive, setIsRespinActive] = useState<boolean>(false);
  const [isRedSpinActive, setIsRedSpinActive] = useState<boolean>(false);
  const [isPaytableOpen, setIsPaytableOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isBetModalOpen, setIsBetModalOpen] = useState<boolean>(false);
  const [isAutoplayOpen, setIsAutoplayOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Autoplay State & Regulatory Session Limits
  const [isAutoplayRunning, setIsAutoplayRunning] = useState<boolean>(false);
  const [autoplaySpinsRemaining, setAutoplaySpinsRemaining] = useState<number>(0);

  const autoplayRunningRef = useRef<boolean>(false);
  const autoplayConfigRef = useRef<AutoplayConfig | null>(null);
  const autoplaySpinsRemainingRef = useRef<number>(0);
  const autoplayStartBalanceRef = useRef<number>(5000);
  const autoplayTimeoutRef = useRef<number | null>(null);

  // Turbo Mode: 'off' (normal), 'turbo' (skips reels 2 & 3 on miss), 'instant' (instantly skips all reels)
  const [turboMode, setTurboMode] = useState<TurboMode>(() => {
    try {
      const saved = localStorage.getItem('wysiwyg_slot_turbo');
      if (saved === 'turbo' || saved === 'instant' || saved === 'off') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'off';
  });

  const handleCycleTurbo = useCallback(() => {
    soundEngine.playButtonPress();
    setTurboMode((prev) => {
      const next: TurboMode = prev === 'off' ? 'turbo' : prev === 'turbo' ? 'instant' : 'off';
      try {
        localStorage.setItem('wysiwyg_slot_turbo', next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

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

  // Dynamic Handbook State (in $)
  const [handbookState, setHandbookState] = useState<HandbookState>({
    mode: 'IDLE',
    leftLine1: 'Win What',
    leftLine2: 'You See:',
    leftValue: '[1 0 5]',
    rightLine1: 'If you see 105,',
    rightLine2: 'you win $105! ($10 Bet)',
  });

  // Refill balance when low
  const handleRefillBalance = useCallback(() => {
    soundEngine.playButtonPress();
    setBalanceCredits((prev) => prev + 2500);
  }, []);

  // Stop Autoplay
  const handleStopAutoplay = useCallback((reason?: string) => {
    if (autoplayTimeoutRef.current !== null) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
    autoplayRunningRef.current = false;
    setIsAutoplayRunning(false);
    setAutoplaySpinsRemaining(0);
    autoplayConfigRef.current = null;

    if (reason) {
      soundEngine.playSolenoidClunk(0);
      setHandbookState({
        mode: 'IDLE',
        leftLine1: 'AUTOPLAY STOPPED',
        leftLine2: reason.length > 20 ? 'Limit Reached' : reason,
        leftValue: '[ AUTO ]',
        rightLine1: 'Autoplay Stopped:',
        rightLine2: reason,
      });
    }
  }, []);

  // Update idle handbook text when bet changes
  const updateIdleHandbook = useCallback((denom: Denomination) => {
    const currentBet = BET_CONFIGS[denom].bet;
    const coinVal = BET_CONFIGS[denom].coinValue;
    const exampleWin = Math.round(105 * coinVal);
    setHandbookState({
      mode: 'IDLE',
      leftLine1: 'Win What',
      leftLine2: 'You See:',
      leftValue: '[1 0 5]',
      rightLine1: 'If you see 105,',
      rightLine2: `you win $${exampleWin.toLocaleString()}! ($${currentBet} Bet)`,
    });
  }, []);

  // Animate Win Ticker Counting Up (in Credits)
  const animateWinTicker = useCallback((targetWin: number, currentTurbo: TurboMode = 'off') => {
    if (targetWin <= 0) {
      setDisplayedWinCredits(0);
      return;
    }

    const duration =
      currentTurbo === 'instant'
        ? 160
        : currentTurbo === 'turbo'
        ? Math.min(750, Math.max(250, targetWin * 3.5))
        : Math.min(1800, Math.max(500, targetWin * 8));
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
    async (
      forceWheel?: boolean,
      forceRedSpin?: boolean,
      forceRespin?: boolean,
      forceNearMissWheel?: boolean
    ) => {
      const isForcedWheel = forceWheel === true;
      const isForcedRedSpin = forceRedSpin === true;
      const isForcedRespin = forceRespin === true;
      const isForcedNearMissWheel = forceNearMissWheel === true;
      if (isSpinning || activeWheelBonus || balanceCredits < betCredits || !engineRef.current) {
        if (balanceCredits < betCredits && autoplayRunningRef.current) {
          handleStopAutoplay('Insufficient balance to spin');
        }
        return;
      }

      soundEngine.playButtonPress();
      setIsSpinning(true);
      setIsRespinActive(false);
      setIsRedSpinActive(false);

      // Deduct bet Credits from balance
      const newDeductedBalance = Math.max(0, balanceCredits - betCredits);
      setBalanceCredits(newDeductedBalance);
      setDisplayedWinCredits(0);

      // Update handbook to spinning (with autoplay count if active)
      if (autoplayRunningRef.current && autoplayConfigRef.current) {
        const total = autoplayConfigRef.current.totalSpins;
        const currentSpinNumber = total - autoplaySpinsRemainingRef.current + 1;
        setHandbookState({
          mode: 'IDLE',
          leftLine1: `AUTO SPIN ${currentSpinNumber}/${total}`,
          leftLine2: 'Good Luck!',
          leftValue: '[ ? ? ? ]',
          rightLine1: 'Win What You See',
          rightLine2: `Bet: $${betCredits.toLocaleString()}`,
        });
      } else {
        setHandbookState({
          mode: 'IDLE',
          leftLine1: 'Spinning...',
          leftLine2: 'Good Luck!',
          leftValue: '[ ? ? ? ]',
          rightLine1: 'Win What You See',
          rightLine2: `Bet: $${betCredits.toLocaleString()}`,
        });
      }

      // Generate outcome from Stake RGS Math Model (or forced triggers for verification)
      let result: SpinResult;
      if (isForcedNearMissWheel) {
        result = spinRound(betDenom, false, false, false, true);
      } else if (isForcedWheel) {
        result = spinRound(betDenom, false, false, true, false);
      } else if (isForcedRedSpin) {
        result = spinRound(betDenom, true, false, false, false);
      } else if (isForcedRespin) {
        result = spinRound(betDenom, false, true, false, false);
      } else {
        result = spinRound(betDenom);
      }

      activeSpinResultRef.current = result;

      // Execute animation in PixiSlotEngine (with active turboMode)
      await engineRef.current.spin(result, turboMode);

      // Final balance after won credits
      const finalRoundBalance = newDeductedBalance + result.creditsWon;

      // Process final round outcome in Credits
      if (result.creditsWon > 0) {
        setBalanceCredits((prev) => prev + result.creditsWon);
        animateWinTicker(result.creditsWon, turboMode);

        if (result.isWheel && result.wheelWedge) {
          setHandbookState({
            mode: 'WHEEL',
            leftLine1: 'WHEEL PRIZE!',
            leftLine2: 'Bonus Complete',
            leftValue: `$${result.wheelWedge.credits}`,
            rightLine1: `Won $${result.creditsWon}!`,
            rightLine2: result.baseCredits > 0 ? `Reel ($${result.baseCredits}) + Wheel!` : 'Huge Bonus Win!',
          });
        } else {
          const displayStops = result.stops.slice(0, 3).map(formatStop).join(' ');
          const isBlankR1 = !result.stops[0] || result.stops[0] === 'BLANK';
          const isBlankR2 = !result.stops[1] || result.stops[1] === 'BLANK';
          const isBlankR3 = !result.stops[2] || result.stops[2] === 'BLANK';
          const isBlankInterrupted = !isBlankR1 && isBlankR2 && !isBlankR3;
          setHandbookState({
            mode: 'WIN',
            leftLine1: 'You Landed:',
            leftLine2: '',
            leftValue: `[ ${displayStops} ]`,
            rightLine1: `Won $${result.creditsWon}!`,
            rightLine2: result.multiplier > 1
              ? `(${result.multiplier}X Boosted!)`
              : isBlankInterrupted
              ? 'Reel 2 Blank Stopped Win'
              : 'Great Win!',
          });
        }
      } else {
        const displayStops = result.stops.slice(0, 3).map(formatStop).join(' ');
        const isBlankR1 = !result.stops[0] || result.stops[0] === 'BLANK';
        setHandbookState({
          mode: 'IDLE',
          leftLine1: 'No Line Win',
          leftLine2: 'Try Again!',
          leftValue: `[ ${displayStops} ]`,
          rightLine1: isBlankR1 ? 'First Reel Blank' : 'No Line Win',
          rightLine2: 'Needs active digit on Reel 1',
        });
      }

      setIsSpinning(false);
      setIsRespinActive(false);
      setIsRedSpinActive(false);
      activeSpinResultRef.current = null;

      // -------------------------------------------------------------
      // Autoplay Regulatory Session Limits & Lifecycle Processing
      // -------------------------------------------------------------
      if (autoplayRunningRef.current && autoplayConfigRef.current) {
        const config = autoplayConfigRef.current;

        // Condition 1: Out of funds for subsequent spin
        if (finalRoundBalance < betCredits) {
          handleStopAutoplay('Insufficient balance for next spin');
          return;
        }

        // Condition 2: Stop on Bonus (Standard Casino Requirement)
        const isBonusTriggered =
          result.isWheel ||
          result.isRespin ||
          result.red_spin_triggered ||
          (result.salvaged_reel !== undefined && result.salvaged_reel !== null);

        if (config.stopOnBonus && isBonusTriggered) {
          const bonusName = result.isWheel
            ? 'Bonus Wheel Feature'
            : result.isRespin
            ? 'Star Respin Feature'
            : 'Red-Spin Savior Feature';
          handleStopAutoplay(`Stopped on ${bonusName}`);
          return;
        }

        // Condition 3: Loss Limit (Standard Casino Requirement)
        if (config.lossLimit !== null && config.lossLimit !== undefined) {
          const netLoss = autoplayStartBalanceRef.current - finalRoundBalance;
          if (netLoss >= config.lossLimit) {
            handleStopAutoplay(`Loss limit of $${config.lossLimit.toLocaleString()} reached`);
            return;
          }
        }

        // Condition 4: Single Win Limit (Optional Regulatory Safeguard)
        if (config.singleWinLimit !== null && config.singleWinLimit !== undefined) {
          if (result.creditsWon >= config.singleWinLimit) {
            handleStopAutoplay(
              `Single win limit of $${config.singleWinLimit.toLocaleString()} reached (Won $${result.creditsWon})`
            );
            return;
          }
        }

        // Condition 5: Decrement remaining spins & check completion
        const remaining = autoplaySpinsRemainingRef.current - 1;
        autoplaySpinsRemainingRef.current = remaining;
        setAutoplaySpinsRemaining(remaining);

        if (remaining <= 0) {
          handleStopAutoplay('Completed all autoplay spins');
          return;
        }

        // Schedule next autoplay round based on spin cadence / win ticker
        const nextDelay =
          turboMode === 'instant'
            ? 200
            : turboMode === 'turbo'
            ? (result.creditsWon > 0 ? 550 : 350)
            : (result.creditsWon > 0 ? 1100 : 700);

        autoplayTimeoutRef.current = window.setTimeout(() => {
          if (autoplayRunningRef.current) {
            handleSpin(false);
          }
        }, nextDelay);
      }
    },
    [
      isSpinning,
      activeWheelBonus,
      balanceCredits,
      betCredits,
      betDenom,
      animateWinTicker,
      turboMode,
      handleStopAutoplay,
    ]
  );

  // Start Autoplay Handler
  const handleStartAutoplay = useCallback(
    (config: AutoplayConfig) => {
      if (balanceCredits < betCredits || isSpinning) return;
      soundEngine.playButtonPress();

      if (autoplayTimeoutRef.current !== null) {
        clearTimeout(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
      }

      autoplayConfigRef.current = config;
      autoplayRunningRef.current = true;
      autoplaySpinsRemainingRef.current = config.totalSpins;
      autoplayStartBalanceRef.current = balanceCredits;

      setIsAutoplayRunning(true);
      setAutoplaySpinsRemaining(config.totalSpins);

      // Trigger first autoplay spin
      setTimeout(() => {
        if (autoplayRunningRef.current) {
          handleSpin(false);
        }
      }, 80);
    },
    [balanceCredits, betCredits, isSpinning, handleSpin]
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
      if (isSpinning || isAutoplayRunning) return;
      soundEngine.playButtonPress();
      setBetDenom(newDenom);
      updateIdleHandbook(newDenom);
    },
    [isSpinning, isAutoplayRunning, updateIdleHandbook]
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
      onNearMissPause: (initialStops) => {
        setHandbookState({
          mode: 'NEAR_MISS',
          leftLine1: 'NEAR MISS!',
          leftLine2: 'Reel 2 Missed...',
          leftValue: `[ ${formatStop(initialStops[0])} - ${formatStop(initialStops[2])} ]`,
          rightLine1: 'Near Miss!',
          rightLine2: 'Reel 2 Missed...',
        });
      },
      onRedSpinAlarm: () => {
        setIsRedSpinActive(true);
        setHandbookState({
          mode: 'RED_SPIN',
          leftLine1: 'RED-SPIN SAVIOR!',
          leftLine2: 'Reel 2 Re-Spinning!',
          leftValue: '⚡ SAVIOR ⚡',
          rightLine1: 'RED-SPIN SAVIOR!',
          rightLine2: 'Reel 2 Re-Spinning!',
        });
      },
      onRedSpinBridged: (stops) => {
        setHandbookState({
          mode: 'RED_SPIN',
          leftLine1: 'GAP BRIDGED!',
          leftLine2: 'Savior Success!',
          leftValue: `[ ${formatStop(stops[0])} ${formatStop(stops[1])} ${formatStop(stops[2])} ]`,
          rightLine1: `Formed ${stops[0]}${stops[1]}${stops[2]}!`,
          rightLine2: 'Resolving Booster...',
        });
      },
      onRedSpinMissed: (stops) => {
        setHandbookState({
          mode: 'RED_SPIN',
          leftLine1: 'SAVIOR MISSED',
          leftLine2: 'Gap Not Bridged',
          leftValue: `[ ${formatStop(stops[0])} - ${formatStop(stops[2])} ]`,
          rightLine1: 'Savior Missed',
          rightLine2: 'Resolving Booster...',
        });
      },
      onRespinStart: (emptyReels, lockedReels) => {
        setIsRespinActive(true);
        const emptyCount = emptyReels.length;
        const lockedCount = lockedReels.length;
        setHandbookState({
          mode: 'RESPIN',
          leftLine1: 'STAR RESPIN!',
          leftLine2: emptyCount > 0 ? `${emptyCount} Empty Reel${emptyCount > 1 ? 's' : ''} Respinning!` : 'All Reels Locked!',
          leftValue: '★ RESPIN ★',
          rightLine1: emptyCount > 0 ? `${lockedCount} Locked • ${emptyCount} Respinning` : 'Multiplier Respin!',
          rightLine2: 'Up to 10X Boost on Reel 4!',
        });
      },
      onRespinEnd: (result) => {
        const displayStops = result.stops.slice(0, 3).map(formatStop).join(' ');
        setHandbookState({
          mode: 'RESPIN',
          leftLine1: 'RESPIN COMPLETE!',
          leftLine2: `${result.multiplier}X Boost!`,
          leftValue: `[ ${displayStops} ]`,
          rightLine1: result.creditsWon > 0 ? `Won $${result.creditsWon}!` : 'Respin Complete',
          rightLine2: result.creditsWon > 0 ? `${result.multiplier}X Multiplied Win!` : 'Try Again!',
        });
      },
      onWheelStart: (wedge) => {
        setHandbookState({
          mode: 'WHEEL',
          leftLine1: 'WHEEL BONUS!',
          leftLine2: 'Big Wheel',
          leftValue: 'PRIZE',
          rightLine1: 'Spinning the Wheel!',
          rightLine2: 'Up to $5,000!',
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
          leftValue: `$${wedge.credits}`,
          rightLine1: `Won $${wedge.credits}!`,
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
      if (autoplayTimeoutRef.current !== null) {
        clearTimeout(autoplayTimeoutRef.current);
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Keyboard Shortcuts (Space/Enter: Spin/Stop, A: Autoplay Drawer/Stop, W: Test Wheel, 1-4: Denominations, M: Mute, P: Paytable, B: Bet)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (activeWheelBonus) return; // Allow overlay to handle its own key actions

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (autoplayRunningRef.current) {
          handleStopAutoplay('Manually stopped by player (Space/Enter)');
        } else {
          handleSpin();
        }
      } else if (e.key === 'Escape') {
        if (autoplayRunningRef.current) {
          e.preventDefault();
          handleStopAutoplay('Manually stopped by player (Escape)');
        }
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (autoplayRunningRef.current) {
          handleStopAutoplay('Manually stopped by player');
        } else {
          setIsAutoplayOpen((prev) => !prev);
        }
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleSpin(true);
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleSpin(false, false, false, true);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleSpin(false, true);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSpin(false, false, true);
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
      } else if (e.key.toLowerCase() === 't') {
        handleCycleTurbo();
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMute();
      } else if (e.key.toLowerCase() === 'p' || e.key.toLowerCase() === 'h') {
        setIsPaytableOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleSpin,
    handleSelectDenom,
    handleToggleMute,
    handleCycleTurbo,
    handleStopAutoplay,
    activeWheelBonus,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-between font-sans bg-[#04120b] select-none text-white">
      {/* App Background Image & Mood Layer */}
      <CurrencyBackdrop isRespin={isRespinActive} isRedSpin={isRedSpinActive} />

      {/* Main Arcade Frame: 4 sections */}
      <main className="relative z-10 w-full h-screen max-w-6xl mx-auto flex flex-col justify-between overflow-hidden">
        {/* Section 1: Call-out at top (20vh on mobile, 25vh on desktop) */}
        <header className="h-[20vh] sm:h-[22vh] md:h-[25vh] w-full flex items-center justify-center px-2 sm:px-4 py-1 sm:py-1.5 relative z-10">
          <Handbook state={handbookState} isMobile={isMobile} />
        </header>

        {/* Section 2: Reels (44vh on mobile, 37.5vh on desktop - prominent center section) */}
        <section className="h-[44vh] sm:h-[42vh] md:h-[37.5vh] w-full flex items-center justify-center px-1 sm:px-4 py-0.5 sm:py-1 relative z-10">
          <div className="w-full h-full max-w-5xl relative flex items-center justify-center">
            {/* Pixi Canvas Mounting Container */}
            <div
              ref={canvasContainerRef}
              className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden"
            />
          </div>
        </section>

        {/* Section 3: Settings (11vh on mobile, 12.5vh on desktop - with Turbo, Autoplay, Stats, Rules, Sound) */}
        <section className="h-[11vh] sm:h-[12vh] md:h-[12.5vh] w-full flex items-center justify-center px-2 sm:px-4 py-0.5 sm:py-1 relative z-10">
          <SettingsBar
            activeDenom={betDenom}
            isSpinning={isSpinning}
            isMuted={isMuted}
            isMobile={isMobile}
            turboMode={turboMode}
            isAutoplayRunning={isAutoplayRunning}
            autoplaySpinsRemaining={autoplaySpinsRemaining}
            onCycleTurbo={handleCycleTurbo}
            onOpenAutoplay={() => setIsAutoplayOpen(true)}
            onStopAutoplay={() => handleStopAutoplay('Manually stopped by player')}
            onSelectDenom={handleSelectDenom}
            onToggleMute={handleToggleMute}
            onOpenPaytable={() => setIsPaytableOpen(true)}
            onOpenStats={() => setIsStatsOpen(true)}
            onOpenBetModal={() => setIsBetModalOpen(true)}
          />
        </section>

        {/* Section 4: Credits (25vh) with centered Spin / Stop button */}
        <footer className="h-[25vh] sm:h-[24vh] md:h-[25vh] w-full flex items-center justify-center px-2 sm:px-4 py-1 sm:py-1.5 relative z-20">
          <CreditsBar
            balanceCredits={balanceCredits}
            winCredits={displayedWinCredits}
            betCredits={betCredits}
            isSpinning={isSpinning}
            isMobile={isMobile}
            isAutoplayRunning={isAutoplayRunning}
            autoplaySpinsRemaining={autoplaySpinsRemaining}
            onSpin={() => handleSpin(false)}
            onStopAutoplay={() => handleStopAutoplay('Manually stopped by player')}
            onRefill={handleRefillBalance}
          />
        </footer>
      </main>

      {/* Autoplay & Responsible Session Limits Drawer */}
      <AutoplayDrawer
        isOpen={isAutoplayOpen}
        activeDenom={betDenom}
        balanceCredits={balanceCredits}
        onClose={() => setIsAutoplayOpen(false)}
        onStartAutoplay={handleStartAutoplay}
      />

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
        onTestRedSpin={() => handleSpin(false, true)}
        onTestRespin={() => handleSpin(false, false, true)}
        onTestNearMissWheel={() => handleSpin(false, false, false, true)}
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
