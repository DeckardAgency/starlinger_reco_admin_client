import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbsComponent } from '@app/ui-kit/molecules/breadcrumbs/breadcrumbs.component';
import { DocumentationService } from '@core/services/http/documentation.service';
import { switchMap, finalize, delay, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { Documentation, DocumentationRevision, DocumentationMedia } from '@core/models/documentation.model';
import { environment } from '@env/environment';
import { ToastService } from '@app/ui-kit/organisms/toast-container/toast-container.component';
import { AlertService } from '@services/alert.service';

@Component({
  selector: 'app-documentation-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbsComponent],
  templateUrl: './documentation-edit.component.html',
  styleUrls: ['./documentation-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentationEditComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private documentationService = inject(DocumentationService);
  private toastService = inject(ToastService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  breadcrumbs = [
    { label: 'Documentation', route: '/admin/documentation/list' },
    { label: 'Edit Documentation' }
  ];

  documentationForm!: FormGroup;
  dataLoaded = false;
  isLoading = false;
  isSaving = false;
  isEditMode = false;
  currentDocumentation: Documentation | null = null;

  showRevisions = false;
  revisions: DocumentationRevision[] = [];
  loadingRevisions = false;
  selectedRevision: DocumentationRevision | null = null;
  revisionViewMode: 'list' | 'preview' | 'compare' = 'list';
  compareRevision: DocumentationRevision | null = null;

  showPreview = false;

  showMediaPanel = false;
  mediaItems: DocumentationMedia[] = [];
  loadingMedia = false;
  uploadingMedia = false;
  dragOver = false;

  @ViewChild('contentTextarea') contentTextarea!: ElementRef<HTMLTextAreaElement>;
  private lastCursorPosition = 0;
  private destroy$ = new Subject<void>();

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          this.isEditMode = false;
          this.breadcrumbs[1] = { label: 'New Documentation' };
          return of(null);
        }
        this.isEditMode = true;
        this.isLoading = true;
        return this.documentationService.getDocumentation(id).pipe(
          delay(200),
          finalize(() => { this.isLoading = false; })
        );
      })
    ).subscribe({
      next: (data: Documentation | null) => {
        if (data) {
          this.currentDocumentation = data;
          this.updateFormWithData(data);
          this.breadcrumbs[1] = { label: `Edit: ${data.title}` };
          if (data.revisions?.length) this.revisions = data.revisions;
          if (data.media?.length) this.mediaItems = data.media;
        }
        this.dataLoaded = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.toastService.show({ message: 'Failed to load documentation', type: 'error' });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.documentationForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      content: ['', Validators.required],
      category: [''],
      sortOrder: [0, [Validators.required, Validators.min(0)]],
      isPublished: [true]
    });
  }

  updateFormWithData(data: Documentation): void {
    this.documentationForm.patchValue({
      title: data.title || '',
      content: data.content || '',
      category: data.category || '',
      sortOrder: data.sortOrder ?? 0,
      isPublished: data.isPublished ?? true
    });
  }

  saveDocumentation(andContinue = false): void {
    if (this.documentationForm.invalid) {
      this.markFormGroupTouched(this.documentationForm);
      this.toastService.show({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    this.isSaving = true;
    const formData = this.documentationForm.value;

    const saveObs = this.isEditMode && this.currentDocumentation
      ? this.documentationService.updateDocumentation(String(this.currentDocumentation.id), formData)
      : this.documentationService.createDocumentation(formData);

    saveObs.pipe(finalize(() => { this.isSaving = false; })).subscribe({
      next: (result) => {
        this.toastService.show({ message: this.isEditMode ? 'Updated successfully' : 'Created successfully', type: 'success' });
        if (andContinue) {
          if (!this.isEditMode) {
            this.router.navigate(['/admin/documentation', result.id, 'edit']);
          } else {
            this.loadDocumentation(String(this.currentDocumentation!.id));
          }
        } else {
          this.router.navigate(['/admin/documentation/list']);
        }
      },
      error: () => {
        this.toastService.show({ message: 'Failed to save', type: 'error' });
      }
    });
  }

  private loadDocumentation(id: string): void {
    this.documentationService.getDocumentation(id).subscribe({
      next: (data) => {
        this.currentDocumentation = data;
        this.updateFormWithData(data);
        if (data.revisions) this.revisions = data.revisions;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/documentation/list']);
  }

  togglePreview(): void { this.showPreview = !this.showPreview; }

  toggleRevisions(): void {
    this.showRevisions = !this.showRevisions;
    if (this.showRevisions && this.revisions.length === 0 && this.currentDocumentation) {
      this.loadRevisions();
    }
  }

  loadRevisions(): void {
    if (!this.currentDocumentation) return;
    this.loadingRevisions = true;
    this.documentationService.getRevisions(String(this.currentDocumentation.id)).pipe(
      finalize(() => { this.loadingRevisions = false; })
    ).subscribe({
      next: (response) => { this.revisions = response.revisions; },
      error: () => { this.toastService.show({ message: 'Failed to load revisions', type: 'error' }); }
    });
  }

  selectRevision(revision: DocumentationRevision): void {
    this.selectedRevision = this.selectedRevision?.id === revision.id ? null : revision;
    if (!this.selectedRevision) this.revisionViewMode = 'list';
  }

  previewRevision(revision: DocumentationRevision): void {
    this.selectedRevision = revision;
    this.revisionViewMode = 'preview';
  }

  compareWithCurrent(revision: DocumentationRevision): void {
    this.compareRevision = revision;
    this.revisionViewMode = 'compare';
  }

  backToRevisionList(): void {
    this.revisionViewMode = 'list';
    this.compareRevision = null;
  }

  applyRevisionContent(revision: DocumentationRevision): void {
    this.documentationForm.patchValue({ title: revision.title, content: revision.content });
    this.toastService.show({ message: 'Revision content applied. Save to persist.', type: 'success' });
    this.revisionViewMode = 'list';
  }

  async restoreRevision(revision: DocumentationRevision): Promise<void> {
    if (!this.currentDocumentation) return;
    const confirmed = await this.alertService.confirm(`Restore to revision ${revision.revisionNumber}?`, 'Restore revision');
    if (!confirmed) return;

    this.documentationService.restoreFromRevision(String(this.currentDocumentation.id), String(revision.id)).subscribe({
      next: () => {
        this.toastService.show({ message: 'Restored successfully', type: 'success' });
        this.loadDocumentation(String(this.currentDocumentation!.id));
        this.selectedRevision = null;
        this.showRevisions = false;
      },
      error: () => { this.toastService.show({ message: 'Failed to restore', type: 'error' }); }
    });
  }

  // Media methods
  toggleMediaPanel(): void {
    this.showMediaPanel = !this.showMediaPanel;
    if (this.showMediaPanel && this.mediaItems.length === 0 && this.currentDocumentation) {
      this.loadMedia();
    }
  }

  loadMedia(): void {
    if (!this.currentDocumentation) return;
    this.loadingMedia = true;
    this.documentationService.getMedia(String(this.currentDocumentation.id)).pipe(
      finalize(() => { this.loadingMedia = false; })
    ).subscribe({
      next: (media) => { this.mediaItems = media; },
      error: () => { this.toastService.show({ message: 'Failed to load images', type: 'error' }); }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.uploadFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.dragOver = true; }
  onDragLeave(event: DragEvent): void { event.preventDefault(); this.dragOver = false; }
  onDrop(event: DragEvent): void {
    event.preventDefault(); this.dragOver = false;
    if (event.dataTransfer?.files?.length) this.uploadFile(event.dataTransfer.files[0]);
  }

  private uploadFile(file: File): void {
    if (!this.currentDocumentation) {
      this.toastService.show({ message: 'Save documentation first before uploading', type: 'error' });
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      this.toastService.show({ message: 'Only image files allowed', type: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.toastService.show({ message: 'File exceeds 10MB limit', type: 'error' });
      return;
    }

    this.uploadingMedia = true;
    this.documentationService.uploadMedia(String(this.currentDocumentation.id), file).pipe(
      finalize(() => { this.uploadingMedia = false; })
    ).subscribe({
      next: (media) => {
        this.mediaItems = [...this.mediaItems, media];
        this.toastService.show({ message: 'Image uploaded', type: 'success' });
      },
      error: () => { this.toastService.show({ message: 'Upload failed', type: 'error' }); }
    });
  }

  async deleteMedia(media: DocumentationMedia): Promise<void> {
    if (!this.currentDocumentation) return;
    const confirmed = await this.alertService.confirm(`Delete "${media.filename}"?`, 'Delete');
    if (!confirmed) return;
    this.documentationService.deleteMedia(String(this.currentDocumentation.id), String(media.id)).subscribe({
      next: () => {
        this.mediaItems = this.mediaItems.filter(m => m.id !== media.id);
        this.toastService.show({ message: 'Image deleted', type: 'success' });
      },
      error: () => { this.toastService.show({ message: 'Failed to delete', type: 'error' }); }
    });
  }

  getMediaUrl(filePath: string): string {
    return `${environment.apiBaseUrl}${filePath}`;
  }

  copyImagePlaceholder(media: DocumentationMedia): void {
    const placeholder = `{{media:${media.filename}}}`;
    navigator.clipboard.writeText(placeholder).then(
      () => this.toastService.show({ message: `Copied: ${placeholder}`, type: 'success' }),
      () => this.toastService.show({ message: 'Failed to copy', type: 'error' })
    );
  }

  insertImageAtCursor(media: DocumentationMedia): void {
    const placeholder = `{{media:${media.filename}}}`;
    const ctrl = this.documentationForm.get('content');
    if (!ctrl) return;
    const val = ctrl.value || '';
    const pos = this.lastCursorPosition || val.length;
    ctrl.setValue(val.substring(0, pos) + placeholder + val.substring(pos));
    this.lastCursorPosition = pos + placeholder.length;
    if (this.contentTextarea?.nativeElement) {
      const ta = this.contentTextarea.nativeElement;
      ta.focus();
      setTimeout(() => ta.setSelectionRange(this.lastCursorPosition, this.lastCursorPosition), 0);
    }
  }

  onTextareaInput(event: Event): void {
    this.lastCursorPosition = (event.target as HTMLTextAreaElement).selectionStart;
  }

  onTextareaSelect(event: Event): void {
    this.lastCursorPosition = (event.target as HTMLTextAreaElement).selectionStart;
  }

  private markFormGroupTouched(fg: FormGroup): void {
    Object.values(fg.controls).forEach(c => {
      c.markAsTouched();
      if (c instanceof FormGroup) this.markFormGroupTouched(c);
    });
  }

  isFieldInvalid(name: string): boolean {
    const c = this.documentationForm.get(name);
    return !!(c && c.invalid && c.touched);
  }

  getFieldError(name: string): string {
    const c = this.documentationForm.get(name);
    if (c?.hasError('required')) return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    if (c?.hasError('minlength')) return `Minimum ${c.errors?.['minlength'].requiredLength} characters`;
    if (c?.hasError('min')) return `Minimum value is ${c.errors?.['min'].min}`;
    return '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getEditorName(editedBy: any): string {
    if (!editedBy) return 'System';
    if (typeof editedBy === 'string') return 'User';
    return `${editedBy.firstName || ''} ${editedBy.lastName || ''}`.trim() || editedBy.email || 'Unknown';
  }
}
