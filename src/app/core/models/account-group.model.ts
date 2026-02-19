export interface AccountGroup {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  selected?: boolean;
}

export interface AccountGroupsCollection {
  totalItems: number;
  member: AccountGroup[];
}
