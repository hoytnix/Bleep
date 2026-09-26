import React, { useState } from 'react';
import moneyBg from '../assets/bg.jpeg';

interface CurrencyBackdropProps {
  isRespin?: boolean;
  isRedSpin?: boolean;
}

export const CurrencyBackdrop: React.FC<CurrencyBackdropProps> = ({ isRespin = false, isRedSpin = false }) => {
  const [imgSrc, setImgSrc] = useState<string>(moneyBg || '/bg.jpeg');

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#051c0d]"
      style={{
        backgroundImage: `url(${imgSrc}), url('/bg.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* App Background Image */}
      <img
        src={imgSrc}
        onError={() => {
          if (imgSrc !== '/bg.jpeg') {
            setImgSrc('/bg.jpeg');
          }
        }}
        alt="Money Currency Backdrop"
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

      {/* Subtle depth vignette with valid CSS radial gradient */}
      <div
        className={`absolute inset-0 transition-colors duration-300 pointer-events-none ${
          isRedSpin
            ? 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,0,51,0.15)_60%,rgba(0,0,0,0.85)_100%)]'
            : isRespin
            ? 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(188,19,254,0.15)_60%,rgba(0,0,0,0.8)_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.55)_100%)]'
        }`}
      />
    </div>
  );
};

