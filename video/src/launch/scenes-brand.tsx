import { AbsoluteFill } from "remotion";
import { mix, ramp } from "../anim";
import { Sfx } from "../audio";
import { Cursor, pressAt } from "../components/shared-scenes";
import { useFrame } from "../frame";
import { colors } from "../theme";
import { ChoiceSheet, CREATORS, DiscoverPage, type FormState, RequestForm, type SheetKind, slotPos } from "./app-screens";
import {
  AppIcon,
  Backdrop,
  Center,
  DesktopApp,
  drift,
  fitScale,
  flyIn,
  glide,
  LightSweep,
  LAUNCH_HEIGHT,
  LAUNCH_WIDTH,
  Macro,
  Mark,
  pointer,
  SampleTag,
  slam,
  slamStyle,
  spr,
  Tick,
  typedCount,
  typingTimes,
} from "./kit";
import { caretOn, FocusWords, Keys, last, SlamWords, Typed } from "./parts";

// The brand's half of the launch video (LAUNCH.md) and the end: the switch to brands, the briefing with its choices,
// Discover, the difference, the logo and the call to action.

// ---------------------------------------------------------------------------------------------------------------
// 10 · Switch to brands: "Und" slams in, steps up, and the line after it comes in with its letters drawing together.
const ForBrands: React.FC = () => {
  const frame = useFrame();
  const up = spr(frame, 38, "swing");
  const tighten = glide(frame, 48, 100);
  return (
    <Backdrop light="night" lines={10}>
      <Sfx name="boom" at={0} volume={0.3} />
      <Sfx name="slam" at={0} volume={0.65} />
      <Sfx name="whoosh" at={44} volume={0.08} />
      <Center>
        <div style={{ transform: `scale(${drift(frame, 105, 1.1, 0.86)})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 240, fontWeight: 900, letterSpacing: -9, lineHeight: 1, transform: `translateY(${mix(up, 60, -30)}px) scale(${mix(up, 1, 0.6)})`, ...slamStyle(slam(frame, 0), 2.2, 40) }}>Und</div>
          {frame >= 44 && (
            <FocusWords size={64} start={48} stagger={4} dark spacing={mix(tighten, 0.8, 0)} parts={[{ text: "für Marken:", soft: true, bold: false }, { text: "ein Briefing, alle passenden Creator." }]} />
          )}
        </div>
      </Center>
    </Backdrop>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// 11 · Briefing, one camera: right on the title field while it is typed, out to the whole New request, then through
// its choices the way the form makes them (request-form.tsx): a row opens its sheet, a pill is picked, the row and the
// preview change. Niche, minimum followers, platform, content, then "Anfrage posten".

const TITLE = "Nokar Hoodie, Drop-Teaser";
const TITLE_TIMES = typingTimes(TITLE, 12, 2.4);
const PULL = [last(TITLE_TIMES) + 8, last(TITLE_TIMES) + 50] as const;
const CLOSE = 5.2;
const WIDE = 1.12;
const TITLE_POINT = { x: 309, y: 260 };
const PAGE_POINT = { x: 640, y: 422 };
// Where things sit on the page (app pixels in the window): the rows of the form, the button.
const ROW_X = 852;
const ROWS = { platform: 362, content: 408, niche: 594, followers: 640 };
const POST = { x: 1098, y: 565 };
// The choice sheet sits here in the frame at SHEET_SCALE times the app's size; the picked pill's centre inside it.
const SHEET_SCALE = 1.5;
const SHEET = { x: 615, y: 290 };
const PICKS: Record<SheetKind, { value: string; x: number; y: number }> = {
  niche: { value: "Fashion", x: 289, y: 73 },
  followers: { value: "10.000", x: 243, y: 129 },
  platform: { value: "Instagram", x: 76, y: 73 },
  content: { value: "1 Reel", x: 35, y: 73 },
};
// Each choice: when the pointer sets off for the row, clicks it, sets off for the pill, picks it, the sheet closes.
const STEPS: { kind: SheetKind; go: number }[] = [
  { kind: "niche", go: PULL[1] + 10 },
  { kind: "followers", go: PULL[1] + 64 },
  { kind: "platform", go: PULL[1] + 118 },
  { kind: "content", go: PULL[1] + 172 },
];
const plan = (go: number) => ({ go, click: go + 16, open: go + 18, toPill: go + 24, pick: go + 40, close: go + 50 });
const POST_GO = PULL[1] + 226;
const POST_AT = POST_GO + 16;

function camera(frame: number) {
  const typed = Math.max(0, typedCount(frame, TITLE_TIMES));
  const pull = glide(frame, PULL[0], PULL[1]);
  const s = Math.exp(mix(pull, Math.log(CLOSE * mix(glide(frame, 0, PULL[0]), 0.9, 1.04)), Math.log(WIDE)));
  const follow = Math.max(0, 200 + typed * 7.3 * CLOSE - 1500);
  const focus = { x: mix(pull, TITLE_POINT.x, PAGE_POINT.x), y: mix(pull, TITLE_POINT.y, PAGE_POINT.y) };
  const anchor = { x: mix(pull, 200 - follow - frame * 0.8, 960), y: mix(pull, 500 - frame * 0.4, 540) };
  return { s, left: anchor.x - focus.x * s, top: anchor.y - focus.y * s };
}

const Briefing: React.FC = () => {
  const frame = useFrame();
  const cam = camera(frame);
  const at = (p: { x: number; y: number }) => ({ x: cam.left + p.x * cam.s, y: cam.top + p.y * cam.s });

  // The form as far as the choices have got, and the sheet that is open.
  const form: FormState = { title: TITLE.slice(0, typedCount(frame, TITLE_TIMES)), caret: frame < PULL[0] + 6 && caretOn(frame, last(TITLE_TIMES)), followers: "0", platform: "TikTok", flash: {}, posted: frame >= POST_AT + 2, press: pressAt(frame, POST_AT) };
  let sheet: { kind: SheetKind; open: number; picked?: string; pop: number } | null = null;
  // The pointer's route: from off screen to each row, its pill, then to the button.
  let from = { x: 1760, y: 1120 };
  let cursor = from;
  for (const { kind, go } of STEPS) {
    const t = plan(go);
    const row = at({ x: ROW_X, y: ROWS[kind] });
    const pill = { x: SHEET.x + PICKS[kind].x * SHEET_SCALE, y: SHEET.y + PICKS[kind].y * SHEET_SCALE };
    if (frame >= t.go) cursor = pointer(frame, t.go, from, row, 1.15);
    if (frame >= t.toPill) cursor = pointer(frame, t.toPill, row, pill, 1.3);
    from = pill;
    if (frame >= t.open && frame < t.close + 10) {
      const open = spr(frame, t.open, "snap") * (1 - ramp(frame, t.close, t.close + 8));
      sheet = { kind, open, picked: frame >= t.pick ? PICKS[kind].value : undefined, pop: ramp(frame, t.pick, t.pick + 10) };
    }
    if (frame >= t.close) {
      if (kind === "niche") form.niche = "Fashion";
      if (kind === "followers") form.followers = "10.000";
      if (kind === "platform") form.platform = "Instagram";
      if (kind === "content") form.content = "1 Reel";
      form.flash[kind] = 1 - ramp(frame, t.close, t.close + 24);
    }
    if (frame >= t.click && frame < t.close) form.flash[kind] = Math.max(form.flash[kind] ?? 0, 1 - ramp(frame, t.click, t.click + 10));
  }
  if (frame >= POST_GO) cursor = pointer(frame, POST_GO, from, at(POST), 1.1);
  const clicks = STEPS.flatMap(({ go }) => [plan(go).click, plan(go).pick]);
  const pressed = Math.max(...clicks.map((c) => pressAt(frame, c)), pressAt(frame, POST_AT));
  const toast = spr(frame, POST_AT + 6, "swing");
  const zoom = 1 + 0.05 * Math.min(1, Math.max(0, sheet?.open ?? 0)) + 0.06 * glide(frame, POST_AT, POST_AT + 60);
  // Where the button sits on screen through the zoom, for the close-up on the press.
  const button = at(POST);
  const postAt = { x: 0.52 * LAUNCH_WIDTH + (button.x - 0.52 * LAUNCH_WIDTH) * zoom, y: 0.5 * LAUNCH_HEIGHT + (button.y - 0.5 * LAUNCH_HEIGHT) * zoom };
  return (
    <Backdrop light="mist">
      <Keys times={TITLE_TIMES} />
      <Sfx name="whoosh" at={PULL[0]} volume={0.14} />
      {clicks.map((c) => (
        <Sfx key={c} name="click" at={c} volume={0.5} />
      ))}
      <Sfx name="click" at={POST_AT} volume={0.65} />
      <Sfx name="success" at={POST_AT + 6} volume={0.5} />
      <Macro shots={[{ at: POST_AT, hold: 8, x: postAt.x, y: postAt.y, zoom: 1.6 }]}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "52% 50%" }}>
        <DesktopApp side="brand" active="Anfragen" title="Neue Anfrage" scale={cam.s} style={{ position: "absolute", left: cam.left, top: cam.top }}>
          <RequestForm form={form} />
        </DesktopApp>
        {sheet && (
          <>
            <AbsoluteFill style={{ backgroundColor: `rgba(7,7,7,${0.16 * Math.max(0, sheet.open)})` }} />
            <div style={{ position: "absolute", left: SHEET.x, top: SHEET.y, transform: `scale(${SHEET_SCALE})`, transformOrigin: "0 0" }}>
              <ChoiceSheet kind={sheet.kind} open={sheet.open} picked={sheet.picked} pop={sheet.pop} />
            </div>
          </>
        )}
        <div style={{ opacity: ramp(frame, STEPS[0].go, STEPS[0].go + 8) * (1 - ramp(frame, POST_AT + 24, POST_AT + 36)) }}>
          <Cursor x={cursor.x} y={cursor.y} pressed={pressed} />
        </div>
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 80,
            display: "flex",
            alignItems: "center",
            gap: 16,
            backgroundColor: colors.ink,
            color: colors.paper,
            borderRadius: 14,
            padding: "18px 26px",
            fontSize: 26,
            fontWeight: 700,
            boxShadow: "0 30px 60px rgba(7,7,7,0.25)",
            ...flyIn(toast, { y: -80 }),
            opacity: frame < POST_AT + 6 ? 0 : Math.min(1, toast * 2),
          }}
        >
          <Tick size={30} dark />
          Anfrage veröffentlicht
        </div>
        <LightSweep from={POST_AT + 10} to={POST_AT + 60} opacity={0.4} />
      </AbsoluteFill>
      </Macro>
      <SampleTag />
    </Backdrop>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// 12 · Discover for brands: the creators for the new request; the filters go on one by one (niche, platform, reach),
// the tiles that no longer fit leave and the rest close up, each with what it matches; one gets invited.
const FILTERS = [34, 60, 86];
const REASONS = 106;
const INVITE_GO = 112;
const INVITE_AT = 140;
const DWIN = { left: 256, top: 76, s: 1.1 };
// The first tile's Invite button on the page.
const INVITE = { x: 381, y: 557 };

const Discover: React.FC = () => {
  const frame = useFrame();
  const filters = FILTERS.map((at) => (frame >= at ? spr(frame, at, "snap") : 0)) as [number, number, number];
  // Who is left after each filter, and where each creator sits after each step.
  const steps = [0, ...FILTERS];
  const slotsAt = steps.map((_, k) => {
    const left = CREATORS.map((c, i) => ({ i, keep: c.keep })).filter((c) => c.keep > k);
    return CREATORS.map((_, i) => left.findIndex((c) => c.i === i));
  });
  const positions = CREATORS.map((_, i) => {
    let pos = slotPos(i);
    for (let k = 1; k < steps.length; k++) {
      const to = slotsAt[k][i];
      if (to < 0) continue;
      const fromSlot = slotsAt[k - 1][i];
      const a = slotPos(fromSlot < 0 ? to : fromSlot);
      const b = slotPos(to);
      const p = spr(frame, steps[k] + 6, "swing");
      pos = { x: pos.x + (b.x - a.x) * p, y: pos.y + (b.y - a.y) * p };
    }
    return pos;
  });
  const gone = CREATORS.map((c) => (c.keep < 9 ? ramp(frame, FILTERS[c.keep - 1], FILTERS[c.keep - 1] + 12) : 0));
  const count = 8 - CREATORS.filter((c) => c.keep < 9 && frame >= FILTERS[c.keep - 1] + 6).length;
  const target = { x: DWIN.left + INVITE.x * DWIN.s, y: DWIN.top + INVITE.y * DWIN.s };
  const cursor = pointer(frame, INVITE_GO, { x: 1780, y: 1100 }, target, 1.25);
  const win = spr(frame, 0, "glide");
  const spread = drift(frame, 190, 1, 1.08);
  const inviteAt = { x: 0.35 * LAUNCH_WIDTH + (target.x - 0.35 * LAUNCH_WIDTH) * spread, y: 0.55 * LAUNCH_HEIGHT + (target.y - 0.55 * LAUNCH_HEIGHT) * spread };
  return (
    <Backdrop light="mist">
      {FILTERS.map((at) => (
        <Sfx key={`w${at}`} name="swipe" at={at + 4} volume={0.08} />
      ))}
      <Sfx name="click" at={INVITE_AT} volume={0.6} />
      <Macro shots={[{ at: INVITE_AT, hold: 12, x: inviteAt.x, y: inviteAt.y }]}>
      <AbsoluteFill style={{ transform: `scale(${spread})`, transformOrigin: "35% 55%" }}>
        <div style={{ position: "absolute", left: DWIN.left, top: DWIN.top, ...flyIn(win, { y: 500, r: 3 }) }}>
          <DesktopApp side="brand" active="Entdecken" title="Entdecken" scale={DWIN.s}>
            <DiscoverPage filters={filters} count={count} positions={positions} gone={gone} reasons={ramp(frame, REASONS, REASONS + 14)} invite={{ press: pressAt(frame, INVITE_AT), done: frame >= INVITE_AT + 2 }} />
          </DesktopApp>
        </div>
        <div style={{ opacity: ramp(frame, INVITE_GO, INVITE_GO + 8) }}>
          <Cursor x={cursor.x} y={cursor.y} pressed={pressAt(frame, INVITE_AT)} />
        </div>
        <div style={{ position: "absolute", right: 110, top: 96, fontSize: 44, fontWeight: 900, letterSpacing: -1.2, color: colors.graphite, ...flyIn(spr(frame, 10, "land"), { x: 120 }) }}>Für Marken</div>
        <LightSweep from={REASONS} to={REASONS + 60} opacity={0.35} />
      </AbsoluteFill>
      </Macro>
      <SampleTag />
    </Backdrop>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// 13 · The difference: the first line slams in and fades back out of focus, the second slams in over it.
const Difference: React.FC = () => {
  const frame = useFrame();
  const back = glide(frame, 62, 90);
  return (
    <Backdrop light="mist" lines={13}>
      <Sfx name="slam" at={2} volume={0.5} />
      <Sfx name="whoosh" at={60} volume={0.08} />
      <Sfx name="slam" at={78} volume={0.6} />
      <Center>
        <div style={{ position: "absolute", transform: `translateY(${-back * 150}px) scale(${drift(frame, 90, 1.06, 0.9) * mix(back, 1, 0.62)})`, opacity: mix(back, 1, 0.35), filter: back > 0 ? `blur(${back * 3}px)` : undefined }}>
          <SlamWords size={110} start={2} stagger={7} accel={0.5} parts={[{ text: "Agenturen vermitteln Kontakte." }]} />
        </div>
        {frame >= 76 && (
          <div style={{ position: "absolute", transform: `translateY(40px) scale(${drift(Math.max(0, frame - 76), 110, 1.06, 0.9)})` }}>
            <SlamWords size={124} start={78} stagger={6} accel={0.4} from={2.2} parts={[{ text: "comtor" }, { text: "wickelt den Deal ab." }]} />
          </div>
        )}
      </Center>
    </Backdrop>
  );
};

// 14 · End card: the app icon alone, then the name types out next to it and pushes it aside.
const END_TIMES = typingTimes("comtor", 32, 3.4);

const EndCard: React.FC = () => {
  const frame = useFrame();
  const icon = spr(frame, 4, "swing");
  const letters = typedCount(frame, END_TIMES);
  return (
    <Backdrop light="mist">
      <Sfx name="boom" at={4} volume={0.35} />
      <Keys times={END_TIMES} />
      <Center>
        <div style={{ display: "flex", alignItems: "center", gap: letters > 0 ? 44 : 0, transform: `scale(${drift(frame, 145, 1.12, 0.76)})` }}>
          <AppIcon
            size={184}
            style={{ transform: `scale(${icon}) rotate(${mix(Math.min(icon, 1), 30, 0)}deg)`, opacity: Math.min(1, icon * 2), filter: icon < 0.95 ? `blur(${(1 - Math.min(icon, 1)) * 12}px)` : undefined }}
          />
          {letters > 0 && <span style={{ fontSize: 200, fontWeight: 900, letterSpacing: -6, lineHeight: 1, whiteSpace: "pre", transform: "translateY(-12px)" }}>{"comtor".slice(0, letters)}</span>}
        </div>
      </Center>
    </Backdrop>
  );
};

// 15 · Call to action on black: the claim typed, erased, the call to action typed, the address under it.
const CLAIM_LINE = "Der Marktplatz für Marken und Creator.";
const CTA_LINE = "Jetzt kostenlos starten.";
const CLAIM_TIMES = typingTimes(CLAIM_LINE, 8, 1.5);
const ERASE_AT = last(CLAIM_TIMES) + 18;
const CTA_TIMES = typingTimes(CTA_LINE, ERASE_AT + Math.ceil(CLAIM_LINE.length / 1.4) + 8, 2);

function ctaLine(frame: number) {
  if (frame < ERASE_AT) return CLAIM_LINE.slice(0, typedCount(frame, CLAIM_TIMES));
  if (frame < CTA_TIMES[0]) return CLAIM_LINE.slice(0, Math.max(0, CLAIM_LINE.length - Math.floor((frame - ERASE_AT) * 1.4)));
  return CTA_LINE.slice(0, typedCount(frame, CTA_TIMES));
}

const Cta: React.FC = () => {
  const frame = useFrame();
  const line = ctaLine(frame);
  let chars = 0;
  for (let i = 0; i < 10; i++) chars += ctaLine(Math.max(0, frame - i)).length / 10;
  const idle = frame >= last(CLAIM_TIMES) && frame < ERASE_AT ? last(CLAIM_TIMES) : frame >= last(CTA_TIMES) ? last(CTA_TIMES) : 9999;
  const url = spr(frame, last(CTA_TIMES) + 12, "swing");
  return (
    <Backdrop light="night">
      <Keys times={CLAIM_TIMES} volume={0.42} />
      <Keys times={Array.from({ length: 17 }, (_, k) => ERASE_AT + 1 + k * 2)} del volume={0.4} />
      <Keys times={CTA_TIMES} />
      <Center>
        <div style={{ transform: `scale(${fitScale(chars, 64, 1300, 1.9)})` }}>
          <Typed text={line} size={64} caret={caretOn(frame, idle)} dark />
        </div>
      </Center>
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 700, ...flyIn(url, { y: 60 }), opacity: frame < last(CTA_TIMES) + 12 ? 0 : Math.min(1, url * 2) }}>
          <Mark width={40} white />
          comtor.app
        </div>
      </div>
    </Backdrop>
  );
};

export const BRAND_SCENES = { ForBrands, Briefing, Discover, Difference, EndCard, Cta };
