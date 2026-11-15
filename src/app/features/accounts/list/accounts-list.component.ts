import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, computed, TemplateRef, ViewChild, AfterViewInit, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { Account, AccountKind } from '@core/models/account.model';
import { ClientService } from '@core/services/http/client.service';
import { Client } from '@core/models/client.model';
import { AlertService } from '@services/alert.service';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableActionsDropdownComponent, TableAction } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [
    IconComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BadgeComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableActionsDropdownComponent,
    TableFooterComponent,
    MobileFooterComponent,
    ColumnSelectorComponent
  ],
  templateUrl: './accounts-list.component.html',
  styleUrls: ['./accounts-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountsListComponent implements OnInit, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clientService = inject(ClientService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  private searchSubject = new Subject<string>();
  private loadRequest$ = new Subject<void>();

  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('purchaseLimitTemplate') purchaseLimitTemplate!: TemplateRef<any>;
  @ViewChild('amountSpentTemplate') amountSpentTemplate!: TemplateRef<any>;

  /**
   * Which section this list serves (route `data.kind`). Customers and agents are
   * both Client API records, split by `isClientAgent`; agents never order for
   * themselves, so the delivery-address attention bits only apply to customers.
   */
  kind = signal<AccountKind>('customer');
  isAgentList = computed(() => this.kind() === 'agent');
  /** 'Customers' / 'Agents' */
  kindLabel = computed(() => this.isAgentList() ? 'Agents' : 'Customers');
  /** 'customer' / 'agent' */
  kindNoun = computed(() => this.isAgentList() ? 'agent' : 'customer');
  basePath = computed(() => this.isAgentList() ? '/admin/agents' : '/admin/customers');

  searchQuery = signal('');
  /** 'missing-address' → server-side hasActiveDeliveryAddress=false (customers whose users cannot order). */
  addressFilter = 'all';
  /** Customers without an active delivery address (their users cannot order) — shown above the table. */
  missingAddressCount = signal(0);
  addressFilterOptions = [
    { value: 'all', label: 'All customers' },
    { value: 'missing-address', label: 'Missing delivery address' }
  ];
  isLoading = signal(true);
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);
  openDropdownId: string | null = null;

  // Column selector ('clients' keeps the settings customers were saved under before the split)
  columnStorageKey = computed(() => this.isAgentList() ? 'agents' : 'clients');
  columnDefs: ColumnDefinition[] = [];
  private allColumns: TableColumn[] = [];
  columns: TableColumn[] = [];

  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);

  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  clients = signal<Account[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadClients();
    });

    // Single request pipeline: switchMap cancels any in-flight request when a
    // new load is triggered, so stale responses can never overwrite newer ones.
    this.loadRequest$.pipe(
      switchMap(() => this.clientService.getClients(this.buildLoadParams()).pipe(
        catchError(error => {
          console.error('Failed to load clients:', error);
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (response) {
        const clients = response.clients.map(client => this.mapClientToAccount(client));
        this.clients.set(clients);
        this.totalItems.set(response.totalClients || 0);
      } else {
        this.clients.set([]);
        this.totalItems.set(0);
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    // The same component serves /customers and /agents; re-read on every change.
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.kind.set(data['kind'] === 'agent' ? 'agent' : 'customer');
        this.addressFilter = 'all';
        this.missingAddressCount.set(0);
        this.currentPage.set(1);
        if (this.statusTemplate) {
          this.initColumns(); // columns differ per kind; first run happens in ngAfterViewInit
        }
        this.loadAttentionCount();
        this.loadClients();
      });
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'id', label: 'Id', visible: true, locked: true },
      { key: 'code', label: 'Code', visible: true },
      { key: 'vatNumber', label: 'VAT Number', visible: true },
      { key: 'name', label: 'Name', visible: true, locked: true },
      { key: 'email', label: 'Email', visible: true },
      { key: 'status', label: 'Status', visible: true },
      ...(this.isAgentList() ? [{ key: 'managedClientCount', label: 'Customers', visible: true }] : []),
      { key: 'purchaseLimit', label: 'Purchase limit', visible: true },
      { key: 'amountSpent', label: 'Open payments', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.columnStorageKey(), defaultColumnDefs);

    this.allColumns = [
      { key: 'id', label: 'Id', sortable: true, width: '80px' },
      { key: 'code', label: 'Code', sortable: true, width: '80px' },
      { key: 'vatNumber', label: 'VAT Number', sortable: true, width: '120px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true, width: '180px' },
      { key: 'status', label: 'Status', sortable: true, width: '190px', template: this.statusTemplate },
      ...(this.isAgentList() ? [{ key: 'managedClientCount', label: 'Customers', width: '110px', align: 'right' } as TableColumn] : []),
      { key: 'purchaseLimit', label: 'Purchase limit', sortable: true, width: '130px', template: this.purchaseLimitTemplate, align: 'right' },
      { key: 'amountSpent', label: 'Open payments', sortable: true, width: '130px', template: this.amountSpentTemplate, align: 'right' },
      { key: 'actions', label: '', sortable: false, width: '56px', template: this.actionsTemplate }
    ];

    this.applyColumnVisibility();
  }

  onColumnsChange(columns: ColumnDefinition[]): void {
    this.columnDefs = columns;
    this.columnSettingsService.saveColumns(this.columnStorageKey(), columns);
    this.applyColumnVisibility();
    this.cdr.markForCheck();
  }

  private applyColumnVisibility(): void {
    const visibleKeys = new Set(this.columnDefs.filter(c => c.visible).map(c => c.key));
    this.columns = this.allColumns.filter(col =>
      col.key === 'actions' || visibleKeys.has(col.key)
    );
  }

  private loadClients(): void {
    this.isLoading.set(true);
    this.loadRequest$.next();
  }

  onAddressFilterChange(value: string): void {
    this.addressFilter = value;
    this.currentPage.set(1);
    this.loadClients();
  }

  /** Customers only: agents never order for themselves, so they need no delivery address. */
  private loadAttentionCount(): void {
    if (this.isAgentList()) {
      return;
    }
    this.clientService.getClients({ isClientAgent: false, hasActiveDeliveryAddress: false, itemsPerPage: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(response => {
        this.missingAddressCount.set(response.totalClients || 0);
        this.cdr.markForCheck();
      });
  }

  private buildLoadParams(): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage(),
      isClientAgent: this.isAgentList()
    };

    const query = this.searchQuery().trim();
    if (query) {
      params['search'] = query;
    }

    if (this.addressFilter === 'missing-address') {
      params['hasActiveDeliveryAddress'] = false;
    }

    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    if (sortCol && sortDir) {
      params[`order[${sortCol}]`] = sortDir;
    } else {
      // Default: newest clients first
      params['order[id]'] = 'desc';
    }

    return params;
  }

  private mapClientToAccount(client: Client): Account {
    return {
      id: client.id,
      code: client.code,
      vatNumber: client.vatNumber || '',
      name: client.name,
      email: client.email || '',
      status: client.isActive ? 'active' : 'inactive',
      hasActiveDeliveryAddress: client.hasActiveDeliveryAddress,
      purchaseLimit: client.purchaseLimit ? parseFloat(client.purchaseLimit) : undefined,
      amountSpent: client.amountSpent ? parseFloat(client.amountSpent) : undefined,
      managedClientCount: client.managedClientCount ?? 0,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
  }

  onSearchQueryChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadClients();
  }

  stringifyId(id: string | number): string {
    return String(id);
  }

  onRefresh(): void {
    this.loadAttentionCount();
    this.loadClients();
  }

  onExport(): void {
    this.clientService.exportToExcel(
      this.sortColumn() || undefined,
      this.sortDirection() || undefined,
      this.searchQuery() || undefined
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clients-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Export failed:', err)
    });
  }

  onAddAccount(): void {
    this.router.navigate([this.basePath(), 'new']);
  }

  toggleDropdown(accountId: number | string): void {
    this.openDropdownId = this.openDropdownId === String(accountId) ? null : String(accountId);
    this.cdr.markForCheck();
  }

  closeDropdown(): void {
    this.openDropdownId = null;
    this.cdr.markForCheck();
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const account = event.row as Account;
    if (event.action.id === 'edit') {
      this.router.navigate([this.basePath(), account.id, 'edit']);
    } else if (event.action.id === 'delete') {
      this.deleteClient(account);
    }
    this.closeDropdown();
  }

  private async deleteClient(account: Account): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${account.name}"?`, 'Delete');
    if (!confirmed) {
      return;
    }
    this.clientService.deleteClient(String(account.id)).subscribe({
      next: () => {
        this.loadClients();
      },
      error: (error) => console.error('Error deleting client:', error)
    });
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '';
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadClients();
  }
}
