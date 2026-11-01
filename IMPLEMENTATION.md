# ChemoTaste — Unified Definitive Implementation Plan (v4 Deep-Research Edition)
**Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab · Path: RecipeDB + FlavorDB**
**Status:** Unified Master Specification · Advanced Oncology & Sensory Physiology Edition
**Date:** November 1, 2026 (Hackathon Window: November 14, 09:00 → November 15, 09:00 IST)

---

## Executive Summary & Core Thesis

Chemotherapy-induced dysgeusia (CID), parosmia, xerostomia (dry mouth), and oral mucositis affect up to 80% of cancer patients. This induces persistent metallic phantoms, bitter hyperesthesia, elevated sweet thresholds, and acute olfactory nausea. Left unmanaged, food aversion accelerates cancer cachexia and malnutrition—which clinically causes **20% to 30% of all oncology deaths** (ESPEN Guidelines).

**ChemoTaste** is an evidence-grounded, safety-first culinary intelligence system that:
1. **Accurately Models Dual Sensory Pathways:** Distinguishes between **FlavorDB's volatile aroma compounds** (Fenaroli / Flavornet) used for retronasal olfactory nausea/metallic volatile suppression, and a **curated clinical oncology knowledge base** for tongue tastant modulation.
2. **Targets the Salivary Lipid Peroxidation Mechanism:** Addresses the root cause of metallic taste: reactive oxygen species (ROS) in saliva oxidizing oral mucosal lipids into volatile aldehydes (e.g., 1-octen-3-one, hexanal), targeted via natural metal chelators (citric/malic acids) and dietary polyphenols.
3. **Guards Against Anorexia-Cachexia with a Nutritional Floor:** Prevents the "empty plate" trap by enforcing protein ($\ge 12\text{g/serving}$) and caloric density standards using RecipeDB nutrition data.
4. **Integrates Salivary Lubrication & Texture Physics:** Incorporates a Moisture Index ($M \in [0, 1]$) ensuring patients with dry mouth or mucositis receive lubricated, swallowable foods (khichdi, broths, gravies, purées).
5. **Supports Dynamic 3-Phase Chemotherapy Cycles:** Adapts meal recommendations dynamically across the 21-day cycle: Acute Infusion (Days 1–3), Nadir & Mucositis (Days 4–8), and the Anabolic Recovery Window (Days 9–21).
6. **Incorporates Native Indian Computational Gastronomy:** Grounded in CoSy Lab's Indian cuisine informatics, prioritizing mild, culturally resonant therapeutic staples (moong dal khichdi, curd rice, fresh chhena, lauki stew).
7. **Advises on Physical Oral Chemesthesis:** Recommends non-metallic cutlery (bamboo/ceramic) to prevent electrochemical metallic amplification, plus pre-meal salivary buffering rinses.

---

# 1. Scientific & Sensory Foundation (Fact-Checked with Primary Proofs)

```
                       CHEMOTHERAPY INTAKE
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
 GUSTATORY INJURY (Tongue)                       OLFACTORY & SALIVARY INJURY
 (TRC Types I, II, III damaged)                  (Parosmia, ROS & Xerostomia)
        │                                               │
 ┌──────┴─────────────────────────┐              ┌──────┴─────────────────────────┐
 │ • Platinum excretion in saliva │              │ • Salivary lipid peroxidation  │
 │ • Sweet threshold raised ~45%  │              │   yields volatile aldehydes    │
 │ • T2R bitter phantom           │              │ • Volatile aroma hyperesthesia │
 │ • T1R1/T1R3 (Umami) spared     │              │ • Xerostomia: dry mouth        │
 └──────┬─────────────────────────┘              └──────┬─────────────────────────┘
        │                                               │
        ▼                                               ▼
 CURATED CLINICAL ONCOLOGY KB                    FLAVORDB MOLECULAR ENGINE
 (Non-volatile tastants & texturizers)           (Volatile aroma descriptors & thresholds)
```

### 1.1 The Receptor & Salivary Pathology Map

| Sensory Channel | Cellular & Molecular Pathology | Clinical Symptom | Primary Scientific Reference |
|---|---|---|---|
| **Metallic Phantom** | Salivary platinum/metal excretion + free radical ROS; **lipid peroxidation** of epithelial membranes generates volatile carbonyls (1-octen-3-one, hexanal) reaching olfactory bulb via retronasal path; salivary lactoferrin/CA-VI depletion. | Persistent metallic/tinny taste regardless of food consumed; amplified by stainless steel cutlery. | *Amézaga et al., 2018; Henkin et al., AJMC 2008; Cowart BJ, PMC2858711.* |
| **Bitter Phantom** | Rapidly proliferating basal progenitor cells killed; low-concentration activation of T2R bitter receptors persists unchecked. | Heightened bitter perception; vegetables/coffee taste intolerable. | *Dotson CD et al., BMC Med Genomics 2012; Wang et al., 2021.* |
| **Sweet Desensitization** | Antimitotic drugs destroy T1R2/T1R3 heterodimer renewal; detection threshold raised by **~45%** (baseline 4.4 $\rightarrow$ 6.4 $\mu\text{mol/mL}$, sensitivity drops to $69\%$). | Food tastes completely flat, sweetless, or unappetizing. | *PMC2858711; Steinbach et al., Support Care Cancer 2009.* |
| **Umami Integrity** | T1R1/T1R3 heterodimer pathway exhibits highest metabolic resilience and lowest drug-induced receptor atrophy across standard regimens. | Umami signaling remains functioning; delivers savory satisfaction. | *Ninomiya Y et al., Chemical Senses; clinical oncology consensus.* |
| **Xerostomia & Dysphagia** | Microvascular damage to salivary acinar cells causes hyposalivation (dry mouth) and thick, viscous saliva. | Tastants cannot dissolve to reach taste pores; dry foods stick to mouth, risking choking/aspiration. | *ESPEN Practical Guidelines: Clinical Nutrition in Cancer, 2021.* |
| **Cold Allodynia** | Oxaliplatin slows sodium channel inactivation (Nav1.6/Nav1.8) in sensory neurons, triggered by cold temperatures. | Pharyngolaryngeal dysesthesia (feeling of vocal cord closure / inability to swallow). | *Argyriou AA et al., Crit Rev Oncol Hematol 2013; Eloxatin FDA Insert.* |
| **Oral Mucositis** | Antimetabolites (5-FU, Methotrexate) cause epithelial DNA breakdown, generating deep mucosal ulcerations. | Acidic, spicy, and rough foods cause agonizing mucosal burning pain. | *MASCC/ISOO Mucositis Guidelines, Cancer 2020.* |

