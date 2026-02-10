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
import { AdminUser, AdminUserRoleType } from '@core/models/admin-user.model';
import { UserService } from '@core/services/http/user.service';
import { AlertService } from '@services/alert.service';
import { User, USER_ROLES } from '@core/models';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

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
    MobileFooterComponent
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
    { value: USER_ROLES.SUPER_ADMIN, label: 'Super Admin' },
    { value: USER_ROLES.ADMIN, label: 'Admin' },
    { value: USER_ROLES.CLIENT_ADMIN, label: 'Client Admin' },
    { value: USER_ROLES.CLIENT, label: 'Client' },
    { value: USER_ROLES.USER, label: 'User' }
  ];

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.users().filter(u => u.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data
  users = signal<AdminUser[]>([]);

  // Filtered and sorted users
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.users();

    // Filter
    if (query) {
      result = result.filter(u =>
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        String(u.id).includes(query)
      );
    }

    // Sort
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        let aVal: unknown;
        let bVal: unknown;
        if (sortCol === 'name') {
          aVal = `${a.firstName} ${a.lastName}`;
          bVal = `${b.firstName} ${b.lastName}`;
        } else {
          aVal = (a as unknown as Record<string, unknown>)[sortCol];
          bVal = (b as unknown as Record<string, unknown>)[sortCol];
        }
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
  totalItems = computed(() => this.filteredUsers().length);

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.isLoading.set(true);

    // Build filter params
    const filters: {
      page: number;
      itemsPerPage: number;
      hasClient?: boolean;
      roles?: string;
    } = { page: 1, itemsPerPage: 100 };

    // Apply hasClient filter
    if (this.hasClientFilter === 'yes') {
      filters.hasClient = true;
    } else if (this.hasClientFilter === 'no') {
      filters.hasClient = false;
    }

    // Apply role filter
    if (this.roleFilter !== 'all') {
      filters.roles = this.roleFilter;
    }

    this.userService.getUsers(filters).subscribe({
      next: (response) => {
        const items = (response.member || []).map(u => this.mapUserToAdminUser(u));
        this.users.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.users.set([]);
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
    if (roles.includes('ROLE_SUPER_ADMIN') || roles.includes('ROLE_ADMIN')) return 'admin';
    if (roles.includes('ROLE_CLIENT_ADMIN')) return 'admin';
    if (roles.includes('ROLE_VIEWER')) return 'viewer';
    if (roles.includes('ROLE_CLIENT')) return 'editor';
    return 'editor';
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'id', label: 'id', sortable: true, width: '112px' },
      { key: 'name', label: 'Name', sortable: true, template: this.nameTemplate },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'role', label: 'Role', sortable: true, template: this.roleTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    console.log('Searching:', this.searchQuery);
  }

  onHasClientFilterChange(value: HasClientFilter): void {
    this.hasClientFilter = value;
    this.loadUsers();
  }

  onRoleFilterChange(value: string): void {
    this.roleFilter = value;
    this.loadUsers();
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  onAddUser(): void {
    this.router.navigate(['/admin/users/new']);
  }

  toggleDropdown(userId: string, event: Event | void): void {
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
        this.users.update(list => list.filter(u => u.id !== user.id));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error deleting user:', error)
    });
    this.closeDropdown();
  }

  onBulkDelete(): void {
    const selected = this.users().filter(u => u.selected);
    console.log('Bulk delete users:', selected);
    const remaining = this.users().filter(u => !u.selected);
    this.users.set(remaining);
    this.selectAll.set(false);
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
    console.log('Export users');
  }
}
