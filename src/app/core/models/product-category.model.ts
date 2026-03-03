/**
 * Product Category Model
 * Represents a product category in the shop
 */

export interface ProductCategory {
  '@id': string;
  '@type': string;
  id: number;
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

export interface ProductCategoriesCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: ProductCategory[];
}

// Backward compatibility aliases
export type ProductGroup = ProductCategory;
export type ProductGroupsCollection = ProductCategoriesCollection;
