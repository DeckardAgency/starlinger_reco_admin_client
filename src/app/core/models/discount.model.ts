export interface Discount {
  id: string;
  name: string;
  isActive: boolean;
  dateValidFrom: string | null;
  dateValidTo: string | null;
  priority: number;
  discountPercent: string | null;
  rules: string | null;
  legacyId: number | null;
  createdAt: string;
  updatedAt: string;
  selected?: boolean;
}

export interface DiscountsCollection {
  totalItems: number;
  member: Discount[];
}
