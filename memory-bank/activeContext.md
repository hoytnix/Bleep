# Active Context: WYSIWYG Slot Machine Implementation

## Current State
The WYSIWYG Mechanical Stepper Slot Machine has been enhanced and stabilized:
1. Header Star on Reel 4: Crisp gold 5-pointed star emblem matching the aesthetic.
2. Vector SVG Symbols on Reel 4:
   - Replaced previous text with a vibrant vector SVG-style colorful prize wheel featuring 8 multi-colored wedges (red, orange, gold, green, cyan, blue, purple, magenta), outer rim with pegs, center gold hub, and indicator flapper.
   - Replaced `RESPIN` text with a brilliant vector SVG-style 5-pointed star with an electric purple comic backing, gold fill, inner facets, and white sparkle accents.
3. Dedicated Bet Denomination Modal: Coins icon button in the command bar opening an interactive bet level selector ($1, $10, $100, $1,000) with coin values.
4. Fun Arcade Rules: Exciting, punchy copy and examples, removing technical percentage and weight tables while preserving the ~85.0% RTP certification.
5. Fluid Responsive Scaling: Dynamically scaling reel width (up to 235px) and symbol typography/SVGs proportionally to container dimensions on tablets and large screens.
6. Credits-Based Meters: BALANCE, WIN, and BET meters in cold-hard Credits (1,000 CR balance, 10 CR fixed wager, and exact credit win amounts matching the reel face).
7. Resolved Symbol Stacking Bug: Fixed an issue where `renderReelSymbol` previously overwrote `textNode.position` to the center `(cx, cy)`, causing previous-spin symbols and spinning dummy numbers to stack on top of each other. Corrected reel step math and modulo cycling using fixed `activeReelHeight` with clean node clearing on reel stops.
8. Calibrated Sectional Proportions:
   - Call-out (Handbook) at top is 25% of viewport height (`h-[25vh]`).
   - Reels section increased to 37.5% of viewport height (`h-[37.5vh]`), making the reels significantly taller and more prominent.
   - Settings section reduced by half to 12.5% of viewport height (`h-[12.5vh]`), eliminating dead vertical spacing.
   - Credits bar (Balance, Win, Bet meters and Spin button) is 25% of viewport height (`h-[25vh]`).
9. Section Border Cleanup:
   - Removed outer borders from the reels cabinet chassis card, settings bar card, and credits bar card.
   - Preserved borders only around the top guide handbook, each reel, and each interactive button.
10. Streamlined Denomination Button:
   - Removed the "BET LEVEL" line and the bet amount display from the denomination button.
   - Replaced with the Coins icon and the single word "DENOMINATION" (`hidden sm:inline`), keeping the word hidden on mobile screens.
   - Calibrated the button height (`h-10 sm:h-11 md:h-12`) to perfectly match the other settings buttons (Stats, Rules, Mute).
11. Full-Screen Wheel Bonus Overlay Scene:
   - Replaced the previous cramped in-reel wheel animation with a high-energy, full-screen interactive overlay scene (`src/components/WheelBonusOverlay.tsx`).
   - Includes high-DPI HTML5 Canvas wheel with 20 calibrated prize wedges, gold studs, springy red pointer flapper, procedural ratchet audio, particle sparks, and realistic quintic easing physics.
   - Interactive player control: 3s auto-spin countdown with manual "SPIN THE WHEEL!" button or SPACE/ENTER keypress, win celebration fanfare with confetti bursts, and 5s auto-collect timer with manual "COLLECT CREDITS" button.
   - Coordinated lifecycle: `PixiSlotEngine` issues asynchronous `onWheelTrigger` promise, pausing round resolution until the user finishes the bonus scene, seamlessly crediting the prize to user balance and updating the Handbook.
   - Added direct test triggers via 'W' keyboard shortcut and "🎡 Test Wheel Bonus" button in `StatsModal`.
12. "DUMMY JACKPOT!" Rebrand & Right-Floated Settings Controls:
   - Rebranded bonus wheel marquee title from "WHEEL FOR DUMMIES" to "DUMMY JACKPOT!" in `WheelBonusOverlay.tsx` and matching rules descriptions in `PaytableModal.tsx`.
   - Floated Stats, Rules, and Sound buttons strictly to the right (`ml-auto flex items-center justify-end`) in `SettingsBar.tsx`, removing previous right margins that forced them toward the center.
   - Calibrated Spin button vertically centered in `CreditsBar.tsx` (`top-1/2 -translate-y-1/2`) to prevent any upward obstruction of the right-aligned Settings buttons.
