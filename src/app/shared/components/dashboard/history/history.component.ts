import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, signal, OnInit, AfterViewInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SectionHeaderComponent, TabsComponent, BadgeComponent, AvatarComponent, TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms';
import { DashboardService, DashboardOrder } from '@core/services/http/dashboard.service';

export type HistoryStatus = 'completed' | 'cancelled' | 'in-review';
export type HistoryType = 'order';

export interface HistoryItem {
  id: string;
  type: HistoryType;
  dateCreated: string;
  internalReference: string;
  customerInitials: string;
  customerName: string;
  partsOrdered: number;
  status: HistoryStatus;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SectionHeaderComponent,
    TabsComponent,
    DataTableComponent,
    BadgeComponent,
    AvatarComponent,
    TableActionsDropdownComponent
  ],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryComponent implements OnInit, AfterViewInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('typeCell', { static: true }) typeCell!: TemplateRef<any>;
  @ViewChild('customerCell', { static: true }) customerCell!: TemplateRef<any>;
  @ViewChild('statusCell', { static: true }) statusCell!: TemplateRef<any>;
  @ViewChild('actionsCell', { static: true }) actionsCell!: TemplateRef<any>;

  activeTab = signal('latest');
  sortColumn = signal<string | null>('dateCreated');
  sortDirection = signal<'asc' | 'desc' | null>('desc');
  openMenuRowId = signal<string | null>(null);
  isLoading = signal(true);
  allData = signal<HistoryItem[]>([]);

  tabs = [
    { id: 'latest', label: 'Latest' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  columns = signal<TableColumn[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.dashboardService.getRecentOrders(30).subscribe({
      next: (orders) => {
        const items = this.mapToHistoryItems(orders);
        this.allData.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load history:', error);
        this.allData.set([]);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapToHistoryItems(orders: DashboardOrder[]): HistoryItem[] {
    const orderItems: HistoryItem[] = orders.map(o => ({
      id: o.id,
      type: 'order' as HistoryType,
      dateCreated: this.formatDate(o.createdAt),
      internalReference: o.orderNumber || o.id.slice(0, 8),
      customerInitials: this.getInitials(o.user),
      customerName: this.getUserName(o.user),
      partsOrdered: 0,
      status: this.mapStatus(o.status)
    }));

    return orderItems.sort((a, b) => {
      const parse = (d: string) => { const [day, month, year] = d.split('-'); return new Date(Number(year), Number(month) - 1, Number(day)).getTime(); };
      return parse(b.dateCreated) - parse(a.dateCreated);
    });
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private getInitials(user: { firstName?: string; lastName?: string; email?: string } | undefined): string {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    if (first || last) return (first + last).toUpperCase();
    return (user.email?.[0] || 'U').toUpperCase();
  }

  private getUserName(user: { firstName?: string; lastName?: string; email?: string } | undefined): string {
    if (!user) return 'Unknown';
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return name || user.email || 'Unknown';
  }

  private mapStatus(status: string): HistoryStatus {
    const s = (status || '').toLowerCase();
    if (['completed', 'delivered', 'answered'].includes(s)) return 'completed';
    if (['cancelled', 'canceled', 'rejected'].includes(s)) return 'cancelled';
    return 'in-review';
  }

  ngAfterViewInit(): void {
    this.columns.set([
      { key: 'id', label: 'ID' },
      { key: 'type', label: 'Type', template: this.typeCell },
      { key: 'dateCreated', label: 'Date Created', sortable: true },
      { key: 'internalReference', label: 'Internal reference number' },
      { key: 'customer', label: 'Customer', template: this.customerCell },
      { key: 'partsOrdered', label: 'Parts ordered' },
      { key: 'status', label: 'Status', template: this.statusCell },
      { key: 'actions', label: '', template: this.actionsCell }
    ]);
  }

  get filteredData(): HistoryItem[] {
    const tab = this.activeTab();
    const data = this.allData();
    if (tab === 'completed') {
      return data.filter(item => item.status === 'completed');
    } else if (tab === 'cancelled') {
      return data.filter(item => item.status === 'cancelled');
    }
    return data;
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  getTypeBadgeVariant(type: HistoryType): 'success' | 'info' {
    return 'success';
  }

  getTypeLabel(type: HistoryType): string {
    return 'Order';
  }

  getStatusBadgeVariant(status: HistoryStatus): 'success' | 'danger' | 'warning' {
    const variants: Record<HistoryStatus, 'success' | 'danger' | 'warning'> = {
      'completed': 'success',
      'cancelled': 'danger',
      'in-review': 'warning'
    };
    return variants[status];
  }

  getStatusLabel(status: HistoryStatus): string {
    const labels: Record<HistoryStatus, string> = {
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'in-review': 'In review'
    };
    return labels[status];
  }

  tableActions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'archive', label: 'Archive', icon: 'archive' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  toggleMenu(rowId: string): void {
    this.openMenuRowId.set(this.openMenuRowId() === rowId ? null : rowId);
  }

  closeMenu(): void {
    this.openMenuRowId.set(null);
  }

  onActionClick(event: ActionClickEvent): void {
    const row = event.row as HistoryItem;
    console.log(`Action ${event.actionId} for row:`, row);
    // Handle actions here
    switch (event.actionId) {
      case 'view':
        // Navigate to view page or show details
        break;
      case 'archive':
        // Archive the item
        break;
      case 'delete':
        // Delete the item
        break;
    }
  }
}
