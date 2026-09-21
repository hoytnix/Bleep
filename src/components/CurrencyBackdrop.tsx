import React from 'react';

interface CurrencyBackdropProps {
  isRespin?: boolean;
}

export const CurrencyBackdrop: React.FC<CurrencyBackdropProps> = ({ isRespin = false }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none transition-colors duration-500 overflow-hidden ${
        isRespin ? 'bg-[#2a0845]' : 'bg-[#061e12]'
      }`}
    >
      {/* Vintage Guilloche Currency SVG Pattern */}
      <svg
        className="w-full h-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="guilloche-pattern"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            {/* Concentric ornate rosettes & banknote lathe linework */}
            <circle cx="60" cy="60" r="50" fill="none" stroke="#2d6a4f" strokeWidth="1" opacity="0.6" />
            <circle cx="60" cy="60" r="40" fill="none" stroke="#52b788" strokeWidth="1.2" opacity="0.5" />
            <circle cx="60" cy="60" r="30" fill="none" stroke="#74c69d" strokeWidth="1.5" opacity="0.7" />
            <circle cx="60" cy="60" r="20" fill="none" stroke="#95d5b2" strokeWidth="1.2" opacity="0.6" />
            <circle cx="60" cy="60" r="10" fill="none" stroke="#d8f3dc" strokeWidth="1" opacity="0.8" />

            {/* Cross-hatch banknote geometric engraving */}
            <path
              d="M0 60 Q 30 10, 60 60 T 120 60 M0 60 Q 30 110, 60 60 T 120 60"
              fill="none"
              stroke="#52b788"
              strokeWidth="0.8"
              opacity="0.45"
            />
            <path
              d="M60 0 Q 10 30, 60 60 T 60 120 M60 0 Q 110 30, 60 60 T 60 120"
              fill="none"
              stroke="#52b788"
              strokeWidth="0.8"
              opacity="0.45"
            />

            {/* Corner ornate geometric flourishes */}
            <path d="M0 0 L 25 25 M120 0 L 95 25 M0 120 L 25 95 M120 120 L 95 95" stroke="#74c69d" strokeWidth="1" opacity="0.4" />
          </pattern>

          {/* Halftone dot pattern for Respin state */}
          <pattern id="respin-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="4" fill="#bc13fe" opacity="0.35" />
            <circle cx="0" cy="0" r="2" fill="#e040fb" opacity="0.4" />
            <circle cx="24" cy="24" r="2" fill="#e040fb" opacity="0.4" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#guilloche-pattern)" />
        {isRespin && <rect width="100%" height="100%" fill="url(#respin-dots)" />}
      </svg>

      {/* Stylized Vintage Dollar Bill Corner Badges */}
      <div className="absolute top-3 left-4 text-[#52b788]/25 font-black text-6xl select-none font-serif tracking-tighter">
        ONE
      </div>
      <div className="absolute top-3 right-4 text-[#52b788]/25 font-black text-6xl select-none font-serif tracking-tighter">
        ONE
      </div>
      <div className="absolute bottom-3 left-4 text-[#52b788]/25 font-black text-6xl select-none font-serif tracking-tighter">
        ONE
      </div>
      <div className="absolute bottom-3 right-4 text-[#52b788]/25 font-black text-6xl select-none font-serif tracking-tighter">
        ONE
      </div>

      {/* Radial vignette for depth */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80" />
    </div>
  );
};
