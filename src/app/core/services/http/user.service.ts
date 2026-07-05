import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserCollectionResponse } from '@core/models';
import { BaseHttpService } from './base-http.service';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseHttpService {
  private usersUrl = this.buildUrl('users');

  /**
   * Get user by email
   * @param email The user's email
   * @returns Observable with the user data
   */
  getUserByEmail(email: string): Observable<User | null> {
    const params = new HttpParams().set('email', email);

    return this.getWithJsonLd<UserCollectionResponse>(this.usersUrl, params)
      .pipe(
        map(response => {
          // Check if a member array exists and has at least one user
          if (response.member && response.member.length > 0) {
            const userMember = response.member[0];

            // Convert from the API format to our User interface
            const user: User = {
              id: userMember.id,
              email: userMember.email,
              roles: userMember.roles,
              firstName: userMember.firstName,
              lastName: userMember.lastName,
              createdAt: userMember.createdAt,
              updatedAt: userMember.updatedAt,
              orders: userMember.orders,
              username: userMember.email, // Ensure the username is set for compatibility
              client: userMember.client  // Include the client information if available
            };

            return user;
          }
          return null;
        })
      );
  }

  /**
   * Get all users by client code
   * @param clientCode The client's code
   * @returns Observable with the collection of users
   */
  getUsersByClientCode(clientCode: string): Observable<UserCollectionResponse> {
    const params = new HttpParams().set('client.code', clientCode);
    return this.getWithJsonLd<UserCollectionResponse>(this.usersUrl, params);
  }

  /**
   * Get a single user by ID
   * @param id User UUID
   * @returns Observable with the user or null if not found
   */
  getUserById(id: string): Observable<User | null> {
    const url = `${this.usersUrl}/${id}`;
    return this.getWithJsonLd<User>(url).pipe(
      map(u => u ?? null)
    );
  }

  /**
   * Get all users (for admins or filtered by client)
   * @param filters Optional filters like pagination, sorting, search, hasClient, roles
   * @returns Observable with the collection of users
   */
  getUsers(params: Record<string, string | number | boolean> = {}): Observable<UserCollectionResponse> {
    const mergedParams = { page: 1, itemsPerPage: 30, ...params };
    const httpParams = this.buildParams(mergedParams);
    return this.getWithJsonLd<UserCollectionResponse>(this.usersUrl, httpParams);
  }

  /**
   * Create a new user
   * @param userData User data to create
   * @returns Observable with the created user
   */
  createUser(userData: Partial<User>): Observable<User> {
    return this.postWithJsonLd<User>(this.usersUrl, userData);
  }

  /**
   * Invite a user by email instead of creating them directly: the backend emails
   * an invitation link and the user sets their own password.
   */
  inviteUser(invitation: { email: string; firstName: string; lastName: string; roles?: string[]; client?: string }): Observable<unknown> {
    return this.postWithJsonLd<unknown>(this.buildUrl('user_invitations'), invitation);
  }

  /**
   * Update an existing user
   * @param id User UUID
   * @param userData Partial user data to update
   * @returns Observable with the updated user
   */
  updateUser(id: string, userData: Partial<User>): Observable<User> {
    const url = `${this.usersUrl}/${id}`;
    return this.patchWithJsonLd<User>(url, userData);
  }

  /**
   * Delete a user
   * @param id User UUID
   * @returns Observable for the delete operation
   */
  deleteUser(id: string): Observable<void> {
    const url = `${this.usersUrl}/${id}`;
    return this.deleteWithJsonLd<void>(url);
  }

  /**
   * Export users to Excel
   */
  exportToExcel(
    sortField?: string,
    sortDirection?: 'asc' | 'desc',
    searchQuery?: string
  ): Observable<Blob> {
    let params = new HttpParams();

    if (sortField && sortDirection) {
      params = params.set(`order[${sortField}]`, sortDirection);
    }
    if (searchQuery) {
      params = params.set('email', searchQuery);
    }

    return this.http.get(
      `${environment.apiBaseUrl}/api/users/export/excel`,
      {
        headers: new HttpHeaders({
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }),
        params,
        responseType: 'blob'
      }
    );
  }
}
