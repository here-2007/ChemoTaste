// lib/safety.ts
import { DrugProfile, SeverityLevel, TreatmentCyclePhase, UserContext, Constraints } from './types';

export const DRUG_INTERACTION_BLACKLIST = [
  'grapefruit',
  'pomelo',
  'seville orange',
  'starfruit',
  'star fruit',
  'alcohol',
  'wine',
  'vodka',
  'beer',
  'whiskey',
  'rum',
  'liqueur',
  'brandy',
  'gin',
  'tequila',
  'bourbon',
  'sake',
  'champagne',
  'sherry',
  'cognac',
];

export const RAW_RISK_PATTERNS = [
  /\b(raw|undercooked|unpasteurized|rare)\s+(egg|eggs|meat|beef|chicken|mutton|pork|fish|salmon|tuna|seafood|oyster|oysters|milk|dairy|cheese|sprout|sprouts)\b/i,
  /\b(sushi|sashimi|tartare|carpaccio|ceviche)\b/i,
  /\b(raw\s+sprouts|alfalfa\s+sprouts|bean\s+sprouts\s+raw)\b/i,
];

export const NON_VEG_PATTERNS = [
  /\b(beef|pork|chicken|mutton|lamb|veal|bacon|lard|gelatin|fish|salmon|tuna|shrimp|prawn|anchovy|clam|oyster|meat|poultry|seafood|broth|stock)\b/i,
];

export function isVegetarianBrothOrStock(str: string): boolean {
  return /\b(vegetable|vegan|mushroom|herb|plant)\s+(broth|stock)\b/i.test(str);
}

export function isNonVegetarian(str: string): boolean {
  if (isVegetarianBrothOrStock(str)) {
    const stripped = str.replace(/\b(vegetable|vegan|mushroom|herb|plant)\s+(broth|stock)\b/gi, ' ');
    return NON_VEG_PATTERNS.some(rx => rx.test(stripped));
  }
  return NON_VEG_PATTERNS.some(rx => rx.test(str));
}

export const COLD_DISH_PATTERNS = [
  /\b(chilled|cold|iced|frozen|smoothie|ice cream|gazpacho|slush|popsicle|sorbet|refrigerated|ice cubes|crushed ice)\b/i,
];

export function buildEffectiveProfile(drugs: DrugProfile[], ctx: UserContext): DrugProfile {
  if (drugs.length === 0) {
    throw new Error('At least one drug profile is required to build effective profile.');
  }

  const max = (k: keyof DrugProfile) =>
    Math.max(...drugs.map(d => (d[k] as number) ?? 0)) as SeverityLevel;

  const avoid = new Set<string>(drugs.flatMap(d => d.avoid_categories ?? []));
  const boost = new Set<string>(
    drugs.flatMap(d => d.boost_categories ?? []).filter(c => !avoid.has(c))
  );

  const merged: DrugProfile = {
    id: drugs.map(d => d.id).join('+'),
    display_name: drugs.map(d => d.display_name).join(' + '),
    drug_class: [...new Set(drugs.map(d => d.drug_class))].join(' / '),
    metallic_intensity: max('metallic_intensity'),
    bitter_phantom: max('bitter_phantom'),
    nausea_risk: max('nausea_risk'),
    mucositis_risk: max('mucositis_risk'),
    sweet_threshold_raised: drugs.some(d => d.sweet_threshold_raised),
    cold_forbidden: drugs.some(d => d.cold_forbidden),
    zinc_depletion: drugs.some(d => d.zinc_depletion),
    cyp3a4_flag: drugs.some(d => d.cyp3a4_flag),
    avoid_categories: Array.from(avoid),
    boost_categories: Array.from(boost),
    sources: [...new Set(drugs.flatMap(d => d.sources ?? []))],
    review_status: drugs.every(d => d.review_status === 'clinician_reviewed')
      ? 'clinician_reviewed'
      : 'draft',
  };

  // Treatment Cycle Phase Dynamic Adaptation
  if (ctx.cyclePhase === 'acute_1_3') {
    merged.nausea_risk = Math.min(3, merged.nausea_risk + 1) as SeverityLevel;
  } else if (ctx.cyclePhase === 'nadir_4_8') {
    merged.mucositis_risk = Math.max(merged.mucositis_risk, 2) as SeverityLevel;
  }

  // Symptom severity overrides from active user context
  if (ctx.mouthSoresToday) {
    merged.mucositis_risk = Math.max(merged.mucositis_risk, 2) as SeverityLevel;
  }

  if (ctx.symptoms) {
    if (ctx.symptoms.metallic !== undefined) {
      merged.metallic_intensity = Math.max(
        merged.metallic_intensity,
        Math.min(3, Math.max(0, ctx.symptoms.metallic))
      ) as SeverityLevel;
    }
    if (ctx.symptoms.bitter !== undefined) {
      merged.bitter_phantom = Math.max(
        merged.bitter_phantom,
        Math.min(3, Math.max(0, ctx.symptoms.bitter))
      ) as SeverityLevel;
    }
    if (ctx.symptoms.nausea !== undefined) {
      merged.nausea_risk = Math.max(
        merged.nausea_risk,
        Math.min(3, Math.max(0, ctx.symptoms.nausea))
      ) as SeverityLevel;
    }
  }

  return merged;
}

