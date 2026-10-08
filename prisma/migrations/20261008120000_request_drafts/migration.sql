-- Request drafts: a request a brand saved without posting it. Additive on purpose (previews share the
-- live database and the previous release keeps running on it until the new one is live): one new value,
-- nothing renamed or dropped. Everything that shows requests to others already asks for status OPEN.
ALTER TYPE "RequestStatus" ADD VALUE 'DRAFT';
