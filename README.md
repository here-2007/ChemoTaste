# ChemoTaste 🍲🔬

> **Evidence-Grounded Computational Gastronomy for Chemotherapy Supportive Care**  
> *Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab (Path: RecipeDB + FlavorDB)*

---

## Overview

Chemotherapy damages rapidly dividing taste receptor progenitor cells, alters salivary composition, and induces acute olfactory parosmia. Up to **80% of oncology patients** report persistent metallic phantoms, bitter hyperesthesia, and severe food aversions. Left unmanaged, this sensory breakdown accelerates cancer cachexia and malnutrition—clinically responsible for **20% to 30% of all cancer-related mortality** (ESPEN Guidelines).

**ChemoTaste** leverages the CoSy Lab computational gastronomy ecosystem (**FlavorDB** and **RecipeDB**) alongside an oncology supportive care safety layer to compute personalized, symptom-tolerable, and perception-restoring meals.

```
┌────────────────────────────────────────────────────────┐
│               CHEMOTHERAPY DRUG REGIMEN                │
│       Cisplatin · Oxaliplatin · 5-FU · Paclitaxel      │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
   ┌───────────────────────┐ ┌───────────────────────┐
   │    GUSTATORY INJURY   │ │  SALIVARY & OLFACTORY │
   │  • Metallic phantom   │ │  • Lipid peroxidation │
   │  • Sweet threshold ↑  │ │  • Nausea volatiles   │
   │  • Umami preserved    │ │  • Xerostomia (dry)   │
   └───────────┬───────────┘ └───────────┬───────────┘
               │                         │
               ▼                         ▼
   ┌───────────────────────┐ ┌───────────────────────┐
   │  CLINICAL ONCOLOGY KB │ │  FLAVORDB AROMA VOCs  │
   │ Non-volatile tastant  │ │ Volatile compound &   │
   │ kinetics & chelation  │ │ aldehyde suppression  │
   └───────────┬───────────┘ └───────────┬───────────┘
               │                         │
               └────────────┬────────────┘
                            ▼
             ┌─────────────────────────────┐
             │    CLINICAL SAFETY GATES    │
             │   P0: Infection & CYP3A4    │
             │   P1: Mucositis & Cold-Pain │
             │   P2: Cachexia & Moisture   │
             │   P3: Taste Boosts          │
             └──────────────┬──────────────┘
                            ▼
             ┌─────────────────────────────┐
             │       RECIPEDB ENGINE       │
             │  Taste-Safe Score (0–100)   │
             │  Perceptual Radar Shift     │
             │  Moisture & Protein Guard   │
             │  Indian Therapeutic Staples │
             │  Non-Metallic Cutlery Guide │
             └─────────────────────────────┘
```

---

## Key Innovations

1. **Dual-Channel Sensory Architecture:**
   * **FlavorDB Engine:** Models volatile organic compounds (VOCs) and aroma descriptors (Fenaroli / Flavornet) to suppress nausea-provoking volatile aldehydes and ketones.
   * **Clinical Oncology Engine:** Modulates non-volatile tongue tastants (citric/malic acid chelating salivary metal ions, umami stimulating intact T1R1/T1R3 pathways, zinc supplementation).
2. **Targeting Salivary Lipid Peroxidation:**
   * Addresses the root biological cause of metallic dysgeusia: reactive oxygen species in saliva oxidizing oral mucosal lipids into volatile aldehydes (1-octen-3-one, hexanal) reaching the olfactory bulb retronasally.
3. **Anabolic Guardrails (Cachexia Prevention):**
   * Enforces a protein floor ($\ge 12\text{g/serving}$) and caloric density standards using RecipeDB nutrition data to protect against cancer cachexia and muscle wasting (ESPEN Guidelines).
4. **Moisture & Texture Physics (Xerostomia Protection):**
   * Incorporates a Moisture Index ($M \in [0, 1]$) ensuring patients with dry mouth or mucositis receive lubricated, swallowable foods (khichdi, broths, gravies, purées).
