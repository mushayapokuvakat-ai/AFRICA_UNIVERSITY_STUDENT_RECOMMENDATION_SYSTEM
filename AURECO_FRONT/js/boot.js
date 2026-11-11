/* Loads the app after the backend (if any) has supplied the signed-in person's data. */
(function () {
  function run() { var s = document.createElement('script'); s.src = 'js/app.js?v=' + Date.now(); document.body.appendChild(s); }
  window.AuAPI.bootstrap().then(run, run);
})();
