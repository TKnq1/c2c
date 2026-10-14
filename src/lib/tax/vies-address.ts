// What VIES answers about a VAT ID (a name and an address as free text, usually in capitals) turned into the fields of the
// business form. Member states format the address differently, so this only reads what it can recognise and leaves the rest to
// the person: everything it fills in is shown for checking.

export type ViesAddress = { addressLine1: string; addressLine2: string; postalCode: string; city: string };

// VIES writes "---" where a member state does not hand out the data (Germany often does not).
function usable(text: string | null | undefined): string | null {
  const value = (text ?? "").trim();
  return value && !/^[-–—\s]+$/.test(value) ? value : null;
}

// "MUSTERSTRASSE 1" -> "Musterstrasse 1", but only when the text is all capitals: mixed case is somebody's own spelling.
export function tidyCase(text: string): string {
  if (text !== text.toUpperCase() || text === text.toLowerCase()) return text;
  return text.toLowerCase().replace(/(^|[\s\-/.(])(\p{L})/gu, (_all, edge: string, letter: string) => edge + letter.toUpperCase());
}

// Postcode and place on one line: "10115 BERLIN", "75008 PARIS", "00-001 Warszawa", "1011 AB AMSTERDAM", "1010 WIEN", "AT-1010 Wien".
const POSTCODE_LINE = /^(?:[A-Z]{1,2}[- ])?(\d{4}\s?[A-Z]{2}|\d{2}-\d{3}|\d{3}\s?\d{2}|\d{4,5})\s+(\S.*)$/i;

export function parseViesAddress(raw: string | null | undefined): ViesAddress | null {
  const text = usable(raw);
  if (!text) return null;
  const lines = text
    .split(/\r?\n|\s{3,}/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  // The last line that reads as "postcode place" ends the address; whatever stands above it is the street and further lines.
  let index = -1;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (POSTCODE_LINE.test(lines[i])) {
      index = i;
      break;
    }
  }
  if (index === -1) return { addressLine1: tidyCase(lines[0]), addressLine2: lines.slice(1).map(tidyCase).join(", "), postalCode: "", city: "" };

  const match = POSTCODE_LINE.exec(lines[index])!;
  const street = lines.slice(0, index).map(tidyCase);
  return {
    addressLine1: street[0] ?? "",
    addressLine2: street.slice(1).join(", "),
    postalCode: match[1].replace(/\s+/g, " ").toUpperCase(),
    city: tidyCase(match[2]),
  };
}

export function viesName(raw: string | null | undefined): string | null {
  const text = usable(raw);
  return text ? tidyCase(text.replace(/\s+/g, " ")) : null;
}
