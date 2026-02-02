import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, ChangeDetectorRef, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormFieldComponent } from '@app/ui-kit/molecules/form-field/form-field.component';
import { DataTableComponent, TableColumn } from '@app/ui-kit/organisms/data-table/data-table.component';
import { ModalComponent } from '@app/ui-kit/organisms/modal/modal.component';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DetailHeaderComponent } from '@app/ui-kit/molecules/detail-header/detail-header.component';
import { MobileFooterComponent } from '@app/ui-kit/molecules/mobile-footer/mobile-footer.component';
import { ToggleComponent } from '@app/ui-kit/atoms/toggle/toggle.component';
import { IconComponent } from '@app/ui-kit/atoms/icon/icon.component';
import { TabsComponent, TabItem } from '@app/ui-kit/molecules/tabs/tabs.component';
import { TableCheckboxSelectionComponent } from '@app/ui-kit/molecules/table-checkbox-selection/table-checkbox-selection.component';
import { TableActionsDropdownComponent, TableAction, ActionClickEvent } from '@app/ui-kit/molecules/table-actions-dropdown/table-actions-dropdown.component';
import { TextEditorComponent } from '@shared/components/text-editor/text-editor.component';
import { DeliveryType, DeliveryTypeDocument } from '@core/models/delivery-type.model';
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';

interface DeliveryTypeDetail {
  id: string;
  name: string;
  active: boolean;
  readyForShop: boolean;
  express: boolean;
  enableFreeDelivery: boolean;
  grossFactor: number;
  order: number;
  shortDescription: string;
  documents: DeliveryTypeDocument[];
}

const EMPTY_DELIVERY_TYPE: DeliveryTypeDetail = {
  id: '',
  name: '',
  active: false,
  readyForShop: false,
  express: false,
  enableFreeDelivery: false,
  grossFactor: 1.0,
  order: 0,
  shortDescription: '',
  documents: []
};

