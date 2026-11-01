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
  async getTasteThresholds(): Promise<FlavorMolecule[]> {
    return fetchViaProxy<FlavorMolecule[]>({
      db: 'flavordb',
      endpoint: 'properties/taste-threshold',
    });
  },

  async getMoleculesByDescription(description: string): Promise<FlavorMolecule[]> {
    return fetchViaProxy<FlavorMolecule[]>({
      db: 'flavordb',
      endpoint: 'properties/by-description',
      params: { description },
    });
  },

  async getMoleculesByType(type: string): Promise<FlavorMolecule[]> {
    return fetchViaProxy<FlavorMolecule[]>({
      db: 'flavordb',
      endpoint: 'molecules_data/filter-by-type',
      params: { type },
    });
  },

  async getMoleculeDetails(commonName: string): Promise<FlavorMolecule> {
    return fetchViaProxy<FlavorMolecule>({
      db: 'flavordb',
      endpoint: 'molecules_data/by-commonName',
      params: { commonName },
    });
  },

  async getEntityByAlias(name: string): Promise<FlavorEntity[]> {
    return fetchViaProxy<FlavorEntity[]>({
      db: 'flavordb',
      endpoint: 'entities/by-entity-alias-readable',
      params: { name },
    });
  },
};
