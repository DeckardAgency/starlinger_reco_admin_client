export interface ColumnDefinition {
    key: string;
    label: string;
    visible: boolean;
    locked?: boolean; // If true, column cannot be hidden
}
