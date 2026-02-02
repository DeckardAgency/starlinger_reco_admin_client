# ColumnSelectorComponent

A reusable component for managing table column visibility with localStorage persistence.

## Overview

The `ColumnSelectorComponent` provides a dropdown interface that allows users to show/hide table columns. Selected preferences are automatically saved to localStorage and restored on page reload.

## Installation

The component is located at:
```
src/app/shared/components/column-selector/
├── column-selector.component.ts
├── column-selector.component.html
└── column-selector.component.scss
```

Supporting service:
```
src/app/core/services/column-settings.service.ts
```

## Basic Usage

### 1. Import the component and service

```typescript
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';
```

### 2. Add to component imports

```typescript
@Component({
    selector: 'app-your-list',
    imports: [CommonModule, ColumnSelectorComponent],
    // ...
})
```

### 3. Define column configuration

```typescript
export class YourListComponent {
    private columnSettingsService = inject(ColumnSettingsService);

    // Unique key for localStorage (use descriptive name)
    readonly COLUMN_STORAGE_KEY = 'your-feature-list';

    // Define all available columns
    readonly DEFAULT_COLUMNS: ColumnDefinition[] = [
        { key: 'name', label: 'Name', visible: true, locked: true },
        { key: 'email', label: 'Email', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'createdAt', label: 'Created', visible: false },
        { key: 'updatedAt', label: 'Updated', visible: false },
    ];

    // Current column state
    tableColumns: ColumnDefinition[] = [];

    constructor() {
        // Load saved settings or use defaults
        this.tableColumns = this.columnSettingsService.loadColumns(
            this.COLUMN_STORAGE_KEY,
            this.DEFAULT_COLUMNS
        );
    }
}
```

### 4. Add event handler

```typescript
onColumnsChange(columns: ColumnDefinition[]): void {
    this.tableColumns = columns;
    this.columnSettingsService.saveColumns(this.COLUMN_STORAGE_KEY, columns);
}

isColumnVisible(key: string): boolean {
    const column = this.tableColumns.find(col => col.key === key);
    return column ? column.visible : true;
}
```

### 5. Add to template

```html
<!-- In your header/actions area -->
<app-column-selector
    [columns]="tableColumns"
    [storageKey]="COLUMN_STORAGE_KEY"
    (columnsChange)="onColumnsChange($event)">
</app-column-selector>

<!-- In your table -->
<table>
    <thead>
        <tr>
            <th *ngIf="isColumnVisible('name')">Name</th>
            <th *ngIf="isColumnVisible('email')">Email</th>
            <th *ngIf="isColumnVisible('status')">Status</th>
            <th *ngIf="isColumnVisible('createdAt')">Created</th>
            <th *ngIf="isColumnVisible('updatedAt')">Updated</th>
            <th>Actions</th> <!-- Always visible -->
        </tr>
    </thead>
    <tbody>
        <tr *ngFor="let item of items">
            <td *ngIf="isColumnVisible('name')">{{ item.name }}</td>
            <td *ngIf="isColumnVisible('email')">{{ item.email }}</td>
            <td *ngIf="isColumnVisible('status')">{{ item.status }}</td>
            <td *ngIf="isColumnVisible('createdAt')">{{ item.createdAt | date }}</td>
            <td *ngIf="isColumnVisible('updatedAt')">{{ item.updatedAt | date }}</td>
            <td><!-- action buttons --></td>
        </tr>
    </tbody>
</table>
```

## API Reference

### ColumnDefinition Interface

```typescript
interface ColumnDefinition {
    key: string;      // Unique identifier for the column
    label: string;    // Display name shown in the dropdown
    visible: boolean; // Whether column is visible by default
    locked?: boolean; // If true, column cannot be hidden (optional)
}
```

### Component Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `columns` | `ColumnDefinition[]` | `[]` | Array of column definitions |
| `storageKey` | `string` | `'table-columns'` | Unique key for localStorage |

### Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `columnsChange` | `EventEmitter<ColumnDefinition[]>` | Emitted when column visibility changes |

### ColumnSettingsService Methods

```typescript
// Load columns with saved visibility from localStorage
loadColumns(storageKey: string, defaultColumns: ColumnDefinition[]): ColumnDefinition[]

// Save current column visibility to localStorage
saveColumns(storageKey: string, columns: ColumnDefinition[]): void

// Reset to defaults (removes saved settings)
resetColumns(storageKey: string): void

// Check if specific column is visible
isColumnVisible(storageKey: string, columnKey: string, defaultVisible?: boolean): boolean
```

## Features

### Locked Columns
Columns marked with `locked: true` cannot be hidden. They appear with a lock icon and disabled checkbox.

```typescript
{ key: 'name', label: 'Name', visible: true, locked: true }
```

