import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PackagingPrice, PackagingPricesCollection } from '@core/models/packaging-price.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class PackagingPriceService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/packaging_prices`;

  getPackagingPrices(params: Record<string, string | number | boolean> = {}): Observable<PackagingPricesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<PackagingPricesCollection>(this.endpoint, httpParams);
  }

  getPackagingPriceById(id: string): Observable<PackagingPrice> {
    return this.getWithJsonLd<PackagingPrice>(`${this.endpoint}/${id}`);
  }

  createPackagingPrice(packagingPrice: Partial<PackagingPrice>): Observable<PackagingPrice> {
    return this.postWithJsonLd<PackagingPrice>(this.endpoint, packagingPrice);
  }

  updatePackagingPrice(id: string, packagingPrice: Partial<PackagingPrice>): Observable<PackagingPrice> {
    return this.patchWithJsonLd<PackagingPrice>(`${this.endpoint}/${id}`, packagingPrice);
  }

  deletePackagingPrice(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
