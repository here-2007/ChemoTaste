# ChemoTaste — Hackathon Operational Master Plan (`PLAN.md`)
**Event:** Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab
**Path:** RecipeDB + FlavorDB
**Hackathon Window:** November 14, 2026 (09:00 IST) → November 15, 2026 (09:00 IST) (24 Hours)
**Current Date:** November 1, 2026 (12 Days Pre-Hackathon Preparation Window)

---

## 1. Executive Strategy & Challenge Positioning

ChemoTaste solves chemotherapy-induced dysgeusia, parosmia, xerostomia, and malnutrition by applying computational gastronomy principles to oncology supportive care. 

### Why This Wins the CoSy Lab "Fork It" Challenge
1. **Accurate Understanding of CoSy Lab Science:** We explicitly distinguish between **FlavorDB's volatile aroma compounds** (Fenaroli / Flavornet) for retronasal olfactory nausea suppression, and **curated oncology kinetics** for tongue tastant modulation.
2. **Targeting Salivary Lipid Peroxidation:** We model the true biological driver of metallic taste: reactive oxygen species in saliva oxidizing oral mucosal lipids into volatile aldehydes (1-octen-3-one, hexanal), targeted via natural metal chelators (citric/malic acids) and dietary polyphenols.
3. **Clinical Safety by Construction:** An immutable safety hierarchy ($P_0 \rightarrow P_3$) guarantees that patient safety (mucositis, oxaliplatin cold allodynia, neutropenia, CYP3A4 inhibition) strictly overrides taste optimization.
4. **Guarding Against Cachexia:** Enforces protein ($\ge 12\text{g}$) and caloric floors, plus a Moisture Index ($M \ge 0.5$) for dry mouth, preventing the "empty plate" malnutrition trap (ESPEN Guidelines).
5. **Native Indian Computational Gastronomy:** Grounded in Prof. Ganesh Bagler's Indian cuisine computing, featuring therapeutic staples: Moong dal khichdi, curd rice, fresh chhena, and lauki stew.
6. **Bulletproof Demo Architecture:** Zero runtime $N+1$ calls. Static pre-compilation of the top 80 ingredients and 50 curated recipes ensures instant sub-second responses and zero demo-time API failures (`?demo=true`).

---

## 2. Pre-Hackathon Milestone Roadmap (Nov 1 – Nov 13, 2026)

```
 NOV 1–3                   NOV 4–7                   NOV 8–10                  NOV 11–12                 NOV 13
┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐┌─────────────────────────┐
│ API CONTRACT DISCOVERY  ││ DATA COMPILATION &      ││ RECIPE CORPUS &         ││ SCAFFOLDING &           ││ DRY RUN &               │
│ • Provision Foodoscope  ││ PRE-BAKE                ││ CLINICAL SANITY         ││ CITATION AUDIT          ││ STRESS TESTING          │
│   API keys              ││ • Run prebake.ts        ││ • Curate 50 RecipeDB    ││ • Next.js 14 bootstrap  ││ • 5x demo rehearsals    │
│ • Verify curl endpoints ││ • Build 80-item KB      ││   recipes incl. Indian  ││ • Golden safety tests   ││ • Test ?demo=true       │
│ • Populate              ││ • Snapshot raw cache    ││   oncology staples      ││ • Deploy to Vercel      ││   completely offline    │
│   docs/api-contract.md  ││   in data/cache/        ││ • Moisture & protein tag││ • Verify mobile view    ││ • Final team alignment  │
└─────────────────────────┘└─────────────────────────┘└─────────────────────────┘└─────────────────────────┘└─────────────────────────┘
```

