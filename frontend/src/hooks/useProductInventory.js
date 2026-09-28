import { useEffect, useState } from "react";
import { Cookie, Droplets, Snowflake } from "lucide-react";
import { currency, isInPeriod } from "../logic/ledger.js";
import { syncLocalLedgerToSupabase } from "../services/ledgerSync.js";

const defaults = {
  water: { name: "Water", unit: "gallons", sellPrice: "", unitCost: "" },
  ice: { name: "Ice", unit: "bags", sellPrice: "", unitCost: "" },
  graham: { name: "Graham Bar", unit: "bars", sellPrice: "", unitCost: "" },
};

function readInventory(businessId, storageKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (
      saved &&
      Number.isFinite(saved.quantity) &&
      Array.isArray(saved.sales)
    ) {
      return { ...defaults[businessId], ...saved };
    }
  } catch {}
  return { ...defaults[businessId], quantity: 0, sales: [] };
}

export function useProductInventory({
  businessId,
  period = "month",
  flavorId,
  productName,
}) {
  const product = {
    ...defaults[businessId],
    ...(productName ? { name: productName } : {}),
  };
  const storageKey = flavorId
    ? `family-ledger-graham-${flavorId}-stock`
    : `family-ledger-${businessId}-stock`;
  const [inventory, setInventory] = useState(() =>
    readInventory(businessId, storageKey),
  );
  const [restock, setRestock] = useState(() => ({
    quantity: "",
    unitCost: String(inventory.unitCost),
  }));
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [notice, setNotice] = useState("");
  const Icon =
    businessId === "water"
      ? Droplets
      : businessId === "ice"
        ? Snowflake
        : Cookie;
  const singularUnit = product.unit.endsWith("s")
    ? product.unit.slice(0, -1)
    : product.unit;

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(inventory));
    syncLocalLedgerToSupabase().catch((error) =>
      setNotice(`Saved locally, but Supabase sync failed: ${error.message}`),
    );
  }, [inventory, storageKey]);

  const periodSales = inventory.sales.filter((sale) =>
    isInPeriod(sale.soldAt, period),
  );
  const totalSold = periodSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.revenue, 0);
  const totalProfit = periodSales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalExpense = totalRevenue - totalProfit;
  const hasUnitCost =
    inventory.unitCost !== "" && Number.isFinite(Number(inventory.unitCost));
  const hasSellPrice =
    inventory.sellPrice !== "" &&
    Number.isFinite(Number(inventory.sellPrice)) &&
    Number(inventory.sellPrice) > 0;
  const restockQuantity = Number(restock.quantity);
  const restockUnitCost = Number(restock.unitCost);
  const totalPaid =
    restock.quantity !== "" &&
    restock.unitCost !== "" &&
    Number.isFinite(restockQuantity) &&
    Number.isFinite(restockUnitCost) &&
    restockQuantity > 0 &&
    restockUnitCost >= 0
      ? restockQuantity * restockUnitCost
      : null;

  const addStock = (event) => {
    event.preventDefault();
    const quantity = restockQuantity;
    const unitCostPaid = restockUnitCost;
    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      restock.unitCost === "" ||
      !Number.isFinite(unitCostPaid) ||
      unitCostPaid < 0
    ) {
      setNotice("Enter a whole stock quantity and a valid cost per unit.");
      return;
    }

    const totalPaid = quantity * unitCostPaid;
    const combinedQuantity = inventory.quantity + quantity;
    const previousUnitCost = Number(inventory.unitCost) || 0;
    const unitCost =
      (inventory.quantity * previousUnitCost + totalPaid) / combinedQuantity;
    setInventory((current) => ({
      ...current,
      quantity: combinedQuantity,
      unitCost,
    }));
    setRestock({ quantity: "", unitCost: String(unitCostPaid) });
    setNotice(
      `${quantity} ${quantity === 1 ? singularUnit : product.unit} added to stock.`,
    );
  };

  const recordSale = (event) => {
    event.preventDefault();
    if (!hasSellPrice || !hasUnitCost) {
      setNotice(
        "Set a selling price and purchase cost before recording a sale.",
      );
      return;
    }
    const quantity = Number(saleQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setNotice("Enter a whole number of units to sell.");
      return;
    }
    if (quantity > inventory.quantity) {
      setNotice(`Only ${inventory.quantity} ${product.unit} are in stock.`);
      return;
    }

    const sale = {
      id: `sale-${Date.now()}`,
      quantity,
      revenue: quantity * Number(inventory.sellPrice),
      profit:
        quantity * (Number(inventory.sellPrice) - Number(inventory.unitCost)),
      soldAt: new Date().toISOString(),
    };
    setInventory((current) => ({
      ...current,
      quantity: current.quantity - quantity,
      sales: [sale, ...current.sales],
    }));
    setNotice(
      `Sale recorded: ${quantity} ${quantity === 1 ? singularUnit : product.unit}, profit ${currency.format(sale.profit)}.`,
    );
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
  };
}
