import { DrugProfile } from '../lib/types';
import drugProfilesData from './drugProfiles.json';

export const DRUG_PROFILES: Record<string, DrugProfile> = drugProfilesData as Record<string, DrugProfile>;

export const PRESET_REGIMENS: Record<string, { name: string; drugIds: string[]; description: string }> = {
  folfox: {
    name: 'FOLFOX (Oxaliplatin + 5-FU + Leucovorin)',
    drugIds: ['oxaliplatin', '5fu'],
    description: 'Colorectal standard. High risk of cold allodynia and acute oral mucositis. Strict cold and acid blocks required.',
  },
  tc: {
    name: 'TC Regimen (Paclitaxel + Carboplatin)',
    drugIds: ['paclitaxel', 'carboplatin'],
    description: 'Ovarian & lung standard. Elevated sweet detection threshold, metallic phantom, and CYP3A4 sensitivity.',
  },
  ac: {
    name: 'AC Regimen (Doxorubicin + Cyclophosphamide)',
    drugIds: ['cyclophosphamide'],
    description: 'Breast cancer standard. Moderate metallic taste, heightened nausea, and metabolic strain.',
  },
  cisplatin_single: {
    name: 'Cisplatin Monotherapy',
    drugIds: ['cisplatin'],
    description: 'Head & neck, lung, testicular. Severe metallic phantom and elevated sweet threshold; benefit from tart chelation if mucosa is intact.',
  },
};
