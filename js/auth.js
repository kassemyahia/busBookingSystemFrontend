const auth = {
  ACCESS_TOKEN_KEY: "transport_access_token",

  REFRESH_TOKEN_KEY: "transport_refresh_token",

  USER_KEY: "transport_user",

  async login(phone, password, rememberMe) {
    const response = await api.request("/api/Auth/login", {
      method: "POST",

      body: JSON.stringify({
        Phone: phone,
        Password: password,
      }),
    });

    this.saveLogin(response, rememberMe);

    return response;
  },

  saveLogin(response, rememberMe) {
    /*
            ASP.NET may serialize as:

            accessToken

            OR

            AccessToken

            so we support both.
        */

    const accessToken = response.accessToken ?? response.AccessToken;

    const refreshToken = response.refreshToken ?? response.RefreshToken;

    const user = response.user ?? response.User;

    if (!accessToken) {
      throw new Error("Access token was not returned by the server.");
    }

    /*
            Remember me checked:
            localStorage

            Not checked:
            sessionStorage
        */

    const storage = rememberMe ? localStorage : sessionStorage;

    /*
            Remove any previous login
        */

    localStorage.removeItem(this.ACCESS_TOKEN_KEY);

    localStorage.removeItem(this.REFRESH_TOKEN_KEY);

    localStorage.removeItem(this.USER_KEY);

    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);

    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);

    sessionStorage.removeItem(this.USER_KEY);

    /*
            Store new login
        */

    storage.setItem(this.ACCESS_TOKEN_KEY, accessToken);

    if (refreshToken) {
      storage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    if (user) {
      storage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    localStorage.setItem(
      "transport_remember_me",
      rememberMe ? "true" : "false",
    );
  },

  getStorage() {
    const rememberMe = localStorage.getItem("transport_remember_me") === "true";

    return rememberMe ? localStorage : sessionStorage;
  },

  getAccessToken() {
    return this.getStorage().getItem(this.ACCESS_TOKEN_KEY);
  },

  getRefreshToken() {
    return this.getStorage().getItem(this.REFRESH_TOKEN_KEY);
  },

  getUser() {
    const user = this.getStorage().getItem(this.USER_KEY);

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.clear();
    sessionStorage.clear();
  },
};
