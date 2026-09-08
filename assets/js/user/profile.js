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

  validation.bindDigits(phone, 10);
  firstName.addEventListener("blur", () => validation.setFieldState(firstName, validation.validUserName(firstName.value) ? "" : "First name must contain 2–49 English letters."));
  lastName.addEventListener("blur", () => validation.setFieldState(lastName, validation.validUserName(lastName.value) ? "" : "Last name must contain 2–49 English letters."));
  phone.addEventListener("blur", () => validation.setFieldState(phone, validation.validPhone(phone.value) ? "" : validation.PHONE_MESSAGE));

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
      window.auth.updateStoredUser(user);
      window.ui.refreshHeaderUser(user);
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

      const phoneValue = validation.normalizePhone(phone.value);

      if (!validation.validUserName(first)) {
        validation.setFieldState(firstName, "First name must contain 2–49 English letters.");
        window.ui.showAlert(
          "profileAlert",
          "error",
          "First name must contain only letters.",
        );

        return;
      }

      if (!validation.validUserName(last)) {
        validation.setFieldState(lastName, "Last name must contain 2–49 English letters.");
        window.ui.showAlert(
          "profileAlert",
          "error",
          "Last name must contain only letters.",
        );

        return;
      }

      if (!validation.validPhone(phoneValue)) {
        validation.setFieldState(phone, validation.PHONE_MESSAGE);
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

      if (!validation.validPassword(newPassword)) {
        window.ui.showAlert(
          "passwordAlert",
          "error",
          "New password must contain an English letter, number and symbol, and be 8–49 characters.",
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
          "/api/UserChangePassword/change-password",
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
