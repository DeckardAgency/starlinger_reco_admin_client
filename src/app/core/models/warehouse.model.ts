export interface WarehouseDocument {
  id: string;
  fileType: string;
  name: string;
  size: string;
  selected?: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  officeName: string;
  address: string;
  city: string;
  country: string | null;
  phone: string;
  email: string;
  url: string;
  latitude: string;
  longitude: string;
  showAsLocation: boolean;
  description: string;
  contactPerson: string;
  remoteId: number | null;
  isActive: boolean;
  readyForShop: boolean;
  keepUrl: boolean;
  autoGenerateUrl: boolean;
  documents: WarehouseDocument[];
  mondayFrom: string | null;
  mondayTo: string | null;
  tuesdayFrom: string | null;
  tuesdayTo: string | null;
  wednesdayFrom: string | null;
  wednesdayTo: string | null;
  thursdayFrom: string | null;
  thursdayTo: string | null;
  fridayFrom: string | null;
  fridayTo: string | null;
  saturdayFrom: string | null;
  saturdayTo: string | null;
  sundayFrom: string | null;
  sundayTo: string | null;
  selected?: boolean;
}

export interface WarehousesCollection {
  totalItems: number;
  member: Warehouse[];
}
