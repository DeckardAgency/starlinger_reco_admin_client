import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError, tap } from 'rxjs';
import {
  Documentation,
  DocumentationsResponse,
  DocumentationRevision,
  DocumentationRevisionsResponse,
  DocumentationMedia,
  CategoriesResponse
} from '@models/documentation.model';
import { environment } from "@env/environment";
import { LoggerService } from '@core/services/logger.service';

interface HydraResponse<T> {
  '@context': string;
  '@id': string;
  '@type': string;
  'totalItems': number;
  'member': T[];
  'view'?: {
    '@id': string;
    '@type': string;
    'first'?: string;
    'last'?: string;
    'next'?: string;
    'previous'?: string;
  };
}

export interface DeleteResult {
  deletedCount: number;
  failedCount: number;
  successIds: string[];
  failedIds: string[];
}

export interface RestoreResponse {
  message: string;
  documentation: {
    id: string;
    title: string;
    slug: string;
    restoredFromRevision: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {
  private apiUrl = `${environment.apiBaseUrl}/api/v1/documentations`;
  private revisionsUrl = `${environment.apiBaseUrl}/api/v1/documentation_revisions`;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json'
    })
  };

  constructor(private http: HttpClient, private logger: LoggerService) {}

  /**
   * Get documentations with pagination, sorting and filtering
   */
  getDocumentations(
    page: number = 1,
    searchTerm?: string,
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
    category?: string,
    isPublished?: boolean
  ): Observable<DocumentationsResponse> {
    let params = new HttpParams().set('page', page.toString());

    if (searchTerm) {
      params = params.set('title', searchTerm);
    }

    if (sortField && sortDirection) {
      params = params.set(`order[${sortField}]`, sortDirection);
    }

    if (category) {
      params = params.set('category', category);
    }

    if (isPublished !== undefined) {
      params = params.set('isPublished', isPublished.toString());
    }

    return this.http.get<HydraResponse<Documentation>>(this.apiUrl, { params }).pipe(
      tap(response => this.logger.debug('Raw API response:', response)),
      map(response => {
        const documentationsResponse: DocumentationsResponse = {
          documentations: response.member || [],
          totalItems: response.totalItems || 0,
          pagination: {
            first: response.view?.first,
            last: response.view?.last,
            next: response.view?.next,
            previous: response.view?.previous
          },
          currentPage: page,
          totalPages: this.extractTotalPages(response)
        };
        return documentationsResponse;
      }),
      catchError(error => {
        this.logger.error('API error:', error);
        return of({
          documentations: [],
          totalItems: 0,
          pagination: {},
          currentPage: page,
          totalPages: 1
        });
      })
    );
  }

  /**
   * Extract total pages from the response
   */
  private extractTotalPages(response: HydraResponse<Documentation>): number {
    if (response.view?.last) {
      const lastPageUrl = response.view.last;
      const pageMatch = lastPageUrl.match(/[?&]page=(\d+)/);
      if (pageMatch && pageMatch[1]) {
        return parseInt(pageMatch[1], 10);
      }
    }
    if (response.totalItems) {
      const itemsPerPage = 30;
      return Math.ceil(response.totalItems / itemsPerPage);
    }
    return 1;
  }

  /**
   * Get a single documentation by ID (includes revisions)
   */
  getDocumentation(id: string): Observable<Documentation> {
    return this.http.get<Documentation>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get documentation by slug
   */
  getDocumentationBySlug(slug: string): Observable<Documentation> {
    return this.http.get<HydraResponse<Documentation>>(`${this.apiUrl}`, {
      params: new HttpParams().set('slug', slug)
    }).pipe(
      map(response => {
        if (response.member && response.member.length > 0) {
          return response.member[0];
        }
        throw new Error('Documentation not found');
      })
    );
  }

  /**
   * Create a new documentation
   */
  createDocumentation(documentation: Partial<Documentation>): Observable<Documentation> {
    return this.http.post<Documentation>(this.apiUrl, documentation, this.httpOptions);
  }

  /**
   * Update an existing documentation
   */
  updateDocumentation(id: string, documentation: Partial<Documentation>): Observable<Documentation> {
    return this.http.patch<Documentation>(`${this.apiUrl}/${id}`, documentation, {
      headers: new HttpHeaders({
        'Content-Type': 'application/merge-patch+json',
        'Accept': 'application/ld+json'
      })
    });
  }

  /**
   * Delete a documentation
   */
  deleteDocumentation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Delete multiple documentations in parallel
   */
  deleteDocumentations(ids: string[]): Observable<DeleteResult> {
    if (ids.length === 0) {
      return of({
        deletedCount: 0,
        failedCount: 0,
        successIds: [],
        failedIds: []
      });
    }

    const deleteRequests = ids.map(id =>
      this.deleteDocumentation(id).pipe(
        map(() => ({ success: true, id })),
        catchError(error => of({ success: false, id, error }))
      )
    );

    return forkJoin(deleteRequests).pipe(
      map(results => {
        const successResults = results.filter(r => r.success);
        const failedResults = results.filter(r => !r.success);

        return {
          deletedCount: successResults.length,
          failedCount: failedResults.length,
          successIds: successResults.map(r => r.id),
          failedIds: failedResults.map(r => r.id)
        };
      })
    );
  }

  /**
   * Get revisions for a specific documentation
   */
  getRevisions(documentationId: string): Observable<DocumentationRevisionsResponse> {
    return this.http.get<HydraResponse<DocumentationRevision>>(`${this.apiUrl}/${documentationId}/revisions`).pipe(
      map(response => ({
        revisions: response.member || [],
        totalItems: response.totalItems || 0
      })),
      catchError(error => {
        this.logger.error('API error:', error);
        return of({ revisions: [], totalItems: 0 });
      })
    );
  }

  /**
   * Get a single revision by ID
   */
  getRevision(id: string): Observable<DocumentationRevision> {
    return this.http.get<DocumentationRevision>(`${this.revisionsUrl}/${id}`);
  }

  /**
   * Restore documentation from a specific revision
   */
  restoreFromRevision(documentationId: string, revisionId: string): Observable<RestoreResponse> {
    return this.http.post<RestoreResponse>(
      `${this.apiUrl}/${documentationId}/restore/${revisionId}`,
      {},
      this.httpOptions
    );
  }

  /**
   * Get all unique categories
   */
  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${this.apiUrl}/categories`);
  }

  /**
   * Upload an image for a documentation
   */
  uploadMedia(documentationId: string, file: File): Observable<DocumentationMedia> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<DocumentationMedia>(
      `${this.apiUrl}/${documentationId}/media`,
      formData
    );
  }

  /**
   * Get all media for a documentation
   */
  getMedia(documentationId: string): Observable<DocumentationMedia[]> {
    return this.http.get<DocumentationMedia[]>(`${this.apiUrl}/${documentationId}/media`).pipe(
      catchError(error => {
        this.logger.error('Error fetching media:', error);
        return of([]);
      })
    );
  }

  /**
   * Delete a media item from documentation
   */
  deleteMedia(documentationId: string, mediaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${documentationId}/media/${mediaId}`);
  }

  /**
   * Get full URL for a media file
   */
  getMediaUrl(filePath: string): string {
    return `${environment.apiBaseUrl}${filePath}`;
  }
}
