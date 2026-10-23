import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { switchMap } from 'rxjs';
import { API_BASE_URL, API_URL } from './api.config';

export interface ContactData {
  name: string;
  type: 'customer' | 'supplier' | 'both';
  entity_type: 'company' | 'person';
  email: string;
  phone: string;
  vat_number: string;
  tax_code: string;
  pec: string;
  sdi_code: string;
  address: string;
  postal_code: string;
  city: string;
  province: string;
  country: string;
  notes: string;
}
export interface Contact extends ContactData {
  id: number;
}
export interface ContactPage {
  data: Contact[];
  current_page: number;
  last_page: number;
  total: number;
}
export const emptyContact = (): ContactData => ({
  name: '',
  type: 'customer',
  entity_type: 'company',
  email: '',
  phone: '',
  vat_number: '',
  tax_code: '',
  pec: '',
  sdi_code: '',
  address: '',
  postal_code: '',
  city: '',
  province: '',
  country: 'IT',
  notes: '',
});
@Injectable({ providedIn: 'root' })
export class ContactsService {
  private readonly http = inject(HttpClient);
  list(search: string, type: string, page: number) {
    return this.http.get<ContactPage>(`${API_BASE_URL}/contacts`, {
      params: new HttpParams().set('search', search).set('type', type).set('page', page),
    });
  }
  save(data: ContactData, id?: number) {
    return this.http
      .get<void>(`${API_URL}/sanctum/csrf-cookie`)
      .pipe(
        switchMap(() =>
          id
            ? this.http.put<{ data: Contact }>(`${API_BASE_URL}/contacts/${id}`, data)
            : this.http.post<{ data: Contact }>(`${API_BASE_URL}/contacts`, data),
        ),
      );
  }
  delete(id: number) {
    return this.http
      .get<void>(`${API_URL}/sanctum/csrf-cookie`)
      .pipe(switchMap(() => this.http.delete<void>(`${API_BASE_URL}/contacts/${id}`)));
  }
}
