-- Add index on downloadToken for faster lookups
CREATE INDEX "Facture_downloadToken_idx" ON "Facture"("downloadToken") WHERE "downloadToken" IS NOT NULL;

-- Add index on downloadTokenExpiresAt for faster expiration checks
CREATE INDEX "Facture_downloadTokenExpiresAt_idx" ON "Facture"("downloadTokenExpiresAt");
