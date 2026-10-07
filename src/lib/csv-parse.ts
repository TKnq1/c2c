// Reads a CSV the way spreadsheet exports write it: a delimiter of , ; or tab (picked from the header line), quoted cells
// with "" for a quote, and a leading byte-order mark. Returns rows of cells. Not streaming: ad exports are small.
export function detectDelimiter(headerLine: string): string {
  const [best] = [",", ";", "\t"].map((d) => [d, headerLine.split(d).length - 1] as const).sort((a, b) => b[1] - a[1]);
  return best[1] > 0 ? best[0] : ",";
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const delimiter = detectDelimiter(text.split(/\r?\n/, 1)[0] ?? "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows.map((r) => r.map((x) => x.trim()));
}

// "1.234,56" (German), "1,234.56" (English), "1234.56" and "12" all become a number; anything else is null.
export function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(cleaned)) return null;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normal = cleaned;
  if (lastComma > -1 && lastDot > -1) normal = lastComma > lastDot ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
  else if (lastComma > -1) {
    // One comma followed by one or two digits is a decimal comma; otherwise it groups thousands.
    normal = /,\d{1,2}$/.test(cleaned) && cleaned.split(",").length === 2 ? cleaned.replace(",", ".") : cleaned.replace(/,/g, "");
  } else if ((cleaned.match(/\./g) ?? []).length > 1) normal = cleaned.replace(/\./g, "");
  const n = Number(normal);
  return Number.isFinite(n) ? n : null;
}

// 2026-10-05, 2026-10-05 00:00:00, 05.10.2026 and 10/05/2026 (or 25/12/2026, when the first part cannot be a month)
// become "YYYY-MM-DD"; anything else is null.
export function parseDay(value: string): string | null {
  const v = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  let y: number;
  let m: number;
  let d: number;
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else {
    const dotted = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(v);
    const slashed = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(v);
    if (dotted) [d, m, y] = [Number(dotted[1]), Number(dotted[2]), Number(dotted[3])];
    else if (slashed) {
      const a = Number(slashed[1]);
      const b = Number(slashed[2]);
      [m, d] = a > 12 ? [b, a] : [a, b];
      y = Number(slashed[3]);
    } else return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}
