const loginForm = document.getElementById("loginForm");

const phoneInput = document.getElementById("phone");

const passwordInput = document.getElementById("password");

const rememberMeInput = document.getElementById("rememberMe");

const phoneError = document.getElementById("phoneError");

const passwordError = document.getElementById("passwordError");

const alertBox = document.getElementById("alert");

const loginButton = document.getElementById("loginButton");

const loginButtonText = document.getElementById("loginButtonText");

const spinner = document.getElementById("spinner");

const togglePassword = document.getElementById("togglePassword");

/*
    Same pattern as your backend.

    Example:

    0934567890
*/

const PHONE_REGEX = /^09\d{8}$/;

/*
    Current year
*/

document.getElementById("year").textContent = new Date().getFullYear();

/*
    Only allow numbers
*/

phoneInput.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 10);

  hideAlert();
});

passwordInput.addEventListener("input", function () {
  hideAlert();
});

/*
    Show / hide password
*/

togglePassword.addEventListener("click", function () {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";

    togglePassword.textContent = "Hide";
  } else {
    passwordInput.type = "password";

    togglePassword.textContent = "Show";
  }
});

function validatePhone() {
  const phone = phoneInput.value.trim();

  if (!phone) {
    showPhoneError("Phone number is required.");

    return false;
  }

  if (!PHONE_REGEX.test(phone)) {
    showPhoneError("Phone must start with 09 and contain exactly 10 digits.");

    return false;
  }

  hidePhoneError();

  return true;
}

function validatePassword() {
  const password = passwordInput.value;

  if (!password) {
    showPasswordError("Password is required.");

    return false;
  }

  hidePasswordError();

  return true;
}

function showPhoneError(message) {
  phoneError.textContent = message;

  phoneError.classList.remove("hidden");

  phoneInput.classList.add("border-red-400");
}

function hidePhoneError() {
  phoneError.classList.add("hidden");

  phoneInput.classList.remove("border-red-400");
}

function showPasswordError(message) {
  passwordError.textContent = message;

  passwordError.classList.remove("hidden");

  passwordInput.classList.add("border-red-400");
}

function hidePasswordError() {
  passwordError.classList.add("hidden");

  passwordInput.classList.remove("border-red-400");
}

function showAlert(type, message) {
  alertBox.classList.remove("hidden");

  if (type === "success") {
    alertBox.className =
      "mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700";
  } else {
    alertBox.className =
      "mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";
  }

  alertBox.textContent = message;
}

function hideAlert() {
  alertBox.classList.add("hidden");
}

function setLoading(loading) {
  loginButton.disabled = loading;

  if (loading) {
    spinner.classList.remove("hidden");

    loginButtonText.textContent = "Signing in...";
  } else {
    spinner.classList.add("hidden");

    loginButtonText.textContent = "Sign in";
  }
}

/*
    LOGIN
*/

loginForm.addEventListener(
  "submit",

  async function (event) {
    event.preventDefault();

    hideAlert();

    const phoneValid = validatePhone();

    const passwordValid = validatePassword();

    if (!phoneValid || !passwordValid) {
      return;
    }

    const phone = phoneInput.value.trim();

    const password = passwordInput.value;

    const rememberMe = rememberMeInput.checked;

    try {
      setLoading(true);

      const response = await auth.login(phone, password, rememberMe);

      console.log("Login response:", response);

      showAlert("success", "Login successful.");

      /*
                When we create trips.html,
                config.js will contain:

                AFTER_LOGIN_URL:
                "./trips.html"
            */

      if (window.APP_CONFIG.AFTER_LOGIN_URL) {
        setTimeout(function () {
          window.location.href = window.APP_CONFIG.AFTER_LOGIN_URL;
        }, 500);
      }
    } catch (error) {
      console.error(error);

      let message = error.message || "Login failed.";

      /*
                fetch() normally gives
                Failed to fetch when:

                - API isn't running
                - HTTPS certificate problem
                - CORS problem
            */

      if (message === "Failed to fetch") {
        message =
          "Cannot connect to the API. Make sure the backend is running and CORS is enabled.";
      }

      showAlert("error", message);
    } finally {
      setLoading(false);
    }
  },
);
