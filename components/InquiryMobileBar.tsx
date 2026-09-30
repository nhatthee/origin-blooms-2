"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  totalsByUnit,
  uniqueProductCount,
} from "../lib/inquiry";
import { useInquiry } from "./InquiryProvider";

const MOBILE_MQ = "(max-width: 760px)";

function isProductsSurface(pathname: string): boolean {
  return pathname === "/products" || pathname.startsWith("/products/");
}

function formatUnitTotal(total: number, unit: string): string {
  return `${total.toLocaleString("en-US")} ${unit}`;
}

export function InquiryMobileBar() {
  const pathname = usePathname() || "/";
  const { items, ready } = useInquiry();
  const barRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [barHeight, setBarHeight] = useState(0);

  const productCount = uniqueProductCount(items);
  const unitTotals = totalsByUnit(items);
  const onProductsSurface = isProductsSurface(pathname);
  const hasItems = ready && productCount > 0;
  const visible = isMobile && onProductsSurface && hasItems;

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const isQuantityField = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.matches(".product-size-qty-input")) return true;
      if (target.closest(".product-detail-qty")) return true;
      return false;
    };

    const syncQtyFocusClass = () => {
      const focused = isQuantityField(document.activeElement);
      document.documentElement.classList.toggle("inquiry-qty-focused", focused);
    };

    syncQtyFocusClass();
    document.addEventListener("focusin", syncQtyFocusClass, true);
    document.addEventListener("focusout", syncQtyFocusClass, true);
    return () => {
      document.removeEventListener("focusin", syncQtyFocusClass, true);
      document.removeEventListener("focusout", syncQtyFocusClass, true);
      document.documentElement.classList.remove("inquiry-qty-focused");
    };
  }, []);

  useLayoutEffect(() => {
    if (!visible) {
      setBarHeight(0);
      return;
    }

    const node = barRef.current;
    if (!node) return;

    const publish = () => {
      setBarHeight(Math.ceil(node.getBoundingClientRect().height));
    };

    publish();
    const observer = new ResizeObserver(() => publish());
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, productCount, unitTotals.length]);

  if (!visible) return null;

  const productLabel = productCount === 1 ? "product" : "products";
  const totalsLabel = unitTotals
    .map((row) => formatUnitTotal(row.total, row.unit))
    .join(" · ");

  return (
    <>
      <div
        className="inquiry-mobile-bar-spacer"
        style={{ height: barHeight || undefined }}
        aria-hidden="true"
      />
      <div
        ref={barRef}
        className="inquiry-mobile-bar"
        role="region"
        aria-label="Inquiry summary"
      >
        <div className="inquiry-mobile-bar-copy">
          <p className="inquiry-mobile-bar-title">
            Inquiry · {productCount} {productLabel}
          </p>
          {totalsLabel ? (
            <p className="inquiry-mobile-bar-totals">{totalsLabel}</p>
          ) : null}
        </div>
        <Link className="inquiry-mobile-bar-cta" href="/inquiry">
          VIEW LIST <span aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  );
}
