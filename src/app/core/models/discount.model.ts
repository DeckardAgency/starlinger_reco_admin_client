export interface Discount {
  id: number;
  name: string;
  isActive: boolean;
  /**
   * Signed percentage as a decimal string (e.g. "-20.0000").
   * Negative = discount (price goes down), positive = markup (price goes up).
   * Range: -100 < x <= 999, never 0.
   */
  adjustmentPercent: string | null;
  /** IRIs of the clients this adjustment applies to (at least one). */
  clients: string[];
  /** Product types (VT/ET) the adjustment is limited to; empty = all. */
  productTypes: string[];
  rules: string | null;
  createdAt: string;
  updatedAt: string;
  selected?: boolean;
}

export interface DiscountsCollection {
  totalItems: number;
  member: Discount[];
}
