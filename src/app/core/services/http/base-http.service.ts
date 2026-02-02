import { HttpClient, HttpHeaders, HttpParams, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { normalizeHydraCollection, NormalizedCollection } from '@models/api/hydra-api.model';

/**
 * Base HTTP Service
 *
 * Provides common HTTP functionality for all API services.
 * Eliminates duplicate header creation and URL building logic.
 */
@Injectable()
export abstract class BaseHttpService {
  protected http = inject(HttpClient);
  protected apiUrl = `${environment.apiBaseUrl}${environment.apiPath}`;

  /**
   * Get standard JSON-LD headers for Hydra API
   */
  protected getJsonLdHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('Content-Type', 'application/ld+json')
      .set('Accept', 'application/ld+json');
  }

  /**
   * GET request with JSON-LD headers
   */
  protected getWithJsonLd<T>(url: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(url, {
      headers: this.getJsonLdHeaders(),
      params
    });
  }

  /**
   * POST request with JSON-LD headers
   */
  protected postWithJsonLd<T>(url: string, body: unknown): Observable<T> {
    return this.http.post<T>(url, body, {
      headers: this.getJsonLdHeaders()
    });
  }

  /**
   * PUT request with JSON-LD headers
   */
  protected putWithJsonLd<T>(url: string, body: unknown): Observable<T> {
    return this.http.put<T>(url, body, {
      headers: this.getJsonLdHeaders()
    });
  }

  /**
   * PATCH request with JSON-LD headers
   */
  protected patchWithJsonLd<T>(url: string, body: unknown): Observable<T> {
    return this.http.patch<T>(url, body, {
      headers: this.getJsonLdHeaders()
    });
  }

  /**
   * DELETE request with JSON-LD headers
   */
  protected deleteWithJsonLd<T>(url: string): Observable<T> {
    return this.http.delete<T>(url, {
      headers: this.getJsonLdHeaders()
    });
  }

  /**
   * Simple DELETE request
   */
  protected delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url);
  }

  /**
   * GET request for PDF export
   */
  protected getPdf(url: string): Observable<Blob> {
    return this.http.get(url, {
      headers: new HttpHeaders({
        'Accept': 'application/pdf'
      }),
      responseType: 'blob'
    });
  }

  /**
   * POST FormData for file uploads
   */
  protected postFormData<T>(
    url: string,
    formData: FormData,
    options?: {
      reportProgress?: boolean;
      observe?: 'body' | 'events' | 'response';
    }
  ): Observable<HttpEvent<T> | T> {
    const defaultOptions = {
      reportProgress: false,
      observe: 'body' as const
    };

    const finalOptions = { ...defaultOptions, ...options };

    if (finalOptions.observe === 'events') {
      return this.http.post<T>(url, formData, {
        reportProgress: finalOptions.reportProgress,
        observe: 'events'
      }) as Observable<HttpEvent<T>>;
    }

    return this.http.post<T>(url, formData, {
      reportProgress: finalOptions.reportProgress
    });
  }

  /**
   * Build HttpParams from object, filtering out undefined/null values
   */
  protected buildParams(params: Record<string, string | number | boolean | undefined | null>): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return httpParams;
  }

  /**
   * Build HttpParams supporting arrays for multiple values
   */
  protected buildArrayParams(
    params: Record<string, string | string[] | number | boolean | undefined | null>
  ): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            httpParams = httpParams.append(`${key}[]`, item.toString());
          });
        } else {
          httpParams = httpParams.set(key, value.toString());
        }
      }
    });
    return httpParams;
  }

  /**
   * Build params for user filtering
   */
  protected buildUserFilterParams(
    email: string,
    filters?: {
      status?: string;
      isDraft?: boolean;
      [key: string]: string | boolean | undefined;
    }
  ): HttpParams {
    let params = new HttpParams().set('user.email', email);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }

    return params;
  }

  /**
   * Normalize Hydra collection response
   */
  protected normalizeHydraCollection<T>(response: Record<string, unknown>): NormalizedCollection<T> {
    return normalizeHydraCollection<T>(response);
  }

  /**
   * Transform collection items
   */
  protected transformCollection<T, R = T>(
    source: Observable<NormalizedCollection<T>>,
    transform: (item: T) => R
  ): Observable<NormalizedCollection<R>> {
    return source.pipe(
      map(response => ({
        ...response,
        member: response.member.map(transform)
      }))
    );
  }

  /**
   * Build IRI for a resource
   */
  protected buildIri(resource: string, id: string): string {
    return `${this.apiUrl}/${resource}/${id}`;
  }

  /**
   * Build client-specific URL
   */
  protected buildClientUrl(clientId: string, ...segments: string[]): string {
    return this.buildUrl('client', clientId, ...segments);
  }

  /**
   * Build URL with path segments
   */
  protected buildUrl(...segments: string[]): string {
    return `${this.apiUrl}/${segments.join('/')}`;
  }
}
