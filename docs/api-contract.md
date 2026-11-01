# Foodoscope API Discovery Contract (`docs/api-contract.md`)
**Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab**
**Path: RecipeDB + FlavorDB**

---

## 1. Authentication & Configuration

The Foodoscope API gateway enforces token-based authentication.

### Environment Variables (`.env.local`)
```bash
FOODOSCOPE_API_KEY="your_api_key_here"
FOODOSCOPE_AUTH_HEADER="Authorization"    # Set to 'Authorization' or custom header required by organizers
FOODOSCOPE_AUTH_PREFIX="Bearer "          # Set to 'Bearer ' or '' depending on Day-0 verification
```

### Verification Command (Run on Day 0)
```bash
# Test FlavorDB Taste Threshold Endpoint (values param required to prevent HTTP 400)
curl -X GET "https://cosylab.iiitd.edu.in/flavordb2/api/properties/taste-threshold?values=sweet" \
     -H "${FOODOSCOPE_AUTH_HEADER}: ${FOODOSCOPE_AUTH_PREFIX}${FOODOSCOPE_API_KEY}" \
     -H "Accept: application/json"
```

---

## 2. Endpoint Matrix: Verified vs. Unverified

| Status | Endpoint | Target DB | Purpose in ChemoTaste | Verified Param Casing & Requirements |
|---|---|---|---|---|
| **Verified** | `/properties/taste-threshold` | FlavorDB | Loads taste threshold ($\mu\text{mol/mL}$) for potency weighting | `values` (required non-empty string, e.g. `values=sweet`; omitting causes HTTP 400) |
| **Verified** | `/properties/by-description` | FlavorDB | Aroma descriptor filter (identifies nausea-risk volatiles) | `desc` (e.g. `desc=sweet`) |
| **Verified** | `/molecules_data/filter-by-type` | FlavorDB | Chemical compound classes (esters, aldehydes, terpenes) | `type` (e.g. `type=ester`) |
| **Verified** | `/molecules_data/by-commonName` | FlavorDB | Chemical details for "Science Behind Every Bite" modal | `common_name` (e.g. `common_name=vanillin`) |
| **Verified** | `/entities/by-entity-alias-readable` | FlavorDB | Ingredient entity resolution & category mapping | `entity_alias_readable` (e.g. `entity_alias_readable=Tomato`) |
| **Verified** | `/recipe-bytitle/recipeByTitle` | RecipeDB | Dish name search (e.g. "miso soup", "lentil soup") | `title` |
| **Verified** | `/recipes_cuisine/cuisine/{region}` | RecipeDB | Regional cuisine search | `region` (path param) |
| **Verified** | `/recipebyingredient/by-ingredients-categories-title` | RecipeDB | Hero ingredient recipe search | `includeIngredients` (e.g. `includeIngredients=ginger`) |
| **Verified** | `/search-recipe/{id}` | RecipeDB | Granular recipe search by ID with full ingredient phrases | `id` (path param, e.g. `search-recipe/2642`) |
| **Unverified** | `/molecules_data/by-flavorProfile` | FlavorDB | **Deprecated.** Do not use in core pipeline. | `flavor` |
| **Unverified** | `/food/by-alias` | FlavorDB | Entity-to-molecules fallback | `alias` |

---

## 3. Rate-Limiting & Concurrency Policies

* **Academic Server Limits:** CoSy Lab servers typically enforce a soft rate-limit of $\approx 50\text{ req/min}$ on hackathon/developer keys.
* **Client Concurrency Cap:** All runtime client requests must pass through `p-limit(3)` in `lib/apiClient.ts` to restrict concurrent in-flight requests to 3.
* **Next.js Proxy Timeout:** `app/api/proxy/route.ts` wraps all upstream calls with `AbortSignal.timeout(8000)` (8 seconds) to prevent serverless function hangs.
* **Static Fallback:** The top 80 ingredients and 50 curated recipes are pre-compiled into static JSON assets. Live API queries are reserved solely for user-initiated searches or expanding recipe sets.
* **In-Memory Caching:** Dynamically adapted profiles for uncataloged ingredients are cached in `ingredientProfilesMap` to ensure repeat lookups maintain $O(1)$ precompiled performance.

