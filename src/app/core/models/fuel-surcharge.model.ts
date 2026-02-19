export interface FuelSurcharge {
  id: number;
  name?: string;
  date?: string;
  fuelSurcharge?: string;
  deliveryType?: { id: number; name: string } | null;
  sizeFrom?: string;
  sizeTo?: string;
  priceBase?: string;
  selected?: boolean;
}

export interface FuelSurchargesCollection {
  totalItems: number;
  member: FuelSurcharge[];
}
