/* BEMA Groupe — vanilla JS, no dependencies */

document.addEventListener('DOMContentLoaded', function () {
  var body = document.body;
  var header = document.querySelector('.site-header');
  var mobile = window.matchMedia('(max-width: 768px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function onFrame(fn) {
    var ticking = false;
    return function () {
      if (ticking) { return; }
      ticking = true;
      requestAnimationFrame(function () { ticking = false; fn(); });
    };
  }

  /* ---------------- Menu ---------------- */
  var toggle = document.querySelector('.menu-toggle');
  var panel = document.querySelector('.menu-panel');

  function closeMenu() {
    if (!toggle || !panel) { return; }
    toggle.classList.remove('is-open');
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
  }

  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      if (panel.classList.contains('is-open')) { closeMenu(); return; }
      if (header) { header.classList.remove('is-hidden'); }
      toggle.classList.add('is-open');
      panel.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('menu-open');
    });
    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  /* ---------------- Header retracts on scroll down (mobile only) ---------------- */
  if (header) {
    var lastY = window.scrollY;
    var turnY = lastY;
    var direction = 0;
    window.addEventListener('scroll', onFrame(function () {
      var y = window.scrollY;
      var step = y - lastY;
      if (step !== 0 && (step > 0 ? 1 : -1) !== direction) {
        direction = step > 0 ? 1 : -1;
        turnY = lastY;
      }
      lastY = y;
      if (!mobile.matches || body.classList.contains('menu-open') || y < 160) {
        header.classList.remove('is-hidden');
      } else if (direction > 0 && y - turnY > 24) {
        header.classList.add('is-hidden');
      } else if (direction < 0 && turnY - y > 24) {
        header.classList.remove('is-hidden');
      }
    }), { passive: true });
  }

  /* ---------------- Progress bar under swipeable rows ---------------- */
  var sliderSelector = '.universe-grid, .team-grid, .testimonial-grid, .gallery-grid, .service-grid, .mascot-block, .timeline';
  document.querySelectorAll(sliderSelector).forEach(function (row) {
    var bar = document.createElement('div');
    var thumb = document.createElement('span');
    bar.className = 'slider-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.appendChild(thumb);
    row.insertAdjacentElement('afterend', bar);

    function update() {
      var max = row.scrollWidth - row.clientWidth;
      if (max <= 2) { bar.hidden = true; return; }
      bar.hidden = false;
      var ratio = row.clientWidth / row.scrollWidth;
      var progress = row.scrollLeft / max;
      thumb.style.width = (ratio * 100) + '%';
      thumb.style.transform = 'translateX(' + (progress * (1 / ratio - 1) * 100) + '%)';
    }
    row.addEventListener('scroll', onFrame(update), { passive: true });
    window.addEventListener('resize', onFrame(update));
    update();
  });

  /* ---------------- Carousel (native scroll-snap, no autoplay) ---------------- */
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var dotsWrap = carousel.querySelector('.carousel-dots');
    if (!track || !track.children.length) { return; }
    var count = track.children.length;
    var dots = [];

    function current() { return Math.round(track.scrollLeft / track.clientWidth); }
    function goTo(i) {
      i = (i + count) % count;
      track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }

    if (dotsWrap) {
      for (var i = 0; i < count; i++) {
        var dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', 'Aller à la photo ' + (i + 1));
        dot.addEventListener('click', goTo.bind(null, i));
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    }

    function syncDots() {
      var idx = current();
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === idx); });
    }

    var prev = carousel.querySelector('.carousel-arrow--prev');
    var next = carousel.querySelector('.carousel-arrow--next');
    if (prev) { prev.addEventListener('click', function () { goTo(current() - 1); }); }
    if (next) { next.addEventListener('click', function () { goTo(current() + 1); }); }
    track.addEventListener('scroll', onFrame(syncDots), { passive: true });
    syncDots();
  });

  /* ---------------- Lightbox: swipe, swipe-down to close, back button closes ---------------- */
  var lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('img');
    var lbClose = lightbox.querySelector('.lightbox-close');
    var lbCount = document.createElement('span');
    var lbPrev = document.createElement('button');
    var lbNext = document.createElement('button');
    lbCount.className = 'lightbox-count';
    lbPrev.className = 'lightbox-nav lightbox-nav--prev';
    lbNext.className = 'lightbox-nav lightbox-nav--next';
    lbPrev.setAttribute('aria-label', 'Photo précédente');
    lbNext.setAttribute('aria-label', 'Photo suivante');
    lbPrev.textContent = '←';
    lbNext.textContent = '→';
    lightbox.append(lbCount, lbPrev, lbNext);
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');

    var group = [];
    var index = 0;
    var pushedState = false;

    function show(i) {
      index = (i + group.length) % group.length;
      var item = group[index];
      var thumbImg = item.querySelector('img');
      lbImg.src = item.getAttribute('data-lightbox');
      lbImg.alt = thumbImg ? thumbImg.alt : '';
      lbCount.textContent = group.length > 1 ? (index + 1) + ' / ' + group.length : '';
      if (group.length > 1) {
        new Image().src = group[(index + 1) % group.length].getAttribute('data-lightbox');
      }
    }

    function open(item) {
      group = Array.prototype.slice.call(item.parentElement.querySelectorAll(':scope > [data-lightbox]'));
      var single = group.length < 2;
      lbPrev.hidden = single;
      lbNext.hidden = single;
      show(group.indexOf(item));
      lightbox.classList.add('is-open');
      body.classList.add('lightbox-open');
      if (!pushedState) {
        history.pushState({ bemaLightbox: true }, '');
        pushedState = true;
      }
    }

    function close(fromHistory) {
      if (!lightbox.classList.contains('is-open')) { return; }
      lightbox.classList.remove('is-open');
      body.classList.remove('lightbox-open');
      if (pushedState) {
        pushedState = false;
        if (!fromHistory) { history.back(); }
      }
    }

    document.querySelectorAll('[data-lightbox]').forEach(function (item) {
      item.addEventListener('click', function () { open(item); });
    });
    lbPrev.addEventListener('click', function () { show(index - 1); });
    lbNext.addEventListener('click', function () { show(index + 1); });
    if (lbClose) { lbClose.addEventListener('click', function () { close(false); }); }
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { close(false); }
    });
    window.addEventListener('popstate', function () { close(true); });

    var startX = null;
    var startY = 0;
    lightbox.addEventListener('touchstart', function (e) {
      var zoomed = window.visualViewport && window.visualViewport.scale > 1.05;
      if (e.touches.length !== 1 || zoomed) { startX = null; return; }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      if (startX === null) { return; }
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && group.length > 1) {
        show(index + (dx < 0 ? 1 : -1));
      } else if (dy > 90 && dy > Math.abs(dx)) {
        close(false);
      }
    }, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) { return; }
      if (e.key === 'Escape') { close(false); }
      if (e.key === 'ArrowLeft') { show(index - 1); }
      if (e.key === 'ArrowRight') { show(index + 1); }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(); }
  });

  /* ---------------- Contact form ---------------- */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var successBox = document.getElementById('form-success');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      if (successBox) {
        successBox.classList.add('is-visible');
        successBox.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
      }
      contactForm.reset();
    });
  }

  /* ---------------- Entity picker (contact page) ---------------- */
  var entityCards = document.querySelectorAll('[data-select-entity]');
  entityCards.forEach(function (card) {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    function pick() {
      var select = document.getElementById('project-select');
      entityCards.forEach(function (c) { c.classList.toggle('is-selected', c === card); });
      if (select) {
        select.value = card.getAttribute('data-select-entity');
        select.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
      }
    }
    card.addEventListener('click', pick);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
    });
  });
});
