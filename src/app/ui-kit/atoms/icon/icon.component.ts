import { Component, ChangeDetectionStrategy, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICON_REGISTRY } from './icon-registry';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;

@Component({
  selector: 'ui-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="ui-icon"
      [ngClass]="iconClass"
      [ngStyle]="iconStyles"
      [innerHTML]="svgIcon"
    ></span>
  `,
  styles: [`
    .ui-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    :host ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconComponent implements OnChanges {
  @Input() name!: string;
  @Input() size: IconSize = 'md';
  @Input() color: string = 'currentColor';

  svgIcon: SafeHtml | null = null;
  iconClass: string = '';
  iconStyles: Record<string, string> = {};

  private readonly sizeMap: Record<string, string> = {
    xs: '12px',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px'
  };

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    this.updateIcon();
  }

  private updateIcon(): void {
    const icon = ICON_REGISTRY[this.name];

    if (icon) {
      this.iconClass = `ui-icon--${this.name}`;

      const resolvedSize = this.sizeMap[this.size] || this.size;

      // Add size and color styles to SVG markup
      const svg = icon.replace(
        '<svg',
        `<svg style="width:${resolvedSize};height:${resolvedSize};color:${this.color}"`
      );

      this.svgIcon = this.sanitizer.bypassSecurityTrustHtml(svg);

      this.iconStyles = {
        width: resolvedSize,
        height: resolvedSize,
        color: this.color
      };
    } else {
      console.warn(`[ui-icon] Icon "${this.name}" not found in registry`);
      this.svgIcon = null;
    }
  }
}
