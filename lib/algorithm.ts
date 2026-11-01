// lib/algorithm.ts
import { DrugProfile, UserContext, Constraints, KBEntry, RawRecipe, ScoredRecipe, IngredientProfile, SensoryAxisPoint } from './types';
import { COLD_DISH_PATTERNS, NON_VEG_PATTERNS, isNonVegetarian } from './safety';
import { resolveIngredient } from './resolveIngredient';

export const GAIN = 2.0;
export const LAMBDA = 0.7;
export const EPSILON = 5;

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function isColdDish(r: RawRecipe): boolean {
  if (r.temperature_tag === 'cold') return true;
  if (COLD_DISH_PATTERNS.some(rx => rx.test(r.title))) return true;
  if (r.processes?.some(p => /chill|refrigerat|freeze|sorbet|slush|popsicle/i.test(p))) return true;
  if (r.ingredients?.some(i => COLD_DISH_PATTERNS.some(rx => rx.test(i)))) return true;
  return false;
}

export function isMoistDish(r: RawRecipe): boolean {
  return /\b(soup|broth|khichdi|stew|curry|purée|puree|dal|dhal|sauce|congee|porridge|kanji|velouté|veloute)\b/i.test(r.title);
}

export function scoreIngredient(
  name: string,
  entry: KBEntry | undefined,
  mol: IngredientProfile['molecular'] | undefined,
  p: DrugProfile,
  c: Constraints,
  ctx: UserContext
): number {
  if (!entry) return 0.0;
  if (entry.neutral_base) return 0.0;

  const tastants = entry.tastants ?? { sweet: 0, sour: 0, umami: 0, bitter: 0, salty: 0 };
  const hasMol = mol && mol.n_total >= 10;
  const lambda = hasMol ? LAMBDA : 1.0;

  const g_sour = lambda * (tastants.sour / 3) + (1 - lambda) * (mol?.pct.sour ?? 0);
  const g_sweet = lambda * (tastants.sweet / 3) + (1 - lambda) * (mol?.pct.sweet ?? 0);
  const g_umami = lambda * (tastants.umami / 3) + (1 - lambda) * (mol?.pct.umami ?? 0);
  const g_bitter = lambda * (tastants.bitter / 3) + (1 - lambda) * (mol?.pct.bitter ?? 0);
  const g_aroma = hasMol ? (mol?.pct.nausea_aroma ?? 0) : (entry.tags.includes('high_aroma') ? 0.8 : 0.1);

  // Dynamic weights based on oncology sensory shift
  const w_sour = c.allowAcidMasking ? 0.40 * (p.metallic_intensity / 3.0) : 0.0;
  const w_umami = 0.35;
  const w_sweet = p.sweet_threshold_raised ? (c.capSweetBoost ? 0.20 : 0.35) : 0.10;
  const w_bitter = 0.30 * (p.bitter_phantom / 3.0);
  const w_aroma = 0.40 * (p.nausea_risk / 3.0);

  const W = Math.max(0.5, w_sour + w_umami + w_sweet + w_bitter + w_aroma);

  let raw = (w_sour * g_sour + w_umami * g_umami + w_sweet * g_sweet - w_bitter * g_bitter - w_aroma * g_aroma) / W;

  // Active bonuses
  if (p.zinc_depletion && entry.tags.includes('zinc_rich')) {
    raw += 0.05;
  }
  if (entry.tags.includes('metal_chelator') && p.metallic_intensity >= 2 && c.allowAcidMasking) {
    raw += 0.05;
  }

  // Active penalties
  if (entry.tags.includes('red_meat') && p.metallic_intensity >= 2 && !ctx.toleratesRedMeat) {
    raw -= 0.25;
  }
  if (entry.tags.includes('high_aroma') && p.nausea_risk >= 2) {
    raw -= 0.20;
  }

  return clamp(raw, -1.0, 1.0);
}

