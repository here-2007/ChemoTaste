// components/IngredientFilterPanel.tsx
'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Search, ShieldAlert, Sparkles, Filter } from 'lucide-react';

interface IncludedItem {
  name: string;
  score: number;
  tags: string[];
  protein: number;
  reason: string;
}

interface BlockedItem {
  name: string;
  reason: string;
  rule: string;
}

interface Props {
  included: IncludedItem[];
  blocked: BlockedItem[];
  onSelectIngredient?: (name: string) => void;
}

export const IngredientFilterPanel: React.FC<Props> = ({
  included,
  blocked,
  onSelectIngredient,
}) => {
  const [activeTab, setActiveTab] = useState<'included' | 'blocked'>('included');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncluded = included.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBlocked = blocked.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
            Oncology Culinary Intelligence
          </span>
          <h3 className="text-2xl font-normal tracking-[-0.03em] text-white mt-1">
            Ingredient Perceptibility & Clinical Safety
          </h3>
          <p className="text-sm font-extralight text-silver-mist mt-1">
            Evaluated via FlavorDB volatile aroma compound profiles and clinical oncology safety gates.
          </p>
        </div>

        {/* Tab Toggle & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-silver-mist" />
            <input
              type="text"
              placeholder="Filter ingredients..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder-silver-mist focus:outline-none focus:border-[#8052ff] w-full sm:w-48"
            />
          </div>

          <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setActiveTab('included')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'included'
                  ? 'bg-[#15846e] text-white shadow-[0_0_15px_rgba(21,132,110,0.4)]'
                  : 'text-silver-mist hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Included ({included.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === 'blocked'
                  ? 'bg-red-700 text-white shadow-[0_0_15px_rgba(185,28,28,0.4)]'
                  : 'text-silver-mist hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Blocked ({blocked.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Ingredients */}
      {activeTab === 'included' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredIncluded.map(item => (
            <div
              key={item.name}
              onClick={() => onSelectIngredient?.(item.name)}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#15846e]/50 cursor-pointer transition-all hover:bg-white/[0.04] group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-white capitalize group-hover:text-teal-300 transition-colors">
                  {item.name}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#15846e]/20 text-teal-300 border border-[#15846e]/40">
                  Affinity: {item.score >= 0 ? `+${item.score}` : item.score}
                </span>
              </div>
              <p className="text-xs font-extralight text-silver-mist leading-relaxed line-clamp-2 mb-2">
                {item.reason}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.protein > 0 && (
                  <span className="text-[10px] text-silver-mist px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    {item.protein}g protein/100g
                  </span>
                )}
                {item.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] text-teal-200/80 px-2 py-0.5 rounded-full bg-[#15846e]/10 border border-[#15846e]/20"
                  >
                    #{tag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {filteredIncluded.length === 0 && (
            <div className="col-span-full py-12 text-center text-silver-mist text-xs">
              No matching included ingredients found.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBlocked.map(item => (
            <div
              key={item.name}
              className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 hover:border-red-500/40 transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-red-200 capitalize">
                  {item.name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-500/30">
                  {item.rule}
                </span>
              </div>
              <p className="text-xs font-extralight text-red-200/80 leading-relaxed">
                {item.reason}
              </p>
            </div>
          ))}
          {filteredBlocked.length === 0 && (
            <div className="col-span-full py-12 text-center text-silver-mist text-xs">
              No blocked ingredients match this search.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
