import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  ShoppingBasket,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { businesses, currency } from "../logic/ledger.js";
import { usePagination } from "../hooks/usePagination.js";

function Metric({ icon: Icon, label, value, note, positive, badge }) {
  return (
    <article className="ledger-metric">
      <div className="ledger-metric-top">
        <span className="ledger-metric-label">{label}</span>
        <span className={`ledger-metric-icon ${positive ? "positive" : ""}`}>
          <Icon size={18} strokeWidth={2.2} />
        </span>
      </div>
      <strong className="ledger-metric-value">{value}</strong>
      <div className="ledger-metric-footer">
        <span className={`ledger-metric-note ${positive ? "positive" : ""}`}>
          {note}
        </span>
        {badge && <span className="ledger-metric-badge">{badge}</span>}
      </div>
    </article>
  );
}

function TrendPanel({ range, summary }) {
  const maximumAmount = Math.max(summary.income, summary.expenses, 1);
  const profitMargin = summary.income > 0
    ? Math.round((summary.profit / summary.income) * 100)
    : 0;

  const totals = [
    {
      label: "Income (Sales)",
      amount: summary.income,
      type: "income",
      pct: Math.round((summary.income / maximumAmount) * 100),
    },
    {
      label: "Expenses (Costs)",
      amount: summary.expenses,
      type: "expense",
      pct: Math.round((summary.expenses / maximumAmount) * 100),
    },
  ];

  return (
    <section className="ledger-panel">
      <div className="ledger-panel-heading">
        <div>
          <h2>Income &amp; expenses</h2>
          <p>Recorded activity · {range}</p>
        </div>
        <Link className="ledger-text-button" to="/app/report">
          View full report <ArrowRight size={14} />
        </Link>
      </div>

      {summary.income === 0 && summary.expenses === 0 ? (
        <div className="ledger-chart-empty">
          <p>No income or expense entries recorded for this period.</p>
        </div>
      ) : (
        <div className="ledger-overview-bars">
          {totals.map(({ label, amount, type, pct }) => (
            <div className="ledger-overview-bar-row" key={type}>
              <div className="ledger-overview-bar-label">
                <span className="bar-title">{label}</span>
                <span className="bar-value">
                  <strong>{currency.format(amount)}</strong>
                  <small>({pct}%)</small>
                </span>
              </div>
              <div className="ledger-overview-bar-track" title={`${label}: ${currency.format(amount)}`}>
                <span
                  className={type}
                  style={{ width: `${Math.max(2, (amount / maximumAmount) * 100)}%` }}
                />
              </div>
            </div>
          ))}

          {summary.income > 0 && (
            <div className="ledger-profit-summary-pill">
              <TrendingUp size={15} />
              <span>Profit Margin: <strong>{profitMargin}%</strong> ({currency.format(summary.profit)} net)</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function BusinessPanel({ summaries, onSelect, filterType }) {
  const totalIncome   = Object.values(summaries).reduce((acc, s) => acc + Math.max(0, s.income),   0) || 1;
  const totalExpenses = Object.values(summaries).reduce((acc, s) => acc + Math.max(0, s.expenses), 0) || 1;
  const totalProfit   = Object.values(summaries).reduce((acc, s) => acc + Math.max(0, s.profit),   0) || 1;

  const getDisplay = (s) => {
    if (filterType === "income")  return { amount: s.income,   label: "income",    total: totalIncome };
    if (filterType === "expense") return { amount: s.expenses, label: "expenses",  total: totalExpenses };
    return                               { amount: s.profit,   label: "net profit", total: totalProfit };
  };

  const subLabel =
    filterType === "income"  ? "Sales income" :
    filterType === "expense" ? "Costs & expenses" :
                               "Net profit";

  return (
    <section className="ledger-panel">
      <div className="ledger-panel-heading">
        <div>
          <h2>By business</h2>
          <p>{subLabel} for selected period</p>
        </div>
      </div>
      <div className="ledger-business-list">
        {businesses.map((business) => {
          const summary = summaries[business.id];
          const { amount, label, total } = getDisplay(summary);
          const contribution = Math.max(0, Math.round((Math.max(0, amount) / total) * 100));

          return (
            <button
              className="ledger-business-row"
              key={business.id}
              onClick={() => onSelect(business.id)}
              title={`View ${business.name} details`}
            >
              <span className={`ledger-business-icon ${business.id}`}>
                {business.icon}
              </span>
              <div className="ledger-business-label">
                <strong>{business.name}</strong>
                <small>
                  {summary.units} {summary.units === 1 ? "unit" : "units"} sold · {contribution}% share
                </small>
                <div className="ledger-business-minibar">
                  <span style={{ width: `${Math.min(100, Math.max(0, contribution))}%` }} />
                </div>
              </div>
              <span className="ledger-business-value">
                <strong>{currency.format(amount)}</strong>
                <small>{label}</small>
              </span>
              <ArrowRight size={15} className="row-arrow" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RecentActivity({ transactions, onLoadSample, filterType, setFilterType }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((entry) => {
      const matchesType =
        filterType === "all" || entry.type === filterType;
      const matchesSearch =
        !searchTerm ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.business.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [transactions, filterType, searchTerm]);

  const {
    currentPage,
    pageCount,
    pageItems: pageTransactions,
    previousPage,
    nextPage,
  } = usePagination(filteredTransactions);

  return (
    <section className="ledger-panel ledger-activity">
      <div className="ledger-panel-heading ledger-activity-heading">
        <div>
          <h2>Recent activity</h2>
          <p>
            {filteredTransactions.length} {filteredTransactions.length === 1 ? "entry" : "entries"}
            {searchTerm ? ` matching "${searchTerm}"` : " recorded"}
          </p>
        </div>

        {/* Interactive Filter & Search Controls */}
        <div className="ledger-activity-controls">
          <div className="ledger-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="ledger-type-filter" role="tablist">
            <button
              type="button"
              className={`filter-btn ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-btn ${filterType === "income" ? "active" : ""}`}
              onClick={() => setFilterType("income")}
            >
              Sales
            </button>
            <button
              type="button"
              className={`filter-btn ${filterType === "expense" ? "active" : ""}`}
              onClick={() => setFilterType("expense")}
            >
              Costs
            </button>
          </div>
        </div>
      </div>

      <div className="ledger-transaction-list">
        {filteredTransactions.length === 0 ? (
          <div className="ledger-empty-stock">
            <ShoppingBasket size={24} />
            <strong>No activity found</strong>
            <span>
              {searchTerm
                ? "Try a different search term or clear the filter."
                : "Record your first sale above or populate sample data."}
            </span>
            {onLoadSample && transactions.length === 0 && (
              <button
                type="button"
                className="ledger-button secondary small mt-2"
                onClick={onLoadSample}
              >
                <Sparkles size={14} /> Load sample transactions
              </button>
            )}
          </div>
        ) : (
          pageTransactions.map((entry) => (
            <div className="ledger-transaction" key={entry.id}>
              <span className={`ledger-transaction-icon ${entry.type}`}>
                {entry.type === "expense" ? (
                  <ArrowDownLeft size={16} />
                ) : (
                  <ArrowUpRight size={16} />
                )}
              </span>
              <div className="ledger-transaction-main">
                <strong>{entry.description}</strong>
                <small>
                  <span className="biz-tag">{entry.business}</span> ·{" "}
                  {new Date(entry.occurredAt).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </small>
              </div>
              <span className={`ledger-transaction-tag ${entry.type}`}>
                {entry.type === "expense" ? "Expense" : "Sale"}
              </span>
              <strong className={`ledger-transaction-amount ${entry.type}`}>
                {entry.type === "expense" ? "−" : "+"}
                {currency.format(entry.amount)}
              </strong>
            </div>
          ))
        )}
      </div>

      {filteredTransactions.length > 0 && pageCount > 1 && (
        <nav className="ledger-activity-pagination" aria-label="Activity pages">
          <span>
            Page {currentPage + 1} of {pageCount} ({filteredTransactions.length} entries)
          </span>
          <div className="pagination-buttons">
            <button
              type="button"
              aria-label="Previous activity page"
              disabled={currentPage === 0}
              onClick={previousPage}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next activity page"
              disabled={currentPage >= pageCount - 1}
              onClick={nextPage}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}

export default function OverviewPage({ ledger, onNavigate, onToast }) {
  const [filterType, setFilterType] = useState("all"); // shared: "all" | "income" | "expense"

  const marginPct = ledger.summary.income > 0
    ? Math.round((ledger.summary.profit / ledger.summary.income) * 100)
    : 0;

  return (
    <>
      <section className="ledger-metrics" aria-label="Business summary">
        <Metric
          icon={ArrowUpRight}
          label="Total Income"
          value={currency.format(ledger.summary.income)}
          note="Gross sales recorded"
          positive
          badge={`${ledger.summary.units} items`}
        />
        <Metric
          icon={ArrowDownLeft}
          label="Total Expenses"
          value={currency.format(ledger.summary.expenses)}
          note="Costs & restocks"
        />
        <Metric
          icon={Wallet}
          label="Net Profit"
          value={currency.format(ledger.summary.profit)}
          note={marginPct > 0 ? `${marginPct}% profit margin` : "Income less costs"}
          positive={ledger.summary.profit > 0}
        />
        <Metric
          icon={ShoppingBasket}
          label="Items Sold"
          value={ledger.summary.units.toLocaleString()}
          note="Water, Ice & Graham Bar"
        />
      </section>

      <div className="ledger-dashboard-grid">
        <TrendPanel range={ledger.periodLabel} summary={ledger.summary} />
        <BusinessPanel
          summaries={ledger.businessSummaries}
          onSelect={onNavigate}
          filterType={filterType}
        />
      </div>

      <RecentActivity
        transactions={ledger.transactions}
        filterType={filterType}
        setFilterType={setFilterType}
        onLoadSample={
          ledger.loadSampleData
            ? () => {
                ledger.loadSampleData();
                onToast?.("Sample data loaded!");
              }
            : undefined
        }
      />
    </>
  );
}
