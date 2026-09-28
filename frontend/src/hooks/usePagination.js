import { useState } from "react";

export function usePagination(items, pageSize = 6) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = items.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  return {
    currentPage,
    pageCount,
    pageItems,
    previousPage: () => setPage(currentPage - 1),
    nextPage: () => setPage(currentPage + 1),
  };
}
