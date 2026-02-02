import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Discount, DiscountsCollection } from '@core/models/discount.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class DiscountService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/discounts`;

  getDiscounts(page: number = 1, itemsPerPage: number = 100): Observable<DiscountsCollection> {
    const params = this.buildParams({ page, itemsPerPage });
    return this.getWithJsonLd<DiscountsCollection>(this.endpoint, params);
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
