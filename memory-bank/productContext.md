# Product Context: WYSIWYG Mechanical Stepper Slot

## Problem Domain & User Experience Goals
Modern slot players love the tactile immediacy of classic mechanical "steppers" and WYSIWYG ("Win What You See") cash machines. Unlike complex multi-line video slots with confusing paylines, in a WYSIWYG slot:
- What numbers you see on the win line is exactly the credit amount you win.
- Example: Seeing [1] [0] [5] directly awards 105 credits!
- A booster reel at the end can multiply the win or unlock exciting events (Respin lock or Bonus Wheel).

## User Flows
1. **Idle / Exploration**:
   - Player views current balance ($1,000 baseline default), selected bet ($10 default), and open handbook showing how win concatenation works.
   - Player can change denominations ($1, $10, $100, $1,000) or toggle sound / info.
2. **Spin Execution**:
   - Player presses circular Play button (or Spacebar / Enter on desktop).
   - Fixed 10 credits deducted.
   - Stepper audio ratchets; reels 1-4 spin with blur.
   - Sequential stop with mechanical spring back (`back.out` overshoot): Reel 1 -> Reel 2 -> Reel 3 -> Booster Reel 4.
3. **Win Resolution**:
   - Win ticker counts up with melodic chime fanfares.
   - Handbook updates dynamically with landed formula.
4. **Special Feature: Purple Respin**:
   - Reel 4 lands 'RESPIN'.
   - Stage flashes electric neon purple (#BC13FE).
   - Reels 1-3 freeze with glowing aura while Reel 4 re-spins to upgrade multiplier.
5. **Special Feature: Wheel for Dummies**:
   - Reel 4 lands 'WHEEL'.
   - Reels slide down, prize wheel descends.
   - Wheel spins with flapper physics and peg ticks, landing on a prize wedge (up to 5,000 credits).