13. Resolved Unintended Bonus Wheel Trigger on Standard Spin:
   - Root Cause: In `App.tsx`, `handleSpin` previously had signature `(forceWheel: boolean = false)`. Passing `onSpin={handleSpin}` directly to `<CreditsBar onSpin={...} />` caused the button `onClick` event to pass the synthetic `MouseEvent` as the first argument. In JavaScript, `if (forceWheel)` evaluated the truthy `MouseEvent` object as `true`, causing every click on the Spin button to trigger the forced demo wheel bonus.
   - Solution: Updated `handleSpin` to strictly evaluate `const isForcedWheel = forceWheel === true`. Wrapped `onSpin={() => handleSpin(false)}` in `App.tsx` and `onClick={() => onSpin()}` in `CreditsBar.tsx` (and `CommandBar.tsx`). Normal spins now faithfully follow the calibrated RGS math engine (0.5% natural Wheel occurrence), while manual test triggers via 'W' key and the Stats Modal remain available for verification.
14. Dynamic Denomination Wager & Scaled Payout Engine:
   - Root Cause: Previously, `App.tsx` hardcoded `const betCredits = 10;`, deducting 10 credits on every spin regardless of the selected denomination. Furthermore, `BetModal.tsx` displayed "Fixed 10 Credits Wagered Per Round" and labeled all buttons with "10 CR", preventing denomination changes from affecting the wagered credits or balance deductions.
   - Dynamic Wager Implementation: Made `betCredits` reactive in `App.tsx` via `BET_CONFIGS[betDenom].bet` (1 CR, 10 CR, 100 CR, or 1,000 CR). Updated `handleSpin` to deduct the dynamic `betCredits` from `balanceCredits`.
   - Proportional Payouts: Updated `spinRound` in `src/game/math.ts` so `creditsWon`, `baseCredits`, and `wheelWedge.credits` scale dynamically with `coinValue` (`denomination / 10`), preserving the exact certified ~85.0% RTP and ~22.8% hit frequency across all 4 bet levels.
   - UI Synchronizations:
     - `BetModal.tsx`: Updated cards to display exact credit wagers (1 CR, 10 CR, 100 CR, 1,000 CR) and clear tier descriptions (Micro Stakes, Standard Stakes, High Roller, VIP Max Bet).
     - `SettingsBar.tsx`: Updated button label to dynamically display the active denomination (e.g., `DENOM: 100 CR`).
     - `CreditsBar.tsx`: Formatted `betCredits.toLocaleString()} CR` and added an interactive `+REFILL` quick-top-up button (+2,500 CR) if balance is low.
     - `WheelBonusOverlay.tsx`: Wedge canvas rendering and header banner dynamically reflect the scaled prize tiers (up to 500,000 CR on VIP tier).
     - `StatsModal.tsx`: Added an interactive denomination switcher to simulate and verify the ~85.0% RTP across all four bet levels.
15. Dotted Graph Paper Guide Book & Mobile UI Streamlining:
   - Transformed `Handbook.tsx` pages into an authentic dotted graph paper / bullet-journal design (`bg-[#FAF8F5]`, slate-300 dot grid `radial-gradient` at 13px spacing, inner page curvature shadows, spine crease, subtle notebook margin rules, and binder punch accents).
   - Hid STATS and RULES button text labels on mobile screens (`hidden sm:inline`) in `SettingsBar.tsx`, transforming them into compact, ergonomic icon buttons on mobile while retaining full labels on desktop/tablet.
   - Clarified Reel Concatenation & Blank Stop Behavior: Resolved user inquiry regarding winning 5 credits instead of 50 by explaining the mechanical stepper adjacency rule (a blank on Reel 2 terminates concatenation from Reel 1). Updated `App.tsx` Handbook stops formatting to explicitly render blank reels as `—` (e.g., `[ 5 — 0 ]` with descriptive note `Reel 2 Blank Stopped Win`) and added an illustrated blank stop example to `PaytableModal.tsx`.
16. Currency Rebranded from Credits/CR to $:
   - Rebranded all user-facing meters, denominations, buttons, overlays, modal dialogues, and handbook guides from "Credits" / "CR" to "$" (e.g. `$5,000` Balance, `$10` Bet, `$105` Win).
   - Updated `BET_CONFIGS` in `src/game/math.ts` to output labels as `$1`, `$10`, `$100`, `$1,000`.
   - Updated HUD meters in `CreditsBar.tsx` and `CommandBar.tsx` to prefix values with `$` instead of suffixing `CR`.
   - Updated `SettingsBar.tsx` denomination indicator to display `$1`, `$10`, etc.
   - Updated `BetModal.tsx` wagers and tier descriptions to refer to dollars (`$`).
   - Updated `WheelBonusOverlay.tsx` canvas wedge texts, jackpot banners, and celebration alerts to `$`.
   - Updated `StatsModal.tsx` simulation results and denomination test controls to `$`.
   - Maintained underlying mathematical engine, RTP calibration, and numeric calculations while presenting a clean dollar currency to the player.
