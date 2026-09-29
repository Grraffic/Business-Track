import { useEffect, useRef, useState } from "react";
import { Cookie, Droplets, Snowflake } from "lucide-react";
import { currency, isInPeriod } from "../logic/ledger.js";
import { syncLocalLedgerToSupabase } from "../services/ledgerSync.js";

const defaults = {
  water: { name: "Water", unit: "gallons", sellPrice: "", unitCost: "" },
  ice: { name: "Ice", unit: "bags", sellPrice: "", unitCost: "" },
  graham: { name: "Graham Bar", unit: "bars", sellPrice: "", unitCost: "" },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/**
 * For water: check if last saved date is before today.
 * If so, record the remaining quantity as carried-over (no deduction, just mark it)
 * and update the lastCheckedDate to today.
 */
function applyDailyCarryOver(saved, businessId) {
  if (businessId !== "water") return saved;
  const storedDate = saved.lastCheckedDate;
  const today = todayStr();
  if (!storedDate || storedDate === today) return saved;

  // It's a new day — carry over remaining stock
  const remaining = Number(saved.quantity) || 0;
  const carryOverRecord = {
    id: `carryover-${Date.now()}`,
    type: "carryover",
    quantity: remaining,
    fromDate: storedDate,
    toDate: today,
    carriedAt: new Date().toISOString(),
  };
  const carryOvers = Array.isArray(saved.carryOvers) ? saved.carryOvers : [];
  return {
    ...saved,
    lastCheckedDate: today,
    carryOvers: [carryOverRecord, ...carryOvers],
  };
}

function readInventory(businessId, storageKey) {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (raw && Number.isFinite(raw.quantity) && Array.isArray(raw.sales)) {
      const restocks = Array.isArray(raw.restocks)
        ? raw.restocks
        : Array.isArray(raw.purchases)
          ? raw.purchases
          : [];
      const saved = applyDailyCarryOver(
        { ...defaults[businessId], ...raw, restocks },
        businessId,
      );
      // If a carry-over happened, persist immediately
      if (saved.lastCheckedDate !== raw.lastCheckedDate) {
        localStorage.setItem(storageKey, JSON.stringify(saved));
      }
      return saved;
    }
  } catch {}
  return {
    ...defaults[businessId],
    quantity: 0,
    sales: [],
    restocks: [],
    lastCheckedDate: todayStr(),
  };
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
    unitCost: String(inventory.unitCost ?? ""),
    totalCost: "",
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

  // Auto-dismiss notice after 4 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  // Persist to localStorage and sync only on user updates (skip initial mount)
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
  }, [inventory, storageKey]);

  // For water: check for day change every minute while the page is open
  useEffect(() => {
    if (businessId !== "water") return;
    const check = () => {
      setInventory((current) => {
        const updated = applyDailyCarryOver(current, businessId);
        if (updated !== current) {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        return updated;
      });
    };
    const timerId = setInterval(check, 60_000); // check every minute
    return () => clearInterval(timerId);
  }, [businessId, storageKey]);

  const updateRestockQuantity = (value) => {
    setRestock((prev) => {
      const qtyNum = Number(value);
      let total = prev.totalCost;
      let unit = prev.unitCost;
      if (value !== "" && Number.isFinite(qtyNum) && qtyNum > 0) {
        if (unit !== "" && Number.isFinite(Number(unit))) {
          total = String(Math.round(qtyNum * Number(unit) * 100) / 100);
        } else if (total !== "" && Number.isFinite(Number(total))) {
          unit = String(Math.round((Number(total) / qtyNum) * 100) / 100);
        }
      }
      return { quantity: value, unitCost: unit, totalCost: total };
    });
  };

  const updateRestockUnitCost = (value) => {
    setRestock((prev) => {
      const unitNum = Number(value);
      const qtyNum = Number(prev.quantity);
      let total = prev.totalCost;
      if (
        value !== "" &&
        Number.isFinite(unitNum) &&
        prev.quantity !== "" &&
        Number.isFinite(qtyNum) &&
        qtyNum > 0
      ) {
        total = String(Math.round(qtyNum * unitNum * 100) / 100);
      }
      return { ...prev, unitCost: value, totalCost: total };
    });
  };

  const updateRestockTotalCost = (value) => {
    setRestock((prev) => {
      const totalNum = Number(value);
      const qtyNum = Number(prev.quantity);
      let unit = prev.unitCost;
      if (
        value !== "" &&
        Number.isFinite(totalNum) &&
        prev.quantity !== "" &&
        Number.isFinite(qtyNum) &&
        qtyNum > 0
      ) {
        unit = String(Math.round((totalNum / qtyNum) * 100) / 100);
      }
      return { ...prev, totalCost: value, unitCost: unit };
    });
  };

  const periodSales = inventory.sales.filter((sale) =>
    isInPeriod(sale.soldAt, period),
  );
  const periodRestocks = (
    Array.isArray(inventory.restocks)
      ? inventory.restocks
      : Array.isArray(inventory.purchases)
        ? inventory.purchases
        : []
  ).filter((r) =>
    isInPeriod(r.restockedAt ?? r.purchasedAt ?? r.occurredAt, period),
  );

  const totalSold = periodSales.reduce((sum, sale) => sum + sale.quantity, 0);
  const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.revenue, 0);

  const hasAnyRestocks =
    (Array.isArray(inventory.restocks) && inventory.restocks.length > 0) ||
    (Array.isArray(inventory.purchases) && inventory.purchases.length > 0);

  const totalRestockExpense = periodRestocks.reduce(
    (sum, r) => sum + (Number(r.totalExpense ?? r.amount ?? r.totalPaid) || 0),
    0,
  );

  const totalExpense = hasAnyRestocks
    ? totalRestockExpense
    : periodSales.reduce(
        (sum, sale) => sum + Math.max(0, sale.revenue - sale.profit),
        0,
      );

  const totalProfit = totalRevenue - totalExpense;

  const hasUnitCost =
    inventory.unitCost !== "" && Number.isFinite(Number(inventory.unitCost));
  const hasSellPrice =
    inventory.sellPrice !== "" &&
    Number.isFinite(Number(inventory.sellPrice)) &&
    Number(inventory.sellPrice) > 0;

  const totalPaid = (() => {
    const qty = Number(restock.quantity);
    const unit = Number(restock.unitCost);
    const total = Number(restock.totalCost);
    if (restock.totalCost !== "" && Number.isFinite(total) && total >= 0) {
      return total;
    }
    if (
      restock.quantity !== "" &&
      restock.unitCost !== "" &&
      Number.isFinite(qty) &&
      Number.isFinite(unit) &&
      qty > 0 &&
      unit >= 0
    ) {
      return qty * unit;
    }
    return null;
  })();

  // Most recent carry-over for display
  const latestCarryOver =
    businessId === "water" && Array.isArray(inventory.carryOvers)
      ? inventory.carryOvers[0] ?? null
      : null;

  const addStock = (event) => {
    event.preventDefault();
    const quantity = Number(restock.quantity);
    let unitCostPaid = Number(restock.unitCost);
    let totalPaidNum = Number(restock.totalCost);

    if (
      (!Number.isFinite(totalPaidNum) || totalPaidNum <= 0) &&
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(unitCostPaid) &&
      unitCostPaid >= 0
    ) {
      totalPaidNum = quantity * unitCostPaid;
    }

    if (
      (!Number.isFinite(unitCostPaid) || unitCostPaid < 0) &&
      Number.isFinite(quantity) &&
      quantity > 0 &&
      Number.isFinite(totalPaidNum) &&
      totalPaidNum >= 0
    ) {
      unitCostPaid = totalPaidNum / quantity;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitCostPaid) ||
      unitCostPaid < 0 ||
      !Number.isFinite(totalPaidNum) ||
      totalPaidNum < 0
    ) {
      setNotice("Enter a whole stock quantity and valid purchase cost.");
      return;
    }

    const combinedQuantity = inventory.quantity + quantity;
    const previousUnitCost = Number(inventory.unitCost) || 0;
    const unitCost =
      (inventory.quantity * previousUnitCost + totalPaidNum) / combinedQuantity;

    const restockRecord = {
      id: `restock-${Date.now()}`,
      quantity,
      unitCost: unitCostPaid,
      totalExpense: totalPaidNum,
      restockedAt: new Date().toISOString(),
    };

    setInventory((current) => ({
      ...current,
      quantity: combinedQuantity,
      unitCost,
      restocks: [
        restockRecord,
        ...(Array.isArray(current.restocks)
          ? current.restocks
          : Array.isArray(current.purchases)
            ? current.purchases
            : []),
      ],
      lastCheckedDate: todayStr(),
    }));

    setRestock({
      quantity: "",
      unitCost: String(unitCostPaid),
      totalCost: "",
    });

    setNotice(
      `${quantity} ${quantity === 1 ? singularUnit : product.unit} added to stock (${currency.format(totalPaidNum)} expense recorded).`,
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
      lastCheckedDate: todayStr(),
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

  const deleteSale = (saleId) => {
    const saleToDelete = inventory.sales.find((s) => s.id === saleId);
    if (!saleToDelete) return;
    const restoredQty = Number(saleToDelete.quantity) || 0;
    setInventory((current) => ({
      ...current,
      quantity: current.quantity + restoredQty,
      sales: current.sales.filter((s) => s.id !== saleId),
    }));
    setNotice(
      `Sale removed. ${restoredQty} ${restoredQty === 1 ? singularUnit : product.unit} restored to stock.`,
    );
  };

  const deleteRestock = (restockId) => {
    const rToDelete = (
      Array.isArray(inventory.restocks) ? inventory.restocks : []
    ).find((r) => r.id === restockId);
    if (!rToDelete) return;
    const qty = Number(rToDelete.quantity) || 0;
    const expense = Number(rToDelete.totalExpense) || 0;
    setInventory((current) => ({
      ...current,
      quantity: Math.max(0, current.quantity - qty),
      restocks: (
        Array.isArray(current.restocks) ? current.restocks : []
      ).filter((r) => r.id !== restockId),
    }));
    setNotice(`Restock removed (${currency.format(expense)} expense removed).`);
  };

  return {
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
  };
}

