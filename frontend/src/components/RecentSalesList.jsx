import { useState, useMemo } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Search, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { currency } from "../logic/ledger.js";
import { usePagination } from "../hooks/usePagination.js";

export default function RecentSalesList({
  sales,
  subtitle,
  allBusinesses = false,
  onDeleteSale,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSales = useMemo(() => {
    const list = [...sales].sort(
      (left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt),
    );
    if (!searchTerm) return list;
    const lower = searchTerm.toLowerCase();
    return list.filter(
      (s) =>
        s.description?.toLowerCase().includes(lower) ||
        s.business?.toLowerCase().includes(lower),
    );
  }, [sales, searchTerm]);

  const {
    currentPage,
    pageCount,
    pageItems: pageSales,
    previousPage,
    nextPage,
  } = usePagination(filteredSales);

  return (
    <section className="ledger-panel ledger-product-sales">
      <div className="ledger-panel-heading">
        <div>
          <h2>Recent sales{allBusinesses ? " · All businesses" : ""}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="ledger-sales-head-actions">
          {sales.length > 3 && (
            <div className="ledger-search-box small">
              <Search size={14} />
              <input
                type="text"
                placeholder="Filter sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          {!allBusinesses && (
            <Link className="ledger-text-button" to="/app/sales">
              All sales <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div className="ledger-empty-stock">
          <strong>No sales found</strong>
          <span>
            {searchTerm
              ? "No sales match your search term."
              : "Sales will appear here for the selected period."}
          </span>
        </div>
      ) : (
        <>
          <div className="ledger-product-sale-list">
            {pageSales.map((sale) => (
              <div
                className={`ledger-product-sale ${allBusinesses ? "all-businesses" : ""}`}
                key={sale.id}
              >
                <span className="sale-date">
                  {new Date(sale.occurredAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" · "}
                  {new Date(sale.occurredAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                {allBusinesses && <strong className="sale-biz">{sale.business}</strong>}
                <span className="sale-desc">{sale.description}</span>
                <span className="sale-revenue">Income: <strong>{currency.format(sale.amount)}</strong></span>
                <span className="sale-profit-badge">{currency.format(sale.profit)} profit</span>
                {onDeleteSale && (
                  <button
                    type="button"
                    className="ledger-row-delete-btn"
                    onClick={() => onDeleteSale(sale.id)}
                    title="Remove this sale"
                    aria-label="Remove this sale"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {filteredSales.length > 0 && pageCount > 1 && (
            <nav
              className="ledger-activity-pagination"
              aria-label="Recent sales pages"
            >
              <span>
                Page {currentPage + 1} of {pageCount} ({filteredSales.length} total)
              </span>
              <div className="pagination-buttons">
                <button
                  type="button"
                  aria-label="Previous sales page"
                  disabled={currentPage === 0}
                  onClick={previousPage}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Next sales page"
                  disabled={currentPage >= pageCount - 1}
                  onClick={nextPage}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
