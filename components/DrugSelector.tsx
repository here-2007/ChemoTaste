// components/DrugSelector.tsx
'use client';

import React from 'react';
import { TreatmentCyclePhase, UserContext } from '../lib/types';
import { DRUG_PROFILES, PRESET_REGIMENS } from '../data/drugProfiles';
import { Pill, Activity, ShieldCheck, Calendar, Flame, Droplets, Ban, Utensils } from 'lucide-react';

interface Props {
  selectedDrugs: string[];
  onToggleDrug: (drugId: string) => void;
  onSelectPreset: (presetKey: string) => void;
  context: UserContext;
  onUpdateContext: (updater: (prev: UserContext) => UserContext) => void;
}

export const DrugSelector: React.FC<Props> = ({
  selectedDrugs,
  onToggleDrug,
  onSelectPreset,
  context,
  onUpdateContext,
}) => {
  return (
    <div className="w-full space-y-8">
      {/* 1. Clinical Regimen Presets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
            Clinical Presets
          </span>
          <span className="text-xs text-silver-mist">Tap to auto-configure drug combinations</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(PRESET_REGIMENS).map(([key, preset]) => {
            const isSelected = preset.drugIds.every(id => selectedDrugs.includes(id));
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectPreset(key)}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-[#8052ff]/15 border-[#8052ff] shadow-[0_0_20px_rgba(128,82,255,0.25)]'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/30 text-silver-mist'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{preset.name.split('(')[0]}</span>
                  {isSelected && <ShieldCheck className="w-4 h-4 text-[#8052ff]" />}
                </div>
                <p className="text-xs font-extralight text-silver-mist line-clamp-2">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Individual Drug Selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
            Active Chemotherapy Drugs
          </span>
          <span className="text-xs text-silver-mist">Select individual antineoplastic agents</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(DRUG_PROFILES).map(drug => {
            const active = selectedDrugs.includes(drug.id);
            return (
              <button
                key={drug.id}
                type="button"
                onClick={() => onToggleDrug(drug.id)}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  active
                    ? 'bg-white/10 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-white">{drug.display_name}</span>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      drug.cold_forbidden
                        ? 'border-sky-500/50 text-sky-300 bg-sky-950/30'
                        : drug.mucositis_risk >= 2
                        ? 'border-red-500/50 text-red-300 bg-red-950/30'
                        : 'border-white/20 text-silver-mist bg-white/5'
                    }`}
                  >
                    {drug.drug_class}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-silver-mist font-extralight">
                  <span>Metallic: {drug.metallic_intensity}/3</span>
                  <span>•</span>
                  <span>Bitter: {drug.bitter_phantom}/3</span>
                  {drug.cold_forbidden && (
                    <>
                      <span>•</span>
                      <span className="text-sky-300 font-medium">Cold Block</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Dynamic 3-Phase Chemotherapy Cycle Selector */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-[#ffb829]" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
            Dynamic Treatment Cycle Phase
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'acute_1_3' as TreatmentCyclePhase,
              label: 'Days 1–3: Acute Infusion',
              desc: 'Severe nausea & olfactory hyperesthesia. Elevated antiemetic constraints and low-aroma priority.',
            },
            {
              id: 'nadir_4_8' as TreatmentCyclePhase,
              label: 'Days 4–8: Nadir & Mucositis',
              desc: 'Neutrophil nadir & peak mucosal injury. Automatic P1 hard block on acids, citrus, and spices.',
            },
            {
              id: 'recovery_9_21' as TreatmentCyclePhase,
              label: 'Days 9–21: Anabolic Recovery',
              desc: 'Sensory normalization window. Prioritizes muscle repair (protein ≥ 12g) and gentle re-engagement.',
            },
          ].map(phase => {
            const isCurrent = (context.cyclePhase ?? 'nadir_4_8') === phase.id;
            return (
              <button
                key={phase.id}
                type="button"
                onClick={() =>
                  onUpdateContext(prev => ({
                    ...prev,
                    cyclePhase: phase.id,
                  }))
                }
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-[#ffb829]/15 border-[#ffb829] text-white shadow-[0_0_15px_rgba(255,184,41,0.2)]'
                    : 'bg-white/[0.01] border-white/10 text-silver-mist hover:border-white/20'
                }`}
              >
                <div className="text-xs font-semibold text-white mb-1">{phase.label}</div>
                <div className="text-[11px] font-extralight text-silver-mist leading-relaxed">
                  {phase.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Symptom Sliders & Clinical Context Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Symptom Severity Sliders */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#8052ff]" />
            <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
              Patient Symptom Intensity (0–3)
            </span>
          </div>

          {/* Metallic */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white">Metallic Phantom Taste</span>
              <span className="text-[#ffb829] font-medium">Level {context.symptoms?.metallic ?? 2}/3</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={context.symptoms?.metallic ?? 2}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                onUpdateContext(prev => ({
                  ...prev,
                  symptoms: { ...(prev.symptoms ?? {}), metallic: val },
                }));
              }}
              className="w-full accent-[#8052ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Bitter */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white">Bitter Phantom / Hyperesthesia</span>
              <span className="text-[#ffb829] font-medium">Level {context.symptoms?.bitter ?? 2}/3</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={context.symptoms?.bitter ?? 2}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                onUpdateContext(prev => ({
                  ...prev,
                  symptoms: { ...(prev.symptoms ?? {}), bitter: val },
                }));
              }}
              className="w-full accent-[#8052ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Nausea */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white">Olfactory Nausea / Aroma Aversion</span>
              <span className="text-[#ffb829] font-medium">Level {context.symptoms?.nausea ?? 2}/3</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={context.symptoms?.nausea ?? 2}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                onUpdateContext(prev => ({
                  ...prev,
                  symptoms: { ...(prev.symptoms ?? {}), nausea: val },
                }));
              }}
              className="w-full accent-[#8052ff] bg-white/10 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Clinical Overrides and Preferences */}
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Utensils className="w-4 h-4 text-[#15846e]" />
            <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
              Clinical Overrides & Dietary Context
            </span>
          </div>

          {/* Mouth sores today */}
          <label className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
            <input
              type="checkbox"
              checked={context.mouthSoresToday}
              onChange={e => onUpdateContext(prev => ({ ...prev, mouthSoresToday: e.target.checked }))}
              className="mt-0.5 accent-[#ef4444]"
            />
            <div>
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                Active Mouth Sores / Oral Mucositis Today
              </span>
              <p className="text-[11px] font-extralight text-silver-mist">
                Triggers immediate P1 hard block on acidic, citrus, spicy, and rough foods.
              </p>
            </div>
          </label>

          {/* Dry mouth today */}
          <label className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
            <input
              type="checkbox"
              checked={context.dryMouthToday}
              onChange={e => onUpdateContext(prev => ({ ...prev, dryMouthToday: e.target.checked }))}
              className="mt-0.5 accent-teal-400"
            />
            <div>
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-teal-400" />
                Dry Mouth / Severe Xerostomia Today
              </span>
              <p className="text-[11px] font-extralight text-silver-mist">
                Requires Moisture Index ≥ 0.5 (gravies, khichdi, broths) for swallowability.
              </p>
            </div>
          </label>

          {/* Vegetarian */}
          <label className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
            <input
              type="checkbox"
              checked={context.vegetarian}
              onChange={e => onUpdateContext(prev => ({ ...prev, vegetarian: e.target.checked }))}
              className="mt-0.5 accent-emerald-400"
            />
            <div>
              <span className="text-xs font-medium text-white">Strict Vegetarian / Plant-Forward Diet</span>
              <p className="text-[11px] font-extralight text-silver-mist">
                Excludes meat, poultry, fish, gelatin, and animal broths defensively.
              </p>
            </div>
          </label>

          {/* Red meat aversion */}
          <label className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
            <input
              type="checkbox"
              checked={!context.toleratesRedMeat}
              onChange={e => onUpdateContext(prev => ({ ...prev, toleratesRedMeat: !e.target.checked }))}
              className="mt-0.5 accent-[#ffb829]"
            />
            <div>
              <span className="text-xs font-medium text-white">Aversion to Red Meat (Heme Iron Trigger)</span>
              <p className="text-[11px] font-extralight text-silver-mist">
                Applies 50% penalty to beef/lamb when metallic taste is active.
              </p>
            </div>
          </label>

          {/* Diabetic */}
          <label className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04]">
            <input
              type="checkbox"
              checked={context.diabetic}
              onChange={e => onUpdateContext(prev => ({ ...prev, diabetic: e.target.checked }))}
              className="mt-0.5 accent-amber-400"
            />
            <div>
              <span className="text-xs font-medium text-white">Diabetic / Glycemic Guardrail</span>
              <p className="text-[11px] font-extralight text-silver-mist">
                Caps sweet compensatory boosts to maintain glycemic safety.
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
