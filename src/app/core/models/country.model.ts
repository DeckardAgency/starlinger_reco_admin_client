export interface CountryTaxType {
  '@id'?: string;
  id: string;
  name: string;
  percent: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  iso31661Alpha3Code?: string | null;
  europeanUnion?: boolean;
  dhlZone?: number | null;
  defaultTaxPercent?: string | null;
  taxType?: CountryTaxType | string | null;
  isActive?: boolean;
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
  { value: '1', label: 'Zone 1' },
  { value: '2', label: 'Zone 2' },
  { value: '3', label: 'Zone 3' },
  { value: '4', label: 'Zone 4' },
  { value: '5', label: 'Zone 5' },
  { value: '6', label: 'Zone 6' },
  { value: '7', label: 'Zone 7' },
  { value: '8', label: 'Zone 8' }
];

