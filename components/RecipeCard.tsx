// components/RecipeCard.tsx
'use client';

import React from 'react';
import { ScoredRecipe } from '../lib/types';
import { Clock, ShieldAlert, Sparkles, Droplets, Dumbbell, UtensilsCrossed, Waves } from 'lucide-react';

interface Props {
  recipe: ScoredRecipe;
  onOpenDetails: (recipe: ScoredRecipe) => void;
}

export const RecipeCard: React.FC<Props> = ({ recipe, onOpenDetails }) => {
  const isExcluded = recipe.excluded;
  const score = recipe.taste_safe_score;

  const scoreBadgeColor = isExcluded
    ? 'border-red-500/50 bg-red-950/30 text-red-400'
    : score >= 70
    ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300'
    : score >= 55
    ? 'border-[#ffb829]/50 bg-[#ffb829]/15 text-[#ffb829]'
    : 'border-white/20 bg-white/5 text-silver-mist';

  return (
    <div
      className={`rounded-3xl border transition-all flex flex-col justify-between p-6 ${
        isExcluded
          ? 'bg-red-950/10 border-red-500/20 opacity-75'
          : 'bg-black/60 border-white/10 hover:border-white/30 hover:bg-black/80'
      }`}
    >
      <div>
        {/* Header: Score Gauge & Cuisine */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#ffb829] font-semibold">
              {recipe.cuisine} CUISINE
            </span>
            <h4 className="text-lg font-normal tracking-[-0.02em] text-white mt-0.5 leading-snug">
              {recipe.title}
            </h4>
          </div>

          {/* Taste Safe Score Circular Gauge */}
          <div className="relative flex items-center justify-center w-16 h-16 flex-shrink-0">
            {isExcluded ? (
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full border border-red-500/50 bg-red-950/30 text-red-400">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
            ) : (
              <>
                <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="25"
                    stroke={score >= 70 ? '#10b981' : score >= 55 ? '#ffb829' : '#9a9a9a'}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 25}
                    strokeDashoffset={2 * Math.PI * 25 - (score / 100) * (2 * Math.PI * 25)}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold text-white leading-none">{score}</span>
                  <span className="text-[8px] uppercase tracking-wider text-silver-mist mt-0.5 font-medium">Safe</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Excluded Reason or Nutrition Tags */}
        {isExcluded ? (
          <div className="p-3 rounded-xl bg-red-900/20 border border-red-500/30 text-xs text-red-200 mb-4 font-extralight leading-relaxed">
            <span className="font-semibold text-red-300 block mb-0.5">Clinical Exclusion:</span>
            {recipe.excluded_reason}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.protein_g !== undefined && (
              <span
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${
                  recipe.protein_g >= 12
                    ? 'border-[#15846e]/40 bg-[#15846e]/15 text-teal-300'
                    : 'border-white/10 bg-white/5 text-silver-mist'
                }`}
              >
                <Dumbbell className="w-3 h-3" />
                <span>{recipe.protein_g}g Protein</span>
              </span>
            )}
            {recipe.moisture_index !== undefined && (
              <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-sky-500/30 bg-sky-950/20 text-sky-300">
                <Droplets className="w-3 h-3" />
                <span>{(recipe.moisture_index * 100).toFixed(0)}% Moisture</span>
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-silver-mist">
              <Clock className="w-3 h-3" />
              <span>{recipe.prep_time}m prep</span>
            </span>
          </div>
        )}

        {/* Ingredients Snippet */}
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-wider text-silver-mist font-semibold mb-1">
            Ingredients ({recipe.ingredients.length})
          </p>
          <p className="text-xs font-extralight text-silver-mist line-clamp-2">
            {recipe.ingredients.join(' · ')}
          </p>
        </div>

        {/* Physical Chemesthesis Advisories (Cutlery & Salivary Rinse) */}
        {!isExcluded && (
          <div className="space-y-2 mb-4 pt-3 border-t border-white/5">
            <div className="flex items-start gap-2 text-[11px] text-silver-mist">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#ffb829] flex-shrink-0 mt-0.5" />
              <span className="font-extralight">Bamboo/ceramic cutlery (stops 200% metallic amplification).</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-silver-mist">
              <Waves className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
              <span className="font-extralight">Pre-meal warm salt-soda rinse clears salivary lipid peroxides.</span>
            </div>
          </div>
        )}
      </div>

      {/* Button */}
      <button
        type="button"
        onClick={() => onOpenDetails(recipe)}
        className={`w-full py-2.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all mt-2 ${
          isExcluded
            ? 'bg-white/5 hover:bg-white/10 text-silver-mist border border-white/10'
            : 'bg-[#8052ff] hover:bg-[#6d3cf5] text-white shadow-[0_0_15px_rgba(128,82,255,0.3)]'
        }`}
      >
        {isExcluded ? 'Inspect Clinical Reason' : 'View Recipe & Molecular Rationale'}
      </button>
    </div>
  );
};
