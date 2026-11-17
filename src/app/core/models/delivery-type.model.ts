export interface DeliveryType {
  id: number;
  name: string;
  isActive: boolean;
  isDelivery: boolean;
  maxWeight?: string;
  grossFactor?: string | number;
  sortOrder: number;
  shortDescription?: string;
  remoteCode?: string;
  remoteId?: string;
  color?: string;
  hideIfNotApplicable: boolean;
  allowRecurringPayment: boolean;
  readyForShop: boolean;
  useAsDefault: boolean;
  /** DHL | DPD | GLS | UPS | OTHER */
  carrierCode?: string | null;
  /** MyDHL product code booked for this delivery type (null = Express Worldwide) */
  dhlProductCode?: string | null;
  warehouse?: string;
  legacyId?: number;
  createdAt?: string;
  updatedAt?: string;
  selected?: boolean;
  documents?: DeliveryTypeDocument[];
}

export interface DeliveryTypeDocument {
  id: number;
  fileType: string;
  name: string;
  size: string;
  filePath?: string;
  selected?: boolean;
}

export interface DeliveryTypesCollection {
  totalItems: number;
  member: DeliveryType[];
}

