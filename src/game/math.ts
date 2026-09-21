/**
 * Calibrated Stake Engine RGS Math Model & Monte Carlo Simulation
 * Fixed 10-Credit Model with WYSIWYG Mechanical Concatenation
 */

export type Denomination = 1 | 10 | 100 | 1000;

export interface BetConfig {
  bet: Denomination;
  coinValue: number; // Dollar per credit
  label: string;
}

export const BET_CONFIGS: Record<Denomination, BetConfig> = {
  1: { bet: 1, coinValue: 0.1, label: '$1.00' },
  10: { bet: 10, coinValue: 1.0, label: '$10.00' },
  100: { bet: 100, coinValue: 10.0, label: '$100.00' },
  1000: { bet: 1000, coinValue: 100.0, label: '$1,000.00' },
};

export const FIXED_BET_CREDITS = 10;

// Reel Stop Weights (Total weight = 1000 each)
export interface WeightedItem<T> {
  symbol: T;
  weight: number;
}

export const REEL_1_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '', weight: 780 },
  { symbol: '1', weight: 135 },
  { symbol: '2', weight: 55 },
  { symbol: '5', weight: 22 },
  { symbol: '10', weight: 8 },
];

export const REEL_2_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '', weight: 753 },
  { symbol: '0', weight: 185 },
  { symbol: '5', weight: 50 },
  { symbol: '00', weight: 12 },
];

export const REEL_3_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '', weight: 850 },
  { symbol: '0', weight: 110 },
  { symbol: '5', weight: 40 },
];

export const REEL_4_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '', weight: 835 },
  { symbol: '2X', weight: 95 },
  { symbol: '3X', weight: 40 },
  { symbol: '5X', weight: 15 },
  { symbol: '10X', weight: 5 },
  { symbol: 'RESPIN', weight: 5 },
  { symbol: 'WHEEL', weight: 5 },
];

// Respin Reel 4 guaranteed stop weights (when RESPIN is triggered)
export const RESPIN_BOOSTER_WEIGHTS: WeightedItem<string>[] = [
  { symbol: '2X', weight: 450 },
  { symbol: '3X', weight: 350 },
  { symbol: '5X', weight: 150 },
  { symbol: '10X', weight: 50 },
];

// 20 Wheel Wedges (Calibrated distribution: avg 645 credits = 64.5x bet)
export interface WheelWedge {
  index: number;
  credits: number;
  color: string;
  textColor: string;
}

export const WHEEL_WEDGES_DATA: number[] = [
  // 20 wedges: 5x100, 5x200, 4x350, 3x500, 1x1000, 1x2500, 1x5000
  100, 200, 350, 100, 500, 200, 350, 1000, 200, 100,
  500, 200, 350, 100, 2500, 200, 350, 100, 500, 5000,
];

// Wedge styling palette for the cartoon wheel
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
  type: 'BASE_SPIN' | 'RESPIN_TRIGGER' | 'RESPIN_EXECUTION' | 'WHEEL_BONUS';
  details: Record<string, unknown>;
}

export interface SpinResult {
  stops: string[]; // [Reel 1, Reel 2, Reel 3, Reel 4]
  baseCredits: number; // Concatenated credits from Reels 1-3
  multiplier: number;
  creditsWon: number;
  payout: number;
  denomination: Denomination;
  coinValue: number;
  events: RoundEvent[];
  isRespin: boolean;
  isWheel: boolean;
  respinNewStop?: string;
  wheelWedge?: WheelWedge;
}

/**
 * Weighted random picker
 */
export function pickWeighted<T>(items: WeightedItem<T>[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let rand = Math.random() * total;
  for (const item of items) {
    if (rand < item.weight) {
      return item.symbol;
    }
    rand -= item.weight;
  }
  return items[items.length - 1].symbol;
}

/**
 * Calculates WYSIWYG concatenated digits
 * Rule:
 * - Reel 1 must be active ('1', '2', '5', '10') to initiate win. Blank = 0.
 * - Reels 2 and 3 concatenate adjacent non-blank digits.
 * - Blank terminates the sequence.
 */
export function calculateConcatenatedCredits(r1: string, r2: string, r3: string): number {
  if (!r1 || r1 === '') {
    return 0;
  }

  let str = r1;

  if (r2 && r2 !== '') {
    str += r2;
    if (r3 && r3 !== '') {
      str += r3;
    }
  }

  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse booster multiplier
 */
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

/**
 * Executes a deterministic RGS round
 */
export function spinRound(denomination: Denomination = 10): SpinResult {
  const config = BET_CONFIGS[denomination] || BET_CONFIGS[10];
  const coinValue = config.coinValue;

  const r1 = pickWeighted(REEL_1_WEIGHTS);
  const r2 = pickWeighted(REEL_2_WEIGHTS);
  const r3 = pickWeighted(REEL_3_WEIGHTS);
  const r4 = pickWeighted(REEL_4_WEIGHTS);

  const stops = [r1, r2, r3, r4];
  const baseCredits = calculateConcatenatedCredits(r1, r2, r3);

  const events: RoundEvent[] = [
    {
      type: 'BASE_SPIN',
      details: { stops: [...stops], baseCredits },
    },
  ];

  let multiplier = 1;
  let creditsWon = baseCredits;
  let isRespin = false;
  let isWheel = false;
  let respinNewStop: string | undefined;
  let wheelWedge: WheelWedge | undefined;

  if (r4 === 'RESPIN') {
    isRespin = true;
    events.push({
      type: 'RESPIN_TRIGGER',
      details: { lockedStops: [r1, r2, r3] },
    });

    // Respin Reel 4 with guaranteed multiplier
    respinNewStop = pickWeighted(RESPIN_BOOSTER_WEIGHTS);
    multiplier = parseMultiplier(respinNewStop);
    creditsWon = baseCredits * multiplier;

    events.push({
      type: 'RESPIN_EXECUTION',
      details: { newBooster: respinNewStop, multiplier, creditsWon },
    });
  } else if (r4 === 'WHEEL') {
    isWheel = true;
    // Pick wheel wedge uniformly among the 20 calibrated slots
    const wedgeIndex = Math.floor(Math.random() * WHEEL_WEDGES.length);
    wheelWedge = WHEEL_WEDGES[wedgeIndex];
    // In Wheel bonus, award the wheel prize credits + any base line credits
    creditsWon = baseCredits + wheelWedge.credits;
    events.push({
      type: 'WHEEL_BONUS',
      details: { wedgeIndex, wedgeCredits: wheelWedge.credits, totalCreditsWon: creditsWon },
    });
  } else {
    multiplier = parseMultiplier(r4);
    creditsWon = baseCredits * multiplier;
  }

  const payout = Number((creditsWon * coinValue).toFixed(2));

  return {
    stops,
    baseCredits,
    multiplier,
    creditsWon,
    payout,
    denomination,
    coinValue,
    events,
    isRespin,
    isWheel,
    respinNewStop,
    wheelWedge,
  };
}

/**
 * Monte Carlo simulator to verify RTP and Hit Frequency
 */
export function runMonteCarlo(simulations = 100_000): {
  totalWagered: number;
  totalWon: number;
  rtp: number;
  hitFrequency: number;
  winsCount: number;
} {
  const bet = 10; // $10 bet (10 credits at $1/cr)
  let totalWon = 0;
  let winsCount = 0;

  for (let i = 0; i < simulations; i++) {
    const res = spinRound(10);
    totalWon += res.payout;
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
  };
}
