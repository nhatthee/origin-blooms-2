"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
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

const MOBILE_MQ =
  "(max-width: 760px), (max-height: 500px) and (orientation: landscape)";
const TRANSITION_MS = 900;
const SWIPE_THRESHOLD_PX = 40;

function PackingChevronPrevIcon() {
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

function PackingChevronNextIcon() {
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

function StoryCardArticle({ card }: { card: HomeStoryCard }) {
  return (
    <article className="product-card product-card--panel">
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
            sizes="(max-width: 760px) 100vw, 32vw"
            className={`product-photo-media product-photo-media--${card.id}`}
            draggable={false}
          />
        </Link>
      ) : (
        <div className="product-photo photo-slot has-photo">
          <Image
            src={card.imageSrc}
            alt={card.title}
            fill
            sizes="(max-width: 760px) 100vw, 32vw"
            className={`product-photo-media product-photo-media--${card.id}`}
            draggable={false}
          />
        </div>
      )}
      <div className="product-info">
        <div className="product-copy">
          <div className="product-title-row">
            <h3>
              {card.href ? <Link href={card.href}>{card.title}</Link> : card.title}
            </h3>
          </div>
          <p className="product-lead">
            <em>{card.lead}</em>
          </p>
          <p className="product-body">{card.body}</p>
        </div>
      </div>
    </article>
  );
}

/** Desktop / tablet: unchanged 3-column grid (controls hidden via base CSS). */
function HomeProductsDesktopGrid({ cards }: { cards: HomeStoryCard[] }) {
  return (
    <div className="home-products-scroller">
      <div className="home-products-stage">
        <div className="home-products-grid" id="products">
          {cards.map((card) => (
            <StoryCardArticle key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mobile: PackingHouseSlideshow motion + chrome over Home story cards. */
function HomeProductsMobileSlideshow({ cards }: { cards: HomeStoryCard[] }) {
  const count = cards.length;
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<PendingMove | null>(null);
  const [sliding, setSliding] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const swipingRef = useRef(false);
  const indexRef = useRef(0);
  const animatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragMovedRef = useRef(false);

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

  useEffect(() => () => clearAnimTimer(), [clearAnimTimer]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || count <= 1 || animatingRef.current) return;
    if ((event.target as HTMLElement | null)?.closest?.("button, a")) return;
    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    swipingRef.current = false;
    dragMovedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    if (Math.abs(event.clientX - startXRef.current) > 8) {
      swipingRef.current = true;
      dragMovedRef.current = true;
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
  };

  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragMovedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    dragMovedRef.current = false;
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
    <div className="home-products-scroller home-products-scroller--mobile-slideshow">
      <div className="home-products-stage">
        <div
          className="home-products-mobile-stage"
          id="products"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onClickCapture={onClickCapture}
        >
          {cards.map((card, i) => {
            if (!renderIndexes.includes(i)) return null;
            return (
              <div
                key={card.id}
                className={`packing-slideshow-slide${slideClass(i)}`}
                aria-hidden={i !== selectedIndex}
              >
                <StoryCardArticle card={card} />
              </div>
            );
          })}
        </div>

        {count > 1 ? (
          <div className="home-products-photo-nav">
            <div
              className="packing-slideshow-nav"
              role="group"
              aria-label="Story card navigation"
            >
              <button
                type="button"
                className="packing-slideshow-chevron packing-slideshow-chevron--prev"
                aria-label="Previous card"
                disabled={Boolean(pending)}
                onClick={() => goBy(-1)}
              >
                <PackingChevronPrevIcon />
              </button>
              <button
                type="button"
                className="packing-slideshow-chevron packing-slideshow-chevron--next"
                aria-label="Next card"
                disabled={Boolean(pending)}
                onClick={() => goBy(1)}
              >
                <PackingChevronNextIcon />
              </button>
            </div>
            <div
              className="packing-slideshow-dots"
              role="tablist"
              aria-label="Home story cards"
            >
              {cards.map((card, i) => (
                <button
                  key={card.id}
                  type="button"
                  role="tab"
                  aria-label={`Go to ${card.title}`}
                  aria-selected={selectedIndex === i}
                  className={`packing-slideshow-dot${selectedIndex === i ? " is-active" : ""}`}
                  disabled={Boolean(pending)}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function HomeProductsCarousel({ cards }: HomeProductsCarouselProps) {
  const [mobile, setMobile] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (mobile) {
    return <HomeProductsMobileSlideshow cards={cards} />;
  }

  return <HomeProductsDesktopGrid cards={cards} />;
}
