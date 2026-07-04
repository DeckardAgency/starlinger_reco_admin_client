import { Injectable } from '@angular/core';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';
import { DeliveryType, DeliveryTypesCollection } from '@core/models/delivery-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/delivery_types`;

  // Cache observable to avoid repeated API calls for reference data
  private allDeliveryTypes$: Observable<DeliveryTypesCollection> | null = null;

  getDeliveryTypes(params: Record<string, string | number | boolean> = {}): Observable<DeliveryTypesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<DeliveryTypesCollection>(this.endpoint, httpParams);
  }

  /**
   * Get all delivery types for dropdowns (cached).
   * Cache is invalidated on create/update/delete.
   */
  getAllDeliveryTypes(): Observable<DeliveryTypesCollection> {
    if (!this.allDeliveryTypes$) {
      this.allDeliveryTypes$ = this.getDeliveryTypes({ itemsPerPage: 100 }).pipe(
        catchError(error => {
          this.allDeliveryTypes$ = null;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.allDeliveryTypes$;
  }

  /**
   * Clear cached data (call when you need fresh data)
   */
  clearCache(): void {
    this.allDeliveryTypes$ = null;
  }

  getDeliveryTypeById(id: string): Observable<DeliveryType> {
    return this.getWithJsonLd<DeliveryType>(`${this.endpoint}/${id}`);
  }

  createDeliveryType(deliveryType: Partial<DeliveryType>): Observable<DeliveryType> {
    const payload = this.transformForApi(deliveryType);
    return this.postWithJsonLd<DeliveryType>(this.endpoint, payload).pipe(
      tap(() => this.clearCache())
    );
  }

  updateDeliveryType(id: string, deliveryType: Partial<DeliveryType>): Observable<DeliveryType> {
    const payload = this.transformForApi(deliveryType);
    return this.patchWithJsonLd<DeliveryType>(`${this.endpoint}/${id}`, payload).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteDeliveryType(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }

  /**
   * Transform numeric fields to strings for API Platform compatibility
   * API Platform expects decimal fields as strings to preserve precision
   */
  private transformForApi(deliveryType: Partial<DeliveryType>): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...deliveryType };

    // Convert decimal fields to strings
    const decimalFields = ['grossFactor', 'maxWeight'];
    decimalFields.forEach(field => {
      if (typeof payload[field] === 'number') {
        payload[field] = String(payload[field]);
      }
    });

    // sortOrder should remain as integer (backend expects int)

    return payload;
  }
}
