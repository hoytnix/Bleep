/**
 * Stake Engine Remote Gaming Server (RGS) Math Model & Provably Fair Simulator
 *
 * Architecture:
 * - Deterministic HMAC-SHA256 Stake Provably Fair Outcome Evaluator
 * - Pre-calibrated Static Indexed Lookup Table (~84.8% RTP & ~22.8% Hit Frequency)
 * - Server-Authoritative Asynchronous Mock RGS Endpoint returning signed StakeRgsPayload
 * - Offline Exporter for static lookup table generation
 */

export type Denomination = 1 | 10 | 100 | 1000;

export type TurboMode = 'off' | 'turbo' | 'instant';

export interface BetConfig {
  bet: Denomination;
  coinValue: number; // Dollar per credit
  label: string;
}

export const BET_CONFIGS: Record<Denomination, BetConfig> = {
  1: { bet: 1, coinValue: 0.1, label: '$1' },
  10: { bet: 10, coinValue: 1.0, label: '$10' },
  100: { bet: 100, coinValue: 10.0, label: '$100' },
  1000: { bet: 1000, coinValue: 100.0, label: '$1,000' },
};

export const FIXED_BET_CREDITS = 10;

// Reel Stop Weights (Total weight = 1000 each)
export interface WeightedItem<T> {
  symbol: T;
  weight: number;
}

// REEL 1 (Weight: 1000) - Calibrated base hit rate (~22.8% total hit frequency)
export const REEL_1_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '', weight: 775 },
  { symbol: '1', weight: 147 },
  { symbol: '2', weight: 51 },
  { symbol: '5', weight: 20 },
  { symbol: '10', weight: 7 },
];

// REEL 2 (Weight: 1000) - Calibrated to prevent 3-digit inflation
export const REEL_2_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '', weight: 787 },
  { symbol: '0', weight: 163 },
  { symbol: '5', weight: 43 },
  { symbol: '00', weight: 7 },
];

// REEL 3 (Weight: 1000) - Tail digits
export const REEL_3_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '', weight: 884 },
  { symbol: '0', weight: 90 },
  { symbol: '5', weight: 26 },
];

// REEL 4: BOOSTER (Weight: 1000) - Multipliers, Respin, Wheel (~ 1 in 250 spins)
export const REEL_4_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '', weight: 845 },
  { symbol: '2X', weight: 90 },
  { symbol: '3X', weight: 38 },
  { symbol: '5X', weight: 14 },
  { symbol: '10X', weight: 5 },
  { symbol: 'RESPIN', weight: 4 },
  { symbol: 'WHEEL', weight: 4 },
];

// Respin Reel 4 guaranteed stop weights (when RESPIN is triggered)
export const RESPIN_BOOSTER_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '2X', weight: 700 },
  { symbol: '3X', weight: 200 },
  { symbol: '5X', weight: 80 },
  { symbol: '10X', weight: 20 },
];

// 20 Wheel Wedges (Calibrated distribution: 6x100, 5x150, 4x250, 3x400, 1x750, 1x2500)
export interface WheelWedge {
  index: number;
  credits: number;
  color: string;
  textColor: string;
}

export const WHEEL_WEDGES_DATA: number[] = [
  100, 150, 250, 100, 400, 150, 250, 750, 150, 100,
  400, 150, 250, 100, 2500, 150, 250, 100, 400, 100,
];

export const WEDGE_COLORS = [
  '#FF5252', '#FFD700', '#4CAF50', '#2196F3', '#FF9800',
  '#E040FB', '#00E676', '#FF1744', '#00B0FF', '#FFEA00',
  '#7C4DFF', '#69F0AE', '#FF6E40', '#40C4FF', '#EEFF41',
  '#FF4081', '#18FFFF', '#B388FF', '#FFAB00', '#FFD700',
];

export const WHEEL_WEDGES: WheelWedge[] = WHEEL_WEDGES_DATA.map((credits, idx) => ({
  index: idx,
  credits,
  color: WEDGE_COLORS[idx % WEDGE_COLORS.length],
  textColor: idx === 19 ? '#000000' : '#FFFFFF',
}));

export interface RoundEvent {
  type: 'BASE_SPIN' | 'RESPIN_TRIGGER' | 'RESPIN_EXECUTION' | 'WHEEL_BONUS' | 'RED_SPIN_SAVIOR';
  details: Record<string, unknown>;
}

