import { Component, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal, computed, TemplateRef, ViewChild, AfterViewInit, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { ContactService } from '@core/services/http/contact.service';
import { ClientService } from '@core/services/http/client.service';
import { Contact } from '@core/models/contact.model';
import { AlertService } from '@services/alert.service';
import { forkJoin } from 'rxjs';

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
  private contactService = inject(ContactService);
  private clientService = inject(ClientService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  private searchSubject = new Subject<string>();

  // Account name lookup map (loaded once)
  private accountMap = new Map<number, string>();
  private accountsLoaded = false;

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

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);

  // Computed pagination display
  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Data from API
  contacts = signal<Contact[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadContacts();
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private loadInitialData(): void {
    this.isLoading.set(true);

    // Load accounts once for name resolution, then load contacts
    forkJoin({
      contacts: this.contactService.getContacts({
        page: this.currentPage(),
        itemsPerPage: this.itemsPerPage()
      }),
      accounts: this.clientService.getClients({ page: 1, itemsPerPage: 500, 'order[name]': 'asc' })
    }).subscribe({
      next: ({ contacts, accounts }) => {
        // Build account lookup map
        accounts.clients.forEach(client => {
          this.accountMap.set(client.id, client.name);
        });
        this.accountsLoaded = true;

        // Resolve account names for each contact
        const contactsWithAccount = contacts.contacts.map(c => ({
          ...c,
          account: c.accountId ? this.accountMap.get(c.accountId) || '' : ''
        }));

        this.contacts.set(contactsWithAccount);
        this.totalItems.set(contacts.totalContacts || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load contacts:', error);
        this.contacts.set([]);
        this.totalItems.set(0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private loadContacts(): void {
    this.isLoading.set(true);

    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage()
    };

    const query = this.searchQuery().trim();
    if (query) {
      params['firstName'] = query;
    }

    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    if (sortCol && sortDir) {
      params[`order[${sortCol}]`] = sortDir;
    }

    this.contactService.getContacts(params).subscribe({
      next: (response) => {
        const contactsWithAccount = response.contacts.map(c => ({
          ...c,
          account: c.accountId ? this.accountMap.get(c.accountId) || '' : ''
        }));

        this.contacts.set(contactsWithAccount);
        this.totalItems.set(response.totalContacts || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load contacts:', error);
        this.contacts.set([]);
        this.totalItems.set(0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private initColumns(): void {
    this.columns = [
      { key: 'id', label: 'Id', sortable: true, width: '88px' },
      { key: 'firstName', label: 'First name', sortable: true },
      { key: 'lastName', label: 'Last name', sortable: true },
      { key: 'account', label: 'Account', sortable: false },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone', sortable: true, width: '160px', template: this.phoneTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  stringifyId(id: string | number): string {
    return String(id);
  }

  onSearchQueryChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSort(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadContacts();
  }

  onRefresh(): void {
    if (this.accountsLoaded) {
      this.loadContacts();
    } else {
      this.loadInitialData();
    }
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
      this.deleteContact(contact);
      return;
    }
    this.closeDropdown();
  }

  private async deleteContact(contact: Contact): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${contact.firstName} ${contact.lastName}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.contactService.deleteContact(contact.id).subscribe({
      next: () => {
        this.loadContacts();
      },
      error: (error) => console.error('Error deleting contact:', error)
    });
    this.closeDropdown();
  }

  formatPhone(phone: string | undefined): string {
    return phone || '–';
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadContacts();
  }
}
