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
import { PaymentType } from '@core/models/payment-type.model';
import { PaymentTypeService } from '@core/services/http/payment-type.service';
import { AlertService } from '@services/alert.service';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';

@Component({
  selector: 'app-payment-types-list',
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
  templateUrl: './payment-types-list.component.html',
  styleUrls: ['./payment-types-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentTypesListComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private paymentTypeService = inject(PaymentTypeService);
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
  openDropdownId = signal<number | null>(null);

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Selection state
  selectAll = signal(false);

  selectedCount = computed(() => this.paymentTypes().filter(p => p.selected).length);
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
  paymentTypes = signal<PaymentType[]>([]);

  // Filtered and sorted payment types
  filteredPaymentTypes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    let result = this.paymentTypes();

    if (query) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        String(p.id).includes(query)
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
  totalItems = computed(() => this.filteredPaymentTypes().length);

  ngOnInit(): void {
    this.loadPaymentTypes();
  }

  private loadPaymentTypes(): void {
    this.isLoading.set(true);

    this.paymentTypeService.getPaymentTypes(1, 100).subscribe({
      next: (response) => {
        const items = (response.member || []).map(p => ({ ...p, selected: false, documents: p.documents || [] }));
        this.paymentTypes.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load payment types:', error);
        this.paymentTypes.set([]);
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
      { key: 'id', label: 'ID', sortable: false, width: '112px' },
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

  onAddPaymentType(): void {
    this.router.navigate(['/admin/payment-types/new']);
  }

  toggleDropdown(paymentTypeId: number): void {
    if (this.openDropdownId() === paymentTypeId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(paymentTypeId);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.isHeaderDropdownOpen.set(false);
  }

  onActionClick(event: { action: TableAction; row: unknown }): void {
    const paymentType = event.row as PaymentType;
    switch (event.action.id) {
      case 'edit':
        this.onEdit(paymentType);
        break;
      case 'delete':
        this.onDelete(paymentType);
        break;
    }
  }

  onEdit(paymentType: PaymentType): void {
    this.router.navigate(['/admin/payment-types', paymentType.id, 'edit']);
    this.closeDropdown();
  }

  async onDelete(paymentType: PaymentType): Promise<void> {
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete "${paymentType.name}"?`, 'Delete');
    if (!confirmed) {
      this.closeDropdown();
      return;
    }
    this.paymentTypeService.deletePaymentType(String(paymentType.id)).subscribe({
      next: () => {
        this.paymentTypes.update(list => list.filter(p => p.id !== paymentType.id));
        this.cdr.markForCheck();
      },
      error: (error) => console.error('Error deleting payment type:', error)
    });
    this.closeDropdown();
  }

  async onBulkDelete(): Promise<void> {
    const selected = this.paymentTypes().filter(p => p.selected);
    if (selected.length === 0) return;
    const confirmed = await this.alertService.confirm(`Are you sure you want to delete ${selected.length} payment type(s)?`, 'Delete');
    if (!confirmed) return;

    const deleteOps = selected.map(p =>
      this.paymentTypeService.deletePaymentType(String(p.id)).toPromise()
    );
    Promise.all(deleteOps).then(() => {
      this.paymentTypes.update(list => list.filter(p => !p.selected));
      this.selectAll.set(false);
      this.cdr.markForCheck();
    }).catch(error => {
      console.error('Error bulk deleting payment types:', error);
      this.loadPaymentTypes();
    });
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
    if (isOpen) {
      this.openDropdownId.set(null);
    }
  }

  onSelectAll(): void {
    const updated = this.paymentTypes().map(p => ({ ...p, selected: true }));
    this.paymentTypes.set(updated);
    this.selectAll.set(true);
  }

  onSelectNone(): void {
    const updated = this.paymentTypes().map(p => ({ ...p, selected: false }));
    this.paymentTypes.set(updated);
    this.selectAll.set(false);
  }

  togglePaymentTypeSelection(paymentType: PaymentType): void {
    const updated = this.paymentTypes().map(p =>
      p.id === paymentType.id ? { ...p, selected: !p.selected } : p
    );
    this.paymentTypes.set(updated);
    this.selectAll.set(updated.every(p => p.selected));
  }

  toggleActive(paymentType: PaymentType, value: boolean): void {
    this.paymentTypeService.updatePaymentType(String(paymentType.id), { isActive: value }).subscribe({
      next: () => {
        this.paymentTypes.update(list => list.map(p =>
          p.id === paymentType.id ? { ...p, isActive: value } : p
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
