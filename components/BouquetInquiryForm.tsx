"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import {
  availableBouquetSizes,
  getBouquetTrayRow,
  type BouquetOption,
  type OrchidProduct,
} from "../data/orchids";
import { parseNonNegativeIntInput } from "../lib/inquiry";
import { useInquiry } from "./InquiryProvider";

type BouquetQtyRow = {
  key: string;
  sizeId: string;
  quantity: string;
};

type BouquetInquiryFormProps = {
  product: OrchidProduct;
  options: BouquetOption[];
};

function initialRowsForOptions(
  product: OrchidProduct,
  options: BouquetOption[],
): Record<string, BouquetQtyRow[]> {
  const rows: Record<string, BouquetQtyRow[]> = {};
  for (const option of options) {
    const sizes = availableBouquetSizes(getBouquetTrayRow(product, option.code));
    rows[option.code] = [
      {
        key: `${option.code}-0`,
        sizeId: sizes[0]?.id ?? "",
        quantity: "0",
      },
    ];
  }
  return rows;
}

export function BouquetInquiryForm({ product, options }: BouquetInquiryFormProps) {
  const { addBouquetQuantities } = useInquiry();
  const formId = useId();
  const rowSeq = useRef(options.length);
  const [rowsByCode, setRowsByCode] = useState(() =>
    initialRowsForOptions(product, options),
  );
  const [quantityError, setQuantityError] = useState("");
  const [addedNote, setAddedNote] = useState("");

  function sizesForCode(code: string) {
    return availableBouquetSizes(getBouquetTrayRow(product, code));
  }

  function nextRowKey(code: string) {
    rowSeq.current += 1;
    return `${code}-${rowSeq.current}`;
  }

  function updateRow(
    code: string,
    rowKey: string,
    patch: Partial<Pick<BouquetQtyRow, "sizeId" | "quantity">>,
  ) {
    setRowsByCode((prev) => ({
      ...prev,
      [code]: (prev[code] ?? []).map((row) =>
        row.key === rowKey ? { ...row, ...patch } : row,
      ),
    }));
    setQuantityError("");
    setAddedNote("");
  }

  function addSizeRow(code: string) {
    const sizes = sizesForCode(code);
    const used = new Set((rowsByCode[code] ?? []).map((row) => row.sizeId));
    const nextSize = sizes.find((size) => !used.has(size.id)) ?? sizes[0];
    if (!nextSize) return;
    setRowsByCode((prev) => ({
      ...prev,
      [code]: [
        ...(prev[code] ?? []),
        { key: nextRowKey(code), sizeId: nextSize.id, quantity: "0" },
      ],
    }));
    setQuantityError("");
    setAddedNote("");
  }

  function removeSizeRow(code: string, rowKey: string) {
    setRowsByCode((prev) => {
      const current = prev[code] ?? [];
      if (current.length <= 1) return prev;
      return {
        ...prev,
        [code]: current.filter((row) => row.key !== rowKey),
      };
    });
    setQuantityError("");
    setAddedNote("");
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddedNote("");

    const lines: { code: string; sizeId: string; quantity: number }[] = [];
    for (const option of options) {
      const sizes = sizesForCode(option.code);
      const allowed = new Set(sizes.map((size) => size.id));
      for (const row of rowsByCode[option.code] ?? []) {
        const quantity = parseNonNegativeIntInput(row.quantity);
        if (quantity === null) {
          setQuantityError("Enter whole numbers only (0 or greater) for each quantity.");
          return;
        }
        if (!row.sizeId || !allowed.has(row.sizeId)) {
          setQuantityError("Choose a valid size for each row before adding.");
          return;
        }
        if (quantity > 0) {
          lines.push({ code: option.code, sizeId: row.sizeId, quantity });
        }
      }
    }

    if (lines.length === 0) {
      setQuantityError("Enter a quantity greater than zero for at least one size.");
      return;
    }

    setQuantityError("");
    const ok = addBouquetQuantities(product.slug, lines);
    if (!ok) {
      setQuantityError("Unable to add this selection. Please check sizes and quantities.");
      return;
    }

    setRowsByCode(initialRowsForOptions(product, options));
    setAddedNote("Added to inquiry list.");
  }

  function sizeSelectOptions(code: string, row: BouquetQtyRow) {
    const sizes = sizesForCode(code);
    const usedElsewhere = new Set(
      (rowsByCode[code] ?? [])
        .filter((item) => item.key !== row.key && item.sizeId)
        .map((item) => item.sizeId),
    );
    return sizes.filter(
      (size) => size.id === row.sizeId || !usedElsewhere.has(size.id),
    );
  }

  function renderSizeControls(code: string, row: BouquetQtyRow, compactLabels: boolean) {
    const selectId = `${formId}-${row.key}-size`;
    const qtyId = `${formId}-${row.key}-qty`;
    const canRemove = (rowsByCode[code] ?? []).length > 1;

    return (
      <div className="product-detail-bouquet-size-row">
        <div className="product-detail-bouquet-field">
          <label htmlFor={selectId}>{compactLabels ? "Size" : "Size"}</label>
          <select
            id={selectId}
            className="product-detail-bouquet-select"
            value={row.sizeId}
            onChange={(event) => updateRow(code, row.key, { sizeId: event.target.value })}
          >
            {sizeSelectOptions(code, row).map((size) => (
              <option key={size.id} value={size.id}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
        <div className="product-detail-bouquet-field">
          <label htmlFor={qtyId}>
            Quantity <span className="product-detail-unit">(bouquets)</span>
          </label>
          <input
            id={qtyId}
            className="product-detail-bouquet-qty-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={row.quantity}
            onChange={(event) =>
              updateRow(code, row.key, { quantity: event.target.value })
            }
          />
        </div>
        {canRemove ? (
          <button
            type="button"
            className="product-detail-bouquet-remove-size"
            onClick={() => removeSizeRow(code, row.key)}
          >
            Remove size
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form className="product-detail-bouquet-form" onSubmit={handleAdd} noValidate>
      {/* Desktop table */}
      <div className="product-detail-bouquet-desktop">
        <table className="product-detail-info-table product-detail-bouquet-order-table">
          <thead>
            <tr>
              <th scope="col">Variety</th>
              <th scope="col">Stems per bouquet</th>
              <th scope="col">Foliage</th>
              <th scope="col">Code</th>
              <th scope="col">Size</th>
              <th scope="col">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {options.map((option) => {
              const rows = rowsByCode[option.code] ?? [];
              const sizes = sizesForCode(option.code);
              return rows.map((row, index) => (
                <tr key={row.key}>
                  {index === 0 ? (
                    <>
                      <td rowSpan={rows.length}>{option.variety}</td>
                      <td rowSpan={rows.length}>{option.stemsPerBouquet}</td>
                      <td rowSpan={rows.length}>{option.foliage}</td>
                      <td className="product-detail-info-table-code" rowSpan={rows.length}>
                        {option.code}
                      </td>
                    </>
                  ) : null}
                  <td>
                    <label className="visually-hidden" htmlFor={`${formId}-${row.key}-size-d`}>
                      Size for {option.code}
                    </label>
                    <select
                      id={`${formId}-${row.key}-size-d`}
                      className="product-detail-bouquet-select"
                      value={row.sizeId}
                      onChange={(event) =>
                        updateRow(option.code, row.key, { sizeId: event.target.value })
                      }
                      disabled={sizes.length === 0}
                    >
                      {sizeSelectOptions(option.code, row).map((size) => (
                        <option key={size.id} value={size.id}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                    {index === rows.length - 1 && sizes.length > rows.length ? (
                      <button
                        type="button"
                        className="product-detail-bouquet-add-size"
                        onClick={() => addSizeRow(option.code)}
                      >
                        Add another size
                      </button>
                    ) : null}
                    {rows.length > 1 ? (
                      <button
                        type="button"
                        className="product-detail-bouquet-remove-size product-detail-bouquet-remove-size--desktop"
                        onClick={() => removeSizeRow(option.code, row.key)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </td>
                  <td>
                    <label className="visually-hidden" htmlFor={`${formId}-${row.key}-qty-d`}>
                      Quantity in bouquets for {option.code} size {row.sizeId}
                    </label>
                    <input
                      id={`${formId}-${row.key}-qty-d`}
                      className="product-detail-bouquet-qty-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={row.quantity}
                      onChange={(event) =>
                        updateRow(option.code, row.key, { quantity: event.target.value })
                      }
                    />
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="product-detail-bouquet-mobile">
        {options.map((option) => {
          const rows = rowsByCode[option.code] ?? [];
          const sizes = sizesForCode(option.code);
          return (
            <li key={option.code} className="product-detail-bouquet-card">
              <p className="product-detail-bouquet-card-variety">{option.variety}</p>
              <p className="product-detail-bouquet-card-code">Code {option.code}</p>
              <p className="product-detail-bouquet-card-meta">
                {option.stemsPerBouquet} · {option.foliage}
              </p>
              <div className="product-detail-bouquet-card-rows">
                {rows.map((row) => (
                  <div key={row.key}>{renderSizeControls(option.code, row, true)}</div>
                ))}
              </div>
              {sizes.length > rows.length ? (
                <button
                  type="button"
                  className="product-detail-bouquet-add-size"
                  onClick={() => addSizeRow(option.code)}
                >
                  Add another size
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {quantityError ? (
        <p className="product-detail-error" role="alert">
          {quantityError}
        </p>
      ) : null}

      <div className="product-detail-actions product-detail-bouquet-actions">
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
  );
}
