import { ImageResponse } from "next/og";
import { NICHES } from "@/lib/constants";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Shared artwork for the share previews (opengraph-image files) and the app
// icons. Everything is drawn from two assets: the "cc" mark cropped tight
// from public/logo.png (assets/mark-*.png — the logo file itself carries
// ~40% empty space around the glyph, which is what made the old favicon
// look so small) and Lato, the app's own typeface (assets/fonts, SIL OFL).
// Read once at module scope; none of it depends on the request.

const asset = (path: string) => readFileSync(join(process.cwd(), "assets", path));
const dataUri = (buf: Buffer) => `data:image/png;base64,${buf.toString("base64")}`;

const MARK_BLACK = dataUri(asset("mark-black.png"));
const MARK_WHITE = dataUri(asset("mark-white.png"));
// The mark's width:height (assets are 800×531).
const MARK_RATIO = 531 / 800;

const FONTS = [
  { name: "Lato", data: asset("fonts/Lato-Regular.ttf"), weight: 400 as const, style: "normal" as const },
  { name: "Lato", data: asset("fonts/Lato-Bold.ttf"), weight: 700 as const, style: "normal" as const },
  { name: "Lato", data: asset("fonts/Lato-Black.ttf"), weight: 900 as const, style: "normal" as const },
];

const INK = "#0a0a0a";
const OG_SIZE = { width: 1200, height: 630 };

function Mark({ width, white = false }: { width: number; white?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser
  return <img src={white ? MARK_WHITE : MARK_BLACK} width={width} height={Math.round(width * MARK_RATIO)} alt="" />;
}

// ── Share previews (1200×630) ────────────────────────────────────────────

export type OgVariant = "clean" | "bold" | "product";

export const OG_ALT: Record<OgVariant, string> = {
  clean: "comtor – Brands meet the right creators.",
  bold: "comtor – Where brands meet creators.",
  product: "comtor – Swipe. Match. Get paid.",
};

// The share images exist in German and English. Link previews are fetched without a language choice, so the
// default language (German) is what they usually show. Any other language gets the English text.
const OG_TEXT = {
  en: {
    cleanA: "Brands meet",
    cleanB: "the right creators.",
    cleanSub: "Post a request, get matched, pay once the deal is agreed.",
    cleanSize: 92,
    tagline: "Brand-Creator Marketplace",
    boldA: "Where brands",
    boldB: "meet creators.",
    prodA: "Swipe. Match.",
    prodB: "Get paid.",
    prodSub: "The marketplace for brand × creator collabs.",
    prodSize: 80,
    cardBrand: "Glow Beauty Co",
    cardTitle: "Serum launch reel",
    cardBody: "Show your morning routine with our new serum, honest first impressions.",
    chipA: "1 Reel + 2 Stories",
    chipB: "Product included",
    offer: "OFFER ACCEPTED",
    offerNote: "Held until you approve the post.",
  },
  de: {
    cleanA: "Marken treffen",
    cleanB: "die richtigen Creator.",
    cleanSub: "Anfrage posten, Match finden, bezahlen, sobald der Deal steht.",
    cleanSize: 78,
    tagline: "Marktplatz für Marken und Creator",
    boldA: "Wo Marken",
    boldB: "Creator treffen.",
    prodA: "Swipen. Matchen.",
    prodB: "Bezahlt werden.",
    prodSub: "Der Marktplatz für Marken × Creator.",
    prodSize: 64,
    cardBrand: "Glow Beauty Co",
    cardTitle: "Serum-Launch-Reel",
    cardBody: "Zeig deine Morgenroutine mit unserem neuen Serum, ehrliche erste Eindrücke.",
    chipA: "1 Reel + 2 Stories",
    chipB: "Produkt inklusive",
    offer: "ANGEBOT ANGENOMMEN",
    offerNote: "Zurückgehalten, bis du den Post bestätigst.",
  },
} as const;

type OgText = (typeof OG_TEXT)[keyof typeof OG_TEXT];
const ogText = (locale: string): OgText => (locale === "de" ? OG_TEXT.de : OG_TEXT.en);

export function ogImage(variant: OgVariant, locale: string = "en") {
  const text = ogText(locale);
  const art =
    variant === "clean" ? <Clean text={text} /> : variant === "bold" ? <Bold lines={[text.boldA, text.boldB]} /> : <Product text={text} />;
  return new ImageResponse(art, { ...OG_SIZE, fonts: FONTS });
}

// Default for pages without one of their own: calm, white, just the claim.
function Clean({ text }: { text: OgText }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        padding: "72px 80px",
        fontFamily: "Lato",
        color: INK,
      }}
    >
      <Mark width={150} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: text.cleanSize, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
          <span>{text.cleanA}</span>
          <span>{text.cleanB}</span>
        </div>
        <div style={{ fontSize: 32, color: "#5a5a5a", marginTop: 22 }}>
          {text.cleanSub}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28 }}>
        <span style={{ fontWeight: 900 }}>comtor</span>
        <span style={{ color: "#8a8a8a" }}>{text.tagline}</span>
      </div>
    </div>
  );
}

