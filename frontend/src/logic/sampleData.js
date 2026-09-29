import { grahamFlavors } from "./ledger.js";

function getIsoDate(daysAgo, hour = 10, minute = 30) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function loadSampleLedgerData() {
  // 1. Water Stock & Sales
  const waterData = {
    name: "Water",
    unit: "gallons",
    sellPrice: "35",
    unitCost: "15",
    quantity: 38,
    sales: [
      {
        id: "w-sale-1",
        quantity: 12,
        revenue: 420,
        profit: 240,
        soldAt: getIsoDate(0, 9, 15),
      },
      {
        id: "w-sale-2",
        quantity: 18,
        revenue: 630,
        profit: 360,
        soldAt: getIsoDate(1, 14, 20),
      },
      {
        id: "w-sale-3",
        quantity: 15,
        revenue: 525,
        profit: 300,
        soldAt: getIsoDate(2, 11, 45),
      },
      {
        id: "w-sale-4",
        quantity: 20,
        revenue: 700,
        profit: 400,
        soldAt: getIsoDate(3, 16, 10),
      },
      {
        id: "w-sale-5",
        quantity: 14,
        revenue: 490,
        profit: 280,
        soldAt: getIsoDate(5, 10, 0),
      },
    ],
    restocks: [
      {
        id: "w-restock-1",
        quantity: 65,
        unitCost: 15,
        totalExpense: 975,
        restockedAt: getIsoDate(2, 8, 30),
      },
      {
        id: "w-restock-2",
        quantity: 50,
        unitCost: 15,
        totalExpense: 750,
        restockedAt: getIsoDate(5, 7, 45),
      },
    ],
  };
  localStorage.setItem("family-ledger-water-stock", JSON.stringify(waterData));

  // 2. Ice Stock, Sales & Production
  const iceData = {
    name: "Ice",
    unit: "bags",
    sellPrice: "20",
    unitCost: "8",
    quantity: 64,
    sales: [
      {
        id: "ice-sale-1",
        quantity: 25,
        revenue: 500,
        profit: 300,
        soldAt: getIsoDate(0, 11, 30),
      },
      {
        id: "ice-sale-2",
        quantity: 30,
        revenue: 600,
        profit: 360,
        soldAt: getIsoDate(1, 15, 45),
      },
      {
        id: "ice-sale-3",
        quantity: 22,
        revenue: 440,
        profit: 264,
        soldAt: getIsoDate(2, 13, 10),
      },
      {
        id: "ice-sale-4",
        quantity: 35,
        revenue: 700,
        profit: 420,
        soldAt: getIsoDate(4, 12, 0),
      },
    ],
    production: [
      {
        id: "ice-batch-1",
        quantity: 80,
        totalExpense: 640,
        producedAt: getIsoDate(2, 8, 0),
      },
      {
        id: "ice-batch-2",
        quantity: 70,
        totalExpense: 560,
        producedAt: getIsoDate(5, 7, 30),
      },
    ],
  };
  localStorage.setItem("family-ledger-ice-water-stock", JSON.stringify(iceData));

  // 3. Graham Bar Flavors
  const flavorDataMap = {
    mango: {
      sellPrice: "45",
      unitCost: "22",
      quantity: 24,
      ingredientExpenses: 440,
      sales: [
        {
          id: "g-m-1",
          quantity: 8,
          revenue: 360,
          profit: 184,
          ingredientCost: 176,
          soldAt: getIsoDate(0, 13, 0),
        },
        {
          id: "g-m-2",
          quantity: 12,
          revenue: 540,
          profit: 276,
          ingredientCost: 264,
          soldAt: getIsoDate(1, 16, 30),
        },
        {
          id: "g-m-3",
          quantity: 10,
          revenue: 450,
          profit: 230,
          ingredientCost: 220,
          soldAt: getIsoDate(3, 15, 10),
        },
      ],
      production: [
        {
          id: "g-m-p1",
          quantity: 30,
          ingredientExpense: 660,
          producedAt: getIsoDate(2, 9, 0),
        },
      ],
    },
    cheesecake: {
      sellPrice: "50",
      unitCost: "25",
      quantity: 18,
      ingredientExpenses: 500,
      sales: [
        {
          id: "g-c-1",
          quantity: 6,
          revenue: 300,
          profit: 150,
          ingredientCost: 150,
          soldAt: getIsoDate(0, 14, 45),
        },
        {
          id: "g-c-2",
          quantity: 9,
          revenue: 450,
          profit: 225,
          ingredientCost: 225,
          soldAt: getIsoDate(2, 17, 0),
        },
      ],
      production: [
        {
          id: "g-c-p1",
          quantity: 25,
          ingredientExpense: 625,
          producedAt: getIsoDate(3, 10, 0),
        },
      ],
    },
    "cookies-and-cream": {
      sellPrice: "45",
      unitCost: "23",
      quantity: 26,
      ingredientExpenses: 460,
      sales: [
        {
          id: "g-cc-1",
          quantity: 10,
          revenue: 450,
          profit: 220,
          ingredientCost: 230,
          soldAt: getIsoDate(1, 12, 15),
        },
        {
          id: "g-cc-2",
          quantity: 8,
          revenue: 360,
          profit: 176,
          ingredientCost: 184,
          soldAt: getIsoDate(3, 14, 0),
        },
      ],
      production: [
        {
          id: "g-cc-p1",
          quantity: 30,
          ingredientExpense: 690,
          producedAt: getIsoDate(4, 9, 30),
        },
      ],
    },
    "rocky-road": {
      sellPrice: "45",
      unitCost: "24",
      quantity: 16,
      ingredientExpenses: 480,
      sales: [
        {
          id: "g-rr-1",
          quantity: 7,
          revenue: 315,
          profit: 147,
          ingredientCost: 168,
          soldAt: getIsoDate(0, 16, 20),
        },
        {
          id: "g-rr-2",
          quantity: 11,
          revenue: 495,
          profit: 231,
          ingredientCost: 264,
          soldAt: getIsoDate(2, 15, 45),
        },
      ],
      production: [
        {
          id: "g-rr-p1",
          quantity: 25,
          ingredientExpense: 600,
          producedAt: getIsoDate(3, 11, 0),
        },
      ],
    },
  };

  for (const flavor of grahamFlavors) {
    const details = flavorDataMap[flavor.id] || {
      sellPrice: "45",
      unitCost: "23",
      quantity: 15,
      ingredientExpenses: 345,
      sales: [],
      production: [],
    };
    localStorage.setItem(
      `family-ledger-graham-${flavor.id}-stock`,
      JSON.stringify({
        name: `${flavor.name} Graham Bar`,
        unit: "bars",
        ...details,
      }),
    );
  }

  // 4. Sample ingredients on hand
  const sampleIngredients = [
    {
      id: "ing-1",
      name: "Graham Crackers (Box)",
      unit: "boxes",
      quantity: 14,
      unitCost: "55.00",
      flavorId: "mango",
      flavorName: "Mango",
      purchasedAt: getIsoDate(3, 9, 0),
    },
    {
      id: "ing-2",
      name: "All-Purpose Cream (250ml)",
      unit: "packs",
      quantity: 22,
      unitCost: "68.50",
      flavorId: "cheesecake",
      flavorName: "Cheesecake",
      purchasedAt: getIsoDate(3, 9, 15),
    },
    {
      id: "ing-3",
      name: "Condensed Milk (300ml)",
      unit: "cans",
      quantity: 18,
      unitCost: "48.00",
      flavorId: "mango",
      flavorName: "Mango",
      purchasedAt: getIsoDate(4, 10, 0),
    },
    {
      id: "ing-4",
      name: "Fresh Mangoes (kg)",
      unit: "kg",
      quantity: 8,
      unitCost: "160.00",
      flavorId: "mango",
      flavorName: "Mango",
      purchasedAt: getIsoDate(1, 8, 30),
    },
    {
      id: "ing-5",
      name: "Cream Cheese Block",
      unit: "packs",
      quantity: 6,
      unitCost: "145.00",
      flavorId: "cheesecake",
      flavorName: "Cheesecake",
      purchasedAt: getIsoDate(2, 11, 0),
    },
    {
      id: "ing-6",
      name: "Oreo Cookies Crush",
      unit: "packs",
      quantity: 12,
      unitCost: "42.00",
      flavorId: "cookies-and-cream",
      flavorName: "Cookies and Cream",
      purchasedAt: getIsoDate(4, 13, 0),
    },
    {
      id: "ing-7",
      name: "Mini Marshmallows",
      unit: "bags",
      quantity: 9,
      unitCost: "38.00",
      flavorId: "rocky-road",
      flavorName: "Rocky Road",
      purchasedAt: getIsoDate(3, 14, 30),
    },
  ];
  localStorage.setItem("family-ledger-ingredients", JSON.stringify(sampleIngredients));

  // Notify active listeners
  window.dispatchEvent(new CustomEvent("ledger-updated"));
}

export async function clearLedgerData() {
  // Clear all localStorage keys (including the ones the sync reads)
  localStorage.removeItem("family-ledger-water-stock");
  localStorage.removeItem("family-ledger-ice-water-stock");
  for (const flavor of grahamFlavors) {
    localStorage.removeItem(`family-ledger-graham-${flavor.id}-stock`);
  }
  localStorage.removeItem("family-ledger-ingredients");
  localStorage.removeItem("family-ledger-demo-ingredients");
  localStorage.removeItem("family-ledger-demo-purchases");

  // Also delete from Supabase so data doesn't restore on next reload
  try {
    const { clearSupabaseData } = await import("../services/ledgerSync.js");
    await clearSupabaseData();
  } catch {
    // Silently ignore if Supabase is not configured or user is not logged in
  }

  window.dispatchEvent(new CustomEvent("ledger-updated"));
}
