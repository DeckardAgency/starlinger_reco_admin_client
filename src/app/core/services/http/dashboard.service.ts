import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '@env/environment';

export interface DashboardOrder {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    totalAmount: number;
    itemsCount?: number;
    totalQuantity?: number;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        client?: {
            companyName: string;
        };
    };
}

export interface StatusDistribution {
    status: string;
    count: number;
    label: string;
}

export interface OrderStatusDistributionResponse {
    distribution: StatusDistribution[];
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) {}

    /**
     * Get recent orders for dashboard
     */
    getRecentOrders(limit: number = 5): Observable<DashboardOrder[]> {
        const params = new HttpParams()
            .set('itemsPerPage', limit.toString())
            .set('order[createdAt]', 'desc')
            .set('isDraft', 'false');

        return this.http.get<any>(`${this.apiUrl}/api/v1/orders`, { params }).pipe(
            map(response => response.member || []),
            catchError(error => {
                console.error('Error fetching recent orders:', error);
                return of([]);
            })
        );
    }

    /**
     * Get order status distribution for dashboard chart
     */
    getOrderStatusDistribution(): Observable<OrderStatusDistributionResponse> {
        return this.http.get<OrderStatusDistributionResponse>(
            `${this.apiUrl}/api/v1/dashboard/order-status-distribution`
        ).pipe(
            catchError(error => {
                console.error('Error fetching order status distribution:', error);
                return of({
                    distribution: [],
                    total: 0
                });
            })
        );
    }

    /**
     * Get status label for display
     */
    getStatusLabel(status: string): string {
        const statusLabels: Record<string, string> = {
            'draft': 'Draft',
            'new': 'New',
            'in_process': 'In process',
            'waiting_for_payment': 'Waiting for payment',
            'ready_for_shipment': 'Ready for shipment',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'canceled': 'Canceled',
            'reversal': 'Reversal'
        };
        return statusLabels[status] || status;
    }

    /**
     * Get status color class
     */
    getStatusClass(status: string): string {
        const statusClasses: Record<string, string> = {
            'draft': 'status--draft',
            'new': 'status--new',
            'in_process': 'status--in-process',
            'waiting_for_payment': 'status--waiting-for-payment',
            'ready_for_shipment': 'status--ready-for-shipment',
            'shipped': 'status--shipped',
            'delivered': 'status--delivered',
            'canceled': 'status--canceled',
            'reversal': 'status--reversal'
        };
        return statusClasses[status] || 'status--default';
    }
}
