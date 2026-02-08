import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductProductLink, ProductProductLinksCollection } from '@core/models/product-product-link.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class ProductProductLinkService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/product_product_links`;

  getByParentProductId(parentProductId: string, page: number = 1, itemsPerPage: number = 100): Observable<ProductProductLinksCollection> {
    const params = this.buildParams({ parentProductId, page, itemsPerPage });
    return this.getWithJsonLd<ProductProductLinksCollection>(this.endpoint, params);
  }

  createLink(data: Partial<ProductProductLink>): Observable<ProductProductLink> {
    return this.postWithJsonLd<ProductProductLink>(this.endpoint, data);
  }

  updateLink(id: string, data: Partial<ProductProductLink>): Observable<ProductProductLink> {
    return this.patchWithJsonLd<ProductProductLink>(`${this.endpoint}/${id}`, data);
  }

  deleteLink(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
