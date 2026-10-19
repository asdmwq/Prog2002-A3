/**
 * models.ts
 * TypeScript interfaces describing the JSON shapes returned by the
 * HeartBridge REST API (Express + MySQL). These mirror the database
 * columns and the values computed by the API.
 */

export interface Category {
  category_id: number;
  category_name: string;
  active_event_count?: number;
}

export interface Organisation {
  organisation_id: number;
  name: string;
}

export interface Registration {
  registration_id: number;
  event_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  ticket_count: number;
  total_amount: number;
  registered_at: string; // 'YYYY-MM-DD HH:MM'
}

export interface CharityEvent {
  event_id: number;
  event_name: string;
  event_description: string;
  purpose: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  location: string;
  city: string;
  ticket_price: number;
  goal_amount: number;
  current_amount: number;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_suspended: number;
  category_id: number;
  category_name: string;
  organisation_id: number;
  organisation_name: string;
  event_status: 'Upcoming' | 'Past' | 'Suspended';
  progress_percent: number;
  // Present on the detail / admin endpoints.
  registrations?: Registration[];
  registration_count?: number;
  total_tickets?: number;
}

export interface RegistrationPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  ticket_count: number;
}

export interface RegistrationResponse {
  message: string;
  registration: Registration;
}

export interface ApiError {
  error: string;
}

export interface SearchFilters {
  date?: string;
  location?: string;
  category_id?: number | string;
}
