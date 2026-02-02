import { Component, ChangeDetectionStrategy, Input, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type LinkVariant = 'default' | 'primary' | 'muted';
export type LinkSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-link',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- External link -->
    <a
      *ngIf="href && !routerLink"
      [href]="href"
      [target]="external ? '_blank' : '_self'"
      [rel]="external ? 'noopener noreferrer' : null"
      [ngClass]="linkClasses"
    >
      <ng-container *ngTemplateOutlet="content"></ng-container>
    </a>

    <!-- Router link -->
    <a
      *ngIf="routerLink"
      [routerLink]="routerLink"
      [ngClass]="linkClasses"
    >
      <ng-container *ngTemplateOutlet="content"></ng-container>
    </a>

    <!-- Content template -->
    <ng-template #content>
      <ng-content></ng-content>
      <svg *ngIf="external && showExternalIcon" class="ui-link__external-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none">
        <path d="M12 8.667v4A1.333 1.333 0 0110.667 14H3.333A1.333 1.333 0 012 12.667V5.333A1.333 1.333 0 013.333 4h4M10 2h4v4M6.667 9.333L14 2" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </ng-template>
  `,
  styles: [`
    .ui-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      cursor: pointer;
      transition: color 0.2s ease;

      &:hover {
        text-decoration: underline;
      }

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
        border-radius: 2px;
      }

      // Variants
      &--default {
        color: #18181B;

        &:hover {
          color: #52525B;
        }
      }

      &--primary {
        color: #DC2626;

        &:hover {
          color: #B91C1C;
        }
      }

      &--muted {
        color: #71717A;

        &:hover {
          color: #52525B;
        }
      }

      // Sizes
      &--sm {
        font-size: 12px;
        line-height: 16px;
      }

      &--md {
        font-size: 14px;
        line-height: 20px;
      }

      &--lg {
        font-size: 16px;
        line-height: 24px;
      }

      // Disabled
      &--disabled {
        opacity: 0.6;
        pointer-events: none;
      }

      &__external-icon {
        width: 12px;
        height: 12px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkComponent {
  @Input() href?: string;
  @Input() routerLink?: string | string[];
  @Input() variant: LinkVariant = 'default';
  @Input() size: LinkSize = 'md';
  @Input({ transform: booleanAttribute }) external = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) showExternalIcon = true;

  get linkClasses(): string[] {
    const classes = [
      'ui-link',
      `ui-link--${this.variant}`,
      `ui-link--${this.size}`
    ];

    if (this.disabled) {
      classes.push('ui-link--disabled');
    }

    return classes;
  }
}
