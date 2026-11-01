// tests/clients.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  flavordbClient,
  normalizeFlavorMolecule,
  adaptFlavorMoleculesToMolecularProfile,
  adaptFlavorEntityToMolecularProfile,
} from '../lib/flavordbClient';
import { recipedbClient } from '../lib/recipedbClient';
import { resolveIngredientToken } from '../lib/resolveIngredient';
import { getIngredientDetail, fetchIngredientDetailDynamic } from '../lib/dataService';

describe('FlavorDB & RecipeDB Client Protocol Compliance', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('flavordbClient.getEntityByAlias passes entity_alias_readable param and unwraps content envelope', async () => {
    const mockResponse = {
      content: [
        {
          entity_id: 364,
          entity_alias_readable: 'Tomato',
          category: 'vegetable-fruit',
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await flavordbClient.getEntityByAlias('Tomato');

    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('endpoint=entities%2Fby-entity-alias-readable');
    expect(calledUrl).toContain('entity_alias_readable=Tomato');
    expect(result).toHaveLength(1);
    expect(result[0].entity_alias_readable).toBe('Tomato');
  });

  it('flavordbClient.getTasteThresholds defaults to non-empty values param and normalizes Foodoscope schema', async () => {
    // Real Foodoscope returns Taste_threshold_values as a string and flavor_profile as '@'-delimited string
    const mockResponse = {
      content: [
        {
          id: 1049,
          common_name: 'citric acid',
          Taste_threshold_values: '2.5',
          threshold_unit: 'umol/ml',
          flavor_profile: 'acidic@sour@citrus',
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await flavordbClient.getTasteThresholds();

    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('endpoint=properties%2Ftaste-threshold');
    expect(calledUrl).toContain('values=sweet'); // Default non-empty parameter preventing HTTP 400
    expect(result).toHaveLength(1);
    expect(result[0].common_name).toBe('citric acid');
    expect(result[0].Taste_threshold_values).toBe('2.5');
    expect(result[0].taste_threshold).toBe(2.5);
    expect(result[0].flavor_profile).toEqual(['acidic', 'sour', 'citrus']);
  });

  it('flavordbClient.getTasteThresholds accepts explicit custom values parameter', async () => {
    const mockResponse = {
      content: [
        {
          id: 2010,
          common_name: 'quinine',
          Taste_threshold_values: '0.008',
          threshold_unit: 'umol/ml',
          flavor_profile: 'bitter@astringent',
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await flavordbClient.getTasteThresholds('bitter');

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('values=bitter');
    expect(result[0].flavor_profile).toEqual(['bitter', 'astringent']);
    expect(result[0].taste_threshold).toBe(0.008);
  });

  it('flavordbClient.getMoleculesByDescription passes desc param and normalizes real Foodoscope payload', async () => {
    const mockResponse = {
      content: [
        {
          common_name: 'vanillin',
          Taste_threshold_values: '1.2',
          flavor_profile: 'sweet@vanilla@caramel',
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await flavordbClient.getMoleculesByDescription('sweet');

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('endpoint=properties%2Fby-description');
    expect(calledUrl).toContain('desc=sweet');
    expect(result).toHaveLength(1);
    expect(result[0].common_name).toBe('vanillin');
    expect(result[0].Taste_threshold_values).toBe('1.2');
    expect(result[0].taste_threshold).toBe(1.2);
    expect(result[0].flavor_profile).toEqual(['sweet', 'vanilla', 'caramel']);
  });

  it('flavordbClient.getMoleculeDetails passes common_name param and normalizes molecule details', async () => {
    const mockResponse = {
      content: [
        {
          pubchem_id: 1183,
          common_name: 'vanillin',
          Taste_threshold_values: '1.2',
          flavor_profile: 'sweet@creamy',
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await flavordbClient.getMoleculeDetails('vanillin');

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('endpoint=molecules_data%2Fby-commonName');
    expect(calledUrl).toContain('common_name=vanillin');
    expect(result?.pubchem_id).toBe(1183);
    expect(result?.Taste_threshold_values).toBe('1.2');
    expect(result?.flavor_profile).toEqual(['sweet', 'creamy']);
  });

  it('recipedbClient.searchByIngredient targets recipebyingredient endpoint with includeIngredients param', async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          Recipe_id: '100034',
          Recipe_title: 'Heirloom Tomato and Chili Preserves',
          Region: 'South American',
          Calories: '322.6',
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await recipedbClient.searchByIngredient('ginger');

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('endpoint=recipebyingredient%2Fby-ingredients-categories-title');
    expect(calledUrl).toContain('includeIngredients=ginger');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Heirloom Tomato and Chili Preserves');
  });

  it('recipedbClient.getRecipeById parses recipe entity and extracts granular ingredient phrases', async () => {
    const mockResponse = {
      success: true,
      data: {
        recipe: {
          Recipe_id: '2642',
          Recipe_title: 'African Curry',
          Region: 'Rest Africa',
          Calories: '600.0',
        },
        ingredients: [
          { ingredient_Phrase: '2 cloves garlic , peeled and chopped', ingredient: 'garlic' },
          { ingredient_Phrase: '1 can whole peeled tomatoes', ingredient: 'tomato' },
        ],
      },
    };

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await recipedbClient.getRecipeById('2642');

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('endpoint=search-recipe%2F2642');
    expect(result).not.toBeNull();
    expect(result?.title).toBe('African Curry');
    expect(result?.ingredients).toContain('2 cloves garlic , peeled and chopped');
    expect(result?.ingredients).toContain('1 can whole peeled tomatoes');
  });
});

describe('Data Adapter & Laplace-Smoothed MolecularProfile Mapping', () => {
  it('adaptFlavorMoleculesToMolecularProfile calculates Laplace-smoothed fractions and key molecules', () => {
    const mockMolecules = [
      { common_name: 'glutamic acid', pubchem_id: 33032, flavor_profile: ['umami', 'savory'] },
      { common_name: 'citric acid', pubchem_id: 311, flavor_profile: ['acidic', 'sour'] },
      { common_name: 'vanillin', pubchem_id: 1183, flavor_profile: ['sweet', 'vanilla'] },
      { common_name: 'diallyl disulfide', pubchem_id: 16590, flavor_profile: ['sulfur', 'garlic', 'pungent'] },
      { common_name: 'quinine', pubchem_id: 8549, flavor_profile: ['bitter'] },
    ];

    const profile = adaptFlavorMoleculesToMolecularProfile(mockMolecules);

    expect(profile.n_total).toBe(5);
    // Denominator = 5 + 5 = 10
    expect(profile.pct.umami).toBe(0.1); // 1 / 10
    expect(profile.pct.sour).toBe(0.1);  // 1 / 10
    expect(profile.pct.sweet).toBe(0.1); // 1 / 10
    expect(profile.pct.bitter).toBe(0.1); // 1 / 10
    expect(profile.pct.nausea_aroma).toBe(0.1); // 1 / 10
    expect(profile.confidence).toBe('low'); // < 10 molecules
    expect(profile.key_molecules).toHaveLength(5);
    expect(profile.key_molecules?.[0].name).toBe('glutamic acid');
    expect(profile.key_molecules?.[0].role).toContain('T1R1/T1R3');
  });

  it('adaptFlavorEntityToMolecularProfile handles entity with embedded molecules', () => {
    const mockEntity = {
      entity_id: 99,
      entity_alias_readable: 'Lemongrass',
      category: 'herb',
      molecules: [
        { common_name: 'citral', pubchem_id: 638011, flavor_profile: 'citrus@lemon@sour' },
      ],
    };

    const profile = adaptFlavorEntityToMolecularProfile(mockEntity);
    expect(profile.n_total).toBe(1);
    expect(profile.pct.sour).toBeGreaterThan(0);
    expect(profile.key_molecules?.[0].name).toBe('citral');
  });
});

describe('normalizeFlavorMolecule Schema Alignment & Edge Cases', () => {
  it('normalizes @-delimited strings, camelCase, and parsed numeric thresholds', () => {
    const raw = {
      molecule_id: 42,
      pubchem_id: '12345',
      name: 'linalool',
      flavorProfile: 'citrus@floral@woody',
      Taste_threshold_values: '0.005',
    };

    const normalized = normalizeFlavorMolecule(raw);
    expect(normalized.id).toBe(42);
    expect(normalized.pubchem_id).toBe(12345);
    expect(normalized.common_name).toBe('linalool');
    expect(normalized.flavor_profile).toEqual(['citrus', 'floral', 'woody']);
    expect(normalized.aroma_descriptors).toEqual(['citrus', 'floral', 'woody']);
    expect(normalized.Taste_threshold_values).toBe('0.005');
    expect(normalized.taste_threshold).toBe(0.005);
  });

  it('handles null, empty, or invalid inputs safely without throwing', () => {
    expect(normalizeFlavorMolecule(null).flavor_profile).toEqual([]);
    expect(normalizeFlavorMolecule(undefined).flavor_profile).toEqual([]);
    expect(normalizeFlavorMolecule('invalid' as any).flavor_profile).toEqual([]);

    const malformed = {
      pubchem_id: -99,
      Taste_threshold_values: 'not-a-number',
      flavor_profile: ['  mint  ', '', 'fresh'],
    };
    const res = normalizeFlavorMolecule(malformed);
    expect(res.pubchem_id).toBeUndefined();
    expect(res.taste_threshold).toBeUndefined();
    expect(res.Taste_threshold_values).toBe('not-a-number');
    expect(res.flavor_profile).toEqual(['mint', 'fresh']);
  });
});

describe('Recipe Modal Ingredient Drill-Down & Dynamic Live Fallback', () => {
  it('resolveIngredientToken extracts canonical name from raw recipe ingredient strings', () => {
    expect(resolveIngredientToken('1/2 tsp ginger')).toBe('ginger');
    expect(resolveIngredientToken('1 cup moong dal')).toBe('moong dal');
    expect(resolveIngredientToken('1/2 cup rice')).toBe('rice');
    expect(resolveIngredientToken('2 cloves garlic, peeled and chopped')).toBe('garlic');
    expect(resolveIngredientToken('1 can whole peeled tomatoes')).toBe('tomato');
    expect(resolveIngredientToken('1/2 cup bottle gourd (lauki), diced')).toBe('lauki');
  });

  it('resolveIngredientToken ranks longest matches first to prevent short substring preemption', () => {
    expect(resolveIngredientToken('1 cup chilled coconut water')).toBe('coconut water');
    expect(resolveIngredientToken('1 cup baked sweet potato')).toBe('sweet potato');
    expect(resolveIngredientToken('1 tbsp organic apple cider vinegar')).toBe('apple cider vinegar');
    expect(resolveIngredientToken(null as any)).toBe('');
    expect(resolveIngredientToken('')).toBe('');
  });

  it('getIngredientDetail resolves precompiled profile even if raw line string is supplied', () => {
    const detail = getIngredientDetail('1/2 tsp ginger');
    expect(detail.name).toBe('ginger');
    expect(detail.profile).toBeDefined();
    expect(detail.profile?.molecular.n_total).toBeGreaterThan(0);
    expect(detail.entry).toBeDefined();

    // Null safety
    expect(getIngredientDetail(null as any).name).toBe('');
    expect(getIngredientDetail(undefined as any).name).toBe('');
    expect(getIngredientDetail('').name).toBe('');
  });

  it('fetchIngredientDetailDynamic fetches FlavorDB entity and returns dynamic IngredientProfile with caching', async () => {
    const mockEntityResponse = {
      content: [
        {
          entity_id: 512,
          entity_alias_readable: 'Lemongrass',
          category: 'herb',
        },
      ],
    };

    const mockMoleculeResponse = {
      content: [
        {
          common_name: 'citral',
          pubchem_id: 638011,
          flavor_profile: 'citrus@lemon@sour',
          Taste_threshold_values: '0.4',
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntityResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMoleculeResponse,
      } as Response);

    const dynamicRes = await fetchIngredientDetailDynamic('1 stalk fresh lemongrass');

    expect(dynamicRes.name).toBe('lemongrass');
    expect(dynamicRes.profile).toBeDefined();
    expect(dynamicRes.profile?.molecular.pct.sour).toBeGreaterThan(0);
    expect(dynamicRes.profile?.molecular.key_molecules?.[0].name).toBe('citral');

    // Subsequent call should hit in-memory cache directly without re-fetching
    const cachedRes = await fetchIngredientDetailDynamic('lemongrass');
    expect(cachedRes.profile).toBeDefined();
    expect(fetchSpy).toHaveBeenCalledTimes(2); // Only the initial 2 calls occurred
  });

  it('fetchIngredientDetailDynamic resolves KB-present ingredients missing precompiled molecular profiles while preserving KB nutrition', async () => {
    // Carrot is in ingredient_kb.json (protein: 0.9g) but NOT in ingredient_profiles.json
    const mockCarrotEntity = {
      content: [
        {
          entity_id: 110,
          entity_alias_readable: 'Carrot',
          category: 'vegetable-root',
        },
      ],
    };

    const mockCarrotMolecules = {
      content: [
        {
          common_name: 'beta-carotene',
          pubchem_id: 5280489,
          flavor_profile: 'sweet@earthy',
          Taste_threshold_values: '1.0',
        },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCarrotEntity,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCarrotMolecules,
      } as Response);

    const carrotRes = await fetchIngredientDetailDynamic('1 medium diced carrot');

    expect(carrotRes.name).toBe('carrot');
    expect(carrotRes.entry).toBeDefined();
    expect(carrotRes.entry?.protein_per_100g).toBe(0.9); // Curated KB protein preserved
    expect(carrotRes.profile).toBeDefined();
    expect(carrotRes.profile?.protein_per_100g).toBe(0.9);
    expect(carrotRes.profile?.molecular.key_molecules?.[0].name).toBe('beta-carotene');
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
