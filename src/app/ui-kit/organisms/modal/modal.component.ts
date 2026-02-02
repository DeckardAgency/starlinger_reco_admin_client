import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  booleanAttribute,
  HostListener,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'ui-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(-24px) scale(0.95)', opacity: 0 }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0) scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ transform: 'translateY(-16px) scale(0.98)', opacity: 0 }))
      ])
    ])
  ]
})
export class ModalComponent {
  @Input({ transform: booleanAttribute })
  set isOpen(value: boolean) {
    this._isOpen.set(value);
  }
  get isOpen(): boolean {
    return this._isOpen();
  }

  @Input() size: ModalSize = 'md';
  @Input() title = '';
  @Input({ transform: booleanAttribute }) showClose = true;
  @Input({ transform: booleanAttribute }) closeOnBackdrop = true;
  @Input({ transform: booleanAttribute }) closeOnEscape = true;
  @Input({ transform: booleanAttribute }) preventBodyScroll = true;

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  private _isOpen = signal(false);

  constructor() {
    effect(() => {
      if (this.preventBodyScroll) {
        document.body.style.overflow = this._isOpen() ? 'hidden' : '';
      }
    });
  }

  get modalClasses(): string[] {
    return [
      'ui-modal__container',
      `ui-modal__container--${this.size}`
    ];
  }

  close(): void {
    this._isOpen.set(false);
    this.isOpenChange.emit(false);
    this.closed.emit();

    if (this.preventBodyScroll) {
      document.body.style.overflow = '';
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop && (event.target as HTMLElement).classList.contains('ui-modal__overlay')) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.closeOnEscape && this._isOpen()) {
      this.close();
    }
  }
}
