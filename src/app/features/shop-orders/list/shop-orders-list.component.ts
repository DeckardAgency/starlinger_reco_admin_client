import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent, BadgeVariant } from '@app/ui-kit/atoms/badge/badge.component';
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
  amount: string;
  status: OrderStatus;
  // Precomputed display fields (avoid per-row method calls in the template)
  typeLabel: string;
  statusLabel: string;
  statusVariant: BadgeVariant;
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
  private loadRequest$ = new Subject<void>();

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
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'drafts', label: 'Drafts' }
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

    // Single request pipeline: switchMap cancels any in-flight request when a
    // new load is triggered, so stale responses can never overwrite newer ones.
    this.loadRequest$.pipe(
      switchMap(() => this.orderService.getOrders(this.buildLoadParams()).pipe(
        catchError(error => {
          console.error('Failed to load shop orders:', error);
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (response) {
        const orderItems = response.orders.map(o => this.mapOrderToShopOrder(o));
        this.orders.set(orderItems);
        this.totalItems.set(response.totalOrders || 0);
      } else {
        this.orders.set([]);
        this.totalItems.set(0);
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
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
    this.loadRequest$.next();
  }

  private buildLoadParams(): Record<string, string | number | boolean> {
    const tab = this.activeTab();

    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage(),
      isDraft: tab === 'drafts'
    };

    // Apply search
    const query = this.searchQuery().trim();
    if (query) {
      params['orderNumber'] = query;
    }

    // Apply tab-based status filter
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

    return params;
  }

  private mapOrderToShopOrder(order: Order): ShopOrder {
    const userName = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Unknown' : 'Unknown';
    const status = this.mapStatus(order.status);
    return {
      id: order.id,
      type: 'order',
      dateCreated: this.formatDate(order.createdAt),
      internalRef: order.orderNumber || String(order.id),
      customer: { name: userName, initials: this.getInitials(userName) },
      partsOrdered: order.totalQuantity ?? order.itemsCount ?? 0,
      amount: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(order.totalAmount ?? 0),
      status,
      typeLabel: this.getTypeLabel('order'),
      statusLabel: this.getStatusLabel(status),
      statusVariant: this.getStatusVariant(status)
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
      { key: 'dateCreated', label: 'Date Created', visible: true },
      { key: 'internalRef', label: 'Internal reference', visible: true },
      { key: 'customer', label: 'Customer', visible: true },
      { key: 'partsOrdered', label: 'Parts ordered', visible: true },
      { key: 'amount', label: 'Amount', visible: true },
      { key: 'status', label: 'Status', visible: true, locked: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'id', label: 'Order ID', sortable: true, width: '112px' },
      { key: 'dateCreated', label: 'Date Created', sortable: true, width: '190px' },
      { key: 'internalRef', label: 'Internal reference number', sortable: true },
      { key: 'customer', label: 'Customer', sortable: false, template: this.customerTemplate },
      { key: 'partsOrdered', label: 'Parts ordered', sortable: false, width: '128px' },
      { key: 'amount', label: 'Amount', sortable: false, width: '120px' },
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
    const tab = this.activeTab();
    const filters: { status?: string[]; isDraft?: boolean } = { isDraft: tab === 'drafts' };
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

  // Orders in a terminal state can't be canceled, so the Cancel action is
  // hidden for them.
  private readonly nonCancellableStatuses: OrderStatus[] = ['canceled', 'delivered', 'reversal'];

  // Actions available for a given row.
  getRowActions(order: ShopOrder): TableAction[] {
    if (this.nonCancellableStatuses.includes(order.status)) {
      return this.tableActions.filter(a => a.id !== 'delete');
    }
    return this.tableActions;
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
    this.closeDropdown();
    const reason = await this.alertService.prompt(
      `Cancel order "${order.internalRef}"? Please enter a reason for the cancellation — the customer will be notified.`,
      'Cancel order',
      { placeholder: 'Reason for cancellation…', confirmText: 'Cancel order' }
    );
    if (reason === null) {
      return;
    }
    this.orderService.updateOrder(
      String(order.id),
      { status: 'canceled', cancellationReason: reason } as Partial<Order>
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

  private getTypeLabel(type: string): string {
    return 'Order';
  }

  private getStatusLabel(status: string): string {
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

  private getStatusVariant(status: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      'draft': 'secondary',
      'new': 'info',
      'in_process': 'warning',
      'waiting_for_payment': 'orange',
      'ready_for_shipment': 'teal',
      'shipped': 'blue',
      'delivered': 'success',
      'canceled': 'danger',
      'reversal': 'dark'
    };
    return variants[status] || 'secondary';
  }
}
