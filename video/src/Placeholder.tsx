import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { colors } from "./theme";

// Stand-in until the storyboard is signed off.
export const Placeholder: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.paper,
        color: colors.ink,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Lato, ui-sans-serif, system-ui, sans-serif",
        fontWeight: 900,
        fontSize: 96,
        opacity,
      }}
    >
      {title}
    </AbsoluteFill>
  );
};