5. **Dynamic 3-Phase Treatment Cycle:**
   * Adapts meal recommendations across the 21-day cycle: Acute Infusion (Days 1–3), Nadir & Mucositis (Days 4–8), and the Anabolic Recovery Window (Days 9–21).
6. **Native Indian Computational Gastronomy:**
   * Grounded in Prof. Ganesh Bagler's Indian cuisine computing, featuring therapeutic staples: Moong dal khichdi, curd rice, fresh chhena, and lauki stew.
7. **Physical Chemesthesis & Cutlery Advisory:**
   * Recommends non-metallic cutlery (bamboo, ceramic) to stop electrochemical amplification of metallic phantoms, plus pre-meal salivary buffering rinses.
8. **Clinical Safety Hierarchy (Block Beats Boost):**
   * **P0:** Universal blocks on raw/undercooked foods (immunosuppression), CYP3A4 inhibitors (grapefruit, Seville orange, starfruit), and alcohol.
   * **P1:** Regimen clinical overrides:
     * *Oral Mucositis:* Grade 2+ mucositis hard-blocks all acidic and spicy foods, strictly superseding metallic taste masking.
     * *Oxaliplatin Cold Allodynia:* Hard-blocks all chilled, iced, smoothie, or cold-serve dishes to prevent acute pharyngolaryngeal dysesthesia.
   * **P2:** Cachexia protein guardrail, moisture index penalty, 50% red meat penalty, 30% high-aroma penalty.
   * **P3:** Active taste modulation boosts.

---

## Repository Structure

```
ChemoTaste/
├── app/
│   ├── page.tsx                     # Drug, cycle phase & symptom selector
│   ├── results/page.tsx             # Radar chart, ingredient filter, and recipe cards
│   ├── api/proxy/route.ts           # Hardened CORS proxy with allow-lists
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── SensoryShiftRadar.tsx        # 3-overlay Recharts radar (baseline / shifted / masked)
│   ├── IngredientFilterPanel.tsx    # Included & Blocked ingredients with clinical reasons
│   ├── RecipeCard.tsx               # Taste-Safe Score gauge, cutlery & rinse advisories
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
│   ├── curated_recipes.json         # 50 validated recipes (including Indian staples)
│   └── precompiled/
│       └── ingredient_profiles.json # Build-time FlavorDB molecular profiles
├── tests/
│   └── golden_safety.test.ts        # Automated clinical safety test suite (Vitest)
├── docs/
│   └── api-contract.md              # Verified API endpoints, auth, and schemas
├── AGENT.md                         # Autonomous agent rules and operational personas
├── MEMORY.md                        # Architectural Decision Records (ADR-001 to ADR-014)
├── PLAN.md                          # Hackathon operational roadmap & 24h schedule
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
* **Indian Computational Gastronomy:** Jain A, et al. *Spices form the basis of food pairing in Indian cuisine*. Sci Rep. 2015;5:9394.
* **Cancer Clinical Nutrition:** Arends J, et al. *ESPEN practical guideline: Clinical Nutrition in cancer*. Clin Nutr. 2021;40(5):2898-2913.
* **Chemotherapy Dysgeusia & Lipid Peroxidation:** Amézaga J, et al. *Mechanisms of taste and smell alterations in cancer patients*. Supportive Care Cancer. 2018;26(5):1377-1386.
* **Oxaliplatin Cold Allodynia:** Argyriou AA, et al. *Oxaliplatin-induced peripheral neurotoxicity: its present and future*. Crit Rev Oncol Hematol. 2013;88(3):619-635.
* **Oral Mucositis Guidelines:** Elad S, et al. *MASCC/ISOO clinical practice guidelines for the management of mucositis secondary to cancer therapy*. Cancer. 2020;126(19):4423-4431.

---

## License

MIT License. Developed for the Foodoscope Fork It Challenge 2026.
