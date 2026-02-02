import { Injectable } from '@angular/core';
import { ColumnDefinition } from '@shared/components/column-selector/column-selector.component';

@Injectable({
    providedIn: 'root'
})
export class ColumnSettingsService {
    private readonly STORAGE_PREFIX = 'table-columns-';

    /**
     * Load column settings from localStorage and merge with default columns
     * @param storageKey Unique key for the table (e.g., 'products', 'orders')
     * @param defaultColumns Default column definitions
     * @returns Merged column definitions with saved visibility settings
     */
    loadColumns(storageKey: string, defaultColumns: ColumnDefinition[]): ColumnDefinition[] {
        const savedSettings = this.getSavedSettings(storageKey);

        if (!savedSettings) {
            return [...defaultColumns];
        }

        return defaultColumns.map(col => ({
            ...col,
            visible: savedSettings[col.key] !== undefined ? savedSettings[col.key] : col.visible
        }));
    }

    /**
     * Save column visibility settings to localStorage
     * @param storageKey Unique key for the table
     * @param columns Current column definitions
     */
    saveColumns(storageKey: string, columns: ColumnDefinition[]): void {
        const visibilityMap: Record<string, boolean> = {};
        columns.forEach(col => {
            visibilityMap[col.key] = col.visible;
        });
        localStorage.setItem(this.getFullKey(storageKey), JSON.stringify(visibilityMap));
    }

    /**
     * Reset column settings to defaults
     * @param storageKey Unique key for the table
     */
    resetColumns(storageKey: string): void {
        localStorage.removeItem(this.getFullKey(storageKey));
    }

    /**
     * Check if a specific column is visible
     * @param storageKey Unique key for the table
     * @param columnKey Column key to check
     * @param defaultVisible Default visibility if not saved
     */
    isColumnVisible(storageKey: string, columnKey: string, defaultVisible: boolean = true): boolean {
        const savedSettings = this.getSavedSettings(storageKey);
        if (!savedSettings) {
            return defaultVisible;
        }
        return savedSettings[columnKey] !== undefined ? savedSettings[columnKey] : defaultVisible;
    }

    /**
     * Get saved settings from localStorage
     */
    private getSavedSettings(storageKey: string): Record<string, boolean> | null {
        const saved = localStorage.getItem(this.getFullKey(storageKey));
        if (!saved) {
            return null;
        }
        try {
            return JSON.parse(saved);
        } catch {
            return null;
        }
    }

    /**
     * Get full storage key with prefix
     */
    private getFullKey(storageKey: string): string {
        return `${this.STORAGE_PREFIX}${storageKey}`;
    }
}
