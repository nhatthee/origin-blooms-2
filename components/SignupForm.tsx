"use client";

import { useId, useState, type FormEvent } from "react";
import {
  ACCOUNT_AUTH_UNAVAILABLE_MESSAGE,
  ACCOUNT_PASSWORD_MIN_LENGTH,
  isValidEmail,
  normalizeAccountEmail,
  passwordMeetsMinimum,
} from "../lib/accountForm";
import { AccountPasswordField } from "./AccountPasswordField";

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function SignupForm() {
  const formId = useId();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const passwordHintId = `${formId}-password-hint`;

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!fullName.trim()) {
      next.fullName = "Enter your full name.";
    }
    if (!email.trim()) {
      next.email = "Enter your email address.";
    } else if (!isValidEmail(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!password) {
      next.password = "Create a password.";
    } else if (!passwordMeetsMinimum(password)) {
      next.password = `Use at least ${ACCOUNT_PASSWORD_MIN_LENGTH} characters.`;
    }
    if (!confirmPassword) {
      next.confirmPassword = "Confirm your password.";
    } else if (confirmPassword !== password) {
      next.confirmPassword = "Passwords do not match.";
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // No auth backend is wired yet — never pretend signup succeeded.
    setSubmitting(true);
    void normalizeAccountEmail(email);
    void companyName.trim();
    setFormError(ACCOUNT_AUTH_UNAVAILABLE_MESSAGE);
    setSubmitting(false);
  }

  return (
    <form className="account-form account-form--signup" onSubmit={handleSubmit} noValidate>
      <div className="account-field">
        <label htmlFor={`${formId}-name`}>
          Full name
          <span className="contact-required" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id={`${formId}-name`}
          name="name"
          type="text"
          autoComplete="name"
          value={fullName}
          disabled={submitting}
          required
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? `${formId}-name-error` : undefined}
          onChange={(event) => {
            setFullName(event.target.value);
            setErrors((prev) => ({ ...prev, fullName: undefined }));
            setFormError("");
          }}
        />
        {errors.fullName ? (
          <p id={`${formId}-name-error`} className="contact-field-error" role="alert">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <div className="account-field">
        <label htmlFor={`${formId}-company`}>Company name (optional)</label>
        <input
          id={`${formId}-company`}
          name="organization"
          type="text"
          autoComplete="organization"
          value={companyName}
          disabled={submitting}
          onChange={(event) => {
            setCompanyName(event.target.value);
            setFormError("");
          }}
        />
      </div>

      <div className="account-field">
        <label htmlFor={`${formId}-email`}>
          Email address
          <span className="contact-required" aria-hidden="true">
            *
          </span>
        </label>
        <input
          id={`${formId}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          disabled={submitting}
          required
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${formId}-email-error` : undefined}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
            setFormError("");
          }}
        />
        {errors.email ? (
          <p id={`${formId}-email-error`} className="contact-field-error" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>

      <AccountPasswordField
        id={`${formId}-password`}
        label="Password"
        name="password"
        autoComplete="new-password"
        value={password}
        disabled={submitting}
        error={errors.password}
        describedBy={passwordHintId}
        onChange={(value) => {
          setPassword(value);
          setErrors((prev) => ({ ...prev, password: undefined, confirmPassword: undefined }));
          setFormError("");
        }}
      />
      <p id={passwordHintId} className="account-field-hint">
        Use at least {ACCOUNT_PASSWORD_MIN_LENGTH} characters.
      </p>

      <AccountPasswordField
        id={`${formId}-confirm`}
        label="Confirm password"
        name="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        disabled={submitting}
        error={errors.confirmPassword}
        onChange={(value) => {
          setConfirmPassword(value);
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          setFormError("");
        }}
      />

      {formError ? (
        <p className="contact-status contact-status-error" role="alert">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        className="button button-primary account-submit"
        disabled={submitting}
      >
        {submitting ? "Creating account…" : "Create account"}
      </button>

      <p className="account-switch">
        Already have an account?{" "}
        <a href="/login">Log in</a>
      </p>
    </form>
  );
}
