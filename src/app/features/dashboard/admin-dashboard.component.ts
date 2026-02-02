import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PerformanceOverviewComponent } from '@shared/components/performance-overview/performance-overview.component';
import { ActiveOrdersComponent } from '@shared/components/dashboard/active-orders/active-orders.component';
import { HistoryComponent } from '@shared/components/dashboard/history/history.component';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        PerformanceOverviewComponent,
        ActiveOrdersComponent,
        HistoryComponent
    ],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardComponent {}
