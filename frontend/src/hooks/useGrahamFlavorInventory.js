import { useEffect, useState } from "react";
import { currency, isInPeriod } from "../logic/ledger.js";
import { syncLocalLedgerToSupabase } from "../services/ledgerSync.js";

function readFlavorInventory(flavorId) {
  const defaults = {
    quantity: 0,
    sellPrice: 30,
    ingredientExpenses: 0,
    production: [],
    sales: [],
  };

  try {
    const saved = JSON.parse(
      localStorage.getItem(`family-ledger-graham-${flavorId}-stock`) ?? "null",
    );
    if (saved && Number.isInteger(saved.quantity)) {
      const savedSellPrice = Number(saved.sellPrice);
      const ingredientExpenses = Number(saved.ingredientExpenses) || 0;
      const production = Array.isArray(saved.production)
        ? saved.production
        : [];
      const totalProduced = production.reduce(
        (sum, batch) => sum + (Number(batch.quantity) || 0),
        0,
      );
      const averageIngredientCostPerBar =
        totalProduced > 0 ? ingredientExpenses / totalProduced : 0;
      const sales = Array.isArray(saved.sales)
        ? saved.sales.map((sale) => {
            const income = Number(sale.income ?? sale.revenue) || 0;
            const recordedProfit = Number(sale.profit);
            const ingredientCost =
              sale.ingredientCost !== undefined &&
              Number.isFinite(Number(sale.ingredientCost))
                ? Number(sale.ingredientCost)
                : Number.isFinite(recordedProfit)
                  ? Math.max(0, income - recordedProfit)
                  : (Number(sale.quantity) || 0) * averageIngredientCostPerBar;
            return { ...sale, income, ingredientCost };
          })
        : [];

      return {
        ...defaults,
        ...saved,
        sellPrice: savedSellPrice > 0 ? savedSellPrice : defaults.sellPrice,
        ingredientExpenses,
        production,
        sales,
      };
    }
  } catch {}

  return defaults;
}

function readIngredientPurchases() {
  try {
    const purchases = JSON.parse(
      localStorage.getItem("family-ledger-demo-purchases") ?? "[]",
    );
    return Array.isArray(purchases) ? purchases : [];
  } catch {
    return [];
  }
}

function getPendingIngredientPurchases(flavorId) {
  return readIngredientPurchases().filter(
    (purchase) =>
      purchase.flavorId === flavorId && !purchase.allocatedToProduction,
  );
}

export function useGrahamFlavorInventory({
  flavorId,
  flavorName,
  period = "month",
}) {
  const storageKey = `family-ledger-graham-${flavorId}-stock`;
  const [inventory, setInventory] = useState(() =>
    readFlavorInventory(flavorId),
  );
  const [productionInput, setProductionInput] = useState({ quantity: "" });
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [notice, setNotice] = useState("");
  const [pendingIngredientExpense, setPendingIngredientExpense] = useState(() =>
    getPendingIngredientPurchases(flavorId).reduce(
      (sum, purchase) => sum + Number(purchase.totalPaid || 0),
      0,
    ),
  );

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(inventory));
    syncLocalLedgerToSupabase().catch((error) =>
      setNotice(`Saved locally, but Supabase sync failed: ${error.message}`),
    );
  }, [inventory, storageKey]);

  useEffect(() => {
    const refreshPendingExpense = () => {
      setPendingIngredientExpense(
        getPendingIngredientPurchases(flavorId).reduce(
          (sum, purchase) => sum + Number(purchase.totalPaid || 0),
          0,
        ),
      );
    };
    window.addEventListener(
      "family-ledger-purchases-updated",
      refreshPendingExpense,
    );
    window.addEventListener("storage", refreshPendingExpense);
    return () => {
      window.removeEventListener(
        "family-ledger-purchases-updated",
        refreshPendingExpense,
      );
      window.removeEventListener("storage", refreshPendingExpense);
    };
  }, [flavorId]);

  const periodSales = inventory.sales.filter((sale) =>
    isInPeriod(sale.soldAt, period),
  );
  const periodProduction = inventory.production.filter((batch) =>
    isInPeriod(batch.producedAt, period),
  );
  const income = periodSales.reduce((sum, sale) => sum + sale.income, 0);
  const costOfGoodsSold = periodSales.reduce(
    (sum, sale) => sum + (Number(sale.ingredientCost) || 0),
    0,
  );
  const totalProduced = inventory.production.reduce(
    (sum, batch) => sum + batch.quantity,
    0,
  );
  const averageIngredientCostPerBar =
    totalProduced > 0 ? inventory.ingredientExpenses / totalProduced : 0;
  const periodIngredientExpenses = periodProduction.reduce(
    (sum, batch) => sum + (Number(batch.ingredientExpense) || 0),
    0,
  );
  const potentialIncome = inventory.quantity * inventory.sellPrice;
  const netProfit = income - costOfGoodsSold;
  const projectedProfit =
    income + potentialIncome - inventory.ingredientExpenses;

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

  const addProduction = (event) => {
    event.preventDefault();
    const quantity = Number(productionInput.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setNotice("Enter the number of bars produced.");
      return;
    }

    const pendingPurchases = getPendingIngredientPurchases(flavorId);
    const ingredientExpense = pendingPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalPaid || 0),
      0,
    );
    const production = {
      id: `production-${Date.now()}`,
      quantity,
      ingredientExpense,
      producedAt: new Date().toISOString(),
    };
    if (pendingPurchases.length > 0) {
      const pendingIds = new Set(
        pendingPurchases.map((purchase) => purchase.id),
      );
      localStorage.setItem(
        "family-ledger-demo-purchases",
        JSON.stringify(
          readIngredientPurchases().map((purchase) =>
            pendingIds.has(purchase.id)
              ? {
                  ...purchase,
                  allocatedToProduction: true,
                  productionId: production.id,
                }
              : purchase,
          ),
        ),
      );
      window.dispatchEvent(new Event("family-ledger-purchases-updated"));
    }
    setInventory((current) => ({
      ...current,
      quantity: current.quantity + quantity,
      ingredientExpenses: current.ingredientExpenses + ingredientExpense,
      production: [production, ...current.production],
    }));
    setPendingIngredientExpense(0);
    setProductionInput({ quantity: "" });
    setNotice(
      `Added ${quantity} ${quantity === 1 ? "bar" : "bars"} of ${flavorName}.`,
    );
  };

  const recordSale = (event) => {
    event.preventDefault();
    const quantity = Number(saleQuantity);
    const sellPrice = Number(inventory.sellPrice);
    if (!Number.isFinite(sellPrice) || sellPrice <= 0) {
      setNotice("Enter a selling price before recording a sale.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setNotice("Enter a whole number of bars to sell.");
      return;
    }
    if (quantity > inventory.quantity) {
      setNotice(`Only ${inventory.quantity} bars are in stock.`);
      return;
    }

    const sale = {
      id: `sale-${Date.now()}`,
      quantity,
      income: quantity * sellPrice,
      ingredientCost: quantity * averageIngredientCostPerBar,
      soldAt: new Date().toISOString(),
    };
    setInventory((current) => ({
      ...current,
      quantity: current.quantity - quantity,
      sales: [sale, ...current.sales],
    }));
    setNotice(
      `Sale recorded: ${quantity} ${quantity === 1 ? "bar" : "bars"}, income ${currency.format(sale.income)}.`,
    );
  };

  return {
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
  };
}
