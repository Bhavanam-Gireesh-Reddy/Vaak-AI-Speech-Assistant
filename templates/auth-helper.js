/**
 * auth-helper.js
 * Intercepts all fetch() calls and adds X-Auth-Token header from localStorage.
 * Also redirects unauthenticated users to /login on protected pages.
 * Include this in every page: <script src="/auth-helper.js"></script>
 */
(function() {
  const _fetch = window.fetch;
  window.fetch = function(url, opts = {}) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      opts.headers = opts.headers || {};
      // Handle both plain objects and Headers instances
      if (opts.headers instanceof Headers) {
        opts.headers.set('X-Auth-Token', token);
      } else {
        opts.headers['X-Auth-Token'] = token;
      }
    }
    return _fetch(url, opts);
  };

  // Also expose a helper to check if logged in
  window.getAuthToken = () => localStorage.getItem('auth_token');

  // Clear token on logout
  window.clearAuthToken = () => localStorage.removeItem('auth_token');

  // Auto-redirect to /login on protected pages if not authenticated
  const publicPaths = ['/login', '/register', '/share', '/setup'];
  const currentPath = window.location.pathname;
  const isPublic = publicPaths.some(p => currentPath.startsWith(p));

  if (!isPublic) {
    _fetch('/api/auth/me').then(res => {
      if (res.status === 401) {
        window.location.href = '/login';
      }
    }).catch(() => {});
  }
})();