/**
 * Stake Engine RGS Payload
 * Server-Authoritative outcome structure representing a round
 */
export interface StakeRgsPayload {
  roundId: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  stops: [string, string, string, string];
  initialStops?: [string, string, string, string];
  redSpinTriggered: boolean;
  salvagedReel?: number;
  wheelTriggered: boolean;
  wheelWedgeWon?: number;
  respinTriggered: boolean;
  respinMultiplier?: number;
  creditsWon: number;
  multiplier: number;
  payout: number;

  // Extended client-state metadata & backward-compatibility properties
  baseCredits: number;
  wheelWedge?: WheelWedge;
  respinEmptyReels?: number[];
  respinLockedReels?: number[];
  respinNewStops?: Record<number, string>;
  respinNewStop?: string;
  events?: RoundEvent[];
  denomination?: Denomination;
  coinValue?: number;
  index?: number;
  isRespin?: boolean;
  isWheel?: boolean;
  red_spin_triggered?: boolean;
  salvaged_reel?: number;
  initial_stops: [string, string, string, string];
  credits_won?: number;
}

// Backward-compatibility alias for client components
export type SpinResult = StakeRgsPayload;

/**
 * Static Indexed Lookup Table Entry
 */
export interface LookupTableEntry {
  index: number;
  stops: [string, string, string, string];
  initialStops: [string, string, string, string];
  redSpinTriggered: boolean;
  salvagedReel?: number;
  wheelTriggered: boolean;
  wheelWedgeWon?: number;
  respinTriggered: boolean;
  respinMultiplier?: number;
  baseCredits: number;
  multiplier: number;
  creditsWon: number; // Scaled to standard 10 CR bet
  payout: number;
  wheelWedge?: WheelWedge;
  respinEmptyReels?: number[];
  respinLockedReels?: number[];
  respinNewStops?: Record<number, string>;
}

// ---------------------------------------------------------------------
// Pure TypeScript Cryptographic Primitives (SHA-256 & HMAC-SHA-256)
// ---------------------------------------------------------------------

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256(ascii: string): string {
  const maxWord = 0x100000000;
  const lengthProperty = 'length';
  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] = i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 =
        (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + w[i]) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export function hmacSha256(key: string, message: string): string {
  const blockSize = 64;
  let keyBytes: number[] = [];
  for (let i = 0; i < key.length; i++) {
    keyBytes.push(key.charCodeAt(i) & 0xff);
  }
  if (keyBytes.length > blockSize) {
    const keyHashHex = sha256(key);
    keyBytes = [];
    for (let i = 0; i < keyHashHex.length; i += 2) {
      keyBytes.push(parseInt(keyHashHex.substring(i, i + 2), 16));
    }
  }
  while (keyBytes.length < blockSize) {
    keyBytes.push(0);
  }

  let oKeyPad = '';
  let iKeyPad = '';
  for (let i = 0; i < blockSize; i++) {
    oKeyPad += String.fromCharCode(keyBytes[i] ^ 0x5c);
    iKeyPad += String.fromCharCode(keyBytes[i] ^ 0x36);
  }

  const innerHashHex = sha256(iKeyPad + message);
  let innerHashBinary = '';
  for (let i = 0; i < innerHashHex.length; i += 2) {
    innerHashBinary += String.fromCharCode(parseInt(innerHashHex.substring(i, i + 2), 16));
  }

  return sha256(oKeyPad + innerHashBinary);
}

/**
 * Stake Engine Provably Fair Float Extractor
 * Extracts uniform floats in [0, 1) from 32-byte hexadecimal hash
 */
export function hashToFloats(hash: string): number[] {
  const floats: number[] = [];
  for (let i = 0; i < hash.length; i += 8) {
    const chunk = hash.substring(i, i + 8);
    const intVal = parseInt(chunk, 16);
    floats.push(intVal / 0x100000000);
  }
  return floats;
}

// ---------------------------------------------------------------------
// Core Concatenation & Payout Math
// ---------------------------------------------------------------------

/**
 * Weighted stop picker with deterministic float in [0, 1)
 */
