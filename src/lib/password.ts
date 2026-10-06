import bcrypt from "bcryptjs";

// Cost 10 is the lowest OWASP still recommends for bcrypt. It stays one value everywhere on purpose:
// sign-in compares against this hash for an address nobody registered, so a stranger can't tell from
// the response time whether an account exists, which only holds while both take equally long.
export const BCRYPT_COST = 10;

// A bcrypt hash of a random value nobody knows, at BCRYPT_COST.
const DUMMY_PASSWORD_HASH = "$2b$10$3J0Ncz106pUt0YW2Gp06cerUZXMB6rDZEjx4Xc/yKUjrr3njkhuO6";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

// Always does the bcrypt work, also when there is no such account.
export async function verifyPassword(user: { passwordHash: string } | null, password: string): Promise<boolean> {
  const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
  return user !== null && matches;
}
