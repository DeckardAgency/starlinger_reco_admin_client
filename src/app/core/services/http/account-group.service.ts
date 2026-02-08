import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountGroup, AccountGroupsCollection } from '@core/models/account-group.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class AccountGroupService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/account_groups`;

  getAccountGroups(page: number = 1, itemsPerPage: number = 100): Observable<AccountGroupsCollection> {
    const params = this.buildParams({ page, itemsPerPage });
    return this.getWithJsonLd<AccountGroupsCollection>(this.endpoint, params);
  }

  getAccountGroupById(id: string): Observable<AccountGroup> {
    return this.getWithJsonLd<AccountGroup>(`${this.endpoint}/${id}`);
  }

  createAccountGroup(data: Partial<AccountGroup>): Observable<AccountGroup> {
    return this.postWithJsonLd<AccountGroup>(this.endpoint, data);
  }

  updateAccountGroup(id: string, data: Partial<AccountGroup>): Observable<AccountGroup> {
    return this.patchWithJsonLd<AccountGroup>(`${this.endpoint}/${id}`, data);
  }

  deleteAccountGroup(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
