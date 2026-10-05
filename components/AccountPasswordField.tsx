"use client";

import { useState } from "react";

type AccountPasswordFieldProps = {
  id: string;
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  describedBy?: string;
};

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg
      className="account-password-toggle-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 12s3.6-7 9.5-7 9.5 7 9.5 7-3.6 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      {crossed ? (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

export function AccountPasswordField({
  id,
  label,
  name,
  autoComplete,
  value,
  onChange,
  error,
  disabled = false,
  required = true,
  describedBy,
}: AccountPasswordFieldProps) {
  const errorId = `${id}-error`;
  // Local visibility only — never persisted.
  const [visible, setVisible] = useState(false);

  return (
    <div className="account-field">
      <label htmlFor={id}>
        {label}
        {required ? <span className="contact-required" aria-hidden="true">*</span> : null}
      </label>
      <div className="account-password-wrap">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="account-password-toggle"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>
      {error ? (
        <p id={errorId} className="contact-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
