import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { Country, CountriesCollection } from '@core/models/country.model';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class CountryService extends BaseHttpService {
  private readonly endpoint = `${this.apiUrl}/countries`;

  getCountries(params: Record<string, string | number | boolean> = {}): Observable<CountriesCollection> {
    const httpParams = this.buildParams({ page: 1, itemsPerPage: 30, ...params });
    return this.getWithJsonLd<CountriesCollection>(this.endpoint, httpParams);
  }

  getCountryById(id: string): Observable<Country> {
    return this.getWithJsonLd<Country>(`${this.endpoint}/${id}`);
  }

  createCountry(country: Partial<Country>): Observable<Country> {
    return this.postWithJsonLd<Country>(this.endpoint, country);
  }

  updateCountry(id: string, country: Partial<Country>): Observable<Country> {
    return this.patchWithJsonLd<Country>(`${this.endpoint}/${id}`, country);
  }

  deleteCountry(id: string): Observable<void> {
    return this.deleteWithJsonLd<void>(`${this.endpoint}/${id}`);
  }
}
