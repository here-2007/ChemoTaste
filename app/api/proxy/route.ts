// app/api/proxy/route.ts
import { NextRequest } from 'next/server';

const UPSTREAM = {
  flavordb: {
    base: process.env.FOODOSCOPE_FLAVORDB_BASE ?? 'https://api.foodoscope.com/flavordb',
    allow: [
      /^properties\/(taste-threshold|by-description)$/,
      /^molecules_data\/(filter-by-type|by-commonName)$/,
      /^entities\/by-entity-alias-readable$/,
    ],
  },
  recipedb: {
    base: process.env.FOODOSCOPE_RECIPEDB_BASE ?? 'https://api.foodoscope.com/recipe2-api',
    allow: [
      /^recipe-bytitle\/recipeByTitle$/,
      /^recipes_cuisine\/cuisine\/[A-Za-z0-9 _%-]+$/,
      /^recipebyingredient\/by-ingredients-categories-title$/,
      /^search-recipe\/[A-Za-z0-9_-]+$/,
      /^recipe\/recipesinfo$/,
      /^recipe\/region-diet\/region-diet$/,
      /^recipe\/recipe-day\/with-ingredients-categories$/,
    ],
  },
} as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const db = sp.get('db') as keyof typeof UPSTREAM | null;
  const endpoint = (sp.get('endpoint') ?? '').replace(/^\/+/, '');

  if (!db || !(db in UPSTREAM)) {
    return Response.json({ error: 'Invalid database target' }, { status: 400 });
  }

  if (endpoint.includes('..') || !UPSTREAM[db].allow.some(rx => rx.test(endpoint))) {
    return Response.json({ error: 'Endpoint not permitted by security policy' }, { status: 403 });
  }

  const forward = new URLSearchParams(sp);
  forward.delete('db');
  forward.delete('endpoint');
  const targetUrl = `${UPSTREAM[db].base}/${endpoint}${forward.toString() ? '?' + forward.toString() : ''}`;

  try {
    const authHeader = process.env.FOODOSCOPE_AUTH_HEADER ?? 'Authorization';
    const authPrefix = process.env.FOODOSCOPE_AUTH_PREFIX ?? 'Bearer ';
    const apiKey = process.env.FOODOSCOPE_API_KEY ?? '';

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        [authHeader]: `${authPrefix}${apiKey}`,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    if (!upstreamRes.ok) {
      let errBodyText = '';
      try {
        errBodyText = await upstreamRes.text();
      } catch {}

      let parsedErr: any = null;
      try {
        parsedErr = JSON.parse(errBodyText);
      } catch {}

      const errorMsg =
        (typeof parsedErr === 'object' && parsedErr !== null
          ? parsedErr.message || parsedErr.error || parsedErr.detail || parsedErr.msg
          : null) || errBodyText;

      const lowerMsg = String(errorMsg).toLowerCase();
      const isAuthError =
        upstreamRes.status === 401 ||
        lowerMsg.includes('invalid') ||
        lowerMsg.includes('unauthorized') ||
        lowerMsg.includes('forbidden');

      const isQuotaExhausted =
        !isAuthError &&
        (lowerMsg.includes('not enough tokens') ||
          lowerMsg.includes('out of token') ||
          lowerMsg.includes('insufficient token') ||
          lowerMsg.includes('token balance') ||
          lowerMsg.includes('credit') ||
          lowerMsg.includes('quota') ||
          upstreamRes.status === 429 ||
          (upstreamRes.status === 400 && lowerMsg.includes('token')));

      if (isQuotaExhausted) {
        return Response.json(
          {
            error: 'Foodoscope API Quota Exhausted',
            detail: 'Account token balance is 0. ChemoTaste is running in offline baseline mode.',
          },
          { status: 503 }
        );
      }

      return Response.json(
        { error: `Upstream HTTP ${upstreamRes.status}`, detail: errorMsg || undefined },
        { status: upstreamRes.status }
      );
    }

    const data = await upstreamRes.json();
    return Response.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err: any) {
    return Response.json(
      { error: 'Upstream unreachable', detail: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}
