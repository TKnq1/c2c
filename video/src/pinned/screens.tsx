import type { ReactNode } from "react";
import { Img, staticFile } from "remotion";
import { FiExternalLink, FiSend } from "react-icons/fi";
import { IoChevronBack, IoStar } from "react-icons/io5";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { colors, PHOTOS, type PhotoKey } from "../theme";
import { AppHeader, AppTabBar, Bubble, ChatHeader, DeckButtons, GreyAvatar, GreyGroup, palette, Rating } from "../posts/kit";

// Screens of the app for the carousel slides, in the app's pixels (a 320px wide screen under the status bar).

const HAIRLINE = "rgba(7,7,7,0.1)";

const Label: React.FC<{ children: ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <p style={{ margin: 0, fontSize: 13, lineHeight: "18px", fontWeight: 700, ...style }}>{children}</p>
);

const Chip: React.FC<{ on?: boolean; children: ReactNode }> = ({ on, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      padding: "5px 11px",
      fontSize: 12,
      border: `1px solid ${on ? colors.ink : "rgba(7,7,7,0.15)"}`,
      backgroundColor: on ? colors.ink : undefined,
      color: on ? colors.paper : colors.ink,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const Status: React.FC<{ children: ReactNode; dark?: boolean }> = ({ children, dark }) => (
  <span
    style={{
      borderRadius: 999,
      padding: "2px 8px",
      fontSize: 11,
      fontWeight: 700,
      backgroundColor: dark ? colors.ink : "rgba(7,7,7,0.08)",
      color: dark ? colors.paper : colors.ink,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const FactRows: React.FC<{ rows: [string, ReactNode][] }> = ({ rows }) => (
  <GreyGroup style={{ padding: "0 12px", fontSize: 13 }}>
    {rows.map(([label, value], i) => (
      <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderTop: i ? `1px solid ${HAIRLINE}` : undefined }}>
        <span style={{ color: palette[500] }}>{label}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{value}</span>
      </div>
    ))}
  </GreyGroup>
);

// The chat's offer card with its buttons (src/components/chat-offer.tsx).
export const ChatOffer: React.FC<{ eyebrow: string; amount: string; detail: string; actions?: [string, string] }> = ({ eyebrow, amount, detail, actions }) => (
  <div style={{ borderRadius: 18, border: `1px solid ${HAIRLINE}`, backgroundColor: colors.paper, padding: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
    <p style={{ margin: 0, fontSize: 11, lineHeight: "16px", letterSpacing: "0.025em", textTransform: "uppercase", color: palette[500] }}>{eyebrow}</p>
    <p style={{ margin: 0, fontSize: 22, lineHeight: 1.25, fontWeight: 700 }}>{amount}</p>
    <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "16px", color: palette[600] }}>{detail}</p>
    {actions && (
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <span style={{ flex: 1, textAlign: "center", borderRadius: 999, padding: "6px 0", fontSize: 13, fontWeight: 700, backgroundColor: colors.ink, color: colors.paper }}>{actions[0]}</span>
        <span style={{ flex: 1, textAlign: "center", borderRadius: 999, padding: "6px 0", fontSize: 13, fontWeight: 700, border: `1px solid ${palette[300]}` }}>{actions[1]}</span>
      </div>
    )}
  </div>
);

const Composer: React.FC = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px 28px", borderTop: `1px solid ${HAIRLINE}` }}>
    <span style={{ flex: 1, borderRadius: 999, border: `1px solid ${HAIRLINE}`, padding: "9px 14px", fontSize: 14, color: palette[400] }}>Nachricht schreiben</span>
    <span style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: colors.ink, color: colors.paper, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <FiSend size={16} />
    </span>
  </div>
);

// --- Creators ---------------------------------------------------------------------------------------------

// The details of a deal, as they open from the card: what is paid, where and what to post.
export const DealDetailsScreen: React.FC = () => (
  <>
    <AppHeader title="Feed" />
    <Img src={staticFile(PHOTOS.serum)} style={{ width: "100%", height: 120, objectFit: "cover", flexShrink: 0 }} />
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <GreyAvatar name="Odd Bloom" size={34} />
        <div>
          <div style={{ fontSize: 14, lineHeight: "20px" }}>Odd Bloom</div>
          <Rating average={4.8} count={23} />
        </div>
      </div>
      <div style={{ fontSize: 17, lineHeight: "22px", fontWeight: 700 }}>Serum-Launch, erste Eindrücke</div>
      <FactRows
        rows={[
          ["Budget", <b key="b">250 €</b>],
          ["Plattform", <>{<SiTiktok size={12} />} TikTok</>],
          ["Inhalt", "1 Video"],
          ["Post bis", "Flexibel"],
          ["Produkt", "Kosmetik · inklusive"],
        ]}
      />
    </div>
    <div style={{ marginTop: "auto" }}>
      <DeckButtons />
      <AppTabBar />
    </div>
  </>
);

// The chat with the brand: the question, the deal, the brand's offer.
export const CreatorChatScreen: React.FC<{ paid?: boolean; brand?: string; avatar?: string; product?: string }> = ({
  paid,
  brand = "Odd Bloom",
  avatar,
  product = "Unser neues Serum, ehrliche erste Eindrücke.",
}) => (
  <>
    <ChatHeader name={brand} avatar={avatar} />
    {/* Messages sit at the bottom, above the composer, as in the app. */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, padding: 12 }}>
      <Bubble>Hey Mia, wir lieben deinen Content!</Bubble>
      <Bubble mine>Danke! Was habt ihr geplant?</Bubble>
      <Bubble>{product}</Bubble>
      <Bubble>Ein TikTok für 250 €?</Bubble>
      <Bubble mine>Deal!</Bubble>
      <div style={{ marginTop: 6 }}>
        {paid ? (
          <ChatOffer
            eyebrow="Bezahlt · zurückgehalten"
            amount="250,00 €"
            detail={`Poste den Inhalt und reiche dann den Link ein. Du bekommst 225,00 €, sobald ${brand} den Post freigibt.`}
          />
        ) : (
          <ChatOffer eyebrow={`Angebot von ${brand}`} amount="250,00 €" detail="Nach der Gebühr von 10 % bekommst du 225,00 €." actions={["Annehmen", "Ablehnen"]} />
        )}
      </div>
    </div>
    <Composer />
  </>
);

// Payments: what came in, what is held, deal by deal.
export const PaymentsScreen: React.FC = () => (
  <>
    <AppHeader title="Zahlungen" />
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          ["Ausgezahlt", "225,00 €"],
          ["Zurückgehalten", "360,00 €"],
        ].map(([label, value]) => (
          <GreyGroup key={label} style={{ padding: 12 }}>
            <div style={{ fontSize: 12, color: palette[500] }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>{value}</div>
          </GreyGroup>
        ))}
      </div>
      <Label>Deals</Label>
      {[
        { name: "Odd Bloom", title: "Serum-Launch, erste Eindrücke", status: "Freigegeben", dark: true },
        { name: "Kiez Goods", title: "Iced Matcha für die Sommerkarte", status: "Zurückgehalten", dark: false },
        { name: "Lumo Audio", title: "Kopfhörer im Alltag", status: "Angebot", dark: false },
      ].map((d) => (
        <GreyGroup key={d.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
          <GreyAvatar name={d.name} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14 }}>{d.name}</div>
            <div style={{ fontSize: 12, color: palette[500], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
          </div>
          <Status dark={d.dark}>{d.status}</Status>
        </GreyGroup>
      ))}
    </div>
    <AppTabBar active={3} />
  </>
);

// --- Brands -----------------------------------------------------------------------------------------------

const Thumb: React.FC<{ photo?: PhotoKey; src?: string; on?: boolean }> = ({ photo, src, on }) => (
  <Img
    src={staticFile(src ?? PHOTOS[photo ?? "serum"])}
    style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 4, outline: on ? `2px solid ${colors.ink}` : undefined, outlineOffset: 2, opacity: on ? 1 : 0.7 }}
  />
);

