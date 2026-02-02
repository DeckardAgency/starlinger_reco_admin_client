import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-spinner" [ngClass]="spinnerClasses" [ngStyle]="spinnerStyles" role="status" aria-label="Loading">
      <svg class="ui-spinner__svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle class="ui-spinner__track" cx="12" cy="12" r="10" fill="none" stroke-width="3"/>
        <circle class="ui-spinner__head" cx="12" cy="12" r="10" fill="none" stroke-width="3"/>
      </svg>
      <span class="ui-spinner__sr-only">Loading...</span>
    </div>
  `,
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() color: string = 'currentColor';

  private readonly sizeMap: Record<SpinnerSize, string> = {
    xs: '12px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px'
  };

  get spinnerClasses(): string[] {
    return [`ui-spinner--${this.size}`];
  }

  get spinnerStyles(): Record<string, string> {
    return {
      width: this.sizeMap[this.size],
      height: this.sizeMap[this.size],
      color: this.color
    };
  }
}
