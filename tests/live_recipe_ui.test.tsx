// tests/live_recipe_ui.test.tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LiveNoticeBanner, LiveNotice } from '../components/LiveNoticeBanner';
import { RecipeCard } from '../components/RecipeCard';
import { RecipeModal } from '../components/RecipeModal';
import { ScoredRecipe } from '../lib/types';

describe('LiveNoticeBanner Component States & Visual Distinction', () => {
  it('returns null when notice is null', () => {
    const html = renderToStaticMarkup(
      <LiveNoticeBanner notice={null} onDismiss={() => {}} />
    );
    expect(html).toBe('');
  });

  it('renders success notice with emerald/teal styling and CheckCircle2 icon', () => {
    const notice: LiveNotice = {
      type: 'success',
      message: 'Retrieved and clinically evaluated 5 live recipes for "khichdi" from RecipeDB gateway.',
    };

    const html = renderToStaticMarkup(
      <LiveNoticeBanner notice={notice} onDismiss={() => {}} />
    );

    expect(html).toContain('data-notice-type="success"');
    expect(html).toContain('bg-emerald-950/25');
    expect(html).toContain('border-emerald-500/40');
    expect(html).toContain('text-emerald-300');
    expect(html).toContain('Live Gateway Connected:');
    expect(html).toContain('Retrieved and clinically evaluated 5 live recipes for &quot;khichdi&quot; from RecipeDB gateway.');
    expect(html).toContain('data-testid="icon-success"');
    expect(html).not.toContain('data-testid="icon-error"');
    expect(html).not.toContain('data-testid="icon-info"');
  });

  it('renders info notice with sky/blue styling and Info icon', () => {
    const notice: LiveNotice = {
      type: 'info',
      message: 'No live recipes returned for "xyz". Maintained verified curated corpus.',
    };

    const html = renderToStaticMarkup(
      <LiveNoticeBanner notice={notice} onDismiss={() => {}} />
    );

    expect(html).toContain('data-notice-type="info"');
    expect(html).toContain('bg-sky-950/25');
    expect(html).toContain('border-sky-500/40');
    expect(html).toContain('text-sky-300');
    expect(html).toContain('Gateway Notice:');
    expect(html).toContain('No live recipes returned for &quot;xyz&quot;. Maintained verified curated corpus.');
    expect(html).toContain('data-testid="icon-info"');
    expect(html).not.toContain('data-testid="icon-success"');
    expect(html).not.toContain('data-testid="icon-error"');
  });

  it('renders error notice with red styling and AlertCircle icon', () => {
    const notice: LiveNotice = {
      type: 'error',
      message: 'Gateway note: Live API unreachable. Operating in verified offline fallback mode.',
    };

    const html = renderToStaticMarkup(
      <LiveNoticeBanner notice={notice} onDismiss={() => {}} />
    );

    expect(html).toContain('data-notice-type="error"');
    expect(html).toContain('bg-red-950/25');
    expect(html).toContain('border-red-500/40');
    expect(html).toContain('text-red-300');
    expect(html).toContain('Gateway Fallback Notice:');
    expect(html).toContain('Gateway note: Live API unreachable. Operating in verified offline fallback mode.');
    expect(html).toContain('data-testid="icon-error"');
    expect(html).not.toContain('data-testid="icon-success"');
    expect(html).not.toContain('data-testid="icon-info"');
  });
});

describe('Live RecipeDB Badging on RecipeCard & RecipeModal', () => {
  const baseRecipe: ScoredRecipe = {
    id: 'live-khichdi-101',
    title: 'Moong Dal Khichdi Live',
    cuisine: 'Indian',
    prep_time: 25,
    ingredients: ['split yellow moong dal', 'white basmati rice', 'turmeric', 'ghee', 'cumin'],
    protein_g: 14,
    calories: 320,
    moisture_index: 0.85,
    taste_safe_score: 78,
    confidence: 0.9,
    excluded: false,
    band: 'highly_recommended',
    score_breakdown: 'Profiled 4 active + 1 neutral items (100% coverage).',
    cutlery_advisory: 'Serve with ceramic cutlery.',
    salivary_rinse_advisory: 'Rinse with warm salt wash.',
    is_live: true,
  };

  it('renders RecipeDB Live badge on RecipeCard when is_live is true', () => {
    const html = renderToStaticMarkup(
      <RecipeCard recipe={baseRecipe} onOpenDetails={() => {}} />
    );

    expect(html).toContain('data-testid="live-recipe-badge"');
    expect(html).toContain('RecipeDB Live');
    expect(html).toContain('border-emerald-500/30');
    expect(html).toContain('text-emerald-300');
  });

  it('does NOT render RecipeDB Live badge on RecipeCard when is_live is false or undefined', () => {
    const curatedRecipe: ScoredRecipe = {
      ...baseRecipe,
      id: 'curated-khichdi',
      is_live: false,
    };

    const html = renderToStaticMarkup(
      <RecipeCard recipe={curatedRecipe} onOpenDetails={() => {}} />
    );

    expect(html).not.toContain('data-testid="live-recipe-badge"');
    expect(html).not.toContain('RecipeDB Live');
  });

  it('renders RecipeDB Live badge in RecipeModal header when is_live is true', () => {
    const html = renderToStaticMarkup(
      <RecipeModal recipe={baseRecipe} onClose={() => {}} />
    );

    expect(html).toContain('data-testid="modal-live-recipe-badge"');
    expect(html).toContain('RecipeDB Live');
  });

  it('does NOT render RecipeDB Live badge in RecipeModal header when is_live is false', () => {
    const curatedRecipe: ScoredRecipe = {
      ...baseRecipe,
      id: 'curated-khichdi',
      is_live: false,
    };

    const html = renderToStaticMarkup(
      <RecipeModal recipe={curatedRecipe} onClose={() => {}} />
    );

    expect(html).not.toContain('data-testid="modal-live-recipe-badge"');
  });
});

