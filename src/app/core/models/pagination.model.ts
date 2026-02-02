export interface PaginationLinks {
    first?: string;
    last?: string;
    next?: string;
    previous?: string;
}

export interface PaginatedResponse<T = unknown> {
    '@context': string;
    '@id': string;
    '@type': string;
    'totalItems': number;
    'member': T[];
    'view': {
        '@id': string;
        '@type': string;
        'first'?: string;
        'last'?: string;
        'next'?: string;
        'previous'?: string;
    };
}
