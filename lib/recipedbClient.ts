// lib/recipedbClient.ts
import { fetchViaProxy } from './apiClient';
import { RawRecipe } from './types';

export function extractInstructions(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((i: any) => {
        if (!i) return '';
        if (typeof i === 'string') return i.trim();
        if (typeof i === 'object') {
          return String(i.steps || i.step || i.instruction || i.description || i.text || '').trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.includes('\n')) {
      return trimmed.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    }
    if (trimmed.includes('||')) {
      return trimmed.split('||').map(s => s.trim()).filter(Boolean);
    }
    const numbered = trimmed.split(/(?=\s*\d+\.\s+)/).map(s => s.trim()).filter(Boolean);
    if (numbered.length > 1) {
      return numbered;
    }
    return [trimmed];
  }
  return [];
}

export function extractIngredients(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((i: any) => {
        if (!i) return '';
        if (typeof i === 'string') return i.trim();
        if (typeof i === 'object') {
          return String(i.ingredient_Phrase || i.ingredient || i.name || i.phrase || '').trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof raw === 'string') {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function isGranularRecipe(r: RawRecipe): boolean {
  if (!r.ingredients || r.ingredients.length === 0) return false;
  if (r.ingredients.length === 1) {
    const single = r.ingredients[0].trim().toLowerCase();
    const title = r.title.trim().toLowerCase();
    if (single === title || single === 'dish' || single === 'untitled dish' || single === 'recipe') {
      return false;
    }
  }
  return true;
}

export const normalizeTitle = (t: string | undefined | null): string =>
  typeof t === 'string' ? t.toLowerCase().trim().replace(/[^a-z0-9]/g, '') : '';

export function deduplicateRecipes(recipes: RawRecipe[]): RawRecipe[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const unique: RawRecipe[] = [];

  for (const r of recipes) {
    if (!r) continue;
    const idKey = r.id ? String(r.id).trim() : '';
    const titleKey = normalizeTitle(r.title);

    const hasDuplicateId = idKey ? seenIds.has(idKey) : false;
    const hasDuplicateTitle = titleKey ? seenTitles.has(titleKey) : false;

    if (!hasDuplicateId && !hasDuplicateTitle) {
      if (idKey) seenIds.add(idKey);
      if (titleKey) seenTitles.add(titleKey);
      unique.push(r);
    }
  }

  return unique;
}

function mapRawRecipe(item: any, fallbackIdx = 0): RawRecipe {
  let ingredients = extractIngredients(item?.ingredients ?? item?.Ingredients);
  const title = (item?.Recipe_title || item?.title || '').trim() || 'Untitled Dish';

  if (ingredients.length === 0 && title && title !== 'Untitled Dish') {
    ingredients = [title];
  }

  const rawInstructions =
    item?.instructions ??
    item?.Instructions ??
    item?.steps ??
    item?.Steps;
  const instructions = extractInstructions(rawInstructions);

  return {
    id: String(item?.Recipe_id ?? item?._id ?? `live-${Date.now()}-${fallbackIdx}`),
    title,
    cuisine: (item?.Region || item?.Sub_region || item?.Continent || item?.cuisine || '').trim() || 'Global',
    prep_time: Number(item?.prep_time || item?.total_time || 25),
    ingredients,
    temperature_tag: 'warm' as const,
    protein_g: Number(item?.['Protein (g)'] || item?.Protein || item?.protein_g || 14),
    calories: Number(item?.Calories || item?.calories || 320),
    image_url: item?.img_url || item?.image_url,
    servings: Number(item?.servings || 4),
    processes: typeof item?.Processes === 'string'
      ? item.Processes.split('||')
      : (item?.processes ?? ['simmer']),
    instructions: instructions.length > 0 ? instructions : undefined,
    is_live: true,
  };
}

export const recipedbClient = {
  async getRecipeById(id: string): Promise<RawRecipe | null> {
    try {
      if (!id || typeof id !== 'string' || !id.trim()) return null;
      const raw = await fetchViaProxy<any>({
        db: 'recipedb',
        endpoint: `search-recipe/${encodeURIComponent(id.trim())}`,
      });
      const data = raw?.data ?? raw;
      const recipe = data?.recipe ?? data;
      if (!recipe) return null;

      const title = (recipe?.Recipe_title || recipe?.title || '').trim() || 'Untitled Dish';
      const rawIngredients =
        data?.ingredients ??
        recipe?.ingredients ??
        data?.Ingredients ??
        recipe?.Ingredients;
      const ingredients = extractIngredients(rawIngredients);

      const rawInstructions =
        data?.instructions ??
        data?.Instructions ??
        recipe?.instructions ??
        recipe?.Instructions ??
        data?.steps ??
        data?.Steps ??
        recipe?.steps ??
        recipe?.Steps;
      const instructions = extractInstructions(rawInstructions);

      return {
        id: String(recipe.Recipe_id ?? id.trim()),
        title,
        cuisine: (recipe.Region || recipe.Sub_region || recipe.Continent || recipe.cuisine || '').trim() || 'Global',
        prep_time: Number(recipe.prep_time || recipe.total_time || 25),
        ingredients: ingredients.length > 0 ? ingredients : [title !== 'Untitled Dish' ? title : 'Dish'],
        temperature_tag: 'warm' as const,
        protein_g: Number(recipe['Protein (g)'] || recipe.Protein || 14),
        calories: Number(recipe.Calories || 320),
        image_url: recipe.img_url || recipe.image_url,
        servings: Number(recipe.servings || 4),
        processes: typeof recipe.Processes === 'string'
          ? recipe.Processes.split('||')
          : (recipe.processes ?? ['simmer']),
        instructions: instructions.length > 0 ? instructions : undefined,
        is_live: true,
      };
    } catch {
      return null;
    }
  },

  async searchByTitle(title: string): Promise<RawRecipe[]> {
    if (!title || typeof title !== 'string' || !title.trim()) return [];
    const raw = await fetchViaProxy<any>({
      db: 'recipedb',
      endpoint: 'recipe-bytitle/recipeByTitle',
      params: { title: title.trim() },
    });

    const items: any[] = Array.isArray(raw)
      ? raw
      : (raw?.data && Array.isArray(raw.data) ? raw.data : []);

    const baseRecipes = items.map((item, idx) => mapRawRecipe(item, idx));
    const uniqueBase = deduplicateRecipes(baseRecipes);

    // Bound enrichment to 4 fully evaluated unique recipes to protect clinical safety and conserve token budget
    const candidates = uniqueBase.slice(0, 4);
    const enriched = await Promise.all(
      candidates.map(async (recipe) => {
        const full = await recipedbClient.getRecipeById(recipe.id);
        return full || recipe;
      })
    );

    // Return only recipes that have granular ingredient lists and ensure post-enrichment uniqueness
    return deduplicateRecipes(enriched.filter(isGranularRecipe));
  },

  async getRecipesByCuisine(region: string): Promise<RawRecipe[]> {
    const raw = await fetchViaProxy<any>({
      db: 'recipedb',
      endpoint: `recipes_cuisine/cuisine/${encodeURIComponent(region)}`,
    });
    const items: any[] = Array.isArray(raw)
      ? raw
      : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
    return deduplicateRecipes(items.map((item, idx) => mapRawRecipe(item, idx)));
  },

  async searchByIngredient(ingredient: string): Promise<RawRecipe[]> {
    if (!ingredient || typeof ingredient !== 'string' || !ingredient.trim()) return [];
    const raw = await fetchViaProxy<any>({
      db: 'recipedb',
      endpoint: 'recipebyingredient/by-ingredients-categories-title',
      params: { includeIngredients: ingredient.trim() },
    });
    const items: any[] = Array.isArray(raw)
      ? raw
      : (raw?.data && Array.isArray(raw.data) ? raw.data : []);
    const baseRecipes = items.map((item, idx) => mapRawRecipe(item, idx));
    const uniqueBase = deduplicateRecipes(baseRecipes);

    // Enrich returned items using getRecipeById so ingredient searches yield full recipes with instructions and ingredients
    const candidates = uniqueBase.slice(0, 4);
    const enriched = await Promise.all(
      candidates.map(async (recipe) => {
        const full = await recipedbClient.getRecipeById(recipe.id);
        return full || recipe;
      })
    );

    // Return only recipes that have granular ingredient lists and ensure post-enrichment uniqueness
    return deduplicateRecipes(enriched.filter(isGranularRecipe));
  },
};
