/**
 * models.ts
 * TypeScript interfaces for the admin dashboard, mirroring the REST API
 * JSON shapes returned by the Express + MySQL backend.
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
  registered_at: string;
}

export interface CharityEvent {
  event_id: number;
  event_name: string;
  event_description: string;
  purpose: string;
  event_date: string;
  start_time: string;
  end_time: string;
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
  registrations?: Registration[];
  registration_count?: number;
  total_tickets?: number;
}

/** Writable fields accepted by POST /api/events and PUT /api/events/:id. */
export interface EventPayload {
  event_name: string;
  event_description: string;
  purpose: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  city: string;
  ticket_price: number;
  goal_amount: number;
  current_amount: number;
  image_url: string;
  is_suspended: number;
  category_id: number;
  organisation_id: number;
  latitude?: number;
  longitude?: number;
}
