import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ChangeDetectorRef, ViewChild, TemplateRef, AfterViewInit, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

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
import { MediaService } from '@core/services/http/media.service';
import { LoggerService } from '@core/services/logger.service';
import { MediaItem } from '@core/models/media.model';
import { environment } from '@env/environment';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';

interface PaymentTypeDetail {
  id: number;
  name: string;
  isActive: boolean;
  enableInstallments: boolean;
  shortDescription: string;
  useAsDefault: boolean;
  remoteCode: string | null;
  paymentFee: number;
  minCartTotal: number;
  maxCartTotal: number;
  sortOrder: number;
  documents: PaymentTypeDocument[];
}

const EMPTY_PAYMENT_TYPE: PaymentTypeDetail = {
  id: 0,
  name: '',
  isActive: false,
  enableInstallments: false,
  shortDescription: '',
  useAsDefault: false,
  remoteCode: null,
  paymentFee: 0,
  minCartTotal: 0,
  maxCartTotal: 0,
  sortOrder: 0,
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
  private toastService = inject(ToastService);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('documentFileInput') documentFileInput?: ElementRef<HTMLInputElement>;

  // Mode
  isEditMode = signal(false);
  paymentTypeId: string | null = null;

  // Data
  paymentType = signal<PaymentTypeDetail>({ ...EMPTY_PAYMENT_TYPE });

  // Loading state
  isLoading = signal(false);
  isSaving = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const paymentType = this.paymentType();
    const errs: Record<string, string> = {};
    if (!paymentType.name?.trim()) errs['name'] = 'Name is required';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

  // Active tab
  activeTab = signal<'description' | 'details' | 'documents'>('description');

  // Documents table columns
  documentColumns: TableColumn[] = [];

  // Header dropdown state
  isHeaderDropdownOpen = signal(false);

  // Document action dropdown state
  activeDocActionId = signal<number | null>(null);

  // Rename modal state
  isRenameModalOpen = signal(false);
  renameValue = signal('');
  renameExtension = signal('');
  renameDocumentId = signal<number | null>(null);

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
    private paymentTypeService: PaymentTypeService,
    private mediaService: MediaService,
    private logger: LoggerService
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
          id: paymentType.id || Number(id),
          name: paymentType.name || '',
          isActive: paymentType.isActive ?? false,
          enableInstallments: paymentType.enableInstallments || false,
          shortDescription: paymentType.shortDescription || '',
          useAsDefault: paymentType.useAsDefault || false,
          remoteCode: paymentType.remoteCode || null,
          paymentFee: paymentType.paymentFee ? parseFloat(paymentType.paymentFee) : 0,
          minCartTotal: paymentType.minCartTotal ? parseFloat(paymentType.minCartTotal) : 0,
          maxCartTotal: paymentType.maxCartTotal ? parseFloat(paymentType.maxCartTotal) : 0,
          sortOrder: paymentType.sortOrder || 0,
          documents: ((paymentType as any).documents || []).map((m: any) => ({
            id: typeof m === 'string' ? m.split('/').pop() : m.id,
            fileType: this.getFileType(typeof m === 'object' ? m.mimeType : '', typeof m === 'object' ? m.filename : ''),
            name: typeof m === 'object' ? (m.filename || 'unknown') : 'unknown',
            size: typeof m === 'object' && m.fileSize ? this.formatFileSize(m.fileSize) : '-'
          }))
        });
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.logger.error('Error loading payment type:', error);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private getFileType(mimeType: string, filename: string): string {
    if (mimeType) {
      if (mimeType.includes('pdf')) return 'PDF';
      if (mimeType.includes('png')) return 'PNG';
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPG';
      if (mimeType.includes('webp')) return 'WEBP';
      if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'XLS';
      if (mimeType.includes('word')) return 'DOC';
      if (mimeType.includes('csv')) return 'CSV';
      if (mimeType.includes('text')) return 'TXT';
    }
    const ext = filename?.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  }

  onBack(): void {
    this.router.navigate(['/admin/payment-types/list']);
  }

  // Validation helpers
  markAllTouched(): void {
    this.touched.set({ name: true });
  }

  markFieldTouched(field: string): void {
    this.touched.update(t => ({ ...t, [field]: true }));
  }

  getError(field: string): string {
    return this.touched()[field] ? (this.errors()[field] || '') : '';
  }

  onSave(): void {
    this.savePaymentType(false);
  }

  onSaveAndContinue(): void {
    this.savePaymentType(true);
  }

  private savePaymentType(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    if (this.isSaving()) return;

    const detail = this.paymentType();
    // Build payload with only writable fields
    const mediaIriPrefix = `${environment.apiPath}/media_items/`;
    const data: Record<string, unknown> = {
      name: detail.name,
      isActive: detail.isActive,
      enableInstallments: detail.enableInstallments,
      shortDescription: detail.shortDescription,
      useAsDefault: detail.useAsDefault,
      remoteCode: detail.remoteCode,
      paymentFee: String(detail.paymentFee),
      minCartTotal: String(detail.minCartTotal),
      maxCartTotal: String(detail.maxCartTotal),
      sortOrder: detail.sortOrder,
      documents: detail.documents.map(d => mediaIriPrefix + d.id)
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.paymentTypeService.createPaymentType(data as any)
      : this.paymentTypeService.updatePaymentType(this.paymentTypeId!, data as any);

    this.isSaving.set(true);
    operation.pipe(finalize(() => { this.isSaving.set(false); this.cdr.markForCheck(); })).subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/payment-types/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/payment-types', result.id, 'edit']);
        }
      },
      error: (error) => {
        this.logger.error('Error saving payment type:', error);
        this.toastService.error('Failed to save payment type');
      }
    });
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId as 'description' | 'details' | 'documents');
  }

  // Toggle handlers
  toggleActive(): void {
    this.paymentType.update(p => ({ ...p, isActive: !p.isActive }));
  }

  toggleEnableInstallments(): void {
    this.paymentType.update(p => ({ ...p, enableInstallments: !p.enableInstallments }));
  }

  toggleUseAsDefault(): void {
    this.paymentType.update(p => ({ ...p, useAsDefault: !p.useAsDefault }));
  }

  // Input handlers
  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentType.update(p => ({ ...p, name: input.value }));
    this.markFieldTouched('name');
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

  onMinCartTotalChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.paymentType.update(p => ({ ...p, minCartTotal: value }));
  }

  onMaxCartTotalChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.paymentType.update(p => ({ ...p, maxCartTotal: value }));
  }

  onShortDescriptionChange(content: string): void {
    this.paymentType.update(p => ({ ...p, shortDescription: content }));
  }

  formatNumber(value: number): string {
    return value.toFixed(2).replace('.', ',');
  }

  // Document handlers
  onAddDocument(): void {
    this.documentFileInput?.nativeElement?.click();
  }

  onDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    let uploaded = 0;

    files.forEach(file => {
      this.mediaService.uploadFile(file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (httpEvent) => {
            if (httpEvent.type === HttpEventType.Response && httpEvent.body) {
              const media = httpEvent.body;
              this.paymentType.update(p => ({
                ...p,
                documents: [...p.documents, {
                  id: media.id,
                  fileType: this.getFileType(media.mimeType || '', media.filename || file.name),
                  name: media.filename || file.name,
                  size: this.formatFileSize(file.size)
                }]
              }));
              uploaded++;
              if (uploaded === files.length) {
                this.updatePaymentTypeMedia();
              }
              this.cdr.markForCheck();
            }
          },
          error: (err) => this.logger.error('Error uploading document:', err)
        });
    });

    input.value = '';
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

  toggleDocumentActions(docId: number): void {
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

  renameDocument(docId: number): void {
    const doc = this.paymentType().documents.find(d => d.id === docId);
    if (doc) {
      const { name, ext } = this.splitFilename(doc.name);
      this.renameDocumentId.set(docId);
      this.renameValue.set(name);
      this.renameExtension.set(ext);
      this.isRenameModalOpen.set(true);
    }
    this.activeDocActionId.set(null);
  }

  downloadDocument(docId: number): void {
    this.mediaService.getMediaItem(String(docId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (media) => {
          if (media.filePath) {
            this.triggerDownload(media.filePath, media.filename || 'document');
          }
        },
        error: (err) => this.logger.error('Error downloading document:', err)
      });
    this.activeDocActionId.set(null);
  }

  private triggerDownload(url: string, filename: string): void {
    this.mediaService.downloadFile(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        },
        error: (err) => this.logger.error('Error downloading file:', err)
      });
  }

  deleteDocument(docId: number): void {
    this.mediaService.deleteMediaItem(String(docId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.paymentType.update(p => ({
            ...p,
            documents: p.documents.filter(d => d.id !== docId)
          }));
          this.updatePaymentTypeMedia();
          this.cdr.markForCheck();
        },
        error: (err) => this.logger.error('Error deleting document:', err)
      });
    this.activeDocActionId.set(null);
  }

  onRenameInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.renameValue.set(input.value);
  }

  confirmRename(): void {
    const docId = this.renameDocumentId();
    const baseName = this.renameValue();
    const ext = this.renameExtension();

    if (!docId || !baseName) return;

    const fullName = ext ? `${baseName}.${ext}` : baseName;

    const updated = this.paymentType().documents.map(d =>
      d.id === docId ? { ...d, name: fullName } : d
    );
    this.paymentType.update(p => ({ ...p, documents: updated }));

    // Persist rename to API
    this.mediaService.updateMediaItem(String(docId), { filename: fullName } as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => this.logger.error('Error renaming document:', err)
      });

    this.cancelRename();
  }

  cancelRename(): void {
    this.isRenameModalOpen.set(false);
    this.renameDocumentId.set(null);
    this.renameValue.set('');
    this.renameExtension.set('');
  }

  closeDropdowns(): void {
    this.isHeaderDropdownOpen.set(false);
    this.activeDocActionId.set(null);
  }

  hasSelectedDocuments(): boolean {
    return this.paymentType().documents.some(d => d.selected);
  }

  deleteSelectedDocuments(): void {
    const selected = this.paymentType().documents.filter(d => d.selected);
    if (selected.length === 0) return;

    selected.forEach(doc => {
      this.mediaService.deleteMediaItem(String(doc.id))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => this.logger.error('Error deleting document:', err)
        });
    });

    this.paymentType.update(p => ({
      ...p,
      documents: p.documents.filter(d => !d.selected)
    }));
    this.updatePaymentTypeMedia();
    this.cdr.markForCheck();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + units[i];
  }

  private splitFilename(filename: string): { name: string; ext: string } {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot <= 0) return { name: filename, ext: '' };
    return { name: filename.substring(0, lastDot), ext: filename.substring(lastDot + 1) };
  }

  // Persist document links to the payment type via PATCH
  private updatePaymentTypeMedia(): void {
    if (!this.paymentTypeId) return;

    const mediaIriPrefix = `${environment.apiPath}/media_items/`;
    const documents = this.paymentType().documents.map(d => mediaIriPrefix + d.id);

    this.paymentTypeService.updatePaymentType(this.paymentTypeId, { documents } as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => this.logger.error('Error updating payment type media:', err)
      });
  }
}

