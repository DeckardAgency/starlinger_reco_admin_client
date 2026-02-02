import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'ui-table-footer',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  templateUrl: './table-footer.component.html',
  styleUrls: ['./table-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableFooterComponent {
  /**
   * Starting index of displayed items (1-based)
   */
  @Input() showingFrom = 1;

  /**
   * Ending index of displayed items
   */
  @Input() showingTo = 0;

  /**
   * Total number of items
   */
  @Input() totalItems = 0;

  /**
   * Whether to show pagination controls
   */
  @Input() showPagination = false;

  /**
   * Current page (1-based)
   */
  @Input() currentPage = 1;

  /**
   * Number of items per page
   */
  @Input() itemsPerPage = 10;

  // Events
  @Output() pageChange = new EventEmitter<number>();

  get infoText(): string {
    if (this.totalItems === 0) {
      return '';
    }
    return `Showing ${this.showingFrom} to ${this.showingTo} from ${this.totalItems} results`;
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }
}
