(() => {
  if (auth.redirectAuthenticated()) return;

  const form = document.getElementById("loginForm"),
    alert = document.getElementById("alert"),
    button = document.getElementById("loginButton");
  form.onsubmit = async (e) => {
    e.preventDefault();
    alert.classList.add("hidden");
    const phone = form.phone.value.trim();
    if (!validation.validPhone(phone)) {
      alert.textContent =
        "Phone must start with 09 and contain exactly 10 digits.";
      alert.classList.remove("hidden");
      return;
    }
    button.disabled = true;
    button.textContent = "Signing in…";
    try {
      await auth.driverLogin(phone, form.password.value, form.remember.checked);
      location.href = "../driver/driver-dashboard.html";
    } catch (err) {
      alert.textContent = api.errorMessage(err);
      alert.classList.remove("hidden");
      button.disabled = false;
      button.textContent = "Sign in";
    }
  };
  validation.bindDigits(form.phone, 10);
})();
