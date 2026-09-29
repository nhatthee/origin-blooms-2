"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  type TransitionEvent,
} from "react";

type ProductCarouselProps = {
  children: ReactNode;
};

type Direction = "next" | "prev";

const TRANSITION = "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
const MOBILE_MQ = "(max-width: 760px)";

function cloneGroup(children: ReactNode, keyPrefix: string) {
  return Children.map(children, (child, index) => {
    if (!isValidElement(child)) return child;
    return cloneElement(child as ReactElement, {
      key: `${keyPrefix}-${child.key ?? index}`,
    });
  });
}

export function ProductCarousel({ children }: ProductCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef(0);
  const groupWidthRef = useRef(0);
  const offsetRef = useRef(0);
  const animatingRef = useRef(false);
  const queueRef = useRef<Direction[]>([]);
  const dragMovedRef = useRef(false);
  const draggingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const runStepRef = useRef<(direction: Direction) => void>(() => {});
  const completeMoveRef = useRef<() => void>(() => {});
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardCount = Children.count(children);
  const [activeIndex, setActiveIndex] = useState(0);

  /** Measure real slide width / step from DOM. On mobile, lock card width to viewport. */
  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const group = groupRef.current;
    const track = trackRef.current;
    if (!viewport || !group || !track) return false;

    const isMobile = window.matchMedia(MOBILE_MQ).matches;
    if (isMobile) {
      const slideWidth = Math.max(1, Math.round(viewport.clientWidth));
      viewport.style.setProperty("--product-slide-width", `${slideWidth}px`);
      // Commit width before reading offsets
      void group.offsetWidth;
    } else {
      viewport.style.removeProperty("--product-slide-width");
    }

    const cards = Array.from(group.querySelectorAll<HTMLElement>(".product-card"));
    if (cards.length === 0) return false;

    if (cards.length >= 2) {
      stepRef.current = cards[1].offsetLeft - cards[0].offsetLeft;
    } else {
      const styles = window.getComputedStyle(group);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
      stepRef.current = cards[0].offsetWidth + gap;
    }

    const groups = track.querySelectorAll<HTMLElement>(".product-carousel-group");
    if (groups.length >= 2) {
      groupWidthRef.current = groups[1].offsetLeft - groups[0].offsetLeft;
    } else {
      const trackStyles = window.getComputedStyle(track);
      const trackGap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap || "0") || 0;
      groupWidthRef.current = group.offsetWidth + trackGap;
    }

    return stepRef.current > 0 && groupWidthRef.current > 0;
  }, []);

  const absoluteIndexFromOffset = useCallback((value: number) => {
    const step = stepRef.current;
    if (step <= 0) return 0;
    return Math.round(-value / step);
  }, []);

  const offsetForAbsoluteIndex = useCallback((index: number) => {
    return -(index * stepRef.current);
  }, []);

  const logicalIndexFromOffset = useCallback(
    (value: number) => {
      if (cardCount <= 0) return 0;
      const abs = absoluteIndexFromOffset(value);
      return ((abs % cardCount) + cardCount) % cardCount;
    },
    [absoluteIndexFromOffset, cardCount],
  );

  const syncIndex = useCallback(
    (value = offsetRef.current) => {
      setActiveIndex(logicalIndexFromOffset(value));
    },
    [logicalIndexFromOffset],
  );

  const setOffsetInstant = useCallback((value: number) => {
    const track = trackRef.current;
    offsetRef.current = value;
    if (track) {
      track.style.transition = "none";
      track.style.transform = `translate3d(${value}px, 0, 0)`;
      void track.offsetWidth;
    }
  }, []);

  const setOffsetAnimated = useCallback((value: number) => {
    const track = trackRef.current;
    offsetRef.current = value;
    if (track) {
      track.style.transition = TRANSITION;
      track.style.transform = `translate3d(${value}px, 0, 0)`;
    }
  }, []);

  const normalizeOffsetValue = useCallback((value: number) => {
    const step = stepRef.current;
    const groupWidth = groupWidthRef.current;
    if (step <= 0 || groupWidth <= 0) return value;

    // Snap onto the step grid first, then fold into the primary set [-(groupWidth-eps), 0]
    let absIndex = Math.round(-value / step);
    let next = -(absIndex * step);
    while (next <= -groupWidth) {
      absIndex -= cardCount;
      next = -(absIndex * step);
    }
    while (next > 0) {
      absIndex += cardCount;
      next = -(absIndex * step);
    }
    return next;
  }, [cardCount]);

  const flushQueue = useCallback(() => {
    const queued = queueRef.current.shift();
    if (!queued) return;
    requestAnimationFrame(() => {
      runStepRef.current(queued);
    });
  }, []);

  const completeMove = useCallback(() => {
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }
    if (!animatingRef.current) return;

    measure();
    const normalized = normalizeOffsetValue(offsetRef.current);
    if (normalized !== offsetRef.current) {
      setOffsetInstant(normalized);
    } else {
      // Correct any sub-pixel drift onto the card grid without a visible jump
      const step = stepRef.current;
      if (step > 0) {
        const grid = offsetForAbsoluteIndex(absoluteIndexFromOffset(offsetRef.current));
        if (Math.abs(grid - offsetRef.current) > 0.5) {
          setOffsetInstant(grid);
        }
      }
    }
    syncIndex();
    animatingRef.current = false;
    flushQueue();
  }, [
    absoluteIndexFromOffset,
    flushQueue,
    measure,
    normalizeOffsetValue,
    offsetForAbsoluteIndex,
    setOffsetInstant,
    syncIndex,
  ]);

  const armAnimTimer = useCallback(() => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => completeMoveRef.current(), 480);
  }, []);

  const runStep = useCallback(
    (direction: Direction) => {
      if (animatingRef.current || draggingRef.current) {
        if (queueRef.current.length < 4) queueRef.current.push(direction);
        return;
      }

      if (!measure()) return;
      const step = stepRef.current;
      if (step <= 0) return;

      let absIndex = absoluteIndexFromOffset(offsetRef.current);
      const gridOffset = offsetForAbsoluteIndex(absIndex);
      if (Math.abs(gridOffset - offsetRef.current) > 0.5) {
        setOffsetInstant(gridOffset);
        absIndex = absoluteIndexFromOffset(offsetRef.current);
      }

      animatingRef.current = true;

      if (direction === "next") {
        const target = absIndex + 1;
        setOffsetAnimated(offsetForAbsoluteIndex(target));
        syncIndex(offsetForAbsoluteIndex(target));
        armAnimTimer();
        return;
      }

      // prev: jump into the clone set when at the start so motion stays rightward-continuous
      if (absIndex <= 0) {
        const jumped = absIndex + cardCount;
        setOffsetInstant(offsetForAbsoluteIndex(jumped));
        absIndex = jumped;
      }
      const target = absIndex - 1;
      setOffsetAnimated(offsetForAbsoluteIndex(target));
      syncIndex(offsetForAbsoluteIndex(target));
      armAnimTimer();
    },
    [
      absoluteIndexFromOffset,
      armAnimTimer,
      cardCount,
      measure,
      offsetForAbsoluteIndex,
      setOffsetAnimated,
      setOffsetInstant,
      syncIndex,
    ],
  );

  useEffect(() => {
    runStepRef.current = runStep;
  }, [runStep]);

  useEffect(() => {
    completeMoveRef.current = completeMove;
  }, [completeMove]);

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== trackRef.current) return;
    if (event.propertyName !== "transform") return;
    if (!animatingRef.current) return;
    completeMove();
  };

  useLayoutEffect(() => {
    measure();
    setOffsetInstant(0);
    setActiveIndex(0);
    animatingRef.current = false;
    queueRef.current = [];
  }, [measure, cardCount, setOffsetInstant]);

  useEffect(() => {
    const onResize = () => {
      const logical = logicalIndexFromOffset(offsetRef.current);
      if (!measure()) return;
      setOffsetInstant(offsetForAbsoluteIndex(logical));
      syncIndex();
    };
    const viewport = viewportRef.current;
    const observer = new ResizeObserver(onResize);
    if (viewport) observer.observe(viewport);
    if (groupRef.current) observer.observe(groupRef.current);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [logicalIndexFromOffset, measure, offsetForAbsoluteIndex, setOffsetInstant, syncIndex]);

  const goToIndex = (target: number) => {
    if (animatingRef.current || draggingRef.current) return;
    if (!measure() || cardCount <= 0) return;
    queueRef.current = [];
    const clamped = ((target % cardCount) + cardCount) % cardCount;
    const base = normalizeOffsetValue(offsetRef.current);
    setOffsetInstant(base);
    animatingRef.current = true;
    requestAnimationFrame(() => {
      setOffsetAnimated(offsetForAbsoluteIndex(clamped));
      syncIndex(offsetForAbsoluteIndex(clamped));
      armAnimTimer();
    });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (animatingRef.current) return;

    if (!measure()) return;

    let absIndex = absoluteIndexFromOffset(offsetRef.current);
    // Prefer working inside the clone set so swipe-right from card 01 stays continuous
    if (absIndex <= 0 && cardCount > 0) {
      absIndex += cardCount;
      setOffsetInstant(offsetForAbsoluteIndex(absIndex));
    } else {
      setOffsetInstant(offsetForAbsoluteIndex(absIndex));
    }

    draggingRef.current = true;
    dragMovedRef.current = false;
    pointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    const track = trackRef.current;
    if (track) track.style.transition = "none";
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerIdRef.current !== event.pointerId) return;
    const delta = event.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 6) dragMovedRef.current = true;
    const next = dragStartOffsetRef.current + delta;
    offsetRef.current = next;
    const track = trackRef.current;
    if (track) track.style.transform = `translate3d(${next}px, 0, 0)`;
    syncIndex(next);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    draggingRef.current = false;
    pointerIdRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }

    if (!measure()) return;
    const step = stepRef.current;
    if (step <= 0) return;

    // Snap to nearest card from the live drag position
    const nearest = absoluteIndexFromOffset(offsetRef.current);
    const snapped = offsetForAbsoluteIndex(nearest);
    animatingRef.current = true;
    setOffsetAnimated(snapped);
    syncIndex(snapped);
    armAnimTimer();
  };

  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragMovedRef.current) {
      event.preventDefault();
      event.stopPropagation();
      dragMovedRef.current = false;
    }
  };

  const chevronPrev = (
    <svg
      className="product-carousel-btn-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const chevronNext = (
    <svg
      className="product-carousel-btn-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const edgeChevronPrev = (
    <svg
      className="product-carousel-edge-icon"
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

  const edgeChevronNext = (
    <svg
      className="product-carousel-edge-icon"
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

  const onEdgeClick = (direction: Direction) => (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    runStep(direction);
  };

  const onEdgePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="product-carousel-wrap" id="products">
      <div className="product-carousel-stage">
        <div className="product-carousel-edge-layer">
          <button
            type="button"
            className="product-carousel-edge product-carousel-edge--prev"
            aria-label="Previous product"
            onClick={onEdgeClick("prev")}
            onPointerDown={onEdgePointerDown}
          >
            {edgeChevronPrev}
          </button>
          <button
            type="button"
            className="product-carousel-edge product-carousel-edge--next"
            aria-label="Next product"
            onClick={onEdgeClick("next")}
            onPointerDown={onEdgePointerDown}
          >
            {edgeChevronNext}
          </button>
        </div>
        <div
          className="product-carousel"
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
        >
          <div
            className="product-carousel-track"
            ref={trackRef}
            style={{ transform: "translate3d(0, 0, 0)" }}
            onTransitionEnd={onTransitionEnd}
          >
            <div className="product-carousel-group" ref={groupRef}>
              {cloneGroup(children, "a")}
            </div>
            <div className="product-carousel-group" aria-hidden="true" inert>
              {cloneGroup(children, "b")}
            </div>
          </div>
        </div>
      </div>
      <div className="product-carousel-controls" role="group" aria-label="Product carousel controls">
        <button
          type="button"
          className="product-carousel-btn"
          aria-label="Previous product"
          onClick={() => runStep("prev")}
        >
          {chevronPrev}
        </button>
        <div className="product-carousel-dots" role="tablist" aria-label="Product positions">
          {Array.from({ length: cardCount }, (_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-label={`Go to product ${index + 1}`}
              aria-selected={index === activeIndex}
              className={`product-carousel-dot${index === activeIndex ? " is-active" : ""}`}
              onClick={() => goToIndex(index)}
            />
          ))}
        </div>
        <button
          type="button"
          className="product-carousel-btn"
          aria-label="Next product"
          onClick={() => runStep("next")}
        >
          {chevronNext}
        </button>
      </div>
    </div>
  );
}
