import { currency } from "../logic/ledger.js";

export default function IncomeExpenseReportPage({
  range,
  summary,
  dailyReport,
}) {
  const graphDays = [...dailyReport].sort((left, right) =>
    left.dayKey.localeCompare(right.dayKey),
  );
  const maximumAmount = graphDays.reduce(
    (maximum, day) => Math.max(maximum, day.income, day.expenses),
    1,
  );

  return (
    <div className="ledger-report-page">
      <section className="ledger-report-summary" aria-label="Period totals">
        <article>
          <span>Income</span>
          <strong>{currency.format(summary.income)}</strong>
        </article>
        <article>
          <span>Expenses</span>
          <strong>{currency.format(summary.expenses)}</strong>
        </article>
        <article>
          <span>Net profit</span>
          <strong>{currency.format(summary.profit)}</strong>
        </article>
      </section>

      <section className="ledger-panel ledger-report-panel">
        <div className="ledger-panel-heading">
          <div>
            <h2>Daily income, expenses &amp; purchases</h2>
            <p>Selected period · {range}</p>
          </div>
        </div>
        <p className="ledger-report-note">
          Purchases count recorded sale entries, not unique customers.
        </p>
        {graphDays.length === 0 ? (
          <div className="ledger-report-empty">
            No daily activity recorded for this period.
          </div>
        ) : (
          <>
            <div className="ledger-daily-chart-scroll">
              <div
                className="ledger-daily-chart"
                role="img"
                aria-label={`Daily income and expense graph for ${range}; purchase counts are shown above each day`}
              >
                {graphDays.map((day) => (
                  <div className="ledger-daily-chart-day" key={day.dayKey}>
                    <strong className="ledger-daily-chart-purchases">
                      {day.purchases}
                    </strong>
                    <div className="ledger-daily-chart-bars">
                      <span
                        className="income"
                        title={`Income ${currency.format(day.income)}`}
                        style={{
                          height: day.income
                            ? `${Math.max(3, (day.income / maximumAmount) * 100)}%`
                            : "0%",
                        }}
                      />
                      <span
                        className="expense"
                        title={`Expenses ${currency.format(day.expenses)}`}
                        style={{
                          height: day.expenses
                            ? `${Math.max(3, (day.expenses / maximumAmount) * 100)}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className="ledger-daily-chart-date">
                      {new Date(`${day.dayKey}T00:00:00`).toLocaleDateString(
                        [],
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ledger-report-legend" aria-label="Graph legend">
              <span>
                <i className="income" /> Income
              </span>
              <span>
                <i className="expense" /> Expenses
              </span>
              <span>Numbers above bars: purchases</span>
            </div>
          </>
        )}
      </section>

      <section className="ledger-panel ledger-report-details">
        <div className="ledger-panel-heading">
          <div>
            <h2>Daily breakdown</h2>
            <p>Busiest purchase days first</p>
          </div>
        </div>
        {dailyReport.length === 0 ? (
          <div className="ledger-report-empty">
            No daily activity recorded for this period.
          </div>
        ) : (
          <div className="ledger-report-scroll">
            <table className="ledger-report-table">
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Purchases</th>
                  <th scope="col">Income</th>
                  <th scope="col">Expenses</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.map((day) => (
                  <tr key={day.dayKey}>
                    <th scope="row">{day.date}</th>
                    <td>{day.purchases}</td>
                    <td>{currency.format(day.income)}</td>
                    <td>{currency.format(day.expenses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
