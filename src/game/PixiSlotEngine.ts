import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import confetti from 'canvas-confetti';
import { SpinResult, WheelWedge, WHEEL_WEDGES, TurboMode } from './math';
import { soundEngine } from './AudioEngine';

export interface PixiSlotEngineEvents {
  onSpinStart?: () => void;
  onReelStop?: (reelIndex: number, symbol: string) => void;
  onNearMissPause?: (initialStops: string[]) => void;
  onRedSpinAlarm?: () => void;
  onRedSpinBridged?: (stops: string[]) => void;
  onRedSpinMissed?: (stops: string[]) => void;
  onRespinStart?: (emptyReels: number[], lockedReels: number[]) => void;
  onRespinEnd?: (result: SpinResult) => void;
  onWheelStart?: (wedge: WheelWedge) => void;
  onWheelTrigger?: (wedge: WheelWedge) => Promise<void>;
  onWheelEnd?: (wedge: WheelWedge) => void;
  onSpinComplete?: (result: SpinResult) => void;
}

interface ReelView {
  container: Container;
  mask: Graphics;
  border: Graphics;
  bg: Graphics;
  starTop: Graphics;
  starBottom: Graphics;
  symbolsContainer: Container;
  currentSymbolText: Text;
  currentSymbolGraphic: Graphics;
  previousSymbolText: Text;
  previousSymbolGraphic: Graphics;
  nextSymbolText: Text;
  currentSymbol: string;
  previousSymbol: string;
  isBooster: boolean;
  blurSpeed: number;
  offsetY: number;
  targetSymbol: string;
  isSpinning: boolean;
  isLocked: boolean;
  lockGlow: Graphics;
  redStrobe: Graphics;
  speedLines: Graphics;
  isRedSpinning?: boolean;
}

export class PixiSlotEngine {
  private app: Application | null = null;
  private rootContainer: Container | null = null;
  private reelsContainer: Container | null = null;
  private respinOverlay: Container | null = null;

  private reels: ReelView[] = [];
  private isMobile: boolean = false;
  private stageWidth: number = 800;
  private stageHeight: number = 480;
  private activeReelWidth: number = 120;
  private activeReelHeight: number = 194;
  private isDestroyed: boolean = false;
  private isSpinning: boolean = false;

  private events: PixiSlotEngineEvents = {};

  constructor(events: PixiSlotEngineEvents = {}) {
    this.events = events;
  }

