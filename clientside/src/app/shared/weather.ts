/**
 * weather.ts
 * Optional bonus feature: shows the Open-Meteo daily forecast
 * (https://open-meteo.com, free, no API key) for the event day.
 * Open-Meteo only returns ~16 days, so events further out show a friendly
 * "check back later" message instead of failing.
 */
import { Component, Input, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';

interface WeatherInfo {
  group: string;
  label: string;
  max: number;
  min: number;
  rain: number | string;
}

/** Map a WMO weather code to { group, label }. */
function describe(code: number): { group: string; label: string } {
  const c = Number(code);
  if (c === 0) return { group: 'sun', label: 'Clear sky' };
  if (c === 1) return { group: 'cloudSun', label: 'Mainly clear' };
  if (c === 2) return { group: 'cloudSun', label: 'Partly cloudy' };
  if (c === 3) return { group: 'cloud', label: 'Overcast' };
  if (c === 45 || c === 48) return { group: 'fog', label: 'Foggy' };
  if (c >= 51 && c <= 67) return { group: 'rain', label: 'Drizzle / rain' };
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return { group: 'snow', label: 'Snow' };
  if (c >= 80 && c <= 82) return { group: 'rain', label: 'Rain showers' };
  if (c >= 95) return { group: 'storm', label: 'Thunderstorm' };
  return { group: 'cloud', label: 'Mixed conditions' };
}

@Component({
  selector: 'app-weather',
  template: `
    @switch (state()) {
      @case ('unavailable') {
        <p class="weather-note">Forecast is not available for this venue yet.</p>
      }
      @case ('future') {
        <p class="weather-note">A detailed daily forecast is published by Open-Meteo within 16 days of an event. Please check back closer to the date.</p>
      }
      @case ('error') {
        <p class="weather-note">The live forecast could not be loaded right now. Please try again later.</p>
      }
      @case ('loading') {
        <p class="weather-note">Loading forecast&hellip;</p>
      }
      @case ('ok') {
        @if (view(); as v) {
          <div class="weather-row">
            <div class="weather-icon">
              @switch (v.group) {
                @case ('sun') {
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#cf9628" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/></svg>
                }
                @case ('cloudSun') {
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0e7a6b" stroke-width="1.8" stroke-linecap="round"><path d="M7 17h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 17z"/><path d="M5.5 5.4 4.3 4.2M11.5 3.7V2M4.7 8.5l-1.6-.4M17 4l1.1-1.3"/></svg>
                }
                @case ('cloud') {
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#42564f" stroke-width="1.8" stroke-linecap="round"><path d="M7 18h10a4 4 0 0 0 .6-8 5.6 5.6 0 0 0-10.8 1.3A3.3 3.3 0 0 0 7 18z"/></svg>
                }
                @case ('rain') {
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3a78c2" stroke-width="1.8" stroke-linecap="round"><path d="M7 15h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 15z"/><path d="M8 18l-1 2.2M12 18l-1 2.2M16 18l-1 2.2"/></svg>
                }
                @case ('snow') {
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6b8aa8" stroke-width="1.8" stroke-linecap="round"><path d="M7 15h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 15z"/><path d="M8.5 19.5h.01M12 20.5h.01M15.5 19.5h.01"/></svg>
                }
                @case ('storm') {
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#7a5a12" stroke-width="1.8" stroke-linecap="round"><path d="M7 14h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 14z"/><path d="M12 15l-2 3.5h2.5l-1.5 3.5L15 17.5h-2.5l1.5-2.5z"/></svg>
                }
                @case ('fog') {
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#74857d" stroke-width="1.8" stroke-linecap="round"><path d="M7 13h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 13z"/><path d="M4 17h11M6 20h8"/></svg>
                }
              }
            </div>
            <div class="weather-text">
              <div class="weather-cond">{{ v.label }}</div>
              <div class="weather-temp">{{ v.max }}&deg;C <span>/ {{ v.min }}&deg;C</span></div>
            </div>
          </div>
          <div class="weather-rain">Chance of rain: <b>{{ v.rain }}%</b></div>
          <p class="weather-src">Forecast by Open-Meteo &middot; for the event day</p>
        }
      }
    }
  `,
})
export class WeatherComponent {
  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Input() dateIso = '';

  private api = inject(ApiService);

  protected readonly state = signal<'loading' | 'unavailable' | 'future' | 'ok' | 'error'>('loading');
  protected readonly view = signal<WeatherInfo | null>(null);

  ngOnChanges(): void {
    if (this.lat == null || this.lng == null) {
      this.state.set('unavailable');
      return;
    }
    this.state.set('loading');
    this.view.set(null);
    this.api.getWeather(this.lat, this.lng).subscribe({
      next: (data) => {
        const d = data?.daily;
        const idx = d && d.time ? d.time.indexOf(this.dateIso) : -1;
        if (idx === undefined || idx < 0) {
          this.state.set('future');
          return;
        }
        const info = describe(d.weather_code[idx]);
        this.view.set({
          group: info.group,
          label: info.label,
          max: Math.round(d.temperature_2m_max[idx]),
          min: Math.round(d.temperature_2m_min[idx]),
          rain: d.precipitation_probability_max[idx] != null ? d.precipitation_probability_max[idx]! : '–',
        });
        this.state.set('ok');
      },
      error: () => {
        this.state.set('error');
      },
    });
  }
}
