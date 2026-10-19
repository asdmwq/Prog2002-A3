/**
 * api.service.ts
 * The single Angular service that talks to the HeartBridge REST API.
 *
 * Local development  -> the Express API runs on http://localhost:3000
 * Deployed (cPanel)  -> the API is reached through the same origin (/api)
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Category,
  CharityEvent,
  RegistrationPayload,
  RegistrationResponse,
  SearchFilters,
} from './models';

/** Resolve the API base URL from the current hostname. */
function resolveApiBase(): string {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    return 'http://localhost:3000/api';
  }
  // Production: same-origin (e.g. https://my-domain/api).
  return '/api';
}

/** Shape of the Open-Meteo daily forecast we consume. */
export interface WeatherForecast {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  readonly apiBase = resolveApiBase();

  /** Active, upcoming events (optionally filtered by category). */
  getEvents(categoryId?: number | string): Observable<CharityEvent[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('category_id', String(categoryId));
    return this.http.get<CharityEvent[]>(`${this.apiBase}/events`, { params });
  }

  /** Active events matching the supplied search filters. */
  searchEvents(filters: SearchFilters): Observable<CharityEvent[]> {
    let params = new HttpParams();
    if (filters.date) params = params.set('date', filters.date);
    if (filters.location) params = params.set('location', filters.location);
    if (filters.category_id) params = params.set('category_id', String(filters.category_id));
    return this.http.get<CharityEvent[]>(`${this.apiBase}/events/search`, { params });
  }

  /** One active event with its registrations. */
  getEvent(id: number): Observable<CharityEvent> {
    return this.http.get<CharityEvent>(`${this.apiBase}/events/${id}`);
  }

  /** All categories (with active counts). */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiBase}/categories`);
  }

  /** Register a web user for an event. */
  register(id: number, payload: RegistrationPayload): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(
      `${this.apiBase}/events/${id}/registrations`,
      payload
    );
  }

  /** Open-Meteo daily forecast (free, no API key) for a venue. */
  getWeather(lat: number, lng: number): Observable<WeatherForecast> {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=' +
      encodeURIComponent(lat) +
      '&longitude=' +
      encodeURIComponent(lng) +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=Asia%2FShanghai&forecast_days=16';
    return this.http.get<WeatherForecast>(url);
  }
}
