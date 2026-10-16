import type { CSSProperties, ReactNode } from "react";
import { FiChevronRight, FiFilter, FiHeart, FiLink, FiSend, FiX } from "react-icons/fi";
import { IoCheckmark, IoChevronDown, IoLockClosed, IoLogoInstagram, IoLogoTiktok, IoLogoTwitch, IoLogoYoutube, IoSearch, IoStar } from "react-icons/io5";
import { Img, staticFile } from "remotion";
import { NOKAR_HOODIE, RAW_AVATAR, VS_AVATAR } from "../ads/brands";
import { mix } from "../anim";
import { Avatar, DealCard, Photo } from "../components/ui";
import { colors } from "../theme";
import { SOFT_SHADOW } from "./kit";

// More of the app's screens for the launch video, each drawn after its component in src/ and taking its state as
// props: the chat with the offer card (chat-offer.tsx, the live payment flow with its own copy), the New request form
// with its choice sheets (request-form.tsx) and Discover for brands (discover-creators.tsx).

const HAIRLINE = "rgba(7,7,7,0.1)";
const MUTED = "#737373";

// ---------------------------------------------------------------------------------------------------------------
// The chat with Raw Supplies and its offer card

export type OfferState = "offer" | "accepted" | "paid" | "submitted" | "released";

const OFFER_COPY: Record<OfferState, { eyebrow: string; detail: string }> = {
  offer: { eyebrow: "Angebot von Raw Supplies", detail: "Du bekommst 225,00 € nach der Gebühr von 10 %." },
  accepted: {
    eyebrow: "Angebot angenommen",
    detail: "Angenommen. Raw Supplies zahlt als Nächstes, und das Geld bleibt sicher hinterlegt, bis du postest. Du bekommst 225,00 € nach der Plattformgebühr.",
  },
  paid: { eyebrow: "Bezahlt · sicher hinterlegt", detail: "Poste den Inhalt und schick den Link. Du bekommst 225,00 €, sobald Raw Supplies freigibt." },
  submitted: { eyebrow: "Beitrag eingereicht", detail: "Wartet auf die Freigabe von Raw Supplies." },
  released: { eyebrow: "Zahlung freigegeben", detail: "Du hast 225,00 € erhalten." },
};

const PrimaryButton: React.FC<{ children: ReactNode; press?: number; style?: CSSProperties }> = ({ children, press = 0, style }) => (
  <span
    style={{
      flex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: 999,
      padding: "9px 16px",
      fontSize: 14,
      fontWeight: 700,
      backgroundColor: colors.ink,
      color: colors.paper,
      transform: `scale(${1 - press * 0.06})`,
      ...style,
    }}
  >
    {children}
  </span>
);

const SecondaryButton: React.FC<{ children: ReactNode }> = ({ children }) => (
  <span style={{ flex: 1, textAlign: "center", borderRadius: 999, padding: "8px 16px", fontSize: 14, fontWeight: 700, border: "1px solid #d4d4d4" }}>{children}</span>
);

// `flip` 0..1 turns the card over to its new state (it squeezes and grows back), `press` pushes its button.
export const OfferCard: React.FC<{ state: OfferState; flip?: number; press?: number }> = ({ state, flip = 1, press = 0 }) => {
  const copy = OFFER_COPY[state];
  const squash = 1 - 0.08 * Math.sin(Math.PI * Math.min(1, Math.max(0, flip)));
  return (
    <div
      style={{
        width: 360,
        borderRadius: 18,
        border: `1px solid ${HAIRLINE}`,
        backgroundColor: colors.paper,
        padding: 14,
        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        transform: `scale(${squash})`,
        transformOrigin: "100% 100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700, color: MUTED }}>
        {state === "paid" && <IoLockClosed size={12} />}
        {state === "released" && <IoCheckmark size={13} color={colors.ink} />}
        {copy.eyebrow}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.25, marginTop: 2 }}>{state === "released" ? "225,00 €" : "250,00 €"}</div>
      <div style={{ fontSize: 13, lineHeight: 1.4, color: "#525252", marginTop: 2 }}>{copy.detail}</div>
      {state === "offer" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <PrimaryButton press={press}>Annehmen</PrimaryButton>
          <SecondaryButton>Ablehnen</SecondaryButton>
        </div>
      )}
      {state === "paid" && (
        <div style={{ display: "flex", marginTop: 12 }}>
          <PrimaryButton press={press}>
            <FiLink size={14} />
            Beitragslink einreichen
          </PrimaryButton>
        </div>
      )}
    </div>
  );
};

