/**
 * API interfaces for Authentication
 * Moved from auth.service.ts to follow Angular best practices
 */

/** Response from login endpoint */
export interface AuthResponse {
  token: string;
  refresh_token: string;
}
