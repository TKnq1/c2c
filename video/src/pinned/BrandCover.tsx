import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import { ease, pop } from "../anim";
import { Sfx } from "../audio";
import { PHOTOS } from "../theme";
import { AppHeader, AppTabBar, CreatorRow, GreyAvatar, GreyGroup, POST_WIDTH } from "../posts/kit";
import { IPhone, IPHONE_HEIGHT, IPHONE_WIDTH } from "./iphone";
import { Bed, Night, SampleNote, TwoTone } from "./kit";

export const BRAND_COVER_DURATION = 210;

const SCALE = 1.38;
const PHONE_LEFT = (POST_WIDTH - IPHONE_WIDTH * SCALE) / 2;
const PHONE_TOP = 372;
const PHONE_CENTER = { x: POST_WIDTH / 2, y: PHONE_TOP + (IPHONE_HEIGHT * SCALE) / 2 };

type Platform = "TikTok" | "Instagram" | "YouTube";

const CREATORS: { name: string; niche: string; platform: Platform; followers: string }[] = [
  { name: "Mia K.", niche: "Beauty", platform: "TikTok", followers: "58K" },
  { name: "Jonas R.", niche: "Lifestyle", platform: "Instagram", followers: "112K" },
  { name: "Aria N.", niche: "Beauty", platform: "YouTube", followers: "34K" },
  { name: "Lea S.", niche: "Fashion", platform: "Instagram", followers: "76K" },
  { name: "Tom B.", niche: "Fitness", platform: "TikTok", followers: "41K" },
  { name: "Nina P.", niche: "Beauty", platform: "TikTok", followers: "23K" },
];
const ROW_AT = [16, 26, 36, 46, 56, 66];

// The posts the creators make, flying out of the phone into the feeds around it: x, y, tilt, crop of the photo.
export const POSTS: { name: string; platform: Platform; x: number; y: number; rotate: number; crop: string; at: number }[] = [
  { name: "Mia K.", platform: "TikTok", x: 160, y: 560, rotate: -5, crop: "50% 40%", at: 84 },
  { name: "Jonas R.", platform: "Instagram", x: 920, y: 600, rotate: 5, crop: "40% 55%", at: 92 },
  { name: "Aria N.", platform: "YouTube", x: 146, y: 880, rotate: 4, crop: "60% 50%", at: 100 },
  { name: "Lea S.", platform: "Instagram", x: 934, y: 920, rotate: -4, crop: "50% 65%", at: 108 },
  { name: "Tom B.", platform: "TikTok", x: 164, y: 1200, rotate: -3, crop: "45% 35%", at: 116 },
  { name: "Nina P.", platform: "TikTok", x: 916, y: 1240, rotate: 3, crop: "55% 45%", at: 124 },
];

const ICON: Record<Platform, React.ReactNode> = {
  TikTok: <SiTiktok size={22} color="#000" />,
  Instagram: <SiInstagram size={22} color="#E4405F" />,
  YouTube: <SiYoutube size={22} color="#FF0000" />,
};

// One creator's post with the brand's product: a vertical video frame, the platform, who posted it.
export const PostTile: React.FC<{ name: string; platform: Platform; crop: string }> = ({ name, platform, crop }) => (
  <div style={{ position: "relative", width: 172, height: 300, borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)" }}>
    <Img src={staticFile(PHOTOS.flask)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: crop, transform: "scale(1.25)" }} />
    <div style={{ position: "absolute", top: 14, left: 14, width: 40, height: 40, borderRadius: 999, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {ICON[platform]}
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 120, background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }} />
    <div style={{ position: "absolute", left: 14, bottom: 14, display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 20, fontWeight: 700 }}>
      <GreyAvatar name={name} size={34} />
      {name}
    </div>
  </div>
);

// The brands' pinned post, slide 1: one request, creators raising their hands, their posts carrying the brand out
// into their feeds.
export const BrandCover: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Night>
      <Bed file="music/brand-bed.mp3" duration={BRAND_COVER_DURATION} />
      {ROW_AT.map((at) => (
        <Sfx key={at} name="pop" at={at} volume={0.4} />
      ))}
      {POSTS.map((post) => (
        <Sfx key={post.name} name="whoosh" at={post.at - 2} volume={0.22} />
      ))}
      <Sfx name="ding" at={136} volume={0.5} />

      <TwoTone top={96} size={80} lines={[{ text: "Für Marken." }, { text: "Wachse mit", grey: true }, { text: "echten Creatorn.", grey: true }]} />

      <IPhone left={PHONE_LEFT} top={PHONE_TOP} scale={SCALE}>
        <AppHeader title="Anfragen" />
        <div style={{ padding: 12 }}>
          <GreyGroup style={{ display: "flex", alignItems: "center", gap: 10, padding: 10 }}>
            <Img src={staticFile(PHOTOS.flask)} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>Unser neues Parfüm, erste Eindrücke</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: "#737373" }}>
                300 € ·
                <SiInstagram size={12} color="#E4405F" />1 Reel
              </div>
            </div>
          </GreyGroup>
          <p style={{ margin: "14px 0 0", padding: "0 4px", fontSize: 13, lineHeight: "18px", color: "#737373" }}>Interessierte Creator</p>
          <GreyGroup style={{ marginTop: 6, overflow: "hidden" }}>
            {CREATORS.map((c, i) => {
              const p = pop(frame, ROW_AT[i]);
              return (
                <div key={c.name} style={{ opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * 40}px)` }}>
                  <CreatorRow {...c} last={i === CREATORS.length - 1} />
                </div>
              );
            })}
          </GreyGroup>
        </div>
        <AppTabBar />
      </IPhone>

      {POSTS.map(({ x, y, rotate, at, ...post }) => {
        const p = ease(frame, at, { stiffness: 90, damping: 16 });
        const cx = interpolate(p, [0, 1], [PHONE_CENTER.x, x]);
        const cy = interpolate(p, [0, 1], [PHONE_CENTER.y, y]);
        return (
          <div
            key={post.name}
            style={{
              position: "absolute",
              left: cx,
              top: cy,
              transform: `translate(-50%, -50%) rotate(${rotate * p}deg) scale(${0.3 + 0.7 * p})`,
              opacity: Math.min(1, p * 3),
            }}
          >
            <PostTile {...post} />
          </div>
        );
      })}

      <SampleNote />
    </Night>
  );
};
