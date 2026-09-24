/* BEMA Groupe — vanilla JS, no dependencies */

document.addEventListener('DOMContentLoaded', function () {
  var body = document.body;
  var header = document.querySelector('.site-header');
  var mobile = window.matchMedia('(max-width: 768px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------- Splash (shown by the inline <head> script, once per session) ---------------- */
  var root = document.documentElement;
  var splash = document.querySelector('.splash');
  if (splash && root.classList.contains('is-splash')) {
    var door = splash.querySelector('.splash-panel--bottom');
    var doorAnim = door.getAnimations ? door.getAnimations()[0] : null;
    var t0 = performance.now();
    var elapsed = function () {
      return doorAnim && doorAnim.currentTime !== null ? doorAnim.currentTime : performance.now() - t0;
    };
    var finished = false;
    var revealHero = function () { root.classList.add('hero-reveal'); };
    var revealTimer = setTimeout(revealHero, Math.max(0, 1850 - elapsed()));
    var skipEvents = ['wheel', 'touchmove', 'keydown'];

    var finish = function () {
      if (finished) { return; }
      finished = true;
      clearTimeout(revealTimer);
      revealHero();
      splash.remove();
      root.classList.remove('is-splash');
      skipEvents.forEach(function (type) { window.removeEventListener(type, skip); });
    };
    var skip = function () {
      if (finished || splash.classList.contains('is-skipping') || elapsed() > 1750) { return; }
      clearTimeout(revealTimer);
      revealHero();
      splash.classList.add('is-skipping');
      setTimeout(finish, 650);
    };

    door.addEventListener('animationend', finish);
    splash.addEventListener('pointerdown', skip);
    skipEvents.forEach(function (type) { window.addEventListener(type, skip, { passive: true }); });
    setTimeout(finish, Math.max(0, 3200 - elapsed()));
  }

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
      if (returnFocus) { returnFocus.focus({ preventScroll: true }); returnFocus = null; }
      if (pushedState) {
        pushedState = false;
        if (!fromHistory) { history.back(); }
      }
    }

    var returnFocus = null;
    document.querySelectorAll('[data-lightbox]').forEach(function (item) {
      item.addEventListener('click', function () { open(item); });
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('keydown', function (e) {
        if (lightbox.classList.contains('is-open') || (e.key !== 'Enter' && e.key !== ' ')) { return; }
        e.preventDefault();
        open(item);
        returnFocus = item;
        if (lbClose) { lbClose.focus({ preventScroll: true }); }
      });
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

  /* ---------------- Finishing touches: image fade-in, reveal on scroll, count-up ---------------- */
  if (reduceMotion.matches) { return; }

  // Photos fade in once loaded; anything already loaded is never hidden (logos and hero excluded)
  document.querySelectorAll('.universe-card > img, .team-photo img, .gallery-item img, .carousel-slide img, .feature-media img, .event-media img').forEach(function (img) {
    if (img.complete) { return; }
    img.classList.add('img-pending');
    function done() { img.classList.remove('img-pending'); img.classList.add('img-in'); }
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  if (!('IntersectionObserver' in window)) { return; }

  // Only what starts below the fold: content already on screen is never hidden after the fact
  var fold = window.innerHeight;
  var belowFold = function (el) { return el.getBoundingClientRect().top > fold; };

  var staggerSel = '.universe-grid, .team-grid, .testimonial-grid, .gallery-grid, .service-grid, .mascot-block, .timeline, .entity-select-grid, .grid-2, .grid-3, .feature-row, .stats-bar';
  var revealEls = Array.prototype.filter.call(document.querySelectorAll(
    'main > .section > .container:not(.legal-content) > :not(.slider-progress), main > .stats-bar, .cta-band-inner > *'
  ), belowFold);
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      // Still below the viewport: wait. Intersecting, or already scrolled past: show.
      if (!entry.isIntersecting && entry.boundingClientRect.top > 0) { return; }
      entry.target.classList.add('is-in');
      revealIO.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach(function (el) {
    el.classList.add('reveal');
    if (el.matches(staggerSel)) {
      el.classList.add('reveal--stagger');
      Array.prototype.forEach.call(el.children, function (child, i) {
        child.style.setProperty('--reveal-i', Math.min(i, 6));
      });
    }
    revealIO.observe(el);
  });

  // Stats count up once; a hidden copy of the final value keeps the width steady
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) { return; }
      countIO.unobserve(entry.target);
      entry.target.bemaCount();
    });
  }, { threshold: 0.6 });
  Array.prototype.filter.call(document.querySelectorAll('.stats-bar .stat-number'), belowFold).forEach(function (el) {
    var original = el.textContent;
    var m = original.match(/^(\D*)(\d+)(.*)$/);
    if (!m) { return; }
    var target = parseInt(m[2], 10);
    var wrap = document.createElement('span');
    var live = document.createElement('span');
    var ghost = document.createElement('span');
    wrap.className = 'stat-count';
    live.className = 'stat-count-live';
    ghost.className = 'stat-count-final';
    live.textContent = '0';
    ghost.textContent = m[2];
    wrap.append(live, ghost);
    el.textContent = m[1];
    el.append(wrap, m[3]);
    el.bemaCount = function () {
      var start = null;
      requestAnimationFrame(function frame(now) {
        if (start === null) { start = now; }
        var t = Math.min((now - start) / 1400, 1);
        live.textContent = Math.round(target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) { requestAnimationFrame(frame); } else { el.textContent = original; }
      });
    };
    countIO.observe(el);
  });
});
