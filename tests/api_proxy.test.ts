// tests/api_proxy.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '../app/api/proxy/route';
import { NextRequest } from 'next/server';

describe('Hardened API Proxy Security Policy', () => {
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
    // Should pass regex check and proceed to fetch (which may fail due to mock network, returning 502/error rather than 403)
    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=recipe-bytitle/recipeByTitle&title=miso');
    const res = await GET(req);

    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(400);
  });

  it('permits verified RecipeDB search-recipe by id endpoint regex', async () => {
    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=search-recipe/2642');
    const res = await GET(req);

    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(400);
  });

  it('permits verified RecipeDB recipebyingredient endpoint regex', async () => {
    const req = new NextRequest('http://localhost:3000/api/proxy?db=recipedb&endpoint=recipebyingredient/by-ingredients-categories-title&includeIngredients=ginger');
    const res = await GET(req);

    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(400);
  });
});
