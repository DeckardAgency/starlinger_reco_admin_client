import { Injectable } from '@angular/core';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { Country, CountriesCollection } from '@core/models/country.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class CountryService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/countries`;

  // Cache observable to avoid repeated API calls for reference data
  private allCountries$: Observable<CountriesCollection> | null = null;

  getCountries(params: Record<string, string | number | boolean> = {}): Observable<CountriesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<CountriesCollection>(this.endpoint, httpParams);
  }

  /**
   * Get all countries for dropdowns (cached).
   * Cache is invalidated on create/update/delete.
   */
  getAllCountries(): Observable<CountriesCollection> {
    if (!this.allCountries$) {
      this.allCountries$ = this.getCountries({ itemsPerPage: 300, 'order[name]': 'asc' }).pipe(
        catchError(error => {
          this.allCountries$ = null;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.allCountries$;
  }

  /**
   * Clear cached data (call when you need fresh data)
   */
  clearCache(): void {
    this.allCountries$ = null;
  }

  getCountryById(id: string): Observable<Country> {
    return this.getWithJsonLd<Country>(`${this.endpoint}/${id}`);
  }

  createCountry(country: Partial<Country>): Observable<Country> {
    return this.postWithJsonLd<Country>(this.endpoint, country).pipe(
      tap(() => this.clearCache())
    );
  }

  updateCountry(id: string, country: Partial<Country>): Observable<Country> {
    return this.patchWithJsonLd<Country>(`${this.endpoint}/${id}`, country).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteCountry(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`).pipe(
      tap(() => this.clearCache())
    );
  }
}
