export interface PaymentType {
  id: string;
  name: string;
  isActive: boolean;
  enableInstallments: boolean;
  configuration?: Record<string, unknown> | string | null;
  providerCode?: string | null;
  shortDescription?: string;
  remoteCode?: string | null;
  fiscalCode?: string | null;
  paymentFee?: string;
  minCartTotal?: string;
  maxCartTotal?: string;
  color?: string | null;
  icon?: string | null;
  allowRecurringPayment: boolean;
  recurringDaysReminder?: number | null;
  useAsDefault: boolean;
  sortOrder: number;
  legacyId?: number;
  createdAt?: string;
  updatedAt?: string;
  selected?: boolean;
  documents?: PaymentTypeDocument[];
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

