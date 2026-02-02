import { PaginationLinks } from '@models/pagination.model';

// Area Criteria field type enum
export type CriteriaFieldType = 'country' | 'region' | 'postal_code' | 'city' | 'customer_type' | 'product_category' | 'custom';

// Area Criteria operator enum
export type CriteriaOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'between' | 'regex';

// Base Area interface (matches API response)
export interface Area {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: string;
    name: string;
    code: string;
    description?: string;
    client?: string | AreaClient; // Can be IRI string or expanded object
    parentArea?: Area | string | null; // Can be expanded object or IRI string
    childAreas?: (Area | string)[]; // Can be expanded objects or IRI strings
    areaManagers?: AreaManager[];
    areaCriteria?: AreaCriteria[];
    isActive?: boolean;
    priority: number;
    createdAt: string;
    updatedAt: string;
}

// Client reference within Area (when expanded)
export interface AreaClient {
    '@id': string;
    '@type': string;
    id: string;
    name: string;
    code: string;
}

// Extended Area interface with relations (alias for compatibility)
export interface AreaDetail extends Area {}

// Area Manager interface (matches API response)
export interface AreaManager {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: string;
    manager: string | AreaUser; // IRI string or expanded user object
    area?: Area | string; // IRI string or expanded area object (when fetched separately)
    // Additional fields that may be present when fetched with full details
    isPrimary?: boolean;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// User reference within AreaManager (when expanded)
export interface AreaUser {
    '@id': string;
    '@type': string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

// Area Criteria interface (matches API response)
export interface AreaCriteria {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: string;
    area?: Area | string;
    name: string;
    fieldType: CriteriaFieldType;
    operator: CriteriaOperator;
    value: string | string[]; // Can be single value or array (e.g., country codes)
    priority: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

// Area collection response
export interface AreasResponse {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    'hydra:member'?: Area[];
    member?: Area[];
    'hydra:totalItems'?: number;
    totalItems?: number;
    'hydra:view'?: {
        '@id': string;
        '@type': string;
        'hydra:first'?: string;
        'hydra:last'?: string;
        'hydra:previous'?: string;
        'hydra:next'?: string;
    };
    view?: {
        '@id': string;
        type: string;
        first?: string;
        last?: string;
        previous?: string;
        next?: string;
    };
}

// Transformed response for easier UI consumption
export interface TransformedAreasResponse {
    areas: Area[];
    totalAreas: number;
    pagination: PaginationLinks;
    currentPage: number;
    totalPages: number;
}

// Area Managers collection response
export interface AreaManagersResponse {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    'hydra:member'?: AreaManager[];
    member?: AreaManager[];
    'hydra:totalItems'?: number;
    totalItems?: number;
    'hydra:view'?: {
        '@id': string;
        '@type': string;
        'hydra:first'?: string;
        'hydra:last'?: string;
        'hydra:previous'?: string;
        'hydra:next'?: string;
    };
    view?: {
        '@id': string;
        type: string;
        first?: string;
        last?: string;
        previous?: string;
        next?: string;
    };
}

// Transformed Area Managers response
export interface TransformedAreaManagersResponse {
    areaManagers: AreaManager[];
    totalAreaManagers: number;
    pagination: PaginationLinks;
    currentPage: number;
    totalPages: number;
}

// Area Criteria collection response
export interface AreaCriteriaResponse {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    'hydra:member'?: AreaCriteria[];
    member?: AreaCriteria[];
    'hydra:totalItems'?: number;
    totalItems?: number;
}

// Create/Update DTOs
export interface CreateAreaDto {
    client?: string; // IRI reference
    parentArea?: string; // IRI reference
    name: string;
    code: string;
    description?: string;
    priority?: number;
}

export interface UpdateAreaDto {
    client?: string | null;
    parentArea?: string | null;
    name?: string;
    code?: string;
    description?: string;
    priority?: number;
}

export interface CreateAreaManagerDto {
    area: string; // IRI reference
    manager: string; // IRI reference to user
    isPrimary?: boolean;
    isActive?: boolean;
}

export interface UpdateAreaManagerDto {
    isPrimary?: boolean;
    isActive?: boolean;
}

export interface CreateAreaCriteriaDto {
    area: string; // IRI reference
    name: string;
    fieldType: CriteriaFieldType;
    operator: CriteriaOperator;
    value: string | string[];
    priority?: number;
    isActive?: boolean;
}

export interface UpdateAreaCriteriaDto {
    name?: string;
    fieldType?: CriteriaFieldType;
    operator?: CriteriaOperator;
    value?: string | string[];
    priority?: number;
    isActive?: boolean;
}

// Criteria field type options for UI
export const CRITERIA_FIELD_TYPE_OPTIONS = [
    { value: 'country', label: 'Country' },
    { value: 'region', label: 'Region' },
    { value: 'postal_code', label: 'Postal Code' },
    { value: 'city', label: 'City' },
    { value: 'customer_type', label: 'Customer Type' },
    { value: 'product_category', label: 'Product Category' },
    { value: 'custom', label: 'Custom' }
];

// Criteria operator options for UI
export const CRITERIA_OPERATOR_OPTIONS = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'in', label: 'In List' },
    { value: 'not_in', label: 'Not In List' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'between', label: 'Between' },
    { value: 'regex', label: 'Regex' }
];
