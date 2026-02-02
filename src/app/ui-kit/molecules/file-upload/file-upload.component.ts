import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  signal,
  computed
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
  @Input() maxFiles = 5;
  @Input() label = 'Upload files';
  @Input() hint = '';
  @Input() error = '';
  @Input() disabled = false;

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() fileRemoved = new EventEmitter<UploadedFile>();

  protected isDragging = signal(false);
  protected files = signal<UploadedFile[]>([]);

  protected dropzoneClasses = computed(() => {
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
  });

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
    const currentCount = this.files().length;
    const availableSlots = this.maxFiles - currentCount;

    if (availableSlots <= 0) return;

    const filesToAdd = this.multiple
      ? newFiles.slice(0, availableSlots)
      : newFiles.slice(0, 1);

    const validFiles = filesToAdd.filter(file => {
      if (file.size > this.maxSize) {
        console.warn(`File ${file.name} exceeds max size of ${this.maxSize} bytes`);
        return false;
      }
      return true;
    });

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
