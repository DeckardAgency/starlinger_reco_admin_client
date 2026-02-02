import { PaginationLinks } from "@models/pagination.model";

export interface DocumentationMedia {
  '@id'?: string;
  '@type'?: string;
  id: string;
  filename: string;
  mimeType: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface Documentation {
  '@id'?: string;
  '@type'?: string;
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  sortOrder: number;
  isPublished: boolean;
  revisions?: DocumentationRevision[];
  media?: DocumentationMedia[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentationRevision {
  '@id'?: string;
  '@type'?: string;
  id: string;
  title: string;
  content: string;
  editedBy: DocumentationUser | string | null;
  editedAt: string;
  changeNote: string | null;
  revisionNumber: number;
}

export interface DocumentationUser {
  '@id'?: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface DocumentationsResponse {
  documentations: Documentation[];
  totalItems: number;
  pagination: PaginationLinks;
  currentPage: number;
  totalPages: number;
}

export interface DocumentationRevisionsResponse {
  revisions: DocumentationRevision[];
  totalItems: number;
}

export interface CategoriesResponse {
  categories: string[];
}
