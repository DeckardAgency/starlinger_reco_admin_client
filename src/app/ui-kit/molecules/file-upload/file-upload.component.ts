import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  previewUrl?: string;
}

/** A file the dropzone refused: over `maxSize`, or beyond the `maxFiles` cap of one selection. */
export interface RejectedFile {
  file: File;
  reason: 'size' | 'count';
}

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Input() accept = '*';
  @Input() multiple = false;
  @Input() maxSize = 10 * 1024 * 1024; // 10MB default
  /** Cap on the files kept in the list (when shown) — otherwise on the files of a single selection. */
  @Input() maxFiles = 5;
  @Input() label = 'Upload files';
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;
  /** Set to false when the parent renders the files itself (e.g. a gallery) — the dropzone then only emits. */
  @Input() showFileList = true;

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() filesRejected = new EventEmitter<RejectedFile[]>();
  @Output() fileRemoved = new EventEmitter<UploadedFile>();

  protected isDragging = signal(false);
  protected files = signal<UploadedFile[]>([]);

  // A plain method rather than computed(): `disabled` and `error` are regular inputs,
  // not signals, so a computed would never re-evaluate when they change.
  protected dropzoneClasses(): string[] {
    const classes = ['ui-file-upload__dropzone'];

    if (this.isDragging()) {
      classes.push('ui-file-upload__dropzone--dragging');
    }

    if (this.disabled) {
      classes.push('ui-file-upload__dropzone--disabled');
    }

    if (this.error) {
      classes.push('ui-file-upload__dropzone--error');
    }

    return classes;
  }

  openFilePicker(): void {
    if (!this.disabled) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
    // Reset input to allow selecting the same file again
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) {
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (this.disabled) return;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  removeFile(file: UploadedFile): void {
    this.files.update(files => files.filter(f => f.id !== file.id));
    this.fileRemoved.emit(file);
  }

  private handleFiles(newFiles: File[]): void {
    // Files beyond the cap are truncated (not the whole selection) and reported via filesRejected.
    const limit = this.multiple ? Math.max(this.maxFiles - this.files().length, 0) : 1;
    const rejected: RejectedFile[] = newFiles.slice(limit).map(file => ({ file, reason: 'count' as const }));

    const validFiles = newFiles.slice(0, limit).filter(file => {
      if (file.size > this.maxSize) {
        rejected.push({ file, reason: 'size' });
        return false;
      }
      return true;
    });

    if (rejected.length > 0) {
      this.filesRejected.emit(rejected);
    }
    if (validFiles.length === 0) return;

    if (this.showFileList) {
      const uploadedFiles: UploadedFile[] = validFiles.map(file => ({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        status: 'pending' as const,
        previewUrl: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined
      }));

      if (!this.multiple) {
        this.files.set(uploadedFiles);
      } else {
        this.files.update(files => [...files, ...uploadedFiles]);
      }
    }

    this.filesSelected.emit(validFiles);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  trackByFileId(index: number, file: UploadedFile): string {
    return file.id;
  }
}
