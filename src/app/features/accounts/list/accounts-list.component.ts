import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, computed, TemplateRef, ViewChild, AfterViewInit, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BadgeComponent } from '@app/ui-kit/atoms/badge/badge.component';
import { Account } from '@core/models/account.model';
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
  private clientService = inject(ClientService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  private searchSubject = new Subject<string>();

  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('purchaseLimitTemplate') purchaseLimitTemplate!: TemplateRef<any>;
  @ViewChild('amountSpentTemplate') amountSpentTemplate!: TemplateRef<any>;

  searchQuery = signal('');
  isLoading = signal(true);
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);
  openDropdownId: string | null = null;

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'clients';
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
  }

  ngOnInit(): void {
    this.loadClients();
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
      { key: 'purchaseLimit', label: 'Purchase limit', visible: true },
      { key: 'amountSpent', label: 'Amount spent', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'id', label: 'Id', sortable: true, width: '80px' },
      { key: 'code', label: 'Code', sortable: true, width: '80px' },
      { key: 'vatNumber', label: 'VAT Number', sortable: true, width: '120px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true, width: '180px' },
      { key: 'status', label: 'Status', sortable: true, width: '100px', template: this.statusTemplate },
      { key: 'purchaseLimit', label: 'Purchase limit', sortable: true, width: '130px', template: this.purchaseLimitTemplate },
      { key: 'amountSpent', label: 'Amount spent', sortable: true, width: '130px', template: this.amountSpentTemplate },
      { key: 'actions', label: '', sortable: false, width: '56px', template: this.actionsTemplate }
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

  private loadClients(): void {
    this.isLoading.set(true);

    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage()
    };

    const query = this.searchQuery().trim();
    if (query) {
      params['search'] = query;
    }

    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    if (sortCol && sortDir) {
      params[`order[${sortCol}]`] = sortDir;
    }

    this.clientService.getClients(params).subscribe({
      next: (response) => {
        const clients = response.clients.map(client => this.mapClientToAccount(client));
        this.clients.set(clients);
        this.totalItems.set(response.totalClients || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load clients:', error);
        this.clients.set([]);
        this.totalItems.set(0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapClientToAccount(client: Client): Account {
    return {
      id: client.id,
      code: client.code,
      vatNumber: client.vatNumber || '',
      name: client.name,
      email: client.email || '',
      status: client.isActive ? 'active' : 'inactive',
      purchaseLimit: client.purchaseLimit ? parseFloat(client.purchaseLimit) : undefined,
      amountSpent: client.amountSpent ? parseFloat(client.amountSpent) : undefined,
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
    this.router.navigate(['/admin/clients/new']);
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
      this.router.navigate(['/admin/clients', account.id, 'edit']);
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