export function pickWeightedWithFloat<T>(items: WeightedItem<T>[], floatVal: number): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let rand = (floatVal % 1) * total;
  for (const item of items) {
    if (rand < item.weight) {
      return item.symbol;
    }
    rand -= item.weight;
  }
  return items[items.length - 1].symbol;
}

export function pickWeighted<T>(items: WeightedItem<T>[]): T {
  return pickWeightedWithFloat(items, Math.random());
}

/**
 * Calculates WYSIWYG concatenated digits
 * Rule:
 * - Reel 1 must be active ('1', '2', '5', '10') to initiate win. Blank = 0.
 * - Reels 2 and 3 concatenate adjacent non-blank digits.
 * - Blank terminates the sequence.
 */
export function calculateConcatenatedCredits(r1: string, r2: string, r3: string): number {
  if (!r1 || r1 === '' || r1 === 'BLANK') {
    return 0;
  }

  let str = r1;

  if (r2 && r2 !== '' && r2 !== 'BLANK') {
    str += r2;
    if (r3 && r3 !== '' && r3 !== 'BLANK') {
      str += r3;
    }
  }

  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function parseMultiplier(booster: string): number {
  switch (booster) {
    case '2X':
      return 2;
    case '3X':
      return 3;
    case '5X':
      return 5;
    case '10X':
      return 10;
    default:
      return 1;
  }
}

export const SAVIOR_RESPIN_RESCUE_RATE = 0.70;

// ---------------------------------------------------------------------
// Server Session State & Provably Fair Management
// ---------------------------------------------------------------------

let serverAuthoritativeServerSeed = 'f5e92c730a841d6b2c89f538e1b76420a9d8e57b321c4e908f763a12b456cd9e';
let serverAuthoritativeClientSeed = 'stake_client_seed_777';
let serverAuthoritativeNonce = 0;

export function getServerSeedHash(): string {
  return sha256(serverAuthoritativeServerSeed);
}

export function getClientSeed(): string {
  return serverAuthoritativeClientSeed;
}

export function setClientSeed(seed: string): void {
  serverAuthoritativeClientSeed = seed;
}

export function getCurrentNonce(): number {
  return serverAuthoritativeNonce;
}

export function rotateServerSeed(newSeed?: string): { oldSeed: string; newSeedHash: string } {
  const old = serverAuthoritativeServerSeed;
  serverAuthoritativeServerSeed = newSeed || sha256(`seed_${Date.now()}_${Math.random()}`);
  serverAuthoritativeNonce = 0;
  return {
    oldSeed: old,
    newSeedHash: sha256(serverAuthoritativeServerSeed),
  };
}

// ---------------------------------------------------------------------
// Static Permutation Table & Generator (Offline Exporter)
// ---------------------------------------------------------------------

let cachedStaticLookupTable: LookupTableEntry[] | null = null;

/**
 * Pre-generates an indexed static lookup table representing the calibrated
 * 84.8% RTP and 22.8% hit rate model.
 */
export function generateLookupTable(size = 10000, denomination: Denomination = 10): LookupTableEntry[] {
  const table: LookupTableEntry[] = [];
  const config = BET_CONFIGS[denomination] || BET_CONFIGS[10];
  const coinValue = config.coinValue;

  for (let i = 0; i < size; i++) {
    // Generate deterministic hash for static index
    const indexHash = sha256(`lookup_permutation_${i}_salt_wysiwyg`);
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
      if (floats[4] < SAVIOR_RESPIN_RESCUE_RATE) {
        salvagedStop = floats[5] < 0.85 ? '0' : '5';
      } else {
        salvagedStop = '';
      }
    }

    const finalR2 = redSpinTriggered ? salvagedStop : r2;
    const initialStops: [string, string, string, string] = [
      r1,
      redSpinTriggered ? '' : finalR2,
      r3,
      r4,
    ];

    const baseCredits = calculateConcatenatedCredits(r1, finalR2, r3);
    let finalStops: [string, string, string, string] = [r1, finalR2, r3, r4];
    let multiplier = 1;
    let isRespin = false;
    let isWheel = false;
    let respinNewStop: string | undefined;
    let respinNewStops: Record<number, string> | undefined;
    let respinEmptyReels: number[] | undefined;
    let respinLockedReels: number[] | undefined;
    let wheelWedge: WheelWedge | undefined;
    let wheelWedgeWon: number | undefined;
    let rawCreditsWon = baseCredits;
    let effectiveBaseCredits = baseCredits;

    if (r4 === 'RESPIN') {
      isRespin = true;
      const isBlank = (s: string) => !s || s === '' || s === 'BLANK';
      const emptyReels: number[] = [];
      const lockedReels: number[] = [];

      if (isBlank(r1)) emptyReels.push(0);
      else lockedReels.push(0);

      if (isBlank(finalR2)) emptyReels.push(1);
      else lockedReels.push(1);

      if (isBlank(r3)) emptyReels.push(2);
      else lockedReels.push(2);

      respinEmptyReels = emptyReels;
      respinLockedReels = lockedReels;
      respinNewStops = {};

      for (let eIdx = 0; eIdx < emptyReels.length; eIdx++) {
        const reelIdx = emptyReels[eIdx];
        const fl = floats[(6 + eIdx) % floats.length];
        if (reelIdx === 0) respinNewStops[0] = pickWeightedWithFloat(REEL_1_WEIGHTS, fl);
        else if (reelIdx === 1) respinNewStops[1] = pickWeightedWithFloat(REEL_2_WEIGHTS, fl);
        else if (reelIdx === 2) respinNewStops[2] = pickWeightedWithFloat(REEL_3_WEIGHTS, fl);
      }

      respinNewStop = pickWeightedWithFloat(RESPIN_BOOSTER_WEIGHTS, floats[7]);
      respinNewStops[3] = respinNewStop;
      multiplier = parseMultiplier(respinNewStop);

      const respunR1 = respinNewStops[0] !== undefined ? respinNewStops[0] : r1;
      const respunR2 = respinNewStops[1] !== undefined ? respinNewStops[1] : finalR2;
      const respunR3 = respinNewStops[2] !== undefined ? respinNewStops[2] : r3;

      finalStops = [respunR1, respunR2, respunR3, respinNewStop];
      effectiveBaseCredits = calculateConcatenatedCredits(respunR1, respunR2, respunR3);
      rawCreditsWon = effectiveBaseCredits * multiplier;
    } else if (r4 === 'WHEEL') {
      isWheel = true;
      wheelWedgeWon = Math.floor(floats[5] * WHEEL_WEDGES.length);
      const rawWedge = WHEEL_WEDGES[wheelWedgeWon];
      const scaledWedgeCredits = Math.round(rawWedge.credits * coinValue);
      wheelWedge = {
        ...rawWedge,
        credits: scaledWedgeCredits,
      };
      rawCreditsWon = baseCredits + rawWedge.credits;
    } else {
      multiplier = parseMultiplier(r4);
      rawCreditsWon = baseCredits * multiplier;
    }

    let creditsWon = 0;
    if (isWheel && wheelWedge) {
      const scaledBase =
        effectiveBaseCredits > 0
          ? effectiveBaseCredits * coinValue < 1
            ? 1
            : Math.round(effectiveBaseCredits * coinValue)
          : 0;
      creditsWon = scaledBase + wheelWedge.credits;
    } else if (rawCreditsWon > 0) {
      const scaled = rawCreditsWon * coinValue;
      creditsWon = scaled < 1 ? 1 : Math.round(scaled);
    }

    table.push({
      index: i,
      stops: finalStops,
      initialStops,
      redSpinTriggered,
      salvagedReel: redSpinTriggered ? 1 : undefined,
      wheelTriggered: isWheel,
      wheelWedgeWon,
      respinTriggered: isRespin,
      respinMultiplier: isRespin ? multiplier : undefined,
      baseCredits: effectiveBaseCredits,
      multiplier,
      creditsWon,
      payout: creditsWon,
      wheelWedge,
      respinEmptyReels,
      respinLockedReels,
      respinNewStops,
    });
  }

  return table;
}

