/**
 * weather.js
 * Optional bonus feature: fetches the Open-Meteo daily forecast
 * (https://open-meteo.com, free, no API key) for the event's latitude /
 * longitude and renders the forecast for the event day.
 *
 * Open-Meteo only returns the next ~16 days, so events further out show a
 * friendly "check back later" message instead of failing.
 */
(function () {
  // Minimal inline SVG icons keyed by a small set of weather groups.
  var ICONS = {
    sun:
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#cf9628" stroke-width="1.9" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/></svg>',
    cloudSun:
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0e7a6b" stroke-width="1.8" stroke-linecap="round"><path d="M7 17h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 17z"/><path d="M5.5 5.4 4.3 4.2M11.5 3.7V2M4.7 8.5l-1.6-.4M17 4l1.1-1.3"/></svg>',
    cloud:
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#42564f" stroke-width="1.8" stroke-linecap="round"><path d="M7 18h10a4 4 0 0 0 .6-8 5.6 5.6 0 0 0-10.8 1.3A3.3 3.3 0 0 0 7 18z"/></svg>',
    rain:
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3a78c2" stroke-width="1.8" stroke-linecap="round"><path d="M7 15h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 15z"/><path d="M8 18l-1 2.2M12 18l-1 2.2M16 18l-1 2.2"/></svg>',
    snow:
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6b8aa8" stroke-width="1.8" stroke-linecap="round"><path d="M7 15h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 15z"/><path d="M8.5 19.5h.01M12 20.5h.01M15.5 19.5h.01"/></svg>',
    storm:
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#7a5a12" stroke-width="1.8" stroke-linecap="round"><path d="M7 14h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 14z"/><path d="M12 15l-2 3.5h2.5l-1.5 3.5L15 17.5h-2.5l1.5-2.5z"/></svg>',
    fog:
      '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#74857d" stroke-width="1.8" stroke-linecap="round"><path d="M7 13h9.5a3.3 3.3 0 0 0 .5-6.6 4.8 4.8 0 0 0-9.1 1.1A2.8 2.8 0 0 0 7 13z"/><path d="M4 17h11M6 20h8"/></svg>'
  };

  // Map a WMO weather_code to { group, label }.
  function describe(code) {
    var c = Number(code);
    if (c === 0) return { group: 'sun', label: 'Clear sky' };
    if (c === 1) return { group: 'cloudSun', label: 'Mainly clear' };
    if (c === 2) return { group: 'cloudSun', label: 'Partly cloudy' };
    if (c === 3) return { group: 'cloud', label: 'Overcast' };
    if (c === 45 || c === 48) return { group: 'fog', label: 'Foggy' };
    if (c >= 51 && c <= 67) return { group: 'rain', label: 'Drizzle / rain' };
    if (c >= 71 && c <= 77 || c === 85 || c === 86) return { group: 'snow', label: 'Snow' };
    if (c >= 80 && c <= 82) return { group: 'rain', label: 'Rain showers' };
    if (c >= 95) return { group: 'storm', label: 'Thunderstorm' };
    return { group: 'cloud', label: 'Mixed conditions' };
  }

  /**
   * Render the forecast for `dateIso` (YYYY-MM-DD) into `bodyEl`.
   * @param {number} lat
   * @param {number} lng
   * @param {string} dateIso
   * @param {HTMLElement} bodyEl
   */
  function renderWeather(lat, lng, dateIso, bodyEl) {
    if (!bodyEl) return;
    if (lat == null || lng == null) {
      bodyEl.innerHTML = '<p class="weather-note">Forecast is not available for this venue yet.</p>';
      return;
    }
    var url =
      'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(lat) +
      '&longitude=' + encodeURIComponent(lng) +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=Asia%2FShanghai&forecast_days=16';

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var d = data && data.daily;
        var idx = d && d.time ? d.time.indexOf(dateIso) : -1;
        if (idx < 0) {
          bodyEl.innerHTML =
            '<p class="weather-note">A detailed daily forecast is published by Open-Meteo within 16 days of an event. Please check back closer to the date.</p>';
          return;
        }
        var info = describe(d.weather_code[idx]);
        var max = Math.round(d.temperature_2m_max[idx]);
        var min = Math.round(d.temperature_2m_min[idx]);
        var rain = d.precipitation_probability_max[idx] != null ? d.precipitation_probability_max[idx] : '–';
        bodyEl.innerHTML =
          '<div class="weather-row">' +
            '<div class="weather-icon">' + ICONS[info.group] + '</div>' +
            '<div class="weather-text">' +
              '<div class="weather-cond">' + info.label + '</div>' +
              '<div class="weather-temp">' + max + '&deg;C <span>/ ' + min + '&deg;C</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="weather-rain">Chance of rain: <b>' + rain + '%</b></div>' +
          '<p class="weather-src">Forecast by Open-Meteo &middot; for the event day</p>';
      })
      .catch(function () {
        bodyEl.innerHTML =
          '<p class="weather-note">The live forecast could not be loaded right now. Please try again later.</p>';
      });
  }

  // Expose globally for event.js.
  window.renderWeather = renderWeather;
})();
