// components/ClinicalWarningBanner.tsx
'use client';

import React from 'react';
import { DrugProfile, UserContext, Constraints } from '../lib/types';
import { AlertTriangle, ShieldAlert, Snowflake, Flame, Droplets } from 'lucide-react';

interface Props {
  profile: DrugProfile;
  context: UserContext;
  constraints: Constraints;
}

export const ClinicalWarningBanner: React.FC<Props> = ({ profile, context, constraints }) => {
  const alerts: Array<{ id: string; type: 'critical' | 'warning' | 'info'; title: string; desc: string; icon: any }> = [];

  // P1: Oxaliplatin Cold Allodynia
  if (profile.cold_forbidden) {
    alerts.push({
      id: 'cold_allodynia',
      type: 'critical',
      title: 'P1 Clinical Gate: Oxaliplatin Cold Allodynia Active',
      desc: 'All cold, chilled, iced, smoothie, and frozen dishes are permanently blocked. Cold triggers acute sensory neuropathy (Nav1.6/Nav1.8 sodium channel dysfunction), vocal cord spasms, and pharyngolaryngeal dysesthesia.',
      icon: Snowflake,
    });
  }

  // P1: Mucositis Override
  if (profile.mucositis_risk >= 2) {
    alerts.push({
      id: 'mucositis_override',
      type: 'critical',
      title: `P1 Clinical Override: Oral Mucositis Active (Grade ${profile.mucositis_risk}/3)`,
      desc: 'All acidic, citrus, vinegar, chili, and abrasive foods are hard-blocked (BLOCK BEATS BOOST). Mucosal ulcerations cause agonizing burning on acid exposure, superseding metallic taste masking.',
      icon: Flame,
    });
  }

  // P0: Global Safety
  alerts.push({
    id: 'p0_infection',
    type: 'warning',
    title: 'P0 Universal Oncology Safeguards Enforced',
    desc: 'Raw/undercooked animal products, unpasteurized dairy, CYP3A4 inhibitors (grapefruit/pomelo/seville orange), alcohol, and nephrotoxic starfruit are excluded.',
    icon: ShieldAlert,
  });

  // P2: Xerostomia Guardrail
  if (constraints.requireHighMoisture) {
    alerts.push({
      id: 'xerostomia_lubrication',
      type: 'info',
      title: 'P2 Xerostomia & Dysphagia Guardrail Active',
      desc: 'Salivary hypofunction detected. Dry foods (Moisture Index < 0.5) receive a 40% tolerability penalty to prevent aspiration and enable tastant dissolution.',
      icon: Droplets,
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="w-full space-y-3 mb-8">
      {alerts.map(a => (
        <div
          key={a.id}
          className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
            a.type === 'critical'
              ? 'bg-red-950/30 border-red-500/40 text-red-200'
              : a.type === 'warning'
              ? 'bg-[#ffb829]/10 border-[#ffb829]/30 text-[#ffb829]'
              : 'bg-[#15846e]/15 border-[#15846e]/30 text-teal-200'
          }`}
        >
          <div className="mt-0.5 p-2 rounded-xl bg-black/40">
            <a.icon className="w-5 h-5 flex-shrink-0" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-semibold uppercase tracking-[0.05em] mb-1">
              {a.title}
            </h4>
            <p className="text-sm font-extralight text-silver-mist leading-relaxed">
              {a.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
