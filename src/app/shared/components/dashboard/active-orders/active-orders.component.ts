import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderCardComponent, OrderCardData, OrderCardStatus, SectionHeaderComponent } from '@app/ui-kit';
import { DashboardService, DashboardOrder, DashboardInquiry } from '@core/services/http/dashboard.service';

@Component({
  selector: 'app-active-orders',
  imports: [CommonModule, RouterModule, OrderCardComponent, SectionHeaderComponent],
  templateUrl: './active-orders.component.html',
  styleUrls: ['./active-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActiveOrdersComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  ordersIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 7.50008V10.8334M10 14.1667H10.0083M12.5 1.66675H5C4.55798 1.66675 4.13405 1.84234 3.82149 2.1549C3.50893 2.46746 3.33334 2.89139 3.33334 3.33341V16.6667C3.33334 17.1088 3.50893 17.5327 3.82149 17.8453C4.13405 18.1578 4.55798 18.3334 5 18.3334H15C15.442 18.3334 15.866 18.1578 16.1785 17.8453C16.4911 17.5327 16.6667 17.1088 16.6667 16.6667V5.83341L12.5 1.66675Z" stroke="#232323" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  isLoading = signal(true);
  orders = signal<OrderCardData[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    forkJoin({
      orders: this.dashboardService.getRecentOrders(8),
      inquiries: this.dashboardService.getRecentInquiries(8)
    }).subscribe({
      next: ({ orders, inquiries }) => {
        const cards = this.mapToCards(orders, inquiries);
        this.orders.set(cards);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load active orders/inquiries:', error);
        this.orders.set([]);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapToCards(orders: DashboardOrder[], inquiries: DashboardInquiry[]): OrderCardData[] {
    const orderCards: OrderCardData[] = orders
      .filter(o => !['completed', 'canceled', 'cancelled'].includes((o.status || '').toLowerCase()))
      .map(order => ({
        id: order.id,
        type: 'order' as const,
        internalReference: order.orderNumber || order.id.slice(0, 8),
        dateCreated: this.formatDate(order.createdAt),
        partsOrdered: 0,
        status: this.normalizeStatus(order.status)
      }));

    const inquiryCards: OrderCardData[] = inquiries
      .filter(i => !['completed', 'canceled', 'cancelled'].includes((i.status || '').toLowerCase()))
      .map(inquiry => ({
        id: inquiry.id,
        type: 'inquiry' as const,
        internalReference: inquiry.inquiryNumber || inquiry.id.slice(0, 8),
        dateCreated: this.formatDate(inquiry.createdAt),
        partsOrdered: 0,
        status: this.normalizeStatus(inquiry.status)
      }));

    const combined = [...orderCards, ...inquiryCards]
      .sort((a, b) => {
        const parse = (d: string) => { const [day, month, year] = d.split('-'); return new Date(Number(year), Number(month) - 1, Number(day)).getTime(); };
        return parse(b.dateCreated) - parse(a.dateCreated);
      })
      .slice(0, 8);

    return combined;
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
    if (['in_review', 'more_info', 'information_provided', 'in_progress'].includes((status || '').toLowerCase())) return 'in-review';
    if (['submitted', 'confirmed'].includes(s)) return 'submitted';
    return 'draft';
  }
}
