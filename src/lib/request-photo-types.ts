// The only image types a request photo may be — the client re-encodes
// every pick to JPEG anyway (see resizeImageFile), so this just keeps
// anything else (SVG in particular, which can carry script) from being
// stored or served. Its own module so the client form can import it
// without pulling in the database client.
export const REQUEST_PHOTO_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/webp"];

// How many photos a request can have; the first is the cover.
export const MAX_REQUEST_PHOTOS = 5;