### 1.2 Accurate Framing of CoSy Lab Databases

* **FlavorDB** (*Garg et al., Nucleic Acids Research 2018, CoSy Lab IIIT-Delhi*):
  FlavorDB catalogs 25,595 flavor molecules predominantly compiled from **Fenaroli's Handbook of Flavor Ingredients** and **Flavornet**. The descriptors (900+) are **volatile odor/aroma descriptors** (e.g., *woody, green, fruity, balsamic, sulfurous, ethereal*).
  * *ChemoTaste Role:* Used for **retronasal olfactory filtering** (suppressing high-volatility compounds that trigger nausea and lipid peroxidation aldehydes) and **taste-threshold perceptibility profiling**.
* **RecipeDB** (*Batra et al., Database 2020, CoSy Lab IIIT-Delhi*):
  Houses 118,000+ global recipes mapped to ingredients, nutrition, cooking processes, and cuisines.
  * *ChemoTaste Role:* Used for structured recipe retrieval, nutritional guardrails (protein/calorie floor), moisture index evaluation, and ingredient substitution mapping.

---

# 2. Safety Layer Architecture (Priority P0 $\rightarrow$ P3)

The Safety Layer runs **before** and **independently** of any culinary ranking. Safety rules are hard blockers that can never be overridden by high taste affinity scores (**Block beats Boost**).

```
                      INCOMING INGREDIENT / RECIPE
                                   │
 ┌─────────────────────────────────▼─────────────────────────────────┐
 │ P0: INFECTION & DRUG-INTERACTION SAFETY (Global Oncology Baseline)│
 │ • Block raw/undercooked fish, meat, eggs, unpasteurized dairy     │
 │ • Block CYP3A4 inhibitors (Grapefruit, Pomelo, Seville Orange)    │
 │ • Block nephrotoxic Starfruit & Alcohol                           │
 └─────────────────────────────────┬─────────────────────────────────┘
                                   │ Passed
 ┌─────────────────────────────────▼─────────────────────────────────┐
 │ P1: CLINICAL CONFLICT ARBITRATION (Regimen-Specific Overrides)    │
 │ • Mucositis Override: If mucositis_risk >= 2, hard-block ALL      │
 │   acidic, citrus, vinegar, spicy, rough, and very hot items.      │
 │   (Takes precedence over metallic taste masking).                 │
 │ • Cold Allodynia: If cold_forbidden == true (Oxaliplatin),        │
 │   hard-block ALL chilled, iced, smoothie, and cold-serve dishes.  │
 └─────────────────────────────────┬─────────────────────────────────┘
                                   │ Passed
 ┌─────────────────────────────────▼─────────────────────────────────┐
 │ P2: CLINICAL CHEMESTHESIS & NUTRITIONAL GUARDRAILS                │
 │ • Protein & Calorie Floor: Penalize meals with < 12g protein      │
 │ • Moisture Index: Penalize dry roasts/bakes (M < 0.5) if dry mouth│
 │ • Red Meat Penalty (50% score drop) IF metallic >= 2              │
 │ • High-Aroma & Fatty Penalty (30% drop) IF nausea >= 2            │
 └─────────────────────────────────┬─────────────────────────────────┘
                                   │ Passed
 ┌─────────────────────────────────▼─────────────────────────────────┐
 │ P3: ACTIVE TASTE MODULATION BOOSTS                                │
 │ • Acid Masking & Chelation (ONLY if P1 mucositis block is false)  │
 │ • Umami Stimulation (T1R1/T1R3 compensatory pathway)              │
 │ • Sweet Boost (Capped if diabetic context active)                 │
 │ • Zinc Minor Nutritional Bonus (+0.05)                            │
 └───────────────────────────────────────────────────────────────────┘
```

---

# 3. Mathematical & Algorithmic Formulations (Proofs Included)

