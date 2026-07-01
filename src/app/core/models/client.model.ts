import { User } from '@models/auth.model';
import { PaginationLinks } from '@models/pagination.model';

// Address interface for client addresses
export interface ClientAddress {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    id: number;
    street: string;
    city: string;
    postalCode?: string;
    country?: {
        '@id'?: string;
        id: number;
        name: string;
        code: string;
    };
    isBilling: boolean;
    isDelivery: boolean;
    isActive: boolean;
    name?: string;
    phone?: string;
    email?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAddressDto {
    client: string; // IRI reference to client
    street: string;
    city: string;

    postalCode?: string;
    country?: string; // IRI reference to country
    isBilling?: boolean;
    isDelivery?: boolean;
    isActive?: boolean;
    name?: string;
    phone?: string;
    email?: string;
}

export interface UpdateAddressDto {
    street?: string;
    city?: string;

    postalCode?: string;
    country?: string; // IRI reference to country
    isBilling?: boolean;
    isDelivery?: boolean;
    isActive?: boolean;
    name?: string;
    phone?: string;
    email?: string;
}

// Base Client interface
export interface Client {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: number;
    name: string;
    code: string;
    description?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    vatNumber?: string;
    maxActiveUsers?: number | null;
    isActive: boolean;
    isArchived: boolean;
    purchaseLimit?: string | null;
    amountSpent?: string | null;
    otherPhone?: string | null;
    otherEmail?: string | null;
    fax?: string | null;
    web?: string | null;
    accountGroup?: {
        '@id'?: string;
        id: number;
        name: string;
    } | null;
    // Whether this client acts as an agent that manages/orders for other clients
    isClientAgent?: boolean;
    // Number of clients this agent manages (read-only, server-computed)
    managedClientCount?: number;
    createdAt: string;
    updatedAt: string;
}

// Extended Client interface with relations (for GET by ID)
export interface ClientDetail extends Client {
    users?: ClientUser[];
    productPrices?: ProductPrice[];
    addresses?: ClientAddress[];
    // Clients managed by this agent — serialized as IRIs (client:read:details)
    managedClients?: string[] | Client[];
}

// User reference within Client
export interface ClientUser {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: number;
    email: string;
    firstName: string;
    lastName: string;
}

// Product price configuration for client
export interface ProductPrice {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: number;
    product: string;  // IRI reference to product
    price: number;
    discountPercentage: number;
}

// Client collection response
export interface ClientsResponse {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    member: Client[];
    totalItems: number;
    view?: {
        '@id': string;
        type: string;
        first?: string;
        last?: string;
        previous?: string;
        next?: string;
    };
    search?: {
        '@type': string;
        template: string;
        variableRepresentation: string;
        mapping: Array<{
            '@type': string;
            variable: string;
            property: string;
            required: boolean;
        }>;
    };
}

// Transformed response for easier UI consumption
export interface TransformedClientsResponse {
    clients: Client[];
    totalClients: number;
    pagination: PaginationLinks;
    currentPage: number;
    totalPages: number;
}

// Create/Update DTOs
export interface CreateClientDto {
    name: string;
    code: string;
    description?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    vatNumber?: string;
    purchaseLimit?: string | null;
    otherPhone?: string | null;
    otherEmail?: string | null;
    fax?: string | null;
    web?: string | null;
    maxActiveUsers?: number | null;
    isActive?: boolean;
    isArchived?: boolean;
    accountGroup?: string | null;
    isClientAgent?: boolean;
    managedClients?: string[]; // IRI references to managed clients
}

export interface UpdateClientDto {
    name?: string;
    code?: string;
    description?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    vatNumber?: string;
    purchaseLimit?: string | null;
    otherPhone?: string | null;
    otherEmail?: string | null;
    fax?: string | null;
    web?: string | null;
    maxActiveUsers?: number | null;
    isActive?: boolean;
    isArchived?: boolean;
    accountGroup?: string | null;
    isClientAgent?: boolean;
    managedClients?: string[]; // IRI references to managed clients
}

// Error responses
export interface ValidationError {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    status: number;
    violations: Array<{
        propertyPath: string;
        message: string;
    }>;
    detail?: string;
    description?: string;
    type?: string;
    title?: string;
    instance?: string;
}

export interface ApiError {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    title: string;
    detail: string;
    status: number;
    instance?: string;
    type?: string;
    description?: string;
}
