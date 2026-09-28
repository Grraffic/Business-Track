import { ArrowDownLeft, ArrowUpRight, Snowflake } from "lucide-react";
import { currency } from "../logic/ledger.js";
import { useIceWaterInventory } from "../hooks/useIceWaterInventory.js";

export default function IceWaterInventory({ period = "month" }) {
  const {
    inventory,
    productionInput,
    setProductionInput,
    saleQuantity,
    setSaleQuantity,
    notice,
    periodSales,
    income,
    expenses,
    netProfit,
    cupsSold,
    costPerCup,
    addProduction,
    recordSale,
    updateSellPrice,
  } = useIceWaterInventory(period);

  return (
    <section className="ledger-product-stock">
      <div className="ledger-product-stock-heading">
        <div className="ledger-product-title">
          <span className="ledger-product-icon ice">
            <Snowflake size={19} />
          </span>
          <div>
            <span className="ledger-small-label">ICE WATER</span>
            <h2>Stock &amp; sales</h2>
          </div>
        </div>
        <label className="ledger-field ledger-product-price">
          Selling price
          <span className="ledger-money-input">
            <span>₱</span>
            <input
              aria-label="Ice water selling price per cup"
              type="number"
              min="0.01"
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
            <small>{inventory.quantity === 1 ? "cup" : "cups"}</small>
          </strong>
        </article>
        <article>
          <span>Income</span>
          <strong>{currency.format(income)}</strong>
        </article>
        <article>
          <span>Expense</span>
          <strong>{currency.format(expenses)}</strong>
        </article>
        <article>
          <span>Net profit</span>
          <strong>{currency.format(netProfit)}</strong>
        </article>
      </div>

      <div className="ledger-product-forms">
        <form
          className="ledger-panel ledger-product-form"
          onSubmit={addProduction}
        >
          <div className="ledger-panel-heading">
            <div>
              <h2>Add production</h2>
              <p>Enter the total batch expense</p>
            </div>
            <ArrowDownLeft size={17} />
          </div>
          <label className="ledger-field">
            Produce
            <input
              required
              min="1"
              step="1"
              type="number"
              value={productionInput.quantity}
              onChange={(event) =>
                setProductionInput({
                  ...productionInput,
                  quantity: event.target.value,
                })
              }
            />
          </label>
          <label className="ledger-field">
            Total expense
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={productionInput.totalExpense}
              onChange={(event) =>
                setProductionInput({
                  ...productionInput,
                  totalExpense: event.target.value,
                })
              }
            />
          </label>
          <p className="ledger-product-hint">
            Cost per cup:{" "}
            {costPerCup === null ? "—" : currency.format(costPerCup)}
          </p>
          <button className="ledger-button secondary" type="submit">
            Add production
          </button>
        </form>

        <form
          className="ledger-panel ledger-product-form"
          onSubmit={recordSale}
        >
          <div className="ledger-panel-heading">
            <div>
              <h2>Record a sale</h2>
              <p>Sales reduce cups on hand</p>
            </div>
            <ArrowUpRight size={17} />
          </div>
          <label className="ledger-field">
            Ice waters sold (cups)
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
              {currency.format(
                Number(saleQuantity || 0) *
                  (Number(inventory.sellPrice) - inventory.unitCost),
              )}
            </strong>
          </div>
          <button
            className="ledger-button primary"
            type="submit"
            disabled={
              inventory.quantity === 0 || Number(inventory.sellPrice) <= 0
            }
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

      <section className="ledger-panel ledger-product-sales">
        <div className="ledger-panel-heading">
          <div>
            <h2>Recent sales</h2>
            <p>
              {cupsSold} {cupsSold === 1 ? "cup" : "cups"} sold ·{" "}
              {currency.format(income)} income
            </p>
          </div>
        </div>
        {periodSales.length === 0 ? (
          <div className="ledger-empty-stock">
            <strong>No sales recorded</strong>
            <span>Sales will appear here for the selected period.</span>
          </div>
        ) : (
          <div className="ledger-product-sale-list">
            {periodSales.slice(0, 8).map((sale) => (
              <div className="ledger-product-sale" key={sale.id}>
                <span>{new Date(sale.soldAt).toLocaleString()}</span>
                <strong>
                  {sale.quantity} {sale.quantity === 1 ? "cup" : "cups"}
                </strong>
                <span>Income {currency.format(sale.revenue)}</span>
                <strong>{currency.format(sale.profit)} profit</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
