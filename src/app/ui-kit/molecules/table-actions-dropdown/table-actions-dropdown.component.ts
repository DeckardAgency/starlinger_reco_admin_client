import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, HostListener, ElementRef, inject, booleanAttribute, ViewChild } from '@angular/core';
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
export class TableActionsDropdownComponent {
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

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.close.emit();
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
