-- DropIndex
DROP INDEX "Facture_downloadTokenExpiresAt_idx";

-- DropIndex
DROP INDEX "Facture_downloadToken_idx";

-- AlterTable
ALTER TABLE "Collecte" ALTER COLUMN "quantiteKg" DROP NOT NULL,
ALTER COLUMN "prixUnitaire" DROP NOT NULL,
ALTER COLUMN "montantTotal" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Commande" ALTER COLUMN "produit" DROP NOT NULL,
ALTER COLUMN "quantite" DROP NOT NULL,
ALTER COLUMN "prixUnitaire" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CollecteItem" (
    "id" TEXT NOT NULL,
    "collecteId" TEXT NOT NULL,
    "typePlastique" TEXT NOT NULL,
    "quantiteKg" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollecteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandeItem" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "produit" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommandeItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CollecteItem" ADD CONSTRAINT "CollecteItem_collecteId_fkey" FOREIGN KEY ("collecteId") REFERENCES "Collecte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandeItem" ADD CONSTRAINT "CommandeItem_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE CASCADE ON UPDATE CASCADE;