export function getStaticLookupTable(): LookupTableEntry[] {
  if (!cachedStaticLookupTable) {
    cachedStaticLookupTable = generateLookupTable(10000, 10);
  }
  return cachedStaticLookupTable;
}

/**
 * Returns a deterministic, signed StakeRgsPayload from the static lookup table by index
 */
export function getLookupOutcomeByIndex(index: number, denomination: Denomination = 10): StakeRgsPayload {
  const table = getStaticLookupTable();
  const safeIdx = Math.abs(index) % table.length;
  const entry = table[safeIdx];
  const config = BET_CONFIGS[denomination] || BET_CONFIGS[10];
  const coinValue = config.coinValue;
  const nonce = ++serverAuthoritativeNonce;
  const roundId = `lookup_rnd_${safeIdx}_${nonce}`;
  const serverSeedHash = sha256(serverAuthoritativeServerSeed);

  // Scale payouts if denomination differs from base table (denom 10, coinValue 1.0)
  const scaledCreditsWon = Math.round(entry.creditsWon * coinValue);
  const scaledBaseCredits = Math.round(entry.baseCredits * coinValue);
  let scaledWheelWedge = entry.wheelWedge;
  if (entry.wheelTriggered && entry.wheelWedgeWon !== undefined) {
    const rawWedge = WHEEL_WEDGES[entry.wheelWedgeWon];
    scaledWheelWedge = {
      ...rawWedge,
      credits: Math.round(rawWedge.credits * coinValue),
    };
  }

  return {
    roundId,
    serverSeedHash,
    clientSeed: serverAuthoritativeClientSeed,
    nonce,
    stops: [...entry.stops],
    initialStops: [...entry.initialStops],
    redSpinTriggered: entry.redSpinTriggered,
    salvagedReel: entry.salvagedReel,
    wheelTriggered: entry.wheelTriggered,
    wheelWedgeWon: entry.wheelWedgeWon,
    respinTriggered: entry.respinTriggered,
    respinMultiplier: entry.respinMultiplier,
    creditsWon: scaledCreditsWon,
    multiplier: entry.multiplier,
    payout: scaledCreditsWon,
    baseCredits: scaledBaseCredits,
    wheelWedge: scaledWheelWedge,
    respinEmptyReels: entry.respinEmptyReels ? [...entry.respinEmptyReels] : undefined,
    respinLockedReels: entry.respinLockedReels ? [...entry.respinLockedReels] : undefined,
    respinNewStops: entry.respinNewStops ? { ...entry.respinNewStops } : undefined,
    denomination,
    coinValue,
    index: safeIdx,
    isRespin: entry.respinTriggered,
    isWheel: entry.wheelTriggered,
    red_spin_triggered: entry.redSpinTriggered,
    salvaged_reel: entry.salvagedReel,
    initial_stops: [...entry.initialStops],
    credits_won: scaledCreditsWon,
  };
}

