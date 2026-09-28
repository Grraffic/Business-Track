import { grahamFlavors } from "../logic/ledger.js";
import { useGrahamFlavorSelection } from "../hooks/useGrahamFlavorSelection.js";
import GrahamFlavorInventory from "./GrahamFlavorInventory.jsx";

export default function GrahamBarInventory({ period }) {
  const { selectedFlavor, setSelectedFlavor } = useGrahamFlavorSelection();
  const tabId = `graham-flavor-tab-${selectedFlavor.id}`;
  const panelId = `graham-flavor-panel-${selectedFlavor.id}`;

  return (
    <section className="ledger-graham-inventory">
      <div className="ledger-panel-heading">
        <div>
          <h2>Graham Bar flavors</h2>
        </div>
      </div>
      <div
        className="ledger-flavor-tabs"
        role="tablist"
        aria-label="Graham Bar flavors"
      >
        {grahamFlavors.map((flavor) => {
          const isSelected = flavor.id === selectedFlavor.id;
          return (
            <button
              className={`ledger-flavor-tab ${isSelected ? "active" : ""}`}
              id={`graham-flavor-tab-${flavor.id}`}
              key={flavor.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`graham-flavor-panel-${flavor.id}`}
              onClick={() => setSelectedFlavor(flavor)}
            >
              {flavor.name}
            </button>
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
