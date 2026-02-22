import { Component, ChangeDetectionStrategy, ChangeDetectorRef, signal, computed, ViewChild, TemplateRef, AfterViewInit, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
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
import { FuelSurcharge } from '@core/models/fuel-surcharge.model';
import { FuelSurchargeService } from '@core/services/http/fuel-surcharge.service';
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';
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
  private deliveryTypeService = inject(DeliveryTypeService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  private searchSubject = new Subject<string>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('dateTemplate') dateTemplate!: TemplateRef<any>;
  @ViewChild('fuelSurchargeTemplate') fuelSurchargeTemplate!: TemplateRef<any>;
  @ViewChild('deliveryTypeTemplate') deliveryTypeTemplate!: TemplateRef<any>;

  // Search state
  searchQuery = signal('');

  // Loading state
  isLoading = signal(false);

  // Sort state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc' | null>(null);

  // Dropdown state
  openDropdownId = signal<number | null>(null);

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

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(30);
  totalItems = signal(0);

  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Data
  fuelSurcharges = signal<FuelSurcharge[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadFuelSurcharges();
    });
  }

  ngOnInit(): void {
    this.loadFuelSurcharges();
  }

  private loadFuelSurcharges(): void {
    this.isLoading.set(true);

    const params: Record<string, string | number | boolean> = {
      page: this.currentPage(),
      itemsPerPage: this.itemsPerPage()
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

    forkJoin({
      surcharges: this.fuelSurchargeService.getFuelSurcharges(params),
      deliveryTypes: this.deliveryTypeService.getDeliveryTypes({ itemsPerPage: 100 })
    }).subscribe({
      next: ({ surcharges, deliveryTypes }) => {
        // Build a map of delivery type IRI → name
        const dtMap = new Map<string, string>();
        for (const dt of deliveryTypes.member || []) {
          dtMap.set(`/api/v1/delivery_types/${dt.id}`, dt.name || `Type ${dt.id}`);
        }

        this.fuelSurcharges.set(surcharges.member.map((fs: FuelSurcharge) => {
          // Resolve IRI string to object with name
          let resolvedDt = fs.deliveryType;
          if (typeof fs.deliveryType === 'string') {
            resolvedDt = { id: 0, name: dtMap.get(fs.deliveryType) || '-' };
          }
          return { ...fs, deliveryType: resolvedDt, selected: false };
        }));
        this.totalItems.set(surcharges.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading fuel surcharges:', error);
        this.fuelSurcharges.set([]);
        this.totalItems.set(0);
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
      { key: 'date', label: 'Date', sortable: true, template: this.dateTemplate },
      { key: 'fuelSurcharge', label: 'Surcharge', sortable: true, template: this.fuelSurchargeTemplate },
      { key: 'deliveryType', label: 'Delivery type', sortable: false, template: this.deliveryTypeTemplate },
      { key: 'actions', label: '', sortable: false, width: '64px', template: this.actionsTemplate }
    ];
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onSortChange(event: SortEvent): void {
    this.sortColumn.set(event.column);
    this.sortDirection.set(event.direction);
    this.currentPage.set(1);
    this.loadFuelSurcharges();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadFuelSurcharges();
  }

  onAddFuelSurcharge(): void {
    this.router.navigate(['/admin/fuel-surcharges/new']);
  }

  toggleDropdown(fuelSurchargeId: number): void {
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
        this.loadFuelSurcharges();
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
      this.selectAll.set(false);
      this.loadFuelSurcharges();
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
