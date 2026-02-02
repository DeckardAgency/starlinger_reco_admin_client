import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  HostListener,
  OnInit,
  OnDestroy,
  booleanAttribute,
  ChangeDetectorRef,
  inject,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../atoms/icon/icon.component';
import { SpinnerComponent } from '../../atoms/spinner/spinner.component';
import { ShimmerComponent } from '../../atoms/shimmer/shimmer.component';

export interface SearchSuggestion {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  type?: string;
  data?: unknown;
}

export interface RecentSearchItem {
  query: string;
  timestamp: number;
}

@Component({
  selector: 'ui-search',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SpinnerComponent, ShimmerComponent],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  @Input() placeholder = 'Search...';
  @Input() minLength = 2;
  @Input() debounceMs = 300;
  @Input({ transform: booleanAttribute }) showIcon = true;
  @Input({ transform: booleanAttribute }) showClear = true;
  @Input({ transform: booleanAttribute }) showShortcut = true;
  @Input() shortcutKey = 'K';
  @Input({ transform: booleanAttribute }) loading = false;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() suggestions: SearchSuggestion[] = [];
  @Input() recentSearches: RecentSearchItem[] = [];
  @Input({ transform: booleanAttribute }) showRecentSearches = true;
  @Input() maxSuggestions = 10;
  @Input() emptyMessage = 'No results found';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() variant: 'light' | 'dark' = 'light';

  @Output() search = new EventEmitter<string>();
  @Output() queryChange = new EventEmitter<string>();
  @Output() suggestionSelect = new EventEmitter<SearchSuggestion>();
  @Output() recentSearchSelect = new EventEmitter<RecentSearchItem>();
  @Output() clearRecentSearches = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  query = '';
  showDropdown = false;
  showRecent = false;
  activeIndex = -1;

  private searchSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(this.debounceMs),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      if (query.length >= this.minLength) {
        this.search.emit(query);
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  @HostListener('document:keydown', ['$event'])
  handleShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toUpperCase() === this.shortcutKey) {
      event.preventDefault();
      this.focusInput();
    }
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    const target = event.target as Node;
    const element = this.searchInput?.nativeElement?.closest('.ui-search');
    if (element && !element.contains(target)) {
      this.closeDropdown();
    }
  }

  onInput(): void {
    this.queryChange.emit(this.query);
    this.searchSubject.next(this.query);

    if (this.query.length >= this.minLength) {
      this.showDropdown = true;
      this.showRecent = false;
      this.activeIndex = -1;
    } else if (this.query.length === 0 && this.showRecentSearches && this.recentSearches.length > 0) {
      this.showRecent = true;
      this.showDropdown = false;
    } else {
      this.closeDropdown();
    }
    this.cdr.markForCheck();
  }

  onFocus(): void {
    this.focus.emit();
    if (this.query.length === 0 && this.showRecentSearches && this.recentSearches.length > 0) {
      this.showRecent = true;
      this.showDropdown = false;
    } else if (this.query.length >= this.minLength && this.suggestions.length > 0) {
      this.showDropdown = true;
    }
    this.cdr.markForCheck();
  }

  onBlur(): void {
    this.blur.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.showRecent ? this.recentSearches : this.suggestions;
    const maxIndex = items.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, maxIndex);
        this.cdr.markForCheck();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, -1);
        this.cdr.markForCheck();
        break;

      case 'Enter':
        event.preventDefault();
        if (this.activeIndex >= 0) {
          if (this.showRecent) {
            this.selectRecentSearch(this.recentSearches[this.activeIndex]);
          } else {
            this.selectSuggestion(this.suggestions[this.activeIndex]);
          }
        } else if (this.query.length >= this.minLength) {
          this.search.emit(this.query);
        }
        break;

      case 'Escape':
        this.closeDropdown();
        this.searchInput?.nativeElement?.blur();
        break;
    }
  }

  selectSuggestion(suggestion: SearchSuggestion): void {
    this.query = suggestion.label;
    this.suggestionSelect.emit(suggestion);
    this.closeDropdown();
    this.cdr.markForCheck();
  }

  selectRecentSearch(recent: RecentSearchItem): void {
    this.query = recent.query;
    this.recentSearchSelect.emit(recent);
    this.showRecent = false;
    this.searchSubject.next(this.query);
    this.cdr.markForCheck();
  }

  clearQuery(): void {
    this.query = '';
    this.queryChange.emit('');
    this.closeDropdown();
    this.focusInput();
    this.cdr.markForCheck();
  }

  onClearRecentSearches(): void {
    this.clearRecentSearches.emit();
    this.showRecent = false;
    this.cdr.markForCheck();
  }

  focusInput(): void {
    this.searchInput?.nativeElement?.focus();
  }

  private closeDropdown(): void {
    this.showDropdown = false;
    this.showRecent = false;
    this.activeIndex = -1;
    this.cdr.markForCheck();
  }

  get displayedSuggestions(): SearchSuggestion[] {
    return this.suggestions.slice(0, this.maxSuggestions);
  }

  get hasResults(): boolean {
    return this.suggestions.length > 0;
  }

  trackBySuggestion(index: number, item: SearchSuggestion): string {
    return item.id;
  }

  trackByRecent(index: number, item: RecentSearchItem): string {
    return item.query + item.timestamp;
  }
}
