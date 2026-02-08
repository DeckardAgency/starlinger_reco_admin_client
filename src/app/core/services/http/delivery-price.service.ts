import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DeliveryPrice, DeliveryPricesCollection } from '@core/models/delivery-price.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryPriceService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/delivery_prices`;

  getDeliveryPrices(page: number = 1, itemsPerPage: number = 100): Observable<DeliveryPricesCollection> {
    const params = this.buildParams({ page, itemsPerPage });
    return this.getWithJsonLd<DeliveryPricesCollection>(this.endpoint, params);
  }

  getDeliveryPriceById(id: string): Observable<DeliveryPrice> {
    return this.getWithJsonLd<DeliveryPrice>(`${this.endpoint}/${id}`);
  }

  createDeliveryPrice(deliveryPrice: Partial<DeliveryPrice>): Observable<DeliveryPrice> {
    const payload = this.transformForApi(deliveryPrice);
    return this.postWithJsonLd<DeliveryPrice>(this.endpoint, payload);
  }

  updateDeliveryPrice(id: string, deliveryPrice: Partial<DeliveryPrice>): Observable<DeliveryPrice> {
    const payload = this.transformForApi(deliveryPrice);
    return this.patchWithJsonLd<DeliveryPrice>(`${this.endpoint}/${id}`, payload);
  }

  deleteDeliveryPrice(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Transform fields for API Platform compatibility.
   * - Decimal fields must be strings to preserve precision.
   * - deliveryType must be sent as an IRI string.
   * - dhlZone must be an integer or null.
   * - Never send 'id' in the payload.
   */
  private transformForApi(deliveryPrice: Partial<DeliveryPrice>): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...deliveryPrice };

    // Never send id in the body
    delete payload['id'];

    // Convert deliveryType to IRI string for API Platform
    if (payload['deliveryType'] != null) {
      const dt = payload['deliveryType'];
      if (typeof dt === 'object' && dt !== null && 'id' in (dt as Record<string, unknown>)) {
        payload['deliveryType'] = `/api/v1/delivery_types/${(dt as Record<string, unknown>)['id']}`;
      } else if (typeof dt === 'string' && dt !== '' && !dt.startsWith('/api/')) {
        // Plain UUID string - convert to IRI
        payload['deliveryType'] = `/api/v1/delivery_types/${dt}`;
      }
    }
    if (payload['deliveryType'] === '' || payload['deliveryType'] === null) {
      payload['deliveryType'] = null;
    }

    // Convert decimal fields to strings
    const decimalFields = ['sizeFrom', 'sizeTo', 'priceBase', 'stepStartsAt', 'forEveryNextSize', 'priceBaseStep'];
    decimalFields.forEach(field => {
      if (typeof payload[field] === 'number') {
        payload[field] = String(payload[field]);
      }
    });

    // Convert dhlZone to integer if it's a string
    if (payload['dhlZone'] != null) {
      if (typeof payload['dhlZone'] === 'string' && payload['dhlZone'] !== '') {
        const parsed = parseInt(payload['dhlZone'] as string, 10);
        payload['dhlZone'] = !isNaN(parsed) ? parsed : null;
      }
    }
    if (payload['dhlZone'] === '' || payload['dhlZone'] === undefined) {
      payload['dhlZone'] = null;
    }

    // Convert deliveryDays to integer if it's a string
    if (payload['deliveryDays'] != null) {
      if (typeof payload['deliveryDays'] === 'string' && payload['deliveryDays'] !== '') {
        const parsed = parseInt(payload['deliveryDays'] as string, 10);
        payload['deliveryDays'] = !isNaN(parsed) ? parsed : null;
      }
    }
    if (payload['deliveryDays'] === '' || payload['deliveryDays'] === undefined) {
      payload['deliveryDays'] = null;
    }

    // Remove read-only fields
    delete payload['legacyId'];
    delete payload['createdAt'];
    delete payload['updatedAt'];
    delete payload['selected'];

    return payload;
  }
}
