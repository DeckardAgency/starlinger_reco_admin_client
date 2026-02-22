import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeliveryType, DeliveryTypesCollection } from '@core/models/delivery-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/delivery_types`;

  getDeliveryTypes(params: Record<string, string | number | boolean> = {}): Observable<DeliveryTypesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<DeliveryTypesCollection>(this.endpoint, httpParams);
  }

  getDeliveryTypeById(id: string): Observable<DeliveryType> {
    return this.getWithJsonLd<DeliveryType>(`${this.endpoint}/${id}`);
  }

  createDeliveryType(deliveryType: Partial<DeliveryType>): Observable<DeliveryType> {
    const payload = this.transformForApi(deliveryType);
    return this.postWithJsonLd<DeliveryType>(this.endpoint, payload);
  }

  updateDeliveryType(id: string, deliveryType: Partial<DeliveryType>): Observable<DeliveryType> {
    const payload = this.transformForApi(deliveryType);
    return this.patchWithJsonLd<DeliveryType>(`${this.endpoint}/${id}`, payload);
  }

  deleteDeliveryType(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
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
