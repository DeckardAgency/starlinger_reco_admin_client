export interface ProductProductLink {
  '@id': string;
  '@type': string;
  id: string;
  parentProductId: string;
  childProductId: string;
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
