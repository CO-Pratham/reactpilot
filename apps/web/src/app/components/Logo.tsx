import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Ultra-sleek, minimalist ReactPilot emblem inspired by Linear / Vercel / GitHub.
 * Precise geometric Pilot Wing + React Arc monogram.
 */
export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl bg-slate-900 border border-slate-800 p-1.5 shadow-md group hover:border-violet-500/50 hover:shadow-violet-500/10 transition-all duration-300 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-100 group-hover:text-violet-300 transition-colors"
      >
        <defs>
          <linearGradient id="rpLogoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8FAFC" />
            <stop offset="0.6" stopColor="#A7F3D0" />
            <stop offset="1" stopColor="#818CF8" />
          </linearGradient>
          <linearGradient id="rpWingGradient" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818CF8" />
            <stop offset="1" stopColor="#C084FC" />
          </linearGradient>
        </defs>

        {/* Minimalist Outer Precision Orbit Arc */}
        <path
          d="M 6 16 C 6 10.477 10.477 6 16 6 C 21.523 6 26 10.477 26 16"
          stroke="url(#rpLogoGradient)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Sleek Delta Pilot Chevron */}
        <path
          d="M 16 7 L 25 24 L 16 20 L 7 24 Z"
          fill="url(#rpWingGradient)"
          fillOpacity="0.85"
        />

        {/* Core Precision Beam */}
        <path
          d="M 16 7 L 16 20"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Orbit Node */}
        <circle cx="16" cy="6" r="1.75" fill="#60A5FA" />
      </svg>
    </div>
  );
}
