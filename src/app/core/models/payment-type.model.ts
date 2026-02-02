export interface PaymentType {
  id: string;
  name: string;
  active: boolean;
  readyForShop: boolean;
  enableInstallments: boolean;
  configuration: string | null;
  providerCode: string | null;
  shortDescription: string;
  useAsDefaultBase: boolean;
  remoteCode: string | null;
  paymentFee: number;
  minCartTotalBase: number;
  maxCartTotalBase: number;
  documents: PaymentTypeDocument[];
  selected?: boolean;
}

export interface PaymentTypeDocument {
  id: string;
  fileType: string;
  name: string;
  size: string;
  selected?: boolean;
}

export interface PaymentTypesCollection {
  totalItems: number;
  member: PaymentType[];
}

