import { Injectable, Inject } from '@nestjs/common';
import type { FactureRepository } from '../../domain/ports/repositories/facture.repository';
import { FACTURE_REPOSITORY } from '../../domain/ports/repositories/facture.repository';
import { FactureStatut } from '../../domain/enums/facture-statut.enum';
import { FileStorageService } from '../../infrastructure/services/file-storage.service';
import { CloudinaryStorageService } from '../../infrastructure/services/cloudinary-storage.service';

@Injectable()
export class GetFacturePdfUseCase {
  constructor(
    @Inject(FACTURE_REPOSITORY)
    private readonly factureRepository: FactureRepository,
    private readonly fileStorage: FileStorageService,
    private readonly cloudinaryStorage: CloudinaryStorageService,
  ) {}

  async execute(
    factureId: string,
    options?: { token?: string; userId?: string },
  ): Promise<{ facture: any; pdf: Buffer }> {
    let facture;

    // If token provided, use token-based access (for external clients)
    if (options?.token) {
      facture = await this.factureRepository.findByDownloadToken(options.token);
      if (!facture) {
        throw new Error('Lien de téléchargement invalide ou expiré');
      }
      if (facture.id !== factureId) {
        throw new Error('Lien de téléchargement invalide');
      }
    } else {
      // Use authenticated access (for internal users)
      if (!options?.userId) {
        throw new Error('Authentification requise');
      }
      facture = await this.factureRepository.findById(factureId);
      if (!facture) {
        throw new Error('Facture introuvable');
      }
    }

    let pdf: Buffer | null = null;
    if (
      facture.cloudinaryPublicId &&
      process.env.STORAGE_PROVIDER === 'cloudinary' &&
      this.cloudinaryStorage.isEnabled()
    ) {
      pdf = await this.cloudinaryStorage.downloadPdf(facture.cloudinaryPublicId);
    } else if (facture.fichierPath) {
      pdf = await this.fileStorage.readFile(facture.fichierPath);
    }

    if (!pdf) {
      throw new Error('PDF non disponible pour cette facture');
    }

    // Invalidate token after one-time use (if token was used)
    if (options?.token) {
      await this.factureRepository.update(factureId, {
        downloadToken: '',
        downloadTokenExpiresAt: new Date(0), // Set to epoch to mark as expired
        statut: FactureStatut.TELECHARGE,
      });
    }

    return {
      facture,
      pdf,
    };
  }
}
