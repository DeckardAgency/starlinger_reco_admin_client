export interface ProductProductLink {
  '@id': string;
  '@type': string;
  id: number;
  parentProductId: number;
  childProductId: number;
  relationTypeId: number | null;
  ord: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductProductLinksCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: ProductProductLink[];
}
