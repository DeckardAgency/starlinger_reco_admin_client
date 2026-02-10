import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed, ChangeDetectorRef, ViewChild, TemplateRef, AfterViewInit, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
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
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { DeliveryType, DeliveryTypeDocument } from '@core/models/delivery-type.model';
import { DeliveryTypeService } from '@core/services/http/delivery-type.service';
import { MediaService } from '@core/services/http/media.service';
import { MediaItem } from '@core/models/media.model';
import { environment } from '@env/environment';

interface DeliveryTypeDetail {
  id: string;
  name: string;
  isActive: boolean;
  readyForShop: boolean;
  isDelivery: boolean;
  useAsDefault: boolean;
  grossFactor: number;
  sortOrder: number;
  shortDescription: string;
  documents: DeliveryTypeDocument[];
}

const EMPTY_DELIVERY_TYPE: DeliveryTypeDetail = {
  id: '',
  name: '',
  isActive: false,
  readyForShop: false,
  isDelivery: true,
  useAsDefault: false,
  grossFactor: 1.0,
  sortOrder: 0,
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
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('documentFileInput') documentFileInput?: ElementRef<HTMLInputElement>;

  // Mode
  isEditMode = signal(false);
  deliveryTypeId: string | null = null;

  // Data
  deliveryType = signal<DeliveryTypeDetail>({ ...EMPTY_DELIVERY_TYPE });

  // Loading state
  isLoading = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const deliveryType = this.deliveryType();
    const errs: Record<string, string> = {};
    if (!deliveryType.name?.trim()) errs['name'] = 'Name is required';
    return errs;
  });
  isValid = computed(() => Object.keys(this.errors()).length === 0);

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
  renameExtension = signal('');
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
    private deliveryTypeService: DeliveryTypeService,
    private mediaService: MediaService
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
          isActive: deliveryType.isActive ?? false,
          readyForShop: deliveryType.readyForShop ?? false,
          isDelivery: deliveryType.isDelivery ?? true,
          useAsDefault: deliveryType.useAsDefault ?? false,
          grossFactor: deliveryType.grossFactor ? Number(deliveryType.grossFactor) : 1.0,
          sortOrder: deliveryType.sortOrder || 0,
          shortDescription: deliveryType.shortDescription || '',
          documents: ((deliveryType as any).documents || []).map((m: any) => ({
            id: typeof m === 'string' ? m.split('/').pop() : m.id,
            fileType: this.getFileType(typeof m === 'object' ? m.mimeType : '', typeof m === 'object' ? m.filename : ''),
            name: typeof m === 'object' ? (m.filename || 'unknown') : 'unknown',
            filePath: typeof m === 'object' ? m.filePath : undefined,
            size: typeof m === 'object' && m.fileSize ? this.formatFileSize(m.fileSize) : '-'
          }))
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
    this.router.navigate(['/admin/delivery-types/list']);
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
    this.saveDeliveryType(false);
  }

  onSaveAndContinue(): void {
    this.saveDeliveryType(true);
  }

  private saveDeliveryType(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    const detail = this.deliveryType();

    // Build payload with only writable fields — never send id
    const mediaIriPrefix = `${environment.apiPath}/media_items/`;
    const data: Record<string, unknown> = {
      name: detail.name,
      isActive: detail.isActive,
      readyForShop: detail.readyForShop,
      isDelivery: detail.isDelivery,
      useAsDefault: detail.useAsDefault,
      grossFactor: String(detail.grossFactor),
      sortOrder: detail.sortOrder,
      shortDescription: detail.shortDescription,
      documents: detail.documents.map(d => mediaIriPrefix + d.id)
    };

    const isCreating = !this.isEditMode();
    const operation = isCreating
      ? this.deliveryTypeService.createDeliveryType(data as any)
      : this.deliveryTypeService.updateDeliveryType(this.deliveryTypeId!, data as any);

    operation.subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/delivery-types/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/delivery-types', result.id, 'edit']);
        }
      },
      error: (error) => {
        console.error('Error saving delivery type:', error);
        this.toastService.error('Failed to save delivery type');
      }
    });
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId as 'description' | 'documents');
  }

  // Toggle handlers
  toggleActive(): void {
    this.deliveryType.update(d => ({ ...d, isActive: !d.isActive }));
  }

  toggleReadyForShop(): void {
    this.deliveryType.update(d => ({ ...d, readyForShop: !d.readyForShop }));
  }

  toggleIsDelivery(): void {
    this.deliveryType.update(d => ({ ...d, isDelivery: !d.isDelivery }));
  }

  toggleUseAsDefault(): void {
    this.deliveryType.update(d => ({ ...d, useAsDefault: !d.useAsDefault }));
  }

  // Input handlers
  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.deliveryType.update(d => ({ ...d, name: input.value }));
    this.markFieldTouched('name');
  }

  onGrossFactorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(',', '.')) || 0;
    this.deliveryType.update(d => ({ ...d, grossFactor: value }));
  }

  onSortOrderChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10) || 0;
    this.deliveryType.update(d => ({ ...d, sortOrder: value }));
  }

  onShortDescriptionChange(content: string): void {
    this.deliveryType.update(d => ({ ...d, shortDescription: content }));
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
              this.deliveryType.update(d => ({
                ...d,
                documents: [...d.documents, {
                  id: media.id,
                  fileType: this.getFileType(media.mimeType || '', media.filename || file.name),
                  name: media.filename || file.name,
                  filePath: media.filePath,
                  size: this.formatFileSize(file.size)
                }]
              }));
              uploaded++;
              if (uploaded === files.length) {
                this.updateDeliveryTypeMedia();
              }
              this.cdr.markForCheck();
            }
          },
          error: (err) => console.error('Error uploading document:', err)
        });
    });

    input.value = '';
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
      const { name, ext } = this.splitFilename(doc.name);
      this.renameDocumentId.set(docId);
      this.renameValue.set(name);
      this.renameExtension.set(ext);
      this.isRenameModalOpen.set(true);
    }
    this.activeDocActionId.set(null);
  }

  downloadDocument(docId: string): void {
    this.mediaService.getMediaItem(docId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (media) => {
          if (media.filePath) {
            this.triggerDownload(media.filePath, media.filename || 'document');
          }
        },
        error: (err) => console.error('Error downloading document:', err)
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
        error: (err) => console.error('Error downloading file:', err)
      });
  }

  deleteDocument(docId: string): void {
    this.mediaService.deleteMediaItem(docId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deliveryType.update(d => ({
            ...d,
            documents: d.documents.filter(doc => doc.id !== docId)
          }));
          this.updateDeliveryTypeMedia();
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Error deleting document:', err)
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

    const updated = this.deliveryType().documents.map(d =>
      d.id === docId ? { ...d, name: fullName } : d
    );
    this.deliveryType.update(dt => ({ ...dt, documents: updated }));

    // Persist rename to API
    this.mediaService.updateMediaItem(docId, { filename: fullName } as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error renaming document:', err)
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
    return this.deliveryType().documents.some(d => d.selected);
  }

  deleteSelectedDocuments(): void {
    const selected = this.deliveryType().documents.filter(d => d.selected);
    if (selected.length === 0) return;

    selected.forEach(doc => {
      this.mediaService.deleteMediaItem(doc.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => console.error('Error deleting document:', err)
        });
    });

    this.deliveryType.update(d => ({
      ...d,
      documents: d.documents.filter(doc => !doc.selected)
    }));
    this.updateDeliveryTypeMedia();
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

  // Persist document links to the delivery type via PATCH
  private updateDeliveryTypeMedia(): void {
    if (!this.deliveryTypeId) return;

    const mediaIriPrefix = `${environment.apiPath}/media_items/`;
    const documents = this.deliveryType().documents.map(d => mediaIriPrefix + d.id);

    this.deliveryTypeService.updateDeliveryType(this.deliveryTypeId, { documents } as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error updating delivery type media:', err)
      });
  }
}
