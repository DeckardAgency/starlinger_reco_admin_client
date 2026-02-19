export interface DeliveryPriceDeliveryType {
  '@id'?: string;
  id: number;
  name: string;
}

export interface DeliveryPrice {
  id: number;
  name: string;
  deliveryType: DeliveryPriceDeliveryType | string | null;
  dhlZone: number | null;
  postalCodeFrom: string | null;
  postalCodeTo: string | null;
  excludePostalCodes: string | null;
  sizeFrom: string | null;
  sizeTo: string | null;
  priceBase: string | null;
  deliveryDays: number | null;
  stepStartsAt: string | null;
  forEveryNextSize: string | null;
  priceBaseStep: string | null;
  legacyId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  selected?: boolean;
}

export interface DeliveryPricesCollection {
  totalItems: number;
  member: DeliveryPrice[];
}
