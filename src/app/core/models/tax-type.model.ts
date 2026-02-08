export interface TaxType {
  id: string;
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

