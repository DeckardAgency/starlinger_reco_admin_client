import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { AvatarComponent } from '@app/ui-kit/atoms/avatar/avatar.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { OrderService } from '@core/services/http/order.service';
import { AlertService } from '@services/alert.service';
import { Order } from '@core/models/order.model';

interface ShopOrder {
  id: string;
  type: 'order';
  dateCreated: string;
  internalRef: string;
  customer: {
    name: string;
    initials: string;
    avatar?: string;
  };
  partsOrdered: number;
  status: 'completed' | 'cancelled' | 'pending';
}

@Component({
  selector: 'app-shop-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BadgeComponent,
    AvatarComponent,
    IconComponent,
    TabsComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent
  ],
  templateUrl: './shop-orders-list.component.html',
  styleUrls: ['./shop-orders-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShopOrdersListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private orderService = inject(OrderService);
  private alertService = inject(AlertService);

  @ViewChild('typeTemplate') typeTemplate!: TemplateRef<any>;
  @ViewChild('customerTemplate') customerTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(true);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Active tab
  activeTab = signal('latest');

  // Tabs configuration
  tabs: TabItem[] = [
    { id: 'latest', label: 'Latest' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  // Table columns
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data from API
  allOrders = signal<ShopOrder[]>([]);

  // Filtered orders based on active tab, search, and sorting
  orders = computed(() => {
    const tab = this.activeTab();
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.allOrders();

    // Filter by tab
    if (tab === 'completed') {
      result = result.filter(o => o.status === 'completed');
    } else if (tab === 'cancelled') {
      result = result.filter(o => o.status === 'cancelled');
    }

    // Filter by search
    if (query) {
      result = result.filter(o =>
        o.id.toLowerCase().includes(query) ||
        o.internalRef.toLowerCase().includes(query) ||
        o.customer.name.toLowerCase().includes(query) ||
        o.dateCreated.includes(query)
      );
    }

    // Sort
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = (a as unknown as Record<string, unknown>)[sortCol];
        const bVal = (b as unknown as Record<string, unknown>)[sortCol];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return sortDir === 'asc' ? 1 : -1;
        if (bVal == null) return sortDir === 'asc' ? -1 : 1;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  });

  // Total count
  totalCount = computed(() => this.allOrders().length);

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private loadData(): void {
    this.isLoading.set(true);

    this.orderService.getOrders().subscribe({
      next: (response) => {
        const orderItems = response.orders.map(o => this.mapOrderToShopOrder(o));
        const sorted = orderItems.sort((a, b) =>
          this.parseDate(b.dateCreated) - this.parseDate(a.dateCreated)
        );
        this.allOrders.set(sorted);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load shop orders:', error);
        this.allOrders.set([]);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapOrderToShopOrder(order: Order): ShopOrder {
    const userName = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
    return {
      id: order.id,
      type: 'order',
      dateCreated: this.formatDate(order.createdAt),
      internalRef: order.orderNumber || order.id,
      customer: { name: userName, initials: this.getInitials(userName) },
      partsOrdered: order.items?.length || 0,
      status: this.mapStatus(order.status)
    };
  }

  private getInitials(name: string): string {
    if (!name || name === 'Unknown') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private parseDate(dateStr: string): number {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  private mapStatus(status: string): 'completed' | 'cancelled' | 'pending' {
    const s = (status || '').toLowerCase();
    if (['completed', 'delivered'].includes(s)) return 'completed';
    if (['cancelled', 'canceled', 'rejected'].includes(s)) return 'cancelled';
    return 'pending';
  }

  private initColumns(): void {
    this.columns = [
      { key: 'id', label: 'Order ID', sortable: true, width: '112px' },
      { key: 'type', label: 'Type', sortable: false, width: '128px', template: this.typeTemplate },
      { key: 'dateCreated', label: 'Date Created', sortable: true, width: '190px' },
      { key: 'internalRef', label: 'Internal reference number', sortable: false },
      { key: 'customer', label: 'Customer', sortable: false, template: this.customerTemplate },
      { key: 'partsOrdered', label: 'Parts ordered', sortable: false, width: '128px' },
      { key: 'status', label: 'Status', sortable: false, width: '128px', template: this.statusTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    console.log('Searching:', this.searchQuery);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  onExport(): void {
    console.log('Exporting data...');
  }

  toggleDropdown(orderId: string): void {
    if (this.openDropdownId() === orderId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(orderId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  onActionClick(event: ActionClickEvent): void {
    const order = event.row as ShopOrder;
    switch (event.actionId) {
      case 'view':
        this.onView(order);
        break;
      case 'delete':
        this.onDelete(order);
        break;
    }
  }

  onView(order: ShopOrder): void {
    console.log('View order:', order);
    this.router.navigate(['/admin/shop-orders', order.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(order: ShopOrder): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete order "${order.internalRef}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.orderService.deleteOrder(String(order.id)).subscribe({
      next: () => {
        this.allOrders.update(list => list.filter(o => o.id !== order.id));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error deleting order:', error)
    });
    this.closeDropdown();
  }

  getTypeLabel(type: string): string {
    return 'Order';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      default: return status;
    }
  }

  getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'secondary' {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  }
}
