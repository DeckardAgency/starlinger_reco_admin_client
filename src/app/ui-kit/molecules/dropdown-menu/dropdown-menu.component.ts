import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon: string;
  action?: () => void;
}

@Component({
  selector: 'ui-dropdown-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-menu.component.html',
  styleUrls: ['./dropdown-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DropdownMenuComponent {
  @Input() items: DropdownMenuItem[] = [];
  @Input() isOpen = false;
  @Output() itemClick = new EventEmitter<string>();
  @Output() closeMenu = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    const clickedOnTrigger = (event.target as HTMLElement).closest('.history__actions');

    if (this.isOpen && !clickedInside && !clickedOnTrigger) {
      this.closeMenu.emit();
    }
  }

  onItemClick(item: DropdownMenuItem): void {
    this.itemClick.emit(item.id);
    if (item.action) {
      item.action();
    }
    this.closeMenu.emit();
  }
}
