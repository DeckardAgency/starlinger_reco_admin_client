import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject, OnInit } from '@angular/core';
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
import { FuelSurcharge } from '@core/models/fuel-surcharge.model';
import { FuelSurchargeService } from '@core/services/http/fuel-surcharge.service';
import { AlertService } from '@services/alert.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

@Component({
  selector: 'app-fuel-surcharges-list',
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
  templateUrl: './fuel-surcharges-list.component.html',
  styleUrls: ['./fuel-surcharges-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FuelSurchargesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private fuelSurchargeService = inject(FuelSurchargeService);
  private alertService = inject(AlertService);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('sizeFromTemplate') sizeFromTemplate!: TemplateRef<any>;
  @ViewChild('sizeToTemplate') sizeToTemplate!: TemplateRef<any>;
  @ViewChild('priceBaseTemplate') priceBaseTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(false);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<string | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.fuelSurcharges().filter(fs => fs.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data
  fuelSurcharges = signal<FuelSurcharge[]>([]);

  // Filtered and sorted fuel surcharges
  filteredFuelSurcharges = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.fuelSurcharges();

    if (query) {
      result = result.filter(fs =>
        (fs.name || '').toLowerCase().includes(query) ||
        String(fs.id).includes(query)
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
  totalItems = computed(() => this.filteredFuelSurcharges().length);

  ngOnInit(): void {
    this.loadFuelSurcharges();
  }

  private loadFuelSurcharges(): void {
    this.isLoading.set(true);
    this.fuelSurchargeService.getFuelSurcharges().subscribe({
      next: (response) => {
        this.fuelSurcharges.set(response.member.map((fs: FuelSurcharge) => ({ ...fs, selected: false })));
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading fuel surcharges:', error);
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
      { key: 'name', label: 'Name', sortable: true },
      { key: 'sizeFrom', label: 'Size from', sortable: true, template: this.sizeFromTemplate },
      { key: 'sizeTo', label: 'Size to', sortable: true, template: this.sizeToTemplate },
      { key: 'priceBase', label: 'Price base', sortable: true, template: this.priceBaseTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
  }

  onAddFuelSurcharge(): void {
    this.router.navigate(['/admin/fuel-surcharges/new']);
  }

  toggleDropdown(fuelSurchargeId: string): void {
    if (this.openDropdownId() === fuelSurchargeId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(fuelSurchargeId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const fuelSurcharge = event.row as FuelSurcharge;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(fuelSurcharge);
        break;
      case 'delete':
        this.onDelete(fuelSurcharge);
        break;
    }
  }

  onEdit(fuelSurcharge: FuelSurcharge): void {
    this.router.navigate(['/admin/fuel-surcharges', fuelSurcharge.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(fuelSurcharge: FuelSurcharge): Promise<void> {
    const confirmed = await this.alertService.confirm('Are you sure you want to delete this fuel surcharge?', 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.fuelSurchargeService.deleteFuelSurcharge(String(fuelSurcharge.id)).subscribe({
      next: () => {
        this.fuelSurcharges.update(list => list.filter(fs => fs.id !== fuelSurcharge.id));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error deleting fuel surcharge:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.fuelSurcharges().filter(fs => fs.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} fuel surcharge(s)?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(fs =>
      this.fuelSurchargeService.deleteFuelSurcharge(String(fs.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.fuelSurcharges.update(list => list.filter(fs => !fs.selected));
      this.selectAll.set(false);
      this.cdr.markForCheck();
    }).catch(error => {
      console.error('Error bulk deleting fuel surcharges:', error);
      this.loadFuelSurcharges();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.fuelSurcharges().map(fs => ({ ...fs, selected: true }));
    this.fuelSurcharges.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.fuelSurcharges().map(fs => ({ ...fs, selected: false }));
    this.fuelSurcharges.set(updated);
    this.selectAll.set(false);
  }

  toggleFuelSurchargeSelection(fuelSurcharge: FuelSurcharge): void {
    const updated = this.fuelSurcharges().map(fs =>
      fs.id === fuelSurcharge.id ? { ...fs, selected: !fs.selected } : fs
    );
    this.fuelSurcharges.set(updated);
    this.selectAll.set(updated.every(fs => fs.selected));
  }

  formatDecimal(value: string | number | undefined | null): string {
    if (value == null || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toFixed(4).replace('.', ',');
  }
}
