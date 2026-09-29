import { useEffect, useState } from "react";
import {
  CUSTOM_GRAHAM_FLAVORS_KEY,
  getGrahamFlavors,
  grahamFlavors,
} from "../logic/ledger.js";

function loadCustomFlavors() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_GRAHAM_FLAVORS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveCustomFlavors(flavors) {
  localStorage.setItem(CUSTOM_GRAHAM_FLAVORS_KEY, JSON.stringify(flavors));
  window.dispatchEvent(new CustomEvent("graham-flavors-changed"));
}

export function useGrahamFlavorSelection() {
  const [customFlavors, setCustomFlavors] = useState(loadCustomFlavors);
  const allFlavors = getGrahamFlavors();
  const [selectedFlavor, setSelectedFlavor] = useState(allFlavors[0]);

  useEffect(() => {
    const handleFlavorsChanged = () => {
      setCustomFlavors(loadCustomFlavors());
    };
    window.addEventListener("graham-flavors-changed", handleFlavorsChanged);
    window.addEventListener("storage", handleFlavorsChanged);
    return () => {
      window.removeEventListener("graham-flavors-changed", handleFlavorsChanged);
      window.removeEventListener("storage", handleFlavorsChanged);
    };
  }, []);


  const addCustomFlavor = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { error: "Flavor name cannot be empty." };
    const id = `custom-${trimmed.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const exists = allFlavors.some(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) return { error: "A flavor with that name already exists." };
    const newFlavor = { id, name: trimmed };
    const updated = [...customFlavors, newFlavor];
    saveCustomFlavors(updated);
    setCustomFlavors(updated);
    setSelectedFlavor(newFlavor);
    return { ok: true };
  };

  const deleteCustomFlavor = (flavorId) => {
    const updated = customFlavors.filter((f) => f.id !== flavorId);
    saveCustomFlavors(updated);
    setCustomFlavors(updated);
    if (selectedFlavor.id === flavorId) {
      setSelectedFlavor(allFlavors.find((f) => f.id !== flavorId) ?? grahamFlavors[0]);
    }
  };

  return {
    selectedFlavor,
    setSelectedFlavor,
    allFlavors,
    customFlavors,
    addCustomFlavor,
    deleteCustomFlavor,
  };
}
