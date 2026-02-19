import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import {
    Contact,
    ContactsResponse,
    TransformedContactsResponse,
    CreateContactDto,
    UpdateContactDto
} from '@models/contact.model';
import { PaginationLinks } from '@models/pagination.model';
import { environment } from '@env/environment';

@Injectable({
    providedIn: 'root'
})
export class ContactService {
    private apiUrl = `${environment.apiBaseUrl}/api/v1/contacts`;
    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json'
        })
    };

    constructor(private http: HttpClient) {}

    /**
     * Get contacts with pagination, sorting and filtering
     */
    getContacts(
        page: number = 1,
        sortField?: string,
        sortDirection?: 'asc' | 'desc',
        searchParams: Record<string, string> = {}
    ): Observable<TransformedContactsResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('itemsPerPage', '500');

        // Add sorting parameters
        if (sortField && sortDirection) {
            params = params.set(`order[${sortField}]`, sortDirection);
        }

        // Add search parameters
        Object.keys(searchParams).forEach(key => {
            params = params.set(key, searchParams[key]);
        });

        return this.http.get<ContactsResponse>(this.apiUrl, { params }).pipe(
            tap(response => console.log('Contacts API response:', response)),
            map(response => this.transformContactsResponse(response, page)),
            catchError(error => {
                console.error('Contacts API error:', error);
                return of({
                    contacts: [],
                    totalContacts: 0,
                    pagination: {},
                    currentPage: page,
                    totalPages: 1
                });
            })
        );
    }

    /**
     * Get a single contact by ID
     */
    getContact(id: number | string): Observable<Contact> {
        return this.http.get<Contact>(`${this.apiUrl}/${id}`).pipe(
            tap(contact => console.log('Contact details:', contact))
        );
    }

    /**
     * Get contacts by account ID
     */
    getContactsByAccount(accountId: number | string): Observable<TransformedContactsResponse> {
        return this.getContacts(1, 'lastName', 'asc', { 'accountId': String(accountId) });
    }

    /**
     * Create a new contact
     */
    createContact(contactData: CreateContactDto): Observable<Contact> {
        return this.http.post<Contact>(this.apiUrl, contactData, this.httpOptions).pipe(
            tap(contact => console.log('Created contact:', contact))
        );
    }

    /**
     * Update an existing contact (partial update)
     */
    updateContact(id: number | string, contactData: UpdateContactDto): Observable<Contact> {
        return this.http.patch<Contact>(`${this.apiUrl}/${id}`, contactData, {
            headers: new HttpHeaders({
                'Content-Type': 'application/merge-patch+json',
                'Accept': 'application/ld+json'
            })
        }).pipe(
            tap(contact => console.log('Updated contact:', contact))
        );
    }

    /**
     * Replace an existing contact (full update)
     */
    replaceContact(id: number | string, contactData: CreateContactDto): Observable<Contact> {
        return this.http.put<Contact>(`${this.apiUrl}/${id}`, contactData, this.httpOptions).pipe(
            tap(contact => console.log('Replaced contact:', contact))
        );
    }

    /**
     * Delete a contact
     */
    deleteContact(id: number | string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /**
     * Search contacts by name or email
     */
    searchContacts(query: string): Observable<Contact[]> {
        let params = new HttpParams()
            .set('firstName', query);

        return this.http.get<ContactsResponse>(this.apiUrl, { params }).pipe(
            map(response => response.member || [])
        );
    }

    /**
     * Transform the API response to a more UI-friendly format
     */
    private transformContactsResponse(response: ContactsResponse, currentPage: number): TransformedContactsResponse {
        return {
            contacts: response.member || [],
            totalContacts: response.totalItems || 0,
            pagination: {
                first: response.view?.first,
                last: response.view?.last,
                next: response.view?.next,
                previous: response.view?.previous
            },
            currentPage: currentPage,
            totalPages: this.extractTotalPages(response)
        };
    }

    /**
     * Extract total pages from the response
     */
    private extractTotalPages(response: ContactsResponse): number {
        if (response.view?.last) {
            const lastPageUrl = response.view.last;
            const pageMatch = lastPageUrl.match(/[?&]page=(\d+)/);
            if (pageMatch && pageMatch[1]) {
                return parseInt(pageMatch[1], 10);
            }
        }

        // Fallback: calculate based on total items (assuming 30 items per page)
        if (response.totalItems) {
            const itemsPerPage = 30;
            return Math.ceil(response.totalItems / itemsPerPage);
        }

        return 1;
    }
}
