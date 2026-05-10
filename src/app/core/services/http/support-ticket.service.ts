import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { SupportTicket, SupportTicketsResponse, TransformedSupportTicketsResponse } from '@models/support-ticket.model';

@Injectable({
  providedIn: 'root'
})
export class SupportTicketService {
  private apiUrl = `${environment.apiBaseUrl}/api/v1/support_tickets`;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Get support tickets with pagination, sorting and filtering
   */
  getSupportTickets(
    page: number = 1,
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
    searchParams: Record<string, string> = {},
    filters: { status?: string[], urgency?: string[] } = {}
  ): Observable<TransformedSupportTicketsResponse> {
    let params = new HttpParams().set('page', page.toString());

    // Add sorting parameters
    if (sortField && sortDirection) {
      params = params.set(`order[${sortField}]`, sortDirection);
    }

    // Add search parameters
    if (searchParams['query']) {
      params = params.set('subject', searchParams['query']);
    }

    // Add status filters if provided
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach(status => {
        params = params.append('status[]', status);
      });
    }

    // Add urgency filters if provided
    if (filters.urgency && filters.urgency.length > 0) {
      filters.urgency.forEach(urgency => {
        params = params.append('urgency[]', urgency);
      });
    }

    // Add any other search parameters
    Object.keys(searchParams).forEach(key => {
      if (key !== 'query') {
        params = params.set(key, searchParams[key]);
      }
    });

    return this.http.get<SupportTicketsResponse>(this.apiUrl, { params }).pipe(
      map(response => {
        const ticketsResponse: TransformedSupportTicketsResponse = {
          tickets: response.member || [],
          totalTickets: response.totalItems || 0,
          pagination: {
            first: response.view?.first,
            last: response.view?.last,
            next: response.view?.next,
            previous: response.view?.previous
          },
          currentPage: page,
          totalPages: this.extractTotalPages(response)
        };
        return ticketsResponse;
      })
    );
  }

  /**
   * Get a single support ticket by ID
   */
  getSupportTicketById(id: string): Observable<SupportTicket> {
    return this.http.get<SupportTicket>(`${this.apiUrl}/${id}`, this.httpOptions);
  }

  /**
   * Update support ticket status (admin only)
   */
  updateStatus(id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed'): Observable<SupportTicket> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/merge-patch+json',
      'Accept': 'application/ld+json'
    });

    return this.http.patch<SupportTicket>(
      `${this.apiUrl}/${id}`,
      { status },
      { headers }
    );
  }

  /**
   * Create a new support ticket.
   *
   * The backend's POST /support_tickets only accepts multipart/form-data
   * (see SupportTicket entity inputFormats config), so we send FormData here
   * even when there's no file attachment. Letting the browser set the
   * Content-Type header automatically (with the boundary) is required.
   */
  createSupportTicket(ticketData: Partial<SupportTicket>): Observable<SupportTicket> {
    const formData = new FormData();
    if (ticketData.subject !== undefined) formData.append('subject', String(ticketData.subject));
    if (ticketData.message !== undefined) formData.append('message', String(ticketData.message));
    if (ticketData.urgency !== undefined) formData.append('urgency', String(ticketData.urgency));
    if (ticketData.orderId !== undefined && ticketData.orderId !== null) formData.append('orderId', String(ticketData.orderId));
    if ((ticketData as any).machine !== undefined && (ticketData as any).machine !== null) {
      formData.append('machine', String((ticketData as any).machine));
    }

    return this.http.post<SupportTicket>(this.apiUrl, formData, {
      headers: new HttpHeaders({ 'Accept': 'application/ld+json' })
    });
  }

  /**
   * Extract total pages from pagination view
   */
  private extractTotalPages(response: SupportTicketsResponse): number {
    if (!response.view?.last) {
      return 1;
    }

    const lastUrl = response.view.last;
    const pageMatch = lastUrl.match(/page=(\d+)/);

    if (pageMatch && pageMatch[1]) {
      return parseInt(pageMatch[1], 10);
    }

    return 1;
  }
}
