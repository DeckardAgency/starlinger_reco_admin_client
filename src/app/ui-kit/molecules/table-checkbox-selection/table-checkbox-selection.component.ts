import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef, inject, booleanAttribute, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'ui-table-checkbox-selection',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './table-checkbox-selection.component.html',
  styleUrls: ['./table-checkbox-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableCheckboxSelectionComponent implements OnChanges, OnDestroy {
  private elementRef = inject(ElementRef);

  /**
   * Whether this is a header checkbox (shows dropdown) or row checkbox
   */
  @Input({ transform: booleanAttribute }) isHeader = false;

  /**
   * Whether the checkbox is checked
   */
  @Input({ transform: booleanAttribute }) checked = false;

  /**
   * Whether some (but not all) items are selected (for header indeterminate state)
   */
  @Input({ transform: booleanAttribute }) indeterminate = false;

  /**
   * Whether the header dropdown is open
   */
  @Input({ transform: booleanAttribute }) isDropdownOpen = false;

  // Events
  @Output() change = new EventEmitter<boolean>();
  @Output() selectAll = new EventEmitter<void>();
  @Output() selectNone = new EventEmitter<void>();
  @Output() dropdownToggle = new EventEmitter<boolean>();

  // Outside-click listener is attached only while the header dropdown is open,
  // instead of a permanent document-level HostListener per checkbox.
  private documentClickListenerAttached = false;
  private readonly documentClickHandler = (event: Event): void => {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownToggle.emit(false);
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isDropdownOpen'] || changes['isHeader']) {
      if (this.isHeader && this.isDropdownOpen) {
        this.attachDocumentClickListener();
      } else {
        this.detachDocumentClickListener();
      }
    }
  }

  ngOnDestroy(): void {
    this.detachDocumentClickListener();
  }

  private attachDocumentClickListener(): void {
    if (!this.documentClickListenerAttached) {
      document.addEventListener('click', this.documentClickHandler);
      this.documentClickListenerAttached = true;
    }
  }

  private detachDocumentClickListener(): void {
    if (this.documentClickListenerAttached) {
      document.removeEventListener('click', this.documentClickHandler);
      this.documentClickListenerAttached = false;
    }
  }

  onToggle(event: Event): void {
    event.stopPropagation();
    if (this.isHeader) {
      this.dropdownToggle.emit(!this.isDropdownOpen);
    } else {
      this.change.emit(!this.checked);
    }
  }

  onSelectAll(event: Event): void {
    event.stopPropagation();
    this.selectAll.emit();
    this.dropdownToggle.emit(false);
  }

  onSelectNone(event: Event): void {
    event.stopPropagation();
    this.selectNone.emit();
    this.dropdownToggle.emit(false);
  }
}
