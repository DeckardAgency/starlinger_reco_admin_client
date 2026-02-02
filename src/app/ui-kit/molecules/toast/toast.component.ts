import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit, OnDestroy, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastVariant = 'light' | 'dark';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

@Component({
  selector: 'ui-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input() type: ToastType = 'info';
  @Input() variant: ToastVariant = 'light';
  @Input() title = '';
  @Input() message = '';
  @Input() actionLabel = '';
  @Input() duration = 5000; // milliseconds, 0 = no auto-close
  @Input({ transform: booleanAttribute }) showClose = true;
  @Input({ transform: booleanAttribute }) showIcon = true;
  @Input({ transform: booleanAttribute }) visible = true;

  @Output() closed = new EventEmitter<void>();
  @Output() actionClick = new EventEmitter<void>();

  private timeoutId?: ReturnType<typeof setTimeout>;

  get toastClasses(): string[] {
    return [
      'ui-toast',
      `ui-toast--${this.type}`,
      `ui-toast--${this.variant}`
    ];
  }

  get iconName(): string {
    switch (this.type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info':
      default: return 'info';
    }
  }

  ngOnInit(): void {
    if (this.duration > 0) {
      this.startAutoClose();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoClose();
  }

  close(): void {
    this.clearAutoClose();
    this.closed.emit();
  }

  onAction(): void {
    this.actionClick.emit();
    this.close();
  }

  private startAutoClose(): void {
    this.timeoutId = setTimeout(() => {
      this.close();
    }, this.duration);
  }

  private clearAutoClose(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}
