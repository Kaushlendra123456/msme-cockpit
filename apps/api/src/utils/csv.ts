// Minimal CSV generator — no external dependency needed for straightforward
// tabular exports. Handles commas/quotes/newlines in values correctly.

export const toCsv = (rows: Record<string, any>[]): string => {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escape = (value: any): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];

  return lines.join("\n");
};
