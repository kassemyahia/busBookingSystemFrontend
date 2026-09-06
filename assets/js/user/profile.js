(async () => {
  const ready = await window.ui.initProtectedLayout();

  if (!ready) {
    return;
  }

  const profileForm = document.getElementById("profileForm");

  const passwordForm = document.getElementById("passwordForm");

  const firstName = document.getElementById("profileFirstName");

  const lastName = document.getElementById("profileLastName");

  const phone = document.getElementById("profilePhone");

  let originalUser = null;

  phone.addEventListener("input", () => {
    phone.value = phone.value.replace(/\D/g, "").slice(0, 10);
  });

  function userValue(user, field) {
    return (
      window.ui.pick(
        user,
        field.charAt(0).toLowerCase() + field.slice(1),
        field,
      ) || ""
    );
  }

  function fillProfile(user) {
    originalUser = user;

    firstName.value = userValue(user, "FirstName");

    lastName.value = userValue(user, "LastName");

    phone.value = userValue(user, "Phone");
  }

  async function loadProfile() {
    try {
      const user = await window.auth.me();

      fillProfile(user);
    } catch (error) {
      window.ui.showAlert("profileAlert", "error", error.message);
    }
  }

  profileForm.addEventListener(
    "submit",

    async (event) => {
      event.preventDefault();

      const first = firstName.value.trim();

      const last = lastName.value.trim();

      const phoneValue = phone.value.trim();

      if (!/^[a-zA-Z]{2,49}$/.test(first)) {
        window.ui.showAlert(
          "profileAlert",
          "error",
          "First name must contain only letters.",
        );

        return;
      }

      if (!/^[a-zA-Z]{2,49}$/.test(last)) {
        window.ui.showAlert(
          "profileAlert",
          "error",
          "Last name must contain only letters.",
        );

        return;
      }

      if (!/^09\d{8}$/.test(phoneValue)) {
        window.ui.showAlert(
          "profileAlert",
          "error",
          "Phone must start with 09 and contain 10 digits.",
        );

        return;
      }

      const operations = [];

      if (first !== userValue(originalUser, "FirstName")) {
        operations.push({
          op: "replace",
          path: "/firstname",
          value: first,
        });
      }

      if (last !== userValue(originalUser, "LastName")) {
        operations.push({
          op: "replace",
          path: "/lastname",
          value: last,
        });
      }

      if (phoneValue !== userValue(originalUser, "Phone")) {
        operations.push({
          op: "replace",
          path: "/phone",
          value: phoneValue,
        });
      }

      if (operations.length === 0) {
        window.ui.showAlert("profileAlert", "info", "No changes to save.");

        return;
      }

      const button = document.getElementById("saveProfileButton");

      button.disabled = true;

      button.textContent = "Saving...";

      try {
        const response = await window.api.request("/api/UserUpdate/update", {
          method: "PATCH",
          auth: true,

          headers: {
            "Content-Type": "application/json-patch+json",
          },

          body: JSON.stringify(operations),
        });

        const updatedUser = await window.auth.me();

        window.auth.updateStoredUser(updatedUser);

        window.ui.refreshHeaderUser(updatedUser);

        fillProfile(updatedUser);

        window.ui.showAlert(
          "profileAlert",
          "success",
          window.ui.pick(response, "message", "Message") ||
            "Profile updated successfully.",
        );
      } catch (error) {
        window.ui.showAlert("profileAlert", "error", error.message);
      } finally {
        button.disabled = false;

        button.textContent = "Save changes";
      }
    },
  );

  passwordForm.addEventListener(
    "submit",

    async (event) => {
      event.preventDefault();

      const oldPassword = document.getElementById("oldPassword").value;

      const newPassword = document.getElementById("newPassword").value;

      const confirm = document.getElementById("confirmNewPassword").value;

      if (oldPassword.length < 8) {
        window.ui.showAlert(
          "passwordAlert",
          "error",
          "Enter your current password.",
        );

        return;
      }

      if (newPassword.length < 8 || newPassword.length > 49) {
        window.ui.showAlert(
          "passwordAlert",
          "error",
          "New password must contain between 8 and 49 characters.",
        );

        return;
      }

      if (newPassword !== confirm) {
        window.ui.showAlert(
          "passwordAlert",
          "error",
          "New passwords do not match.",
        );

        return;
      }

      const button = document.getElementById("changePasswordButton");

      button.disabled = true;

      button.textContent = "Changing password...";

      try {
        const response = await window.api.request(
          "/api/UserChangePassword/change",
          {
            method: "PUT",
            auth: true,

            body: JSON.stringify({
              OldPassword: oldPassword,

              NewPassword: newPassword,
            }),
          },
        );

        window.ui.showAlert(
          "passwordAlert",
          "success",
          window.ui.pick(response, "message", "Message") ||
            "Password changed successfully.",
        );

        passwordForm.reset();
      } catch (error) {
        window.ui.showAlert("passwordAlert", "error", error.message);
      } finally {
        button.disabled = false;

        button.textContent = "Change password";
      }
    },
  );

  loadProfile();
})();
