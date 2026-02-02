import { Component, Input, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePickerComponent } from "@shared/components/date-picker/date-picker.component";
import { ReactiveFormsModule, FormGroup, FormBuilder } from "@angular/forms";
import { IconComponent, ButtonComponent } from '@app/ui-kit';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { environment } from "@env/environment";

interface PerformanceMetric {
    label: string;
    value: number | string;
    percentage: number;
    isIncreasing: boolean;
    infoTooltip?: string;
}

interface MetricData {
    value: number;
    formatted?: string;
    percentageChange: number;
    trend: 'up' | 'down' | 'neutral';
}

interface DashboardResponse {
    '@context': string;
    '@id': string;
    '@type': string;
    period: {
        start: string;
        end: string;
    };
    shopOrders: MetricData;
    manualInquiries: MetricData;
    activeInquiries: MetricData;
    cancelledInquiries: MetricData;
    activeCarts: MetricData;
    completedCarts: MetricData;
    totalShopRevenue: MetricData & { formatted: string };
    cancelledOrdersRevenue: MetricData & { formatted: string };
}

@Component({
    selector: 'app-performance-overview',
    imports: [CommonModule, DatePickerComponent, ReactiveFormsModule, IconComponent, ButtonComponent],
    templateUrl: './performance-overview.component.html',
    styleUrls: ['./performance-overview.component.scss']
})
export class PerformanceOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() startDate: string = '';
    @Input() endDate: string = '';
    @ViewChild(DatePickerComponent) rangePicker!: DatePickerComponent;

    private destroy$ = new Subject<void>();
    private apiUrl = `${environment.apiBaseUrl}/api/v1/dashboard/performance`;

    dateRangeForm: FormGroup;
    metrics: PerformanceMetric[] = [];
    isLoading = false;
    error: string | null = null;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private cdr: ChangeDetectorRef
    ) {
        this.dateRangeForm = this.fb.group({
            dateRange: [null]
        });
    }

    ngOnInit() {
        // Set up form value change subscription
        this.dateRangeForm.get('dateRange')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(range => {
                if (range) {
                    this.onDateRangeChanged(range);
                }
            });

        // Apply "Last 30 days" as default
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        
        this.startDate = start.toISOString().split('T')[0];
        this.endDate = end.toISOString().split('T')[0];
        this.dateRangeForm.get('dateRange')?.setValue({ start, end }, { emitEvent: false });

        // Load initial data
        this.loadPerformanceData();
    }

    ngAfterViewInit() {
        // Set up date picker restrictions
        this.rangePicker.setMinDate('2022-01-01');
        this.rangePicker.setDisableFutureDates(true);
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onDateRangeChanged(range: { start: Date, end: Date }) {
        if (range && range.start && range.end) {
            this.startDate = range.start.toISOString().split('T')[0];
            this.endDate = range.end.toISOString().split('T')[0];
            this.loadPerformanceData();
        }
    }

    loadPerformanceData() {
        this.isLoading = true;
        this.error = null;

        let url = this.apiUrl;
        if (this.startDate && this.endDate) {
            url += `?startDate=${this.startDate}&endDate=${this.endDate}`;
        }

        console.log('[PerformanceOverview] Fetching data from:', url);
        this.http.get<DashboardResponse>(url)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    console.log('[PerformanceOverview] Data received:', data);
                    this.updateMetrics(data);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('[PerformanceOverview] Error loading performance data:', error);
                    this.error = 'Failed to load performance data. Please try again.';
                    this.isLoading = false;
                    this.setDefaultMetrics();
                    this.cdr.detectChanges();
                }
            });
    }

    private updateMetrics(data: DashboardResponse) {
        // Update the date range from the API response
        if (data.period) {
            const start = new Date(data.period.start);
            const end = new Date(data.period.end);
            this.dateRangeForm.get('dateRange')?.setValue({ start, end }, { emitEvent: false });
        }

        this.metrics = [
            {
                label: 'Shop orders',
                value: data.shopOrders.value,
                percentage: data.shopOrders.percentageChange,
                isIncreasing: data.shopOrders.trend === 'up',
                infoTooltip: 'Total number of orders placed in your shop'
            },
            {
                label: 'Manual inquiries',
                value: data.manualInquiries.value,
                percentage: data.manualInquiries.percentageChange,
                isIncreasing: data.manualInquiries.trend === 'up',
                infoTooltip: 'Inquiries created manually by shop administrators'
            },
            {
                label: 'Active inquiries',
                value: data.activeInquiries.value,
                percentage: data.activeInquiries.percentageChange,
                isIncreasing: data.activeInquiries.trend === 'up',
                infoTooltip: 'Inquiries that are currently in process'
            },
            {
                label: 'Cancelled inquiries',
                value: data.cancelledInquiries.value,
                percentage: data.cancelledInquiries.percentageChange,
                isIncreasing: data.cancelledInquiries.trend === 'up',
                infoTooltip: 'Inquiries that were cancelled'
            },
            {
                label: 'Active carts',
                value: data.activeCarts.value,
                percentage: data.activeCarts.percentageChange,
                isIncreasing: data.activeCarts.trend === 'up',
                infoTooltip: 'Shopping carts that are currently active'
            },
            {
                label: 'Completed carts',
                value: data.completedCarts.value,
                percentage: data.completedCarts.percentageChange,
                isIncreasing: data.completedCarts.trend === 'up',
                infoTooltip: 'Shopping carts that were completed'
            },
            {
                label: 'Total shop revenue',
                value: data.totalShopRevenue.formatted,
                percentage: data.totalShopRevenue.percentageChange,
                isIncreasing: data.totalShopRevenue.trend === 'up',
                infoTooltip: 'Total revenue generated from completed orders'
            },
            {
                label: 'Cancelled orders revenue',
                value: data.cancelledOrdersRevenue.formatted,
                percentage: data.cancelledOrdersRevenue.percentageChange,
                isIncreasing: data.cancelledOrdersRevenue.trend === 'up',
                infoTooltip: 'Revenue lost from cancelled orders'
            }
        ];
    }

    private setDefaultMetrics() {
        this.metrics = [
            { label: 'Shop orders', value: 0, percentage: 0, isIncreasing: false, infoTooltip: 'Total number of orders placed in your shop' },
            { label: 'Manual inquiries', value: 0, percentage: 0, isIncreasing: false, infoTooltip: 'Inquiries created manually by shop administrators' },
            { label: 'Active inquiries', value: 0, percentage: 0, isIncreasing: false, infoTooltip: 'Inquiries that are currently in process' },
            { label: 'Cancelled inquiries', value: 0, percentage: 0, isIncreasing: false, infoTooltip: 'Inquiries that were cancelled' },
            { label: 'Active carts', value: 0, percentage: 0, isIncreasing: false, infoTooltip: 'Shopping carts that are currently active' },
            { label: 'Completed carts', value: 0, percentage: 0, isIncreasing: false, infoTooltip: 'Shopping carts that were completed' },
            { label: 'Total shop revenue', value: '0,00 €', percentage: 0, isIncreasing: false, infoTooltip: 'Total revenue generated from completed orders' },
            { label: 'Cancelled orders revenue', value: '0,00 €', percentage: 0, isIncreasing: false, infoTooltip: 'Revenue lost from cancelled orders' }
        ];
    }
}
