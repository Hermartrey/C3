import React from 'react';

/**
 * C3Favicon component matching the official C3 blue & gold flame icon from favicon.svg.
 * Renders an inline SVG with vector fidelity and print-color-adjust for crisp printing.
 */
const C3Favicon = ({ size = 52, className = '', style = {} }) => {
  return (
    <div
      className={`c3-favicon-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        ...style
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        width={size}
        height={size}
        style={{ display: 'block', width: '100%', height: '100%' }}
        aria-label="C3 Fuels Favicon Logo"
      >
        <defs>
          {/* Blue Flame Gradient: Ice Blue / Cyan to Royal Blue */}
          <linearGradient id="printFavBlueFlameGrad" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#80d8ff" />
            <stop offset="35%" stopColor="#00b0ff" />
            <stop offset="70%" stopColor="#0288d1" />
            <stop offset="100%" stopColor="#0d47a1" />
          </linearGradient>

          {/* Deep Blue Flame Core */}
          <linearGradient id="printFavBlueCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0288d1" />
            <stop offset="100%" stopColor="#01579b" />
          </linearGradient>

          {/* Gold/Yellow Flame Gradient */}
          <linearGradient id="printFavGoldFlameGrad" x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%" stopColor="#fff59d" />
            <stop offset="25%" stopColor="#ffd54f" />
            <stop offset="60%" stopColor="#ff9800" />
            <stop offset="100%" stopColor="#e65100" />
          </linearGradient>

          {/* Soft 3D Glow Shadow */}
          <filter id="printFavFlameShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.45" />
          </filter>
        </defs>

        <g filter="url(#printFavFlameShadow)">
          {/* Main Outer Blue Flame Swirl */}
          <path
            d="M 54 8 C 46 20 24 38 22 62 C 20 80 34 98 52 98 C 38 96 32 84 34 70 C 36 52 50 36 56 22 C 58 16 56 10 54 8 Z"
            fill="url(#printFavBlueFlameGrad)"
            stroke="#e0f7fa"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Interlocking Blue Inner Wing */}
          <path
            d="M 44 22 C 38 34 32 50 36 68 C 40 82 52 86 58 82 C 48 80 44 70 46 58 C 48 44 58 32 56 22 C 52 20 48 20 44 22 Z"
            fill="url(#printFavBlueCoreGrad)"
            stroke="#80d8ff"
            strokeWidth="0.75"
          />

          {/* Top Blue Flame Peak */}
          <path
            d="M 64 6 C 60 14 54 26 56 40 C 58 54 68 64 74 60 C 66 58 62 50 62 40 C 62 28 68 18 64 6 Z"
            fill="url(#printFavBlueFlameGrad)"
            stroke="#ffffff"
            strokeWidth="1"
          />

          {/* Interlocking Gold/Yellow Right Flame Swirl */}
          <path
            d="M 66 6 C 62 16 62 30 76 44 C 90 58 98 72 88 94 C 78 110 52 108 38 100 C 54 104 74 102 82 88 C 90 74 84 60 72 48 C 62 38 60 22 66 6 Z"
            fill="url(#printFavGoldFlameGrad)"
            stroke="#fffde7"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Bottom Gold Flame Under-Tail Swirl */}
          <path
            d="M 38 100 C 48 104 62 102 72 94 C 80 86 82 74 76 64 C 78 74 74 84 66 90 C 56 96 46 96 38 100 Z"
            fill="url(#printFavGoldFlameGrad)"
            stroke="#ffe082"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
};

export default C3Favicon;
