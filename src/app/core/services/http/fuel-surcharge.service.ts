import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FuelSurcharge, FuelSurchargesCollection } from '@core/models/fuel-surcharge.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class FuelSurchargeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/fuel_surcharges`;

  getFuelSurcharges(page: number = 1, itemsPerPage: number = 100): Observable<FuelSurchargesCollection> {
    const params = this.buildParams({ page, itemsPerPage });
    return this.getWithJsonLd<FuelSurchargesCollection>(this.endpoint, params);
  }

  getFuelSurchargeById(id: string): Observable<FuelSurcharge> {
    return this.getWithJsonLd<FuelSurcharge>(`${this.endpoint}/${id}`);
  }

  createFuelSurcharge(data: Partial<FuelSurcharge>): Observable<FuelSurcharge> {
    return this.postWithJsonLd<FuelSurcharge>(this.endpoint, data);
  }

  updateFuelSurcharge(id: string, data: Partial<FuelSurcharge>): Observable<FuelSurcharge> {
    return this.patchWithJsonLd<FuelSurcharge>(`${this.endpoint}/${id}`, data);
  }

  deleteFuelSurcharge(id: string): Observable<void> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }
}