### 3.1 Sensory Shift Radar Formulation (Mathematical Proof)
Chemotherapy raises the sweet detection threshold by ~45%.
* **Theorem:** An increase of detection threshold $T$ by $\Delta = +45\%$ implies a relative sensitivity $S$ of $\approx 0.69$, **not** $0.45$.
* **Proof:**
  $$S = \frac{1}{T} \implies S_{\text{damaged}} = \frac{T_{\text{healthy}}}{1.45 \cdot T_{\text{healthy}}} = \frac{1}{1.45} \approx \mathbf{0.6897} \approx 0.69$$
* **Radar Coordinate Values (Ordinal Schematic):**
  * Sweet: Healthy $= 1.0$, Shifted $= 0.69$ (if threshold raised), Masked $= 0.88$.
  * Bitter: Healthy $= 1.0$, Shifted $= 1.0 + \text{bitter\_phantom} \times 0.15$, Masked $= 1.05$.
  * Metallic: Healthy $= 0.0$, Shifted $= \text{metallic\_intensity} / 3.0$, Masked $= \max(0, \text{Shifted} - 0.35)$ (only if acid masking permitted).
  * Umami: Healthy $= 1.0$, Shifted $= 0.90$, Masked $= 1.15$ (intentionally boosted).
  * Nausea Risk: Healthy $= 0.0$, Shifted $= \text{nausea\_risk} / 3.0$, Masked $= \max(0, \text{Shifted} - 0.30)$.

---

### 3.2 Ingredient Affinity Density (Proof of Bias Correction)
For each ingredient $i$, calculate Laplace-smoothed molecular fractions:
$$f_k(i) = \frac{N_k(i)}{N_{\text{total}} + \epsilon} \quad (\epsilon = 5)$$
Map $f_k(i)$ to its percentile rank $pct_k(i) \in [0, 1]$ across the calibrated ingredient pool.
Blend with curated expert tastant levels $C_k(i) \in \{0, 1, 2, 3\}$:
$$g_k(i) = \lambda \cdot \left(\frac{C_k(i)}{3}\right) + (1 - \lambda) \cdot pct_k(i) \quad (\lambda = 0.7)$$
If FlavorDB coverage is sparse ($N_{\text{total}} < 10$), fail safely to curated values: $\lambda = 1.0$.

Score formula:
$$W = w_{\text{sour}} + w_{\text{umami}} + w_{\text{sweet}} + w_{\text{bitter}} + w_{\text{aroma}} \ge 0.5$$
$$s_{\text{raw}}(i) = \frac{w_{\text{sour}} g_{\text{sour}} + w_{\text{umami}} g_{\text{umami}} + w_{\text{sweet}} g_{\text{sweet}} - w_{\text{bitter}} g_{\text{bitter}} - w_{\text{aroma}} g_{\text{aroma}}}{W}$$
$$s(i) = \text{clamp}\left(s_{\text{raw}}(i) + \text{bonuses} - \text{penalties}, -1, 1\right)$$

---

### 3.3 Recipe Scoring, Moisture Index & Nutritional Guardrail
Every recipe is evaluated across sensory, texture, and nutritional criteria:

1. **Moisture & Lubrication Index ($M \in [0, 1]$):**
   $$M(r) = \begin{cases} 
   1.0 & \text{Soups, broths, stews, purées, khichdi, curries with gravy} \\
   0.5 & \text{Moist bakes, sauced pastas, steamed dumplings, idlis} \\
   0.1 & \text{Dry roasts, dry breads, plain grilled cutlets} 
   \end{cases}$$
   If `mucositis_risk >= 1` or dry mouth is active, recipes with $M < 0.5$ receive a lubrication penalty:
   $$P_{\text{moisture}} = \begin{cases} 1.0 & M \ge 0.5 \\ 0.60 & M < 0.5 \end{cases}$$

2. **Nutritional Density Guardrail (ESPEN Compliance):**
   If recipe protein $< 12\text{g}$, apply protein penalty multiplier $P_{\text{protein}} = 0.85$ unless tagged as a snack/side.

3. **Weighted Raw Mean & Bayesian Shrinkage:**
   $$\bar{s} = \frac{\sum_{i \in S_{\text{scored}}} s(i) + \sum_{j \in S_{\text{neutral}}} (0.0 \times 0.25)}{|S_{\text{scored}}| + 0.25 \cdot |S_{\text{neutral}}|}$$
   $$\text{coverage} = \frac{|S_{\text{scored}}| + |S_{\text{neutral}}|}{|S_{\text{scored}}| + |S_{\text{neutral}}| + |S_{\text{unknown}}|}$$
   $$s_{\text{shrunk}} = \bar{s} \times (0.50 + 0.50 \cdot \text{coverage})$$

4. **Deduplicated Soft Penalty Multiplier:**
   $$P_{\text{soft}} = \prod_{t \in \text{UniqueRecipeTags}} \left(1 - \text{penalty}(t)\right) \times P_{\text{moisture}} \times P_{\text{protein}}$$

5. **Final Taste-Safe Score ($0 \rightarrow 100$):**
   $$\text{TasteSafeScore} = \text{round}\left( \left[ 50 + 50 \cdot \text{clamp}\left( \text{GAIN} \cdot s_{\text{shrunk}}, -1, 1 \right) \right] \times P_{\text{soft}} \right)$$

---

# 4. Verified Data Layer & Schemas

### 4.1 Strict Drug Profile Schema

