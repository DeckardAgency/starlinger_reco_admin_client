export interface SupportTicket {
  '@id': string;
  '@type': string;
  id: string;
  subject: string;
  message: string;
  orderId?: string;
  machine?: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachment?: {
    '@id': string;
    '@type': string;
    id: string;
    filename: string;
    mimeType: string;
    filePath: string;
    createdAt: string;
    updatedAt: string;
  };
  user?: {
    '@id': string;
    '@type': string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    roles: string[];
    createdAt: string;
    updatedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketsResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  'totalItems': number;
  'member': SupportTicket[];
  'view'?: {
    '@id': string;
    '@type': string;
    'first'?: string;
    'last'?: string;
    'previous'?: string;
    'next'?: string;
  };
}

export interface TransformedSupportTicketsResponse {
  tickets: SupportTicket[];
  totalTickets: number;
  pagination: {
    first?: string;
    last?: string;
    next?: string;
    previous?: string;
  };
  currentPage: number;
  totalPages: number;
}
