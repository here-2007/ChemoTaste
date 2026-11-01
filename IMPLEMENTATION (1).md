# ChemoTaste — Two-Phase Implementation Plan
**Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab**
**Path: RecipeDB + FlavorDB**

---

## 0. Science Foundation

**Problem in one sentence**: Chemotherapy damages taste receptor progenitor cells, raising
detection thresholds for sweet/sour and inducing phantom metallic and bitter perception —
making food repulsive, causing malnutrition that slows recovery and worsens outcomes.

### Taste Receptor Damage Map

| Taste | What Chemo Does | Molecular Consequence |
|---|---|---|
| Metallic | Platinum ions bind metalloprotein TRCs (Type I + III) | Phantom metallic regardless of food consumed |
| Bitter | T2R receptors — low-concentration activation persists | Bitter phantom; normal bitter foods taste extreme |
| Sweet | T1R2/T1R3 progenitor cells dividing rapidly → antimitotic drugs hit them | Detection threshold raised 45% (need 6.4 vs 4.4 μmol/ml) |
| Umami | T1R1/T1R3 — least affected in most regimens | Pathway largely intact; exploit this |
| Sour/Acidic | Not significantly altered | Acidic compounds COMPETE with metallic at receptor level — use this |

Sources: PMC2858711 (threshold data), News-Medical (mechanism), iv.iiarjournals.org (platinum mechanism).

### What Actually Works (Evidence-Grounded)

| Intervention | Mechanism | Evidence Level |
|---|---|---|
| Acidic / tart foods (lemon, vinegar, rose hip) | Citric/malic acid compete with platinum ions at receptor | Clinical observation, cited by multiple oncology centers |
| Cold or room-temp dishes | Reduces drug volatilization in saliva → less metallic | Clinical consensus |
| Umami-forward ingredients (mushroom, tomato, miso) | Intact T1R1/T1R3 pathway delivers satisfying taste signal | Pathway analysis |
| Soft textures + high moisture | Mucositis and dry mouth make chewing painful | Standard supportive care |
| High sweet-molecule density ingredients | Compensate for raised sweet threshold | Derived from threshold data |
| Avoid red meat | Heme iron amplifies metallic phantom | Clinical dietitian consensus |
| Zinc-rich foods (pumpkin seeds, eggs, legumes) | Zinc required for TRC renewal; chemo depletes it | NCT03824925, multiple case series |
| Avoid strong-aroma / high-volatile ingredients | Olfactory damage makes strong smells nauseating | Chemotherapy supportive care guidelines |

### Key Algorithmic Insight — FlavorDB as a Dual-Mechanism Engine

> ⚠️ **Accurate framing (critical for CoSy Lab judges):** FlavorDB is primarily a
> repository of volatile aroma compounds (VOCs / odorants) drawn from Fenaroli's Handbook
> and Flavornet, classified across 900+ aroma descriptors (woody, fruity, ethereal, etc.)
> alongside physicochemical properties including **taste threshold** values (μmol/ml).
> It is **not** a database of non-volatile tongue tastants. Presenting it as such will
> immediately discredit the project with judges who built it.

ChemoTaste uses FlavorDB for two distinct, scientifically accurate roles:

**Role 1 — Retronasal Olfactory Filtering (FlavorDB VOC data)**
Chemotherapy induces acute olfactory hyperesthesia and parosmia. Warm volatile aromas
trigger violent nausea. FlavorDB's aroma descriptor tags and physicochemical data are used
to score and suppress high-volatility nausea-risk compounds in candidate ingredients.

**Role 2 — Perceptibility Scoring via Taste Threshold (FlavorDB `/properties/taste-threshold`)**
ChemoTaste drugs raise detection thresholds (e.g., sweet: 4.4 → 6.4 μmol/ml for cisplatin).
FlavorDB's `taste_threshold` property data lets the app filter for ingredients whose active
flavor molecules have threshold values still *below* the damaged receptor's raised floor —
i.e., food the patient will actually be able to taste despite their altered receptor state.

**Role 3 — Gustatory Receptor Modulation (Clinical Oncology Data, not FlavorDB)**
The non-volatile tastant logic — acid competing with platinum ions, umami stimulating
intact T1R1/T1R3 pathways, zinc supplementation for TRC renewal — is grounded in published
oncology literature, not FlavorDB flavor tags. This distinction is made explicit in the UI.

The **novelty**: no existing tool cross-references FlavorDB's molecular perceptibility data
with drug-specific receptor damage profiles to automatically surface food a chemo patient
can actually taste. That has never been done before.

---

## 1. Core Architecture (Both Phases)

```
┌──────────────────────────────────────────────────────┐
│                    USER INPUT                        │
│  Drug selection + optional symptom severity (1-10)  │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│              DRUG PROFILE LAYER                      │
│  Local JSON → symptom weights per drug               │
│  (metallic_intensity, bitter_phantom, sweet_raise,   │
│   mucositis_risk, cold_hypersensitivity, cyp3a4)     │
└──────────┬──────────────────────────┬────────────────┘
           │                          │
┌──────────▼────────┐     ┌───────────▼──────────────┐
│   CLINICAL GATES  │     │  PRE-COMPILED DATA LAYER  │
│                   │     │                           │
│ CYP3A4 blacklist  │     │ ingredient_molecules.json │
│ Neutropenia guard │     │ (80 ingredients, ~40 KB)  │
│ Mucositis blocker │     │ Zero API calls on load    │
│ Cold allodynia    │     │                           │
└──────────┬────────┘     └───────────┬───────────────┘
           │                          │
           └─────────────┬────────────┘
                         │
              ┌──────────▼───────────┐
              │  AFFINITY DENSITY    │
              │  SCORING ENGINE      │
              │                      │
              │ Normalized fraction  │
              │ scores per drug      │
              │ → ranked ingredient  │
              │   list               │
              └──────────┬───────────┘
                         │
              ┌──────────▼───────────┐
              │   RECIPEDB API        │
              │                       │
              │ Ingredient-based      │
              │ search (not title)    │
              │ → scored recipe list  │
              └──────────┬────────────┘
                         │
              ┌──────────▼───────────┐
              │      UI LAYER         │
              │                       │
              │ 3-overlay Radar chart │
              │ Smart Substitutions   │
              │ DietRx citation badge │
              │ Recipe cards + score  │
              └──────────────────────-┘
```

---

## 2. Data Layer Design

### 2.1 Drug Profile Schema

Built manually from published oncology literature. Stored as local JSON — zero API dependency.

```typescript
interface DrugProfile {
  id: string;                        // e.g. "cisplatin"
  display_name: string;              // "Cisplatin (CDDP)"
  drug_class: string;                // "Platinum-based"
  metallic_intensity: 0 | 1 | 2 | 3;// 0=none, 3=severe
  bitter_phantom: 0 | 1 | 2 | 3;
  sweet_threshold_raised: boolean;   // true = need more sweet molecules
  cold_preference: boolean | null;   // null=no preference, true=prefer cold,
                                     // false=avoid cold (oxaliplatin nerve sensitivity)
  cold_hypersensitivity: boolean;    // TRUE = absolute hard-block on all cold/iced items
                                     // (Oxaliplatin → pharyngolaryngeal dysesthesia)
  nausea_risk: 0 | 1 | 2 | 3;
  zinc_depletion: boolean;
  mucositis_risk: 0 | 1 | 2 | 3;    // 0=none, 3=severe mouth sores
                                     // ≥2 = hard-block ALL acidic + spicy ingredients
  cyp3a4_sensitive: boolean;         // TRUE = grapefruit/starfruit blacklist enforced
  avoid_categories: string[];        // ingredient categories to exclude
  boost_categories: string[];        // ingredient categories to prioritize
}
```

