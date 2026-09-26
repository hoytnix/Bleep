#!/usr/bin/env tsx
/**
 * Stake Engine RGS Static Permutation Table Generator
 *
 * Generates an indexed outcome table containing pre-simulated,
 * cryptographically audited permutations:
 * Index -> [Multiplier, R1, R2, R3, R4, Event, Payout]
 *
 * Usage:
 *   npx tsx scripts/generate_table.ts [--count 1000000] [--out data/lookup_table.csv] [--format csv|json]
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  REEL_1_WEIGHTS,
  REEL_2_WEIGHTS,
  REEL_3_WEIGHTS,
  REEL_4_WEIGHTS,
  RESPIN_BOOSTER_WEIGHTS,
  WHEEL_WEDGES,
  SAVIOR_RESPIN_RESCUE_RATE,
  sha256,
  hashToFloats,
  pickWeightedWithFloat,
  calculateConcatenatedCredits,
  parseMultiplier,
} from '../src/game/math';

function parseArgs(): { count: number; outPath: string; format: 'csv' | 'json' } {
  const args = process.argv.slice(2);
  let count = 100_000; // default for quick CLI test, can pass --count 10000000
  let outPath = 'data/lookup_table.csv';
  let format: 'csv' | 'json' = 'csv';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && args[i + 1]) {
      const parsed = parseInt(args[i + 1].replace(/_/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) count = parsed;
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outPath = args[i + 1];
      i++;
    } else if (args[i] === '--format' && args[i + 1]) {
      const f = args[i + 1].toLowerCase();
      if (f === 'json' || f === 'csv') format = f;
      i++;
    }
  }

  return { count, outPath, format };
}

async function run() {
  const { count, outPath, format } = parseArgs();

  console.log('===========================================================');
  console.log('  STAKE ENGINE RGS STATIC PERMUTATION TABLE GENERATOR');
  console.log('===========================================================');
  console.log(`Target Permutations: ${count.toLocaleString()}`);
  console.log(`Output File:         ${outPath}`);
  console.log(`Format:              ${format.toUpperCase()}`);
  console.log('Generating deterministic permutations from calibrated weights...\n');

  const resolvedOut = path.resolve(process.cwd(), outPath);
  const dir = path.dirname(resolvedOut);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const writeStream = fs.createWriteStream(resolvedOut, { encoding: 'utf8' });

  if (format === 'csv') {
    writeStream.write(
      'index,multiplier,r1,r2,r3,r4,credits_won,payout,event,initial_r1,initial_r2,initial_r3,initial_r4,wheel_wedge_idx,salvaged_reel\n'
    );
  } else {
    writeStream.write('[\n');
  }

  const startTime = Date.now();
  let totalWager = 0;
  let totalWon = 0;
  let hits = 0;
  let wheelHits = 0;
  let respinHits = 0;
  let redSpinHits = 0;

  const BATCH_SIZE = 25_000;
  let buffer = '';

  for (let i = 0; i < count; i++) {
    // Deterministic hash per index
    const indexHash = sha256(`stake_rgs_permutation_${i}_wysiwyg_salt`);
    const floats = hashToFloats(indexHash);

    const r1 = pickWeightedWithFloat(REEL_1_WEIGHTS, floats[0]);
    const r2 = pickWeightedWithFloat(REEL_2_WEIGHTS, floats[1]);
    const r3 = pickWeightedWithFloat(REEL_3_WEIGHTS, floats[2]);
    const r4 = pickWeightedWithFloat(REEL_4_WEIGHTS, floats[3]);

    const isValidR1 = ['1', '2', '5', '10'].includes(r1);
    const isBlankR2 = !r2 || r2 === '' || r2 === 'BLANK';
    const isActiveDigitR3 = r3 === '0' || r3 === '5' || r3 === '00';
    const isNearMiss = isValidR1 && isBlankR2 && isActiveDigitR3;

    let redSpinTriggered = false;
    let salvagedStop = '';

    if (isNearMiss) {
      redSpinTriggered = true;
      redSpinHits++;
      if (floats[4] < SAVIOR_RESPIN_RESCUE_RATE) {
        salvagedStop = floats[5] < 0.85 ? '0' : '5';
      } else {
        salvagedStop = '';
      }
    }

    const finalR2 = redSpinTriggered ? salvagedStop : r2;
    const initialStops = [r1, redSpinTriggered ? '' : finalR2, r3, r4];
    const baseCredits = calculateConcatenatedCredits(r1, finalR2, r3);

    let finalStops = [r1, finalR2, r3, r4];
    let multiplier = 1;
    let isRespin = false;
    let isWheel = false;
    let wheelWedgeWon: number | undefined;
    let rawCreditsWon = baseCredits;
    let eventName = 'NONE';

    if (r4 === 'RESPIN') {
      isRespin = true;
      respinHits++;
      eventName = 'STAR_RESPIN';
      const isBlank = (s: string) => !s || s === '' || s === 'BLANK';
      const emptyReels: number[] = [];
      if (isBlank(r1)) emptyReels.push(0);
      if (isBlank(finalR2)) emptyReels.push(1);
      if (isBlank(r3)) emptyReels.push(2);

      const respinNewStops: Record<number, string> = {};
      for (let eIdx = 0; eIdx < emptyReels.length; eIdx++) {
        const reelIdx = emptyReels[eIdx];
        const fl = floats[(6 + eIdx) % floats.length];
        if (reelIdx === 0) respinNewStops[0] = pickWeightedWithFloat(REEL_1_WEIGHTS, fl);
        else if (reelIdx === 1) respinNewStops[1] = pickWeightedWithFloat(REEL_2_WEIGHTS, fl);
        else if (reelIdx === 2) respinNewStops[2] = pickWeightedWithFloat(REEL_3_WEIGHTS, fl);
      }

      const respinNewStop = pickWeightedWithFloat(RESPIN_BOOSTER_WEIGHTS, floats[7]);
      multiplier = parseMultiplier(respinNewStop);

      const respunR1 = respinNewStops[0] !== undefined ? respinNewStops[0] : r1;
      const respunR2 = respinNewStops[1] !== undefined ? respinNewStops[1] : finalR2;
      const respunR3 = respinNewStops[2] !== undefined ? respinNewStops[2] : r3;

      finalStops = [respunR1, respunR2, respunR3, respinNewStop];
      const effectiveBaseCredits = calculateConcatenatedCredits(respunR1, respunR2, respunR3);
      rawCreditsWon = effectiveBaseCredits * multiplier;
    } else if (r4 === 'WHEEL') {
      isWheel = true;
      wheelHits++;
      eventName = 'WHEEL_BONUS';
      wheelWedgeWon = Math.floor(floats[5] * WHEEL_WEDGES.length);
      const rawWedge = WHEEL_WEDGES[wheelWedgeWon];
      rawCreditsWon = baseCredits + rawWedge.credits;
    } else {
      multiplier = parseMultiplier(r4);
      rawCreditsWon = baseCredits * multiplier;
      if (redSpinTriggered) {
        eventName = 'RED_SPIN_SAVIOR';
      } else if (rawCreditsWon > 0) {
        eventName = 'BASE_WIN';
      }
    }

    const creditsWon = rawCreditsWon;
    const payout = creditsWon;
    totalWager += 10;
    totalWon += creditsWon;
    if (creditsWon > 0) hits++;

    if (format === 'csv') {
      const row = `${i},${multiplier},${finalStops[0]},${finalStops[1]},${finalStops[2]},${finalStops[3]},${creditsWon},${payout},${eventName},${initialStops[0]},${initialStops[1]},${initialStops[2]},${initialStops[3]},${wheelWedgeWon ?? ''},${redSpinTriggered ? 1 : ''}\n`;
      buffer += row;
    } else {
      const entry = {
        index: i,
        multiplier,
        stops: finalStops,
        initialStops,
        creditsWon,
        payout,
        event: eventName,
        wheelWedgeWon,
        redSpinTriggered,
      };
      buffer += JSON.stringify(entry) + (i === count - 1 ? '\n' : ',\n');
    }

    if (i > 0 && i % BATCH_SIZE === 0) {
      writeStream.write(buffer);
      buffer = '';
      const percent = ((i / count) * 100).toFixed(1);
      process.stdout.write(`\rProgress: ${percent}% (${i.toLocaleString()} / ${count.toLocaleString()})`);
    }
  }

  if (buffer.length > 0) {
    writeStream.write(buffer);
  }

  if (format === 'json') {
    writeStream.write(']\n');
  }

  await new Promise<void>((resolve) => writeStream.end(resolve));

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const rtp = ((totalWon / totalWager) * 100).toFixed(2);
  const hitFreq = ((hits / count) * 100).toFixed(2);

  console.log(`\rProgress: 100.0% (${count.toLocaleString()} / ${count.toLocaleString()})    \n`);
  console.log('-----------------------------------------------------------');
  console.log('  GENERATION RESULTS & STATISTICAL AUDIT');
  console.log('-----------------------------------------------------------');
  console.log(`Permutations Generated: ${count.toLocaleString()}`);
  console.log(`Time Taken:             ${durationSec}s`);
  console.log(`Total Wagered:          $${totalWager.toLocaleString()}`);
  console.log(`Total Won:              $${totalWon.toLocaleString()}`);
  console.log(`Calibrated RTP:         ${rtp}% (Target: ~84.8%)`);
  console.log(`Hit Frequency:          ${hitFreq}% (Target: ~22.8%)`);
  console.log(`Wheel Bonus Triggers:   ${wheelHits.toLocaleString()} (${((wheelHits / count) * 100).toFixed(3)}%)`);
  console.log(`Star Respin Triggers:   ${respinHits.toLocaleString()} (${((respinHits / count) * 100).toFixed(3)}%)`);
  console.log(`Red-Spin Near-Misses:   ${redSpinHits.toLocaleString()} (${((redSpinHits / count) * 100).toFixed(3)}%)`);
  console.log('-----------------------------------------------------------');
  console.log(`Table successfully exported to: ${outPath}\n`);
}

run().catch((err) => {
  console.error('Fatal error during table generation:', err);
  process.exit(1);
});
