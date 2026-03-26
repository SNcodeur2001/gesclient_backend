import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaiementRepository } from '../../../domain/ports/repositories/paiement.repository';
import { Paiement } from '../../../domain/entities/paiement.entity';
import { PaiementType } from '../../../domain/enums/paiement-type.enum';
import { ModePaiement } from '../../../domain/enums/mode-paiement.enum';

@Injectable()
export class PrismaPaiementRepository implements PaiementRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async withRetry<T>(
    label: string,
    fn: () => Promise<T>,
    attempts = 2,
  ): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (err?.code !== 'ETIMEDOUT' || i === attempts - 1) {
          throw err;
        }
        const delayMs = 200 + i * 200;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw lastError;
  }

  async create(data: Omit<Paiement, 'id' | 'createdAt'>): Promise<Paiement> {
    const raw = await this.withRetry('createPaiement', () =>
      this.prisma.paiement.create({ data }),
    );
    return this.toDomain(raw);
  }

  private toDomain(raw: any): Paiement {
    const paiement = new Paiement();
    paiement.id = raw.id;
    paiement.commandeId = raw.commandeId;
    paiement.type = raw.type as PaiementType;
    paiement.montant = raw.montant;
    paiement.modePaiement = raw.modePaiement as ModePaiement;
    paiement.valideParId = raw.valideParId;
    paiement.createdAt = raw.createdAt;
    return paiement;
  }
}