```json
{
  "cisplatin": {
    "id": "cisplatin",
    "display_name": "Cisplatin (CDDP)",
    "drug_class": "Platinum-based",
    "metallic_intensity": 3,
    "bitter_phantom": 2,
    "sweet_threshold_raised": true,
    "cold_preference": null,
    "cold_hypersensitivity": false,
    "nausea_risk": 3,
    "zinc_depletion": true,
    "mucositis_risk": 1,
    "cyp3a4_sensitive": false,
    "avoid_categories": ["red_meat", "coffee", "high_fat"],
    "boost_categories": ["citrus", "umami", "zinc_rich"]
  },
  "oxaliplatin": {
    "id": "oxaliplatin",
    "display_name": "Oxaliplatin (Eloxatin)",
    "drug_class": "Platinum-based",
    "metallic_intensity": 2,
    "bitter_phantom": 2,
    "sweet_threshold_raised": false,
    "cold_preference": false,
    "cold_hypersensitivity": true,
    "nausea_risk": 2,
    "zinc_depletion": false,
    "mucositis_risk": 0,
    "cyp3a4_sensitive": false,
    "avoid_categories": ["cold_dishes", "cold_drinks", "iced"],
    "boost_categories": ["warm_dishes", "acid_maskers", "umami"]
  },
  "5-fluorouracil": {
    "id": "5fu",
    "display_name": "5-Fluorouracil (5-FU)",
    "drug_class": "Antimetabolite",
    "metallic_intensity": 1,
    "bitter_phantom": 1,
    "sweet_threshold_raised": false,
    "cold_preference": null,
    "cold_hypersensitivity": false,
    "nausea_risk": 2,
    "zinc_depletion": true,
    "mucositis_risk": 3,
    "cyp3a4_sensitive": false,
    "avoid_categories": ["spicy", "acidic", "hard_texture", "citrus"],
    "boost_categories": ["soft_texture", "mild_umami", "lukewarm", "smooth"]
  },
  "carboplatin": {
    "id": "carboplatin",
    "display_name": "Carboplatin (Paraplatin)",
    "drug_class": "Platinum-based",
    "metallic_intensity": 2,
    "bitter_phantom": 1,
    "sweet_threshold_raised": true,
    "cold_preference": null,
    "cold_hypersensitivity": false,
    "nausea_risk": 2,
    "zinc_depletion": true,
    "mucositis_risk": 1,
    "cyp3a4_sensitive": false,
    "avoid_categories": ["red_meat"],
    "boost_categories": ["acid_maskers", "zinc_rich", "umami"]
  },
  "paclitaxel": {
    "id": "paclitaxel",
    "display_name": "Paclitaxel (Taxol)",
    "drug_class": "Taxane",
    "metallic_intensity": 1,
    "bitter_phantom": 1,
    "sweet_threshold_raised": false,
    "cold_preference": true,
    "cold_hypersensitivity": false,
    "nausea_risk": 3,
    "zinc_depletion": false,
    "mucositis_risk": 1,
    "cyp3a4_sensitive": true,
    "avoid_categories": ["fatty", "high_aroma", "grapefruit"],
    "boost_categories": ["mild_flavor", "cold_dishes", "small_portion"]
  },
  "cyclophosphamide": {
    "id": "cyclophosphamide",
    "display_name": "Cyclophosphamide (Cytoxan)",
    "drug_class": "Alkylating agent",
    "metallic_intensity": 2,
    "bitter_phantom": 2,
    "sweet_threshold_raised": true,
    "cold_preference": null,
    "cold_hypersensitivity": false,
    "nausea_risk": 3,
    "zinc_depletion": false,
    "mucositis_risk": 1,
    "cyp3a4_sensitive": true,
    "avoid_categories": ["red_meat", "high_fat", "grapefruit"],
    "boost_categories": ["acid_maskers", "mild_flavor", "umami"]
  }
}
```

### 2.2 Flavor Category → Ingredient Seed List

Hard-coded lookup used when FlavorDB API is slow/down. All items have been screened:
- ✅ Neutropenic-safe (no raw fish, no unpasteurized produce)
- ✅ CYP3A4-clean (no grapefruit, Seville orange, starfruit)
- ✅ Mucositis-neutral (acid_maskers excluded at runtime for mucositis_risk ≥ 2)

```json
{
  "acid_maskers": ["lemon", "lime", "tomato", "vinegar", "yogurt", "orange", "tamarind", "cranberry"],
  "umami_rich": ["mushroom", "tomato", "miso", "parmesan", "soy sauce", "seaweed", "anchovy"],
  "zinc_rich": ["pumpkin seeds", "eggs", "chickpeas", "lentils", "cashews", "chicken", "salmon"],
  "soft_texture": ["banana", "mashed potato", "oatmeal", "avocado", "tofu", "yogurt", "hummus"],
  "mild_flavor": ["rice", "pasta", "potato", "chicken breast", "tofu", "egg white", "zucchini"],
  "cold_dishes": ["smoothie", "chilled tofu", "cold noodle", "fruit bowl", "chilled gazpacho"],
  "warm_dishes": ["soup", "stew", "porridge", "warm salad", "braised"],
  "avoid_red_meat": ["beef", "lamb", "pork", "venison", "bison"]
}
```

> ⚠️ **cold_dishes note:** "sushi" and raw fish removed — contraindicated in neutropenic patients
> (ANC <1000/μL) due to Listeria/Salmonella/Pseudomonas infection risk. "salad" removed as
> unpeeled raw produce is also contraindicated. Smoothies remain (pasteurized ingredients only).

### 2.3 Safety Constant Lists

These are compiled into `lib/seedData.ts` and checked before any scoring runs.

```typescript
// lib/seedData.ts

// CYP3A4 inhibitors — furanocoumarin-containing foods
// Dangerous with Taxanes (Paclitaxel, Docetaxel) and alkylating agents
// Hard-blocked regardless of drug profile if cyp3a4_sensitive = true
export const DRUG_INTERACTION_BLACKLIST = [
  'grapefruit', 'seville orange', 'starfruit', 'pomelo',
] as const;

// Raw or unpasteurized foods — contraindicated in neutropenic patients
// Active chemo patients frequently have ANC <1000/μL
export const NEUTROPENIC_BLACKLIST = [
  'sushi', 'sashimi', 'raw fish', 'raw oyster', 'raw clam',
  'unpasteurized cheese', 'raw sprouts', 'raw egg',
] as const;

// Cold-trigger foods — absolute contraindication with Oxaliplatin
// Triggers pharyngolaryngeal dysesthesia / vocal cord spasms
export const COLD_TRIGGER_INGREDIENTS = [
  'ice cream', 'iced drink', 'frozen yogurt', 'cold water',
  'refrigerated', 'chilled', 'cold smoothie',
] as const;

// Red meat — heme iron amplifies metallic phantom
export const RED_MEAT_INGREDIENTS = [
  'beef', 'lamb', 'pork', 'venison', 'bison', 'veal', 'offal',
] as const;

// Acidic / spicy ingredients — blocked when mucositis_risk >= 2
export const ACIDIC_INGREDIENTS = [
  'lemon', 'lime', 'vinegar', 'tamarind', 'cranberry', 'orange juice',
  'tomato sauce', 'citric acid', 'acetic acid',
] as const;

export const SPICY_INGREDIENTS = [
  'chili', 'cayenne', 'jalapeño', 'hot sauce', 'sriracha', 'wasabi',
  'horseradish', 'black pepper (heavy)', 'ginger (raw)',
] as const;

// Neutral base ingredients — scored at midpoint, not penalized for being unknown
export const NEUTRAL_INGREDIENTS = new Set([
  'water', 'salt', 'black pepper', 'olive oil', 'vegetable oil', 'butter',
  'flour', 'sugar', 'bay leaf', 'thyme', 'oregano', 'parsley', 'canola oil',
  'cooking spray', 'baking soda', 'baking powder', 'corn starch',
]);

export const NEUTRAL_SCORE = 5.0; // on 0–10 scale — midpoint, neither helpful nor harmful

export const ZINC_RICH_INGREDIENTS = [
  'pumpkin seeds', 'eggs', 'chickpeas', 'lentils', 'cashews',
  'chicken', 'salmon', 'hemp seeds', 'quinoa',
] as const;
```

---

## 3. API Integration Strategy

### 3.1 Access

The CoSy Lab APIs (FlavorDB2 at `cosylab.iiitd.edu.in/flavordb2`, RecipeDB at
`cosylab.iiitd.edu.in/recipedb`, DietRx at `cosylab.iiitd.edu.in/dietrx`) are accessible
to hackathon participants via the Foodoscope platform.

**Action — do before Nov 14:**
1. Register at https://www.foodoscope.com → obtain API key
2. Verify from terminal:
   ```bash
   curl "https://cosylab.iiitd.edu.in/flavordb2/api/molecules_data/by-flavorProfile?flavor=acidic" \
        -H "Authorization: Bearer $YOUR_API_KEY"
   ```
3. Test the taste-threshold endpoint (critical for the perceptibility scoring layer):
   ```bash
   curl "https://cosylab.iiitd.edu.in/flavordb2/api/properties/taste-threshold" \
        -H "Authorization: Bearer $YOUR_API_KEY"
   ```
4. If organizers distribute keys on hack day — email them BEFORE Nov 14 to confirm mechanism

### 3.2 CORS — Critical Issue

Direct browser-to-`cosylab.iiitd.edu.in` calls **fail with CORS errors**.
All API traffic must route through your own Next.js API route.

The proxy now includes a simple in-memory rate limiter capped at 40 req/min to prevent
HTTP 429 from the academic server (~50 req/min limit).

```typescript
// app/api/proxy/route.ts
import { NextRequest } from 'next/server';

const BASE_URLS: Record<string, string> = {
  flavordb: 'https://cosylab.iiitd.edu.in/flavordb2/api',
  recipedb:  'https://cosylab.iiitd.edu.in/recipedb/api',
  dietrx:    'https://cosylab.iiitd.edu.in/dietrx/api',
};

// In-memory rate limiter: max 40 upstream requests/minute
// Prevents HTTP 429 on academic servers (~50 req/min limit)
const requestTimestamps: number[] = [];
const RATE_LIMIT = 40;
const WINDOW_MS  = 60_000;

function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const recent = requestTimestamps.filter(t => t > windowStart);
  requestTimestamps.splice(0, requestTimestamps.length, ...recent);
  if (recent.length >= RATE_LIMIT) return true;
  requestTimestamps.push(now);
  return false;
}

export async function GET(req: NextRequest) {
  if (isRateLimited()) {
    // Signal the client to fall back to pre-compiled data
    return Response.json(
      { error: 'Rate limit reached', fallback: true },
      { status: 429 }
    );
  }

  const { searchParams } = req.nextUrl;
  const db       = searchParams.get('db')!;
  const endpoint = searchParams.get('endpoint')!;

  if (!BASE_URLS[db]) {
    return Response.json({ error: 'Unknown db target' }, { status: 400 });
  }

  const forwardParams = new URLSearchParams(searchParams);
  forwardParams.delete('db');
  forwardParams.delete('endpoint');

  const url = `${BASE_URLS[db]}/${endpoint}?${forwardParams.toString()}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.FOODOSCOPE_API_KEY}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      return Response.json(
        { error: `Upstream ${upstream.status}`, url },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return Response.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    return Response.json({ error: 'Upstream unreachable', detail: String(err) }, { status: 502 });
  }
}
```

All client-side calls then hit `/api/proxy?db=flavordb&endpoint=properties/taste-threshold`.

### 3.3 Client Wrappers

```typescript
// lib/flavordbClient.ts

