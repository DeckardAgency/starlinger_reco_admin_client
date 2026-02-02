import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ProductGroup, ProductGroupsCollection } from '@core/models';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class ProductGroupService extends BaseHttpService {

  private readonly endpoint = `${this.apiUrl}/product_groups`;

  /**
   * Get all product groups with optional pagination
   */
  getProductGroups(page: number = 1, itemsPerPage: number = 30): Observable<ProductGroupsCollection> {
    const params = this.buildParams({
      page,
      itemsPerPage
    });

    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Get product groups that should be shown on homepage
   */
  getHomepageGroups(): Observable<ProductGroupsCollection> {
    const params = this.buildParams({
      showOnHomepage: true,
      isActive: true
    });

    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Get a single product group by ID
   */
  getProductGroupById(id: string): Observable<ProductGroup> {
    return this.getWithJsonLd<ProductGroup>(`${this.endpoint}/${id}`);
  }

  /**
   * Get product group by slug
   */
  getProductGroupBySlug(slug: string): Observable<ProductGroupsCollection> {
    const params = this.buildParams({ slug });
    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Get product group by code
   */
  getProductGroupByCode(code: string): Observable<ProductGroupsCollection> {
    const params = this.buildParams({ productGroupCode: code });
    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Get child groups for a parent group
   */
  getChildGroups(parentId: string): Observable<ProductGroupsCollection> {
    const params = new HttpParams().set('parent', parentId);
    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Get root-level groups (no parent)
   */
  getRootGroups(): Observable<ProductGroupsCollection> {
    const params = this.buildParams({
      level: 0,
      isActive: true
    });
    return this.getWithJsonLd<ProductGroupsCollection>(this.endpoint, params);
  }

  /**
   * Create a new product group
   */
  createProductGroup(data: Partial<ProductGroup>): Observable<ProductGroup> {
    return this.postWithJsonLd<ProductGroup>(this.endpoint, data);
  }

  /**
   * Update an existing product group
   */
  updateProductGroup(id: string, data: Partial<ProductGroup>): Observable<ProductGroup> {
    return this.patchWithJsonLd<ProductGroup>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete a product group
   */
  deleteProductGroup(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