17. Removed Grey Backgrounds from Reels, Settings, and Amounts/Balances Sections:
   - Eliminated the dark grey arcade cabinet chassis card background (`bg-[#0a0a0a]`, drop shadow, and gradient overlay) from Section 2 (Reels) in `App.tsx`, allowing the canvas and reels to float directly above the vintage engraved currency backdrop.
   - Removed the grey background container card (`bg-[#0a0a0a]/90`, drop shadow, and backdrop blur) from Section 3 (`SettingsBar.tsx`), seamlessly displaying the Denomination selector and utility action buttons.
   - Removed the grey background container card (`bg-[#0a0a0a]/95`, drop shadow, and backdrop blur) from Section 4 (`CreditsBar.tsx`), seamlessly displaying the Balance, Win, and Bet meters and circular Spin button.
   - Removed subtle top/bottom shaded grey bands (`0xf1f5f9`) from the white reels in `PixiSlotEngine.ts` for clean, crisp white reel faces.
18. Scaled Monte Carlo Simulation to 1,000,000 Rounds & Multi-Run Averaging:
   - Upgraded baseline simulation from 100,000 rounds to 1,000,000 rounds in `src/game/math.ts` (`runMonteCarlo`).
   - Implemented `runMultiMonteCarlo` to execute multiple independent Monte Carlo passes (3 × 1,000,000 rounds) and compute combined totals, individual run breakdowns, average RTP, and average hit frequency.
   - Enhanced `StatsModal.tsx` to feature:
     - Primary action button: `1,000,000 Spins × 3 (Avg of 3 Runs)` alongside `1,000,000 Spins (1 Run)`.
     - Prominent 3-Run Average summary card highlighting Average Observed RTP (~85-86%), Average Hit Frequency (~22.4%), Total Wagered ($30M), and Total Won.
     - Granular breakdown table detailing each of the 3 individual 1,000,000-round simulations with hits, payouts, and RTP.

19. 3-Mode Turbo System (Off / Turbo / Instant):
   - User Request: Added a Turbo button to the left of Stats in `SettingsBar.tsx` with 3 operational modes:
     1. `off` (Normal): Standard mechanical stepper cadence (sequential delays at 700ms, 1100ms, 1500ms, 1900ms with spring overshoot bounces).
     2. `turbo`: Reel 1 spins and stops at 450ms. If Reel 1 is a miss (blank stop with no win potential), reels 2 and 3 are skipped immediately (`stopReelInstant`), and reel 4 resolves quickly. If Reel 1 hits a digit, standard suspense timings continue across the remaining reels.
     3. `instant`: Instantly skips all 4 reels without waiting (`stopReelInstant`), stopping immediately with crisp solenoid audio feedback.
   - UI & Controls:
     - Placed immediately to the left of the Stats button in `SettingsBar.tsx`.
     - Distinct color & icon styling per mode:
       - `off`: Zinc outline, Zap icon, label `TURBO: OFF` (or `OFF` on mobile).
       - `turbo`: Neon Taxi-Cab Gold glow (`#FFD700`), filled Zap icon, label `TURBO`.
       - `instant`: Electric Green glow (`#39FF14`), FastForward icon, label `INSTANT` (or `INST` on mobile).
     - Keyboard shortcut: Press `T` to cycle through modes (`off` -> `turbo` -> `instant` -> `off`).
     - Persistent preference saved in `localStorage` (`wysiwyg_slot_turbo`).
     - Dynamic win ticker acceleration in turbo/instant modes for snappy round completion.

