export interface Account {
  id: number | string;
  code?: string;
  oib: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  purchaseLimit?: number;
  amountSpent?: number;
  createdAt?: string;
  updatedAt?: string;
  // Extended fields for detail view
  isActive?: boolean;
  isLegalEntity?: boolean;
  accountType?: string[];
  phone?: string;
  otherPhone?: string;
  otherEmail?: string;
  fax?: string;
  web?: string;
}

export interface AccountContact {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  isBilling: boolean;
}

export interface AccountAddress {
  id: number;
  type: 'billing' | 'shipping' | 'other';
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AccountsResponse {
  data: Account[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AccountDetailResponse {
  account: Account;
  contacts: AccountContact[];
  addresses: AccountAddress[];
}

// Contact model for the Contacts list page
export interface Contact {
  id: number | string;
  firstName: string;
  lastName: string;
  account: string;
  accountId?: number;
  email: string;
  phone?: string;
}

export interface ContactsResponse {
  data: Contact[];
  total: number;
  page: number;
  pageSize: number;
}
