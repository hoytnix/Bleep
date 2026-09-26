# Project Brief: $!#? ("Win What You See") Mechanical Stepper Slot Game

## Overview
A complete, responsive $!#? ("Win What You See") casino slot game inspired by classic mechanical steppers (e.g., Everi Cash Machine, Respin for Dummies) and calibrated with Stake Engine Remote Gaming Server (RGS) math principles.

## Core Pillars
1. **Visual Aesthetics & Banknote Typography**:
   - High-contrast 2D comic minimalism with tactile retro financial elements: Taxi-cab yellow (#FFD700), jet-black (#0A0A0A) diagonal chassis framing, clean white reel windows, lime green (#39FF14) booster casing, neon purple (#BC13FE) respin events.
   - MICR E-13B / Federal Reserve style magnetic-ink numbers with heavy drop-shadows and thick geometric strokes.
   - Ambient vintage dollar-bill guilloche currency background pattern.
   - High-DPI procedural texture generation in PixiJS v8.

2. **Adaptive Dual-Viewport Layout**:
   - Desktop Landscape (>= 1024px / 16:9): Framing currency wings, centered arcade console, open handbook, 4 reels, bottom command bar with meters and spin button. Keyboard shortcuts: Space/Enter (spin), 1-4 (denomination).
   - Mobile Portrait (< 768px / 9:16): Top 25% handbook tutorial, middle 50% edge-to-edge reels, bottom 25% ergonomic thumb zone with pill meters & oversized circular spin button.
   - Tablet / Square: Aspect-ratio pinning and responsive stage letterboxing.

3. **Calibrated Game Math & Fixed 10-Credit Economy**:
   - Fixed 10 Credits wager per round. Denominations: $1.00 ($0.10/cr), $10.00 ($1.00/cr default), $100.00 ($10.00/cr), $1,000.00 ($100.00/cr).
   - Calibrated stop weights yielding ~85.0% RTP and ~22.8% hit frequency.
   - Payout concatenation: Active Reel 1 digit initiates payout, adjacent non-blank digits concatenate, Reel 4 multiplier ('2X', '3X', '5X', '10X').
   - Special Reel 4 events: 'RESPIN' (Purple Respin Lock) and 'WHEEL' (Wheel for Dummies bonus with 20 wedges up to 5,000 credits).

4. **Web Audio API Procedural Synthesizer**:
   - Zero external audio files: Mechanical stepper clicks, solenoid clunks on reel stops, flapper ratchets, and nostalgic jackpot fanfare.
