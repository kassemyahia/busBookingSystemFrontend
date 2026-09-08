(() => {
  const PHONE_MESSAGE = "Phone must start with 09 and contain exactly 10 digits.";
  const NATIONAL_MESSAGE = "National number must contain exactly 11 digits.";
  const PASSWORD_MESSAGE = "Password must contain an English letter, number and symbol, and be 8–49 characters.";
  const passwordPattern = /^(?!.*[\u0600-\u06FF])(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_\-=\[\]{};':"\\|,.<>/?])[A-Za-z0-9!@#$%^&*()_\-=\[\]{};':"\\|,.<>/?]{8,49}$/;
  const normalizeDigits = (value, length) => String(value ?? "").replace(/\D/g, "").slice(0, length);
  const normalizePhone = (value) => normalizeDigits(value, 10);
  const normalizeNationalNumber = (value) => normalizeDigits(value, 11);
  const validPhone = (value) => /^09\d{8}$/.test(normalizePhone(value));
  const validNationalNumber = (value) => /^\d{11}$/.test(normalizeNationalNumber(value));
  const validName = (value) => /^[\p{L}][\p{L}\p{M}' -]{0,99}$/u.test(String(value ?? "").trim());
  const validUserName = (value) => /^[A-Za-z]{2,49}$/.test(String(value ?? "").trim());
  const validPassword = (value) => passwordPattern.test(String(value ?? ""));
  const validPositive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
  const validNonnegative = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

  function toLocalDateTimeInputValue(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  const minimumFutureDateTime = () => toLocalDateTimeInputValue(new Date(Date.now() + 60000));
  function isFutureDateTime(value) {
    if (!value) return false;
    const time = new Date(value).getTime();
    return Number.isFinite(time) && time > Date.now();
  }

  function feedback(input) {
    let node = input.parentElement?.querySelector(`[data-field-error="${input.name || input.id}"]`);
    if (!node) {
      node = document.createElement("p");
      node.dataset.fieldError = input.name || input.id;
      node.className = "mt-1 text-sm";
      input.insertAdjacentElement("afterend", node);
    }
    return node;
  }
  function setFieldState(input, message = "", type = "error") {
    if (!input) return;
    const node = feedback(input);
    node.textContent = message;
    node.className = `mt-1 text-sm ${type === "success" ? "text-emerald-700" : "text-red-700"}`;
    input.setAttribute("aria-invalid", String(Boolean(message) && type !== "success"));
    input.classList.toggle("border-red-400", Boolean(message) && type !== "success");
  }
  const clearFieldState = (input) => setFieldState(input, "");
  function bindDigits(input, length) {
    input?.addEventListener("input", () => {
      input.value = normalizeDigits(input.value, length);
      clearFieldState(input);
    });
  }
  function firstError(checks) {
    return checks.find((check) => !check.valid)?.message || "";
  }
  function validateConstraints(form) {
    let valid = true;
    Array.from(form.elements).forEach((input) => {
      if (!input.name || input.disabled || !["INPUT", "SELECT", "TEXTAREA"].includes(input.tagName)) return;
      let message = "";
      const value = String(input.value ?? "").trim();
      if (input.required && !value) message = "This field is required.";
      else if (input.type === "number" && value) {
        const number = Number(value);
        if (!Number.isFinite(number)) message = "Enter a valid number.";
        else if (input.min !== "" && number < Number(input.min)) message = `Value must be at least ${input.min}.`;
        else if (input.max !== "" && number > Number(input.max)) message = `Value must be at most ${input.max}.`;
      } else if (/phone/i.test(input.name) && value && !validPhone(value)) message = PHONE_MESSAGE;
      else if (/nationalnumber|ssn/i.test(input.name) && value && !validNationalNumber(value)) message = NATIONAL_MESSAGE;
      else if (/^(firstname|lastname)$/i.test(input.name) && value && !validName(value)) message = "Enter a valid name.";
      else if (/^password$/i.test(input.name) && value && !validPassword(value)) message = PASSWORD_MESSAGE;
      setFieldState(input, message);
      if (message) valid = false;
    });
    return valid;
  }

  window.validation = {
    PHONE_MESSAGE,
    NATIONAL_MESSAGE,
    PASSWORD_MESSAGE,
    normalizeDigits,
    normalizePhone,
    normalizeNationalNumber,
    validPhone,
    validNationalNumber,
    validName,
    validUserName,
    validPassword,
    validPositive,
    validNonnegative,
    toLocalDateTimeInputValue,
    minimumFutureDateTime,
    isFutureDateTime,
    setFieldState,
    clearFieldState,
    bindDigits,
    firstError,
    validateConstraints,
  };
})();
