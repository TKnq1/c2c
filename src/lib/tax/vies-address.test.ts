import { describe, expect, it } from "vitest";
import { parseViesAddress, tidyCase, viesName } from "@/lib/tax/vies-address";

describe("tidyCase", () => {
  it("lowers text that is all capitals, word by word", () => {
    expect(tidyCase("MUSTERSTRASSE 1")).toBe("Musterstrasse 1");
    expect(tidyCase("SAINT-DENIS")).toBe("Saint-Denis");
    expect(tidyCase("RUE DE L'EGLISE 4")).toBe("Rue De L'eglise 4");
  });

  it("leaves mixed case and numbers alone", () => {
    expect(tidyCase("Glow GmbH")).toBe("Glow GmbH");
    expect(tidyCase("12/3")).toBe("12/3");
  });
});

describe("parseViesAddress", () => {
  it("reads a German address", () => {
    expect(parseViesAddress("MUSTERSTRASSE 1\n10115 BERLIN")).toEqual({ addressLine1: "Musterstrasse 1", addressLine2: "", postalCode: "10115", city: "Berlin" });
  });

  it("reads a Dutch postcode with letters, a Polish one with a dash and a French one", () => {
    expect(parseViesAddress("KALVERSTRAAT 10\n1011 AB AMSTERDAM")).toMatchObject({ postalCode: "1011 AB", city: "Amsterdam" });
    expect(parseViesAddress("UL. MARSZALKOWSKA 1\n00-001 WARSZAWA")).toMatchObject({ postalCode: "00-001", city: "Warszawa" });
    expect(parseViesAddress("12 RUE DE RIVOLI\n75001 PARIS")).toMatchObject({ addressLine1: "12 Rue De Rivoli", postalCode: "75001", city: "Paris" });
  });

  it("keeps further lines above the postcode as the second address line", () => {
    expect(parseViesAddress("C/O GLOW\nHAUPTSTRASSE 2\n1010 WIEN")).toEqual({ addressLine1: "C/O Glow", addressLine2: "Hauptstrasse 2", postalCode: "1010", city: "Wien" });
  });

  it("gives what it can when no line reads as postcode and place", () => {
    expect(parseViesAddress("SOMEWHERE 5")).toEqual({ addressLine1: "Somewhere 5", addressLine2: "", postalCode: "", city: "" });
  });

  it("is null when the member state does not hand the address out", () => {
    expect(parseViesAddress("---")).toBeNull();
    expect(parseViesAddress("  ")).toBeNull();
    expect(parseViesAddress(null)).toBeNull();
  });
});

describe("viesName", () => {
  it("tidies the registered name and drops the placeholder", () => {
    expect(viesName("GLOW BEAUTY GMBH")).toBe("Glow Beauty Gmbh");
    expect(viesName("Glow Beauty GmbH")).toBe("Glow Beauty GmbH");
    expect(viesName("---")).toBeNull();
  });
});
