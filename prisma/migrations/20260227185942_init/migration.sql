-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DIRECTEUR', 'COMMERCIAL', 'COLLECTEUR');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('APPORTEUR', 'ACHETEUR');

-- CreateEnum
CREATE TYPE "ClientStatut" AS ENUM ('ACTIF', 'PROSPECT', 'INACTIF');

-- CreateEnum
CREATE TYPE "CommandeType" AS ENUM ('SUR_PLACE', 'A_DISTANCE');

-- CreateEnum
CREATE TYPE "CommandeStatut" AS ENUM ('EN_ATTENTE_ACOMPTE', 'EN_PREPARATION', 'PRETE', 'FINALISEE');

-- CreateEnum
CREATE TYPE "PaiementType" AS ENUM ('ACOMPTE', 'SOLDE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NOUVELLE_COLLECTE', 'ACOMPTE_RECU', 'COMMANDE_PRETE', 'COMMANDE_FINALISEE', 'IMPORT_TERMINE', 'COMMANDE_EN_ATTENTE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "ImportStatut" AS ENUM ('EN_COURS', 'TERMINE', 'ERREUR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "type" "ClientType" NOT NULL,
    "statut" "ClientStatut" NOT NULL DEFAULT 'PROSPECT',
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "assignedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collecte" (
    "id" TEXT NOT NULL,
    "apporteurId" TEXT NOT NULL,
    "quantiteKg" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "montantTotal" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "collecteurId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collecte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commande" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "CommandeType" NOT NULL,
    "statut" "CommandeStatut" NOT NULL DEFAULT 'EN_ATTENTE_ACOMPTE',
    "acheteurId" TEXT NOT NULL,
    "produit" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "acompteMinimum" DOUBLE PRECISION,
    "acompteVerse" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "soldeRestant" DOUBLE PRECISION NOT NULL,
    "commercialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "commandeId" TEXT NOT NULL,
    "type" "PaiementType" NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "modePaiement" "ModePaiement" NOT NULL,
    "valideParId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Import" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "validRows" INTEGER NOT NULL,
    "invalidRows" INTEGER NOT NULL,
    "errors" JSONB,
    "statut" "ImportStatut" NOT NULL DEFAULT 'EN_COURS',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "lien" TEXT,
    "clientId" TEXT,
    "commandeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "ancienneValeur" JSONB,
    "nouvelleValeur" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Commande_reference_key" ON "Commande"("reference");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collecte" ADD CONSTRAINT "Collecte_apporteurId_fkey" FOREIGN KEY ("apporteurId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collecte" ADD CONSTRAINT "Collecte_collecteurId_fkey" FOREIGN KEY ("collecteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_acheteurId_fkey" FOREIGN KEY ("acheteurId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_commercialId_fkey" FOREIGN KEY ("commercialId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Import" ADD CONSTRAINT "Import_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
