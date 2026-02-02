import { Component, ChangeDetectionStrategy, Injectable, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastComponent, ToastType, ToastPosition } from '../../molecules/toast/toast.component';

// Re-export for convenience
export type { ToastPosition };

export interface ToastConfig {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  showClose?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private _toasts = signal<ToastConfig[]>([]);

  get toasts() {
    return this._toasts.asReadonly();
  }

  show(config: ToastConfig): string {
    const id = config.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastConfig = {
      ...config,
      id,
      duration: config.duration ?? 5000,
      showClose: config.showClose ?? true
    };

    this._toasts.update(toasts => [...toasts, toast]);
    return id;
  }

  success(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'success', message, title, duration });
  }

  error(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'error', message, title, duration });
  }

  warning(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'warning', message, title, duration });
  }

  info(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'info', message, title, duration });
  }

  remove(id: string): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}

@Component({
  selector: 'ui-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="ui-toast-container" [ngClass]="'ui-toast-container--' + position">
      <ui-toast
        *ngFor="let toast of toastService.toasts(); trackBy: trackByToastId"
        [type]="toast.type"
        [title]="toast.title || ''"
        [message]="toast.message"
        [duration]="toast.duration || 5000"
        [showClose]="toast.showClose !== false"
        (closed)="onToastClosed(toast.id!)"
      ></ui-toast>
    </div>
  `,
  styles: [`
    .ui-toast-container {
      position: fixed;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      pointer-events: none;

      ui-toast {
        pointer-events: auto;
      }

      &--top-right {
        top: 0;
        right: 0;
      }

      &--top-left {
        top: 0;
        left: 0;
      }

      &--bottom-right {
        bottom: 0;
        right: 0;
        flex-direction: column-reverse;
      }

      &--bottom-left {
        bottom: 0;
        left: 0;
        flex-direction: column-reverse;
      }

      &--top-center {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        align-items: center;
      }

      &--bottom-center {
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        align-items: center;
        flex-direction: column-reverse;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  position: ToastPosition = 'top-right';

  constructor(public toastService: ToastService) {}

  trackByToastId(index: number, toast: ToastConfig): string {
    return toast.id || index.toString();
  }

  onToastClosed(id: string): void {
    this.toastService.remove(id);
  }
}
