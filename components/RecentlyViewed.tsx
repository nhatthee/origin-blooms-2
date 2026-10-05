"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  getOrchidBySlug,
  productDetailHref,
} from "../data/orchids";
import {
  RECENTLY_VIEWED_MAX_DISPLAY,
  recordRecentlyViewedSlug,
} from "../lib/recentlyViewed";

type RecentlyViewedCard = {
  slug: string;
  name: string;
  image: string;
  href: string;
};

type RecentlyViewedProps = {
  currentSlug: string;
};

const DRAG_CLICK_THRESHOLD_PX = 8;

function ChevronPrevIcon() {
  return (
    <svg
      className="recently-viewed-chevron-icon"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M15 5L8 12L15 19"
        stroke="currentColor"
        strokeWidth={2.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronNextIcon() {
  return (
    <svg
      className="recently-viewed-chevron-icon"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 5L16 12L9 19"
        stroke="currentColor"
        strokeWidth={2.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function resolveCards(slugs: string[], currentSlug: string): RecentlyViewedCard[] {
  const cards: RecentlyViewedCard[] = [];
  for (const slug of slugs) {
    if (slug === currentSlug) continue;
    const product = getOrchidBySlug(slug);
    if (!product) continue;
    cards.push({
      slug: product.slug,
      name: product.name,
      image: product.image,
      href: productDetailHref(product.slug, {
        format: product.format,
        family: product.family,
      }),
    });
    if (cards.length >= RECENTLY_VIEWED_MAX_DISPLAY) break;
  }
  return cards;
}

export function RecentlyViewed({ currentSlug }: RecentlyViewedProps) {
  const [items, setItems] = useState<RecentlyViewedCard[] | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const dragMovedRef = useRef(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    const slugs = recordRecentlyViewedSlug(currentSlug);
    setItems(resolveCards(slugs, currentSlug));
  }, [currentSlug]);

  const syncOverflow = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const maxScroll = Math.max(0, stage.scrollWidth - stage.clientWidth);
    const left = stage.scrollLeft;
    setCanPrev(left > 1);
    setCanNext(left < maxScroll - 1);
  }, []);

  useEffect(() => {
    if (!items || items.length === 0) return;
    const stage = stageRef.current;
    if (!stage) return;

    syncOverflow();
    const onScroll = () => syncOverflow();
    stage.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => syncOverflow());
    ro.observe(stage);
    for (const child of Array.from(stage.children)) {
      if (child instanceof HTMLElement) ro.observe(child);
    }

    return () => {
      stage.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [items, syncOverflow]);

  const stepByCard = useCallback((direction: -1 | 1) => {
    const stage = stageRef.current;
    const card = stage?.querySelector<HTMLElement>(".recently-viewed-card");
    if (!stage || !card) return;
    const styles = window.getComputedStyle(stage);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const step = card.getBoundingClientRect().width + gap;
    stage.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    draggingRef.current = true;
    dragMovedRef.current = false;
    pointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartScrollRef.current = stageRef.current?.scrollLeft ?? 0;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) return;
    const stage = stageRef.current;
    if (!stage) return;
    const dx = event.clientX - dragStartXRef.current;
    if (Math.abs(dx) >= DRAG_CLICK_THRESHOLD_PX) {
      if (!dragMovedRef.current) {
        dragMovedRef.current = true;
        stage.setPointerCapture(event.pointerId);
      }
      stage.scrollLeft = dragStartScrollRef.current - dx;
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) return;
    const wasDragging = dragMovedRef.current;
    draggingRef.current = false;
    pointerIdRef.current = null;
    const stage = stageRef.current;
    if (stage?.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
    if (!wasDragging) dragMovedRef.current = false;
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragMovedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragMovedRef.current = false;
  };

  // Avoid SSR / hydration mismatch: render nothing until client history is known.
  if (items === null || items.length === 0) return null;

  const showNav = canPrev || canNext;

  return (
    <section
      className="recently-viewed"
      aria-labelledby="recently-viewed-title"
    >
      <header className="recently-viewed-heading">
        <h2 className="eyebrow" id="recently-viewed-title">
          RECENTLY VIEWED
        </h2>
      </header>

      <div
        className="recently-viewed-stage"
        ref={stageRef}
        aria-label="Recently viewed products"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <ul className="recently-viewed-track">
          {items.map((item) => (
            <li key={item.slug}>
              <article className="recently-viewed-card">
                <Link
                  className="recently-viewed-link"
                  href={item.href}
                  aria-label={`View ${item.name}`}
                  draggable={false}
                  prefetch={false}
                >
                  <span className="recently-viewed-media">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 760px) 40vw, 180px"
                      className="recently-viewed-image"
                      draggable={false}
                    />
                  </span>
                  <h3 className="recently-viewed-name">{item.name}</h3>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>

      {showNav ? (
        <div className="recently-viewed-nav">
          <button
            type="button"
            className="recently-viewed-chevron"
            aria-label="Previous recently viewed product"
            disabled={!canPrev}
            onClick={() => stepByCard(-1)}
          >
            <ChevronPrevIcon />
          </button>
          <button
            type="button"
            className="recently-viewed-chevron"
            aria-label="Next recently viewed product"
            disabled={!canNext}
            onClick={() => stepByCard(1)}
          >
            <ChevronNextIcon />
          </button>
        </div>
      ) : null}
    </section>
  );
}
