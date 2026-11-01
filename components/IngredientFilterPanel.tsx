// components/IngredientFilterPanel.tsx
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Search,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Utensils,
  ArrowUpRight,
  Flame,
} from 'lucide-react';
import { getIngredientImageUrl } from '../data/ingredientImages';

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

const DEMO_LIMIT = 6;

const QUICK_FILTERS = [
  { label: 'High Protein', query: 'protein' },
  { label: 'Umami Rich', query: 'umami' },
  { label: 'Acidic & Citrus', query: 'acidic' },
  { label: 'Soft & Soothing', query: 'soft texture' },
  { label: 'Zinc & Minerals', query: 'zinc' },
];

const IngredientThumbnail: React.FC<{ name: string; isBlocked?: boolean }> = ({ name, isBlocked }) => {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getIngredientImageUrl(name);

  if (hasError || !imageUrl) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-2 text-center ${
          isBlocked ? 'bg-red-950/40 text-red-400' : 'bg-white/5 text-silver-mist'
        }`}
      >
        {isBlocked ? <ShieldAlert className="w-5 h-5 opacity-70" /> : <Utensils className="w-5 h-5 opacity-60" />}
        <span className="text-[9px] mt-1 font-mono uppercase tracking-wider opacity-60 truncate max-w-full">
          {name}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
      />
      {/* Subtle bottom gradient to blend photo into card aesthetic */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
    </div>
  );
};

export const IngredientFilterPanel: React.FC<Props> = ({
  included,
  blocked,
  onSelectIngredient,
}) => {
  const [activeTab, setActiveTab] = useState<'included' | 'blocked'>('included');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string | null>(null);
  const [showAllIncluded, setShowAllIncluded] = useState(false);
  const [showAllBlocked, setShowAllBlocked] = useState(false);

  const effectiveQuery = searchQuery.trim().toLowerCase();
  const isSearching = effectiveQuery.length > 0;

  const matchesSearch = (text: string, query: string) => {
    return text.toLowerCase().includes(query) || text.toLowerCase().replace(/_/g, ' ').includes(query);
  };

  const filteredIncluded = included.filter(i =>
    !isSearching ||
    matchesSearch(i.name, effectiveQuery) ||
    i.tags.some(t => matchesSearch(t, effectiveQuery)) ||
    matchesSearch(i.reason, effectiveQuery) ||
    (effectiveQuery === 'protein' && i.protein >= 10)
  );

  const filteredBlocked = blocked.filter(i =>
    !isSearching ||
    matchesSearch(i.name, effectiveQuery) ||
    matchesSearch(i.reason, effectiveQuery) ||
    matchesSearch(i.rule, effectiveQuery)
  );

  // When searching, show all matching results. Otherwise, limit to 6 demo items unless expanded.
  const displayedIncluded = isSearching || showAllIncluded
    ? filteredIncluded
    : filteredIncluded.slice(0, DEMO_LIMIT);

  const displayedBlocked = isSearching || showAllBlocked
    ? filteredBlocked
    : filteredBlocked.slice(0, DEMO_LIMIT);

  const handleQuickFilterClick = (filterQuery: string) => {
    if (selectedQuickFilter === filterQuery) {
      setSelectedQuickFilter(null);
      setSearchQuery('');
    } else {
      setSelectedQuickFilter(filterQuery);
      setSearchQuery(filterQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedQuickFilter(null);
  };

  return (
    <div className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.2em] text-[#ffb829] font-semibold">
              Oncology Culinary Intelligence
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#8052ff]/15 text-[#8052ff] border border-[#8052ff]/30">
              {isSearching ? `${activeTab === 'included' ? filteredIncluded.length : filteredBlocked.length} Matches` : `Showing 6 Demo Items`}
            </span>
          </div>
          <h3 className="text-2xl font-normal tracking-[-0.03em] text-white mt-1">
            Ingredient Perceptibility & Clinical Safety
          </h3>
          <p className="text-sm font-extralight text-silver-mist mt-1">
            Evaluated via FlavorDB volatile aroma profiles and deterministic clinical safety gates. Click any card to inspect molecular proofs.
          </p>
        </div>

        {/* Tab Toggle & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-silver-mist pointer-events-none" />
            <input
              type="text"
              placeholder="Search ingredients, tags, reasons..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSelectedQuickFilter(null);
              }}
              className="bg-white/5 border border-white/10 rounded-full pl-9 pr-8 py-2 text-xs text-white placeholder-silver-mist focus:outline-none focus:border-[#8052ff] w-full sm:w-64 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-silver-mist hover:text-white p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex bg-white/5 p-1 rounded-full border border-white/10 self-start sm:self-auto shrink-0">
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

      {/* Quick Search Chips: Keeps UI Compact while making search-to-reveal instant */}
      <div className="flex flex-wrap items-center gap-2 mb-6 pt-1 border-t border-white/5">
        <span className="text-[11px] font-mono text-silver-mist/70 uppercase tracking-wider mr-1">
          Explore by tag:
        </span>
        <button
          onClick={handleClearSearch}
          className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all ${
            !isSearching
              ? 'bg-white/15 text-white border-white/30 shadow-sm'
              : 'bg-white/[0.03] text-silver-mist border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          Demo (6)
        </button>
        {QUICK_FILTERS.map(qf => {
          const isActive = selectedQuickFilter === qf.query;
          return (
            <button
              key={qf.query}
              onClick={() => handleQuickFilterClick(qf.query)}
              className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${
                isActive
                  ? 'bg-[#8052ff] text-white border-[#8052ff] shadow-[0_0_12px_rgba(128,82,255,0.4)]'
                  : 'bg-white/[0.03] text-silver-mist border-white/10 hover:border-[#8052ff]/40 hover:text-white'
              }`}
            >
              <span>{qf.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Search Banner */}
      {isSearching && (
        <div className="mb-5 flex items-center justify-between text-xs text-silver-mist bg-white/[0.03] border border-white/10 px-4 py-2.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#ffb829]" />
            <span>
              Found <strong className="text-white font-medium">{activeTab === 'included' ? filteredIncluded.length : filteredBlocked.length}</strong> {activeTab} ingredients matching &ldquo;<span className="text-teal-300 font-medium">{searchQuery}</span>&rdquo;
            </span>
          </div>
          <button
            onClick={handleClearSearch}
            className="text-teal-300 hover:text-teal-200 underline text-[11px] font-mono"
          >
            Clear to 6 Demo Items
          </button>
        </div>
      )}

      {/* Grid of Ingredients */}
      {activeTab === 'included' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedIncluded.map(item => (
              <div
                key={item.name}
                onClick={() => onSelectIngredient?.(item.name)}
                className="group relative p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/10 hover:border-[#15846e]/60 cursor-pointer transition-all duration-200 flex items-start gap-3.5 shadow-sm hover:shadow-[0_4px_20px_rgba(21,132,110,0.15)]"
              >
                {/* Authentic Culinary Photo Thumbnail */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-white/5 border border-white/10 group-hover:border-[#15846e]/40 transition-colors shadow-inner">
                  <IngredientThumbnail name={item.name} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-sm font-medium text-white capitalize group-hover:text-teal-300 transition-colors truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#15846e]/20 text-teal-300 border border-[#15846e]/40 shrink-0 font-mono">
                        Affinity: {item.score >= 0 ? `+${item.score.toFixed(2)}` : item.score.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs font-extralight text-silver-mist leading-relaxed line-clamp-2 mb-2">
                      {item.reason}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {item.protein > 0 && (
                        <span className="text-[10px] text-silver-mist font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
                          {item.protein}g protein
                        </span>
                      )}
                      {item.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] text-teal-200/90 font-mono px-2 py-0.5 rounded-md bg-[#15846e]/10 border border-[#15846e]/25"
                        >
                          #{tag.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-teal-300 flex items-center gap-0.5 shrink-0">
                      Proofs <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredIncluded.length === 0 && (
              <div className="col-span-full py-12 text-center text-silver-mist text-xs bg-white/[0.01] rounded-2xl border border-white/5">
                No matching ingredients found for &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;protein&rdquo;, &ldquo;citrus&rdquo;, or &ldquo;umami&rdquo;.
              </div>
            )}
          </div>

          {/* Expand/Collapse Toggle Button for Browsing */}
          {!isSearching && filteredIncluded.length > DEMO_LIMIT && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5 text-xs text-silver-mist">
              <span className="text-[11px] font-extralight">
                {showAllIncluded
                  ? `Showing all ${filteredIncluded.length} verified safe ingredients`
                  : `Showing ${DEMO_LIMIT} demo ingredients · Search to reveal any item or click expand to view all ${filteredIncluded.length}`}
              </span>
              <button
                onClick={() => setShowAllIncluded(prev => !prev)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors font-medium text-xs shadow-sm"
              >
                {showAllIncluded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Collapse to {DEMO_LIMIT} Demo Ingredients</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>View All {filteredIncluded.length} Ingredients</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedBlocked.map(item => (
              <div
                key={item.name}
                onClick={() => onSelectIngredient?.(item.name)}
                className="group relative p-3.5 rounded-2xl bg-red-950/20 hover:bg-red-950/30 border border-red-500/20 hover:border-red-500/40 cursor-pointer transition-all duration-200 flex items-start gap-3.5 shadow-sm"
              >
                {/* Photo Thumbnail */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-red-950/30 border border-red-500/20 group-hover:border-red-500/40 transition-colors shadow-inner">
                  <IngredientThumbnail name={item.name} isBlocked />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="text-sm font-medium text-red-200 capitalize truncate group-hover:text-red-100 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-500/30 shrink-0 font-mono">
                        {item.rule}
                      </span>
                    </div>
                    <p className="text-xs font-extralight text-red-200/80 leading-relaxed line-clamp-2 mb-2">
                      {item.reason}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-mono">
                      <ShieldAlert className="w-3 h-3 text-red-400" /> Contraindicated
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-red-300 flex items-center gap-0.5 shrink-0">
                      Proofs <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredBlocked.length === 0 && (
              <div className="col-span-full py-12 text-center text-silver-mist text-xs bg-white/[0.01] rounded-2xl border border-white/5">
                No blocked ingredients match &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>

          {/* Toggle button when not actively searching */}
          {!isSearching && filteredBlocked.length > DEMO_LIMIT && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5 text-xs text-silver-mist">
              <span className="text-[11px] font-extralight">
                {showAllBlocked
                  ? `Showing all ${filteredBlocked.length} contraindicated items`
                  : `Showing ${DEMO_LIMIT} demo blocked items · Search to explore all ${filteredBlocked.length}`}
              </span>
              <button
                onClick={() => setShowAllBlocked(prev => !prev)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-950/30 hover:bg-red-950/50 text-red-300 border border-red-500/30 transition-colors font-medium text-xs shadow-sm"
              >
                {showAllBlocked ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Collapse to {DEMO_LIMIT} Demo Items</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>View All {filteredBlocked.length} Blocked Items</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

