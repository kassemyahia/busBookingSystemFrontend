const api = {
  async request(endpoint, options = {}) {
    const url = window.APP_CONFIG.API_BASE_URL + endpoint;

    try {
      const response = await fetch(url, {
        ...options,

        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      let data = null;

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        if (text) {
          data = {
            message: text,
          };
        }
      }

      if (!response.ok) {
        const message =
          data?.message || data?.Message || "Something went wrong.";

        throw new Error(message);
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);

      throw error;
    }
  },
};
