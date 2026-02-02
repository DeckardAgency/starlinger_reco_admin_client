import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'outlined' | 'elevated';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() padding: CardPadding = 'md';
  @Input({ transform: booleanAttribute }) hoverable = false;
  @Input({ transform: booleanAttribute }) clickable = false;
  @Input() imageUrl?: string;
  @Input() imageAlt = '';
  @Input() imageHeight = '200px';

  @Output() cardClick = new EventEmitter<void>();

  get cardClasses(): string[] {
    const classes = [
      'ui-card',
      `ui-card--${this.variant}`,
      `ui-card--padding-${this.padding}`
    ];

    if (this.hoverable) {
      classes.push('ui-card--hoverable');
    }

    if (this.clickable) {
      classes.push('ui-card--clickable');
    }

    return classes;
  }

  onClick(): void {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }
}
