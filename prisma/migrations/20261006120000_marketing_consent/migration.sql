-- Optional product-news consent. The timestamp is the proof; the token
-- hash is only the unconfirmed confirmation link.
ALTER TABLE "User" ADD COLUMN "marketingConsentAt" TIMESTAMP(3),
ADD COLUMN "marketingTokenHash" TEXT,
ADD COLUMN "marketingTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "marketingSentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_marketingTokenHash_key" ON "User"("marketingTokenHash");
