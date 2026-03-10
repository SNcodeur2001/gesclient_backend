-- CreateEnum
CREATE TYPE "FactureType" AS ENUM ('PROFORMA', 'DEFINITIVE');

-- CreateEnum
CREATE TYPE "FactureStatut" AS ENUM ('GENEREE', 'ENVOYEE', 'TELECHARGE');

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" "FactureType" NOT NULL,
    "commandeId" TEXT NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "tva" DOUBLE PRECISION NOT NULL,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "fichierBlob" BYTEA,
    "fichierPath" TEXT,
    "statut" "FactureStatut" NOT NULL DEFAULT 'GENEREE',
    "envoyeeWhatsApp" BOOLEAN NOT NULL DEFAULT false,
    "dateEnvoiWhatsApp" TIMESTAMP(3),
    "genereParId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Facture_numero_key" ON "Facture"("numero");

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_genereParId_fkey" FOREIGN KEY ("genereParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
