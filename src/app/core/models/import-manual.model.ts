export interface ImportManualStatus {
  '@id'?: string;
  '@type'?: string;
  id: number;
  name: string;
  legacyId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportManualType {
  '@id'?: string;
  '@type'?: string;
  id: number;
  name: string;
  managerCode?: string;
  method?: string;
  estimatedDuration?: number;
  manualTypeCode?: string;
  sendEmail?: boolean;
  emailTemplateCode?: string;
  legacyId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportManualUser {
  '@id'?: string;
  '@type'?: string;
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface ImportManual {
  '@id'?: string;
  '@type'?: string;
  id: number;
  file?: string;
  filename?: string;
  fileType?: string;
  size?: string;
  fileSource?: string;
  dateStarted?: string;
  dateFinished?: string;
  importResult?: string;
  rowsImported?: number;
  inputParameters?: string;
  type?: ImportManualType;
  status?: ImportManualStatus;
  user?: ImportManualUser;
  legacyId?: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface ImportManualsCollection {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  totalItems: number;
  member: ImportManual[];
  view?: {
    '@id': string;
    '@type': string;
    first?: string;
    last?: string;
    next?: string;
    previous?: string;
  };
}

export interface ImportManualStatusesCollection {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  totalItems: number;
  member: ImportManualStatus[];
}

export interface ImportManualTypesCollection {
  '@context'?: string;
  '@id'?: string;
  '@type'?: string;
  totalItems: number;
  member: ImportManualType[];
}
