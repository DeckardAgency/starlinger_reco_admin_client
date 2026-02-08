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
            'submitted': 'Submitted',
            'completed': 'Completed',
            'canceled': 'Canceled',
            'confirmed': 'Confirmed',
            'dispatched': 'Dispatched'
        };
        return statusLabels[status] || status;
    }

    /**
     * Get status color class
     */
    getStatusClass(status: string): string {
        const statusClasses: Record<string, string> = {
            'draft': 'status--draft',
            'submitted': 'status--submitted',
            'completed': 'status--completed',
            'canceled': 'status--canceled',
            'confirmed': 'status--confirmed',
            'dispatched': 'status--dispatched'
        };
        return statusClasses[status] || 'status--default';
    }
}
