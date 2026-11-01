// tests/clients.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flavordbClient } from '../lib/flavordbClient';
import { recipedbClient } from '../lib/recipedbClient';

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

  it('flavordbClient.getMoleculesByDescription passes desc param and unwraps content envelope', async () => {
    const mockResponse = {
      content: [
        {
          common_name: 'vanillin',
          taste_threshold: 1.2,
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
  });

  it('flavordbClient.getMoleculeDetails passes common_name param and returns single object', async () => {
    const mockResponse = {
      content: [
        {
          pubchem_id: 1183,
          common_name: 'vanillin',
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
