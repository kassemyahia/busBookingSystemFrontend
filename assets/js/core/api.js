(() => {
  const text = (value) =>
    typeof value === "string" || typeof value === "number"
      ? String(value).trim()
      : "";

  function responseMessage(data) {
    if (typeof data === "string") return data.trim();
    if (!data || typeof data !== "object") return "";

    const validationMessages = Object.values(data.errors || {})
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .map(text)
      .filter(Boolean);
    if (validationMessages.length) return validationMessages[0];

    const directValidationMessages = Object.entries(data)
      .filter(([, value]) => Array.isArray(value))
      .flatMap(([, value]) => value)
      .map(text)
      .filter(Boolean);
    if (directValidationMessages.length) return directValidationMessages[0];

    const primary = [data.message, data.Message, data.error, data.Error, data.detail, data.title]
      .map(text)
      .find(Boolean) || "";
    const suggestion = text(data.suggestion || data.Suggestion);
    return primary && suggestion && !primary.includes(suggestion)
      ? `${primary} ${suggestion}`
      : primary;
  }

  function friendlyMessage(message, status = 0, endpoint = "") {
    const messageText = text(message);
    const raw = /<\/?(?:html|body|head|script)\b/i.test(messageText)
      ? ""
      : messageText;
    const lower = raw.toLowerCase();
    const isLogin = /\/auth\/(?:login|employee\/login|manager\/login|staff\/login|driver\/login)/i.test(endpoint);

    if (status >= 500 || /stack trace|sql exception|internal server error/i.test(raw))
      return "Something went wrong on our side. Please try again.";
    if (/failed to fetch|networkerror|network request failed|cors/i.test(raw))
      return "Cannot connect to the service. Check your connection and try again.";
    if (/phone number or password is incorrect/i.test(raw))
      return "Phone number or password is incorrect.";
    if (/phone.+(already|exist|duplicate)|duplicate.+phone/i.test(lower))
      return "This phone number is already registered.";
    if (/(national number|nationalnumber|ssn).+(already|exist|duplicate)|duplicate.+(national number|nationalnumber|ssn)/i.test(lower))
      return "This national number is already registered.";
    if (/user not found/i.test(lower)) return "No user was found with that ID.";
    if (/route.+already exists/i.test(lower)) return "This route already exists.";
    if (/registration failed/i.test(lower))
      return "Registration could not be completed. The phone or national number may already be registered.";
    if (/one or more validation errors occurred/i.test(lower))
      return "Please check the entered information and try again.";
    if (status === 401)
      return isLogin
        ? "Phone number or password is incorrect."
        : "Your session has expired. Please sign in again.";
    if (status === 403)
      return "You do not have permission to perform this action.";
    if (status === 404)
      return raw || "The requested record could not be found.";
    if (status === 409)
      return raw || "A record with the same information already exists.";
    if (status === 429)
      return "Too many requests. Please wait a moment and try again.";
    if (raw) return raw;
    if (status === 400) return "Please check the entered information and try again.";
    return "The request could not be completed. Please try again.";
  }

  function getErrorMessage(data, status, endpoint = "") {
    return friendlyMessage(responseMessage(data), status, endpoint);
  }

  function isFailureResponse(data) {
    const message = responseMessage(data);
    return Boolean(
      data?.success === false || data?.Success === false ||
      (message &&
        /\b(not found|cannot|invalid|required|failed|error|unavailable|not allowed|already|must be|unable to)\b/i.test(
          message,
        )),
    );
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
        "Cannot connect to the service. Please try again shortly.",
      );

      networkError.isNetworkError = true;
      networkError.cause = error;
      networkError.endpoint = endpoint;

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
      const error = new Error(getErrorMessage(data, response.status, endpoint));

      error.status = response.status;

      error.data = data;
      error.endpoint = endpoint;

      throw error;
    }

    if (isFailureResponse(data)) {
      const error = new Error(getErrorMessage(data, response.status, endpoint));
      error.status = response.status;
      error.data = data;
      error.endpoint = endpoint;
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
      return responseMessage(value) || fallback;
    },
    errorMessage(error, fallback = "The request could not be completed. Please try again.") {
      if (!error) return fallback;
      const message = typeof error === "string"
        ? error
        : error.message || responseMessage(error.data);
      return friendlyMessage(message, error.status, error.endpoint) || fallback;
    },
  };
})();