export function buildScoredMap(
  kbMap: Map<string, KBEntry>,
  molMap: Map<string, IngredientProfile>,
  p: DrugProfile,
  c: Constraints,
  ctx: UserContext
): Map<string, number> {
  const scored = new Map<string, number>();
  for (const [name, entry] of kbMap.entries()) {
    const molProfile = molMap.get(name);
    const s = scoreIngredient(name, entry, molProfile?.molecular, p, c, ctx);
    scored.set(name, s);
  }
  return scored;
}

export function scoreRecipe(
  r: RawRecipe,
  kbMap: Map<string, KBEntry>,
  scoredMap: Map<string, number>,
  p: DrugProfile,
  c: Constraints,
  ctx: UserContext
): ScoredRecipe {
  const lines = r.ingredients.map(raw => resolveIngredient(raw, kbMap, scoredMap, c));

  // P0 / P1 Hard Blocks: check if any ingredient returned blocked
  const blockedItem = lines.find(l => l.blocked);
  if (blockedItem) {
    return createExcludedRecipe(r, blockedItem.blocked?.reason ?? 'Contains contraindicated oncology ingredient.');
  }

  // P1 Cold Allodynia Check
  if (c.blockedTags.has('cold_serve') && isColdDish(r)) {
    return createExcludedRecipe(r, c.reasons['cold_serve'] ?? 'Blocked: Cold dishes are contraindicated with Oxaliplatin.');
  }

  // Dietary and Allergen Filtering
  const hasNonVeg =
    ctx.vegetarian &&
    (lines.some(l => l.vegetarian === false) ||
      lines.some(l => isNonVegetarian(l.raw)));

  const hasAllergen = lines.some(l =>
    ctx.allergens.some(a => a.trim().length > 0 && l.raw.toLowerCase().includes(a.trim().toLowerCase()))
  );

  if (hasNonVeg) {
    return createExcludedRecipe(r, 'Excluded by patient vegetarian preference.');
  }

  if (hasAllergen) {
    return createExcludedRecipe(r, 'Excluded by patient allergen filter.');
  }

  // Calculate Bayesian Shrinkage Score across ingredients
  let num = 0.0;
  let den = 0.0;
  let scoredCount = 0;
  let neutralCount = 0;
  let unknownCount = 0;

  for (const l of lines) {
    if (l.kind === 'scored') {
      num += (l.score ?? 0);
      den += 1.0;
      scoredCount++;
    } else if (l.kind === 'neutral') {
      den += 0.25;
      neutralCount++;
    } else {
      unknownCount++;
    }
  }

  const rawMean = den > 0 ? num / den : 0.0;
  const coverage = (scoredCount + neutralCount) / Math.max(1, lines.length);
  const shrunk = rawMean * (0.50 + 0.50 * coverage);

  // Soft Penalties: Deduplicated by unique tags across the recipe
  const uniqueTags = new Set(lines.flatMap(l => l.tags ?? []));
  let softMultiplier = 1.0;
  for (const tag of uniqueTags) {
    if (c.softPenalties[tag]) {
      softMultiplier *= (1.0 - c.softPenalties[tag]);
    }
  }

  // Moisture & Texture Check (ESPEN Xerostomia & Dysphagia Guardrail)
  const moisture = r.moisture_index ?? (isMoistDish(r) ? 1.0 : 0.4);
  if (c.requireHighMoisture && moisture < 0.5) {
    softMultiplier *= 0.60;
  }

  // Nutritional Density Floor (Cachexia Prevention Guardrail)
  if (r.protein_g !== undefined && r.protein_g < 12) {
    softMultiplier *= 0.85;
  }

  // Scale to 0-100 Taste-Safe Score
  const scaled = 50.0 + 50.0 * clamp(GAIN * shrunk, -1.0, 1.0);
  const finalDisplay = Math.round(clamp(scaled * softMultiplier, 0, 100));

  const band =
    finalDisplay >= 70
      ? 'highly_recommended'
      : finalDisplay >= 55
      ? 'good_choice'
      : 'may_be_tolerable';

  return {
    ...r,
    taste_safe_score: finalDisplay,
    confidence: Math.round(coverage * 100) / 100,
    excluded: false,
    band,
    score_breakdown: `Profiled ${scoredCount} active + ${neutralCount} neutral of ${lines.length} items (${Math.round(coverage * 100)}% coverage).`,
    cutlery_advisory:
      'Serve with bamboo, ceramic, or wooden cutlery. Stainless steel electrochemically amplifies salivary metallic phantoms by 200–300%.',
    salivary_rinse_advisory:
      'Rinse mouth with a warm salt-baking soda wash (1/2 tsp salt + 1/2 tsp baking soda in 1 cup warm water) 10 minutes prior to dining to clear salivary lipid peroxides.',
    sensory_notes: [
      `Moisture Index: ${(moisture * 100).toFixed(0)}%`,
      `Protein: ${r.protein_g ?? 0}g / serving`,
      p.sweet_threshold_raised ? 'Calibrated for elevated sweet detection floor' : 'Standard sweet threshold',
      c.allowAcidMasking ? 'Acid chelation active' : 'Acid masking blocked (Mucosal protection)',
    ],
  };
}

