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
import { WarehouseDocument } from '@core/models/warehouse.model';
import { WarehouseService } from '@core/services/http/warehouse.service';
import { MediaService } from '@core/services/http/media.service';
import { LoggerService } from '@core/services/logger.service';
import { environment } from '@env/environment';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';

interface WarehouseDetail {
  id: number;
  name: string;
  contactPerson: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  url: string;
  description: string;
  readyForShop: boolean;
  keepUrl: boolean;
  autoGenerateUrl: boolean;
  documents: WarehouseDocument[];
}

const EMPTY_WAREHOUSE: WarehouseDetail = {
  id: 0,
  name: '',
  contactPerson: '',
  address: '',
  city: '',
  phone: '',
  email: '',
  url: '',
  description: '',
  readyForShop: false,
  keepUrl: false,
  autoGenerateUrl: false,
  documents: []
};

@Component({
  selector: 'app-warehouses-edit',
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
  templateUrl: './warehouses-edit.component.html',
  styleUrls: ['./warehouses-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarehousesEditComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private toastService = inject(ToastService);

  @ViewChild('checkboxTemplate') checkboxTemplate!: TemplateRef<any>;
  @ViewChild('checkboxHeaderTemplate') checkboxHeaderTemplate!: TemplateRef<any>;
  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;
  @ViewChild('documentFileInput') documentFileInput?: ElementRef<HTMLInputElement>;

  // Mode
  isEditMode = signal(false);
  warehouseId: string | null = null;

  // Data
  warehouse = signal<WarehouseDetail>({ ...EMPTY_WAREHOUSE });

  // Loading state
  isLoading = signal(false);
  isSaving = signal(false);

  // Validation state
  touched = signal<Record<string, boolean>>({});
  errors = computed(() => {
    const warehouse = this.warehouse();
    const errs: Record<string, string> = {};
    if (!warehouse.name?.trim()) errs['name'] = 'Name is required';
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
    { id: 'documents', label: 'Warehouse documents' }
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
    private warehouseService: WarehouseService,
    private mediaService: MediaService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditMode.set(true);
        this.warehouseId = params['id'];
        this.loadWarehouse(this.warehouseId!);
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

  private loadWarehouse(id: string): void {
    this.isLoading.set(true);

    this.warehouseService.getWarehouseById(id).subscribe({
      next: (warehouse: any) => {
        this.warehouse.set({
          id: warehouse.id || Number(id),
          name: warehouse.name || '',
          contactPerson: warehouse.contactPerson || '',
          address: warehouse.address || '',
          city: warehouse.city || '',
          phone: warehouse.phone || '',
          email: warehouse.email || '',
          url: warehouse.url || '',
          description: warehouse.description || '',
          readyForShop: warehouse.readyForShop ?? false,
          keepUrl: warehouse.keepUrl ?? false,
          autoGenerateUrl: warehouse.autoGenerateUrl ?? false,
          documents: ((warehouse as any).documents || []).map((m: any) => ({
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
        this.logger.error('Error loading warehouse:', error);
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
    this.router.navigate(['/admin/warehouses/list']);
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
    this.saveWarehouse(false);
  }

  onSaveAndContinue(): void {
    this.saveWarehouse(true);
  }

  private buildPayload(): Record<string, any> {
    const w = this.warehouse();
    const mediaIriPrefix = `${environment.apiPath}/media_items/`;
    return {
      name: w.name,
      contactPerson: w.contactPerson || null,
      address: w.address || null,
      city: w.city || null,
      phone: w.phone || null,
      email: w.email || null,
      url: w.url || null,
      description: w.description || null,
      readyForShop: w.readyForShop,
      keepUrl: w.keepUrl,
      autoGenerateUrl: w.autoGenerateUrl,
      documents: w.documents.map(d => mediaIriPrefix + d.id)
    };
  }

  private saveWarehouse(navigateToList: boolean): void {
    this.markAllTouched();
    if (!this.isValid()) {
      this.cdr.markForCheck();
      return;
    }

    if (this.isSaving()) return;

    const payload = this.buildPayload();
    const isCreating = !this.isEditMode();

    const operation = isCreating
      ? this.warehouseService.createWarehouse(payload)
      : this.warehouseService.updateWarehouse(this.warehouseId!, payload);

    this.isSaving.set(true);
    operation.pipe(finalize(() => { this.isSaving.set(false); this.cdr.markForCheck(); })).subscribe({
      next: (result) => {
        this.toastService.success('Saved successfully');
        if (navigateToList) {
          this.router.navigate(['/admin/warehouses/list']);
        } else if (isCreating && result?.id) {
          this.router.navigate(['/admin/warehouses', result.id, 'edit']);
        } else if (!isCreating && this.warehouseId) {
          this.loadWarehouse(this.warehouseId);
        }
      },
      error: (error) => {
        this.logger.error('Error saving warehouse:', error);
        this.toastService.error('Failed to save warehouse');
      }
    });
  }

  setActiveTab(tabId: string): void {
    this.activeTab.set(tabId as 'description' | 'documents');
  }

  // Toggle handlers
  toggleReadyForShop(): void {
    this.warehouse.update(w => ({ ...w, readyForShop: !w.readyForShop }));
  }

  toggleKeepUrl(): void {
    this.warehouse.update(w => ({ ...w, keepUrl: !w.keepUrl }));
  }

  toggleAutoGenerateUrl(): void {
    this.warehouse.update(w => ({ ...w, autoGenerateUrl: !w.autoGenerateUrl }));
  }

  // Input handlers
  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, name: input.value }));
    this.markFieldTouched('name');
  }

  onContactPersonChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, contactPerson: input.value }));
  }

  onAddressChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, address: input.value }));
  }

  onCityChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, city: input.value }));
  }

  onPhoneChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, phone: input.value }));
  }

  onEmailChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, email: input.value }));
  }

  onUrlChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.warehouse.update(w => ({ ...w, url: input.value }));
  }

  onShortDescriptionChange(content: string): void {
    this.warehouse.update(w => ({ ...w, description: content }));
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
              this.warehouse.update(w => ({
                ...w,
                documents: [...w.documents, {
                  id: media.id,
                  fileType: this.getFileType(media.mimeType || '', media.filename || file.name),
                  name: media.filename || file.name,
                  size: this.formatFileSize(file.size)
                }]
              }));
              uploaded++;
              if (uploaded === files.length) {
                this.updateWarehouseMedia();
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
    const updated = this.warehouse().documents.map(d => ({ ...d, selected: true }));
    this.warehouse.update(w => ({ ...w, documents: updated }));
    this.selectAll.set(true);
    this.isHeaderDropdownOpen.set(false);
  }

  onSelectNoneDocuments(): void {
    const updated = this.warehouse().documents.map(d => ({ ...d, selected: false }));
    this.warehouse.update(w => ({ ...w, documents: updated }));
    this.selectAll.set(false);
    this.isHeaderDropdownOpen.set(false);
  }

  toggleDocumentSelection(doc: WarehouseDocument): void {
    const updated = this.warehouse().documents.map(d =>
      d.id === doc.id ? { ...d, selected: !d.selected } : d
    );
    this.warehouse.update(w => ({ ...w, documents: updated }));
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
    const doc = event.row as WarehouseDocument;
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
    const doc = this.warehouse().documents.find(d => d.id === docId);
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
          this.warehouse.update(w => ({
            ...w,
            documents: w.documents.filter(d => d.id !== docId)
          }));
          this.updateWarehouseMedia();
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

    const updated = this.warehouse().documents.map(d =>
      d.id === docId ? { ...d, name: fullName } : d
    );
    this.warehouse.update(w => ({ ...w, documents: updated }));

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
    return this.warehouse().documents.some(d => d.selected);
  }

  deleteSelectedDocuments(): void {
    const selected = this.warehouse().documents.filter(d => d.selected);
    if (selected.length === 0) return;

    selected.forEach(doc => {
      this.mediaService.deleteMediaItem(String(doc.id))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => this.logger.error('Error deleting document:', err)
        });
    });

    this.warehouse.update(w => ({
      ...w,
      documents: w.documents.filter(d => !d.selected)
    }));
    this.updateWarehouseMedia();
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

  private updateWarehouseMedia(): void {
    if (!this.warehouseId) return;

    const mediaIriPrefix = `${environment.apiPath}/media_items/`;
    const documents = this.warehouse().documents.map(d => mediaIriPrefix + d.id);

    this.warehouseService.updateWarehouse(this.warehouseId, { documents } as any)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => this.logger.error('Error updating warehouse media:', err)
      });
  }
}
