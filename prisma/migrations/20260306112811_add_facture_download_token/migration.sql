-- AlterTable
ALTER TABLE "Facture" ADD COLUMN     "downloadToken" TEXT,
ADD COLUMN     "downloadTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "telephoneEnvoye" TEXT;
