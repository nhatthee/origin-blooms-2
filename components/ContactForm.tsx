"use client";

import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { sendInquiry } from "../app/actions/send-inquiry";
import {
  CONTACT_LIMITS,
  INTEREST_OPTIONS,
  type ContactActionResult,
  type ContactFieldErrors,
} from "../lib/contact";
import { Arrow } from "./Arrow";

type FormStatus = "idle" | "submitting" | "success" | "error";

const INITIAL_VALUES = {
  name: "",
  businessName: "",
  email: "",
  phone: "",
  interestedIn: "",
  quantity: "",
  deliveryLocation: "",
  neededBy: "",
  message: "",
  website: "",
};

export function ContactForm() {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const submitting = status === "submitting" || isPending;

  function updateField<K extends keyof typeof INITIAL_VALUES>(
    key: K,
    value: (typeof INITIAL_VALUES)[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key !== "website" && fieldErrors[key as keyof ContactFieldErrors]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof ContactFieldErrors];
        return next;
      });
    }
  }

  function validateClient(): ContactFieldErrors | null {
    const errors: ContactFieldErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.name.trim()) errors.name = "Please enter your name.";
    if (!values.email.trim()) {
      errors.email = "Please enter your email.";
    } else if (!emailPattern.test(values.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!values.message.trim()) errors.message = "Please enter a message.";

    return Object.keys(errors).length > 0 ? errors : null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const clientErrors = validateClient();
    if (clientErrors) {
      setFieldErrors(clientErrors);
      setStatus("error");
      setErrorMessage("Please check the highlighted fields and try again.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setStatus("submitting");
    setFieldErrors({});

    startTransition(async () => {
      let result: ContactActionResult;
      try {
        result = await sendInquiry(formData);
      } catch {
        setStatus("error");
        setErrorMessage(
          "We couldn’t send your inquiry right now. Please try again or email sales@originblooms.com.",
        );
        return;
      }

      if (result.ok) {
        setStatus("success");
        setValues(INITIAL_VALUES);
        formRef.current?.reset();
        return;
      }

      setStatus("error");
      setFieldErrors(result.fieldErrors ?? {});
      setErrorMessage(result.error);
    });
  }

  return (
    <form
      ref={formRef}
      className="contact-form"
      method="post"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={
        status === "success"
          ? `${formId}-success`
          : status === "error"
            ? `${formId}-error`
            : undefined
      }
    >
      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor={`${formId}-name`}>
            Name <span className="contact-required" aria-hidden="true">*</span>
            <span className="visually-hidden"> (required)</span>
          </label>
          <input
            id={`${formId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={CONTACT_LIMITS.name}
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? `${formId}-name-error` : undefined}
            disabled={submitting}
          />
          {fieldErrors.name ? (
            <p id={`${formId}-name-error`} className="contact-field-error" role="alert">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="contact-field">
          <label htmlFor={`${formId}-business`}>Business name</label>
          <input
            id={`${formId}-business`}
            name="businessName"
            type="text"
            autoComplete="organization"
            maxLength={CONTACT_LIMITS.businessName}
            value={values.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="contact-field">
          <label htmlFor={`${formId}-email`}>
            Email <span className="contact-required" aria-hidden="true">*</span>
            <span className="visually-hidden"> (required)</span>
          </label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={CONTACT_LIMITS.email}
            value={values.email}
            onChange={(e) => updateField("email", e.target.value)}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? `${formId}-email-error` : undefined}
            disabled={submitting}
          />
          {fieldErrors.email ? (
            <p id={`${formId}-email-error`} className="contact-field-error" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="contact-field">
          <label htmlFor={`${formId}-phone`}>Phone</label>
          <input
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={CONTACT_LIMITS.phone}
            value={values.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="contact-field">
          <label htmlFor={`${formId}-interest`}>Interested in</label>
          <select
            id={`${formId}-interest`}
            name="interestedIn"
            value={values.interestedIn}
            onChange={(e) => updateField("interestedIn", e.target.value)}
            aria-invalid={fieldErrors.interestedIn ? true : undefined}
            aria-describedby={
              fieldErrors.interestedIn ? `${formId}-interest-error` : undefined
            }
            disabled={submitting}
          >
            <option value="">Select an option</option>
            {INTEREST_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {fieldErrors.interestedIn ? (
            <p id={`${formId}-interest-error`} className="contact-field-error" role="alert">
              {fieldErrors.interestedIn}
            </p>
          ) : null}
        </div>

        <div className="contact-field">
          <label htmlFor={`${formId}-quantity`}>Estimated quantity</label>
          <input
            id={`${formId}-quantity`}
            name="quantity"
            type="text"
            maxLength={CONTACT_LIMITS.quantity}
            placeholder="e.g. 20 boxes / 500 stems"
            value={values.quantity}
            onChange={(e) => updateField("quantity", e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="contact-field">
          <label htmlFor={`${formId}-location`}>Delivery location</label>
          <input
            id={`${formId}-location`}
            name="deliveryLocation"
            type="text"
            autoComplete="address-level2"
            maxLength={CONTACT_LIMITS.deliveryLocation}
            placeholder="City, state"
            value={values.deliveryLocation}
            onChange={(e) => updateField("deliveryLocation", e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="contact-field">
          <label htmlFor={`${formId}-needed-by`}>Needed by date</label>
          <input
            id={`${formId}-needed-by`}
            name="neededBy"
            type="date"
            value={values.neededBy}
            onChange={(e) => updateField("neededBy", e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="contact-field contact-field-full">
          <label htmlFor={`${formId}-message`}>
            Message <span className="contact-required" aria-hidden="true">*</span>
            <span className="visually-hidden"> (required)</span>
          </label>
          <textarea
            id={`${formId}-message`}
            name="message"
            required
            rows={6}
            maxLength={CONTACT_LIMITS.message}
            value={values.message}
            onChange={(e) => updateField("message", e.target.value)}
            aria-invalid={fieldErrors.message ? true : undefined}
            aria-describedby={
              fieldErrors.message
                ? `${formId}-message-error ${formId}-message-count`
                : `${formId}-message-count`
            }
            disabled={submitting}
          />
          <div className="contact-field-meta">
            {fieldErrors.message ? (
              <p id={`${formId}-message-error`} className="contact-field-error" role="alert">
                {fieldErrors.message}
              </p>
            ) : (
              <span />
            )}
            <p id={`${formId}-message-count`} className="contact-char-count">
              {values.message.length}/{CONTACT_LIMITS.message}
            </p>
          </div>
        </div>
      </div>

      {/* Honeypot — off-screen; bots may fill it, humans should not */}
      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => updateField("website", e.target.value)}
        />
      </div>

      <div className="contact-form-actions">
        <button
          className="button button-primary contact-submit"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Sending…" : "Send inquiry"}
          {!submitting ? <Arrow /> : null}
        </button>
        <p className="contact-required-note">
          <span className="contact-required" aria-hidden="true">*</span> Required fields
        </p>
      </div>

      <div className="contact-form-status" aria-live="polite">
        {status === "success" ? (
          <p id={`${formId}-success`} className="contact-status contact-status-success" role="status">
            Thanks — your inquiry was sent. We’ll get back to you soon.
          </p>
        ) : null}
        {status === "error" && errorMessage ? (
          <p id={`${formId}-error`} className="contact-status contact-status-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}
