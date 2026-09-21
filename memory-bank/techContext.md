# Tech Context: Technologies, Constraints & Standards

## Technology Stack
- **Framework**: React 19 + TypeScript + Vite
- **Canvas Engine**: PixiJS v8 (`pixi.js`)
- **Styling**: Tailwind CSS v4 + Lucide React icons
- **Audio**: Native Web Audio API (zero external sound files)
- **Animation**: PixiJS v8 Ticker + CSS transitions + Motion

## Design Constraints & Standards
- **Font Stack**: MICR E-13B / Federal Reserve slab typography loaded via Google Fonts / `@font-face` (Courier Prime / Segmented / Roboto Slab / Canvas vector fallback).
- **Color Palette**:
  - Bumblebee taxi-cab yellow: `#FFD700`
  - Jet-black framing: `#0A0A0A`
  - Clean white reel windows: `#FFFFFF`
  - Lime green booster: `#39FF14`
  - Comic neon purple: `#BC13FE`
  - Vintage greenback currency: `#1b4332`, `#2d6a4f`, `#d8f3dc`, `#081c15`
- **Port & Host Constraints**: Port 3000, Vite dev server, client-only SPA architecture.
