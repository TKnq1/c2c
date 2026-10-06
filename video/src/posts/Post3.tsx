import type { ReactNode } from "react";
import { Img, staticFile } from "remotion";
import { colors } from "../theme";
import { BudgetPill, Canvas, Headline, NavPill, OfferCard, palette, PayoutReceipt, POST_WIDTH, Toast } from "./kit";

const CARD = { width: 450, height: 458, gap: 18 };

type StepData = { icon: string; title: string; body: string; piece: ReactNode; scale: number; rotate: number };

// The landing page's four cards, each with the piece of the app it is about lifted out at the bottom.
const STEPS: StepData[] = [
  { icon: "swipe", title: "Wisch durch Marken-Deals", body: "Rechts heißt: Du bist interessiert.", piece: <Toast>Interesse gesendet.</Toast>, scale: 1.5, rotate: -3 },
  { icon: "money-bag", title: "Das Budget steht auf der Karte", body: "Schluss mit DMs über Preise.", piece: <BudgetPill amount={"250 €"} />, scale: 1.4, rotate: -4 },
  {
    icon: "locked",
    title: "Bezahlt, bevor du postest",
    body: "Die Marke zahlt zuerst.",
    piece: <OfferCard eyebrow="Bezahlt · zurückgehalten" amount="250,00 €" detail="Das Geld wartet, bis dein Post online ist." width={270} />,
    scale: 1.3,
    rotate: 0,
  },
  {
    icon: "money-wings",
    title: "Du behältst 90 %",
    body: "Mit Pro sogar 97\u00A0%.",
    piece: <PayoutReceipt brand="Odd Bloom" amount="250,00 €" fee="25,00 €" feeRate={10} payout="225,00 €" />,
    scale: 1.25,
    rotate: 2,
  },
];

// One step of the deal: a grey card, the 3D icon in a white circle, what it is, and the piece of the app.
const Step: React.FC<{ n: number; step: StepData }> = ({ n, step }) => (
  <div
    style={{
      position: "relative",
      width: CARD.width,
      height: CARD.height,
      boxSizing: "border-box",
      borderRadius: 4,
      backgroundColor: colors.fog,
      padding: "40px 34px 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      overflow: "hidden",
    }}
  >
    <span
      style={{
        position: "absolute",
        top: 20,
        left: 20,
        width: 46,
        height: 46,
        borderRadius: 999,
        backgroundColor: colors.ink,
        color: colors.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        fontWeight: 900,
      }}
    >
      {n}
    </span>
    <span style={{ width: 96, height: 96, borderRadius: 999, backgroundColor: colors.paper, boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Img src={staticFile(`icons/${step.icon}.png`)} style={{ width: 64, height: 64, filter: "grayscale(1) contrast(1.15) brightness(1.04)" }} />
    </span>
    <h3 style={{ margin: "22px 0 0", fontSize: 38, lineHeight: 1.08, fontWeight: 900, letterSpacing: "-0.02em", textWrap: "balance" }}>{step.title}</h3>
    <p style={{ margin: "12px 0 0", fontSize: 26, lineHeight: 1.3, color: palette[600], textWrap: "balance" }}>{step.body}</p>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `rotate(${step.rotate}deg) scale(${step.scale})`, transformOrigin: "center bottom" }}>{step.piece}</div>
    </div>
  </div>
);

// The deal from the creator's side, in the order it happens.
export const Post3: React.FC = () => (
  <Canvas photo="glasses" focus={[0.5, 0.39]}>
    <NavPill />
    <Headline lines={["Vom Swipe bis", "zur Auszahlung."]} size={116} top={170} />
    <div style={{ position: "absolute", top: 432, left: (POST_WIDTH - (CARD.width * 2 + CARD.gap)) / 2, display: "grid", gridTemplateColumns: `repeat(2, ${CARD.width}px)`, gap: CARD.gap }}>
      {STEPS.map((step, i) => (
        <Step key={step.icon} n={i + 1} step={step} />
      ))}
    </div>
  </Canvas>
);
