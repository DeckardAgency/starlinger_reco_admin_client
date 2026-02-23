import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, ProductsCollection } from '@core/models';
import { BaseHttpService } from './base-http.service';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseHttpService {

  private readonly endpoint = `${this.apiUrl}/products`;

  /**
   * Get all products with optional pagination
   */
  getProducts(params: Record<string, string | number | boolean> = {}): Observable<ProductsCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<ProductsCollection>(this.endpoint, httpParams);
  }

  /**
   * Get a single product by ID
   */
  getProductById(id: string): Observable<Product> {
    return this.getWithJsonLd<Product>(`${this.endpoint}/${id}`);
  }

  /**
   * Get product by slug
   */
  getProductBySlug(slug: string): Observable<ProductsCollection> {
    const params = this.buildParams({ slug });
    return this.getWithJsonLd<ProductsCollection>(this.endpoint, params);
  }

  /**
   * Search products by query (searches name, partNo, shortDescription)
   */
  searchProducts(query: string): Observable<ProductsCollection> {
    const params = this.buildParams({ name: query });
    return this.getWithJsonLd<ProductsCollection>(this.endpoint, params);
  }

  /**
   * Create a new product
   */
  createProduct(productData: Partial<Product>): Observable<Product> {
    return this.postWithJsonLd<Product>(this.endpoint, productData);
  }

  /**
   * Update an existing product
   */
  updateProduct(id: string, productData: Partial<Product>): Observable<Product> {
    return this.patchWithJsonLd<Product>(`${this.endpoint}/${id}`, productData);
  }

  /**
   * Delete a product
   */
  deleteProduct(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Export products to Excel
   */
  exportToExcel(
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
    searchQuery?: string
  ): Observable<Blob> {
    let params = new HttpParams();

    if (sortField && sortDirection) {
      params = params.set(`order[${sortField}]`, sortDirection);
    }
    if (searchQuery) {
      params = params.set('name', searchQuery);
    }

    return this.http.get(
      `${environment.apiBaseUrl}/api/products/export/excel`,
      {
        headers: new HttpHeaders({
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }),
        params,
        responseType: 'blob'
      }
    );
  }
}