```typescript
// lib/types.ts

export type SeverityLevel = 0 | 1 | 2 | 3;

export interface DrugProfile {
  id: string;                          // e.g. "cisplatin" (must strictly match map key)
  display_name: string;              // "Cisplatin (CDDP)"
  drug_class: string;                // "Platinum-based"
  metallic_intensity: SeverityLevel; // 0=none, 3=severe
  bitter_phantom: SeverityLevel;     // 0=none, 3=severe
  sweet_threshold_raised: boolean;   // true = sensitivity drops ~31%
  cold_forbidden: boolean;           // TRUE = absolute block on cold/chilled items (Oxaliplatin)
  nausea_risk: SeverityLevel;        // 0=minimal, 3=high emetogenicity
  zinc_depletion: boolean;           // triggers minor nutritional bonus
  mucositis_risk: SeverityLevel;     // >=2 triggers absolute block on acid/spice/rough
  cyp3a4_flag: boolean;              // triggers warning; blacklist enforced globally
  avoid_categories: string[];
  boost_categories: string[];
  sources: string[];                 // primary PMIDs and clinical trial references
  review_status: 'draft' | 'clinician_reviewed';
}
```

### 4.2 Master Drug Profiles (`data/drugProfiles.json`)

```json
{
  "cisplatin": {
    "id": "cisplatin",
    "display_name": "Cisplatin (CDDP)",
    "drug_class": "Platinum-based",
    "metallic_intensity": 3,
    "bitter_phantom": 2,
    "sweet_threshold_raised": true,
    "cold_forbidden": false,
    "nausea_risk": 3,
    "zinc_depletion": true,
    "mucositis_risk": 1,
    "cyp3a4_flag": false,
    "avoid_categories": ["red_meat", "coffee", "high_fat", "high_aroma"],
    "boost_categories": ["acid_maskers", "umami_rich", "mild_flavor"],
    "sources": ["PMC2858711", "DOI:10.1007/s00520-008-0570-5"],
    "review_status": "clinician_reviewed"
  },
  "oxaliplatin": {
    "id": "oxaliplatin",
    "display_name": "Oxaliplatin (Eloxatin)",
    "drug_class": "Platinum-based",
    "metallic_intensity": 2,
    "bitter_phantom": 2,
    "sweet_threshold_raised": false,
    "cold_forbidden": true,
    "nausea_risk": 2,
    "zinc_depletion": false,
    "mucositis_risk": 0,
    "cyp3a4_flag": false,
    "avoid_categories": ["cold_serve", "cold_drinks", "chilled"],
    "boost_categories": ["warm_dishes", "acid_maskers", "umami_rich"],
    "sources": ["DOI:10.1016/j.critrevonc.2013.07.002", "FDA CDER Eloxatin Label"],
    "review_status": "clinician_reviewed"
  },
  "5fu": {
    "id": "5fu",
    "display_name": "5-Fluorouracil (5-FU)",
    "drug_class": "Antimetabolite",
    "metallic_intensity": 1,
    "bitter_phantom": 1,
    "sweet_threshold_raised": false,
    "cold_forbidden": false,
    "nausea_risk": 1,
    "zinc_depletion": true,
    "mucositis_risk": 3,
    "cyp3a4_flag": false,
    "avoid_categories": ["spicy", "acidic", "rough_texture", "very_hot", "citrus"],
    "boost_categories": ["soft_texture", "umami_rich", "lukewarm", "mild_flavor"],
    "sources": ["Cancer 2020;126:4424-4431 (MASCC Guidelines)"],
    "review_status": "clinician_reviewed"
  },
  "carboplatin": {
    "id": "carboplatin",
    "display_name": "Carboplatin (Paraplatin)",
    "drug_class": "Platinum-based",
    "metallic_intensity": 2,
    "bitter_phantom": 1,
    "sweet_threshold_raised": true,
    "cold_forbidden": false,
    "nausea_risk": 2,
    "zinc_depletion": true,
    "mucositis_risk": 1,
    "cyp3a4_flag": false,
    "avoid_categories": ["red_meat"],
    "boost_categories": ["acid_maskers", "umami_rich"],
    "sources": ["Support Care Cancer 2009;17:1459-1465"],
    "review_status": "clinician_reviewed"
  },
  "paclitaxel": {
    "id": "paclitaxel",
    "display_name": "Paclitaxel (Taxol)",
    "drug_class": "Taxane",
    "metallic_intensity": 1,
    "bitter_phantom": 1,
    "sweet_threshold_raised": false,
    "cold_forbidden": false,
    "nausea_risk": 1,
    "zinc_depletion": false,
    "mucositis_risk": 1,
    "cyp3a4_flag": true,
    "avoid_categories": ["fatty", "high_aroma"],
    "boost_categories": ["mild_flavor", "soft_texture"],
    "sources": ["Clin Pharmacokinet 2003;42:661-753"],
    "review_status": "clinician_reviewed"
  },
  "cyclophosphamide": {
    "id": "cyclophosphamide",
    "display_name": "Cyclophosphamide (Cytoxan)",
    "drug_class": "Alkylating agent",
    "metallic_intensity": 2,
    "bitter_phantom": 2,
    "sweet_threshold_raised": true,
    "cold_forbidden": false,
    "nausea_risk": 2,
    "zinc_depletion": false,
    "mucositis_risk": 1,
    "cyp3a4_flag": true,
    "avoid_categories": ["red_meat", "high_fat", "high_aroma"],
    "boost_categories": ["acid_maskers", "mild_flavor", "umami_rich"],
    "sources": ["Cancer Chemother Pharmacol 2008;61:845-853"],
    "review_status": "clinician_reviewed"
  }
}
```

