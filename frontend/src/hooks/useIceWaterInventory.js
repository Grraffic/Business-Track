import { useEffect, useRef, useState } from "react";
import { currency, isInPeriod } from "../logic/ledger.js";
import { syncLocalLedgerToSupabase } from "../services/ledgerSync.js";

const storageKey = "family-ledger-ice-water-stock";
const totalExpenseDefault = "30";
const sellPriceDefault = 5;

function readInventory() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (saved && Number.isInteger(saved.quantity)) {
      const production = Array.isArray(saved.production)
        ? saved.production
        : [];
      const sales = Array.isArray(saved.sales) ? saved.sales : [];
      return {
        quantity: 0,
        unitCost: 0,
        sellPrice: sellPriceDefault,
        ...saved,
        production,
        sales,
      };
    }
  } catch {}

  return {
    quantity: 0,
    unitCost: 0,
    sellPrice: sellPriceDefault,
    production: [],
    sales: [],
  };
}

export function useIceWaterInventory(period = "month") {
  const [inventory, setInventory] = useState(readInventory);
  const [productionInput, setProductionInput] = useState({
    quantity: "",
    totalExpense: totalExpenseDefault,
  });
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(inventory));
    window.dispatchEvent(new CustomEvent("ledger-updated"));
    syncLocalLedgerToSupabase().catch((error) =>
      setNotice(`Saved locally, but Supabase sync failed: ${error.message}`),
    );
  }, [inventory]);

  const periodSales = inventory.sales.filter((sale) =>
    isInPeriod(sale.soldAt, period),
  );
  const periodProduction = inventory.production.filter((batch) =>
    isInPeriod(batch.producedAt, period),
  );
  const income = periodSales.reduce(
    (sum, sale) => sum + (Number(sale.revenue) || 0),
    0,
  );
  const expenses = periodProduction.reduce(
    (sum, batch) => sum + (Number(batch.totalExpense) || 0),
    0,
  );
  const netProfit = periodSales.reduce(
    (sum, sale) => sum + (Number(sale.profit) || 0),
    0,
  );
  const cupsSold = periodSales.reduce(
    (sum, sale) => sum + (Number(sale.quantity) || 0),
    0,
  );
  const quantity = Number(productionInput.quantity);
  const totalBatchExpense = Number(productionInput.totalExpense);
  const batchExpense =
    productionInput.totalExpense !== "" &&
    Number.isFinite(totalBatchExpense) &&
    totalBatchExpense >= 0
      ? totalBatchExpense
      : null;
  const costPerCup =
    batchExpense !== null && Number.isInteger(quantity) && quantity > 0
      ? batchExpense / quantity
      : null;

  const addProduction = (event) => {
    event.preventDefault();
    if (!Number.isInteger(quantity) || quantity <= 0 || batchExpense === null) {
      setNotice("Enter cups produced and the total batch expense.");
      return;
    }

    const production = {
      id: `ice-production-${Date.now()}`,
      quantity,
      totalExpense: batchExpense,
      producedAt: new Date().toISOString(),
    };
    const newStock = inventory.quantity + quantity;
    const unitCost =
      (inventory.quantity * inventory.unitCost + batchExpense) / newStock;
    setInventory((current) => ({
      ...current,
      quantity: newStock,
      unitCost,
      production: [production, ...current.production],
    }));
    setProductionInput({
      quantity: "",
      totalExpense: totalExpenseDefault,
    });
    setNotice(`Added ${quantity} ice water cups to stock.`);
  };

  const recordSale = (event) => {
    event.preventDefault();
    const soldQuantity = Number(saleQuantity);
    if (!Number.isInteger(soldQuantity) || soldQuantity <= 0) {
      setNotice("Enter a whole number of cups sold.");
      return;
    }
    if (soldQuantity > inventory.quantity) {
      setNotice(`Only ${inventory.quantity} cups are in stock.`);
      return;
    }

    const revenue = soldQuantity * Number(inventory.sellPrice);
    const profit = revenue - soldQuantity * inventory.unitCost;
    const sale = {
      id: `ice-sale-${Date.now()}`,
      quantity: soldQuantity,
      revenue,
      profit,
      soldAt: new Date().toISOString(),
    };
    setInventory((current) => ({
      ...current,
      quantity: current.quantity - soldQuantity,
      sales: [sale, ...current.sales],
    }));
  };

  const deleteSale = (saleId) => {
    const saleToDelete = inventory.sales.find((s) => s.id === saleId);
    if (!saleToDelete) return;
    const restoredQty = Number(saleToDelete.quantity) || 0;
    setInventory((current) => ({
      ...current,
      quantity: current.quantity + restoredQty,
      sales: current.sales.filter((s) => s.id !== saleId),
    }));
  };

  const updateSellPrice = (value) => {
    const sellPrice = Number(value);
    setInventory((current) => ({
      ...current,
      sellPrice:
        value === ""
          ? ""
          : Number.isFinite(sellPrice)
            ? sellPrice
            : current.sellPrice,
    }));
  };

  return {
    inventory,
    productionInput,
    setProductionInput,
    saleQuantity,
    setSaleQuantity,
    notice,
    setNotice,
    periodSales,
    income,
    expenses,
    netProfit,
    cupsSold,
    costPerCup,
    addProduction,
    recordSale,
    deleteSale,
    updateSellPrice,
  };
}
