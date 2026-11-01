# ChemoTaste — Persistent Architectural Memory (`MEMORY.md`)
**Architectural Decision Records (ADR), Biological Constraints, and Calibration Constants**
**Project:** ChemoTaste (Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab)

---

## 1. Project Overview & Core Entities

ChemoTaste computationally personalizes meal planning for cancer patients undergoing chemotherapy. The system maps drug-specific taste receptor damage (dysgeusia, parosmia, mucositis) against Foodoscope's **FlavorDB** and **RecipeDB** to produce safe, perceptible, and palatable recipes.

### Key Paths & Resources
* **Master Specification:** [`IMPLEMENTATION.md`](file:///e:/projects/ChemoTaste/IMPLEMENTATION.md)
* **Agent Guidelines:** [`AGENT.md`](file:///e:/projects/ChemoTaste/AGENT.md)
* **API Discovery Contract:** [`docs/api-contract.md`](file:///e:/projects/ChemoTaste/docs/api-contract.md)
* **Primary Challenge Databases:** FlavorDB2 (`cosylab.iiitd.edu.in/flavordb2`), RecipeDB (`cosylab.iiitd.edu.in/recipedb`).

---

## 2. Architectural Decision Records (ADRs)

### ADR-001: Separation of Gustatory Tastants from Volatile Aromas
* **Context:** In early drafts, FlavorDB was mistakenly framed as cataloging basic tongue tastants (sweet, sour, salty, bitter, umami). In reality, FlavorDB indexes volatile aroma compounds (Fenaroli / Flavornet) across 900+ descriptors.
* **Decision:** Treat flavor as two independent biological channels:
  1. *Retronasal Olfactory Channel (FlavorDB):* Filter volatile aroma compounds (sulfurous, fatty, pungent) to suppress chemotherapy-induced nausea.
  2. *Gustatory Receptor Channel (Curated Oncology KB):* Modulate non-volatile tongue tastants (citric/malic acid chelating platinum ions, umami stimulating resilient T1R1/T1R3 pathways, zinc supplementation).
* **Consequence:** Preserves scientific credibility in front of CoSy Lab evaluators who created FlavorDB.

### ADR-002: Clinical Safety Hierarchy (Block Beats Boost)
* **Context:** A Cisplatin patient benefits from acidic foods (to mask metallic taste), but if they receive 5-FU or experience oral mucositis, citrus causes burning pain on mucosal ulcerations.
* **Decision:** Enforce a strict 4-tier evaluation hierarchy:
  * **P0 — Global Oncology Safety:** Hard-block raw/undercooked foods (neutropenic infection), CYP3A4 inhibitors (grapefruit, pomelo, Seville orange), starfruit (nephrotoxicity), and alcohol.
  * **P1 — Regimen Clinical Overrides:**
    * If `mucositis_risk >= 2` $\rightarrow$ Hard-block acid, citrus, vinegar, spice, rough textures.
    * If `cold_forbidden === true` (Oxaliplatin) $\rightarrow$ Hard-block chilled, iced, smoothie, cold-serve dishes.
  * **P2 — Strong Soft Constraints:** Red meat (50% penalty if `metallic >= 2`, patient can override), high aroma (30% penalty if `nausea >= 2`).
  * **P3 — Active Boosts:** Acid masking (only if mucositis < 2), umami stimulation, sweet compensation (capped if diabetic), zinc bonus (+0.05).
* **Consequence:** Ensures patient safety always overrides culinary taste optimization.

### ADR-003: Sensory Shift Radar Reciprocal Math
* **Context:** Early drafts mapped a $+45\%$ sweet threshold elevation directly to $0.45$ on the radar chart.
* **Decision:** Sensitivity $S$ is mathematically the reciprocal of detection threshold $T$:
  $$S = \frac{1}{T} = \frac{1}{1.45} \approx \mathbf{0.6897} \approx 0.69$$
* **Consequence:** Accurate scientific representation. Sensory sensitivity drops by $\sim 31\%$, plotted at coordinate $0.69$.

### ADR-004: Normalized Laplace-Smoothed Affinity Density
* **Context:** Raw molecule counting penalized sparsely cataloged ingredients (e.g. millet with 6 molecules vs. tomato with 120 molecules), reflecting database annotation bias.
* **Decision:** Compute Laplace-smoothed fractions $f_k = \frac{N_k}{N_{\text{total}} + 5}$ ($\epsilon=5$), convert to percentile ranks across the pool, and blend with curated tastants ($\lambda=0.7$). If $N_{\text{total}} < 10$, fail safely to curated values ($\lambda=1.0$).
* **Consequence:** Bounded scores in $[-1, 1]$; immune to chemical database annotation density.

### ADR-005: 3-Bucket Recipe Denominator with Bayesian Shrinkage
* **Context:** Real recipes contain 10–14 ingredients. Candidate lists only contain ~40 hero items. In v1, uncataloged items defaulted to $0$, artificially dragging 90% of recipes below 30/100.
* **Decision:** Classify ingredients into Scored ($w=1.0$), Neutral Base ($w=0.25$, score $0.0$), and Unknown. Unknown items are excluded from the denominator. Low data coverage pulls the score toward neutral $50$ via Bayesian shrinkage:
  $$s_{\text{shrunk}} = \bar{s} \times (0.50 + 0.50 \times \text{coverage})$$
* **Consequence:** Baseline recipes with neutral staples score fairly ($50–65$), hero recipes score high ($75–90$), and low-coverage recipes are flagged transparently.

### ADR-006: Soft Penalty Deduplication per Recipe
* **Context:** If soft penalties multiplied per ingredient token, a dish containing onion, garlic, and cumin tagged `high_aroma` suffered an exponential penalty: $(1-0.3)^3 = 0.343$ (a 66% drop).
* **Decision:** Extract unique tags across the recipe before computing the soft multiplier:
  $$P_{\text{soft}} = \prod_{t \in \text{UniqueRecipeTags}} (1 - \text{penalty}(t))$$
* **Consequence:** Prevents runaway score penalization on standard multi-ingredient culinary bases.

### ADR-007: Zero Runtime $N+1$ API Waterfall
* **Context:** Querying 35 candidate ingredients dynamically on page load triggers 35 parallel upstream HTTP requests, risking academic server rate-limits (HTTP 429) during live demos.
* **Decision:** Pre-compile the molecular fingerprints of the top 80 ingredients into `data/precompiled/ingredient_profiles.json` and validate 50 recipes in `data/curated_recipes.json`. Runtime calls are strictly on-demand.
* **Consequence:** Sub-millisecond initial page loads; 100% demo resilience.

### ADR-008: Unknown-Ingredient Defensive Regexes
* **Context:** If a RecipeDB recipe contains uncataloged meat broths, unlisted grapefruit juice, or chilled items, they may pass through if checks rely solely on KB lookups.
* **Decision:** Enforce raw-string regexes (`NON_VEG_PATTERNS`, `COLD_DISH_PATTERNS`, `DRUG_INTERACTION_BLACKLIST`) directly against raw recipe line strings.
* **Consequence:** Complete safety coverage even when external recipes have uncataloged ingredient variants.

---

## 3. Calibration Constants & Tuning Reference

| Constant | Value | Purpose |
|---|---|---|
| `GAIN` | `2.0` | Calibrates shrunk raw mean to 0–100 scale ($50 = \text{neutral}$, $\ge 70 = \text{recommended}$). |
| `LAMBDA` | `0.7` | Blends curated clinical KB ($70\%$) with FlavorDB molecular percentile ($30\%$). |
| `EPSILON` | `5` | Laplace smoothing factor for molecular fractions, preventing small-sample distortion. |
| `RATE_LIMIT` | `3` | Maximum concurrent upstream requests client-side (`p-limit(3)`). |
| `PROXY_TIMEOUT` | `8000ms` | Next.js API route upstream fetch timeout. |
| `SWEET_SENS` | `0.69` | Relative sensitivity coordinate on radar chart when sweet threshold is elevated 45%. |

---

## 4. Master Drug Profiles Quick Reference

| Drug ID | Display Name | Class | Metallic | Bitter | Sweet Raised | Cold Forbidden | Nausea | Mucositis | CYP3A4 Sensitive |
|---|---|---|---|---|---|---|---|---|---|
| `cisplatin` | Cisplatin (CDDP) | Platinum | 3 | 2 | true | false | 3 | 1 | false |
| `oxaliplatin` | Oxaliplatin (Eloxatin) | Platinum | 2 | 2 | false | **true** | 2 | 0 | false |
| `5fu` | 5-Fluorouracil (5-FU) | Antimetabolite | 1 | 1 | false | false | 1 | **3** | false |
| `carboplatin` | Carboplatin (Paraplatin) | Platinum | 2 | 1 | true | false | 2 | 1 | false |
| `paclitaxel` | Paclitaxel (Taxol) | Taxane | 1 | 1 | false | false | 1 | 1 | **true** |
| `cyclophosphamide` | Cyclophosphamide (Cytoxan) | Alkylating | 2 | 2 | true | false | 2 | 1 | **true** |
| **FOLFOX** | Oxaliplatin + 5-FU | Combo | 2 | 2 | false | **true** | 2 | **3** | false |
| **TC** | Paclitaxel + Carboplatin | Combo | 2 | 1 | true | false | 2 | 1 | **true** |

---

## 5. Pre-Hackathon Status & Checklist

- [x] Master specification updated and verified (`IMPLEMENTATION.md`).
- [x] Agent guidelines created (`AGENT.md`).
- [x] Architectural memory documented (`MEMORY.md`).
- [ ] API discovery contract populated (`docs/api-contract.md`).
- [ ] Foodoscope API key provisioned and verified with curl.
- [ ] Top 80 ingredients pre-compiled into `data/precompiled/ingredient_profiles.json`.
- [ ] Top 50 curated recipes validated into `data/curated_recipes.json`.