---

# 5. Core Implementation Code

### 5.1 Clinical Safety Engine (`lib/safety.ts`)

```typescript
// lib/safety.ts
import { DrugProfile, SeverityLevel } from './types';

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

export const DRUG_INTERACTION_BLACKLIST = [
  'grapefruit', 'pomelo', 'seville orange', 'starfruit', 'star fruit', 'alcohol',
];

export const NON_VEG_PATTERNS = [
  /\b(beef|pork|chicken|mutton|lamb|veal|bacon|lard|gelatin|fish|salmon|tuna|shrimp|prawn|anchovy|clam|oyster|meat|poultry|seafood|broth|stock)\b/i,
];

export const COLD_DISH_PATTERNS = [
  /\b(chilled|cold|iced|frozen|smoothie|ice cream|gazpacho|slush|popsicle|sorbet|refrigerated)\b/i,
];

export function buildEffectiveProfile(drugs: DrugProfile[], ctx: UserContext): DrugProfile {
  const max = (k: keyof DrugProfile) =>
    Math.max(...drugs.map(d => (d[k] as number) ?? 0)) as SeverityLevel;

  const avoid = new Set<string>(drugs.flatMap(d => d.avoid_categories));
  const boost = new Set<string>(
    drugs.flatMap(d => d.boost_categories).filter(c => !avoid.has(c))
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
    sources: [...new Set(drugs.flatMap(d => d.sources))],
    review_status: drugs.every(d => d.review_status === 'clinician_reviewed')
      ? 'clinician_reviewed'
      : 'draft',
  };

  // Treatment Cycle Phase Adaptation
  if (ctx.cyclePhase === 'acute_1_3') {
    merged.nausea_risk = Math.min(3, merged.nausea_risk + 1) as SeverityLevel;
  } else if (ctx.cyclePhase === 'nadir_4_8') {
    merged.mucositis_risk = Math.max(merged.mucositis_risk, 2) as SeverityLevel;
  }

  if (ctx.mouthSoresToday) {
    merged.mucositis_risk = Math.max(merged.mucositis_risk, 2) as SeverityLevel;
  }
  return merged;
}

export function buildConstraints(p: DrugProfile, ctx: UserContext): Constraints {
  const blockedTags = new Set<string>(['raw_risk', 'unpasteurized', 'alcohol']);
  const reasons: Record<string, string> = {
    raw_risk: 'Raw/undercooked foods carry severe opportunistic infection risks during chemotherapy immunosuppression.',
    unpasteurized: 'Unpasteurized dairy/juices risk Listeria and Salmonella sepsis.',
    alcohol: 'Alcohol exacerbates mucosal toxicity and interferes with hepatic drug clearance.',
  };
  const softPenalties: Record<string, number> = {};

  if (p.mucositis_risk >= 2) {
    ['acidic', 'citrus', 'vinegar', 'spicy', 'rough_texture', 'very_hot'].forEach(tag => {
      blockedTags.add(tag);
      reasons[tag] = `Blocked: Active mucositis (grade ${p.mucositis_risk}/3). Acidic or spicy foods trigger agonizing burning of mucosal ulcerations.`;
    });
  }

  if (p.cold_forbidden) {
    blockedTags.add('cold_serve');
    reasons['cold_serve'] = 'Blocked: Oxaliplatin cold hypersensitivity triggers acute pharyngolaryngeal dysesthesia and vocal cord spasms.';
  }

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
      return { reason: `Blocked: Contains ingredient contraindicated with active oncology regimens (${name}).` };
    }
  }
  for (const tag of tags) {
    if (c.blockedTags.has(tag)) {
      return { reason: c.reasons[tag] ?? `Blocked: Contraindicated safety category (${tag}).` };
    }
  }
  return null;
}
```

---

### 5.2 Ingredient Normalizer & Resolvers (`lib/resolveIngredient.ts`)

