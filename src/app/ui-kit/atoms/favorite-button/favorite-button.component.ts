import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  booleanAttribute
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type FavoriteButtonSize = 'sm' | 'md' | 'lg';
export type FavoriteButtonVariant = 'default' | 'outline' | 'ghost';

@Component({
  selector: 'ui-favorite-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './favorite-button.component.html',
  styleUrls: ['./favorite-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoriteButtonComponent {
  @Input() size: FavoriteButtonSize = 'md';
  @Input() variant: FavoriteButtonVariant = 'default';
  @Input({ transform: booleanAttribute }) active = false;
  @Input({ transform: booleanAttribute }) disabled = false;

  @Output() toggleFavorite = new EventEmitter<boolean>();

  onClick(event: Event): void {
    event.stopPropagation();
    if (!this.disabled) {
      this.toggleFavorite.emit(!this.active);
    }
  }

  get containerClasses(): string[] {
    const classes = [
      'ui-favorite-button',
      `ui-favorite-button--${this.size}`,
      `ui-favorite-button--${this.variant}`
    ];

    if (this.active) {
      classes.push('ui-favorite-button--active');
    }

    if (this.disabled) {
      classes.push('ui-favorite-button--disabled');
    }

    return classes;
  }

  get iconSize(): 'sm' | 'md' | 'lg' {
    switch (this.size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      default: return 'md';
    }
  }
}
