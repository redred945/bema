/* ==========================================================================
   BEMA GROUPE — Script principal (vanilla JS, sans dépendance)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------------- Menu plein écran ---------------- */
  var toggle = document.querySelector('.menu-toggle');
  var panel = document.querySelector('.menu-panel');

  if (toggle && panel) {
    var closeMenu = function () {
      toggle.classList.remove('is-open');
      panel.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };
    var openMenu = function () {
      toggle.classList.add('is-open');
      panel.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    };
    toggle.addEventListener('click', function () {
      var isOpen = panel.classList.contains('is-open');
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });
    panel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); }
    });
  }

  /* ---------------- Lightbox galerie ---------------- */
  var lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    var lightboxImg = lightbox.querySelector('img');
    var lightboxClose = lightbox.querySelector('.lightbox-close');

    document.querySelectorAll('[data-lightbox]').forEach(function (item) {
      item.addEventListener('click', function () {
        var img = item.querySelector('img');
        var full = item.getAttribute('data-lightbox') || (img ? img.getAttribute('src') : '');
        if (full && lightboxImg) {
          lightboxImg.setAttribute('src', full);
          lightboxImg.setAttribute('alt', img ? img.getAttribute('alt') : '');
          lightbox.classList.add('is-open');
        }
      });
    });

    var closeLightbox = function () { lightbox.classList.remove('is-open'); };
    if (lightboxClose) { lightboxClose.addEventListener('click', closeLightbox); }
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { closeLightbox(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeLightbox(); }
    });
  }

  /* ---------------- Carrousel léger ---------------- */
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var slides = carousel.querySelectorAll('.carousel-slide');
    var prev = carousel.querySelector('.carousel-arrow--prev');
    var next = carousel.querySelector('.carousel-arrow--next');
    var dotsWrap = carousel.querySelector('.carousel-dots');
    if (!track || slides.length === 0) { return; }

    var index = 0;
    var dots = [];

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', 'Aller à la diapositive ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function update() {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      update();
    }

    if (prev) { prev.addEventListener('click', function () { goTo(index - 1); }); }
    if (next) { next.addEventListener('click', function () { goTo(index + 1); }); }

    var autoplay = carousel.getAttribute('data-autoplay');
    if (autoplay) {
      setInterval(function () { goTo(index + 1); }, parseInt(autoplay, 10) || 6000);
    }

    update();
  });

  /* ---------------- Formulaire de contact ---------------- */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var successBox = document.getElementById('form-success');
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        return;
      }
      if (successBox) {
        successBox.classList.add('is-visible');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      contactForm.reset();
    });
  }

  /* ---------------- Sélection d'entité (page contact) ---------------- */
  document.querySelectorAll('[data-select-entity]').forEach(function (card) {
    card.addEventListener('click', function () {
      var value = card.getAttribute('data-select-entity');
      var select = document.getElementById('project-select');
      if (select) {
        select.value = value;
        select.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

});
