/**
 * home.ts
 * Home page: loads upcoming events for the hero count and grid, loads the
 * categories for the on-page filter, and re-filters the grid on change.
 */
import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Category, CharityEvent } from '../core/models';
import { EventCardComponent } from '../shared/event-card';
import { StateBoxComponent } from '../shared/state-box';

@Component({
  selector: 'app-home',
  imports: [RouterLink, EventCardComponent, StateBoxComponent],
  templateUrl: './home.html',
})
export class HomeComponent {
  private api = inject(ApiService);

  protected readonly allEvents = signal<CharityEvent[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly selectedCategory = signal<string>('');
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly filtered = computed<CharityEvent[]>(() => {
    const cat = this.selectedCategory();
    const all = this.allEvents();
    return cat ? all.filter((e) => String(e.category_id) === String(cat)) : all;
  });

  protected readonly statCount = computed(() =>
    this.error() ? '–' : String(this.allEvents().length)
  );

  protected readonly countText = computed(() => {
    const n = this.filtered().length;
    return `${n} upcoming event${n === 1 ? '' : 's'} available.`;
  });

  ngOnInit(): void {
    forkJoin({
      events: this.api.getEvents(),
      categories: this.api.getCategories(),
    }).subscribe({
      next: ({ events, categories }) => {
        this.allEvents.set(events || []);
        this.categories.set(categories || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
  }
}
