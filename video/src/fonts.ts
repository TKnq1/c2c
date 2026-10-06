import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

const WEIGHTS = [
  { weight: "400", file: "Lato-Regular.ttf" },
  { weight: "700", file: "Lato-Bold.ttf" },
  { weight: "900", file: "Lato-Black.ttf" },
] as const;

export const fontsLoaded = Promise.all(
  WEIGHTS.map(({ weight, file }) => loadFont({ family: "Lato", url: staticFile(`fonts/${file}`), weight })),
);
