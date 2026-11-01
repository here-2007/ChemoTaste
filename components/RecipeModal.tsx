// components/RecipeModal.tsx
'use client';

import React from 'react';
import { ScoredRecipe } from '../lib/types';
import { resolveIngredientToken } from '../lib/resolveIngredient';
import { X, ShieldAlert, Sparkles, UtensilsCrossed, Waves, Dumbbell, Droplets, Clock, Flame } from 'lucide-react';

interface Props {
  recipe: ScoredRecipe | null;
  onClose: () => void;
  onSelectIngredient?: (name: string) => void;
}

export const RecipeModal: React.FC<Props> = ({ recipe, onClose, onSelectIngredient }) => {
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-silver-mist hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
              {recipe.cuisine} Cuisine · {recipe.prep_time} Min
            </span>
            {recipe.is_live && (
              <span
                data-testid="modal-live-recipe-badge"
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                RecipeDB Live
              </span>
            )}
            {recipe.excluded && (
              <span className="text-xs uppercase tracking-wider text-red-400 font-semibold px-2 py-0.5 rounded-full bg-red-950/40 border border-red-500/40">
                Clinically Contraindicated
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal tracking-[-0.03em] text-white mt-1">
            {recipe.title}
          </h2>
        </div>

        {/* Score & Health Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
          <div>
            <div className="text-[10px] uppercase text-silver-mist">Taste-Safe Score</div>
            <div className={`text-2xl font-bold mt-0.5 ${recipe.excluded ? 'text-red-400' : 'text-[#8052ff]'}`}>
              {recipe.excluded ? 'BLOCK' : recipe.taste_safe_score}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-silver-mist">Protein Floor</div>
            <div className="text-2xl font-bold text-teal-300 mt-0.5">
              {recipe.protein_g ?? 0}g
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-silver-mist">Moisture Index</div>
            <div className="text-2xl font-bold text-sky-300 mt-0.5">
              {recipe.moisture_index ? `${(recipe.moisture_index * 100).toFixed(0)}%` : '75%'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-silver-mist">Calories</div>
            <div className="text-2xl font-bold text-[#ffb829] mt-0.5">
              {recipe.calories ?? 280} kcal
            </div>
          </div>
        </div>

        {/* Exclusion or Breakdown Note */}
        {recipe.excluded ? (
          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 text-red-200 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-300">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Contraindication Rationale (Block Beats Boost)</span>
            </div>
            <p className="text-xs font-extralight leading-relaxed text-red-200">
              {recipe.excluded_reason}
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ffb829]">
              <Sparkles className="w-4 h-4" />
              <span>Computational Profiling Breakdown</span>
            </div>
            <p className="text-xs font-extralight leading-relaxed text-silver-mist">
              {recipe.score_breakdown}
            </p>
          </div>
        )}

        {/* Physical Chemesthesis Advisories */}
        {!recipe.excluded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#ffb829]/10 border border-[#ffb829]/25 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#ffb829] uppercase tracking-wider">
                <UtensilsCrossed className="w-4 h-4" />
                <span>Cutlery Advisory</span>
              </div>
              <p className="text-xs font-extralight text-silver-mist leading-relaxed">
                Eat using bamboo, ceramic, or wooden cutlery. Stainless steel electrochemically amplifies metallic phantom intensity by 200–300%.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#15846e]/15 border border-[#15846e]/30 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 uppercase tracking-wider">
                <Waves className="w-4 h-4" />
                <span>Pre-Meal Salivary Buffer</span>
              </div>
              <p className="text-xs font-extralight text-silver-mist leading-relaxed">
                Rinse mouth with warm salt-soda wash (1/2 tsp salt + 1/2 tsp baking soda in 1 cup warm water) 10 min prior to eating to clear salivary lipid peroxides.
              </p>
            </div>
          </div>
        )}

        {/* Ingredients List */}
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold mb-3">
            Ingredients & Portioning (Tap to inspect volatile compounds)
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white">
            {recipe.ingredients.map((ing, idx) => {
              const cleanToken = resolveIngredientToken(ing);
              return (
                <li
                  key={idx}
                  onClick={() => onSelectIngredient?.(cleanToken || ing)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#8052ff]/50 hover:bg-white/[0.04] cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8052ff]" />
                    <span className="font-extralight group-hover:text-white transition-colors">{ing}</span>
                  </div>
                  <span className="text-[10px] text-teal-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    Inspect →
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Instructions */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold mb-3">
              Preparation Protocol
            </h4>
            <ol className="space-y-2.5 text-xs text-silver-mist">
              {recipe.instructions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#8052ff]/20 text-[#8052ff] flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-extralight leading-relaxed text-white">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
