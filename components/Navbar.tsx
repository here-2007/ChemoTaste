// components/Navbar.tsx
'use client';

import React from 'react';

interface NavbarProps {
  onStartIntake?: () => void;
  onOpenScience?: () => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onStartIntake, onOpenScience, activeSection = 'intake' }) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo Lockup */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('hero')}>
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Geometric fragment logo */}
            <svg viewBox="0 0 32 32" className="w-7 h-7 drop-shadow-[0_0_12px_rgba(128,82,255,0.6)]" fill="none">
              <path
                d="M16 2L30 26H2L16 2Z"
                stroke="url(#logo-grad)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M16 10L23 22H9L16 10Z"
                fill="url(#logo-grad)"
                fillOpacity="0.4"
              />
              <defs>
                <linearGradient id="logo-grad" x1="2" y1="2" x2="30" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8052ff" />
                  <stop offset="0.6" stopColor="#38bdf8" />
                  <stop offset="1" stopColor="#15846e" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-normal tracking-[-0.04em] text-white">ChemoTaste</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#ffb829] font-semibold hidden sm:inline">
              COSY LAB · IIITD
            </span>
          </div>
        </div>

        {/* Navigation Ghost Links */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollTo('intake')}
            className={`text-xs uppercase tracking-[0.025em] font-medium transition-colors ${
              activeSection === 'intake' ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Regimen Intake
          </button>
          <button
            onClick={() => scrollTo('sensory-radar')}
            className={`text-xs uppercase tracking-[0.025em] font-medium transition-colors ${
              activeSection === 'sensory-radar' ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Sensory Shift Radar
          </button>
          <button
            onClick={() => scrollTo('ingredients')}
            className={`text-xs uppercase tracking-[0.025em] font-medium transition-colors ${
              activeSection === 'ingredients' ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Ingredient Intel
          </button>
          <button
            onClick={() => scrollTo('recipes')}
            className={`text-xs uppercase tracking-[0.025em] font-medium transition-colors ${
              activeSection === 'recipes' ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Curated Recipes
          </button>
          <button
            onClick={onOpenScience}
            className="text-xs uppercase tracking-[0.025em] font-medium text-[#ffb829] hover:text-white transition-colors"
          >
            Science Proofs
          </button>
        </div>

        {/* Action Button: Filled Violet Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStartIntake ?? (() => scrollTo('intake'))}
            className="bg-[#8052ff] hover:bg-[#6d3cf5] text-white text-xs uppercase tracking-[0.025em] font-semibold px-5 py-3 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(128,82,255,0.35)] hover:shadow-[0_0_28px_rgba(128,82,255,0.6)]"
          >
            Personalize Meals
          </button>
        </div>
      </div>
    </nav>
  );
};