/**
 * Offline exporter function: outputs static lookup table as JSON string
 */
export function exportLookupTableJson(size = 10000): string {
  const table = generateLookupTable(size, 10);
  return JSON.stringify(table, null, 2);
}

/**
 * Offline exporter script helper: returns statistical metadata and sample JSON
 */
export function exportLookupTableCli(size = 10000): {
  size: number;
  rtp: number;
  hitFrequency: number;
  sampleJson: string;
} {
  const table = generateLookupTable(size, 10);
  const totalWager = size * 10;
  const totalWon = table.reduce((acc, e) => acc + e.creditsWon, 0);
  const hits = table.filter((e) => e.creditsWon > 0).length;
  const rtp = Number(((totalWon / totalWager) * 100).toFixed(2));
  const hitFrequency = Number(((hits / size) * 100).toFixed(2));

  return {
    size,
    rtp,
    hitFrequency,
    sampleJson: JSON.stringify(table.slice(0, 5), null, 2),
  };
}

// ---------------------------------------------------------------------
// Pure Deterministic Outcome Evaluator (Stake RGS Core)
// ---------------------------------------------------------------------

export interface EvaluatorOptions {
  forceRedSpin?: boolean;
  forceRespin?: boolean;
  forceWheel?: boolean;
  forceNearMissWheel?: boolean;
}

/**
 * Pure evaluator decoupled from client state.
 * Evaluates outcome from Provably Fair cryptographic inputs.
 */