// A niche page's preview: the Bold artwork with its own two-line headline and its niche picked out.
export function ogNiche(lines: [string, string], active: string) {
  return new ImageResponse(<Bold lines={lines} active={active} size={84} />, { ...OG_SIZE, fonts: FONTS });
}

// Sign-up: black, loud, with the niches creators pick from.
function Bold({
  lines,
  active = "Beauty",
  size = 104,
}: {
  lines: [string, string];
  active?: string;
  size?: number;
}) {
  // Six chips fit the width: the active niche first, then the others in the usual order.
  const all: readonly string[] = NICHES;
  const niches = [...(all.includes(active) ? [active] : []), ...all.filter((n) => n !== active)].slice(0, 6);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: INK,
        padding: "72px 80px",
        fontFamily: "Lato",
        color: "#ffffff",
      }}
    >
      <Mark width={130} white />
      <div style={{ display: "flex", flexDirection: "column", fontSize: size, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em" }}>
        <span>{lines[0]}</span>
        <span>{lines[1]}</span>
      </div>
      <div style={{ display: "flex", gap: 14 }}>
        {niches.map((n) => (
          <div
            key={n}
            style={{
              display: "flex",
              borderRadius: 4,
              padding: "12px 26px",
              fontSize: 26,
              fontWeight: 700,
              border: n === active ? "2px solid #ffffff" : "2px solid rgba(255,255,255,0.35)",
              background: n === active ? "#ffffff" : "transparent",
              color: n === active ? INK : "#ffffff",
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

// Landing page: the product itself — a request card and an accepted offer.
function Product({ text }: { text: OgText }) {
  const chip = { display: "flex", background: "#f1f1f1", borderRadius: 4, padding: "8px 14px", fontSize: 18, color: "#444" };
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: "#f1f1f1",
        paddingLeft: 80,
        fontFamily: "Lato",
        color: INK,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 560, gap: 26 }}>
        <Mark width={110} />
        <div style={{ display: "flex", flexDirection: "column", fontSize: text.prodSize, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
          <span>{text.prodA}</span>
          <span>{text.prodB}</span>
        </div>
        <div style={{ fontSize: 30, color: "#555", lineHeight: 1.3 }}>{text.prodSub}</div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 230,
          top: 70,
          width: 360,
          height: 440,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          borderRadius: 34,
          padding: 30,
          boxShadow: "0 30px 60px rgba(0,0,0,0.18)",
          transform: "rotate(-6deg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "#ec4899",
              color: "#ffffff",
              fontSize: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            G
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 20, color: "#777" }}>{text.cardBrand}</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{text.cardTitle}</div>
          </div>
        </div>
        <div style={{ fontSize: 22, color: "#444", lineHeight: 1.35 }}>
          {text.cardBody}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <div style={chip}>{text.chipA}</div>
          <div style={chip}>{text.chipB}</div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 50,
          top: 395,
          width: 330,
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: 34,
          padding: 26,
          boxShadow: "0 30px 60px rgba(0,0,0,0.18)",
          transform: "rotate(5deg)",
        }}
      >
        <div style={{ fontSize: 15, color: "#777", letterSpacing: "0.06em" }}>{text.offer}</div>
        <div style={{ fontSize: 46, fontWeight: 900, marginTop: 4 }}>250,00 €</div>
        <div style={{ fontSize: 20, color: "#777", marginTop: 6 }}>{text.offerNote}</div>
      </div>
    </div>
  );
}

// ── App icons ────────────────────────────────────────────────────────────

// The white mark on black. `rounded`: the square's own corners (browser
// tabs, Android/PWA), transparent outside them. Without it the square is
// full-bleed, for iOS, which applies its own rounded mask on top.
export function appIcon(size: number, { rounded }: { rounded: boolean }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: INK,
          borderRadius: rounded ? size * 0.22 : 0,
        }}
      >
        {/* Full-bleed (iOS) gets a bit more air, since the mask cuts into the corners. */}
        <Mark width={Math.round(size * (rounded ? 0.76 : 0.7))} white />
      </div>
    ),
    { width: size, height: size },
  );
}
