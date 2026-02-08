import { PaginationLinks } from '@models/pagination.model';

// Contact interface matching backend Contact entity
export interface Contact {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    id: number;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    otherPhone: string | null;
    homePhone: string | null;
    otherEmail: string | null;
    fax: string | null;
    dateOfBirth: string | null;
    isActive: number | null;
    description: string | null;
    accountId: string | null;
    titleId: number | null;
    departmentId: number | null;
    supportPersonId: number | null;
    supportLevelId: number | null;
    created: string;
    modified: string;
    // Resolved fields (populated client-side)
    account?: string;
}

// Contact collection response (matches API Platform JSON-LD format)
export interface ContactsResponse {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    member: Contact[];
    totalItems: number;
    view?: {
        '@id': string;
        '@type': string;
        first?: string;
        last?: string;
        previous?: string;
        next?: string;
    };
}

// Transformed response for easier UI consumption
export interface TransformedContactsResponse {
    contacts: Contact[];
    totalContacts: number;
    pagination: PaginationLinks;
    currentPage: number;
    totalPages: number;
}

// Create/Update DTOs
export interface CreateContactDto {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    otherPhone?: string | null;
    homePhone?: string | null;
    otherEmail?: string | null;
    fax?: string | null;
    dateOfBirth?: string | null;
    isActive?: number | null;
    description?: string | null;
    accountId?: string | null;
    titleId?: number | null;
    departmentId?: number | null;
    supportPersonId?: number | null;
    supportLevelId?: number | null;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {}
