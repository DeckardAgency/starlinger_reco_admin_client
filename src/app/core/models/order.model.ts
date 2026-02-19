import { PaginationLinks } from '@models/pagination.model';
import {User} from "@models/auth.model";

export interface OrderProduct {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: number;
    name: string;
    partNo: string;
    weight: string;
    price: number;
}

export interface OrderItem {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: number;
    orderRef?: string;
    product: OrderProduct;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    createdAt: string;
    updatedAt: string;
    isCustomPrice?: boolean;
}

export interface OrderLog {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: number;
    previousStatus: string;
    newStatus: string;
    comment: string;
    createdAt: string;
}

export interface Order {
    '@context'?: string;
    '@id': string;
    '@type': string;
    id: number;
    orderNumber: string;
    status: string;
    totalAmount: number;
    notes?: string;
    shippingAddress: string;
    billingAddress: string;
    createdAt: string;
    updatedAt: string;
    isDraft?: boolean;
    lastSavedAt: string;
    items: OrderItem[];
    user: User;
    logs?: OrderLog[];
    // Tracking fields (for dispatched status)
    trackingNumber?: string;
    trackingCarrier?: string;
    trackingUrl?: string;
    dispatchedAt?: string;
    dispatchedBy?: User;
    // Cancellation fields (for canceled status)
    cancellationReason?: string;
    cancelledAt?: string;
    cancelledBy?: User;
}

// Tracking carrier options
export const TRACKING_CARRIERS = [
    { value: 'dhl', label: 'DHL' },
    { value: 'ups', label: 'UPS' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'dpd', label: 'DPD' },
    { value: 'gls', label: 'GLS' },
    { value: 'other', label: 'Other' }
];

export interface OrdersResponse {
    '@context': string;
    '@id': string;
    '@type': string;
    totalItems: number;
    member: Order[];
    view?: {
        '@id': string;
        '@type': string;
        'first'?: string;
        'last'?: string;
        'next'?: string;
        'previous'?: string;
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

export interface TransformedOrdersResponse {
    orders: Order[];
    totalOrders: number;
    pagination: PaginationLinks;
    currentPage: number;
    totalPages: number;
}