@Component({
  selector: 'app-delivery-types-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FormFieldComponent,
    DataTableComponent,
    ModalComponent,
    BreadcrumbsComponent,
    DetailHeaderComponent,
    MobileFooterComponent,
    ToggleComponent,
    IconComponent,
    TabsComponent,
    TableCheckboxSelectionComponent,
    TableActionsDropdownComponent,
    TextEditorComponent
  ],
  templateUrl: './delivery-types-edit.component.html',
  styleUrls: ['./delivery-types-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeliveryTypesEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Mode
  isEditMode = signal(false);
  deliveryTypeId: string | null = null;

  // Data
  deliveryType = signal<DeliveryTypeDetail>({ ...EMPTY_DELIVERY_TYPE });

  // Loading state
  isLoading = signal(false);

  // Active tab
  activeTab = signal<'description' | 'documents'>('description');

  // Documents table columns
  documentColumns: TableColumn[] = [];

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Document action dropdown state
  activeDocActionId = signal<string | null>(null);

  // Rename modal state
  isRenameModalOpen = signal(false);
  renameValue = signal('');
  renameDocumentId = signal<string | null>(null);

  // Selection state
  selectAll = signal(false);

  // Tabs configuration
  tabs: TabItem[] = [
    { id: 'description', label: 'Short description' },
    { id: 'documents', label: 'Delivery type documents' }
  ];

  // Document actions
  documentActions: TableAction[] = [
    { id: 'rename', label: 'Rename', icon: 'pencil' },
    { id: 'download', label: 'Download', icon: 'download' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private deliveryTypeService: DeliveryTypeService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.deliveryTypeId = params['id'];
        this.loadDeliveryType(this.deliveryTypeId!);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initDocumentColumns();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initDocumentColumns(): void {
    this.documentColumns = [
      { key: 'checkbox', label: '', sortable: false, width: '56px', template: this.checkboxTemplate, headerTemplate: this.checkboxHeaderTemplate },
      { key: 'fileType', label: 'File type', sortable: false, width: '112px' },
      { key: 'name', label: 'Name', sortable: false },
      { key: 'size', label: 'Size', sortable: false, width: '149px' },
      { key: 'actions', label: '', sortable: false, width: '72px', template: this.actionsTemplate }
    ];
  }

  private loadDeliveryType(id: string): void {
    this.isLoading.set(true);

    this.deliveryTypeService.getDeliveryTypeById(id).subscribe({
      next: (deliveryType) => {
        this.deliveryType.set({
          id: deliveryType.id || id,
          name: deliveryType.name || '',
          active: deliveryType.active || false,
          readyForShop: deliveryType.readyForShop || false,
          express: deliveryType.express || false,
          enableFreeDelivery: deliveryType.enableFreeDelivery || false,
          grossFactor: deliveryType.grossFactor || 1.0,
          order: deliveryType.order || 0,
          shortDescription: deliveryType.shortDescription || '',
          documents: (deliveryType.documents || []).map(d => ({ ...d, selected: false }))
        });
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading delivery type:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/delivery-types/list']);
  }

  onSave(): void {
    const data = this.deliveryType();
    const operation = this.isEditMode()
      ? this.deliveryTypeService.updateDeliveryType(this.deliveryTypeId!, data)
      : this.deliveryTypeService.createDeliveryType(data);

    operation.subscribe({
      next: () => this.router.navigate(['/admin/delivery-types/list']),
      error: (error) => console.error('Error saving delivery type:', error)
    });
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.deliveryType());
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId as 'description' | 'documents');
  }

  // Toggle handlers
  toggleActive(): void {
    this.deliveryType.update(d => ({ ...d, active: !d.active }));
  }

  toggleReadyForShop(): void {
    this.deliveryType.update(d => ({ ...d, readyForShop: !d.readyForShop }));
  }

  toggleExpress(): void {
    this.deliveryType.update(d => ({ ...d, express: !d.express }));
  }

  toggleEnableFreeDelivery(): void {
    this.deliveryType.update(d => ({ ...d, enableFreeDelivery: !d.enableFreeDelivery }));
  }

  // Input handlers
  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryType.update(d => ({ ...d, name: input.value }));
  }

  onGrossFactorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.deliveryType.update(d => ({ ...d, grossFactor: value }));
  }

  onOrderChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10) || 0;
    this.deliveryType.update(d => ({ ...d, order: value }));
  }

  onShortDescriptionChange(content: string): void {
    this.deliveryType.update(d => ({ ...d, shortDescription: content }));
  }

  formatNumber(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }

  // Document handlers
  onAddDocument(): void {
    console.log('Add document');
  }

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
  }

  onSelectAllDocuments(): void {
    const updated = this.deliveryType().documents.map(d => ({ ...d, selected: true }));
    this.deliveryType.update(dt => ({ ...dt, documents: updated }));
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNoneDocuments(): void {
    const updated = this.deliveryType().documents.map(d => ({ ...d, selected: false }));
    this.deliveryType.update(dt => ({ ...dt, documents: updated }));
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleDocumentSelection(doc: DeliveryTypeDocument): void {
    const updated = this.deliveryType().documents.map(d =>
      d.id === doc.id ? { ...d, selected: !d.selected } : d
    );
    this.deliveryType.update(dt => ({ ...dt, documents: updated }));
  }

  toggleDocumentActions(docId: string): void {
    if (this.activeDocActionId() === docId) {
      this.activeDocActionId.set(null);
    } else {
      this.activeDocActionId.set(docId);
    }
  }

  closeDocActionsDropdown(): void {
    this.activeDocActionId.set(null);
  }

  onDocumentActionClick(event: ActionClickEvent): void {
    const doc = event.row as DeliveryTypeDocument;
    switch (event.action.id) {
      case 'rename':
        this.renameDocument(doc.id);
        break;
      case 'download':
        this.downloadDocument(doc.id);
        break;
      case 'delete':
        this.deleteDocument(doc.id);
        break;
    }
  }

  renameDocument(docId: string): void {
    const doc = this.deliveryType().documents.find(d => d.id === docId);
    if (doc) {
      this.renameDocumentId.set(docId);
      this.renameValue.set(doc.name);
      this.isRenameModalOpen.set(true);
    }
    this.activeDocActionId.set(null);
  }

  downloadDocument(docId: string): void {
    const doc = this.deliveryType().documents.find(d => d.id === docId);
    console.log('Download document:', doc);
    this.activeDocActionId.set(null);
  }

  deleteDocument(docId: string): void {
    const updated = this.deliveryType().documents.filter(d => d.id !== docId);
    this.deliveryType.update(dt => ({ ...dt, documents: updated }));
    this.activeDocActionId.set(null);
  }

  onRenameInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.renameValue.set(input.value);
  }

  confirmRename(): void {
    const docId = this.renameDocumentId();
    if (docId) {
      const updated = this.deliveryType().documents.map(d =>
        d.id === docId ? { ...d, name: this.renameValue() } : d
      );
      this.deliveryType.update(dt => ({ ...dt, documents: updated }));
    }
    this.cancelRename();
  }

  cancelRename(): void {
    this.isRenameModalOpen.set(false);
    this.renameDocumentId.set(null);
    this.renameValue.set('');
  }

  closeDropdowns(): void {
    this.isHeaderDropdownOpen.set(false);
    this.activeDocActionId.set(null);
  }
}

