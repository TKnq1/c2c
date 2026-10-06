// One CSV cell. A leading = + - @ tab or CR makes a spreadsheet run the cell as a
// formula (data exfiltration, DDE), so it's prefixed with an apostrophe. Every
// value that comes from another user goes through this.
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function csvRow(cells: string[]): string {
  return cells.map(csvCell).join(",");
}
