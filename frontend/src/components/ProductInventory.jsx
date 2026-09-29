import { useState, useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, X } from "lucide-react";
import { currency } from "../logic/ledger.js";
import { useProductInventory } from "../hooks/useProductInventory.js";

export default function ProductInventory({
  businessId,
  period = "month",
  flavorId,
  productName,
}) {
  const {
    product,
    inventory,
    restock,
    setRestock,
    updateRestockQuantity,
    updateRestockUnitCost,
    updateRestockTotalCost,
    saleQuantity,
    setSaleQuantity,
    notice,
    setNotice,
    Icon,
    singularUnit,
    periodSales,
    periodRestocks,
    totalSold,
    totalRevenue,
    totalProfit,
    totalExpense,
    totalRestockExpense,
    hasUnitCost,
    hasSellPrice,
    totalPaid,
    addStock,
    recordSale,
    deleteSale,
    deleteRestock,
    updateSellPrice,
    latestCarryOver,
  } = useProductInventory({ businessId, period, flavorId, productName });

  // ── Merged activity list (sales + restocks) ──────────────────────────
  const [filterType, setFilterType] = useState("all"); // "all" | "income" | "expense"

  const allActivity = useMemo(() => {
    const sales = periodSales.map((s) => ({
      id: `sale-${s.id}`,
      type: "income",
      date: s.soldAt,
      qty: `${s.quantity} ${s.quantity === 1 ? singularUnit : product.unit}`,
      label: `Income: ${currency.format(s.revenue)}`,
      badge: `${currency.format(s.profit)} profit`,
      badgeClass: "sale-profit-badge",
      amount: s.revenue,
    }));

    const restocks = (periodRestocks ?? []).map((r) => ({
      id: `restock-${r.id}`,
      type: "expense",
      date: r.restockedAt ?? r.purchasedAt ?? r.occurredAt,
      qty: `${r.quantity} ${r.quantity === 1 ? singularUnit : product.unit}`,
      label: `Cost: ${currency.format(Number(r.unitCost) || 0)} / ${singularUnit}`,
      badge: `−${currency.format(Number(r.totalExpense ?? r.amount ?? r.totalPaid) || 0)} expense`,
      badgeClass: "sale-expense-badge",
      amount: Number(r.totalExpense ?? r.amount ?? r.totalPaid) || 0,
    }));

    return [...sales, ...restocks].sort(
      (a, b) => Date.parse(b.date) - Date.parse(a.date),
    );
  }, [periodSales, periodRestocks, singularUnit, product.unit]);

  const visibleActivity = useMemo(() => {
    if (filterType === "all") return allActivity;
    return allActivity.filter((e) => e.type === filterType);
  }, [allActivity, filterType]);

  return (
    <section className="ledger-product-stock">
      {/* header + price */}
      <div className="ledger-product-stock-heading">
        <div className="ledger-product-title">
          <span className={`ledger-product-icon ${businessId}`}>
            <Icon size={19} />
          </span>
          <div>
            <span className="ledger-small-label">LIVE STOCK</span>
            <h2>Stock &amp; sales</h2>
          </div>
        </div>
        <label className="ledger-field ledger-product-price">
          Selling price
          <span className="ledger-money-input">
            <span>₱</span>
            <input
              aria-label={`${product.name} selling price per ${product.unit.slice(0, -1)}`}
              type="number"
              min="0"
              step="0.01"
              value={inventory.sellPrice}
              onChange={(event) => updateSellPrice(event.target.value)}
            />
          </span>
        </label>
      </div>

      {latestCarryOver && businessId === "water" && (
        <div className="ledger-carryover-banner">
          <span>📦</span>
          <span>
            <strong>{latestCarryOver.quantity} gallon{latestCarryOver.quantity !== 1 ? "s" : ""}</strong> carried over from {latestCarryOver.fromDate} to today.
          </span>
        </div>
      )}

      {/* metrics */}
      <div className="ledger-product-metrics">
        <article>
          <span>On hand</span>
          <strong>
            {inventory.quantity}{" "}
            <small>{inventory.quantity === 1 ? singularUnit : product.unit}</small>
          </strong>
        </article>
        <article>
          <span>Income</span>
          <strong>{currency.format(totalRevenue)}</strong>
        </article>
        <article>
          <span>Expense</span>
          <strong>{currency.format(totalExpense)}</strong>
        </article>
        <article>
          <span>Net profit</span>
          <strong>{currency.format(totalProfit)}</strong>
        </article>
      </div>

      {/* forms */}
      <div className="ledger-product-forms">
        <form className="ledger-panel ledger-product-form" onSubmit={addStock}>
          <div className="ledger-panel-heading">
            <div>
              <h2>Restock</h2>
              <p>Enter quantity and cost per unit or total cost</p>
            </div>
            <ArrowDownLeft size={17} />
          </div>
          <label className="ledger-field">
            Quantity bought ({product.unit})
            <input
              required
              min="1"
              step="1"
              type="number"
              value={restock.quantity}
              onChange={(event) => updateRestockQuantity(event.target.value)}
              placeholder="e.g. 19"
            />
          </label>
          <label className="ledger-field">
            Purchase cost per {singularUnit}
            <span className="ledger-money-input">
              <span>₱</span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={restock.unitCost}
                onChange={(event) => updateRestockUnitCost(event.target.value)}
                placeholder="0.00"
              />
            </span>
          </label>
          <label className="ledger-field">
            Total purchase cost
            <span className="ledger-money-input">
              <span>₱</span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={
                  restock.totalCost !== ""
                    ? restock.totalCost
                    : totalPaid !== null
                      ? String(totalPaid)
                      : ""
                }
                onChange={(event) => updateRestockTotalCost(event.target.value)}
                placeholder="0.00"
              />
            </span>
          </label>
          <p className="ledger-product-hint">
            Average cost:{" "}
            {hasUnitCost
              ? currency.format(Number(inventory.unitCost))
              : "Not set"}{" "}
            per {singularUnit}
          </p>
          <button className="ledger-button secondary" type="submit">
            Add stock
          </button>
        </form>

        <form className="ledger-panel ledger-product-form" onSubmit={recordSale}>
          <div className="ledger-panel-heading">
            <div>
              <h2>Record a sale</h2>
              <p>Stock is deducted and profit is calculated</p>
            </div>
            <ArrowUpRight size={17} />
          </div>
          <label className="ledger-field">
            Quantity sold ({product.unit})
            <input
              required
              min="1"
              max={inventory.quantity}
              step="1"
              type="number"
              value={saleQuantity}
              onChange={(event) => setSaleQuantity(event.target.value)}
            />
          </label>
          <div className="ledger-sale-preview">
            <span>Expected profit</span>
            <strong>
              {hasSellPrice && hasUnitCost
                ? currency.format(
                    Number(saleQuantity || 0) *
                      (Number(inventory.sellPrice) - Number(inventory.unitCost)),
                  )
                : "—"}
            </strong>
          </div>
          <button
            className="ledger-button primary"
            type="submit"
            disabled={inventory.quantity === 0 || !hasSellPrice || !hasUnitCost}
          >
            Save sale
          </button>
        </form>
      </div>

      {/* notice banner */}
      {notice && (
        <div className="ledger-inventory-notice-banner" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="ledger-notice-close"
            onClick={() => setNotice("")}
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Merged Recent Activity ───────────────────────────────────── */}
      <section className="ledger-panel ledger-activity">
        <div className="ledger-panel-heading ledger-activity-heading">
          <div>
            <h2>Recent activity</h2>
            <p>{visibleActivity.length} {visibleActivity.length === 1 ? "entry" : "entries"} recorded</p>
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

        {visibleActivity.length === 0 ? (
          <div className="ledger-empty-stock">
            <strong>No entries found</strong>
            <span>Record a sale or restock above to see activity here.</span>
          </div>
        ) : (
          <div className="ledger-product-sale-list">
            {visibleActivity.slice(0, 12).map((entry) => (
              <div className="ledger-product-sale" key={entry.id}>
                <span className={`ledger-transaction-icon ${entry.type}`} style={{ flexShrink: 0 }}>
                  {entry.type === "expense"
                    ? <ArrowDownLeft size={15} />
                    : <ArrowUpRight size={15} />}
                </span>
                <span className="sale-date">
                  {new Date(entry.date).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <strong className="sale-desc">{entry.qty}</strong>
                <span className="sale-revenue">{entry.label}</span>
                <span className={entry.badgeClass}>{entry.badge}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
