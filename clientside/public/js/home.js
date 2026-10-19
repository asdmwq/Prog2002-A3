/**
 * home.js
 * Home page logic:
 *   - load upcoming events for the hero count and the events grid
 *   - load categories for the on-page filter
 *   - re-render the grid when the category filter changes
 */
(function () {
  var grid = document.getElementById('eventsGrid');
  var countText = document.getElementById('eventsCountText');
  var statCount = document.getElementById('statCount');
  var categorySelect = document.getElementById('homeCategory');

  var allEvents = [];

  /** Draw the grid for the currently selected category. */
  function draw(categoryId) {
    var list = categoryId
      ? allEvents.filter(function (e) { return String(e.category_id) === String(categoryId); })
      : allEvents;

    renderEvents(grid, list);
    countText.textContent = list.length + ' upcoming event' + (list.length === 1 ? '' : 's') + ' available.';
  }

  /** Fetch categories and fill the filter dropdown. */
  function loadCategories() {
    return fetch(API_BASE + '/categories')
      .then(function (res) {
        if (!res.ok) throw new Error('Could not load categories (HTTP ' + res.status + ')');
        return res.json();
      })
      .then(function (categories) {
        categories.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c.category_id;
          opt.textContent = c.category_name + ' (' + c.active_event_count + ')';
          categorySelect.appendChild(opt);
        });
      });
  }

  /** Fetch the upcoming events shown on the home page. */
  function loadEvents() {
    showLoading(grid, 'Loading upcoming events\u2026');
    return fetch(API_BASE + '/events')
      .then(function (res) {
        if (!res.ok) throw new Error('Could not load events (HTTP ' + res.status + ')');
        return res.json();
      })
      .then(function (events) {
        allEvents = events;
        statCount.textContent = events.length;
        if (events.length === 0) {
          showEmpty(grid, 'There are no upcoming events at the moment. Please check back soon.');
          countText.textContent = '0 upcoming events available.';
        } else {
          draw('');
        }
      });
  }

  categorySelect.addEventListener('change', function () {
    draw(categorySelect.value);
  });

  Promise.all([loadEvents(), loadCategories()]).catch(function (err) {
    statCount.textContent = '\u2013';
    showError(grid, 'We could not reach the events service. Please make sure the API is running and try again.');
    countText.textContent = 'Unable to load events.';
    console.error(err);
  });
})();
