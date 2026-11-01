// lib/flavordbClient.ts
import { fetchViaProxy } from './apiClient';
import { MolecularProfile } from './types';

export interface FlavorMolecule {
  id?: number;
  pubchem_id?: number;
  common_name?: string;
  commonName?: string;
  Taste_threshold_values?: string;
  taste_threshold?: number;
  threshold_unit?: string;
  flavor_profile?: string[];
  aroma_descriptors?: string[];
  [key: string]: any;
}

export interface FlavorEntity {
  entity_id: number;
  entity_alias_readable: string;
  category: string;
  molecules_count?: number;
  molecules?: FlavorMolecule[];
  [key: string]: any;
}

/**
 * Normalizes Foodoscope molecule payloads into consistent types:
 * - Upstream '@'-delimited flavor_profile string -> string[]
 * - Taste_threshold_values -> string
 * - taste_threshold -> parsed numeric float
 */
export function normalizeFlavorMolecule(item: any): FlavorMolecule {
  if (!item || typeof item !== 'object') {
    return {
      flavor_profile: [],
    };
  }

  // Foodoscope returns flavor_profile as an '@'-delimited string (e.g. "acidic@sour@citrus")
  let flavorProfile: string[] = [];
  const rawProfile = item.flavor_profile ?? item.flavorProfile;
  if (Array.isArray(rawProfile)) {
    flavorProfile = rawProfile.map((s: any) => String(s).trim()).filter(Boolean);
  } else if (typeof rawProfile === 'string') {
    flavorProfile = rawProfile
      .split('@')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  // Normalize aroma_descriptors if present
  let aromaDescriptors: string[] | undefined = undefined;
  const rawAroma = item.aroma_descriptors ?? item.aromaDescriptors;
  if (Array.isArray(rawAroma)) {
    aromaDescriptors = rawAroma.map((s: any) => String(s).trim()).filter(Boolean);
  } else if (typeof rawAroma === 'string') {
    aromaDescriptors = rawAroma
      .split('@')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  // Foodoscope returns Taste_threshold_values as a string
  const rawThreshold =
    item.Taste_threshold_values ??
    item.taste_threshold ??
    item.taste_threshold_values ??
    item.Taste_Threshold_Values;

  const tasteThresholdValues: string | undefined =
    rawThreshold !== undefined && rawThreshold !== null ? String(rawThreshold).trim() : undefined;

  let numericThreshold: number | undefined = undefined;
  if (typeof item.taste_threshold === 'number' && !isNaN(item.taste_threshold)) {
    numericThreshold = item.taste_threshold;
  } else if (tasteThresholdValues !== undefined) {
    const parsed = parseFloat(tasteThresholdValues);
    if (!isNaN(parsed)) {
      numericThreshold = parsed;
    }
  }

  let pubchemId: number | undefined = undefined;
  const rawPubchem = item.pubchem_id ?? item.pubchemId ?? item.pubchem_CID;
  if (rawPubchem !== undefined && rawPubchem !== null) {
    const n = Number(rawPubchem);
    if (!isNaN(n) && n > 0) {
      pubchemId = n;
    }
  }

  const commonName = item.common_name ?? item.commonName ?? item.name;

  return {
    ...item,
    id: item.id ?? item.molecule_id,
    pubchem_id: pubchemId,
    common_name: commonName,
    commonName: commonName,
    Taste_threshold_values: tasteThresholdValues,
    taste_threshold: numericThreshold,
    threshold_unit: item.threshold_unit ?? 'umol/ml',
    flavor_profile: flavorProfile,
    aroma_descriptors: aromaDescriptors ?? flavorProfile,
  };
}

/**
 * Maps FlavorDB molecule responses to the internal MolecularProfile interface
 * using Laplace smoothing (epsilon=5) as specified in ADR-004.
 */
export function adaptFlavorMoleculesToMolecularProfile(
  molecules: FlavorMolecule[],
  options?: { confidence?: 'ok' | 'low'; entityName?: string }
): MolecularProfile {
  const n_total = molecules.length;
  const epsilon = 5;

  let n_sour = 0;
  let n_sweet = 0;
  let n_umami = 0;
  let n_bitter = 0;
  let n_nausea = 0;

  const keyMolecules: NonNullable<MolecularProfile['key_molecules']> = [];

  for (const rawMol of molecules) {
    const mol = normalizeFlavorMolecule(rawMol);
    const profiles = (mol.flavor_profile ?? []).map(p => p.toLowerCase());
    const aromas = (mol.aroma_descriptors ?? []).map(a => a.toLowerCase());
    const allDescriptors = Array.from(new Set([...profiles, ...aromas]));

    const isSour = allDescriptors.some(d => /sour|acid|tart|citrus|vinegar|astringent/i.test(d));
    const isSweet = allDescriptors.some(d => /sweet|caramel|fruit|honey|sugar|vanilla|malt/i.test(d));
    const isUmami = allDescriptors.some(d => /umami|savory|meaty|broth|glutamate|earth|mushroom/i.test(d));
    const isBitter = allDescriptors.some(d => /bitter|acrid|phenolic|harsh|roast|smoke|burnt/i.test(d));
    const isNausea = allDescriptors.some(d =>
      /sulfur|alliaceous|pungent|onion|garlic|cabbage|putrid|fecal|rot|fish|rancid|metallic|chemical|gas/i.test(d)
    );

    if (isSour) n_sour++;
    if (isSweet) n_sweet++;
    if (isUmami) n_umami++;
    if (isBitter) n_bitter++;
    if (isNausea) n_nausea++;

    if (keyMolecules.length < 5 && (mol.common_name || mol.commonName)) {
      const name = (mol.common_name || mol.commonName)!;
      let role = 'Volatile aroma constituent';
      if (isUmami) role = 'T1R1/T1R3 intact pathway agonist';
      else if (isSweet) role = 'Mild carbohydrate / sweet perception';
      else if (isSour) role = 'Natural metal chelator / acid perception';
      else if (isBitter) role = 'TAS2R bitter receptor agonist';
      else if (isNausea) role = 'High volatility olfactory emetic trigger';

      keyMolecules.push({
        name,
        pubchem_id: mol.pubchem_id,
        descriptors: allDescriptors.slice(0, 4),
        role,
      });
    }
  }

  const denom = Math.max(1, n_total + epsilon);

  return {
    n_total,
    pct: {
      sour: Math.round((n_sour / denom) * 100) / 100,
      sweet: Math.round((n_sweet / denom) * 100) / 100,
      umami: Math.round((n_umami / denom) * 100) / 100,
      bitter: Math.round((n_bitter / denom) * 100) / 100,
      nausea_aroma: Math.round((n_nausea / denom) * 100) / 100,
    },
    confidence: options?.confidence ?? (n_total >= 10 ? 'ok' : 'low'),
    key_molecules: keyMolecules,
  };
}

/**
 * Adapts FlavorDB entity and optional molecule responses into MolecularProfile.
 */
export function adaptFlavorEntityToMolecularProfile(
  entity: FlavorEntity | any,
  molecules?: FlavorMolecule[]
): MolecularProfile {
  const molList = molecules ?? (Array.isArray(entity?.molecules) ? entity.molecules : []);
  return adaptFlavorMoleculesToMolecularProfile(molList, {
    entityName: entity?.entity_alias_readable,
    confidence: molList.length >= 10 ? 'ok' : 'low',
  });
}

function extractList(raw: any): any[] {
  const content = raw?.content ?? (Array.isArray(raw) ? raw : (raw?.data ?? []));
  if (Array.isArray(content)) return content.filter(Boolean);
  if (content && typeof content === 'object' && !('error' in content) && Object.keys(content).length > 0) {
    return [content];
  }
  return [];
}

export const flavordbClient = {
  /**
   * Fetches taste thresholds from FlavorDB.
   * Foodoscope requires a non-empty `values` parameter (defaults to 'sweet' to prevent HTTP 400).
   */
  async getTasteThresholds(values: string = 'sweet'): Promise<FlavorMolecule[]> {
    const queryValue = values && typeof values === 'string' && values.trim().length > 0 ? values.trim() : 'sweet';
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'properties/taste-threshold',
      params: { values: queryValue },
    });
    return extractList(raw).map(normalizeFlavorMolecule);
  },

  async getMoleculesByDescription(description: string): Promise<FlavorMolecule[]> {
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'properties/by-description',
      params: { desc: description },
    });
    return extractList(raw).map(normalizeFlavorMolecule);
  },

  async getMoleculesByType(type: string): Promise<FlavorMolecule[]> {
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'molecules_data/filter-by-type',
      params: { type },
    });
    return extractList(raw).map(normalizeFlavorMolecule);
  },

  async getMoleculeDetails(commonName: string): Promise<FlavorMolecule | null> {
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'molecules_data/by-commonName',
      params: { common_name: commonName },
    });
    const list = extractList(raw);
    const first = list.length > 0 ? list[0] : null;
    return first ? normalizeFlavorMolecule(first) : null;
  },

  async getEntityByAlias(name: string): Promise<FlavorEntity[]> {
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'entities/by-entity-alias-readable',
      params: { entity_alias_readable: name },
    });
    return extractList(raw);
  },
};
