# ChemoTaste 🍲🔬

> **Evidence-Grounded Computational Gastronomy for Chemotherapy Supportive Care**  
> *Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab (Path: RecipeDB + FlavorDB)*

---

## Overview

Chemotherapy damages rapidly dividing taste receptor progenitor cells, altering taste thresholds, inducing persistent metallic/bitter phantoms, and causing acute olfactory nausea. This dysgeusia affects up to **80% of oncology patients**, leading to food aversion, rapid weight loss, and treatment intolerance.

**ChemoTaste** leverages the CoSy Lab computational gastronomy ecosystem (**FlavorDB** and **RecipeDB**) alongside a clinical oncology safety layer to compute personalized, symptom-tolerable, and perception-restoring meals.

```
┌────────────────────────────────────────────────────────┐
│               CHEMOTHERAPY DRUG REGIMEN                │
│       Cisplatin · Oxaliplatin · 5-FU · Paclitaxel      │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
   ┌───────────────────────┐ ┌───────────────────────┐
   │    GUSTATORY INJURY   │ │    OLFACTORY NAUSEA   │
   │  • Metallic phantom   │ │  • Volatile parosmia  │
   │  • Sweet threshold ↑  │ │  • Nausea triggers    │
   │  • Umami preserved    │ │  • Mucosal breakdown  │
   └───────────┬───────────┘ └───────────┬───────────┘
               │                         │
               ▼                         ▼
   ┌───────────────────────┐ ┌───────────────────────┐
   │  CLINICAL ONCOLOGY KB │ │  FLAVORDB AROMA VOCs  │
   │ Non-volatile tastant  │ │ Volatile compound &   │
   │ modulation & textures │ │ descriptor filtering  │
   └───────────┬───────────┘ └───────────┬───────────┘
               │                         │
               └────────────┬────────────┘
                            ▼
             ┌─────────────────────────────┐
             │    CLINICAL SAFETY GATES    │
             │   P0: Infection & CYP3A4    │
             │   P1: Mucositis & Cold-Pain │
             │   P2: Soft Penalties        │
             │   P3: Taste Boosts          │
             └──────────────┬──────────────┘
                            ▼
             ┌─────────────────────────────┐
             │       RECIPEDB ENGINE       │
             │  Taste-Safe Score (0–100)   │
             │  Perceptual Radar Shift     │
             │  Smart Substitutions        │
             └─────────────────────────────┘
```

---

## Key Innovations

1. **Dual-Channel Sensory Architecture:**
   * **FlavorDB Engine:** Models volatile organic compounds (VOCs) and aroma descriptors (Fenaroli / Flavornet) to suppress nausea-provoking volatile compounds.
   * **Clinical Oncology Engine:** Modulates non-volatile tongue tastants (citric/malic acid competing with platinum ions, umami stimulating intact T1R1/T1R3 pathways, zinc supplementation).
2. **Clinical Safety Hierarchy (Block Beats Boost):**
   * **P0:** Universal blocks on raw/undercooked foods (immunosuppression), CYP3A4 inhibitors (grapefruit, Seville orange, starfruit), and alcohol.
   * **P1:** Regimen clinical overrides:
     * *Oral Mucositis:* Grade 2+ mucositis hard-blocks all acidic and spicy foods, strictly superseding metallic taste masking.
     * *Oxaliplatin Cold Allodynia:* Hard-blocks all chilled, iced, smoothie, or cold-serve dishes to prevent acute pharyngolaryngeal dysesthesia.
   * **P2:** Soft constraints: 50% red meat penalty (heme iron), 30% high-aroma penalty.
   * **P3:** Active taste modulation boosts.
3. **Mathematically Bounded Scoring:**
   * **Affinity Density:** Laplace-smoothed fractions ($f_k = \frac{N_k}{N_{\text{total}} + 5}$) and percentile ranks resolve chemical database annotation bias.
   * **Bayesian Shrinkage Recipe Denominator:** Unknown ingredients are excluded from the denominator while pulling the score toward neutral ($50$) based on data coverage.
