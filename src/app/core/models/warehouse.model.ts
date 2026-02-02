export interface Warehouse {
  id: string;
  name: string;
  contactPerson: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  url: string;
  readyForShop: boolean;
  active: boolean;
  enableForCheckout: boolean;
  shortDescription: string;
  documents: WarehouseDocument[];
  selected?: boolean;
}

export interface WarehouseDocument {
  id: string;
  fileType: string;
  name: string;
  size: string;
  selected?: boolean;
}

export interface WarehousesCollection {
  totalItems: number;
  member: Warehouse[];
}

