import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import {
  DhlBookingResponse,
  DhlPickupBookingInput,
  DhlPrefill,
  DhlShipment,
  DhlShipmentsCollection
} from '@core/models/dhl-shipment.model';

/**
 * Admin DHL Express booking API (see backend OrderDhlShipmentController).
 */
@Injectable({ providedIn: 'root' })
export class DhlShipmentService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/v1`;
  private jsonLd = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json', 'Accept': 'application/ld+json' })
  };

  /** Shipments list (admin): API Platform collection with `order.orderNumber`, `status`, `awb` filters. */
  list(params: Record<string, string | number | boolean>): Observable<DhlShipmentsCollection> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { httpParams = httpParams.set(k, String(v)); });
    return this.http.get<DhlShipmentsCollection>(`${this.base}/dhl_shipments`, { params: httpParams, headers: this.jsonLd.headers });
  }

  /** Latest shipment of an order (booked, failed or cancelled), or null. */
  getLatestForOrder(orderId: number | string): Observable<DhlShipment | null> {
    const params = new HttpParams()
      .set('order.id', String(orderId))
      .set('order[createdAt]', 'desc')
      .set('itemsPerPage', '1');
    return this.http.get<{ member: DhlShipment[] }>(`${this.base}/dhl_shipments`, { params, headers: this.jsonLd.headers })
      .pipe(map(res => res.member?.[0] ?? null));
  }

  prefill(orderId: number | string): Observable<DhlPrefill> {
    return this.http.get<DhlPrefill>(`${this.base}/orders/${orderId}/dhl-shipment/prefill`, this.jsonLd);
  }

  book(orderId: number | string, input: DhlPrefill): Observable<DhlBookingResponse> {
    return this.http.post<DhlBookingResponse>(`${this.base}/orders/${orderId}/dhl-shipments`, input, this.jsonLd);
  }

  bookPickup(shipmentId: number, input: DhlPickupBookingInput): Observable<DhlBookingResponse> {
    return this.http.post<DhlBookingResponse>(`${this.base}/dhl_shipments/${shipmentId}/pickup`, input, this.jsonLd);
  }

  cancelPickup(shipmentId: number): Observable<DhlBookingResponse> {
    return this.http.delete<DhlBookingResponse>(`${this.base}/dhl_shipments/${shipmentId}/pickup`, this.jsonLd);
  }

  cancel(shipmentId: number): Observable<DhlBookingResponse> {
    return this.http.post<DhlBookingResponse>(`${this.base}/dhl_shipments/${shipmentId}/cancel`, {}, this.jsonLd);
  }

  /** Label / commercial invoice PDF (admin-only, served from private storage). */
  downloadDocument(shipmentId: number, type: 'label' | 'invoice' | string): Observable<Blob> {
    return this.http.get(`${this.base}/dhl_shipments/${shipmentId}/documents/${type}`, {
      headers: new HttpHeaders({ 'Accept': 'application/pdf' }),
      responseType: 'blob'
    });
  }
}
