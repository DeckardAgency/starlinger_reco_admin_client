import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PerformanceOverviewComponent } from '@shared/components/performance-overview/performance-overview.component';
import { IconComponent } from '@app/ui-kit';
import { DashboardService, DashboardOrder, StatusDistribution } from '@core/services/http/dashboard.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        PerformanceOverviewComponent,
        IconComponent
    ],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
    private router = inject(Router);
    private dashboardService = inject(DashboardService);
    private cdr = inject(ChangeDetectorRef);
    private destroy$ = new Subject<void>();

    isLoadingOrders = true;
    isLoadingDistribution = true;

    recentOrders: DashboardOrder[] = [];
    orderDistribution: StatusDistribution[] = [];
    totalOrders = 0;

    quickActions = [
        {
            icon: 'users',
            label: 'Clients',
            description: 'Manage clients',
            route: '/admin/clients/list',
            color: '#10b981'
        },
        {
            icon: 'package',
            label: 'Products',
            description: 'Manage products',
            route: '/admin/products/list',
            color: '#8b5cf6'
        },
        {
            icon: 'cart',
            label: 'Orders',
            description: 'Manage orders',
            route: '/admin/shop-orders/list',
            color: '#3b82f6'
        },
        {
            icon: 'user',
            label: 'Users',
            description: 'Manage users',
            route: '/admin/users/list',
            color: '#f59e0b'
        }
    ];

    statusColors: Record<string, string> = {
        'draft': '#9ca3af',
        'submitted': '#3b82f6',
        'in_review': '#8b5cf6',
        'more_info': '#f59e0b',
        'information_provided': '#06b6d4',
        'in_progress': '#6366f1',
        'completed': '#10b981',
        'canceled': '#ef4444'
    };

    ngOnInit(): void {
        this.loadDashboardData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDashboardData(): void {
        this.dashboardService.getRecentOrders(5)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (orders) => {
                    this.recentOrders = orders;
                    this.isLoadingOrders = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.isLoadingOrders = false;
                    this.cdr.markForCheck();
                }
            });

        this.dashboardService.getOrderStatusDistribution()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.orderDistribution = data.distribution;
                    this.totalOrders = data.total;
                    this.isLoadingDistribution = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.isLoadingDistribution = false;
                    this.cdr.markForCheck();
                }
            });
    }

    navigateTo(route: string): void {
        this.router.navigate([route]);
    }

    viewOrder(order: DashboardOrder): void {
        this.router.navigate(['/admin/shop-orders', order.id, 'edit']);
    }

    getStatusLabel(status: string): string {
        return this.dashboardService.getStatusLabel(status);
    }

    getStatusClass(status: string): string {
        return this.dashboardService.getStatusClass(status);
    }

    getStatusColor(status: string): string {
        return this.statusColors[status] || '#6b7280';
    }

    getDistributionPercentage(count: number): number {
        if (this.totalOrders === 0) return 0;
        return Math.round((count / this.totalOrders) * 100);
    }

    formatDate(dateString: string): string {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatCurrency(amount: number): string {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    getCustomerName(order: DashboardOrder): string {
        if (order.user) {
            const name = `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim();
            return name || order.user.email || 'Unknown';
        }
        return 'Unknown';
    }

    getInitials(order: DashboardOrder): string {
        if (order.user) {
            const first = order.user.firstName?.charAt(0) || '';
            const last = order.user.lastName?.charAt(0) || '';
            return (first + last).toUpperCase() || order.user.email?.charAt(0).toUpperCase() || '?';
        }
        return '?';
    }
}
