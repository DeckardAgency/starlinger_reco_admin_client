export interface MediaItem {
  '@id': string;
  '@type': string;
  id: string;
  filename: string;
  mimeType: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  '@id': string;
  '@type': string;
  id: string;
  name: string;
  slug: string;
  partNo: string;
  shortDescription: string;
  unit: string;
  price: number;
  weight: string;
  technicalDescription: string;
  machineText: string;
  statistic: string;
  isActive: boolean;
  readyForShop: boolean;
  qty: number | null;
  qtyStep: number | null;
  quoteItemLimit: number | null;
  fixedQty: number | null;
  productGroupId: string | null;
  catalogCode: string | null;
  retailPrice: number | null;
  taxTypeId: string | null;
  currency: string | null;
  discountPercent: number | null;
  discountPrice: number | null;
  featuredImage: MediaItem | null;
  createdAt: string;
  updatedAt: string;
  imageGallery: MediaItem[];
  documents: MediaItem[];
  machines: string[];
}

export interface ProductsCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: Product[];
}
