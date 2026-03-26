import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { FactureRepository } from '../../domain/ports/repositories/facture.repository';
import { FACTURE_REPOSITORY } from '../../domain/ports/repositories/facture.repository';
import { WhatsAppService } from '../../infrastructure/services/whatsapp.service';
import { FileStorageService } from '../../infrastructure/services/file-storage.service';
import { CloudinaryStorageService } from '../../infrastructure/services/cloudinary-storage.service';
import { FactureStatut } from '../../domain/enums/facture-statut.enum';
import { FactureType } from '../../domain/enums/facture-type.enum';

// Durée de validité du token de téléchargement (7 jours)
const DOWNLOAD_TOKEN_EXPIRY_DAYS = 7;

@Injectable()
export class SendFactureWhatsAppUseCase {
  constructor(
    @Inject(FACTURE_REPOSITORY)
    private readonly factureRepository: FactureRepository,
    private readonly whatsAppService: WhatsAppService,
    private readonly fileStorage: FileStorageService,
    private readonly cloudinaryStorage: CloudinaryStorageService,
  ) {}

  async execute(
    factureId: string,
  ): Promise<{ success: boolean; message: string; waLink?: string }> {
    const facture = await this.factureRepository.findById(factureId);
    if (!facture) {
      throw new NotFoundException('Facture introuvable');
    }

    // Get client phone number from commande
    const commande = (facture as any).commande;
    const client = commande?.acheteur;

    if (!client?.telephone) {
      throw new BadRequestException(
        'Numéro de téléphone du client non disponible',
      );
    }

    let pdfBuffer: Buffer | null = null;
    if (
      facture.cloudinaryPublicId &&
      process.env.STORAGE_PROVIDER === 'cloudinary' &&
      this.cloudinaryStorage.isEnabled()
    ) {
      pdfBuffer = await this.cloudinaryStorage.downloadPdf(
        facture.cloudinaryPublicId,
      );
    } else if (facture.fichierPath) {
      pdfBuffer = await this.fileStorage.readFile(facture.fichierPath);
    }

    if (!pdfBuffer) {
      throw new BadRequestException('PDF non disponible pour cette facture');
    }

    // Generate one-time download token
    const downloadToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DOWNLOAD_TOKEN_EXPIRY_DAYS);

    // Get base URL from environment
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const downloadLink = `${baseUrl}/api/v1/factures/${factureId}/pdf?token=${downloadToken}`;

    // Update facture with download token
    await this.factureRepository.update(factureId, {
      downloadToken,
      downloadTokenExpiresAt: expiresAt,
    });

    // Generate WhatsApp message with download link
    const isProforma = facture.type === FactureType.PROFORMA;
    const message = this.whatsAppService.generateFactureMessage(
      client.prenom || client.nom,
      facture.numero,
      facture.montantTTC,
      downloadLink,
    );

    // Send WhatsApp message (returns wa.me link)
    const result = await this.whatsAppService.sendPdf(
      client.telephone,
      pdfBuffer,
      `${facture.numero}.pdf`,
      message,
    );

    if (result.success) {
      // Update facture status
      await this.factureRepository.update(factureId, {
        envoyeeWhatsApp: true,
        dateEnvoiWhatsApp: new Date(),
        telephoneEnvoye: client.telephone,
        statut: FactureStatut.ENVOYEE,
      });
    }

    return {
      success: result.success,
      message: result.success
        ? 'Lien WhatsApp généré. Le commercial peut cliquer pour envoyer la facture.'
        : result.error || 'Erreur lors de la génération du lien',
      waLink: result.waLink,
    };
  }
}
