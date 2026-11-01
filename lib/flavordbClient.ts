// lib/flavordbClient.ts
import { fetchViaProxy } from './apiClient';

export interface FlavorMolecule {
  id?: number;
  pubchem_id?: number;
  common_name?: string;
  commonName?: string;
  taste_threshold?: number;
  threshold_unit?: string;
  flavor_profile?: string[];
  aroma_descriptors?: string[];
}

export interface FlavorEntity {
  entity_id: number;
  entity_alias_readable: string;
  category: string;
  molecules_count?: number;
}

export const flavordbClient = {
  async getTasteThresholds(values?: string): Promise<FlavorMolecule[]> {
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'properties/taste-threshold',
      params: values ? { values } : undefined,
    });
    const content = raw?.content ?? (Array.isArray(raw) ? raw : (raw?.data ?? []));
    return Array.isArray(content) ? content : [content];
  },

  async getMoleculesByDescription(description: string): Promise<FlavorMolecule[]> {
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'properties/by-description',
      params: { desc: description },
    });
    const content = raw?.content ?? (Array.isArray(raw) ? raw : (raw?.data ?? []));
    return Array.isArray(content) ? content : [content];
  },

  async getMoleculesByType(type: string): Promise<FlavorMolecule[]> {
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'molecules_data/filter-by-type',
      params: { type },
    });
    const content = raw?.content ?? (Array.isArray(raw) ? raw : (raw?.data ?? []));
    return Array.isArray(content) ? content : [content];
  },

  async getMoleculeDetails(commonName: string): Promise<FlavorMolecule | null> {
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'molecules_data/by-commonName',
      params: { common_name: commonName },
    });
    const content = raw?.content ?? (Array.isArray(raw) ? raw : [raw]);
    return Array.isArray(content) && content.length > 0 ? content[0] : (content || null);
  },

  async getEntityByAlias(name: string): Promise<FlavorEntity[]> {
    const raw = await fetchViaProxy<any>({
      db: 'flavordb',
      endpoint: 'entities/by-entity-alias-readable',
      params: { entity_alias_readable: name },
    });
    const content = raw?.content ?? (Array.isArray(raw) ? raw : (raw?.data ?? []));
    return Array.isArray(content) ? content : [content];
  },
};
