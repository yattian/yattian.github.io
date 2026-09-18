/* Three behaviours: video previews, YouTube players that load on click, and a lightbox on the captures. */

(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function playQuietly(video) {
    var attempt = video.play();
    if (attempt && typeof attempt.catch === "function") { attempt.catch(function () {}); }
  }

  /* Count-up, once per visit. The HTML already holds the final numbers, so screen readers and
     visitors without JavaScript get them straight away; this only animates what is drawn.
     Starts 150ms after the name lands, runs 1200ms on an exponential ease-out. */
  var counts = document.querySelectorAll(".count");
  if (counts.length && !reduced.matches) {
    var START_AT = 570;
    var DURATION = 1200;
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var tooLate = new Promise(function (resolve) { setTimeout(function () { resolve("late"); }, 1000); });

    Promise.race([fontsReady, tooLate]).then(function (result) {
      if (result === "late") { return; } /* slow fonts: leave the final numbers alone rather than flash them */

      var items = Array.prototype.map.call(counts, function (el) {
        el.style.minWidth = el.getBoundingClientRect().width + "px"; /* the "+" never shifts */
        var item = { el: el, to: Number(el.dataset.to) };
        el.textContent = "0";
        return item;
      });

      setTimeout(function () {
        var startedAt = performance.now();
        requestAnimationFrame(function tick(now) {
          var t = Math.min(1, (now - startedAt) / DURATION);
          var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
          items.forEach(function (item) {
            item.el.textContent = Math.round(item.to * eased).toLocaleString("en-US");
          });
          if (t < 1) { requestAnimationFrame(tick); }
        });
      }, Math.max(0, START_AT - performance.now()));
    });
  }

  /* Scroll cue: fades once the visitor has scrolled past 40px, comes back at the top. */
  var home = document.querySelector(".home");
  var sentinel = document.querySelector(".home__sentinel");
  if (home && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      home.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* Videos. Hovering plays a silent preview from the first frame, with no controls, so it cannot
     be unmuted. Pressing Play hands it over: it restarts from the beginning with sound and full
     controls, and hovering never touches it again. */
  Array.prototype.forEach.call(document.querySelectorAll(".vidwrap"), function (wrap) {
    var video = wrap.querySelector("video");
    var button = wrap.querySelector(".vid__play");
    var owned = false;

    video.controls = false;
    video.muted = true;

    wrap.addEventListener("mouseenter", function () {
      if (owned || reduced.matches || !finePointer.matches) { return; }
      video.muted = true;
      video.currentTime = 0;
      wrap.classList.add("is-previewing");
      playQuietly(video);
    });

    wrap.addEventListener("mouseleave", function () {
      if (owned) { return; }
      wrap.classList.remove("is-previewing");
      video.pause();
      video.currentTime = 0;
    });

    button.addEventListener("click", function () {
      owned = true;
      wrap.classList.remove("is-previewing");
      button.hidden = true;
      video.controls = true;
      video.muted = false;
      video.currentTime = 0;
      playQuietly(video);
      video.focus();
    });
  });

  /* YouTube. The page ships a local still and a link; the player only loads when asked for. */
  Array.prototype.forEach.call(document.querySelectorAll(".yt"), function (box) {
    var link = box.querySelector(".yt__play");
    link.addEventListener("click", function (event) {
      event.preventDefault();
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + box.dataset.yt +
        "?autoplay=1&rel=0&start=" + (box.dataset.start || "0");
      iframe.title = box.dataset.title || "YouTube video";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      box.replaceChildren(iframe);
      iframe.focus();
    });
  });

  /* Lightbox on the captures. */
  var dialog = document.getElementById("lightbox");
  if (!dialog || typeof dialog.showModal !== "function") { return; }

  var target = dialog.querySelector("img");
  var closeButton = dialog.querySelector(".lightbox__close");

  Array.prototype.forEach.call(document.querySelectorAll(".capture img"), function (image) {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-haspopup", "dialog");

    function open() {
      target.src = image.currentSrc || image.src;
      target.alt = image.alt;
      dialog.showModal();
    }

    image.addEventListener("click", open);
    image.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  closeButton.addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) { dialog.close(); }
  });
  dialog.addEventListener("close", function () {
    target.src = "";
    target.alt = "";
  });
})();
