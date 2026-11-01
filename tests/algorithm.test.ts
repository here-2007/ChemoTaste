// tests/algorithm.test.ts
import { describe, it, expect } from 'vitest';
import { scoreRecipe, clamp, isColdDish } from '../lib/algorithm';
import { resolveIngredient } from '../lib/resolveIngredient';
import { buildConstraints, buildEffectiveProfile } from '../lib/safety';
import { DRUG_PROFILES } from '../data/drugProfiles';
import { KBEntry, RawRecipe } from '../lib/types';
import rawKB from '../data/ingredient_kb.json';
import rawRecipes from '../data/curated_recipes.json';
import rawProfiles from '../data/precompiled/ingredient_profiles.json';

describe('Algorithm Math, Deduplication & Edge Cases', () => {
  const defaultCtx = {
    mouthSoresToday: false,
    dryMouthToday: false,
    vegetarian: false,
    diabetic: false,
    allergens: [],
    toleratesRedMeat: false,
  };

  const testKB = new Map<string, KBEntry>([
    ['onion', { name: 'onion', aliases: [], tags: ['high_aroma'], vegetarian: true }],
    ['garlic', { name: 'garlic', aliases: [], tags: ['high_aroma'], vegetarian: true }],
    ['cumin', { name: 'cumin', aliases: [], tags: ['high_aroma'], vegetarian: true }],
    ['rice', { name: 'rice', aliases: ['white rice'], tags: ['neutral_base'], vegetarian: true, neutral_base: true }],
    ['tea', { name: 'tea', aliases: [], tags: ['mild_flavor'], vegetarian: true }],
    ['grapefruit', { name: 'grapefruit', aliases: [], tags: ['cyp3a4_inhibitor'], vegetarian: true }],
    ['vegetable broth', { name: 'vegetable broth', aliases: [], tags: ['neutral_base'], vegetarian: true, neutral_base: true }],
    ['water', { name: 'water', aliases: [], tags: ['neutral_base'], vegetarian: true, neutral_base: true }],
    ['salt', { name: 'salt', aliases: [], tags: ['neutral_base'], vegetarian: true, neutral_base: true }],
  ]);

  const testScored = new Map<string, number>([
    ['onion', -0.2],
    ['garlic', -0.2],
    ['cumin', 0.1],
    ['tea', 0.3],
  ]);

  it('Deduplicated Soft Penalties: Multiple high_aroma ingredients must not compound exponentially', () => {
    // Cisplatin has nausea_risk = 3 (>=2 triggers high_aroma penalty = 0.30)
    const cisplatin = buildEffectiveProfile([DRUG_PROFILES['cisplatin']], defaultCtx);
    const constraints = buildConstraints(cisplatin, defaultCtx);

    expect(constraints.softPenalties['high_aroma']).toBe(0.30);

    const singleAromaRecipe: RawRecipe = {
      id: 'r_single',
      title: 'Steamed Rice with Onion',
      cuisine: 'Simple',
      prep_time: 15,
      ingredients: ['onion', 'rice', 'water', 'salt'],
      protein_g: 14,
      moisture_index: 0.8,
    };

    const tripleAromaRecipe: RawRecipe = {
      id: 'r_triple',
      title: 'Steamed Rice with Onion, Garlic and Cumin',
      cuisine: 'Simple',
      prep_time: 15,
      ingredients: ['onion', 'garlic', 'cumin', 'rice', 'water', 'salt'],
      protein_g: 14,
      moisture_index: 0.8,
    };

    const singleScore = scoreRecipe(singleAromaRecipe, testKB, testScored, cisplatin, constraints, defaultCtx);
    const tripleScore = scoreRecipe(tripleAromaRecipe, testKB, testScored, cisplatin, constraints, defaultCtx);

    // If penalties compounded per item: (1-0.3)^3 = 0.343 (66% drop)
    // If deduplicated by unique tags: exactly (1-0.3) = 0.70 (30% drop)
    // Both recipes should remain in the 30-55 range, NOT drop to near zero
    expect(singleScore.taste_safe_score).toBeGreaterThan(25);
    expect(tripleScore.taste_safe_score).toBeGreaterThan(25);
  });

  it('Bayesian Shrinkage: Unknown ingredients pull score safely toward neutral 50', () => {
    const cisplatin = buildEffectiveProfile([DRUG_PROFILES['cisplatin']], defaultCtx);
    const constraints = buildConstraints(cisplatin, defaultCtx);

    const highCoverage: RawRecipe = {
      id: 'r_high_cov',
      title: 'Cataloged Rice & Salt',
      cuisine: 'Simple',
      prep_time: 10,
      ingredients: ['rice', 'salt', 'water'],
      protein_g: 14,
      moisture_index: 0.8,
    };

    const lowCoverage: RawRecipe = {
      id: 'r_low_cov',
      title: 'Unknown Forest Bark & Grass',
      cuisine: 'Exotic',
      prep_time: 10,
      ingredients: ['rare mystic mushroom', 'wild forest herb', 'unidentified root'],
      protein_g: 14,
      moisture_index: 0.8,
    };

    const scoredHigh = scoreRecipe(highCoverage, testKB, testScored, cisplatin, constraints, defaultCtx);
    const scoredLow = scoreRecipe(lowCoverage, testKB, testScored, cisplatin, constraints, defaultCtx);

    expect(scoredHigh.confidence).toBeGreaterThanOrEqual(0.9);
    expect(scoredLow.confidence).toBe(0.0);
    // Uncataloged recipe shrinks to exact neutral 50
    expect(scoredLow.taste_safe_score).toBe(50);
  });

  it('Defensive vegetarian check catches uncataloged meat broths', () => {
    const constraints = buildConstraints(DRUG_PROFILES['cisplatin'], defaultCtx);
    const resolved = resolveIngredient('2 cups slow simmered beef broth', testKB, testScored, constraints);

    expect(resolved.vegetarian).toBe(false);
  });

  it('Clamp helper maintains strict numerical boundaries', () => {
    expect(clamp(-50, 0, 100)).toBe(0);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(42, 0, 100)).toBe(42);
  });

  it('Empty or stop-word only string must resolve to unknown, not match first entry', () => {
    const constraints = buildConstraints(DRUG_PROFILES['cisplatin'], defaultCtx);
    const resEmpty = resolveIngredient('', testKB, testScored, constraints);
    const resStopWords = resolveIngredient('1 cup chopped fresh', testKB, testScored, constraints);

    expect(resEmpty.kind).toBe('unknown');
    expect(resEmpty.cleanName).toBe('');
    expect(resStopWords.kind).toBe('unknown');
  });

  it('Rejects false positive substring matches (steak!=tea, licorice!=rice, grape!=grapefruit)', () => {
    const constraints = buildConstraints(DRUG_PROFILES['cisplatin'], defaultCtx);

    // steak must not match tea
    const resSteak = resolveIngredient('grilled beef steak', testKB, testScored, constraints);
    expect(resSteak.cleanName).not.toBe('tea');
    expect(resSteak.vegetarian).toBe(false);

    // licorice must not match rice
    const resLicorice = resolveIngredient('black licorice root', testKB, testScored, constraints);
    expect(resLicorice.cleanName).not.toBe('rice');

    // grape must not match grapefruit
    const resGrape = resolveIngredient('seedless green grapes', testKB, testScored, constraints);
    expect(resGrape.blocked).toBeUndefined();
  });

  it('Vegetable broth and stock are safely recognized as vegetarian', () => {
    const constraints = buildConstraints(DRUG_PROFILES['cisplatin'], defaultCtx);
    const resolved = resolveIngredient('4 cups vegetable broth', testKB, testScored, constraints);

    expect(resolved.vegetarian).toBe(true);
    expect(resolved.kind).toBe('neutral');

    const vegRecipe: RawRecipe = {
      id: 'r_veg_broth',
      title: 'Vegetable Broth with Rice',
      cuisine: 'Simple',
      prep_time: 15,
      ingredients: ['rice', '4 cups vegetable broth', 'salt'],
      protein_g: 14,
      moisture_index: 0.9,
    };

    const scored = scoreRecipe(vegRecipe, testKB, testScored, DRUG_PROFILES['cisplatin'], constraints, {
      ...defaultCtx,
      vegetarian: true,
    });

    expect(scored.excluded).toBe(false);
  });

  it('Blocks uncataloged raw/undercooked items under P0 infection guardrail', () => {
    const constraints = buildConstraints(DRUG_PROFILES['cisplatin'], defaultCtx);

    const rawEgg = resolveIngredient('2 raw eggs', testKB, testScored, constraints);
    expect(rawEgg.blocked).toBeDefined();
    expect(rawEgg.blocked?.reason).toContain('P0');

    const unpasteurizedDairy = resolveIngredient('1 glass unpasteurized milk', testKB, testScored, constraints);
    expect(unpasteurizedDairy.blocked).toBeDefined();
    expect(unpasteurizedDairy.blocked?.reason).toContain('P0');
  });

  it('isColdDish checks ingredients list as well as title for cold items', () => {
    const coldInIngredients: RawRecipe = {
      id: 'r_cold_ing',
      title: 'Berry Medley Bowl',
      cuisine: 'Breakfast',
      prep_time: 5,
      ingredients: ['1 cup crushed ice', 'strawberries'],
    };

    expect(isColdDish(coldInIngredients)).toBe(true);

    const oxali = DRUG_PROFILES['oxaliplatin'];
    const constraints = buildConstraints(oxali, defaultCtx);
    const scored = scoreRecipe(coldInIngredients, testKB, testScored, oxali, constraints, defaultCtx);

    expect(scored.excluded).toBe(true);
    expect(scored.taste_safe_score).toBe(0);
  });

  it('Dataset counts satisfy project specifications (>=80 KB items, >=50 recipes, >=25 profiles)', () => {
    expect(Object.keys(rawKB).length).toBeGreaterThanOrEqual(80);
    expect(rawRecipes.length).toBeGreaterThanOrEqual(50);
    expect(Object.keys(rawProfiles).length).toBeGreaterThanOrEqual(25);
  });
});
