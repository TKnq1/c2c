import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import type { HeadlinePart } from "../components/ui";
import { BEAT, fitToVoice, type Scene, SceneSeries, seriesDuration, type VideoProps } from "../series";
import VOICE from "../voice/ads.json";
import { AB1_PAIN_BLUR, AB1Mech, AB1Pain, AB2Mech, AB2Pain, AB3Mech, AB3Pain, AB4Mech, AB4Pain, AB5Mech, AB5Pain } from "./brand";
import { AC1Mech, AC1Pain, AC2Mech, AC2Pain, AC3Mech, AC3Pain, AC4Mech, AC4Pain, AC5Mech, AC5Pain } from "./creator";
import { type Audience, ctaScene, payoffScene, turnScene } from "./kit";

// The 15 s ads (ADS.md). Every ad has the same five beats; only the painpoint, its mechanism and the copy change:
//   1 pain    hook in the first frame, then the problem made concrete
//   2 turn    black, one short line and the logo
//   3 mech    the part of comtor that removes exactly this pain
//   4 payoff  the promise in one line
//   5 cta     offer (founding places) and comtor.app
type AdSpec = {
  id: string;
  audience: Audience;
  painpoint: string;
  pain: React.FC;
  painBlur?: [number, number][];
  turn: HeadlinePart[];
  mech: React.FC;
  payoff: [HeadlinePart[], string?];
  cta: HeadlinePart[];
  // Voiceover, one line per beat (scene ids <ad>-1 … <ad>-5).
  vo: [string, string, string, string, string];
};

const SPECS: AdSpec[] = [
  {
    id: "AC1",
    audience: "creator",
    painpoint: "Preis-DMs",
    pain: AC1Pain,
    turn: ["Schluss damit."],
    mech: AC1Mech,
    payoff: [["Kein Verhandeln.", { mark: "Nur wischen." }]],
    cta: ["Wisch dich zum", { mark: "ersten Deal." }],
    vo: [
      "Was nimmst du für einen Post? Jede Woche die gleiche Frage.",
      "Schluss damit.",
      "Auf comtor steht das Budget schon auf der Karte.",
      "Kein Verhandeln. Nur wischen.",
      "Die ersten hundert Creator bekommen Pro kostenlos. Auf comtor punkt app.",
    ],
  },
  {
    id: "AC2",
    audience: "creator",
    painpoint: "Rechnung nie bezahlt",
    pain: AC2Pain,
    turn: ["Ab jetzt", { mark: "andersrum." }],
    mech: AC2Mech,
    payoff: [["Erst bezahlt.", { mark: "Dann posten." }]],
    cta: ["Nie wieder", { mark: "Rechnungen jagen." }],
    vo: [
      "Post ist online. Das Geld nicht.",
      "Ab jetzt andersrum.",
      "Auf comtor zahlt die Marke zuerst. Das Geld wird zurückgehalten, bis dein Post online ist.",
      "Erst bezahlt. Dann posten.",
      "Jetzt auf comtor punkt app.",
    ],
  },
  {
    id: "AC3",
    audience: "creator",
    painpoint: "Produkt statt Geld",
    pain: AC3Pain,
    turn: ["Ein Produkt zahlt", { mark: "keine Miete." }],
    mech: AC3Mech,
    payoff: [["Echte Deals.", { mark: "Echtes Geld." }]],
    cta: ["Lass dich", { mark: "bezahlen." }],
    vo: [
      "Wir schicken dir das Produkt als Bezahlung?",
      "Ein Produkt zahlt keine Miete.",
      "Auf comtor bekommst du Geld – und das Produkt oft dazu.",
      "Echte Deals. Echtes Geld.",
      "Die ersten hundert Creator bekommen Pro kostenlos. Auf comtor punkt app.",
    ],
  },
  {
    id: "AC4",
    audience: "creator",
    painpoint: "Warten auf Anfragen",
    pain: AC4Pain,
    turn: ["Warte", { mark: "nicht länger." }],
    mech: AC4Mech,
    payoff: [["Du wählst.", { mark: "Nicht umgekehrt." }]],
    cta: ["Dein nächster Deal", { mark: "wartet schon." }],
    vo: [
      "Noch keine Marke hat dir geschrieben?",
      "Warte nicht länger.",
      "Auf comtor wischst du durch bezahlte Deals.",
      "Du wählst. Nicht umgekehrt.",
      "Jetzt auf comtor punkt app.",
    ],
  },
  {
    id: "AC5",
    audience: "creator",
    painpoint: "Unklar, was übrig bleibt",
    pain: AC5Pain,
    turn: ["Klare", { mark: "Zahlen." }],
    mech: AC5Mech,
    payoff: [["Mit Pro:", { mark: "97 %." }], "242,50 € statt 225,00 €"],
    cta: ["Behalte", { mark: "mehr." }],
    vo: [
      "Zweihundertfünfzig Euro Deal. Was bleibt davon?",
      "Klare Zahlen.",
      "Auf comtor behältst du neunzig Prozent.",
      "Mit Pro sogar siebenundneunzig.",
      "Die ersten hundert Creator bekommen Pro kostenlos. Auf comtor punkt app.",
    ],
  },
  {
    id: "AB1",
    audience: "brand",
    painpoint: "Anzeigen werden ignoriert",
    pain: AB1Pain,
    painBlur: AB1_PAIN_BLUR,
    turn: ["Creatorn", { mark: "hört man zu." }],
    mech: AB1Mech,
    payoff: [["UGC statt", { mark: "Werbung." }], "Echte Creator. Echte Videos."],
    cta: ["Sichere dir", { mark: "deinen Platz." }],
    vo: [
      "Deine Anzeige? Weggewischt.",
      "Aber echten Creatorn hören die Leute zu.",
      "Auf comtor melden sie sich bei dir.",
      "U-G-C statt Werbung.",
      "Die ersten fünfzig Marken bekommen Pro kostenlos. comtor punkt app.",
    ],
  },
  {
    id: "AB2",
    audience: "brand",
    painpoint: "Creator-Suche per DM",
    pain: AB2Pain,
    turn: ["Dreh es", { mark: "um." }],
    mech: AB2Mech,
    payoff: [["Null", { mark: "Kaltakquise." }], "Ohne eine einzige DM."],
    cta: ["Sichere dir", { mark: "deinen Platz." }],
    vo: [
      "Siebenundvierzig DMs. Zwei Antworten.",
      "Dreh es um.",
      "Auf comtor postest du eine Anfrage – und passende Creator melden sich bei dir.",
      "Ohne eine einzige Kalt-DM.",
      "Sichere dir deinen Platz auf comtor punkt app.",
    ],
  },
  {
    id: "AB3",
    audience: "brand",
    painpoint: "Bezahlt, nie gepostet",
    pain: AB3Pain,
    turn: ["Nicht auf", { mark: "comtor." }],
    mech: AB3Mech,
    payoff: [["Du behältst", { mark: "die Kontrolle." }]],
    cta: ["Zahl erst,", { mark: "wenn's live ist." }],
    vo: [
      "Bezahlt – und gepostet hat niemand?",
      "Nicht auf comtor.",
      "Dein Geld wird zurückgehalten, bis der Post online ist und du ihn freigibst.",
      "Du behältst die Kontrolle.",
      "Jetzt auf comtor punkt app.",
    ],
  },
  {
    id: "AB4",
    audience: "brand",
    painpoint: "Retainer und Grundgebühren",
    pain: AB4Pain,
    turn: ["Geht auch", { mark: "ohne." }],
    mech: AB4Mech,
    payoff: [["Zahl nur", { mark: "pro Deal." }], "Keine Grundgebühr. Keine Laufzeit."],
    cta: ["Sichere dir", { mark: "deinen Platz." }],
    vo: [
      "Monatliche Retainer – für ein paar Posts?",
      "Geht auch ohne.",
      "Auf comtor gibt's keine Grundgebühr. Du zahlst nur pro Deal.",
      "Mit Pro nur drei Prozent.",
      "Die ersten fünfzig Marken bekommen Pro kostenlos. comtor punkt app.",
    ],
  },
  {
    id: "AB5",
    audience: "brand",
    painpoint: "Kein Content-Team",
    pain: AB5Pain,
    turn: ["Brauchst du", { mark: "nicht." }],
    mech: AB5Mech,
    payoff: [["Creator machen", { mark: "den Content." }]],
    cta: ["Content,", { mark: "ohne Team." }],
    vo: [
      "Kein Content-Team?",
      "Brauchst du nicht.",
      "Anfrage in einer Minute.",
      "Creator machen den Content für dich.",
      "Sichere dir deinen Platz auf comtor punkt app.",
    ],
  },
];

