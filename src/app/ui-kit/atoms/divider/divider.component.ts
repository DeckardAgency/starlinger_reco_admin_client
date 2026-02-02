import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerVariant = 'solid' | 'dashed' | 'dotted';

@Component({
  selector: 'ui-divider',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-divider" [ngClass]="dividerClasses">
      <span *ngIf="label && orientation === 'horizontal'" class="ui-divider__label">
        {{ label }}
      </span>
    </div>
  `,
  styles: [`
    .ui-divider {
      display: flex;
      align-items: center;

      &--horizontal {
        width: 100%;
        height: 1px;
        background-color: #E4E4E7;

        &.ui-divider--with-label {
          height: auto;
          background: none;

          &::before,
          &::after {
            content: '';
            flex: 1;
            height: 1px;
            background-color: #E4E4E7;
          }
        }
      }

      &--vertical {
        height: 100%;
        width: 1px;
        background-color: #E4E4E7;
      }

      &--dashed {
        background: none;
        border-style: dashed;

        &.ui-divider--horizontal {
          border-top: 1px dashed #E4E4E7;
        }

        &.ui-divider--vertical {
          border-left: 1px dashed #E4E4E7;
        }
      }

      &--dotted {
        background: none;
        border-style: dotted;

        &.ui-divider--horizontal {
          border-top: 1px dotted #E4E4E7;
        }

        &.ui-divider--vertical {
          border-left: 1px dotted #E4E4E7;
        }
      }

      &__label {
        padding: 0 16px;
        font-size: 12px;
        color: #71717A;
        white-space: nowrap;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DividerComponent {
  @Input() orientation: DividerOrientation = 'horizontal';
  @Input() variant: DividerVariant = 'solid';
  @Input() label?: string;

  get dividerClasses(): string[] {
    const classes = [
      `ui-divider--${this.orientation}`,
      `ui-divider--${this.variant}`
    ];

    if (this.label && this.orientation === 'horizontal') {
      classes.push('ui-divider--with-label');
    }

    return classes;
  }
}
