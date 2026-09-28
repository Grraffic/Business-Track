import { useState } from "react";
import { getDemoSummary, getPeriodLabel } from "../logic/ledger.js";

function localDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function presetDateRange(selection) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);

  if (selection === "yesterday") {
    start.setDate(start.getDate() - 1);
  } else if (selection === "week") {
    start.setDate(start.getDate() - 6);
  } else if (selection === "month") {
    start.setDate(1);
  } else if (selection !== "today") {
    return null;
  }

  return { startDate: localDateValue(start), endDate: localDateValue(end) };
}

export function useDemoLedger(page = "overview") {
  const [periodSelection, setPeriodSelection] = useState("month");
  const initialRange = presetDateRange("month");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [selectedDate, setSelectedDate] = useState(() =>
    localDateValue(new Date()),
  );
  const [isLoading, setIsLoading] = useState(false);
  const period =
    periodSelection === "custom"
      ? { type: "custom", startDate, endDate }
      : periodSelection === "date"
        ? { type: "date", date: selectedDate }
        : periodSelection;
  const setPeriod = (selection) => {
    setPeriodSelection(selection);
    const range = presetDateRange(selection);
    if (range) {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  const refresh = () => {
    if (isLoading) return;
    setIsLoading(true);
    window.setTimeout(() => setIsLoading(false), 1350);
  };

  return {
    page,
    period,
    periodSelection,
    setPeriod,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedDate,
    setSelectedDate,
    isLoading,
    refresh,
    periodLabel: getPeriodLabel(period),
    ...getDemoSummary(page, period),
  };
}
