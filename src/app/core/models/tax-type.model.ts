export interface TaxType {
  id: number;
  name: string;
  percent: string;
  remoteId?: number | null;
  remoteCode?: string | null;
  isActive?: boolean;
  selected?: boolean;
}

export interface TaxTypesCollection {
  totalItems: number;
  member: TaxType[];
}