import PRECOMPILED from '../data/ingredient_molecules.json';

const call = (db: string, endpoint: string, params: Record<string, string>) => {
  const qs = new URLSearchParams({ db, endpoint, ...params });
  return fetch(`/api/proxy?${qs}`).then(r => {
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json();
  });
};

export const FlavorDB = {
  // ── ENDPOINTS USED BY THE SCORING ENGINE ──────────────────────────────────

  // Returns molecules with taste_threshold (μmol/ml) and physicochemical properties
  // PRIMARY use: perceptibility scoring — is this molecule still detectable post-chemo?
  getTasteThresholdData: () =>
    call('flavordb', 'properties/taste-threshold', {}),

  // Returns molecules matching an aroma descriptor (e.g. "fruity", "ethereal", "green")
  // PRIMARY use: olfactory filtering — which aromas trigger nausea?
  getByArromaDescriptor: (descriptor: string) =>
    call('flavordb', 'properties/by-description', { description: descriptor }),

  // Returns molecules filtered by chemical type (ester, acid, aldehyde, terpene...)
  // Used for: identifying high-volatility (nausea-risk) compound classes
  getMoleculesByType: (type: string) =>
    call('flavordb', 'molecules_data/filter-by-type', { type }),

  // Returns full molecule data by common name
  getMoleculeByName: (name: string) =>
    call('flavordb', 'molecules_data/by-commonName', { name }),

  // Returns ingredient entity with its associated molecule list
  // ONLY called at runtime for dynamic user-searched ingredients not in pre-compiled data
  getIngredientMolecules: async (alias: string): Promise<Molecule[]> => {
    const key = alias.toLowerCase();
    if ((PRECOMPILED as Record<string, Molecule[]>)[key]) {
      return (PRECOMPILED as Record<string, Molecule[]>)[key];  // static lookup — zero latency
    }
    return call('flavordb', 'food/by-alias', { alias });  // live fallback for unknowns only
  },
};
```

```typescript
// lib/recipedbClient.ts

export const RecipeDB = {
  // ── PRIMARY: search by ingredient (fixes the title-search bug) ─────────────
  // Returns recipes that CONTAIN the given ingredient, not recipes TITLED after it.
  // Use /recipes/ingredient or the ingredient-based filter endpoint.
  searchByIngredient: (ingredient: string) =>
    call('recipedb', 'recipes/ingredient', { ingredient }),

  // ── SECONDARY: cuisine + category filtering ──────────────────────────────
  getByCuisine: (region: string) =>
    call('recipedb', 'recipes_cuisine/cuisine/' + region, {}),

  // Nutrition-filtered search (protein, calories, dietary style)
  searchByNutrition: (params: { minProtein?: number; maxCalories?: number; diet?: string }) =>
    call('recipedb', 'recipes/nutrition', params as Record<string, string>),

  getById: (id: string) =>
    call('recipedb', 'search-recipe/' + id, {}),

  getInstructions: (id: string) =>
    call('recipedb', 'instructions/' + id, {}),

  // ── DEPRECATED — do not use ──────────────────────────────────────────────
  // searchByTitle searches recipe *title*, NOT ingredients.
  // searchByTitle('pumpkin seeds') returns "Pumpkin Seed Soup", not recipes
  // *containing* pumpkin seeds. Left here as reference.
  // searchByTitle: (title: string) =>
  //   call('recipedb', 'recipe-bytitle/recipeByTitle', { title }),
};
```

```typescript
// lib/dietrxClient.ts

export const DietRx = {
  // Returns PubMed-linked biomedical disease associations for an ingredient
  // Filter results by condition keywords: "dysgeusia", "mucositis", "oncology", "taste"
  getIngredientAssociations: (ingredient: string) =>
    call('dietrx', 'ingredient', { name: ingredient }),
};

// Used by DietRxBadge.tsx to render:
// "Validated against DietRx: 14 PubMed citations linking miso to mucosal healing"
```

### 3.4 Endpoints Used

| Call | DB | Parameters | Returns |
|---|---|---|---|
| `properties/taste-threshold` | FlavorDB | — | All molecules with taste threshold data (μmol/ml) |
| `properties/by-description` | FlavorDB | `description=ethereal\|fruity\|green\|...` | Molecules by aroma descriptor |
| `molecules_data/filter-by-type` | FlavorDB | `type=ester\|acid\|aldehyde\|terpene` | Molecules by chemical type |
| `molecules_data/by-commonName` | FlavorDB | `name=citric acid` | Single molecule full data |
| `food/by-alias` | FlavorDB | `alias=lemon` | Ingredient molecule list (runtime fallback only) |
| `recipes/ingredient` | RecipeDB | `ingredient=mushroom` | Recipes containing that ingredient ✅ |
| `recipes/nutrition` | RecipeDB | `minProtein`, `maxCalories`, `diet` | Nutrition-filtered recipes |
| `recipes_cuisine/cuisine/{region}` | RecipeDB | path param | Recipes by cuisine region |
| `search-recipe/{id}` | RecipeDB | path param | Full recipe detail |
| `ingredient` | DietRx | `name=miso` | PubMed biomedical associations |

### 3.5 DietRx Integration — Hackathon Winning Move

CoSy Lab built DietRx (`cosylab.iiitd.edu.in/dietrx`) to map food ingredients to biomedical
disease associations extracted from MEDLINE/PubMed. The judges who will evaluate ChemoTaste
built all three systems (FlavorDB, RecipeDB, DietRx). Showing them their own ecosystem
integrated holistically is a significant strategic advantage.

**Implementation:** After scoring top ingredients, fetch DietRx associations filtered by
`["dysgeusia", "mucositis", "taste disorder", "chemotherapy", "oral health"]` and render
a citation badge on each ingredient card:

> 🔬 **DietRx Validated** — 14 PubMed citations link miso to mucosal healing and taste
> recovery in oncology patients.

This elevates ChemoTaste from an isolated app to a flagship demonstration of the entire
CoSy Lab research ecosystem. Build the badge component in H18–H21 polish pass.

### 3.6 Fallback Strategy (If API Fails During Hackathon)

The N+1 API waterfall problem (35 simultaneous requests on drug selection) is eliminated
by design — see Section 4.1. Runtime API calls now serve only unknown ingredients and
live recipe search. Fallback for those:

```bash
# Pre-fetch and commit before Nov 14 — offline emergency backup
for flavor in acidic sweet bitter umami sour; do
  curl "https://cosylab.iiitd.edu.in/flavordb2/api/molecules_data/by-flavorProfile?flavor=$flavor" \
       -H "Authorization: Bearer $FOODOSCOPE_API_KEY" \
       -o "data/cache/molecules_$flavor.json"
done

# Pre-fetch taste threshold data — needed for perceptibility scoring
curl "https://cosylab.iiitd.edu.in/flavordb2/api/properties/taste-threshold" \
     -H "Authorization: Bearer $FOODOSCOPE_API_KEY" \
     -o "data/cache/taste_threshold.json"
```

App checks pre-compiled data first; calls live API only on cache miss.
`?demo=true` URL flag bypasses all network calls and uses `data/curated_recipes.json`.

---

## 4. Algorithm Design

### 4.1 Pre-Compiled Ingredient Data (No N+1 Waterfall)

**Problem with original design:** `getRecommendations()` fired 35+ simultaneous HTTP
requests to `cosylab.iiitd.edu.in` via the proxy — one per candidate ingredient. Academic
servers have ~50 req/min rate limits. This causes HTTP 429s and 10+ second hangs during
live demo.

**Fix:** Pre-compile molecular fingerprints for the top 80 ingredients into a static JSON
asset bundled at build time. Runtime API calls are reserved exclusively for on-demand
dynamic queries.

```bash
# scripts/precompile_ingredients.ts — run this BEFORE hackathon, commit the output
# Fetches molecule data for all seed list ingredients and writes ingredient_molecules.json

const seeds = [...ACID_MASKERS, ...UMAMI_RICH, ...ZINC_RICH, ...MILD_FLAVOR, ...SOFT_TEXTURE];

const result: Record<string, Molecule[]> = {};
for (const ingredient of seeds) {
  const data = await FlavorDB.getIngredientMolecules(ingredient);  // live call
  result[ingredient.toLowerCase()] = data;
  await sleep(1500);  // respect rate limit during pre-compilation
}

fs.writeFileSync('data/ingredient_molecules.json', JSON.stringify(result, null, 2));
// Output: ~35–45 KB — trivially small, loads in <1ms
```

### 4.2 Molecule Index (Taste Threshold Perceptibility Layer)

Runs once on startup. Loads taste threshold data for the perceptibility scoring layer.

```typescript
interface MoleculeIndex {
  byId:           Map<number, Molecule>;
  lowThreshold:   Molecule[];  // taste_threshold < 2.0 μmol/ml — very potent
  highVolatility: string[];    // aroma descriptors flagged as nausea-risk
}

interface Molecule {
  id: number;
  common_name: string;
  flavor_profile: string[];      // aroma descriptors: 'fruity', 'ethereal', 'woody', etc.
  taste_threshold?: number;      // μmol/ml — lower = detectable at smaller concentration
  natural_sources: string[];
}

