// lib/recipedbClient.ts
import { fetchViaProxy } from './apiClient';
import { RawRecipe } from './types';

function mapRawRecipe(item: any, fallbackIdx = 0): RawRecipe {
  let ingredients: string[] = [];
  if (Array.isArray(item.ingredients)) {
    ingredients = item.ingredients
      .map((i: any) => (typeof i === 'string' ? i : (i.name || i.ingredient_Phrase || i.ingredient || '')))
      .filter(Boolean);
  } else if (typeof item.ingredients === 'string') {
    ingredients = item.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean);
  }

  if (ingredients.length === 0 && item.Recipe_title) {
    ingredients = [item.Recipe_title];
  }

  return {
    id: String(item.Recipe_id ?? item._id ?? `live-${Date.now()}-${fallbackIdx}`),
    title: item.Recipe_title ?? item.title ?? 'Untitled Dish',
    cuisine: item.Region ?? item.Sub_region ?? item.Continent ?? item.cuisine ?? 'Global',
    prep_time: Number(item.prep_time || item.total_time || 25),
    ingredients,
    temperature_tag: 'warm' as const,
    protein_g: Number(item['Protein (g)'] || item.Protein || item.protein_g || 14),
    calories: Number(item.Calories || item.calories || 320),
    image_url: item.img_url || item.image_url,
    servings: Number(item.servings || 4),
    processes: typeof item.Processes === 'string'
      ? item.Processes.split('||')
      : (item.processes ?? ['simmer']),
  };
}

export const recipedbClient = {
  async getRecipeById(id: string): Promise<RawRecipe | null> {
    try {
      const raw = await fetchViaProxy<any>({
        db: 'recipedb',
        endpoint: `search-recipe/${encodeURIComponent(id)}`,
      });
      const data = raw?.data ?? raw;
      const recipe = data?.recipe ?? data;
      if (!recipe) return null;

      const rawIngredients: any[] = Array.isArray(data?.ingredients) ? data.ingredients : [];
      const ingredients = rawIngredients
        .map(i => i.ingredient_Phrase || i.ingredient || '')
        .filter(Boolean);

      return {
        id: String(recipe.Recipe_id ?? id),
        title: recipe.Recipe_title ?? 'Untitled Dish',
        cuisine: recipe.Region ?? recipe.Sub_region ?? recipe.Continent ?? 'Global',
        prep_time: Number(recipe.prep_time || recipe.total_time || 25),
        ingredients: ingredients.length > 0 ? ingredients : [recipe.Recipe_title || 'Dish'],
        temperature_tag: 'warm' as const,
        protein_g: Number(recipe['Protein (g)'] || recipe.Protein || 14),
        calories: Number(recipe.Calories || 320),
        image_url: recipe.img_url || recipe.image_url,
        servings: Number(recipe.servings || 4),
        processes: typeof recipe.Processes === 'string'
          ? recipe.Processes.split('||')
          : (recipe.processes ?? ['simmer']),
      };
    } catch {
      return null;
    }
  },

  async searchByTitle(title: string): Promise<RawRecipe[]> {
    const raw = await fetchViaProxy<any>({
      db: 'recipedb',
      endpoint: 'recipe-bytitle/recipeByTitle',
      params: { title },
    });

    const items: any[] = Array.isArray(raw)
      ? raw
      : (raw?.data && Array.isArray(raw.data) ? raw.data : []);

    const baseRecipes = items.map((item, idx) => mapRawRecipe(item, idx));

    // Opportunistically enrich the first 3 items with granular ingredient lists from search-recipe
    const enriched = await Promise.all(
      baseRecipes.slice(0, 3).map(async (recipe) => {
        const full = await recipedbClient.getRecipeById(recipe.id);
        return full || recipe;
      })
    );

    return [...enriched, ...baseRecipes.slice(3)];
  },

  async getRecipesByCuisine(region: string): Promise<RawRecipe[]> {
    const raw = await fetchViaProxy<any>({
      db: 'recipedb',
      endpoint: `recipes_cuisine/cuisine/${encodeURIComponent(region)}`,
    });
    const items: any[] = Array.isArray(raw)
      ? raw
      : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
    return items.map((item, idx) => mapRawRecipe(item, idx));
  },

  async searchByIngredient(ingredient: string): Promise<RawRecipe[]> {
    const raw = await fetchViaProxy<any>({
      db: 'recipedb',
      endpoint: 'recipebyingredient/by-ingredients-categories-title',
      params: { includeIngredients: ingredient },
    });
    const items: any[] = Array.isArray(raw)
      ? raw
      : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
    return items.map((item, idx) => mapRawRecipe(item, idx));
  },
};
