import React from 'react';

interface CurrencyBackdropProps {
  isRespin?: boolean;
  isRedSpin?: boolean;
}

export const CurrencyBackdrop: React.FC<CurrencyBackdropProps> = ({ isRespin = false, isRedSpin = false }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-black">
      {/* App Background Image */}
      <img
        src="/bg.jpeg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        aria-hidden="true"
      />

      {/* Dynamic State Overlays for Special Events */}
      {isRespin && (
        <div className="absolute inset-0 bg-[#2a0845]/70 mix-blend-multiply transition-opacity duration-300 pointer-events-none" />
      )}

      {isRedSpin && (
        <>
          <div className="absolute inset-0 bg-[#450a0a]/75 mix-blend-multiply transition-opacity duration-300 pointer-events-none" />
          <div className="absolute inset-0 bg-[#FF0033]/25 animate-pulse transition-opacity duration-100 pointer-events-none" />
        </>
      )}

      {/* Subtle depth vignette */}
      <div
        className={`absolute inset-0 transition-colors duration-300 ${
          isRedSpin
            ? 'bg-radial from-transparent via-[#FF0033]/15 to-black/80'
            : isRespin
            ? 'bg-radial from-transparent via-[#bc13fe]/15 to-black/75'
            : 'bg-radial from-transparent via-black/20 to-black/60'
        }`}
      />
    </div>
  );
};

