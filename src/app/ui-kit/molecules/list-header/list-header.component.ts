import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'ui-list-header',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './list-header.component.html',
  styleUrls: ['./list-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListHeaderComponent {
  /**
   * Title of the list page
   */
  @Input() title = '';

  /**
   * Optional icon name to display before title (from icon registry)
   */
  @Input() icon?: string;

  /**
   * Optional count to display next to title
   */
  @Input() count?: number;

  /**
   * Label for the primary add button
   */
  @Input() addButtonLabel = 'Add item';

  /**
   * Whether to show the add button
   */
  @Input({ transform: booleanAttribute }) showAddButton = true;

  /**
   * Whether to show the search input
   */
  @Input({ transform: booleanAttribute }) showSearch = true;

  /**
   * Whether to show the refresh button
   */
  @Input({ transform: booleanAttribute }) showRefreshButton = false;

  /**
   * Whether to show the export button
   */
  @Input({ transform: booleanAttribute }) showExportButton = false;

  /**
   * Whether to show the bulk delete button
   */
  @Input({ transform: booleanAttribute }) showBulkDeleteButton = false;

  /**
   * Whether bulk delete is disabled
   */
  @Input({ transform: booleanAttribute }) isBulkDeleteDisabled = true;

  /**
   * Whether refresh is loading
   */
  @Input({ transform: booleanAttribute }) isRefreshLoading = false;

  /**
   * Search query value (supports two-way binding with searchQueryChange)
   */
  @Input() searchQuery = '';

  /**
   * Search input width
   */
  @Input() searchWidth = '220px';

  // Events - use searchQueryChange for two-way binding [(searchQuery)]
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() add = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() bulkDelete = new EventEmitter<void>();

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery = value;
    this.searchQueryChange.emit(value);
  }

  onAdd(): void {
    this.add.emit();
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onExport(): void {
    this.export.emit();
  }

  onBulkDelete(): void {
    this.bulkDelete.emit();
  }
}
