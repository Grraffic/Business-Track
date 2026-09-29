import { useEffect, useState } from "react";
import { Check, Cookie, Droplets, Snowflake, X } from "lucide-react";
import { currency, getGrahamFlavors, grahamFlavors } from "../logic/ledger.js";
import { syncLocalLedgerToSupabase } from "../services/ledgerSync.js";

function loadAllGrahamFlavors() {
  return getGrahamFlavors();
}

export default function QuickRecordModal({ isOpen, onClose, onToast }) {
  const [businessId, setBusinessId] = useState("water");
  const [flavorId, setFlavorId] = useState("mango");
  const [entryType, setEntryType] = useState("sale"); // "sale" or "expense"
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("35");
  const [cost, setCost] = useState("15");
  const [allGrahamFlavors, setAllGrahamFlavors] = useState(loadAllGrahamFlavors);

  useEffect(() => {
    const refresh = () => setAllGrahamFlavors(loadAllGrahamFlavors());
    window.addEventListener("graham-flavors-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("graham-flavors-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (!isOpen) return null;

  const handleBusinessChange = (newBiz) => {
    setBusinessId(newBiz);
    if (newBiz === "water") {
      setPrice("35");
      setCost("15");
    } else if (newBiz === "ice") {
      setPrice("20");
      setCost("8");
    } else if (newBiz === "graham") {
      setPrice("45");
      setCost("23");
    }
  };

  const qtyNum = Math.max(1, Number(quantity) || 1);
  const priceNum = Math.max(0, Number(price) || 0);
  const costNum = Math.max(0, Number(cost) || 0);
  const totalAmount = entryType === "sale" ? qtyNum * priceNum : qtyNum * costNum;
  const estimatedProfit = entryType === "sale" ? qtyNum * Math.max(0, priceNum - costNum) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    const timestamp = new Date().toISOString();
    const id = `qr-${Date.now()}`;

    if (businessId === "water") {
      const storageKey = "family-ledger-water-stock";
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      const currentQty = Number(saved.quantity) || 0;
      const sales = Array.isArray(saved.sales) ? [...saved.sales] : [];

      if (entryType === "sale") {
        sales.push({
          id,
          quantity: qtyNum,
          revenue: totalAmount,
          profit: estimatedProfit,
          soldAt: timestamp,
        });
        saved.quantity = Math.max(0, currentQty - qtyNum);
      } else {
        const restocks = Array.isArray(saved.restocks)
          ? [...saved.restocks]
          : Array.isArray(saved.purchases)
            ? [...saved.purchases]
            : [];
        restocks.push({
          id,
          quantity: qtyNum,
          unitCost: costNum,
          totalExpense: totalAmount,
          restockedAt: timestamp,
        });
        saved.restocks = restocks;
        saved.quantity = currentQty + qtyNum;
        saved.unitCost = String(costNum);
      }
      saved.sales = sales;
      saved.sellPrice = String(priceNum);
      saved.name = "Water";
      saved.unit = "gallons";
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } else if (businessId === "ice") {
      const storageKey = "family-ledger-ice-water-stock";
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      const currentQty = Number(saved.quantity) || 0;
      const sales = Array.isArray(saved.sales) ? [...saved.sales] : [];
      const production = Array.isArray(saved.production) ? [...saved.production] : [];

      if (entryType === "sale") {
        sales.push({
          id,
          quantity: qtyNum,
          revenue: totalAmount,
          profit: estimatedProfit,
          soldAt: timestamp,
        });
        saved.quantity = Math.max(0, currentQty - qtyNum);
      } else {
        production.push({
          id,
          quantity: qtyNum,
          totalExpense: totalAmount,
          producedAt: timestamp,
        });
        saved.quantity = currentQty + qtyNum;
        saved.unitCost = String(costNum);
      }
      saved.sales = sales;
      saved.production = production;
      saved.sellPrice = String(priceNum);
      saved.name = "Ice";
      saved.unit = "bags";
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } else if (businessId === "graham") {
      const storageKey = `family-ledger-graham-${flavorId}-stock`;
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      const currentQty = Number(saved.quantity) || 0;
      const sales = Array.isArray(saved.sales) ? [...saved.sales] : [];
      const production = Array.isArray(saved.production) ? [...saved.production] : [];
      const flavorName =
        allGrahamFlavors.find((f) => f.id === flavorId)?.name ||
        grahamFlavors.find((f) => f.id === flavorId)?.name ||
        "Mango";

      if (entryType === "sale") {
        sales.push({
          id,
          quantity: qtyNum,
          revenue: totalAmount,
          profit: estimatedProfit,
          ingredientCost: qtyNum * costNum,
          soldAt: timestamp,
        });
        saved.quantity = Math.max(0, currentQty - qtyNum);
      } else {
        production.push({
          id,
          quantity: qtyNum,
          ingredientExpense: totalAmount,
          producedAt: timestamp,
        });
        saved.quantity = currentQty + qtyNum;
        saved.unitCost = String(costNum);
        saved.ingredientExpenses = (Number(saved.ingredientExpenses) || 0) + totalAmount;
      }
      saved.sales = sales;
      saved.production = production;
      saved.sellPrice = String(priceNum);
      saved.name = `${flavorName} Graham Bar`;
      saved.unit = "bars";
      localStorage.setItem(storageKey, JSON.stringify(saved));
    }

    window.dispatchEvent(new CustomEvent("ledger-updated"));
    syncLocalLedgerToSupabase().catch(() => {});
    if (onToast) {
      onToast(
        entryType === "sale"
          ? `Recorded sale of ${qtyNum} ${businessId === "water" ? "gallons" : businessId === "ice" ? "bags" : "bars"} for ${currency.format(totalAmount)}!`
          : `Added restock of ${qtyNum} units (${currency.format(totalAmount)})!`,
      );
    }
    onClose();
  };

  const getUnitName = () => {
    if (businessId === "water") return "gallons";
    if (businessId === "ice") return "bags";
    return "bars";
  };

  return (
    <div className="ledger-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ledger-modal ledger-quick-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ledger-modal-heading">
          <div>
            <span className="ledger-small-label">NEW ENTRY</span>
            <h2>Record transaction</h2>
            <p>Log a sale or restock expense. All totals update immediately.</p>
          </div>
          <button className="ledger-stock-action" type="button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ledger-quick-form">
          {/* Transaction Type Tabs */}
          <div className="ledger-quick-tabs">
            <button
              type="button"
              className={`ledger-quick-tab ${entryType === "sale" ? "active" : ""}`}
              onClick={() => setEntryType("sale")}
            >
              Sale (Income)
            </button>
            <button
              type="button"
              className={`ledger-quick-tab ${entryType === "expense" ? "active" : ""}`}
              onClick={() => setEntryType("expense")}
            >
              Restock (Expense)
            </button>
          </div>

          {/* Business Selector */}
          <div className="ledger-quick-biz-select">
            <button
              type="button"
              className={`ledger-quick-biz-btn ${businessId === "water" ? "active" : ""}`}
              onClick={() => handleBusinessChange("water")}
            >
              <Droplets size={16} />
              <span>Water</span>
            </button>
            <button
              type="button"
              className={`ledger-quick-biz-btn ${businessId === "ice" ? "active" : ""}`}
              onClick={() => handleBusinessChange("ice")}
            >
              <Snowflake size={16} />
              <span>Ice</span>
            </button>
            <button
              type="button"
              className={`ledger-quick-biz-btn ${businessId === "graham" ? "active" : ""}`}
              onClick={() => handleBusinessChange("graham")}
            >
              <Cookie size={16} />
              <span>Graham Bar</span>
            </button>
          </div>

          {/* Graham Flavor Picker if Graham Bar */}
          {businessId === "graham" && (
            <div className="ledger-field">
              <label>Select flavor</label>
              <select value={flavorId} onChange={(e) => setFlavorId(e.target.value)}>
                {allGrahamFlavors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} Graham Bar
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity with quick buttons */}
          <div className="ledger-field">
            <label>Quantity ({getUnitName()})</label>
            <div className="ledger-qty-row">
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <div className="ledger-qty-steppers">
                <button type="button" onClick={() => setQuantity("1")}>1</button>
                <button type="button" onClick={() => setQuantity("5")}>5</button>
                <button type="button" onClick={() => setQuantity("10")}>10</button>
                <button type="button" onClick={() => setQuantity("20")}>20</button>
              </div>
            </div>
          </div>

          {/* Price & Cost Fields */}
          <div className="ledger-form-grid">
            <label className="ledger-field">
              <span>{entryType === "sale" ? "Selling price / unit" : "Purchase cost / unit"}</span>
              <span className="ledger-money-input">
                <span>₱</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={entryType === "sale" ? price : cost}
                  onChange={(e) => (entryType === "sale" ? setPrice(e.target.value) : setCost(e.target.value))}
                />
              </span>
            </label>
            {entryType === "sale" && (
              <label className="ledger-field">
                <span>Est. unit cost</span>
                <span className="ledger-money-input">
                  <span>₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </span>
              </label>
            )}
          </div>

          {/* Summary Box */}
          <div className="ledger-quick-summary">
            <div className="ledger-quick-sum-item">
              <span>Total amount:</span>
              <strong>{currency.format(totalAmount)}</strong>
            </div>
            {entryType === "sale" && (
              <div className="ledger-quick-sum-item profit">
                <span>Est. Net Profit:</span>
                <strong>{currency.format(estimatedProfit)}</strong>
              </div>
            )}
          </div>

          <div className="ledger-modal-actions">
            <button type="button" className="ledger-button secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ledger-button primary">
              <Check size={16} /> Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
