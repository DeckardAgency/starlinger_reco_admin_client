import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import {
  ImportManual,
  ImportManualsCollection,
  ImportManualStatus,
  ImportManualStatusesCollection,
  ImportManualType,
  ImportManualTypesCollection
} from '@core/models/import-manual.model';
import { BaseHttpService } from './base-http.service';

export interface ImportManualFilters {
  status?: string;
  type?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImportManualService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/import_manuals`;
  private readonly statusEndpoint = `${this.apiUrl}/import_manual_statuses`;
  private readonly typeEndpoint = `${this.apiUrl}/import_manual_types`;

  /**
   * Get paginated list of import manuals
   */
  getImportManuals(
    page: number = 1,
    itemsPerPage: number = 30,
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
    filters?: ImportManualFilters
  ): Observable<ImportManualsCollection> {
    let params = this.buildParams({ page, itemsPerPage });

    if (sortField && sortDirection) {
      params = params.set(`order[${sortField}]`, sortDirection);
    }

    if (filters?.status) {
      params = params.set('status.id', filters.status);
    }

    if (filters?.type) {
      params = params.set('type.id', filters.type);
    }

    if (filters?.search) {
      params = params.set('filename', filters.search);
    }

    return this.getWithJsonLd<ImportManualsCollection>(this.endpoint, params);
  }

  /**
   * Get a single import manual by ID
   */
  getImportManual(id: string): Observable<ImportManual> {
    return this.getWithJsonLd<ImportManual>(`${this.endpoint}/${id}`);
  }

  /**
   * Create a new import manual
   */
  createImportManual(data: Partial<ImportManual>): Observable<ImportManual> {
    return this.postWithJsonLd<ImportManual>(this.endpoint, data);
  }

  /**
   * Update an existing import manual
   */
  updateImportManual(id: string, data: Partial<ImportManual>): Observable<ImportManual> {
    return this.patchWithJsonLd<ImportManual>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete an import manual
   */
  deleteImportManual(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Get all import manual statuses
   */
  getStatuses(): Observable<ImportManualStatusesCollection> {
    const params = this.buildParams({ itemsPerPage: 100 });
    return this.getWithJsonLd<ImportManualStatusesCollection>(this.statusEndpoint, params);
  }

  /**
   * Get a single status by ID
   */
  getStatus(id: string): Observable<ImportManualStatus> {
    return this.getWithJsonLd<ImportManualStatus>(`${this.statusEndpoint}/${id}`);
  }

  /**
   * Get all import manual types
   */
  getTypes(): Observable<ImportManualTypesCollection> {
    const params = this.buildParams({ itemsPerPage: 100 });
    return this.getWithJsonLd<ImportManualTypesCollection>(this.typeEndpoint, params);
  }

  /**
   * Get a single type by ID
   */
  getType(id: string): Observable<ImportManualType> {
    return this.getWithJsonLd<ImportManualType>(`${this.typeEndpoint}/${id}`);
  }
}
