'use client';

import React, { memo, useMemo } from 'react';
import AppImage from './AppImage';

interface AppLogoProps {
  src?: string; // Image source (optional)
  size?: number; // Size for the logo (width/height)
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
}

const AppLogo = memo(function AppLogo({
  src = '',
  size = 36,
  className = '',
  onClick,
}: AppLogoProps) {
  // Memoize className calculation
  const containerClassName = useMemo(() => {
    const classes = ['flex items-center justify-center flex-shrink-0'];
    if (onClick) classes.push('cursor-pointer hover:opacity-90 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  return (
    <div className={containerClassName} onClick={onClick}>
      {src ? (
        <AppImage
          src={src}
          alt="Logo"
          width={size}
          height={size}
          className="flex-shrink-0 object-contain"
          priority={true}
          unoptimized={src.endsWith('.svg')}
        />
      ) : (
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <defs>
            {/* Green Ribbon Gradient (Front Stem) */}
            <linearGradient id="nzilaGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84cc16" /> {/* Lime 500 */}
              <stop offset="50%" stopColor="#10b981" /> {/* Emerald 500 */}
              <stop offset="100%" stopColor="#059669" /> {/* Emerald 600 */}
            </linearGradient>

            {/* Dark Green Loop (Depth Layer) */}
            <linearGradient id="nzilaDarkGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#047857" /> {/* Emerald 700 */}
              <stop offset="100%" stopColor="#064e3b" /> {/* Emerald 900 */}
            </linearGradient>

            {/* Blue Ribbon Gradient */}
            <linearGradient id="nzilaBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" /> {/* Sky 500 */}
              <stop offset="100%" stopColor="#2563eb" /> {/* Blue 600 */}
            </linearGradient>

            {/* Road (Highway) Gradient */}
            <linearGradient id="nzilaRoadGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0b1329" /> {/* Deep Indigo-Slate */}
              <stop offset="60%" stopColor="#1e3a8a" /> {/* Navy Blue */}
              <stop offset="100%" stopColor="#1d4ed8" /> {/* Royal Blue */}
            </linearGradient>
          </defs>

          {/* Left Ribbon Back Fold (Dark Green Loop Background) */}
          <path
            d="M 24,32 C 24,24 31,24 32,24 C 33,24 34,26 34,32 L 34,50 L 24,50 Z"
            fill="url(#nzilaDarkGreenGrad)"
          />

          {/* Left Ribbon Front Loop & Stem (Green Gradient) */}
          <path
            d="M 12,80 L 12,32 C 12,18 20,12 32,12 C 44,12 46,22 46,32 L 46,80 L 34,80 L 34,32 C 34,26 33,24 32,24 C 31,24 24,26 24,32 L 24,80 Z"
            fill="url(#nzilaGreenGrad)"
          />

          {/* Right Ribbon Stem (Blue Gradient) */}
          <path d="M 76,20 L 88,20 L 88,80 L 76,80 Z" fill="url(#nzilaBlueGrad)" />

          {/* Right Ribbon Top Corner Green Cap */}
          <path d="M 76,20 L 88,20 L 88,12 C 88,12 82,11 76,14 Z" fill="#84cc16" />

          {/* Diagonal Highway (Road) */}
          <path d="M 5,80 Q 40,50 80,10 L 92,20 Q 52,60 25,90 Z" fill="url(#nzilaRoadGrad)" />

          {/* Center Road Dashes (Lane Markings) */}
          <path
            d="M 15,85 Q 46,55 86,15"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray="5 7"
          />
        </svg>
      )}
    </div>
  );
});

export default AppLogo;
