export type ProductLinkRelationType = 'alternative' | 'replacement';

export const PRODUCT_LINK_RELATION_TYPES: ReadonlyArray<{ value: ProductLinkRelationType; label: string }> = [
  { value: 'alternative', label: 'Alternative' },
  { value: 'replacement', label: 'Replacement' }
];

export interface ProductProductLink {
  '@id': string;
  '@type': string;
  id: number;
  parentProductId: number;
  childProductId: number;
  relationType: ProductLinkRelationType;
  ord: number | null;
  createdAt: string;
  updatedAt: string;
}

/** POST payload — the backend requires relationType and enforces unique (parent, child). */
export type ProductProductLinkCreate =
  Pick<ProductProductLink, 'parentProductId' | 'childProductId' | 'relationType'> & { ord?: number | null };

/** PATCH (merge-patch) payload — only relationType and ord are mutable. */
export type ProductProductLinkUpdate = Partial<Pick<ProductProductLink, 'relationType' | 'ord'>>;

export interface ProductProductLinksCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: ProductProductLink[];
}