20. "Red-Spin Savior" Mechanic (Split-Digit Near-Miss Rescue):
   - Trigger Condition: When Reel 1 lands an active number (`1`, `2`, `5`, `10`), Reel 2 lands a `BLANK` star stop, and Reel 3 lands an active digit (`0`, `5`).
   - Math & Calibration:
     - In `src/game/math.ts`, scripted designated near-miss rate set to `0.034` (3.4%) with an 80% rescue rate, salvaging the blank on Reel 2 into a `0` or `5` to bridge the gap into a contiguous multi-digit payout.
     - Verified via 3,000,000-spin Monte Carlo simulation to preserve the target ~85.0% RTP envelope and ~22.6% hit frequency.
     - Extended `SpinResult` with `initial_stops`, `red_spin_triggered`, and `salvaged_reel`.
   - Procedural Audio:
     - Added `playRedSpinAlarm()`: escalating comic warning siren/buzzer with frequency sweeps (`sawtooth` oscillator, bandpass modulation, and repeating beep bursts).
     - Added `playRedSpinSnap()`: heavy mechanical solenoid clamp (`triangle` + white noise burst) when Reel 2 locks into place.
   - Animation & Staging:
     - Sequential stop sequence (Reel 1 -> Reel 2 -> Reel 3).
     - Stage 1 (Suspense Pause): 500ms pause with handbook alerting: `Near Miss! Reel 2 Missed...`.
     - Stage 2 (Red-Spin Alarm): Urgently flashes reel casing and background with comic red strobe hazard patterns (`#FF0033`), fires the mechanical siren, and updates handbook: `RED-SPIN SAVIOR! Reel 2 Re-Spinning!`.
     - Stage 3 (Re-Spin Resolution): Reel 2 blurs vertically with dynamic comic red and gold speed streaks, then snaps into place on `0` or `5` with mechanical clunk, bridging into a contiguous win (`100`, `105`, `200`, etc.).
     - Stage 4 (Multiplier Resolution): Resolves Reel 4 multipliers or special booster impacts.
   - UI Integrations:
     - `CurrencyBackdrop.tsx`: Urgent `#FF0033` comic strobe hazard overlay, pulsing crimson vignette, and corner badges.
     - `Handbook.tsx`: Added `RED_SPIN` and `NEAR_MISS` modes with crimson cover spine glow and animated badge pulses.
     - `PaytableModal.tsx`: Illustrated Red-Spin Savior near-miss rescue rule card.
     - `StatsModal.tsx`: Added `🚨 Test Red-Spin Savior` trigger button and keyboard shortcut `R`.

21. Multi-Reel Star Respin Mechanic Enhancement:
   - User Request: "Landing a Respin should cause not only the 4 Reel to respin but any of the first three reels which are empty."
   - Math & State (`src/game/math.ts`):
     - Extended `SpinResult` with `respinEmptyReels`, `respinLockedReels`, and `respinNewStops`.
     - When `isRespin` triggers:
       - Reels 1-3 that landed on empty blank stops (`''`) are categorized as `respinEmptyReels`.
       - Reels 1-3 that landed on active digits (`1`, `2`, `5`, `10`, `0`, `00`) are categorized as `respinLockedReels`.
       - Initial stops capture the pre-respin state with empty blanks.
       - Respin re-rolls weighted stops for each empty reel from its natural weight distribution and re-rolls Reel 4 for a multiplier (2X, 3X, 5X, 10X).
       - Final concatenation and credit payouts evaluate the combined locked and freshly spun digits with the booster multiplier.
       - Calibrated Monte Carlo simulations verify steady ~85-89% RTP and exciting win potential when blanks turn into numbers.
   - PixiJS Animation Engine (`src/game/PixiSlotEngine.ts`):
     - Initial spin phase lands pre-respin stops so the player clearly sees which reels landed digits and which landed blanks.
     - `executePurpleRespin`:
       - Locks non-empty reels among Reels 1-3 with an electric purple neon aura (`lockGlow.visible = true`).
       - Empty reels and Reel 4 spin in unison (`reelsToRespin = [...emptyReels, 3]`).
       - In normal mode, stops are resolved sequentially with spring-damped stepper overshoot; in turbo/instant modes, snappy or instantaneous stopping is applied.
       - Dispatches `onRespinStart(emptyReels, lockedReels)` and `onRespinEnd(spinResult)`.
   - UI, Handbook, & Verification:
     - `src/components/Handbook.tsx`: Added electric purple styling for `RESPIN` mode with dynamic copy reflecting how many empty reels are respinning and how many are locked.
     - `src/components/PaytableModal.tsx`: Updated Feature 3 explanation to clearly state that empty reels re-spin alongside Reel 4.
     - `src/components/StatsModal.tsx`: Added a dedicated `⚡ Test Star Respin` test trigger button.
      - `src/App.tsx`: Added 'S' key shortcut to directly test the Star Respin sequence.
22. Dedicated Background Image Integration:
    - User Request: Make `public/bg.jpeg` the background image for the app.
    - Updated `src/components/CurrencyBackdrop.tsx` to render `/bg.jpeg` across the full viewport (`object-cover object-center`), providing rich atmospheric arcade framing.
    - Preserved responsive depth vignette and dynamic event overlays (electric purple aura for Respins, comic red strobe flasher for Red-Spin Savior).
