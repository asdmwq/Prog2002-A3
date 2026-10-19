/**
 * event-card.ts
 * Reusable presentation component that renders one event card.
 * Replaces the vanilla createEventCard() helper.
 */
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharityEvent } from '../core/models';
import { formatDateLong, formatMoney, imageUrl } from '../core/format';

@Component({
  selector: 'app-event-card',
  imports: [RouterLink],
  template: `
    <article class="event-card">
      <img class="banner" [src]="imageUrl(event.image_url)" [alt]="event.event_name" loading="lazy">
      <div class="body">
        <div class="badges">
          <span class="badge badge-cat">{{ event.category_name }}</span>
          <span class="badge badge-up">{{ event.event_status }}</span>
        </div>
        <h3>{{ event.event_name }}</h3>
        <p class="desc">{{ event.event_description }}</p>
        <ul class="meta-list">
          <li>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0e7a6b" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span><b>Date:</b>{{ formatDateLong(event.event_date) }}</span>
          </li>
          <li>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0e7a6b" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            <span><b>Time:</b>{{ event.start_time }} &ndash; {{ event.end_time }}</span>
          </li>
          <li>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0e7a6b" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span><b>Place:</b>{{ event.location }}</span>
          </li>
        </ul>
        <div class="fund-row">
          <span class="raised">{{ formatMoney(event.current_amount) }} raised</span>
          <span class="goal">Goal {{ formatMoney(event.goal_amount) }}</span>
        </div>
        <div class="progress"><div class="fill" [style.width.%]="progressWidth"></div></div>
        <div class="percent">{{ event.progress_percent }}% of goal</div>
        <a class="card-link" [routerLink]="['/event', event.event_id]">View event details <span class="arrow">&rarr;</span></a>
      </div>
    </article>
  `,
})
export class EventCardComponent {
  @Input({ required: true }) event!: CharityEvent;

  protected readonly formatDateLong = formatDateLong;
  protected readonly formatMoney = formatMoney;
  protected readonly imageUrl = imageUrl;

  get progressWidth(): number {
    return Math.min(Number(this.event.progress_percent) || 0, 100);
  }
}
