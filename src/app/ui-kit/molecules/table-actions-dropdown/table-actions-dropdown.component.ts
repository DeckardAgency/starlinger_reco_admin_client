import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef, inject, booleanAttribute, ViewChild, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon.component';

export interface TableAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface ActionClickEvent {
  actionId: string;
  action: TableAction;
  row: unknown;
}

@Component({
  selector: 'ui-table-actions-dropdown',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './table-actions-dropdown.component.html',
  styleUrls: ['./table-actions-dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableActionsDropdownComponent implements OnChanges, OnDestroy {
  private elementRef = inject(ElementRef);

  @ViewChild('triggerBtn') triggerBtn!: ElementRef<HTMLButtonElement>;

  dropdownStyle: { top: string; left: string } = { top: '0px', left: '0px' };

  /**
   * Whether the dropdown is currently open
   */
  @Input({ transform: booleanAttribute }) isOpen = false;

  /**
   * List of actions to display
   */
  @Input() actions: TableAction[] = [
    { id: 'edit', label: 'Edit', icon: 'pencil' },
    { id: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' }
  ];

  /**
   * Row data to pass back with action events
   */
  @Input() row: unknown;

  // Events
  @Output() toggle = new EventEmitter<void>();
  @Output() actionClick = new EventEmitter<ActionClickEvent>();
  @Output() close = new EventEmitter<void>();

  // Outside-click listener is attached only while the dropdown is open, so
  // 30 rows per page don't register 30 permanent document listeners.
  private documentClickListenerAttached = false;
  private readonly documentClickHandler = (event: Event): void => {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close.emit();
    }
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
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
    // Calculate position before toggle so it's ready when dropdown opens
    if (this.triggerBtn) {
      const rect = this.triggerBtn.nativeElement.getBoundingClientRect();
      this.dropdownStyle = {
        top: `${rect.bottom + 4}px`,
        left: `${rect.right - 154}px` // 154px is the min-width of the dropdown
      };
    }
    this.toggle.emit();
  }

  onActionClick(action: TableAction, event: Event): void {
    event.stopPropagation();
    if (!action.disabled) {
      this.actionClick.emit({ actionId: action.id, action, row: this.row });
      this.close.emit();
    }
  }
}
