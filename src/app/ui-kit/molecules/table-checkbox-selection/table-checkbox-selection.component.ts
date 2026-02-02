import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, HostListener, ElementRef, inject, booleanAttribute } from '@angular/core';
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
export class TableCheckboxSelectionComponent {
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

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (this.isHeader && this.isDropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownToggle.emit(false);
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