// New request: everything a creator sees on the card, set in one go.
export const NewRequestScreen: React.FC<{ title?: string; photos?: [string, string, string] }> = ({ title = "Unser neues Parfüm, erste Eindrücke", photos }) => (
  <>
    <AppHeader title="Neue Anfrage" />
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 14 }}>
      <div>
        <Label>Titel</Label>
        <div style={{ marginTop: 6, border: `1px solid ${palette[300]}`, borderRadius: 4, padding: "9px 10px", fontSize: 14 }}>{title}</div>
      </div>
      <div>
        <Label>Foto</Label>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {photos ? (
            <>
              <Thumb src={photos[0]} on />
              <Thumb src={photos[1]} />
              <Thumb src={photos[2]} />
            </>
          ) : (
            <>
              <Thumb photo="flask" on />
              <Thumb photo="serum" />
              <Thumb photo="tote" />
            </>
          )}
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Label>Budget</Label>
          <span style={{ fontSize: 20, fontWeight: 900 }}>300 €</span>
        </div>
        <div style={{ position: "relative", height: 16, marginTop: 6 }}>
          <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: 4, borderRadius: 999, backgroundColor: palette[200] }} />
          <div style={{ position: "absolute", top: 6, left: 0, width: "18%", height: 4, borderRadius: 999, backgroundColor: colors.ink }} />
          <div style={{ position: "absolute", top: 0, left: "18%", width: 16, height: 16, marginLeft: -8, borderRadius: 999, backgroundColor: colors.ink }} />
        </div>
      </div>
      <div>
        <Label>Plattform</Label>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <Chip on>
            <SiInstagram size={11} /> Instagram
          </Chip>
          <Chip>
            <SiTiktok size={11} /> TikTok
          </Chip>
          <Chip>
            <SiYoutube size={11} /> YouTube
          </Chip>
        </div>
      </div>
      <div>
        <Label>Inhalt</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          <Chip on>1 Reel</Chip>
          <Chip>1 Reel + 2 Stories</Chip>
          <Chip>3 Stories</Chip>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label>Produkt inklusive</Label>
        <span style={{ width: 40, height: 24, borderRadius: 999, backgroundColor: colors.ink, position: "relative" }}>
          <span style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: 999, backgroundColor: colors.paper }} />
        </span>
      </div>
      <div style={{ borderRadius: 999, backgroundColor: colors.ink, color: colors.paper, textAlign: "center", padding: "11px 0", fontSize: 14, fontWeight: 700 }}>Anfrage posten</div>
    </div>
    <AppTabBar />
  </>
);

