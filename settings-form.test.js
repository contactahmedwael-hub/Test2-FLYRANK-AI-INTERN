/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  initSettingsForm,
  messages,
  validateConfirmPassword,
  validateDisplayName,
  validateEmail,
  validateForm,
  validateNewPassword,
} from "./settings-form.js";

describe("validateDisplayName", () => {
  it("rejects an empty value", () => {
    expect(validateDisplayName("")).toEqual({
      valid: false,
      message: messages.displayNameRequired,
    });
  });

  it("rejects whitespace-only input", () => {
    expect(validateDisplayName("   ")).toMatchObject({
      valid: false,
      message: messages.displayNameRequired,
    });
  });

  it("rejects names shorter than 2 characters", () => {
    expect(validateDisplayName("A")).toMatchObject({
      valid: false,
      message: messages.displayNameLength,
    });
  });

  it("rejects names longer than 50 characters", () => {
    expect(validateDisplayName("A".repeat(51))).toMatchObject({
      valid: false,
      message: messages.displayNameLength,
    });
  });

  it("rejects digits and other punctuation", () => {
    expect(validateDisplayName("John123")).toMatchObject({
      valid: false,
      message: messages.displayNameChars,
    });
    expect(validateDisplayName("Ada_Lovelace")).toMatchObject({
      valid: false,
      message: messages.displayNameChars,
    });
  });

  it("accepts letters, spaces, and hyphens within length", () => {
    expect(validateDisplayName("Mary Jane")).toMatchObject({
      valid: true,
      value: "Mary Jane",
    });
    expect(validateDisplayName("  Mary-Jane  ")).toMatchObject({
      valid: true,
      value: "Mary-Jane",
    });
  });
});

describe("validateEmail", () => {
  it("rejects an empty value", () => {
    expect(validateEmail("")).toMatchObject({
      valid: false,
      message: messages.emailRequired,
    });
  });

  it("rejects whitespace-only input", () => {
    expect(validateEmail("\t  \n")).toMatchObject({
      valid: false,
      message: messages.emailRequired,
    });
  });

  it("rejects invalid email formats", () => {
    expect(validateEmail("not-an-email")).toMatchObject({
      valid: false,
      message: messages.emailInvalid,
    });
    expect(validateEmail("missing@domain")).toMatchObject({
      valid: false,
      message: messages.emailInvalid,
    });
    expect(validateEmail("spaces emma.t@example.net")).toMatchObject({
      valid: false,
      message: messages.emailInvalid,
    });
  });

  it("accepts a valid email and trims it", () => {
    expect(validateEmail("  user@example.com  ")).toMatchObject({
      valid: true,
      value: "user@example.com",
    });
  });
});

describe("validateNewPassword", () => {
  it("allows an empty password because it is optional", () => {
    expect(validateNewPassword("")).toMatchObject({ valid: true, value: "" });
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(validateNewPassword("Ab1")).toMatchObject({
      valid: false,
      message: messages.passwordMin,
    });
  });

  it("rejects passwords with no number", () => {
    expect(validateNewPassword("longpassword")).toMatchObject({
      valid: false,
      message: messages.passwordComplexity,
    });
  });

  it("rejects passwords with no letter", () => {
    expect(validateNewPassword("12345678")).toMatchObject({
      valid: false,
      message: messages.passwordComplexity,
    });
  });

  it("accepts a password with a letter, a number, and 8+ characters", () => {
    expect(validateNewPassword("password1")).toMatchObject({
      valid: true,
      value: "password1",
    });
  });
});

describe("validateConfirmPassword", () => {
  it("is valid when both password fields are empty", () => {
    expect(validateConfirmPassword("", "")).toMatchObject({ valid: true });
  });

  it("errors when a password is filled but confirm is empty", () => {
    expect(validateConfirmPassword("password1", "")).toMatchObject({
      valid: false,
      message: messages.confirmRequired,
    });
  });

  it("errors when the confirmation does not match", () => {
    expect(validateConfirmPassword("password1", "password2")).toMatchObject({
      valid: false,
      message: messages.confirmMismatch,
    });
  });

  it("accepts a matching confirmation", () => {
    expect(validateConfirmPassword("password1", "password1")).toMatchObject({
      valid: true,
    });
  });

  it("is valid once the new password is cleared back to empty, even with stale confirm text", () => {
    expect(validateConfirmPassword("", "leftover-text")).toMatchObject({
      valid: true,
    });
  });
});

