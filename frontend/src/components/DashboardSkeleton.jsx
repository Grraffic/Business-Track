export default function DashboardSkeleton() {
  return (
    <div
      className="ledger-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading business dashboard"
    >
      <span className="ledger-sr-only">Loading business data</span>
      <div className="ledger-skeleton-metrics">
        {[0, 1, 2, 3].map((item) => (
          <div className="ledger-skeleton-card" key={item}>
            <span className="ledger-skeleton-block short" />
            <span className="ledger-skeleton-block value" />
            <span className="ledger-skeleton-block medium" />
          </div>
        ))}
      </div>
      <div className="ledger-skeleton-columns">
        <div className="ledger-skeleton-chart">
          <span className="ledger-skeleton-block heading" />
          <span className="ledger-skeleton-block chart" />
        </div>
        <div className="ledger-skeleton-list">
          <span className="ledger-skeleton-block heading" />
          {[0, 1, 2].map((item) => (
            <span className="ledger-skeleton-block row" key={item} />
          ))}
        </div>
      </div>
      <p className="ledger-loading-caption">Loading latest entries…</p>
    </div>
  );
}
