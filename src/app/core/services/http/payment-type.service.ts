import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentType, PaymentTypesCollection } from '@core/models/payment-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/payment_types`;

  getPaymentTypes(page: number = 1, itemsPerPage: number = 100): Observable<PaymentTypesCollection> {
    const params = this.buildParams({ page, itemsPerPage });
    return this.getWithJsonLd<PaymentTypesCollection>(this.endpoint, params);
  }

  getPaymentTypeById(id: string): Observable<PaymentType> {
    return this.getWithJsonLd<PaymentType>(`${this.endpoint}/${id}`);
  }

  createPaymentType(paymentType: Partial<PaymentType>): Observable<PaymentType> {
    const payload = this.transformForApi(paymentType);
    return this.postWithJsonLd<PaymentType>(this.endpoint, payload);
  }

  updatePaymentType(id: string, paymentType: Partial<PaymentType>): Observable<PaymentType> {
    const payload = this.transformForApi(paymentType);
    return this.patchWithJsonLd<PaymentType>(`${this.endpoint}/${id}`, payload);
  }

  deletePaymentType(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
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
