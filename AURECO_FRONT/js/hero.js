/* Typewriter hero, reading progress bar and footer year */
(function () {
  document.getElementById("year").textContent = new Date().getFullYear();
  var words = ["Developer", "Designer", "Student"],
    w = 0,
    c = 0,
    del = false,
    reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__typerText = "";
  function tick() {
    var el = document.getElementById("typer"),
      d = del ? 55 : 95;
    if (reduce) {
      window.__typerText = words[0];
      if (el) el.textContent = words[0];
      return setTimeout(tick, 600);
    }
    var word = words[w];
    c += del ? -1 : 1;
    window.__typerText = word.slice(0, c);
    if (el) el.textContent = window.__typerText;
    if (!del && c === word.length) {
      del = true;
      d = 1400;
    } else if (del && c === 0) {
      del = false;
      w = (w + 1) % words.length;
      d = 350;
    }
    setTimeout(tick, d);
  }
  tick();
  var bar = document.getElementById("progress-bar");
  function upd() {
    var h = document.documentElement,
      max = h.scrollHeight - h.clientHeight;
    bar.style.width =
      (max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0) + "%";
  }
  addEventListener("scroll", upd, { passive: true });
  addEventListener("resize", upd);
  addEventListener("hashchange", function () {
    setTimeout(upd, 60);
  });
  upd();
})();
