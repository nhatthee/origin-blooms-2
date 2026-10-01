"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  UNKNOWN_DETAIL,
  canAddToInquiry,
  displayProductCode,
  displayProductColor,
  familyLabel,
  formatLabel,
  packingLines,
  productsHref,
  type OrchidProduct,
  type ProductFamily,
  type ProductFormat,
} from "../data/orchids";
import { parseNonNegativeIntInput, parsePositiveIntInput } from "../lib/inquiry";
import { useInquiry } from "./InquiryProvider";

type ProductDetailProps = {
  product: OrchidProduct;
  catalogQuery: {
    format: ProductFormat;
    family: ProductFamily;
    color?: string | null;
    q?: string | null;
  };
};

function initialSizeQuantities(sizeIds: string[]): Record<string, string> {
  return Object.fromEntries(sizeIds.map((id) => [id, "0"]));
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem, addStemSizeQuantities } = useInquiry();
  const formId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const images = product.images.length
    ? product.images
    : [{ src: product.image, alt: product.name, kind: "product" as const }];

  const stemSizes = product.order?.stemSizes ?? [];
  const packOptions = product.order?.packOptions ?? [];
  const hasStemSizes = stemSizes.length > 0;
  const unit = product.order?.unit ?? "";

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [packOptionId, setPackOptionId] = useState(packOptions[0]?.id ?? "");
  const [quantityInput, setQuantityInput] = useState("1");
  const [sizeQuantities, setSizeQuantities] = useState(() =>
    initialSizeQuantities(stemSizes.map((size) => size.id)),
  );
  const [quantityError, setQuantityError] = useState("");
  const [addedNote, setAddedNote] = useState("");

  const activeImage = images[activeIndex] ?? images[0];
  const orderReady = canAddToInquiry(product);
  const packing = packingLines(product);
  const formatCrumbHref = productsHref(product.format);
  const familyCrumbHref = productsHref(product.format, product.family);
  const detailEyebrow = product.detailEyebrow?.trim() || "Product Details";
  const detailTitle = product.detailName?.trim() || product.name;

  useEffect(() => {
    if (!lightboxOpen) return;
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [lightboxOpen]);

  const inquireHref = `/contact?variety=${encodeURIComponent(product.name)}`;

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddedNote("");

    if (hasStemSizes) {
      const parsed: Record<string, number> = {};
      for (const size of stemSizes) {
        const raw = sizeQuantities[size.id] ?? "0";
        const value = parseNonNegativeIntInput(raw);
        if (value === null) {
          setQuantityError("Enter whole numbers only (0 or greater) for each size.");
          return;
        }
        parsed[size.id] = value;
      }
      const selected = Object.values(parsed).some((qty) => qty > 0);
      if (!selected) {
        setQuantityError("Enter a quantity greater than zero for at least one size.");
        return;
      }
      setQuantityError("");
      const ok = addStemSizeQuantities(product.slug, parsed);
      if (!ok) {
        setQuantityError("Unable to add this selection. Please check sizes and quantities.");
        return;
      }
      setSizeQuantities(initialSizeQuantities(stemSizes.map((size) => size.id)));
      setAddedNote("Added to inquiry list.");
      return;
    }

    const quantity = parsePositiveIntInput(quantityInput);
    if (quantity === null) {
      setQuantityError("Enter a whole number greater than zero.");
      return;
    }
    setQuantityError("");
    const ok = addItem(product.slug, {
      quantity,
      packOptionId: packOptions.length ? packOptionId : undefined,
    });
    if (!ok) {
      setQuantityError("Unable to add this selection. Please check options and quantity.");
      return;
    }
    setAddedNote("Added to inquiry list.");
  }

  return (
    <section className="product-detail section-shell" aria-labelledby="product-detail-title">
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link href="/products">Products</Link>
        <span aria-hidden="true">/</span>
        <Link href={formatCrumbHref}>{formatLabel(product.format)}</Link>
        <span aria-hidden="true">/</span>
        <Link href={familyCrumbHref}>{familyLabel(product.family)}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="product-detail-layout">
        <div className="product-detail-gallery">
          <button
            type="button"
            className="product-detail-main-image"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Enlarge photo of ${product.name}`}
          >
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              sizes="(max-width: 760px) 92vw, min(560px, 46vw)"
              className="product-detail-main-media"
              priority
            />
          </button>

          {images.length > 1 ? (
            <ul className="product-detail-thumbs" aria-label="Product photos">
              {images.map((image, index) => (
                <li key={`${image.src}-${index}`}>
                  <button
                    type="button"
                    className={`product-detail-thumb${index === activeIndex ? " is-active" : ""}`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={
                      image.kind === "packing"
                        ? `Show packing photo ${index + 1}`
                        : `Show photo ${index + 1}`
                    }
                    aria-pressed={index === activeIndex}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes="88px"
                      className="product-detail-thumb-media"
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="product-detail-copy">
          <p className="product-detail-section-title">{detailEyebrow}</p>
          <h1 id="product-detail-title">{detailTitle}</h1>
          <dl className="product-detail-meta">
            <div>
              <dt>Format</dt>
              <dd>{formatLabel(product.format)}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>{displayProductColor(product)}</dd>
            </div>
            <div>
              <dt>Code</dt>
              <dd>{displayProductCode(product)}</dd>
            </div>
          </dl>

          <div className="product-detail-packing">
            <h2 className="product-detail-section-title">Packing Details</h2>
            <dl>
              {packing.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value || UNKNOWN_DETAIL}</dd>
                </div>
              ))}
            </dl>
          </div>

          {orderReady ? (
            <form className="product-detail-order" onSubmit={handleAdd} noValidate>
              {hasStemSizes ? (
                <div className="product-size-table-wrap">
                  <h2 className="product-size-table-title">Stem sizes</h2>
                  <p className="product-size-table-hint" id={`${formId}-size-hint`}>
                    Enter stems for each size you need. Leave 0 for sizes you are not
                    ordering. At least one size must be greater than zero.
                  </p>
                  <div className="product-size-table-scroll">
                    <table className="product-size-table">
                      <thead>
                        <tr>
                          <th scope="col">Size</th>
                          <th scope="col">Stem length</th>
                          <th scope="col">Quantity (stems)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stemSizes.map((size) => (
                          <tr key={size.id}>
                            <th scope="row">{size.label}</th>
                            <td>{size.lengthRange}</td>
                            <td>
                              <label className="visually-hidden" htmlFor={`${formId}-size-${size.id}`}>
                                Quantity in stems for size {size.label}
                              </label>
                              <input
                                id={`${formId}-size-${size.id}`}
                                className="product-size-qty-input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={sizeQuantities[size.id] ?? "0"}
                                onChange={(event) => {
                                  const next = event.target.value;
                                  setSizeQuantities((prev) => ({
                                    ...prev,
                                    [size.id]: next,
                                  }));
                                  setQuantityError("");
                                  setAddedNote("");
                                }}
                                aria-describedby={`${formId}-size-hint`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {quantityError ? (
                    <p className="product-detail-error" role="alert">
                      {quantityError}
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  {packOptions.length > 0 ? (
                    <fieldset className="product-detail-options">
                      <legend>Pack option</legend>
                      <div className="product-detail-option-list">
                        {packOptions.map((option) => (
                          <label key={option.id} className="product-detail-option">
                            <input
                              type="radio"
                              name={`${formId}-pack`}
                              value={option.id}
                              checked={packOptionId === option.id}
                              onChange={() => setPackOptionId(option.id)}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ) : null}

                  <div className="product-detail-qty">
                    <label htmlFor={`${formId}-qty`}>
                      Quantity <span className="product-detail-unit">({unit})</span>
                    </label>
                    <input
                      id={`${formId}-qty`}
                      name="quantity"
                      type="text"
                      inputMode="numeric"
                      pattern="[1-9][0-9]*"
                      value={quantityInput}
                      onChange={(event) => {
                        setQuantityInput(event.target.value);
                        setQuantityError("");
                        setAddedNote("");
                      }}
                      aria-invalid={quantityError ? true : undefined}
                      aria-describedby={
                        quantityError ? `${formId}-qty-error` : `${formId}-qty-hint`
                      }
                    />
                    <p id={`${formId}-qty-hint`} className="product-detail-qty-hint">
                      Whole numbers only, in {unit}.
                    </p>
                    {quantityError ? (
                      <p id={`${formId}-qty-error`} className="product-detail-error" role="alert">
                        {quantityError}
                      </p>
                    ) : null}
                  </div>
                </>
              )}

              <div className="product-detail-actions">
                <button className="button button-primary" type="submit">
                  Add to inquiry
                </button>
                <a className="button button-secondary product-detail-view-list" href="/inquiry">
                  View inquiry list
                </a>
              </div>
              {addedNote ? (
                <p className="product-detail-added" role="status" aria-live="polite">
                  {addedNote}
                </p>
              ) : null}
            </form>
          ) : (
            <div className="product-detail-actions">
              <a className="button button-primary" href={inquireHref}>
                Inquire about this variety
              </a>
            </div>
          )}
        </div>
      </div>

      {lightboxOpen ? (
        <div
          className="product-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} photo`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            ref={closeRef}
            type="button"
            className="product-lightbox-close"
            aria-label="Close enlarged photo"
            onClick={() => setLightboxOpen(false)}
          >
            Close
          </button>
          <div
            className="product-lightbox-stage"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeImage.src}
              alt={activeImage.alt}
              width={1200}
              height={1200}
              className="product-lightbox-media"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
