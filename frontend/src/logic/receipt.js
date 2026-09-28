const ignoredReceiptLabels =
  /^(subtotal|sub total|total|tax|vat|change|cash|payment|discount|amount due|balance|thank you)\b/i;

export function parseReceiptLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter((line) => line && !ignoredReceiptLabels.test(line))
    .flatMap((line, index) => {
      const priceMatch = line.match(/(?:₱|PHP\s*)?([\d,]+(?:\.\d{1,2})?)\s*$/i);
      if (!priceMatch) return [];

      const totalPaid = Number(priceMatch[1].replaceAll(",", ""));
      if (!Number.isFinite(totalPaid) || totalPaid <= 0) return [];

      const description = line.slice(0, priceMatch.index).trim();
      const quantityMatch = description.match(
        /^(\d+(?:\.\d+)?)\s*[xX×]\s*(.+)$/,
      );
      const quantity = quantityMatch ? Number(quantityMatch[1]) : 1;
      const name = (quantityMatch ? quantityMatch[2] : description)
        .replace(/^[#*\-\s]+/, "")
        .trim();

      if (name.length < 2) return [];
      return [
        {
          id: `receipt-${Date.now()}-${index}`,
          name,
          unit: "piece",
          quantity: String(quantity),
          totalPaid: totalPaid.toFixed(2),
        },
      ];
    });
}