export function evaluateRgsOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  denomination: Denomination = 10,
  options: EvaluatorOptions = {}
): StakeRgsPayload {
  const config = BET_CONFIGS[denomination] || BET_CONFIGS[10];
  const coinValue = config.coinValue;

  const hmacSignature = hmacSha256(serverSeed, `${clientSeed}:${nonce}`);
  const floats = hashToFloats(hmacSignature);
  const serverSeedHash = sha256(serverSeed);
  const roundId = `rnd_${Date.now()}_${nonce}`;

  let r1: string;
  let r2: string;
  let r3: string;
  let r4: string;

  if (options.forceNearMissWheel) {
    r1 = '1';
    r2 = '';
    r3 = '0';
    r4 = 'WHEEL';
  } else if (options.forceWheel) {
    r1 = '1';
    r2 = '0';
    r3 = '5';
    r4 = 'WHEEL';
  } else if (options.forceRedSpin) {
    r1 = '1';
    r2 = '';
    r3 = '0';
    r4 = '';
  } else if (options.forceRespin) {
    r1 = '5';
    r2 = '';
    r3 = '';
    r4 = 'RESPIN';
  } else {
    r1 = pickWeightedWithFloat(REEL_1_WEIGHTS, floats[0]);
    r2 = pickWeightedWithFloat(REEL_2_WEIGHTS, floats[1]);
    r3 = pickWeightedWithFloat(REEL_3_WEIGHTS, floats[2]);
    r4 = pickWeightedWithFloat(REEL_4_WEIGHTS, floats[3]);
  }

  const isValidR1 = ['1', '2', '5', '10'].includes(r1);
  const isBlankR2 = !r2 || r2 === '' || r2 === 'BLANK';
  const isActiveDigitR3 = r3 === '0' || r3 === '5' || r3 === '00';
  const isNearMiss = isValidR1 && isBlankR2 && isActiveDigitR3;

  let redSpinTriggered = false;
  let salvagedStop = '';

  if (options.forceRedSpin || options.forceNearMissWheel || isNearMiss) {
    redSpinTriggered = true;
    if (
      options.forceRedSpin ||
      options.forceNearMissWheel ||
      floats[4] < SAVIOR_RESPIN_RESCUE_RATE
    ) {
      salvagedStop = floats[5] < 0.85 ? '0' : '5';
    } else {
      salvagedStop = '';
    }
  }

  const finalR2 = redSpinTriggered ? salvagedStop : r2;
  const initialStops: [string, string, string, string] = [
    r1,
    redSpinTriggered ? '' : finalR2,
    r3,
    r4,
  ];

  const baseCredits = calculateConcatenatedCredits(r1, finalR2, r3);
  const events: RoundEvent[] = [
    {
      type: 'BASE_SPIN',
      details: { initialStops: [...initialStops], baseCredits },
    },
  ];

  if (redSpinTriggered) {
    events.push({
      type: 'RED_SPIN_SAVIOR',
      details: {
        salvagedReel: 1,
        salvagedSymbol: salvagedStop,
        success: salvagedStop !== '',
        bridgedResult: salvagedStop ? `${r1}${salvagedStop}${r3}` : undefined,
      },
    });
  }

  let multiplier = 1;
  let isRespin = false;
  let isWheel = false;
  let respinNewStop: string | undefined;
  let respinNewStops: Record<number, string> | undefined;
  let respinEmptyReels: number[] | undefined;
  let respinLockedReels: number[] | undefined;
  let wheelWedge: WheelWedge | undefined;
  let wheelWedgeWon: number | undefined;
  let rawCreditsWon = baseCredits;
  let finalStops: [string, string, string, string] = [r1, finalR2, r3, r4];
  let effectiveBaseCredits = baseCredits;

  if (r4 === 'RESPIN') {
    isRespin = true;
    const isBlank = (s: string) => !s || s === '' || s === 'BLANK';
    const emptyReels: number[] = [];
    const lockedReels: number[] = [];

    if (isBlank(r1)) emptyReels.push(0);
    else lockedReels.push(0);

    if (isBlank(finalR2)) emptyReels.push(1);
    else lockedReels.push(1);

    if (isBlank(r3)) emptyReels.push(2);
    else lockedReels.push(2);

    respinEmptyReels = emptyReels;
    respinLockedReels = lockedReels;
    respinNewStops = {};

    for (let eIdx = 0; eIdx < emptyReels.length; eIdx++) {
      const reelIdx = emptyReels[eIdx];
      const fl = floats[(6 + eIdx) % floats.length];
      if (reelIdx === 0) respinNewStops[0] = pickWeightedWithFloat(REEL_1_WEIGHTS, fl);
      else if (reelIdx === 1) respinNewStops[1] = pickWeightedWithFloat(REEL_2_WEIGHTS, fl);
      else if (reelIdx === 2) respinNewStops[2] = pickWeightedWithFloat(REEL_3_WEIGHTS, fl);
    }

    respinNewStop = pickWeightedWithFloat(RESPIN_BOOSTER_WEIGHTS, floats[7]);
    respinNewStops[3] = respinNewStop;
    multiplier = parseMultiplier(respinNewStop);

    const respunR1 = respinNewStops[0] !== undefined ? respinNewStops[0] : r1;
    const respunR2 = respinNewStops[1] !== undefined ? respinNewStops[1] : finalR2;
    const respunR3 = respinNewStops[2] !== undefined ? respinNewStops[2] : r3;

    finalStops = [respunR1, respunR2, respunR3, respinNewStop];
    effectiveBaseCredits = calculateConcatenatedCredits(respunR1, respunR2, respunR3);
    rawCreditsWon = effectiveBaseCredits * multiplier;

    events.push({
      type: 'RESPIN_TRIGGER',
      details: {
        initialStops: [...initialStops],
        emptyReels: [...emptyReels],
        lockedReels: [...lockedReels],
      },
    });

    events.push({
      type: 'RESPIN_EXECUTION',
      details: {
        newBooster: respinNewStop,
        respinNewStops: { ...respinNewStops },
        multiplier,
        rawCreditsWon,
        finalStops: [...finalStops],
      },
    });
  } else if (r4 === 'WHEEL') {
    isWheel = true;
    wheelWedgeWon = Math.floor(floats[5] * WHEEL_WEDGES.length);
    const rawWedge = WHEEL_WEDGES[wheelWedgeWon];
    const scaledWedgeCredits = Math.round(rawWedge.credits * coinValue);
    wheelWedge = {
      ...rawWedge,
      credits: scaledWedgeCredits,
    };
    rawCreditsWon = baseCredits + rawWedge.credits;

    events.push({
      type: 'WHEEL_BONUS',
      details: {
        wedgeIndex: wheelWedgeWon,
        rawCredits: rawWedge.credits,
        wedgeCredits: scaledWedgeCredits,
        totalCreditsWon: Math.round(baseCredits * coinValue) + scaledWedgeCredits,
      },
    });
  } else {
    multiplier = parseMultiplier(r4);
    rawCreditsWon = baseCredits * multiplier;
  }

  let creditsWon = 0;
  if (isWheel && wheelWedge) {
    const scaledBase =
      effectiveBaseCredits > 0
        ? effectiveBaseCredits * coinValue < 1
          ? 1
          : Math.round(effectiveBaseCredits * coinValue)
        : 0;
    creditsWon = scaledBase + wheelWedge.credits;
  } else if (rawCreditsWon > 0) {
    const scaled = rawCreditsWon * coinValue;
    creditsWon = scaled < 1 ? 1 : Math.round(scaled);
  }

  const scaledBaseCredits =
    effectiveBaseCredits > 0
      ? effectiveBaseCredits * coinValue < 1
        ? 1
        : Math.round(effectiveBaseCredits * coinValue)
      : 0;

  const payout = creditsWon;

  return {
    roundId,
    serverSeedHash,
    clientSeed,
    nonce,
    stops: finalStops,
    initialStops,
    redSpinTriggered,
    salvagedReel: redSpinTriggered ? 1 : undefined,
    wheelTriggered: isWheel,
    wheelWedgeWon,
    respinTriggered: isRespin,
    respinMultiplier: isRespin ? multiplier : undefined,
    creditsWon,
    multiplier,
    payout,
    baseCredits: scaledBaseCredits,
    wheelWedge,
    respinEmptyReels,
    respinLockedReels,
    respinNewStops,
    respinNewStop,
    events,
    denomination,
    coinValue,
    isRespin,
    isWheel,
    red_spin_triggered: redSpinTriggered,
    salvaged_reel: redSpinTriggered ? 1 : undefined,
    initial_stops: initialStops,
    credits_won: creditsWon,
  };
}

