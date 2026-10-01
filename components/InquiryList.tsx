"use client";

import Image from "next/image";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  groupInquiryByProduct,
  parseNonNegativeIntInput,
  totalStems,
} from "../lib/inquiry";
import { useInquiry } from "./InquiryProvider";
import { SHOW_SITE_CHROME_EVENT } from "./ProductsNavLink";

export function InquiryList() {
  const { items, ready, setQuantity, removeItem, clear, count } = useInquiry();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pendingClearViewportRef = useRef(false);

  const groups = useMemo(() => groupInquiryByProduct(items), [items]);
  const stemsGrandTotal = useMemo(() => totalStems(items), [items]);

  useLayoutEffect(() => {
    if (!pendingClearViewportRef.current) return;
    if (!ready || items.length > 0) return;
    pendingClearViewportRef.current = false;

    const scrollingElement = document.scrollingElement ?? document.documentElement;
    scrollingElement.scrollTop = 0;
    window.dispatchEvent(new Event(SHOW_SITE_CHROME_EVENT));
    titleRef.current?.focus({ preventScroll: true });
  }, [ready, items.length]);

  function onQuantityChange(id: string, value: string) {
    setDrafts((prev) => ({ ...prev, [id]: value }));
    const parsed = parseNonNegativeIntInput(value);
    if (parsed === null) {
      setErrors((prev) => ({
        ...prev,
        [id]: "Enter a whole number (0 or greater).",
      }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setQuantity(id, parsed);
  }

  function handleClearAll() {
    clear();
    setDrafts({});
    setErrors({});
    setConfirmClear(false);
    pendingClearViewportRef.current = true;
  }

  return (
    <section className="inquiry-page section-shell" aria-labelledby="inquiry-title">
      <header className="inquiry-intro">
        <p className="eyebrow">INQUIRY LIST</p>
        <h1 id="inquiry-title" tabIndex={-1} ref={titleRef}>
          Your selected varieties
        </h1>
        <p className="inquiry-lead">
          Review quantities and options, then request a quote. No pricing or checkout —
          we confirm availability with you.
        </p>
        <p className="inquiry-count" role="status" aria-live="polite">
          {ready ? `${count} ${count === 1 ? "line" : "lines"}` : "Loading…"}
          {ready && stemsGrandTotal > 0
            ? ` · ${stemsGrandTotal} stems total`
            : null}
        </p>
      </header>

      {!ready ? null : items.length === 0 ? (
        <div className="inquiry-empty" role="status">
          <p>Your inquiry list is empty.</p>
          <a className="button button-primary" href="/products">
            Browse products
          </a>
        </div>
      ) : (
        <>
          <ul className="inquiry-list">
            {groups.map((group) => (
              <li className="inquiry-item inquiry-item-group" key={group.slug}>
                <a className="inquiry-item-photo" href={`/products/${group.slug}`}>
                  <Image
                    src={group.image}
                    alt=""
                    width={120}
                    height={120}
                    className="inquiry-item-media"
                  />
                </a>
                <div className="inquiry-item-body">
                  <div className="inquiry-item-copy">
                    <h2>
                      <a href={`/products/${group.slug}`}>{group.name}</a>
                    </h2>
                    <p className="inquiry-item-meta">
                      {group.category}
                      {group.code ? ` · Code ${group.code}` : ""}
                    </p>
                    {group.stemTotal > 0 ? (
                      <p className="inquiry-item-subtotal">
                        Product total: {group.stemTotal} stems
                      </p>
                    ) : null}
                  </div>

                  <ul className="inquiry-size-lines">
                    {group.lines.map((item) => (
                      <li className="inquiry-size-line" key={item.id}>
                        <div className="inquiry-size-line-copy">
                          {item.sizeLabel && item.lengthRange ? (
                            <>
                              <p className="inquiry-size-line-label">
                                Size {item.sizeLabel}
                              </p>
                              <p className="inquiry-size-line-range">{item.lengthRange}</p>
                            </>
                          ) : item.optionLabel ? (
                            <p className="inquiry-size-line-label">{item.optionLabel}</p>
                          ) : (
                            <p className="inquiry-size-line-label">Quantity</p>
                          )}
                        </div>
                        <div className="inquiry-item-controls">
                          <label className="inquiry-qty">
                            <span>
                              Qty <span className="inquiry-unit">({item.unit})</span>
                            </span>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={drafts[item.id] ?? String(item.quantity)}
                              onChange={(event) =>
                                onQuantityChange(item.id, event.target.value)
                              }
                              aria-invalid={errors[item.id] ? true : undefined}
                            />
                          </label>
                          {errors[item.id] ? (
                            <p className="inquiry-error" role="alert">
                              {errors[item.id]}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            className="inquiry-remove"
                            onClick={() => removeItem(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>

          <div className="inquiry-summary-row">
            {stemsGrandTotal > 0 ? (
              <p className="inquiry-grand-total" role="status">
                Total stems: <strong>{stemsGrandTotal}</strong>
              </p>
            ) : (
              <span className="inquiry-summary-row-grow" aria-hidden="true" />
            )}
            {!confirmClear ? (
              <button
                type="button"
                className="inquiry-clear-text-btn"
                onClick={() => setConfirmClear(true)}
              >
                <svg
                  className="inquiry-clear-text-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Clear inquiry
              </button>
            ) : null}
          </div>

          {confirmClear ? (
            <div
              className="inquiry-clear-confirm"
              role="group"
              aria-labelledby="inquiry-clear-title"
            >
              <p id="inquiry-clear-title" className="inquiry-clear-message">
                Clear all items from your inquiry?
              </p>
              <div className="inquiry-clear-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button button-primary inquiry-clear-confirm-btn"
                  onClick={handleClearAll}
                >
                  Clear all
                </button>
              </div>
            </div>
          ) : (
            <div className="inquiry-actions">
              <a className="button button-secondary" href="/products">
                Continue selecting
              </a>
              <a className="button button-primary" href="/contact?from=inquiry">
                Request a quote
              </a>
            </div>
          )}
        </>
      )}
    </section>
  );
}
