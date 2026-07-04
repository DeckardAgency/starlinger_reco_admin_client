import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, effect, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColumnDefinition } from './column-selector.model';

export type { ColumnDefinition } from './column-selector.model';

@Component({
    selector: 'app-column-selector',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './column-selector.component.html',
    styleUrls: ['./column-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnSelectorComponent {
    @Input() columns: ColumnDefinition[] = [];
    @Input() storageKey: string = 'table-columns';
    @Output() columnsChange = new EventEmitter<ColumnDefinition[]>();

    isOpen = signal(false);

    constructor(private elementRef: ElementRef) {
        // Attach the outside-click listener only while the dropdown is open,
        // instead of a permanent document-level HostListener.
        effect((onCleanup) => {
            if (!this.isOpen()) {
                return;
            }
            const handler = (event: Event) => {
                if (!this.elementRef.nativeElement.contains(event.target)) {
                    this.isOpen.set(false);
                }
            };
            document.addEventListener('click', handler);
            onCleanup(() => document.removeEventListener('click', handler));
        });
    }

    toggleDropdown(event: Event): void {
        event.stopPropagation();
        this.isOpen.update(value => !value);
    }

    toggleColumn(column: ColumnDefinition): void {
        if (column.locked) return;

        const updatedColumns = this.columns.map(col => {
            if (col.key === column.key) {
                return { ...col, visible: !col.visible };
            }
            return col;
        });

        this.columns = updatedColumns;
        this.saveToLocalStorage();
        this.columnsChange.emit(updatedColumns);
    }

    selectAll(): void {
        const updatedColumns = this.columns.map(col => ({
            ...col,
            visible: true
        }));

        this.columns = updatedColumns;
        this.saveToLocalStorage();
        this.columnsChange.emit(updatedColumns);
    }

    deselectAll(): void {
        const updatedColumns = this.columns.map(col => ({
            ...col,
            visible: col.locked ? true : false
        }));

        this.columns = updatedColumns;
        this.saveToLocalStorage();
        this.columnsChange.emit(updatedColumns);
    }

    private saveToLocalStorage(): void {
        const visibilityMap: Record<string, boolean> = {};
        this.columns.forEach(col => {
            visibilityMap[col.key] = col.visible;
        });
        localStorage.setItem(this.storageKey, JSON.stringify(visibilityMap));
    }

    get visibleCount(): number {
        return this.columns.filter(col => col.visible).length;
    }

    get totalCount(): number {
        return this.columns.length;
    }
}
