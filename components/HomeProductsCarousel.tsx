"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

export type HomeStoryCard = {
  id: string;
  title: string;
  lead: string;
  body: string;
  imageSrc: string;
  /** Optional destination for the card image and title only. */
  href?: string;
};

type HomeProductsCarouselProps = {
  cards: HomeStoryCard[];
};

const MOBILE_MQ = "(max-width: 760px)";

function ChevronPrevIcon() {
  return (
    <svg
      className="home-products-chevron-icon"
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
      className="home-products-chevron-icon"
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

export function HomeProductsCarousel({ cards }: HomeProductsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const loopingRef = useRef(false);
  const jumpingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const pointerActiveRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const pointerStartScrollRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [looping, setLooping] = useState(false);
  const cardCount = cards.length;

  const getCards = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return [] as HTMLElement[];
    return Array.from(scroller.querySelectorAll<HTMLElement>(":scope > .product-card"));
  }, []);

  const updateActive = useCallback((index: number) => {
    const next = ((index % cardCount) + cardCount) % cardCount;
    activeIndexRef.current = next;
    setActiveIndex((prev) => (prev === next ? prev : next));
  }, [cardCount]);

  const nearestAbsIndex = useCallback(() => {
    const scroller = scrollerRef.current;
    const cards = getCards();
    if (!scroller || cards.length === 0) return 0;

    const origin = scroller.getBoundingClientRect().left;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const dist = Math.abs(card.getBoundingClientRect().left - origin);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  }, [getCards]);

  const instantScrollToAbs = useCallback(
    (absIndex: number) => {
      const scroller = scrollerRef.current;
      const cards = getCards();
      const card = cards[absIndex];
      if (!scroller || !card) return;

      jumpingRef.current = true;
      const prevSnap = scroller.style.scrollSnapType;
      scroller.style.scrollSnapType = "none";
      const scrollerRect = scroller.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      scroller.scrollLeft += cardRect.left - scrollerRect.left;
      void scroller.offsetWidth;
      scroller.style.scrollSnapType = prevSnap;
      requestAnimationFrame(() => {
        jumpingRef.current = false;
      });
    },
    [getCards],
  );

  const normalizeLoop = useCallback(() => {
    if (!loopingRef.current || jumpingRef.current || cardCount <= 0) return;
    const abs = nearestAbsIndex();
    if (abs < cardCount) {
      instantScrollToAbs(abs + cardCount);
    } else if (abs >= cardCount * 2) {
      instantScrollToAbs(abs - cardCount);
    }
    updateActive(nearestAbsIndex() % cardCount);
  }, [cardCount, instantScrollToAbs, nearestAbsIndex, updateActive]);

  const syncActiveFromScroll = useCallback(() => {
    if (jumpingRef.current) return;
    const abs = nearestAbsIndex();
    if (loopingRef.current && cardCount > 0) {
      updateActive(abs % cardCount);
    } else {
      updateActive(abs);
    }
  }, [cardCount, nearestAbsIndex, updateActive]);

  const scrollToAbs = useCallback(
    (absIndex: number, behavior: ScrollBehavior = "smooth") => {
      const scroller = scrollerRef.current;
      const cards = getCards();
      const card = cards[absIndex];
      if (!scroller || !card) return;

      const scrollerRect = scroller.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const nextLeft = scroller.scrollLeft + (cardRect.left - scrollerRect.left);
      scroller.scrollTo({ left: Math.max(0, nextLeft), behavior });
      if (loopingRef.current && cardCount > 0) {
        updateActive(absIndex % cardCount);
      } else {
        updateActive(absIndex);
      }
    },
    [cardCount, getCards, updateActive],
  );

  const goToLogical = useCallback(
    (logical: number, behavior: ScrollBehavior = "smooth") => {
      if (cardCount <= 0) return;
      const targetLogical = ((logical % cardCount) + cardCount) % cardCount;

      if (!loopingRef.current) {
        scrollToAbs(targetLogical, behavior);
        return;
      }

      const currentAbs = nearestAbsIndex();
      const currentLogical = ((currentAbs % cardCount) + cardCount) % cardCount;
      let delta = targetLogical - currentLogical;
      if (delta > cardCount / 2) delta -= cardCount;
      if (delta < -cardCount / 2) delta += cardCount;
      scrollToAbs(currentAbs + delta, behavior);
    },
    [cardCount, nearestAbsIndex, scrollToAbs],
  );

  const stepBy = useCallback(
    (direction: -1 | 1) => {
      if (cardCount <= 0) return;
      if (!loopingRef.current) {
        goToLogical(activeIndexRef.current + direction);
        return;
      }
      scrollToAbs(nearestAbsIndex() + direction);
    },
    [cardCount, goToLogical, nearestAbsIndex, scrollToAbs],
  );

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => {
      const next = mq.matches;
      loopingRef.current = next;
      setLooping(next);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useLayoutEffect(() => {
    if (!looping || cardCount <= 0) return;
    // Land in the middle copy so both directions have room to loop.
    instantScrollToAbs(cardCount + activeIndexRef.current);
    updateActive(activeIndexRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-seat when loop mode / count changes
  }, [looping, cardCount]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onScroll = () => syncActiveFromScroll();
    const onScrollEnd = () => {
      syncActiveFromScroll();
      normalizeLoop();
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("scrollend", onScrollEnd);

    // Fallback when scrollend is unavailable: settle after scroll stops.
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const onScrollSettle = () => {
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        normalizeLoop();
        syncActiveFromScroll();
      }, 120);
    };
    scroller.addEventListener("scroll", onScrollSettle, { passive: true });

    const restoreLogical = () => {
      if (!loopingRef.current || cardCount <= 0) {
        syncActiveFromScroll();
        return;
      }
      instantScrollToAbs(cardCount + activeIndexRef.current);
      updateActive(activeIndexRef.current);
    };

    window.addEventListener("resize", restoreLogical);
    window.addEventListener("orientationchange", restoreLogical);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("scrollend", onScrollEnd);
      scroller.removeEventListener("scroll", onScrollSettle);
      if (settleTimer) clearTimeout(settleTimer);
      window.removeEventListener("resize", restoreLogical);
      window.removeEventListener("orientationchange", restoreLogical);
    };
  }, [
    cardCount,
    instantScrollToAbs,
    normalizeLoop,
    syncActiveFromScroll,
    updateActive,
    looping,
  ]);

  const step = (direction: -1 | 1) => (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    stepBy(direction);
  };

  const onNavPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const onScrollerPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Ignore non-primary buttons and controls that should not start a drag.
    if (event.button !== 0) return;
    pointerActiveRef.current = true;
    dragMovedRef.current = false;
    pointerStartXRef.current = event.clientX;
    pointerStartScrollRef.current = scrollerRef.current?.scrollLeft ?? 0;
  };

  const onScrollerPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) return;
    const deltaX = Math.abs(event.clientX - pointerStartXRef.current);
    const deltaScroll = Math.abs((scrollerRef.current?.scrollLeft ?? 0) - pointerStartScrollRef.current);
    if (deltaX > 8 || deltaScroll > 8) {
      dragMovedRef.current = true;
    }
  };

  const onScrollerPointerUp = () => {
    pointerActiveRef.current = false;
  };

  const onScrollerClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!dragMovedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragMovedRef.current = false;
  };

  const sets = looping ? [0, 1, 2] : [0];

  return (
    <div className="home-products-scroller">
      <div className="home-products-stage">
        <div className="home-products-photo-nav">
          <button
            type="button"
            className="home-products-chevron home-products-chevron--prev"
            aria-label="Previous card"
            onClick={step(-1)}
            onPointerDown={onNavPointerDown}
          >
            <ChevronPrevIcon />
          </button>
          <button
            type="button"
            className="home-products-chevron home-products-chevron--next"
            aria-label="Next card"
            onClick={step(1)}
            onPointerDown={onNavPointerDown}
          >
            <ChevronNextIcon />
          </button>
        </div>
        <div
          className={`home-products-grid${looping ? " home-products-grid--loop" : ""}`}
          id="products"
          ref={scrollerRef}
          onPointerDown={onScrollerPointerDown}
          onPointerMove={onScrollerPointerMove}
          onPointerUp={onScrollerPointerUp}
          onPointerCancel={onScrollerPointerUp}
          onClickCapture={onScrollerClickCapture}
        >
          {sets.map((setIndex) =>
            cards.map((card, logicalIndex) => (
              <article
                className="product-card product-card--panel"
                key={`${setIndex}-${card.id}`}
                data-logical-index={logicalIndex}
              >
                {card.href ? (
                  <Link
                    href={card.href}
                    className="product-photo photo-slot has-photo"
                    aria-label={card.title}
                  >
                    <Image
                      src={card.imageSrc}
                      alt=""
                      fill
                      sizes="(max-width: 760px) 92vw, 32vw"
                      className={`product-photo-media product-photo-media--${card.id}`}
                    />
                  </Link>
                ) : (
                  <div className="product-photo photo-slot has-photo">
                    <Image
                      src={card.imageSrc}
                      alt={card.title}
                      fill
                      sizes="(max-width: 760px) 92vw, 32vw"
                      className={`product-photo-media product-photo-media--${card.id}`}
                    />
                  </div>
                )}
                <div className="product-info">
                  <div className="product-copy">
                    <div className="product-title-row">
                      <h3>
                        {card.href ? (
                          <Link href={card.href}>{card.title}</Link>
                        ) : (
                          card.title
                        )}
                      </h3>
                    </div>
                    <p className="product-lead">
                      <em>{card.lead}</em>
                    </p>
                    <p className="product-body">{card.body}</p>
                  </div>
                </div>
              </article>
            )),
          )}
        </div>
      </div>
      <div className="home-products-dots" role="tablist" aria-label="Home story cards">
        {cards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            role="tab"
            aria-label={`Go to ${card.title}`}
            aria-selected={index === activeIndex}
            className={`home-products-dot${index === activeIndex ? " is-active" : ""}`}
            onClick={() => goToLogical(index)}
          />
        ))}
      </div>
    </div>
  );
}
