import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product, ProductsCollection } from '@core/models';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends BaseHttpService {

  private readonly endpoint = `${this.apiUrl}/products`;

  /**
   * Get all products with optional pagination
   */
  getProducts(page: number = 1, itemsPerPage: number = 30): Observable<ProductsCollection> {
    const params = this.buildParams({
      page,
      itemsPerPage
    });

    return this.getWithJsonLd<ProductsCollection>(this.endpoint, params);
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
}
