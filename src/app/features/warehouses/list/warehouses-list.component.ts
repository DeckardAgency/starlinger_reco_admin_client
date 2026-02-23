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
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { Warehouse } from '@core/models/warehouse.model';
import { WarehouseService } from '@core/services/http/warehouse.service';
import { AlertService } from '@services/alert.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

@Component({
  selector: 'app-warehouses-list',
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
    ToggleComponent,
    MobileFooterComponent,
    ColumnSelectorComponent
  ],
  templateUrl: './warehouses-list.component.html',
  styleUrls: ['./warehouses-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehousesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private warehouseService = inject(WarehouseService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private columnSettingsService = inject(ColumnSettingsService);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('activeTemplate') activeTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');
  private searchSubject = new Subject<string>();

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

  selectedCount = computed(() => this.warehouses().filter(w => w.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Pagination display
  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Column selector
  readonly COLUMN_STORAGE_KEY = 'warehouses';
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
  warehouses = signal<Warehouse[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadWarehouses();
    });
  }

  ngOnInit(): void {
    this.loadWarehouses();
  }

  private loadWarehouses(): void {
    this.isLoading.set(true);

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

    this.warehouseService.getWarehouses(params).subscribe({
      next: (response) => {
        const items = (response.member || []).map(w => ({ ...w, selected: false }));
        this.warehouses.set(items);
        this.totalItems.set(response.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load warehouses:', error);
        this.warehouses.set([]);
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
    const defaultColumnDefs: ColumnDefinition[] = [
      { key: 'name', label: 'Name', visible: true, locked: true },
      { key: 'isActive', label: 'Active', visible: true }
    ];

    this.columnDefs = this.columnSettingsService.loadColumns(this.COLUMN_STORAGE_KEY, defaultColumnDefs);

    this.allColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'isActive', label: 'Active', sortable: true, width: '192px', template: this.activeTemplate },
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
    this.loadWarehouses();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadWarehouses();
  }

  onAddWarehouse(): void {
    this.router.navigate(['/admin/warehouses/new']);
  }

  toggleDropdown(warehouseId: number, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === warehouseId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(warehouseId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const warehouse = event.row as Warehouse;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(warehouse);
        break;
      case 'delete':
        this.onDelete(warehouse);
        break;
    }
  }

  onEdit(warehouse: Warehouse): void {
    this.router.navigate(['/admin/warehouses', warehouse.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(warehouse: Warehouse): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${warehouse.name}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.warehouseService.deleteWarehouse(String(warehouse.id)).subscribe({
      next: () => {
        this.loadWarehouses();
      },
      error: (error) => console.error('Error deleting warehouse:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.warehouses().filter(w => w.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} warehouse(s)?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(w =>
      this.warehouseService.deleteWarehouse(String(w.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.selectAll.set(false);
      this.loadWarehouses();
    }).catch(error => {
      console.error('Error bulk deleting warehouses:', error);
      this.loadWarehouses();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.warehouses().map(w => ({ ...w, selected: true }));
    this.warehouses.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.warehouses().map(w => ({ ...w, selected: false }));
    this.warehouses.set(updated);
    this.selectAll.set(false);
  }

  toggleWarehouseSelection(warehouse: Warehouse): void {
    const updated = this.warehouses().map(w =>
      w.id === warehouse.id ? { ...w, selected: !w.selected } : w
    );
    this.warehouses.set(updated);
    this.selectAll.set(updated.every(w => w.selected));
  }

  toggleActive(warehouse: Warehouse, value: boolean): void {
    this.warehouseService.updateWarehouse(String(warehouse.id), { isActive: value }).subscribe({
      next: () => {
        this.warehouses.update(list => list.map(w =>
          w.id === warehouse.id ? { ...w, isActive: value } : w
        ));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error toggling active:', error)
    });
  }
}