describe("validateForm", () => {
  it("fails empty submit with required-field errors on name and email", () => {
    const result = validateForm({
      displayName: "",
      email: "",
      newPassword: "",
      confirmPassword: "",
      notifyEmail: false,
      notifySms: false,
    });

    expect(result.valid).toBe(false);
    expect(result.values).toBeNull();
    expect(result.fields.displayName.message).toBe(messages.displayNameRequired);
    expect(result.fields.email.message).toBe(messages.emailRequired);
    expect(result.fields.newPassword.valid).toBe(true);
    expect(result.fields.confirmPassword.valid).toBe(true);
  });

  it("fails whitespace-only required fields instead of treating them as filled", () => {
    const result = validateForm({
      displayName: "   ",
      email: "   ",
      newPassword: "",
      confirmPassword: "",
    });

    expect(result.valid).toBe(false);
    expect(result.fields.displayName.message).toBe(messages.displayNameRequired);
    expect(result.fields.email.message).toBe(messages.emailRequired);
  });

  it("fails when password is set and confirm password is left empty", () => {
    const result = validateForm({
      displayName: "Ada Lovelace",
      email: "ada@example.com",
      newPassword: "password1",
      confirmPassword: "",
    });

    expect(result.valid).toBe(false);
    expect(result.fields.confirmPassword.message).toBe(messages.confirmRequired);
  });

  it("returns trimmed values and notification flags on success without a password", () => {
    const result = validateForm({
      displayName: "  Ada Lovelace  ",
      email: "  ada@example.com ",
      newPassword: "",
      confirmPassword: "",
      notifyEmail: true,
      notifySms: false,
    });

    expect(result.valid).toBe(true);
    expect(result.values).toEqual({
      displayName: "Ada Lovelace",
      email: "ada@example.com",
      newPassword: "",
      notifications: { email: true, sms: false },
    });
  });

  it("returns validated data including password when both password fields match", () => {
    const result = validateForm({
      displayName: "Ada",
      email: "ada@example.com",
      newPassword: "secret99",
      confirmPassword: "secret99",
      notifyEmail: false,
      notifySms: true,
    });

    expect(result.valid).toBe(true);
    expect(result.values).toEqual({
      displayName: "Ada",
      email: "ada@example.com",
      newPassword: "secret99",
      notifications: { email: false, sms: true },
    });
  });
});

describe("initSettingsForm submit locking", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  function mountValidForm() {
    document.body.innerHTML = `
      <div id="form-success" hidden></div>
      <form id="account-settings-form">
        <input id="display-name" name="displayName" value="Ada Lovelace" />
        <p id="display-name-error"></p>
        <input id="email" name="email" value="ada@example.com" />
        <p id="email-error"></p>
        <input id="new-password" name="newPassword" value="" />
        <p id="new-password-error"></p>
        <input id="confirm-password" name="confirmPassword" value="" />
        <p id="confirm-password-error"></p>
        <input id="notify-email" name="notifyEmail" type="checkbox" />
        <input id="notify-sms" name="notifySms" type="checkbox" />
        <button type="submit" id="save-settings">Save</button>
      </form>
    `;
    const form = document.getElementById("account-settings-form");
    const api = initSettingsForm(form);
    return { form, api };
  }

  it("does not submit twice or throw on rapid repeated submits", () => {
    const { form } = mountValidForm();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    expect(() => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.requestSubmit?.();
    }).not.toThrow();

    expect(log).toHaveBeenCalledTimes(1);
    expect(document.getElementById("save-settings").disabled).toBe(true);
  });
});
