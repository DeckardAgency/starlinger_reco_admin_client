import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Warehouse, WarehousesCollection } from '@core/models/warehouse.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class WarehouseService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/warehouses`;

  getWarehouses(params: Record<string, string | number | boolean> = {}): Observable<WarehousesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<WarehousesCollection>(this.endpoint, httpParams);
  }

  getWarehouseById(id: string): Observable<Warehouse> {
    return this.getWithJsonLd<Warehouse>(`${this.endpoint}/${id}`);
  }

  createWarehouse(warehouse: Partial<Warehouse>): Observable<Warehouse> {
    return this.postWithJsonLd<Warehouse>(this.endpoint, warehouse);
  }

  updateWarehouse(id: string, warehouse: Partial<Warehouse>): Observable<Warehouse> {
    return this.patchWithJsonLd<Warehouse>(`${this.endpoint}/${id}`, warehouse);
  }

  deleteWarehouse(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
