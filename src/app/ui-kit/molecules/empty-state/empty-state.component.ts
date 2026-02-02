import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() icon: 'inbox' | 'search' | 'file' | 'error' | 'cart' | 'user' | 'custom' = 'inbox';
  @Input() title = 'No data found';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() size: EmptyStateSize = 'md';

  @Output() actionClick = new EventEmitter<void>();

  get containerClasses(): string[] {
    return [
      'ui-empty-state',
      `ui-empty-state--${this.size}`
    ];
  }

  onActionClick(): void {
    this.actionClick.emit();
  }
}
