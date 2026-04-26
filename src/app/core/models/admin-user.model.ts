export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: AdminUserRoleType | null;
  selected?: boolean;
}

export type AdminUserRoleType = 'admin' | 'client_admin' | 'client' | 'finance';

export interface AdminUserRoleOption {
  id: AdminUserRoleType;
  name: string;
  description: string;
}

export const ADMIN_USER_ROLE_OPTIONS: AdminUserRoleOption[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full control over the application, including user management, settings configuration, and access to all features and data.'
  },
  {
    id: 'client_admin',
    name: 'Client Admin',
    description: 'Manages their client account and users, with access to client-specific settings and data.'
  },
  {
    id: 'client',
    name: 'Client',
    description: 'Standard client access for browsing the shop and placing orders.'
  },
  {
    id: 'finance',
    name: 'Finance',
    description: 'Receives email notifications for orders placed by users of the same company. No webshop access.'
  }
];
