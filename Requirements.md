# Family Business System: Plan and Requirements

## 1. Purpose
Track income, expenses, and profit for the family business (Water, Graham Bar, Ice) in one simple app. Every family member sees the same numbers in real time.

## 2. Businesses and fixed prices
| Business | Item | Sell price | Cost |
|---|---|---|---|
| Water | Water | ₱30 | ₱25 |
| Ice | Ice water | ₱5 | ₱0 (to be confirmed) |
| Graham Bar | Graham bar | set in the recipe | calculated from ingredients |

## 3. Requirements

### Must have
- One page per business with income and expense entries.
- Fixed items: tap "Sell", enter the quantity, and the cost is subtracted automatically.
- Profit per business and combined, filtered by today, 7 days, this month, or all time.
- Delete an entry to fix a mistake (a sale removes its cost entry too).
- Real-time updates: every family member sees new entries right away.
- Peso currency and phone-friendly screens.

### Graham Bar inventory
- Enter ingredients with the quantity and the price paid (user input).
- Automatic calculation of cost per unit, cost per bar, and profit per bar.
- Save one recipe (ingredients per batch, bars per batch, selling price).
- Recording a production batch subtracts ingredients from stock automatically.
- Low-stock warning when there isn't enough for one batch.
- Buying ingredients is recorded as a Graham Bar expense (can be switched off).

### Receipt photo
- Take or upload a photo of the receipt and the system fills in the ingredients, quantities, and prices.
- The user checks and corrects the list before saving, because receipts can be blurry or hand-written.

### Later (nice to have)
- Stock counts for Water and Ice (bags of ice made and sold).
- Export to Excel for backup and sharing.
- Monthly summary and charts.
- Roles: the owner sees profit, helpers only record sales.
- Record who entered each transaction.
- Edit fixed items without deleting and re-adding them.

### Non-functional
- Works on any phone with no app store.
- Low or no monthly cost.
- Data is stored online, so a broken phone does not lose records.
- Only invited family members can view or edit.

Option for later, if the business grows: React app with Supabase (database and login), hosted on Vercel or Cloudflare Pages. This gives roles, offline recording, and Excel export.

## 5. Data
- Items: business, name, sell price, cost.
- Entries: business, income or expense, description, amount, date.
- Ingredients: name, unit, cost per unit, stock on hand.
- Recipe: quantity of each ingredient per batch, bars per batch, selling price.

## 6. Roadmap
1. Done: dashboard, income/expense pages for the three businesses, real-time sharing.
2. Done: Graham Bar stock, recipe cost, batch recording, receipt photo.
3. Next: test with real daily use for 1 to 2 weeks and list what feels wrong.
4. Then: fix items, set the real Ice cost, add editing of fixed items.
5. Later: Excel export, Water and Ice stock, roles, monthly charts.

## 7. Open questions
- What is the cost of the Ice water?
- Who will use the app, and should helpers see the profit or only record sales?
- Which Graham Bar products and sizes do you sell?
- Do you want a daily summary of profit and stock at the end of the day?

## 8. Risks and notes
- Ingredient purchases count as expenses when bought, so Graham Bar profit follows cash spent. Set Graham item costs to ₱0 to avoid counting twice.
- Family members must be invited as Contributors, or they can view but not save.
- Receipt reading uses Claude usage and can misread items, so always check the list.
- Entries from the first prototype were not carried over.