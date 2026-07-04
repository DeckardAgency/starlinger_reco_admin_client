import { Injectable } from '@angular/core';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';
import { TaxType, TaxTypesCollection } from '@core/models/tax-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class TaxTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/tax_types`;

  // Cache observable to avoid repeated API calls for reference data
  private allTaxTypes$: Observable<TaxTypesCollection> | null = null;

  getTaxTypes(params: Record<string, string | number | boolean> = {}): Observable<TaxTypesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<TaxTypesCollection>(this.endpoint, httpParams);
  }

  /**
   * Get all tax types for dropdowns (cached).
   * Cache is invalidated on create/update/delete.
   */
  getAllTaxTypes(): Observable<TaxTypesCollection> {
    if (!this.allTaxTypes$) {
      this.allTaxTypes$ = this.getTaxTypes({ itemsPerPage: 100 }).pipe(
        catchError(error => {
          this.allTaxTypes$ = null;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.allTaxTypes$;
  }

  /**
   * Clear cached data (call when you need fresh data)
   */
  clearCache(): void {
    this.allTaxTypes$ = null;
  }

  getTaxTypeById(id: string): Observable<TaxType> {
    return this.getWithJsonLd<TaxType>(`${this.endpoint}/${id}`);
  }

  createTaxType(taxType: Partial<TaxType>): Observable<TaxType> {
    return this.postWithJsonLd<TaxType>(this.endpoint, taxType).pipe(
      tap(() => this.clearCache())
    );
  }

  updateTaxType(id: string, taxType: Partial<TaxType>): Observable<TaxType> {
    return this.patchWithJsonLd<TaxType>(`${this.endpoint}/${id}`, taxType).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteTaxType(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }
}
