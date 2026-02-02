export interface Country {
  id: string;
  name: string;
  code: string;
  iso31661Alpha3Code?: string;
  europeanUnion?: boolean;
  dhlZone?: string;
  defaultTaxPercent?: number;
  selected?: boolean;
}

export interface CountriesCollection {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  totalItems: number;
  member: Country[];
}

export interface DhlZone {
  value: string;
  label: string;
}

export const DHL_ZONES: DhlZone[] = [
  { value: 'zone1', label: 'Zone 1' },
  { value: 'zone2', label: 'Zone 2' },
  { value: 'zone3', label: 'Zone 3' },
  { value: 'zone4', label: 'Zone 4' },
  { value: 'zone5', label: 'Zone 5' },
  { value: 'zone6', label: 'Zone 6' },
  { value: 'zone7', label: 'Zone 7' },
  { value: 'zone8', label: 'Zone 8' }
];

