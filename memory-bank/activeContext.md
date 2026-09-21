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

## Implemented Architecture
- `src/game/math.ts`: Deterministic Stake RGS outcome generator with calibrated stop weights (~85.0% RTP, ~22.8% Hit Frequency), fixed 10-credit model, concatenation rules, Monte Carlo simulator.
- `src/game/AudioEngine.ts`: Pure Web Audio API procedural synthesizer for mechanical stepper clicks, solenoid clunks, flapper ratchets, and jackpot fanfare.
- `src/game/PixiSlotEngine.ts`: PixiJS v8 canvas application with dynamic responsive reel scaling, procedural MICR number textures, vector SVG colorful wheel and star symbol rendering, spring overshoot (`back.out`), Purple Respin event, and async `onWheelTrigger` hook.
- `src/components/WheelBonusOverlay.tsx`: Full-screen immersive bonus wheel overlay with interactive spin button, auto-timers, physics wheel, flapper deflection, and win fanfare titled "DUMMY JACKPOT!".
- `src/components/CurrencyBackdrop.tsx`: Vintage dollar-bill guilloche engraved currency pattern with parchment and greenback motifs.
- `src/components/Handbook.tsx`: Reactive open cartoon handbook displaying dynamic win math in Credits, filling 25vh.
- `src/components/SettingsBar.tsx`: Dedicated 25vh control shelf with Bet Level modal launcher on left and Stats, Rules, and Sound buttons floating to the right.
- `src/components/CreditsBar.tsx`: Dedicated 25vh console with BALANCE, WIN, BET pill meters and prominent circular Spin button centered on the right.
- `src/components/BetModal.tsx`: Modal for choosing Bet Denominations ($1, $10, $100, $1,000).
- `src/components/PaytableModal.tsx` & `src/components/StatsModal.tsx`: Fun, energetic rules modal (mentioning ~85.0% RTP) and real-time Monte Carlo verification drawer with direct Wheel Bonus test trigger.
- `src/App.tsx`: Central coordinator with ResizeObserver canvas auto-scaling, keyboard navigation (Space/Enter, W, 1-4, B, M, P), full-screen wheel bonus session lifecycle, and credit balance tracking.
