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
import { DeliveryType } from '@core/models/delivery-type.model';
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';
import { AlertService } from '@services/alert.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

@Component({
  selector: 'app-delivery-types-list',
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
  templateUrl: './delivery-types-list.component.html',
  styleUrls: ['./delivery-types-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryTypesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private deliveryTypeService = inject(DeliveryTypeService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

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

  selectedCount = computed(() => this.deliveryTypes().filter(d => d.selected).length);
  hasSelected = computed(() => this.selectedCount() > 0);

  // Pagination display
  showingFrom = computed(() => this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1);
  showingTo = computed(() => Math.min(this.currentPage() * this.itemsPerPage(), this.totalItems()));

  // Table columns
  columns: TableColumn[] = [];

  // Table actions for dropdown
  tableActions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  // Data
  deliveryTypes = signal<DeliveryType[]>([]);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadDeliveryTypes();
    });
  }

  ngOnInit(): void {
    this.loadDeliveryTypes();
  }

  private loadDeliveryTypes(): void {
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

    this.deliveryTypeService.getDeliveryTypes(params).subscribe({
      next: (response) => {
        const items = (response.member || []).map(d => ({ ...d, selected: false }));
        this.deliveryTypes.set(items);
        this.totalItems.set(response.totalItems || 0);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load delivery types:', error);
        this.deliveryTypes.set([]);
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
      { key: 'isActive', label: 'Active', sortable: true, width: '192px', template: this.activeTemplate },
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
    this.loadDeliveryTypes();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadDeliveryTypes();
  }

  onAddDeliveryType(): void {
    this.router.navigate(['/admin/delivery-types/new']);
  }

  toggleDropdown(deliveryTypeId: number, event: Event | void): void {
    if (event) {
      (event as Event).stopPropagation();
    }
    if (this.openDropdownId() === deliveryTypeId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(deliveryTypeId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const deliveryType = event.row as DeliveryType;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(deliveryType);
        break;
      case 'delete':
        this.onDelete(deliveryType);
        break;
    }
  }

  onEdit(deliveryType: DeliveryType): void {
    this.router.navigate(['/admin/delivery-types', deliveryType.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(deliveryType: DeliveryType): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${deliveryType.name}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.deliveryTypeService.deleteDeliveryType(String(deliveryType.id)).subscribe({
      next: () => {
        this.loadDeliveryTypes();
      },
      error: (error) => console.error('Error deleting delivery type:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.deliveryTypes().filter(d => d.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} delivery type(s)?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(d =>
      this.deliveryTypeService.deleteDeliveryType(String(d.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.selectAll.set(false);
      this.loadDeliveryTypes();
    }).catch(error => {
      console.error('Error bulk deleting delivery types:', error);
      this.loadDeliveryTypes();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.deliveryTypes().map(d => ({ ...d, selected: true }));
    this.deliveryTypes.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.deliveryTypes().map(d => ({ ...d, selected: false }));
    this.deliveryTypes.set(updated);
    this.selectAll.set(false);
  }

  toggleDeliveryTypeSelection(deliveryType: DeliveryType): void {
    const updated = this.deliveryTypes().map(d =>
      d.id === deliveryType.id ? { ...d, selected: !d.selected } : d
    );
    this.deliveryTypes.set(updated);
    this.selectAll.set(updated.every(d => d.selected));
  }

  toggleActive(deliveryType: DeliveryType, value: boolean): void {
    this.deliveryTypeService.updateDeliveryType(String(deliveryType.id), { isActive: value }).subscribe({
      next: () => {
        this.deliveryTypes.update(list => list.map(d =>
          d.id === deliveryType.id ? { ...d, isActive: value } : d
        ));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error toggling active:', error)
    });
  }
}
