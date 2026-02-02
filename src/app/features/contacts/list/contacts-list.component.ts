import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, computed, TemplateRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { Contact } from '@core/models/account.model';
import { UserService } from '@core/services/http/user.service';
import { User } from '@core/models';

// Consolidated components
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { TableActionsDropdownComponent, TableAction } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DataTableComponent,
    BreadcrumbsComponent,
    ListHeaderComponent,
    TableActionsDropdownComponent,
    TableFooterComponent,
    MobileFooterComponent
  ],
  templateUrl: './contacts-list.component.html',
  styleUrls: ['./contacts-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactsListComponent implements OnInit, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private userService = inject(UserService);

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('phoneTemplate') phoneTemplate!: TemplateRef<any>;

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

  // Data from API
  contacts = signal<Contact[]>([]);
  filteredContacts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.contacts();

    // Filter
    if (query) {
      result = result.filter(c =>
        (c.firstName && c.firstName.toLowerCase().includes(query)) ||
        (c.lastName && c.lastName.toLowerCase().includes(query)) ||
        (c.account && c.account.toLowerCase().includes(query)) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        String(c.id).includes(query)
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

  ngOnInit(): void {
    this.loadContacts();
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private loadContacts(): void {
    this.isLoading.set(true);

    // Filter to only show users WITH a client (company employees)
    this.userService.getUsers({ page: 1, itemsPerPage: 100, hasClient: true }).subscribe({
      next: (response) => {
        const items = (response.member || []).map(u => this.mapUserToContact(u));
        this.contacts.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load contacts:', error);
        this.contacts.set([]);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private mapUserToContact(user: User): Contact {
    return {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      account: user.client?.name || '',
      accountId: user.client ? (user.client as { id?: string }).id as unknown as number : undefined,
      email: user.email || '',
      phone: (user as { phone?: string }).phone || ''
    };
  }

  private initColumns(): void {
    this.columns = [
      { key: 'id', label: 'Id', sortable: true, width: '88px' },
      { key: 'firstName', label: 'First name', sortable: true },
      { key: 'lastName', label: 'Last name', sortable: true },
      { key: 'account', label: 'Account', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', sortable: false, width: '160px', template: this.phoneTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  stringifyId(id: string | number): string {
    return String(id);
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.cdr.markForCheck();
  }

  onRefresh(): void {
    this.loadContacts();
  }

  onExport(): void {
    console.log('Export contacts');
  }

  onAddContact(): void {
    this.router.navigate(['/admin/contacts/new']);
  }

  toggleDropdown(contactId: number | string): void {
    this.openDropdownId = this.openDropdownId === String(contactId) ? null : String(contactId);
    this.cdr.markForCheck();
  }

  closeDropdown(): void {
    this.openDropdownId = null;
    this.cdr.markForCheck();
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const contact = event.row as Contact;
    if (event.action.id === 'edit') {
      this.router.navigate(['/admin/contacts', contact.id, 'edit']);
    } else if (event.action.id === 'delete') {
      console.log('Delete contact:', contact);
    }
    this.closeDropdown();
  }

  formatPhone(phone: string | undefined): string {
    return phone || '–';
  }

  get totalResults(): number {
    return this.filteredContacts().length;
  }

  get showingFrom(): number {
    return this.filteredContacts().length > 0 ? 1 : 0;
  }

  get showingTo(): number {
    return this.filteredContacts().length;
  }
}