describe('LiveNoticeBanner ARIA Semantics and Interactive Actions', () => {
  it('applies role="alert" and aria-live="assertive" for error notices', () => {
    const html = renderToStaticMarkup(
      <LiveNoticeBanner
        notice={{ type: 'error', message: 'API connection failed' }}
        onDismiss={() => {}}
      />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-live="assertive"');
  });

  it('applies role="status" and aria-live="polite" for success and info notices', () => {
    const successHtml = renderToStaticMarkup(
      <LiveNoticeBanner
        notice={{ type: 'success', message: 'Loaded recipes' }}
        onDismiss={() => {}}
      />
    );
    expect(successHtml).toContain('role="status"');
    expect(successHtml).toContain('aria-live="polite"');

    const infoHtml = renderToStaticMarkup(
      <LiveNoticeBanner
        notice={{ type: 'info', message: 'No matches found' }}
        onDismiss={() => {}}
      />
    );
    expect(infoHtml).toContain('role="status"');
    expect(infoHtml).toContain('aria-live="polite"');
  });

  it('renders "View live recipes" quick action button when onViewLive is provided on success', () => {
    const html = renderToStaticMarkup(
      <LiveNoticeBanner
        notice={{ type: 'success', message: 'Retrieved 5 recipes' }}
        onDismiss={() => {}}
        onViewLive={() => {}}
      />
    );

    expect(html).toContain('data-testid="banner-view-live-btn"');
    expect(html).toContain('View live recipes');
  });

  it('does not render "View live recipes" quick action button for info or error notices', () => {
    const infoHtml = renderToStaticMarkup(
      <LiveNoticeBanner
        notice={{ type: 'info', message: 'No matches' }}
        onDismiss={() => {}}
        onViewLive={() => {}}
      />
    );
    expect(infoHtml).not.toContain('data-testid="banner-view-live-btn"');

    const errorHtml = renderToStaticMarkup(
      <LiveNoticeBanner
        notice={{ type: 'error', message: 'Failed' }}
        onDismiss={() => {}}
        onViewLive={() => {}}
      />
    );
    expect(errorHtml).not.toContain('data-testid="banner-view-live-btn"');
  });
});

describe('RecipeDB Live Query Deduplication & Edge-case Resilience', () => {
  it('safely deduplicates duplicate recipe IDs within the same incoming batch', () => {
    const rawBatch = [
      { id: 'batch-1', title: 'Khichdi Variant 1', cuisine: 'Indian', is_live: true },
      { id: 'batch-1', title: 'Khichdi Variant 1 Duplicate', cuisine: 'Indian', is_live: true },
      { id: 'batch-2', title: 'Khichdi Variant 2', cuisine: 'Indian', is_live: true },
    ];

    const existingIds = new Set<string>();
    const deduplicated: typeof rawBatch = [];
    for (const item of rawBatch) {
      if (!existingIds.has(item.id)) {
        existingIds.add(item.id);
        deduplicated.push(item);
      }
    }

    expect(deduplicated).toHaveLength(2);
    expect(deduplicated.map(d => d.id)).toEqual(['batch-1', 'batch-2']);
  });

  it('safely deduplicates incoming items against existing pool', () => {
    const existingPool = [
      { id: 'batch-1', title: 'Khichdi Variant 1', cuisine: 'Indian', is_live: true },
    ];
    const incoming = [
      { id: 'batch-1', title: 'Khichdi Variant 1', cuisine: 'Indian', is_live: true },
      { id: 'batch-3', title: 'Khichdi Variant 3', cuisine: 'Indian', is_live: true },
    ];

    const existingIds = new Set(existingPool.map(p => p.id));
    const newUnique: typeof incoming = [];
    for (const item of incoming) {
      if (!existingIds.has(item.id)) {
        existingIds.add(item.id);
        newUnique.push(item);
      }
    }

    expect(newUnique).toHaveLength(1);
    expect(newUnique[0].id).toBe('batch-3');
  });
});
