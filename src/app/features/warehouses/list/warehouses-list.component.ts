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
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { Warehouse } from '@core/models/warehouse.model';
import { WarehouseService } from '@core/services/http/warehouse.service';
import { AlertService } from '@services/alert.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

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
    MobileFooterComponent
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

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('activeTemplate') activeTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(true);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.warehouses().filter(w => w.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(17);

  // Data
  warehouses = signal<Warehouse[]>([]);

  // Filtered and sorted warehouses
  filteredWarehouses = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.warehouses();

    if (query) {
      result = result.filter(w =>
        w.name.toLowerCase().includes(query)
      );
    }

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

  // Total count
  totalItems = computed(() => this.filteredWarehouses().length);

  ngOnInit(): void {
    this.loadWarehouses();
  }

  private loadWarehouses(): void {
    this.isLoading.set(true);

    this.warehouseService.getWarehouses(1, 100).subscribe({
      next: (response) => {
        const items = (response.member || []).map(w => ({ ...w, selected: false }));
        this.warehouses.set(items);
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
    this.columns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'name', label: 'Name', sortable: false },
      { key: 'isActive', label: 'Active', sortable: false, width: '192px', template: this.activeTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    console.log('Searching:', this.searchQuery);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  onAddWarehouse(): void {
    this.router.navigate(['/admin/warehouses/new']);
  }

  toggleDropdown(warehouseId: string, event: Event | void): void {
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
        this.warehouses.update(list => list.filter(w => w.id !== warehouse.id));
        this.cdr.markForCheck();
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
      this.warehouses.update(list => list.filter(w => !w.selected));
      this.selectAll.set(false);
      this.cdr.markForCheck();
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
