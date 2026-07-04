import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, of, switchMap, catchError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { SupportTicketService } from '@core/services/http/support-ticket.service';
import { SupportTicket } from '@core/models/support-ticket.model';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

type TicketTab = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

@Component({
  selector: 'app-support-tickets-list',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, FormsModule, ColumnSelectorComponent],
  templateUrl: './support-tickets-list.component.html',
  styleUrls: ['./support-tickets-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupportTicketsListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supportTicketService = inject(SupportTicketService);
  private toastService = inject(ToastService);
  private columnSettingsService = inject(ColumnSettingsService);

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
    this.router.navigate(['/admin/support-tickets/view', ticketId]);
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
}
