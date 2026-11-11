/* Frontend settings. Configured for Africa University Portfolio & Recommendation System */
(function () {
  var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  var isTunnel = window.location.hostname.includes('trycloudflare.com') ||
                 window.location.hostname.includes('loca.lt') ||
                 window.location.hostname.includes('ngrok') ||
                 /^(172|192|10)\./.test(window.location.hostname);

  // Point to local development backend, public showcase tunnel, or Render production deployment
  var defaultBase = (isLocal || isTunnel)
    ? (window.location.port === '8000' ? 'http://localhost:5000' : window.location.origin)
    : 'https://aureco-back.onrender.com';

  window.AU_CONFIG = {
    // true  = use production backend through js/api.js
    // false = demo mode (browser only)
    USE_BACKEND: true,

    // Where your backend lives.
    API_BASE_URL: defaultBase,

    // Endpoint paths
    ENDPOINTS: {
      login:          '/api/auth/login',
      logout:         '/api/auth/logout',
      signup:         '/api/auth/signup',
      verifyCode:     '/api/auth/verify-code',
      changePassword: '/api/auth/change-password',
      state:          '/api/state',
      aiLetter:       '/api/ai/recommendation-letter',
      aiReview:       '/api/ai/portfolio-review',
      aiImprove:      '/api/ai/improve-project',
      aiDraftEmail:   '/api/ai/draft-request-email',
      guestAccess:    '/api/guest/letter/access',
      guestSubmit:    '/api/guest/letter',
      guestVerify:    '/api/guest/verify',
      publicProfile:  '/api/public/profile',
      letterRequest:  '/api/letters/request',
      verifyActivity: '/api/letters/verify-activity',
      directory:      '/api/directory/search',
      oppNotify:      '/api/opportunities/notify-application'
    },

    // Bearer token used by default
    WITH_CREDENTIALS: false,

    // Debounce delay (ms) for pushing state updates to the server
    SAVE_DELAY_MS: 600
  };
})();
