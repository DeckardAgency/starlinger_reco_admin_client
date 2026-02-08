import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderCardComponent, OrderCardData, OrderCardStatus, SectionHeaderComponent } from '@app/ui-kit';
import { DashboardService, DashboardOrder } from '@core/services/http/dashboard.service';

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

  isLoading = signal(true);
  orders = signal<OrderCardData[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.dashboardService.getRecentOrders(8).subscribe({
      next: (orders) => {
        const cards = this.mapToCards(orders);
        this.orders.set(cards);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load active orders:', error);
        this.orders.set([]);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapToCards(orders: DashboardOrder[]): OrderCardData[] {
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

    return orderCards
      .sort((a, b) => {
        const parse = (d: string) => { const [day, month, year] = d.split('-'); return new Date(Number(year), Number(month) - 1, Number(day)).getTime(); };
        return parse(b.dateCreated) - parse(a.dateCreated);
      })
      .slice(0, 8);
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
    if (['submitted', 'confirmed'].includes(s)) return 'submitted';
    return 'draft';
  }
}
