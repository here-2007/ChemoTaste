// components/SensoryShiftRadar.tsx
'use client';

import React, { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { DrugProfile, SensoryAxisPoint } from '../lib/types';
import { Info, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  profile: DrugProfile;
  radarData: SensoryAxisPoint[];
}

export const SensoryShiftRadar: React.FC<Props> = ({ profile, radarData }) => {
  const [selectedAxis, setSelectedAxis] = useState<SensoryAxisPoint | null>(null);

  return (
    <div className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
            Sensory Physiology Simulation
          </span>
          <h3 className="text-2xl font-normal tracking-[-0.03em] text-white mt-1">
            Perceptual Sensory Shift & Masking Radar
          </h3>
          <p className="text-sm font-extralight text-silver-mist mt-1 max-w-xl">
            Derived from clinical oncology literature (PMC2858711, ESPEN Guidelines). Demonstrates the transition from healthy baseline to drug-damaged state, and subsequent computational culinary restoration.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-xs text-silver-mist">
          <Info className="w-4 h-4 text-[#8052ff]" />
          <span>Tap axis to inspect physiological proof</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Radar Chart Container */}
        <div className="lg:col-span-7 w-full h-[360px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
              <PolarAngleAxis
                dataKey="axis"
                stroke="#9a9a9a"
                tick={{ fontSize: 12, fill: '#bdbdbd', cursor: 'pointer' }}
                onClick={(e: any) => {
                  const point = radarData.find(p => p.axis === e.value);
                  if (point) setSelectedAxis(point);
                }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 1.25]}
                stroke="rgba(255, 255, 255, 0.2)"
                tick={{ fontSize: 10, fill: '#777' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as SensoryAxisPoint;
                    return (
                      <div className="bg-[#0a0a0a] border border-white/20 p-3 rounded-2xl shadow-xl text-xs space-y-1">
                        <p className="font-semibold text-white uppercase tracking-wider">{data.axis}</p>
                        <p className="text-[#10b981]">Healthy: {(data.healthy * 100).toFixed(0)}%</p>
                        <p className="text-[#ef4444]">Chemo Damaged: {(data.damaged * 100).toFixed(0)}%</p>
                        <p className="text-[#8052ff]">Masked with Recipe: {(data.masked * 100).toFixed(0)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Healthy Baseline */}
              <Radar
                name="Healthy Baseline"
                dataKey="healthy"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.12}
                strokeWidth={2}
              />
              {/* Chemotherapy Damaged State */}
              <Radar
                name="Chemo Damaged"
                dataKey="damaged"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              {/* Masked with Computational Gastronomy */}
              <Radar
                name="Masked With Recipe"
                dataKey="masked"
                stroke="#8052ff"
                fill="#8052ff"
                fillOpacity={0.35}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend and Axis Detail Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex flex-wrap gap-3 pb-2 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span className="text-white">Healthy Baseline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span className="text-white">Chemo Damaged</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#8052ff]" />
              <span className="text-[#ffb829] font-medium">Masked with Recipe</span>
            </div>
          </div>

          {/* Active Axis or Default Explanation */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#ffb829] font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>{selectedAxis ? selectedAxis.axis : 'Primary Biological Insight'}</span>
            </div>
            <p className="text-sm font-extralight text-silver-mist leading-relaxed">
              {selectedAxis
                ? selectedAxis.explanation
                : profile.sweet_threshold_raised
                ? 'Chemotherapy antimitotics elevate sweet detection threshold by ~45%, causing relative sensitivity to drop to S = 1/1.45 ≈ 0.69. ChemoTaste recipes boost natural carbohydrate tastants to restore sweet perception without added refined sugar.'
                : 'Chemotherapy damages rapidly dividing taste progenitor cells, inducing phantom metallic and bitter tastes while leaving the T1R1/T1R3 umami pathway relatively intact.'}
            </p>
          </div>

          {/* Salivary Lipid Peroxidation Callout */}
          <div className="p-4 rounded-2xl bg-[#15846e]/10 border border-[#15846e]/25 space-y-1.5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-teal-300 font-semibold">
              <AlertCircle className="w-4 h-4 text-[#15846e]" />
              <span>Salivary Lipid Peroxidation Mechanism</span>
            </div>
            <p className="text-xs font-extralight text-silver-mist leading-relaxed">
              Metallic dysgeusia is driven by salivary ROS oxidizing epithelial lipids into volatile aldehydes (1-octen-3-one, hexanal). Natural metal chelators (citric/malic acids) displace metal ions, while FlavorDB aroma suppression prevents olfactory aversion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
