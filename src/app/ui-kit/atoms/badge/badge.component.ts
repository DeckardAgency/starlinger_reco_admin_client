import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'blue' | 'teal' | 'orange' | 'dark';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [ngClass]="badgeClasses">
      <span *ngIf="dot" class="ui-badge__dot"></span>
      <ng-content></ng-content>
    </span>
  `,
  styleUrls: ['./badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'md';
  @Input() dot = false;
  @Input() rounded = false;

  get badgeClasses(): string[] {
    const classes = [
      'ui-badge',
      `ui-badge--${this.variant}`,
      `ui-badge--${this.size}`
    ];

    if (this.rounded) {
      classes.push('ui-badge--rounded');
    }

    if (this.dot) {
      classes.push('ui-badge--with-dot');
    }

    return classes;
  }
}