// A message. Until it is sent its height is folded away, and it unfolds as it comes in, so the messages above move
// up smoothly instead of jumping.
const Bubble: React.FC<{ mine?: boolean; p?: number; children: ReactNode }> = ({ mine, p = 1, children }) => (
  <div style={{ alignSelf: mine ? "flex-end" : "flex-start", maxHeight: 140 * Math.max(0, Math.min(1, p)), display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
    <BubbleBody mine={mine} p={p}>
      {children}
    </BubbleBody>
  </div>
);

const BubbleBody: React.FC<{ mine?: boolean; p: number; children: ReactNode }> = ({ mine, p, children }) => (
  <div
    style={{
      maxWidth: 380,
      borderRadius: 18,
      padding: "9px 14px",
      fontSize: 14,
      lineHeight: 1.4,
      backgroundColor: mine ? colors.ink : colors.fog,
      color: mine ? colors.paper : colors.ink,
      opacity: Math.min(1, Math.max(0, p) * 2),
      transform: `translateY(${(1 - p) * 24}px) scale(${mix(Math.min(p, 1.2), 0.85, 1)})`,
      transformOrigin: mine ? "100% 100%" : "0 100%",
    }}
  >
    {children}
  </div>
);

const CHATS: { name: string; avatar?: string; last: string; active?: boolean }[] = [
  { name: "Raw Supplies", avatar: RAW_AVATAR, last: "Ein TikTok für 250 €?", active: true },
  { name: "vintagesteals.de", avatar: VS_AVATAR, last: "Wir melden uns morgen!" },
  { name: "Kiez Goods", last: "Danke für dein Interesse." },
];

// The creator's Messages page: the conversations on the left, the chat with Raw Supplies on the right. Each message
// comes in when its `p` (0..1, overshooting) starts; the offer card sits under them.
// Without `list`, only the chat itself (for a close shot in an AppPanel).
export const ChatPage: React.FC<{ messages: { mine?: boolean; text: ReactNode; p: number }[]; offer?: { state: OfferState; flip: number; press: number; p: number }; list?: boolean }> = ({
  messages,
  offer,
  list = true,
}) => (
  <div style={{ display: "flex", height: "100%" }}>
    <div style={{ width: 300, borderRight: `1px solid ${HAIRLINE}`, padding: "20px 12px", display: list ? "flex" : "none", flexDirection: "column", gap: 4 }}>
      {CHATS.map((c) => (
        <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", borderRadius: 4, backgroundColor: c.active ? colors.fog : undefined }}>
          <Avatar name={c.name} image={c.avatar} size={40} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
            <div style={{ fontSize: 13, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last}</div>
          </div>
        </div>
      ))}
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: `1px solid ${HAIRLINE}` }}>
        <Avatar name="Raw Supplies" image={RAW_AVATAR} size={36} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Raw Supplies</div>
          <div style={{ fontSize: 12, color: MUTED }}>RAW Hoodie V2, erste Eindrücke</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8, padding: "16px 24px" }}>
        {messages.map((m, i) => (
          <Bubble key={i} mine={m.mine} p={m.p}>
            {m.text}
          </Bubble>
        ))}
        {offer && (
          <div style={{ alignSelf: "flex-start", maxHeight: 320 * Math.max(0, Math.min(1, offer.p)), opacity: Math.min(1, Math.max(0, offer.p) * 2), transform: `translateY(${(1 - offer.p) * 40}px)` }}>
            <OfferCard state={offer.state} flip={offer.flip} press={offer.press} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderTop: `1px solid ${HAIRLINE}` }}>
        <span style={{ flex: 1, borderRadius: 999, border: `1px solid ${HAIRLINE}`, padding: "10px 16px", fontSize: 14, color: "#a3a3a3" }}>Nachricht schreiben</span>
        <span style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: colors.ink, color: colors.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FiSend size={17} />
        </span>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------------------------------------------
// New request (request-form.tsx): Photos, "Der Deal" and "Für wen" as fog boxes of rows, each row opening a sheet

export const NICHES = ["Beauty", "Fitness", "Food", "Fashion", "Tech", "Travel", "Gaming", "Lifestyle"];
export const FOLLOWER_PRESETS = ["0", "1.000", "5.000", "10.000", "50.000", "100.000"];
export const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitch", "X"];
export const CONTENT_PRESETS = ["1 Reel", "1 Reel + 2 Stories", "3 Stories"];

