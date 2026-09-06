(() => {
  const KEYS = {
    access: "transport_access_token",
    refresh: "transport_refresh_token",
    entity: "transport_user",
    type: "transport_account_type",
    role: "transport_role",
    remember: "transport_remember_me",
  };
  const pick = (o, ...names) =>
    names.map((n) => o?.[n]).find((v) => v !== undefined && v !== null) ?? null;
  const clear = (s) =>
    Object.values(KEYS)
      .filter((k) => k !== KEYS.remember)
      .forEach((k) => s.removeItem(k));
  function storage() {
    if (localStorage.getItem(KEYS.access) || localStorage.getItem(KEYS.refresh))
      return localStorage;
    if (
      sessionStorage.getItem(KEYS.access) ||
      sessionStorage.getItem(KEYS.refresh)
    )
      return sessionStorage;
    return localStorage.getItem(KEYS.remember) === "true"
      ? localStorage
      : sessionStorage;
  }
  function saveSession(response, remember = false, requestedType = "User") {
    const access = pick(response, "accessToken", "AccessToken");
    const refresh = pick(response, "refreshToken", "RefreshToken");
    const entity = pick(
      response,
      "user",
      "User",
      "employee",
      "Employee",
      "driver",
      "Driver",
    );
    if (!access) throw new Error("The API did not return an access token.");
    clear(localStorage);
    clear(sessionStorage);
    const target = remember ? localStorage : sessionStorage;
    const type =
      requestedType === "User"
        ? "User"
        : requestedType === "Driver"
          ? "Driver"
          : "Employee";
    const role =
      type === "Driver"
        ? "Driver"
        : pick(entity, "role", "Role") || (type === "User" ? "User" : null);
    target.setItem(KEYS.access, access);
    if (refresh) target.setItem(KEYS.refresh, refresh);
    if (entity) target.setItem(KEYS.entity, JSON.stringify(entity));
    target.setItem(KEYS.type, type);
    if (role) target.setItem(KEYS.role, String(role));
    localStorage.setItem(KEYS.remember, String(remember));
  }
  const getAccessToken = () => storage().getItem(KEYS.access);
  const getRefreshToken = () => storage().getItem(KEYS.refresh);
  const getAccountType = () =>
    storage().getItem(KEYS.type) || (getAccessToken() ? "User" : null);
  const getRole = () =>
    storage().getItem(KEYS.role) ||
    (getAccountType() === "User" ? "User" : null);
  function getUser() {
    try {
      return JSON.parse(storage().getItem(KEYS.entity));
    } catch {
      return null;
    }
  }
  function updateStoredUser(value) {
    if (value) storage().setItem(KEYS.entity, JSON.stringify(value));
  }
  function clearSession() {
    clear(localStorage);
    clear(sessionStorage);
    localStorage.removeItem(KEYS.remember);
  }
  async function performLogin(path, phone, password, remember, type) {
    const response = await api.request(path, {
      method: "POST",
      body: JSON.stringify({ Phone: phone, Password: password }),
    });
    saveSession(response, remember, type);
    return response;
  }
  const login = (p, w, r) => performLogin("/api/Auth/login", p, w, r, "User");
  const employeeLogin = (p, w, r) =>
    performLogin("/api/Auth/employee/login", p, w, r, "Employee");
  const driverLogin = (p, w, r) =>
    performLogin("/api/Auth/driver/login", p, w, r, "Driver");
  async function register(data, remember = false) {
    const response = await api.request("/api/Auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    saveSession(response, remember, "User");
    return response;
  }
  async function refreshSession() {
    const target = storage(),
      refresh = target.getItem(KEYS.refresh);
    if (!refresh) return false;
    try {
      const data = await api.request("/api/Auth/refresh-token", {
        method: "POST",
        skipRefresh: true,
        body: JSON.stringify({ RefreshToken: refresh }),
      });
      const access = pick(data, "accessToken", "AccessToken");
      if (!access) throw new Error("Refresh failed.");
      target.setItem(KEYS.access, access);
      const next = pick(data, "refreshToken", "RefreshToken");
      if (next) target.setItem(KEYS.refresh, next);
      return true;
    } catch {
      const type = getAccountType();
      clearSession();
      window.location.replace(
        type === "Driver"
          ? "../auth/driver-login.html"
          : type === "Employee"
            ? "../auth/staff-login.html"
            : "../auth/login.html",
      );
      return false;
    }
  }
  const me = () => api.request("/api/Auth/me", { auth: true });
  const employeeMe = () => api.request("/api/Auth/employee/me", { auth: true });
  const driverMe = () => api.request("/api/Auth/driver/me", { auth: true });
  async function logout() {
    const type = getAccountType();
    const path =
      type === "Driver"
        ? "/api/Auth/driver/logout"
        : type === "Employee"
          ? "/api/Auth/employee/logout"
          : "/api/Auth/logout";
    try {
      await api.request(path, {
        method: "POST",
        auth: true,
        skipRefresh: true,
      });
    } catch (e) {
      console.warn("Server logout failed", e);
    }
    clearSession();
    window.location.href =
      type === "Driver"
        ? "../auth/driver-login.html"
        : type === "Employee"
          ? "../auth/staff-login.html"
          : "../auth/login.html";
  }
  function guard(valid, target) {
    if (!getAccessToken() || !valid) {
      window.location.replace(target);
      return false;
    }
    return true;
  }
  const requireUser = () =>
    guard(getAccountType() === "User", "../auth/login.html");
  const requireEmployee = () =>
    guard(
      getAccountType() === "Employee" &&
        ["Manager", "OfficeEmployee"].includes(getRole()),
      "../auth/staff-login.html",
    );
  const requireManager = () =>
    guard(
      getAccountType() === "Employee" && getRole() === "Manager",
      "../admin/admin-dashboard.html",
    );
  const requireOfficeEmployee = () =>
    guard(
      getAccountType() === "Employee" && getRole() === "OfficeEmployee",
      "../auth/staff-login.html",
    );
  const requireDriver = () =>
    guard(
      getAccountType() === "Driver" && getRole() === "Driver",
      "../auth/driver-login.html",
    );
  window.auth = {
    login,
    employeeLogin,
    driverLogin,
    register,
    refreshSession,
    me,
    employeeMe,
    driverMe,
    logout,
    requireAuth: requireUser,
    requireUser,
    requireEmployee,
    requireManager,
    requireOfficeEmployee,
    requireDriver,
    getAccessToken,
    getRefreshToken,
    getAccountType,
    getRole,
    getUser,
    updateStoredUser,
    clearSession,
  };
})();
