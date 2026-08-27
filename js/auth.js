(() => {
  const ACCESS_TOKEN_KEY = "transport_access_token";

  const REFRESH_TOKEN_KEY = "transport_refresh_token";

  const USER_KEY = "transport_user";

  const REMEMBER_KEY = "transport_remember_me";

  function pick(object, camelCase, pascalCase) {
    return object?.[camelCase] ?? object?.[pascalCase] ?? null;
  }

  function clearStorage(storage) {
    storage.removeItem(ACCESS_TOKEN_KEY);

    storage.removeItem(REFRESH_TOKEN_KEY);

    storage.removeItem(USER_KEY);
  }

  function getSessionStorage() {
    if (
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      localStorage.getItem(REFRESH_TOKEN_KEY)
    ) {
      return localStorage;
    }

    if (
      sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
      sessionStorage.getItem(REFRESH_TOKEN_KEY)
    ) {
      return sessionStorage;
    }

    const remembered = localStorage.getItem(REMEMBER_KEY) === "true";

    return remembered ? localStorage : sessionStorage;
  }

  function saveSession(response, rememberMe = false) {
    const accessToken = pick(response, "accessToken", "AccessToken");

    const refreshToken = pick(response, "refreshToken", "RefreshToken");

    const user = pick(response, "user", "User");

    if (!accessToken) {
      throw new Error("The API did not return an access token.");
    }

    clearStorage(localStorage);

    clearStorage(sessionStorage);

    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(ACCESS_TOKEN_KEY, accessToken);

    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    if (user) {
      storage.setItem(USER_KEY, JSON.stringify(user));
    }

    localStorage.setItem(REMEMBER_KEY, rememberMe ? "true" : "false");
  }

  function getAccessToken() {
    return getSessionStorage().getItem(ACCESS_TOKEN_KEY);
  }

  function getRefreshToken() {
    return getSessionStorage().getItem(REFRESH_TOKEN_KEY);
  }

  function getUser() {
    const raw = getSessionStorage().getItem(USER_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function updateStoredUser(user) {
    if (!user) {
      return;
    }

    getSessionStorage().setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    clearStorage(localStorage);

    clearStorage(sessionStorage);

    localStorage.removeItem(REMEMBER_KEY);
  }

  async function login(phone, password, rememberMe = false) {
    const response = await window.api.request("/api/Auth/login", {
      method: "POST",

      body: JSON.stringify({
        Phone: phone,
        Password: password,
      }),
    });

    saveSession(response, rememberMe);

    return response;
  }

  async function register(data, rememberMe = false) {
    const response = await window.api.request("/api/Auth/register", {
      method: "POST",

      body: JSON.stringify(data),
    });

    saveSession(response, rememberMe);

    return response;
  }

  async function refreshSession() {
    const storage = getSessionStorage();

    const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await window.api.request("/api/Auth/refresh-token", {
        method: "POST",

        skipRefresh: true,

        body: JSON.stringify({
          RefreshToken: refreshToken,
        }),
      });

      const accessToken = pick(response, "accessToken", "AccessToken");

      const newRefreshToken = pick(response, "refreshToken", "RefreshToken");

      if (!accessToken) {
        throw new Error("Refresh failed.");
      }

      storage.setItem(ACCESS_TOKEN_KEY, accessToken);

      if (newRefreshToken) {
        storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }

      return true;
    } catch {
      clearSession();

      return false;
    }
  }

  async function me() {
    return window.api.request("/api/Auth/me", {
      method: "GET",
      auth: true,
    });
  }

  async function logout() {
    try {
      await window.api.request("/api/Auth/logout", {
        method: "POST",
        auth: true,
        skipRefresh: true,
      });
    } catch (error) {
      console.warn("Server logout failed:", error);
    } finally {
      clearSession();

      window.location.href = "./login.html";
    }
  }

  function requireAuth() {
    if (!getAccessToken()) {
      window.location.replace("./login.html");

      return false;
    }

    return true;
  }

  window.auth = {
    login,
    register,
    refreshSession,
    me,
    logout,
    requireAuth,
    getAccessToken,
    getRefreshToken,
    getUser,
    updateStoredUser,
    clearSession,
  };
})();
