import React from 'react';

interface GoldenOakLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export function GoldenOakLogo({
  size = 'md',
  showSubtitle = true,
  className = '',
}: GoldenOakLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-[10px] tracking-[0.2em]',
    md: 'text-[12px] tracking-[0.25em]',
    lg: 'text-[15px] tracking-[0.3em]',
  };

  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* 1. Pure Vector Transparent Golden Oak Tree Emblem */}
      <div className={`relative ${iconSizes[size]} mb-1.5 transition-transform duration-300 hover:scale-105`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible drop-shadow-[0_0_12px_rgba(212,175,55,0.65)]"
        >
          <defs>
            {/* Rich Luxury Gold Metallic Gradients */}
            <linearGradient id="goldMetallic" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF9E8" />
              <stop offset="25%" stopColor="#F5DC9A" />
              <stop offset="60%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#996515" />
            </linearGradient>

            <linearGradient id="goldGleam" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#F5DC9A" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.4" />
            </linearGradient>

            <radialGradient id="haloGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F5DC9A" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#D4AF37" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient Glow Aura */}
          <circle cx="50" cy="50" r="46" fill="url(#haloGlow)" />

          {/* Thin Luxury Outer Halo Ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#goldMetallic)"
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity="0.6"
          />
          <circle
            cx="50"
            cy="50"
            r="41"
            stroke="url(#goldMetallic)"
            strokeWidth="0.5"
            opacity="0.4"
          />

          {/* ROOT SYSTEM */}
          <path
            d="M 50 78 C 47 84 41 89 33 91 C 38 88 44 85 46 80 Z"
            fill="url(#goldMetallic)"
          />
          <path
            d="M 50 78 C 53 84 59 89 67 91 C 62 88 56 85 54 80 Z"
            fill="url(#goldMetallic)"
          />
          <path
            d="M 49 80 C 47 87 45 92 42 94 C 45 91 48 86 50 81 Z"
            fill="url(#goldMetallic)"
          />
          <path
            d="M 51 80 C 53 87 55 92 58 94 C 55 91 52 86 50 81 Z"
            fill="url(#goldMetallic)"
          />

          {/* SOLID SCULPTED TRUNK */}
          <path
            d="M 45 78 C 45 70 43 62 40 55 C 44 56 47 57 50 58 C 53 57 56 56 60 55 C 57 62 55 70 55 78 C 52 79 48 79 45 78 Z"
            fill="url(#goldMetallic)"
          />
          {/* Inner Trunk Chisel Highlight */}
          <path
            d="M 49 76 C 48.5 70 48 64 47 58 C 48.5 58.5 50 58.8 51 58.8 C 51.5 64 51.8 70 51 76 Z"
            fill="url(#goldGleam)"
            opacity="0.85"
          />

          {/* MAIN BRANCHES */}
          {/* Left Arching Branch */}
          <path
            d="M 44 57 C 36 53 29 45 25 35 C 28 38 34 43 41 47 C 39 43 36 38 33 32 C 37 36 42 41 46 45 C 44 38 43 30 42 22 C 45 27 47 34 48 42 Z"
            fill="url(#goldMetallic)"
          />
          {/* Right Arching Branch */}
          <path
            d="M 56 57 C 64 53 71 45 75 35 C 72 38 66 43 59 47 C 61 43 64 38 67 32 C 63 36 58 41 54 45 C 56 38 57 30 58 22 C 55 27 53 34 52 42 Z"
            fill="url(#goldMetallic)"
          />
          {/* Central Apex Limb */}
          <path
            d="M 48 43 C 47 34 48 24 50 16 C 52 24 53 34 52 43 Z"
            fill="url(#goldGleam)"
          />

          {/* LUSH OAK FOLIAGE CLUSTERS (Intricate Leaves & Canopy) */}
          {/* Top Apex Canopy */}
          <circle cx="50" cy="15" r="4.5" fill="url(#goldMetallic)" />
          <circle cx="44" cy="18" r="4" fill="url(#goldGleam)" />
          <circle cx="56" cy="18" r="4" fill="url(#goldGleam)" />
          <circle cx="50" cy="22" r="3.5" fill="url(#goldMetallic)" />

          {/* Upper Left Foliage */}
          <circle cx="37" cy="20" r="4.2" fill="url(#goldMetallic)" />
          <circle cx="30" cy="25" r="4.5" fill="url(#goldGleam)" />
          <circle cx="24" cy="30" r="4" fill="url(#goldMetallic)" />
          <circle cx="34" cy="28" r="4.5" fill="url(#goldMetallic)" />

          {/* Upper Right Foliage */}
          <circle cx="63" cy="20" r="4.2" fill="url(#goldMetallic)" />
          <circle cx="70" cy="25" r="4.5" fill="url(#goldGleam)" />
          <circle cx="76" cy="30" r="4" fill="url(#goldMetallic)" />
          <circle cx="66" cy="28" r="4.5" fill="url(#goldMetallic)" />

          {/* Mid Outer Canopy (Left & Right) */}
          <circle cx="20" cy="38" r="4.5" fill="url(#goldGleam)" />
          <circle cx="17" cy="46" r="3.8" fill="url(#goldMetallic)" />
          <circle cx="24" cy="46" r="4.2" fill="url(#goldMetallic)" />

          <circle cx="80" cy="38" r="4.5" fill="url(#goldGleam)" />
          <circle cx="83" cy="46" r="3.8" fill="url(#goldMetallic)" />
          <circle cx="76" cy="46" r="4.2" fill="url(#goldMetallic)" />

          {/* Inner Dense Canopy Leaves */}
          <circle cx="42" cy="33" r="4.2" fill="url(#goldGleam)" />
          <circle cx="58" cy="33" r="4.2" fill="url(#goldGleam)" />
          <circle cx="50" cy="32" r="4.5" fill="url(#goldMetallic)" />
          <circle cx="45" cy="40" r="3.8" fill="url(#goldMetallic)" />
          <circle cx="55" cy="40" r="3.8" fill="url(#goldMetallic)" />

          {/* Lower Outer Fringe */}
          <circle cx="28" cy="54" r="3.5" fill="url(#goldMetallic)" />
          <circle cx="72" cy="54" r="3.5" fill="url(#goldMetallic)" />

          {/* Decorative Sparkle Stars */}
          <path
            d="M 50 6 L 51 9 L 54 10 L 51 11 L 50 14 L 49 11 L 46 10 L 49 9 Z"
            fill="#FFF8E7"
          />
          <path
            d="M 23 21 L 23.8 23.2 L 26 24 L 23.8 24.8 L 23 27 L 22.2 24.8 L 20 24 L 22.2 23.2 Z"
            fill="#FFF8E7"
          />
          <path
            d="M 77 21 L 77.8 23.2 L 80 24 L 77.8 24.8 L 77 27 L 76.2 24.8 L 74 24 L 76.2 23.2 Z"
            fill="#FFF8E7"
          />
        </svg>
      </div>

      {/* 2. Classical Serif Luxury Brand Title */}
      <h1
        className={`font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFF8E7] via-[#F5DC9A] to-[#D4AF37] uppercase leading-tight ${titleSizes[size]} drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)]`}
      >
        The Golden Oak
      </h1>

      {/* 3. Refined Gold Subtitle */}
      {showSubtitle && (
        <p className="text-[7.5px] font-sans tracking-[0.28em] text-[#D4AF37]/90 uppercase font-semibold mt-0.5">
          Luxury Dining Experience
        </p>
      )}
    </div>
  );
}
