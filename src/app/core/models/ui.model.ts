// src/app/core/models/ui.model.ts

export interface Breadcrumb {
  label: string;
  link?: string;
}

export interface SectionState {
  details: boolean;
  files: boolean;
  notes: boolean;
}

export interface SearchResult {
  id: number;
  title: string;
  type: string;
  badge?: string;
  active?: boolean;
}

export interface LogMessage {
  type: string;
  date: string;
  time: string;
  user: string;
  message: string;
}
