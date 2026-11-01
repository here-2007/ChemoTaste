// tests/ingredient_filter.test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { IngredientFilterPanel } from '../components/IngredientFilterPanel';
import { getIngredientImageUrl, INGREDIENT_IMAGES, DEFAULT_INGREDIENT_PHOTO } from '../data/ingredientImages';

describe('Ingredient Photography & Image Resolution', () => {
  it('resolves exact photo URLs for primary oncology ingredients', () => {
    expect(getIngredientImageUrl('tamarind')).toContain('images.unsplash.com');
    expect(getIngredientImageUrl('moong dal')).toContain('images.unsplash.com');
    expect(getIngredientImageUrl('curd')).toContain('images.unsplash.com');
    expect(getIngredientImageUrl('ginger')).toContain('images.unsplash.com');
    expect(getIngredientImageUrl('tomato')).toContain('images.unsplash.com');
  });

  it('handles case-insensitivity and whitespace trimming', () => {
    expect(getIngredientImageUrl('  Tamarind  ')).toBe(INGREDIENT_IMAGES['tamarind']);
    expect(getIngredientImageUrl('MOONG DAL')).toBe(INGREDIENT_IMAGES['moong dal']);
  });

  it('returns high-quality default culinary photo for unmapped exotic ingredients', () => {
    expect(getIngredientImageUrl('unmapped_unknown_seed_xyz')).toBe(DEFAULT_INGREDIENT_PHOTO);
  });
});

describe('IngredientFilterPanel Component View & Demo Guardrails', () => {
  const mockIncluded = [
    { name: 'tamarind', score: 0.4, tags: ['acidic', 'metal_chelator'], protein: 2.8, reason: 'Chelates salivary iron.' },
    { name: 'tomato', score: 0.39, tags: ['acidic', 'umami_rich'], protein: 0.9, reason: 'Stimulates taste buds.' },
    { name: 'curd', score: 0.28, tags: ['soft_texture', 'mild_flavor'], protein: 10, reason: 'Gentle on mucosa.' },
    { name: 'moong dal', score: 0.26, tags: ['soft_texture', 'high_protein'], protein: 24, reason: 'Rich in zinc.' },
    { name: 'miso', score: 0.26, tags: ['umami_rich', 'taste_enhancer'], protein: 12, reason: 'High umami signaling.' },
    { name: 'lime juice', score: 0.26, tags: ['acidic', 'citrus'], protein: 0.4, reason: 'Acidic taste stimulator.' },
    { name: 'paneer', score: 0.25, tags: ['soft_texture', 'mild_flavor'], protein: 18, reason: 'Mild palatable protein.' },
    { name: 'shiitake mushroom', score: 0.19, tags: ['umami_rich'], protein: 3.1, reason: 'Intense umami aroma.' },
  ];

  const mockBlocked = [
    { name: 'grapefruit', reason: 'CYP3A4 enzymatic blockade.', rule: 'P0: Universal Oncology Safety' },
    { name: 'beef', reason: 'Heme iron triggers metallic distortion.', rule: 'P1: Regimen Override' },
    { name: 'raw sushi', reason: 'Bacterial infection risk during neutropenia.', rule: 'P0: Universal Oncology Safety' },
    { name: 'chili', reason: 'Severe mucosal burning.', rule: 'P1: Regimen Override' },
    { name: 'garlic', reason: 'Distorted allicin sulfur odor.', rule: 'P1: Regimen Override' },
    { name: 'coffee', reason: 'Heightened bitterness intolerance.', rule: 'P1: Regimen Override' },
    { name: 'unpasteurized cheese', reason: 'Listeria risk during neutropenia.', rule: 'P0: Universal Oncology Safety' },
    { name: 'starfruit', reason: 'Neurotoxicity risk in compromised clearance.', rule: 'P0: Universal Oncology Safety' },
  ];

  it('renders exactly 6 demo included ingredients in initial default state', () => {
    const html = renderToStaticMarkup(
      <IngredientFilterPanel included={mockIncluded} blocked={mockBlocked} />
    );

    // Initial 6 items should be rendered
    expect(html).toContain('tamarind');
    expect(html).toContain('tomato');
    expect(html).toContain('curd');
    expect(html).toContain('moong dal');
    expect(html).toContain('miso');
    expect(html).toContain('lime juice');

    // 7th and 8th items should NOT be present in 6-item demo slice
    expect(html).not.toContain('paneer');
    expect(html).not.toContain('shiitake mushroom');

    // Contains expand button with total count
    expect(html).toContain('View All 8 Ingredients');
  });

  it('renders small photo thumbnail element for each ingredient card', () => {
    const html = renderToStaticMarkup(
      <IngredientFilterPanel included={mockIncluded} blocked={mockBlocked} />
    );

    // Should include img elements with alt text and loading lazy
    expect(html).toContain('alt="tamarind"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('images.unsplash.com');
  });

  it('renders tab switcher showing total count of included and blocked items', () => {
    const html = renderToStaticMarkup(
      <IngredientFilterPanel included={mockIncluded} blocked={mockBlocked} />
    );

    expect(html).toContain('Included (8)');
    expect(html).toContain('Blocked (8)');
  });

  it('renders quick exploration filter chips for non-bulky interactive discovery', () => {
    const html = renderToStaticMarkup(
      <IngredientFilterPanel included={mockIncluded} blocked={mockBlocked} />
    );

    expect(html).toContain('Explore by tag:');
    expect(html).toContain('High Protein');
    expect(html).toContain('Umami Rich');
    expect(html).toContain('Acidic &amp; Citrus');
    expect(html).toContain('Proofs');
  });

  it('safely matches multi-word culinary tokens in image resolver without throwing', () => {
    expect(getIngredientImageUrl('fresh organic ginger root')).toBe(INGREDIENT_IMAGES['ginger']);
    expect(getIngredientImageUrl('toor dal split')).toBe(INGREDIENT_IMAGES['toor dal']);
    expect(getIngredientImageUrl('')).toBe(DEFAULT_INGREDIENT_PHOTO);
  });
});