4. **100% Demo Resilience:**
   * Zero runtime $N+1$ calls. Molecular profiles of the top 80 ingredients and 50 curated recipes are pre-compiled locally. Live API calls are strictly on-demand.

---

## Repository Structure

```
ChemoTaste/
├── app/
│   ├── page.tsx                     # Drug & symptom selector with safety previews
│   ├── results/page.tsx             # Radar chart, ingredient filter, and recipe cards
│   ├── api/proxy/route.ts           # Hardened CORS proxy with allow-lists
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── SensoryShiftRadar.tsx        # 3-overlay Recharts radar (baseline / shifted / masked)
│   ├── IngredientFilterPanel.tsx    # Included & Blocked ingredients with clinical reasons
│   ├── RecipeCard.tsx               # Taste-Safe Score circular gauge with coverage breakdown
│   ├── SubstitutionCard.tsx         # Computed molecular deltas for excluded items
│   └── ClinicalWarningBanner.tsx    # Active P0/P1 clinical alerts
├── lib/
│   ├── types.ts                     # Strict TypeScript interfaces
│   ├── safety.ts                    # Priority P0–P3 clinical constraint builder
│   ├── resolveIngredient.ts         # Ingredient normalization & raw-string regex safety
│   ├── algorithm.ts                 # Affinity density & shrinkage recipe scoring
│   ├── apiClient.ts                 # Rate-limited fetch wrapper with p-limit(3)
│   ├── flavordbClient.ts            # FlavorDB API wrapper
│   └── recipedbClient.ts            # RecipeDB API wrapper
├── data/
│   ├── drugProfiles.json            # Master drug profiles (Cisplatin, Oxaliplatin, 5-FU, etc.)
│   ├── ingredient_kb.json           # Curated tastants and food safety tags
│   ├── curated_recipes.json         # 50 validated recipes for offline demo stability
│   └── precompiled/
│       └── ingredient_profiles.json # Build-time FlavorDB molecular profiles
├── tests/
│   └── golden_safety.test.ts        # Automated clinical safety test suite (Vitest)
├── docs/
│   └── api-contract.md              # Verified API endpoints, auth, and schemas
├── AGENT.md                         # Autonomous agent rules and operational personas
├── MEMORY.md                        # Architectural Decision Records (ADRs) and constants
└── IMPLEMENTATION.md                # Unified master implementation specification
```

---

## Quickstart

### 1. Prerequisites
* Node.js 18+
* Foodoscope API Key (registered at [foodoscope.com](https://www.foodoscope.com))

### 2. Installation
```bash
git clone https://github.com/here-2007/ChemoTaste.git
cd ChemoTaste
npm install
```

### 3. Environment Setup
Create `.env.local` in the project root:
```env
FOODOSCOPE_API_KEY="your_api_key_here"
FOODOSCOPE_AUTH_HEADER="Authorization"
FOODOSCOPE_AUTH_PREFIX="Bearer "
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Clinical Safety Tests
```bash
npm run test
```

---

## Primary Scientific Citations

* **FlavorDB:** Garg N, et al. *FlavorDB: a database of flavor molecules*. Nucleic Acids Res. 2018;46(D1):D1210-D1216.
* **RecipeDB:** Batra R, et al. *RecipeDB: a resource for exploring recipes*. Database. 2020;2020:baaa077.
* **Computational Gastronomy:** Bagler G, Singh N. *Computational Gastronomy: A data-driven approach to food*. arXiv:1509.07172.
* **Chemotherapy Dysgeusia:** Cowart BJ. *Taste dysfunction: a review*. PMC2858711.
* **Oxaliplatin Cold Allodynia:** Argyriou AA, et al. *Oxaliplatin-induced peripheral neurotoxicity: its present and future*. Crit Rev Oncol Hematol. 2013;88(3):619-635.
* **Oral Mucositis Guidelines:** Elad S, et al. *MASCC/ISOO clinical practice guidelines for the management of mucositis secondary to cancer therapy*. Cancer. 2020;126(19):4423-4431.

---

## License

MIT License. Developed for the Foodoscope Fork It Challenge 2026.