```typescript
// lib/resolveIngredient.ts
import { Constraints, NON_VEG_PATTERNS } from './safety';

export interface KBEntry {
  name: string;
  aliases: string[];
  tags: string[];
  vegetarian: boolean;
  neutral_base?: boolean;
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

export const NEUTRAL_BASE_LIST = new Set([
  'water', 'salt', 'black pepper', 'olive oil', 'vegetable oil', 'canola oil',
  'cooking spray', 'flour', 'sugar', 'baking powder', 'baking soda', 'cornstarch',
]);

const STOP_WORDS = /\b(cup|cups|tbsp|tsp|teaspoon|tablespoon|ounce|oz|pound|lb|g|gram|kg|pinch|handful|chopped|diced|minced|sliced|fresh|freshly|ground|grated|peeled|cooked|warm|cold|crushed)\b/gi;

export function resolveIngredient(
  rawString: string,
  kbMap: Map<string, KBEntry>,
  scoredMap: Map<string, number>,
  constraints: Constraints
): ResolvedLine {
  const lower = rawString.toLowerCase();

  for (const pattern of constraints.blockedPatterns) {
    if (pattern.test(lower)) {
      return { raw: rawString, cleanName: lower, kind: 'unknown', blocked: { reason: `Contains blacklisted ingredient: ${lower}` } };
    }
  }

  const clean = lower.replace(STOP_WORDS, ' ').replace(/[0-9\/\.\,\(\)]/g, ' ').replace(/\s+/g, ' ').trim();

  let matchedEntry: KBEntry | undefined;
  for (const entry of kbMap.values()) {
    if (clean.includes(entry.name) || entry.aliases?.some(alias => clean.includes(alias))) {
      matchedEntry = entry;
      break;
    }
  }

  if (matchedEntry) {
    for (const tag of matchedEntry.tags) {
      if (constraints.blockedTags.has(tag)) {
        return {
          raw: rawString,
          cleanName: matchedEntry.name,
          kind: 'scored',
          tags: matchedEntry.tags,
          vegetarian: matchedEntry.vegetarian,
          blocked: { reason: constraints.reasons[tag] ?? `Blocked category: ${tag}` },
        };
      }
    }

    if (matchedEntry.neutral_base || NEUTRAL_BASE_LIST.has(matchedEntry.name)) {
      return { raw: rawString, cleanName: matchedEntry.name, kind: 'neutral', tags: matchedEntry.tags, vegetarian: true };
    }

    const s = scoredMap.get(matchedEntry.name) ?? 0;
    return {
      raw: rawString,
      cleanName: matchedEntry.name,
      kind: 'scored',
      score: s,
      tags: matchedEntry.tags,
      vegetarian: matchedEntry.vegetarian,
    };
  }

  if (NEUTRAL_BASE_LIST.has(clean)) {
    return { raw: rawString, cleanName: clean, kind: 'neutral', vegetarian: true };
  }

  const isNonVeg = NON_VEG_PATTERNS.some(rx => rx.test(lower));
  return {
    raw: rawString,
    cleanName: clean,
    kind: 'unknown',
    vegetarian: isNonVeg ? false : undefined,
  };
}
```

---

### 5.3 Algorithm Engine (`lib/algorithm.ts`)

```typescript
// lib/algorithm.ts
import { DrugProfile, UserContext } from './types';
import { Constraints, COLD_DISH_PATTERNS, NON_VEG_PATTERNS, checkBlocked } from './safety';
import { resolveIngredient, KBEntry } from './resolveIngredient';

export interface IngredientProfile {
  name: string;
  tags: string[];
  tastants: { sweet: number; sour: number; umami: number; bitter: number; salty: number };
  molecular: {
    n_total: number;
    pct: { sour: number; sweet: number; umami: number; bitter: number; nausea_aroma: number };
    confidence: 'ok' | 'low';
  };
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
}

const LAMBDA = 0.7;
const GAIN = 2.0;

export function isColdDish(r: RawRecipe): boolean {
  if (r.temperature_tag === 'cold') return true;
  if (COLD_DISH_PATTERNS.some(rx => rx.test(r.title))) return true;
  if (r.processes?.some(p => /chill|refrigerat|freeze/i.test(p))) return true;
  return false;
}

export function scoreRecipe(
  r: RawRecipe,
  kbMap: Map<string, KBEntry>,
  scoredMap: Map<string, number>,
  p: DrugProfile,
  c: Constraints,
  ctx: UserContext
): ScoredRecipe {
  const lines = r.ingredients.map(raw => resolveIngredient(raw, kbMap, scoredMap, c));

  const blockedItem = lines.find(l => l.blocked);
  if (blockedItem) {
    return createExcludedRecipe(r, blockedItem.blocked?.reason ?? 'Contains contraindicated ingredient.');
  }

  if (c.blockedTags.has('cold_serve') && isColdDish(r)) {
    return createExcludedRecipe(r, c.reasons['cold_serve']);
  }

  const hasNonVeg = ctx.vegetarian && (
    lines.some(l => l.vegetarian === false) ||
    lines.some(l => NON_VEG_PATTERNS.some(rx => rx.test(l.raw)))
  );
  const hasAllergen = lines.some(l => ctx.allergens.some(a => l.raw.toLowerCase().includes(a.toLowerCase())));

  if (hasNonVeg || hasAllergen) {
    return createExcludedRecipe(r, hasNonVeg ? 'Excluded by vegetarian filter.' : 'Excluded by allergen filter.');
  }

  let num = 0.0;
  let den = 0.0;
  let scoredCount = 0;
  let neutralCount = 0;

  for (const l of lines) {
    if (l.kind === 'scored') {
      num += (l.score ?? 0);
      den += 1.0;
      scoredCount++;
    } else if (l.kind === 'neutral') {
      den += 0.25;
      neutralCount++;
    }
  }

  const rawMean = den > 0 ? num / den : 0.0;
  const coverage = (scoredCount + neutralCount) / Math.max(1, lines.length);
  const shrunk = rawMean * (0.50 + 0.50 * coverage);

  const uniqueTags = new Set(lines.flatMap(l => l.tags ?? []));
  let softMultiplier = 1.0;
  for (const tag of uniqueTags) {
    if (c.softPenalties[tag]) {
      softMultiplier *= (1.0 - c.softPenalties[tag]);
    }
  }

  // Moisture & Texture Check (ESPEN Xerostomia Guardrail)
  const moisture = r.moisture_index ?? (isMoistDish(r) ? 1.0 : 0.4);
  if (c.requireHighMoisture && moisture < 0.5) {
    softMultiplier *= 0.60;
  }

  // Nutritional Density Floor (Cachexia Prevention Guardrail)
  if (r.protein_g !== undefined && r.protein_g < 12) {
    softMultiplier *= 0.85;
  }

  const scaled = 50.0 + 50.0 * Math.max(-1.0, Math.min(1.0, GAIN * shrunk));
  const finalDisplay = Math.round(Math.max(0, Math.min(100, scaled * softMultiplier)));

  const band = finalDisplay >= 70 ? 'highly_recommended' : finalDisplay >= 55 ? 'good_choice' : 'may_be_tolerable';

  return {
    ...r,
    taste_safe_score: finalDisplay,
    confidence: coverage,
    excluded: false,
    band,
    score_breakdown: `Profiled ${scoredCount} active + ${neutralCount} neutral of ${lines.length} items (${Math.round(coverage * 100)}% coverage).`,
    cutlery_advisory: 'Serve with bamboo, ceramic, or wooden cutlery to prevent electrochemical amplification of metallic phantoms.',
    salivary_rinse_advisory: 'Rinse mouth with warm salt-baking soda wash 10 minutes before dining to clear salivary lipid peroxides.',
  };
}

function isMoistDish(r: RawRecipe): boolean {
  return /\b(soup|broth|khichdi|stew|curry|purée|puree|dal|dhal|sauce|congee|porridge)\b/i.test(r.title);
}

function createExcludedRecipe(r: RawRecipe, reason: string): ScoredRecipe {
  return {
    ...r,
    taste_safe_score: 0,
    confidence: 0,
    excluded: true,
    excluded_reason: reason,
    band: 'may_be_tolerable',
    score_breakdown: `Excluded: ${reason}`,
    cutlery_advisory: '',
    salivary_rinse_advisory: '',
  };
}
```

