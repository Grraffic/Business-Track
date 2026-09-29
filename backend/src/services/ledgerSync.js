const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedBusinesses = new Set(["water", "ice", "graham"]);

function requireArray(value, name, maximum) {
  if (!Array.isArray(value) || value.length > maximum) {
    throw new Error(
      `${name} must be an array with at most ${maximum} records.`,
    );
  }
}

function validUuid(value) {
  return typeof value === "string" && uuidPattern.test(value);
}

function mapEntries(entries, userId) {
  return entries.map((entry) => {
    const amount = Number(entry.amount);
    if (
      !validUuid(entry.id) ||
      !allowedBusinesses.has(entry.business_id) ||
      !["income", "expense"].includes(entry.entry_type) ||
      typeof entry.description !== "string" ||
      !entry.description.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      Number.isNaN(Date.parse(entry.occurred_at))
    ) {
      throw new Error("An activity entry has invalid fields.");
    }

    return {
      id: entry.id,
      business_id: entry.business_id,
      entry_type: entry.entry_type,
      description: entry.description.trim().slice(0, 500),
      amount,
      occurred_at: entry.occurred_at,
      created_by: userId,
    };
  });
}

function mapIngredients(ingredients) {
  return ingredients.map((ingredient) => {
    const name =
      typeof ingredient.name === "string" ? ingredient.name.trim() : "";
    const unitCost = Number(ingredient.unit_cost);
    const stock = Number(ingredient.stock_on_hand);
    if (
      !name ||
      name.length > 120 ||
      !Number.isFinite(unitCost) ||
      unitCost < 0 ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      throw new Error("An ingredient has invalid fields.");
    }

    return {
      name,
      unit:
        typeof ingredient.unit === "string" && ingredient.unit.trim()
          ? ingredient.unit.trim().slice(0, 32)
          : "unit",
      unit_cost: unitCost,
      stock_on_hand: stock,
    };
  });
}

async function syncLedger(supabase, user, payload) {
  const { entries = [], ingredients = [], purchases = [] } = payload ?? {};
  requireArray(entries, "entries", 2000);
  requireArray(ingredients, "ingredients", 500);
  requireArray(purchases, "purchases", 5000);

  const safeEntries = mapEntries(entries, user.id);
  if (safeEntries.length) {
    const { error } = await supabase
      .from("entries")
      .upsert(safeEntries, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }

  const safeIngredients = mapIngredients(ingredients);
  let ingredientIds = new Map();
  if (safeIngredients.length) {
    const { data, error } = await supabase
      .from("ingredients")
      .upsert(safeIngredients, { onConflict: "name" })
      .select("id,name");
    if (error) throw error;
    ingredientIds = new Map(
      data.map((ingredient) => [
        ingredient.name.toLocaleLowerCase(),
        ingredient.id,
      ]),
    );
  }

  const safePurchases = purchases.map((purchase) => {
    const quantity = Number(purchase.quantity);
    const totalPaid = Number(purchase.total_paid);
    const ingredientId = ingredientIds.get(
      typeof purchase.name === "string"
        ? purchase.name.trim().toLocaleLowerCase()
        : "",
    );
    if (
      !validUuid(purchase.id) ||
      !ingredientId ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(totalPaid) ||
      totalPaid <= 0 ||
      Number.isNaN(Date.parse(purchase.purchased_at))
    ) {
      throw new Error("An ingredient purchase has invalid fields.");
    }

    return {
      id: purchase.id,
      ingredient_id: ingredientId,
      quantity,
      unit_cost: totalPaid / quantity,
      record_as_expense: purchase.record_as_expense !== false,
      purchased_at: purchase.purchased_at,
      created_by: user.id,
    };
  });

  if (safePurchases.length) {
    const { error } = await supabase
      .from("ingredient_purchases")
      .upsert(safePurchases, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }

  for (const ingredient of safeIngredients) {
    const ingredientId = ingredientIds.get(ingredient.name.toLocaleLowerCase());
    const { error } = await supabase
      .from("ingredients")
      .update({
        stock_on_hand: ingredient.stock_on_hand,
        unit_cost: ingredient.unit_cost,
      })
      .eq("id", ingredientId);
    if (error) throw error;
  }

  return {
    entryCount: safeEntries.length,
    ingredientCount: safeIngredients.length,
    purchaseCount: safePurchases.length,
  };
}

async function clearLedger(supabase, user) {
  // 1. Collect the ingredient IDs linked to this user's purchases before deletion
  const { data: userPurchases } = await supabase
    .from("ingredient_purchases")
    .select("ingredient_id")
    .eq("created_by", user.id);

  const ingredientIds = [
    ...new Set((userPurchases ?? []).map((p) => p.ingredient_id).filter(Boolean)),
  ];

  // 2. Delete this user's purchases
  const { error: purchasesError } = await supabase
    .from("ingredient_purchases")
    .delete()
    .eq("created_by", user.id);
  if (purchasesError) throw purchasesError;

  // 3. Delete the ingredients that belonged to this user (identified via purchases)
  if (ingredientIds.length) {
    const { error: ingredientsError } = await supabase
      .from("ingredients")
      .delete()
      .in("id", ingredientIds);
    if (ingredientsError) throw ingredientsError;
  }

  // 4. Delete this user's ledger entries
  const { error: entriesError } = await supabase
    .from("entries")
    .delete()
    .eq("created_by", user.id);
  if (entriesError) throw entriesError;
}

module.exports = { syncLedger, clearLedger };

