export const messages = {
  displayNameRequired: "Enter a display name.",
  displayNameLength: "Display name must be between 2 and 50 characters.",
  displayNameChars: "Display name can only contain letters, spaces, and hyphens.",
  emailRequired: "Enter an email address.",
  emailInvalid: "Enter a valid email address.",
  passwordMin: "Password must be at least 8 characters.",
  passwordComplexity: "Password must include at least one letter and one number.",
  confirmRequired: "Confirm your new password.",
  confirmMismatch: "Passwords do not match.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBlank(value) {
  return String(value ?? "").trim() === "";
}

export function validateDisplayName(value) {
  if (isBlank(value)) {
    return { valid: false, message: messages.displayNameRequired };
  }
  const trimmed = String(value).trim();
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { valid: false, message: messages.displayNameLength };
  }
  if (!/^[A-Za-z -]+$/.test(trimmed) || !/[A-Za-z]/.test(trimmed)) {
    return { valid: false, message: messages.displayNameChars };
  }
  return { valid: true, message: "", value: trimmed };
}

export function validateEmail(value) {
  if (isBlank(value)) {
    return { valid: false, message: messages.emailRequired };
  }
  const trimmed = String(value).trim();
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { valid: false, message: messages.emailInvalid };
  }
  return { valid: true, message: "", value: trimmed };
}

export function validateNewPassword(value) {
  const password = String(value ?? "");
  if (password.length === 0) {
    return { valid: true, message: "", value: "" };
  }
  if (password.length < 8) {
    return { valid: false, message: messages.passwordMin };
  }
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: messages.passwordComplexity };
  }
  return { valid: true, message: "", value: password };
}

export function validateConfirmPassword(password, confirm) {
  const pwd = String(password ?? "");
  const confirmation = String(confirm ?? "");
  if (pwd.length === 0) {
    // No new password set — confirm field is inert, regardless of stale text left in it.
    return { valid: true, message: "", value: "" };
  }
  if (confirmation.length === 0) {
    return { valid: false, message: messages.confirmRequired };
  }
  if (pwd !== confirmation) {
    return { valid: false, message: messages.confirmMismatch };
  }
  return { valid: true, message: "", value: confirmation };
}

export function validateForm(data) {
  const displayName = validateDisplayName(data.displayName);
  const email = validateEmail(data.email);
  const newPassword = validateNewPassword(data.newPassword);
  const confirmPassword = validateConfirmPassword(
    data.newPassword,
    data.confirmPassword
  );

  const fields = { displayName, email, newPassword, confirmPassword };
  const valid = Object.values(fields).every((result) => result.valid);

  return {
    valid,
    fields,
    values: valid
      ? {
          displayName: displayName.value,
          email: email.value,
          newPassword: newPassword.value,
          notifications: {
            email: Boolean(data.notifyEmail),
            sms: Boolean(data.notifySms),
          },
        }
      : null,
  };
}

export function readFormValues(form) {
  const formData = new FormData(form);
  return {
    displayName: formData.get("displayName") ?? "",
    email: formData.get("email") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
    notifyEmail: formData.get("notifyEmail") === "on",
    notifySms: formData.get("notifySms") === "on",
  };
}

const FIELD_IDS = {
  displayName: {
    input: "display-name",
    error: "display-name-error",
  },
  email: {
    input: "email",
    error: "email-error",
  },
  newPassword: {
    input: "new-password",
    error: "new-password-error",
    extraDescribedBy: "new-password-hint",
  },
  confirmPassword: {
    input: "confirm-password",
    error: "confirm-password-error",
  },
};

