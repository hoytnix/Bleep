# System Patterns: Architecture & State Machines

## Architectural Components
1. **`src/game/math.ts` (Deterministic Stake RGS Simulation Engine)**:
   - Encapsulates exact stop weight tables for Reel 1, 2, 3, 4 and Wheel wedges.
   - Evaluates concatenation rules (active leading digit, sequential adjacency, blank termination).
   - Generates RGS payload: `{ stops: string[], creditsWon: number, multiplier: number, payout: number, events: RoundEvent[] }`.
   - Includes Monte Carlo testing suite to verify ~85.0% RTP and ~22.8% hit frequency.

2. **`src/game/PixiSlotEngine.ts` (PixiJS v8 Hybrid Rendering Canvas)**:
   - Stage management with automatic DPI scaling (`devicePixelRatio`, `autoDensity`).
   - Procedural vector textures for MICR numbers, star symbols, reel frames, and wheel wedges without external assets.
   - State Machine: `IDLE` -> `SPINNING` -> `STOPPING` -> `RESOLVING_WIN` -> `RESPIN_EVENT` -> `WHEEL_EVENT`.
   - Mechanical stepper spring overshoot (`back.out` easing).
   - Particle confetti generator for big wins.

3. **`src/game/AudioEngine.ts` (Web Audio API Synthesizer)**:
   - Procedural sounds:
     - `playStepperTick(rate)`: Mechanical ratchet clicks during spin.
     - `playSolenoidThud(reelIndex)`: Deep mechanical solenoid stop clunk.
     - `playBoosterLand(type)`: Special riser / explosion / chime.
     - `playWinChimes(count)`: Ticker counting chimes.
     - `playFlapperClick()`: Wheel flapper peg snap.
     - `playJackpotFanfare()`: Celebratory arpeggio.

4. **`src/App.tsx` (React Application & Responsive Shell)**:
   - Orchestrates UI HUD, denomination selector, dynamic handbook, balance tracking, keyboard navigation (Space/Enter, 1-4).
   - Manages responsive viewport layout switching between Desktop Landscape (16:9) and Mobile Portrait (9:16) matching concept designs.
