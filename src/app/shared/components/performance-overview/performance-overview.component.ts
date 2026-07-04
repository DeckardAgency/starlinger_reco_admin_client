import { Component, ChangeDetectionStrategy, Input, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePickerComponent } from "@shared/components/date-picker/date-picker.component";
import { ReactiveFormsModule, FormGroup, FormBuilder } from "@angular/forms";
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { environment } from "@env/environment";

interface PerformanceMetric {
    label: string;
    value: number | string;
    percentage: number;
    isIncreasing: boolean;
    infoTooltip?: string;
    sparklineData?: number[];
}

interface DateRangePreset {
    label: string;
    getValue: () => { start: Date; end: Date };
}

interface MetricData {
    value: number;
    formatted?: string;
    percentageChange: number;
    trend: 'up' | 'down' | 'neutral';
    history?: number[];
}

interface DashboardResponse {
    '@context': string;
    '@id': string;
    '@type': string;
    period: {
        start: string;
        end: string;
    };
    shopOrders?: MetricData;
    activeCarts?: MetricData;
    completedCarts?: MetricData;
    totalShopRevenue?: MetricData & { formatted: string };
    cancelledOrdersRevenue?: MetricData & { formatted: string };
}

@Component({
    selector: 'app-performance-overview',
    imports: [CommonModule, DatePickerComponent, ReactiveFormsModule],
    templateUrl: './performance-overview.component.html',
    styleUrls: ['./performance-overview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerformanceOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() startDate: string = '';
    @Input() endDate: string = '';
    @ViewChild(DatePickerComponent) rangePicker!: DatePickerComponent;

    private destroy$ = new Subject<void>();
    private apiUrl = `${environment.apiBaseUrl}/api/v1/dashboard/performance`;
    private currentRequestId = 0;

    dateRangeForm: FormGroup;
    metrics: PerformanceMetric[] = [];
    isLoading = false;
    error: string | null = null;

    activePreset: string | null = 'Last 30 days';

    datePresets: DateRangePreset[] = [
        {
            label: 'Today',
            getValue: () => {
                const today = new Date();
                return { start: today, end: today };
            }
        },
        {
            label: 'Last 7 days',
            getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 6);
                return { start, end };
            }
        },
        {
            label: 'Last 30 days',
            getValue: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 29);
                return { start, end };
            }
        },
        {
            label: 'This month',
            getValue: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { start, end };
            }
        },
        {
            label: 'Last month',
            getValue: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const end = new Date(now.getFullYear(), now.getMonth(), 0);
                return { start, end };
            }
        },
        {
            label: 'This year',
            getValue: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), 0, 1);
                const end = now;
                return { start, end };
            }
        }
    ];

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
        this.dateRangeForm.get('dateRange')?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(range => {
                if (range) {
                    this.onDateRangeChanged(range);
                }
            });

        // Apply "Last 30 days" preset by default
        const defaultPreset = this.datePresets.find(p => p.label === 'Last 30 days');
        if (defaultPreset) {
            const range = defaultPreset.getValue();
            this.startDate = range.start.toISOString().split('T')[0];
            this.endDate = range.end.toISOString().split('T')[0];
            this.dateRangeForm.get('dateRange')?.setValue(range, { emitEvent: false });
        }

        this.loadPerformanceData();
    }

    ngAfterViewInit() {
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
            this.activePreset = null;
            this.loadPerformanceData();
        }
    }

    trackByPresetLabel(_index: number, preset: DateRangePreset): string {
        return preset.label;
    }

    trackByMetricLabel(_index: number, metric: PerformanceMetric): string {
        return metric.label;
    }

    trackByIndex(index: number): number {
        return index;
    }

    applyPreset(preset: DateRangePreset): void {
        const range = preset.getValue();
        this.activePreset = preset.label;
        this.dateRangeForm.get('dateRange')?.setValue(range, { emitEvent: false });
        this.startDate = range.start.toISOString().split('T')[0];
        this.endDate = range.end.toISOString().split('T')[0];
        this.loadPerformanceData();
    }

    loadPerformanceData() {
        const requestId = ++this.currentRequestId;
        this.isLoading = true;
        this.error = null;
        // Loading state can be set from a form valueChanges subscription,
        // so explicitly mark this OnPush component dirty.
        this.cdr.markForCheck();

        let url = this.apiUrl;
        if (this.startDate && this.endDate) {
            url += `?startDate=${this.startDate}&endDate=${this.endDate}`;
        }

        this.http.get<DashboardResponse>(url)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    if (requestId !== this.currentRequestId) return;
                    try {
                        this.updateMetrics(data);
                    } catch (e) {
                        console.error('Error processing dashboard data:', e);
                        this.setDefaultMetrics();
                    }
                    this.isLoading = false;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    if (requestId !== this.currentRequestId) return;
                    console.error('Error loading performance data:', error);
                    this.error = 'Failed to load performance data. Please try again.';
                    this.isLoading = false;
                    this.setDefaultMetrics();
                    this.cdr.markForCheck();
                }
            });
    }

    private updateMetrics(data: DashboardResponse) {
        const zero: MetricData = { value: 0, percentageChange: 0, trend: 'neutral' };

        this.metrics = [
            {
                label: 'Shop orders',
                value: (data.shopOrders ?? zero).value,
                percentage: (data.shopOrders ?? zero).percentageChange,
                isIncreasing: (data.shopOrders ?? zero).trend === 'up',
                infoTooltip: 'Total number of orders placed in your shop',
                sparklineData: (data.shopOrders ?? zero).history || this.generateMockSparklineData((data.shopOrders ?? zero).percentageChange)
            },
            {
                label: 'Active carts',
                value: (data.activeCarts ?? zero).value,
                percentage: (data.activeCarts ?? zero).percentageChange,
                isIncreasing: (data.activeCarts ?? zero).trend === 'up',
                infoTooltip: 'Shopping carts that are currently active',
                sparklineData: (data.activeCarts ?? zero).history || this.generateMockSparklineData((data.activeCarts ?? zero).percentageChange)
            },
            {
                label: 'Completed carts',
                value: (data.completedCarts ?? zero).value,
                percentage: (data.completedCarts ?? zero).percentageChange,
                isIncreasing: (data.completedCarts ?? zero).trend === 'up',
                infoTooltip: 'Shopping carts that were completed',
                sparklineData: (data.completedCarts ?? zero).history || this.generateMockSparklineData((data.completedCarts ?? zero).percentageChange)
            },
            {
                label: 'Total shop revenue',
                value: (data.totalShopRevenue ?? { ...zero, formatted: '0,00 €' }).formatted,
                percentage: (data.totalShopRevenue ?? zero).percentageChange,
                isIncreasing: (data.totalShopRevenue ?? zero).trend === 'up',
                infoTooltip: 'Total revenue generated from completed orders',
                sparklineData: (data.totalShopRevenue ?? zero).history || this.generateMockSparklineData((data.totalShopRevenue ?? zero).percentageChange)
            },
            {
                label: 'Cancelled orders revenue',
                value: (data.cancelledOrdersRevenue ?? { ...zero, formatted: '0,00 €' }).formatted,
                percentage: (data.cancelledOrdersRevenue ?? zero).percentageChange,
                isIncreasing: (data.cancelledOrdersRevenue ?? zero).trend === 'up',
                infoTooltip: 'Revenue lost from cancelled orders',
                sparklineData: (data.cancelledOrdersRevenue ?? zero).history || this.generateMockSparklineData((data.cancelledOrdersRevenue ?? zero).percentageChange)
            }
        ];
    }

    private setDefaultMetrics() {
        this.metrics = [
            { label: 'Shop orders', value: 0, percentage: 0, isIncreasing: false, infoTooltip: 'Total number of orders placed in your shop', sparklineData: this.generateMockSparklineData(0) },
            { label: 'Active carts', value: 0, percentage: 0, isIncreasing: false, infoTooltip: 'Shopping carts that are currently active', sparklineData: this.generateMockSparklineData(0) },
            { label: 'Completed carts', value: 0, percentage: 0, isIncreasing: false, infoTooltip: 'Shopping carts that were completed', sparklineData: this.generateMockSparklineData(0) },
            { label: 'Total shop revenue', value: '0,00 €', percentage: 0, isIncreasing: false, infoTooltip: 'Total revenue generated from completed orders', sparklineData: this.generateMockSparklineData(0) },
            { label: 'Cancelled orders revenue', value: '0,00 €', percentage: 0, isIncreasing: false, infoTooltip: 'Revenue lost from cancelled orders', sparklineData: this.generateMockSparklineData(0) }
        ];
    }

    getSparklinePath(data: number[] | undefined, width: number = 80, height: number = 32): string {
        if (!data || data.length < 2) {
            return '';
        }

        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const padding = 2;
        const effectiveHeight = height - padding * 2;
        const effectiveWidth = width - padding * 2;

        const points = data.map((value, index) => {
            const x = padding + (index / (data.length - 1)) * effectiveWidth;
            const y = padding + effectiveHeight - ((value - min) / range) * effectiveHeight;
            return `${x},${y}`;
        });

        return `M${points.join(' L')}`;
    }

    private generateMockSparklineData(percentage: number): number[] {
        const points = 7;
        const data: number[] = [];
        let base = 50;

        for (let i = 0; i < points; i++) {
            const trend = percentage > 0 ? 1 : percentage < 0 ? -1 : 0;
            const randomVariation = (Math.random() - 0.5) * 20;
            const trendVariation = (i / points) * trend * 15;
            base = Math.max(10, Math.min(90, base + randomVariation + trendVariation));
            data.push(base);
        }

        return data;
    }
}
