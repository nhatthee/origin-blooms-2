"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  groupInquiryByProduct,
  parseNonNegativeIntInput,
  totalStems,
} from "../lib/inquiry";
import { useInquiry } from "./InquiryProvider";

export function InquiryList() {
  const { items, ready, setQuantity, removeItem, clear, count } = useInquiry();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmClear, setConfirmClear] = useState(false);

  const groups = useMemo(() => groupInquiryByProduct(items), [items]);
  const stemsGrandTotal = useMemo(() => totalStems(items), [items]);

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
  }

  return (
    <section className="inquiry-page section-shell" aria-labelledby="inquiry-title">
      <header className="inquiry-intro">
        <p className="eyebrow">INQUIRY LIST</p>
        <h1 id="inquiry-title">Your selected varieties</h1>
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
                    <p className="inquiry-item-meta">{group.category}</p>
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

          {stemsGrandTotal > 0 ? (
            <p className="inquiry-grand-total" role="status">
              Total stems: <strong>{stemsGrandTotal}</strong>
            </p>
          ) : null}

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
              <button
                type="button"
                className="button button-secondary inquiry-clear-btn"
                onClick={() => setConfirmClear(true)}
              >
                Clear inquiry
              </button>
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
