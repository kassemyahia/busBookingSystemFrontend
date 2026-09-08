(() => {
  const phoneForm = document.getElementById("phoneStep");
  const codeForm = document.getElementById("codeStep");
  const verifyForm = document.getElementById("verifyStep");
  const passwordForm = document.getElementById("passwordStep");
  const alertBox = document.getElementById("recoveryAlert");
  const forms = [phoneForm, codeForm, verifyForm, passwordForm];
  let verifiedPhone = "";
  const codePattern = /^\d{4}$/;
  validation.bindDigits(document.getElementById("recoveryPhone"), 10);
  validation.bindDigits(document.getElementById("verificationPhone"), 10);
  validation.bindDigits(document.getElementById("recoveryCode"), 4);
  validation.bindDigits(document.getElementById("verificationCode"), 4);

  function message(type, text) {
    const colors =
      type === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : "border-red-200 bg-red-50 text-red-800";
    alertBox.className = `mb-5 rounded-xl border px-4 py-3 text-sm ${colors}`;
    alertBox.textContent = text;
  }

  function step(number, title, description, form) {
    forms.forEach((item) => item.classList.add("hidden"));
    form.classList.remove("hidden");
    document.getElementById("stepLabel").textContent = `Step ${number} of 4`;
    document.getElementById("stepTitle").textContent = title;
    document.getElementById("stepDescription").textContent = description;
    alertBox.classList.add("hidden");
  }

  async function submit(form, action) {
    const button = form.querySelector('button[type="submit"],button:not([type])');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = "Please wait…";
    try {
      await action();
    } catch (error) {
      message("error", api.errorMessage(error));
    } finally {
      button.disabled = false;
      button.textContent = label;
    }
  }

  phoneForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const phone = document.getElementById("recoveryPhone").value.trim();
    if (!validation.validPhone(phone)) {
      message("error", "Enter a valid 10-digit phone number beginning with 09.");
      return;
    }

    submit(phoneForm, async () => {
      const response = await api.request("/api/Auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ PhoneNumber: phone }),
      });
      const code = response?.code ?? response?.Code;
      step(2, "Check your verification code", `The code issued for ${phone} is shown below.`, codeForm);
      document.getElementById("recoveryCode").value = code ? String(code) : "";
      if (code) {
        message("success", "Your verification code is ready. Select Continue when you have noted it.");
      }
    });
  });

  codeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = document.getElementById("recoveryCode").value.trim();
    if (!codePattern.test(code)) {
      message("error", "Enter the four-digit verification code.");
      return;
    }

    document.getElementById("verificationPhone").value = "";
    document.getElementById("verificationCode").value = "";
    step(3, "Verify your phone number", "Manually enter your phone number and the four-digit code.", verifyForm);
  });

  verifyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const phone = document.getElementById("verificationPhone").value.trim();
    const code = document.getElementById("verificationCode").value.trim();
    if (!validation.validPhone(phone)) {
      message("error", "Enter a valid 10-digit phone number beginning with 09.");
      return;
    }
    if (!codePattern.test(code)) {
      message("error", "Enter the four-digit verification code.");
      return;
    }

    submit(verifyForm, async () => {
      await api.request("/api/Auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({ PhoneNumber: phone, Code: code }),
      });
      verifiedPhone = phone;
      step(4, "Choose a new password", "Create a secure password for your account.", passwordForm);
    });
  });

  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = document.getElementById("newRecoveryPassword").value;
    const confirmPassword = document.getElementById("confirmRecoveryPassword").value;
    if (!validation.validPassword(password)) {
      message("error", "Password must include an English letter, number and symbol, and contain 8–49 characters.");
      return;
    }
    if (password !== confirmPassword) {
      message("error", "The passwords do not match.");
      return;
    }

    submit(passwordForm, async () => {
      await api.request("/api/Auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          PhoneNumber: verifiedPhone,
          NewPassword: password,
          ConfirmPassword: confirmPassword,
        }),
      });
      message("success", "Your password has been updated. Redirecting to sign in…");
      setTimeout(() => (location.href = "./login.html"), 1000);
    });
  });

  function restart() {
    verifiedPhone = "";
    phoneForm.reset();
    codeForm.reset();
    verifyForm.reset();
    passwordForm.reset();
    step(1, "Reset your password", "Enter the phone number linked to your account.", phoneForm);
  }

  document.querySelectorAll("[data-restart-recovery]").forEach((button) => {
    button.addEventListener("click", restart);
  });
})();
