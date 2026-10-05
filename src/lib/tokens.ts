import { createHash, randomBytes } from "crypto";

// Links in emails (password reset, email verification) carry a random token;
// only its SHA-256 is stored, so a copy of the database can't be used to open
// anyone's link. 256 bits of randomness, so a plain hash is enough.
export const newToken = () => randomBytes(32).toString("hex");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
