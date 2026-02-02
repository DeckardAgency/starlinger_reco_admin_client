import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  route?: string | string[];
  icon?: string;
}

@Component({
  selector: 'ui-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbsComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() separator: 'chevron' | 'slash' | 'arrow' | 'line' = 'chevron';
  @Input() showHome = true;
  @Input() homeRoute = '/admin/dashboard';
  
  /**
   * Variant determines the layout style:
   * - 'inline': Standard inline breadcrumb (default)
   * - 'page-header': Full-width page header with border and background
   */
  @Input() variant: 'inline' | 'page-header' = 'inline';

  trackByIndex(index: number): number {
    return index;
  }
}