async function buildMoleculeIndex(): Promise<MoleculeIndex> {
  // Load taste threshold data (1 API call, not 35+)
  const thresholdData = await FlavorDB.getTasteThresholdData();

  const byId = new Map<number, Molecule>(thresholdData.map((m: Molecule) => [m.id, m]));

  // Molecules detectable at very low concentration — elevated nausea risk when volatile
  const lowThreshold = thresholdData.filter((m: Molecule) =>
    m.taste_threshold !== undefined && m.taste_threshold < 2.0
  );

  // Aroma descriptors associated with chemotherapy-induced nausea (olfactory hyperesthesia)
  const highVolatility = ['ethereal', 'pungent', 'sulfurous', 'rancid', 'fecal', 'musty'];

  return { byId, lowThreshold, highVolatility };
}
```

### 4.3 Clinical Candidate Filter

Run before scoring. Removes clinically inappropriate candidates based on the drug profile.
This is the correct place to enforce the Clinical Override Hierarchy — not inside the
scoring function.

```typescript
function getCandidatesForDrug(drug: EffectiveDrugProfile): string[] {
  let candidates = [...UMAMI_RICH, ...ZINC_RICH, ...MILD_FLAVOR, ...SOFT_TEXTURE];

  // Rule 1 (Mucositis Override): acid maskers blocked if mucositis_risk >= 2
  // Citrus/vinegar on mucosal ulcers causes excruciating pain.
  // This wins over metallic masking even when metallic_intensity == 3.
  if (drug.mucositis_risk < 2) {
    candidates = [...candidates, ...ACID_MASKERS];
  } else {
    // Substitute: room-temperature umami + high-moisture purée textures
    candidates = [...candidates, 'miso broth', 'mushroom purée', 'soft tofu'];
  }

  // Rule 2 (Cold Allodynia): cold dishes hard-blocked for Oxaliplatin
  // Triggers pharyngolaryngeal dysesthesia and vocal cord spasms.
  if (!drug.cold_hypersensitivity && drug.cold_preference !== false) {
    candidates = [...candidates, ...COLD_DISHES];
  } else {
    candidates = [...candidates, ...WARM_DISHES];
  }

  // Rule 3: CYP3A4 interaction blacklist (Taxanes, alkylating agents)
  if (drug.cyp3a4_sensitive) {
    return candidates.filter(c => !DRUG_INTERACTION_BLACKLIST.includes(c.toLowerCase()));
  }

  return candidates;
}
```

### 4.4 Ingredient Safety Score (Normalized Affinity Density)

```typescript
interface IngredientScore {
  name: string;
  safety_score: number;       // 0–10 normalized
  acid_count:   number;
  acid_fraction: number;      // N_acid / (N_total + ε)
  sweet_count:  number;
  sweet_fraction: number;
  bitter_count: number;
  bitter_fraction: number;
  umami_count:  number;
  umami_fraction: number;
  total_molecules: number;    // shown in UI: "scored against N molecules"
  include:      boolean;
  reason:       string;       // One sentence shown in UI
  mechanism?:   string;       // Extended explanation for "Science Behind Every Bite" modal
  flag?: 'zinc_rich' | 'cold_ok' | 'warm_only' | 'soft_texture' | 'cyp3a4_blocked' | 'neutropenic_risk';
}

// Helper: return a hard-excluded ingredient record
function hardExclude(
  ingredientName: string,
  reason: string,
  flag?: IngredientScore['flag']
): IngredientScore {
  return {
    name: ingredientName, safety_score: -999,
    acid_count: 0, acid_fraction: 0,
    sweet_count: 0, sweet_fraction: 0,
    bitter_count: 0, bitter_fraction: 0,
    umami_count: 0, umami_fraction: 0,
    total_molecules: 0,
    include: false, reason, flag,
  };
}

function scoreIngredient(
  ingredientName: string,
  ingredientMolecules: Molecule[],
  drug: EffectiveDrugProfile
): IngredientScore {
  const name = ingredientName.toLowerCase();

  // ── ABSOLUTE SAFETY GATES (evaluated in priority order) ─────────────────
  // These run BEFORE any scoring. Order matters: a mucosal patient with oxaliplatin
  // gets both Gate 4 and Gate 5 applied. Gates are not overridden by drug weights.

  // Gate 1: CYP3A4 drug–food interaction blacklist
  // Furanocoumarins in grapefruit/starfruit inhibit CYP3A4 → dangerously alters
  // bioavailability of Paclitaxel, Docetaxel, and alkylating agents.
  if (drug.cyp3a4_sensitive && DRUG_INTERACTION_BLACKLIST.includes(name)) {
    return hardExclude(
      ingredientName,
      `⚠ CYP3A4 inhibitor. Furanocoumarins dangerously alter ${drug.display_name} bioavailability. NEVER consume during treatment.`,
      'cyp3a4_blocked'
    );
  }

  // Gate 2: Neutropenic infection risk
  // Active chemo patients are frequently neutropenic (ANC <1000/μL). Raw fish and
  // unpasteurized produce risk life-threatening Listeria/Salmonella/Pseudomonas infection.
  if (NEUTROPENIC_BLACKLIST.includes(name)) {
    return hardExclude(
      ingredientName,
      `Raw/unpasteurized. Life-threatening infection risk in neutropenic patients.`,
      'neutropenic_risk'
    );
  }

  // Gate 3: Red meat + metallic phantom amplification
  if (RED_MEAT_INGREDIENTS.includes(name) && drug.metallic_intensity >= 2) {
    return hardExclude(
      ingredientName,
      `Heme iron amplifies metallic taste phantom. Excluded for ${drug.display_name}.`
    );
  }

  // Gate 4: Mucositis override — hard-block acid/citrus/spicy when mucositis_risk >= 2
  // Critical: FOLFOX patients have BOTH metallic_intensity == 2 AND mucositis_risk == 3.
  // Acid masking is the right intervention for metallic, but causes excruciating pain
  // on mucosal ulcerations. Mucositis ALWAYS wins.
  if (drug.mucositis_risk >= 2 && (ACIDIC_INGREDIENTS.includes(name) || SPICY_INGREDIENTS.includes(name))) {
    return hardExclude(
      ingredientName,
      `Blocked: mucositis grade ${drug.mucositis_risk}/3 active. Acid/spice on mucosal ulcers causes severe pain. Use umami + moisture instead.`
    );
  }

  // Gate 5: Cold allodynia (Oxaliplatin absolute contraindication)
  // Cold exposure triggers pharyngolaryngeal dysesthesia — involuntary laryngeal spasms.
  // This is not a preference; it is a safety constraint.
  if (drug.cold_hypersensitivity && COLD_TRIGGER_INGREDIENTS.includes(name)) {
    return hardExclude(
      ingredientName,
      `Blocked: Oxaliplatin cold hypersensitivity. Cold triggers pharyngolaryngeal spasms. Serve all food at room temperature or warm.`
    );
  }

  // ── NORMALIZED AFFINITY DENSITY SCORING ─────────────────────────────────
  // Why normalized? A well-studied ingredient (tomato, apple) has 80–120 molecules
  // in FlavorDB. A less-studied ingredient (millet, cardamom) may have 4–8.
  // Raw molecule counts make tomato score +45 and millet score +2 — purely due to
  // research publication bias, not actual taste fitness.
  // Fix: use *fraction* of total molecules, with Laplace smoothing (ε=5) to
  // prevent small-sample inflation.

  const total = ingredientMolecules.length;
  const ε = 5;  // Laplace smoothing constant

  const N_acid   = ingredientMolecules.filter(m => m.flavor_profile.includes('acidic')).length;
  const N_sweet  = ingredientMolecules.filter(m => m.flavor_profile.includes('sweet')).length;
  const N_bitter = ingredientMolecules.filter(m => m.flavor_profile.includes('bitter')).length;
  const N_umami  = ingredientMolecules.filter(m => m.flavor_profile.includes('umami')).length;

  // Normalized fractions
  const f_acid   = N_acid   / (total + ε);
  const f_sweet  = N_sweet  / (total + ε);
  const f_bitter = N_bitter / (total + ε);
  const f_umami  = N_umami  / (total + ε);

  // Acid masking weight is ZERO if mucositis_risk >= 2 (Gate 4 already blocked the
  // ingredient, but if it reaches here as a borderline case, no acid benefit applies)
  const acid_weight    = drug.mucositis_risk < 2 ? drug.metallic_intensity * 2.0 : 0;
  const bitter_penalty = drug.bitter_phantom * 3.0;
  const sweet_weight   = drug.sweet_threshold_raised ? 2.0 : 1.0;
  const umami_weight   = 1.5;  // umami pathway is least damaged — always valuable

  // Zinc bonus: flat normalized addition (not raw count)
  const zinc_bonus = ZINC_RICH_INGREDIENTS.includes(name) ? 0.15 : 0;

  // Affinity formula:
  // Affinity(ing) = Σ_k∈{acid,sweet,umami} w_k · (N_k / (N_total + ε))
  //              − w_bitter · (N_bitter / (N_total + ε))
  //              + zinc_bonus
  const affinity =
    (f_acid   * acid_weight) +
    (f_sweet  * sweet_weight) +
    (f_umami  * umami_weight) -
    (f_bitter * bitter_penalty) +
    zinc_bonus;

  // Convert to 0–10 scale
  const safety_score = Math.max(0, Math.min(10, affinity * 10));
  const include = safety_score > 1.0;

  const reason    = buildReason(ingredientName, N_acid, N_sweet, N_bitter, N_umami, f_acid, f_umami, safety_score, drug);
  const mechanism = buildMechanism(ingredientName, N_acid, f_acid, N_umami, f_umami, drug);

  return {
    name: ingredientName,
    safety_score,
    acid_count: N_acid,   acid_fraction: f_acid,
    sweet_count: N_sweet, sweet_fraction: f_sweet,
    bitter_count: N_bitter, bitter_fraction: f_bitter,
    umami_count: N_umami, umami_fraction: f_umami,
    total_molecules: total,
    include,
    reason,
    mechanism,
  };
}

