import { PaginationView, SearchConfig } from './machine.model';

/**
 * Machine Category interface
 */
export interface MachineCategory {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    id: string;
    name: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Machine Category collection response interface
 */
export interface MachineCategoryCollection {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    member: MachineCategory[];
    totalItems: number;
    view?: PaginationView;
    search?: SearchConfig;
}

/**
 * Machine Category create/update request interface
 */
export interface MachineCategoryRequest {
    name: string;
    description?: string;
}
