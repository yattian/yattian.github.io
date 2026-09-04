/* The Record Board
   - Odometer: figures roll up from zero like a board flipping, once, on entry.
   - Nav rail reveals once the board has been passed.
   - Screenshot lightbox.
   Motion grammar: things move on the vertical axis in discrete steps.
   Nothing fades, nothing floats. */

(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Odometer -------------------------------------------------------------
  // Each digit becomes a strip of 0-9 plus the target digit, translated up so
  // it rolls through every numeral before settling on the real one.
  function buildOdometer(el) {
    var value = el.getAttribute('data-value') || '';
    var frag = document.createDocumentFragment();
    var digitIndex = 0;
    // The board score is part of the arrival sequence, so it waits its turn.
    var base = el.closest('.board') ? 450 : 0;

    for (var i = 0; i < value.length; i++) {
      var ch = value[i];

      if (ch < '0' || ch > '9') {
        var sep = document.createElement('span');
        sep.className = ch === '+' ? 'sep plus' : 'sep';
        sep.textContent = ch;
        frag.appendChild(sep);
        continue;
      }

      var cell = document.createElement('span');
      cell.className = 'd';

      var strip = document.createElement('span');
      strip.className = 'strip';
      // 0 through 9, then the real digit at index 10.
      for (var n = 0; n <= 9; n++) {
        var slot = document.createElement('i');
        slot.textContent = String(n);
        strip.appendChild(slot);
      }
      var last = document.createElement('i');
      last.textContent = ch;
      strip.appendChild(last);

      // Later digits land after earlier ones, so the figure settles left to right.
      strip.style.transitionDelay = (base + digitIndex * 90) + 'ms';
      digitIndex++;

      cell.appendChild(strip);
      frag.appendChild(cell);
    }

    el.appendChild(frag);
  }

  var odos = Array.prototype.slice.call(document.querySelectorAll('.odo'));
  odos.forEach(buildOdometer);

  function roll(el) { el.classList.add('roll'); }

  if (reduced || !('IntersectionObserver' in window)) {
    odos.forEach(roll);
  } else {
    var odoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        roll(entry.target);
        odoObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    odos.forEach(function (el) { odoObserver.observe(el); });
  }

  // --- Nav rail: only once the board is behind you --------------------------
  var rail = document.getElementById('rail');
  var board = document.querySelector('.board');

  if (rail && board && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      rail.classList.toggle('on', !entries[0].isIntersecting);
    }, { threshold: 0, rootMargin: '-70% 0px 0px 0px' }).observe(board);
  } else if (rail) {
    rail.classList.add('on');
  }

  // --- Scroll cue -----------------------------------------------------------
  // The board gets three seconds alone before anything asks you to move on.
  // If you already scrolled, the invitation is moot and never appears.
  var cue = document.getElementById('cue');

  if (cue) {
    var cueShown = false;
    var cueTimer = setTimeout(function () {
      if (window.scrollY > 40) return;
      cue.classList.add('on');
      cueShown = true;
    }, 3000);

    var retire = function () {
      if (window.scrollY <= 40) return;
      clearTimeout(cueTimer);
      if (cueShown) cue.classList.remove('on');
      window.removeEventListener('scroll', retire);
    };
    window.addEventListener('scroll', retire, { passive: true });
  }

  // --- Lightbox -------------------------------------------------------------
  var modal = document.getElementById('modal');

  if (modal) {
    var closeBtn = modal.querySelector('.modal-x');
    var img = document.createElement('img');
    img.alt = '';
    modal.appendChild(img);

    var lastFocused = null;

    function open(source) {
      lastFocused = document.activeElement;
      img.src = source.src;
      img.alt = source.alt;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      modal.classList.remove('open');
      img.removeAttribute('src');
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('.plates img, .shots img, .wide-plate img').forEach(function (thumb) {
      thumb.addEventListener('click', function () { open(thumb); });
    });

    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target === closeBtn) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }
})();