function buildReason(
  name: string,
  N_acid: number, N_sweet: number, N_bitter: number, N_umami: number,
  f_acid: number, f_umami: number,
  score: number, drug: DrugProfile
): string {
  const pct = (f: number) => `${(f * 100).toFixed(0)}%`;

  if (f_acid > 0.12 && drug.metallic_intensity >= 2)
    return `${pct(f_acid)} acidic-profile molecules (${N_acid} found) counteract platinum ion binding at TRCs.`;
  if (f_umami > 0.08)
    return `${pct(f_umami)} umami-profile molecules (${N_umami} found) stimulate the least-damaged T1R1/T1R3 pathway.`;
  if (N_sweet > 0 && drug.sweet_threshold_raised)
    return `${N_sweet} sweet-profile molecules help compensate for the ${drug.display_name}-raised detection threshold.`;
  if (f_acid < 0.02 && N_bitter > 3)
    return `${N_bitter} bitter-profile molecules may amplify phantom bitterness. Use sparingly.`;
  return score > 5 ? `Favorable molecular profile for current symptom pattern.` : `Neutral molecular profile.`;
}

function buildMechanism(
  name: string,
  N_acid: number, f_acid: number,
  N_umami: number, f_umami: number,
  drug: DrugProfile
): string {
  // Full explanation for "Science Behind Every Bite" modal
  const lines: string[] = [];
  if (f_acid > 0.08 && drug.metallic_intensity >= 1)
    lines.push(`Citric/malic acid molecules (${N_acid} detected) compete with platinum ions at Type I metalloprotein taste receptor cells, reducing phantom metallic signal.`);
  if (f_umami > 0.05)
    lines.push(`Umami-profile molecules (${N_umami} detected) activate T1R1/T1R3 heterodimers — the pathway least affected by ${drug.display_name}.`);
  if (ZINC_RICH_INGREDIENTS.includes(name))
    lines.push(`Rich in zinc — essential cofactor for taste receptor cell (TRC) renewal. Chemo-induced zinc depletion accelerates dysgeusia; dietary zinc supports recovery.`);
  if (lines.length === 0)
    lines.push(`Neutral molecular profile. Included for texture/nutrition contribution with minimal taste interference.`);
  return lines.join(' ');
}
```

### 4.5 Recipe Scoring (Fixed Denominator)

```typescript
interface ScoredRecipe {
  id: string;
  title: string;
  cuisine: string;
  prep_time: number;
  ingredients: string[];
  taste_safe_score: number;     // 0–100 normalized
  score_breakdown: string;
  scored_count: number;
  neutral_count: number;
  unscored_count: number;
  nutrition?: NutritionProfile;
}

function scoreRecipe(
  recipe: RawRecipe,
  ingredientScores: Map<string, IngredientScore>,
  drug: EffectiveDrugProfile
): ScoredRecipe {

  // Hard exclusion: any single contraindicated ingredient kills the recipe score
  const hasHardExclusion = recipe.ingredients.some(ing => {
    const s = ingredientScores.get(ing.toLowerCase());
    return s && s.safety_score === -999;
  });
  if (hasHardExclusion) {
    const blocked = recipe.ingredients.find(ing => {
      const s = ingredientScores.get(ing.toLowerCase());
      return s && s.safety_score === -999;
    })!;
    return {
      ...recipe, taste_safe_score: 0,
      scored_count: 0, neutral_count: 0, unscored_count: recipe.ingredients.length,
      score_breakdown: `Contains contraindicated ingredient: ${blocked}. Recipe excluded.`,
    };
  }

  // Three-bucket classification per ingredient:
  // Scored   = in our database with an affinity score
  // Neutral  = base cooking ingredients (water, salt, oil) → NEUTRAL_SCORE = 5.0
  // Unscored = not in database → EXCLUDED from denominator (avoids the /0 problem)
  //
  // Old (broken): taste_safe_score = (raw / (ingredients.length * 10)) * 100
  //   → 80% of ingredients undefined → score 0 → almost every recipe scores <30/100
  //
  // New: RecipeScore = (Σ_scored S(i) + Σ_neutral S_neutral) / (|scored| + |neutral|)
  //   → only counts ingredients we have data on; unscored don't dilute the average

  let scoredSum   = 0;
  let scoredCount = 0;
  let neutralCount = 0;
  let unscoredCount = 0;

  for (const ing of recipe.ingredients) {
    const nameLower = ing.toLowerCase();

    if (NEUTRAL_INGREDIENTS.has(nameLower)) {
      scoredSum  += NEUTRAL_SCORE;
      neutralCount++;
      continue;
    }

    const s = ingredientScores.get(nameLower);
    if (s) {
      scoredSum += s.safety_score;
      scoredCount++;
    } else {
      unscoredCount++;  // unknown ingredient — excluded from denominator
    }
  }

  const totalCounted = scoredCount + neutralCount;
  if (totalCounted === 0) {
    return {
      ...recipe, taste_safe_score: 50,
      scored_count: 0, neutral_count: 0, unscored_count: unscoredCount,
      score_breakdown: `No scoreable ingredients found. Assigned neutral score.`,
    };
  }

  // Average over scored + neutral, then scale 0–10 → 0–100
  const avgScore = scoredSum / totalCounted;
  const taste_safe_score = Math.round(Math.min(100, Math.max(0, avgScore * 10)));

  return {
    ...recipe,
    taste_safe_score,
    scored_count:   scoredCount,
    neutral_count:  neutralCount,
    unscored_count: unscoredCount,
    score_breakdown:
      `Scored ${scoredCount} active + ${neutralCount} neutral of ${recipe.ingredients.length} ingredients. ` +
      `${unscoredCount} unrecognized ingredients excluded from denominator.`,
  };
}
```

### 4.6 Full Pipeline

```typescript
async function getRecommendations(drugId: string): Promise<{
  ingredientScores: IngredientScore[];
  recipes: ScoredRecipe[];
}> {
  const drug = DRUG_PROFILES[drugId];

  // Step 1: Load pre-compiled ingredient data — zero API calls, zero latency
  // Falls back to live FlavorDB only for ingredients NOT in the pre-compiled set
  const precompiled: Record<string, Molecule[]> =
    (await import('../data/ingredient_molecules.json')).default;

  // Step 2: Apply clinical candidate filter (mucositis, cold allodynia, CYP3A4 guards)
  const candidateIngredients = getCandidatesForDrug(drug);

  // Step 3: Score each candidate (all from static data — no API calls)
  const ingredientScores: IngredientScore[] = candidateIngredients.map(name => {
    const molecules = precompiled[name.toLowerCase()] ?? [];
    return scoreIngredient(name, molecules, drug);
  });

  // Step 4: Top 10 safe ingredients
  const topIngredients = ingredientScores
    .filter(s => s.include)
    .sort((a, b) => b.safety_score - a.safety_score)
    .slice(0, 10)
    .map(s => s.name);

  // Step 5: Query RecipeDB by INGREDIENT (not title — fixed)
  // searchByIngredient finds recipes containing the ingredient, not titled after it
  const liveRecipes = await Promise.all(
    topIngredients.slice(0, 5).map(ing =>
      RecipeDB.searchByIngredient(ing).catch(() => [] as RawRecipe[])
    )
  );

  // Step 5b: Merge curated offline recipes for demo reliability
  const offlineRecipes: RawRecipe[] = getCuratedRecipesForIngredients(topIngredients);

  const flatRecipes: RawRecipe[] = [...liveRecipes.flat(), ...offlineRecipes];
  const uniqueRecipes = deduplicateById(flatRecipes);

  // Step 6: Score each recipe with fixed denominator
  const scoreMap = new Map(ingredientScores.map(s => [s.name.toLowerCase(), s]));
  const scoredRecipes = uniqueRecipes
    .map(r => scoreRecipe(r, scoreMap, drug))
    .filter(r => r.taste_safe_score > 0)  // remove hard-excluded
    .sort((a, b) => b.taste_safe_score - a.taste_safe_score)
    .slice(0, 10);

  return { ingredientScores, recipes: scoredRecipes };
}