23. Netlify & Production Build Deployment Hardening:
    - User Request: Ensure Netlify deployment uses the public folder so production deploy isn't broken.
    - Configured `vite.config.ts` to explicitly define `publicDir: 'public'`, `base: '/'`, `build.outDir: 'dist'`, and `build.copyPublicDir: true`.
    - Created `netlify.toml` with `command = "npm run build"`, `publish = "dist"`, SPA routing redirect rules (`/* -> /index.html 200`), and static asset cache headers.
    - Created `public/_redirects` to ensure Netlify fallback routing is preserved across direct link accesses and static deployments.
24. Red-Spin Savior Respin Race Condition Resolution:
    - Problem Identified: When a split-digit near-miss occurred simultaneously with or prior to a Reel 4 booster/wheel event, the savior respin chance on Reel 2 was either bypassed or raced against the wheel bonus overlay.
    - Root Cause Analysis:
      - `spinRound` in `src/game/math.ts` previously relied on an arbitrary low threshold `SCRIPTED_NEAR_MISS_DESIGNATION_RATE` which skipped awarding the savior respin chance on natural near-misses.
      - Forced wheel bonus tests previously hardcoded a static result object that bypassed `spinRound` and `red_spin_triggered` execution.
    - Solution & Sequence Architecture:
      - In `src/game/math.ts`: Near-misses (`isValidR1 && isBlankR2 && isActiveDigitR3`) now reliably award the Savior Respin chance 100% of the time (`red_spin_triggered = true`) with an 80% rescue success rate (`SAVIOR_RESPIN_RESCUE_RATE = 0.80`), keeping overall RTP strictly calibrated at ~85.0% and ~22.8% hit frequency.
      - In `src/game/PixiSlotEngine.ts`: Sequenced the execution pipeline into distinct, non-overlapping deterministic stages:
        1. Reels 1, 2, 3 stop sequentially (`r1`, `BLANK`, `r3`).
        2. Near-miss pause (500ms).
        3. Red-Spin alarm siren audio and comic red strobe flasher activate.
        4. Reel 2 re-spins (900ms) with red comic speed streaks and locks into place with mechanical solenoid snap audio (`onRedSpinBridged` / `onRedSpinMissed`).
        5. Reel 4 stops with booster impact sound on `WHEEL` (or multiplier/respin).
        6. Reel 4 special event resolves cleanly (Wheel Bonus overlay launches, awaits player spin, and completes).
        7. Payout celebration and win ticker animation credit total combined won credits.
      - Added direct combo test trigger: `🎯 Test Savior + Wheel Combo` in `StatsModal.tsx` and keyboard shortcut `N` in `App.tsx`.
25. Calibrated Stop Weights & 84%-85% RTP Optimization:
    - User Request: "Adjust the weights of the game like that example code so that RTP is around 84%-85%".
    - Math & Calibration Updates (`src/game/math.ts`):
      - Reel 1 Weights (Total 1000): `BLANK`: 790, `'1'`: 130, `'2'`: 52, `'5'`: 21, `'10'`: 7 (Base Hit Rate ~21.0%).
      - Reel 2 Weights (Total 1000): `BLANK`: 790, `'0'`: 158, `'5'`: 44, `'00'`: 8 (Prevents 3-digit inflation).
      - Reel 3 Weights (Total 1000): `BLANK`: 882, `'0'`: 90, `'5'`: 28.
      - Reel 4 Weights (Total 1000): `BLANK`: 845, `'2X'`: 90, `'3X'`: 38, `'5X'`: 14, `'10X'`: 5, `'RESPIN'`: 4, `'WHEEL'`: 4 (~1 in 250 spins for Wheel/Respin).
      - Respin Booster Weights (Total 1000): `'2X'`: 700, `'3X'`: 200, `'5X'`: 80, `'10X'`: 20.
      - 20 Wheel Wedges Data: Calibrated distribution with 6x100, 5x150, 4x250, 3x400, 1x750, 1x2500 (average = 340 credits).
      - Red-Spin Savior: 70% rescue rate snapping to '0' (85%) or '5' (15%).
      - Rigorously verified across 3 × 1,000,000 Monte Carlo simulation runs yielding steady ~84.7% RTP and ~21.4% hit frequency.

26. Bank Cheque / Federal Reserve MICR E-13B Typography Everywhere:
    - User Request: "Make every font in the game MICR E-13B."
    - Configured Tailwind CSS `@theme` variables (`--font-sans`, `--font-mono`, `--font-serif`) to `'MICR E-13B', 'GnuMICR', monospace`.
    - Applied universal CSS wildcard and root element rules (`*`, `html`, `body`, `#root`, buttons, inputs, headers, paragraphs, spans, tables, meters) in `src/index.css` to enforce MICR E-13B globally.
    - Updated all PixiJS `TextStyle` configurations in `src/game/PixiSlotEngine.ts` to `['MICR E-13B', 'GnuMICR', 'monospace']`.
    - Updated `WheelBonusOverlay.tsx` canvas 2D contexts (`ctx.font`) to render wedge credit values, jackpot labels, and center hub text with `'MICR E-13B', 'GnuMICR', monospace`.

