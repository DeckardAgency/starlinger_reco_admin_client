import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductDiscount, ProductDiscountsCollection } from '@core/models/product-discount.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class ProductDiscountService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/product_discounts`;

  getByProductId(productId: string, page: number = 1, itemsPerPage: number = 100): Observable<ProductDiscountsCollection> {
    const params = this.buildParams({ productId, page, itemsPerPage });
    return this.getWithJsonLd<ProductDiscountsCollection>(this.endpoint, params);
  }

  getByDiscountId(discountId: string, page: number = 1, itemsPerPage: number = 100): Observable<ProductDiscountsCollection> {
    const params = this.buildParams({ discountId, page, itemsPerPage });
    return this.getWithJsonLd<ProductDiscountsCollection>(this.endpoint, params);
  }

  createProductDiscount(data: Partial<ProductDiscount>): Observable<ProductDiscount> {
    return this.postWithJsonLd<ProductDiscount>(this.endpoint, data);
  }

  deleteProductDiscount(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
