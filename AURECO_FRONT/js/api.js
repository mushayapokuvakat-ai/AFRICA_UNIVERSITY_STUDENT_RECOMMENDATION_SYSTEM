/* Talks to your backend. The rest of the app only uses window.AuAPI. */
(function () {
  var C = window.AU_CONFIG || {};
  var EP = C.ENDPOINTS || {};
  var TOKEN_KEY = 'au_token';
  var timer = null, pending = null, inflight = false, dirty = false;

  function url(path) { return String(C.API_BASE_URL || '').replace(/\/+$/, '') + path; }

  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function setToken(t, keep) {
    try {
      sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY);
      if (t) (keep ? localStorage : sessionStorage).setItem(TOKEN_KEY, t);
    } catch (e) {}
  }

  function request(path, opts) {
    opts = opts || {};
    var headers = { 'Accept': 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    var t = getToken();
    if (t && opts.auth !== false) headers['Authorization'] = 'Bearer ' + t;
    return fetch(url(path), {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: C.WITH_CREDENTIALS ? 'include' : 'same-origin'
    }).then(function (res) {
      if (res.status === 204) return null;
      return res.text().then(function (txt) {
        var data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) {}
        if (!res.ok) {
          var err = new Error((data && data.message) || defaultMessage(res.status));
          err.status = res.status;
          if (res.status === 401 && opts.auth !== false) { setToken(''); if (api.onUnauthorized) api.onUnauthorized(); }
          throw err;
        }
        return data;
      });
    }, function () {
      throw new Error('We could not reach the server. Check your internet connection and try again.');
    });
  }

  function defaultMessage(status) {
    if (status === 401) return 'Your email, ID or password is not right.';
    if (status === 403) return 'You do not have permission to do that.';
    if (status === 413) return 'That is too much data to save. Try smaller images.';
    if (status >= 500) return 'The server had a problem. Please try again in a moment.';
    return 'Something went wrong (' + status + ').';
  }

  function sendNow() {
    if (inflight) { dirty = true; return; }
    if (!pending || !getToken()) return;
    var body = pending; pending = null; inflight = true;
    request(EP.state, { method: 'PUT', body: body }).then(function () {
      inflight = false; if (dirty) { dirty = false; sendNow(); }
    }, function (e) {
      inflight = false;
      if (e.status !== 401 && api.onError) api.onError('Your changes could not be saved. ' + e.message);
    });
  }

  var api = {
    onError: null, onUnauthorized: null,
    getToken: getToken,
    clearToken: function () { setToken(''); },
    login: function (role, id, password, keep) {
      return request(EP.login, { method: 'POST', auth: false, body: { role: role, id: id, password: password } }).then(function (r) {
        if (!r || (!r.token && !C.WITH_CREDENTIALS) || !r.userId) throw new Error('The server sent an unexpected sign-in reply.');
        if (r.token) setToken(r.token, keep);
        return r;
      });
    },
    logout: function () {
      if (getToken() && EP.logout) request(EP.logout, { method: 'POST' }).catch(function () {});
      setToken('');
    },
    signup: function (data) {
      return request(EP.signup, { method: 'POST', auth: false, body: data });
    },
    verifyCode: function (data) {
      return request(EP.verifyCode, { method: 'POST', auth: false, body: data });
    },
    changePassword: function (newPassword, confirmPassword) {
      return request(EP.changePassword || '/api/auth/change-password', {
        method: 'POST',
        body: { newPassword: newPassword, confirmPassword: confirmPassword }
      });
    },
    fetchState: function () { return request(EP.state); },
    /* Called by the app every time its data changes. Sends the latest copy after a short pause. */
    pushState: function (state) {
      pending = state; clearTimeout(timer);
      timer = setTimeout(sendNow, C.SAVE_DELAY_MS || 600);
    },
    /* Force immediate state push without waiting for debounce */
    flush: function () {
      if (timer) { clearTimeout(timer); timer = null; }
      if (pending) sendNow();
    },
    /* AI Features */
    aiLetter: function (data) {
      return request(EP.aiLetter, { method: 'POST', body: data });
    },
    aiReview: function (data) {
      return request(EP.aiReview, { method: 'POST', body: data });
    },
    aiImprove: function (data) {
      return request(EP.aiImprove, { method: 'POST', body: data });
    },
    aiDraftEmail: function (data) {
      return request(EP.aiDraftEmail, { method: 'POST', body: data });
    },
    searchDirectory: function (q) {
      return request((EP.directory || '/api/directory/search') + '?q=' + encodeURIComponent(q || ''));
    },
    requestLetter: function (data) {
      return request(EP.letterRequest || '/api/letters/request', { method: 'POST', body: data });
    },
    requestVerification: function (data) {
      return request(EP.verifyActivity || '/api/letters/verify-activity', { method: 'POST', body: data });
    },
    getGuestLetter: function (token, code, email) {
      return request(EP.guestAccess || '/api/guest/letter/access', {
        method: 'POST',
        auth: false,
        body: { token: token, accessCode: code, email: email }
      });
    },
    submitGuestLetter: function (token, data) {
      return request((EP.guestSubmit || '/api/guest/letter') + '/' + encodeURIComponent(token) + '/submit', {
        method: 'POST',
        auth: false,
        body: data
      });
    },
    getGuestVerify: function (token) {
      return request((EP.guestVerify || '/api/guest/verify') + '/' + encodeURIComponent(token), {
        method: 'GET',
        auth: false
      });
    },
    submitGuestVerify: function (token, data) {
      return request((EP.guestVerify || '/api/guest/verify') + '/' + encodeURIComponent(token), {
        method: 'POST',
        auth: false,
        body: data
      });
    },
    getPublicProfile: function (identifier) {
      return request((EP.publicProfile || '/api/public/profile') + '/' + encodeURIComponent(identifier), {
        method: 'GET',
        auth: false
      });
    },
    notifyOpportunityApplication: function (data) {
      return request(EP.oppNotify || '/api/opportunities/notify-application', {
        method: 'POST',
        body: data
      });
    },
    /* Runs once at start-up: if the person is already signed in, load their data first. */
    bootstrap: function () {
      if (!C.USE_BACKEND || !getToken()) return Promise.resolve();
      return api.fetchState().then(function (st) { window.__AU_BOOT_STATE = st; }, function () {});
    }
  };
  window.AuAPI = api;
  window.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && pending) sendNow(); });
})();
