import { Facture } from '../../entities/facture.entity';
import { FactureType } from '../../enums/facture-type.enum';

export const FACTURE_REPOSITORY = 'FACTURE_REPOSITORY';

export interface FactureRepository {
  create(facture: Partial<Facture>): Promise<Facture>;
  findById(id: string): Promise<Facture | null>;
  findByCommandeId(commandeId: string): Promise<Facture[]>;
  findByType(commandeId: string, type: FactureType): Promise<Facture | null>;
  update(id: string, data: Partial<Facture>): Promise<Facture>;
  updateStatut(id: string, statut: string): Promise<Facture>;
  findAll(
    page: number,
    limit: number,
  ): Promise<{ data: Facture[]; total: number }>;
  findByDownloadToken(token: string): Promise<Facture | null>;
}
