import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Calendar, TrendingUp } from "lucide-react";
import { currency } from "../logic/ledger.js";

export default function IncomeExpenseReportPage({
  range,
  summary,
  dailyReport,
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const graphDays = [...dailyReport].sort((left, right) =>
    left.dayKey.localeCompare(right.dayKey),
  );
  const maximumAmount = graphDays.reduce(
    (maximum, day) => Math.max(maximum, day.income, day.expenses),
    1,
  );

  const activeDayData = hoveredDay || (graphDays.length > 0 ? graphDays[graphDays.length - 1] : null);

  return (
    <div className="ledger-report-page">
      <section className="ledger-report-summary" aria-label="Period totals">
        <article>
          <div className="report-summary-header">
            <span>Total Income</span>
            <ArrowUpRight size={18} className="income-icon" />
          </div>
          <strong>{currency.format(summary.income)}</strong>
        </article>
        <article>
          <div className="report-summary-header">
            <span>Total Expenses</span>
            <ArrowDownLeft size={18} className="expense-icon" />
          </div>
          <strong>{currency.format(summary.expenses)}</strong>
        </article>
        <article>
          <div className="report-summary-header">
            <span>Net Profit</span>
            <TrendingUp size={18} className="profit-icon" />
          </div>
          <strong className={summary.profit >= 0 ? "positive-val" : "negative-val"}>
            {currency.format(summary.profit)}
          </strong>
        </article>
      </section>

      <section className="ledger-panel ledger-report-panel">
        <div className="ledger-panel-heading">
          <div>
            <h2>Daily income, expenses &amp; purchases</h2>
            <p>Selected period · {range}</p>
          </div>

          {activeDayData && (
            <div className="ledger-chart-hover-pill">
              <Calendar size={14} />
              <span>
                <strong>{activeDayData.date || activeDayData.dayKey}:</strong> +{currency.format(activeDayData.income)} / −{currency.format(activeDayData.expenses)} ({activeDayData.purchases} sales)
              </span>
            </div>
          )}
        </div>

        <p className="ledger-report-note">
          Hover or tap on any bar below to view the daily breakdown.
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
                aria-label={`Daily income and expense graph for ${range}`}
              >
                {graphDays.map((day) => {
                  const isHovered = hoveredDay?.dayKey === day.dayKey;
                  return (
                    <div
                      className={`ledger-daily-chart-day ${isHovered ? "active" : ""}`}
                      key={day.dayKey}
                      onMouseEnter={() => setHoveredDay(day)}
                      onClick={() => setHoveredDay(day)}
                    >
                      <strong className="ledger-daily-chart-purchases">
                        {day.purchases}
                      </strong>
                      <div className="ledger-daily-chart-bars">
                        <span
                          className="income"
                          title={`Income: ${currency.format(day.income)}`}
                          style={{
                            height: day.income
                              ? `${Math.max(4, (day.income / maximumAmount) * 100)}%`
                              : "0%",
                          }}
                        />
                        <span
                          className="expense"
                          title={`Expenses: ${currency.format(day.expenses)}`}
                          style={{
                            height: day.expenses
                              ? `${Math.max(4, (day.expenses / maximumAmount) * 100)}%`
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
                  );
                })}
              </div>
            </div>
            <div className="ledger-report-legend" aria-label="Graph legend">
              <span>
                <i className="income" /> Income
              </span>
              <span>
                <i className="expense" /> Expenses
              </span>
              <span>Numbers above bars: sales recorded</span>
            </div>
          </>
        )}
      </section>

      <section className="ledger-panel ledger-report-details">
        <div className="ledger-panel-heading">
          <div>
            <h2>Daily breakdown</h2>
            <p>Chronological performance table</p>
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
                  <th scope="col">Date</th>
                  <th scope="col">Sales count</th>
                  <th scope="col">Income</th>
                  <th scope="col">Expenses</th>
                  <th scope="col">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.map((day) => {
                  const dayProfit = day.income - day.expenses;
                  const isRowSelected = hoveredDay?.dayKey === day.dayKey;
                  return (
                    <tr
                      key={day.dayKey}
                      className={isRowSelected ? "row-selected" : ""}
                      onMouseEnter={() => setHoveredDay(day)}
                    >
                      <th scope="row"><strong>{day.date}</strong></th>
                      <td>{day.purchases}</td>
                      <td className="text-income">{currency.format(day.income)}</td>
                      <td className="text-expense">{currency.format(day.expenses)}</td>
                      <td className={dayProfit >= 0 ? "text-profit" : "text-expense"}>
                        {currency.format(dayProfit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
