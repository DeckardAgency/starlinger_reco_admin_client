import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { OrderErpSendResponse, OrderErpState } from '@core/models/order-erp.model';

/**
 * Admin view of an order's handoff to abas (see backend OrderErpController),
 * plus the order documents abas sends back (OrderDocumentController).
 */
@Injectable({ providedIn: 'root' })
export class OrderErpService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/v1`;
  private jsonLd = {
    headers: new HttpHeaders({ 'Accept': 'application/ld+json' })
  };

  /** Where the order stands, the message that is (or would be) sent, and the exchange log. */
  get(orderId: number | string): Observable<OrderErpState> {
    return this.http.get<OrderErpState>(`${this.base}/orders/${orderId}/erp`, this.jsonLd);
  }

  /** Sends the order now (or only logs it in log mode). 409 `{ error }` when switched off, a draft, or already with abas. */
  send(orderId: number | string): Observable<OrderErpSendResponse> {
    return this.http.post<OrderErpSendResponse>(`${this.base}/orders/${orderId}/erp/send`, null, this.jsonLd);
  }

  /** Order document PDF; `url` is the relative API path from `order.documents[].url`. */
  downloadDocument(url: string): Observable<Blob> {
    const fullUrl = url.startsWith('http') ? url : `${environment.apiBaseUrl}${url}`;
    return this.http.get(fullUrl, {
      headers: new HttpHeaders({ 'Accept': 'application/pdf' }),
      responseType: 'blob'
    });
  }
}
