import { Paiement } from '../../entities/paiement.entity';

export const PAIEMENT_REPOSITORY = 'PAIEMENT_REPOSITORY';

export interface PaiementRepository {
  create(
    data: Omit<Paiement, 'id' | 'createdAt'>,
  ): Promise<Paiement>;
}
