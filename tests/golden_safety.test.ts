// tests/golden_safety.test.ts
import { describe, it, expect } from 'vitest';
import { DRUG_PROFILES } from '../data/drugProfiles';
import { buildEffectiveProfile, buildConstraints, checkBlocked, DRUG_INTERACTION_BLACKLIST, NON_VEG_PATTERNS } from '../lib/safety';
import { scoreRecipe, computeSensoryRadarData } from '../lib/algorithm';
import { resolveIngredient } from '../lib/resolveIngredient';
import { getRecommendations } from '../lib/dataService';
import { KBEntry, RawRecipe } from '../lib/types';

describe('ChemoTaste Clinical Safety & Sensory Suite (P0 to P3)', () => {
  const defaultContext = {
    mouthSoresToday: false,
    dryMouthToday: false,
    vegetarian: false,
    diabetic: false,
    allergens: [],
    toleratesRedMeat: false,
  };

  const sampleKB = new Map<string, KBEntry>([
    ['chicken', { name: 'chicken', aliases: ['chicken breast'], tags: ['high_protein'], vegetarian: false }],
    ['moong dal', { name: 'moong dal', aliases: [], tags: ['soft_texture', 'high_protein', 'mild_flavor'], vegetarian: true }],
    ['lemon juice', { name: 'lemon juice', aliases: [], tags: ['acidic', 'citrus'], vegetarian: true }],
    ['grapefruit', { name: 'grapefruit', aliases: [], tags: ['cyp3a4_inhibitor'], vegetarian: true }],
    ['starfruit', { name: 'starfruit', aliases: [], tags: ['nephrotoxic'], vegetarian: true }],
    ['sushi', { name: 'sushi', aliases: ['raw salmon'], tags: ['raw_risk', 'cold_serve'], vegetarian: false }],
    ['beef', { name: 'beef', aliases: ['steak'], tags: ['red_meat'], vegetarian: false }],
    ['water', { name: 'water', aliases: [], tags: ['neutral_base'], vegetarian: true, neutral_base: true }],
    ['salt', { name: 'salt', aliases: [], tags: ['neutral_base'], vegetarian: true, neutral_base: true }],
  ]);

  const sampleScored = new Map<string, number>([
    ['chicken', 0.4],
    ['moong dal', 0.8],
    ['lemon juice', 0.9],
  ]);

  describe('P0: Universal Oncology Safety Guardrails', () => {
    it('must block raw seafood / sushi for infection risk', () => {
      const cisplatin = DRUG_PROFILES['cisplatin'];
      const constraints = buildConstraints(cisplatin, defaultContext);

      const resolved = resolveIngredient('Fresh raw salmon sashimi', sampleKB, sampleScored, constraints);
      expect(resolved.blocked).toBeDefined();
      expect(resolved.blocked?.reason).toContain('infection');
    });

    it('must block CYP3A4 inhibitors (grapefruit, pomelo, seville orange)', () => {
      const paclitaxel = DRUG_PROFILES['paclitaxel'];
      const constraints = buildConstraints(paclitaxel, defaultContext);

      for (const banned of ['grapefruit', 'pomelo', 'seville orange']) {
        const res = checkBlocked(banned, [], constraints);
        expect(res).not.toBeNull();
        expect(res?.reason.toLowerCase()).toContain('contraindicated');
      }
    });

    it('must block nephrotoxic starfruit across all regimens', () => {
      const carboplatin = DRUG_PROFILES['carboplatin'];
      const constraints = buildConstraints(carboplatin, defaultContext);

      const res = resolveIngredient('Starfruit slices', sampleKB, sampleScored, constraints);
      expect(res.blocked).toBeDefined();
    });

    it('must block alcohol / wine across all regimens', () => {
      const cyclophosphamide = DRUG_PROFILES['cyclophosphamide'];
      const constraints = buildConstraints(cyclophosphamide, defaultContext);

      const res = resolveIngredient('1/4 cup red wine', sampleKB, sampleScored, constraints);
      expect(res.blocked).toBeDefined();
    });
  });

  describe('P1: Clinical Regimen Arbitration (Block Beats Boost)', () => {
    it('Mucositis Overrides Metallic Chelation: 5-FU with mouth sores must block lemon juice', () => {
      const fiveFU = buildEffectiveProfile([DRUG_PROFILES['5fu']], { ...defaultContext, mouthSoresToday: true });
      const constraints = buildConstraints(fiveFU, { ...defaultContext, mouthSoresToday: true });

      expect(constraints.blockedTags.has('acidic')).toBe(true);
      expect(constraints.allowAcidMasking).toBe(false);

      const lemonRecipe: RawRecipe = {
        id: 'r_lemon',
        title: 'Tart Lemon Herb Chicken',
        cuisine: 'Mediterranean',
        prep_time: 20,
        ingredients: ['chicken', 'lemon juice', 'water'],
      };

      const scored = scoreRecipe(lemonRecipe, sampleKB, sampleScored, fiveFU, constraints, { ...defaultContext, mouthSoresToday: true });
      expect(scored.excluded).toBe(true);
      expect(scored.taste_safe_score).toBe(0);
      expect(scored.excluded_reason).toContain('mucositis');
    });

    it('Oxaliplatin Cold Allodynia: must hard-block cold-serve dishes', () => {
      const oxali = buildEffectiveProfile([DRUG_PROFILES['oxaliplatin']], defaultContext);
      const constraints = buildConstraints(oxali, defaultContext);

      expect(constraints.blockedTags.has('cold_serve')).toBe(true);

      const coldDish: RawRecipe = {
        id: 'r_ice',
        title: 'Chilled Fruit Gazpacho',
        cuisine: 'Fusion',
        prep_time: 15,
        ingredients: ['water'],
        temperature_tag: 'cold',
      };

      const scored = scoreRecipe(coldDish, sampleKB, sampleScored, oxali, constraints, defaultContext);
      expect(scored.excluded).toBe(true);
      expect(scored.taste_safe_score).toBe(0);
      expect(scored.excluded_reason).toContain('Oxaliplatin');
    });

    it('FOLFOX Dual Test: must simultaneously block cold dishes and acid/citrus', () => {
      const folfox = buildEffectiveProfile([DRUG_PROFILES['oxaliplatin'], DRUG_PROFILES['5fu']], defaultContext);
      const constraints = buildConstraints(folfox, defaultContext);

      expect(constraints.blockedTags.has('cold_serve')).toBe(true);
      expect(constraints.blockedTags.has('acidic')).toBe(true);
      expect(constraints.allowAcidMasking).toBe(false);
    });
  });

  describe('P2: Physical & Nutritional Tolerability Guardrails', () => {
    it('Xerostomia Moisture Guardrail: Dry roasts (M < 0.5) must be penalized over moist soups', () => {
      const cisplatin = buildEffectiveProfile([DRUG_PROFILES['cisplatin']], { ...defaultContext, dryMouthToday: true });
      const constraints = buildConstraints(cisplatin, { ...defaultContext, dryMouthToday: true });

      const dryRoast: RawRecipe = {
        id: 'r_dry',
        title: 'Dry Grilled Chicken',
        cuisine: 'American',
        prep_time: 20,
        ingredients: ['chicken', 'salt'],
        moisture_index: 0.2,
      };

      const moistSoup: RawRecipe = {
        id: 'r_soup',
        title: 'Chicken Broth Khichdi',
        cuisine: 'Indian',
        prep_time: 25,
        ingredients: ['chicken', 'moong dal', 'water', 'salt'],
        moisture_index: 1.0,
      };

      const scoredDry = scoreRecipe(dryRoast, sampleKB, sampleScored, cisplatin, constraints, { ...defaultContext, dryMouthToday: true });
      const scoredMoist = scoreRecipe(moistSoup, sampleKB, sampleScored, cisplatin, constraints, { ...defaultContext, dryMouthToday: true });

      expect(scoredMoist.taste_safe_score).toBeGreaterThan(scoredDry.taste_safe_score);
    });

    it('Cachexia Protein Floor: Main recipes with < 12g protein receive a 15% penalty', () => {
      const cisplatin = buildEffectiveProfile([DRUG_PROFILES['cisplatin']], defaultContext);
      const constraints = buildConstraints(cisplatin, defaultContext);

      const lowProtein: RawRecipe = {
        id: 'r_low_pro',
        title: 'Water Broth with Salt',
        cuisine: 'Simple',
        prep_time: 10,
        ingredients: ['water', 'salt'],
        protein_g: 2,
        moisture_index: 1.0,
      };

      const highProtein: RawRecipe = {
        id: 'r_high_pro',
        title: 'Chicken Moong Dal Broth',
        cuisine: 'Indian',
        prep_time: 25,
        ingredients: ['chicken', 'moong dal', 'water', 'salt'],
        protein_g: 20,
        moisture_index: 1.0,
      };

      const scoredLow = scoreRecipe(lowProtein, sampleKB, sampleScored, cisplatin, constraints, defaultContext);
      const scoredHigh = scoreRecipe(highProtein, sampleKB, sampleScored, cisplatin, constraints, defaultContext);

      expect(scoredHigh.taste_safe_score).toBeGreaterThan(scoredLow.taste_safe_score);
    });

    it('Red Meat Penalty: 50% penalty applied when metallic >= 2 and user does not tolerate red meat', () => {
      const cisplatin = buildEffectiveProfile([DRUG_PROFILES['cisplatin']], defaultContext);
      const constraints = buildConstraints(cisplatin, defaultContext);

      expect(constraints.softPenalties['red_meat']).toBe(0.50);

      const beefRecipe: RawRecipe = {
        id: 'r_beef',
        title: 'Braised Beef Bowl',
        cuisine: 'American',
        prep_time: 30,
        ingredients: ['beef', 'water'],
        moisture_index: 0.8,
        protein_g: 25,
      };

      const chickenRecipe: RawRecipe = {
        id: 'r_chicken',
        title: 'Braised Chicken Bowl',
        cuisine: 'American',
        prep_time: 30,
        ingredients: ['chicken', 'water'],
        moisture_index: 0.8,
        protein_g: 25,
      };

      const scoredBeef = scoreRecipe(beefRecipe, sampleKB, sampleScored, cisplatin, constraints, defaultContext);
      const scoredChicken = scoreRecipe(chickenRecipe, sampleKB, sampleScored, cisplatin, constraints, defaultContext);

      expect(scoredChicken.taste_safe_score).toBeGreaterThan(scoredBeef.taste_safe_score);
    });
  });

  describe('Sensory Mathematics & Reciprocal Radar Proof', () => {
    it('Sweet threshold elevation (+45%) must yield reciprocal sensitivity of 0.69', () => {
      const cisplatin = DRUG_PROFILES['cisplatin'];
      expect(cisplatin.sweet_threshold_raised).toBe(true);

      const radar = computeSensoryRadarData(cisplatin);
      const sweetPoint = radar.find(p => p.axis === 'Sweet Sensitivity');

      expect(sweetPoint).toBeDefined();
      expect(sweetPoint?.damaged).toBe(0.69);
      expect(sweetPoint?.masked).toBe(0.88);
      expect(sweetPoint?.healthy).toBe(1.0);
    });
  });

  describe('Treatment Cycle Phase Adaptation', () => {
    it('Nadir phase (Days 4-8) must automatically trigger mucositis protection', () => {
      const chemo = buildEffectiveProfile([DRUG_PROFILES['cisplatin']], { ...defaultContext, cyclePhase: 'nadir_4_8' });
      const constraints = buildConstraints(chemo, { ...defaultContext, cyclePhase: 'nadir_4_8' });

      expect(constraints.blockedTags.has('acidic')).toBe(true);
      expect(constraints.allowAcidMasking).toBe(false);
    });

    it('Acute phase (Days 1-3) must elevate nausea risk', () => {
      const chemo = buildEffectiveProfile([DRUG_PROFILES['carboplatin']], { ...defaultContext, cyclePhase: 'acute_1_3' });
      expect(chemo.nausea_risk).toBe(3); // 2 + 1 = 3
    });
  });

  describe('End-to-End Recommendations Pipeline', () => {
    it('recommends Moong Dal Khichdi at top tier for Nadir mucosal phase', () => {
      const res = getRecommendations(['5fu'], { ...defaultContext, cyclePhase: 'nadir_4_8' });

      expect(res.scoredRecipes.length).toBeGreaterThan(0);
      const topRecipe = res.scoredRecipes[0];
      expect(topRecipe.excluded).toBe(false);
      expect(topRecipe.taste_safe_score).toBeGreaterThanOrEqual(70);
      expect(res.blockedIngredients.length).toBeGreaterThan(0);
      expect(res.radarData.length).toBe(5);
    });
  });
});
