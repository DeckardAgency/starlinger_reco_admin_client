import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

export type DropdownPosition = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
export type DropdownSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('dropdownAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' }))
      ])
    ])
  ]
})
export class DropdownComponent {
  @Input() items: DropdownItem[] = [];
  @Input() position: DropdownPosition = 'bottom-start';
  @Input() size: DropdownSize = 'md';
  @Input() triggerLabel = '';
  @Input() width = 'auto';

  @Output() itemSelect = new EventEmitter<DropdownItem>();

  protected isOpen = signal(false);

  protected dropdownClasses = computed(() => {
    return [
      'ui-dropdown__menu',
      `ui-dropdown__menu--${this.position}`,
      `ui-dropdown__menu--${this.size}`
    ];
  });

  constructor(private elementRef: ElementRef) {}

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectItem(item: DropdownItem): void {
    if (item.disabled || item.divider) return;

    this.itemSelect.emit(item);
    this.close();
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.close();
  }

  trackByItemId(index: number, item: DropdownItem): string {
    return item.id;
  }
}
