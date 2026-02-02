import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@env/environment';

export interface InfoRequestInquiry {
  '@id': string;
  id: string;
  inquiryNumber: string;
  status: string;
}

export interface InfoRequestPart {
  '@id': string;
  id: string;
  partName: string;
  partNumber: string;
}

export interface InfoRequestSender {
  '@id': string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface InfoRequestMediaItem {
  '@id': string;
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
}

export interface InfoRequestMessage {
  '@id': string;
  id: string;
  messageText: string;
  senderType: 'admin' | 'client';
  sender?: InfoRequestSender;
  createdAt: string;
  mediaItems: InfoRequestMediaItem[];
  attachmentCount: number;
}

export interface InfoRequest {
  '@id': string;
  id: string;
  inquiry: InfoRequestInquiry;
  inquiryMachinePart: InfoRequestPart;
  status: 'pending' | 'responded' | 'accepted' | 'needs_revision';
  createdBy?: InfoRequestSender;
  createdAt: string;
  updatedAt: string;
  messages: InfoRequestMessage[];
  messageCount: number;
}

export interface InfoRequestsResponse {
  'hydra:member'?: InfoRequest[];
  'member'?: InfoRequest[];
  'hydra:totalItems'?: number;
  'totalItems'?: number;
  'hydra:view'?: {
    'hydra:first'?: string;
    'hydra:last'?: string;
    'hydra:next'?: string;
    'hydra:previous'?: string;
  };
  'view'?: {
    '@id'?: string;
    'hydra:first'?: string;
    'hydra:last'?: string;
    'hydra:next'?: string;
    'hydra:previous'?: string;
  };
}

export interface TransformedInfoRequestsResponse {
  infoRequests: InfoRequest[];
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

export interface InfoRequestFilters {
  status?: string[];
  inquiryNumber?: string;
  partName?: string;
  partNumber?: string;
  messageText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InfoRequestService {
  private apiUrl = `${environment.apiBaseUrl}/api/v1/inquiry_part_info_requests`;

  constructor(private http: HttpClient) {}

  /**
   * Get all info requests with pagination, sorting and filtering
   */
  getInfoRequests(
    page: number = 1,
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
    searchParams: Record<string, string> = {},
    filters: InfoRequestFilters = {}
  ): Observable<TransformedInfoRequestsResponse> {
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

    // Add search by inquiry number
    if (filters.inquiryNumber) {
      params = params.set('inquiry.inquiryNumber', filters.inquiryNumber);
    }

    // Add search by part name
    if (filters.partName) {
      params = params.set('inquiryMachinePart.partName', filters.partName);
    }

    // Add search by part number
    if (filters.partNumber) {
      params = params.set('inquiryMachinePart.partNumber', filters.partNumber);
    }

    // Add search by message text
    if (filters.messageText) {
      params = params.set('messageText', filters.messageText);
    }

    // General search - search across inquiry number, part name, part number
    if (searchParams['query']) {
      params = params.set('inquiry.inquiryNumber', searchParams['query']);
    }

    return this.http.get<InfoRequestsResponse>(this.apiUrl, { params }).pipe(
      map(response => {
        // Handle both hydra and non-hydra response formats
        const members = response['hydra:member'] || response['member'] || [];
        const total = response['hydra:totalItems'] ?? response['totalItems'] ?? 0;
        const view = response['hydra:view'] || response['view'];

        const transformed: TransformedInfoRequestsResponse = {
          infoRequests: members,
          totalItems: total,
          currentPage: page,
          totalPages: this.extractTotalPages(response),
          pagination: {
            first: view?.['hydra:first'],
            last: view?.['hydra:last'],
            next: view?.['hydra:next'],
            previous: view?.['hydra:previous']
          }
        };
        return transformed;
      }),
      catchError(error => {
        console.error('Error fetching info requests:', error);
        return of({
          infoRequests: [],
          totalItems: 0,
          currentPage: page,
          totalPages: 1,
          pagination: {}
        });
      })
    );
  }

  /**
   * Get a single info request by ID
   */
  getInfoRequest(id: string): Observable<InfoRequest> {
    return this.http.get<InfoRequest>(`${this.apiUrl}/${id}`);
  }

  /**
   * Extract total pages from API response
   */
  private extractTotalPages(response: InfoRequestsResponse): number {
    const view = response['hydra:view'] || response['view'];
    const lastPageUrl = view?.['hydra:last'];

    if (lastPageUrl) {
      const pageMatch = lastPageUrl.match(/[?&]page=(\d+)/);
      if (pageMatch && pageMatch[1]) {
        return parseInt(pageMatch[1], 10);
      }
    }

    const totalItems = response['hydra:totalItems'] ?? response['totalItems'] ?? 0;
    if (totalItems) {
      const itemsPerPage = 30;
      return Math.ceil(totalItems / itemsPerPage);
    }
    return 1;
  }

  /**
   * Get status display text
   */
  getStatusDisplay(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'responded': 'Responded',
      'accepted': 'Accepted',
      'needs_revision': 'Needs Revision'
    };
    return statusMap[status] || status;
  }

  /**
   * Get status color class
   */
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      'pending': '#f59e0b',      // amber
      'responded': '#3b82f6',    // blue
      'accepted': '#10b981',     // green
      'needs_revision': '#ef4444' // red
    };
    return colorMap[status] || '#6b7280';
  }

  /**
   * Get count of pending info requests (for badge display)
   */
  getPendingCount(): Observable<number> {
    const params = new HttpParams()
      .set('status[]', 'pending')
      .set('page', '1');

    return this.http.get<InfoRequestsResponse>(this.apiUrl, { params }).pipe(
      map(response => {
        return response['hydra:totalItems'] ?? response['totalItems'] ?? 0;
      }),
      catchError(() => of(0))
    );
  }

  /**
   * Get all media items from all messages in an info request
   */
  getAllMediaItems(infoRequest: InfoRequest): InfoRequestMediaItem[] {
    const mediaItems: InfoRequestMediaItem[] = [];
    if (infoRequest.messages) {
      infoRequest.messages.forEach(message => {
        if (message.mediaItems && message.mediaItems.length > 0) {
          mediaItems.push(...message.mediaItems);
        }
      });
    }
    return mediaItems;
  }

  /**
   * Count total attachments in an info request
   */
  getTotalAttachments(infoRequest: InfoRequest): number {
    return this.getAllMediaItems(infoRequest).length;
  }
}
