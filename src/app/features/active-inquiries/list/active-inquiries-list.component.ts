import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderCardComponent, OrderCardData, OrderCardStatus, BreadcrumbsComponent, ListHeaderComponent } from '@app/ui-kit';
import { DashboardService, DashboardOrder, DashboardInquiry } from '@core/services/http/dashboard.service';

@Component({
  selector: 'app-active-inquiries-list',
  standalone: true,
  imports: [CommonModule, RouterModule, OrderCardComponent, BreadcrumbsComponent, ListHeaderComponent],
  templateUrl: './active-inquiries-list.component.html',
  styleUrls: ['./active-inquiries-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveInquiriesListComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = signal(true);
  orders = signal<OrderCardData[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      orders: this.dashboardService.getRecentOrders(20),
      inquiries: this.dashboardService.getRecentInquiries(20)
    }).subscribe({
      next: ({ orders, inquiries }) => {
        const orderCards = orders
          .filter(o => !['completed', 'canceled', 'cancelled'].includes((o.status || '').toLowerCase()))
          .map(o => this.mapOrderToCard(o));
        const inquiryCards = inquiries
          .filter(i => !['completed', 'canceled', 'cancelled'].includes((i.status || '').toLowerCase()))
          .map(i => this.mapInquiryToCard(i));
        const parse = (d: string) => { const [day, month, year] = d.split('-'); return new Date(Number(year), Number(month) - 1, Number(day)).getTime(); };
        const combined = [...orderCards, ...inquiryCards]
          .sort((a, b) => parse(b.dateCreated) - parse(a.dateCreated));
        this.orders.set(combined);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load active inquiries:', error);
        this.orders.set([]);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapOrderToCard(order: DashboardOrder): OrderCardData {
    return {
      id: order.id,
      type: 'order',
      internalReference: order.orderNumber || order.id.slice(0, 8),
      dateCreated: this.formatDate(order.createdAt),
      partsOrdered: 0,
      status: this.normalizeStatus(order.status)
    };
  }

  private mapInquiryToCard(inquiry: DashboardInquiry): OrderCardData {
    return {
      id: inquiry.id,
      type: 'inquiry',
      internalReference: String(inquiry.inquiryNumber ?? inquiry.id.slice(0, 8)),
      dateCreated: this.formatDate(inquiry.createdAt),
      partsOrdered: 0,
      status: this.normalizeStatus(inquiry.status)
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private normalizeStatus(status: string): OrderCardStatus {
    const s = (status || '').toLowerCase().replace(/_/g, '-');
    const valid: OrderCardStatus[] = ['submitted', 'in-review', 'in-progress', 'more-info', 'confirmed', 'in-transit', 'dispatched', 'completed', 'cancelled', 'draft'];
    if (valid.includes(s as OrderCardStatus)) return s as OrderCardStatus;
    if (['in_review', 'more_info', 'in_progress'].includes((status || '').toLowerCase())) return 'in-review';
    if (['submitted', 'confirmed'].includes(s)) return 'submitted';
    return 'draft';
  }

  get totalCount(): number {
    return this.orders().length;
  }
}
