import {
  ImagePlus,
  Pencil,
  Plus,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react";
import { currency, grahamFlavors } from "../logic/ledger.js";
import { useIngredientInventory } from "../hooks/useIngredientInventory.js";

export default function IngredientInventory({ period = "month" }) {
  const {
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
    availableFlavors = [],
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
    newManualIngredientLine,
    newReceiptLine,
  } = useIngredientInventory(period);

  return (
    <section className="ledger-inventory-view">
      <div className="ledger-panel-heading">
        <div>
          <h2>Input ingredients</h2>
          <p>Check ingredient quantities and average costs</p>
        </div>
        <div className="ledger-inventory-actions">
          <button
            className="ledger-button secondary small"
            onClick={openReceiptDialog}
          >
            <ImagePlus size={14} /> Add receipt
          </button>
          <button
            className="ledger-button primary small"
            onClick={openManualDialog}
          >
            <Plus size={14} /> Add ingredient
          </button>
        </div>
      </div>

      {notice && (
        <p className="ledger-inventory-notice" role="status">
          {notice}
        </p>
      )}

      <section className="ledger-panel ledger-stock-panel">
        <div className="ledger-panel-heading">
          <div>
            <h2>Ingredients on hand</h2>
            <p>Stock quantity and average cost per unit</p>
          </div>
          <div className="ledger-ingredient-total">
            <span>Total price</span>
            <strong>{currency.format(totalIngredientPurchases)}</strong>
          </div>
        </div>
        {ingredients.length === 0 ? (
          <div className="ledger-empty-stock">
            <ShoppingBasket size={20} aria-hidden="true" />
            <strong>No ingredients yet</strong>
            <span>
              Add a purchase manually or upload a receipt to get started.
            </span>
          </div>
        ) : (
          <div className="ledger-stock-list">
            {ingredients.map((item) => (
              <div className="ledger-stock-row" key={item.id}>
                <span className="ledger-stock-mark">
                  {item.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="ledger-stock-name">
                  <strong>{item.name}</strong>
                  <small>
                    {currency.format(item.unitCost)} / {item.unit}
                  </small>
                </span>
                <strong className="ledger-stock-quantity">
                  {item.quantity} {item.unit}
                </strong>
                <strong className="ledger-stock-value">
                  {currency.format(item.quantity * item.unitCost)}
                </strong>
                <div className="ledger-stock-row-actions">
                  <button
                    className="ledger-stock-action"
                    type="button"
                    aria-label={`Edit ${item.name}`}
                    title="Edit ingredient"
                    onClick={() => openEditIngredient(item)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="ledger-stock-action danger"
                    type="button"
                    aria-label={`Delete ${item.name}`}
                    title="Delete ingredient"
                    onClick={() => {
                      setPendingIngredientDelete(item);
                      setDialog("delete-ingredient");
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {dialog === "edit-ingredient" && editingIngredient && (
        <div
          className="ledger-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setDialog(null)
          }
        >
          <section
            className="ledger-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-ingredient-title"
          >
            <div className="ledger-modal-heading">
              <div>
                <span className="ledger-small-label">GRAHAM STOCK</span>
                <h2 id="edit-ingredient-title">Edit ingredient</h2>
                <p>Update the name, unit, quantity, or average cost.</p>
              </div>
              <button
                className="ledger-icon-link"
                type="button"
                aria-label="Close dialog"
                onClick={() => setDialog(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveIngredientEdit}>
              <label className="ledger-field">
                Ingredient name
                <input
                  autoFocus
                  required
                  maxLength={120}
                  value={editingIngredient.name}
                  onChange={(event) =>
                    setEditingIngredient((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="ledger-field">
                Unit
                <input
                  required
                  maxLength={32}
                  value={editingIngredient.unit}
                  onChange={(event) =>
                    setEditingIngredient((current) => ({
                      ...current,
                      unit: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="ledger-field">
                Quantity on hand
                <input
                  required
                  min="0"
                  step="any"
                  type="number"
                  value={editingIngredient.quantity}
                  onChange={(event) =>
                    setEditingIngredient((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="ledger-field">
                Average cost per unit
                <input
                  required
                  min="0"
                  step="any"
                  type="number"
                  value={editingIngredient.unitCost}
                  onChange={(event) =>
                    setEditingIngredient((current) => ({
                      ...current,
                      unitCost: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="ledger-modal-actions">
                <button
                  type="button"
                  className="ledger-button secondary"
                  onClick={() => setDialog(null)}
                >
                  Cancel
                </button>
                <button className="ledger-button primary" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {dialog === "delete-ingredient" && pendingIngredientDelete && (
        <div
          className="ledger-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setDialog(null)
          }
        >
          <section
            className="ledger-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-ingredient-title"
          >
            <div className="ledger-modal-heading">
              <div>
                <span className="ledger-small-label">GRAHAM STOCK</span>
                <h2 id="delete-ingredient-title">Delete ingredient?</h2>
                <p>
                  {pendingIngredientDelete.name} and its purchase records will
                  be removed from this browser.
                </p>
              </div>
              <button
                className="ledger-icon-link"
                type="button"
                aria-label="Close dialog"
                onClick={() => setDialog(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="ledger-modal-actions">
              <button
                type="button"
                className="ledger-button secondary"
                onClick={() => setDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ledger-button primary ledger-danger-button"
                onClick={deleteIngredient}
              >
                Delete ingredient
              </button>
            </div>
          </section>
        </div>
      )}

      {dialog === "confirm" && pendingConfirmation && (
        <div className="ledger-modal-backdrop">
          <section
            className="ledger-modal ledger-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-ingredients-title"
          >
            <div className="ledger-modal-heading">
              <div>
                <span className="ledger-small-label" id="confirm-ingredients-title">
                  FINAL REVIEW
                </span>
              </div>
              <button
                className="ledger-icon-link"
                aria-label="Cancel confirmation"
                onClick={() => setDialog(pendingConfirmation.source)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ledger-confirmation-banner">
              <span className="ledger-confirmation-badge">
                Flavor:{" "}
                <strong>
                  {availableFlavors.find(
                    (flavor) => flavor.id === pendingConfirmation.flavorId,
                  )?.name ??
                    grahamFlavors.find(
                      (flavor) => flavor.id === pendingConfirmation.flavorId,
                    )?.name ??
                    "Graham Bar"}
                </strong>
              </span>
              <span className="ledger-confirmation-badge total">
                Total price:{" "}
                <strong>
                  {currency.format(
                    pendingConfirmation.lines.reduce(
                      (sum, line) => sum + (Number(line.totalPaid) || 0),
                      0,
                    ),
                  )}
                </strong>
              </span>
            </div>

            <div className="ledger-confirmation-list">
              {pendingConfirmation.lines.map((line, index) => {
                const isManual = pendingConfirmation.source === "manual";
                return (
                  <div className="ledger-confirmation-row" key={index}>
                    <label className="ledger-confirmation-field">
                      <span>Name</span>
                      <input
                        required
                        aria-label={`Ingredient ${index + 1} name`}
                        value={line.name}
                        onChange={(event) =>
                          updatePendingLine(index, "name", event.target.value)
                        }
                      />
                    </label>
                    <label className="ledger-confirmation-field ledger-confirmation-field--qty">
                      <span>Quantity</span>
                      <input
                        required
                        aria-label={`Ingredient ${index + 1} quantity`}
                        type="number"
                        min="0.0001"
                        step="any"
                        value={line.quantity}
                        onChange={(event) =>
                          updatePendingLine(index, "quantity", event.target.value)
                        }
                      />
                    </label>
                    {!isManual && (
                      <label className="ledger-confirmation-field ledger-confirmation-field--unit">
                        <span>Unit</span>
                        <input
                          required
                          aria-label={`Ingredient ${index + 1} unit`}
                          value={line.unit}
                          onChange={(event) =>
                            updatePendingLine(index, "unit", event.target.value)
                          }
                        />
                      </label>
                    )}
                    <label className="ledger-confirmation-field ledger-confirmation-field--price">
                      <span>Total price</span>
                      <input
                        required
                        aria-label={`Ingredient ${index + 1} total price`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.totalPaid}
                        onChange={(event) =>
                          updatePendingLine(
                            index,
                            "totalPaid",
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="ledger-modal-actions">
              <button
                type="button"
                className="ledger-button secondary"
                onClick={() => setDialog(pendingConfirmation.source)}
              >
                Back to edit
              </button>
              <button
                type="button"
                className="ledger-button primary"
                disabled={pendingConfirmation.lines.some(
                  (line) =>
                    !line.name.trim() ||
                    !line.unit.trim() ||
                    !Number.isFinite(Number(line.quantity)) ||
                    Number(line.quantity) <= 0 ||
                    !Number.isFinite(Number(line.totalPaid)) ||
                    Number(line.totalPaid) <= 0,
                )}
                onClick={confirmPurchase}
              >
                Confirm and add
              </button>
            </div>
          </section>
        </div>
      )}

      {dialog === "manual" && (
        <div
          className="ledger-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setDialog(null)
          }
        >
          <section
            className="ledger-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-ingredient-title"
          >
            <div className="ledger-modal-heading">
              <div>
                <span className="ledger-small-label" id="manual-ingredient-title">
                  STOCK PURCHASE
                </span>
              </div>
              <button
                className="ledger-icon-link"
                aria-label="Close dialog"
                onClick={() => setDialog(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                reviewPurchaseLines(
                  manualItems.map((item) => ({ ...item, unit: "unit" })),
                  true,
                  manualFlavor,
                  "manual",
                );
              }}
            >
              <label className="ledger-field ledger-flavor-select">
                Flavor
                <select
                  value={manualFlavor}
                  onChange={(event) => setManualFlavor(event.target.value)}
                >
                  {(availableFlavors.length > 0 ? availableFlavors : grahamFlavors).map((flavor) => (
                    <option value={flavor.id} key={flavor.id}>
                      {flavor.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="ledger-manual-ingredient-list">
                {manualItems.map((item, index) => (
                  <div className="ledger-manual-ingredient-row" key={item.id}>
                    <label className="ledger-field ledger-manual-field">
                      <span>Name</span>
                      <input
                        autoFocus={index === 0}
                        required
                        value={item.name}
                        onChange={(event) =>
                          setManualItems((current) =>
                            current.map((line) =>
                              line.id === item.id
                                ? { ...line, name: event.target.value }
                                : line,
                            ),
                          )
                        }
                        placeholder="e.g. Graham crackers"
                      />
                    </label>
                    <label className="ledger-field ledger-manual-field ledger-manual-field--sm">
                      <span>Quantity</span>
                      <input
                        required
                        min="0.0001"
                        step="any"
                        type="number"
                        value={item.quantity}
                        onChange={(event) =>
                          setManualItems((current) =>
                            current.map((line) =>
                              line.id === item.id
                                ? { ...line, quantity: event.target.value }
                                : line,
                            ),
                          )
                        }
                        placeholder="0"
                      />
                    </label>
                    <label className="ledger-field ledger-manual-field ledger-manual-field--sm">
                      <span>Total price</span>
                      <input
                        required
                        min="0.01"
                        step="0.01"
                        type="number"
                        value={item.totalPaid}
                        onChange={(event) =>
                          setManualItems((current) =>
                            current.map((line) =>
                              line.id === item.id
                                ? { ...line, totalPaid: event.target.value }
                                : line,
                            ),
                          )
                        }
                        placeholder="0.00"
                      />
                    </label>
                    <button
                      className="ledger-remove-line"
                      type="button"
                      aria-label={`Remove ingredient ${index + 1}`}
                      disabled={manualItems.length === 1}
                      onClick={() =>
                        setManualItems((current) =>
                          current.filter((line) => line.id !== item.id),
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="ledger-text-button ledger-add-ingredient-line"
                type="button"
                onClick={() =>
                  setManualItems((current) => [
                    ...current,
                    newManualIngredientLine(),
                  ])
                }
              >
                <Plus size={13} /> Add another ingredient
              </button>
              <div className="ledger-modal-actions">
                <button
                  type="button"
                  className="ledger-button secondary"
                  onClick={() => setDialog(null)}
                >
                  Cancel
                </button>
                <button className="ledger-button primary" type="submit">
                  Save ingredient
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {dialog === "receipt" && (
        <div
          className="ledger-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && !ocrBusy && setDialog(null)
          }
        >
          <section
            className="ledger-modal receipt-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
          >
            <div className="ledger-modal-heading">
              <div>
                <span className="ledger-small-label">LOCAL RECEIPT SCAN</span>
                <h2 id="receipt-title">Review receipt items</h2>
                <p>
                  Text is read in your browser. Correct the suggestions before
                  adding stock.
                </p>
              </div>
              <button
                className="ledger-icon-link"
                aria-label="Close dialog"
                disabled={ocrBusy}
                onClick={() => setDialog(null)}
              >
                <X size={18} />
              </button>
            </div>
            <input
              className="ledger-file-input"
              ref={fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleReceiptSelect}
            />
            {!receiptFile ? (
              <button
                className="ledger-receipt-drop"
                onClick={() => fileInput.current?.click()}
                type="button"
              >
                <ImagePlus size={22} />
                <strong>Choose or take a receipt photo</strong>
                <span>JPG, PNG, or another image format</span>
              </button>
            ) : (
              <div className="ledger-receipt-preview">
                <img src={receiptPreview} alt="Selected receipt" />
                <span>{receiptFile.name}</span>
                <button
                  className="ledger-text-button"
                  type="button"
                  disabled={ocrBusy}
                  onClick={() => fileInput.current?.click()}
                >
                  Choose another photo
                </button>
              </div>
            )}
            {ocrBusy && (
              <div className="ledger-ocr-progress" role="status">
                <span>Reading receipt · {ocrProgress}%</span>
                <progress max="100" value={ocrProgress} />
              </div>
            )}
            {receiptNotice && (
              <p className="ledger-receipt-notice" role="status">
                {receiptNotice}
              </p>
            )}
            {receiptError && (
              <p className="ledger-receipt-error" role="alert">
                OCR error: {receiptError} Check the browser console for details.
              </p>
            )}
            {receiptLines.length > 0 && (
              <>
                <div className="ledger-review-heading">
                  <strong>Items to add</strong>
                  <button
                    type="button"
                    className="ledger-text-button"
                    onClick={() =>
                      setReceiptLines((current) => [
                        ...current,
                        newReceiptLine(),
                      ])
                    }
                  >
                    <Plus size={13} /> Add a line
                  </button>
                </div>
                <div className="ledger-review-list">
                  <div className="ledger-review-head">
                    <span>Item name</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span>Total paid</span>
                    <span />
                  </div>
                  {receiptLines.map((line, index) => (
                    <div className="ledger-review-row" key={line.id}>
                      <input
                        aria-label={`Item ${index + 1} name`}
                        value={line.name}
                        onChange={(event) =>
                          updateReceiptLine(line.id, "name", event.target.value)
                        }
                        placeholder="Ingredient"
                      />
                      <input
                        aria-label={`Item ${index + 1} quantity`}
                        type="number"
                        min="0.0001"
                        step="any"
                        value={line.quantity}
                        onChange={(event) =>
                          updateReceiptLine(
                            line.id,
                            "quantity",
                            event.target.value,
                          )
                        }
                      />
                      <input
                        aria-label={`Item ${index + 1} unit`}
                        value={line.unit ?? "piece"}
                        onChange={(event) =>
                          updateReceiptLine(line.id, "unit", event.target.value)
                        }
                        placeholder="unit"
                      />
                      <input
                        aria-label={`Item ${index + 1} total paid`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.totalPaid}
                        onChange={(event) =>
                          updateReceiptLine(
                            line.id,
                            "totalPaid",
                            event.target.value,
                          )
                        }
                        placeholder="0.00"
                      />
                      <button
                        className="ledger-remove-line"
                        aria-label={`Remove item ${index + 1}`}
                        type="button"
                        onClick={() =>
                          setReceiptLines((current) =>
                            current.filter((item) => item.id !== line.id),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="ledger-checkbox">
                  <input
                    type="checkbox"
                    checked={recordReceiptExpense}
                    onChange={(event) =>
                      setRecordReceiptExpense(event.target.checked)
                    }
                  />
                  <span>Record these purchases as Graham Bar expenses</span>
                </label>
              </>
            )}
            {receiptText && (
              <details className="ledger-ocr-text">
                <summary>Show recognized text</summary>
                <pre>{receiptText}</pre>
              </details>
            )}
            <div className="ledger-modal-actions">
              <button
                type="button"
                className="ledger-button secondary"
                disabled={ocrBusy}
                onClick={() => setDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ledger-button primary"
                disabled={ocrBusy || receiptLines.length === 0}
                onClick={() =>
                  reviewPurchaseLines(
                    receiptLines,
                    recordReceiptExpense,
                    null,
                    "receipt",
                  )
                }
              >
                Review ingredients
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
