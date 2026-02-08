import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeliveryType, DeliveryTypesCollection } from '@core/models/delivery-type.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryTypeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/delivery_types`;

  getDeliveryTypes(page: number = 1, itemsPerPage: number = 100): Observable<DeliveryTypesCollection> {
    const params = this.buildParams({ page, itemsPerPage });
    return this.getWithJsonLd<DeliveryTypesCollection>(this.endpoint, params);
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
