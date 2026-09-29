import { useEffect, useRef, useState } from "react";
import { getGrahamFlavors, grahamFlavors, isInPeriod } from "../logic/ledger.js";
import { parseReceiptLines } from "../logic/receipt.js";
import { syncLocalLedgerToSupabase } from "../services/ledgerSync.js";

function readStoredList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

const newReceiptLine = () => ({
  id: `manual-${Date.now()}-${Math.random()}`,
  name: "",
  unit: "piece",
  quantity: "1",
  totalPaid: "",
});

const newManualIngredientLine = () => ({
  id: `manual-${Date.now()}-${Math.random()}`,
  name: "",
  quantity: "",
  totalPaid: "",
});

export function useIngredientInventory(period = "month") {
  const [ingredients, setIngredients] = useState(() =>
    readStoredList("family-ledger-demo-ingredients"),
  );
  const [purchases, setPurchases] = useState(() =>
    readStoredList("family-ledger-demo-purchases"),
  );
  const [dialog, setDialog] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [pendingIngredientDelete, setPendingIngredientDelete] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [manualItems, setManualItems] = useState([newManualIngredientLine()]);
  const [availableFlavors, setAvailableFlavors] = useState(getGrahamFlavors);
  const [manualFlavor, setManualFlavor] = useState(() => getGrahamFlavors()[0]?.id || "mango");

  useEffect(() => {
    const handleFlavorsChanged = () => {
      const updated = getGrahamFlavors();
      setAvailableFlavors(updated);
      setManualFlavor((prev) =>
        updated.some((f) => f.id === prev) ? prev : updated[0]?.id || "mango",
      );
    };
    window.addEventListener("graham-flavors-changed", handleFlavorsChanged);
    window.addEventListener("storage", handleFlavorsChanged);
    return () => {
      window.removeEventListener("graham-flavors-changed", handleFlavorsChanged);
      window.removeEventListener("storage", handleFlavorsChanged);
    };
  }, []);

  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [receiptLines, setReceiptLines] = useState([]);
  const [receiptText, setReceiptText] = useState("");
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [receiptError, setReceiptError] = useState("");
  const [receiptNotice, setReceiptNotice] = useState("");
  const [recordReceiptExpense, setRecordReceiptExpense] = useState(true);
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);
  const didMountIngredientsRef = useRef(false);
  const didMountPurchasesRef = useRef(false);

  useEffect(() => {
    if (!didMountIngredientsRef.current) {
      didMountIngredientsRef.current = true;
      return;
    }
    localStorage.setItem(
      "family-ledger-demo-ingredients",
      JSON.stringify(ingredients),
    );
    syncLocalLedgerToSupabase().catch((error) =>
      setNotice(`Saved locally, but Supabase sync failed: ${error.message}`),
    );
  }, [ingredients]);

  useEffect(() => {
    if (!didMountPurchasesRef.current) {
      didMountPurchasesRef.current = true;
      return;
    }
    localStorage.setItem(
      "family-ledger-demo-purchases",
      JSON.stringify(purchases),
    );
    window.dispatchEvent(new Event("family-ledger-purchases-updated"));
    syncLocalLedgerToSupabase().catch((error) =>
      setNotice(`Saved locally, but Supabase sync failed: ${error.message}`),
    );
  }, [purchases]);

  useEffect(
    () => () => {
      if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    },
    [receiptPreview],
  );

  useEffect(() => {
    if (!dialog) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !ocrBusy) setDialog(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [dialog, ocrBusy]);

  const applyPurchaseLines = (lines, shouldRecordExpense, flavorId = null) => {
    const validLines = lines
      .map((line) => ({
        name: line.name.trim(),
        unit: line.unit?.trim() || "unit",
        quantity: Number(line.quantity),
        totalPaid: Number(line.totalPaid),
      }))
      .filter(
        (line) =>
          line.name &&
          Number.isFinite(line.quantity) &&
          line.quantity > 0 &&
          Number.isFinite(line.totalPaid) &&
          line.totalPaid > 0,
      );

    if (validLines.length === 0) {
      setNotice(
        "Add an ingredient, quantity, and total price greater than zero.",
      );
      return false;
    }

    const purchasedAt = new Date().toISOString();
    setIngredients((current) => {
      const updated = [...current];
      for (const line of validLines) {
        const existingIndex = updated.findIndex(
          (item) =>
            item.name.toLocaleLowerCase() === line.name.toLocaleLowerCase(),
        );
        const lineUnitCost = line.totalPaid / line.quantity;
        if (existingIndex === -1) {
          updated.push({
            id: `ingredient-${Date.now()}-${updated.length}`,
            name: line.name,
            unit: line.unit,
            quantity: line.quantity,
            unitCost: lineUnitCost,
          });
        } else {
          const existing = updated[existingIndex];
          const combinedQuantity = existing.quantity + line.quantity;
          updated[existingIndex] = {
            ...existing,
            unit: line.unit === "unit" ? existing.unit : line.unit,
            quantity: combinedQuantity,
            unitCost:
              (existing.quantity * existing.unitCost + line.totalPaid) /
              combinedQuantity,
          };
        }
      }
      return updated;
    });

    setPurchases((current) => [
      ...validLines.map((line) => ({
        id: `purchase-${Date.now()}-${Math.random()}`,
        name: line.name,
        unit: line.unit,
        quantity: line.quantity,
        totalPaid: line.totalPaid,
        purchasedAt,
        flavorId,
        allocatedToProduction: false,
        recordExpense: shouldRecordExpense,
      })),
      ...current,
    ]);

    setNotice(
      `Added ${validLines.length} ingredient ${validLines.length === 1 ? "purchase" : "purchases"} to this browser preview.`,
    );
    setDialog(null);
    return true;
  };

  const reviewPurchaseLines = (
    lines,
    shouldRecordExpense,
    flavorId,
    source,
  ) => {
    const validLines = lines
      .map((line) => ({
        name: line.name.trim(),
        unit: line.unit?.trim() || "unit",
        quantity: Number(line.quantity),
        totalPaid: Number(line.totalPaid),
      }))
      .filter(
        (line) =>
          line.name &&
          Number.isFinite(line.quantity) &&
          line.quantity > 0 &&
          Number.isFinite(line.totalPaid) &&
          line.totalPaid > 0,
      );

    if (validLines.length === 0) {
      setNotice(
        "Add an ingredient, quantity, and total price greater than zero.",
      );
      return;
    }

    setPendingConfirmation({
      lines: validLines,
      shouldRecordExpense,
      flavorId,
      source,
    });
    setDialog("confirm");
  };

  const confirmPurchase = () => {
    if (!pendingConfirmation) return;
    applyPurchaseLines(
      pendingConfirmation.lines,
      pendingConfirmation.shouldRecordExpense,
      pendingConfirmation.flavorId,
    );
    setPendingConfirmation(null);
  };

  const updatePendingLine = (index, field, value) => {
    setPendingConfirmation((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    }));
  };

  const openManualDialog = () => {
    setNotice("");
    setManualItems([newManualIngredientLine()]);
    setManualFlavor(grahamFlavors[0].id);
    setDialog("manual");
  };

  const openEditIngredient = (ingredient) => {
    setNotice("");
    setEditingIngredient({
      ...ingredient,
      quantity: String(ingredient.quantity),
      unitCost: String(ingredient.unitCost),
    });
    setDialog("edit-ingredient");
  };

  const saveIngredientEdit = (event) => {
    event.preventDefault();
    const name = editingIngredient.name.trim();
    const unit = editingIngredient.unit.trim();
    const quantity = Number(editingIngredient.quantity);
    const unitCost = Number(editingIngredient.unitCost);

    if (
      !name ||
      name.length > 120 ||
      !unit ||
      unit.length > 32 ||
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isFinite(unitCost) ||
      unitCost < 0
    ) {
      setNotice("Enter a name, unit, and valid non-negative stock values.");
      return;
    }

    const duplicate = ingredients.some(
      (ingredient) =>
        ingredient.id !== editingIngredient.id &&
        ingredient.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (duplicate) {
      setNotice("An ingredient with that name already exists.");
      return;
    }

    const previousName = ingredients.find(
      (ingredient) => ingredient.id === editingIngredient.id,
    )?.name;
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === editingIngredient.id
          ? { ...ingredient, name, unit, quantity, unitCost }
          : ingredient,
      ),
    );
    if (previousName && previousName !== name) {
      setPurchases((current) =>
        current.map((purchase) =>
          purchase.name.toLocaleLowerCase() === previousName.toLocaleLowerCase()
            ? { ...purchase, name }
            : purchase,
        ),
      );
    }
    setDialog(null);
    setNotice(`${name} updated.`);
  };

  const deleteIngredient = () => {
    if (!pendingIngredientDelete) return;
    const name = pendingIngredientDelete.name;
    setIngredients((current) =>
      current.filter(
        (ingredient) => ingredient.id !== pendingIngredientDelete.id,
      ),
    );
    setPurchases((current) =>
      current.filter(
        (purchase) =>
          purchase.name.toLocaleLowerCase() !== name.toLocaleLowerCase(),
      ),
    );
    setPendingIngredientDelete(null);
    setDialog(null);
    setNotice(`${name} deleted from this browser's stock.`);
  };

  const openReceiptDialog = () => {
    setNotice("");
    setReceiptFile(null);
    setReceiptLines([]);
    setReceiptText("");
    setReceiptError("");
    setReceiptNotice("");
    setOcrProgress(0);
    setRecordReceiptExpense(true);
    setDialog("receipt");
  };

  const analyzeReceipt = async (file) => {
    setOcrBusy(true);
    setOcrProgress(0);
    setReceiptError("");
    setReceiptNotice("Preparing local OCR…");
    let worker;

    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng", 1, {
        logger: (event) => {
          if (event.status === "recognizing text") {
            setOcrProgress(Math.round(event.progress * 100));
            setReceiptNotice("Reading receipt text locally…");
          }
        },
      });
      const result = await worker.recognize(file);
      const parsedLines = parseReceiptLines(result.data.text);
      setReceiptText(result.data.text);
      setReceiptLines(parsedLines.length ? parsedLines : [newReceiptLine()]);
      setReceiptNotice(
        parsedLines.length
          ? `Found ${parsedLines.length} possible line items. Check each one before adding.`
          : "No clear priced items found. Add the items and amounts from the receipt below.",
      );
    } catch (error) {
      console.error("[Family Ledger] Receipt OCR failed", error);
      setReceiptError(error instanceof Error ? error.message : String(error));
      setReceiptLines([newReceiptLine()]);
      setReceiptNotice(
        "OCR failed. You can still enter the receipt items manually.",
      );
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (error) {
          console.error(
            "[Family Ledger] Could not stop receipt OCR worker",
            error,
          );
        }
      }
      setOcrBusy(false);
    }
  };

  const handleReceiptSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setReceiptError("Choose an image file such as JPG, PNG, or HEIC.");
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setReceiptLines([]);
    setReceiptText("");
    setReceiptError("");
    analyzeReceipt(file);
  };

  const updateReceiptLine = (id, field, value) => {
    setReceiptLines((current) =>
      current.map((line) =>
        line.id === id ? { ...line, [field]: value } : line,
      ),
    );
  };

  const purchasesInPeriod = purchases.filter((purchase) =>
    isInPeriod(purchase.purchasedAt, period),
  );
  const totalIngredientPurchases = purchasesInPeriod.reduce(
    (total, purchase) => total + (Number(purchase.totalPaid) || 0),
    0,
  );

  return {
    ingredients,
    dialog,
    setDialog,
    editingIngredient,
    setEditingIngredient,
    pendingIngredientDelete,
    setPendingIngredientDelete,
    pendingConfirmation,
    manualItems,
    setManualItems,
    manualFlavor,
    setManualFlavor,
    availableFlavors,
    receiptFile,
    receiptPreview,
    receiptLines,
    setReceiptLines,
    receiptText,
    ocrBusy,
    ocrProgress,
    receiptError,
    receiptNotice,
    recordReceiptExpense,
    setRecordReceiptExpense,
    notice,
    fileInput,
    totalIngredientPurchases,
    reviewPurchaseLines,
    confirmPurchase,
    updatePendingLine,
    openManualDialog,
    openEditIngredient,
    saveIngredientEdit,
    deleteIngredient,
    openReceiptDialog,
    handleReceiptSelect,
    updateReceiptLine,
  };
}
