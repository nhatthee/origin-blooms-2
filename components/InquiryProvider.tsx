"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildInquiryItem,
  buildInquiryItemsForStemSizes,
  INQUIRY_STORAGE_KEY,
  mergeInquiryItems,
  mergeManyInquiryItems,
  readInquiryFromStorage,
  removeInquiryItem,
  updateInquiryQuantity,
  writeInquiryToStorage,
  type InquiryDraft,
  type InquiryItem,
} from "../lib/inquiry";

type InquiryContextValue = {
  items: InquiryItem[];
  ready: boolean;
  count: number;
  addItem: (slug: string, draft: InquiryDraft) => boolean;
  addStemSizeQuantities: (slug: string, quantities: Record<string, number>) => boolean;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const InquiryContext = createContext<InquiryContextValue | null>(null);

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readInquiryFromStorage());
    setReady(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== INQUIRY_STORAGE_KEY) return;
      setItems(readInquiryFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeInquiryToStorage(items);
  }, [items, ready]);

  const addItem = useCallback((slug: string, draft: InquiryDraft) => {
    const next = buildInquiryItem(slug, draft);
    if (!next) return false;
    setItems((current) => mergeInquiryItems(current, next));
    return true;
  }, []);

  const addStemSizeQuantities = useCallback(
    (slug: string, quantities: Record<string, number>) => {
      const nextItems = buildInquiryItemsForStemSizes(slug, quantities);
      if (!nextItems) return false;
      setItems((current) => mergeManyInquiryItems(current, nextItems));
      return true;
    },
    [],
  );

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) => updateInquiryQuantity(current, id, quantity));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => removeInquiryItem(current, id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<InquiryContextValue>(
    () => ({
      items,
      ready,
      count: items.length,
      addItem,
      addStemSizeQuantities,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, ready, addItem, addStemSizeQuantities, setQuantity, removeItem, clear],
  );

  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>;
}

export function useInquiry() {
  const ctx = useContext(InquiryContext);
  if (!ctx) {
    throw new Error("useInquiry must be used within InquiryProvider");
  }
  return ctx;
}
