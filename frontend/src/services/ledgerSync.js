import axios from "axios";
import { getDemoSummary } from "../logic/ledger.js";
import { supabase } from "./supabase.js";

let syncQueue = Promise.resolve();

function readStoredList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function stableUuid(value) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  const bytes = new Uint8Array(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

async function syncLocalLedger() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (!accessToken) return null;

  const entries = await Promise.all(
    getDemoSummary("overview", "all")
      .transactions.filter((entry) => Number(entry.amount) > 0)
      .map(async (entry) => ({
        id: await stableUuid(`ledger-entry:${entry.id}`),
        business_id:
          entry.business === "Graham Bar"
            ? "graham"
            : entry.business.toLowerCase(),
        entry_type: entry.type,
        description: entry.description,
        amount: Number(entry.amount),
        occurred_at: entry.occurredAt,
      })),
  );

  const ingredients = readStoredList("family-ledger-demo-ingredients")
    .filter((item) => item.name?.trim())
    .map((item) => ({
      name: item.name.trim(),
      unit: item.unit?.trim() || "unit",
      unit_cost: Number(item.unitCost) || 0,
      stock_on_hand: Math.max(0, Number(item.quantity) || 0),
    }));

  const purchases = await Promise.all(
    readStoredList("family-ledger-demo-purchases")
      .filter(
        (purchase) =>
          purchase.id &&
          purchase.name?.trim() &&
          Number(purchase.quantity) > 0 &&
          Number(purchase.totalPaid) > 0,
      )
      .map(async (purchase) => ({
        id: await stableUuid(`ingredient-purchase:${purchase.id}`),
        name: purchase.name.trim(),
        quantity: Number(purchase.quantity),
        total_paid: Number(purchase.totalPaid),
        record_as_expense: purchase.recordExpense !== false,
        purchased_at: purchase.purchasedAt ?? new Date().toISOString(),
      })),
  );

  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
  try {
    const response = await axios.post(
      `${apiBaseUrl}/api/ledger/sync`,
      { entries, ingredients, purchases },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Backend sync failed.",
    );
  }
}

export function syncLocalLedgerToSupabase() {
  const sync = syncQueue.then(syncLocalLedger);
  syncQueue = sync.catch(() => undefined);
  return sync;
}
