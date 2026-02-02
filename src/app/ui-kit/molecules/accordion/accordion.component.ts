import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  AfterContentInit,
  booleanAttribute,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'ui-accordion-item',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="ui-accordion-item" [class.ui-accordion-item--expanded]="expanded()">
      <button
        type="button"
        class="ui-accordion-item__header"
        [disabled]="disabled"
        (click)="toggle()"
        [attr.aria-expanded]="expanded()"
      >
        <span class="ui-accordion-item__title">
          <ng-content select="[accordionTitle]"></ng-content>
        </span>
        <ui-icon
          [name]="expanded() ? 'chevron-up' : 'chevron-down'"
          size="sm"
          class="ui-accordion-item__icon"
        ></ui-icon>
      </button>

      <div
        class="ui-accordion-item__content-wrapper"
        [@expandCollapse]="expanded() ? 'expanded' : 'collapsed'"
      >
        <div class="ui-accordion-item__content">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ui-accordion-item {
      border: 1px solid #E4E4E7;
      border-radius: 8px;
      background-color: #FFFFFF;
      overflow: hidden;

      &--expanded {
        .ui-accordion-item__header {
          border-bottom: 1px solid #E4E4E7;
        }
      }

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 16px;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        transition: background-color 0.15s ease;

        &:hover:not(:disabled) {
          background-color: #FAFAFA;
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      }

      &__title {
        font-size: 14px;
        font-weight: 500;
        color: #18181B;
      }

      &__icon {
        color: #71717A;
        transition: transform 0.2s ease;
      }

      &__content-wrapper {
        overflow: hidden;
      }

      &__content {
        padding: 16px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', [
        animate('200ms ease-in-out')
      ])
    ])
  ]
})
export class AccordionItemComponent {
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute })
  set isExpanded(value: boolean) {
    this.expanded.set(value);
  }

  @Output() expandedChange = new EventEmitter<boolean>();

  expanded = signal(false);
  id = `accordion-item-${Math.random().toString(36).substr(2, 9)}`;

  toggle(): void {
    if (this.disabled) return;
    this.expanded.update(v => !v);
    this.expandedChange.emit(this.expanded());
  }

  expand(): void {
    this.expanded.set(true);
    this.expandedChange.emit(true);
  }

  collapse(): void {
    this.expanded.set(false);
    this.expandedChange.emit(false);
  }
}

@Component({
  selector: 'ui-accordion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-accordion" [class.ui-accordion--bordered]="bordered">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .ui-accordion {
      display: flex;
      flex-direction: column;
      gap: 8px;

      &--bordered {
        border: 1px solid #E4E4E7;
        border-radius: 8px;
        padding: 0;

        ::ng-deep .ui-accordion-item {
          border: none;
          border-radius: 0;
          border-bottom: 1px solid #E4E4E7;

          &:last-child {
            border-bottom: none;
          }
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccordionComponent implements AfterContentInit {
  @Input({ transform: booleanAttribute }) multiple = false;
  @Input({ transform: booleanAttribute }) bordered = false;

  @ContentChildren(AccordionItemComponent) items!: QueryList<AccordionItemComponent>;

  ngAfterContentInit(): void {
    if (!this.multiple) {
      this.items.forEach(item => {
        item.expandedChange.subscribe(() => {
          if (item.expanded()) {
            this.collapseOthers(item);
          }
        });
      });
    }
  }

  private collapseOthers(expandedItem: AccordionItemComponent): void {
    this.items.forEach(item => {
      if (item !== expandedItem && item.expanded()) {
        item.collapse();
      }
    });
  }

  expandAll(): void {
    this.items.forEach(item => item.expand());
  }

  collapseAll(): void {
    this.items.forEach(item => item.collapse());
  }
}
