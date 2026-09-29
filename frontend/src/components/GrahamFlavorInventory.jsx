import { ArrowDownLeft, ArrowUpRight, Cookie } from "lucide-react";
import { currency } from "../logic/ledger.js";
import { useGrahamFlavorInventory } from "../hooks/useGrahamFlavorInventory.js";
import RecentSalesList from "./RecentSalesList.jsx";

export default function GrahamFlavorInventory({
  flavorId,
  flavorName,
  period = "month",
}) {
  const {
    inventory,
    productionInput,
    setProductionInput,
    saleQuantity,
    setSaleQuantity,
    notice,
    pendingIngredientExpense,
    periodSales,
    income,
    periodIngredientExpenses,
    potentialIncome,
    netProfit,
    projectedProfit,
    averageIngredientCostPerBar,
    addProduction,
    recordSale,
    updateSellPrice,
  } = useGrahamFlavorInventory({ flavorId, flavorName, period });

  return (
    <section className="ledger-product-stock">
      <div className="ledger-product-stock-heading">
        <div className="ledger-product-title">
          <span className="ledger-product-icon graham">
            <Cookie size={19} />
          </span>
          <div>
            <span className="ledger-small-label">FLAVOR STOCK</span>
            <h2>{flavorName} Graham Bar</h2>
          </div>
        </div>
        <label className="ledger-field ledger-product-price">
          Selling price
          <span className="ledger-money-input">
            <span>₱</span>
            <input
              aria-label={`${flavorName} Graham Bar selling price per bar`}
              type="number"
              min="0.01"
              step="0.01"
              value={inventory.sellPrice}
              onChange={(event) => updateSellPrice(event.target.value)}
            />
          </span>
        </label>
      </div>

      <div className="ledger-product-metrics ledger-graham-metrics">
        <article>
          <span>On hand</span>
          <strong>
            {inventory.quantity}{" "}
            <small>{inventory.quantity === 1 ? "bar" : "bars"}</small>
          </strong>
        </article>
        <article>
          <span>Income</span>
          <strong>{currency.format(income)}</strong>
        </article>
        <article>
          <span>Ingredient expenses</span>
          <strong>{currency.format(periodIngredientExpenses)}</strong>
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
              <p>Ingredient purchases for this flavor</p>
            </div>
            <ArrowDownLeft size={17} />
          </div>
          <label className="ledger-field">
            Bars produced
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
            Total ingredient expense
            <input
              type="text"
              value={currency.format(pendingIngredientExpense)}
              readOnly
              aria-live="polite"
            />
          </label>
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
              <p>Sales reduce the available flavor stock</p>
            </div>
            <ArrowUpRight size={17} />
          </div>
          <label className="ledger-field">
            Quantity sold (bars)
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
                  (Number(inventory.sellPrice || 0) -
                    averageIngredientCostPerBar),
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

      <RecentSalesList
        sales={periodSales.map((sale) => ({
          id: sale.id,
          occurredAt: sale.soldAt,
          business: flavorName,
          description: `${sale.quantity} ${sale.quantity === 1 ? "bar" : "bars"}`,
          amount: sale.income,
          profit:
            Number(sale.profit) ||
            sale.income - (Number(sale.ingredientCost) || 0),
        }))}
        subtitle={`${periodSales.reduce((sum, sale) => sum + sale.quantity, 0)} bars sold · ${currency.format(income)} income`}
      />
    </section>
  );
}
