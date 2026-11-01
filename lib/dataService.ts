// lib/dataService.ts
import { DrugProfile, UserContext, RawRecipe, ScoredRecipe, KBEntry, IngredientProfile, SensoryAxisPoint, SubstitutionDelta } from './types';
import { DRUG_PROFILES } from '../data/drugProfiles';
import { buildEffectiveProfile, buildConstraints } from './safety';
import { buildScoredMap, scoreRecipe, computeSensoryRadarData } from './algorithm';

import rawCuratedRecipes from '../data/curated_recipes.json';
import rawIngredientKB from '../data/ingredient_kb.json';
import rawIngredientProfiles from '../data/precompiled/ingredient_profiles.json';

const curatedRecipes: RawRecipe[] = rawCuratedRecipes as RawRecipe[];
const ingredientKBMap = new Map<string, KBEntry>(Object.entries(rawIngredientKB as Record<string, KBEntry>));
const ingredientProfilesMap = new Map<string, IngredientProfile>(
  Object.entries(rawIngredientProfiles as Record<string, IngredientProfile>)
);

export interface RecommendationResult {
  effectiveProfile: DrugProfile;
  constraints: ReturnType<typeof buildConstraints>;
  scoredRecipes: ScoredRecipe[];
  radarData: SensoryAxisPoint[];
  includedIngredients: Array<{ name: string; score: number; tags: string[]; protein: number; reason: string }>;
  blockedIngredients: Array<{ name: string; reason: string; rule: string }>;
  substitutions: SubstitutionDelta[];
  provenance: {
    mode: 'curated_offline' | 'live_api';
    recipeCount: number;
    profiledCount: number;
  };
}

export const COMMON_SUBSTITUTIONS: SubstitutionDelta[] = [
  {
    originalIngredient: 'Red Meat / Beef',
    recommendedSubstitute: 'Split Moong Dal / Fresh Chhena',
    tasteDelta: 'Eliminates 1-octen-3-one lipid oxidation volatiles while preserving umami signaling.',
    aromaDelta: 'Replaces strong sulfurous/heme aroma with mild comforting neutral notes.',
    clinicalRationale: 'Red meat heme iron catalytically oxidizes salivary lipids, generating overwhelming metallic phantoms.',
    proteinComparison: '24g / 100g (Moong Dal) vs 26g / 100g (Beef) — zero muscle wasting penalty.',
  },
  {
    originalIngredient: 'Raw Citrus / Lemon (Active Mucositis)',
    recommendedSubstitute: 'Soothing Curd (Lactic Acid) / Polished Rice Broth',
    tasteDelta: 'Replaces sharp citric burn with gentle buffering creaminess.',
    aromaDelta: 'Zero stinging citrus terpenes; smooth lactic sensation.',
    clinicalRationale: 'Citric acid triggers agonizing neuropathic pain on exposed submucosa during grade 2+ mucositis.',
    proteinComparison: '10g / cup (Curd) provides soothing barrier protection.',
  },
  {
    originalIngredient: 'Cold Fruit Smoothie / Ice Cream (Oxaliplatin)',
    recommendedSubstitute: 'Lukewarm Golden Congee / Warm Mashed Sweet Potato',
    tasteDelta: 'Comforting warmth enhances volatile evaporation without cold-shock.',
    aromaDelta: 'Mild ginger and vanilla notes safe below olfactory emetic threshold.',
    clinicalRationale: 'Oxaliplatin causes acute Nav channel inactivation; cold liquid triggers instant vocal cord closure and pharyngeal spasms.',
    proteinComparison: '14g (Golden Congee) vs 3g (Fruit Smoothie).',
  },
  {
    originalIngredient: 'Fried Garlic & Raw Onions',
    recommendedSubstitute: 'Lightly Tempered Cumin (Jeera) & Mild Grated Ginger',
    tasteDelta: 'Delivers subtle savory depth without harsh allicin bite.',
    aromaDelta: 'Eliminates diallyl disulfide volatiles that trigger intense chemotherapy nausea.',
    clinicalRationale: 'Chemotherapy parosmia distorts sulfurous aromatics into sickening rot/garbage phantoms.',
    proteinComparison: 'Caloric density preserved with pure ghee carrier.',
  },
];

