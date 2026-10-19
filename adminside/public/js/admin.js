/**
 * admin.js
 * HeartBridge Admin Dashboard logic (A3).
 * Drives the single-page dashboard against the REST API:
 *   - list all events (GET /events/all) with stats
 *   - populate category / organisation dropdowns
 *   - create (POST), update (PUT), delete (DELETE) events
 *   - show the full registrations for an event while editing
 *   - handle 409 (cannot delete an event that has registrations)
 * Pure vanilla JS, no framework, no templating.
 */
(function () {
  // ---- DOM handles
  var tableBody = document.getElementById('eventTable');
  var tableEmpty = document.getElementById('tableEmpty');
  var searchInput = document.getElementById('tableSearch');
  var eventModal = document.getElementById('eventModal');
  var deleteModal = document.getElementById('deleteModal');
  var modalTitle = document.getElementById('modalTitle');
  var formError = document.getElementById('eventFormError');
  var deleteError = document.getElementById('deleteError');
  var deleteMsg = document.getElementById('deleteMsg');
  var regsFieldset = document.getElementById('regsFieldset');
  var editRegs = document.getElementById('editRegs');
  var saveBtn = document.getElementById('saveBtn');
  var toastEl = document.getElementById('toast');

  // form inputs
  var F = {
    name: document.getElementById('fName'),
    description: document.getElementById('fDescription'),
    purpose: document.getElementById('fPurpose'),
    category: document.getElementById('fCategory'),
    org: document.getElementById('fOrg'),
    date: document.getElementById('fDate'),
    start: document.getElementById('fStart'),
    end: document.getElementById('fEnd'),
    location: document.getElementById('fLocation'),
    city: document.getElementById('fCity'),
    price: document.getElementById('fPrice'),
    goal: document.getElementById('fGoal'),
    raised: document.getElementById('fRaised'),
    lat: document.getElementById('fLat'),
    lng: document.getElementById('fLng'),
    image: document.getElementById('fImage'),
    suspended: document.getElementById('fSuspended')
  };

  var allEvents = [];
  var categories = [];
  var orgs = [];
  var mode = 'create'; // 'create' | 'edit'
  var editingId = null;
  var pendingDeleteId = null;

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(v) {
    return '¥' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtDate(iso) {
    if (!iso) return '–';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ---- toast
  var toastTimer = null;
  function toast(message, type) {
    toastEl.textContent = message;
    toastEl.className = 'toast show ' + (type || 'success');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = 'toast'; }, 3400);
  }

  // ---- helpers
  function api(path, options) {
    return fetch(API_BASE + path, options || {}).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { status: res.status, data: data };
      });
    });
  }

  function statusOf(ev) {
    if (Number(ev.is_suspended) === 1) return { key: 'susp', label: 'Suspended' };
    if (ev.event_status === 'Past') return { key: 'past', label: 'Past' };
    return { key: 'up', label: 'Upcoming' };
  }

  // ---- render stats
  function renderStats(events) {
    var regs = events.reduce(function (s, e) { return s + Number(e.registration_count || 0); }, 0);
    var tickets = events.reduce(function (s, e) { return s + Number(e.total_tickets || 0); }, 0);
    var susp = events.filter(function (e) { return Number(e.is_suspended) === 1; }).length;
    var past = events.filter(function (e) { return Number(e.is_suspended) === 0 && e.event_status === 'Past'; }).length;
    var upcoming = events.length - susp - past;
    document.getElementById('statTotal').textContent = events.length;
    document.getElementById('statUpcoming').textContent = upcoming;
    document.getElementById('statPast').textContent = past;
    document.getElementById('statSuspended').textContent = susp;
    document.getElementById('statRegs').textContent = regs;
    document.getElementById('statTickets').textContent = tickets;
  }

  // ---- render table
  function renderTable() {
    var q = (searchInput.value || '').trim().toLowerCase();
    var rows = allEvents.filter(function (e) {
      if (!q) return true;
      var hay = [e.event_name, e.city, e.location, e.organisation_name, e.category_name].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    tableEmpty.style.display = rows.length ? 'none' : 'block';
    if (!allEvents.length) {
      tableBody.innerHTML = '<tr class="loading-row"><td colspan="8"><div class="table-empty">No events yet. Click "New event" to create one.</div></td></tr>';
      return;
    }

    tableBody.innerHTML = rows.map(function (e) {
      var st = statusOf(e);
      var percent = Math.min(Number(e.progress_percent) || 0, 100);
      return (
        '<tr data-id="' + e.event_id + '">' +
          '<td class="num">#' + e.event_id + '</td>' +
          '<td><div class="evt-cell">' +
            '<img class="evt-thumb" src="' + escapeHtml(e.image_url || '') + '" alt="" onerror="this.style.visibility=\'hidden\'">' +
            '<div><div class="evt-name">' + escapeHtml(e.event_name) + '</div>' +
            '<div class="evt-sub">' + escapeHtml(e.category_name) + ' · ' + escapeHtml(e.organisation_name) + '</div></div>' +
          '</div></td>' +
          '<td>' + fmtDate(e.event_date) + '</td>' +
          '<td class="num">' + (Number(e.ticket_price) === 0 ? 'Free' : money(e.ticket_price)) + '</td>' +
          '<td class="num"><div class="raised-cell">' +
            '<div class="raised-num">' + money(e.current_amount) + ' <span class="goal">/ ' + money(e.goal_amount) + '</span></div>' +
            '<div class="mini-progress"><i style="width:' + percent + '%"></i></div>' +
          '</div></td>' +
          '<td class="num"><span class="reg-count">' + e.registration_count + '</span>' +
            '<div class="reg-sub">' + (e.total_tickets || 0) + ' tickets</div></td>' +
          '<td><span class="pill pill-' + st.key + '">' + st.label + '</span></td>' +
          '<td><div class="row-actions">' +
            '<button class="btn btn-sm btn-edit" data-action="edit" data-id="' + e.event_id + '">Edit</button>' +
            '<button class="btn btn-sm btn-del" data-action="delete" data-id="' + e.event_id + '">Delete</button>' +
          '</div></td>' +
        '</tr>'
      );
    }).join('');
  }

  // ---- load all
  function loadEvents() {
    api('/events/all').then(function (r) {
      if (r.status !== 200) throw new Error('load failed');
      allEvents = r.data || [];
      renderStats(allEvents);
      renderTable();
    }).catch(function () {
      tableBody.innerHTML = '<tr class="loading-row"><td colspan="8"><div class="table-empty">Could not load events. Is the API running on port 3000?</div></td></tr>';
    });
  }

  function loadLookups() {
    return Promise.all([api('/categories'), api('/organisations')]).then(function (res) {
      if (res[0].status === 200) {
        categories = res[0].data || [];
        F.category.innerHTML = categories.map(function (c) {
          return '<option value="' + c.category_id + '">' + escapeHtml(c.category_name) + '</option>';
        }).join('');
      }
      if (res[1].status === 200) {
        orgs = res[1].data || [];
        F.org.innerHTML = orgs.map(function (o) {
          return '<option value="' + o.organisation_id + '">' + escapeHtml(o.name) + '</option>';
        }).join('');
      }
    });
  }

  // ---- modal open / close
  function resetForm() {
    document.getElementById('eventForm').reset();
    formError.className = 'alert';
    formError.textContent = '';
    Array.prototype.forEach.call(document.querySelectorAll('.field input.invalid, .field textarea.invalid'), function (el) {
      el.classList.remove('invalid');
    });
    F.price.value = 0;
    F.goal.value = 0;
    F.raised.value = 0;
    regsFieldset.style.display = 'none';
    editRegs.innerHTML = '';
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save event';
  }

  function openCreate() {
    mode = 'create';
    editingId = null;
    resetForm();
    modalTitle.textContent = 'Create new event';
    eventModal.classList.add('open');
    setTimeout(function () { F.name.focus(); }, 50);
  }

  function openEdit(id) {
    mode = 'edit';
    editingId = id;
    resetForm();
    modalTitle.textContent = 'Edit event #' + id;

    api('/events/admin/' + id).then(function (r) {
      if (r.status !== 200) {
        toast('Event not found.', 'error');
        return;
      }
      var e = r.data;
      F.name.value = e.event_name || '';
      F.description.value = e.event_description || '';
      F.purpose.value = e.purpose || '';
      F.category.value = e.category_id;
      F.org.value = e.organisation_id;
      F.date.value = e.event_date || '';
      F.start.value = e.start_time || '';
      F.end.value = e.end_time || '';
      F.location.value = e.location || '';
      F.city.value = e.city || '';
      F.price.value = Number(e.ticket_price) || 0;
      F.goal.value = Number(e.goal_amount) || 0;
      F.raised.value = Number(e.current_amount) || 0;
      F.lat.value = e.latitude == null ? '' : e.latitude;
      F.lng.value = e.longitude == null ? '' : e.longitude;
      F.image.value = e.image_url || '';
      F.suspended.checked = Number(e.is_suspended) === 1;

      renderEditRegistrations(e);
      eventModal.classList.add('open');
    });
  }

  function renderEditRegistrations(e) {
    var regs = e.registrations || [];
    regsFieldset.style.display = '';
    if (!regs.length) {
      editRegs.innerHTML = '<div class="regs-admin-head"><span class="regs-none">No registrations recorded yet.</span><b>0 total</b></div>';
      return;
    }
    var total = regs.reduce(function (s, r) { return s + Number(r.ticket_count || 0); }, 0);
    var rows = regs.map(function (r) {
      return (
        '<tr>' +
          '<td>' + escapeHtml(r.first_name + ' ' + r.last_name) + '</td>' +
          '<td>' + escapeHtml(r.email) + '</td>' +
          '<td>' + escapeHtml(r.phone || '–') + '</td>' +
          '<td class="num">' + r.ticket_count + '</td>' +
          '<td class="num">' + money(r.total_amount) + '</td>' +
          '<td>' + escapeHtml(r.registered_at || '') + '</td>' +
        '</tr>'
      );
    }).join('');
    editRegs.innerHTML =
      '<div class="regs-admin-head"><span class="regs-none">Full contact details are shown to administrators.</span><b>' +
        regs.length + ' people · ' + total + ' tickets</b></div>' +
      '<div style="overflow-x:auto"><table class="regs-admin-table"><thead><tr>' +
        '<th>Name</th><th>Email</th><th>Phone</th><th class="num">Tickets</th><th class="num">Total</th><th>Registered</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function closeEventModal() {
    eventModal.classList.remove('open');
  }

  // ---- collect + validate form
  function numOrNull(input) {
    if (input.value === '' || input.value == null) return null;
    var n = Number(input.value);
    return Number.isFinite(n) ? n : NaN;
  }

  function collectPayload() {
    var errors = [];
    function mark(input, bad) { if (bad) input.classList.add('invalid'); else input.classList.remove('invalid'); }

    var name = F.name.value.trim();
    var desc = F.description.value.trim();
    var purpose = F.purpose.value.trim();
    var location = F.location.value.trim();
    mark(F.name, name.length < 2);
    mark(F.description, desc.length < 10);
    mark(F.purpose, purpose.length < 10);
    mark(F.location, location.length < 2);
    if (name.length < 2) errors.push('Event name is required (min 2 characters).');
    if (desc.length < 10) errors.push('Description is required (min 10 characters).');
    if (purpose.length < 10) errors.push('Purpose is required (min 10 characters).');
    if (location.length < 2) errors.push('Location is required.');
    if (!F.date.value) errors.push('Event date is required.');
    if (!F.start.value || !F.end.value) errors.push('Start and end times are required.');
    if (F.start.value && F.end.value && F.end.value <= F.start.value) errors.push('End time must be later than start time.');
    if (!F.category.value) errors.push('Choose a category.');
    if (!F.org.value) errors.push('Choose an organisation.');

    var goal = Number(F.goal.value);
    if (!Number.isFinite(goal) || goal < 0) errors.push('Goal amount must be a non-negative number.');

    var payload = {
      event_name: name,
      event_description: desc,
      purpose: purpose,
      event_date: F.date.value,
      start_time: F.start.value,
      end_time: F.end.value,
      location: location,
      city: F.city.value.trim(),
      category_id: F.category.value ? Number(F.category.value) : undefined,
      organisation_id: F.org.value ? Number(F.org.value) : undefined,
      ticket_price: Number(F.price.value) || 0,
      goal_amount: Number.isFinite(goal) ? goal : 0,
      current_amount: Number(F.raised.value) || 0,
      image_url: F.image.value.trim(),
      is_suspended: F.suspended.checked ? 1 : 0
    };

    var lat = numOrNull(F.lat);
    var lng = numOrNull(F.lng);
    if (lat !== null && (Number.isNaN(lat) || lat < -90 || lat > 90)) errors.push('Latitude must be between -90 and 90.');
    if (lng !== null && (Number.isNaN(lng) || lng < -180 || lng > 180)) errors.push('Longitude must be between -180 and 180.');
    if (lat !== null && !Number.isNaN(lat)) payload.latitude = lat;
    if (lng !== null && !Number.isNaN(lng)) payload.longitude = lng;

    return { errors: errors, payload: payload };
  }

  function showFormError(msg) {
    formError.textContent = msg;
    formError.classList.add('show');
    formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function save() {
    formError.className = 'alert';
    formError.textContent = '';
    var collected = collectPayload();
    if (collected.errors.length) {
      showFormError(collected.errors.join(' '));
      return;
    }

    var url = mode === 'create' ? '/events' : '/events/' + editingId;
    var method = mode === 'create' ? 'POST' : 'PUT';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    api(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collected.payload)
    }).then(function (r) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save event';
      if (r.status === 201 || r.status === 200) {
        closeEventModal();
        toast(mode === 'create' ? 'Event created successfully.' : 'Event updated successfully.', 'success');
        loadEvents();
      } else {
        showFormError((r.data && r.data.error) || 'The event could not be saved.');
      }
    }).catch(function () {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save event';
      showFormError('Could not reach the API. Make sure it is running on port 3000.');
    });
  }

  // ---- delete
  function openDelete(id) {
    var ev = allEvents.find(function (x) { return x.event_id === id; });
    if (!ev) return;
    pendingDeleteId = id;
    deleteError.className = 'alert alert-danger';
    deleteError.textContent = '';
    deleteMsg.innerHTML =
      'Are you sure you want to delete <b>' + escapeHtml(ev.event_name) + '</b> (#' + id + ')? This cannot be undone.';
    deleteModal.classList.add('open');
  }
  function confirmDelete() {
    var btn = document.getElementById('confirmDelete');
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    api('/events/' + pendingDeleteId, { method: 'DELETE' }).then(function (r) {
      btn.disabled = false;
      btn.textContent = 'Delete event';
      if (r.status === 200) {
        deleteModal.classList.remove('open');
        toast('Event deleted.', 'success');
        loadEvents();
      } else if (r.status === 409) {
        // Blocked because registrations exist; the API message includes the count.
        deleteError.textContent =
          (r.data && r.data.error)
            ? r.data.error
            : 'This event cannot be deleted because it already has registrations.';
        deleteError.classList.add('show');
      } else {
        deleteError.textContent = (r.data && r.data.error) || 'Could not delete the event.';
        deleteError.classList.add('show');
      }
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Delete event';
      deleteError.textContent = 'Could not reach the API.';
      deleteError.classList.add('show');
    });
  }

  // ---- wire events
  document.getElementById('newEventBtn').addEventListener('click', openCreate);
  document.getElementById('closeModal').addEventListener('click', closeEventModal);
  document.getElementById('cancelBtn').addEventListener('click', closeEventModal);
  saveBtn.addEventListener('click', save);
  document.getElementById('deleteCancel').addEventListener('click', function () { deleteModal.classList.remove('open'); });
  document.getElementById('confirmDelete').addEventListener('click', confirmDelete);

  // Click outside modal to close.
  [eventModal, deleteModal].forEach(function (m) {
    m.addEventListener('mousedown', function (e) { if (e.target === m) m.classList.remove('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { eventModal.classList.remove('open'); deleteModal.classList.remove('open'); }
  });

  // Event delegation for edit/delete buttons.
  tableBody.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    var id = Number(btn.getAttribute('data-id'));
    if (btn.getAttribute('data-action') === 'edit') openEdit(id);
    else if (btn.getAttribute('data-action') === 'delete') openDelete(id);
  });

  // Table filter.
  searchInput.addEventListener('input', renderTable);

  // Public-site link: on a real host use same origin; locally use 8080.
  (function setPublicLink() {
    var host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
      document.getElementById('publicLink').href = 'http://localhost:8080';
    } else {
      document.getElementById('publicLink').href = '/';
    }
  })();

  // ---- boot
  loadLookups().then(loadEvents).catch(loadEvents);
})();