// Drawn lengths: 10 + 3 + 9 + 4 + 8 beats, minus four one-beat transitions = 30 beats = 15 s.
function scenesOf(spec: AdSpec): Scene[] {
  const [payoff, payoffSub] = spec.payoff;
  return [
    { id: `${spec.id}-1`, component: spec.pain, duration: 10 * BEAT, keyframe: 110, blur: spec.painBlur },
    { id: `${spec.id}-2`, component: turnScene(spec.turn), duration: 3 * BEAT, keyframe: 26, enter: wipe({ direction: "from-left" }), whoosh: false },
    { id: `${spec.id}-3`, component: spec.mech, duration: 9 * BEAT, keyframe: 112, enter: slide({ direction: "from-bottom" }) },
    { id: `${spec.id}-4`, component: payoffScene(payoff, payoffSub), duration: 4 * BEAT, keyframe: 42, enter: fade(), whoosh: false },
    { id: `${spec.id}-5`, component: ctaScene(spec.audience, spec.cta), duration: 8 * BEAT, keyframe: 100, enter: wipe({ direction: "from-right" }), whoosh: false },
  ];
}

export type Ad = {
  id: string;
  audience: Audience;
  painpoint: string;
  vo: string[];
  scenes: ReturnType<typeof fitToVoice>;
  duration: number;
  component: React.FC<VideoProps>;
};

export const ADS: Ad[] = SPECS.map((spec) => {
  const scenes = fitToVoice(scenesOf(spec), VOICE as Record<string, { file: string; seconds: number }>);
  const Video: React.FC<VideoProps> = (props) => <SceneSeries scenes={scenes} bed={`music/ads/${spec.id}.mp3`} {...props} />;
  return { id: spec.id, audience: spec.audience, painpoint: spec.painpoint, vo: spec.vo, scenes, duration: seriesDuration(scenes), component: Video };
});

// Ids of the voiceover lines that have a recording (src/voice/ads.json, written by scripts/make-ad-voiceover.py).
export const HAS_VOICE = Object.keys(VOICE).length > 0;
