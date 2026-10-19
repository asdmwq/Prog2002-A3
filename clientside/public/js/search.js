/**
 * search.js
 * Search page logic:
 *   - populate the category dropdown from the API
 *   - validate the form on the client before sending a request
 *   - build a query string from the supplied filters only
 *   - render results, with loading / empty / error states
 *   - Clear Filters resets the form and the results area
 */
(function () {
  var form = document.getElementById('searchForm');
  var dateInput = document.getElementById('fDate');
  var locationInput = document.getElementById('fLocation');
  var categorySelect = document.getElementById('fCategory');
  var clearBtn = document.getElementById('clearBtn');
  var formError = document.getElementById('formError');

  var grid = document.getElementById('resultsGrid');
  var resultsCount = document.getElementById('resultsCount');
  var resultsPrompt = document.getElementById('resultsPrompt');

  // Dates in the past cannot match active events, so block them up front.
  function todayIso() {
    var d = new Date();
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mm + '-' + dd;
  }
  dateInput.min = todayIso();

  function showFormError(message) {
    formError.textContent = message;
    formError.classList.add('show');
  }
  function hideFormError() {
    formError.classList.remove('show');
    formError.textContent = '';
  }

  /** Populate the category dropdown. */
  fetch(API_BASE + '/categories')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (categories) {
      categories.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.category_id;
        opt.textContent = c.category_name + ' (' + c.active_event_count + ' active)';
        categorySelect.appendChild(opt);
      });
    })
    .catch(function (err) {
      showFormError('Could not load categories. Is the API running?');
      console.error(err);
    });

  /** Run a search from the current form values. */
  function runSearch() {
    hideFormError();

    var date = dateInput.value;
    var location = locationInput.value.trim();
    var categoryId = categorySelect.value;

    // Client-side validation.
    if (date && date < todayIso()) {
      showFormError('Please choose today\u2019s date or a future date.');
      return;
    }
    if (location.length > 100) {
      showFormError('Location must be 100 characters or fewer.');
      return;
    }

    var parts = [];
    if (date) parts.push('date=' + encodeURIComponent(date));
    if (location) parts.push('location=' + encodeURIComponent(location));
    if (categoryId) parts.push('category_id=' + encodeURIComponent(categoryId));

    var url = API_BASE + '/events/search' + (parts.length ? '?' + parts.join('&') : '');

    resultsPrompt.style.display = 'none';
    showLoading(grid, 'Searching events\u2026');
    resultsCount.textContent = 'Searching\u2026';

    fetch(url)
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (body) {
            throw new Error(body.error || 'HTTP ' + res.status);
          });
        }
        return res.json();
      })
      .then(function (events) {
        resultsCount.textContent = events.length + ' event' + (events.length === 1 ? '' : 's');
        if (events.length === 0) {
          showEmpty(grid, 'No active events match your filters. Try removing one or more criteria.');
        } else {
          renderEvents(grid, events);
        }
      })
      .catch(function (err) {
        resultsCount.textContent = '0 events';
        showError(grid, err.message || 'The search service could not be reached.');
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    runSearch();
  });

  clearBtn.addEventListener('click', function () {
    form.reset();
    hideFormError();
    grid.innerHTML = '';
    resultsCount.textContent = '0 events';
    resultsPrompt.style.display = '';
    resultsPrompt.textContent = 'Choose your filters and select Search Events.';
  });
})();
