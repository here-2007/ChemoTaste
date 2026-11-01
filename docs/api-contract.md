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
# Test FlavorDB Taste Threshold Endpoint
curl -X GET "https://cosylab.iiitd.edu.in/flavordb2/api/properties/taste-threshold" \
     -H "${FOODOSCOPE_AUTH_HEADER}: ${FOODOSCOPE_AUTH_PREFIX}${FOODOSCOPE_API_KEY}" \
     -H "Accept: application/json"
```

---

## 2. Endpoint Matrix: Verified vs. Unverified

| Status | Endpoint | Target DB | Purpose in ChemoTaste | Verified Param Casing |
|---|---|---|---|---|
| **Verified** | `/properties/taste-threshold` | FlavorDB | Loads taste threshold ($\mu\text{mol/mL}$) for potency weighting | N/A |
| **Verified** | `/properties/by-description` | FlavorDB | Aroma descriptor filter (identifies nausea-risk volatiles) | `description` |
| **Verified** | `/molecules_data/filter-by-type` | FlavorDB | Chemical compound classes (esters, aldehydes, terpenes) | `type` |
| **Verified** | `/molecules_data/by-commonName` | FlavorDB | Chemical details for "Science Behind Every Bite" modal | `commonName` (fallback: `common_name`) |
| **Verified** | `/entities/by-entity-alias-readable` | FlavorDB | Ingredient entity resolution | `name` |
| **Verified** | `/recipe-bytitle/recipeByTitle` | RecipeDB | Dish name search (e.g. "miso soup", "lentil soup") | `title` |
| **Verified** | `/recipes_cuisine/cuisine/{region}` | RecipeDB | Regional cuisine search | `region` (path param) |
| **Verified** | `/recipes/ingredient` | RecipeDB | Searches recipes containing a specific hero ingredient | `ingredient` |
| **Unverified** | `/molecules_data/by-flavorProfile` | FlavorDB | **Deprecated.** Do not use in core pipeline. | `flavor` |
| **Unverified** | `/food/by-alias` | FlavorDB | Entity-to-molecules fallback | `alias` |

---

## 3. Rate-Limiting & Concurrency Policies

* **Academic Server Limits:** CoSy Lab servers typically enforce a soft rate-limit of $\approx 50\text{ req/min}$ on hackathon/developer keys.
* **Client Concurrency Cap:** All runtime client requests must pass through `p-limit(3)` in `lib/apiClient.ts` to restrict concurrent in-flight requests to 3.
* **Next.js Proxy Timeout:** `app/api/proxy/route.ts` wraps all upstream calls with `AbortSignal.timeout(8000)` (8 seconds) to prevent serverless function hangs.
* **Static Fallback:** The top 80 ingredients and 50 curated recipes are pre-compiled into static JSON assets. Live API queries are reserved solely for user-initiated searches or expanding recipe sets.

---

## 4. Sample Upstream Response Contracts

### 4.1 FlavorDB `properties/taste-threshold`
```json
[
  {
    "id": 1049,
    "common_name": "citric acid",
    "taste_threshold": 2.5,
    "threshold_unit": "umol/ml",
    "flavor_profile": ["acidic", "sour", "citrus"]
  }
]
```

### 4.2 RecipeDB `recipe-bytitle/recipeByTitle`
```json
[
  {
    "id": "recipe_10421",
    "title": "Miso Vegetable Broth",
    "cuisine": "Japanese",
    "prep_time": 20,
    "ingredients": [
      "2 tbsp white miso paste",
      "4 cups vegetable broth",
      "1 cup sliced shiitake mushrooms",
      "100g silken tofu, cubed",
      "1 tsp sesame oil"
    ],
    "processes": ["simmer", "stir", "serve warm"]
  }
]
```
