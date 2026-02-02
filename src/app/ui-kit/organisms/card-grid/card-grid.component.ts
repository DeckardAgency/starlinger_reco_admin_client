import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShimmerComponent } from '../../atoms/shimmer/shimmer.component';
import { EmptyStateComponent } from '../../molecules/empty-state/empty-state.component';
import { PaginationComponent } from '../../molecules/pagination/pagination.component';

export type CardGridColumns = 1 | 2 | 3 | 4 | 5 | 6;
export type CardGridGap = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-card-grid',
  standalone: true,
  imports: [CommonModule, ShimmerComponent, EmptyStateComponent, PaginationComponent],
  templateUrl: './card-grid.component.html',
  styleUrls: ['./card-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardGridComponent<T = unknown> {
  @Input() items: T[] = [];
  @Input() columns: CardGridColumns = 3;
  @Input() gap: CardGridGap = 'md';
  @Input() loading = false;
  @Input() loadingCount = 6;

  // Responsive columns
  @Input() columnsSm: CardGridColumns = 1;
  @Input() columnsMd: CardGridColumns = 2;
  @Input() columnsLg?: CardGridColumns;

  // Pagination
  @Input() paginated = false;
  @Input() pageSize = 12;
  @Input() totalItems = 0;
  @Input() currentPage = 1;

  // Empty state
  @Input() emptyTitle = 'No items found';
  @Input() emptyDescription = '';
  @Input() emptyIcon: 'inbox' | 'search' | 'file' | 'cart' = 'inbox';
  @Input() emptyActionLabel = '';

  @Output() pageChange = new EventEmitter<number>();
  @Output() emptyAction = new EventEmitter<void>();

  @ContentChild('cardTemplate') cardTemplate?: TemplateRef<{ $implicit: T; index: number }>;
  @ContentChild('loadingTemplate') loadingTemplate?: TemplateRef<unknown>;

  get gridClasses(): string[] {
    return [
      'ui-card-grid',
      `ui-card-grid--cols-${this.columns}`,
      `ui-card-grid--gap-${this.gap}`,
      `ui-card-grid--cols-sm-${this.columnsSm}`,
      `ui-card-grid--cols-md-${this.columnsMd}`,
      `ui-card-grid--cols-lg-${this.columnsLg || this.columns}`
    ];
  }

  getLoadingItems(): number[] {
    return Array(this.loadingCount).fill(0).map((_, i) => i);
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onEmptyAction(): void {
    this.emptyAction.emit();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
