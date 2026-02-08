import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, TemplateRef, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  template?: TemplateRef<any>;
  headerTemplate?: TemplateRef<any>;
  width?: string;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | null;
}

/**
 * Data table component with CSS custom properties for styling customization.
 *
 * Available CSS custom properties (set on parent or :host):
 * --data-table-border: Table border (default: none)
 * --data-table-border-radius: Table border radius (default: 0)
 * --data-table-background: Table background (default: transparent)
 * --data-table-header-background: Header row background (default: #FFF)
 * --data-table-row-background: Data row background (default: transparent)
 * --data-table-row-hover-background: Row hover background (default: #FAFAFA)
 * --data-table-cell-padding: Cell padding (default: 16px)
 * --data-table-cell-border-color: Cell border color (default: #E4E4E7)
 */
@Component({
  selector: 'ui-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent {
  @Input({ required: true }) columns!: TableColumn[];
  @Input({ required: true }) data!: any[];
  @Input() sortColumn: string | null = null;
  @Input() sortDirection: 'asc' | 'desc' | null = null;
  @Input() showHeaders: boolean = true;
  @Input() emptyMessage: string = 'No results';

  // Styling inputs - these set CSS custom properties on the host element
  @Input() border?: string;
  @Input() borderRadius?: string;
  @Input() background?: string;
  @Input() headerBackground?: string;
  @Input() rowBackground?: string;
  @Input() rowHoverBackground?: string;

  @HostBinding('style.--data-table-border')
  get borderStyle() { return this.border; }

  @HostBinding('style.--data-table-border-radius')
  get borderRadiusStyle() { return this.borderRadius; }

  @HostBinding('style.--data-table-background')
  get backgroundStyle() { return this.background; }

  @HostBinding('style.--data-table-header-background')
  get headerBackgroundStyle() { return this.headerBackground; }

  @HostBinding('style.--data-table-row-background')
  get rowBackgroundStyle() { return this.rowBackground; }

  @HostBinding('style.--data-table-row-hover-background')
  get rowHoverBackgroundStyle() { return this.rowHoverBackground; }

  @Output() sort = new EventEmitter<SortEvent>();

  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    let direction: 'asc' | 'desc' | null = 'asc';

    if (this.sortColumn === column.key) {
      if (this.sortDirection === 'asc') {
        direction = 'desc';
      } else if (this.sortDirection === 'desc') {
        direction = null;
      }
    }

    this.sort.emit({ column: column.key, direction });
  }

  getSortIconClass(column: TableColumn): string {
    if (!column.sortable) return '';
    if (this.sortColumn !== column.key) return 'data-table__sort-icon';
    if (this.sortDirection === 'asc') return 'data-table__sort-icon data-table__sort-icon--asc';
    if (this.sortDirection === 'desc') return 'data-table__sort-icon data-table__sort-icon--desc';
    return 'data-table__sort-icon';
  }

  getCellValue(row: any, column: TableColumn): any {
    return row[column.key];
  }
}
