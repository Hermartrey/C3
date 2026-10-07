import React from 'react';

/**
 * C3FuelsLogo component matching the official C3 Fuels 3D gradient logo:
 * - "C3": Heavy bold gold/copper 3D gradient fill with dark outline.
 * - "Fuels": Slanted/italic cyan/ice-blue 3D metallic gradient fill with dark outline.
 * - Optional royal blue background box matching the physical sign aesthetics.
 */
const C3FuelsLogo = ({ 
  height = 42, 
  variant = 'full', // 'full' (with royal blue sign background) or 'plain' (transparent background)
  style = {}, 
  className = '' 
}) => {
  const isFull = variant === 'full';

  return (
    <div 
      className={`c3-fuels-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isFull 
          ? 'linear-gradient(180deg, #1d4699 0%, #163678 100%)' 
          : 'transparent',
        padding: isFull ? '0.4rem 0.9rem' : '0',
        borderRadius: isFull ? '8px' : '0',
        boxShadow: isFull 
          ? '0 4px 14px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.2)' 
          : 'none',
        border: isFull ? '1px solid rgba(255,255,255,0.15)' : 'none',
        userSelect: 'none',
        ...style
      }}
    >
      <svg
        viewBox="0 0 310 70"
        height={height}
        style={{ width: 'auto', display: 'block', overflow: 'visible' }}
        aria-label="C3 Fuels Logo"
      >
        <defs>
          {/* C3 Gold / Copper 3D Gradient */}
          <linearGradient id="c3GoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF49C" />
            <stop offset="25%" stopColor="#F5B041" />
            <stop offset="65%" stopColor="#DC7633" />
            <stop offset="100%" stopColor="#935116" />
          </linearGradient>

          {/* C3 3D Bevel Dark Stroke */}
          <linearGradient id="c3StrokeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7E5109" />
            <stop offset="100%" stopColor="#3E1A00" />
          </linearGradient>

          {/* Fuels Ice-Blue Cyan Gradient */}
          <linearGradient id="fuelsCyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="22%" stopColor="#C5F2FF" />
            <stop offset="55%" stopColor="#46B5F6" />
            <stop offset="88%" stopColor="#0277BD" />
            <stop offset="100%" stopColor="#014A78" />
          </linearGradient>

          {/* Fuels Stroke */}
          <linearGradient id="fuelsStrokeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0288D1" />
            <stop offset="100%" stopColor="#002137" />
          </linearGradient>

          {/* Soft 3D drop shadow filter for realistic depth */}
          <filter id="c3Shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="2" dy="4" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.75" />
          </filter>

          <filter id="fuelsShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="2.5" dy="4" stdDeviation="1.8" floodColor="#041838" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* C3 Text */}
        <g filter="url(#c3Shadow)">
          {/* Bevel Shadow Copy for 3D depth effect */}
          <text
            x="8"
            y="55"
            fill="#3E1A00"
            fontSize="58"
            fontWeight="900"
            fontFamily="'Arial Black', 'Montserrat', 'Outfit', sans-serif"
            letterSpacing="-1px"
          >
            C3
          </text>
          {/* Main C3 Text */}
          <text
            x="6"
            y="53"
            fill="url(#c3GoldGrad)"
            stroke="url(#c3StrokeGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fontSize="58"
            fontWeight="900"
            fontFamily="'Arial Black', 'Montserrat', 'Outfit', sans-serif"
            letterSpacing="-1px"
          >
            C3
          </text>
        </g>

        {/* Fuels Text (Italic & Metallic Ice Blue) */}
        <g filter="url(#fuelsShadow)" transform="skewX(-6) translate(8, 0)">
          {/* Bevel Shadow Copy */}
          <text
            x="105"
            y="55"
            fill="#001B30"
            fontSize="58"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="'Trebuchet MS', 'Arial Black', sans-serif"
            letterSpacing="-0.5px"
          >
            Fuels
          </text>
          {/* Main Fuels Text */}
          <text
            x="103"
            y="53"
            fill="url(#fuelsCyanGrad)"
            stroke="url(#fuelsStrokeGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fontSize="58"
            fontWeight="900"
            fontStyle="italic"
            fontFamily="'Trebuchet MS', 'Arial Black', sans-serif"
            letterSpacing="-0.5px"
          >
            Fuels
          </text>
        </g>
      </svg>
    </div>
  );
};

export default C3FuelsLogo;