export function createExcludedRecipe(r: RawRecipe, reason: string): ScoredRecipe {
  return {
    ...r,
    taste_safe_score: 0,
    confidence: 0,
    excluded: true,
    excluded_reason: reason,
    band: 'may_be_tolerable',
    score_breakdown: `Excluded: ${reason}`,
    cutlery_advisory: '',
    salivary_rinse_advisory: '',
    sensory_notes: [`Clinical Status: Permanently Excluded (${reason})`],
  };
}

export function computeSensoryRadarData(profile: DrugProfile): SensoryAxisPoint[] {
  const sweetSens = profile.sweet_threshold_raised ? 0.69 : 1.0;
  const sweetMasked = profile.sweet_threshold_raised ? 0.88 : 1.0;

  const metallicShift = profile.metallic_intensity / 3.0;
  const metallicMasked = profile.mucositis_risk < 2
    ? Math.max(0.0, metallicShift - 0.35)
    : metallicShift;

  const bitterShift = profile.bitter_phantom / 3.0;
  const bitterMasked = 0.15;

  const nauseaShift = profile.nausea_risk / 3.0;
  const nauseaMasked = Math.max(0.0, nauseaShift - 0.30);

  return [
    {
      axis: 'Sweet Sensitivity',
      healthy: 1.0,
      damaged: sweetSens,
      masked: sweetMasked,
      explanation: profile.sweet_threshold_raised
        ? 'Sweet detection threshold elevated by ~45% (S = 1/1.45 ≈ 0.69).'
        : 'Sweet sensitivity intact.',
    },
    {
      axis: 'Bitter Phantom',
      healthy: 0.0,
      damaged: bitterShift,
      masked: bitterMasked,
      explanation: 'T2R bitter receptor activation unchecked due to TRC progenitor cell depletion.',
    },
    {
      axis: 'Metallic Phantom',
      healthy: 0.0,
      damaged: metallicShift,
      masked: metallicMasked,
      explanation: profile.mucositis_risk >= 2
        ? 'Salivary lipid peroxidation active; acid chelation masked due to oral mucositis.'
        : 'Citric & malic acid chelators bind salivary metal ions, reducing phantom intensity.',
    },
    {
      axis: 'Umami Function',
      healthy: 1.0,
      damaged: 0.90,
      masked: 1.15,
      explanation: 'T1R1/T1R3 heterodimer pathway remains biochemically resilient across antineoplastic regimens.',
    },
    {
      axis: 'Nausea Risk (Aroma)',
      healthy: 0.0,
      damaged: nauseaShift,
      masked: nauseaMasked,
      explanation: 'Volatile aroma filtering suppresses nauseating carbonyls and sulfurous compounds.',
    },
  ];
}
