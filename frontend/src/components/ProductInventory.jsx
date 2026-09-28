import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { currency } from "../logic/ledger.js";
import { useProductInventory } from "../hooks/useProductInventory.js";
import RecentSalesList from "./RecentSalesList.jsx";

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
    saleQuantity,
    setSaleQuantity,
    notice,
    Icon,
    singularUnit,
    periodSales,
    totalSold,
    totalRevenue,
    totalProfit,
    totalExpense,
    hasUnitCost,
    hasSellPrice,
    totalPaid,
    addStock,
    recordSale,
    updateSellPrice,
  } = useProductInventory({ businessId, period, flavorId, productName });

  return (
    <section className="ledger-product-stock">
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
          Selling price / {product.unit.slice(0, -1)}
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

      <div className="ledger-product-metrics">
        <article>
          <span>On hand</span>
          <strong>
            {inventory.quantity}{" "}
            <small>
              {inventory.quantity === 1 ? singularUnit : product.unit}
            </small>
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

      <div className="ledger-product-forms">
        <form className="ledger-panel ledger-product-form" onSubmit={addStock}>
          <div className="ledger-panel-heading">
            <div>
              <h2>Restock</h2>
              <p>Enter quantity and cost per unit</p>
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
              onChange={(event) =>
                setRestock({ ...restock, quantity: event.target.value })
              }
            />
          </label>
          <label className="ledger-field">
            Purchase cost per {singularUnit}
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={restock.unitCost}
              onChange={(event) =>
                setRestock({ ...restock, unitCost: event.target.value })
              }
            />
          </label>
          <label className="ledger-field">
            Total purchase cost
            <input
              type="text"
              value={totalPaid === null ? "" : currency.format(totalPaid)}
              readOnly
              aria-live="polite"
              placeholder="Enter quantity and unit cost"
            />
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

        <form
          className="ledger-panel ledger-product-form"
          onSubmit={recordSale}
        >
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
                      (Number(inventory.sellPrice) -
                        Number(inventory.unitCost)),
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

      {notice && (
        <p className="ledger-inventory-notice" role="status">
          {notice}
        </p>
      )}

      <RecentSalesList
        sales={periodSales.map((sale) => ({
          id: sale.id,
          occurredAt: sale.soldAt,
          business: product.name,
          description: `${sale.quantity} ${sale.quantity === 1 ? singularUnit : product.unit}`,
          amount: sale.revenue,
          profit: sale.profit,
        }))}
        subtitle={`${totalSold} ${totalSold === 1 ? singularUnit : product.unit} sold · ${currency.format(totalRevenue)} revenue`}
      />
    </section>
  );
}