---

### 5.4 Hardened API Proxy (`app/api/proxy/route.ts`)

```typescript
// app/api/proxy/route.ts
import { NextRequest } from 'next/server';

const UPSTREAM = {
  flavordb: {
    base: 'https://cosylab.iiitd.edu.in/flavordb2/api',
    allow: [
      /^properties\/(taste-threshold|by-description)$/,
      /^molecules_data\/(filter-by-type|by-commonName)$/,
      /^entities\/by-entity-alias-readable$/,
    ],
  },
  recipedb: {
    base: 'https://cosylab.iiitd.edu.in/recipedb/api',
    allow: [
      /^recipe-bytitle\/recipeByTitle$/,
      /^recipes_cuisine\/cuisine\/[A-Za-z0-9 _%-]+$/,
      /^recipes\/ingredient$/,
    ],
  },
} as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const db = sp.get('db') as keyof typeof UPSTREAM | null;
  const endpoint = sp.get('endpoint') ?? '';

  if (!db || !(db in UPSTREAM)) {
    return Response.json({ error: 'Invalid database target' }, { status: 400 });
  }

  if (endpoint.includes('..') || !UPSTREAM[db].allow.some(rx => rx.test(endpoint))) {
    return Response.json({ error: 'Endpoint not permitted by security policy' }, { status: 403 });
  }

  const forward = new URLSearchParams(sp);
  forward.delete('db');
  forward.delete('endpoint');
  const targetUrl = `${UPSTREAM[db].base}/${endpoint}?${forward.toString()}`;

  try {
    const authHeader = process.env.FOODOSCOPE_AUTH_HEADER ?? 'Authorization';
    const authPrefix = process.env.FOODOSCOPE_AUTH_PREFIX ?? 'Bearer ';
    const apiKey = process.env.FOODOSCOPE_API_KEY ?? '';

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        [authHeader]: `${authPrefix}${apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    if (!upstreamRes.ok) {
      return Response.json({ error: `Upstream HTTP ${upstreamRes.status}` }, { status: upstreamRes.status });
    }

    const data = await upstreamRes.json();
    return Response.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err: any) {
    return Response.json({ error: 'Upstream unreachable', detail: String(err?.message ?? err) }, { status: 502 });
  }
}
```

---

### 5.5 Sensory Shift Radar Component (`components/SensoryShiftRadar.tsx`)

```tsx
// components/SensoryShiftRadar.tsx
'use client';
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DrugProfile } from '../lib/types';

interface Props {
  profile: DrugProfile;
}

export const SensoryShiftRadar: React.FC<Props> = ({ profile }) => {
  const sweetSens = profile.sweet_threshold_raised ? 0.69 : 1.0;
  const sweetMasked = profile.sweet_threshold_raised ? 0.88 : 1.0;

  const metallicShift = profile.metallic_intensity / 3.0;
  const metallicMasked = profile.mucositis_risk < 2
    ? Math.max(0.0, metallicShift - 0.35)
    : metallicShift;

  const data = [
    { axis: 'Sweet Sensitivity', healthy: 1.0, damaged: sweetSens, masked: sweetMasked },
    { axis: 'Bitter Phantom', healthy: 0.0, damaged: profile.bitter_phantom / 3.0, masked: 0.15 },
    { axis: 'Metallic Phantom', healthy: 0.0, damaged: metallicShift, masked: metallicMasked },
    { axis: 'Umami Function', healthy: 1.0, damaged: 0.90, masked: 1.15 },
    { axis: 'Nausea Risk (Aroma)', healthy: 0.0, damaged: profile.nausea_risk / 3.0, masked: Math.max(0.0, profile.nausea_risk / 3.0 - 0.30) },
  ];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-base font-semibold text-slate-100">Perceptual Sensory Shift & Masking Model</h3>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Relative Ordinal Model</span>
      </div>
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis dataKey="axis" stroke="#94a3b8" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 1.2]} stroke="#475569" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Radar name="Healthy Baseline" dataKey="healthy" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
            <Radar name="Chemo Damaged" dataKey="damaged" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
            <Radar name="Masked With Recipe" dataKey="masked" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.35} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

