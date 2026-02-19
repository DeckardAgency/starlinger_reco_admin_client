export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: AdminUserRoleType | null;
  selected?: boolean;
}

export type AdminUserRoleType = 'viewer' | 'editor' | 'admin' | 'profis';

export interface AdminUserRoleOption {
  id: AdminUserRoleType;
  name: string;
  description: string;
}

export const ADMIN_USER_ROLE_OPTIONS: AdminUserRoleOption[] = [
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Can view and monitor data within the application but cannot make any changes.'
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Has the ability to view and modify data, enabling content creation and updates.'
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Possesses full control over the application, including user management, settings configuration, and access to all features and data.'
  },
  {
    id: 'profis',
    name: 'Profis',
    description: 'Has access to core application features and relevant data to manage their specific region or area.'
  }
];