export function getRecommendations(
  drugIds: string[],
  context: UserContext,
  additionalRecipes?: RawRecipe[],
  forceOffline = true
): RecommendationResult {
  const selectedProfiles = drugIds
    .map(id => DRUG_PROFILES[id])
    .filter((p): p is DrugProfile => Boolean(p));

  if (selectedProfiles.length === 0) {
    throw new Error('No valid drug profile selected.');
  }

  const effectiveProfile = buildEffectiveProfile(selectedProfiles, context);
  const constraints = buildConstraints(effectiveProfile, context);

  // Score ingredient pool
  const scoredMap = buildScoredMap(
    ingredientKBMap,
    ingredientProfilesMap,
    effectiveProfile,
    constraints,
    context
  );

  // Pool recipes
  const allRecipes = [...curatedRecipes, ...(additionalRecipes ?? [])];

  // Score and categorize recipes
  const scoredRecipes = allRecipes.map(r =>
    scoreRecipe(r, ingredientKBMap, scoredMap, effectiveProfile, constraints, context)
  );

  // Rank: non-excluded first by score descending, then excluded
  scoredRecipes.sort((a, b) => {
    if (a.excluded && !b.excluded) return 1;
    if (!a.excluded && b.excluded) return -1;
    return b.taste_safe_score - a.taste_safe_score;
  });

  // Calculate sensory radar points
  const radarData = computeSensoryRadarData(effectiveProfile);

  // Categorize ingredient intelligence
  const includedIngredients: Array<{ name: string; score: number; tags: string[]; protein: number; reason: string }> = [];
  const blockedIngredients: Array<{ name: string; reason: string; rule: string }> = [];

  for (const [name, entry] of ingredientKBMap.entries()) {
    // Check if blocked
    let isBlocked = false;
    let blockReason = '';
    let blockRule = '';

    for (const pattern of constraints.blockedPatterns) {
      if (pattern.test(name)) {
        isBlocked = true;
        blockReason = `Contradicted oncology interaction with ${effectiveProfile.display_name}.`;
        blockRule = 'P0: Universal Oncology Safety';
        break;
      }
    }

    if (!isBlocked) {
      for (const tag of entry.tags) {
        if (constraints.blockedTags.has(tag)) {
          isBlocked = true;
          blockReason = constraints.reasons[tag] ?? `Contraindicated tag: ${tag}`;
          blockRule = tag === 'cold_serve' || tag === 'acidic' ? 'P1: Regimen Override' : 'P0: Global Safety';
          break;
        }
      }
    }

    if (isBlocked) {
      blockedIngredients.push({ name, reason: blockReason, rule: blockRule });
    } else if (!entry.neutral_base) {
      const score = scoredMap.get(name) ?? 0;
      let reason = 'Safe, perceptible, and supportive of sensory recovery.';
      if (score >= 0.5) reason = 'High taste modulation affinity; activates intact umami or chelation pathways.';
      else if (score < 0) reason = 'Low taste affinity; tolerated but mild sensory benefit.';

      includedIngredients.push({
        name,
        score: Math.round(score * 100) / 100,
        tags: entry.tags,
        protein: entry.protein_per_100g ?? 0,
        reason,
      });
    }
  }

  // Sort included ingredients by score descending
  includedIngredients.sort((a, b) => b.score - a.score);

  return {
    effectiveProfile,
    constraints,
    scoredRecipes,
    radarData,
    includedIngredients,
    blockedIngredients,
    substitutions: COMMON_SUBSTITUTIONS,
    provenance: {
      mode: forceOffline ? 'curated_offline' : 'live_api',
      recipeCount: allRecipes.length,
      profiledCount: ingredientKBMap.size,
    },
  };
}

export function getIngredientDetail(name: string): {
  name: string;
  entry?: KBEntry;
  profile?: IngredientProfile;
} {
  const lower = name.toLowerCase();
  const entry = ingredientKBMap.get(lower);
  const profile = ingredientProfilesMap.get(lower);
  return {
    name,
    entry,
    profile,
  };
}

