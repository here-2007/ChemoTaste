// lib/types.ts

export type SeverityLevel = 0 | 1 | 2 | 3;

export interface DrugProfile {
  id: string;                          // e.g. "cisplatin"
  display_name: string;                // "Cisplatin (CDDP)"
  drug_class: string;                  // "Platinum-based"
  metallic_intensity: SeverityLevel;   // 0=none, 3=severe
  bitter_phantom: SeverityLevel;       // 0=none, 3=severe
  sweet_threshold_raised: boolean;     // true = sensitivity drops ~31%
  cold_forbidden: boolean;             // TRUE = absolute block on cold/chilled items (Oxaliplatin)
  nausea_risk: SeverityLevel;          // 0=minimal, 3=high emetogenicity
  zinc_depletion: boolean;             // triggers minor nutritional bonus
  mucositis_risk: SeverityLevel;       // >=2 triggers absolute block on acid/spice/rough
  cyp3a4_flag: boolean;                // triggers warning; blacklist enforced globally
  avoid_categories: string[];
  boost_categories: string[];
  sources: string[];                   // primary PMIDs and clinical references
  review_status: 'draft' | 'clinician_reviewed';
}

export type TreatmentCyclePhase = 'acute_1_3' | 'nadir_4_8' | 'recovery_9_21';

export interface UserContext {
  mouthSoresToday: boolean;
  dryMouthToday: boolean;
  vegetarian: boolean;
  diabetic: boolean;
  allergens: string[];
  toleratesRedMeat: boolean;
  cyclePhase?: TreatmentCyclePhase;
  symptoms?: {
    metallic?: number;
    bitter?: number;
    nausea?: number;
  };
}

export interface Constraints {
  blockedTags: Set<string>;
  blockedPatterns: RegExp[];
  softPenalties: Record<string, number>;
  allowAcidMasking: boolean;
  preferCool: boolean;
  capSweetBoost: boolean;
  requireHighMoisture: boolean;
  reasons: Record<string, string>;
}

export interface KBEntry {
  name: string;
  aliases: string[];
  tags: string[];
  vegetarian: boolean;
  neutral_base?: boolean;
  tastants?: {
    sweet: number;
    sour: number;
    umami: number;
    bitter: number;
    salty: number;
  };
  moisture_contribution?: number;
  protein_per_100g?: number;
}

export interface ResolvedLine {
  raw: string;
  cleanName: string;
  kind: 'scored' | 'neutral' | 'unknown';
  score?: number;
  tags?: string[];
  vegetarian?: boolean;
  blocked?: { reason: string };
}

export interface MolecularProfile {
  n_total: number;
  pct: {
    sour: number;
    sweet: number;
    umami: number;
    bitter: number;
    nausea_aroma: number;
  };
  confidence: 'ok' | 'low';
  key_molecules?: Array<{
    name: string;
    pubchem_id?: number;
    descriptors: string[];
    role: string;
  }>;
}

export interface IngredientProfile {
  name: string;
  tags: string[];
  tastants: {
    sweet: number;
    sour: number;
    umami: number;
    bitter: number;
    salty: number;
  };
  molecular: MolecularProfile;
  protein_per_100g?: number;
  moisture?: number;
}

export interface RawRecipe {
  id: string;
  title: string;
  cuisine: string;
  prep_time: number;
  ingredients: string[];
  temperature_tag?: 'cold' | 'warm' | 'room_temp';
  processes?: string[];
  protein_g?: number;
  calories?: number;
  moisture_index?: number; // 0.0 to 1.0 (1.0 = soup/khichdi/broth, 0.1 = dry roast)
  image_url?: string;
  servings?: number;
  instructions?: string[];
}

export interface ScoredRecipe extends RawRecipe {
  taste_safe_score: number;
  confidence: number;
  excluded: boolean;
  excluded_reason?: string;
  band: 'highly_recommended' | 'good_choice' | 'may_be_tolerable';
  score_breakdown: string;
  cutlery_advisory: string;
  salivary_rinse_advisory: string;
  sensory_notes?: string[];
}

export interface SubstitutionDelta {
  originalIngredient: string;
  recommendedSubstitute: string;
  tasteDelta: string;
  aromaDelta: string;
  clinicalRationale: string;
  proteinComparison: string;
}

export interface SensoryAxisPoint {
  axis: string;
  healthy: number;
  damaged: number;
  masked: number;
  explanation: string;
}
