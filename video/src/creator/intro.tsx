import type { ReactNode } from "react";
import { Easing } from "remotion";
import { useFrame } from "../frame";
import { IoBookmarkOutline, IoChatbubbleOutline, IoHeart, IoHeartOutline, IoPaperPlaneOutline } from "react-icons/io5";
import { Sfx } from "../audio";
import { ease, mix, pop, popIn, ramp } from "../anim";
import { LogoReveal } from "../components/shared-scenes";
import { Bubble, PhoneOutline, SceneHeader, Stage } from "../components/ui";
import { colors, GUTTER } from "../theme";

// A grey stand-in for a social post: header, image, action row.
const FeedPost: React.FC<{ width: number; liked?: boolean; likes?: ReactNode; image?: ReactNode }> = ({ width, liked, likes, image }) => (
  <div style={{ width, display: "flex", flexDirection: "column", gap: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: colors.stone }} />
      <div style={{ width: 200, height: 18, borderRadius: 4, backgroundColor: colors.fog }} />
    </div>
    <div style={{ width, height: width, backgroundColor: colors.fog, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {image}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "0 24px", fontSize: 30 }}>
      {liked ? <IoHeart size={44} /> : <IoHeartOutline size={44} />}
      <IoChatbubbleOutline size={42} />
      <IoPaperPlaneOutline size={40} />
      <IoBookmarkOutline size={40} style={{ marginLeft: "auto" }} />
    </div>
    {likes && <div style={{ padding: "0 24px", fontSize: 30, fontWeight: 700, position: "relative", height: 36 }}>{likes}</div>}
  </div>
);

// Height of one post in the scrolling feed (post + gap).
const POST_STEP = 860;
const OTHER_LIKES = ["812", "2.391", "", "96"];

export const C01Hook: React.FC = () => {
  const frame = useFrame();
  const phone = ease(frame, 6, { stiffness: 90 });
  const scroll = ramp(frame, 14, 60, Easing.out(Easing.quad));
  const heart = pop(frame, 66);
  const liked = frame >= 66;

  return (
    <Stage>
      <SceneHeader parts={["Du postest", { mark: "sowieso." }]} size={130} start={0} />
      <PhoneOutline width={640} height={1240} style={{ position: "absolute", top: 600, left: 220, transform: `translateY(${(1 - phone) * 1300}px)` }}>
        <div style={{ paddingTop: 110, transform: `translateY(${-scroll * POST_STEP * 2}px)` }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: POST_STEP }}>
              {i === 2 ? (
                <FeedPost
                  width={610}
                  liked={liked}
                  likes={`${liked ? "1.204" : "1.203"} Gefällt mir`}
                  image={
                    <IoHeart
                      size={260}
                      color={colors.paper}
                      style={{ transform: `scale(${heart})`, opacity: heart > 0.01 ? 1 : 0, filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.25))" }}
                    />
                  }
                />
              ) : (
                <FeedPost width={610} likes={`${OTHER_LIKES[i]} Gefällt mir`} />
              )}
            </div>
          ))}
        </div>
      </PhoneOutline>
      <div
        style={{
          position: "absolute",
          top: 1290,
          left: 720,
          padding: "14px 26px",
          borderRadius: 999,
          backgroundColor: colors.ink,
          color: colors.paper,
          fontSize: 34,
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 16px 40px rgba(7,7,7,0.3)",
          transformOrigin: "left center",
          ...popIn(pop(frame, 72), 0.3),
        }}
      >
        <IoHeart size={34} /> +1
      </div>
      <Sfx name="whoosh" at={4} volume={0.35} />
      <Sfx name="like" at={66} volume={0.7} />
      <Sfx name="pop" at={72} volume={0.45} />
    </Stage>
  );
};

const COINS = [
  { x: 110, y: 780, size: 150, rotate: -14, delay: 22 },
  { x: 800, y: 720, size: 190, rotate: 12, delay: 28 },
  { x: 860, y: 1240, size: 120, rotate: -6, delay: 34 },
  { x: 90, y: 1380, size: 110, rotate: 20, delay: 40 },
  { x: 470, y: 1080, size: 170, rotate: -4, delay: 46 },
];

