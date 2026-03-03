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
import { AdminUser, AdminUserRoleType } from '@core/models/admin-user.model';
import { UserService } from '@core/services/http/user.service';
import { AlertService } from '@services/alert.service';
import { User, USER_ROLES } from '@core/models';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

// Filter types
type HasClientFilter = 'all' | 'yes' | 'no';

interface RoleOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-users-list',
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
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private userService = inject(UserService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  private searchSubject = new Subject<string>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('nameTemplate') nameTemplate!: TemplateRef<any>;
  @ViewChild('roleTemplate') roleTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(true);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Filter state
  hasClientFilter: HasClientFilter = 'all';
  roleFilter = 'all';

  // Filter options
  hasClientOptions: { value: HasClientFilter; label: string }[] = [
    { value: 'all', label: 'All Users' },
    { value: 'yes', label: 'With Company' },
    { value: 'no', label: 'Without Company' }
  ];

  roleOptions: RoleOption[] = [
    { value: 'all', label: 'All Roles' },
    { value: USER_ROLES.ADMIN, label: 'Admin' },
    { value: USER_ROLES.CLIENT_ADMIN, label: 'Client Admin' },
    { value: USER_ROLES.CLIENT, label: 'Client' },
    { value: USER_ROLES.USER, label: 'User' }
  ];

  // Dropdown state
  openDropdownId = signal<number | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.users().filter(u => u.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'users';
  columnDefs: ColumnDefinition[] = [];
  private allColumns: TableColumn[] = [];
  columns: TableColumn[] = [];

  // Table actions for dropdown
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

  // Data
  users = signal<AdminUser[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadUsers();
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading.set(true);

    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage()
    };

    // Apply search
    const query = this.searchQuery().trim();
    if (query) {
      params['email'] = query;
    }

    // Apply hasClient filter
    if (this.hasClientFilter === 'yes') {
      params['hasClient'] = true;
    } else if (this.hasClientFilter === 'no') {
      params['hasClient'] = false;
    }

    // Apply role filter
    if (this.roleFilter !== 'all') {
      params['roles'] = this.roleFilter;
    }

    // Apply sorting
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    if (sortCol && sortDir) {
      params[`order[${sortCol}]`] = sortDir;
    }

    this.userService.getUsers(params).subscribe({
      next: (response) => {
        const items = (response.member || []).map(u => this.mapUserToAdminUser(u));
        this.users.set(items);
        this.totalItems.set(response.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.users.set([]);
        this.totalItems.set(0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapUserToAdminUser(user: User): AdminUser {
    return {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.email,
      email: user.email,
      role: this.mapRolesToAdminRole(user.roles),
      selected: false
    };
  }

  private mapRolesToAdminRole(roles: string[]): AdminUserRoleType | null {
    if (!roles || roles.length === 0) return null;
    if (roles.includes('ROLE_ADMIN')) return 'admin';
    if (roles.includes('ROLE_CLIENT_ADMIN')) return 'client_admin';
    if (roles.includes('ROLE_CLIENT')) return 'client';
    return 'client';
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'id', label: 'Id', visible: true, locked: true },
      { key: 'name', label: 'Name', visible: true, locked: true },
      { key: 'email', label: 'Email', visible: true },
      { key: 'role', label: 'Role', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'id', sortable: true, width: '112px' },
      { key: 'name', label: 'Name', sortable: true, template: this.nameTemplate },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Role', sortable: false, template: this.roleTemplate },
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
      ['checkbox', 'actions'].includes(col.key) || visibleKeys.has(col.key)
    );
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onHasClientFilterChange(value: HasClientFilter): void {
    this.hasClientFilter = value;
    this.currentPage.set(1);
    this.loadUsers();
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter = value;
    this.currentPage.set(1);
    this.loadUsers();
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadUsers();
  }

  onAddUser(): void {
    this.router.navigate(['/admin/users/new']);
  }

  toggleDropdown(userId: number, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === userId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(userId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const user = event.row as AdminUser;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(user);
        break;
      case 'delete':
        this.onDelete(user);
        break;
    }
  }

  onEdit(user: AdminUser): void {
    this.router.navigate(['/admin/users', user.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(user: AdminUser): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${user.firstName} ${user.lastName}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.userService.deleteUser(String(user.id)).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => console.error('Error deleting user:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.users().filter(u => u.selected);
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} user(s)?`, 'Delete');
    if (confirmed) {
      selected.forEach(u => {
        this.userService.deleteUser(String(u.id)).subscribe({
          next: () => {
            this.loadUsers();
          }
        });
      });
    }
    this.selectAll.set(false);
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.users().map(u => ({ ...u, selected: true }));
    this.users.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.users().map(u => ({ ...u, selected: false }));
    this.users.set(updated);
    this.selectAll.set(false);
  }

  toggleUserSelection(user: AdminUser): void {
    const updated = this.users().map(u =>
      u.id === user.id ? { ...u, selected: !u.selected } : u
    );
    this.users.set(updated);
    this.selectAll.set(updated.every(u => u.selected));
  }

  getFullName(user: AdminUser): string {
    return `${user.firstName} ${user.lastName}`;
  }

  formatRole(role: string | null): string {
    if (!role) return '-';
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  onExport(): void {
    this.userService.exportToExcel(
      this.sortColumn() || undefined,
      this.sortDirection() || undefined,
      this.searchQuery() || undefined
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Export failed:', err)
    });
  }
}
