import {
  Component,
  ChangeDetectionStrategy,
  Input,
  booleanAttribute
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type PriceDisplaySize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-price-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-display.component.html',
  styleUrls: ['./price-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PriceDisplayComponent {
  @Input() value: number | null | undefined = 0;
  @Input() originalValue?: number; // For showing crossed-out original price
  @Input() currency = '€';
  @Input() currencyPosition: 'before' | 'after' = 'before';
  @Input() locale = 'de-DE';
  @Input() size: PriceDisplaySize = 'md';
  @Input({ transform: booleanAttribute }) showDecimals = true;
  @Input({ transform: booleanAttribute }) highlight = false;
  @Input() label?: string;

  get formattedValue(): string {
    return this.formatPrice(this.value);
  }

  get formattedOriginalValue(): string | null {
    if (this.originalValue === undefined || this.originalValue === null) {
      return null;
    }
    return this.formatPrice(this.originalValue);
  }

  get hasDiscount(): boolean {
    return this.originalValue !== undefined &&
           this.originalValue !== null &&
           this.value !== null &&
           this.value !== undefined &&
           this.originalValue > this.value;
  }

  get discountPercentage(): number {
    if (!this.hasDiscount || !this.originalValue || !this.value) return 0;
    return Math.round(((this.originalValue - this.value) / this.originalValue) * 100);
  }

  private formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined) {
      return '0.00';
    }

    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: this.showDecimals ? 2 : 0,
      maximumFractionDigits: this.showDecimals ? 2 : 0
    };

    return price.toLocaleString(this.locale, options);
  }

  get containerClasses(): string[] {
    const classes = ['ui-price-display', `ui-price-display--${this.size}`];

    if (this.highlight) {
      classes.push('ui-price-display--highlight');
    }

    if (this.hasDiscount) {
      classes.push('ui-price-display--has-discount');
    }

    return classes;
  }
}
