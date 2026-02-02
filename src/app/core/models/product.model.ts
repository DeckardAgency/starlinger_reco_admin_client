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
  featuredImage: MediaItem | null;
  createdAt: string;
  updatedAt: string;
  imageGallery: MediaItem[];
  documents: string[];
  machines: string[];
}

export interface ProductsCollection {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: Product[];
}
