import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-avatar" [ngClass]="avatarClasses" [ngStyle]="avatarStyles">
      <!-- Image -->
      <img
        *ngIf="src && !imageError"
        [src]="src"
        [alt]="alt"
        class="ui-avatar__image"
        (error)="onImageError()"
      />

      <!-- Initials fallback -->
      <span *ngIf="!src || imageError" class="ui-avatar__initials">
        {{ initials }}
      </span>

      <!-- Status indicator -->
      <span *ngIf="status" class="ui-avatar__status" [ngClass]="'ui-avatar__status--' + status"></span>
    </div>
  `,
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() alt = '';
  @Input() name = '';
  @Input() size: AvatarSize = 'md';
  @Input() shape: AvatarShape = 'circle';
  @Input() status?: 'online' | 'offline' | 'away' | 'busy';
  @Input() backgroundColor?: string;

  imageError = false;

  private readonly sizeMap: Record<AvatarSize, string> = {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '64px'
  };

  private readonly fontSizeMap: Record<AvatarSize, string> = {
    xs: '10px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px'
  };

  get initials(): string {
    if (!this.name) return '?';

    const parts = this.name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  get avatarClasses(): string[] {
    const classes = [
      `ui-avatar--${this.size}`,
      `ui-avatar--${this.shape}`
    ];

    if (this.status) {
      classes.push('ui-avatar--has-status');
    }

    return classes;
  }

  get avatarStyles(): Record<string, string> {
    const styles: Record<string, string> = {
      width: this.sizeMap[this.size],
      height: this.sizeMap[this.size],
      fontSize: this.fontSizeMap[this.size]
    };

    if (this.backgroundColor) {
      styles['backgroundColor'] = this.backgroundColor;
    }

    return styles;
  }

  onImageError(): void {
    this.imageError = true;
  }
}
