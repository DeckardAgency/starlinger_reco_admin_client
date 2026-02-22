import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Discount, DiscountsCollection } from '@core/models/discount.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class DiscountService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/discounts`;

  getDiscounts(params: Record<string, string | number | boolean> = {}): Observable<DiscountsCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<DiscountsCollection>(this.endpoint, httpParams);
  }

  getDiscountById(id: string): Observable<Discount> {
    return this.getWithJsonLd<Discount>(`${this.endpoint}/${id}`);
  }

  createDiscount(discount: Partial<Discount>): Observable<Discount> {
    return this.postWithJsonLd<Discount>(this.endpoint, discount);
  }

  updateDiscount(id: string, discount: Partial<Discount>): Observable<Discount> {
    return this.patchWithJsonLd<Discount>(`${this.endpoint}/${id}`, discount);
  }

  deleteDiscount(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
