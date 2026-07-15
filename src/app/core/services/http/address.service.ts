import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { ClientAddress, CreateAddressDto, UpdateAddressDto } from '@models/client.model';
import { environment } from '@env/environment';
import { LoggerService } from '@core/services/logger.service';

export interface AddressesResponse {
    '@context'?: string;
    '@id'?: string;
    '@type'?: string;
    member: ClientAddress[];
    totalItems: number;
}

@Injectable({
    providedIn: 'root'
})
export class AddressService {
    private apiUrl = `${environment.apiBaseUrl}/api/v1/addresses`;
    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json'
        })
    };

    constructor(private http: HttpClient, private logger: LoggerService) {}

    /**
     * Get all addresses for a specific client
     */
    getAddressesByClient(clientId: string): Observable<ClientAddress[]> {
        const url = `${environment.apiBaseUrl}/api/v1/clients/${clientId}/addresses`;
        return this.http.get<AddressesResponse>(url).pipe(
            tap(response => this.logger.debug('Addresses response:', response)),
            map(response => response.member || []),
            catchError(error => {
                this.logger.error('Error loading addresses:', error);
                return of([]);
            })
        );
    }

    /**
     * Get a single address by ID
     */
    getAddress(id: string): Observable<ClientAddress> {
        return this.http.get<ClientAddress>(`${this.apiUrl}/${id}`).pipe(
            tap(address => this.logger.debug('Address details:', address))
        );
    }

    /**
     * Create a new address
     */
    createAddress(addressData: CreateAddressDto): Observable<ClientAddress> {
        return this.http.post<ClientAddress>(this.apiUrl, addressData, this.httpOptions).pipe(
            tap(address => this.logger.debug('Created address:', address))
        );
    }

    /**
     * Create a new address for a specific client
     */
    createAddressForClient(clientId: string, addressData: Omit<CreateAddressDto, 'client'>): Observable<ClientAddress> {
        const data: CreateAddressDto = {
            ...addressData,
            client: `/api/v1/clients/${clientId}`
        };
        return this.createAddress(data);
    }

    /**
     * Update an existing address (partial update)
     */
    updateAddress(id: string, addressData: UpdateAddressDto): Observable<ClientAddress> {
        return this.http.patch<ClientAddress>(`${this.apiUrl}/${id}`, addressData, {
            headers: new HttpHeaders({
                'Content-Type': 'application/merge-patch+json',
                'Accept': 'application/ld+json'
            })
        }).pipe(
            tap(address => this.logger.debug('Updated address:', address))
        );
    }

    /**
     * Delete an address
     */
    deleteAddress(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.logger.debug('Deleted address:', id))
        );
    }

    /**
     * Handle API errors and extract user-friendly messages
     */
    handleError(error: any): string {
        if (error.error) {
            if (error.status === 422 && error.error.violations) {
                return error.error.violations
                    .map((v: { propertyPath: string; message: string }) => `${v.propertyPath}: ${v.message}`)
                    .join(', ');
            }
            if (error.error.detail) {
                return error.error.detail;
            }
        }
        return 'An unexpected error occurred. Please try again.';
    }
}
