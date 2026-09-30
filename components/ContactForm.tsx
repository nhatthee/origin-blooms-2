"use client";

import Image from "next/image";
import {
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { sendInquiry } from "../app/actions/send-inquiry";
import {
  CONTACT_LIMITS,
  EMPTY_CONTACT_VALUES,
  INTEREST_OPTIONS,
  clearContactDraft,
  contactValuesToFormData,
  readContactDraft,
  writeContactDraft,
  type ContactActionResult,
  type ContactFieldErrors,
  type ContactFormValues,
} from "../lib/contact";
import { formatInquirySummary, groupInquiryByProduct, totalStems, totalsByUnit } from "../lib/inquiry";
import { Arrow } from "./Arrow";
import { useInquiry } from "./InquiryProvider";

type FormStatus = "idle" | "submitting" | "error";
type Step = "form" | "review" | "success";

function displayOrDash(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : "—";
}

function ContactFormInner() {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const { items, ready, clear: clearInquiry } = useInquiry();
  const prefilledRef = useRef(false);
  const draftLoadedRef = useRef(false);
  const reviewRequiresProductsRef = useRef(false);
  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<ContactFormValues>(EMPTY_CONTACT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [inquiryNotice, setInquiryNotice] = useState("");

  const submitting = status === "submitting" || isPending;
  const fromInquiry = searchParams.get("from") === "inquiry";
  const unitTotals = totalsByUnit(items);
  const productGroups = groupInquiryByProduct(items);
  const stemsGrandTotal = totalStems(items);
  const reviewBlockedEmpty =
    step === "review" &&
    items.length === 0 &&
    (reviewRequiresProductsRef.current || fromInquiry);

  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    const draft = readContactDraft();
    if (draft && (draft.name || draft.email || draft.message)) {
      setValues(draft);
    }
  }, []);

  useEffect(() => {
    if (!ready || prefilledRef.current) return;

    const variety = searchParams.get("variety")?.trim() ?? "";
    const existingDraft = readContactDraft();

    if (fromInquiry && items.length > 0) {
      const summary = formatInquirySummary(items);
      setValues((prev) => {
        const base = existingDraft ?? prev;
        return {
          ...base,
          message: base.message.trim()
            ? base.message
            : summary.message.slice(0, CONTACT_LIMITS.message),
          quantity: base.quantity.trim()
            ? base.quantity
            : summary.quantity.slice(0, CONTACT_LIMITS.quantity),
          interestedIn: base.interestedIn || summary.interestedIn,
        };
      });
      // Header on /contact?from=inquiry already shows this guidance — avoid a duplicate notice.
      setInquiryNotice("");
      prefilledRef.current = true;
      return;
    }

    if (variety && !existingDraft?.message.trim()) {
      setValues((prev) => ({
        ...prev,
        message: `I’d like more information about ${variety}.`.slice(
          0,
          CONTACT_LIMITS.message,
        ),
      }));
      setInquiryNotice(`Inquiry started for ${variety}.`);
      prefilledRef.current = true;
    }
  }, [ready, items, searchParams, fromInquiry]);

  useEffect(() => {
    if (step !== "review") return;
    if (!reviewBlockedEmpty) return;
    setStatus("error");
    setErrorMessage(
      "Your inquiry list is empty. Add products before confirming, or go back to edit your request.",
    );
  }, [step, reviewBlockedEmpty]);

  function updateField<K extends keyof ContactFormValues>(
    key: K,
    value: ContactFormValues[K],
  ) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      writeContactDraft(next);
      return next;
    });
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

  function handleSubmitForReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatus("idle");

    const clientErrors = validateClient();
    if (clientErrors) {
      setFieldErrors(clientErrors);
      setStatus("error");
      setErrorMessage("Please check the highlighted fields and try again.");
      return;
    }

    setFieldErrors({});
    writeContactDraft(values);
    reviewRequiresProductsRef.current = items.length > 0 || fromInquiry;
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditInquiry() {
    setStatus("idle");
    setErrorMessage("");
    setStep("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleConfirmSend() {
    if (submitting) return;

    if (reviewRequiresProductsRef.current || fromInquiry) {
      if (items.length === 0) {
        setStatus("error");
        setErrorMessage(
          "Your inquiry list is empty. Add products before confirming, or go back to edit your request.",
        );
        return;
      }
    }

    setErrorMessage("");
    setStatus("submitting");
    setFieldErrors({});

    const formData = contactValuesToFormData(values);
    formData.set(
      "inquiryItems",
      JSON.stringify(
        items.map((item) => ({
          slug: item.slug,
          optionKey: item.optionKey,
          quantity: item.quantity,
          unit: item.unit,
        })),
      ),
    );
    if (reviewRequiresProductsRef.current || fromInquiry) {
      formData.set("requireInquiryItems", "1");
    }

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
        clearContactDraft();
        clearInquiry();
        setValues(EMPTY_CONTACT_VALUES);
        setStatus("idle");
        setStep("success");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Keep form + inquiry data for retry — never show success or clear list.
      setStatus("error");
      setFieldErrors(result.fieldErrors ?? {});
      setErrorMessage(result.error);
      if (result.fieldErrors) {
        setStep("form");
      }
    });
  }

  if (step === "success") {
    return (
      <div className="inquiry-thanks" role="status">
        <p className="eyebrow">INQUIRY SENT</p>
        <h2 className="inquiry-thanks-title">Thank you</h2>
        <p className="inquiry-thanks-body">
          Your wholesale inquiry was sent. We&apos;ll review your request and get back to
          you soon. This is a quote request — not an order confirmation.
        </p>
        <div className="inquiry-review-actions">
          <a className="button button-primary" href="/products?format=cut">
            Back to products
          </a>
          <a className="button button-secondary" href="/">
            Home
          </a>
        </div>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="inquiry-review" aria-labelledby="inquiry-review-title">
        <header className="contact-page-intro">
          <p className="eyebrow">
            <span className="eyebrow-line" aria-hidden="true" />
            REVIEW YOUR INQUIRY
          </p>
          <h1 id="inquiry-review-title">Confirm before sending</h1>
          <p className="contact-page-lead">
            This is a quote request only — no payment and no purchase commitment. Check
            the details below, then confirm to send.
          </p>
        </header>

        <section className="inquiry-review-section" aria-labelledby="review-products-title">
          <h3 id="review-products-title">Selected varieties</h3>
          {items.length === 0 ? (
            <p className="inquiry-review-empty" role="status">
              {reviewBlockedEmpty ? (
                <>
                  Your inquiry list is empty.{" "}
                  <a href="/products">Browse products</a> to add varieties, or go back to
                  edit your request. Confirm is disabled until items are added.
                </>
              ) : (
                <>
                  No varieties were added from the product list. Your estimated quantity
                  and message below will still be included.
                </>
              )}
            </p>
          ) : (
            <ul className="inquiry-review-list">
              {productGroups.map((group) => (
                <li className="inquiry-review-item inquiry-review-item-group" key={group.slug}>
                  <div className="inquiry-review-photo">
                    <Image
                      src={group.image}
                      alt=""
                      width={96}
                      height={96}
                      className="inquiry-review-media"
                    />
                  </div>
                  <div className="inquiry-review-item-copy">
                    <p className="inquiry-review-name">{group.name}</p>
                    <p className="inquiry-review-meta">{group.category}</p>
                    <ul className="inquiry-review-size-list">
                      {group.lines.map((item) => (
                        <li key={item.id}>
                          {item.sizeLabel && item.lengthRange ? (
                            <>
                              <span>
                                {item.sizeLabel} ({item.lengthRange})
                              </span>
                              <strong>
                                {item.quantity} {item.unit}
                              </strong>
                            </>
                          ) : (
                            <>
                              <span>{item.optionLabel || "Quantity"}</span>
                              <strong>
                                {item.quantity} {item.unit}
                              </strong>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                    {group.stemTotal > 0 ? (
                      <p className="inquiry-review-product-total">
                        Product total: {group.stemTotal} stems
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {stemsGrandTotal > 0 ? (
            <p className="inquiry-review-stems-total">
              Total stems: <strong>{stemsGrandTotal}</strong>
            </p>
          ) : null}

          {unitTotals.length > 0 ? (
            <div className="inquiry-review-totals">
              <h4>Totals by unit</h4>
              <ul>
                {unitTotals.map((row) => (
                  <li key={row.unit}>
                    <span>{row.unit}</span>
                    <strong>
                      {row.total} {row.unit}
                    </strong>
                  </li>
                ))}
              </ul>
              <p className="inquiry-review-totals-note">
                Totals are listed separately by unit — stems, bunches, packs, and boxes
                are never combined into one number.
              </p>
            </div>
          ) : null}
        </section>

        <section className="inquiry-review-section" aria-labelledby="review-contact-title">
          <h3 id="review-contact-title">Contact & request details</h3>
          <dl className="inquiry-review-details">
            <div>
              <dt>Name</dt>
              <dd>{displayOrDash(values.name)}</dd>
            </div>
            <div>
              <dt>Business name</dt>
              <dd>{displayOrDash(values.businessName)}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{displayOrDash(values.email)}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{displayOrDash(values.phone)}</dd>
            </div>
            <div>
              <dt>Interested in</dt>
              <dd>{displayOrDash(values.interestedIn)}</dd>
            </div>
            <div>
              <dt>Estimated quantity</dt>
              <dd>{displayOrDash(values.quantity)}</dd>
            </div>
            <div>
              <dt>Delivery location</dt>
              <dd>{displayOrDash(values.deliveryLocation)}</dd>
            </div>
            <div>
              <dt>Needed by</dt>
              <dd>{displayOrDash(values.neededBy)}</dd>
            </div>
            <div className="inquiry-review-details-full">
              <dt>Message</dt>
              <dd className="inquiry-review-message">{displayOrDash(values.message)}</dd>
            </div>
          </dl>
        </section>

        {status === "error" && errorMessage ? (
          <p className="contact-status contact-status-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="inquiry-review-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={handleEditInquiry}
            disabled={submitting}
          >
            Edit inquiry
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleConfirmSend}
            disabled={submitting || reviewBlockedEmpty}
          >
            {submitting ? "Sending…" : "Confirm & send inquiry"}
            {!submitting ? <Arrow /> : null}
          </button>
        </div>
        {items.length > 0 ? (
          <p className="inquiry-review-edit-products">
            Need to change varieties or quantities?{" "}
            <a href="/inquiry">Edit product list</a>
          </p>
        ) : reviewBlockedEmpty ? (
          <p className="inquiry-review-edit-products">
            <a href="/inquiry">Open inquiry list</a>
            {" · "}
            <a href="/products">Browse products</a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="contact-page-intro">
        {fromInquiry ? (
          <>
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" />
              REQUEST A QUOTE
            </p>
            <h1 id="contact-page-title">Your inquiry, almost ready.</h1>
            <p className="contact-page-lead">
              Your inquiry list is filled in below. Review it before submitting.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" />
              WHOLESALE INQUIRY
            </p>
            <h1 id="contact-page-title">Let&apos;s talk orchids.</h1>
            <p className="contact-page-lead">
              Tell us what you&apos;re looking for, and we&apos;ll get back to you.
            </p>
          </>
        )}
      </div>

      <form
        ref={formRef}
        className="contact-form"
        method="post"
        onSubmit={handleSubmitForReview}
        noValidate
        aria-describedby={status === "error" ? `${formId}-error` : undefined}
      >
      {inquiryNotice ? (
        <p className="contact-inquiry-notice" role="status">
          {inquiryNotice}
        </p>
      ) : null}

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
          Submit inquiry
          <Arrow />
        </button>
        <p className="contact-required-note">
          <span className="contact-required" aria-hidden="true">*</span> Required fields
        </p>
      </div>

      <div className="contact-form-status" aria-live="polite">
        {status === "error" && errorMessage ? (
          <p id={`${formId}-error`} className="contact-status contact-status-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </form>
    </>
  );
}

export function ContactForm() {
  return (
    <Suspense fallback={null}>
      <ContactFormInner />
    </Suspense>
  );
}
