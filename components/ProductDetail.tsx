"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  DENDROBIUM_SUPPLIER_PACKING,
  LOOSE_BLOOM_MASTER_CARTON_NOTE,
  LOOSE_BLOOM_PACKAGING_NOTE,
  LOOSE_BLOOM_PACKING_ROWS,
  MOKARA_BOX_DIMENSION_REMARKS,
  UNKNOWN_DETAIL,
  bouquetPackingSizeEntries,
  canAddToInquiry,
  displayBouquetTrayCount,
  displayProductCode,
  displayProductColor,
  familyLabel,
  formatLabel,
  formatNavLabel,
  hasBouquetOptions,
  isDendrobiumCutProduct,
  isLooseBloomProduct,
  looseBloomTotalFromPackQuantities,
  packingLines,
  productsHref,
  stemsPerTrayRows,
  type OrchidProduct,
  type ProductFamily,
  type ProductFormat,
} from "../data/orchids";
import { parseNonNegativeIntInput, parsePositiveIntInput } from "../lib/inquiry";
import { BouquetInquiryForm } from "./BouquetInquiryForm";
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
  const { addItem, addStemSizeQuantities, addLoosePackQuantities } = useInquiry();
  const formId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const images = product.images.length
    ? product.images
    : [{ src: product.image, alt: product.name, kind: "product" as const }];

  const stemSizes = product.order?.stemSizes ?? [];
  const packOptions = product.order?.packOptions ?? [];
  const hasStemSizes = stemSizes.length > 0;
  const isLooseProduct = isLooseBloomProduct(product);
  const hasLoosePacks = isLooseProduct && packOptions.length > 0;
  const unit = product.order?.unit ?? "";

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [packOptionId, setPackOptionId] = useState(packOptions[0]?.id ?? "");
  const [quantityInput, setQuantityInput] = useState("1");
  const [sizeQuantities, setSizeQuantities] = useState(() =>
    initialSizeQuantities(stemSizes.map((size) => size.id)),
  );
  const [loosePackQuantities, setLoosePackQuantities] = useState(() =>
    initialSizeQuantities(packOptions.map((pack) => pack.id)),
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
  const bouquetOptions = product.bouquetOptions ?? [];
  const bouquetTrayCounts = product.bouquetTrayCounts ?? [];
  const showBouquetDetails = hasBouquetOptions(product);
  const trayRows = stemsPerTrayRows(product);
  const showMokaraPendingPacking =
    product.family === "mokara-aranda" && trayRows.length === 0 && !showBouquetDetails;
  const showMokaraBoxDimensions =
    product.family === "mokara-aranda" && !showBouquetDetails;
  const showDendrobiumPacking = isDendrobiumCutProduct(product) && !showBouquetDetails;
  const showColor = Boolean(product.color?.trim()) || product.family !== "mokara-aranda";
  const showProductCode =
    !showBouquetDetails &&
    (Boolean(product.number?.trim()) || product.family !== "mokara-aranda");
  const metaColumns = [true, showColor, showProductCode].filter(Boolean).length;
  const showLengthColumn = stemSizes.some((size) => Boolean(size.lengthRange?.trim()));

  const loosePackTotals = Object.fromEntries(
    packOptions.map((pack) => [
      pack.id,
      parseNonNegativeIntInput(loosePackQuantities[pack.id] ?? "0") ?? 0,
    ]),
  );
  const totalLooseBlooms = hasLoosePacks
    ? looseBloomTotalFromPackQuantities(loosePackTotals)
    : 0;

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

    if (hasLoosePacks) {
      const parsed: Record<string, number> = {};
      for (const pack of packOptions) {
        const raw = loosePackQuantities[pack.id] ?? "0";
        const value = parseNonNegativeIntInput(raw);
        if (value === null) {
          setQuantityError("Enter whole numbers only (0 or greater) for each pack size.");
          return;
        }
        parsed[pack.id] = value;
      }
      const selected = Object.values(parsed).some((qty) => qty > 0);
      if (!selected) {
        setQuantityError("Enter a quantity greater than zero for at least one pack size.");
        return;
      }
      setQuantityError("");
      const ok = addLoosePackQuantities(product.slug, parsed);
      if (!ok) {
        setQuantityError("Unable to add this selection. Please check pack sizes and quantities.");
        return;
      }
      setLoosePackQuantities(initialSizeQuantities(packOptions.map((pack) => pack.id)));
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
        <Link href={formatCrumbHref}>{formatNavLabel(product.format)}</Link>
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
          <dl
            className={`product-detail-meta${
              metaColumns === 2 ? " product-detail-meta--two" : metaColumns === 1 ? " product-detail-meta--one" : ""
            }`}
          >
            <div>
              <dt>Format</dt>
              <dd>{formatLabel(product.format)}</dd>
            </div>
            {showColor ? (
              <div>
                <dt>Color</dt>
                <dd>{displayProductColor(product)}</dd>
              </div>
            ) : null}
            {showProductCode ? (
              <div>
                <dt>Code</dt>
                <dd>{displayProductCode(product)}</dd>
              </div>
            ) : null}
          </dl>

          {showBouquetDetails && product.description?.trim() ? (
            <p className="product-detail-description">{product.description.trim()}</p>
          ) : null}

          <div className="product-detail-packing">
            <h2 className="product-detail-section-title">Packing Details</h2>
            {showBouquetDetails && bouquetTrayCounts.length > 0 ? (
              <>
                {product.bouquetPackingNote?.trim() ? (
                  <p className="product-detail-packing-note">{product.bouquetPackingNote.trim()}</p>
                ) : null}
                <p className="product-detail-packing-unit">Bouquets per tray</p>
                <div className="product-detail-packing-desktop">
                  <div className="product-detail-table-scroll">
                    <table className="product-detail-info-table product-detail-info-table--numeric product-detail-bouquet-packing-table">
                      <thead>
                        <tr>
                          <th scope="col">Code</th>
                          <th scope="col">SS</th>
                          <th scope="col">S</th>
                          <th scope="col">M</th>
                          <th scope="col">L</th>
                          <th scope="col">LL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bouquetTrayCounts.map((row) => (
                          <tr key={row.code}>
                            <th scope="row">{row.code}</th>
                            <td>{displayBouquetTrayCount(row.ss)}</td>
                            <td>{displayBouquetTrayCount(row.s)}</td>
                            <td>{displayBouquetTrayCount(row.m)}</td>
                            <td>{displayBouquetTrayCount(row.l)}</td>
                            <td>{displayBouquetTrayCount(row.ll)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <ul className="product-detail-packing-mobile">
                  {bouquetTrayCounts.map((row) => (
                    <li key={row.code} className="product-detail-packing-mobile-block">
                      <p className="product-detail-packing-mobile-code">{row.code}</p>
                      <dl className="product-detail-packing-mobile-sizes">
                        {bouquetPackingSizeEntries(row).map((entry) => (
                          <div key={entry.size}>
                            <dt>{entry.size}</dt>
                            <dd>{entry.count}</dd>
                          </div>
                        ))}
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            ) : trayRows.length > 0 ? (
              <>
                <div className="product-detail-table-scroll">
                  <table className="product-detail-info-table product-detail-info-table--numeric">
                    <thead>
                      <tr>
                        <th scope="col">Size</th>
                        <th scope="col">Stem length</th>
                        <th scope="col">Stems per tray</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trayRows.map((row) => (
                        <tr key={row.size}>
                          <th scope="row">{row.size}</th>
                          <td>{row.stemLength}</td>
                          <td>{row.stemsPerTray}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {showMokaraBoxDimensions ? (
                  <div className="product-detail-packing-remarks">
                    <h3 className="product-detail-packing-remarks-title">Box Dimensions</h3>
                    <ul className="product-detail-packing-remarks-list">
                      {MOKARA_BOX_DIMENSION_REMARKS.map((row) => (
                        <li key={row.label}>
                          <strong>{row.label}:</strong> {row.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : showDendrobiumPacking ? (
              <>
                <div className="product-detail-table-scroll">
                  <table className="product-detail-info-table product-detail-info-table--numeric">
                    <thead>
                      <tr>
                        <th scope="col">Size</th>
                        <th scope="col">Supplier standard length</th>
                        <th scope="col">Stems per tray</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DENDROBIUM_SUPPLIER_PACKING.map((row) => (
                        <tr key={row.size}>
                          <th scope="row">{row.size}</th>
                          <td>{row.supplierStandardLength}</td>
                          <td>{row.stemsPerTray}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="product-detail-packing-remarks">
                  <h3 className="product-detail-packing-remarks-title">Box Dimensions</h3>
                  <ul className="product-detail-packing-remarks-list">
                    <li>
                      <strong>Sizes S, M &amp; L:</strong> 39 × 70 × 43 cm · 5 trays per box
                    </li>
                    <li>
                      <strong>Size LL:</strong> 37 × 80 × 42 cm · 5 trays per box
                    </li>
                  </ul>
                </div>
              </>
            ) : showMokaraPendingPacking ? (
              <>
                <p className="product-detail-packing-note">
                  Packing details will be confirmed with your quote.
                </p>
                <div className="product-detail-packing-remarks">
                  <h3 className="product-detail-packing-remarks-title">Box Dimensions</h3>
                  <ul className="product-detail-packing-remarks-list">
                    {MOKARA_BOX_DIMENSION_REMARKS.map((row) => (
                      <li key={row.label}>
                        <strong>{row.label}:</strong> {row.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : isLooseProduct ? (
              <div className="product-detail-loose-packing">
                <div className="product-detail-table-scroll product-detail-loose-packing-scroll">
                  <table className="product-detail-info-table product-detail-loose-packing-table">
                    <thead>
                      <tr>
                        <th scope="col">Pack size</th>
                        <th scope="col">Inner pack</th>
                        <th scope="col">Export packing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LOOSE_BLOOM_PACKING_ROWS.map((row) => (
                        <tr key={row.packSize}>
                          <th scope="row">{row.packSize}</th>
                          <td>{row.innerPack}</td>
                          <td>{row.exportPacking}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <dl className="product-detail-loose-packing-notes">
                  <div>
                    <dt>Master Carton</dt>
                    <dd>{LOOSE_BLOOM_MASTER_CARTON_NOTE}</dd>
                  </div>
                  <div>
                    <dt>Packaging</dt>
                    <dd>{LOOSE_BLOOM_PACKAGING_NOTE}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <dl>
                {packing.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value || UNKNOWN_DETAIL}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {orderReady && !showBouquetDetails ? (
            <form
              className={`product-detail-order${hasLoosePacks ? " product-detail-order--loose" : ""}`}
              onSubmit={handleAdd}
              noValidate
            >
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
                          {showLengthColumn ? <th scope="col">Stem length</th> : null}
                          <th scope="col">Quantity (stems)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stemSizes.map((size) => (
                          <tr key={size.id}>
                            <th scope="row">{size.label}</th>
                            {showLengthColumn ? (
                              <td>{size.lengthRange?.trim() || "—"}</td>
                            ) : null}
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
              ) : hasLoosePacks ? (
                <div className="product-size-table-wrap product-detail-loose-qty">
                  <h2 className="product-size-table-title">Loose Bloom Quantity</h2>
                  <p className="product-size-table-hint" id={`${formId}-loose-hint`}>
                    Enter the number of packs you need.
                  </p>
                  <div className="product-size-table-scroll">
                    <table className="product-size-table product-detail-loose-qty-table">
                      <thead>
                        <tr>
                          <th scope="col">Pack size</th>
                          <th scope="col">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packOptions.map((pack) => (
                          <tr key={pack.id}>
                            <th scope="row">{pack.label}</th>
                            <td>
                              <label
                                className="visually-hidden"
                                htmlFor={`${formId}-loose-${pack.id}`}
                              >
                                Quantity of packs for {pack.label}
                              </label>
                              <input
                                id={`${formId}-loose-${pack.id}`}
                                className="product-size-qty-input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={loosePackQuantities[pack.id] ?? "0"}
                                onChange={(event) => {
                                  const next = event.target.value;
                                  setLoosePackQuantities((prev) => ({
                                    ...prev,
                                    [pack.id]: next,
                                  }));
                                  setQuantityError("");
                                  setAddedNote("");
                                }}
                                aria-describedby={`${formId}-loose-hint`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div
                    className="product-detail-loose-total"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <p className="product-detail-loose-total-label">Total Blooms</p>
                    <p className="product-detail-loose-total-value">
                      {totalLooseBlooms.toLocaleString("en-US")}
                    </p>
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

              <div
                className={`product-detail-actions${
                  hasLoosePacks ? " product-detail-actions--center" : ""
                }`}
              >
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
          ) : !showBouquetDetails ? (
            <div className="product-detail-actions">
              <a className="button button-primary" href={inquireHref}>
                Inquire about this variety
              </a>
            </div>
          ) : null}
        </div>
      </div>

      {showBouquetDetails ? (
        <div className="product-detail-bouquet-options">
          <div className="product-detail-bouquet-panel">
            <h2 className="product-detail-section-title">Bouquet Options</h2>
            <p className="product-detail-bouquet-hint">
              Choose a size and enter bouquet quantities for each code. Leave 0 for
              sizes you are not ordering. Use Add another size to request more than one
              size of the same code.
            </p>
            <BouquetInquiryForm product={product} options={bouquetOptions} />
          </div>
        </div>
      ) : null}

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