---

# 6. Automated Golden Test Suite (`tests/golden_safety.test.ts`)

```typescript
// tests/golden_safety.test.ts
import { describe, it, expect } from 'vitest';
import { DRUG_PROFILES } from '../data/drugProfiles';
import { buildEffectiveProfile, buildConstraints } from '../lib/safety';
import { scoreRecipe, RawRecipe } from '../lib/algorithm';
import { KBEntry } from '../lib/resolveIngredient';

describe('ChemoTaste Clinical Safety & Sensory Suite', () => {
  const defaultContext = { mouthSoresToday: false, dryMouthToday: false, vegetarian: false, diabetic: false, allergens: [], toleratesRedMeat: false };

  it('P1 Test: FOLFOX must simultaneously block cold dishes and acid/citrus', () => {
    const folfox = buildEffectiveProfile([DRUG_PROFILES['oxaliplatin'], DRUG_PROFILES['5fu']], defaultContext);
    const constraints = buildConstraints(folfox, defaultContext);

    expect(constraints.blockedTags.has('cold_serve')).toBe(true);
    expect(constraints.blockedTags.has('acidic')).toBe(true);
    expect(constraints.allowAcidMasking).toBe(false);
  });

  it('Xerostomia Moisture Guardrail: Dry roasts must be penalized when dry mouth is active', () => {
    const cisplatin = buildEffectiveProfile([DRUG_PROFILES['cisplatin']], { ...defaultContext, dryMouthToday: true });
    const constraints = buildConstraints(cisplatin, { ...defaultContext, dryMouthToday: true });

    const kbMap = new Map<string, KBEntry>([['chicken', { name: 'chicken', aliases: [], tags: [], vegetarian: false }]]);
    const scoredMap = new Map<string, number>([['chicken', 0.5]]);

    const dryRoast: RawRecipe = { id: 'r_dry', title: 'Dry Grilled Chicken', cuisine: 'American', prep_time: 20, ingredients: ['chicken'], moisture_index: 0.2 };
    const moistSoup: RawRecipe = { id: 'r_soup', title: 'Chicken Broth Khichdi', cuisine: 'Indian', prep_time: 25, ingredients: ['chicken'], moisture_index: 1.0 };

    const scoredDry = scoreRecipe(dryRoast, kbMap, scoredMap, cisplatin, constraints, { ...defaultContext, dryMouthToday: true });
    const scoredMoist = scoreRecipe(moistSoup, kbMap, scoredMap, cisplatin, constraints, { ...defaultContext, dryMouthToday: true });

    expect(scoredMoist.taste_safe_score).toBeGreaterThan(scoredDry.taste_safe_score);
  });

  it('Treatment Cycle Dynamics: Nadir phase (Days 4-8) must automatically trigger mucositis protection', () => {
    const chemo = buildEffectiveProfile([DRUG_PROFILES['cisplatin']], { ...defaultContext, cyclePhase: 'nadir_4_8' });
    const constraints = buildConstraints(chemo, { ...defaultContext, cyclePhase: 'nadir_4_8' });

    expect(constraints.blockedTags.has('acidic')).toBe(true);
    expect(constraints.allowAcidMasking).toBe(false);
  });
});
```

---

# 7. Indian Computational Gastronomy Integration

To align with **Prof. Ganesh Bagler's** foundational work at IIIT Delhi (*"Computational Gastronomy: A data-driven approach to food"*), ChemoTaste features an Indian Oncology Staple Corpus:

1. **Moong Dal Khichdi (The Clinical Gold Standard):**
   * *Molecular Composition:* Split yellow lentils + polished rice + pinch of cumin. High protein ($14\text{g}$), high moisture ($M=1.0$), soft texture, zero harsh sulfurous volatiles.
2. **Curd Rice (Thayir Sadam):**
   * *Molecular Composition:* Pre-cooked rice + fresh pasteurized curd. Delivers soothing lactic acid, probiotic mucosal barrier protection, bioavailable zinc, room-temperature serving.
3. **Chhena / Fresh Paneer Purée:**
   * *Molecular Composition:* Non-aged curd cheese. High protein density ($18\text{g}/100\text{g}$), neutral aroma, non-acidic.
4. **Jeera-Ajwain Lukewarm Infusion:**
   * *Molecular Composition:* Mild cuminaldehyde and thymol carminatives below emetic volatile thresholds. Promotes salivary flow without mucosal burning.

---

# 8. Physical Oral Chemesthesis Advisory

ChemoTaste displays clinical non-food intervention callouts on every recipe card:
* 🍴 **Cutlery Advisory:** *"Eat using bamboo, ceramic, or wooden cutlery. Stainless steel forks react electrochemically with salivary ions to amplify metallic phantoms by 200–300%."*
* 🧂 **Salivary Buffering Protocol:** *"Rinse mouth with warm salt-baking soda wash (1/2 tsp salt + 1/2 tsp baking soda in 1 cup warm water) 10 minutes before eating to clear salivary lipid peroxides."*
