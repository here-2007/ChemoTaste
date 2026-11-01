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

### Key Algorithmic Insight

> FlavorDB classifies every flavor molecule by its taste quality (sweet / bitter / acidic /
> sour / umami). Every ingredient = a weighted bag of such molecules. We can compute a
> **TASTE-SAFE SCORE** for each ingredient against a patient's drug-specific damage profile.
> This has never been done for chemotherapy patients. This is the novelty.

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
│   nausea_risk, cold_preference, zinc_depletion)      │
└─────────────────────┬────────────────────────────────┘
                      │
         ┌────────────┴──────────────┐
         │                           │
┌────────▼────────┐       ┌──────────▼──────────┐
│  FLAVORDB API   │       │  SAFETY SCORE ENGINE │
│                 │       │                      │
│ Fetch molecules │──────▶│ Score each ingredient│
│ by flavor type  │       │ per drug profile     │
│ (sweet/bitter/  │       │ → ranked ingredient  │
│  acidic/umami)  │       │   list               │
└─────────────────┘       └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │   RECIPEDB API        │
                          │                       │
                          │ Query using top-N     │
                          │ safe ingredients      │
                          │ → scored recipe list  │
                          └──────────┬────────────┘
                                     │
                          ┌──────────▼───────────┐
                          │      UI LAYER         │
                          │                       │
                          │ Radar chart           │
                          │ Ingredient filter     │
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
  nausea_risk: 0 | 1 | 2 | 3;
  zinc_depletion: boolean;
  mucositis_risk: 0 | 1 | 2 | 3;    // 0=none, 3=severe mouth sores
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
    "nausea_risk": 3,
    "zinc_depletion": true,
    "mucositis_risk": 1,
    "avoid_categories": ["red_meat", "coffee", "high_fat"],
    "boost_categories": ["citrus", "umami", "cold_dishes", "zinc_rich"]
  },
  "oxaliplatin": {
    "id": "oxaliplatin",
    "display_name": "Oxaliplatin (Eloxatin)",
    "drug_class": "Platinum-based",
    "metallic_intensity": 2,
    "bitter_phantom": 2,
    "sweet_threshold_raised": false,
    "cold_preference": false,
    "nausea_risk": 2,
    "zinc_depletion": false,
    "mucositis_risk": 0,
    "avoid_categories": ["cold_dishes", "cold_drinks"],
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
    "nausea_risk": 2,
    "zinc_depletion": true,
    "mucositis_risk": 3,
    "avoid_categories": ["spicy", "acidic", "hard_texture"],
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
    "nausea_risk": 2,
    "zinc_depletion": true,
    "mucositis_risk": 1,
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
    "nausea_risk": 3,
    "zinc_depletion": false,
    "mucositis_risk": 1,
    "avoid_categories": ["fatty", "high_aroma"],
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
    "nausea_risk": 3,
    "zinc_depletion": false,
    "mucositis_risk": 1,
    "avoid_categories": ["red_meat", "high_fat"],
    "boost_categories": ["acid_maskers", "mild_flavor", "umami"]
  }
}
```

### 2.2 Flavor Category → Ingredient Seed List

Hard-coded lookup used when FlavorDB API is slow/down. Built by scraping FlavorDB entity pages manually before hackathon.

```json
{
  "acid_maskers": ["lemon", "lime", "tomato", "vinegar", "yogurt", "orange", "tamarind", "cranberry"],
  "umami_rich": ["mushroom", "tomato", "miso", "parmesan", "soy sauce", "seaweed", "anchovy"],
  "zinc_rich": ["pumpkin seeds", "eggs", "chickpeas", "lentils", "cashews", "chicken", "salmon"],
  "soft_texture": ["banana", "mashed potato", "oatmeal", "avocado", "tofu", "yogurt", "hummus"],
  "mild_flavor": ["rice", "pasta", "potato", "chicken breast", "tofu", "egg white", "zucchini"],
  "cold_dishes": ["smoothie", "salad", "gazpacho", "sushi", "cold noodle", "fruit bowl"],
  "warm_dishes": ["soup", "stew", "porridge", "warm salad", "braised"],
  "avoid_red_meat": ["beef", "lamb", "pork", "venison", "bison"]
}
```

---

## 3. API Integration Strategy

### 3.1 Access

The CoSy Lab APIs (FlavorDB2 at `cosylab.iiitd.edu.in/flavordb2`, RecipeDB at
`cosylab.iiitd.edu.in/recipedb`) are accessible to hackathon participants via the
Foodoscope platform.

**Action — do before Nov 14:**
1. Register at https://www.foodoscope.com → obtain API key
2. Verify from terminal:
   ```bash
   curl "https://cosylab.iiitd.edu.in/flavordb2/api/molecules_data/by-flavorProfile?flavor=acidic" \
        -H "Authorization: Bearer $YOUR_API_KEY"
   ```
3. If organizers distribute keys on hack day — email them BEFORE Nov 14 to confirm mechanism

### 3.2 CORS — Critical Issue

Direct browser-to-`cosylab.iiitd.edu.in` calls **fail with CORS errors**.
All API traffic must route through your own Next.js API route.

```typescript
// app/api/proxy/route.ts
import { NextRequest } from 'next/server';

