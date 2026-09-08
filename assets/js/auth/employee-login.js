(() => {
  if (auth.redirectAuthenticated()) return;

  const form = document.getElementById("loginForm");
  const alert = document.getElementById("alert");
  const button = document.getElementById("loginButton");
  const loginType = document.body.dataset.loginType;
  const login =
    loginType === "Manager" ? auth.managerLogin : auth.staffLogin;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    alert.classList.add("hidden");
    const phone = form.phone.value.trim();
    if (!/^09\d{8}$/.test(phone)) {
      alert.textContent =
        "Phone must start with 09 and contain exactly 10 digits.";
      alert.classList.remove("hidden");
      return;
    }
    if (!form.password.value) {
      alert.textContent = "Password is required.";
      alert.classList.remove("hidden");
      return;
    }

    button.disabled = true;
    button.textContent = "Signing in…";
    try {
      await login(phone, form.password.value, form.remember.checked);
      const expectedRole =
        loginType === "Manager" ? "Manager" : "OfficeEmployee";
      if (auth.getRole() !== expectedRole) {
        auth.clearSession();
        throw new Error(`This sign-in is only for ${loginType.toLowerCase()} accounts.`);
      }
      location.href = "../admin/admin-dashboard.html";
    } catch (error) {
      alert.textContent = error.message;
      alert.classList.remove("hidden");
      button.disabled = false;
      button.textContent = "Sign in";
    }
  });
})();
