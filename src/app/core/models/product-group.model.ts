/**
 * Product Group Model
 * Represents a category/group of products in the shop
 */

export interface ProductGroup {
  '@id': string;
  '@type': string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  productGroupCode: string;
  parent?: string;
  children?: string[];
  level: number;
  totalProducts: number;
  showOnHomepage: boolean;
  isActive?: boolean;
  sortOrder: number;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductGroupsCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: ProductGroup[];
}
