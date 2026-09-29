export const currency = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

export const businesses = [
  { id: "water", name: "Water", icon: "W" },
  { id: "ice", name: "Ice", icon: "I" },
  { id: "graham", name: "Graham Bar", icon: "G" },
];

export const grahamFlavors = [
  { id: "mango", name: "Mango" },
  { id: "cheesecake", name: "Cheesecake" },
  { id: "cookies-and-cream", name: "Cookies and Cream" },
  { id: "rocky-road", name: "Rocky Road" },
  { id: "coffee-crumble", name: "Coffee Crumble" },
];

export const CUSTOM_GRAHAM_FLAVORS_KEY = "family-ledger-graham-custom-flavors";

export function getGrahamFlavors() {
  try {
    const custom = JSON.parse(
      localStorage.getItem(CUSTOM_GRAHAM_FLAVORS_KEY) ?? "[]",
    );
    const combined = [...grahamFlavors];
    if (Array.isArray(custom)) {
      for (const item of custom) {
        if (
          item &&
          item.id &&
          item.name &&
          !combined.some(
            (f) =>
              f.id === item.id ||
              f.name.toLowerCase() === item.name.toLowerCase(),
          )
        ) {
          combined.push(item);
        }
      }
    }
    return combined;
  } catch {
    return grahamFlavors;
  }
}


export const pageTitles = {
  overview: "Business overview",
  report: "Income & expenses report",
  sales: "Recent sales",
  water: "Water",
  ice: "Ice",
  graham: "Graham Bar",
  inventory: "Graham Bar stock",
  admin: "Access requests",
};

