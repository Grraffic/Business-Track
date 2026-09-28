import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ShoppingBasket,
  Wallet,
} from "lucide-react";
import { businesses, currency } from "../logic/ledger.js";
import { usePagination } from "../hooks/usePagination.js";

function Metric({ icon: Icon, label, value, note, positive }) {
  return (
    <article className="ledger-metric">
      <div className="ledger-metric-top">
        <span>{label}</span>
        <span className="ledger-metric-icon">
          <Icon size={16} />
        </span>
      </div>
      <strong className="ledger-metric-value">{value}</strong>
      <span className={`ledger-metric-note ${positive ? "positive" : ""}`}>
        {note}
      </span>
    </article>
  );
}

function TrendPanel({ range, summary }) {
  const maximumAmount = Math.max(summary.income, summary.expenses, 1);
  const totals = [
    { label: "Income", amount: summary.income, type: "income" },
    { label: "Expenses", amount: summary.expenses, type: "expense" },
  ];

  return (
    <section className="ledger-panel">
      <div className="ledger-panel-heading">
        <div>
          <h2>Income &amp; expenses</h2>
          <p>Recorded activity · {range}</p>
        </div>
        <Link className="ledger-text-button" to="/app/report">
          View report <ArrowRight size={13} />
        </Link>
      </div>
      {summary.income === 0 && summary.expenses === 0 ? (
        <div className="ledger-chart-empty">
          No income or expense entries recorded for this period.
        </div>
      ) : (
        <div className="ledger-overview-bars">
          {totals.map(({ label, amount, type }) => (
            <div className="ledger-overview-bar-row" key={type}>
              <div className="ledger-overview-bar-label">
                <span>{label}</span>
                <strong>{currency.format(amount)}</strong>
              </div>
              <div className="ledger-overview-bar-track">
                <span
                  className={type}
                  style={{ width: `${(amount / maximumAmount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BusinessPanel({ summaries, onSelect }) {
  return (
    <section className="ledger-panel">
      <div className="ledger-panel-heading">
        <div>
          <h2>By business</h2>
          <p>Net result for selected period</p>
        </div>
        <button className="ledger-icon-link" aria-label="Business details">
          <ArrowRight size={16} />
        </button>
      </div>
      <div className="ledger-business-list">
        {businesses.map((business) => {
          const summary = summaries[business.id];
          return (
            <button
              className="ledger-business-row"
              key={business.id}
              onClick={() => onSelect(business.id)}
            >
              <span className={`ledger-business-icon ${business.id}`}>
                {business.icon}
              </span>
              <span className="ledger-business-label">
                <strong>{business.name}</strong>
                <small>
                  {summary.units} {summary.units === 1 ? "item" : "items"} sold
                </small>
              </span>
              <span className="ledger-business-value">
                <strong>{currency.format(summary.profit)}</strong>
                <small>net</small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RecentActivity({ transactions }) {
  const {
    currentPage,
    pageCount,
    pageItems: pageTransactions,
    previousPage,
    nextPage,
  } = usePagination(transactions);

  return (
    <section className="ledger-panel ledger-activity">
      <div className="ledger-panel-heading">
        <div>
          <h2>Recent activity</h2>
          <p>All businesses · {transactions.length} entries</p>
        </div>
      </div>
      <div className="ledger-transaction-list">
        {transactions.length === 0 ? (
          <div className="ledger-empty-stock">
            <strong>No activity recorded yet</strong>
            <span>Sales and expenses will appear here when entered.</span>
          </div>
        ) : (
          pageTransactions.map((entry) => (
            <div className="ledger-transaction" key={entry.id}>
              <span className={`ledger-transaction-icon ${entry.type}`}>
                {entry.type === "expense" ? (
                  <ArrowDownLeft size={15} />
                ) : (
                  <ArrowUpRight size={15} />
                )}
              </span>
              <span className="ledger-transaction-main">
                <strong>{entry.description}</strong>
                <small>
                  {entry.business} ·{" "}
                  {new Date(entry.occurredAt).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </small>
              </span>
              <span className="ledger-transaction-tag">{entry.type}</span>
              <strong className={`ledger-transaction-amount ${entry.type}`}>
                {entry.type === "expense" ? "−" : "+"}
                {currency.format(entry.amount)}
              </strong>
            </div>
          ))
        )}
      </div>
      {transactions.length > 0 && (
        <nav className="ledger-activity-pagination" aria-label="Activity pages">
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <div>
            <button
              type="button"
              aria-label="Previous activity page"
              disabled={currentPage === 0}
              onClick={previousPage}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              aria-label="Next activity page"
              disabled={currentPage >= pageCount - 1}
              onClick={nextPage}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}

export default function OverviewPage({ ledger, onNavigate }) {
  return (
    <>
      <section className="ledger-metrics" aria-label="Business summary">
        <Metric
          icon={ArrowUpRight}
          label="Income"
          value={currency.format(ledger.summary.income)}
          note="Sales recorded"
          positive
        />
        <Metric
          icon={ArrowDownLeft}
          label="Expenses"
          value={currency.format(ledger.summary.expenses)}
          note="Costs & purchases"
        />
        <Metric
          icon={Wallet}
          label="Net profit"
          value={currency.format(ledger.summary.profit)}
          note="Income less expenses"
          positive
        />
        <Metric
          icon={ShoppingBasket}
          label="Items sold"
          value={ledger.summary.units.toLocaleString()}
          note="Across selected period"
        />
      </section>
      <div className="ledger-dashboard-grid">
        <TrendPanel range={ledger.periodLabel} summary={ledger.summary} />
        <BusinessPanel
          summaries={ledger.businessSummaries}
          onSelect={onNavigate}
        />
      </div>
      <RecentActivity transactions={ledger.transactions} />
    </>
  );
}
