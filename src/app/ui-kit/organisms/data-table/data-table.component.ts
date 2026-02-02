import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
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
