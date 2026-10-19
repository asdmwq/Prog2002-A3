/**
 * ui.js
 * Shared presentation helpers used by all pages:
 *   - safe escaping of API text before it touches the DOM
 *   - money / date formatting
 *   - the reusable event-card component
 *   - loading / empty / error state boxes
 */

/** Escape a value so it is safe to insert as text content. */
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format a number as yuan, e.g. 9200 -> "¥9,200.00". */
function formatMoney(value) {
  var n = Number(value);
  if (isNaN(n)) n = 0;
  return '\u00A5' + n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/** Format an ISO date (YYYY-MM-DD) as "Sun, 18 Oct 2026". */
function formatDateLong(iso) {
  var d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return escapeHtml(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

/* Small inline icons (static, trusted markup). */
var ICONS = {
  calendar: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0e7a6b" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  clock:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0e7a6b" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin:      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0e7a6b" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>'
};

/** Build one event card from an API event object. */
function createEventCard(ev) {
  var card = document.createElement('article');
  card.className = 'event-card';

  var banner = document.createElement('img');
  banner.className = 'banner';
  banner.src = ev.image_url;
  banner.alt = ev.event_name;
  banner.loading = 'lazy';
  card.appendChild(banner);

  var body = document.createElement('div');
  body.className = 'body';

  var badges = document.createElement('div');
  badges.className = 'badges';
  badges.innerHTML =
    '<span class="badge badge-cat">' + escapeHtml(ev.category_name) + '</span>' +
    '<span class="badge badge-up">' + escapeHtml(ev.event_status) + '</span>';
  body.appendChild(badges);

  var h3 = document.createElement('h3');
  h3.textContent = ev.event_name;
  body.appendChild(h3);

  var desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = ev.event_description;
  body.appendChild(desc);

  var list = document.createElement('ul');
  list.className = 'meta-list';
  var timeText = escapeHtml(ev.start_time) + ' \u2013 ' + escapeHtml(ev.end_time);
  list.innerHTML =
    '<li>' + ICONS.calendar + '<span><b>Date:</b>' + formatDateLong(ev.event_date) + '</span></li>' +
    '<li>' + ICONS.clock + '<span><b>Time:</b>' + timeText + '</span></li>' +
    '<li>' + ICONS.pin + '<span><b>Place:</b>' + escapeHtml(ev.location) + '</span></li>';
  body.appendChild(list);

  var fundRow = document.createElement('div');
  fundRow.className = 'fund-row';
  fundRow.innerHTML =
    '<span class="raised">' + formatMoney(ev.current_amount) + ' raised</span>' +
    '<span class="goal">Goal ' + formatMoney(ev.goal_amount) + '</span>';
  body.appendChild(fundRow);

  var progress = document.createElement('div');
  progress.className = 'progress';
  var fill = document.createElement('div');
  fill.className = 'fill';
  fill.style.width = Math.min(Number(ev.progress_percent) || 0, 100) + '%';
  progress.appendChild(fill);
  body.appendChild(progress);

  var percent = document.createElement('div');
  percent.className = 'percent';
  percent.textContent = ev.progress_percent + '% of goal';
  body.appendChild(percent);

  var link = document.createElement('a');
  link.className = 'card-link';
  link.href = 'event.html?id=' + encodeURIComponent(ev.event_id);
  link.innerHTML = 'View event details <span class="arrow">&rarr;</span>';
  body.appendChild(link);

  card.appendChild(body);
  return card;
}

/** Render an array of events into a container element. */
function renderEvents(container, events) {
  container.innerHTML = '';
  events.forEach(function (ev) {
    container.appendChild(createEventCard(ev));
  });
}

/* ----------------------------- state boxes */
function makeStateBox(kind, text, withSpinner) {
  var box = document.createElement('div');
  box.className = 'state-box' + (kind === 'error' ? ' error' : '');
  if (withSpinner) {
    var sp = document.createElement('div');
    sp.className = 'spinner';
    box.appendChild(sp);
  }
  var p = document.createElement('p');
  p.textContent = text;
  box.appendChild(p);
  return box;
}

function showLoading(container, text) {
  container.innerHTML = '';
  container.appendChild(makeStateBox('loading', text, true));
}
function showEmpty(container, text) {
  container.innerHTML = '';
  container.appendChild(makeStateBox('empty', text, false));
}
function showError(container, text) {
  container.innerHTML = '';
  container.appendChild(makeStateBox('error', text, false));
}
