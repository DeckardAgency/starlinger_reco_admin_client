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
    return this.postWithJsonLd<DeliveryPrice>(this.endpoint, deliveryPrice);
  }

  updateDeliveryPrice(id: string, deliveryPrice: Partial<DeliveryPrice>): Observable<DeliveryPrice> {
    return this.patchWithJsonLd<DeliveryPrice>(`${this.endpoint}/${id}`, deliveryPrice);
  }

  deleteDeliveryPrice(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
