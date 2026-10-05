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

/** Continuous marquee speed — slow editorial pace (~18px/sec). */
const MARQUEE_PX_PER_SEC = 18;
const RESUME_DELAY_MS = 900;
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

function ProductCard({
  item,
  clone = false,
}: {
  item: RecentlyViewedCard;
  clone?: boolean;
}) {
  return (
    <article className="recently-viewed-card">
      <Link
        className="recently-viewed-link"
        href={item.href}
        aria-label={clone ? undefined : `View ${item.name}`}
        tabIndex={clone ? -1 : undefined}
        draggable={false}
        prefetch={false}
      >
        <span className="recently-viewed-media">
          <Image
            src={item.image}
            alt={clone ? "" : item.name}
            fill
            sizes="(max-width: 760px) 40vw, 180px"
            className="recently-viewed-image"
            draggable={false}
          />
        </span>
        <h3 className="recently-viewed-name">{item.name}</h3>
      </Link>
    </article>
  );
}

export function RecentlyViewed({ currentSlug }: RecentlyViewedProps) {
  const [items, setItems] = useState<RecentlyViewedCard[] | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const pausedRef = useRef(true);
  const reduceMotionRef = useRef(false);
  const overflowingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const dragMovedRef = useRef(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    const slugs = recordRecentlyViewedSlug(currentSlug);
    setItems(resolveCards(slugs, currentSlug));
  }, [currentSlug]);

  const applyTransform = useCallback(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;
    const loopWidth = loopWidthRef.current;
    let offset = offsetRef.current;
    if (loopWidth > 0) {
      offset = ((offset % loopWidth) + loopWidth) % loopWidth;
      offsetRef.current = offset;
    }
    marquee.style.transform = `translate3d(${-offset}px,0,0)`;
  }, []);

  const syncScrollNav = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !overflowingRef.current) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    if (!reduceMotionRef.current) {
      setCanPrev(true);
      setCanNext(true);
      return;
    }
    const maxScroll = Math.max(0, stage.scrollWidth - stage.clientWidth);
    const left = stage.scrollLeft;
    setCanPrev(left > 1);
    setCanNext(left < maxScroll - 1);
  }, []);

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track) return;

    const trackWidth = track.offsetWidth;
    const stageWidth = stage.clientWidth;
    const nextOverflowing = trackWidth > stageWidth + 1;
    overflowingRef.current = nextOverflowing;
    setOverflowing((prev) => (prev === nextOverflowing ? prev : nextOverflowing));

    if (nextOverflowing && !reduceMotionRef.current) {
      // Track width includes end gap (padding-inline-end) so the clone joins seamlessly.
      loopWidthRef.current = trackWidth;
      applyTransform();
    } else {
      loopWidthRef.current = 0;
      offsetRef.current = 0;
      if (marqueeRef.current) {
        marqueeRef.current.style.transform = "translate3d(0,0,0)";
      }
    }
    syncScrollNav();
  }, [applyTransform, syncScrollNav]);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current != null) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const pauseMarquee = useCallback(() => {
    pausedRef.current = true;
    lastTsRef.current = null;
    clearResumeTimer();
  }, [clearResumeTimer]);

  const resumeMarquee = useCallback(
    (delayMs = 0) => {
      clearResumeTimer();
      if (reduceMotionRef.current || !overflowingRef.current) {
        pausedRef.current = true;
        return;
      }
      const start = () => {
        pausedRef.current = false;
        lastTsRef.current = null;
      };
      if (delayMs > 0) {
        resumeTimerRef.current = setTimeout(start, delayMs);
      } else {
        start();
      }
    },
    [clearResumeTimer],
  );

  const stepByCard = useCallback(
    (direction: -1 | 1) => {
      const track = trackRef.current;
      const card = track?.querySelector<HTMLElement>(".recently-viewed-card");
      const stage = stageRef.current;
      if (!track || !card || !stage) return;
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
      const step = card.getBoundingClientRect().width + gap;

      if (overflowingRef.current && !reduceMotionRef.current) {
        pauseMarquee();
        offsetRef.current += direction * step;
        applyTransform();
        resumeMarquee(RESUME_DELAY_MS);
        return;
      }

      stage.scrollBy({ left: direction * step, behavior: "smooth" });
    },
    [applyTransform, pauseMarquee, resumeMarquee],
  );

  useEffect(() => {
    if (!items || items.length === 0) return;

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduce = () => {
      reduceMotionRef.current = reduceMq.matches;
      measure();
      if (reduceMq.matches || !overflowingRef.current) {
        pauseMarquee();
      } else if (!draggingRef.current) {
        resumeMarquee(0);
      }
    };
    syncReduce();
    reduceMq.addEventListener("change", syncReduce);

    const stage = stageRef.current;
    const track = trackRef.current;
    const ro = new ResizeObserver(() => {
      measure();
      if (!reduceMotionRef.current && overflowingRef.current && !draggingRef.current) {
        resumeMarquee(0);
      } else if (!overflowingRef.current || reduceMotionRef.current) {
        pauseMarquee();
      }
    });
    if (stage) ro.observe(stage);
    if (track) ro.observe(track);

    const onScroll = () => syncScrollNav();
    stage?.addEventListener("scroll", onScroll, { passive: true });

    const tick = (ts: number) => {
      if (
        !pausedRef.current &&
        !reduceMotionRef.current &&
        overflowingRef.current &&
        loopWidthRef.current > 0
      ) {
        if (lastTsRef.current != null) {
          const dt = Math.min(64, ts - lastTsRef.current) / 1000;
          offsetRef.current += MARQUEE_PX_PER_SEC * dt;
          applyTransform();
        }
        lastTsRef.current = ts;
      } else {
        lastTsRef.current = null;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      reduceMq.removeEventListener("change", syncReduce);
      ro.disconnect();
      stage?.removeEventListener("scroll", onScroll);
      clearResumeTimer();
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [
    applyTransform,
    clearResumeTimer,
    items,
    measure,
    pauseMarquee,
    resumeMarquee,
    syncScrollNav,
  ]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (!overflowingRef.current) return;

    draggingRef.current = true;
    dragMovedRef.current = false;
    pointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;

    if (reduceMotionRef.current) {
      dragStartScrollRef.current = stageRef.current?.scrollLeft ?? 0;
      return;
    }

    pauseMarquee();
    dragStartOffsetRef.current = offsetRef.current;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) return;
    const stage = stageRef.current;
    if (!stage) return;
    const dx = event.clientX - dragStartXRef.current;
    if (Math.abs(dx) < DRAG_CLICK_THRESHOLD_PX) return;

    if (!dragMovedRef.current) {
      dragMovedRef.current = true;
      stage.setPointerCapture(event.pointerId);
    }

    if (reduceMotionRef.current) {
      stage.scrollLeft = dragStartScrollRef.current - dx;
      return;
    }

    offsetRef.current = dragStartOffsetRef.current - dx;
    applyTransform();
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
    if (!reduceMotionRef.current && overflowingRef.current) {
      resumeMarquee(RESUME_DELAY_MS);
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

  const showNav = overflowing;

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
        className={`recently-viewed-stage${overflowing ? " recently-viewed-stage--overflow" : ""}`}
        ref={stageRef}
        aria-label="Recently viewed products"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onMouseEnter={() => {
          if (window.matchMedia("(hover: hover)").matches) pauseMarquee();
        }}
        onMouseLeave={() => {
          if (window.matchMedia("(hover: hover)").matches && !draggingRef.current) {
            resumeMarquee(0);
          }
        }}
        onFocusCapture={pauseMarquee}
        onBlurCapture={(event) => {
          const stage = stageRef.current;
          if (!stage) return;
          const next = event.relatedTarget;
          if (next instanceof Node && stage.contains(next)) return;
          if (!draggingRef.current) resumeMarquee(RESUME_DELAY_MS);
        }}
      >
        <div className="recently-viewed-marquee" ref={marqueeRef}>
          <ul className="recently-viewed-track" ref={trackRef}>
            {items.map((item) => (
              <li key={item.slug}>
                <ProductCard item={item} />
              </li>
            ))}
          </ul>
          <ul
            className="recently-viewed-track recently-viewed-track--clone"
            aria-hidden="true"
          >
            {items.map((item) => (
              <li key={`clone-${item.slug}`}>
                <ProductCard item={item} clone />
              </li>
            ))}
          </ul>
        </div>
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
