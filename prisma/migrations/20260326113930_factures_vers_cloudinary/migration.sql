/*
  Warnings:

  - You are about to drop the column `telephone` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Facture" ADD COLUMN     "cloudinaryPublicId" TEXT,
ADD COLUMN     "fichierUrl" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "telephone";
