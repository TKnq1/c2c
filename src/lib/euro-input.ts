// Reads an amount the way a person in Germany types it: "5.600" is five thousand six hundred, "12,5" is twelve and a half,
// "1.234,56" and "1234.56" are both one thousand two hundred thirty-four and fifty-six cents. Returns NaN for anything else.
export function parseEuroInput(text: string): number {
  const t = text.trim().replace(/[\s€]/g, "");
  if (t === "") return NaN;
  if (t.includes(",")) return Number(t.replace(/\./g, "").replace(",", "."));
  // Dots only: groups of exactly three digits after the first are thousands separators, anything else is a decimal point.
  if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ""));
  return Number(t);
}