const BASE_URLS: Record<string, string> = {
  flavordb: 'https://cosylab.iiitd.edu.in/flavordb2/api',
  recipedb:  'https://cosylab.iiitd.edu.in/recipedb/api',
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const db       = searchParams.get('db')!;
  const endpoint = searchParams.get('endpoint')!;

  // Remove routing params, forward everything else as query string
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
      next: { revalidate: 3600 },   // cache 1hr — molecule data rarely changes
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

All client-side calls then hit `/api/proxy?db=flavordb&endpoint=molecules_data/by-flavorProfile&flavor=acidic`.

### 3.3 Client Wrappers

```typescript
// lib/flavordbClient.ts

const call = (db: string, endpoint: string, params: Record<string, string>) => {
  const qs = new URLSearchParams({ db, endpoint, ...params });
  return fetch(`/api/proxy?${qs}`).then(r => {
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json();
  });
};

export const FlavorDB = {
  getMoleculesByFlavor: (flavor: string) =>
    call('flavordb', 'molecules_data/by-flavorProfile', { flavor }),

  getMoleculesByType: (type: string) =>
    call('flavordb', 'molecules_data/filter-by-type', { type }),

  getIngredientMolecules: (alias: string) =>
    call('flavordb', 'food/by-alias', { alias }),

  searchEntity: (name: string) =>
    call('flavordb', 'entities/by-entity-alias-readable', { name }),

  getTasteThreshold: () =>
    call('flavordb', 'properties/taste-threshold', {}),
};
```

```typescript
// lib/recipedbClient.ts

export const RecipeDB = {
  searchByTitle: (title: string) =>
    call('recipedb', 'recipe-bytitle/recipeByTitle', { title }),

  getByCuisine: (region: string) =>
    call('recipedb', 'recipes_cuisine/cuisine/' + region, {}),

  getById: (id: string) =>
    call('recipedb', 'search-recipe/' + id, {}),

  getInstructions: (id: string) =>
    call('recipedb', 'instructions/' + id, {}),
};
```

### 3.4 Endpoints Used

| Call | DB | Parameters | Returns |
|---|---|---|---|
| `molecules_data/by-flavorProfile` | FlavorDB | `flavor=acidic\|sweet\|bitter\|umami\|sour` | List of molecules with that flavor profile |
| `molecules_data/filter-by-type` | FlavorDB | `type=ester\|acid\|aldehyde\|...` | Molecules by chemical type |
| `food/by-alias` | FlavorDB | `alias=lemon` | Ingredient's molecule list |
| `entities/by-entity-alias-readable` | FlavorDB | `name=ginger` | Entity metadata |
| `properties/taste-threshold` | FlavorDB | — | All molecules with taste threshold data |
| `recipe-bytitle/recipeByTitle` | RecipeDB | `title=chicken` | Recipe search results |
| `recipes_cuisine/cuisine/{region}` | RecipeDB | path param | Recipes by cuisine region |
| `search-recipe/{id}` | RecipeDB | path param | Full recipe detail |

### 3.5 Fallback Strategy (If API Fails During Hackathon)

Pre-fetch molecule data before Nov 14 and commit to `/data/cache/`:

```bash
# Run this script 1–2 days before hackathon
for flavor in acidic sweet bitter umami sour; do
  curl "https://cosylab.iiitd.edu.in/flavordb2/api/molecules_data/by-flavorProfile?flavor=$flavor" \
       -H "Authorization: Bearer $FOODOSCOPE_API_KEY" \
       -o "data/cache/molecules_$flavor.json"
done
```

Also manually download entity data for the 40 most important ingredients (the two category seed lists above) using FlavorDB's website JSON export.

App checks cache first; calls live API only if cache miss. This means demo works even if CoSy Lab API has outage on hack day.

---

## 4. Algorithm Design

### 4.1 Molecule Index Build

Runs once on app startup or on first drug selection. Fetches all 4 flavor categories in parallel.

```typescript
interface MoleculeIndex {
  acidic: Molecule[];
  sweet:  Molecule[];
  bitter: Molecule[];
  umami:  Molecule[];
}

interface Molecule {
  id: number;
  common_name: string;
  flavor_profile: string[];
  taste_threshold?: number;   // μmol/ml — lower = detectable at smaller concentration
  natural_sources: string[];  // ingredient names that contain this molecule
}

async function buildMoleculeIndex(): Promise<MoleculeIndex> {
  const [acidic, sweet, bitter, umami] = await Promise.all([
    FlavorDB.getMoleculesByFlavor('acidic'),
    FlavorDB.getMoleculesByFlavor('sweet'),
    FlavorDB.getMoleculesByFlavor('bitter'),
    FlavorDB.getMoleculesByFlavor('umami'),
  ]);
  return { acidic, sweet, bitter, umami };
}
```

### 4.2 Ingredient Safety Score

```typescript
interface IngredientScore {
  name: string;
  safety_score: number;
  acid_count:   number;
  sweet_count:  number;
  bitter_count: number;
  umami_count:  number;
  include:      boolean;
  reason:       string;         // One sentence shown in UI
  flag?: 'zinc_rich' | 'cold_ok' | 'warm_only' | 'soft_texture';
}

function scoreIngredient(
  ingredientName: string,
  ingredientMolecules: Molecule[],
  drug: DrugProfile
): IngredientScore {

  // Separate molecule counts by flavor type
  const acid   = ingredientMolecules.filter(m => m.flavor_profile.includes('acidic')).length;
  const sweet  = ingredientMolecules.filter(m => m.flavor_profile.includes('sweet')).length;
  const bitter = ingredientMolecules.filter(m => m.flavor_profile.includes('bitter')).length;
  const umami  = ingredientMolecules.filter(m => m.flavor_profile.includes('umami')).length;

  // Weight factors derived from drug damage profile
  const metallic_weight = drug.metallic_intensity * 2.0;   // acid molecules earn more when metallic is high
  const bitter_penalty  = drug.bitter_phantom * 3.0;        // bitter molecules hurt more when bitter phantom is high
  const sweet_weight    = drug.sweet_threshold_raised ? 2.0 : 1.0;
  const umami_weight    = 1.5;                               // umami pathway least damaged — always valuable

  const zinc_bonus = ZINC_RICH_INGREDIENTS.includes(ingredientName.toLowerCase()) ? 5 : 0;

  const score =
    (acid   * metallic_weight) +
    (sweet  * sweet_weight) +
    (umami  * umami_weight) -
    (bitter * bitter_penalty) +
    zinc_bonus;

  // Hard exclude: red meat when metallic_intensity ≥ 2
  const isRedMeat = RED_MEAT_INGREDIENTS.includes(ingredientName.toLowerCase());
  if (isRedMeat && drug.metallic_intensity >= 2) {
    return {
      name: ingredientName, safety_score: -999,
      acid_count: acid, sweet_count: sweet, bitter_count: bitter, umami_count: umami,
      include: false,
      reason: `Heme iron amplifies metallic taste. Excluded for ${drug.display_name}.`
    };
  }

  const include = score > 0;
  const reason = buildReason(ingredientName, acid, sweet, bitter, umami, score, drug);

  return { name: ingredientName, safety_score: score, acid_count: acid,
           sweet_count: sweet, bitter_count: bitter, umami_count: umami, include, reason };
}

function buildReason(name: string, acid: number, sweet: number, bitter: number,
                     umami: number, score: number, drug: DrugProfile): string {
  if (acid > 4)   return `${acid} acidic molecules counteract metallic phantom from ${drug.display_name}.`;
  if (umami > 3)  return `${umami} umami molecules stimulate the least-damaged taste pathway.`;
  if (sweet > 4 && drug.sweet_threshold_raised)
                  return `${sweet} sweet molecules compensate for raised sweet threshold.`;
  if (bitter > 3) return `${bitter} bitter molecules may amplify bitter phantom. Use sparingly.`;
  return score > 5 ? `Favorable molecular profile for current symptom pattern.` : `Neutral profile.`;
}
```

### 4.3 Recipe Scoring

```typescript
interface ScoredRecipe {
  id: string;
  title: string;
  cuisine: string;
  prep_time: number;
  ingredients: string[];
  taste_safe_score: number;     // 0–100 normalized
  score_breakdown: string;
  nutrition?: NutritionProfile;
}

function scoreRecipe(recipe: RawRecipe, ingredientScores: Map<string, IngredientScore>): ScoredRecipe {
  const scores = recipe.ingredients
    .map(ing => ingredientScores.get(ing.toLowerCase())?.safety_score ?? 0);

  const raw = scores.reduce((sum, s) => sum + s, 0);
  const hasHardExclusion = scores.some(s => s === -999);

  const taste_safe_score = hasHardExclusion
    ? 0
    : Math.min(100, Math.max(0, Math.round((raw / (scores.length * 10)) * 100)));

  return {
    ...recipe,
    taste_safe_score,
    score_breakdown: `Score based on ${scores.length} ingredients' flavor molecule profiles vs. ${/* drug name */ ''} damage pattern.`,
  };
}
```

### 4.4 Full Pipeline

```typescript
async function getRecommendations(drugId: string): Promise<{
  ingredientScores: IngredientScore[];
  recipes: ScoredRecipe[];
}> {
  const drug = DRUG_PROFILES[drugId];

  // Step 1: Fetch molecule index (parallel)
  const moleculeIndex = await buildMoleculeIndex();

  // Step 2: Score our seed ingredient list
  const candidateIngredients = [...ACID_MASKERS, ...UMAMI_RICH, ...ZINC_RICH, ...MILD_FLAVOR];

  // Step 3: For each candidate, get its molecules from FlavorDB
  const ingredientMolecules = await Promise.all(
    candidateIngredients.map(name =>
      FlavorDB.getIngredientMolecules(name).catch(() => [] as Molecule[])
    )
  );

  const ingredientScores: IngredientScore[] = candidateIngredients.map((name, i) =>
    scoreIngredient(name, ingredientMolecules[i], drug)
  );

  // Step 4: Take top 10 included ingredients
  const topIngredients = ingredientScores
    .filter(s => s.include)
    .sort((a, b) => b.safety_score - a.safety_score)
    .slice(0, 10)
    .map(s => s.name);

  // Step 5: Query RecipeDB using top ingredients
  const rawRecipes = await Promise.all(
    topIngredients.slice(0, 5).map(ing =>
      RecipeDB.searchByTitle(ing).catch(() => [])
    )
  );
  const flatRecipes: RawRecipe[] = rawRecipes.flat();
  const uniqueRecipes = deduplicateById(flatRecipes);

  // Step 6: Score each recipe
  const scoreMap = new Map(ingredientScores.map(s => [s.name.toLowerCase(), s]));
  const scoredRecipes = uniqueRecipes
    .map(r => scoreRecipe(r, scoreMap))
    .sort((a, b) => b.taste_safe_score - a.taste_safe_score)
    .slice(0, 10);

  return { ingredientScores, recipes: scoredRecipes };
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
| Radar chart | Recharts `RadarChart` | Taste damage visualization. 5 axes. |
| State | React Context + useReducer | No Redux. Just app state: drug + results. |
| Caching | Next.js fetch revalidation | `next: { revalidate: 3600 }` on upstream calls |
| Deploy | Vercel | One push. Free. HTTPS for API calls. |

## File Structure

```
chemotaste/
├── app/
│   ├── page.tsx                    # Drug selector screen
│   ├── results/
│   │   └── page.tsx                # Results screen (radar + ingredients + recipes)
│   ├── api/
│   │   └── proxy/
│   │       └── route.ts            # CORS proxy (see Section 3.2)
│   ├── layout.tsx
│   └── globals.css
│
├── lib/
│   ├── drugProfiles.ts             # Drug profile data (Section 2.1)
│   ├── algorithm.ts                # scoreIngredient, scoreRecipe, getRecommendations
│   ├── flavordbClient.ts           # FlavorDB API wrappers (Section 3.3)
│   ├── recipedbClient.ts           # RecipeDB API wrappers (Section 3.3)
│   ├── seedData.ts                 # ACID_MASKERS, UMAMI_RICH, etc. + cache fallback
│   └── types.ts                    # All shared interfaces
│
├── components/
│   ├── DrugSelector.tsx            # Step 1: pick drug(s)
│   ├── TasteDamageRadar.tsx        # Step 2: radar chart
│   ├── IngredientFilterPanel.tsx   # Step 3: included / excluded with reasons
│   ├── RecipeGrid.tsx              # Step 4: recipe cards
│   ├── RecipeCard.tsx              # Single recipe with TASTE-SAFE SCORE gauge
│   ├── MoleculeDetail.tsx          # Expandable: "Why this ingredient?"
│   └── LoadingSkeleton.tsx         # While API fetches
│
├── data/
│   └── cache/
│       ├── molecules_acidic.json   # Pre-fetched fallback data
│       ├── molecules_sweet.json
│       ├── molecules_bitter.json
│       └── molecules_umami.json
│
└── .env.local                      # FOODOSCOPE_API_KEY=...
```

## Component Breakdown

### `DrugSelector.tsx`
- List of 6 drug cards with drug class badge (Platinum / Antimetabolite / Taxane)
- Multi-select (combination regimens like FOLFOX = oxaliplatin + 5-FU)
- "Unknown / General chemo" option → use merged default profile
- "Find Safe Recipes →" button

### `TasteDamageRadar.tsx`
- Recharts `RadarChart` with 5 axes: Sweet · Bitter · Metallic · Umami · Sour
- Two series: "Healthy baseline" (all 1.0) + "Your drug profile" (computed from DrugProfile)
- Hover tooltip: "Sweet perception is reduced by ~45% with Cisplatin. You need intensely sweet foods."
- Animate on mount

```typescript
const radarData = [
  { axis: 'Sweet',    healthy: 1.0, current: drug.sweet_threshold_raised ? 0.45 : 0.9  },
  { axis: 'Bitter',   healthy: 1.0, current: drug.bitter_phantom > 0 ? 1.4 : 1.0       },
  { axis: 'Metallic', healthy: 0.0, current: drug.metallic_intensity / 3                },
  { axis: 'Umami',    healthy: 1.0, current: 0.9                                         },
  { axis: 'Sour',     healthy: 1.0, current: 1.0                                         },
];
```

### `IngredientFilterPanel.tsx`
- Two columns: Included (green) / Excluded (red)
- Each ingredient shows:
  - Molecule count badges: `[14 acid]` `[3 bitter]`
  - One-line reason (from `scoreIngredient().reason`)
  - SAFETY SCORE number
- Sort by safety score descending

### `RecipeCard.tsx`
- Recipe title, cuisine badge, prep time
- Ingredient list (highlight "safe" ingredients green)
- TASTE-SAFE SCORE: circular gauge 0–100
  - 80–100: green ("Highly recommended")
  - 50–79: yellow ("Good choice")
  - below 50: grey ("May be tolerable")
- Expandable "Why this score?" section showing molecule breakdown

## Hour-by-Hour Build Plan

```
[H 0–1]   SETUP
          npx create-next-app@14 chemotaste --typescript --tailwind --app
          Copy drugProfiles.json, seedData.ts from this doc
          Push to GitHub. Deploy to Vercel. Confirm live URL. ← do this first

[H 1–3]   DATA LAYER
          Implement types.ts, drugProfiles.ts, seedData.ts
          Implement algorithm.ts (scoreIngredient, scoreRecipe)
          Unit-test scoring with inline test data (no API needed yet)
          Goal: algorithm correct before touching APIs

[H 3–6]   API LAYER
          Implement proxy/route.ts
          Implement flavordbClient.ts + recipedbClient.ts
          Test each endpoint with console.log — log raw response shapes
          Implement cache fallback (load from /data/cache/ if API throws)
          ⚠ Spend max 60 min on API issues before switching to cached fallback

[H 6–9]   PIPELINE INTEGRATION
          Implement getRecommendations() in algorithm.ts
          Wire drug selection → molecule fetch → ingredient scores → recipe search
          Log full pipeline output for cisplatin. Verify scores make sense.

[H 9–14]  UI — Core Components
          DrugSelector.tsx (simple list, no design polish yet)
          TasteDamageRadar.tsx (install recharts — pinned version)
          IngredientFilterPanel.tsx
          RecipeCard.tsx

[H 14–18] UI — Integration
          Wire pages: /page.tsx → /results/page.tsx
          Pass drug selection via query param or context
          Add loading skeletons for API wait (~3–4s)
          Add error boundary / fallback UI
          Test full flow: select drug → see results

[H 18–21] POLISH & EDGE CASES
          Multi-drug combination support (merge profiles: take max of each field)
          "Unknown drug" default profile
          Mobile responsive (Tailwind flex-wrap)
          Empty recipe list handling (no results message + fallback suggestions)

[H 21–23] DEMO PREP
          Run through demo flow 5x
          Cache responses for cisplatin + oxaliplatin (the two demo drugs)
          Add ?demo=true query flag that skips live API and uses cached data
             → ensures demo never hangs mid-presentation

[H 23–24] BUFFER
          Fix one critical bug if exists
          Final Vercel deploy
          Confirm live URL works on mobile
```

## Drug Combination Logic (Multi-Drug Regimens)

Common regimens: FOLFOX (oxaliplatin + 5-FU + leucovorin), TC (paclitaxel + carboplatin).

Merge profiles by taking the union of constraints:
```typescript
function mergeDrugProfiles(profiles: DrugProfile[]): DrugProfile {
  return {
    metallic_intensity: Math.max(...profiles.map(p => p.metallic_intensity)) as 0|1|2|3,
    bitter_phantom:     Math.max(...profiles.map(p => p.bitter_phantom))     as 0|1|2|3,
    sweet_threshold_raised: profiles.some(p => p.sweet_threshold_raised),
    cold_preference:    mergeCouldPreferences(profiles),
    nausea_risk:        Math.max(...profiles.map(p => p.nausea_risk))        as 0|1|2|3,
    zinc_depletion:     profiles.some(p => p.zinc_depletion),
    mucositis_risk:     Math.max(...profiles.map(p => p.mucositis_risk))     as 0|1|2|3,
    avoid_categories:   [...new Set(profiles.flatMap(p => p.avoid_categories))],
    boost_categories:   [...new Set(profiles.flatMap(p => p.boost_categories))],
  };
}

// Cold preference: if any drug says avoid cold (oxaliplatin), that wins
function mergeCouldPreferences(profiles: DrugProfile[]): boolean | null {
  if (profiles.some(p => p.cold_preference === false)) return false;  // avoid cold wins
  if (profiles.some(p => p.cold_preference === true))  return true;
  return null;
}
```

## Minimum Viable Build (Must have for demo)

- [ ] Drug selector with at least cisplatin + oxaliplatin working
- [ ] At least one live FlavorDB API call (molecules by flavor) — not fully mocked
- [ ] At least one live RecipeDB call — not fully mocked
- [ ] SAFETY_SCORE computed and visible per ingredient
- [ ] At least 5 recipes rendered with TASTE-SAFE SCORE
- [ ] Ingredient include/exclude with one-line reason visible
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
  cycle_length    INT DEFAULT 21,       -- days
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
  recipe_id   TEXT NOT NULL,            -- RecipeDB ID
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  could_taste BOOLEAN,                  -- did they actually perceive flavor?
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

Phase 2 feature. The algorithm in Phase 1 uses only drug defaults.
Phase 2 personalizes using the patient's actual reported symptoms.

### Logic

```typescript
// Every morning: patient rates metallic (0–10), bitter (0–10), sweet (0–10), etc.
// These override the drug profile defaults for that day's recommendations

function buildAdaptiveProfile(
  drugProfile: DrugProfile,
  latestSymptoms: SymptomLog | null
): EffectiveProfile {
  if (!latestSymptoms) return drugProfile;   // fall back to defaults

  // Normalize 0–10 to 0–3 scale matching drug profile
  const s = latestSymptoms;
  return {
    ...drugProfile,
    metallic_intensity: normalize(s.metallic_score) as 0|1|2|3,
    bitter_phantom:     normalize(s.bitter_score)   as 0|1|2|3,
    sweet_threshold_raised: s.sweet_score < 5,   // sweet perception impaired if score < 5
    nausea_risk:        normalize(s.nausea_score) as 0|1|2|3,
    mucositis_risk:     normalize(s.mouth_sore_score) as 0|1|2|3,
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

**Output:** Adjusted `metallic_weight`, `bitter_penalty`, `sweet_weight`, `umami_weight` for SAFETY_SCORE formula.

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

Phase 2 uses `days_since_last_infusion` (stored in treatment_profiles) to
automatically adjust weight multipliers without requiring the patient to log symptoms:

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

2. Home
   - Today's cycle day indicator (e.g., "Day 4 — Peak symptom phase")
   - Quick symptom check-in (5 sliders, takes 30s)
   - "Today's Recommendations" shortcut

3. Recommendations
   - Taste damage radar (same as web)
   - Ingredient filter panel
   - Recipe cards with TASTE-SAFE SCORE

4. Recipe Detail
   - Full ingredients + instructions
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
| Molecule index (all 4 flavor types) | 24h | Changes rarely. Pre-warm daily. |
| Ingredient molecule list (per ingredient) | 6h | Moderate freshness needed |
| Recipe search results | 2h | More variable |
| Taste threshold properties | 72h | Very stable |

Pre-warm on app startup or via daily cron job:
```typescript
async function warmMoleculeCache() {
  await Promise.all(['acidic', 'sweet', 'bitter', 'umami'].map(async flavor => {
    const key = `molecules:${flavor}`;
    const cached = await redis.get(key);
    if (!cached) {
      const data = await FlavorDB.getMoleculesByFlavor(flavor);
      await redis.setex(key, 86400, JSON.stringify(data));
    }
  }));
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
| CoSy Lab API outage/rate limiting | HIGH | Pre-cached molecule data. App degrades gracefully to cached recommendations. |
| API response shape changes | MEDIUM | Strict TypeScript types + runtime validation with Zod. Tests fail fast on shape change. |
| Drug profile scientific accuracy disputed | HIGH | Every drug profile cites published source. "Not medical advice" banner on every recommendation screen. Consult one oncology dietitian before Phase 2 launch. |
| FlavorDB molecule coverage gaps | MEDIUM | Some ingredients have no molecule data in FlavorDB. Fallback: use category seed list (Section 2.2) when FlavorDB returns empty. |
| Patients replacing medical care with app | CRITICAL | Hard guardrails: app never diagnoses, never contraindicates. "Discuss with your oncologist before changing diet" on every result screen. App disabled features if user reports severe symptoms. |
| CORS issues killing hack day build | HIGH | Solve proxy in H3–H6. If proxy fails: switch fully to cached data and explain live API in demo verbally. |
| RecipeDB returns wrong ingredients | MEDIUM | Manually validate top 10 recipe results for each demo drug before hack day. Pre-cache working results. |

---

## Pre-Hackathon Checklist (Complete Before Nov 14)

- [ ] Register foodoscope.com → confirm API key received
- [ ] Test FlavorDB call from terminal with key → log response shape
- [ ] Test RecipeDB call from terminal → log response shape
- [ ] Pre-cache all 4 molecule flavor types to `/data/cache/`
- [ ] Manually export ingredient data for 40 seed ingredients from FlavorDB website
- [ ] `npx create-next-app` → push to GitHub → deploy to Vercel → confirm live
- [ ] Install recharts: `npm install recharts` — confirm it renders a basic chart
- [ ] Assign roles: API layer / UI / algorithm / integration
- [ ] Read and agree on TypeScript interfaces in `types.ts` before splitting work
