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
    return this.postWithJsonLd<DeliveryType>(this.endpoint, deliveryType);
  }

  updateDeliveryType(id: string, deliveryType: Partial<DeliveryType>): Observable<DeliveryType> {
    return this.patchWithJsonLd<DeliveryType>(`${this.endpoint}/${id}`, deliveryType);
  }

  deleteDeliveryType(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
