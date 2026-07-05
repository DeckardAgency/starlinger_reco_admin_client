import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, of, switchMap, catchError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { BadgeComponent, BadgeVariant } from '@app/ui-kit/atoms/badge/badge.component';
import { AvatarComponent } from '@app/ui-kit/atoms/avatar/avatar.component';
import { SupportTicketService } from '@core/services/http/support-ticket.service';
import { SupportTicket } from '@core/models/support-ticket.model';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

type TicketTab = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

@Component({
  selector: 'app-support-tickets-list',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, TabsComponent, ListHeaderComponent, DataTableComponent, TableFooterComponent, TableActionsDropdownComponent, BadgeComponent, AvatarComponent, FormsModule, ColumnSelectorComponent],
  templateUrl: './support-tickets-list.component.html',
  styleUrls: ['./support-tickets-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportTicketsListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('idTemplate') idTemplate!: TemplateRef<any>;
  @ViewChild('subjectTemplate') subjectTemplate!: TemplateRef<any>;
  @ViewChild('customerTemplate') customerTemplate!: TemplateRef<any>;
  @ViewChild('urgencyTemplate') urgencyTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  tableColumns: TableColumn[] = [];
  readonly itemsPerPage = 30;
  openDropdownId = signal<string | null>(null);

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supportTicketService = inject(SupportTicketService);
  private toastService = inject(ToastService);
  private columnSettingsService = inject(ColumnSettingsService);
  private cdr = inject(ChangeDetectorRef);

  Math = Math;

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'support-tickets';
  columnDefs: ColumnDefinition[] = [];

  breadcrumbs = [{ label: 'Support Tickets' }];

  tickets = signal<SupportTicket[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  totalTickets = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);

  searchTerm = signal('');
  sortField = signal<string>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  activeTab = signal<TicketTab>('all');

  tabItems: TabItem[] = [
    { id: 'all', label: 'All' },
    { id: 'open', label: 'Open' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'closed', label: 'Closed' }
  ];

  statusDisplayMap: Record<string, string> = {
    'open': 'Open',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed'
  };

  urgencyDisplayMap: Record<string, { label: string; color: string }> = {
    'low': { label: 'Low', color: '#10b981' },
    'medium': { label: 'Medium', color: '#f59e0b' },
    'high': { label: 'High', color: '#ef4444' }
  };

  statusFilters: Record<TicketTab, string[]> = {
    all: [],
    open: ['open'],
    in_progress: ['in_progress'],
    resolved: ['resolved'],
    closed: ['closed']
  };

  pagesArray = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const max = 5;
    if (total <= max) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      const start = Math.max(1, current - Math.floor(max / 2));
      const end = Math.min(total, start + max - 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  });

  private searchSubject = new Subject<string>();
  private loadRequest$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initColumnDefs();

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.currentPage.set(1);
      this.loadTickets();
    });

    // Single request pipeline: switchMap cancels any in-flight request when a
    // new load is triggered, so stale responses can never overwrite newer ones.
    this.loadRequest$.pipe(
      switchMap(() => {
        const filters = this.statusFilters[this.activeTab()];
        const searchParams: Record<string, string> = {};
        if (this.searchTerm()) searchParams['query'] = this.searchTerm();

        return this.supportTicketService.getSupportTickets(
          this.currentPage(),
          this.sortField(),
          this.sortDirection(),
          searchParams,
          { status: filters.length > 0 ? filters : undefined }
        ).pipe(
          catchError(err => {
            console.error('Error loading support tickets:', err);
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      if (response) {
        this.tickets.set(response.tickets);
        this.totalTickets.set(response.totalTickets);
        this.totalPages.set(response.totalPages);
      } else {
        this.error.set('Failed to load support tickets.');
      }
      this.isLoading.set(false);
    });

    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTickets(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.loadRequest$.next();
  }

  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadTickets();
  }

  onSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
    this.loadTickets();
  }

  getSortIcon(field: string): string {
    if (this.sortField() !== field) return '';
    return this.sortDirection() === 'asc' ? '\u2191' : '\u2193';
  }

  switchTab(tab: TicketTab): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadTickets();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadTickets();
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  viewTicket(ticketId: number): void {
    this.router.navigate(['/admin/support-tickets', ticketId, 'view']);
  }

  updateStatus(ticketId: number, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed'): void {
    this.supportTicketService.updateStatus(String(ticketId), newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.show({ message: 'Status updated', type: 'success' });
          this.loadTickets();
        },
        error: () => {
          this.toastService.show({ message: 'Failed to update status', type: 'error' });
        }
      });
  }

  getUserFullName(ticket: SupportTicket): string {
    if (!ticket.user) return 'Unknown User';
    return `${ticket.user.firstName} ${ticket.user.lastName}`;
  }

  getUrgencyColor(urgency: string): string {
    return this.urgencyDisplayMap[urgency]?.color || '#666';
  }

  private initColumnDefs(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'id', label: 'Ticket ID', visible: true, locked: true },
      { key: 'subject', label: 'Subject', visible: true },
      { key: 'createdAt', label: 'Date Created', visible: true },
      { key: 'customer', label: 'Customer', visible: true },
      { key: 'urgency', label: 'Urgency', visible: true },
      { key: 'status', label: 'Status', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);
  }

  onColumnsChange(columns: ColumnDefinition[]): void {
    this.columnDefs = columns;
    this.columnSettingsService.saveColumns(this.COLUMN_STORAGE_KEY, columns);
  }

  isColumnVisible(key: string): boolean {
    const col = this.columnDefs.find(c => c.key === key);
    return col ? col.visible : true;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  ngAfterViewInit(): void {
    this.rebuildTableColumns();
    this.cdr.detectChanges();
  }

  showingFrom = computed(() => this.totalTickets() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage, this.totalTickets()));

  /** Rows with precomputed display fields for the data table. */
  ticketRows = computed(() => this.tickets().map(ticket => ({
    ...ticket,
    shortId: String(ticket.id).slice(0, 8),
    customerName: this.getUserFullName(ticket),
    customerInitials: `${ticket.user?.firstName?.[0] || 'U'}${ticket.user?.lastName?.[0] || ''}`.toUpperCase(),
    createdAtLabel: this.formatDate(ticket.createdAt),
    urgencyLabel: this.urgencyDisplayMap[ticket.urgency]?.label || ticket.urgency,
    urgencyColor: this.getUrgencyColor(ticket.urgency),
    statusLabel: this.statusDisplayMap[ticket.status] || ticket.status,
    statusVariant: this.ticketStatusVariant(ticket.status)
  })));

  private ticketStatusVariant(status: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      'open': 'blue',
      'in_progress': 'warning',
      'resolved': 'success',
      'closed': 'secondary'
    };
    return variants[status] || 'secondary';
  }

  private rebuildTableColumns(): void {
    const all: TableColumn[] = [
      { key: 'id', label: 'Ticket ID', sortable: false, width: '120px', template: this.idTemplate },
      { key: 'subject', label: 'Subject', sortable: true, template: this.subjectTemplate },
      { key: 'createdAt', label: 'Date Created', sortable: true, width: '140px' },
      { key: 'customer', label: 'Customer', sortable: false, width: '200px', template: this.customerTemplate },
      { key: 'urgency', label: 'Urgency', sortable: false, width: '110px', template: this.urgencyTemplate },
      { key: 'status', label: 'Status', sortable: false, width: '130px', template: this.statusTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
    this.tableColumns = all
      .filter(c => c.key === 'actions' || this.isColumnVisible(c.key))
      .map(c => c.key === 'createdAt' ? { ...c, key: 'createdAtLabel' } : c);
  }

  onTableSort(event: SortEvent): void {
    if (!event.direction) {
      this.sortField.set('createdAt');
      this.sortDirection.set('desc');
    } else {
      this.sortField.set(event.column === 'createdAtLabel' ? 'createdAt' : event.column);
      this.sortDirection.set(event.direction);
    }
    this.currentPage.set(1);
    this.loadTickets();
  }

  getRowActions(row: { status: string }): TableAction[] {
    const actions: TableAction[] = [{ id: 'view', label: 'View', icon: 'eye' }];
    if (row.status !== 'in_progress') actions.push({ id: 'mark_in_progress', label: 'Mark In Progress', icon: 'refresh' });
    if (row.status !== 'resolved') actions.push({ id: 'mark_resolved', label: 'Mark Resolved', icon: 'check' });
    if (row.status !== 'closed') actions.push({ id: 'mark_closed', label: 'Mark Closed', icon: 'x' });
    return actions;
  }

  toggleDropdown(id: string): void {
    this.openDropdownId.set(this.openDropdownId() === id ? null : id);
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  onActionClick(event: ActionClickEvent): void {
    const row = event.row as SupportTicket;
    this.closeDropdown();
    switch (event.action.id) {
      case 'view':
        this.viewTicket(row.id);
        break;
      case 'mark_in_progress':
        this.updateStatus(row.id as any, 'in_progress');
        break;
      case 'mark_resolved':
        this.updateStatus(row.id as any, 'resolved');
        break;
      case 'mark_closed':
        this.updateStatus(row.id as any, 'closed');
        break;
    }
  }
}
