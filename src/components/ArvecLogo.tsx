import React from 'react';

interface ArvecLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showSubtitle?: boolean;
  className?: string;
}

export const ArvecLogo: React.FC<ArvecLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    hero: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-base sm:text-lg font-extrabold tracking-tight',
    lg: 'text-xl sm:text-2xl font-black tracking-tight',
    hero: 'text-3xl sm:text-4xl font-black tracking-tighter',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Geometric Isometric Cube Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 drop-shadow-md`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform hover:scale-105 transition-transform duration-300"
        >
          <defs>
            <linearGradient id="topFacet" x1="50" y1="8" x2="50" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="leftFacet" x1="10" y1="48" x2="50" y2="92" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#082F49" />
            </linearGradient>
            <linearGradient id="rightFacet" x1="50" y1="48" x2="90" y2="92" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id="coreGold" x1="40" y1="35" x2="60" y2="65" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Isometric Hexagon Framework */}
          <polygon
            points="50,8 88,30 88,74 50,96 12,74 12,30"
            fill="#090D16"
            stroke="#1E293B"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Top Face of Cube */}
          <polygon
            points="50,14 82,32 50,50 18,32"
            fill="url(#topFacet)"
            stroke="#0284C7"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Left Face of Cube */}
          <polygon
            points="18,34 50,52 50,88 18,70"
            fill="url(#leftFacet)"
            stroke="#075985"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Right Face of Cube */}
          <polygon
            points="50,52 82,34 82,70 50,88"
            fill="url(#rightFacet)"
            stroke="#D97706"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Interlocking Puzzle Cutout / Inner Gold Diamond Core */}
          <polygon
            points="50,38 62,50 50,62 38,50"
            fill="url(#coreGold)"
            filter="url(#glow)"
            stroke="#FEF08A"
            strokeWidth="1.2"
          />

          {/* Dynamic Spatial Light Lines */}
          <line x1="50" y1="14" x2="50" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="18" y2="32" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <line x1="50" y1="50" x2="82" y2="34" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`${textSizes[size]} text-white font-sans uppercase tracking-wider`}>
            Arvec
          </span>
          <span className={`${textSizes[size]} text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-400 uppercase tracking-wider`}>
            Souz
          </span>
        </div>
        {showSubtitle && size !== 'sm' && (
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
            Spatial Puzzle Arcade
          </span>
        )}
      </div>
    </div>
  );
};