export function buildConstraints(p: DrugProfile, ctx: UserContext): Constraints {
  const blockedTags = new Set<string>([
    'raw_risk',
    'unpasteurized',
    'alcohol',
    'nephrotoxic',
    'cyp3a4_inhibitor',
  ]);

  const reasons: Record<string, string> = {
    raw_risk: 'Blocked (P0): Raw or undercooked items carry life-threatening infection and sepsis risk during chemotherapy immunosuppression.',
    unpasteurized: 'Blocked (P0): Unpasteurized dairy or juices risk severe bacterial sepsis (Listeria/Salmonella).',
    alcohol: 'Blocked (P0): Alcohol exacerbates mucosal cytotoxicity and disrupts hepatic clearance of antineoplastic agents.',
    nephrotoxic: 'Blocked (P0): Starfruit contains caramboxin and oxalate complexes inducing lethal neuro-nephrotoxicity in oncology patients.',
    cyp3a4_inhibitor: 'Blocked (P0): Grapefruit, pomelo, and Seville orange potently inhibit intestinal CYP3A4, causing toxic drug accumulation.',
  };

  const softPenalties: Record<string, number> = {};

  // P1 Clinical Regimen Arbitrations
  if (p.mucositis_risk >= 2) {
    ['acidic', 'citrus', 'vinegar', 'spicy', 'rough_texture', 'very_hot'].forEach(tag => {
      blockedTags.add(tag);
      reasons[tag] = `Blocked (P1): Active oral mucositis (grade ${p.mucositis_risk}/3). Acidic, citrus, or spicy ingredients trigger excruciating burning and epithelial necrosis of mucosal ulcerations.`;
    });
  }

  if (p.cold_forbidden) {
    blockedTags.add('cold_serve');
    reasons['cold_serve'] = 'Blocked (P1): Oxaliplatin-induced cold allodynia triggers acute pharyngolaryngeal dysesthesia, vocal cord spasms, and sensation of suffocation upon cold exposure.';
  }

  // P2 Physical & Nutritional Tolerability Penalties
  if (p.metallic_intensity >= 2 && !ctx.toleratesRedMeat) {
    softPenalties['red_meat'] = 0.50;
  }
  if (p.nausea_risk >= 2) {
    softPenalties['high_aroma'] = 0.30;
    softPenalties['fatty'] = 0.20;
  }

  return {
    blockedTags,
    blockedPatterns: DRUG_INTERACTION_BLACKLIST.map(n => new RegExp(`\\b${n}\\b`, 'i')),
    softPenalties,
    allowAcidMasking: !blockedTags.has('acidic'),
    preferCool: !p.cold_forbidden && p.nausea_risk >= 2,
    capSweetBoost: ctx.diabetic,
    requireHighMoisture: ctx.dryMouthToday || p.mucositis_risk >= 1,
    reasons,
  };
}

export function checkBlocked(name: string, tags: string[], c: Constraints): { reason: string } | null {
  for (const pattern of c.blockedPatterns) {
    if (pattern.test(name)) {
      return { reason: `Blocked (P0): Contraindicated oncology drug interaction (${name}).` };
    }
  }

  if (RAW_RISK_PATTERNS.some(rx => rx.test(name))) {
    return {
      reason: `Blocked (P0): Raw, undercooked, or unpasteurized items carry severe opportunistic infection and sepsis risks during chemotherapy immunosuppression (${name}).`,
    };
  }

  for (const tag of tags) {
    if (c.blockedTags.has(tag)) {
      return { reason: c.reasons[tag] ?? `Blocked: Contraindicated safety category (${tag}).` };
    }
  }

  return null;
}