// Helper: load 50 curated recipes from local JSON as fallback
function getCuratedRecipesForIngredients(ingredients: string[]): RawRecipe[] {
  const curated: RawRecipe[] = require('../data/curated_recipes.json');
  // Return curated recipes that share at least 2 safe ingredients
  return curated.filter(r =>
    ingredients.filter(ing => r.ingredients.includes(ing)).length >= 2
  );
}
```

---

---

# PHASE 1 — HACKATHON PROTOTYPE

**24 hours · Nov 14 (9am) – Nov 15 (9am)**
**Goal: End-to-end working app, deployed, demo-able.**

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Built-in API routes = CORS proxy in same project |
| Language | TypeScript strict | Catch API shape errors fast in 24hrs |
| Styling | Tailwind CSS | Speed. Zero design decisions during build. |
| Radar chart | Recharts `RadarChart` | 3-overlay sensory shift visualization |
| State | React Context + useReducer | No Redux. Just app state: drug + results. |
| Caching | Next.js fetch revalidation | `next: { revalidate: 3600 }` on upstream calls |
| Deploy | Vercel | One push. Free. HTTPS for API calls. |

## File Structure

```
chemotaste/
├── app/
│   ├── page.tsx                      # Drug & Symptom Input
│   ├── results/
│   │   └── page.tsx                  # Radar + Ingredients + Recipes
│   ├── api/
│   │   └── proxy/
│   │       └── route.ts              # CORS proxy + rate limiter (Section 3.2)
│   ├── layout.tsx
│   └── globals.css
│
├── data/
│   ├── ingredient_molecules.json     # 80 pre-compiled ingredients (run scripts/precompile first)
│   ├── curated_recipes.json          # 50 manually validated recipes — offline demo fallback
│   ├── drug_food_interactions.json   # CYP3A4 blacklist, neutropenic blacklist, raw fish list
│   └── cache/
│       ├── taste_threshold.json      # Pre-fetched FlavorDB taste threshold data
│       └── molecules_*.json          # Emergency molecule cache by flavor type
│
├── lib/
│   ├── drugProfiles.ts               # Drug profile data (Section 2.1)
│   ├── algorithm.ts                  # Safety gates + affinity scoring + recipe scoring
│   ├── flavordbClient.ts             # FlavorDB wrapper with static fallback
│   ├── recipedbClient.ts             # RecipeDB wrapper — ingredient-based search
│   ├── dietrxClient.ts               # DietRx PubMed citation data
│   ├── seedData.ts                   # Seed lists + all safety constant arrays
│   └── types.ts                      # All shared interfaces
│
├── components/
│   ├── DrugSelector.tsx              # Step 1: pick drug(s)
│   ├── TasteDamageRadar.tsx          # 3-overlay radar (baseline / shift / masked)
│   ├── IngredientFilterPanel.tsx     # Included / excluded with reasons + fractions
│   ├── RecipeGrid.tsx                # Step 4: recipe cards
│   ├── RecipeCard.tsx                # TASTE-SAFE SCORE gauge + score breakdown
│   ├── ScienceBehindEveryBite.tsx    # Modal: molecule structure + PubChem + mechanism
│   ├── SmartSubstitutionEngine.tsx   # "Substitute beef → braised king oyster mushrooms"
│   ├── DietRxBadge.tsx               # PubMed citation count badge
│   ├── ClinicalWarningBanner.tsx     # Shows active safety gates (e.g., "Acid blocked")
│   └── LoadingSkeleton.tsx
│
├── scripts/
│   └── precompile_ingredients.ts     # Run once pre-hackathon → writes ingredient_molecules.json
│
└── .env.local                        # FOODOSCOPE_API_KEY=...
```

## Component Breakdown

### `DrugSelector.tsx`
- List of 6 drug cards with drug class badge (Platinum / Antimetabolite / Taxane)
- Multi-select (combination regimens like FOLFOX = oxaliplatin + 5-FU)
- "Unknown / General chemo" option → merged default profile
- Clinical warning preview: "Combining Oxaliplatin + 5-FU activates mucositis + cold allodynia guards"
- "Find Safe Recipes →" button

### `TasteDamageRadar.tsx`
Three overlays on a single Recharts `RadarChart`. Judges will immediately understand what
the app does the moment they see this visualization.

```typescript
const radarData = [
  {
    axis: 'Sweet',
    healthy:    1.0,
    damaged:    drug.sweet_threshold_raised ? 0.45 : 0.9,  // threshold raised 45%
    masked:     drug.sweet_threshold_raised ? 0.75 : 0.9,  // high sweet-density recipes
  },
  {
    axis: 'Bitter',
    healthy:    1.0,
    damaged:    drug.bitter_phantom > 0 ? Math.min(1.5, 1.0 + drug.bitter_phantom * 0.15) : 1.0,
    masked:     drug.bitter_phantom > 0 ? Math.max(1.0, 1.0 + drug.bitter_phantom * 0.05) : 1.0,
  },
  {
    axis: 'Metallic',
    healthy:    0.0,
    damaged:    drug.metallic_intensity / 3,
    masked:     drug.mucositis_risk < 2
                  ? Math.max(0, drug.metallic_intensity / 3 - 0.35)  // acid-masked
                  : drug.metallic_intensity / 3,                      // no acid masking (mucositis)
  },
  {
    axis: 'Umami',
    healthy:    1.0,
    damaged:    0.88,
    masked:     1.05,  // umami-forward recipes deliberately boost this above baseline
  },
  {
    axis: 'Nausea Risk',
    healthy:    0.0,
    damaged:    drug.nausea_risk / 3,
    masked:     Math.max(0, drug.nausea_risk / 3 - 0.25),  // low-volatility recipe
  },
];
```

Tooltip on hover: "Sweet detection threshold raised 45% by Cisplatin. These recipes contain
ingredients with high sweet-fraction molecular profiles to cross that threshold."

### `ClinicalWarningBanner.tsx`
Rendered above results. Surfaced only when a safety gate is active. Example:

> ⚠ **Active Safety Overrides for FOLFOX (Oxaliplatin + 5-FU)**
> - Mucositis Grade 3: Acid masking disabled. Citrus, vinegar, and spice are blocked.
> - Cold Allodynia: All cold/iced dishes blocked. All recipes served at room temperature or warm.
> - Neutropenic Safety: Raw fish and unpasteurized produce excluded.

### `ScienceBehindEveryBite.tsx`
Modal triggered by clicking any ingredient chip. Replaces the generic MoleculeDetail.

```
┌──────────────────────────────────────────────────────┐
│ 🍋 Lemon                           [PubChem: 311]    │
│                                                       │
│ Molecules: 47 total · 18 acidic (38%) · 2 bitter (4%)│
│                                                       │
│ Mechanism:                                            │
│ Citric acid (C₆H₈O₇) competitively binds at Type I   │
│ metalloprotein TRCs, displacing platinum ions and     │
│ reducing phantom metallic signal by estimated 30–40%. │
│                                                       │
│ 3 volatile aldehydes suppressed to reduce nausea risk │
│ (citral, geranial, neral — all below 10 ppm threshold)│
│                                                       │
│ 🔬 DietRx: 8 PubMed citations — citrus in oncology   │
│    supportive care and taste recovery                 │
└──────────────────────────────────────────────────────┘
```

### `SmartSubstitutionEngine.tsx`
Shown next to every excluded ingredient. Instead of a generic "Beef: excluded":

```
❌ Beef (excluded)
   → Substitute: Braised King Oyster Mushrooms
     +14 umami-profile molecules
     0 heme iron (no metallic amplification)
     Similar chew texture; purée if mucositis active
     [🔬 DietRx: 6 citations — mushroom + taste recovery]
```

Substitution map is hard-coded for the demo's 6–8 excluded ingredients.
Generates itself automatically from the scored ingredient list (top-N safe ingredients
that approximate the texture/nutrition of the excluded item).

### `IngredientFilterPanel.tsx`
- Two columns: Included (green) / Excluded (red)
- Each ingredient shows:
  - Molecule fraction badges: `[38% acid]` `[6% bitter]` `[12% umami]` `[N=47]`
  - One-line reason (from `scoreIngredient().reason`)
  - AFFINITY SCORE (0–10)
  - "Why?" chip → opens `ScienceBehindEveryBite` modal
- Sort by affinity score descending

### `RecipeCard.tsx`
- Recipe title, cuisine badge, prep time
- Ingredient list (highlight safe green, neutral grey, excluded red)
- TASTE-SAFE SCORE: circular gauge 0–100
  - 80–100: green ("Highly recommended")
  - 50–79: yellow ("Good choice")
  - below 50: grey ("May be tolerable")
- Score breakdown line: "Scored 4 active + 3 neutral of 10 ingredients. 3 unscored excluded from average."
- Expandable "Why this score?" section showing molecule breakdown

### `DietRxBadge.tsx`
```typescript
// Renders: "🔬 DietRx: 14 PubMed citations — miso + mucosal healing"
// Fetched on demand (low priority, parallel to main pipeline)
// Degrades gracefully: hidden if DietRx API is slow/down
```

## Hour-by-Hour Build Plan

```
[H 0–1]   SETUP
          npx create-next-app@14 chemotaste --typescript --tailwind --app
          Copy all data files (drugProfiles.json, ingredient_molecules.json,
            curated_recipes.json, drug_food_interactions.json) from this doc
          Push to GitHub. Deploy to Vercel. Confirm live URL. ← DO THIS FIRST

[H 1–3]   DATA LAYER
          Implement types.ts, drugProfiles.ts, seedData.ts
          Implement algorithm.ts:
            - All 5 safety gate functions
            - scoreIngredient with normalized affinity density
            - scoreRecipe with 3-bucket denominator
            - getCandidatesForDrug (clinical filter)
          Unit-test scoring with inline test data (no API needed yet)
          Verify: cisplatin + 5-FU combo → acid_maskers blocked, warm_dishes added

[H 3–5]   API LAYER
          Implement proxy/route.ts (with rate limiter)
          Implement flavordbClient.ts (static-first, live fallback)
          Implement recipedbClient.ts (searchByIngredient — not searchByTitle)
          Test each endpoint: log raw response shapes
          ⚠ Max 60 min on API issues → switch to pre-compiled + curated fallback