const Coin: React.FC<{ x: number; y: number; size: number; rotate: number }> = ({ x, y, size, rotate }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: colors.ink,
      color: colors.paper,
      border: `${size * 0.06}px solid ${colors.paper}`,
      boxShadow: `0 0 0 ${size * 0.03}px ${colors.ink}, 0 18px 40px rgba(7,7,7,0.25)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.5,
      fontWeight: 900,
      transform: `rotate(${rotate}deg)`,
    }}
  >
    €
  </div>
);

export const C02Twist: React.FC = () => {
  const frame = useFrame();
  const swap = ramp(frame, 16, 26);

  return (
    <Stage>
      <SceneHeader parts={["Warum nicht dafür", { mark: "bezahlt" }, "werden?"]} size={110} start={0} />
      <div
        style={{
          position: "absolute",
          top: 860,
          left: 210,
          boxShadow: "0 40px 80px rgba(7,7,7,0.15)",
          backgroundColor: colors.paper,
          paddingTop: 24,
          paddingBottom: 24,
          borderRadius: 16,
          ...popIn(ease(frame, 2), 0.9),
        }}
      >
        <FeedPost
          width={660}
          liked
          likes={
            <>
              <span style={{ position: "absolute", opacity: 1 - swap, transform: `translateY(${-swap * 30}px)` }}>1.204 Gefällt mir</span>
              <span style={{ position: "absolute", opacity: swap, transform: `translateY(${(1 - swap) * 30}px)` }}>€ statt nur Likes</span>
            </>
          }
        />
      </div>
      {COINS.map(({ x, y, size, rotate, delay }, i) => {
        const p = ease(frame, delay, { damping: 14, stiffness: 120 });
        const float = Math.sin((frame + i * 17) / 14) * 10 * p;
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: p > 0.01 ? 1 : 0 }}>
            <Coin x={mix(p, 540 - size / 2, x)} y={mix(p, 1220 - size / 2, y) + float} size={size * mix(p, 0.3, 1)} rotate={rotate * p} />
          </div>
        );
      })}
      {COINS.map(({ delay }, i) => (
        <Sfx key={i} name="coin" at={delay} volume={0.3 + i * 0.04} />
      ))}
    </Stage>
  );
};

const DMS = [
  { text: "Was kostet ein Post bei dir?", tilt: -2, in: 14, strike: 52 },
  { text: "Bezahlung dann nach dem Post?", tilt: 1.5, in: 26, strike: 64 },
  { text: "Schick mal deine Mediadaten 🙏", tilt: -1, in: 38 },
];

export const C03Problem: React.FC = () => {
  const frame = useFrame();
  const question = pop(frame, 44);

  return (
    <Stage>
      <SceneHeader parts={["Schluss mit", { mark: "Preis-DMs" }, "und offenen Rechnungen."]} size={96} start={0} />
      <div style={{ position: "absolute", top: 820, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 56 }}>
        {DMS.map((dm, i) => {
          const strike = dm.strike === undefined ? 0 : ramp(frame, dm.strike, dm.strike + 8);
          const fall = ramp(frame, 92 + i * 5, 120 + i * 5, Easing.in(Easing.quad));
          return (
            <div
              key={dm.text}
              style={{
                position: "relative",
                alignSelf: "flex-start",
                opacity: mix(strike, 1, 0.45),
                transformOrigin: "left center",
                transform: `translateY(${fall * 1300}px) rotate(${dm.tilt + fall * (i % 2 ? 25 : -25)}deg) scale(${mix(pop(frame, dm.in), 0.5, 1)})`,
              }}
            >
              <div style={{ opacity: Math.min(1, pop(frame, dm.in) * 2) }}>
                <Bubble style={{ fontSize: 44, maxWidth: "none", padding: "28px 40px" }}>{dm.text}</Bubble>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: -20,
                  right: -20,
                  top: "50%",
                  height: 8,
                  backgroundColor: colors.ink,
                  transformOrigin: "left center",
                  transform: `rotate(-3deg) scaleX(${strike})`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1380,
          right: 110,
          fontSize: 300,
          fontWeight: 900,
          color: colors.stone,
          opacity: Math.min(1, question * 2),
          transform: `rotate(${12 + Math.sin(frame / 6) * 6}deg) scale(${question})`,
        }}
      >
        ?
      </div>
      {DMS.map((dm) => (
        <Sfx key={dm.text} name="pop" at={dm.in} volume={0.45} />
      ))}
      {DMS.map((dm) => dm.strike !== undefined && <Sfx key={dm.text} name="strike" at={dm.strike} volume={0.6} />)}
      <Sfx name="pop-low" at={44} volume={0.5} />
      <Sfx name="swipe" at={92} volume={0.4} />
    </Stage>
  );
};

export const C04Logo: React.FC = () => <LogoReveal line="Bezahlte Marken-Deals für Creator." />;