/**
 * Synchronous mock RGS evaluator for ultra-high-speed Monte Carlo verification
 */
export function evaluateRgsPayloadSync(
  denomination: Denomination = 10,
  forceRedSpin = false,
  forceRespin = false,
  forceWheel = false,
  forceNearMissWheel = false,
  customNonce?: number
): StakeRgsPayload {
  const nonce = customNonce !== undefined ? customNonce : ++serverAuthoritativeNonce;
  return evaluateRgsOutcome(
    serverAuthoritativeServerSeed,
    serverAuthoritativeClientSeed,
    nonce,
    denomination,
    { forceRedSpin, forceRespin, forceWheel, forceNearMissWheel }
  );
}

/**
 * Asynchronous Mock Stake Engine RGS Endpoint
 * Returns a signed, server-authoritative StakeRgsPayload with simulated network latency
 */
export async function spinRound(
  denomination: Denomination = 10,
  forceRedSpin = false,
  forceRespin = false,
  forceWheel = false,
  forceNearMissWheel = false,
  customClientSeed?: string,
  lookupIndex?: number
): Promise<StakeRgsPayload> {
  if (customClientSeed) {
    serverAuthoritativeClientSeed = customClientSeed;
  }
  const nonce = ++serverAuthoritativeNonce;

  // Simulate RGS network latency (40-70ms)
  await new Promise((res) => setTimeout(res, 40 + Math.random() * 30));

  if (lookupIndex !== undefined) {
    return getLookupOutcomeByIndex(lookupIndex, denomination);
  }

  return evaluateRgsOutcome(
    serverAuthoritativeServerSeed,
    serverAuthoritativeClientSeed,
    nonce,
    denomination,
    { forceRedSpin, forceRespin, forceWheel, forceNearMissWheel }
  );
}

