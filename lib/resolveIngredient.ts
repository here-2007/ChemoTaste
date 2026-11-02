// lib/resolveIngredient.ts
import { COLD_DISH_PATTERNS, RAW_RISK_PATTERNS, isNonVegetarian } from './safety';
import { KBEntry, ResolvedLine, Constraints } from './types';
import rawIngredientKB from '../data/ingredient_kb.json';
import rawIngredientProfiles from '../data/precompiled/ingredient_profiles.json';

export const NEUTRAL_BASE_LIST = new Set([
  'water',
  'salt',
  'black pepper',
  'olive oil',
  'vegetable oil',
  'canola oil',
  'cooking spray',
  'flour',
  'sugar',
  'baking powder',
  'baking soda',
  'cornstarch',
  'vegetable broth',
]);

export const STOP_WORDS = /\b(cup|cups|tbsp|tsp|teaspoon|teaspoons|tablespoon|tablespoons|ounce|oz|pound|lb|g|gram|grams|kg|ml|pinch|pinches|dash|dashes|handful|handfuls|stalk|stalks|bunch|bunches|head|heads|chopped|diced|minced|sliced|fresh|freshly|ground|grated|peeled|cooked|warm|cold|crushed|clove|cloves|large|small|medium|can|cans|package|packages|piece|pieces|slice|slices|sprig|sprigs|leaf|leaves|powder|whole|halved|shredded|mashed|pureed|purée|boiled|steamed|roasted|cubed|to|taste|optional)\b/gi;

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const defaultKBMap = new Map<string, KBEntry>(Object.entries(rawIngredientKB as Record<string, KBEntry>));
const defaultProfilesSet = new Set<string>(Object.keys(rawIngredientProfiles));