// A creator's profile as a brand sees it: reach per platform, rating, earlier posts.
export const CreatorProfileScreen: React.FC = () => (
  <>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 8px", borderBottom: `1px solid ${HAIRLINE}`, flexShrink: 0 }}>
      <IoChevronBack size={22} />
      <span style={{ fontSize: 14, fontWeight: 700 }}>Mia K.</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <GreyAvatar name="Mia K." size={60} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Mia K.</div>
          <div style={{ fontSize: 13, color: palette[500] }}>Beauty · Berlin</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, marginTop: 2 }}>
            <IoStar size={12} color={palette[900]} /> 4.9 · 12 Bewertungen
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          [<SiTiktok key="t" size={14} />, "58K"],
          [<SiInstagram key="i" size={14} color="#E4405F" />, "12K"],
          [<SiYoutube key="y" size={14} color="#FF0000" />, "4K"],
        ].map(([icon, value], i) => (
          <GreyGroup key={i} style={{ padding: "10px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            {icon}
            <span style={{ fontSize: 15, fontWeight: 900 }}>{value}</span>
          </GreyGroup>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 13, lineHeight: "19px", color: palette[600] }}>Ehrliche Skincare-Reviews und Morgenroutinen. Ich teste alles erst eine Woche.</p>
      <Label>Bisherige Posts</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
        {(["cream", "lipstick", "serum"] as PhotoKey[]).map((photo) => (
          <Img key={photo} src={staticFile(PHOTOS[photo])} style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 4 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <span style={{ flex: 1, textAlign: "center", borderRadius: 999, padding: "9px 0", fontSize: 13, fontWeight: 700, border: `1px solid ${palette[300]}` }}>Nachricht</span>
        <span style={{ flex: 1, textAlign: "center", borderRadius: 999, padding: "9px 0", fontSize: 13, fontWeight: 700, backgroundColor: colors.ink, color: colors.paper }}>Angebot senden</span>
      </div>
    </div>
    <AppTabBar />
  </>
);

// The request with the posts the creators put online for it.
export const LivePostsScreen: React.FC = () => (
  <>
    <AppHeader title="Anfragen" />
    <div style={{ padding: 12 }}>
      <GreyGroup style={{ display: "flex", alignItems: "center", gap: 10, padding: 10 }}>
        <Img src={staticFile(PHOTOS.flask)} style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>Unser neues Parfüm, erste Eindrücke</div>
          <div style={{ fontSize: 12, color: palette[500] }}>6 Creator · 6 Posts online</div>
        </div>
      </GreyGroup>
      <Label style={{ margin: "14px 4px 6px", fontWeight: 400, color: palette[500] }}>Posts</Label>
      <GreyGroup>
        {(
          [
            ["Mia K.", "TikTok"],
            ["Jonas R.", "Instagram"],
            ["Aria N.", "YouTube"],
            ["Lea S.", "Instagram"],
            ["Tom B.", "TikTok"],
            ["Nina P.", "TikTok"],
          ] as const
        ).map(([name, platform], i) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderTop: i ? `1px solid ${HAIRLINE}` : undefined }}>
            <GreyAvatar name={name} size={30} />
            <span style={{ flex: 1, fontSize: 14 }}>{name}</span>
            {platform === "TikTok" ? <SiTiktok size={13} /> : platform === "Instagram" ? <SiInstagram size={13} color="#E4405F" /> : <SiYoutube size={13} color="#FF0000" />}
            <Status dark>Online</Status>
          </div>
        ))}
      </GreyGroup>
    </div>
    <AppTabBar />
  </>
);

// The brand's chat with the creator once the post is up: the link and the payment waiting for approval.
export const ApproveChatScreen: React.FC = () => (
  <>
    <ChatHeader name="Mia K." />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, padding: 12 }}>
      <Bubble>Hallo! Das würde ich gern machen.</Bubble>
      <Bubble mine>Super, ich schicke ein Angebot.</Bubble>
      <Bubble>Angenommen, danke! Ich filme am Wochenende.</Bubble>
      <Bubble>Der Post ist online! Hier ist der Link.</Bubble>
      <GreyGroup style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, fontSize: 12 }}>
        <SiTiktok size={14} />
        <span style={{ flex: 1 }}>tiktok.com/@miak/video/7428</span>
        <FiExternalLink size={13} />
      </GreyGroup>
      <div style={{ marginTop: 6 }}>
        <ChatOffer
          eyebrow="Post eingereicht"
          amount="300,00 €"
          detail="Prüfe den Post und gib ihn frei oder melde innerhalb von 3 Tagen ein Problem."
          actions={["Freigeben", "Melden"]}
        />
      </div>
    </div>
    <Composer />
  </>
);
