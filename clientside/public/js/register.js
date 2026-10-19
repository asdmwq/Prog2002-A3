/**
 * register.js
 * Event registration page (A3):
 *   - loads the event summary from GET /api/events/:id
 *   - collects the user's details and number of tickets
 *   - performs client-side validation and shows inline errors
 *   - computes the total live (server recomputes it authoritatively)
 *   - POSTs to /api/events/:id/registrations
 *   - shows a confirmation panel, or a 409 "already registered" message
 */
(function () {
  var loading = document.getElementById('regLoading');
  var notFound = document.getElementById('regNotFound');
  var grid = document.getElementById('registerGrid');
  var notFoundText = document.getElementById('notFoundText');
  var formError = document.getElementById('formError');
  var form = document.getElementById('registerForm');
  var formCard = document.getElementById('formCard');
  var successCard = document.getElementById('successCard');
  var submitBtn = document.getElementById('submitBtn');

  var currentEvent = null;

  function getEventId() {
    var raw = new URLSearchParams(location.search).get('id');
    if (raw === null || !/^\d+$/.test(raw) || Number(raw) < 1) return null;
    return Number(raw);
  }

  function showNotFound(message) {
    loading.style.display = 'none';
    grid.style.display = 'none';
    if (message) notFoundText.textContent = message;
    notFound.style.display = '';
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function showError(message) {
    formError.textContent = message;
    formError.classList.add('show');
    formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function clearError() {
    formError.textContent = '';
    formError.classList.remove('show');
  }

  function recalcTotal() {
    var unit = currentEvent ? Number(currentEvent.ticket_price) || 0 : 0;
    var n = parseInt(document.getElementById('tickets').value, 10);
    if (!Number.isInteger(n) || n < 1) n = 1;
    if (n > 20) n = 20;
    document.getElementById('totalAmount').textContent = formatMoney(unit * n);
  }

  function renderEvent(ev) {
    currentEvent = ev;
    document.getElementById('rBanner').src = ev.image_url;
    document.getElementById('rBanner').alt = ev.event_name;
    document.getElementById('rCategory').textContent = ev.category_name;
    document.getElementById('rStatus').textContent = ev.event_status;
    document.getElementById('rName').textContent = ev.event_name;
    document.getElementById('rDate').textContent = formatDateLong(ev.event_date);
    document.getElementById('rTime').textContent = ev.start_time + ' \u2013 ' + ev.end_time;
    document.getElementById('rLocation').textContent = ev.location + ', ' + ev.city;
    document.getElementById('rHost').textContent = ev.organisation_name;
    document.getElementById('rRaised').textContent = formatMoney(ev.current_amount);
    document.getElementById('rGoal').textContent = formatMoney(ev.goal_amount);
    document.getElementById('rProgressFill').style.width =
      Math.min(Number(ev.progress_percent) || 0, 100) + '%';

    document.getElementById('unitPrice').textContent =
      Number(ev.ticket_price) === 0 ? 'Free entry' : formatMoney(ev.ticket_price) + ' / ticket';

    var today = new Date().toISOString().slice(0, 10);
    document.getElementById('regDate').value = formatDateLong(today);
    recalcTotal();

    document.title = 'Register – ' + ev.event_name;
    document.getElementById('viewEventBtn').href = 'event.html?id=' + ev.event_id;

    loading.style.display = 'none';
    grid.style.display = '';
  }

  // Load the event.
  var id = getEventId();
  if (id === null) {
    showNotFound('No valid event id was given in the link.');
  } else {
    fetch(API_BASE + '/events/' + id)
      .then(function (res) {
        if (res.status === 404) {
          showNotFound('That event is not open for registration. It may have passed or been suspended.');
          throw new Error('not found');
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(renderEvent)
      .catch(function (err) {
        if (err.message === 'not found') return;
        showNotFound('The event service could not be reached. Please make sure the API is running.');
        console.error(err);
      });
  }

  // Recalculate the total whenever the ticket count changes.
  document.getElementById('tickets').addEventListener('input', recalcTotal);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();
    if (!currentEvent) return;

    var first = document.getElementById('firstName').value.trim();
    var last = document.getElementById('lastName').value.trim();
    var email = document.getElementById('email').value.trim();
    var phone = document.getElementById('phone').value.trim();
    var tickets = parseInt(document.getElementById('tickets').value, 10);

    var errors = [];
    if (first.length < 2 || first.length > 80) errors.push('Please enter your first name (2–80 characters).');
    if (last.length < 2 || last.length > 80) errors.push('Please enter your last name (2–80 characters).');
    if (!isEmail(email) || email.length > 150) errors.push('Please enter a valid email address.');
    if (phone && phone.length > 30) errors.push('Phone number must be 30 characters or fewer.');
    if (!Number.isInteger(tickets) || tickets < 1 || tickets > 20) {
      errors.push('Number of tickets must be a whole number between 1 and 20.');
    }
    if (errors.length) {
      showError(errors.join(' '));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    var payload = {
      first_name: first,
      last_name: last,
      email: email,
      phone: phone,
      ticket_count: tickets
    };

    fetch(API_BASE + '/events/' + currentEvent.event_id + '/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, data: data };
        });
      })
      .then(function (result) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm registration';

        if (result.status === 201) {
          showSuccess(result.data.registration, payload);
          return;
        }
        // 409 duplicate, 400 validation/closed, anything else -> show the API message.
        showError(result.data && result.data.error
          ? result.data.error
          : 'Your registration could not be completed. Please try again.');
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm registration';
        showError('The registration service could not be reached. Please make sure the API is running and try again.');
      });
  });

  function li(label, value) {
    return '<li><span>' + label + '</span><b>' + escapeHtml(value) + '</b></li>';
  }

  function showSuccess(reg, payload) {
    var r = reg || {};
    var name = (payload.first_name || '') + ' ' + (payload.last_name || '');
    var total = r.total_amount != null ? Number(r.total_amount) : Number(currentEvent.ticket_price) * payload.ticket_count;
    var dateText = (r.registered_at || document.getElementById('regDate').value);

    document.getElementById('successText').textContent =
      'Thank you, ' + name + '! Your registration for ' + currentEvent.event_name + ' is confirmed.';
    document.getElementById('successSummary').innerHTML =
      li('Name', name.trim()) +
      li('Email', payload.email) +
      (payload.phone ? li('Phone', payload.phone) : '') +
      li('Tickets', String(r.ticket_count || payload.ticket_count)) +
      li('Total amount', formatMoney(total)) +
      li('Registered', dateText);

    formCard.style.display = 'none';
    successCard.style.display = '';
    successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Back link: use history when possible.
  document.getElementById('backLink').addEventListener('click', function (e) {
    if (history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });
})();
