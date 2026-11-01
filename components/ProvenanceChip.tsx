// components/ProvenanceChip.tsx
'use client';

import React from 'react';
import { Database, ShieldCheck, WifiOff } from 'lucide-react';

interface Props {
  mode: 'curated_offline' | 'live_api';
  recipeCount: number;
  profiledCount: number;
}

export const ProvenanceChip: React.FC<Props> = ({ mode, recipeCount, profiledCount }) => {
  return (
    <footer className="w-full border-t border-white/10 py-10 mt-20 bg-black text-silver-mist">
      <div className="max-w-[1280px] mx-auto px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#8052ff]">
              {mode === 'curated_offline' ? <WifiOff className="w-4 h-4" /> : <Database className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-white font-medium block">
                Data Provenance Mode
              </span>
              <span className="text-[11px] font-extralight text-silver-mist">
                {mode === 'curated_offline'
                  ? `Offline Resilient · ${profiledCount} Precompiled Ingredient Fingerprints · ${recipeCount} Curated Oncology Recipes`
                  : 'Live CoSy Lab Academic API Gateway'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#15846e]" />
            <span className="text-white font-medium">Deterministic Rule Precedence:</span>
            <span className="text-[#ffb829] font-mono text-[11px]">BLOCK BEATS BOOST</span>
          </div>
        </div>

        {/* Clinical Disclaimer */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] font-extralight leading-relaxed text-silver-mist/80">
          <strong className="text-white font-medium block mb-0.5">Clinical Disclaimer:</strong>
          ChemoTaste is an oncology supportive care computational gastronomy discovery engine. It is designed to assist patients in identifying palatable, perceptible, and symptom-tolerable meals during chemotherapy. It does not provide medical diagnosis, modify medical prescriptions, or replace individualized care from an oncologist or certified oncology dietitian.
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-silver-mist/60 pt-4 border-t border-white/5">
          <span>Foodoscope Fork It Challenge 2026 · IIIT Delhi CoSy Lab</span>
          <span>Algorithms: Garg et al. (FlavorDB), Batra et al. (RecipeDB), Amézaga et al. (2018)</span>
        </div>
      </div>
    </footer>
  );
};
