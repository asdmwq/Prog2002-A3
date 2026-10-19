/**
 * register.ts
 * Registration page: confirms the event, collects the attendee's details
 * with the same validation rules as the API, computes the live total,
 * and POSTs to /api/events/:id/registrations.
 */
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ApiService } from '../core/api.service';
import { CharityEvent, Registration } from '../core/models';
import { formatDateLong, formatMoney, imageUrl } from '../core/format';
import { StateBoxComponent } from '../shared/state-box';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterState = 'loading' | 'notfound' | 'ready' | 'success';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, StateBoxComponent],
  templateUrl: './register.html',
})
export class RegisterComponent {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private title = inject(Title);

  protected readonly formatDateLong = formatDateLong;
  protected readonly formatMoney = formatMoney;
  protected readonly imageUrl = imageUrl;

  protected readonly state = signal<RegisterState>('loading');
  protected readonly event = signal<CharityEvent | null>(null);
  protected readonly notFoundText = signal(
    'We could not find that event. It may have passed or been suspended.'
  );

  protected readonly submitting = signal(false);
  protected readonly formError = signal('');
  protected readonly apiError = signal('');
  protected readonly registration = signal<Registration | null>(null);

  protected readonly form = this.fb.group({
    first_name: [''],
    last_name: [''],
    email: [''],
    phone: [''],
    ticket_count: [1],
  });

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
        this.state.set('ready');
        this.title.setTitle(`Register – ${ev.event_name} – HeartBridge`);
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

  protected isFree(ev: CharityEvent): boolean {
    return Number(ev.ticket_price) === 0;
  }

  /** Live total = ticket price × selected tickets. */
  protected total(): number {
    const ev = this.event();
    if (!ev) return 0;
    const tickets = Number(this.form.controls.ticket_count.value) || 0;
    return Number(ev.ticket_price) * tickets;
  }

  protected onTicketsChange(value: string): void {
    let n = parseInt(value, 10);
    if (Number.isNaN(n)) n = 1;
    if (n < 1) n = 1;
    if (n > 20) n = 20;
    this.form.controls.ticket_count.setValue(n);
  }

  private validate(data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    ticket_count: number;
  }): string[] {
    const errors: string[] = [];
    if (data.first_name.length < 2 || data.first_name.length > 80) {
      errors.push('Please enter your first name (2–80 characters).');
    }
    if (data.last_name.length < 2 || data.last_name.length > 80) {
      errors.push('Please enter your last name (2–80 characters).');
    }
    if (!data.email || !EMAIL_RE.test(data.email) || data.email.length > 150) {
      errors.push('Please enter a valid email address (e.g. name@example.com).');
    }
    if (data.phone.length > 30) {
      errors.push('Phone number must be 30 characters or fewer.');
    }
    if (!Number.isInteger(data.ticket_count) || data.ticket_count < 1 || data.ticket_count > 20) {
      errors.push('Please enter between 1 and 20 tickets.');
    }
    return errors;
  }

  protected onSubmit(): void {
    if (this.submitting()) return;
    const ev = this.event();
    if (!ev) return;

    this.apiError.set('');

    const data = {
      first_name: (this.form.value.first_name ?? '').trim(),
      last_name: (this.form.value.last_name ?? '').trim(),
      email: (this.form.value.email ?? '').trim(),
      phone: (this.form.value.phone ?? '').trim(),
      ticket_count: Number(this.form.value.ticket_count),
    };

    const errors = this.validate(data);
    if (errors.length > 0) {
      this.formError.set(errors.join(' '));
      return;
    }

    this.formError.set('');
    this.submitting.set(true);

    this.api
      .register(ev.event_id, {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || undefined,
        ticket_count: data.ticket_count,
      })
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          const saved = result.registration;
          // Fallback if the server did not echo a timestamp.
          if (!saved.registered_at) {
            saved.registered_at = new Date().toISOString().replace('T', ' ').slice(0, 16);
          }
          this.registration.set(saved);
          this.state.set('success');
          this.title.setTitle('Registration successful – HeartBridge');
        },
        error: (err) => {
          this.submitting.set(false);
          this.apiError.set(err?.error?.error || 'Registration failed. Please try again.');
        },
      });
  }

  protected registeredDate(): string {
    const r = this.registration();
    return r ? formatDateLong(r.registered_at.slice(0, 10)) : '';
  }
}
