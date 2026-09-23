import React from 'react';

interface LogoProps {
  variant?: 'light' | 'dark'; // 'light' is for light background (header), 'dark' is for dark background (footer)
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'light',
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const isDark = variant === 'dark';

  // Sizing definitions
  const emblemSizes = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
  };

  const titleSizes = {
    sm: 'text-lg sm:text-xl',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const taglineSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px] sm:text-[10px]',
    lg: 'text-[10px] sm:text-[11px]',
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Ornate Royal Emblem Badge (SVG) */}
      <div className={`relative shrink-0 ${emblemSizes[size]} transition-transform duration-300 group-hover:scale-105`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs"
        >
          <defs>
            {/* Rich Metallic Gold Gradients */}
            <linearGradient id="bmGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ECC875" />
              <stop offset="35%" stopColor="#CA9B36" />
              <stop offset="70%" stopColor="#F9E29B" />
              <stop offset="100%" stopColor="#9C701B" />
            </linearGradient>

            <linearGradient id="bmGoldSoft" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#C9972C" />
              <stop offset="50%" stopColor="#F0D38D" />
              <stop offset="100%" stopColor="#9B6C14" />
            </linearGradient>

            <linearGradient id="bmShieldBgLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1C1A16" />
              <stop offset="100%" stopColor="#0F0E0B" />
            </linearGradient>

            <linearGradient id="bmShieldBgDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#25231E" />
              <stop offset="100%" stopColor="#151411" />
            </linearGradient>
          </defs>

          {/* Outer Royal Circular Crest with Dual Rings */}
          <circle
            cx="50"
            cy="50"
            r="46"
            fill={isDark ? "url(#bmShieldBgDark)" : "url(#bmShieldBgLight)"}
            stroke="url(#bmGoldGrad)"
            strokeWidth="2.5"
          />

          {/* Inner Beaded / Dashed Accent Ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#bmGoldSoft)"
            strokeWidth="1"
            strokeDasharray="2.5 2"
            opacity="0.85"
          />

          {/* Fine Hairline Inner Circle */}
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="url(#bmGoldGrad)"
            strokeWidth="0.6"
            opacity="0.6"
          />

          {/* Four Cardinal Accent Diamond Stars */}
          <path d="M50,7.5 L51.5,10 L50,12.5 L48.5,10 Z" fill="url(#bmGoldGrad)" />
          <path d="M50,87.5 L51.5,90 L50,92.5 L48.5,90 Z" fill="url(#bmGoldGrad)" />
          <path d="M7.5,50 L10,51.5 L12.5,50 L10,48.5 Z" fill="url(#bmGoldGrad)" />
          <path d="M87.5,50 L90,51.5 L92.5,50 L90,48.5 Z" fill="url(#bmGoldGrad)" />

          {/* Royal Crown / Tiara Flourish at Top */}
          <path
            d="M38,24 L43,18 L50,22 L57,18 L62,24 L60,26 L40,26 Z"
            fill="url(#bmGoldGrad)"
          />
          <circle cx="43" cy="17" r="1.3" fill="#FFF4D0" />
          <circle cx="50" cy="15" r="1.6" fill="#FFF4D0" />
          <circle cx="57" cy="17" r="1.3" fill="#FFF4D0" />

          {/* "BM" Monogram - Batool Market Luxury Typography */}
          <text
            x="50"
            y="59"
            textAnchor="middle"
            fill="url(#bmGoldGrad)"
            style={{
              fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
              fontWeight: 700,
              fontSize: '32px',
              letterSpacing: '2px',
              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))'
            }}
          >
            BM
          </text>

          {/* Elegant Ribbon / Filigree Flourish Beneath BM */}
          <path
            d="M30,68 C38,64 45,71 50,68 C55,71 62,64 70,68"
            fill="none"
            stroke="url(#bmGoldGrad)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Center Accent Diamond & Flourish Dots */}
          <polygon points="50,71.5 52.5,74 50,76.5 47.5,74" fill="url(#bmGoldSoft)" />
          <circle cx="34" cy="67.5" r="1" fill="url(#bmGoldSoft)" />
          <circle cx="66" cy="67.5" r="1" fill="url(#bmGoldSoft)" />
        </svg>
      </div>

      {/* Brand Typography Logotype */}
      <div className="flex flex-col justify-center leading-none text-left">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-brand ${titleSizes[size]} font-bold tracking-[0.14em] uppercase transition-colors duration-200 ${
              isDark
                ? 'text-[#FAF9F5] group-hover:text-amber-300'
                : 'text-[#181816] group-hover:text-amber-900'
            }`}
          >
            Batool
          </span>
          <span
            className={`font-brand ${titleSizes[size]} font-light tracking-[0.14em] uppercase ${
              isDark ? 'text-amber-400' : 'text-amber-700'
            }`}
          >
            Market
          </span>
        </div>

        {showTagline && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`block ${taglineSizes[size]} tracking-[0.24em] font-semibold uppercase ${
                isDark ? 'text-stone-400' : 'text-stone-500'
              }`}
            >
              Luxury Pakistani Store
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
