/**
 * event-detail.ts
 * Event details page: loads a single active event (with its registrations)
 * from GET /api/events/:id, renders the summary, registration list and
 * live Open-Meteo weather, and points to the registration page.
 */
import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../core/api.service';
import { CharityEvent } from '../core/models';
import { displayName, formatDateLong, formatMoney, imageUrl } from '../core/format';
import { StateBoxComponent } from '../shared/state-box';
import { WeatherComponent } from '../shared/weather';

type DetailState = 'loading' | 'notfound' | 'loaded';

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink, StateBoxComponent, WeatherComponent],
  templateUrl: './event-detail.html',
})
export class EventDetailComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private title = inject(Title);

  protected readonly state = signal<DetailState>('loading');
  protected readonly event = signal<CharityEvent | null>(null);
  protected readonly notFoundText = signal(
    'We could not find that event. It may have passed or been suspended.'
  );

  protected readonly formatDateLong = formatDateLong;
  protected readonly formatMoney = formatMoney;
  protected readonly imageUrl = imageUrl;
  protected readonly displayName = displayName;

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw && /^\d+$/.test(raw) && Number(raw) >= 1 ? Number(raw) : null;

    if (id === null) {
      this.state.set('notfound');
      this.notFoundText.set('No valid event id was given in the link.');
      return;
    }

    this.api.getEvent(id).subscribe({
      next: (ev) => {
        this.event.set(ev);
        this.state.set('loaded');
        this.title.setTitle(`${ev.event_name} – HeartBridge Charity Events`);
      },
      error: (err) => {
        if (err?.status === 404) {
          this.notFoundText.set('We could not find that event. It may have passed or been suspended.');
        } else {
          this.notFoundText.set('The event service could not be reached. Please make sure the API is running.');
        }
        this.state.set('notfound');
      },
    });
  }

  protected back(): void {
    if (window.history.length > 1) {
      this.location.back();
    }
  }

  protected progressWidth(ev: CharityEvent): number {
    return Math.min(Number(ev.progress_percent) || 0, 100);
  }

  protected isFree(ev: CharityEvent): boolean {
    return Number(ev.ticket_price) === 0;
  }

  protected percent(v: number | string | null | undefined): number {
    return Number(v) || 0;
  }

  protected initial(firstName?: string): string {
    return (firstName || '?').charAt(0).toUpperCase();
  }

  protected ticketsLabel(count?: number): string {
    const n = Number(count || 0);
    return `${n} ${n === 1 ? 'ticket' : 'tickets'}`;
  }
}
