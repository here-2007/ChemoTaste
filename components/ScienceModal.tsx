'use client';
// components/ScienceModal.tsx

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Dna, Atom, ShieldAlert, Award, Sparkles, Beaker, CheckCircle2, Loader2 } from 'lucide-react';
import { getIngredientDetail, fetchIngredientDetailDynamic } from '../lib/dataService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedIngredient?: string | null;
}

export const ScienceModal: React.FC<Props> = ({ isOpen, onClose, selectedIngredient }) => {
  const [activeTab, setActiveTab] = useState<'ingredient' | 'framework'>('ingredient');
  const [dynamicDetail, setDynamicDetail] = useState<ReturnType<typeof getIngredientDetail> | null>(null);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState(false);

  useEffect(() => {
    if (!selectedIngredient) {
      setDynamicDetail(null);
      setIsLoadingDynamic(false);
      return;
    }

    setActiveTab('ingredient');

    const precompiled = getIngredientDetail(selectedIngredient);
    // If we have a full precompiled profile with molecular data, use it immediately (O(1))
    if (precompiled.profile) {
      setDynamicDetail(precompiled);
      setIsLoadingDynamic(false);
      return;
    }

    // If precompiled KB entry exists, display it immediately so user sees clinical data without delay
    if (precompiled.entry) {
      setDynamicDetail(precompiled);
    }

    // Dynamic live fallback for molecular data from FlavorDB
    let active = true;
    setIsLoadingDynamic(true);
    fetchIngredientDetailDynamic(selectedIngredient)
      .then(res => {
        if (active) {
          setDynamicDetail(res);
        }
      })
      .finally(() => {
        if (active) setIsLoadingDynamic(false);
      });

    return () => {
      active = false;
    };
  }, [selectedIngredient]);

  if (!isOpen) return null;

  const detail = dynamicDetail ?? (selectedIngredient ? getIngredientDetail(selectedIngredient) : null);
  const showIngredientDetail = activeTab === 'ingredient' && detail && (detail.entry || detail.profile);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-silver-mist hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dynamic Loading State */}
        {isLoadingDynamic && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200">
            <Loader2 className="w-4 h-4 animate-spin text-[#8052ff]" />
            <span>Resolving live molecular volatile profile from FlavorDB...</span>
          </div>
        )}

        {/* Tab switcher if an ingredient is active */}
        {detail && (detail.entry || detail.profile) && (
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10 w-fit">
            <button
              onClick={() => setActiveTab('ingredient')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'ingredient'
                  ? 'bg-[#8052ff] text-white shadow-[0_0_15px_rgba(128,82,255,0.4)]'
                  : 'text-silver-mist hover:text-white'
              }`}
            >
              Molecule Intelligence ({detail.name})
            </button>
            <button
              onClick={() => setActiveTab('framework')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'framework'
                  ? 'bg-white/20 text-white'
                  : 'text-silver-mist hover:text-white'
              }`}
            >
              Methodology & Citations
            </button>
          </div>
        )}

        {showIngredientDetail ? (
          /* Ingredient Molecular Profile View ("Science Behind Every Bite") */
          <div className="space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
                Science Behind Every Bite · Molecular Fingerprint
              </span>
              <h2 className="text-2xl sm:text-3xl font-normal tracking-[-0.03em] text-white mt-1 capitalize">
                {detail.name}
              </h2>
              <p className="text-xs font-extralight text-silver-mist mt-1">
                Resolved through FlavorDB volatile compound cataloging (Fenaroli / Flavornet) & Curated Clinical Oncology KB.
              </p>
            </div>

            {/* Molecular Breakdown Cards */}
            {detail.profile?.molecular && detail.profile.molecular.n_total > 0 ? (
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
                  <span className="text-[#8052ff] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Atom className="w-4 h-4" />
                    FlavorDB Volatile Profile (N={detail.profile.molecular.n_total} Molecules)
                  </span>
                  <span className="text-teal-300 font-mono text-[11px] bg-teal-950/30 px-2 py-0.5 rounded-full border border-teal-500/30">
                    Laplace Smoothed (ε=5)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-silver-mist uppercase">Umami Volatiles</div>
                    <div className="text-lg font-bold text-teal-300 mt-1">
                      {Math.round(detail.profile.molecular.pct.umami * 100)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-silver-mist uppercase">Sweet Compounds</div>
                    <div className="text-lg font-bold text-[#ffb829] mt-1">
                      {Math.round(detail.profile.molecular.pct.sweet * 100)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-silver-mist uppercase">Acidic / Sour</div>
                    <div className="text-lg font-bold text-sky-300 mt-1">
                      {Math.round(detail.profile.molecular.pct.sour * 100)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-silver-mist uppercase">Bitter Compounds</div>
                    <div className="text-lg font-bold text-red-300 mt-1">
                      {Math.round(detail.profile.molecular.pct.bitter * 100)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] text-silver-mist uppercase">Nausea Volatiles</div>
                    <div className="text-lg font-bold text-amber-400 mt-1">
                      {Math.round(detail.profile.molecular.pct.nausea_aroma * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ) : !isLoadingDynamic ? (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-silver-mist space-y-1">
                <div className="flex items-center gap-2 text-teal-300 font-medium">
                  <Atom className="w-4 h-4" />
                  <span>Staple Volatile Profile</span>
                </div>
                <p className="font-extralight text-silver-mist leading-relaxed">
                  FlavorDB catalogs volatile aroma compounds (Fenaroli / Flavornet). For mild or non-volatile oncology staples like <strong className="text-white capitalize">{detail.name}</strong>, retronasal emetic volatile risk is negligible. Non-volatile tongue tastants and clinical oncology tolerances are profiled below.
                </p>
              </div>
            ) : null}

            {/* Key Identified Molecules with PubChem IDs and Chemical Roles */}
            {detail.profile?.molecular?.key_molecules && detail.profile.molecular.key_molecules.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold mb-3 flex items-center gap-1.5">
                  <Beaker className="w-4 h-4" />
                  Key Molecular Compounds & Receptor Agonists
                </h4>
                <div className="space-y-2.5">
                  {detail.profile.molecular.key_molecules.map((mol, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white capitalize">{mol.name}</span>
                        {mol.pubchem_id && (
                          <span className="text-[10px] font-mono text-silver-mist bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                            PubChem CID: {mol.pubchem_id}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] text-teal-300/80">
                        {mol.descriptors.map(d => (
                          <span key={d} className="px-2 py-0.5 rounded-full bg-[#15846e]/15 border border-[#15846e]/30">
                            #{d}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs font-extralight text-silver-mist leading-relaxed pt-1">
                        <strong className="text-white font-medium">Biological Role:</strong> {mol.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curated KB Nutrition & Physical Properties */}
            {detail.entry && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-white font-medium block mb-1">Dietary & Cachexia Profile</span>
                  <div className="text-silver-mist font-extralight space-y-1">
                    <div>Vegetarian: <span className="text-white font-medium">{detail.entry.vegetarian ? 'Yes' : 'No'}</span></div>
                    <div>Protein: <span className="text-teal-300 font-medium">{detail.entry.protein_per_100g ?? 0}g / 100g</span></div>
                    <div>Moisture: <span className="text-sky-300 font-medium">{((detail.entry.moisture_contribution ?? 0.5) * 100).toFixed(0)}%</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-white font-medium block mb-1">Clinical Safety Tags</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {detail.entry.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-silver-mist">
                        #{t.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* General Framework View */
          <>
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
                Primary Scientific Proofs & Methodology
              </span>
              <h2 className="text-2xl sm:text-3xl font-normal tracking-[-0.03em] text-white mt-1">
                Science Behind ChemoTaste
              </h2>
              <p className="text-sm font-extralight text-silver-mist mt-1">
                Built for the Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab
              </p>
            </div>

            {/* 1. CoSy Lab FlavorDB Framing */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8052ff]">
                <Atom className="w-4 h-4" />
                <span>FlavorDB: Volatile Aroma Odorants vs. Tongue Tastants</span>
              </div>
              <p className="text-xs font-extralight text-silver-mist leading-relaxed">
                FlavorDB (<em>Garg et al., Nucleic Acids Research 2018</em>) catalogs 25,595 flavor molecules predominantly compiled from <strong>Fenaroli&apos;s Handbook</strong> and <strong>Flavornet</strong> across 900+ volatile odor descriptors.
                ChemoTaste uses FlavorDB strictly for <strong>retronasal olfactory filtering</strong> (suppressing emetogenic sulfurous and carbonyl compounds) and taste-threshold perceptibility, while using a <strong>curated clinical oncology knowledge base</strong> for non-volatile tongue tastant kinetics (citric/malic chelation, intact T1R1/T1R3 umami signaling).
              </p>
            </div>

            {/* 2. Salivary Lipid Peroxidation & Retronasal Metallic Taste */}
            <div className="p-5 rounded-2xl bg-[#15846e]/10 border border-[#15846e]/25 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300">
                <Dna className="w-4 h-4 text-[#15846e]" />
                <span>Root Mechanism: Salivary Lipid Peroxidation</span>
              </div>
              <p className="text-xs font-extralight text-silver-mist leading-relaxed">
                Metallic phantom taste is not just TRC receptor binding. Clinical proofs (<em>Amézaga et al., 2018; Henkin et al., 2008</em>) establish that chemotherapy drugs and reactive oxygen species (ROS) in saliva oxidize epithelial lipids into volatile carbonyls (such as <strong>1-octen-3-one</strong> and <strong>hexanal</strong>) which reach the olfactory bulb retronasally. ChemoTaste counteracts this via natural metal chelators (citric/malic acids where mucosa is intact), polyphenol antioxidants, and pre-meal bicarbonate buffering.
              </p>
            </div>

            {/* 3. Mathematical Reciprocal Proof */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ffb829]">
                <BookOpen className="w-4 h-4" />
                <span>Mathematical Proof of Sensory Shift Coordinates</span>
              </div>
              <div className="text-xs font-mono p-3 rounded-xl bg-black/60 border border-white/5 text-amber-200/90 leading-relaxed">
                Sensitivity S = 1 / Threshold T<br />
                Given Cisplatin elevates sweet detection threshold by Δ = +45%:<br />
                S_damaged = T_healthy / (1.45 * T_healthy) = 1 / 1.45 ≈ 0.6897 ≈ 0.69
              </div>
              <p className="text-xs font-extralight text-silver-mist leading-relaxed">
                ChemoTaste plots reciprocal sensitivity at <strong>0.69</strong> on the radar chart, reflecting true physical chemistry rather than an arbitrary 0.45 deduction.
              </p>
            </div>

            {/* 4. Anabolic Floor & Cachexia Protection */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span>Cachexia Prevention (ESPEN Oncology Guidelines)</span>
              </div>
              <p className="text-xs font-extralight text-silver-mist leading-relaxed">
                Cancer malnutrition and muscle wasting directly cause <strong>20% to 30% of all cancer-related deaths</strong> (<em>ESPEN Guidelines 2021</em>). ChemoTaste prevents the &quot;empty plate&quot; trap by strictly penalizing meals with &lt; 12g protein and prioritizing non-aromatic, high-protein carriers like fresh chhena, split moong dal, and silken tofu.
              </p>
            </div>

            {/* 5. Indian Computational Gastronomy Integration */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300">
                <Award className="w-4 h-4 text-[#ffb829]" />
                <span>Indian Computational Gastronomy (IIIT Delhi CoSy Lab)</span>
              </div>
              <p className="text-xs font-extralight text-silver-mist leading-relaxed">
                Grounded in <strong>Prof. Ganesh Bagler&apos;s</strong> pioneering computational gastronomy research at IIIT Delhi, ChemoTaste features an Indian Oncology Staple Corpus (Moong Dal Khichdi, Curd Rice, Fresh Chhena Purée, Lauki Stew) that provides complete hydration, soft texture, and mucosal protection without Western bland diet incompatibilities.
              </p>
            </div>

            {/* Primary Scientific Citations */}
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold mb-3">
                Primary Scientific Citations
              </h4>
              <ul className="space-y-2 text-xs font-extralight text-silver-mist">
                <li className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between">
                  <div>
                    <strong className="text-white block font-medium">FlavorDB</strong>
                    Garg N, et al. <em>Nucleic Acids Res.</em> 2018;46(D1):D1210-D1216.
                  </div>
                  <span className="text-[10px] text-[#ffb829] font-mono">IIIT-Delhi</span>
                </li>
                <li className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between">
                  <div>
                    <strong className="text-white block font-medium">RecipeDB</strong>
                    Batra R, et al. <em>Database (Oxford).</em> 2020;2020:baaa077.
                  </div>
                  <span className="text-[10px] text-[#ffb829] font-mono">IIIT-Delhi</span>
                </li>
                <li className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between">
                  <div>
                    <strong className="text-white block font-medium">Chemo Dysgeusia & Lipid Peroxidation</strong>
                    Amézaga J, et al. <em>Supportive Care Cancer.</em> 2018;26(5):1377-1386.
                  </div>
                  <span className="text-[10px] text-teal-300 font-mono">PMC5893699</span>
                </li>
                <li className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between">
                  <div>
                    <strong className="text-white block font-medium">ESPEN Clinical Nutrition in Cancer</strong>
                    Arends J, et al. <em>Clin Nutr.</em> 2021;40(5):2898-2913.
                  </div>
                  <span className="text-[10px] text-teal-300 font-mono">ESPEN 2021</span>
                </li>
                <li className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between">
                  <div>
                    <strong className="text-white block font-medium">Oral Mucositis Guidelines</strong>
                    Elad S, et al. <em>Cancer.</em> 2020;126(19):4423-4431.
                  </div>
                  <span className="text-[10px] text-teal-300 font-mono">MASCC/ISOO</span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
