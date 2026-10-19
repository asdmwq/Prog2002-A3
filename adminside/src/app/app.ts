/**
 * app.ts
 * HeartBridge Admin Dashboard (Angular v22 + TypeScript).
 *
 * A single screen that manages the event catalogue through the REST API:
 *   - summary statistics and the full, filterable events table
 *   - create / edit event modal (with all recorded registrations)
 *   - delete confirmation (the API blocks deletion when registrations exist)
 *   - a toast for confirmations and an admin-only error state for 409
 */
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from './core/api.service';
import { Category, CharityEvent, EventPayload, Organisation } from './core/models';
import { formatDateShort, formatMoney, imageUrl } from './core/format';

interface StatusView {
  key: 'up' | 'past' | 'susp';
  label: string;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule],
  templateUrl: './app.html',
})
export class App {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  protected readonly formatMoney = formatMoney;
  protected readonly formatDateShort = formatDateShort;
  protected readonly imageUrl = imageUrl;

  // ---------- table data ----------
  protected readonly allEvents = signal<CharityEvent[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly organisations = signal<Organisation[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly search = signal('');

  // ---------- statistics ----------
  protected readonly stats = computed(() => {
    const events = this.allEvents();
    const regs = events.reduce((s, e) => s + Number(e.registration_count || 0), 0);
    const tickets = events.reduce((s, e) => s + Number(e.total_tickets || 0), 0);
    const suspended = events.filter((e) => Number(e.is_suspended) === 1).length;
    const past = events.filter((e) => Number(e.is_suspended) === 0 && e.event_status === 'Past').length;
    const upcoming = events.length - suspended - past;
    return { total: events.length, upcoming, past, suspended, regs, tickets };
  });

  protected readonly filtered = computed<CharityEvent[]>(() => {
    const q = this.search().trim().toLowerCase();
    const events = this.allEvents();
    if (!q) return events;
    return events.filter((e) =>
      [e.event_name, e.city, e.location, e.organisation_name, e.category_name]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  });

  // ---------- event form ----------
  protected readonly form = this.fb.group({
    event_name: [''],
    event_description: [''],
    purpose: [''],
    category_id: [''],
    organisation_id: [''],
    event_date: [''],
    start_time: [''],
    end_time: [''],
    location: [''],
    city: [''],
    ticket_price: [0],
    goal_amount: [0],
    current_amount: [0],
    latitude: [''],
    longitude: [''],
    image_url: [''],
    is_suspended: [false],
  });

  protected readonly modalOpen = signal(false);
  protected readonly modalMode = signal<'create' | 'edit'>('create');
  protected readonly editingId = signal<number | null>(null);
  protected readonly editingEvent = signal<CharityEvent | null>(null);
  protected readonly formError = signal('');
  protected readonly saving = signal(false);
  protected readonly invalidFields = signal<Record<string, boolean>>({});

  // ---------- delete ----------
  protected readonly deleteOpen = signal(false);
  protected readonly pendingDeleteId = signal<number | null>(null);
  protected readonly deleteName = signal('');
  protected readonly deleteError = signal('');
  protected readonly deleting = signal(false);

  // ---------- toast ----------
  protected readonly toast = signal<ToastState>({ visible: false, message: '', type: 'success' });
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------- public site link ----------
  protected readonly publicHref =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080'
      : '/';

  ngOnInit(): void {
    this.loadLookups();
  }

  // ============================================================
  // Data loading
  // ============================================================
  protected loadLookups(): void {
    forkJoin({
      categories: this.api.getCategories(),
      organisations: this.api.getOrganisations(),
    }).subscribe({
      next: ({ categories, organisations }) => {
        this.categories.set(categories || []);
        this.organisations.set(organisations || []);
        this.loadEvents();
      },
      error: () => this.loadEvents(),
    });
  }

  protected loadEvents(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.getAll().subscribe({
      next: (events) => {
        this.allEvents.set(events || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  protected onSearch(value: string): void {
    this.search.set(value);
  }

  // ============================================================
  // Table helpers
  // ============================================================
  protected statusOf(ev: CharityEvent): StatusView {
    if (Number(ev.is_suspended) === 1) return { key: 'susp', label: 'Suspended' };
    if (ev.event_status === 'Past') return { key: 'past', label: 'Past' };
    return { key: 'up', label: 'Upcoming' };
  }

  protected percent(ev: CharityEvent): number {
    return Math.min(Number(ev.progress_percent) || 0, 100);
  }

  protected priceLabel(ev: CharityEvent): string {
    return Number(ev.ticket_price) === 0 ? 'Free' : formatMoney(ev.ticket_price);
  }

  protected hideImg(event: Event): void {
    (event.target as HTMLImageElement).style.visibility = 'hidden';
  }

  // ============================================================
  // Create / edit modal
  // ============================================================
  protected resetForm(): void {
    this.form.reset({
      event_name: '',
      event_description: '',
      purpose: '',
      category_id: '',
      organisation_id: '',
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      city: '',
      ticket_price: 0,
      goal_amount: 0,
      current_amount: 0,
      latitude: '',
      longitude: '',
      image_url: '',
      is_suspended: false,
    });
    this.formError.set('');
    this.invalidFields.set({});
    this.saving.set(false);
    this.editingEvent.set(null);
  }

  protected openCreate(): void {
    this.resetForm();
    this.modalMode.set('create');
    this.editingId.set(null);
    this.modalOpen.set(true);
  }

  protected openEdit(id: number): void {
    this.resetForm();
    this.modalMode.set('edit');
    this.editingId.set(id);
    this.modalOpen.set(true);

    this.api.getAdmin(id).subscribe({
      next: (e) => {
        this.editingEvent.set(e);
        this.form.patchValue({
          event_name: e.event_name || '',
          event_description: e.event_description || '',
          purpose: e.purpose || '',
          category_id: e.category_id ? String(e.category_id) : '',
          organisation_id: e.organisation_id ? String(e.organisation_id) : '',
          event_date: e.event_date || '',
          start_time: e.start_time || '',
          end_time: e.end_time || '',
          location: e.location || '',
          city: e.city || '',
          ticket_price: Number(e.ticket_price) || 0,
          goal_amount: Number(e.goal_amount) || 0,
          current_amount: Number(e.current_amount) || 0,
          latitude: e.latitude == null ? '' : String(e.latitude),
          longitude: e.longitude == null ? '' : String(e.longitude),
          image_url: e.image_url || '',
          is_suspended: Number(e.is_suspended) === 1,
        });
      },
      error: () => this.showToast('Event not found.', 'error'),
    });
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  protected modalTitle(): string {
    return this.modalMode() === 'create' ? 'Create new event' : `Edit event #${this.editingId()}`;
  }

  protected editTicketTotal(): number {
    const e = this.editingEvent();
    return (e?.registrations || []).reduce((s, r) => s + Number(r.ticket_count || 0), 0);
  }

  protected fieldClass(name: string): string {
    return this.invalidFields()[name] ? 'invalid' : '';
  }

  /** Build the payload and run the same client-side validation as the API. */
  private collectPayload(): { errors: string[]; payload: Partial<EventPayload> } {
    const v = this.form.value;
    const errors: string[] = [];
    const invalid: Record<string, boolean> = {};

    const name = String(v.event_name ?? '').trim();
    const desc = String(v.event_description ?? '').trim();
    const purpose = String(v.purpose ?? '').trim();
    const location = String(v.location ?? '').trim();
    const date = String(v.event_date ?? '');
    const start = String(v.start_time ?? '');
    const end = String(v.end_time ?? '');
    const category = String(v.category_id ?? '');
    const org = String(v.organisation_id ?? '');

    invalid['event_name'] = name.length < 2;
    invalid['event_description'] = desc.length < 10;
    invalid['purpose'] = purpose.length < 10;
    invalid['location'] = location.length < 2;

    if (name.length < 2) errors.push('Event name is required (min 2 characters).');
    if (desc.length < 10) errors.push('Description is required (min 10 characters).');
    if (purpose.length < 10) errors.push('Purpose is required (min 10 characters).');
    if (location.length < 2) errors.push('Location is required.');
    if (!date) errors.push('Event date is required.');
    if (!start || !end) errors.push('Start and end times are required.');
    if (start && end && end <= start) errors.push('End time must be later than start time.');
    if (!category) errors.push('Choose a category.');
    if (!org) errors.push('Choose an organisation.');

    const goal = Number(v.goal_amount);
    if (!Number.isFinite(goal) || goal < 0) errors.push('Goal amount must be a non-negative number.');

    const payload: Partial<EventPayload> = {
      event_name: name,
      event_description: desc,
      purpose,
      event_date: date,
      start_time: start,
      end_time: end,
      location,
      city: String(v.city ?? '').trim(),
      category_id: category ? Number(category) : undefined,
      organisation_id: org ? Number(org) : undefined,
      ticket_price: Number(v.ticket_price) || 0,
      goal_amount: Number.isFinite(goal) ? goal : 0,
      current_amount: Number(v.current_amount) || 0,
      image_url: String(v.image_url ?? '').trim(),
      is_suspended: v.is_suspended ? 1 : 0,
    };

    const latRaw = String(v.latitude ?? '').trim();
    const lngRaw = String(v.longitude ?? '').trim();
    const lat = latRaw === '' ? null : Number(latRaw);
    const lng = lngRaw === '' ? null : Number(lngRaw);
    if (lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) errors.push('Latitude must be between -90 and 90.');
    if (lng !== null && (Number.isNaN(lng) || lng < -180 || lng > 180)) errors.push('Longitude must be between -180 and 180.');
    if (lat !== null && !Number.isNaN(lat)) payload.latitude = lat;
    if (lng !== null && !Number.isNaN(lng)) payload.longitude = lng;

    this.invalidFields.set(invalid);
    return { errors, payload };
  }

  protected save(): void {
    if (this.saving()) return;
    this.formError.set('');
    const { errors, payload } = this.collectPayload();
    if (errors.length > 0) {
      this.formError.set(errors.join(' '));
      return;
    }

    this.saving.set(true);
    const mode = this.modalMode();
    const id = this.editingId();
    const request =
      mode === 'create'
        ? this.api.create(payload as EventPayload)
        : this.api.update(id!, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.showToast(
          mode === 'create' ? 'Event created successfully.' : 'Event updated successfully.',
          'success'
        );
        this.loadEvents();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.error || 'The event could not be saved.');
      },
    });
  }

  // ============================================================
  // Delete
  // ============================================================
  protected openDelete(id: number): void {
    const ev = this.allEvents().find((x) => x.event_id === id);
    if (!ev) return;
    this.pendingDeleteId.set(id);
    this.deleteName.set(ev.event_name);
    this.deleteError.set('');
    this.deleting.set(false);
    this.deleteOpen.set(true);
  }

  protected closeDelete(): void {
    this.deleteOpen.set(false);
  }

  protected confirmDelete(): void {
    const id = this.pendingDeleteId();
    if (id === null || this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set('');
    this.api.remove(id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteOpen.set(false);
        this.showToast('Event deleted.', 'success');
        this.loadEvents();
      },
      error: (err) => {
        this.deleting.set(false);
        if (err?.status === 409) {
          this.deleteError.set(
            err?.error?.error || 'This event cannot be deleted because it already has registrations.'
          );
        } else {
          this.deleteError.set(err?.error?.error || 'Could not delete the event.');
        }
      },
    });
  }

  // ============================================================
  // Toast + modal UX
  // ============================================================
  protected showToast(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ visible: true, message, type });
    this.toastTimer = setTimeout(() => {
      this.toast.update((t) => ({ ...t, visible: false }));
    }, 3400);
  }

  protected onOverlayClick(which: 'event' | 'delete', event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      if (which === 'event') this.closeModal();
      else this.closeDelete();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeModal();
    this.closeDelete();
  }
}
