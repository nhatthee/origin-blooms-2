"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type PackingHouseSlide = {
  src: string;
  alt: string;
};

type PackingHouseSlideshowProps = {
  images: PackingHouseSlide[];
};

const AUTOPLAY_MS = 7000;
const TRANSITION_MS = 900;
const SWIPE_THRESHOLD_PX = 40;

function ChevronPrevIcon() {
  return (
    <svg
      className="packing-slideshow-chevron-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M15 5L8 12L15 19"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronNextIcon() {
  return (
    <svg
      className="packing-slideshow-chevron-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 5L16 12L9 19"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PendingMove = {
  from: number;
  to: number;
  direction: -1 | 1;
};

export function PackingHouseSlideshow({ images }: PackingHouseSlideshowProps) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [sliding, setSliding] = useState(false);
  const [pausedSoft, setPausedSoft] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const swipingRef = useRef(false);
  const indexRef = useRef(0);
  const animatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const clearAnimTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishMove = useCallback(
    (to: number) => {
      setIndex(to);
      indexRef.current = to;
      setPending(null);
      setSliding(false);
      animatingRef.current = false;
      clearAnimTimer();
    },
    [clearAnimTimer],
  );

  const animateTo = useCallback(
    (to: number, direction: -1 | 1) => {
      if (count <= 1 || animatingRef.current) return;
      const from = indexRef.current;
      if (to === from) return;

      if (reduceMotion) {
        setIndex(to);
        indexRef.current = to;
        return;
      }

      animatingRef.current = true;
      setPending({ from, to, direction });
      setSliding(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSliding(true);
        });
      });

      clearAnimTimer();
      timerRef.current = setTimeout(() => {
        finishMove(to);
      }, TRANSITION_MS);
    },
    [clearAnimTimer, count, finishMove, reduceMotion],
  );

  const goBy = useCallback(
    (direction: -1 | 1) => {
      if (count <= 1) return;
      const from = indexRef.current;
      const to = (((from + direction) % count) + count) % count;
      animateTo(to, direction);
    },
    [animateTo, count],
  );

  const goTo = useCallback(
    (target: number) => {
      if (count <= 1 || animatingRef.current) return;
      const next = ((target % count) + count) % count;
      const from = indexRef.current;
      if (next === from) return;

      let delta = next - from;
      if (Math.abs(delta) > count / 2) {
        delta = delta > 0 ? delta - count : delta + count;
      }
      animateTo(next, delta < 0 ? -1 : 1);
    },
    [animateTo, count],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.visibilityState !== "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => () => clearAnimTimer(), [clearAnimTimer]);

  const autoplayActive = !pausedSoft && !reduceMotion && !tabHidden && !pending && count > 1;

  useEffect(() => {
    if (!autoplayActive) return;
    const id = window.setInterval(() => {
      goBy(1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplayActive, goBy, index]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || count <= 1 || animatingRef.current) return;
    if ((event.target as HTMLElement | null)?.closest?.("button")) return;
    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    swipingRef.current = false;
    setPausedSoft(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    if (Math.abs(event.clientX - startXRef.current) > 8) {
      swipingRef.current = true;
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const delta = event.clientX - startXRef.current;
    pointerIdRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    if (swipingRef.current && Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
      goBy(delta < 0 ? 1 : -1);
    }
    swipingRef.current = false;
    setPausedSoft(false);
  };

  if (count === 0) return null;

  const selectedIndex = pending?.to ?? index;
  const renderIndexes = pending
    ? Array.from(new Set([pending.from, pending.to]))
    : [index];

  const slideClass = (i: number) => {
    if (!pending) {
      return i === index ? " is-active" : "";
    }

    const { from, to, direction } = pending;
    if (i === from) {
      if (!sliding) return " is-active";
      return direction === 1 ? " is-exit-left" : " is-exit-right";
    }
    if (i === to) {
      if (!sliding) {
        return direction === 1 ? " is-enter-right" : " is-enter-left";
      }
      return " is-enter-active";
    }
    return "";
  };

  return (
    <div
      className="packing-slideshow"
      onMouseEnter={() => setPausedSoft(true)}
      onMouseLeave={() => setPausedSoft(false)}
      onFocusCapture={() => setPausedSoft(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPausedSoft(false);
        }
      }}
    >
      <div
        className="packing-slideshow-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        {images.map((image, i) => {
          if (!renderIndexes.includes(i)) return null;
          return (
            <div
              key={image.src}
              className={`packing-slideshow-slide${slideClass(i)}`}
              aria-hidden={i !== selectedIndex}
            >
              <Image
                src={image.src}
                alt={i === selectedIndex ? image.alt : ""}
                fill
                sizes="(max-width: 760px) 100vw, (max-width: 1100px) 45vw, min(520px, 42vw)"
                style={{ objectFit: "cover", objectPosition: "center" }}
                priority={i === 0}
                draggable={false}
              />
            </div>
          );
        })}

        {count > 1 ? (
          <div className="packing-slideshow-nav" role="group" aria-label="Slideshow navigation">
            <button
              type="button"
              className="packing-slideshow-chevron packing-slideshow-chevron--prev"
              aria-label="Previous image"
              disabled={Boolean(pending)}
              onClick={() => goBy(-1)}
            >
              <ChevronPrevIcon />
            </button>
            <button
              type="button"
              className="packing-slideshow-chevron packing-slideshow-chevron--next"
              aria-label="Next image"
              disabled={Boolean(pending)}
              onClick={() => goBy(1)}
            >
              <ChevronNextIcon />
            </button>
          </div>
        ) : null}

        {count > 1 ? (
          <div className="packing-slideshow-dots" role="tablist" aria-label="Slideshow images">
            {images.map((image, i) => (
              <button
                key={image.src}
                type="button"
                role="tab"
                aria-label={`Go to image ${i + 1}`}
                aria-selected={selectedIndex === i}
                className={`packing-slideshow-dot${selectedIndex === i ? " is-active" : ""}`}
                disabled={Boolean(pending)}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
