// tests/clients.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  flavordbClient,
  normalizeFlavorMolecule,
  adaptFlavorMoleculesToMolecularProfile,
  adaptFlavorEntityToMolecularProfile,
} from '../lib/flavordbClient';
import {
  recipedbClient,
  extractInstructions,
  extractIngredients,
  isGranularRecipe,
  normalizeTitle,
} from '../lib/recipedbClient';
import { resolveIngredientToken } from '../lib/resolveIngredient';
import {
  getIngredientDetail,
  fetchIngredientDetailDynamic,
  isIngredientQuery,
  _testOnly,
} from '../lib/dataService';

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

  it('recipedbClient.searchByIngredient targets recipebyingredient endpoint and enriches with getRecipeById', async () => {
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

    const mockDetailResponse = {
      success: true,
      data: {
        recipe: {
          Recipe_id: '100034',
          Recipe_title: 'Heirloom Tomato and Chili Preserves',
          Region: 'South American',
          Calories: '322.6',
        },
        ingredients: [
          { ingredient_Phrase: '1 lb heirloom tomatoes', ingredient: 'tomato' },
          { ingredient_Phrase: '1 fresh red chili', ingredient: 'chili' },
        ],
        instructions: ['Wash and chop tomatoes.', 'Simmer with minced chili for 20 minutes.'],
      },
    };

    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetailResponse,
      } as Response);

    const result = await recipedbClient.searchByIngredient('ginger');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const searchUrl = fetchSpy.mock.calls[0][0] as string;
    expect(searchUrl).toContain('endpoint=recipebyingredient%2Fby-ingredients-categories-title');
    expect(searchUrl).toContain('includeIngredients=ginger');

    const detailUrl = fetchSpy.mock.calls[1][0] as string;
    expect(detailUrl).toContain('endpoint=search-recipe%2F100034');

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Heirloom Tomato and Chili Preserves');
    expect(result[0].ingredients).toEqual(['1 lb heirloom tomatoes', '1 fresh red chili']);
    expect(result[0].instructions).toEqual(['Wash and chop tomatoes.', 'Simmer with minced chili for 20 minutes.']);
  });

  it('recipedbClient.getRecipeById parses recipe entity, extracts granular ingredients, and extracts instructions', async () => {
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
        instructions: ['Heat oil in large pot.', 'Add garlic and tomatoes, simmer gently.'],
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
    expect(result?.instructions).toEqual(['Heat oil in large pot.', 'Add garlic and tomatoes, simmer gently.']);
  });

  it('recipedbClient.getRecipeById handles structured instruction step objects cleanly', async () => {
    const mockResponse = {
      success: true,
      data: {
        recipe: {
          Recipe_id: '5001',
          Recipe_title: 'Steamed Rice Porridge',
        },
        ingredients: [
          { ingredient_Phrase: '1 cup polished rice', ingredient: 'rice' },
        ],
        instructions: [
          { step: 'Rinse rice thoroughly in cold water.' },
          { steps: 'Boil in 4 cups water until soft and gelatinous.' },
        ],
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await recipedbClient.getRecipeById('5001');
    expect(result?.instructions).toEqual([
      'Rinse rice thoroughly in cold water.',
      'Boil in 4 cups water until soft and gelatinous.',
    ]);
  });

  it('recipedbClient.getRecipeById handles nulls and empty steps in instructions array without throwing', async () => {
    const mockResponse = {
      success: true,
      data: {
        recipe: {
          Recipe_id: '5002',
          Recipe_title: 'Clear Broth',
        },
        ingredients: [
          null,
          { ingredient_Phrase: '1 cup vegetable stock' },
          { ingredient_Phrase: '' },
        ],
        instructions: [
          null,
          { step: 'Heat stock to a gentle simmer.' },
          undefined,
          { step: '' },
          'Serve warm.',
        ],
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await recipedbClient.getRecipeById('5002');
    expect(result).not.toBeNull();
    expect(result?.ingredients).toEqual(['1 cup vegetable stock']);
    expect(result?.instructions).toEqual([
      'Heat stock to a gentle simmer.',
      'Serve warm.',
    ]);
  });

  it('recipedbClient.getRecipeById handles multiline and numbered string instructions', async () => {
    const mockResponse = {
      success: true,
      data: {
        recipe: {
          Recipe_id: '5003',
          Recipe_title: 'Soothing Khichdi',
        },
        ingredients: [
          { ingredient_Phrase: '1/2 cup yellow moong dal' },
          { ingredient_Phrase: '1/2 cup rice' },
        ],
        instructions: '1. Wash rice and lentils.\n2. Pressure cook with turmeric and 4 cups water.\n3. Stir gently and serve.',
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await recipedbClient.getRecipeById('5003');
    expect(result?.instructions).toEqual([
      '1. Wash rice and lentils.',
      '2. Pressure cook with turmeric and 4 cups water.',
      '3. Stir gently and serve.',
    ]);
  });

  it('extractInstructions helper handles all variations robustly', () => {
    expect(extractInstructions(null)).toEqual([]);
    expect(extractInstructions(undefined)).toEqual([]);
    expect(extractInstructions('')).toEqual([]);
    expect(extractInstructions(['Step A', 'Step B'])).toEqual(['Step A', 'Step B']);
    expect(extractInstructions([{ step: 'Step 1' }, { instruction: 'Step 2' }, { description: 'Step 3' }])).toEqual([
      'Step 1',
      'Step 2',
      'Step 3',
    ]);
    expect(extractInstructions('Step 1 || Step 2 || Step 3')).toEqual(['Step 1', 'Step 2', 'Step 3']);
    expect(extractInstructions('1. Boil water. 2. Add salt.')).toEqual(['1. Boil water.', '2. Add salt.']);
  });

  it('isGranularRecipe validates clinical safety requirement', () => {
    expect(isGranularRecipe({ id: '1', title: 'Soup', cuisine: 'Global', prep_time: 10, ingredients: [] })).toBe(false);
    expect(isGranularRecipe({ id: '1', title: 'Miso Soup', cuisine: 'Japanese', prep_time: 10, ingredients: ['Miso Soup'] })).toBe(false);
    expect(isGranularRecipe({ id: '1', title: 'Miso Soup', cuisine: 'Japanese', prep_time: 10, ingredients: ['miso soup '] })).toBe(false);
    expect(isGranularRecipe({ id: '1', title: 'African Curry', cuisine: 'African', prep_time: 10, ingredients: ['Dish'] })).toBe(false);
    expect(isGranularRecipe({ id: '1', title: 'Miso Soup', cuisine: 'Japanese', prep_time: 10, ingredients: ['miso paste', 'tofu', 'seaweed'] })).toBe(true);
  });

  it('recipedbClient.searchByTitle bounds enrichment to 4 recipes and excludes non-granular entries', async () => {
    const mockSearchResponse = {
      success: true,
      data: [
        { Recipe_id: '1', Recipe_title: 'Dish 1' },
        { Recipe_id: '2', Recipe_title: 'Dish 2' },
        { Recipe_id: '3', Recipe_title: 'Dish 3' },
        { Recipe_id: '4', Recipe_title: 'Dish 4' },
        { Recipe_id: '5', Recipe_title: 'Dish 5' },
        { Recipe_id: '6', Recipe_title: 'Dish 6' },
      ],
    };

    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => mockSearchResponse } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            recipe: { Recipe_id: '1', Recipe_title: 'Dish 1' },
            ingredients: [{ ingredient_Phrase: '1 cup rice', ingredient: 'rice' }],
            instructions: ['Cook rice'],
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            recipe: { Recipe_id: '2', Recipe_title: 'Dish 2' },
            ingredients: [{ ingredient_Phrase: '1 cup lentils', ingredient: 'lentil' }],
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            recipe: { Recipe_id: '3', Recipe_title: 'Dish 3' },
            ingredients: [],
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            recipe: { Recipe_id: '4', Recipe_title: 'Dish 4' },
            ingredients: [{ ingredient_Phrase: '1 cup oats', ingredient: 'oats' }],
          },
        }),
      } as Response);

    const results = await recipedbClient.searchByTitle('healthy');

    // 1 search call + 4 enrichment calls = 5 total calls
    expect(fetchSpy).toHaveBeenCalledTimes(5);
    // Dish 1, Dish 2, and Dish 4 have granular ingredients; Dish 3 does not and was filtered out
    expect(results).toHaveLength(3);
    expect(results.map(r => r.id)).toEqual(['1', '2', '4']);
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
    // Temporarily remove carrot from precompiled map to simulate dynamically resolving an ingredient
    const cachedCarrot = _testOnly.ingredientProfilesMap.get('carrot');
    _testOnly.ingredientProfilesMap.delete('carrot');

    try {
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
    } finally {
      if (cachedCarrot) {
        _testOnly.ingredientProfilesMap.set('carrot', cachedCarrot);
      }
    }
  });

  it('fetchIngredientDetailDynamic deduplicates in-flight promises on concurrent lookups', async () => {
    // Delete carrot to force dynamic lookup
    const cachedCarrot = _testOnly.ingredientProfilesMap.get('carrot');
    _testOnly.ingredientProfilesMap.delete('carrot');

    try {
      const mockCarrotEntity = {
        content: [{ entity_id: 110, entity_alias_readable: 'Carrot', category: 'vegetable-root' }],
      };
      const mockCarrotMolecules = {
        content: [{ common_name: 'beta-carotene', pubchem_id: 5280489, flavor_profile: 'sweet@earthy', Taste_threshold_values: '1.0' }],
      };

      const fetchSpy = vi.spyOn(global, 'fetch')
        .mockImplementation(async () => {
          // slight delay to simulate async network flight
          await new Promise(r => setTimeout(r, 10));
          return {
            ok: true,
            json: async () => mockCarrotEntity,
          } as Response;
        });

      // Issue 3 simultaneous concurrent calls
      const [res1, res2, res3] = await Promise.all([
        fetchIngredientDetailDynamic('carrot'),
        fetchIngredientDetailDynamic('carrot'),
        fetchIngredientDetailDynamic('carrot'),
      ]);

      expect(res1.name).toBe('carrot');
      expect(res2.name).toBe('carrot');
      expect(res3.name).toBe('carrot');
      // Only 2 network calls (entity + molecules) should occur for all 3 concurrent requests
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    } finally {
      if (cachedCarrot) {
        _testOnly.ingredientProfilesMap.set('carrot', cachedCarrot);
      }
    }
  });
});

