"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

export type FeaturedOrchidCard = {
  slug: string;
  name: string;
  image: string;
  href: string;
};

type FeaturedOrchidsProps = {
  items: FeaturedOrchidCard[];
};

/** Continuous marquee speed — ~20px per second. */
const MARQUEE_PX_PER_SEC = 20;
const RESUME_DELAY_MS = 900;
const DRAG_CLICK_THRESHOLD_PX = 8;

function ChevronPrevIcon() {
  return (
    <svg
      className="featured-orchids-chevron-icon"
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
      className="featured-orchids-chevron-icon"
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

function OrchidCard({
  item,
  clone = false,
}: {
  item: FeaturedOrchidCard;
  clone?: boolean;
}) {
  return (
    <article className="featured-orchids-card">
      <Link
        className="featured-orchids-link"
        href={item.href}
        aria-label={clone ? undefined : `View ${item.name}`}
        tabIndex={clone ? -1 : undefined}
        draggable={false}
        prefetch={false}
      >
        <span className="featured-orchids-media">
          <Image
            src={item.image}
            alt={clone ? "" : item.name}
            fill
            sizes="(max-width: 760px) 40vw, 220px"
            className="featured-orchids-image"
            draggable={false}
          />
        </span>
        <h3 className="featured-orchids-name">{item.name}</h3>
      </Link>
    </article>
  );
}

export function FeaturedOrchids({ items }: FeaturedOrchidsProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const reduceMotionRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragMovedRef = useRef(false);
  const draggingRef = useRef(false);

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

  const measureLoop = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    // Track width includes its end gap (padding-inline-end) so the clone joins seamlessly.
    loopWidthRef.current = track.offsetWidth;
    applyTransform();
  }, [applyTransform]);

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
      if (reduceMotionRef.current) {
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
      const card = track?.querySelector<HTMLElement>(".featured-orchids-card");
      if (!track || !card) return;
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
      const step = card.getBoundingClientRect().width + gap;
      pauseMarquee();
      offsetRef.current += direction * step;
      applyTransform();
      resumeMarquee(RESUME_DELAY_MS);
    },
    [applyTransform, pauseMarquee, resumeMarquee],
  );

  useEffect(() => {
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduce = () => {
      reduceMotionRef.current = reduceMq.matches;
      if (reduceMq.matches) {
        pauseMarquee();
      } else if (!draggingRef.current) {
        resumeMarquee(0);
      }
    };
    syncReduce();
    reduceMq.addEventListener("change", syncReduce);

    measureLoop();
    const ro = new ResizeObserver(() => measureLoop());
    if (trackRef.current) ro.observe(trackRef.current);
    if (stageRef.current) ro.observe(stageRef.current);

    const tick = (ts: number) => {
      if (!pausedRef.current && !reduceMotionRef.current && loopWidthRef.current > 0) {
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
      clearResumeTimer();
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [applyTransform, clearResumeTimer, measureLoop, pauseMarquee, resumeMarquee, items.length]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // Native overflow scroll handles reduced-motion browsing.
    if (reduceMotionRef.current) return;
    pauseMarquee();
    draggingRef.current = true;
    dragMovedRef.current = false;
    pointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    // Delay capture until movement crosses the drag threshold so taps still hit Links.
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) return;
    const dx = event.clientX - dragStartXRef.current;
    if (Math.abs(dx) >= DRAG_CLICK_THRESHOLD_PX) {
      if (!dragMovedRef.current) {
        dragMovedRef.current = true;
        stageRef.current?.setPointerCapture(event.pointerId);
      }
      // Drag right reveals earlier cards (decrease offset); drag left advances.
      offsetRef.current = dragStartOffsetRef.current - dx;
      applyTransform();
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
    resumeMarquee(RESUME_DELAY_MS);
    // Keep dragMoved through the following click so onClickCapture can cancel it.
    if (!wasDragging) dragMovedRef.current = false;
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragMovedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragMovedRef.current = false;
  };

  if (items.length === 0) return null;

  return (
    <section
      className="featured-orchids section-shell"
      id="featured-orchids"
      aria-labelledby="featured-orchids-title"
    >
      <header className="featured-orchids-heading">
        <h2 className="eyebrow" id="featured-orchids-title">
          FEATURED ORCHIDS
        </h2>
      </header>

      <div
        className="featured-orchids-stage"
        ref={stageRef}
        aria-label="Featured orchid varieties"
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
        <div className="featured-orchids-marquee" ref={marqueeRef}>
          <ul className="featured-orchids-track" ref={trackRef}>
            {items.map((item) => (
              <li key={item.slug}>
                <OrchidCard item={item} />
              </li>
            ))}
          </ul>
          <ul
            className="featured-orchids-track featured-orchids-track--clone"
            aria-hidden="true"
          >
            {items.map((item) => (
              <li key={`clone-${item.slug}`}>
                <OrchidCard item={item} clone />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="featured-orchids-nav">
        <button
          type="button"
          className="featured-orchids-chevron"
          aria-label="Previous featured orchid"
          onClick={() => stepByCard(-1)}
        >
          <ChevronPrevIcon />
        </button>
        <button
          type="button"
          className="featured-orchids-chevron"
          aria-label="Next featured orchid"
          onClick={() => stepByCard(1)}
        >
          <ChevronNextIcon />
        </button>
      </div>
    </section>
  );
}
