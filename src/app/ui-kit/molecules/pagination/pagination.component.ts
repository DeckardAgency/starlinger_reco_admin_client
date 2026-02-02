import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PaginationSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() itemsPerPage = 10;
  @Input() size: PaginationSize = 'md';
  @Input() showFirstLast = true;
  @Input() maxVisiblePages = 5;

  @Input()
  set currentPage(value: number) {
    this._currentPage.set(value);
  }
  get currentPage(): number {
    return this._currentPage();
  }

  @Output() pageChange = new EventEmitter<number>();

  private _currentPage = signal(1);

  protected totalPages = computed(() =>
    Math.ceil(this.totalItems / this.itemsPerPage)
  );

  protected visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this._currentPage();
    const max = this.maxVisiblePages;

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor(max / 2);
    let start = current - half;
    let end = current + half;

    if (start < 1) {
      start = 1;
      end = max;
    }

    if (end > total) {
      end = total;
      start = total - max + 1;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  protected isFirstPage = computed(() => this._currentPage() === 1);
  protected isLastPage = computed(() => this._currentPage() === this.totalPages());

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this._currentPage()) {
      return;
    }
    this._currentPage.set(page);
    this.pageChange.emit(page);
  }

  goToPrevious(): void {
    this.goToPage(this._currentPage() - 1);
  }

  goToNext(): void {
    this.goToPage(this._currentPage() + 1);
  }

  goToFirst(): void {
    this.goToPage(1);
  }

  goToLast(): void {
    this.goToPage(this.totalPages());
  }

  trackByPage(index: number, page: number): number {
    return page;
  }
}
