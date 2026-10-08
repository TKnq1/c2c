// Same monochrome palette as the web app (src/app/globals.css).
export const colors = {
  ink: "#070707",
  paper: "#ffffff",
  fog: "#f2f2f2",
  stone: "#a2a2a9",
  graphite: "#797979",
  line: "rgba(7, 7, 7, 0.1)",
} as const;

export const FONT = "Lato, ui-sans-serif, system-ui, sans-serif";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Side padding of every scene.
export const GUTTER = 72;

export const PHOTOS = {
  serum: "photos/serum-orange.jpg",
  matcha: "photos/matcha.jpg",
  headphones: "photos/watermelon-headphones.jpg",
  glasses: "photos/glasses-lilac.jpg",
  lipstick: "photos/lipstick-red.jpg",
  tote: "photos/leather-tote.jpg",
  cream: "photos/cream-lemon.jpg",
  lotion: "photos/bottle-blue.jpg",
  flask: "photos/flask-pastel.jpg",
  // Real brands of the ads (src/ads/brands.ts).
  rawHoodie: "photos/brands/raw-hoodie-front.jpg",
  rawHoodieBack: "photos/brands/raw-hoodie-back.jpg",
  rawPants: "photos/brands/raw-pants.jpg",
  vsCatalog1: "photos/brands/vs-catalog-1.jpg",
  vsCatalog2: "photos/brands/vs-catalog-2.jpg",
  nokarHoodie: "photos/brands/nokar-hoodie.jpg",
} as const;

export type PhotoKey = keyof typeof PHOTOS;
