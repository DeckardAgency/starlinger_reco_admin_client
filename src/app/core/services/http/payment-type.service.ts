import { Injectable } from '@angular/core';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';
import { PaymentType, PaymentTypesCollection } from '@core/models/payment-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/payment_types`;

  // Cache observable to avoid repeated API calls for reference data
  private allPaymentTypes$: Observable<PaymentTypesCollection> | null = null;

  getPaymentTypes(params: Record<string, string | number | boolean> = {}): Observable<PaymentTypesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<PaymentTypesCollection>(this.endpoint, httpParams);
  }

  /**
   * Get all payment types for dropdowns (cached).
   * Cache is invalidated on create/update/delete.
   */
  getAllPaymentTypes(): Observable<PaymentTypesCollection> {
    if (!this.allPaymentTypes$) {
      this.allPaymentTypes$ = this.getPaymentTypes({ itemsPerPage: 100 }).pipe(
        catchError(error => {
          this.allPaymentTypes$ = null;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.allPaymentTypes$;
  }

  /**
   * Clear cached data (call when you need fresh data)
   */
  clearCache(): void {
    this.allPaymentTypes$ = null;
  }

  getPaymentTypeById(id: string): Observable<PaymentType> {
    return this.getWithJsonLd<PaymentType>(`${this.endpoint}/${id}`);
  }

  createPaymentType(paymentType: Partial<PaymentType>): Observable<PaymentType> {
    const payload = this.transformForApi(paymentType);
    return this.postWithJsonLd<PaymentType>(this.endpoint, payload).pipe(
      tap(() => this.clearCache())
    );
  }

  updatePaymentType(id: string, paymentType: Partial<PaymentType>): Observable<PaymentType> {
    const payload = this.transformForApi(paymentType);
    return this.patchWithJsonLd<PaymentType>(`${this.endpoint}/${id}`, payload).pipe(
      tap(() => this.clearCache())
    );
  }

  deletePaymentType(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }

  /**
   * Transform numeric fields to strings for API Platform compatibility
   * API Platform expects decimal fields as strings to preserve precision
   */
  private transformForApi(paymentType: Partial<PaymentType>): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...paymentType };

    // Convert decimal/numeric fields to strings
    const numericFields = ['paymentFee', 'minCartTotal', 'maxCartTotal'];
    for (const field of numericFields) {
      if (typeof payload[field] === 'number') {
        payload[field] = String(payload[field]);
      }
    }

    return payload;
  }
}