const PlatformGlyph: React.FC<{ name: string; size?: number }> = ({ name, size = 14 }) =>
  name === "Instagram" ? (
    <IoLogoInstagram size={size} />
  ) : name === "TikTok" ? (
    <IoLogoTiktok size={size} />
  ) : name === "YouTube" ? (
    <IoLogoYoutube size={size} />
  ) : name === "Twitch" ? (
    <IoLogoTwitch size={size} />
  ) : (
    <span style={{ fontWeight: 900, fontSize: size }}>𝕏</span>
  );

// One row of a fog box. `flash` 0..1 lights it as it is clicked or as its value changes.
const Row: React.FC<{ label: string; value?: ReactNode; placeholder?: string; strong?: boolean; first?: boolean; flash?: number }> = ({ label, value, placeholder, strong, first, flash = 0 }) => (
  <div
    style={{
      height: 46,
      display: "flex",
      alignItems: "center",
      gap: 16,
      fontSize: 14,
      borderTop: first ? undefined : `1px solid ${HAIRLINE}`,
      backgroundColor: `rgba(7,7,7,${0.05 * flash})`,
      margin: "0 -16px",
      padding: "0 16px",
    }}
  >
    <span style={{ fontWeight: 700 }}>{label}</span>
    <span style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, color: value ? colors.ink : "#a3a3a3", fontWeight: strong ? 700 : 400 }}>
      {value ?? placeholder}
    </span>
    <FiChevronRight size={16} color="#a3a3a3" />
  </div>
);

