// lib/resolveIngredient.ts
import { COLD_DISH_PATTERNS, RAW_RISK_PATTERNS, isNonVegetarian } from './safety';
import { KBEntry, ResolvedLine, Constraints } from './types';

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

const STOP_WORDS = /\b(cup|cups|tbsp|tsp|teaspoon|tablespoon|ounce|oz|pound|lb|g|gram|grams|kg|pinch|handful|chopped|diced|minced|sliced|fresh|freshly|ground|grated|peeled|cooked|warm|cold|crushed|clove|cloves|large|small|medium|can|cans|package|packages)\b/gi;

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    // Check for hard clinical blocks on tags
    for (const tag of bestEntry.tags) {
      if (constraints.blockedTags.has(tag)) {
        return {
          raw: rawString,
          cleanName: bestEntry.name,
          kind: 'scored',
          tags: bestEntry.tags,
          vegetarian: nonVegDetected ? false : bestEntry.vegetarian,
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
        vegetarian: nonVegDetected ? false : true,
      };
    }

    const s = scoredMap.get(bestEntry.name) ?? 0;
    return {
      raw: rawString,
      cleanName: bestEntry.name,
      kind: 'scored',
      score: s,
      tags: bestEntry.tags,
      vegetarian: nonVegDetected ? false : bestEntry.vegetarian,
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
