// app/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { ParticleConstellation } from '../components/ParticleConstellation';
import { DrugSelector } from '../components/DrugSelector';
import { ClinicalWarningBanner } from '../components/ClinicalWarningBanner';
import { SensoryShiftRadar } from '../components/SensoryShiftRadar';
import { IngredientFilterPanel } from '../components/IngredientFilterPanel';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeModal } from '../components/RecipeModal';
import { SubstitutionCard } from '../components/SubstitutionCard';
import { ScienceModal } from '../components/ScienceModal';
import { ProvenanceChip } from '../components/ProvenanceChip';

import { getRecommendations } from '../lib/dataService';
import { recipedbClient } from '../lib/recipedbClient';
import { UserContext, ScoredRecipe, RawRecipe } from '../lib/types';
import { PRESET_REGIMENS } from '../data/drugProfiles';
import { Search, ArrowDown, Database, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function Home() {
  // State for drug selection and patient context
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>(['cisplatin']);
  const [context, setContext] = useState<UserContext>({
    mouthSoresToday: false,
    dryMouthToday: false,
    vegetarian: false,
    diabetic: false,
    allergens: [],
    toleratesRedMeat: false,
    cyclePhase: 'acute_1_3',
    symptoms: {
      metallic: 2,
      bitter: 2,
      nausea: 2,
    },
  });

  // Modal states
  const [activeModalRecipe, setActiveModalRecipe] = useState<ScoredRecipe | null>(null);
  const [isScienceOpen, setIsScienceOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);

  // Filter states for recipe discovery
  const [recipeSearch, setRecipeSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [bandFilter, setBandFilter] = useState<'all' | 'recommended' | 'excluded'>('all');

  // Live Gateway Query state
  const [liveQuery, setLiveQuery] = useState('');
  const [isLiveQuerying, setIsLiveQuerying] = useState(false);
  const [liveNotice, setLiveNotice] = useState<string | null>(null);
  const [extraRecipes, setExtraRecipes] = useState<RawRecipe[]>([]);
  const [isLiveApiActive, setIsLiveApiActive] = useState(false);

  // Compute recommendations pipeline on state changes
  const recommendation = useMemo(() => {
    return getRecommendations(selectedDrugs, context, extraRecipes, !isLiveApiActive);
  }, [selectedDrugs, context, extraRecipes, isLiveApiActive]);

  const handleToggleDrug = (drugId: string) => {
    setSelectedDrugs(prev => {
      if (prev.includes(drugId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(id => id !== drugId);
      }
      return [...prev, drugId];
    });
  };

  const handleSelectPreset = (presetKey: string) => {
    const preset = PRESET_REGIMENS[presetKey];
    if (preset) {
      setSelectedDrugs(preset.drugIds);
      if (presetKey === 'folfox') {
        setContext(prev => ({ ...prev, cyclePhase: 'nadir_4_8', mouthSoresToday: true }));
      }
    }
  };

  const handleQueryLiveRecipeDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveQuery.trim()) return;

    setIsLiveQuerying(true);
    setLiveNotice(null);

    try {
      const res = await recipedbClient.searchByTitle(liveQuery.trim());
      if (res && res.length > 0) {
        setExtraRecipes(prev => [...res, ...prev]);
        setIsLiveApiActive(true);
        setLiveNotice(`Retrieved and clinically evaluated ${res.length} live recipes from RecipeDB gateway.`);
      } else {
        setLiveNotice(`No live recipes returned for "${liveQuery}". Maintained verified curated corpus.`);
      }
    } catch (err: any) {
      setLiveNotice(`Gateway note: ${err?.message ?? 'Live API unreachable'}. Operating in verified offline fallback mode.`);
      setIsLiveApiActive(false);
    } finally {
      setIsLiveQuerying(false);
    }
  };

  // Filter recipes based on UI controls
  const filteredRecipes = useMemo(() => {
    return recommendation.scoredRecipes.filter(r => {
      const matchesSearch =
        r.title.toLowerCase().includes(recipeSearch.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(recipeSearch.toLowerCase()) ||
        r.ingredients.some(i => i.toLowerCase().includes(recipeSearch.toLowerCase()));

      const matchesCuisine =
        cuisineFilter === 'all' || r.cuisine.toLowerCase() === cuisineFilter.toLowerCase();

      const matchesBand =
        bandFilter === 'all'
          ? true
          : bandFilter === 'recommended'
          ? !r.excluded && r.taste_safe_score >= 55
          : r.excluded;

      return matchesSearch && matchesCuisine && matchesBand;
    });
  }, [recommendation.scoredRecipes, recipeSearch, cuisineFilter, bandFilter]);

  const uniqueCuisines = useMemo(() => {
    const list = Array.from(new Set(recommendation.scoredRecipes.map(r => r.cuisine)));
    return ['all', ...list];
  }, [recommendation.scoredRecipes]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-[#8052ff] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isScienceOpen={isScienceOpen}
        onStartIntake={() => {
          document.getElementById('intake')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenScience={() => {
          setSelectedIngredient(null);
          setIsScienceOpen(true);
        }}
      />

      {/* Hero Section: Dala Two-Column Dark-Stage Asymmetric Split */}
      <section
        id="hero"
        className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
      >
        {/* Left Column: Monolithic Editorial Typography on Void */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-block text-xs uppercase tracking-[0.35px] text-[#ffb829] font-semibold">
            COMPUTATIONAL GASTRONOMY FOR ONCOLOGY SUPPORTIVE CARE
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-[78px] font-normal tracking-[-3.12px] leading-[0.95] text-white">
            Taste restored.
            <br />
            <span className="text-[#8052ff]">Safety assured.</span>
          </h1>

          <p className="text-lg font-extralight text-silver-mist leading-relaxed max-w-[520px]">
            Chemotherapy damages progenitor taste cells, elevates sweet thresholds by ~45%, and turns salivary lipids into metallic phantoms. ChemoTaste computationally models FlavorDB volatile aroma profiles with RecipeDB to deliver perception-restoring meals — strictly governed by clinical oncology safety gates.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                document.getElementById('intake')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#8052ff] hover:bg-[#6d3cf5] text-white text-xs uppercase tracking-[0.025em] font-semibold px-6 py-4 rounded-full transition-all duration-200 shadow-[0_0_25px_rgba(128,82,255,0.45)] hover:shadow-[0_0_35px_rgba(128,82,255,0.7)] flex items-center gap-2"
            >
              <span>Personalize Intake Profile</span>
              <ArrowDown className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setSelectedIngredient(null);
                setIsScienceOpen(true);
              }}
              className="px-5 py-4 text-xs uppercase tracking-[0.025em] font-medium text-silver-mist hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-full"
            >
              Inspect Primary Proofs
            </button>
          </div>

          {/* Quick Scientific Metric Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 text-xs">
            <div>
              <div className="text-[#ffb829] font-medium text-sm">S = 0.69</div>
              <div className="text-silver-mist font-extralight text-[11px] mt-0.5">
                Sweet Sensitivity Reciprocal
              </div>
            </div>
            <div>
              <div className="text-teal-300 font-medium text-sm">P0 → P3</div>
              <div className="text-silver-mist font-extralight text-[11px] mt-0.5">
                Clinical Hierarchy
              </div>
            </div>
            <div>
              <div className="text-[#8052ff] font-medium text-sm">Block &gt; Boost</div>
              <div className="text-silver-mist font-extralight text-[11px] mt-0.5">
                Deterministic Precedence
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Signature Multicolored Particle Constellation */}
        <div className="lg:col-span-5 h-[420px] sm:h-[480px] w-full relative">
          <ParticleConstellation />
          <div className="absolute bottom-4 right-4 bg-black/60 border border-white/10 px-3 py-1.5 rounded-full text-[10px] text-silver-mist backdrop-blur-md">
            Interactive Dual-Hemisphere Sensory Receptors
          </div>
        </div>
      </section>

      {/* Main Interactive Application Container */}
      <main className="flex-1 max-w-[1280px] mx-auto px-6 w-full space-y-16">
        {/* Section 1: Patient Intake & Treatment Profile */}
        <section id="intake" className="scroll-mt-24 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
              Step 1: Patient Context
            </span>
            <h2 className="text-3xl font-normal tracking-[-0.03em] text-white mt-1">
              Chemotherapy Regimen & Symptom Intake
            </h2>
            <p className="text-sm font-extralight text-silver-mist mt-1">
              Select active medications and current symptom presentation to configure deterministic safety constraints and sensory weightings.
            </p>
          </div>

          <DrugSelector
            selectedDrugs={selectedDrugs}
            onToggleDrug={handleToggleDrug}
            onSelectPreset={handleSelectPreset}
            context={context}
            onUpdateContext={setContext}
          />
        </section>

        {/* Section 2: Active Clinical Warnings */}
        <section>
          <ClinicalWarningBanner
            profile={recommendation.effectiveProfile}
            context={context}
            constraints={recommendation.constraints}
          />
        </section>

        {/* Section 3: Sensory Shift Radar Model */}
        <section id="sensory-radar" className="scroll-mt-24">
          <SensoryShiftRadar
            profile={recommendation.effectiveProfile}
            radarData={recommendation.radarData}
          />
        </section>

        {/* Section 4: Ingredient Intelligence Panel */}
        <section id="ingredients" className="scroll-mt-24">
          <IngredientFilterPanel
            included={recommendation.includedIngredients}
            blocked={recommendation.blockedIngredients}
            onSelectIngredient={(name) => {
              setSelectedIngredient(name);
              setIsScienceOpen(true);
            }}
          />
        </section>

        {/* Section 5: Molecular Substitutions Matrix */}
        <section>
          <SubstitutionCard substitutions={recommendation.substitutions} />
        </section>

        {/* Section 6: Personalized Recipe Discovery */}
        <section id="recipes" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
                Step 2: Culinary Discovery
              </span>
              <h2 className="text-3xl font-normal tracking-[-0.03em] text-white mt-1">
                Personalized Recipe Recommendations
              </h2>
              <p className="text-sm font-extralight text-silver-mist mt-1">
                Ranked by Taste-Safe Score (0–100) using Bayesian shrinkage, moisture lubrication indices, and cachexia protein guardrails.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-silver-mist" />
                <input
                  type="text"
                  placeholder="Filter local recipes..."
                  value={recipeSearch}
                  onChange={e => setRecipeSearch(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-full pl-8 pr-4 py-1.5 text-xs text-white placeholder-silver-mist focus:outline-none focus:border-[#8052ff] w-40 sm:w-48"
                />
              </div>

              {/* Cuisine Filter */}
              <select
                value={cuisineFilter}
                onChange={e => setCuisineFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8052ff] cursor-pointer"
              >
                {uniqueCuisines.map(c => (
                  <option key={c} value={c} className="bg-black text-white">
                    {c === 'all' ? 'All Cuisines' : `${c} Cuisine`}
                  </option>
                ))}
              </select>

              {/* Band Filter */}
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10 text-xs">
                <button
                  onClick={() => setBandFilter('all')}
                  className={`px-3 py-1 rounded-full transition-all ${
                    bandFilter === 'all' ? 'bg-white/20 text-white' : 'text-silver-mist hover:text-white'
                  }`}
                >
                  All ({recommendation.scoredRecipes.length})
                </button>
                <button
                  onClick={() => setBandFilter('recommended')}
                  className={`px-3 py-1 rounded-full transition-all ${
                    bandFilter === 'recommended'
                      ? 'bg-[#15846e] text-white'
                      : 'text-silver-mist hover:text-white'
                  }`}
                >
                  Safe &ge;55
                </button>
                <button
                  onClick={() => setBandFilter('excluded')}
                  className={`px-3 py-1 rounded-full transition-all ${
                    bandFilter === 'excluded'
                      ? 'bg-red-800 text-white'
                      : 'text-silver-mist hover:text-white'
                  }`}
                >
                  Blocked
                </button>
              </div>
            </div>
          </div>

          {/* Live CoSy Lab RecipeDB Search Bar */}
          <form
            onSubmit={handleQueryLiveRecipeDB}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10"
          >
            <div className="flex items-center gap-2 text-xs text-teal-300 font-medium whitespace-nowrap">
              <Database className="w-4 h-4 text-[#8052ff]" />
              <span>Query Live RecipeDB:</span>
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search dish title in RecipeDB (e.g., 'miso soup', 'khichdi', 'lentil')..."
                value={liveQuery}
                onChange={e => setLiveQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-silver-mist focus:outline-none focus:border-[#8052ff]"
              />
            </div>
            <button
              type="submit"
              disabled={isLiveQuerying}
              className="px-5 py-2 rounded-full text-xs uppercase tracking-wider font-semibold bg-[#8052ff] hover:bg-[#6d3cf5] text-white disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              {isLiveQuerying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Fetch & Score</span>
            </button>
          </form>

          {/* Live API Notice Banner */}
          {liveNotice && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-xs text-silver-mist flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#ffb829] flex-shrink-0 mt-0.5" />
              <span>{liveNotice}</span>
            </div>
          )}

          {/* Recipes Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onOpenDetails={setActiveModalRecipe}
              />
            ))}
            {filteredRecipes.length === 0 && (
              <div className="col-span-full py-16 text-center text-silver-mist text-sm">
                No recipes matched your search and filter criteria.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Recipe Detail Modal */}
      <RecipeModal
        recipe={activeModalRecipe}
        onClose={() => setActiveModalRecipe(null)}
        onSelectIngredient={(name) => {
          setSelectedIngredient(name);
          setIsScienceOpen(true);
        }}
      />

      {/* Science & Proofs Modal */}
      <ScienceModal
        isOpen={isScienceOpen}
        onClose={() => {
          setIsScienceOpen(false);
          setSelectedIngredient(null);
        }}
        selectedIngredient={selectedIngredient}
      />

      {/* Provenance & Medical Disclaimer Footer */}
      <ProvenanceChip
        mode={recommendation.provenance.mode}
        recipeCount={recommendation.provenance.recipeCount}
        profiledCount={recommendation.provenance.profiledCount}
      />
    </div>
  );
}
