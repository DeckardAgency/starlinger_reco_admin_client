import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import {
  ListHeaderComponent,
  TableFooterComponent,
  TableActionsDropdownComponent,
  TableCheckboxSelectionComponent,
  TableAction
} from '@app/ui-kit/molecules';
import { AccountGroup } from '@core/models/account-group.model';
import { AccountGroupService } from '@core/services/http/account-group.service';
import { AlertService } from '@services/alert.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

@Component({
  selector: 'app-account-groups-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableFooterComponent,
    TableActionsDropdownComponent,
    TableCheckboxSelectionComponent,
    MobileFooterComponent,
    ColumnSelectorComponent
  ],
  templateUrl: './account-groups-list.component.html',
  styleUrls: ['./account-groups-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountGroupsListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private accountGroupService = inject(AccountGroupService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  private searchSubject = new Subject<string>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  searchQuery = signal('');
  isLoading = signal(true);
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);
  openDropdownId = signal<number | null>(null);
  isHeaderDropdownOpen = signal(false);
  selectAll = signal(false);

  selectedCount = computed(() => this.accountGroups().filter(t => t.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'account-groups';
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

  accountGroups = signal<AccountGroup[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadAccountGroups();
    });
  }

  ngOnInit(): void {
    this.loadAccountGroups();
  }

  private loadAccountGroups(): void {
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

    this.accountGroupService.getAccountGroups(params).subscribe({
      next: (response) => {
        const items = (response.member || []).map(t => ({ ...t, selected: false }));
        this.accountGroups.set(items);
        this.totalItems.set(response.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load account groups:', error);
        this.accountGroups.set([]);
        this.totalItems.set(0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'name', label: 'Name', visible: true, locked: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'Name', sortable: true },
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
      col.key === 'actions' || col.key === 'checkbox' || visibleKeys.has(col.key)
    );
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadAccountGroups();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadAccountGroups();
  }

  onAddAccountGroup(): void {
    this.router.navigate(['/admin/client-groups/new']);
  }

  toggleDropdown(id: number): void {
    if (this.openDropdownId() === id) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(id);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const group = event.row as AccountGroup;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(group);
        break;
      case 'delete':
        this.onDelete(group);
        break;
    }
  }

  onEdit(group: AccountGroup): void {
    this.router.navigate(['/admin/client-groups', group.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(group: AccountGroup): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${group.name}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.accountGroupService.deleteAccountGroup(String(group.id)).subscribe({
      next: () => {
        this.loadAccountGroups();
      },
      error: (error) => console.error('Error deleting account group:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.accountGroups().filter(t => t.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} client group(s)?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(t =>
      this.accountGroupService.deleteAccountGroup(String(t.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.selectAll.set(false);
      this.loadAccountGroups();
    }).catch(error => {
      console.error('Error bulk deleting account groups:', error);
      this.loadAccountGroups();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.accountGroups().map(t => ({ ...t, selected: true }));
    this.accountGroups.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.accountGroups().map(t => ({ ...t, selected: false }));
    this.accountGroups.set(updated);
    this.selectAll.set(false);
  }

  toggleSelection(group: AccountGroup): void {
    const updated = this.accountGroups().map(t =>
      t.id === group.id ? { ...t, selected: !t.selected } : t
    );
    this.accountGroups.set(updated);
    this.selectAll.set(updated.every(t => t.selected));
  }
}
