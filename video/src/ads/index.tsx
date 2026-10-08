import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import type { HeadlinePart } from "../components/ui";
import { BEAT, fitToVoice, type Scene, SceneSeries, seriesDuration, type VideoProps } from "../series";
import VOICE from "../voice/ads.json";
import { AB1_PAIN_BLUR, AB1Mech, AB1Pain, AB2Mech, AB2Pain, AB3Mech, AB3Pain } from "./brand";
import { AC1Mech, AC1Pain, AC2Mech, AC2Pain, AC4Mech, AC4Pain } from "./creator";
import { type Audience, ctaScene, payoffScene, turnScene } from "./kit";

// The 15 s ads (ADS.md). Every ad has the same five beats; only the painpoint, its mechanism and the copy change:
//   1 pain    hook in the first frame, then the problem made concrete
//   2 turn    black with grain, one short line, the logo huge and faint behind it
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
      "Was nimmst du für einen Post? Immer dieselbe Frage.",
      "Schluss damit.",
      "Auf comtor steht das Budget auf der Karte. Ein Klick.",
      "Kein Verhandeln. Nur wischen.",
      "Hundert Plätze. Pro kostenlos. comtor punkt app.",
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
      "Post ist online. Das Geld nicht. Seit siebenundvierzig Tagen.",
      "Jetzt andersrum.",
      "Die Marke zahlt zuerst. Das Geld wird zurückgehalten.",
      "Erst bezahlt. Dann posten.",
      "Hundert Plätze. Pro kostenlos. comtor punkt app.",
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
      "Noch keine Marke hat dir geschrieben? Seit dreißig Tagen?",
      "Nicht warten.",
      "Auf comtor wählst du bezahlte Deals aus. Mit einem Klick.",
      "Du wählst. Nicht umgekehrt.",
      "Hundert Plätze. Pro kostenlos. comtor punkt app.",
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
      "Deine Anzeige? Weggewischt. Die nächste? Auch.",
      "Creatorn hört man zu.",
      "Auf comtor melden sich Creator bei dir.",
      "U-G-C statt Werbung.",
      "Fünfzig Plätze. Pro kostenlos. comtor punkt app.",
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
      "Siebenundvierzig D-M-s. Zwei Antworten. Das kann besser.",
      "Dreh es um.",
      "Du postest eine Anfrage. Creator melden sich bei dir.",
      "Null Kaltakquise.",
      "Fünfzig Plätze. Pro kostenlos. comtor punkt app.",
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
      "Bezahlt. Und gepostet hat niemand. Gesehen. Keine Antwort.",
      "Nicht auf comtor.",
      "Dein Geld wird zurückgehalten, bis der Post online ist.",
      "Du behältst die Kontrolle.",
      "Fünfzig Plätze. Pro kostenlos. comtor punkt app.",
    ],
  },
];

// Drawn lengths: 10 + 3 + 9 + 4 + 8 beats, minus four one-beat transitions = 30 beats = 15 s.
function scenesOf(spec: AdSpec): Scene[] {
  const [payoff, payoffSub] = spec.payoff;
  return [
    { id: `${spec.id}-1`, component: spec.pain, duration: 10 * BEAT, keyframe: 110, blur: spec.painBlur },
    { id: `${spec.id}-2`, component: turnScene(spec.turn), duration: 3 * BEAT, keyframe: 26, enter: wipe({ direction: "from-left" }), whoosh: false },
    { id: `${spec.id}-3`, component: spec.mech, duration: 9 * BEAT, keyframe: 124, enter: slide({ direction: "from-bottom" }) },
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
