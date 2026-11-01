// app/api/proxy/route.ts
import { NextRequest } from 'next/server';

const UPSTREAM = {
  flavordb: {
    base: 'https://cosylab.iiitd.edu.in/flavordb2/api',
    allow: [
      /^properties\/(taste-threshold|by-description)$/,
      /^molecules_data\/(filter-by-type|by-commonName)$/,
      /^entities\/by-entity-alias-readable$/,
    ],
  },
  recipedb: {
    base: 'https://cosylab.iiitd.edu.in/recipedb/api',
    allow: [
      /^recipe-bytitle\/recipeByTitle$/,
      /^recipes_cuisine\/cuisine\/[A-Za-z0-9 _%-]+$/,
      /^recipes\/ingredient$/,
    ],
  },
} as const;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const db = sp.get('db') as keyof typeof UPSTREAM | null;
  const endpoint = sp.get('endpoint') ?? '';

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
      return Response.json(
        { error: `Upstream HTTP ${upstreamRes.status}` },
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
