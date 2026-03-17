import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { PdfGeneratorService } from '../src/infrastructure/services/pdf-generator.service';
import { FileStorageService } from '../src/infrastructure/services/file-storage.service';
import { FactureType } from '../src/domain/enums/facture-type.enum';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const prisma = app.get(PrismaService);
  const pdfGenerator = app.get(PdfGeneratorService);
  const fileStorage = app.get(FileStorageService);

  const factures = await prisma.facture.findMany({
    include: {
      commande: {
        include: {
          acheteur: true,
          commercial: true,
          items: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  let ok = 0;
  let failed = 0;

  for (const f of factures) {
    try {
      const commande = f.commande;
      const acheteur = commande?.acheteur;
      const commercial = commande?.commercial;

      const factureData = {
        numero: f.numero,
        type: f.type as FactureType,
        date: new Date(f.createdAt),
        client: {
          nom: acheteur?.nom || '',
          prenom: acheteur?.prenom || undefined,
          email: acheteur?.email || undefined,
          telephone: acheteur?.telephone || undefined,
          adresse: acheteur?.adresse || undefined,
        },
        produit: commande?.produit || '—',
        quantite: commande?.quantite || 0,
        prixUnitaire: commande?.prixUnitaire || 0,
        items: commande?.items?.length
          ? commande.items.map((i) => ({
              produit: i.produit,
              quantite: i.quantite,
              prixUnitaire: i.prixUnitaire,
            }))
          : undefined,
        montantHT: f.montantHT,
        tva: f.tva,
        montantTTC: f.montantTTC,
        acomteVerse: commande?.acompteVerse || 0,
        soldeRestant: commande?.soldeRestant || 0,
        commercial: {
          nom: commercial?.nom || '',
          prenom: commercial?.prenom || '',
        },
      };

      const pdf = await pdfGenerator.generateFacture(factureData);
      const filename = `${f.numero}.pdf`;
      const fichierPath = await fileStorage.saveFile(pdf, filename);

      await prisma.facture.update({
        where: { id: f.id },
        data: { fichierPath },
      });

      ok += 1;
      // eslint-disable-next-line no-console
      console.log(`✅ ${f.numero} → ${fichierPath}`);
    } catch (err) {
      failed += 1;
      // eslint-disable-next-line no-console
      console.error(`❌ ${f.numero}`, err);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Terminé. OK: ${ok} | Échecs: ${failed}`);

  await app.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
