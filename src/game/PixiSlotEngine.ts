import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import confetti from 'canvas-confetti';
import { SpinResult, WheelWedge, WHEEL_WEDGES } from './math';
import { soundEngine } from './AudioEngine';

export interface PixiSlotEngineEvents {
  onSpinStart?: () => void;
  onReelStop?: (reelIndex: number, symbol: string) => void;
  onRespinStart?: () => void;
  onRespinEnd?: (newBooster: string) => void;
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
          fontFamily: 'Chakra Petch, Rubik Mono One, Courier Prime, monospace',
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
          fontFamily: 'Chakra Petch, Rubik Mono One, sans-serif',
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
        fontFamily: 'Chakra Petch, Rubik Mono One, Courier Prime, monospace',
        fontSize: Math.max(26, Math.floor(rw * 0.38)),
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

    // Reels 1-3 MICR Banknote Numeral Style (Yellow with heavy black drop shadow)
    const isWide = text === '10' || text === '00';
    return new TextStyle({
      fontFamily: 'Courier Prime, Chakra Petch, monospace',
      fontSize: Math.max(30, Math.floor(rw * (isWide ? 0.38 : 0.52))),
      fontWeight: '900',
      fill: 0xffd700, // taxi-cab yellow
      stroke: { width: Math.max(4, Math.floor(rw * 0.05)), color: 0x0a0a0a },
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
    const gap = Math.max(4, Math.min(14, Math.floor(width * 0.014)));
    const paddingX = Math.max(6, Math.min(18, Math.floor(width * 0.02)));
    const paddingY = Math.max(3, Math.min(8, Math.floor(height * 0.02)));

    const availableWidth = width - paddingX * 2;
    const availableHeight = height - paddingY * 2;

    // Stepper reel aspect ratio: 1.42 fills vertical reel height snugly
    const aspect = 1.42;
    const maxReelWidthByHeight = Math.floor((availableHeight * 0.98) / aspect);
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
        // Booster Lime-Green Casing (#39FF14 / #65a30d)
        reel.bg
          .roundRect(0, 0, reelWidth, reelHeight, 14)
          .fill({ color: 0x84cc16 })
          .stroke({ width: 4, color: 0x0a0a0a });

        // Header band
        const headerH = Math.max(22, Math.floor(reelHeight * 0.14));
        reel.bg
          .rect(0, 0, reelWidth, headerH)
          .fill({ color: 0x65a30d })
          .stroke({ width: 2, color: 0x0a0a0a });

        // 4th Reel Header Star (replacing "BOOSTER REEL" text)
        const oldBanner = reel.container.getChildByName('booster_banner');
        if (oldBanner) {
          reel.container.removeChild(oldBanner);
        }

        reel.starTop.clear();
        const headerStarRadius = Math.max(7, Math.floor(headerH * 0.3));
        this.drawStar(reel.starTop, reelWidth / 2, headerH / 2, headerStarRadius);
        reel.starTop.visible = true;
        reel.starBottom.visible = false;
      } else {
        // Classic White Reel with Yellow Framing
        reel.bg
          .roundRect(0, 0, reelWidth, reelHeight, 14)
          .fill({ color: 0xffffff });

        // Subtle shaded bands at top & bottom
        const bandH = Math.max(24, Math.floor(reelHeight * 0.16));
        reel.bg.rect(0, 0, reelWidth, bandH).fill({ color: 0xf1f5f9 });
        reel.bg.rect(0, reelHeight - bandH, reelWidth, bandH).fill({ color: 0xf1f5f9 });

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

    this.reels.forEach((reel) => {
      if (reel.isSpinning) {
        reel.offsetY += reel.blurSpeed * dt * 26;

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
   * Performs the full Spin Cycle with sequential stop timing and spring overshoot
   */
  public async spin(spinResult: SpinResult): Promise<void> {
    if (this.isSpinning) return;
    this.isSpinning = true;

    this.events.onSpinStart?.();

    // Reset lock glows
    this.reels.forEach((r) => {
      r.isLocked = false;
      r.lockGlow.visible = false;
    });

    // Start all 4 reels spinning
    this.reels.forEach((reel, idx) => {
      reel.isSpinning = true;
      reel.blurSpeed = 1.0;
      reel.targetSymbol = spinResult.stops[idx];
      reel.offsetY = 0;
      reel.symbolsContainer.position.y = 0;

      // Seed previousSymbol with a fresh spinning dummy symbol above the reel
      const dummy = reel.isBooster
        ? ['2X', '3X', '5X', '10X', 'RESPIN', 'WHEEL'][Math.floor(Math.random() * 6)]
        : ['1', '2', '5', '10', '0', '00'][Math.floor(Math.random() * 6)];
      reel.previousSymbol = dummy;
      this.renderReelSymbol(reel, dummy, reel.previousSymbolText, reel.previousSymbolGraphic);
    });

    // Sequential stop timings (Reel 1 at 700ms, Reel 2 at 1100ms, Reel 3 at 1500ms, Reel 4 at 1900ms)
    const stopDelays = [700, 1100, 1500, 1900];

    for (let i = 0; i < 4; i++) {
      await this.delay(stopDelays[i] - (i === 0 ? 0 : stopDelays[i - 1]));
      await this.stopReelWithSpring(i, spinResult.stops[i]);
      this.events.onReelStop?.(i, spinResult.stops[i]);
    }

    // Check for special events
    if (spinResult.isRespin && spinResult.respinNewStop) {
      await this.delay(400);
      await this.executePurpleRespin(spinResult);
    } else if (spinResult.isWheel && spinResult.wheelWedge) {
      this.events.onWheelStart?.(spinResult.wheelWedge);
      await this.delay(400);
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
   */
  private async executePurpleRespin(spinResult: SpinResult): Promise<void> {
    this.events.onRespinStart?.();

    // Lock Reels 1-3 with Glowing Purple Neon Aura
    for (let i = 0; i < 3; i++) {
      this.reels[i].isLocked = true;
      this.reels[i].lockGlow.visible = true;
    }

    soundEngine.playBoosterImpact('respin');
    await this.delay(700);

    // Respin Reel 4
    const boosterReel = this.reels[3];
    boosterReel.isSpinning = true;
    boosterReel.blurSpeed = 1.6;
    boosterReel.offsetY = 0;
    boosterReel.symbolsContainer.position.y = 0;
    const dummy = ['2X', '3X', '5X', '10X', 'RESPIN', 'WHEEL'][Math.floor(Math.random() * 6)];
    boosterReel.previousSymbol = dummy;
    this.renderReelSymbol(boosterReel, dummy, boosterReel.previousSymbolText, boosterReel.previousSymbolGraphic);

    // Spin for 1200ms then stop on upgraded multiplier
    await this.delay(1200);
    const newStop = spinResult.respinNewStop || '2X';
    await this.stopReelWithSpring(3, newStop);

    soundEngine.playBoosterImpact('multiplier');
    this.events.onRespinEnd?.(newStop);

    if (spinResult.creditsWon >= 100) {
      this.triggerConfetti();
      soundEngine.playJackpotFanfare();
    }
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