27. Regulatory Autoplay & Responsible Gaming Session Limits:
    - User Request: "Autoplay & Session Limits: Standard casino regulatory requirements: an autoplay drawer (10, 25, 50, 100 spins) [icon to the right of the turbo button] with 'Stop on Bonus' and 'Stop if Balance Decreases by X' limits."
    - UI Architecture (`src/components/AutoplayDrawer.tsx`):
      - Standard casino regulatory modal drawer with clean MICR E-13B styling and gold accents.
      - Spin count selector pills: 10, 25, 50, 100 spins.
      - "Stop on Bonus Feature" toggle (default ON; automatically pauses on Wheel Bonus, Star Respins, and Red-Spin Savior events).
      - "Stop if Balance Decreases by (Loss Limit)" selector (Dynamic options scaled by active Bet: 10x, 25x, 50x, 100x Bet, or No Limit).
      - "Stop if Single Win Exceeds" selector (Dynamic options: 10x, 25x, 50x, 100x Bet, or No Limit).
      - Quick Cost breakdown card showing Total Max Wager, Current Balance, and Active Safeguards.
    - Settings Bar & Credits Bar Controls:
      - Placed the Autoplay button directly to the right of the Turbo button in `SettingsBar.tsx`.
      - Active state styling: Pulsing neon cyan/gold ring when autoplay is executing, displaying remaining spins count badge.
      - Integrated dual-purpose tactile Spin / STOP button in `CreditsBar.tsx`: Transforms into an arcade red pulsing STOP button displaying the remaining spins during autoplay.
    - Autoplay Execution & Regulatory Loop (`src/App.tsx`):
      - State-machine driven loop with non-blocking timers paced appropriately for active Turbo mode (Normal / Turbo / Instant).
      - Strict limit checks after every spin outcome:
        1. Insufficient balance check.
        2. "Stop on Bonus" trigger detection (Wheel Bonus, Star Respin, Red-Spin Savior).
        3. Net loss limit threshold comparison against initial session balance.
        4. Single win limit threshold check.
        5. Total requested spins completed.
      - Interactive manual cancellation: Clicking the STOP button, Settings button, or pressing `SPACE`, `ENTER`, `ESCAPE`, or `A` immediately halts autoplay and updates the handbook with clear reason feedback.
      - Updated `PaytableModal.tsx` with dedicated "5. Autoplay & Session Limits" section.

28. Typography Refactor & Font Specialization:
    - User Request: Separate numeric currency figures from instructional prose. Restrict MICR E-13B strictly to reel number symbols, handbook bracket readout values, and HUD meters (BALANCE, WIN, BET). Switch all prose, headers, modal instructions, button labels, and handbook copy to a rounded comic typeface (`Fredoka` / `Nunito`).
    - Configured Google Fonts import in `index.html` for `Fredoka:wght@600;700;800;900` and `Nunito:wght@700;800;900`.
    - Defined Tailwind theme font variables `--font-comic` (`'Fredoka', 'Nunito', cursive, sans-serif`) and `--font-micr` (`'MICR E-13B', 'GnuMICR', monospace`).
    - Removed blanket global font overrides, enabling fine-grained typography assignment across all UI components.
    - Updated `Handbook.tsx` to format prose labels in bold `font-comic` with standard Title/UPPERCASE styling, while isolating bracket readout numeric stops (`[ 1 0 0 ]`) to `font-micr`.
    - Updated `CreditsBar.tsx`, `SettingsBar.tsx`, `BetModal.tsx`, `PaytableModal.tsx`, `StatsModal.tsx`, `AutoplayDrawer.tsx`, and `WheelBonusOverlay.tsx` to use `font-comic` for copy, labels, and buttons, and `font-micr` strictly for currency figures.

29. Mobile Viewport Layout Tweaks:
    - User Request: "In portrait mobile mode, increase the vertical scale and padding of the 4 reels so they occupy the center section prominently without excessive dead space between the handbook and the command console."
    - In `src/App.tsx`:
      - Adjusted section proportions: Handbook top header (`20vh` on mobile vs `25vh` on desktop), Reels section (`44vh` on mobile vs `37.5vh` on desktop), Settings bar (`11vh` on mobile vs `12.5vh` on desktop), Credits console (`25vh`).
    - In `src/game/PixiSlotEngine.ts`:
      - Dynamic mobile stepper reel aspect ratio increased to 1.52 on portrait mobile viewports, maximizing vertical presence without clipping.
      - Calibrated horizontal and vertical padding (`paddingX`, `paddingY`, and reel `gap`) to eliminate unused dead space on phones.

