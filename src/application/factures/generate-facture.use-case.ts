import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { FactureRepository } from '../../domain/ports/repositories/facture.repository';
import type { CommandeRepository } from '../../domain/ports/repositories/commande.repository';
import { FACTURE_REPOSITORY } from '../../domain/ports/repositories/facture.repository';
import { COMMANDE_REPOSITORY } from '../../domain/ports/repositories/commande.repository';
import {
  PdfGeneratorService,
  FactureData,
} from '../../infrastructure/services/pdf-generator.service';
import { FileStorageService } from '../../infrastructure/services/file-storage.service';
import { FactureType } from '../../domain/enums/facture-type.enum';

@Injectable()
export class GenerateFactureUseCase {
  constructor(
    @Inject(FACTURE_REPOSITORY)
    private readonly factureRepository: FactureRepository,
    @Inject(COMMANDE_REPOSITORY)
    private readonly commandeRepository: CommandeRepository,
    private readonly pdfGenerator: PdfGeneratorService,
    private readonly fileStorage: FileStorageService,
  ) {}

  async execute(params: {
    commandeId: string;
    type: FactureType;
    genereParId: string;
  }): Promise<{ facture: any; pdf: Buffer }> {
    // Get commande with related data
    const commande = await this.commandeRepository.findById(params.commandeId);
    if (!commande) {
      throw new Error('Commande introuvable');
    }

    // Get related entities from the commande object (they're added by the repository)
    const acheteur = (commande as any).acheteur;
    const commercial = (commande as any).commercial;

    // Check if proforma already exists for this commande
    if (params.type === FactureType.PROFORMA) {
      const existingProforma = await this.factureRepository.findByType(
        params.commandeId,
        FactureType.PROFORMA,
      );
      if (existingProforma) {
        // Regenerate PDF and update file path
        const pdf = await this.generatePdf(
          commande,
          existingProforma,
          params.type,
        );
        const filename = `${existingProforma.numero}.pdf`;
        const fichierPath = await this.fileStorage.saveFile(pdf, filename);
        await this.factureRepository.update(existingProforma.id, {
          fichierPath,
        });
        return {
          facture: { ...existingProforma, fichierPath },
          pdf,
        };
      }
    }

    // Generate unique invoice number
    const numero = await this.generateFactureNumber(params.type);

    // Create invoice data
    const factureData: FactureData = {
      numero,
      type: params.type,
      date: new Date(),
      client: {
        nom: acheteur?.nom || '',
        prenom: acheteur?.prenom,
        email: acheteur?.email,
        telephone: acheteur?.telephone,
        adresse: acheteur?.adresse,
      },
      produit: commande.produit,
      quantite: commande.quantite,
      prixUnitaire: commande.prixUnitaire,
      montantHT: commande.montantHT,
      tva: commande.tva,
      montantTTC: commande.montantTTC,
      acomteVerse: commande.acompteVerse,
      soldeRestant: commande.soldeRestant,
      commercial: {
        nom: commercial?.nom || '',
        prenom: commercial?.prenom || '',
      },
    };

    // Generate PDF
    const pdf = await this.pdfGenerator.generateFacture(factureData);

    // Save PDF to disk instead of database
    const filename = `${numero}.pdf`;
    const fichierPath = await this.fileStorage.saveFile(pdf, filename);

    // Create facture in database (without blob)
    const facture = await this.factureRepository.create({
      numero,
      type: params.type,
      commandeId: params.commandeId,
      montantHT: commande.montantHT,
      tva: commande.tva,
      montantTTC: commande.montantTTC,
      fichierPath,
      genereParId: params.genereParId,
    });

    return { facture, pdf };
  }

  private async generateFactureNumber(type: FactureType): Promise<string> {
    const prefix = type === FactureType.PROFORMA ? 'PROF' : 'FAC';
    const year = new Date().getFullYear();
    // Use UUID for uniqueness instead of timestamp
    const uniquePart = randomUUID().substring(0, 8).toUpperCase();
    return `${prefix}-${year}-${uniquePart}`;
  }

  private async generatePdf(
    commande: any,
    facture: any,
    type: FactureType,
  ): Promise<Buffer> {
    const acheteur = commande.acheteur;
    const commercial = commande.commercial;

    const factureData: FactureData = {
      numero: facture.numero,
      type,
      date: new Date(facture.createdAt),
      client: {
        nom: acheteur?.nom || '',
        prenom: acheteur?.prenom,
        email: acheteur?.email,
        telephone: acheteur?.telephone,
        adresse: acheteur?.adresse,
      },
      produit: commande.produit,
      quantite: commande.quantite,
      prixUnitaire: commande.prixUnitaire,
      montantHT: commande.montantHT,
      tva: commande.tva,
      montantTTC: commande.montantTTC,
      acomteVerse: commande.acompteVerse,
      soldeRestant: commande.soldeRestant,
      commercial: {
        nom: commercial?.nom || '',
        prenom: commercial?.prenom || '',
      },
    };
    return this.pdfGenerator.generateFacture(factureData);
  }
}
