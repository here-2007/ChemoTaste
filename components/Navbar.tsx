// components/Navbar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';

interface NavbarProps {
  onStartIntake?: () => void;
  onOpenScience?: () => void;
  activeSection?: string;
  defaultActiveSection?: string;
  onSectionChange?: (section: string) => void;
  isScienceOpen?: boolean;
}

// Pure helper for computing the active section based on scroll coordinate
export function getSectionFromScroll(
  scrollY: number,
  innerHeight: number,
  scrollHeight: number,
  sectionTops: Record<string, number>
): string {
  // Bottom of page detection -> highlight 'recipes'
  if (innerHeight + scrollY >= scrollHeight - 80) {
    return 'recipes';
  }

  const navOffset = 120;
  const triggerPoint = scrollY + navOffset;

  const sections = ['recipes', 'ingredients', 'sensory-radar', 'intake'];
  for (const id of sections) {
    const top = sectionTops[id];
    if (top !== undefined && triggerPoint >= top) {
      return id;
    }
  }

  // If above all tracked sections, we are in the hero section
  return 'hero';
}

export const Navbar: React.FC<NavbarProps> = ({
  onStartIntake,
  onOpenScience,
  activeSection: controlledActiveSection,
  defaultActiveSection = 'hero',
  onSectionChange,
  isScienceOpen: controlledIsScienceOpen,
}) => {
  const isControlledSection = controlledActiveSection !== undefined;
  const isControlledScience = controlledIsScienceOpen !== undefined;

  const [internalActiveSection, setInternalActiveSection] = useState<string>(
    controlledActiveSection ?? defaultActiveSection
  );
  const [internalIsScienceOpen, setInternalIsScienceOpen] = useState(false);

  const activeSection = isControlledSection ? controlledActiveSection : internalActiveSection;
  const isScienceOpen = isControlledScience ? controlledIsScienceOpen : internalIsScienceOpen;

  const isClickScrollingRef = useRef(false);
  const clickScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync if controlled activeSection prop changes
  useEffect(() => {
    if (controlledActiveSection !== undefined) {
      setInternalActiveSection(controlledActiveSection);
    }
  }, [controlledActiveSection]);

  // Sync if controlled isScienceOpen prop changes
  useEffect(() => {
    if (controlledIsScienceOpen !== undefined) {
      setInternalIsScienceOpen(controlledIsScienceOpen);
    }
  }, [controlledIsScienceOpen]);

  // Scroll spy to update active navbar element as user scrolls
  const handleScroll = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    if (isClickScrollingRef.current) return;

    const sections = ['recipes', 'ingredients', 'sensory-radar', 'intake'];
    const sectionTops: Record<string, number> = {};
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        sectionTops[id] = el.getBoundingClientRect().top + window.scrollY;
      }
    }

    const target = getSectionFromScroll(
      window.scrollY,
      window.innerHeight,
      document.documentElement.scrollHeight,
      sectionTops
    );

    if (!isControlledSection) {
      setInternalActiveSection(target);
    }
    onSectionChange?.(target);
  }, [isControlledSection, onSectionChange]);

  const handleNavClick = (id: string) => {
    if (!isControlledSection) {
      setInternalActiveSection(id);
    }
    onSectionChange?.(id);

    // Lock scroll spy while smooth scrolling to target element
    isClickScrollingRef.current = true;
    if (clickScrollTimerRef.current) {
      clearTimeout(clickScrollTimerRef.current);
    }
    // Safety fallback timer for long smooth scroll animations
    clickScrollTimerRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
      handleScroll();
    }, 1800);

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartIntake = () => {
    if (onStartIntake) {
      if (!isControlledSection) {
        setInternalActiveSection('intake');
      }
      onSectionChange?.('intake');
      isClickScrollingRef.current = true;
      if (clickScrollTimerRef.current) {
        clearTimeout(clickScrollTimerRef.current);
      }
      clickScrollTimerRef.current = setTimeout(() => {
        isClickScrollingRef.current = false;
        handleScroll();
      }, 1800);
      onStartIntake();
    } else {
      handleNavClick('intake');
    }
  };

  const handleOpenScience = () => {
    if (!isControlledScience) {
      setInternalIsScienceOpen(prev => !prev);
    }
    onOpenScience?.();
  };

  useEffect(() => {
    // Synchronize initial scroll coordinate immediately upon mounting
    handleScroll();

    const onScrollEnd = () => {
      if (isClickScrollingRef.current) {
        isClickScrollingRef.current = false;
        if (clickScrollTimerRef.current) {
          clearTimeout(clickScrollTimerRef.current);
          clickScrollTimerRef.current = null;
        }
        handleScroll();
      }
    };

    const onUserInteraction = () => {
      if (isClickScrollingRef.current) {
        isClickScrollingRef.current = false;
        if (clickScrollTimerRef.current) {
          clearTimeout(clickScrollTimerRef.current);
          clickScrollTimerRef.current = null;
        }
        handleScroll();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scrollend', onScrollEnd, { passive: true });
    window.addEventListener('wheel', onUserInteraction, { passive: true });
    window.addEventListener('touchmove', onUserInteraction, { passive: true });
    window.addEventListener('pointerdown', onUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scrollend', onScrollEnd);
      window.removeEventListener('wheel', onUserInteraction);
      window.removeEventListener('touchmove', onUserInteraction);
      window.removeEventListener('pointerdown', onUserInteraction);
      if (clickScrollTimerRef.current) {
        clearTimeout(clickScrollTimerRef.current);
      }
    };
  }, [handleScroll]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Logo Lockup */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 rounded"
          onClick={() => handleNavClick('hero')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavClick('hero');
            }
          }}
        >
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
            onClick={() => handleNavClick('intake')}
            className={`text-xs uppercase tracking-[0.025em] font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 rounded-sm ${
              activeSection === 'intake' ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Regimen Intake
          </button>
          <button
            onClick={() => handleNavClick('sensory-radar')}
            className={`text-xs uppercase tracking-[0.025em] font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 rounded-sm ${
              activeSection === 'sensory-radar' ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Sensory Shift Radar
          </button>
          <button
            onClick={() => handleNavClick('ingredients')}
            className={`text-xs uppercase tracking-[0.025em] font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 rounded-sm ${
              activeSection === 'ingredients' ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Ingredient Intel
          </button>
          <button
            onClick={() => handleNavClick('recipes')}
            className={`text-xs uppercase tracking-[0.025em] font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20 rounded-sm ${
              activeSection === 'recipes' ? 'text-white' : 'text-[#9a9a9a] hover:text-white'
            }`}
          >
            Curated Recipes
          </button>
          <button
            onClick={handleOpenScience}
            className={`text-xs uppercase tracking-[0.025em] font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#ffb829]/50 rounded-sm ${
              isScienceOpen
                ? 'text-white'
                : 'text-[#ffb829] hover:text-white'
            }`}
          >
            Science Proofs
          </button>
        </div>

        {/* Action Button: Filled Violet Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartIntake}
            className="bg-[#8052ff] hover:bg-[#6d3cf5] text-white text-xs uppercase tracking-[0.025em] font-semibold px-5 py-3 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(128,82,255,0.35)] hover:shadow-[0_0_28px_rgba(128,82,255,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Personalize Meals
          </button>
        </div>
      </div>
    </nav>
  );
};
