/**
 * search.ts
 * Search page: populates categories, validates the filters client-side,
 * queries /events/search, and renders loading / empty / error states.
 */
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Category, CharityEvent } from '../core/models';
import { todayIso } from '../core/format';
import { EventCardComponent } from '../shared/event-card';
import { StateBoxComponent } from '../shared/state-box';

type SearchState = 'prompt' | 'loading' | 'results' | 'error';

@Component({
  selector: 'app-search',
  imports: [ReactiveFormsModule, EventCardComponent, StateBoxComponent],
  templateUrl: './search.html',
})
export class SearchComponent {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  protected readonly today = todayIso();
  protected readonly categories = signal<Category[]>([]);

  protected readonly form = this.fb.group({
    date: [''],
    location: [''],
    category_id: [''],
  });

  protected readonly formError = signal('');
  protected readonly state = signal<SearchState>('prompt');
  protected readonly results = signal<CharityEvent[]>([]);
  protected readonly resultsCount = signal('0 events');
  protected readonly promptText = signal('Choose your filters and select Search Events.');

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (categories) => this.categories.set(categories || []),
      error: () => this.formError.set('Could not load categories. Is the API running?'),
    });
  }

  protected onSubmit(): void {
    this.formError.set('');
    const date = this.form.value.date ?? '';
    const location = (this.form.value.location ?? '').trim();
    const categoryId = this.form.value.category_id ?? '';

    // Client-side validation (same rules as the server).
    if (date && date < todayIso()) {
      this.formError.set('Please choose today’s date or a future date.');
      return;
    }
    if (location.length > 100) {
      this.formError.set('Location must be 100 characters or fewer.');
      return;
    }

    this.state.set('loading');
    this.promptText.set('');
    this.resultsCount.set('Searching…');

    this.api
      .searchEvents({ date, location, category_id: categoryId })
      .subscribe({
        next: (events) => {
          const list = events || [];
          this.results.set(list);
          this.resultsCount.set(`${list.length} event${list.length === 1 ? '' : 's'}`);
          this.state.set('results');
        },
        error: (err) => {
          this.results.set([]);
          this.resultsCount.set('0 events');
          this.state.set('error');
          this.promptText.set(err?.error?.error || 'The search service could not be reached.');
        },
      });
  }

  protected clearFilters(): void {
    this.form.reset({ date: '', location: '', category_id: '' });
    this.formError.set('');
    this.results.set([]);
    this.state.set('prompt');
    this.resultsCount.set('0 events');
    this.promptText.set('Choose your filters and select Search Events.');
  }
}