---

## 4. Sample Upstream Response Contracts & Normalization

### 4.1 FlavorDB `properties/taste-threshold` Upstream Response
Foodoscope returns `Taste_threshold_values` as a string and `flavor_profile` as an `@`-delimited string:

```json
{
  "content": [
    {
      "id": 1049,
      "common_name": "citric acid",
      "Taste_threshold_values": "2.5",
      "threshold_unit": "umol/ml",
      "flavor_profile": "acidic@sour@citrus"
    }
  ]
}
```

#### Normalization Pipeline (`lib/flavordbClient.ts` & `lib/dataService.ts`)
- **`flavor_profile` Normalization:** Split on `'@'`, trimmed, and normalized to `string[]` (`["acidic", "sour", "citrus"]`).
- **`Taste_threshold_values` Alignment:** Kept as a string while parsing a numeric `taste_threshold: 2.5` for mathematical calculations.
- **Laplace Smoothing ($\epsilon=5$):** `adaptFlavorMoleculesToMolecularProfile` converts molecule descriptors into normalized fractions:
  $$f_k = \frac{N_k}{N_{\text{total}} + 5}$$
  Mapping compounds into five primary sensory vectors (`sour`, `sweet`, `umami`, `bitter`, `nausea_aroma`).
- **Missing Param Guard:** `flavordbClient.getTasteThresholds` defaults `values` to `'sweet'` if omitted, preventing HTTP 400 Bad Request.

### 4.2 FlavorDB `entities/by-entity-alias-readable`
```json
{
  "content": [
    {
      "entity_id": 364,
      "entity_alias_readable": "Tomato",
      "category": "vegetable-fruit"
    }
  ]
}
```

### 4.3 RecipeDB `recipe-bytitle/recipeByTitle`
```json
{
  "data": [
    {
      "Recipe_id": "10421",
      "Recipe_title": "Miso Vegetable Broth",
      "Region": "Japanese",
      "Calories": "320.0",
      "Protein (g)": "14.0",
      "Processes": "simmer||stir||serve warm"
    }
  ]
}
```

### 4.4 RecipeDB `search-recipe/{id}`
```json
{
  "data": {
    "recipe": {
      "Recipe_id": "2642",
      "Recipe_title": "African Curry",
      "Region": "Rest Africa",
      "Calories": "600.0",
      "Protein (g)": "18.0"
    },
    "ingredients": [
      {
        "ingredient_Phrase": "2 cloves garlic , peeled and chopped",
        "ingredient": "garlic"
      },
      {
        "ingredient_Phrase": "1 can whole peeled tomatoes",
        "ingredient": "tomato"
      }
    ]
  }
}
```
ChemoTaste's `recipedbClient.getRecipeById` extracts the full phrases from `data.ingredients` for safety scoring and molecular inspection.

### 4.5 FlavorDB `properties/by-description`
Query parameter: `desc` (e.g. `desc=sweet`)
Used to filter aroma volatiles associated with specific sensory notes (e.g. sulfurous or nausea-inducing odors).
```json
{
  "content": [
    {
      "id": 1183,
      "common_name": "vanillin",
      "Taste_threshold_values": "1.2",
      "flavor_profile": "sweet@vanilla@caramel"
    }
  ]
}
```

### 4.6 FlavorDB `molecules_data/by-commonName`
Query parameter: `common_name` (e.g. `common_name=vanillin`)
Used during dynamic ingredient profile resolution to look up specific volatile molecule identifiers and biological roles.
```json
{
  "content": [
    {
      "pubchem_id": 1183,
      "common_name": "vanillin",
      "Taste_threshold_values": "1.2",
      "flavor_profile": "sweet@creamy"
    }
  ]
}
```
ChemoTaste normalizes `flavor_profile` into `string[]`, parses `Taste_threshold_values` into float `taste_threshold`, and maps the compound into receptor agonist categories (`T1R1/T1R3`, `TAS2R`, natural metal chelators, or emetic volatiles).
