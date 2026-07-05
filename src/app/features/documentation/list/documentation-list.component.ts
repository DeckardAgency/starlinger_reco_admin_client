import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy, ViewChild, TemplateRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, finalize, of, switchMap, catchError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { ListHeaderComponent } from '@app/ui-kit/molecules/list-header/list-header.component';
import { DataTableComponent, TableColumn, SortEvent } from '@app/ui-kit/organisms/data-table/data-table.component';
import { TableFooterComponent } from '@app/ui-kit/molecules/table-footer/table-footer.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { BadgeComponent, BadgeVariant } from '@app/ui-kit/atoms/badge/badge.component';
import { DocumentationService } from '@core/services/http/documentation.service';
import { Documentation } from '@core/models/documentation.model';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { AlertService } from '@services/alert.service';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

/** Documentation plus precomputed display fields (avoids per-row method calls in the template). */
type DocumentationRow = Documentation & {
  statusClass: string;
  statusText: string;
  statusVariant: BadgeVariant;
  updatedAtLabel: string;
};

@Component({
  selector: 'app-documentation-list',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, ListHeaderComponent, DataTableComponent, TableFooterComponent, TableActionsDropdownComponent, BadgeComponent, FormsModule, ColumnSelectorComponent],
  templateUrl: './documentation-list.component.html',
  styleUrls: ['./documentation-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentationListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('titleTemplate') titleTemplate!: TemplateRef<any>;
  @ViewChild('statusTemplate') statusTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  tableColumns: TableColumn[] = [];
  readonly itemsPerPage = 30;
  openDropdownId = signal<number | null>(null);

  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'eye' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private documentationService = inject(DocumentationService);
  private toastService = inject(ToastService);
  private alertService = inject(AlertService);
  private columnSettingsService = inject(ColumnSettingsService);
  private cdr = inject(ChangeDetectorRef);

  breadcrumbs = [{ label: 'Documentation' }];

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'documentation';
  columnDefs: ColumnDefinition[] = [];

  docs = signal<DocumentationRow[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  totalItems = signal(0);
  currentPage = signal(1);
  totalPages = signal(1);

  searchTerm = signal('');
  sortField = signal<string>('sortOrder');
  sortDirection = signal<'asc' | 'desc'>('asc');

  selectedIds = signal<Set<number>>(new Set());
  allSelected = signal(false);

  pagesArray = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 1) return [];
    const max = 5;
    let start = Math.max(1, current - Math.floor(max / 2));
    const end = Math.min(total, start + max - 1);
    start = Math.max(1, end - max + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
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
      this.loadDocs();
    });

    // Single request pipeline: switchMap cancels any in-flight request when a
    // new load is triggered, so stale responses can never overwrite newer ones.
    this.loadRequest$.pipe(
      switchMap(() => this.documentationService.getDocumentations(
        this.currentPage(),
        this.searchTerm() || undefined,
        this.sortField(),
        this.sortDirection()
      ).pipe(
        catchError(err => {
          console.error('Error loading documentation:', err);
          return of(null);
        })
      )),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      if (data) {
        this.docs.set((data.documentations || []).map(doc => this.mapDocToRow(doc)));
        this.totalItems.set(data.totalItems || 0);
        this.totalPages.set(data.totalPages || 1);
      } else {
        this.error.set('Failed to load documentation.');
      }
      this.isLoading.set(false);
    });

    this.loadDocs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocs(): void {
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
    this.loadDocs();
  }

  sortBy(field: string): void {
    if (this.sortField() === field) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(1);
    this.loadDocs();
  }

  getSortIcon(field: string): string {
    if (this.sortField() !== field) return '';
    return this.sortDirection() === 'asc' ? '\u2191' : '\u2193';
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadDocs();
  }

  goToPreviousPage(): void { this.changePage(this.currentPage() - 1); }
  goToNextPage(): void { this.changePage(this.currentPage() + 1); }
  goToFirstPage(): void { this.changePage(1); }
  goToLastPage(): void { this.changePage(this.totalPages()); }

  addDocumentation(): void {
    this.router.navigate(['/admin/documentation/new']);
  }

  editDocumentation(docId: number): void {
    this.router.navigate(['/admin/documentation', docId, 'edit']);
  }

  async deleteDocumentation(docId: number): Promise<void> {
    const confirmed = await this.alertService.confirm('Are you sure you want to delete this documentation?', 'Delete');
    if (!confirmed) return;

    this.documentationService.deleteDocumentation(String(docId)).subscribe({
      next: () => {
        this.toastService.show({ message: 'Documentation deleted', type: 'success' });
        this.loadDocs();
      },
      error: () => {
        this.toastService.show({ message: 'Failed to delete', type: 'error' });
      }
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const ids = new Set(this.docs().map(d => d.id));
      this.selectedIds.set(ids);
      this.allSelected.set(true);
    } else {
      this.selectedIds.set(new Set());
      this.allSelected.set(false);
    }
  }

  toggleSelectDoc(event: Event, docId: number): void {
    const checked = (event.target as HTMLInputElement).checked;
    const ids = new Set(this.selectedIds());
    if (checked) { ids.add(docId); } else { ids.delete(docId); }
    this.selectedIds.set(ids);
    this.allSelected.set(ids.size === this.docs().length && ids.size > 0);
  }

  isDocSelected(docId: number): boolean {
    return this.selectedIds().has(docId);
  }

  async deleteSelected(): Promise<void> {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) return;
    const confirmed = await this.alertService.confirm(`Delete ${ids.length} documentation(s)?`, 'Delete');
    if (!confirmed) return;

    this.documentationService.deleteDocumentations(ids.map(String)).subscribe({
      next: (result) => {
        this.toastService.show({ message: `Deleted ${result.deletedCount} documentation(s)`, type: 'success' });
        this.selectedIds.set(new Set());
        this.allSelected.set(false);
        this.loadDocs();
      },
      error: () => {
        this.toastService.show({ message: 'Failed to delete', type: 'error' });
      }
    });
  }

  private initColumnDefs(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'title', label: 'Title', visible: true, locked: true },
      { key: 'slug', label: 'Slug', visible: true },
      { key: 'category', label: 'Category', visible: true },
      { key: 'sortOrder', label: 'Order', visible: true },
      { key: 'status', label: 'Status', visible: true },
      { key: 'updatedAt', label: 'Updated', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);
  }

  onColumnsChange(columns: ColumnDefinition[]): void {
    this.columnDefs = columns;
    this.columnSettingsService.saveColumns(this.COLUMN_STORAGE_KEY, columns);
    this.rebuildTableColumns();
  }

  isColumnVisible(key: string): boolean {
    const col = this.columnDefs.find(c => c.key === key);
    return col ? col.visible : true;
  }

  private mapDocToRow(doc: Documentation): DocumentationRow {
    return {
      ...doc,
      statusClass: doc.isPublished ? 'doc-list__status--published' : 'doc-list__status--draft',
      statusText: doc.isPublished ? 'Published' : 'Draft',
      statusVariant: (doc.isPublished ? 'success' : 'secondary') as BadgeVariant,
      updatedAtLabel: this.formatDate(doc.updatedAt)
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getResultsText(): string {
    const page = this.currentPage();
    const total = this.totalItems();
    const start = (page - 1) * 30 + 1;
    const end = Math.min(page * 30, total);
    return `Showing ${start} to ${end} of ${total} results`;
  }

  ngAfterViewInit(): void {
    this.rebuildTableColumns();
    this.cdr.detectChanges();
  }

  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage, this.totalItems()));

  private rebuildTableColumns(): void {
    const all: TableColumn[] = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'title', label: 'Title', sortable: true, template: this.titleTemplate },
      { key: 'slug', label: 'Slug', sortable: false },
      { key: 'category', label: 'Category', sortable: false, width: '140px' },
      { key: 'sortOrder', label: 'Order', sortable: true, width: '100px' },
      { key: 'status', label: 'Status', sortable: false, width: '120px', template: this.statusTemplate },
      { key: 'updatedAtLabel', label: 'Updated', sortable: true, width: '140px' },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
    this.tableColumns = all.filter(c =>
      c.key === 'checkbox' || c.key === 'actions' || this.isColumnVisible(this.tableSortKeyToDefKey(c.key))
    );
  }

  private tableSortKeyToDefKey(key: string): string {
    return key === 'updatedAtLabel' ? 'updatedAt' : key;
  }

  onTableSort(event: SortEvent): void {
    if (!event.direction) {
      this.sortField.set('sortOrder');
      this.sortDirection.set('asc');
    } else {
      this.sortField.set(this.tableSortKeyToDefKey(event.column));
      this.sortDirection.set(event.direction);
    }
    this.currentPage.set(1);
    this.loadDocs();
  }

  toggleDropdown(id: number): void {
    this.openDropdownId.set(this.openDropdownId() === id ? null : id);
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
  }

  onActionClick(event: ActionClickEvent): void {
    const row = event.row as DocumentationRow;
    this.closeDropdown();
    switch (event.action.id) {
      case 'edit':
        this.editDocumentation(row.id);
        break;
      case 'delete':
        this.deleteDocumentation(row.id);
        break;
    }
  }
}