### Phase 0.1: Days 0–3 (Nov 1 – Nov 3) — API Access & Contract Discovery
* [ ] **Key Provisioning:** Register at [foodoscope.com](https://www.foodoscope.com). Confirm API key delivery and authorization headers (`FOODOSCOPE_AUTH_HEADER`, `FOODOSCOPE_AUTH_PREFIX`).
* [ ] **Contract Verification:** Run curl calls against all target endpoints to observe exact casing, response envelopes, and latencies.
  ```bash
  curl -X GET "https://cosylab.iiitd.edu.in/flavordb2/api/properties/taste-threshold" \
       -H "Authorization: Bearer $FOODOSCOPE_API_KEY"
  ```
* [ ] **Contract Documentation:** Complete [`docs/api-contract.md`](file:///e:/projects/ChemoTaste/docs/api-contract.md) with verified response payloads.
* [ ] **Fork It Rule Audit:** Verify hackathon rules regarding pre-compiled datasets vs. code authored during the 24-hour sprint. Ensure all scripts are runnable on-demand.

### Phase 0.2: Days 4–7 (Nov 4 – Nov 7) — Molecular Compilation & Knowledge Base
* [ ] **Curated KB Assembly:** Finalize [`data/ingredient_kb.json`](file:///e:/projects/ChemoTaste/data/ingredient_kb.json) (80 oncology-relevant ingredients with curated tastants, tags, moisture indices, and safety notes).
* [ ] **Pre-Bake Execution:** Write and run [`scripts/prebake.ts`](file:///e:/projects/ChemoTaste/scripts/prebake.ts) to query FlavorDB entity records, compute $\epsilon$-smoothed molecular fractions ($f_k = \frac{N_k}{N_{\text{total}} + 5}$), and percentile-rank them into [`data/precompiled/ingredient_profiles.json`](file:///e:/projects/ChemoTaste/data/precompiled/ingredient_profiles.json).
* [ ] **Snapshot Generation:** Populate `data/cache/` with raw response backups for offline fallback.

### Phase 0.3: Days 8–10 (Nov 8 – Nov 10) — Indian Recipe Corpus & Clinical Validation
* [ ] **Recipe Curation:** Assemble 50 validated recipes from RecipeDB into [`data/curated_recipes.json`](file:///e:/projects/ChemoTaste/data/curated_recipes.json), specifically including Indian oncology staples:
  * Moong dal khichdi (soft, high-protein, easily digestible).
  * Curd rice (cooling, probiotic, high-zinc, soothing).
  * Fresh chhena / paneer purée (high protein density, zero pungency).
  * Lauki / turai stew (ultra-high moisture, mucosal soothing).
* [ ] **Metadata Tagging:** Ensure every curated recipe contains clean ingredient arrays, temperature flags (`warm`, `cold`, `room_temp`), moisture indices ($M \ge 0.5$), and protein quantities ($\ge 12\text{g}$).
* [ ] **Clinical Sanity Check:** Review drug profiles, override rules, and cutlery advisories with an oncology nurse or dietitian.

### Phase 0.4: Days 11–12 (Nov 11 – Nov 12) — Scaffolding & CI Release Gates
* [ ] **Next.js Setup:** Initialize `create-next-app@14` with TypeScript, Tailwind CSS, and App Router.
* [ ] **Continuous Deployment:** Push to GitHub, configure Vercel, and verify the production URL is operational.
* [ ] **Automated Test Suite:** Implement [`tests/golden_safety.test.ts`](file:///e:/projects/ChemoTaste/tests/golden_safety.test.ts) with Vitest. Confirm all clinical conflict, moisture index, and cycle phase tests pass locally and in GitHub Actions.
* [ ] **Citation Verification:** Audit every PMID and clinical reference in [`IMPLEMENTATION.md`](file:///e:/projects/ChemoTaste/IMPLEMENTATION.md) and [`README.md`](file:///e:/projects/ChemoTaste/README.md).

### Phase 0.5: Day 13 (Nov 13) — Rehearsal & Freeze
* [ ] **Dry Run:** Execute the full 90-second demo script using the static fixtures.
* [ ] **Offline Verification:** Disconnect all internet/hotspot connections and verify that `?demo=true` completes the full user journey without console errors.
* [ ] **Hardware & Sleep:** Verify presentation laptop HDMI outputs, charger cables, and ensure team is well-rested before the 09:00 IST start.

---

## 3. 24-Hour Master Sprint Schedule (Nov 14, 09:00 → Nov 15, 09:00)

```
09:00       10:00                13:00             15:00                18:00             23:00                03:00             06:00       08:00 09:00
┌───────────┬────────────────────┬─────────────────┬────────────────────┬─────────────────┬────────────────────┬─────────────────┬───────────┬─────┐
│ H0–H1     │ H1–H4              │ H4–H6           │ H6–H9              │ H9–H14          │ H14–H18            │ H18–H21         │ H21–H23   │ H24 │
│ Setup &   │ Safety & Algorithm │ API & Proxy     │ Pipeline & GAIN    │ Core UI & Radar │ Full Integration   │ Polish & Demo   │ Rehearsal │ END │
│ Baseline  │ (Zero Network)     │ Hardening       │ Calibration        │ Components      │ & Modals           │ Offline Freeze  │ & Polish  │     │
└───────────┴────────────────────┴─────────────────┴────────────────────┴─────────────────┴────────────────────┴─────────────────┴───────────┴─────┘
```

### [H 00:00 – 01:00] Sprint Kickoff & Staging Baseline
* Clone repository and install dependencies (`p-limit`, `zod`, `recharts@2.10.1`, `vitest`).
* Drop in pre-verified data files (`drugProfiles.json`, `ingredient_kb.json`, `curated_recipes.json`).
* Verify baseline Vercel deployment with green build.

### [H 01:00 – 04:00] Core Safety & Algorithm Engine (Zero Network)
* Implement [`lib/types.ts`](file:///e:/projects/ChemoTaste/lib/types.ts) and [`lib/safety.ts`](file:///e:/projects/ChemoTaste/lib/safety.ts) with cycle phase support (`acute_1_3`, `nadir_4_8`, `recovery_9_21`).
* Implement [`lib/resolveIngredient.ts`](file:///e:/projects/ChemoTaste/lib/resolveIngredient.ts) with `NON_VEG_PATTERNS` regex and base matching.
* Implement [`lib/algorithm.ts`](file:///e:/projects/ChemoTaste/lib/algorithm.ts) (affinity density formula, moisture index penalty, protein floor, and shrinkage recipe denominator).
* Run `npm test` to verify [`tests/golden_safety.test.ts`](file:///e:/projects/ChemoTaste/tests/golden_safety.test.ts).

### [H 04:00 – 06:00] Hardened API Proxy & Client Wrappers
* Implement [`app/api/proxy/route.ts`](file:///e:/projects/ChemoTaste/app/api/proxy/route.ts) with regex allow-lists, 8-second timeouts, and server-side secret handling.
* Implement [`lib/apiClient.ts`](file:///e:/projects/ChemoTaste/lib/apiClient.ts) using `p-limit(3)`.
* Wire [`lib/flavordbClient.ts`](file:///e:/projects/ChemoTaste/lib/flavordbClient.ts) and [`lib/recipedbClient.ts`](file:///e:/projects/ChemoTaste/lib/recipedbClient.ts).
* Fallback Gate: If academic API throws 502/429, immediately point clients to local JSON caches.

### [H 06:00 – 09:00] Pipeline Calibration & Data Integration
* Implement `getRecommendations(drugIds, context)` in `lib/algorithm.ts`.
* Calibrate calibration parameter `GAIN = 2.0` so top curated recipes for Cisplatin, Oxaliplatin, and FOLFOX land between 75 and 90, with poor fits below 50.
* Verify that Moong Dal Khichdi and Curd Rice score $\ge 85$ for Nadir phase mucosal care.

### [H 09:00 – 14:00] Core UI & Sensory Shift Radar
* Build `DrugSelector.tsx` with drug class badges, regimen presets, and the 3-Phase Cycle Selector (Acute $\rightarrow$ Nadir $\rightarrow$ Recovery).
* Build [`components/SensoryShiftRadar.tsx`](file:///e:/projects/ChemoTaste/components/SensoryShiftRadar.tsx) with 3 overlays (Healthy, Damaged, Masked) and verified sensory math ($S=0.69$).
* Build `IngredientFilterPanel.tsx` with "Included" (green) and "Blocked" (red) tabs, displaying clinical reasons.
* Build `RecipeCard.tsx` with circular Taste-Safe Score gauge, cutlery advisory ("Bamboo/Ceramic only"), and pre-meal rinse callout.

### [H 14:00 – 18:00] Full Integration & Clinical Modals
* Connect `/page.tsx` selection to `/results/page.tsx`.
* Implement `ClinicalWarningBanner.tsx` displaying active P1 overrides and hydration/moisture alerts.
* Implement `ScienceBehindEveryBite.tsx` modal: on ingredient click, fetch chemical details and explain the lipid peroxidation / chelation mechanism.
* Implement `SubstitutionCard.tsx` displaying calculated taste, aroma, and protein deltas for excluded items.
* Implement loading skeletons and error boundaries.

### [H 18:00 – 21:00] Polish, Responsiveness & Offline Freeze
* Implement `?demo=true` query parameter to bypass all network calls and serve curated fixtures.
* Add `DataSourceChip.tsx` in UI footer ("Data Mode: Static Cache / Live API").
* Verify mobile viewport responsiveness on iOS and Android devices.
* Add medical disclaimer: *"Not medical advice — discuss dietary changes with your oncology team."*

### [H 21:00 – 23:00] Rehearsal & Pitch Timing Drills
* Rehearse the pitch script 5 times with stopwatches.
* Verify that switching to FOLFOX and activating "Nadir Phase (Mouth Sores)" triggers the arbitration moment in under 15 seconds.
* Test screen mirroring, resolution scaling, and projector readability.

### [H 23:00 – 24:00] Code Freeze & Final Deployment
* Run final `npm test` and `git status`.
* Trigger final Vercel production deployment.
* Verify live URL on mobile phone hotspot.

---

## 4. Team RACI Responsibility Matrix

| Team Member Role | Primary Responsibilities | Direct Artifacts |
|---|---|---|
| **Clinical Safety & Algorithm Lead** | Clinical override logic, scoring math, unit testing, algorithm calibration | `lib/safety.ts`, `lib/algorithm.ts`, `tests/golden_safety.test.ts` |
| **Frontend & UI/UX Lead** | Sensory radar chart, component styling, responsive layout, loading states | `components/SensoryShiftRadar.tsx`, `components/RecipeCard.tsx`, `app/results/page.tsx` |
| **API & Data Pipeline Lead** | Next.js CORS proxy, rate-limiting, pre-compilation scripts, RecipeDB queries | `app/api/proxy/route.ts`, `lib/apiClient.ts`, `scripts/prebake.ts` |
| **Pitch & Product Lead** | Slide deck, demo persona execution, clinical framing, evaluation defense | Presentation deck, 90-second demo script, documentation audit |

---

## 5. Contingency Protocols (Failure Modes & Mitigations)

| Failure Mode | Likelihood | Impact | Immediate Mitigation Protocol |
|---|---|---|---|
| **CoSy Lab API 502/504 Outage** | High | Severe | The app automatically defaults to pre-compiled `data/curated_recipes.json` and `ingredient_profiles.json`. Pass `?demo=true` to skip network calls entirely. |
| **Academic Server 429 Rate Limit** | High | Severe | Next.js API proxy catches 429 status and returns `{ fallback: true }`. Client resolves from local memory cache with zero UI interruption. |
| **Wi-Fi Loss on Stage** | Medium | Fatal | The presentation is conducted locally on `localhost:3000?demo=true`. The entire knowledge base and scoring engine run in-browser. |
| **Judges Challenge FlavorDB Usage** | High | High | Explain that FlavorDB compiles volatile aroma descriptors from Fenaroli/Flavornet, used for nausea and lipid peroxidation aldehyde suppression, while non-volatile tastants are mapped via the clinical KB. |
| **Judges Question Sweet Sensitivity Math** | Medium | Medium | Demonstrate that sensitivity is the reciprocal of threshold: $S = 1 / 1.45 \approx 0.69$. A 45% threshold rise does not mean 45% sensitivity. |

---

## 6. The Winning 90-Second Demo Script

* **[00:00 – 00:20] The Clinical Problem & Lipid Peroxidation:**
  > *"80% of cancer patients suffer from chemotherapy-altered taste and smell. Food tastes metallic, bitter, or repulsive, leading to severe malnutrition that causes up to 30% of cancer deaths. The metallic phantom isn't just on the tongue—chemo drugs in saliva trigger **lipid peroxidation**, generating volatile aldehydes that hit the olfactory bulb retronasally. ChemoTaste solves this by treating sensory changes through two distinct channels: **FlavorDB volatile aroma descriptors** to eliminate nausea and metallic aldehydes, and **clinical oncology kinetics** to modulate tongue tastants."*

* **[00:20 – 00:45] Persona 1: Cisplatin (The Metallic Challenge):**
  > *(Select Cisplatin on screen)*  
  > *"Here is a patient on Cisplatin. The Sensory Shift Radar shows sweet perception reduced to 69% and a severe metallic phantom. The engine promotes tart citric marinades and cooked umami to chelate salivary metal ions. Notice the Taste-Safe Score: 88/100, with full ingredient transparency, plus our physical advisory: eat with bamboo cutlery to stop electrochemical metallic amplification."*

* **[00:45 – 01:10] The Arbitration Climax: Switch to FOLFOX & Nadir Phase:**
  > *(Switch to FOLFOX preset and select 'Nadir Phase: Days 4–8 with Mouth Sores')*  
  > *"Now watch what happens when we switch to FOLFOX (Oxaliplatin + 5-FU) in the Nadir phase. A naive app would still suggest lemon water for metallic taste, causing agonizing pain on mucosal ulcers. ChemoTaste's clinical engine triggers a **P1 Override**: acid masking is immediately disabled, cold dishes are hard-blocked to prevent oxaliplatin vocal cord spasms, and our Moisture Index penalizes dry foods. Chilled gazpacho drops into the 'Blocked' tab with full clinical reasoning."*

* **[01:10 – 01:30] Indian Computational Gastronomy & Anabolic Recovery:**
  > *(Showcase Moong Dal Khichdi and Curd Rice)*  
  > *"Instead of bland Western oatmeal, ChemoTaste surfaces native Indian therapeutic staples: Moong Dal Khichdi and Curd Rice—soothing, high-moisture, and providing 14g of protein to protect against cancer cachexia. Our Golden Safety Test Suite enforces these clinical rules in continuous integration. ChemoTaste transforms mealtime from a clinical ordeal into restorative nourishment. Thank you."*

---

## 7. Operational Readiness Checklist

- [x] Master specification updated with lipid peroxidation, moisture index, and cachexia guardrails ([`IMPLEMENTATION.md`](file:///e:/projects/ChemoTaste/IMPLEMENTATION.md)).
- [x] Agent instructions and personas created ([`AGENT.md`](file:///e:/projects/ChemoTaste/AGENT.md)).
- [x] Architectural memory enriched with ADR-001 through ADR-014 ([`MEMORY.md`](file:///e:/projects/ChemoTaste/MEMORY.md)).
- [x] Foodoscope API contract established ([`docs/api-contract.md`](file:///e:/projects/ChemoTaste/docs/api-contract.md)).
- [x] Repository README generated with quickstart guide ([`README.md`](file:///e:/projects/ChemoTaste/README.md)).
- [x] Detailed 24-hour hackathon execution plan committed ([`PLAN.md`](file:///e:/projects/ChemoTaste/PLAN.md)).
