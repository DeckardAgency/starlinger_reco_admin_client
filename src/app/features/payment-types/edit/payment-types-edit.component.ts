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
import { PaymentType, PaymentTypeDocument } from '@core/models/payment-type.model';
import { PaymentTypeService } from '@core/services/http/payment-type.service';

interface PaymentTypeDetail {
  id: string;
  name: string;
  active: boolean;
  readyForShop: boolean;
  enableInstallments: boolean;
  configuration: string | null;
  providerCode: string | null;
  shortDescription: string;
  useAsDefaultBase: boolean;
  remoteCode: string | null;
  paymentFee: number;
  minCartTotalBase: number;
  maxCartTotalBase: number;
  documents: PaymentTypeDocument[];
}

const EMPTY_PAYMENT_TYPE: PaymentTypeDetail = {
  id: '',
  name: '',
  active: false,
  readyForShop: false,
  enableInstallments: false,
  configuration: null,
  providerCode: null,
  shortDescription: '',
  useAsDefaultBase: false,
  remoteCode: null,
  paymentFee: 0,
  minCartTotalBase: 0,
  maxCartTotalBase: 0,
  documents: []
};

@Component({
  selector: 'app-payment-types-edit',
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
  templateUrl: './payment-types-edit.component.html',
  styleUrls: ['./payment-types-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentTypesEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Mode
  isEditMode = signal(false);
  paymentTypeId: string | null = null;

  // Data
  paymentType = signal<PaymentTypeDetail>({ ...EMPTY_PAYMENT_TYPE });

  // Loading state
  isLoading = signal(false);

  // Active tab
  activeTab = signal<'description' | 'details' | 'documents'>('description');

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
    { id: 'details', label: 'Details' },
    { id: 'documents', label: 'Payment type documents' }
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
    private paymentTypeService: PaymentTypeService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.paymentTypeId = params['id'];
        this.loadPaymentType(this.paymentTypeId!);
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

  private loadPaymentType(id: string): void {
    this.isLoading.set(true);

    this.paymentTypeService.getPaymentTypeById(id).subscribe({
      next: (paymentType) => {
        this.paymentType.set({
          id: paymentType.id || id,
          name: paymentType.name || '',
          active: paymentType.active || false,
          readyForShop: paymentType.readyForShop || false,
          enableInstallments: paymentType.enableInstallments || false,
          configuration: paymentType.configuration || null,
          providerCode: paymentType.providerCode || null,
          shortDescription: paymentType.shortDescription || '',
          useAsDefaultBase: paymentType.useAsDefaultBase || false,
          remoteCode: paymentType.remoteCode || null,
          paymentFee: paymentType.paymentFee || 0,
          minCartTotalBase: paymentType.minCartTotalBase || 0,
          maxCartTotalBase: paymentType.maxCartTotalBase || 0,
          documents: (paymentType.documents || []).map(d => ({ ...d, selected: false }))
        });
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading payment type:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/payment-types/list']);
  }

  onSave(): void {
    const data = this.paymentType();
    const operation = this.isEditMode()
      ? this.paymentTypeService.updatePaymentType(this.paymentTypeId!, data)
      : this.paymentTypeService.createPaymentType(data);

    operation.subscribe({
      next: () => this.router.navigate(['/admin/payment-types/list']),
      error: (error) => console.error('Error saving payment type:', error)
    });
  }

  onSaveAndContinue(): void {
    console.log('Save and continue:', this.paymentType());
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId as 'description' | 'details' | 'documents');
  }

  // Toggle handlers
  toggleActive(): void {
    this.paymentType.update(p => ({ ...p, active: !p.active }));
  }

  toggleReadyForShop(): void {
    this.paymentType.update(p => ({ ...p, readyForShop: !p.readyForShop }));
  }

  toggleEnableInstallments(): void {
    this.paymentType.update(p => ({ ...p, enableInstallments: !p.enableInstallments }));
  }

  toggleUseAsDefaultBase(): void {
    this.paymentType.update(p => ({ ...p, useAsDefaultBase: !p.useAsDefaultBase }));
  }

  // Input handlers
  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentType.update(p => ({ ...p, name: input.value }));
  }

  onConfigurationChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentType.update(p => ({ ...p, configuration: input.value || null }));
  }

  onProviderCodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentType.update(p => ({ ...p, providerCode: input.value || null }));
  }

  onRemoteCodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentType.update(p => ({ ...p, remoteCode: input.value || null }));
  }

  onPaymentFeeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.paymentType.update(p => ({ ...p, paymentFee: value }));
  }

  onMinCartTotalBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.paymentType.update(p => ({ ...p, minCartTotalBase: value }));
  }

  onMaxCartTotalBaseChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.paymentType.update(p => ({ ...p, maxCartTotalBase: value }));
  }

  onShortDescriptionChange(content: string): void {
    this.paymentType.update(p => ({ ...p, shortDescription: content }));
  }

  formatNumber(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }

  // Document handlers
  onAddDocument(): void {
    console.log('Add document');
  }

  toggleHeaderDropdown(event: Event): void {
    event.stopPropagation();
    this.isHeaderDropdownOpen.set(!this.isHeaderDropdownOpen());
  }

  onSelectAllDocuments(): void {
    const updated = this.paymentType().documents.map(d => ({ ...d, selected: true }));
    this.paymentType.update(p => ({ ...p, documents: updated }));
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNoneDocuments(): void {
    const updated = this.paymentType().documents.map(d => ({ ...d, selected: false }));
    this.paymentType.update(p => ({ ...p, documents: updated }));
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleDocumentSelection(doc: PaymentTypeDocument): void {
    const updated = this.paymentType().documents.map(d =>
      d.id === doc.id ? { ...d, selected: !d.selected } : d
    );
    this.paymentType.update(p => ({ ...p, documents: updated }));
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
    const doc = event.row as PaymentTypeDocument;
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

  onHeaderDropdownToggle(isOpen: boolean): void {
    this.isHeaderDropdownOpen.set(isOpen);
  }

  renameDocument(docId: string): void {
    const doc = this.paymentType().documents.find(d => d.id === docId);
    if (doc) {
      this.renameDocumentId.set(docId);
      this.renameValue.set(doc.name);
      this.isRenameModalOpen.set(true);
    }
    this.activeDocActionId.set(null);
  }

  downloadDocument(docId: string): void {
    const doc = this.paymentType().documents.find(d => d.id === docId);
    console.log('Download document:', doc);
    this.activeDocActionId.set(null);
  }

  deleteDocument(docId: string): void {
    const updated = this.paymentType().documents.filter(d => d.id !== docId);
    this.paymentType.update(p => ({ ...p, documents: updated }));
    this.activeDocActionId.set(null);
  }

  onRenameInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.renameValue.set(input.value);
  }

  confirmRename(): void {
    const docId = this.renameDocumentId();
    if (docId) {
      const updated = this.paymentType().documents.map(d =>
        d.id === docId ? { ...d, name: this.renameValue() } : d
      );
      this.paymentType.update(p => ({ ...p, documents: updated }));
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

