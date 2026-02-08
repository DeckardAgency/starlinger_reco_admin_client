export interface FuelSurcharge {
  id: string;
  name?: string;
  sizeFrom?: string;
  sizeTo?: string;
  priceBase?: string;
  selected?: boolean;
}

export interface FuelSurchargesCollection {
  totalItems: number;
  member: FuelSurcharge[];
}
