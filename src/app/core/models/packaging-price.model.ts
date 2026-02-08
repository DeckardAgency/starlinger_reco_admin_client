export interface PackagingPrice {
  id: string;
  name?: string;
  sizeFrom: string | null;
  sizeTo: string | null;
  priceBase: string;
  legacyId?: number;
  createdAt?: string;
  updatedAt?: string;
  selected?: boolean;
}

export interface PackagingPricesCollection {
  totalItems: number;
  member: PackagingPrice[];
}

