"use client";

import { useEffect, useRef, useState } from "react";
import { Announcement } from "./Announcement";
import { SiteHeader } from "./SiteHeader";

type SiteChromeProps = {
  /** When true, marks the home-page header anchor for in-page scroll. */
  homePage?: boolean;
  /** Keep announcement + header fixed and visible (no hide-on-scroll). */
  alwaysVisible?: boolean;
};

/** Fixed announcement + header: hide on scroll down, show immediately on any scroll up. */
export function SiteChrome({ homePage = false, alwaysVisible = false }: SiteChromeProps) {
  const lastYRef = useRef(0);
  const hiddenRef = useRef(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // iOS Safari can keep a stale status-bar / overscroll sample after client
    // navigations. Re-assert white so pull-to-refresh stays #FFFFFF.
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((node) => {
      if (!(node instanceof HTMLMetaElement)) return;
      node.setAttribute("content", "#FFFFFF");
    });

    if (alwaysVisible) {
      hiddenRef.current = false;
      setHidden(false);
      return;
    }

    lastYRef.current = window.scrollY;
    hiddenRef.current = false;

    const applyHidden = (next: boolean) => {
      if (hiddenRef.current === next) return;
      hiddenRef.current = next;
      setHidden(next);
      if (next) {
        const openMenu = document.querySelector(".site-chrome details[open]");
        if (openMenu instanceof HTMLDetailsElement) openMenu.open = false;
      }
    };

    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      const lastY = lastYRef.current;

      if (y <= 0) {
        applyHidden(false);
        lastYRef.current = y;
        return;
      }

      // Any upward movement shows chrome immediately — no distance threshold.
      if (y < lastY) {
        applyHidden(false);
      } else if (y > lastY) {
        applyHidden(true);
      }

      lastYRef.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [alwaysVisible]);

  return (
    <>
      <div className="site-chrome-spacer" aria-hidden="true" />
      <div
        className={`site-chrome${alwaysVisible ? " site-chrome--pinned" : ""}${hidden && !alwaysVisible ? " is-hidden" : ""}`}
      >
        {/* Real painted safe-area band (padding-top alone fails on some iOS/alwaysVisible paints). */}
        <div className="site-chrome-safe" aria-hidden="true" />
        <Announcement />
        <SiteHeader homePage={homePage} />
      </div>
    </>
  );
}
