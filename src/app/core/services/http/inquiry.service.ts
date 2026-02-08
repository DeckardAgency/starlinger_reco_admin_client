import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, tap } from 'rxjs';
import { environment } from '@env/environment';

export interface InquiryUser {
  '@id': string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  client?: {
    companyName: string;
  };
}

export interface InquiryMachine {
  '@id': string;
  id: string;
  serialNumber?: string;
  products: InquiryProduct[];
}

export interface InquiryProduct {
  '@id': string;
  id: string;
  partNo: string;
  name: string;
  quantity: number;
  unitPrice?: number;
}

export interface Inquiry {
  '@id': string;
  '@type': string;
  id: string;
  inquiryNumber: string;
  status: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  user?: InquiryUser;
  machines?: InquiryMachine[];
  internalReference?: string;
  notes?: string;
}

export interface InquiriesResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: Inquiry[];
  view?: {
    '@id'?: string;
    first?: string;
    last?: string;
    next?: string;
    previous?: string;
  };
}

export interface TransformedInquiriesResponse {
  inquiries: Inquiry[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pagination: {
    first?: string;
    last?: string;
    next?: string;
    previous?: string;
  };
}

export interface InquiryFilters {
  status?: string[];
  isDraft?: boolean;
  inquiryNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InquiryService {
  private apiUrl = `${environment.apiBaseUrl}/api/v1/inquiries`;

  constructor(private http: HttpClient) {}

  /**
   * Get all inquiries with pagination, sorting and filtering
   */
  getInquiries(
    page: number = 1,
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
    filters: InquiryFilters = {}
  ): Observable<TransformedInquiriesResponse> {
    let params = new HttpParams().set('page', page.toString());

    // Add sorting
    if (sortField && sortDirection) {
      params = params.set(`order[${sortField}]`, sortDirection);
    } else {
      // Default sort by createdAt desc (newest first)
      params = params.set('order[createdAt]', 'desc');
    }

    // Add status filters
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach(status => {
        params = params.append('status[]', status);
      });
    }

    // Add isDraft filter
    if (filters.isDraft !== undefined) {
      params = params.set('isDraft', filters.isDraft.toString());
    }

    // Add inquiry number search
    if (filters.inquiryNumber) {
      params = params.set('inquiryNumber', filters.inquiryNumber);
    }

    return this.http.get<InquiriesResponse>(this.apiUrl, { params }).pipe(
      map(response => {
        const transformed: TransformedInquiriesResponse = {
          inquiries: response.member || [],
          totalItems: response.totalItems || 0,
          currentPage: page,
          totalPages: this.extractTotalPages(response),
          pagination: {
            first: response.view?.first,
            last: response.view?.last,
            next: response.view?.next,
            previous: response.view?.previous
          }
        };
        return transformed;
      }),
      catchError(error => {
        console.error('Error fetching inquiries:', error);
        return of({
          inquiries: [],
          totalItems: 0,
          currentPage: page,
          totalPages: 1,
          pagination: {}
        });
      })
    );
  }

  /**
   * Get active inquiries (not draft, status in progress)
   */
  getActiveInquiries(page: number = 1): Observable<TransformedInquiriesResponse> {
    return this.getInquiries(page, 'createdAt', 'desc', {
      isDraft: false,
      status: ['submitted', 'in_review', 'more_info', 'in_progress']
    });
  }

  /**
   * Get completed/cancelled inquiries (history)
   */
  getHistoryInquiries(page: number = 1): Observable<TransformedInquiriesResponse> {
    return this.getInquiries(page, 'createdAt', 'desc', {
      isDraft: false,
      status: ['completed', 'canceled']
    });
  }

  /**
   * Get draft inquiries
   */
  getDraftInquiries(page: number = 1): Observable<TransformedInquiriesResponse> {
    return this.getInquiries(page, 'createdAt', 'desc', {
      isDraft: true
    });
  }

  /**
   * Get a single inquiry by ID
   */
  getInquiry(id: string): Observable<Inquiry> {
    return this.http.get<Inquiry>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update an inquiry
   */
  updateInquiry(id: string, updateData: Partial<Inquiry>): Observable<Inquiry> {
    const options = {
      headers: new HttpHeaders({
        'Content-Type': 'application/merge-patch+json',
        'Accept': 'application/ld+json'
      })
    };

    return this.http.patch<Inquiry>(
      `${this.apiUrl}/${id}`,
      updateData,
      options
    ).pipe(
      tap(response => console.log('Inquiry updated:', response)),
      catchError(error => {
        console.error('Error updating inquiry:', error);
        throw error;
      })
    );
  }

  /**
   * Extract total pages from API response
   */
  private extractTotalPages(response: InquiriesResponse): number {
    const lastPageUrl = response.view?.last;

    if (lastPageUrl) {
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
   * Get status display text
   */
  getStatusDisplay(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'in_review': 'In Review',
      'more_info': 'More Info Needed',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'canceled': 'Cancelled'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status badge variant
   */
  getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
    const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
      'draft': 'secondary',
      'submitted': 'info',
      'in_review': 'warning',
      'more_info': 'warning',
      'in_progress': 'warning',
      'completed': 'success',
      'canceled': 'danger'
    };
    return variantMap[status] || 'secondary';
  }
}
