/**
 * event.js
 * Event Details page logic (A3):
 *   - read the event id from the URL query string
 *   - request the full event (with its registrations) from GET /api/events/:id
 *   - render summary, purpose, description, ticket and progress cards
 *   - point the "Register now" button at register.html?id=...
 *   - render the list of registrations (latest purchase first)
 *   - render the live Open-Meteo weather for the event day
 */
(function () {
  var loading = document.getElementById('detailLoading');
  var notFound = document.getElementById('detailNotFound');
  var grid = document.getElementById('detailGrid');
  var notFoundText = document.getElementById('notFoundText');

  /** Read ?id=N from the page URL. */
  function getEventId() {
    var params = new URLSearchParams(location.search);
    var raw = params.get('id');
    if (raw === null || !/^\d+$/.test(raw) || Number(raw) < 1) return null;
    return Number(raw);
  }

  function showNotFound(message) {
    loading.style.display = 'none';
    grid.style.display = 'none';
    if (message) notFoundText.textContent = message;
    notFound.style.display = '';
  }

  /** Privacy-friendly display: first name + last initial, e.g. "Mei L." */
  function displayName(reg) {
    var first = reg.first_name || '';
    var lastInitial = reg.last_name ? reg.last_name.charAt(0).toUpperCase() + '.' : '';
    return escapeHtml(first) + (lastInitial ? ' ' + lastInitial : '');
  }

  /** Build the public registration list (latest purchase first). */
  function renderRegistrations(ev) {
    var listEl = document.getElementById('regList');
    var summaryEl = document.getElementById('regSummary');
    var noteEl = document.getElementById('regNote');
    var regs = Array.isArray(ev.registrations) ? ev.registrations : [];

    summaryEl.textContent = ev.registration_count + ' people · ' + ev.total_tickets + ' tickets';

    if (regs.length === 0) {
      listEl.innerHTML =
        '<div class="regs-empty">No one has registered yet &mdash; be the first to sign up.</div>';
      noteEl.textContent = '';
      return;
    }

    listEl.innerHTML = regs.map(function (r) {
      var initial = escapeHtml((r.first_name || '?').charAt(0).toUpperCase());
      var tickets = Number(r.ticket_count || 0);
      var label = tickets + (tickets === 1 ? ' ticket' : ' tickets');
      return (
        '<div class="reg-row">' +
          '<div class="reg-avatar">' + initial + '</div>' +
          '<div class="reg-name">' + displayName(r) + '</div>' +
          '<div class="reg-tickets">' + label + '</div>' +
          '<div class="reg-date">' + formatDateLong((r.registered_at || '').slice(0, 10)) + '</div>' +
        '</div>'
      );
    }).join('');

    noteEl.textContent = 'Most recent registrations first. Personal contact details are kept private.';
  }

  /** Fill the page with the event returned by the API. */
  function render(ev) {
    document.getElementById('dBanner').src = ev.image_url;
    document.getElementById('dBanner').alt = ev.event_name;
    document.getElementById('dCategory').textContent = ev.category_name;
    document.getElementById('dStatus').textContent = ev.event_status;
    document.getElementById('dName').textContent = ev.event_name;

    document.getElementById('dDate').textContent = formatDateLong(ev.event_date);
    document.getElementById('dTime').textContent = ev.start_time + ' \u2013 ' + ev.end_time;
    document.getElementById('dLocation').textContent = ev.location + ', ' + ev.city;
    document.getElementById('dHost').textContent = ev.organisation_name;

    document.getElementById('dPurpose').textContent = ev.purpose;
    document.getElementById('dDescription').textContent = ev.event_description;

    var priceEl = document.getElementById('dPrice');
    var priceHint = document.getElementById('dPriceHint');
    if (Number(ev.ticket_price) === 0) {
      priceEl.textContent = 'Free entry';
      priceEl.classList.add('free');
      priceHint.textContent = 'This event is free to attend \u2014 just register and come along.';
    } else {
      priceEl.textContent = formatMoney(ev.ticket_price);
      priceHint.textContent = 'Per ticket. Total is calculated when you register.';
    }

    var percent = Number(ev.progress_percent) || 0;
    document.getElementById('dPercent').textContent = percent + '%';
    document.getElementById('dProgressFill').style.width = Math.min(percent, 100) + '%';
    document.getElementById('dRaised').textContent = formatMoney(ev.current_amount);
    document.getElementById('dGoal').textContent = formatMoney(ev.goal_amount);

    document.getElementById('dHostName').textContent = ev.organisation_name;
    document.getElementById('dHostDesc').textContent =
      'This event is hosted by ' + ev.organisation_name + ' in ' + ev.city + '.';

    // A3: registration list + register link + weather
    document.getElementById('registerBtn').href = 'register.html?id=' + encodeURIComponent(ev.event_id);
    renderRegistrations(ev);
    var weatherBody = document.getElementById('weatherBody');
    if (window.renderWeather) {
      window.renderWeather(ev.latitude, ev.longitude, ev.event_date, weatherBody);
    } else {
      weatherBody.innerHTML = '<p class="weather-note">Forecast unavailable.</p>';
    }

    document.title = ev.event_name + ' – HeartBridge Charity Events';

    loading.style.display = 'none';
    grid.style.display = '';
  }

  var id = getEventId();
  if (id === null) {
    showNotFound('No valid event id was given in the link.');
  } else {
    fetch(API_BASE + '/events/' + id)
      .then(function (res) {
        if (res.status === 404) {
          showNotFound('We could not find that event. It may have passed or been suspended.');
          throw new Error('not found');
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(render)
      .catch(function (err) {
        if (err.message === 'not found') return;
        loading.style.display = 'none';
        showNotFound('The event service could not be reached. Please make sure the API is running.');
        console.error(err);
      });
  }

  // Back link: use history when possible, otherwise fall back to Search.
  document.getElementById('backLink').addEventListener('click', function (e) {
    if (history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });
})();
