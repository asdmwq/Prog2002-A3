/**
 * nav.js
 * Highlights the navigation link for the current page and drives the
 * mobile hamburger menu.
 */
(function () {
  var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var current = page === '' || page === 'index.html' ? 'home'
              : page === 'search.html' ? 'search' : null;

  document.querySelectorAll('.main-nav a').forEach(function (a) {
    if (a.getAttribute('data-page') === current) {
      a.classList.add('active');
    }
  });

  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close the mobile menu after following a link.
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();
