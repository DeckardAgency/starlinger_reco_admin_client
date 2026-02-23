import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DocumentationService } from '@core/services/http/documentation.service';
import { Documentation } from '@core/models/documentation.model';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { AlertService } from '@services/alert.service';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

@Component({
  selector: 'app-documentation-list',
  standalone: true,
  imports: [CommonModule, BreadcrumbsComponent, FormsModule, ColumnSelectorComponent],
  templateUrl: './documentation-list.component.html',
  styleUrls: ['./documentation-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentationListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private documentationService = inject(DocumentationService);
  private toastService = inject(ToastService);
  private alertService = inject(AlertService);
  private columnSettingsService = inject(ColumnSettingsService);

  breadcrumbs = [{ label: 'Documentation' }];

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'documentation';
  columnDefs: ColumnDefinition[] = [];

  docs = signal<Documentation[]>([]);
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

    this.loadDocs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.documentationService.getDocumentations(
      this.currentPage(),
      this.searchTerm() || undefined,
      this.sortField(),
      this.sortDirection()
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.docs.set(data.documentations || []);
        this.totalItems.set(data.totalItems || 0);
        this.totalPages.set(data.totalPages || 1);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading documentation:', err);
        this.error.set('Failed to load documentation.');
        this.isLoading.set(false);
      }
    });
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
  }

  isColumnVisible(key: string): boolean {
    const col = this.columnDefs.find(c => c.key === key);
    return col ? col.visible : true;
  }

  getStatusClass(isPublished: boolean): string {
    return isPublished ? 'doc-list__status--published' : 'doc-list__status--draft';
  }

  getStatusText(isPublished: boolean): string {
    return isPublished ? 'Published' : 'Draft';
  }

  formatDate(dateStr: string): string {
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
}
