/**
 * api.service.ts
 * Admin data access against the HeartBridge REST API.
 *
 * Local development -> http://localhost:3000/api
 * Deployed          -> same-origin /api
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category, CharityEvent, EventPayload, Organisation } from './models';

function resolveApiBase(): string {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    return 'http://localhost:3000/api';
  }
  return '/api';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  readonly apiBase = resolveApiBase();

  /** Every event regardless of status (admin table). */
  getAll(): Observable<CharityEvent[]> {
    return this.http.get<CharityEvent[]>(`${this.apiBase}/events/all`);
  }

  /** One event in any status, including all registrations. */
  getAdmin(id: number): Observable<CharityEvent> {
    return this.http.get<CharityEvent>(`${this.apiBase}/events/admin/${id}`);
  }

  /** Create a new event. */
  create(payload: EventPayload): Observable<CharityEvent> {
    return this.http.post<CharityEvent>(`${this.apiBase}/events`, payload);
  }

  /** Update an existing event (partial). */
  update(id: number, payload: Partial<EventPayload>): Observable<CharityEvent> {
    return this.http.put<CharityEvent>(`${this.apiBase}/events/${id}`, payload);
  }

  /** Delete an event. */
  remove(id: number): Observable<{ message?: string }> {
    return this.http.delete<{ message?: string }>(`${this.apiBase}/events/${id}`);
  }

  /** Categories for the form dropdown. */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiBase}/categories`);
  }

  /** Organisations for the form dropdown. */
  getOrganisations(): Observable<Organisation[]> {
    return this.http.get<Organisation[]>(`${this.apiBase}/organisations`);
  }
}