[H 5–8]   PIPELINE INTEGRATION
          Implement getRecommendations() in algorithm.ts
          Wire: drug selection → getCandidatesForDrug → affinity scoring → recipe search
          Log full pipeline for cisplatin. Verify: scores > 50, no acid maskers if mucositis
          Log pipeline for oxaliplatin. Verify: cold_dishes absent, warm_dishes present

[H 8–13]  UI — Core Components
          DrugSelector.tsx (multi-select, combination warning)
          TasteDamageRadar.tsx (3 overlays, recharts pinned version)
          IngredientFilterPanel.tsx (fraction badges, safety gate reasons)
          RecipeCard.tsx (3-bucket score breakdown visible)

[H 13–17] UI — Integration
          Wire pages: /page.tsx → /results/page.tsx
          ClinicalWarningBanner.tsx (shows active gates)
          Add loading skeletons (API ~1–3s for recipe search)
          Add error boundary / fallback to curated_recipes.json

[H 17–19] POLISH
          Multi-drug combination logic (mergeDrugProfiles)
          ScienceBehindEveryBite modal (ingredient detail)
          SmartSubstitutionEngine (hard-coded substitution map for demo drugs)
          Mobile responsive (Tailwind flex-wrap)

[H 19–21] DIETRX + DEMO MODE
          DietRxBadge.tsx (parallel fetch, graceful degradation)
          Implement ?demo=true: bypass all API, serve curated_recipes.json + ingredient_molecules.json
          Implement 3 built-in demo personas:
            - Cisplatin: metallic=3, mucositis=1, zinc depleted
            - Oxaliplatin: cold hard-blocked, metallic=2
            - FOLFOX combo: mucositis=3 + cold hard-blocked simultaneously
          Run through all 3 demo flows

[H 21–23] DEMO PREP
          Run demo flow 10x. Time it. Must be <90 seconds start to results.
          Confirm ?demo=true works offline on phone hotspot
          Add "Not medical advice" banner. Add "Validated by FlavorDB/RecipeDB/DietRx ecosystem" footer
          Final Vercel deploy

[H 23–24] BUFFER
          Fix one critical bug if exists
          Confirm live URL loads on mobile
```

## Drug Combination Logic (Multi-Drug Regimens)

Common regimens: FOLFOX (oxaliplatin + 5-FU + leucovorin), TC (paclitaxel + carboplatin).

Merge profiles by taking the union of constraints. Cold hypersensitivity and mucositis
use `Math.max` — the stricter constraint always wins.

```typescript
function mergeDrugProfiles(profiles: DrugProfile[]): DrugProfile {
  return {
    id: profiles.map(p => p.id).join('+'),
    display_name: profiles.map(p => p.display_name).join(' + '),
    drug_class: 'Combination',
    metallic_intensity: Math.max(...profiles.map(p => p.metallic_intensity)) as 0|1|2|3,
    bitter_phantom:     Math.max(...profiles.map(p => p.bitter_phantom))     as 0|1|2|3,
    sweet_threshold_raised: profiles.some(p => p.sweet_threshold_raised),
    cold_preference:    mergeColdPreferences(profiles),
    cold_hypersensitivity: profiles.some(p => p.cold_hypersensitivity),  // any drug triggers = all blocked
    nausea_risk:        Math.max(...profiles.map(p => p.nausea_risk))        as 0|1|2|3,
    zinc_depletion:     profiles.some(p => p.zinc_depletion),
    mucositis_risk:     Math.max(...profiles.map(p => p.mucositis_risk))     as 0|1|2|3,
    cyp3a4_sensitive:   profiles.some(p => p.cyp3a4_sensitive),
    avoid_categories:   [...new Set(profiles.flatMap(p => p.avoid_categories))],
    boost_categories:   [...new Set(profiles.flatMap(p => p.boost_categories))],
  };
}

function mergeColdPreferences(profiles: DrugProfile[]): boolean | null {
  if (profiles.some(p => p.cold_preference === false)) return false;  // avoid cold wins
  if (profiles.some(p => p.cold_preference === true))  return true;
  return null;
}
```

## Minimum Viable Build (Must have for demo)

- [ ] Drug selector: at least cisplatin, oxaliplatin, FOLFOX combo working
- [ ] `ingredient_molecules.json` pre-compiled and loaded (no N+1 waterfall)
- [ ] All 5 safety gates firing correctly (test: oxaliplatin → no cold; 5-FU → no acid)
- [ ] Normalized affinity score visible per ingredient (with fraction display)
- [ ] At least 5 recipes rendered with TASTE-SAFE SCORE and 3-bucket breakdown
- [ ] `?demo=true` mode working offline with curated recipes
- [ ] 3-overlay radar chart rendered
- [ ] Deployed on Vercel — accessible by URL on any device

---

---

# PHASE 2 — FULL PRODUCT

**Post-hackathon. 3–6 months. Production-grade.**

---

## Product Definition

ChemoTaste becomes the go-to dietary companion for chemotherapy patients —
used directly by patients, recommended by oncology dietitians, and eventually
integrated into hospital discharge workflows.

**User segments:**
- Primary: Patients in active chemo treatment
- Secondary: Oncology dietitians using it to guide patients
- Tertiary: Caregivers preparing food at home

---

## Tech Stack — Full Product

| Layer | Choice | Why |
|---|---|---|
| Mobile | React Native (Expo) | Code-share with web layer, iOS + Android |
| Web | Next.js 14 (same codebase) | Dietitian dashboard runs on web |
| Backend | Node.js + Fastify | Lighter than Express. TypeScript native. |
| Database | PostgreSQL (Supabase) | User profiles, symptom logs, recipe ratings |
| Cache | Redis (Upstash serverless) | FlavorDB/RecipeDB responses, molecule index |
| Auth | Clerk | Patient identity, session management, HIPAA-adjacent |
| ML service | Python FastAPI | Symptom-adaptive scoring model (see Section below) |
| ORM | Prisma | Type-safe DB queries |
| Job queue | BullMQ | Daily cache refresh, digest emails |
| Infra | Docker + Railway (backend) + Vercel (frontend) | Simple, affordable |
| CI/CD | GitHub Actions | Test → lint → deploy on push |
| Analytics | PostHog (self-hosted EU) | Privacy-compliant event tracking |
| Error tracking | Sentry | Production error capture |

---

## Database Schema (PostgreSQL)

```sql
-- Users (patients + caregivers + dietitians)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  role          TEXT CHECK (role IN ('patient', 'dietitian', 'caregiver')) DEFAULT 'patient',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Patient treatment profiles
CREATE TABLE treatment_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  drug_ids        TEXT[],               -- e.g. ['cisplatin', '5fu']
  treatment_start DATE,
  cycle_length    INT DEFAULT 21,
  current_cycle   INT DEFAULT 1,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Daily symptom check-ins
CREATE TABLE symptom_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id),
  logged_at        TIMESTAMPTZ DEFAULT now(),
  metallic_score   SMALLINT CHECK (metallic_score BETWEEN 0 AND 10),
  bitter_score     SMALLINT CHECK (bitter_score BETWEEN 0 AND 10),
  sweet_score      SMALLINT CHECK (sweet_score BETWEEN 0 AND 10),
  nausea_score     SMALLINT CHECK (nausea_score BETWEEN 0 AND 10),
  appetite_score   SMALLINT CHECK (appetite_score BETWEEN 0 AND 10),
  mouth_sore_score SMALLINT CHECK (mouth_sore_score BETWEEN 0 AND 10),
  free_text        TEXT
);

-- Recipe interactions
CREATE TABLE recipe_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id),
  recipe_id   TEXT NOT NULL,
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  could_taste BOOLEAN,
  ate_fully   BOOLEAN,
  rated_at    TIMESTAMPTZ DEFAULT now()
);

