(() => {
  if (window.auth.getAccessToken()) {
    window.location.replace("./trips.html");

    return;
  }

  const form = document.getElementById("registerForm");

  const button = document.getElementById("registerButton");

  const firstName = document.getElementById("firstName");

  const lastName = document.getElementById("lastName");

  const phone = document.getElementById("registerPhone");

  const nationalNumber = document.getElementById("nationalNumber");

  const password = document.getElementById("registerPassword");

  const confirmPassword = document.getElementById("confirmPassword");

  const rememberMe = document.getElementById("registerRememberMe");

  phone.addEventListener("input", () => {
    phone.value = phone.value.replace(/\D/g, "").slice(0, 10);
  });

  nationalNumber.addEventListener("input", () => {
    nationalNumber.value = nationalNumber.value.replace(/\D/g, "").slice(0, 11);
  });

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

      const phoneValue = phone.value.trim();

      const national = nationalNumber.value.trim();

      const pass = password.value;

      const confirm = confirmPassword.value;

      if (!/^[a-zA-Z]{2,49}$/.test(first)) {
        alert("error", "First name must contain only letters.");

        return;
      }

      if (!/^[a-zA-Z]{2,49}$/.test(last)) {
        alert("error", "Last name must contain only letters.");

        return;
      }

      if (!/^09\d{8}$/.test(phoneValue)) {
        alert("error", "Phone must start with 09 and contain 10 digits.");

        return;
      }

      if (!/^\d{11}$/.test(national)) {
        alert("error", "National number must contain exactly 11 digits.");

        return;
      }

      if (pass.length < 8 || pass.length > 49) {
        alert("error", "Password must contain between 8 and 49 characters.");

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

        window.location.href = "./trips.html";
      } catch (error) {
        alert("error", error.message);
      } finally {
        button.disabled = false;
        button.textContent = "Create account";
      }
    },
  );
})();
