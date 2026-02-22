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

// Consolidated components
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
    MobileFooterComponent
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

  // Table columns - will be set after view init to use templates
  columns: TableColumn[] = [];

  // Table actions
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);

  // Computed pagination display
  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Data from API
  accounts = signal<Account[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadAccounts();
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private loadAccounts(): void {
    this.isLoading.set(true);

    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage()
    };

    const query = this.searchQuery().trim();
    if (query) {
      params['name'] = query;
    }

    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    if (sortCol && sortDir) {
      params[`order[${sortCol}]`] = sortDir;
    }

    this.clientService.getClients(params).subscribe({
      next: (response) => {
        const accounts = response.clients.map(client => this.mapClientToAccount(client));
        this.accounts.set(accounts);
        this.totalItems.set(response.totalClients || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load accounts:', error);
        this.accounts.set([]);
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
      oib: client.vatNumber || '',
      name: client.name,
      email: client.email || '',
      status: client.isActive ? 'active' : 'inactive',
      purchaseLimit: client.maxActiveUsers ?? undefined,
      amountSpent: undefined,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
  }

  private initColumns(): void {
    this.columns = [
      { key: 'id', label: 'Id', sortable: true, width: '80px' },
      { key: 'code', label: 'Code', sortable: true, width: '80px' },
      { key: 'oib', label: 'OIB', sortable: true, width: '120px' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true, width: '180px' },
      { key: 'status', label: 'Status', sortable: true, width: '100px', template: this.statusTemplate },
      { key: 'purchaseLimit', label: 'Purchase limit', sortable: true, width: '130px', template: this.purchaseLimitTemplate },
      { key: 'amountSpent', label: 'Amount spent', sortable: true, width: '130px', template: this.amountSpentTemplate },
      { key: 'actions', label: '', sortable: false, width: '56px', template: this.actionsTemplate }
    ];
  }

  onSearchQueryChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadAccounts();
  }

  stringifyId(id: string | number): string {
    return String(id);
  }

  onRefresh(): void {
    this.loadAccounts();
  }

  onExport(): void {
    console.log('Export accounts');
  }

  onAddAccount(): void {
    this.router.navigate(['/admin/accounts/new']);
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
      this.router.navigate(['/admin/accounts', account.id, 'edit']);
    } else if (event.action.id === 'delete') {
      this.deleteAccount(account);
    }
    this.closeDropdown();
  }

  private async deleteAccount(account: Account): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${account.name}"?`, 'Delete');
    if (!confirmed) {
      return;
    }
    this.clientService.deleteClient(String(account.id)).subscribe({
      next: () => {
        this.loadAccounts();
      },
      error: (error) => console.error('Error deleting account:', error)
    });
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '';
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAccounts();
  }
}
