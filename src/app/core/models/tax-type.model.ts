export interface TaxType {
  id: string;
  name: string;
  percent: number;
  remoteId?: number;
  remoteCode?: string | null;
  selected?: boolean;
}

export interface TaxTypesCollection {
  totalItems: number;
  member: TaxType[];
}