describe('Smart Search Routing & Curated Corpus Cross-Deduplication', () => {
  it('smart search routing correctly differentiates between ingredients in ingredient_kb and dish titles', () => {
    // Canonical ingredients
    expect(isIngredientQuery('ginger')).toBe(true);
    expect(isIngredientQuery('moong dal')).toBe(true);
    expect(isIngredientQuery('coconut water')).toBe(true);
    expect(isIngredientQuery('turmeric')).toBe(true);

    // Aliases in KB
    expect(isIngredientQuery('split yellow mung beans')).toBe(true);
    expect(isIngredientQuery('fresh ginger')).toBe(true);

    // Plurals
    expect(isIngredientQuery('carrots')).toBe(true);
    expect(isIngredientQuery('tomatoes')).toBe(true);
    expect(isIngredientQuery('apples')).toBe(true);

    // Dish titles NOT in ingredient KB
    expect(isIngredientQuery('khichdi')).toBe(false);
    expect(isIngredientQuery('african curry')).toBe(false);
    expect(isIngredientQuery('miso soup')).toBe(false);
    expect(isIngredientQuery('rice porridge')).toBe(false);
    expect(isIngredientQuery('chicken stew')).toBe(false);

    // Defensive empty/null queries
    expect(isIngredientQuery('')).toBe(false);
    expect(isIngredientQuery('   ')).toBe(false);
  });

  it('cross-deduplicates live incoming recipes against curated recipes by id and normalized title', () => {
    const curatedRecipes = [
      { id: 'curated-1', title: 'Moong Dal Khichdi' },
      { id: 'curated-2', title: 'Soothing Rice Congee' },
    ];
    const extraRecipes = [
      { id: 'extra-1', title: 'Ginger Turmeric Tea' },
    ];

    const incomingBatch = [
      { id: 'live-100', title: 'moong  dal  khichdi' }, // duplicate of curated-1 by title
      { id: 'curated-2', title: 'Rice Congee' },         // duplicate of curated-2 by ID
      { id: 'extra-1', title: 'Ginger Turmeric Tea' },   // duplicate of extra-1 by ID
      { id: 'live-101', title: 'Golden Broth' },         // unique new dish
    ];

    const curatedIds = new Set(curatedRecipes.map(c => String(c.id)));
    const curatedTitles = new Set(curatedRecipes.map(c => normalizeTitle(c.title)));

    const existingIds = new Set([...curatedIds, ...extraRecipes.map(p => String(p.id))]);
    const existingTitles = new Set([...curatedTitles, ...extraRecipes.map(p => normalizeTitle(p.title))]);
    const newUnique: any[] = [];

    for (const item of incomingBatch) {
      const normTitle = normalizeTitle(item.title);
      const itemId = String(item.id);
      if (!existingIds.has(itemId) && !existingTitles.has(normTitle)) {
        existingIds.add(itemId);
        existingTitles.add(normTitle);
        newUnique.push(item);
      }
    }

    expect(newUnique).toHaveLength(1);
    expect(newUnique[0].id).toBe('live-101');
    expect(newUnique[0].title).toBe('Golden Broth');
  });
});
