import { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { useGrahamFlavorSelection } from "../hooks/useGrahamFlavorSelection.js";
import GrahamFlavorInventory from "./GrahamFlavorInventory.jsx";

export default function GrahamBarInventory({ period }) {
  const {
    selectedFlavor,
    setSelectedFlavor,
    allFlavors,
    customFlavors,
    addCustomFlavor,
    deleteCustomFlavor,
  } = useGrahamFlavorSelection();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFlavorName, setNewFlavorName] = useState("");
  const [addError, setAddError] = useState("");

  const tabId = `graham-flavor-tab-${selectedFlavor.id}`;
  const panelId = `graham-flavor-panel-${selectedFlavor.id}`;

  const handleAddFlavor = (event) => {
    event.preventDefault();
    const result = addCustomFlavor(newFlavorName);
    if (result.error) {
      setAddError(result.error);
    } else {
      setNewFlavorName("");
      setAddError("");
      setShowAddForm(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewFlavorName("");
    setAddError("");
  };

  const isCustom = (flavorId) =>
    customFlavors.some((f) => f.id === flavorId);

  return (
    <section className="ledger-graham-inventory">
      <div className="ledger-panel-heading">
        <div>
          <h2>Graham Bar flavors</h2>
        </div>
        <button
          type="button"
          className="ledger-button secondary ledger-add-flavor-toggle"
          onClick={() => setShowAddForm((v) => !v)}
          aria-expanded={showAddForm}
          aria-label="Add a new Graham Bar flavor"
        >
          <PlusCircle size={14} />
          Add flavor
        </button>
      </div>

      {showAddForm && (
        <form
          className="ledger-add-flavor-form"
          onSubmit={handleAddFlavor}
          aria-label="New flavor form"
        >
          <label className="ledger-field ledger-add-flavor-field">
            <span>New flavor name</span>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Strawberry"
              value={newFlavorName}
              onChange={(e) => {
                setNewFlavorName(e.target.value);
                setAddError("");
              }}
              maxLength={40}
            />
          </label>
          {addError && (
            <p className="ledger-add-flavor-error" role="alert">
              {addError}
            </p>
          )}
          <div className="ledger-add-flavor-actions">
            <button className="ledger-button primary" type="submit">
              Add flavor
            </button>
            <button
              className="ledger-button secondary"
              type="button"
              onClick={handleCancelAdd}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div
        className="ledger-flavor-tabs"
        role="tablist"
        aria-label="Graham Bar flavors"
      >
        {allFlavors.map((flavor) => {
          const isSelected = flavor.id === selectedFlavor.id;
          const canDelete = isCustom(flavor.id);
          return (
            <div key={flavor.id} className="ledger-flavor-tab-wrapper">
              <button
                className={`ledger-flavor-tab ${isSelected ? "active" : ""}`}
                id={`graham-flavor-tab-${flavor.id}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`graham-flavor-panel-${flavor.id}`}
                onClick={() => setSelectedFlavor(flavor)}
              >
                {flavor.name}
              </button>
              {canDelete && (
                <button
                  type="button"
                  className="ledger-flavor-tab-delete"
                  aria-label={`Remove ${flavor.name} flavor`}
                  title={`Remove ${flavor.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomFlavor(flavor.id);
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId}
        className="ledger-flavor-panel"
      >
        <GrahamFlavorInventory
          key={selectedFlavor.id}
          flavorId={selectedFlavor.id}
          flavorName={selectedFlavor.name}
          period={period}
        />
      </div>
    </section>
  );
}
