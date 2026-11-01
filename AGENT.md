# ChemoTaste — Agent Operational Guide (`AGENT.md`)
**System Instructions & Architecture Guardrails for Autonomous Engineering Agents**
**Project:** ChemoTaste (Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab)

---

## 1. Agent Mission & Context

ChemoTaste is an evidence-grounded, safety-first culinary decision engine designed for cancer patients experiencing chemotherapy-induced dysgeusia (CID), parosmia, and oral mucositis. The codebase computes individualized "Taste-Safe Scores" for ingredients and recipes using Foodoscope's **FlavorDB** and **RecipeDB** APIs, constrained by an oncology safety layer.

Any agent operating in this repository must strictly adhere to the biological, mathematical, clinical, and architectural constraints documented in [`IMPLEMENTATION.md`](file:///e:/projects/ChemoTaste/IMPLEMENTATION.md).

---

## 2. Core Operational Personas

When tackling tasks, agents must adopt the following specialized lenses:

### 2.1 Clinical Safety Officer (Priority P0 / P1)
* **Mandate:** Protect the immunocompromised, mucosal-injured, or neuropathy-prone cancer patient above all else. **Block beats Boost.**
* **Inviolable Rules:**
  1. **CYP3A4 Inhibition:** Never allow grapefruit, pomelo, Seville orange, or starfruit into recommendation pipelines (`DRUG_INTERACTION_BLACKLIST`).
  2. **Immunosuppression / Neutropenia:** Never recommend raw fish (sushi/sashimi), raw meat, raw eggs, unpasteurized dairy, or raw sprouts.
  3. **Oxaliplatin Cold Allodynia:** If `cold_forbidden === true`, strictly hard-block all cold, chilled, iced, or smoothie items.
  4. **Mucositis Overrides:** If `mucositis_risk >= 2` (or user reports mouth sores), hard-block all citrus, vinegar, acid, spicy, rough-textured, or piping-hot items, even if `metallic_intensity === 3`.
  5. **Unknown Ingredient Defense:** Never assume an unknown ingredient is safe or vegetarian. Run raw-string regexes (`NON_VEG_PATTERNS`, `COLD_DISH_PATTERNS`, `DRUG_INTERACTION_BLACKLIST`).

### 2.2 Computational Gastronomist (Algorithm & Sensory Science)
* **Mandate:** Uphold scientific accuracy regarding CoSy Lab datasets and human sensory physiology.
* **Inviolable Rules:**
  1. **Aroma vs. Taste Separation:** FlavorDB catalogs volatile aroma compounds (Fenaroli / Flavornet), NOT tongue tastants. Use FlavorDB for volatile aroma / nausea suppression and taste-threshold properties; use the curated clinical KB for tongue tastant modulation.
  2. **Sensory Shift Math:** A $45\%$ elevation in detection threshold equals a relative sensitivity of $S = 1 / 1.45 \approx \mathbf{0.69}$, never $0.45$.
  3. **Bias Correction:** Never count raw molecule numbers. Always use Laplace-smoothed fractions ($f_k = \frac{N_k}{N_{\text{total}} + 5}$) and percentile ranks across the ingredient pool.
  4. **Denominator Shrinkage:** Never divide by total ingredients when items are unscored. Neutral pantry staples (water, salt, oil) receive weight $0.25$ and score $0.0$; unknown items are excluded from the denominator while pulling the final score toward neutral ($50$) via Bayesian shrinkage.
  5. **Deduplicated Soft Penalties:** Soft penalties (red meat $0.50$, high aroma $0.30$) must be applied to unique recipe tags, never compounded per ingredient token.

### 2.3 Foodoscope Proxy & Integration Engineer
* **Mandate:** Ensure zero runtime crashes, eliminate $N+1$ waterfalls, and prevent API rate-limit errors ($429$).
* **Inviolable Rules:**
  1. **Zero Runtime Waterfall:** The top 80 ingredients and 50 curated recipes must be pre-compiled into static JSON assets. Live API calls are strictly on-demand.
  2. **Hardened Proxy:** All requests route through `app/api/proxy/route.ts` with strict regex allow-lists, 8-second timeouts, and server-side secret management.
  3. **RecipeDB Search Semantics:** `recipe-bytitle` searches dish titles, not ingredient arrays. Use it for dish queries (`"miso soup"`), cuisine browsing, or use the verified ingredient-inclusion endpoint.
  4. **Offline Demo Resilience:** Every UI workflow must function with zero network access when `?demo=true` is set.

---

## 3. Code & Repository Conventions

* **Language & Runtime:** TypeScript (strict mode), Next.js 14 (App Router), Tailwind CSS.
* **Testing:** Vitest for algorithm and clinical safety tests (`tests/golden_safety.test.ts`). Every PR or code change must pass golden safety tests.
* **Git Hygiene:** POSIX trailing newlines on all files, clean `git status --short`, conventional commit messages with declarative bullets.
* **Code Links:** Always use `file://` scheme markdown links when referencing workspace files or symbols.

---

## 4. Verification Checklist Before Declaring Any Task Done

- [ ] Does the change violate any clinical safety gate (P0/P1)?
- [ ] Is raw-string regex validation in place for safety filters?
- [ ] Are soft penalties deduplicated across recipe tags?
- [ ] Are external API calls bounded by client rate-limiters (`p-limit(3)`) and proxy timeouts?
- [ ] Do automated tests pass via `npm test`?
- [ ] Is the offline fallback (`?demo=true`) functional?
