import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FuelSurcharge, FuelSurchargesCollection } from '@core/models/fuel-surcharge.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class FuelSurchargeService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/fuel_surcharges`;

  getFuelSurcharges(params: Record<string, string | number | boolean> = {}): Observable<FuelSurchargesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<FuelSurchargesCollection>(this.endpoint, httpParams);
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