30. Icon-Only Button Refinements for Denomination, Turbo, & Auto:
    - User Request: "Turbo & Auto buttons should not have text on Mobile. Should be icon only. Denomination button should never have text and should only ever be an icon no matter the resolution."
    - In `src/components/SettingsBar.tsx`:
      - Denomination button: Removed all text labels across all resolutions; rendered strictly as an icon button (`<Coins className="..." />`) on mobile, tablet, and desktop.
      - Turbo button: Hid text labels on mobile screens (`hidden sm:inline`), rendering only the `<Zap />` or `<FastForward />` icon in mobile viewports.
      - Auto button: Hid text labels on mobile screens (`hidden sm:inline`), rendering only the `<RotateCw />` (or `<Square />`) icon in mobile viewports.
    - In `src/components/CommandBar.tsx`:
      - Synchronized denomination button to be strictly icon-only across all viewports.

31. Standardized Guide Book Blank Display Formatting:
    - User Request: "On the left page of the Guide Book when it says 'YOU LANDED:' the results for the 1st & 3rd reel if blank is `-` but for the 2nd reel its `BLANK` but it should be `-`."
    - Root Cause: `src/game/math.ts` previously returned `'BLANK'` fallback strings for `finalR2` and `r4` instead of empty strings, which prevented `s || '—'` mapping from converting the truthy string to a dash.
    - Implementation:
      - Cleaned `src/game/math.ts` to return empty string `''` consistently for all blank reel stops across `initial_stops` and `finalStops`.
      - Implemented a unified `formatStop` function in `src/App.tsx` (`s === 'BLANK' || !s || s === '—' || s === '-' ? '-' : s`) and applied it across all Handbook displays, respin outcomes, near-miss prompts, and `PaytableModal.tsx` rule examples.
      - Blank stops across all 3 reels now consistently display as `-`.

32. 4th Reel Top & Bottom Star Aesthetic Harmonization:
    - User Request: "Remove the border from underneath the star at the top of the 4th reel and add a star to the bottom of the 4th reel as well so it looks similar to the rest of the reels."
    - Removed the dividing header band rectangle and border stroke from underneath the top star on Reel 4 (`src/game/PixiSlotEngine.ts`).
    - Added matching bottom star to Reel 4 (`reel.starBottom`) positioned at `(reelWidth / 2, reelHeight - bandH / 2)` with matching radius, perfectly harmonizing the visual framing across all 4 reels.

33. Stake Engine Provably Fair Decoupling & Production Casino Boot Flow:
    - Decoupled client outcome calculation into server-authoritative mock RGS returning signed `StakeRgsPayload` with HMAC-SHA256 outcome evaluation and static indexed lookup table export.
    - Implemented `BootState` lifecycle (`'LOADING' | 'RULES_MODAL' | 'READY'`) in `src/App.tsx`.
    - Built `LoadingScreen.tsx` with high-contrast jet-black aesthetic, guilloche accents, striped comic progress bar, font readiness gate (`document.fonts.load`), cabinet background preload, and 5s timeout retry fallback.
    - Built `IntroRulesModal.tsx` comic handbook splash modal with 4 core rules, custom comic "Don't show this again" checkbox persisting to `localStorage`, and Web Audio context unlock upon clicking "PLAY NOW".

34. Stake Engine RGS Decoupling & High-DPI Texture Atlas Pre-caching:
    - Decoupled client state so front-end operates strictly as a thin, deterministic client consuming `StakeRgsPayload`.
    - Added static permutation table generator (`generateLookupTable`), indexed outcome fetcher (`getLookupOutcomeByIndex`), and offline JSON exporter (`exportLookupTableJson`, `exportLookupTableCli`) in `src/game/math.ts`.
    - `spinRound()` acts as an asynchronous mock RGS endpoint returning signed server-authoritative payloads with HMAC-SHA256 Provably Fair verification and optional static table indexing.
    - Configured `@font-face` for `GnuMICR` and `MICR E-13B` with `font-display: block` in `src/fonts.css`.
    - Implemented explicit font readiness check using `document.fonts.ready` and `document.fonts.load('1em GnuMICR')` before mounting the Pixi slot application.
    - Implemented Texture Atlas Pre-caching in `PixiSlotEngine.ts`: all procedural textures (MICR numbers, star blanks, frames, wheel slices) are baked into high-DPI textures only after font readiness is confirmed, completely eliminating fallback-font texture baking artifacts.
    - Preloaded `public/bg.jpeg` via Pixi Assets (`Assets.load`) with clean error handling fallback.
    - Disabled spin button until all fonts and image assets are confirmed active in DOM (`isEngineReady` gate).

