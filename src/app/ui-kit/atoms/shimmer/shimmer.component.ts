import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ShimmerShape = 'rectangle' | 'circle' | 'text';

@Component({
  selector: 'ui-shimmer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="ui-shimmer"
      [ngClass]="shimmerClasses"
      [ngStyle]="shimmerStyles"
    ></div>
  `,
  styleUrls: ['./shimmer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShimmerComponent {
  @Input() width: string = '100%';
  @Input() height: string = '20px';
  @Input() shape: ShimmerShape = 'rectangle';
  @Input() borderRadius: string = '';
  @Input() animated = true;

  get shimmerClasses(): string[] {
    const classes = [`ui-shimmer--${this.shape}`];

    if (this.animated) {
      classes.push('ui-shimmer--animated');
    }

    return classes;
  }

  get shimmerStyles(): Record<string, string> {
    const styles: Record<string, string> = {
      width: this.width,
      height: this.height
    };

    if (this.borderRadius) {
      styles['borderRadius'] = this.borderRadius;
    }

    // For circle, ensure equal width and height
    if (this.shape === 'circle') {
      styles['height'] = this.width;
    }

    return styles;
  }
}
