// Centralised auth state — stored in memory (never localStorage for tokens)
let _authState = {
  user: null,        // { id, email, role, full_name, department }
  accessToken: null,
};

const _listeners = new Set();

function notify() {
  _listeners.forEach((fn) => fn({ ..._authState }));
}

export const authStore = {
  getState: () => ({ ..._authState }),

  setAuth(user, accessToken) {
    _authState = { user, accessToken };
    notify();
  },

  clearAuth() {
    _authState = { user: null, accessToken: null };
    notify();
  },

  subscribe(fn) {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
