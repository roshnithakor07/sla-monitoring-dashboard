-- AlterTable: add contentHash as nullable first, backfill existing rows
-- with a unique placeholder (their own id), then tighten to NOT NULL.
-- New rows going forward always carry a real SHA-256 of the uploaded CSV.
ALTER TABLE "DatasetImport" ADD COLUMN "contentHash" TEXT;

UPDATE "DatasetImport" SET "contentHash" = 'legacy-' || id WHERE "contentHash" IS NULL;

ALTER TABLE "DatasetImport" ALTER COLUMN "contentHash" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DatasetImport_contentHash_key" ON "DatasetImport"("contentHash");