export function resolveIngredientToken(rawString: string, kbMap: Map<string, KBEntry> = defaultKBMap): string {
  if (!rawString || typeof rawString !== 'string') return '';
  const trimmed = rawString.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // 1. Direct match with KB or precompiled profiles
  if (kbMap.has(lower) || defaultProfilesSet.has(lower)) {
    return lower;
  }

  // 2. Extract parenthetical remark (e.g. "(lauki)" from "bottle gourd (lauki)")
  const parenMatch = lower.match(/\(([^)]+)\)/);
  const parenContent = parenMatch ? parenMatch[1].trim() : '';

  // 3. Clean measurements, fractions, units, and stop words
  const clean = lower
    .replace(/\([^)]*\)/g, ' ')
    .replace(STOP_WORDS, ' ')
    .replace(/[0-9\/\.\,\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 4. Exact cleaned match
  if (kbMap.has(clean) || defaultProfilesSet.has(clean)) {
    return clean;
  }

  // 5. Parenthetical content match
  if (parenContent) {
    const cleanParen = parenContent
      .replace(STOP_WORDS, ' ')
      .replace(/[0-9\/\.\,\(\)]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (kbMap.has(cleanParen) || defaultProfilesSet.has(cleanParen)) {
      return cleanParen;
    }
  }

  // 6. Match against KB entry names and aliases with specificity ranking (longest match first)
  let bestName: string | undefined = undefined;
  let bestScore = -1;

  for (const entry of kbMap.values()) {
    const entryName = entry.name.toLowerCase();

    // Exact match on cleaned string or parenthetical content
    if (clean === entryName || (parenContent && parenContent === entryName)) {
      return entry.name;
    }

    const entryRx = new RegExp(`\\b${escapeRegExp(entryName)}\\b`, 'i');
    if (entryRx.test(clean) || (parenContent && entryRx.test(parenContent))) {
      const score = 100 + entryName.length;
      if (score > bestScore) {
        bestScore = score;
        bestName = entry.name;
      }
    }

    if (entry.aliases) {
      for (const alias of entry.aliases) {
        const a = alias.toLowerCase();
        if (clean === a || (parenContent && parenContent === a)) {
          const score = 500 + a.length;
          if (score > bestScore) {
            bestScore = score;
            bestName = entry.name;
          }
        } else {
          const aliasRx = new RegExp(`\\b${escapeRegExp(a)}\\b`, 'i');
          if (aliasRx.test(clean) || (parenContent && aliasRx.test(parenContent))) {
            const score = 50 + a.length;
            if (score > bestScore) {
              bestScore = score;
              bestName = entry.name;
            }
          }
        }
      }
    }
  }

  if (bestName) {
    return bestName;
  }

  // 7. Check singular form for plurals (e.g. "tomatoes" -> "tomato")
  if (clean.endsWith('es')) {
    const singular = clean.slice(0, -2);
    if (kbMap.has(singular) || defaultProfilesSet.has(singular)) return singular;
  }
  if (clean.endsWith('s')) {
    const singular = clean.slice(0, -1);
    if (kbMap.has(singular) || defaultProfilesSet.has(singular)) return singular;
  }

  // 8. Fallback to clean string if valid, otherwise original trimmed lower
  return clean.length >= 2 ? clean : lower;
}

export function resolveIngredient(
  rawString: string,
  kbMap: Map<string, KBEntry>,
  scoredMap: Map<string, number>,
  constraints: Constraints
): ResolvedLine {
  const trimmed = rawString.trim();
  if (!trimmed) {
    return {
      raw: rawString,
      cleanName: '',
      kind: 'unknown',
    };
  }

  const lower = trimmed.toLowerCase();

  // Step 1: Raw-string defensive regex matching against universal P0 blacklists
  for (const pattern of constraints.blockedPatterns) {
    if (pattern.test(lower)) {
      return {
        raw: rawString,
        cleanName: lower,
        kind: 'unknown',
        blocked: { reason: `Blocked (P0): Contains blacklisted oncology ingredient (${lower}).` },
      };
    }
  }

  // Step 2: Check universal P0 raw / undercooked infection risks
  if (RAW_RISK_PATTERNS.some(rx => rx.test(lower))) {
    return {
      raw: rawString,
      cleanName: lower,
      kind: 'unknown',
      blocked: {
        reason: 'Blocked (P0): Raw or unpasteurized ingredients carry severe opportunistic infection and sepsis risks during chemotherapy immunosuppression.',
      },
    };
  }

  // Step 3: Check P1 Oxaliplatin Cold Allodynia
  if (constraints.blockedTags.has('cold_serve') && COLD_DISH_PATTERNS.some(rx => rx.test(lower))) {
    return {
      raw: rawString,
      cleanName: lower,
      kind: 'unknown',
      blocked: {
        reason: constraints.reasons['cold_serve'] ?? 'Blocked (P1): Cold items contraindicated with Oxaliplatin.',
      },
    };
  }

  // Step 4: Defensive non-vegetarian check
  const nonVegDetected = isNonVegetarian(lower);

  // Step 5: Normalize ingredient token string
  const clean = lower
    .replace(STOP_WORDS, ' ')
    .replace(/[0-9\/\.\,\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean || clean.length < 2) {
    return {
      raw: rawString,
      cleanName: clean,
      kind: 'unknown',
      vegetarian: nonVegDetected ? false : undefined,
    };
  }

  // Step 6: Match against Curated Oncology KB (name or aliases) with whole-word boundary matching
  let bestEntry: KBEntry | undefined;
  let bestScore = -1;

  for (const entry of kbMap.values()) {
    const entryName = entry.name.toLowerCase();

    // Exact name match
    if (clean === entryName) {
      bestEntry = entry;
      bestScore = 1000 + entryName.length;
      break;
    }

    // Whole word match on entry name
    const entryRx = new RegExp(`\\b${escapeRegExp(entryName)}\\b`, 'i');
    if (entryRx.test(clean)) {
      const matchScore = 100 + entryName.length;
      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestEntry = entry;
      }
    }

    // Check aliases with whole word boundary
    if (entry.aliases) {
      for (const alias of entry.aliases) {
        const a = alias.toLowerCase();
        if (clean === a) {
          const matchScore = 500 + a.length;
          if (matchScore > bestScore) {
            bestScore = matchScore;
            bestEntry = entry;
          }
        } else {
          const aliasRx = new RegExp(`\\b${escapeRegExp(a)}\\b`, 'i');
          if (aliasRx.test(clean)) {
            const matchScore = 50 + a.length;
            if (matchScore > bestScore) {
              bestScore = matchScore;
              bestEntry = entry;
            }
          }
        }
      }
    }
  }

  // Step 7: Process KB match
  if (bestEntry) {
    const isEntryNonVeg =
      nonVegDetected ||
      bestEntry.vegetarian === false ||
      bestEntry.tags.some(t => /meat|poultry|seafood|fish/i.test(t));

    // Check for hard clinical blocks on tags
    for (const tag of bestEntry.tags) {
      if (constraints.blockedTags.has(tag)) {
        return {
          raw: rawString,
          cleanName: bestEntry.name,
          kind: 'scored',
          tags: bestEntry.tags,
          vegetarian: isEntryNonVeg ? false : (bestEntry.vegetarian ?? true),
          blocked: { reason: constraints.reasons[tag] ?? `Blocked safety category: ${tag}` },
        };
      }
    }

    // Check if neutral pantry staple
    if (bestEntry.neutral_base || NEUTRAL_BASE_LIST.has(bestEntry.name)) {
      return {
        raw: rawString,
        cleanName: bestEntry.name,
        kind: 'neutral',
        tags: bestEntry.tags,
        vegetarian: isEntryNonVeg ? false : true,
      };
    }

    const s = scoredMap.get(bestEntry.name) ?? 0;
    return {
      raw: rawString,
      cleanName: bestEntry.name,
      kind: 'scored',
      score: s,
      tags: bestEntry.tags,
      vegetarian: isEntryNonVeg ? false : (bestEntry.vegetarian ?? true),
    };
  }

  // Step 8: Check uncataloged item against neutral base list
  if (NEUTRAL_BASE_LIST.has(clean)) {
    return {
      raw: rawString,
      cleanName: clean,
      kind: 'neutral',
      vegetarian: nonVegDetected ? false : true,
    };
  }

  // Step 9: Unknown item
  return {
    raw: rawString,
    cleanName: clean,
    kind: 'unknown',
    vegetarian: nonVegDetected ? false : undefined,
  };
}
