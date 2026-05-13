import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

type OrderStatus = 'draft' | 'new' | 'in_process' | 'waiting_for_payment' | 'ready_for_shipment' | 'shipped' | 'delivered' | 'canceled' | 'reversal';

interface ShopOrder {
  id: number;
  type: 'order';
  dateCreated: string;
  internalRef: string;
  customer: {
    name: string;
    initials: string;
    avatar?: string;
  };
  partsOrdered: number;
  status: OrderStatus;
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
    TableActionsDropdownComponent,
    ColumnSelectorComponent
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
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  private searchSubject = new Subject<string>();

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
  openDropdownId = signal<number | null>(null);

  // Active tab
  activeTab = signal('latest');

  // Tabs configuration
  tabs: TabItem[] = [
    { id: 'latest', label: 'Latest' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
  ];

  readonly COLUMN_STORAGE_KEY = 'shop-orders';
  columnDefs: ColumnDefinition[] = [];
  private allColumns: TableColumn[] = [];
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'view', label: 'View', icon: 'eye' },
    { id: 'delete', label: 'Cancel', icon: 'trash', variant: 'danger' }
  ];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);

  // Computed pagination display
  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Data from API
  orders = signal<ShopOrder[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadData();
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private loadData(): void {
    this.isLoading.set(true);

    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage(),
      isDraft: false
    };

    // Apply search
    const query = this.searchQuery().trim();
    if (query) {
      params['orderNumber'] = query;
    }

    // Apply tab-based status filter
    const tab = this.activeTab();
    if (tab === 'delivered') {
      params['status'] = 'delivered';
    } else if (tab === 'cancelled') {
      params['status'] = 'canceled';
    }
    // 'latest' tab shows all non-draft orders (no status filter)

    // Apply sorting
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    if (sortCol && sortDir) {
      params[`order[${sortCol}]`] = sortDir;
    } else {
      // Default sort by createdAt desc
      params['order[createdAt]'] = 'desc';
    }

    this.orderService.getOrders(params).subscribe({
      next: (response) => {
        const orderItems = response.orders.map(o => this.mapOrderToShopOrder(o));
        this.orders.set(orderItems);
        this.totalItems.set(response.totalOrders || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load shop orders:', error);
        this.orders.set([]);
        this.totalItems.set(0);
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
      internalRef: order.orderNumber || String(order.id),
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

  private mapStatus(status: string): OrderStatus {
    const valid: OrderStatus[] = ['draft', 'new', 'in_process', 'waiting_for_payment', 'ready_for_shipment', 'shipped', 'delivered', 'canceled', 'reversal'];
    const s = (status || '').toLowerCase();
    if (valid.includes(s as OrderStatus)) return s as OrderStatus;
    if (s === 'cancelled') return 'canceled';
    return 'draft';
  }

  private initColumns(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'id', label: 'Order ID', visible: true, locked: true },
      { key: 'type', label: 'Type', visible: true },
      { key: 'dateCreated', label: 'Date Created', visible: true },
      { key: 'internalRef', label: 'Internal reference', visible: true },
      { key: 'customer', label: 'Customer', visible: true },
      { key: 'partsOrdered', label: 'Parts ordered', visible: true },
      { key: 'status', label: 'Status', visible: true, locked: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'id', label: 'Order ID', sortable: true, width: '112px' },
      { key: 'type', label: 'Type', sortable: false, width: '128px', template: this.typeTemplate },
      { key: 'dateCreated', label: 'Date Created', sortable: true, width: '190px' },
      { key: 'internalRef', label: 'Internal reference number', sortable: true },
      { key: 'customer', label: 'Customer', sortable: false, template: this.customerTemplate },
      { key: 'partsOrdered', label: 'Parts ordered', sortable: false, width: '128px' },
      { key: 'status', label: 'Status', sortable: true, width: '128px', template: this.statusTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];

    this.applyColumnVisibility();
  }

  onColumnsChange(columns: ColumnDefinition[]): void {
    this.columnDefs = columns;
    this.columnSettingsService.saveColumns(this.COLUMN_STORAGE_KEY, columns);
    this.applyColumnVisibility();
    this.cdr.markForCheck();
  }

  private applyColumnVisibility(): void {
    const visibleKeys = new Set(this.columnDefs.filter(c => c.visible).map(c => c.key));
    this.columns = this.allColumns.filter(col =>
      col.key === 'actions' || visibleKeys.has(col.key)
    );
  }

  onTabChange(tabId: string): void {
    this.activeTab.set(tabId);
    this.currentPage.set(1);
    this.loadData();
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadData();
  }

  onExport(): void {
    const filters: { status?: string[]; isDraft?: boolean } = { isDraft: false };
    const tab = this.activeTab();
    if (tab === 'delivered') {
      filters.status = ['delivered'];
    } else if (tab === 'cancelled') {
      filters.status = ['canceled'];
    }

    this.orderService.exportOrdersToExcel(
      this.sortColumn() || undefined,
      this.sortDirection() || undefined,
      this.searchQuery() ? { query: this.searchQuery() } : {},
      filters
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${tab}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Export failed:', err)
    });
  }

  toggleDropdown(orderId: number): void {
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
    this.router.navigate(['/admin/shop-orders', order.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(order: ShopOrder): Promise<void> {
    const reason = window.prompt(
      `Cancel order "${order.internalRef}". Please enter a reason for cancellation:`,
      ''
    );
    if (reason === null) {
      this.closeDropdown();
      return;
    }
    const trimmed = reason.trim();
    if (!trimmed) {
      this.alertService.error('A cancellation reason is required.');
      this.closeDropdown();
      return;
    }
    this.orderService.updateOrder(
      String(order.id),
      { status: 'canceled', cancellationReason: trimmed } as Partial<Order>
    ).subscribe({
      next: () => {
        this.loadData();
      },
      error: (error) => console.error('Error cancelling order:', error)
    });
    this.closeDropdown();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadData();
  }

  getTypeLabel(type: string): string {
    return 'Order';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'Draft',
      'new': 'New',
      'in_process': 'In process',
      'waiting_for_payment': 'Waiting for payment',
      'ready_for_shipment': 'Ready for shipment',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'canceled': 'Canceled',
      'reversal': 'Reversal'
    };
    return labels[status] || status;
  }

  getStatusVariant(status: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'secondary'> = {
      'draft': 'secondary',
      'new': 'info',
      'in_process': 'warning',
      'waiting_for_payment': 'warning',
      'ready_for_shipment': 'info',
      'shipped': 'info',
      'delivered': 'success',
      'canceled': 'danger',
      'reversal': 'danger'
    };
    return variants[status] || 'secondary';
  }
}
