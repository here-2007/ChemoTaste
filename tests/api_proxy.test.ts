// tests/api_proxy.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../app/api/proxy/route';
import { NextRequest } from 'next/server';

describe('Hardened API Proxy Security Policy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid database targets with HTTP 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/proxy?db=invalid_db&endpoint=test');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid database target');
  });

  it('rejects path traversal attempts with HTTP 403', async () => {
    const req = new NextRequest('http://localhost:3000/api/proxy?db=flavordb&endpoint=../secret');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('security policy');
  });

  it('rejects unapproved endpoints with HTTP 403', async () => {
    const req = new NextRequest('http://localhost:3000/api/proxy?db=flavordb&endpoint=unauthorized_admin_endpoint');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('security policy');
  });

  it('permits verified RecipeDB recipe-bytitle endpoint regex', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=recipe-bytitle/recipeByTitle&title=miso');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('permits verified RecipeDB search-recipe by id endpoint regex', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { recipe: { Recipe_id: '2642' } } }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=search-recipe/2642');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('permits verified RecipeDB recipebyingredient endpoint regex', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=recipebyingredient/by-ingredients-categories-title&includeIngredients=ginger');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('returns HTTP 503 when upstream returns token exhaustion error ("Not enough tokens")', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Not enough tokens' }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=recipe-bytitle/recipeByTitle&title=khichdi');
    const res = await GET(req);

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe('Foodoscope API Quota Exhausted');
    expect(json.detail).toContain('Account token balance is 0');
  });

  it('returns HTTP 503 when upstream returns credit exhaustion message', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: 'Insufficient credits on account' }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=recipe-bytitle/recipeByTitle&title=soup');
    const res = await GET(req);

    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe('Foodoscope API Quota Exhausted');
  });

  it('preserves upstream HTTP 401 when token is invalid and does not return 503 quota error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Invalid API token provided' }),
    } as Response);

    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=recipe-bytitle/recipeByTitle&title=khichdi');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Upstream HTTP 401');
    expect(json.detail).toBe('Invalid API token provided');
  });

  it('returns HTTP 502 when upstream network request fails or aborts', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Upstream connection reset'));

    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=recipe-bytitle/recipeByTitle&title=khichdi');
    const res = await GET(req);

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBe('Upstream unreachable');
  });
});
