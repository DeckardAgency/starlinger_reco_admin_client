import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, switchMap, catchError } from 'rxjs';
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
import { TaxType } from '@core/models/tax-type.model';
import { TaxTypeService } from '@core/services/http/tax-type.service';
import { AlertService } from '@services/alert.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

@Component({
  selector: 'app-tax-types-list',
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
  templateUrl: './tax-types-list.component.html',
  styleUrls: ['./tax-types-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxTypesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private taxTypeService = inject(TaxTypeService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('percentTemplate') percentTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');
  private searchSubject = new Subject<string>();
  private loadRequest$ = new Subject<void>();

  // Pagination state
  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);

  // Loading state
  isLoading = signal(true);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<number | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.taxTypes().filter(t => t.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Pagination display
  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'tax-types';
  columnDefs: ColumnDefinition[] = [];
  private allColumns: TableColumn[] = [];

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data
  taxTypes = signal<TaxType[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadTaxTypes();
    });

    // Single request pipeline: switchMap cancels any in-flight request when a
    // new load is triggered, so stale responses can never overwrite newer ones.
    this.loadRequest$.pipe(
      switchMap(() => this.taxTypeService.getTaxTypes(this.buildLoadParams()).pipe(
        catchError(error => {
          console.error('Failed to load tax types:', error);
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(response => {
      if (response) {
        const items = (response.member || []).map(t => ({ ...t, selected: false }));
        this.taxTypes.set(items);
        this.totalItems.set(response.totalItems || 0);
      } else {
        this.taxTypes.set([]);
      }
      this.isLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.loadTaxTypes();
  }

  private loadTaxTypes(): void {
    this.isLoading.set(true);
    this.loadRequest$.next();
  }

  private buildLoadParams(): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage(),
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

    return params;
  }

  ngAfterViewInit(): void {
    this.initColumns();
    this.cdr.detectChanges();
  }

  private initColumns(): void {
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'name', label: 'Name', visible: true, locked: true },
      { key: 'percent', label: 'Percent', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'percent', label: 'Percent', sortable: true, width: '192px', template: this.percentTemplate },
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
    this.loadTaxTypes();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadTaxTypes();
  }

  onAddTaxType(): void {
    this.router.navigate(['/admin/tax-types/new']);
  }

  toggleDropdown(taxTypeId: number): void {
    if (this.openDropdownId() === taxTypeId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(taxTypeId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const taxType = event.row as TaxType;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(taxType);
        break;
      case 'delete':
        this.onDelete(taxType);
        break;
    }
  }

  onEdit(taxType: TaxType): void {
    this.router.navigate(['/admin/tax-types', taxType.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(taxType: TaxType): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${taxType.name}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.taxTypeService.deleteTaxType(String(taxType.id)).subscribe({
      next: () => {
        this.loadTaxTypes();
      },
      error: (error) => console.error('Error deleting tax type:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.taxTypes().filter(t => t.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} tax type(s)?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(t =>
      this.taxTypeService.deleteTaxType(String(t.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.selectAll.set(false);
      this.loadTaxTypes();
    }).catch(error => {
      console.error('Error bulk deleting tax types:', error);
      this.loadTaxTypes();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.taxTypes().map(t => ({ ...t, selected: true }));
    this.taxTypes.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.taxTypes().map(t => ({ ...t, selected: false }));
    this.taxTypes.set(updated);
    this.selectAll.set(false);
  }

  toggleTaxTypeSelection(taxType: TaxType): void {
    const updated = this.taxTypes().map(t =>
      t.id === taxType.id ? { ...t, selected: !t.selected } : t
    );
    this.taxTypes.set(updated);
    this.selectAll.set(updated.every(t => t.selected));
  }

  formatPercent(value: number | string): string {
    const num = Number(value);
    return isNaN(num) ? '0,00' : num.toFixed(2).replace('.', ',');
  }
}