### Default Hidden Columns
Columns can be hidden by default but available for users to enable:

```typescript
{ key: 'internalId', label: 'Internal ID', visible: false }
```

### Bulk Actions
The dropdown provides "Select all" and "Deselect all" buttons for quick toggling.

### Auto-close
The dropdown closes automatically when clicking outside.

## localStorage Format

Settings are stored as JSON with the key format: `table-columns-{storageKey}`

```json
{
    "name": true,
    "email": true,
    "status": false,
    "createdAt": true
}
```

## Styling

The component uses BEM naming convention with the `.column-selector` block. Override styles by targeting:

```scss
// Trigger button
.column-selector__trigger { }

// Dropdown container
.column-selector__dropdown { }

// Individual column items
.column-selector__item { }

// Checkbox styling
.column-selector__checkbox { }
.column-selector__checkmark { }
```

## Complete Example

```typescript
// orders-list.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnSelectorComponent, ColumnDefinition } from '@shared/components/column-selector/column-selector.component';
import { ColumnSettingsService } from '@core/services/column-settings.service';

@Component({
    selector: 'app-orders-list',
    standalone: true,
    imports: [CommonModule, ColumnSelectorComponent],
    template: `
        <div class="orders-list__header">
            <h1>Orders</h1>
            <div class="orders-list__actions">
                <app-column-selector
                    [columns]="tableColumns"
                    [storageKey]="COLUMN_STORAGE_KEY"
                    (columnsChange)="onColumnsChange($event)">
                </app-column-selector>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th *ngIf="isColumnVisible('orderNumber')">Order #</th>
                    <th *ngIf="isColumnVisible('customer')">Customer</th>
                    <th *ngIf="isColumnVisible('total')">Total</th>
                    <th *ngIf="isColumnVisible('status')">Status</th>
                    <th *ngIf="isColumnVisible('date')">Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr *ngFor="let order of orders">
                    <td *ngIf="isColumnVisible('orderNumber')">{{ order.orderNumber }}</td>
                    <td *ngIf="isColumnVisible('customer')">{{ order.customer }}</td>
                    <td *ngIf="isColumnVisible('total')">{{ order.total | currency }}</td>
                    <td *ngIf="isColumnVisible('status')">{{ order.status }}</td>
                    <td *ngIf="isColumnVisible('date')">{{ order.date | date }}</td>
                    <td>
                        <button (click)="viewOrder(order)">View</button>
                    </td>
                </tr>
            </tbody>
        </table>
    `
})
export class OrdersListComponent {
    private columnSettingsService = inject(ColumnSettingsService);

    readonly COLUMN_STORAGE_KEY = 'orders-list';
    readonly DEFAULT_COLUMNS: ColumnDefinition[] = [
        { key: 'orderNumber', label: 'Order #', visible: true, locked: true },
        { key: 'customer', label: 'Customer', visible: true },
        { key: 'total', label: 'Total', visible: true },
        { key: 'status', label: 'Status', visible: true },
        { key: 'date', label: 'Date', visible: true },
    ];

    tableColumns: ColumnDefinition[] = [];
    orders: any[] = [];

    constructor() {
        this.tableColumns = this.columnSettingsService.loadColumns(
            this.COLUMN_STORAGE_KEY,
            this.DEFAULT_COLUMNS
        );
    }

    onColumnsChange(columns: ColumnDefinition[]): void {
        this.tableColumns = columns;
        this.columnSettingsService.saveColumns(this.COLUMN_STORAGE_KEY, columns);
    }

    isColumnVisible(key: string): boolean {
        const column = this.tableColumns.find(col => col.key === key);
        return column ? column.visible : true;
    }

    viewOrder(order: any): void {
        // Navigate to order detail
    }
}
```

## Best Practices

1. **Use descriptive storage keys** - Include the feature name (e.g., `'products-list'`, `'users-list'`)

2. **Lock essential columns** - Always lock at least one identifying column (name, ID, etc.)

3. **Set sensible defaults** - Show the most commonly needed columns by default

4. **Keep Actions column always visible** - Don't include action columns in the selector

5. **Match keys to data properties** - Use the same key names as your data model when possible

6. **Consider mobile** - Hide less important columns by default for better mobile experience

## Troubleshooting

### Columns not persisting
- Check that `storageKey` is unique across the application
- Verify localStorage is not being cleared
- Check browser dev tools > Application > Local Storage

### Column visibility not updating
- Ensure `onColumnsChange` handler updates `tableColumns`
- Verify `isColumnVisible()` is being called with correct key
- Check for typos in column keys

### Dropdown not closing
- The component uses `@HostListener('document:click')` for outside clicks
- Ensure event propagation isn't being stopped incorrectly