const periodLabels = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 days",
  month: "This month",
  all: "All time",
};
export function getPeriodLabel(period) {
  if (period?.type === "date") {
    if (!period.date) return "Select date";
    return new Date(`${period.date}T00:00:00`).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (period?.type === "custom") {
    if (!period.startDate || !period.endDate) return "Custom range";
    const formatDate = (value) =>
      new Date(`${value}T00:00:00`).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`;
  }
  return periodLabels[period] ?? periodLabels.month;
}

function readStoredRecord(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

export function isInPeriod(timestamp, period) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;

  if (period?.type === "date") {
    if (!period.date) return false;
    const start = new Date(`${period.date}T00:00:00`);
    if (Number.isNaN(start.getTime())) return false;
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return date >= start && date < end;
  }

  if (period?.type === "custom") {
    if (!period.startDate || !period.endDate) return false;
    const start = new Date(`${period.startDate}T00:00:00`);
    const end = new Date(`${period.endDate}T00:00:00`);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      return false;
    }
    end.setDate(end.getDate() + 1);
    return date >= start && date < end;
  }

  if (period === "all") return true;

  const now = new Date();
  if (period === "today") return date.toDateString() === now.toDateString();
  if (period === "yesterday") {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }
  if (period === "week") {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  }
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function getSavedBusinessSummary(businessId, period) {
  if (businessId === "ice") {
    const inventory = readStoredRecord("family-ledger-ice-water-stock");
    const sales = Array.isArray(inventory?.sales)
      ? inventory.sales.filter((sale) => isInPeriod(sale.soldAt, period))
      : [];
    const production = Array.isArray(inventory?.production)
      ? inventory.production.filter((batch) =>
          isInPeriod(batch.producedAt, period),
        )
      : [];
    const income = sales.reduce(
      (total, sale) => total + (Number(sale.revenue) || 0),
      0,
    );
    const expenses = production.reduce(
      (total, batch) => total + (Number(batch.totalExpense) || 0),
      0,
    );
    return {
      income,
      expenses,
      profit: sales.reduce(
        (total, sale) => total + (Number(sale.profit) || 0),
        0,
      ),
      units: sales.reduce(
        (total, sale) => total + (Number(sale.quantity) || 0),
        0,
      ),
    };
  }

  if (businessId === "water") {
    const inventory = readStoredRecord(`family-ledger-${businessId}-stock`);
    const sales = Array.isArray(inventory?.sales)
      ? inventory.sales.filter((sale) => isInPeriod(sale.soldAt, period))
      : [];
    const restocks = Array.isArray(inventory?.restocks)
      ? inventory.restocks.filter((item) =>
          isInPeriod(
            item.restockedAt ?? item.purchasedAt ?? item.occurredAt,
            period,
          ),
        )
      : Array.isArray(inventory?.purchases)
        ? inventory.purchases.filter((item) =>
            isInPeriod(
              item.purchasedAt ?? item.restockedAt ?? item.occurredAt,
              period,
            ),
          )
        : [];
    const income = sales.reduce(
      (total, sale) => total + (Number(sale.revenue) || 0),
      0,
    );
    const hasAnyRestocks =
      (Array.isArray(inventory?.restocks) && inventory.restocks.length > 0) ||
      (Array.isArray(inventory?.purchases) && inventory.purchases.length > 0);

    const expenses = hasAnyRestocks
      ? restocks.reduce(
          (total, item) =>
            total +
            (Number(item.totalExpense ?? item.amount ?? item.totalPaid) || 0),
          0,
        )
      : sales.reduce((total, sale) => {
          const saleIncome = Number(sale.revenue) || 0;
          const saleProfit = Number(sale.profit) || 0;
          return total + Math.max(0, saleIncome - saleProfit);
        }, 0);

    return {
      income,
      expenses,
      profit: income - expenses,
      units: sales.reduce(
        (total, sale) => total + (Number(sale.quantity) || 0),
        0,
      ),
    };
  }

  const flavors = grahamFlavors.map((flavor) =>
    readStoredRecord(`family-ledger-graham-${flavor.id}-stock`),
  );
  const sales = flavors.flatMap((inventory) =>
    Array.isArray(inventory?.sales)
      ? inventory.sales.filter((sale) => isInPeriod(sale.soldAt, period))
      : [],
  );
  const production = flavors.flatMap((inventory) =>
    Array.isArray(inventory?.production)
      ? inventory.production.filter((batch) =>
          isInPeriod(batch.producedAt, period),
        )
      : [],
  );
  const income = sales.reduce(
    (total, sale) => total + (Number(sale.income ?? sale.revenue) || 0),
    0,
  );
  const expenses = production.reduce(
    (total, batch) => total + (Number(batch.ingredientExpense) || 0),
    0,
  );

  return {
    income,
    expenses,
    profit: income - expenses,
    units: sales.reduce(
      (total, sale) => total + (Number(sale.quantity) || 0),
      0,
    ),
  };
}

function getSavedTransactions(page, period) {
  const selectedBusinesses =
    page === "overview" || page === "report" || page === "sales"
      ? businesses
      : businesses.filter(({ id }) => id === page);
  const transactions = [];

  for (const business of selectedBusinesses) {
    if (business.id === "ice") {
      const inventory = readStoredRecord("family-ledger-ice-water-stock");
      for (const sale of Array.isArray(inventory?.sales)
        ? inventory.sales
        : []) {
        if (!isInPeriod(sale.soldAt, period)) continue;
        const occurredAt = sale.soldAt;
        transactions.push({
          id: `ice-water-${sale.id}`,
          description: `Ice water sale · ${sale.quantity} ${sale.quantity === 1 ? "cup" : "cups"}`,
          business: "Ice",
          amount: Number(sale.revenue) || 0,
          profit: Number(sale.profit) || 0,
          type: "income",
          time: new Date(occurredAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          occurredAt,
        });
      }
      for (const batch of Array.isArray(inventory?.production)
        ? inventory.production
        : []) {
        if (!isInPeriod(batch.producedAt, period)) continue;
        const occurredAt = batch.producedAt;
        transactions.push({
          id: `ice-water-${batch.id}`,
          description: `Ice and plastic expense · ${batch.quantity} cups`,
          business: "Ice",
          amount: Number(batch.totalExpense) || 0,
          type: "expense",
          time: new Date(occurredAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          occurredAt,
        });
      }
      continue;
    }

    if (business.id === "water") {
      const inventory = readStoredRecord("family-ledger-water-stock");
      const sales = Array.isArray(inventory?.sales) ? inventory.sales : [];
      const restocks = Array.isArray(inventory?.restocks)
        ? inventory.restocks
        : Array.isArray(inventory?.purchases)
          ? inventory.purchases
          : [];
      const hasAnyRestocks = restocks.length > 0;

      for (const sale of sales) {
        if (!isInPeriod(sale.soldAt, period)) continue;
        const revenue = Number(sale.revenue) || 0;
        const profit = Number(sale.profit) || 0;
        const description = `${business.name} sale · ${sale.quantity} ${business.id === "water" ? "gallons" : "bags"}`;
        const time = new Date(sale.soldAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });
        transactions.push({
          id: `${business.id}-${sale.id}-income`,
          description,
          business: business.name,
          amount: revenue,
          profit,
          type: "income",
          time,
          occurredAt: sale.soldAt,
        });

        if (!hasAnyRestocks) {
          const cost = Math.max(0, revenue - profit);
          if (cost > 0) {
            transactions.push({
              id: `${business.id}-${sale.id}-cost`,
              description: `${business.name} cost · ${sale.quantity} units`,
              business: business.name,
              amount: cost,
              type: "expense",
              time,
              occurredAt: sale.soldAt,
            });
          }
        }
      }

      if (hasAnyRestocks) {
        for (const restock of restocks) {
          const occurredAt =
            restock.restockedAt ?? restock.purchasedAt ?? restock.occurredAt;
          if (!occurredAt || !isInPeriod(occurredAt, period)) continue;
          const amount =
            Number(
              restock.totalExpense ?? restock.amount ?? restock.totalPaid,
            ) || 0;
          transactions.push({
            id: `water-restock-${restock.id}`,
            description: `Water restock · ${restock.quantity} ${restock.quantity === 1 ? "gallon" : "gallons"}`,
            business: "Water",
            amount,
            type: "expense",
            time: new Date(occurredAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            occurredAt,
          });
        }
      }
      continue;
    }

    for (const flavor of grahamFlavors) {
      const inventory = readStoredRecord(
        `family-ledger-graham-${flavor.id}-stock`,
      );
      for (const sale of Array.isArray(inventory?.sales)
        ? inventory.sales
        : []) {
        if (!isInPeriod(sale.soldAt, period)) continue;
        const occurredAt = sale.soldAt;
        const amount = Number(sale.income ?? sale.revenue) || 0;
        const recordedProfit = Number(sale.profit);
        transactions.push({
          id: `graham-${flavor.id}-${sale.id}`,
          description: `${flavor.name} Graham Bar sale · ${sale.quantity} ${sale.quantity === 1 ? "bar" : "bars"}`,
          business: "Graham Bar",
          amount,
          profit: Number.isFinite(recordedProfit)
            ? recordedProfit
            : Math.max(0, amount - (Number(sale.ingredientCost) || 0)),
          type: "income",
          time: new Date(occurredAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          occurredAt,
        });
      }
      for (const batch of Array.isArray(inventory?.production)
        ? inventory.production
        : []) {
        if (!isInPeriod(batch.producedAt, period)) continue;
        const occurredAt = batch.producedAt;
        transactions.push({
          id: `graham-${flavor.id}-${batch.id}`,
          description: `${flavor.name} Graham Bar ingredients · ${batch.quantity} bars`,
          business: "Graham Bar",
          amount: Number(batch.ingredientExpense) || 0,
          type: "expense",
          time: new Date(occurredAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
          occurredAt,
        });
      }
    }
  }

  return transactions.sort(
    (left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt),
  );
}

export function getDemoSummary(page, period) {
  const selected =
    page === "overview" || page === "report" || page === "sales"
      ? businesses.map(({ id }) => id)
      : businesses.some(({ id }) => id === page)
        ? [page]
        : [];
  const businessSummaries = Object.fromEntries(
    businesses.map(({ id }) => [id, getSavedBusinessSummary(id, period)]),
  );
  const summary = selected.reduce(
    (total, id) => {
      const values = businessSummaries[id];
      return {
        income: total.income + values.income,
        expenses: total.expenses + values.expenses,
        profit: total.profit + values.profit,
        units: total.units + values.units,
      };
    },
    { income: 0, expenses: 0, profit: 0, units: 0 },
  );

  const transactions = getSavedTransactions(page, period);
  const dailyReport = new Map();
  for (const transaction of transactions) {
    const date = new Date(transaction.occurredAt);
    const dayKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const day = dailyReport.get(dayKey) ?? {
      dayKey,
      date: date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      purchases: 0,
      income: 0,
      expenses: 0,
    };
    if (transaction.type === "income") {
      day.purchases += 1;
      day.income += transaction.amount;
    } else {
      day.expenses += transaction.amount;
    }
    dailyReport.set(dayKey, day);
  }

  return {
    summary,
    businessSummaries,
    transactions,
    sales: transactions.filter((transaction) => transaction.type === "income"),
    dailyReport: [...dailyReport.values()].sort(
      (left, right) =>
        right.purchases - left.purchases ||
        right.dayKey.localeCompare(left.dayKey),
    ),
  };
}
