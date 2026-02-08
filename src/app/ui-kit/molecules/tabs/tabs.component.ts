import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, computed, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  badge?: string | number;
}

export type TabsVariant = 'default' | 'pills' | 'underline';
export type TabsSize = 'sm' | 'md' | 'lg';

/**
 * Tabs component with CSS custom properties for styling customization.
 *
 * Available CSS custom properties (set on parent or via inputs):
 * --tabs-border-bottom: Bottom border (default: 1px solid #E4E4E7 for underline)
 * --tabs-height: Tab height (default: auto, 56px for underline)
 */
@Component({
  selector: 'ui-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() variant: TabsVariant = 'default';
  @Input() size: TabsSize = 'md';
  @Input() fullWidth = false;

  // Styling inputs
  @Input() borderBottom?: string;
  @Input() tabHeight?: string;

  @HostBinding('style.--tabs-border-bottom')
  get borderBottomStyle() { return this.borderBottom; }

  @HostBinding('style.--tabs-height')
  get tabHeightStyle() { return this.tabHeight; }

  @Input()
  set activeTab(value: string) {
    this._activeTab.set(value);
  }
  get activeTab(): string {
    return this._activeTab();
  }

  @Output() tabChange = new EventEmitter<string>();

  private _activeTab = signal<string>('');

  protected tabsClasses = computed(() => {
    const classes = [
      'ui-tabs',
      `ui-tabs--${this.variant}`,
      `ui-tabs--${this.size}`
    ];

    if (this.fullWidth) {
      classes.push('ui-tabs--full-width');
    }

    return classes;
  });

  isActive(tabId: string): boolean {
    return this._activeTab() === tabId;
  }

  selectTab(tab: TabItem): void {
    if (tab.disabled) return;

    this._activeTab.set(tab.id);
    this.tabChange.emit(tab.id);
  }

  trackByTabId(index: number, tab: TabItem): string {
    return tab.id;
  }
}
