(() => {
  if (window.auth.redirectAuthenticated()) return;

  const form = document.getElementById("registerForm");

  const button = document.getElementById("registerButton");

  const firstName = document.getElementById("firstName");

  const lastName = document.getElementById("lastName");

  const phone = document.getElementById("registerPhone");

  const nationalNumber = document.getElementById("nationalNumber");

  const password = document.getElementById("registerPassword");

  const confirmPassword = document.getElementById("confirmPassword");

  const rememberMe = document.getElementById("registerRememberMe");

  validation.bindDigits(phone, 10);
  validation.bindDigits(nationalNumber, 11);
  const validateField = (input, valid, message) => {
    validation.setFieldState(input, valid ? "" : message);
    return valid;
  };
  firstName.addEventListener("blur", () => validateField(firstName, validation.validUserName(firstName.value), "First name must contain 2–49 English letters."));
  lastName.addEventListener("blur", () => validateField(lastName, validation.validUserName(lastName.value), "Last name must contain 2–49 English letters."));
  phone.addEventListener("blur", () => validateField(phone, validation.validPhone(phone.value), validation.PHONE_MESSAGE));
  nationalNumber.addEventListener("blur", () => validateField(nationalNumber, validation.validNationalNumber(nationalNumber.value), validation.NATIONAL_MESSAGE));
  password.addEventListener("blur", () => validateField(password, validation.validPassword(password.value), validation.PASSWORD_MESSAGE));

  function alert(type, message) {
    const element = document.getElementById("registerAlert");

    element.className =
      type === "success"
        ? "mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        : "mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

    element.textContent = message;
  }

  form.addEventListener(
    "submit",

    async (event) => {
      event.preventDefault();

      const first = firstName.value.trim();

      const last = lastName.value.trim();

      const phoneValue = validation.normalizePhone(phone.value);

      const national = validation.normalizeNationalNumber(nationalNumber.value);

      const pass = password.value;

      const confirm = confirmPassword.value;

      if (!validateField(firstName, validation.validUserName(first), "First name must contain 2–49 English letters.")) {
        alert("error", "First name must contain only letters.");

        return;
      }

      if (!validateField(lastName, validation.validUserName(last), "Last name must contain 2–49 English letters.")) {
        alert("error", "Last name must contain only letters.");

        return;
      }

      if (!validateField(phone, validation.validPhone(phoneValue), validation.PHONE_MESSAGE)) {
        alert("error", "Phone must start with 09 and contain 10 digits.");

        return;
      }

      if (!validateField(nationalNumber, validation.validNationalNumber(national), validation.NATIONAL_MESSAGE)) {
        alert("error", "National number must contain exactly 11 digits.");

        return;
      }

      if (!validateField(password, validation.validPassword(pass), validation.PASSWORD_MESSAGE)) {
        alert(
          "error",
          "Password must contain an English letter, number and symbol, and be 8–49 characters.",
        );

        return;
      }

      if (pass !== confirm) {
        alert("error", "Passwords do not match.");

        return;
      }

      button.disabled = true;
      button.textContent = "Creating account...";

      try {
        await window.auth.register(
          {
            FirstName: first,
            LastName: last,
            Phone: phoneValue,
            NationalNumber: national,
            Password: pass,
            ConfirmPassword: confirm,
          },
          rememberMe.checked,
        );

        alert("success", "Account created successfully.");

        window.location.href = "../user/trips.html";
      } catch (error) {
        alert("error", api.errorMessage(error));
      } finally {
        button.disabled = false;
        button.textContent = "Create account";
      }
    },
  );
})();
