// tests/navbar.test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Navbar, getSectionFromScroll } from '../components/Navbar';

describe('Navbar Component Active State & Styling', () => {
  it('renders with intake active by default when activeSection is intake', () => {
    const html = renderToStaticMarkup(<Navbar activeSection="intake" />);
    
    // Intake button should be active (text-white)
    expect(html).toContain('Regimen Intake');
    expect(html).toMatch(/class="[^"]*text-white[^"]*"[^>]*>Regimen Intake<\/button>/);
    
    // Sensory Shift Radar should be inactive (text-[#9a9a9a])
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Sensory Shift Radar<\/button>/);
  });

  it('renders with Sensory Shift Radar active (text-white) when activeSection is sensory-radar', () => {
    const html = renderToStaticMarkup(<Navbar activeSection="sensory-radar" />);
    
    // Sensory Shift Radar should be active (text-white)
    expect(html).toMatch(/class="[^"]*text-white[^"]*"[^>]*>Sensory Shift Radar<\/button>/);
    
    // Intake button should be inactive (text-[#9a9a9a])
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Regimen Intake<\/button>/);
  });

  it('renders with Ingredient Intel active when activeSection is ingredients', () => {
    const html = renderToStaticMarkup(<Navbar activeSection="ingredients" />);
    
    expect(html).toMatch(/class="[^"]*text-white[^"]*"[^>]*>Ingredient Intel<\/button>/);
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Sensory Shift Radar<\/button>/);
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Regimen Intake<\/button>/);
  });

  it('renders with Curated Recipes active when activeSection is recipes', () => {
    const html = renderToStaticMarkup(<Navbar activeSection="recipes" />);
    
    expect(html).toMatch(/class="[^"]*text-white[^"]*"[^>]*>Curated Recipes<\/button>/);
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Sensory Shift Radar<\/button>/);
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Ingredient Intel<\/button>/);
  });

  it('renders with all nav links inactive when activeSection is hero', () => {
    const html = renderToStaticMarkup(<Navbar activeSection="hero" />);
    
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Regimen Intake<\/button>/);
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Sensory Shift Radar<\/button>/);
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Ingredient Intel<\/button>/);
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Curated Recipes<\/button>/);
  });

  it('renders defaultActiveSection when uncontrolled', () => {
    const html = renderToStaticMarkup(<Navbar defaultActiveSection="sensory-radar" />);
    expect(html).toMatch(/class="[^"]*text-white[^"]*"[^>]*>Sensory Shift Radar<\/button>/);
    expect(html).toMatch(/class="[^"]*text-\[#9a9a9a\][^"]*"[^>]*>Regimen Intake<\/button>/);
  });

  it('renders Science Proofs with active white text when isScienceOpen is true', () => {
    const html = renderToStaticMarkup(<Navbar isScienceOpen={true} />);
    expect(html).toMatch(/class="[^"]*text-white[^"]*"[^>]*>Science Proofs<\/button>/);
  });

  it('renders Science Proofs with accent text-[#ffb829] when isScienceOpen is false', () => {
    const html = renderToStaticMarkup(<Navbar isScienceOpen={false} />);
    expect(html).toMatch(/class="[^"]*text-\[#ffb829\][^"]*"[^>]*>Science Proofs<\/button>/);
  });

  it('ensures all interactive buttons include focus:outline-none to eliminate unwanted browser focus rings', () => {
    const html = renderToStaticMarkup(<Navbar />);
    const buttons = html.match(/<button[^>]*>/g) || [];
    expect(buttons.length).toBeGreaterThan(0);
    for (const btn of buttons) {
      expect(btn).toContain('focus:outline-none');
    }
  });

  it('ensures the brand logo lockup is accessible with role="button", tabIndex={0}, and focus:outline-none', () => {
    const html = renderToStaticMarkup(<Navbar />);
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toMatch(/class="[^"]*focus:outline-none[^"]*"[^>]*role="button"/);
  });
});

describe('getSectionFromScroll Scroll-Spy Algorithm', () => {
  const mockTops = {
    intake: 800,
    'sensory-radar': 1600,
    ingredients: 2400,
    recipes: 3200,
  };
  const innerHeight = 800;
  const scrollHeight = 4500;

  it('returns "hero" when scroll position is at the very top (scrollY = 0)', () => {
    const result = getSectionFromScroll(0, innerHeight, scrollHeight, mockTops);
    expect(result).toBe('hero');
  });

  it('returns "hero" when scroll position is inside hero section (e.g., scrollY = 400)', () => {
    // 400 + 120 = 520, which is < intake (800)
    const result = getSectionFromScroll(400, innerHeight, scrollHeight, mockTops);
    expect(result).toBe('hero');
  });

  it('returns "intake" as soon as scroll + offset (120) reaches intake top', () => {
    // 680 + 120 = 800 >= 800
    const result = getSectionFromScroll(680, innerHeight, scrollHeight, mockTops);
    expect(result).toBe('intake');
  });

  it('returns "sensory-radar" when scrolling into sensory radar section', () => {
    // 1500 + 120 = 1620 >= 1600
    const result = getSectionFromScroll(1500, innerHeight, scrollHeight, mockTops);
    expect(result).toBe('sensory-radar');
  });

  it('returns "ingredients" when scrolling into ingredient intel section', () => {
    // 2300 + 120 = 2420 >= 2400
    const result = getSectionFromScroll(2300, innerHeight, scrollHeight, mockTops);
    expect(result).toBe('ingredients');
  });

  it('returns "recipes" when scrolling into curated recipes section', () => {
    // 3100 + 120 = 3220 >= 3200
    const result = getSectionFromScroll(3100, innerHeight, scrollHeight, mockTops);
    expect(result).toBe('recipes');
  });

  it('returns "recipes" when reaching the bottom of the page regardless of offset', () => {
    // innerHeight (800) + scrollY (3650) = 4450 >= scrollHeight (4500) - 80 (4420)
    const result = getSectionFromScroll(3650, innerHeight, scrollHeight, mockTops);
    expect(result).toBe('recipes');
  });

  it('handles missing elements gracefully without throwing', () => {
    const incompleteTops = {
      intake: 800,
    };
    const result = getSectionFromScroll(1500, innerHeight, scrollHeight, incompleteTops);
    expect(result).toBe('intake');
  });
});
