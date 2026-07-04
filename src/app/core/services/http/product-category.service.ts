import { Injectable } from '@angular/core';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ProductCategory, ProductCategoriesCollection } from '@core/models';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService extends BaseHttpService {

  private readonly endpoint = `${this.apiUrl}/product_groups`;

  // Cache observable to avoid repeated API calls for reference data
  private allProductCategories$: Observable<ProductCategoriesCollection> | null = null;

  /**
   * Get all product categories with optional pagination
   */
  getProductCategories(params: Record<string, string | number | boolean> = {}): Observable<ProductCategoriesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<ProductCategoriesCollection>(this.endpoint, httpParams);
  }

  /**
   * Get all product categories for dropdowns (cached).
   * Cache is invalidated on create/update/delete.
   */
  getAllProductCategories(): Observable<ProductCategoriesCollection> {
    if (!this.allProductCategories$) {
      this.allProductCategories$ = this.getProductCategories({ page: 1, itemsPerPage: 100 }).pipe(
        catchError(error => {
          this.allProductCategories$ = null;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.allProductCategories$;
  }

  /**
   * Clear cached data (call when you need fresh data)
   */
  clearCache(): void {
    this.allProductCategories$ = null;
  }

  /**
   * Get product categories that should be shown on homepage
   */
  getHomepageCategories(): Observable<ProductCategoriesCollection> {
    const params = this.buildParams({
      showOnHomepage: true,
      isActive: true
    });

    return this.getWithJsonLd<ProductCategoriesCollection>(this.endpoint, params);
  }

  /**
   * Get a single product category by ID
   */
  getProductCategoryById(id: string): Observable<ProductCategory> {
    return this.getWithJsonLd<ProductCategory>(`${this.endpoint}/${id}`);
  }

  /**
   * Get product category by slug
   */
  getProductCategoryBySlug(slug: string): Observable<ProductCategoriesCollection> {
    const params = this.buildParams({ slug });
    return this.getWithJsonLd<ProductCategoriesCollection>(this.endpoint, params);
  }

  /**
   * Get product category by code
   */
  getProductCategoryByCode(code: string): Observable<ProductCategoriesCollection> {
    const params = this.buildParams({ productGroupCode: code });
    return this.getWithJsonLd<ProductCategoriesCollection>(this.endpoint, params);
  }

  /**
   * Get child categories for a parent category
   */
  getChildCategories(parentId: string): Observable<ProductCategoriesCollection> {
    const params = new HttpParams().set('parent', parentId);
    return this.getWithJsonLd<ProductCategoriesCollection>(this.endpoint, params);
  }

  /**
   * Get root-level categories (no parent)
   */
  getRootCategories(): Observable<ProductCategoriesCollection> {
    const params = this.buildParams({
      level: 0,
      isActive: true
    });
    return this.getWithJsonLd<ProductCategoriesCollection>(this.endpoint, params);
  }

  /**
   * Create a new product category
   */
  createProductCategory(data: Partial<ProductCategory>): Observable<ProductCategory> {
    return this.postWithJsonLd<ProductCategory>(this.endpoint, data).pipe(
      tap(() => this.clearCache())
    );
  }

  /**
   * Update an existing product category
   */
  updateProductCategory(id: string, data: Partial<ProductCategory>): Observable<ProductCategory> {
    return this.patchWithJsonLd<ProductCategory>(`${this.endpoint}/${id}`, data).pipe(
      tap(() => this.clearCache())
    );
  }

  /**
   * Delete a product category
   */
  deleteProductCategory(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }
}