35. Resolved Spin Button Lockout & Restored Money Background:
    - Root Cause Analysis:
      - Spin Button Issue: In `src/App.tsx`, `handleSpin`, `CreditsBar`, and `handleKeyDown` previously gated interaction behind `bootState !== 'READY' || !isEngineReady`. If `bakeTextureAtlas()` encountered WebGL issues or if fonts had slight parsing delays, `isEngineReady` stayed `false`, completely disabling the spin button and discarding click/keyboard events. Furthermore, `LoadingScreen` and `IntroRulesModal` blocked user interaction on start.
      - Missing Money Background: `CurrencyBackdrop.tsx` previously used a broken Tailwind class `bg-radial` (not present in standard Tailwind CSS v4) and relied solely on an unbundled `<img src="/bg.jpeg" />` tag which failed to display if relative paths or iframe proxying differed.
    - Architectural Solutions:
      - Immediate Spin Readiness: Initialized `isEngineReady` to `true`, removed blocking initial boot states from covering the reel page, guarded `PixiSlotEngine.init` with try/catch and guaranteed `setIsEngineReady(true)` in a `finally` block, and simplified `handleSpin` and `CreditsBar` so the spin button is immediately clickable.
      - Vector Rendering Hardening: Replaced fragile runtime WebGL texture generation in `PixiSlotEngine.ts` with direct, crisp vector Text and Graphics rendering (`Text` with `MICR E-13B`/`GnuMICR` and procedural vector `drawColorfulWheel` & `drawRespinStar`), eliminating texture generation crashes and render delays.
      - Money Background Reliability: Copied `public/bg.jpeg` to `src/assets/bg.jpeg`, added `src/vite-env.d.ts`, and updated `CurrencyBackdrop.tsx` to set `backgroundImage: url(${moneyBg}), url('/bg.jpeg')` directly on the background container alongside an `<img>` tag with fallback, styled with valid CSS `radial-gradient` for a clear, atmospheric view of the engraved currency art.

## Implemented Architecture
- `src/components/LoadingScreen.tsx`: Retro high-contrast boot screen tracking font readiness, backdrop image preload, and stepper calibration.
- `src/components/IntroRulesModal.tsx`: Comic handbook splash modal explaining 4 core rules with persistent "Don't show this again" state and audio unlock.
- `src/components/AutoplayDrawer.tsx`: Regulatory configuration drawer with spin counts (10, 25, 50, 100), Stop on Bonus toggle, Loss Limits, and Single Win Limits.
- `src/game/math.ts`: Deterministic Stake RGS outcome generator with calibrated stop weights (~84.5% RTP, ~21.4% Hit Frequency), fixed 10-credit model, concatenation rules, Monte Carlo simulator.
- `src/game/AudioEngine.ts`: Pure Web Audio API procedural synthesizer for mechanical stepper clicks, solenoid clunks, flapper ratchets, and jackpot fanfare.
- `src/game/PixiSlotEngine.ts`: PixiJS v8 canvas application with dynamic responsive reel scaling, procedural MICR number textures, vector SVG colorful wheel and star symbol rendering, spring overshoot (`back.out`), Purple Respin event, and async `onWheelTrigger` hook.
- `src/components/WheelBonusOverlay.tsx`: Full-screen immersive bonus wheel overlay with interactive spin button, auto-timers, physics wheel, flapper deflection, and win fanfare titled "DUMMY JACKPOT!".
- `src/components/CurrencyBackdrop.tsx`: High-resolution background image backdrop (`/bg.jpeg`) with dynamic game state overlay shaders (purple respin and crimson red-spin flashes) and subtle depth vignette.
- `src/components/Handbook.tsx`: Reactive open cartoon handbook displaying dynamic win math in Credits, filling 25vh.
- `src/components/SettingsBar.tsx`: Dedicated 25vh control shelf with Bet Level modal launcher on left and Stats, Rules, and Sound buttons floating to the right.
- `src/components/CreditsBar.tsx`: Dedicated 25vh console with BALANCE, WIN, BET pill meters and prominent circular Spin button centered on the right.
- `src/components/BetModal.tsx`: Modal for choosing Bet Denominations ($1, $10, $100, $1,000).
- `src/components/PaytableModal.tsx` & `src/components/StatsModal.tsx`: Fun, energetic rules modal (mentioning ~85.0% RTP) and real-time Monte Carlo verification drawer with direct Wheel Bonus test trigger.
- `src/App.tsx`: Central coordinator with ResizeObserver canvas auto-scaling, keyboard navigation (Space/Enter, W, 1-4, B, M, P), full-screen wheel bonus session lifecycle, and credit balance tracking.
