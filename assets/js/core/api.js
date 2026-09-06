(() => {
  function getErrorMessage(data, status) {
    if (typeof data === "string") {
      return data;
    }

    if (data?.message) {
      return data.message;
    }

    if (data?.Message) {
      return data.Message;
    }

    if (data?.errors) {
      const messages = Object.values(data.errors).flat().filter(Boolean);

      if (messages.length > 0) {
        return messages[0];
      }
    }

    if (status === 401) {
      return "Your session is not authorized.";
    }

    if (status === 403)
      return "You do not have permission to perform this action.";
    if (status === 404) {
      return "The requested resource was not found.";
    }

    if (status === 409) return "The request conflicts with existing data.";
    if (status >= 500) return "The API encountered an internal error.";
    return "Something went wrong.";
  }

  async function parseResponse(response) {
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch {
        return null;
      }
    }

    try {
      const text = await response.text();

      return text ? { message: text } : null;
    } catch {
      return null;
    }
  }

  async function request(endpoint, options = {}) {
    const {
      auth = false,
      skipRefresh = false,
      headers = {},
      ...fetchOptions
    } = options;

    const makeRequest = async () => {
      const requestHeaders = {
        "Content-Type": "application/json",
        ...headers,
      };

      if (auth) {
        const token = window.auth?.getAccessToken();

        if (token) {
          requestHeaders.Authorization = `Bearer ${token}`;
        }
      }

      return fetch(window.APP_CONFIG.API_BASE_URL + endpoint, {
        ...fetchOptions,
        headers: requestHeaders,
      });
    };

    let response;

    try {
      response = await makeRequest();
    } catch (error) {
      const networkError = new Error(
        "Cannot connect to the API. The service may be unavailable.",
      );

      networkError.isNetworkError = true;
      networkError.cause = error;

      throw networkError;
    }

    /*
            Access token expired.

            Try using refresh token once.
        */

    if (response.status === 401 && auth && !skipRefresh && window.auth) {
      const refreshed = await window.auth.refreshSession();

      if (refreshed) {
        response = await makeRequest();
      }
    }

    const data = await parseResponse(response);

    if (!response.ok) {
      const error = new Error(getErrorMessage(data, response.status));

      error.status = response.status;

      error.data = data;

      throw error;
    }

    return data;
  }

  window.api = {
    request,
    asArray(value) {
      return Array.isArray(value) ? value : [];
    },
    message(value, fallback = "") {
      return getErrorMessage(value, 200) === "Something went wrong."
        ? fallback
        : getErrorMessage(value, 200);
    },
  };
})();
