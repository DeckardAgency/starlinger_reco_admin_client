import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) fullWidth = false;
  @Input({ transform: booleanAttribute }) iconOnly = false;
  @Input() iconLeft?: string;
  @Input() iconRight?: string;

  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string[] {
    const classes = [
      'ui-button',
      `ui-button--${this.variant}`,
      `ui-button--${this.size}`
    ];

    if (this.fullWidth) {
      classes.push('ui-button--full-width');
    }

    if (this.iconOnly) {
      classes.push('ui-button--icon-only');
    }

    if (this.loading) {
      classes.push('ui-button--loading');
    }

    if (this.disabled) {
      classes.push('ui-button--disabled');
    }

    return classes;
  }

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
