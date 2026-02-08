export interface ProductDiscount {
  '@id': string;
  '@type': string;
  id: string;
  productId: string;
  discountPriceBase: string | null;
  discountPriceRetail: string | null;
  rebate: string | null;
  type: number | null;
  dateValidFrom: string | null;
  dateValidTo: string | null;
  appliedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDiscountsCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: ProductDiscount[];
}
