import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

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
    MobileFooterComponent
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

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  searchQuery = signal('');
  isLoading = signal(true);
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);
  openDropdownId = signal<string | null>(null);
  isHeaderDropdownOpen = signal(false);
  selectAll = signal(false);

  selectedCount = computed(() => this.accountGroups().filter(t => t.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  columns: TableColumn[] = [];

  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  currentPage = signal(1);
  itemsPerPage = signal(17);

  accountGroups = signal<AccountGroup[]>([]);

  filteredAccountGroups = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.accountGroups();

    if (query) {
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        String(t.id).includes(query)
      );
    }

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

  totalItems = computed(() => this.filteredAccountGroups().length);

  ngOnInit(): void {
    this.loadAccountGroups();
  }

  private loadAccountGroups(): void {
    this.isLoading.set(true);

    this.accountGroupService.getAccountGroups(1, 100).subscribe({
      next: (response) => {
        const items = (response.member || []).map(t => ({ ...t, selected: false }));
        this.accountGroups.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load account groups:', error);
        this.accountGroups.set([]);
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
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'Name', sortable: false },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  onAddAccountGroup(): void {
    this.router.navigate(['/admin/account-groups/new']);
  }

  toggleDropdown(id: string): void {
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
    this.router.navigate(['/admin/account-groups', group.id, 'edit']);
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
        this.accountGroups.update(list => list.filter(t => t.id !== group.id));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error deleting account group:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.accountGroups().filter(t => t.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} account group(s)?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(t =>
      this.accountGroupService.deleteAccountGroup(String(t.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.accountGroups.update(list => list.filter(t => !t.selected));
      this.selectAll.set(false);
      this.cdr.markForCheck();
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