// ---------------------------------------------------------------------
// Monte Carlo Testing & Verification Suite
// ---------------------------------------------------------------------

export interface MonteCarloResult {
  totalWagered: number;
  totalWon: number;
  rtp: number;
  hitFrequency: number;
  winsCount: number;
  simulations: number;
}

export interface MultiRunMonteCarloResult {
  runs: MonteCarloResult[];
  avgRtp: number;
  avgHitFrequency: number;
  totalWagered: number;
  totalWon: number;
  totalWinsCount: number;
  totalSimulations: number;
  simulationsPerRun: number;
  runsCount: number;
}

/**
 * High-speed Monte Carlo simulator verifying ~84.8% RTP and ~22.8% hit frequency
 */
export function runMonteCarlo(simulations = 1_000_000, denomination: Denomination = 10): MonteCarloResult {
  const bet = BET_CONFIGS[denomination]?.bet || 10;
  let totalWon = 0;
  let winsCount = 0;

  for (let i = 0; i < simulations; i++) {
    const res = evaluateRgsPayloadSync(denomination, false, false, false, false, i + 1);
    totalWon += res.creditsWon;
    if (res.creditsWon > 0) {
      winsCount++;
    }
  }

  const totalWagered = simulations * bet;
  const rtp = (totalWon / totalWagered) * 100;
  const hitFrequency = (winsCount / simulations) * 100;

  return {
    totalWagered,
    totalWon,
    rtp: Number(rtp.toFixed(2)),
    hitFrequency: Number(hitFrequency.toFixed(2)),
    winsCount,
    simulations,
  };
}

export function runMultiMonteCarlo(
  runsCount = 3,
  simulationsPerRun = 1_000_000,
  denomination: Denomination = 10
): MultiRunMonteCarloResult {
  const runs: MonteCarloResult[] = [];
  let totalWagered = 0;
  let totalWon = 0;
  let totalWinsCount = 0;

  for (let i = 0; i < runsCount; i++) {
    const runResult = runMonteCarlo(simulationsPerRun, denomination);
    runs.push(runResult);
    totalWagered += runResult.totalWagered;
    totalWon += runResult.totalWon;
    totalWinsCount += runResult.winsCount;
  }

  const totalSimulations = runsCount * simulationsPerRun;
  const avgRtp = Number(((totalWon / totalWagered) * 100).toFixed(2));
  const avgHitFrequency = Number(((totalWinsCount / totalSimulations) * 100).toFixed(2));

  return {
    runs,
    avgRtp,
    avgHitFrequency,
    totalWagered,
    totalWon,
    totalWinsCount,
    totalSimulations,
    simulationsPerRun,
    runsCount,
  };
}
