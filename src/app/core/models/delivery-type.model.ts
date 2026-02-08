export interface DeliveryType {
  id: string;
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
  warehouse?: string;
  legacyId?: number;
  createdAt?: string;
  updatedAt?: string;
  selected?: boolean;
  documents?: DeliveryTypeDocument[];
}

export interface DeliveryTypeDocument {
  id: string;
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