-- Saved recipes
CREATE TABLE saved_recipes (
  user_id     UUID REFERENCES users(id),
  recipe_id   TEXT NOT NULL,
  saved_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

-- Dietitian–patient links
CREATE TABLE care_relationships (
  dietitian_id  UUID REFERENCES users(id),
  patient_id    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (dietitian_id, patient_id)
);
```

---

## Backend API Routes (Fastify)

```
POST   /auth/register              # Clerk webhook — create user record
GET    /profile                    # Get treatment profile
PUT    /profile                    # Update drugs, cycle info
POST   /symptom-log                # Log today's symptoms
GET    /symptom-log/history        # Last 30 days

GET    /recommendations            # Main pipeline: drug + symptoms → recipes
                                   # Query: drug_ids[], use_symptoms=true|false

GET    /recipes/:id                # Single recipe detail (proxied + cached)
POST   /recipes/:id/rate           # Submit recipe rating
GET    /recipes/saved              # User's saved recipes
POST   /recipes/:id/save
DELETE /recipes/:id/save

GET    /ingredients/analysis       # Ingredient filter panel data for current profile

# Dietitian routes
GET    /patients                   # Dietitian's patient list
GET    /patients/:id/history       # Patient's symptom + rating history
POST   /patients/:id/note          # Add clinical note

# Internal / system
GET    /health
POST   /admin/refresh-molecule-cache   # Trigger Redis cache refresh
```

---

## Adaptive Scoring — Symptom Integration

Phase 2 feature. Phase 1 uses drug defaults. Phase 2 personalizes using patient-reported symptoms.

```typescript
// Every morning: patient rates metallic (0–10), bitter (0–10), sweet (0–10), etc.
// These override drug profile defaults for that day's recommendations

function buildAdaptiveProfile(
  drugProfile: DrugProfile,
  latestSymptoms: SymptomLog | null
): EffectiveProfile {
  if (!latestSymptoms) return drugProfile;

  const s = latestSymptoms;
  return {
    ...drugProfile,
    metallic_intensity:    normalize(s.metallic_score)   as 0|1|2|3,
    bitter_phantom:        normalize(s.bitter_score)     as 0|1|2|3,
    sweet_threshold_raised: s.sweet_score < 5,
    nausea_risk:           normalize(s.nausea_score)     as 0|1|2|3,
    mucositis_risk:        normalize(s.mouth_sore_score) as 0|1|2|3,
    // cold_hypersensitivity and cyp3a4_sensitive are drug-determined,
    // never overridden by symptom reporting
  };
}

function normalize(score: number): number {
  if (score <= 2) return 0;
  if (score <= 4) return 1;
  if (score <= 7) return 2;
  return 3;
}
```

### ML Model (Phase 2.1, ~month 3)

Once ~500 patient records with recipe ratings exist, train a personalization model.

**Input features:**
- Drug ids (one-hot, 6 drugs)
- Days since last infusion (normalized 0–21)
- Treatment cycle number
- Symptom log (metallic, bitter, sweet, nausea, appetite, mouth_sore — all 0–10)
- 7-day food rating history (avg rating per recipe, could_taste rate)

**Output:** Adjusted `metallic_weight`, `bitter_penalty`, `sweet_weight`, `umami_weight`
for the affinity density formula.

**Model:** XGBoost regression. Served via Python FastAPI.

```
POST /ml/scoring-weights
Body: { drug_ids, days_since_infusion, cycle, symptoms, rating_history }
Returns: { metallic_weight, bitter_penalty, sweet_weight, umami_weight }
```

Training: Monthly retrain on anonymized (consent-gated) data.

---

## Treatment Phase Awareness

Chemotherapy cycles are typically 21 days. Symptoms follow a predictable pattern:

```
Day 0 (infusion)  → metallic/nausea peak
Day 1–5           → worst dysgeusia + nausea
Day 6–10          → partial recovery
Day 11–21         → near-normal before next cycle
```

Phase 2 uses `days_since_last_infusion` to automatically adjust weight multipliers:

```typescript
function getCyclePhaseMultiplier(daysSinceInfusion: number): number {
  if (daysSinceInfusion <= 5)  return 1.5;  // amplify all weights — worst phase
  if (daysSinceInfusion <= 10) return 1.2;
  return 1.0;
}
```

---

## Mobile App (React Native + Expo)

Core screens:

```
1. Onboarding
   - Drug selection (same logic as web)
   - Treatment start date → auto-computes cycle day
   - Dietary preferences (vegetarian, cuisine preference)
   - Clinical safety acknowledgment (cold allodynia / mucositis warnings shown on onboarding)

2. Home
   - Today's cycle day indicator (e.g., "Day 4 — Peak symptom phase")
   - Active safety gate badges ("⚠ Acid masking OFF — mucositis active")
   - Quick symptom check-in (5 sliders, takes 30s)
   - "Today's Recommendations" shortcut

3. Recommendations
   - 3-overlay Taste Damage Radar (same as web)
   - ClinicalWarningBanner (active gates)
   - Ingredient filter panel
   - Recipe cards with TASTE-SAFE SCORE

4. Recipe Detail
   - Full ingredients + instructions
   - "Science Behind Every Bite" — expandable per ingredient
   - "I tried this" → rate 1–5 + could_taste checkbox
   - Save recipe

5. History
   - Symptom trend chart (past 21 days)
   - Recipe log (what was eaten + how it went)
   - Nutrient intake summary (from RecipeDB nutrition data)

6. Dietitian Share
   - Generate PDF report of last 14 days (symptoms + food intake)
   - Share link or QR code for dietitian to view
```

---

## Redis Caching Strategy

| Data | TTL | Reason |
|---|---|---|
| Taste threshold index (full FlavorDB) | 24h | Rarely changes. Pre-warm daily. |
| Ingredient molecule list (per ingredient) | 6h | Moderate freshness needed |
| Recipe search results (by ingredient) | 2h | More variable |
| DietRx associations (per ingredient) | 48h | Very stable (PubMed index) |

Pre-warm on app startup or via daily cron job:
```typescript
async function warmMoleculeCache() {
  // Pre-warm taste threshold data (the primary FlavorDB use)
  const ttKey = 'flavordb:taste-threshold';
  const cached = await redis.get(ttKey);
  if (!cached) {
    const data = await FlavorDB.getTasteThresholdData();
    await redis.setex(ttKey, 86400, JSON.stringify(data));
  }
}
```

---

## Clinical Integration Path (Phase 2.2)

Target: Hospitals use ChemoTaste as a recommended tool in discharge instructions.

**Step 1 (Month 1–2):** Approach oncology departments at AIIMS Delhi or Tata Memorial Mumbai.
Propose a 30-patient observational study. Measure: appetite scores (ESAS scale), weight
stability during treatment. No randomization needed for observational data.

**Step 2 (Month 3–5):** Dietitian dashboard launched. Give access to willing oncology
dietitians as beta users. Collect feedback on recipe quality, clinical relevance.

**Step 3 (Month 6+):** HL7 FHIR integration for EHR read-only access (medication list →
auto-populate drug selection). Requires hospital IT cooperation. Focus on Cerner integration
first (Tata Memorial uses it).

**Compliance considerations:**
- India DPDP Act 2023 compliance (data localization, consent framework)
- All health data stored in India (Supabase Mumbai region available)
- No PHI shared with CoSy Lab APIs
- US market expansion requires HIPAA BAA — defer to Phase 3

---

## Deployment & Infrastructure

```
Production topology:

Vercel (Next.js web + dietitian dashboard)
    ↓ HTTPS
Railway (Fastify backend + BullMQ workers)
    ↓
Supabase (PostgreSQL, India region)
    ↓
Upstash Redis (serverless, low latency cache)

GitHub Actions pipeline:
  push to main → lint → type-check → unit tests → deploy Railway → deploy Vercel
```

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| CoSy Lab API rate-limit (429) during demo | HIGH | Proxy rate limiter at 40 req/min. Pre-compiled ingredient data means 0 runtime ingredient API calls. Demo mode bypasses all live calls. |
| API response shape changes | MEDIUM | Strict TypeScript types + runtime Zod validation. Tests fail fast on shape change. |
| Drug profile accuracy disputed by judges | HIGH | Every profile cites published source. "Not medical advice" on every screen. |
| FlavorDB misrepresented as taste classifier | CRITICAL | Corrected in Section 0 and all UI copy. FlavorDB positioned as VOC/aroma filter + taste-threshold perceptibility scorer. |
| Neutropenic infection via food recommendation | CRITICAL | NEUTROPENIC_BLACKLIST hard-coded in seedData.ts. No raw fish, raw egg, or unpasteurized produce in any seed list. |
| CYP3A4 drug-food interaction (grapefruit) | CRITICAL | DRUG_INTERACTION_BLACKLIST enforced in Gate 1 of scoreIngredient. cyp3a4_sensitive flag on Paclitaxel, Cyclophosphamide. |
| Mucositis + acid masking conflict | CRITICAL | Gate 4 in scoreIngredient. mucositis_risk >= 2 = absolute acid/spice block, even when metallic_intensity == 3. ClinicalWarningBanner surfaces this to user. |
| Cold allodynia (Oxaliplatin + cold food) | CRITICAL | Gate 5 in scoreIngredient. cold_hypersensitivity = true on Oxaliplatin profile. Hard-blocks all cold/iced items. mergeDrugProfiles propagates this flag on combination regimens. |
| FlavorDB molecule coverage gaps | MEDIUM | Ingredients with 0 molecules in database get ε=5 smoothing → score near-neutral, not 0. Pre-compiled data includes manual verification for seed list ingredients. |
| RecipeDB title search returning wrong recipes | HIGH | Fixed: use `searchByIngredient` (ingredient-based endpoint), not `searchByTitle`. |
| Patients replacing medical care with app | CRITICAL | Hard guardrails: app never diagnoses. "Discuss with your oncologist before changing diet" on every result screen. |
| CORS issues on hack day | HIGH | Proxy solves CORS. If proxy fails: demo mode uses local JSON only. |

---

## Pre-Hackathon Checklist (Complete Before Nov 14)

- [ ] Register foodoscope.com → confirm API key received
- [ ] Test FlavorDB `properties/taste-threshold` endpoint → log response shape
- [ ] Test RecipeDB `recipes/ingredient` endpoint with "mushroom" → verify returns recipes CONTAINING mushroom
- [ ] Run `scripts/precompile_ingredients.ts` → verify `data/ingredient_molecules.json` generated (~35–45KB)
- [ ] Manually build `data/curated_recipes.json`: 50 recipes validated for cisplatin, oxaliplatin, 5-FU
- [ ] Build `data/drug_food_interactions.json`: CYP3A4 blacklist + neutropenic blacklist
- [ ] Pre-fetch `data/cache/taste_threshold.json`
- [ ] `npx create-next-app@14` → push to GitHub → deploy to Vercel → confirm live URL
- [ ] Install recharts: `npm install recharts@2.10.1` — confirm 3-overlay RadarChart renders
- [ ] Assign roles: API + algorithm layer / UI + radar / integration + demo mode
- [ ] Read and agree on TypeScript interfaces in `types.ts` before splitting work
- [ ] Run FOLFOX test (oxaliplatin + 5-FU): confirm acid_maskers blocked AND cold_dishes blocked simultaneously
