// lib/recipedbClient.ts
import { fetchViaProxy } from './apiClient';
import { RawRecipe } from './types';

export const recipedbClient = {
  async searchByTitle(title: string): Promise<RawRecipe[]> {
    return fetchViaProxy<RawRecipe[]>({
      db: 'recipedb',
      endpoint: 'recipe-bytitle/recipeByTitle',
      params: { title },
    });
  },

  async getRecipesByCuisine(region: string): Promise<RawRecipe[]> {
    return fetchViaProxy<RawRecipe[]>({
      db: 'recipedb',
      endpoint: `recipes_cuisine/cuisine/${encodeURIComponent(region)}`,
    });
  },

  async searchByIngredient(ingredient: string): Promise<RawRecipe[]> {
    return fetchViaProxy<RawRecipe[]>({
      db: 'recipedb',
      endpoint: 'recipes/ingredient',
      params: { ingredient },
    });
  },
};