const Section: React.FC<{ title: string; hint?: string; children: ReactNode }> = ({ title, hint, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <div style={{ fontSize: 13, color: MUTED, padding: "0 4px" }}>
      {title}
      {hint && <span> · {hint}</span>}
    </div>
    {children}
  </div>
);

export type FormState = {
  title: string;
  caret: boolean;
  niche?: string;
  followers: string;
  platform: string;
  content?: string;
  flash: Partial<Record<"niche" | "followers" | "platform" | "content", number>>;
  posted: boolean;
  press: number;
};

export const RequestForm: React.FC<{ form: FormState }> = ({ form }) => (
  <div style={{ padding: "24px 32px", display: "flex", gap: 36 }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
      <Section title="Fotos" hint="Bis zu 3">
        <div style={{ display: "flex", gap: 8 }}>
          {(["nokarHoodie", "nokarPrint", "nokarBack"] as const).map((p, i) => (
            <div key={p} style={{ width: 64, height: 64, borderRadius: 4, overflow: "hidden", outline: i === 0 ? `2px solid ${colors.ink}` : undefined, outlineOffset: 2 }}>
              <Photo photo={p} />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Der Deal">
        <div style={{ borderRadius: 4, backgroundColor: colors.fog, padding: "14px 16px 2px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Titel</span>
            <div
              style={{
                borderRadius: 4,
                border: `1px solid ${form.caret ? colors.ink : "#d4d4d4"}`,
                boxShadow: form.caret ? "0 0 0 3px rgba(7,7,7,0.08)" : undefined,
                backgroundColor: colors.paper,
                padding: "10px 12px",
                fontSize: 14.5,
                minHeight: 20,
                whiteSpace: "pre",
              }}
            >
              {form.title}
              {form.caret && <span style={{ display: "inline-block", width: 1.5, height: 17, backgroundColor: colors.ink, marginLeft: 1, verticalAlign: "-0.2em" }} />}
            </div>
          </div>
          <Row label="Beschreibung" value="Zeig den neuen Nokar Hoodie …" />
          <Row
            label="Plattform"
            value={
              <>
                <PlatformGlyph name={form.platform} /> {form.platform}
              </>
            }
            flash={form.flash.platform}
          />
          <Row label="Inhalt" value={form.content} placeholder="Was soll gepostet werden?" flash={form.flash.content} />
          <Row label="Budget" value="300 €" strong />
          <Row label="Produkt inklusive" value={<Toggle on />} />
        </div>
      </Section>
      <Section title="Für wen">
        <div style={{ borderRadius: 4, backgroundColor: colors.fog, padding: "2px 16px" }}>
          <Row first label="Nische" value={form.niche} placeholder="Wählen" flash={form.flash.niche} />
          <Row label="Min. Follower" value={form.followers} flash={form.flash.followers} />
          <Row label="Sprache" value="Deutsch" />
        </div>
      </Section>
    </div>
    <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Vorschau</div>
        <div style={{ fontSize: 13, color: MUTED }}>Das sehen Creator in ihrem Feed.</div>
      </div>
      <DealCard
        deal={{ ...NOKAR_HOODIE, title: form.title || NOKAR_HOODIE.title, platform: form.platform === "TikTok" ? "TikTok" : "Instagram", deliverables: form.content ?? "1 Reel" }}
        width={300}
        height={420}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <PrimaryButton press={form.press} style={{ backgroundColor: form.posted ? colors.paper : colors.ink, color: form.posted ? colors.ink : colors.paper, border: `1px solid ${colors.ink}` }}>
          {form.posted && <IoCheckmark size={16} />}
          {form.posted ? "Gepostet" : "Anfrage posten"}
        </PrimaryButton>
      </div>
      <div style={{ textAlign: "center", fontSize: 13, color: MUTED }}>Entwurf speichern</div>
    </div>
  </div>
);

const Toggle: React.FC<{ on?: boolean }> = ({ on }) => (
  <span style={{ width: 40, height: 24, borderRadius: 999, backgroundColor: on ? colors.ink : "#d4d4d4", position: "relative", display: "inline-block" }}>
    <span style={{ position: "absolute", top: 3, left: on ? 19 : 3, width: 18, height: 18, borderRadius: 999, backgroundColor: colors.paper }} />
  </span>
);

const Choice: React.FC<{ on?: boolean; flash?: number; children: ReactNode }> = ({ on, flash = 0, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      padding: "7px 13px",
      fontSize: 14,
      border: `1px solid ${on ? colors.ink : "#d4d4d4"}`,
      backgroundColor: on ? colors.ink : colors.paper,
      color: on ? colors.paper : colors.ink,
      transform: `scale(${1 + 0.12 * Math.sin(Math.PI * Math.min(1, Math.max(0, flash)))})`,
    }}
  >
    {children}
  </span>
);

export type SheetKind = "niche" | "followers" | "platform" | "content";

// A choice sheet as the app's Dialog draws it: a title with a close button, the choices as pills. `picked` marks the
// chosen one, `pop` 0..1 bounces it as it is picked; `open` 0..1 (overshooting) brings the sheet in.
export const ChoiceSheet: React.FC<{ kind: SheetKind; picked?: string; pop?: number; open: number }> = ({ kind, picked, pop = 0, open }) => {
  const title = { niche: "Nische", followers: "Min. Follower", platform: "Plattform", content: "Was soll gepostet werden?" }[kind];
  const options = { niche: NICHES, followers: FOLLOWER_PRESETS, platform: PLATFORMS, content: CONTENT_PRESETS }[kind];
  return (
    <div
      style={{
        width: 460,
        borderRadius: 16,
        backgroundColor: colors.paper,
        boxShadow: SOFT_SHADOW + ", 0 0 0 1px rgba(7,7,7,0.06)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        opacity: Math.min(1, Math.max(0, open) * 2),
        transform: `translateY(${(1 - open) * 40}px) scale(${mix(open, 0.92, 1)})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 17, fontWeight: 700 }}>{title}</span>
        <FiX size={18} color={MUTED} />
      </div>
      {kind === "followers" && (
        <div style={{ borderRadius: 4, border: "1px solid #d4d4d4", padding: "10px 12px", fontSize: 15 }}>{picked ?? "0"}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <Choice key={o} on={o === picked} flash={o === picked ? pop : 0}>
            {kind === "platform" && <PlatformGlyph name={o} />}
            {o}
          </Choice>
        ))}
      </div>
      {kind === "followers" && <div style={{ fontSize: 13, color: MUTED }}>Creator darunter sehen die Anfrage nicht.</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Discover for brands (discover-creators.tsx): the request it is for, search and Filter, the applied filters, the
// count, the photo grid with what each creator matches and Invite

// `photo` (a file in public/) replaces the initials on the tile.
export type Creator = { name: string; niche: string; followers: string; platform: string; rating: string; shade: string; keep: number; photo?: string };

// `keep` is the filter step that drops a creator (1 niche, 2 platform, 3 reach), 9 if they stay.
export const CREATORS: Creator[] = [
  { name: "Mia Summers", niche: "Fashion +1", followers: "50K+", platform: "Instagram", rating: "4,9", shade: "#e7e5e4", keep: 9 },
  { name: "Jonas Fit", niche: "Fitness", followers: "20K+", platform: "TikTok", rating: "4,7", shade: "#e5e7eb", keep: 1 },
  { name: "Sara Trend", niche: "Fashion", followers: "12K+", platform: "Instagram", rating: "4,8", shade: "#ececec", keep: 9 },
  { name: "Tom Eats", niche: "Food", followers: "100K+", platform: "Instagram", rating: "4,6", shade: "#e4e4e7", keep: 1 },
  { name: "Nina Style", niche: "Fashion", followers: "34K+", platform: "Instagram", rating: "4,9", shade: "#e8e6e3", keep: 9 },
  { name: "Lea Moves", niche: "Fashion", followers: "8K+", platform: "Instagram", rating: "4,8", shade: "#e6e6e6", keep: 3 },
  { name: "Kim Vintage", niche: "Fashion", followers: "22K+", platform: "TikTok", rating: "4,7", shade: "#e9e7e4", keep: 2 },
  { name: "Aria Tech", niche: "Tech", followers: "15K+", platform: "YouTube", rating: "4,8", shade: "#e3e5e8", keep: 1 },
];

const COLUMNS = 4;
const TILE_W = 210;
const TILE_GAP_X = 16;
const TILE_H = 330;

// Where a grid slot sits on the page.
export function slotPos(slot: number) {
  return { x: (slot % COLUMNS) * (TILE_W + TILE_GAP_X), y: Math.floor(slot / COLUMNS) * TILE_H };
}

// A tile at `pos` (the scene springs it between slots), leaving with `gone` 0..1.
const Tile: React.FC<{ c: Creator; pos: { x: number; y: number }; gone: number; reasons: number; invite: { press: number; done: boolean } | null }> = ({ c, pos, gone, reasons, invite }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: TILE_W,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        opacity: 1 - gone,
        transform: `scale(${1 - 0.15 * gone})`,
      }}
    >
      <div style={{ position: "relative", height: 230, borderRadius: 4, backgroundColor: c.shade, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {c.photo ? (
          <Img src={staticFile(c.photo)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 64, fontWeight: 900, color: "rgba(7,7,7,0.22)", letterSpacing: -2 }}>
            {c.name
              .split(" ")
              .map((w) => w[0])
              .join("")}
          </span>
        )}
        <span style={{ position: "absolute", right: 8, top: 8, width: 28, height: 28, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IoStar size={14} color="#a3a3a3" />
        </span>
        <span style={{ position: "absolute", left: 8, bottom: 8, display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.9)", padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>
          <PlatformGlyph name={c.platform} size={12} /> {c.platform}
        </span>
      </div>
      <div style={{ padding: "0 2px" }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
        <div style={{ fontSize: 12, color: MUTED }}>
          {c.niche} · {c.followers} Follower · ★ {c.rating}
        </div>
      </div>
      {reasons > 0 && <div style={{ fontSize: 11.5, color: "#525252", padding: "0 2px", opacity: Math.min(1, reasons) }}>Passt: Nische, Plattform, Reichweite</div>}
      {invite && (
        <span
          style={{
            alignSelf: "stretch",
            textAlign: "center",
            borderRadius: 999,
            padding: "7px 0",
            fontSize: 13,
            fontWeight: 700,
            backgroundColor: invite.done ? colors.paper : colors.ink,
            color: invite.done ? colors.ink : colors.paper,
            border: `1px solid ${invite.done ? "#d4d4d4" : colors.ink}`,
            transform: `scale(${1 - invite.press * 0.06})`,
            opacity: Math.min(1, reasons),
          }}
        >
          {invite.done ? "Zum Chat" : "Einladen"}
        </span>
      )}
    </div>
  );
};

const FilterChip: React.FC<{ label: string; p: number }> = ({ label, p }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      padding: "6px 12px",
      fontSize: 13,
      fontWeight: 700,
      backgroundColor: colors.ink,
      color: colors.paper,
      opacity: Math.min(1, Math.max(0, p) * 2),
      transform: `scale(${mix(p, 0.5, 1)})`,
      transformOrigin: "0 50%",
    }}
  >
    {label}
    <FiX size={12} />
  </span>
);

// `filters` 0..1 each (overshooting) for niche, platform and reach; `positions` where each creator's tile sits now;
// `gone` per creator; `reasons` 0..1 fades in the match lines and buttons.
export const DiscoverPage: React.FC<{
  filters: [number, number, number];
  count: number;
  positions: { x: number; y: number }[];
  gone: number[];
  reasons: number;
  invite: { press: number; done: boolean };
}> = ({ filters, count, positions, gone, reasons, invite }) => (
  <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 4, backgroundColor: colors.fog, padding: "10px 14px", fontSize: 14 }}>
      <span style={{ color: MUTED }}>Creator für deine Anfrage</span>
      <span style={{ fontWeight: 700, flex: 1 }}>Nokar Hoodie, Drop-Teaser</span>
      <IoChevronDown size={16} />
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, borderRadius: 4, border: "1px solid #d4d4d4", padding: "9px 12px", fontSize: 14, color: "#a3a3a3" }}>
        <IoSearch size={18} /> Name, Nische, Bio suchen…
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 4, border: "1px solid #d4d4d4", padding: "9px 14px", fontSize: 14, fontWeight: 700 }}>
        <FiFilter size={15} /> {filters[0] > 0.5 ? `Filter, ${filters.filter((f) => f > 0.5).length} aktiv` : "Filter"}
      </div>
    </div>
    <div style={{ display: "flex", gap: 8, minHeight: 30 }}>
      {filters[0] > 0 && <FilterChip label="Fashion" p={filters[0]} />}
      {filters[1] > 0 && <FilterChip label="Instagram" p={filters[1]} />}
      {filters[2] > 0 && <FilterChip label="10K+ Follower" p={filters[2]} />}
    </div>
    <div style={{ fontSize: 14, color: "#525252" }}>{count} Creator</div>
    <div style={{ position: "relative", height: 2 * TILE_H }}>
      {CREATORS.map((c, i) => (
        <Tile key={c.name} c={c} pos={positions[i]} gone={gone[i]} reasons={c.keep === 9 ? reasons : 0} invite={c.keep === 9 ? { press: i === 0 ? invite.press : 0, done: i === 0 && invite.done } : null} />
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------------------------------------------
// Video graphics (not app UI): a pointer with a name tag, like the reference's collaborators' cursors, and the steps
// of a deal as a trail next to the chat

export const NameCursor: React.FC<{ x: number; y: number; name: string; press?: number; dark?: boolean }> = ({ x, y, name, press = 0, dark }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `scale(${1 - press * 0.12})`, transformOrigin: "0 0", zIndex: 40 }}>
    <svg width={34} height={34} viewBox="0 0 24 24" style={{ display: "block", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.25))" }}>
      <path d="M3 2 L20 10 L12 12.5 L9 20 Z" fill={dark ? colors.paper : colors.ink} />
    </svg>
    <span
      style={{
        position: "absolute",
        left: 26,
        top: 26,
        borderRadius: 999,
        padding: "5px 13px",
        fontSize: 18,
        fontWeight: 700,
        backgroundColor: dark ? colors.paper : colors.ink,
        color: dark ? colors.ink : colors.paper,
        whiteSpace: "nowrap",
      }}
    >
      {name}
    </span>
  </div>
);

export const DEAL_STEPS = ["Angebot", "Angenommen", "Bezahlt · sicher hinterlegt", "Beitrag eingereicht", "Zahlung freigegeben"];

// The deal's steps as a vertical trail: `lit` is how far along it is (fractional fills the line to the next step).
export const DealTrail: React.FC<{ lit: number; pulse: number[] }> = ({ lit, pulse }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
    {DEAL_STEPS.map((label, i) => {
      const on = lit >= i;
      const fill = Math.max(0, Math.min(1, lit - i));
      return (
        <div key={label} style={{ display: "flex", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40 }}>
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: on ? colors.ink : colors.paper,
                color: on ? colors.paper : "#a3a3a3",
                border: `2px solid ${on ? colors.ink : "#d4d4d4"}`,
                fontSize: 17,
                fontWeight: 900,
                transform: `scale(${1 + 0.25 * Math.sin(Math.PI * Math.min(1, Math.max(0, pulse[i] ?? 0)))})`,
              }}
            >
              {on ? <IoCheckmark size={22} /> : i + 1}
            </span>
            {i < DEAL_STEPS.length - 1 && (
              <span style={{ width: 2, height: 54, backgroundColor: "#d4d4d4", position: "relative" }}>
                <span style={{ position: "absolute", left: 0, top: 0, width: 2, height: `${fill * 100}%`, backgroundColor: colors.ink }} />
              </span>
            )}
          </div>
          <span style={{ fontSize: 30, fontWeight: on ? 900 : 400, color: on ? colors.ink : "#a3a3a3", letterSpacing: -0.6, lineHeight: "40px" }}>{label}</span>
        </div>
      );
    })}
  </div>
);

export const HeartIcon = FiHeart;
