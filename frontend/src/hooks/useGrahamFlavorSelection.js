import { useState } from "react";
import { grahamFlavors } from "../logic/ledger.js";

export function useGrahamFlavorSelection() {
  const [selectedFlavor, setSelectedFlavor] = useState(grahamFlavors[0]);
  return { selectedFlavor, setSelectedFlavor };
}
