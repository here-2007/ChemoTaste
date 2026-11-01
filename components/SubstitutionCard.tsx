// components/SubstitutionCard.tsx
'use client';

import React from 'react';
import { SubstitutionDelta } from '../lib/types';
import { ArrowRight, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface Props {
  substitutions: SubstitutionDelta[];
}

export const SubstitutionCard: React.FC<Props> = ({ substitutions }) => {
  return (
    <div className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
      <div className="mb-6">
        <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
          Molecular Substitution Matrix
        </span>
        <h3 className="text-2xl font-normal tracking-[-0.03em] text-white mt-1">
          Evidence-Grounded Ingredient Adaptations
        </h3>
        <p className="text-sm font-extralight text-silver-mist mt-1">
          Targeting the root biochemical pathways: replacing volatile lipid oxidation catalysts and mucosal irritants with perception-restoring carriers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {substitutions.map((sub, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Replacement Flow */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10 mb-3">
                <span className="text-xs font-medium text-red-300 line-through">
                  {sub.originalIngredient}
                </span>
                <ArrowRight className="w-4 h-4 text-[#8052ff] hidden sm:block" />
                <span className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#15846e]" />
                  {sub.recommendedSubstitute}
                </span>
              </div>

              {/* Rationale & Sensory Delta */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#ffb829] font-semibold block mb-0.5">
                    Clinical Rationale
                  </span>
                  <p className="font-extralight text-silver-mist leading-relaxed">
                    {sub.clinicalRationale}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold block mb-0.5">
                    Taste & Aroma Delta
                  </span>
                  <p className="font-extralight text-silver-mist leading-relaxed">
                    {sub.tasteDelta} {sub.aromaDelta}
                  </p>
                </div>
              </div>
            </div>

            {/* Protein Floor Comparison */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-silver-mist">
              <span className="font-medium text-white">Anabolic Floor:</span>
              <span className="text-teal-300">{sub.proteinComparison}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
