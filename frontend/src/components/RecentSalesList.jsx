import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { currency } from "../logic/ledger.js";
import { usePagination } from "../hooks/usePagination.js";

export default function RecentSalesList({
  sales,
  subtitle,
  allBusinesses = false,
}) {
  const sortedSales = [...sales].sort(
    (left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt),
  );
  const {
    currentPage,
    pageCount,
    pageItems: pageSales,
    previousPage,
    nextPage,
  } = usePagination(sortedSales);

  return (
    <section className="ledger-panel ledger-product-sales">
      <div className="ledger-panel-heading">
        <div>
          <h2>Recent sales{allBusinesses ? " · All businesses" : ""}</h2>
          <p>{subtitle}</p>
        </div>
        {!allBusinesses && (
          <Link className="ledger-text-button" to="/app/sales">
            All sales <ArrowRight size={13} />
          </Link>
        )}
      </div>
      {sales.length === 0 ? (
        <div className="ledger-empty-stock">
          <strong>No sales recorded</strong>
          <span>Sales will appear here for the selected period.</span>
        </div>
      ) : (
        <>
          <div className="ledger-product-sale-list">
            {pageSales.map((sale) => (
              <div
                className={`ledger-product-sale ${allBusinesses ? "all-businesses" : ""}`}
                key={sale.id}
              >
                <span>
                  {new Date(sale.occurredAt).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                {allBusinesses && <strong>{sale.business}</strong>}
                <span>{sale.description}</span>
                <span>Income {currency.format(sale.amount)}</span>
                <strong>{currency.format(sale.profit)} profit</strong>
              </div>
            ))}
          </div>
          {sortedSales.length > 0 && (
            <nav
              className="ledger-activity-pagination"
              aria-label="Recent sales pages"
            >
              <span>
                Page {currentPage + 1} of {pageCount}
              </span>
              <div>
                <button
                  type="button"
                  aria-label="Previous sales page"
                  disabled={currentPage === 0}
                  onClick={previousPage}
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Next sales page"
                  disabled={currentPage >= pageCount - 1}
                  onClick={nextPage}
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