export function initSettingsForm(form) {
  const submitButton = form.querySelector("#save-settings");
  const successRegion = document.getElementById("form-success");
  const fieldErrors = new Map();
  let submitLock = false;

  function describedBy(fieldKey, hasError) {
    const meta = FIELD_IDS[fieldKey];
    const parts = [];
    if (meta.extraDescribedBy) parts.push(meta.extraDescribedBy);
    if (hasError) parts.push(meta.error);
    return parts.join(" ") || null;
  }

  function setFieldError(fieldKey, message) {
    const meta = FIELD_IDS[fieldKey];
    const input = form.querySelector(`#${meta.input}`);
    const errorEl = document.getElementById(meta.error);
    const hasError = Boolean(message);

    errorEl.textContent = message;
    input.classList.toggle("is-invalid", hasError);
    input.setAttribute("aria-invalid", hasError ? "true" : "false");

    const described = describedBy(fieldKey, hasError);
    if (described) {
      input.setAttribute("aria-describedby", described);
    } else {
      input.removeAttribute("aria-describedby");
    }

    if (hasError) {
      fieldErrors.set(fieldKey, message);
    } else {
      fieldErrors.delete(fieldKey);
    }

    updateSubmitState();
  }

  function updateSubmitState() {
    submitButton.disabled = submitLock || fieldErrors.size > 0;
  }

  function validateSingle(fieldKey, values) {
    if (fieldKey === "displayName") return validateDisplayName(values.displayName);
    if (fieldKey === "email") return validateEmail(values.email);
    if (fieldKey === "newPassword") return validateNewPassword(values.newPassword);
    return validateConfirmPassword(values.newPassword, values.confirmPassword);
  }

  function showAllErrors(result) {
    for (const key of Object.keys(FIELD_IDS)) {
      const fieldResult = result.fields[key];
      setFieldError(key, fieldResult.valid ? "" : fieldResult.message);
    }
  }

  function onFieldBlur(fieldKey) {
    const values = readFormValues(form);
    const result = validateSingle(fieldKey, values);
    setFieldError(fieldKey, result.valid ? "" : result.message);

    if (fieldKey === "newPassword" && fieldErrors.has("confirmPassword")) {
      const confirmResult = validateConfirmPassword(
        values.newPassword,
        values.confirmPassword
      );
      setFieldError("confirmPassword", confirmResult.valid ? "" : confirmResult.message);
    }
  }

  function onFieldInput(fieldKey) {
    if (successRegion && !successRegion.hidden) {
      successRegion.hidden = true;
      successRegion.textContent = "";
      submitLock = false;
      updateSubmitState();
    }

    if (!fieldErrors.has(fieldKey) && !(fieldKey === "newPassword" && fieldErrors.has("confirmPassword"))) {
      return;
    }

    const values = readFormValues(form);
    const result = validateSingle(fieldKey, values);
    if (result.valid) {
      setFieldError(fieldKey, "");
    } else if (fieldErrors.has(fieldKey)) {
      setFieldError(fieldKey, result.message);
    }

    if (fieldKey === "newPassword" && fieldErrors.has("confirmPassword")) {
      const confirmResult = validateConfirmPassword(
        values.newPassword,
        values.confirmPassword
      );
      setFieldError(
        "confirmPassword",
        confirmResult.valid ? "" : confirmResult.message
      );
    }
  }

  form.addEventListener("blur", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const fieldKey = Object.keys(FIELD_IDS).find(
      (key) => FIELD_IDS[key].input === target.id
    );
    if (fieldKey) onFieldBlur(fieldKey);
  }, true);

  form.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const fieldKey = Object.keys(FIELD_IDS).find(
      (key) => FIELD_IDS[key].input === target.id
    );
    if (fieldKey) onFieldInput(fieldKey);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (submitLock) return;

    const values = readFormValues(form);
    const result = validateForm(values);
    if (!result.valid) {
      showAllErrors(result);
      const firstInvalid = form.querySelector("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    submitLock = true;
    updateSubmitState();
    showAllErrors(result);
    console.log(result.values);

    if (successRegion) {
      successRegion.hidden = false;
      successRegion.textContent = "Your account settings were saved.";
    }
  });

  updateSubmitState();
  return {
    get hasActiveErrors() {
      return fieldErrors.size > 0;
    },
    get isLocked() {
      return submitLock;
    },
  };
}

if (typeof document !== "undefined") {
  const form = document.getElementById("account-settings-form");
  if (form) initSettingsForm(form);
}
