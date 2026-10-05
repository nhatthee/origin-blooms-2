"use client";

import { useId, useState, type FormEvent } from "react";
import {
  ACCOUNT_AUTH_UNAVAILABLE_MESSAGE,
  isValidEmail,
  normalizeAccountEmail,
} from "../lib/accountForm";
import { AccountPasswordField } from "./AccountPasswordField";

type FieldErrors = {
  email?: string;
  password?: string;
};

export function LoginForm() {
  const formId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!email.trim()) {
      next.email = "Enter your email address.";
    } else if (!isValidEmail(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!password) {
      next.password = "Enter your password.";
    }
    return next;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // No auth backend is wired yet — never pretend login succeeded.
    setSubmitting(true);
    void normalizeAccountEmail(email);
    setFormError(ACCOUNT_AUTH_UNAVAILABLE_MESSAGE);
    setSubmitting(false);
  }

  return (
    <form className="account-form" onSubmit={handleSubmit} noValidate>
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
        autoComplete="current-password"
        value={password}
        disabled={submitting}
        error={errors.password}
        onChange={(value) => {
          setPassword(value);
          setErrors((prev) => ({ ...prev, password: undefined }));
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
        {submitting ? "Logging in…" : "Log in"}
      </button>

      <p className="account-switch">
        New to Origin Blooms?{" "}
        <a href="/signup">Sign up</a>
      </p>
    </form>
  );
}
