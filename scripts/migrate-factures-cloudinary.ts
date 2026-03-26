import 'dotenv/config';
import { promises as fs } from 'fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PdfGeneratorService, FactureData } from '../src/infrastructure/services/pdf-generator.service';
import { CloudinaryStorageService } from '../src/infrastructure/services/cloudinary-storage.service';

type MigrationResult = {
  factureId: string;
  numero: string;
  status: 'uploaded' | 'regenerated' | 'failed';
  reason?: string;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL manquant. Vérifie le .env avant la migration.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

const buildFactureData = (facture: any, commande: any): FactureData => {
  const acheteur = commande?.acheteur;
  const commercial = commande?.commercial;
  return {
    numero: facture.numero,
    type: facture.type,
    date: new Date(facture.createdAt),
    client: {
      nom: acheteur?.nom || '',
      prenom: acheteur?.prenom,
      email: acheteur?.email,
      telephone: acheteur?.telephone,
      adresse: acheteur?.adresse,
    },
    produit: commande?.produit,
    quantite: commande?.quantite,
    prixUnitaire: commande?.prixUnitaire,
    items: commande?.items?.length
      ? commande.items.map((i: any) => ({
          produit: i.produit,
          quantite: i.quantite,
          prixUnitaire: i.prixUnitaire,
        }))
      : undefined,
    montantHT: commande?.montantHT ?? facture.montantHT,
    tva: commande?.tva ?? facture.tva,
    montantTTC: commande?.montantTTC ?? facture.montantTTC,
    acomteVerse: commande?.acompteVerse,
    soldeRestant: commande?.soldeRestant,
    commercial: {
      nom: commercial?.nom || '',
      prenom: commercial?.prenom || '',
    },
  };
};

const main = async () => {
  const cloudinary = new CloudinaryStorageService();
  if (!cloudinary.isEnabled()) {
    throw new Error('Cloudinary non configuré. Vérifie les variables d’environnement.');
  }

  const pdfGenerator = new PdfGeneratorService();
  const results: MigrationResult[] = [];

  const factures = await prisma.facture.findMany({
    where: {
      cloudinaryPublicId: null,
    },
    include: {
      commande: {
        include: {
          acheteur: true,
          commercial: true,
          items: true,
        },
      },
    },
  });

  console.log(`Factures à migrer: ${factures.length}`);

  for (const facture of factures) {
    const filename = `${facture.numero}.pdf`;
    try {
      let buffer: Buffer | null = null;
      let status: MigrationResult['status'] = 'uploaded';

      if (facture.fichierPath && (await fileExists(facture.fichierPath))) {
        buffer = await fs.readFile(facture.fichierPath);
      } else {
        const commande = facture.commande;
        if (!commande) {
          throw new Error('Commande manquante pour régénération');
        }
        const factureData = buildFactureData(facture, commande);
        buffer = await pdfGenerator.generateFacture(factureData);
        status = 'regenerated';
      }

      const uploaded = await cloudinary.uploadPdf(buffer, filename);
      await prisma.facture.update({
        where: { id: facture.id },
        data: {
          fichierUrl: uploaded.url,
          cloudinaryPublicId: uploaded.publicId,
        },
      });

      results.push({
        factureId: facture.id,
        numero: facture.numero,
        status,
      });
      console.log(`✔ ${facture.numero} -> ${uploaded.publicId}`);
    } catch (error: any) {
      results.push({
        factureId: facture.id,
        numero: facture.numero,
        status: 'failed',
        reason: error?.message || String(error),
      });
      console.error(`✖ ${facture.numero}: ${error?.message || error}`);
    }
  }

  const reportPath = `scripts/migrate-factures-report-${Date.now()}.json`;
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2), 'utf-8');

  const failed = results.filter((r) => r.status === 'failed').length;
  console.log(`Migration terminée. OK: ${results.length - failed}, Échecs: ${failed}`);
  console.log(`Rapport: ${reportPath}`);
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
