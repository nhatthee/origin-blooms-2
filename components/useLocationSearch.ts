"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";

function normalizeSearch(value: string) {
  return value.startsWith("?") ? value.slice(1) : value;
}

let windowSearch = "";
const listeners = new Set<() => void>();
let historyPatched = false;

function emit() {
  if (typeof window === "undefined") return;
  const next = normalizeSearch(window.location.search);
  if (next === windowSearch) return;
  windowSearch = next;
  listeners.forEach((listener) => listener());
}

function ensureHistoryPatch() {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;
  windowSearch = normalizeSearch(window.location.search);

  const { pushState, replaceState } = history;
  history.pushState = function (...args) {
    const result = pushState.apply(this, args);
    emit();
    return result;
  };
  history.replaceState = function (...args) {
    const result = replaceState.apply(this, args);
    emit();
    return result;
  };
  window.addEventListener("popstate", emit);
}

function subscribe(listener: () => void) {
  ensureHistoryPatch();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureHistoryPatch();
  return windowSearch;
}

function getServerSnapshot() {
  return "";
}

/**
 * useSearchParams can lag one beat behind the address bar on App Router soft-nav.
 * Prefer window.location.search when it has already moved, so hero/list stay in sync
 * with the destination category instead of briefly painting the previous one.
 */
export function useLocationSearch() {
  const searchParams = useSearchParams();
  const reactKey = searchParams.toString();
  const locationKey = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureHistoryPatch();
    emit();
  }, []);

  return new URLSearchParams(locationKey || reactKey);
}
