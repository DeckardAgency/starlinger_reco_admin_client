/**
 * JWT Token Payload Interface
 * Represents the decoded JWT token structure from the API
 */
export interface TokenPayload {
  // User identification (JWT claim is 'email', legacy tokens may have 'username')
  email: string;
  username?: string;
  roles: string[];

  // JWT standard claims (RFC 7519)
  iss?: string;      // Issuer
  sub?: string;      // Subject (usually user ID)
  aud?: string;      // Audience
  exp: number;       // Expiration time (Unix timestamp)
  iat: number;       // Issued at (Unix timestamp)
  nbf?: number;      // Not before (Unix timestamp)
  jti?: string;      // JWT ID

  // Additional custom claims from Symfony/API Platform
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface User {
  id: number;
  email: string;
  roles: string[];
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  orders?: string[];
  username?: string;
  isActive?: boolean;
  client?: {
    '@id': string;
    '@type': string;
    id: number;
    name: string;
    code: string;
    isActive: boolean;
    isArchived: boolean;
    maxActiveUsers?: number;
  };
}

export interface UserCollectionResponse {
  '@context': string;
  '@id': string;
  '@type': string;
  totalItems: number;
  member: UserMember[];
  view: {
    '@id': string;
    '@type': string;
  };
  search: {
    '@type': string;
    template: string;
    variableRepresentation: string;
    mapping: {
      '@type': string;
      variable: string;
      property: string;
      required: boolean;
    }[];
  };
}

export interface UserMember {
  '@id': string;
  '@type': string;
  id: number;
  email: string;
  roles: string[];
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  orders: string[];
  isActive?: boolean;
  client?: {
    '@id': string;
    '@type': string;
    id: number;
    name: string;
    code: string;
    isActive: boolean;
    isArchived: boolean;
    maxActiveUsers?: number;
  };
}

// =============================================================================
// ROLE DEFINITIONS
// =============================================================================

/**
 * User roles for the RECO application
 * - ROLE_USER: Base role (all authenticated users)
 * - ROLE_CLIENT: Customer role (shop, orders, search)
 * - ROLE_CLIENT_ADMIN: Customer Admin role (manages client users)
 * - ROLE_ADMIN: Starlinger Admin role (full system access)
 */
export const USER_ROLES = {
  USER: 'ROLE_USER',
  CLIENT: 'ROLE_CLIENT',
  CLIENT_ADMIN: 'ROLE_CLIENT_ADMIN',
  ADMIN: 'ROLE_ADMIN'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * Role arrays for selection (each role option includes ROLE_USER as base)
 */
export const ROLE_ARRAYS = {
  CLIENT: ['ROLE_USER', 'ROLE_CLIENT'],
  CLIENT_ADMIN: ['ROLE_USER', 'ROLE_CLIENT_ADMIN'],
  ADMIN: ['ROLE_USER', 'ROLE_ADMIN']
} as const;

/**
 * Helper function to get role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    'ROLE_USER': 'User',
    'ROLE_CLIENT': 'Customer',
    'ROLE_CLIENT_ADMIN': 'Customer Admin',
    'ROLE_ADMIN': 'Admin'
  };
  return roleMap[role] || role;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
}

/**
 * Check if user is a Customer (ROLE_CLIENT)
 */
export function isCustomer(user: User | null): boolean {
  return hasRole(user, USER_ROLES.CLIENT);
}

/**
 * Check if user is a Customer Admin (ROLE_CLIENT_ADMIN)
 */
export function isCustomerAdmin(user: User | null): boolean {
  return hasRole(user, USER_ROLES.CLIENT_ADMIN);
}

/**
 * Check if user is an Admin (ROLE_ADMIN)
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, USER_ROLES.ADMIN);
}