  public async init(containerElement: HTMLElement): Promise<void> {
    const width = containerElement.clientWidth || 800;
    const height = containerElement.clientHeight || 480;
    this.stageWidth = width;
    this.stageHeight = height;
    this.isMobile = width < 768;

    // Ensure authentic Federal Reserve / Bank Cheque MICR E-13B fonts are pre-loaded
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await Promise.allSettled([
          document.fonts.load('48px "MICR E-13B"'),
          document.fonts.load('48px "GnuMICR"'),
          document.fonts.ready,
        ]);
      }
    } catch {
      // Continue gracefully if Font Loading API is unavailable
    }

    const app = new Application();
    await app.init({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 2, 3),
    });

    if (this.isDestroyed) {
      app.destroy(true);
      return;
    }

    this.app = app;
    while (containerElement.firstChild) {
      containerElement.removeChild(containerElement.firstChild);
    }
    containerElement.appendChild(app.canvas);

    this.rootContainer = new Container();
    this.app.stage.addChild(this.rootContainer);

    this.reelsContainer = new Container();
    this.rootContainer.addChild(this.reelsContainer);

    this.respinOverlay = new Container();
    this.respinOverlay.visible = false;
    this.rootContainer.addChild(this.respinOverlay);

    this.buildReels();
    this.buildRespinOverlay();

    this.app.ticker.add(this.update, this);
    this.resize(width, height);
  }

  public setEvents(events: PixiSlotEngineEvents) {
    this.events = events;
  }

  /**
   * Builds the 4 reels (Reels 1-3 classic white, Reel 4 lime-green booster)
   */
  private buildReels() {
    if (!this.reelsContainer) return;
    this.reels = [];
    this.reelsContainer.removeChildren();

    const symbols = ['1', '0', '5', '2X'];

    for (let i = 0; i < 4; i++) {
      const isBooster = i === 3;
      const reelBox = new Container();

      // Mask for reel window
      const mask = new Graphics();
      reelBox.addChild(mask);
      reelBox.mask = mask;

      // Background
      const bg = new Graphics();
      reelBox.addChild(bg);

      // Lock glow (for Respin lock)
      const lockGlow = new Graphics();
      lockGlow.visible = false;
      reelBox.addChild(lockGlow);

      // Symbols container
      const symbolsContainer = new Container();
      reelBox.addChild(symbolsContainer);

      // Star emblems (top and bottom) for reels 0, 1, 2
      const starTop = new Graphics();
      const starBottom = new Graphics();
      reelBox.addChild(starTop);
      reelBox.addChild(starBottom);

      // Border outline
      const border = new Graphics();
      reelBox.addChild(border);

      // Red speed lines container inside reelBox
      const speedLines = new Graphics();
      speedLines.visible = false;
      reelBox.addChild(speedLines);

      // Red strobe border overlay for comic red alarm
      const redStrobe = new Graphics();
      redStrobe.visible = false;
      reelBox.addChild(redStrobe);

      // Symbols (previous, current, next)
      const style = this.getSymbolTextStyle(isBooster, symbols[i]);
      const currentSymbolText = new Text({ text: '', style });
      currentSymbolText.anchor.set(0.5);

      const currentSymbolGraphic = new Graphics();

      const previousSymbolText = new Text({ text: '', style });
      previousSymbolText.anchor.set(0.5);

      const previousSymbolGraphic = new Graphics();

      const nextSymbolText = new Text({ text: '', style });
      nextSymbolText.anchor.set(0.5);

      symbolsContainer.addChild(previousSymbolGraphic);
      symbolsContainer.addChild(previousSymbolText);
      symbolsContainer.addChild(currentSymbolGraphic);
      symbolsContainer.addChild(currentSymbolText);
      symbolsContainer.addChild(nextSymbolText);

      this.reelsContainer.addChild(reelBox);

      const reelView: ReelView = {
        container: reelBox,
        mask,
        bg,
        border,
        starTop,
        starBottom,
        symbolsContainer,
        currentSymbolText,
        currentSymbolGraphic,
        previousSymbolText,
        previousSymbolGraphic,
        nextSymbolText,
        currentSymbol: symbols[i],
        previousSymbol: '',
        isBooster,
        blurSpeed: 0,
        offsetY: 0,
        targetSymbol: symbols[i],
        isSpinning: false,
        isLocked: false,
        lockGlow,
        redStrobe,
        speedLines,
        isRedSpinning: false,
      };

      this.reels.push(reelView);
    }
  }

  /**
   * Respin Overlay with electric neon purple rays and comic speed dots
   */
  private buildRespinOverlay() {
    if (!this.respinOverlay) return;
    this.respinOverlay.removeChildren();

    const bgGlow = new Graphics();
    this.respinOverlay.addChild(bgGlow);
  }

  private getSymbolTextStyle(isBooster: boolean, text: string): TextStyle {
    const rw = this.activeReelWidth || (this.isMobile ? 88 : 156);
    if (isBooster) {
      if (text === 'RESPIN') {
        return new TextStyle({
          fontFamily: ['MICR E-13B', 'GnuMICR', 'monospace'],
          fontSize: Math.max(16, Math.floor(rw * 0.23)),
          fontWeight: '900',
          fill: 0xffffff,
          stroke: { width: Math.max(3, Math.floor(rw * 0.04)), color: 0xbc13fe },
          dropShadow: {
            color: 0x000000,
            blur: 0,
            angle: Math.PI / 4,
            distance: Math.max(2, Math.floor(rw * 0.03)),
          },
        });
      }
      if (text === 'WHEEL') {
        return new TextStyle({
          fontFamily: ['MICR E-13B', 'GnuMICR', 'monospace'],
          fontSize: Math.max(16, Math.floor(rw * 0.22)),
          fontWeight: '900',
          fill: 0xffea00,
          stroke: { width: Math.max(3, Math.floor(rw * 0.04)), color: 0x000000 },
          dropShadow: {
            color: 0x000000,
            blur: 0,
            angle: Math.PI / 4,
            distance: Math.max(2, Math.floor(rw * 0.03)),
          },
        });
      }
      // Standard Multipliers (2X, 3X, 5X, 10X)
      return new TextStyle({
        fontFamily: ['MICR E-13B', 'GnuMICR', 'monospace'],
        fontSize: Math.max(26, Math.floor(rw * 0.40)),
        fontWeight: '900',
        fill: 0xffffff,
        stroke: { width: Math.max(4, Math.floor(rw * 0.05)), color: 0x0a0a0a },
        dropShadow: {
          color: 0x000000,
          blur: 0,
          angle: Math.PI / 4,
          distance: Math.max(3, Math.floor(rw * 0.035)),
        },
      });
    }

    // Reels 1-3 Authentic Bank Cheque / Federal Reserve MICR E-13B Numeral Style
    // Thick rectangular blocks, asymmetric bottom weight, slab cuts, yellow with heavy black drop shadow
    const isWide = text === '10' || text === '00';
    return new TextStyle({
      fontFamily: ['MICR E-13B', 'GnuMICR', 'monospace'],
      fontSize: Math.max(34, Math.floor(rw * (isWide ? 0.44 : 0.60))),
      fontWeight: 'bold',
      letterSpacing: isWide ? 2 : 0,
      fill: 0xffd700, // taxi-cab yellow
      stroke: { width: Math.max(3, Math.floor(rw * 0.04)), color: 0x0a0a0a },
      dropShadow: {
        color: 0x0a0a0a,
        blur: 0,
        angle: Math.PI / 4,
        distance: Math.max(3, Math.floor(rw * 0.04)),
      },
    });
  }

  /**
   * Draws a cartoon star emblem
   */
  private drawStar(g: Graphics, cx: number, cy: number, r: number, points = 5) {
    g.circle(cx, cy, r + 4).fill({ color: 0xffd700 }).stroke({ width: 2, color: 0x0a0a0a });
    g.circle(cx, cy, r + 1).fill({ color: 0xffea00 }).stroke({ width: 1, color: 0x0a0a0a });

    // Inner star
    const step = Math.PI / points;
    g.moveTo(cx, cy - r);
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? r : r * 0.45;
      const angle = i * step - Math.PI / 2;
      g.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    }
    g.closePath().fill({ color: 0xffd700 }).stroke({ width: 1.5, color: 0x0a0a0a });
  }

  /**
   * Draws a colorful vector SVG-style prize wheel on the reel (replaces BONUS WHEEL text)
   */
  private drawColorfulWheel(g: Graphics, cx: number, cy: number, r: number): void {
    g.clear();

    // Outer dark casing with gold rim and comic black outline
    g.circle(cx, cy, r + 4).fill({ color: 0x0a0a0a });
    g.circle(cx, cy, r + 2).fill({ color: 0xffd700 }).stroke({ width: 2, color: 0x0a0a0a });

    // 8 vivid comic prize wedges
    const colors = [
      0xff1744, // Red
      0xff9100, // Orange
      0xffd700, // Gold Yellow
      0x00e676, // Bright Green
      0x00e5ff, // Electric Cyan
      0x2979ff, // Royal Blue
      0xbc13fe, // Comic Purple
      0xff4081, // Hot Pink
    ];
    const numWedges = colors.length;
    const slice = (Math.PI * 2) / numWedges;

    for (let i = 0; i < numWedges; i++) {
      const startA = i * slice - Math.PI / 2;
      const endA = startA + slice;
      g.moveTo(cx, cy)
        .arc(cx, cy, r, startA, endA)
        .closePath()
        .fill({ color: colors[i] })
        .stroke({ width: 1.5, color: 0x0a0a0a });
    }

    // Outer rim pegs
    for (let i = 0; i < numWedges; i++) {
      const angle = i * slice - Math.PI / 2;
      const px = cx + Math.cos(angle) * (r + 1);
      const py = cy + Math.sin(angle) * (r + 1);
      g.circle(px, py, 1.8).fill({ color: 0xffffff }).stroke({ width: 0.8, color: 0x0a0a0a });
    }

    // Center Gold Wheel Hub
    g.circle(cx, cy, Math.max(6, r * 0.32))
      .fill({ color: 0xffd700 })
      .stroke({ width: 2, color: 0x0a0a0a });
    g.circle(cx, cy, Math.max(3, r * 0.18))
      .fill({ color: 0xffffff })
      .stroke({ width: 1, color: 0x0a0a0a });
    g.circle(cx, cy, Math.max(1.5, r * 0.08))
      .fill({ color: 0x0a0a0a });

    // Top indicator flapper pointing down into wheel
    const flapperH = Math.max(6, r * 0.28);
    const flapperW = Math.max(5, r * 0.22);
    g.moveTo(cx, cy - r + 2)
      .lineTo(cx - flapperW / 2, cy - r - flapperH)
      .lineTo(cx + flapperW / 2, cy - r - flapperH)
      .closePath()
      .fill({ color: 0xff1744 })
      .stroke({ width: 1.5, color: 0x0a0a0a });
  }

  /**
   * Draws an SVG-style Star on an electric purple backing for the RESPIN symbol
   */
  private drawRespinStar(g: Graphics, cx: number, cy: number, r: number): void {
    g.clear();

    // Electric purple backing with comic black border and inner highlight
    g.circle(cx, cy, r + 5).fill({ color: 0xbc13fe }).stroke({ width: 3, color: 0x0a0a0a });
    g.circle(cx, cy, r + 2).fill({ color: 0x4a044e }).stroke({ width: 1.5, color: 0xffffff });

    // 5-pointed sharp gold star
    const points = 5;
    const step = Math.PI / points;
    const outerR = r * 0.95;
    const innerR = outerR * 0.42;

    g.moveTo(cx, cy - outerR);
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? outerR : innerR;
      const angle = i * step - Math.PI / 2;
      g.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    }
    g.closePath()
      .fill({ color: 0xffd700 })
      .stroke({ width: 2.5, color: 0x0a0a0a });

    // Inner bright highlight facet
    const facetR = outerR * 0.55;
    const facetInnerR = facetR * 0.4;
    g.moveTo(cx, cy - facetR);
    for (let i = 0; i < 2 * points; i++) {
      const radius = i % 2 === 0 ? facetR : facetInnerR;
      const angle = i * step - Math.PI / 2;
      g.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    }
    g.closePath().fill({ color: 0xffea00 });

    // Center sparkle highlight
    g.circle(cx, cy, Math.max(2, outerR * 0.12)).fill({ color: 0xffffff });
  }

  /**
   * Renders a symbol onto a reel: text for numerals/multipliers, or SVG vectors for WHEEL and RESPIN
   */
  private renderReelSymbol(
    reel: ReelView,
    symbol: string,
    textNode: Text,
    graphicNode: Graphics
  ): void {
    const rw = this.activeReelWidth || (this.isMobile ? 88 : 156);
    const rh = this.activeReelHeight || Math.floor(rw * 1.62);
    const cx = rw / 2;
    const cy = rh / 2;
    const radius = Math.min(38, Math.max(16, Math.floor(rw * 0.28)));

    if (symbol === 'WHEEL') {
      textNode.text = '';
      graphicNode.visible = true;
      this.drawColorfulWheel(graphicNode, cx, cy, radius);
    } else if (symbol === 'RESPIN') {
      textNode.text = '';
      graphicNode.visible = true;
      this.drawRespinStar(graphicNode, cx, cy, radius);
    } else if (!symbol || symbol === '' || symbol === 'BLANK') {
      graphicNode.clear();
      graphicNode.visible = false;
      textNode.text = '';
    } else {
      graphicNode.clear();
      graphicNode.visible = false;
      textNode.text = symbol;
      textNode.style = this.getSymbolTextStyle(reel.isBooster, symbol);
      // NOTE: Do NOT override textNode.position here.
      // Dedicated reel slots (previous at -rh, current at 0, next at +rh) preserve vertical spacing.
    }
  }

  /**
   * Responsive layout calculation for Desktop (16:9), Tablet & Mobile (9:16)
   */
  public resize(width: number, height: number): void {
    if (!this.app || this.isDestroyed) return;

    this.stageWidth = width;
    this.stageHeight = height;
    this.isMobile = width < 768;

    this.app.renderer.resize(width, height);

    // Calculate dimensions dynamically to scale up with screen size and eliminate unused vertical margins
    const totalReels = 4;
    const gap = this.isMobile
      ? Math.max(3, Math.min(10, Math.floor(width * 0.012)))
      : Math.max(4, Math.min(14, Math.floor(width * 0.014)));
    const paddingX = this.isMobile
      ? Math.max(4, Math.min(12, Math.floor(width * 0.015)))
      : Math.max(6, Math.min(18, Math.floor(width * 0.02)));
    const paddingY = this.isMobile
      ? Math.max(2, Math.min(6, Math.floor(height * 0.01)))
      : Math.max(3, Math.min(8, Math.floor(height * 0.02)));

    const availableWidth = width - paddingX * 2;
    const availableHeight = height - paddingY * 2;

    // Stepper reel aspect ratio: 1.52 on mobile to maximize vertical presence, 1.42 on desktop
    const aspect = this.isMobile ? 1.52 : 1.42;
    const maxReelWidthByHeight = Math.floor((availableHeight * 0.99) / aspect);
    const maxReelWidthByWidth = Math.floor((availableWidth - (totalReels - 1) * gap) / totalReels);

    // Dynamic reelWidth: smoothly scale up on phones, tablets, and desktops
    const reelWidth = Math.max(50, Math.min(maxReelWidthByWidth, maxReelWidthByHeight, 260));
    const reelHeight = Math.floor(reelWidth * aspect);
    this.activeReelWidth = reelWidth;
    this.activeReelHeight = reelHeight;

    const totalWidth = totalReels * reelWidth + (totalReels - 1) * gap;
    const startX = Math.floor((width - totalWidth) / 2);
    const startY = Math.floor((height - reelHeight) / 2);

    this.reels.forEach((reel, i) => {
      const rx = startX + i * (reelWidth + gap);
      const ry = startY;

      reel.container.position.set(rx, ry);

      // Mask
      reel.mask.clear().roundRect(0, 0, reelWidth, reelHeight, 14).fill({ color: 0xffffff });

      // Background & Framing
      reel.bg.clear();
      reel.border.clear();
      reel.lockGlow.clear();

      if (reel.isBooster) {
        // Booster Lime-Green Casing (#39FF14 / #84cc16)
        reel.bg
          .roundRect(0, 0, reelWidth, reelHeight, 14)
          .fill({ color: 0x84cc16 })
          .stroke({ width: 4, color: 0x0a0a0a });

        const bandH = Math.max(24, Math.floor(reelHeight * 0.16));

        // 4th Reel Stars (Top and Bottom) matching Reels 1-3
        reel.starTop.clear();
        reel.starBottom.clear();
        const starRadius = Math.max(7, Math.floor(bandH * 0.3));
        this.drawStar(reel.starTop, reelWidth / 2, bandH / 2, starRadius);
        this.drawStar(reel.starBottom, reelWidth / 2, reelHeight - bandH / 2, starRadius);
        reel.starTop.visible = true;
        reel.starBottom.visible = true;
      } else {
        // Classic White Reel with Yellow Framing
        reel.bg
          .roundRect(0, 0, reelWidth, reelHeight, 14)
          .fill({ color: 0xffffff });

        const bandH = Math.max(24, Math.floor(reelHeight * 0.16));

        // Yellow Border with thick black stroke
        reel.border
          .roundRect(0, 0, reelWidth, reelHeight, 14)
          .stroke({ width: Math.max(4, Math.floor(reelWidth * 0.05)), color: 0xffd700 });
        reel.border
          .roundRect(-2, -2, reelWidth + 4, reelHeight + 4, 16)
          .stroke({ width: 3, color: 0x0a0a0a });

        // Stars top & bottom
        reel.starTop.clear();
        reel.starBottom.clear();
        const starRadius = Math.max(7, Math.floor(bandH * 0.3));
        this.drawStar(reel.starTop, reelWidth / 2, bandH / 2, starRadius);
        this.drawStar(reel.starBottom, reelWidth / 2, reelHeight - bandH / 2, starRadius);
        reel.starTop.visible = true;
        reel.starBottom.visible = true;
      }

      // Lock Glow (Purple Neon)
      reel.lockGlow
        .roundRect(-6, -6, reelWidth + 12, reelHeight + 12, 18)
        .stroke({ width: 8, color: 0xbc13fe });

      // Update text style sizes and positions
      reel.currentSymbolText.style = this.getSymbolTextStyle(reel.isBooster, reel.currentSymbol);
      reel.previousSymbolText.style = this.getSymbolTextStyle(reel.isBooster, reel.previousSymbol);
      reel.nextSymbolText.style = this.getSymbolTextStyle(reel.isBooster, '');

      reel.currentSymbolText.position.set(reelWidth / 2, reelHeight / 2);
      reel.previousSymbolText.position.set(reelWidth / 2, reelHeight / 2 - reelHeight);
      reel.nextSymbolText.position.set(reelWidth / 2, reelHeight / 2 + reelHeight);

      reel.currentSymbolGraphic.position.set(0, 0);
      reel.previousSymbolGraphic.position.set(0, -reelHeight);

      this.renderReelSymbol(reel, reel.currentSymbol, reel.currentSymbolText, reel.currentSymbolGraphic);
      if (reel.previousSymbol) {
        this.renderReelSymbol(reel, reel.previousSymbol, reel.previousSymbolText, reel.previousSymbolGraphic);
      }
    });
  }

  /**
   * Main game loop ticker
   */
  private update(ticker: { deltaTime: number }): void {
    const dt = ticker.deltaTime;
    const rh = this.activeReelHeight || (this.isMobile ? 140 : 260);
    const rw = this.activeReelWidth || (this.isMobile ? 88 : 156);

    this.reels.forEach((reel) => {
      if (reel.isSpinning) {
        reel.offsetY += reel.blurSpeed * dt * 26;

        // Render dynamic anime/comic red speed lines during Red-Spin Savior
        if (reel.isRedSpinning) {
          const g = reel.speedLines;
          g.clear();
          g.visible = true;
          // 8 vertical comic speed streaks in #FF0033 and gold
          for (let i = 0; i < 7; i++) {
            const lx = Math.random() * rw;
            const ly = Math.random() * (rh * 0.3);
            const lineH = rh * (0.35 + Math.random() * 0.55);
            const alpha = 0.4 + Math.random() * 0.55;
            g.moveTo(lx, ly)
              .lineTo(lx, ly + lineH)
              .stroke({ width: 2.5 + Math.random() * 2, color: 0xff0033, alpha });
          }
          // High-contrast gold streaks
          const goldX = Math.random() * rw;
          g.moveTo(goldX, 0)
            .lineTo(goldX, rh * 0.8)
            .stroke({ width: 2, color: 0xffd700, alpha: 0.75 });
        }

        if (reel.offsetY >= rh) {
          reel.offsetY = reel.offsetY % rh;

          // The symbol that was above has scrolled down into the center
          reel.currentSymbol = reel.previousSymbol;
          this.renderReelSymbol(reel, reel.currentSymbol, reel.currentSymbolText, reel.currentSymbolGraphic);

          // Prepare the next incoming dummy symbol above the reel window
          const dummy = reel.isBooster
            ? ['2X', '3X', '5X', '10X', 'RESPIN', 'WHEEL', ''][Math.floor(Math.random() * 7)]
            : ['1', '2', '5', '10', '0', '00', ''][Math.floor(Math.random() * 7)];
          reel.previousSymbol = dummy;
          this.renderReelSymbol(reel, dummy, reel.previousSymbolText, reel.previousSymbolGraphic);

          soundEngine.playStepperClick(1.0 + Math.random() * 0.3);
        }

        reel.symbolsContainer.position.y = reel.offsetY;
      }
    });
  }

  /**
   * Performs the full Spin Cycle with sequential stop timing, spring overshoot, or turbo/instant modes
   * - 'off' (normal): Sequential stops at 700ms, 1100ms, 1500ms, 1900ms
   * - 'turbo': If Reel 1 misses (blank), reels 2 and 3 are skipped immediately; if Reel 1 hits, standard suspense progression
   * - 'instant': Instantly skips all reels
   */
  public async spin(spinResult: SpinResult, turboMode: TurboMode = 'off'): Promise<void> {
    if (this.isSpinning) return;
    this.isSpinning = true;

    this.events.onSpinStart?.();

    // Reset lock glows and red strobes
    this.clearRedSpinStrobe();
    this.reels.forEach((r) => {
      r.isLocked = false;
      r.lockGlow.visible = false;
    });

    // Handle RED-SPIN SAVIOR mechanic if triggered (salvaging split-digit near-misses)
    if (spinResult.red_spin_triggered) {
      // 1. Reels start spinning
      this.reels.forEach((reel) => {
        reel.isSpinning = true;
        reel.blurSpeed = 1.0;
        reel.offsetY = 0;
        reel.symbolsContainer.position.y = 0;
        const dummy = reel.isBooster
          ? ['2X', '3X', '5X', '10X', 'RESPIN', 'WHEEL'][Math.floor(Math.random() * 6)]
          : ['1', '2', '5', '10', '0', '00'][Math.floor(Math.random() * 6)];
        reel.previousSymbol = dummy;
        this.renderReelSymbol(reel, dummy, reel.previousSymbolText, reel.previousSymbolGraphic);
      });

      const initialR1 = spinResult.initial_stops[0];
      const initialR2 = ''; // BLANK star stop on Reel 2
      const initialR3 = spinResult.initial_stops[2];

      // Sequential stops: Reel 1 -> Reel 2 -> Reel 3
      const r1Delay = turboMode === 'instant' ? 120 : turboMode === 'turbo' ? 400 : 700;
      const r2Delay = turboMode === 'instant' ? 120 : turboMode === 'turbo' ? 300 : 400;
      const r3Delay = turboMode === 'instant' ? 120 : turboMode === 'turbo' ? 300 : 400;

      await this.delay(r1Delay);
      await this.stopReelWithSpring(0, initialR1);
      this.events.onReelStop?.(0, initialR1);

      await this.delay(r2Delay);
      await this.stopReelWithSpring(1, initialR2);
      this.events.onReelStop?.(1, initialR2);

      await this.delay(r3Delay);
      await this.stopReelWithSpring(2, initialR3);
      this.events.onReelStop?.(2, initialR3);

      // --- Stage 1: Near-Miss Pause ---
      // Reels stop sequentially (1 -> 2 -> 3). Allow 500ms suspense pause while handbook displays: "Near Miss! Reel 2 Missed..."
      this.events.onNearMissPause?.(spinResult.initial_stops);
      await this.delay(turboMode === 'instant' ? 250 : 500);

      // --- Stage 2: The Red-Spin Alarm ---
      // Flash reel casing & background with urgent comic red strobe (#FF0033), play escalating mechanical siren
      this.events.onRedSpinAlarm?.();
      soundEngine.playRedSpinAlarm();
      this.triggerRedSpinStrobe(1);
      await this.delay(turboMode === 'instant' ? 250 : 500);

      // --- Stage 3: Re-Spin Resolution ---
      // Reel 2 blurs vertically with red speed lines and snaps into place on '0' or '5', bridging the gap
      this.startReelRedSpin(1);
      const respinDuration = turboMode === 'instant' ? 350 : turboMode === 'turbo' ? 500 : 900;
      await this.delay(respinDuration);

      const salvagedStop = spinResult.stops[1]; // '0' or '5'
      await this.stopReelWithSpring(1, salvagedStop);
      soundEngine.playRedSpinSnap();
      this.stopReelRedSpin(1);

      this.events.onRedSpinBridged?.(spinResult.stops);
      await this.delay(turboMode === 'instant' ? 150 : 350);

      // --- Stage 4: Resolve Reel 4 Multiplier ---
      const finalBooster = spinResult.stops[3];
      await this.stopReelWithSpring(3, finalBooster);
      this.events.onReelStop?.(3, finalBooster);

      await this.delay(300);
      this.clearRedSpinStrobe();

      // Check for booster impacts / special events on Reel 4
      if (spinResult.isRespin && spinResult.respinNewStop) {
        await this.delay(turboMode === 'turbo' ? 250 : 400);
        await this.executePurpleRespin(spinResult, turboMode);
      } else if (spinResult.isWheel && spinResult.wheelWedge) {
        this.events.onWheelStart?.(spinResult.wheelWedge);
        await this.delay(turboMode === 'turbo' ? 250 : 400);
        if (this.events.onWheelTrigger) {
          await this.events.onWheelTrigger(spinResult.wheelWedge);
        }
        this.events.onWheelEnd?.(spinResult.wheelWedge);
      } else {
        if (spinResult.creditsWon > 0) {
          if (spinResult.multiplier > 1) {
            soundEngine.playBoosterImpact('multiplier');
          }
          if (spinResult.creditsWon >= 100) {
            this.triggerConfetti();
            soundEngine.playJackpotFanfare();
          }
        }
      }

      await this.delay(60);
      this.isSpinning = false;
      this.events.onSpinComplete?.(spinResult);
      return;
    }

    const initialStopsToLand = (spinResult.isRespin && spinResult.initial_stops)
      ? spinResult.initial_stops
      : spinResult.stops;

    // Handle standard INSTANT mode
    if (turboMode === 'instant') {
      for (let i = 0; i < 4; i++) {
        this.stopReelInstant(i, initialStopsToLand[i]);
        this.events.onReelStop?.(i, initialStopsToLand[i]);
      }

      // Solenoid audio feedback for instant stop
      soundEngine.playSolenoidClunk(0);
      const boosterSymbol = initialStopsToLand[3];
      if (boosterSymbol && ['2X', '3X', '5X', '10X', 'RESPIN', 'WHEEL'].includes(boosterSymbol)) {
        if (boosterSymbol === 'RESPIN') {
          soundEngine.playBoosterImpact('respin');
        } else if (boosterSymbol === 'WHEEL') {
          soundEngine.playBoosterImpact('wheel');
        } else {
          soundEngine.playBoosterImpact('multiplier');
        }
      }

      // Check for special events
      if (spinResult.isRespin && spinResult.respinNewStop) {
        await this.delay(100);
        await this.executePurpleRespin(spinResult, turboMode);
      } else if (spinResult.isWheel && spinResult.wheelWedge) {
        this.events.onWheelStart?.(spinResult.wheelWedge);
        await this.delay(100);
        if (this.events.onWheelTrigger) {
          await this.events.onWheelTrigger(spinResult.wheelWedge);
        }
        this.events.onWheelEnd?.(spinResult.wheelWedge);
      } else {
        if (spinResult.creditsWon > 0) {
          if (spinResult.multiplier > 1) {
            soundEngine.playBoosterImpact('multiplier');
          }
          if (spinResult.creditsWon >= 100) {
            this.triggerConfetti();
            soundEngine.playJackpotFanfare();
          }
        }
      }

      await this.delay(60);
      this.isSpinning = false;
      this.events.onSpinComplete?.(spinResult);
      return;
    }

    // Start all 4 reels spinning
    this.reels.forEach((reel, idx) => {
      reel.isSpinning = true;
      reel.blurSpeed = 1.0;
      reel.targetSymbol = initialStopsToLand[idx];
      reel.offsetY = 0;
      reel.symbolsContainer.position.y = 0;

      // Seed previousSymbol with a fresh spinning dummy symbol above the reel
      const dummy = reel.isBooster
        ? ['2X', '3X', '5X', '10X', 'RESPIN', 'WHEEL'][Math.floor(Math.random() * 6)]
        : ['1', '2', '5', '10', '0', '00'][Math.floor(Math.random() * 6)];
      reel.previousSymbol = dummy;
      this.renderReelSymbol(reel, dummy, reel.previousSymbolText, reel.previousSymbolGraphic);
    });

    if (turboMode === 'turbo') {
      // TURBO MODE: Reel 1 spins and stops first
      await this.delay(450);
      await this.stopReelWithSpring(0, initialStopsToLand[0]);
      this.events.onReelStop?.(0, initialStopsToLand[0]);

      // Check if player missed the first reel (Reel 1 is blank)
      const isReel1Miss = !initialStopsToLand[0] || initialStopsToLand[0] === '' || initialStopsToLand[0] === 'BLANK';

      if (isReel1Miss) {
        // Missed Reel 1! Instantly skip reels 2 & 3
        this.stopReelInstant(1, initialStopsToLand[1]);
        this.events.onReelStop?.(1, initialStopsToLand[1]);
        this.stopReelInstant(2, initialStopsToLand[2]);
        this.events.onReelStop?.(2, initialStopsToLand[2]);
        soundEngine.playSolenoidClunk(1);

        // Reel 4 drops in quickly right after
        await this.delay(150);
        await this.stopReelWithSpring(3, initialStopsToLand[3]);
        this.events.onReelStop?.(3, initialStopsToLand[3]);
      } else {
        // Reel 1 was a HIT! Keep the win suspense alive across remaining reels
        await this.delay(350);
        await this.stopReelWithSpring(1, initialStopsToLand[1]);
        this.events.onReelStop?.(1, initialStopsToLand[1]);

        await this.delay(350);
        await this.stopReelWithSpring(2, initialStopsToLand[2]);
        this.events.onReelStop?.(2, initialStopsToLand[2]);

        await this.delay(350);
        await this.stopReelWithSpring(3, initialStopsToLand[3]);
        this.events.onReelStop?.(3, initialStopsToLand[3]);
      }
    } else {
      // NORMAL 'OFF' MODE: Sequential stop timings (Reel 1 at 700ms, Reel 2 at 1100ms, Reel 3 at 1500ms, Reel 4 at 1900ms)
      const stopDelays = [700, 1100, 1500, 1900];

      for (let i = 0; i < 4; i++) {
        await this.delay(stopDelays[i] - (i === 0 ? 0 : stopDelays[i - 1]));
        await this.stopReelWithSpring(i, initialStopsToLand[i]);
        this.events.onReelStop?.(i, initialStopsToLand[i]);
      }
    }

    // Check for special events
    if (spinResult.isRespin && spinResult.respinNewStop) {
      await this.delay(turboMode === 'turbo' ? 250 : 400);
      await this.executePurpleRespin(spinResult, turboMode);
    } else if (spinResult.isWheel && spinResult.wheelWedge) {
      this.events.onWheelStart?.(spinResult.wheelWedge);
      await this.delay(turboMode === 'turbo' ? 250 : 400);
      if (this.events.onWheelTrigger) {
        await this.events.onWheelTrigger(spinResult.wheelWedge);
      }
      this.events.onWheelEnd?.(spinResult.wheelWedge);
    } else {
      if (spinResult.creditsWon > 0) {
        if (spinResult.multiplier > 1) {
          soundEngine.playBoosterImpact('multiplier');
        }
        if (spinResult.creditsWon >= 100) {
          this.triggerConfetti();
          soundEngine.playJackpotFanfare();
        }
      }
    }

    this.isSpinning = false;
    this.events.onSpinComplete?.(spinResult);
  }

  /**
   * Instantly stops a reel without spring oscillation (used for instant mode and skipping reels)
   */
  private stopReelInstant(reelIndex: number, finalSymbol: string): void {
    const reel = this.reels[reelIndex];
    if (!reel) return;

    reel.isSpinning = false;
    reel.symbolsContainer.position.y = 0;
    reel.offsetY = 0;

    reel.currentSymbol = finalSymbol;
    this.renderReelSymbol(reel, finalSymbol, reel.currentSymbolText, reel.currentSymbolGraphic);
    reel.previousSymbol = '';
    this.renderReelSymbol(reel, '', reel.previousSymbolText, reel.previousSymbolGraphic);
    reel.nextSymbolText.text = '';
  }

  /**
   * Stop reel with physical mechanical spring overshoot (back.out easing)
   */
  private async stopReelWithSpring(reelIndex: number, finalSymbol: string): Promise<void> {
    const reel = this.reels[reelIndex];
    if (!reel) return;

    reel.isSpinning = false;
    reel.symbolsContainer.position.y = 0;
    reel.offsetY = 0;

    reel.currentSymbol = finalSymbol;
    this.renderReelSymbol(reel, finalSymbol, reel.currentSymbolText, reel.currentSymbolGraphic);
    reel.previousSymbol = '';
    this.renderReelSymbol(reel, '', reel.previousSymbolText, reel.previousSymbolGraphic);
    reel.nextSymbolText.text = '';

    // Play Solenoid Mechanical Clunk
    if (reel.isBooster) {
      if (finalSymbol === 'RESPIN') {
        soundEngine.playBoosterImpact('respin');
      } else if (finalSymbol === 'WHEEL') {
        soundEngine.playBoosterImpact('wheel');
      } else {
        soundEngine.playBoosterImpact('multiplier');
      }
    } else {
      soundEngine.playSolenoidClunk(reelIndex);
    }

    // Mechanical spring bounce (back.out overshoot)
    const overshootY = this.isMobile ? 18 : 28;
    const duration = 180;
    const start = performance.now();

    return new Promise((resolve) => {
      const animateBounce = (time: number) => {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1.0);

        // Spring oscillation formula
        const bounce = Math.sin(progress * Math.PI) * (1 - progress) * overshootY;
        reel.symbolsContainer.position.y = bounce;

        if (progress < 1.0) {
          requestAnimationFrame(animateBounce);
        } else {
          reel.symbolsContainer.position.y = 0;
          resolve();
        }
      };
      requestAnimationFrame(animateBounce);
    });
  }

  /**
   * Executes the Purple Respin Event
   * Landing a Respin causes not only Reel 4 to respin, but any of the first three reels which are empty.
   */
  private async executePurpleRespin(spinResult: SpinResult, turboMode: TurboMode = 'off'): Promise<void> {
    const emptyReels = spinResult.respinEmptyReels || [];
    const lockedReels = spinResult.respinLockedReels || [0, 1, 2].filter((i) => !emptyReels.includes(i));
    const reelsToRespin = [...emptyReels, 3]; // Empty reels + Booster Reel 4

    this.events.onRespinStart?.(emptyReels, lockedReels);

    // Lock non-empty reels among reels 1-3 with Glowing Purple Neon Aura
    lockedReels.forEach((reelIdx) => {
      this.reels[reelIdx].isLocked = true;
      this.reels[reelIdx].lockGlow.visible = true;
    });

    soundEngine.playBoosterImpact('respin');
    const prepDelay = turboMode === 'instant' ? 100 : turboMode === 'turbo' ? 350 : 650;
    await this.delay(prepDelay);

    // Start all respinning reels spinning (empty reels + Reel 4)
    reelsToRespin.forEach((reelIdx) => {
      const reel = this.reels[reelIdx];
      reel.isSpinning = true;
      reel.blurSpeed = turboMode === 'instant' ? 2.5 : 1.5;
      reel.offsetY = 0;
      reel.symbolsContainer.position.y = 0;

      const dummy = reel.isBooster
        ? ['2X', '3X', '5X', '10X', 'RESPIN', 'WHEEL'][Math.floor(Math.random() * 6)]
        : ['1', '2', '5', '10', '0', '00'][Math.floor(Math.random() * 6)];
      reel.previousSymbol = dummy;
      this.renderReelSymbol(reel, dummy, reel.previousSymbolText, reel.previousSymbolGraphic);
    });

    // Spin duration & sequential stops
    if (turboMode === 'instant') {
      reelsToRespin.forEach((reelIdx) => {
        const finalSym = spinResult.stops[reelIdx];
        this.stopReelInstant(reelIdx, finalSym);
        this.events.onReelStop?.(reelIdx, finalSym);
      });
      soundEngine.playBoosterImpact('multiplier');
    } else if (turboMode === 'turbo') {
      await this.delay(350);
      for (const reelIdx of reelsToRespin) {
        const finalSym = spinResult.stops[reelIdx];
        await this.stopReelWithSpring(reelIdx, finalSym);
        this.events.onReelStop?.(reelIdx, finalSym);
        if (reelIdx !== 3) {
          await this.delay(180);
        }
      }
      soundEngine.playBoosterImpact('multiplier');
    } else {
      // Normal 'off' mode: suspenseful mechanical stepper sequential stopping
      await this.delay(500);

      // Sort reels in order (0, 1, 2, 3)
      const sortedRespinReels = [...reelsToRespin].sort((a, b) => a - b);
      for (let i = 0; i < sortedRespinReels.length; i++) {
        const reelIdx = sortedRespinReels[i];
        const finalSym = spinResult.stops[reelIdx];
        await this.stopReelWithSpring(reelIdx, finalSym);
        this.events.onReelStop?.(reelIdx, finalSym);
        if (i < sortedRespinReels.length - 1) {
          await this.delay(320);
        }
      }
      soundEngine.playBoosterImpact('multiplier');
    }

    this.events.onRespinEnd?.(spinResult);

    if (spinResult.creditsWon >= 100) {
      this.triggerConfetti();
      soundEngine.playJackpotFanfare();
    }
  }

  /**
   * Triggers the urgent comic red strobe (#FF0033) on Reel 2 and surrounding casing
   */
  public triggerRedSpinStrobe(reelIndex = 1): void {
    const reel = this.reels[reelIndex];
    if (!reel) return;

    const rw = this.activeReelWidth || (this.isMobile ? 88 : 156);
    const rh = this.activeReelHeight || Math.floor(rw * 1.62);

    reel.redStrobe.clear();
    reel.redStrobe.visible = true;

    // Glowing comic red strobe border around Reel 2
    reel.redStrobe
      .roundRect(-8, -8, rw + 16, rh + 16, 20)
      .stroke({ width: 8, color: 0xff0033, alpha: 0.95 });
    reel.redStrobe
      .roundRect(-2, -2, rw + 4, rh + 4, 16)
      .stroke({ width: 4, color: 0xff3366, alpha: 0.8 });

    // Flash strobe pulse
    let flashCount = 0;
    const interval = setInterval(() => {
      flashCount++;
      const show = flashCount % 2 === 1;
      reel.redStrobe.visible = show;
      if (flashCount >= 8) {
        clearInterval(interval);
        reel.redStrobe.visible = true;
      }
    }, 60);
  }

  public clearRedSpinStrobe(): void {
    this.reels.forEach((r) => {
      r.redStrobe.clear();
      r.redStrobe.visible = false;
      r.speedLines.clear();
      r.speedLines.visible = false;
      r.isRedSpinning = false;
    });
  }

  public startReelRedSpin(reelIndex = 1): void {
    const reel = this.reels[reelIndex];
    if (!reel) return;
    reel.isSpinning = true;
    reel.isRedSpinning = true;
    reel.blurSpeed = 1.8;
  }

  public stopReelRedSpin(reelIndex = 1): void {
    const reel = this.reels[reelIndex];
    if (!reel) return;
    reel.isRedSpinning = false;
    reel.speedLines.clear();
    reel.speedLines.visible = false;
  }

  /**
   * Confetti celebration burst
   */
  private triggerConfetti(): void {
    try {
      confetti({
        particleCount: this.isMobile ? 60 : 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#39FF14', '#BC13FE', '#FF1744', '#FFFFFF'],
      });
    } catch {
      // Confetti fallback
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.app) {
      this.app.ticker.remove(this.update, this);
      if (this.app.canvas && this.app.canvas.parentNode) {
        this.app.canvas.parentNode.removeChild(this.app.canvas);
      }
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
  }
}
