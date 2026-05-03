"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Reusable client-side pagination hook for any in-memory list.
 * Returns the current page slice plus controls and metadata.
 *
 * Usage:
 *   const { items, page, pageCount, setPage, total, indexOffset } =
 *     usePagination(filteredArray, 12);
 *
 * Resets to page 1 whenever the source array reference changes (e.g. after
 * applying a search filter).
 */
export function usePagination<T>(source: readonly T[], pageSize = 12) {
  const [page, setPageInternal] = useState(1);

  const pageCount = Math.max(1, Math.ceil(source.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);

  // Reset to page 1 when source changes length (filter applied, etc.)
  useEffect(() => {
    setPageInternal(1);
  }, [source.length]);

  const items = useMemo(
    () => source.slice((safePage - 1) * pageSize, safePage * pageSize),
    [source, safePage, pageSize],
  );

  const setPage = (p: number) =>
    setPageInternal(Math.min(Math.max(1, p), pageCount));

  return {
    items,
    page: safePage,
    pageCount,
    setPage,
    total: source.length,
    indexOffset: (safePage - 1) * pageSize,
    pageSize,
    hasPrev: safePage > 1,
    hasNext: safePage < pageCount,
  };
}
