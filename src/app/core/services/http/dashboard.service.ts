import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, catchError, map } from 'rxjs';
import { environment } from '@env/environment';

export interface DashboardInquiry {
    id: string;
    inquiryNumber: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        client?: {
            companyName: string;
        };
    };
    machines?: {
        products: any[];
    }[];
}

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

export interface RecentActivityResponse {
    recentInquiries: DashboardInquiry[];
    recentOrders: DashboardOrder[];
}

export interface InquiryStatusDistributionResponse {
    distribution: StatusDistribution[];
    total: number;
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
     * Get recent inquiries for dashboard
     */
    getRecentInquiries(limit: number = 5): Observable<DashboardInquiry[]> {
        const params = new HttpParams()
            .set('itemsPerPage', limit.toString())
            .set('order[createdAt]', 'desc')
            .set('isDraft', 'false');

        return this.http.get<any>(`${this.apiUrl}/api/v1/inquiries`, { params }).pipe(
            map(response => response.member || []),
            catchError(error => {
                console.error('Error fetching recent inquiries:', error);
                return of([]);
            })
        );
    }

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
     * Get inquiry status distribution for dashboard chart
     */
    getInquiryStatusDistribution(): Observable<InquiryStatusDistributionResponse> {
        return this.http.get<InquiryStatusDistributionResponse>(
            `${this.apiUrl}/api/v1/dashboard/inquiry-status-distribution`
        ).pipe(
            catchError(error => {
                console.error('Error fetching status distribution:', error);
                // Return mock data if API not available
                return of({
                    distribution: [],
                    total: 0
                });
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
     * Get all recent activity (inquiries and orders combined)
     */
    getRecentActivity(limit: number = 5): Observable<RecentActivityResponse> {
        return forkJoin({
            recentInquiries: this.getRecentInquiries(limit),
            recentOrders: this.getRecentOrders(limit)
        });
    }

    /**
     * Get status label for display
     */
    getStatusLabel(status: string): string {
        const statusLabels: Record<string, string> = {
            'draft': 'Draft',
            'submitted': 'Submitted',
            'in_review': 'In Review',
            'more_info': 'More Info',
            'information_provided': 'Information Provided',
            'in_progress': 'In Progress',
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
            'in_review': 'status--in-review',
            'more_info': 'status--more-info',
            'information_provided': 'status--info-provided',
            'in_progress': 'status--in-progress',
            'completed': 'status--completed',
            'canceled': 'status--canceled',
            'confirmed': 'status--confirmed',
            'dispatched': 'status--dispatched'
        };
        return statusClasses[status] || 'status--default';
    }
}
