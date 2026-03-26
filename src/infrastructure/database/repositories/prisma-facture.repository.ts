import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { FactureRepository } from '../../../domain/ports/repositories/facture.repository';
import { Facture } from '../../../domain/entities/facture.entity';
import type { FactureType } from '../../../domain/enums/facture-type.enum';
import type { FactureStatut } from '../../../domain/enums/facture-statut.enum';

@Injectable()
export class PrismaFactureRepository implements FactureRepository {
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

  async create(data: Partial<Facture>): Promise<Facture> {
    const raw = await this.withRetry('createFacture', () =>
      this.prisma.facture.create({
        data: {
          numero: data.numero!,
          type: data.type as any,
          commandeId: data.commandeId!,
          montantHT: data.montantHT!,
          tva: data.tva!,
          montantTTC: data.montantTTC!,
          fichierPath: data.fichierPath,
          fichierUrl: data.fichierUrl,
          cloudinaryPublicId: data.cloudinaryPublicId,
          statut: (data.statut as any) || 'GENEREE',
          envoyeeWhatsApp: data.envoyeeWhatsApp || false,
          dateEnvoiWhatsApp: data.dateEnvoiWhatsApp,
          telephoneEnvoye: data.telephoneEnvoye,
          genereParId: data.genereParId!,
        },
      }),
    );
    return this.toDomain(raw);
  }

  async findById(id: string): Promise<Facture | null> {
    const raw = await this.withRetry('findFactureById', () =>
      this.prisma.facture.findUnique({
        where: { id },
        include: {
          commande: {
            include: {
              acheteur: true,
              commercial: true,
            },
          },
          generePar: true,
        },
      }),
    );
    return raw ? this.toDomain(raw) : null;
  }

  async findByCommandeId(commandeId: string): Promise<Facture[]> {
    const raws = await this.withRetry('findFacturesByCommandeId', () =>
      this.prisma.facture.findMany({
        where: { commandeId },
        include: {
          commande: {
            include: {
              acheteur: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
    return raws.map((r) => this.toDomain(r));
  }

  async findByType(
    commandeId: string,
    type: FactureType,
  ): Promise<Facture | null> {
    const raw = await this.withRetry('findFactureByType', () =>
      this.prisma.facture.findFirst({
        where: {
          commandeId,
          type: type as any,
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
    return raw ? this.toDomain(raw) : null;
  }

  async update(id: string, data: Partial<Facture>): Promise<Facture> {
    const updateData: any = {};
    if (data.fichierPath !== undefined) {
      updateData.fichierPath = data.fichierPath;
    }
    if (data.fichierUrl !== undefined) {
      updateData.fichierUrl = data.fichierUrl;
    }
    if (data.cloudinaryPublicId !== undefined) {
      updateData.cloudinaryPublicId = data.cloudinaryPublicId;
    }
    if (data.statut) {
      updateData.statut = data.statut as any;
    }
    if (data.envoyeeWhatsApp !== undefined) {
      updateData.envoyeeWhatsApp = data.envoyeeWhatsApp;
    }
    if (data.dateEnvoiWhatsApp) {
      updateData.dateEnvoiWhatsApp = data.dateEnvoiWhatsApp;
    }
    if (data.telephoneEnvoye) {
      updateData.telephoneEnvoye = data.telephoneEnvoye;
    }
    if (data.downloadToken !== undefined) {
      updateData.downloadToken = data.downloadToken;
    }
    if (data.downloadTokenExpiresAt !== undefined) {
      updateData.downloadTokenExpiresAt = data.downloadTokenExpiresAt;
    }

    const raw = await this.withRetry('updateFacture', () =>
      this.prisma.facture.update({
        where: { id },
        data: updateData,
      }),
    );
    return this.toDomain(raw);
  }

  async updateStatut(id: string, statut: FactureStatut): Promise<Facture> {
    const raw = await this.withRetry('updateFactureStatut', () =>
      this.prisma.facture.update({
        where: { id },
        data: { statut: statut as any },
      }),
    );
    return this.toDomain(raw);
  }

  async findAll(
    page: number,
    limit: number,
    type?: FactureType,
    search?: string,
  ): Promise<{ data: Facture[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type) where.type = type as any;
    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { commande: { reference: { contains: search, mode: 'insensitive' } } },
        {
          commande: {
            acheteur: { nom: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          commande: {
            acheteur: { prenom: { contains: search, mode: 'insensitive' } },
          },
        },
        {
          commande: {
            acheteur: { email: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }
    const [data, total] = await Promise.all([
      this.withRetry('findManyFactures', () =>
        this.prisma.facture.findMany({
          skip,
          take: limit,
          where,
          include: {
            commande: {
              include: {
                acheteur: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ),
      this.withRetry('countFactures', () =>
        this.prisma.facture.count({ where }),
      ),
    ]);
    return {
      data: data.map((d) => this.toDomain(d)),
      total,
    };
  }

  private toDomain(raw: any): Facture {
    const facture = new Facture();
    facture.id = raw.id;
    facture.numero = raw.numero;
    facture.type = raw.type;
    facture.commandeId = raw.commandeId;
    facture.montantHT = raw.montantHT;
    facture.tva = raw.tva;
    facture.montantTTC = raw.montantTTC;
    facture.fichierPath = raw.fichierPath;
    facture.fichierUrl = raw.fichierUrl;
    facture.cloudinaryPublicId = raw.cloudinaryPublicId;
    facture.statut = raw.statut;
    facture.envoyeeWhatsApp = raw.envoyeeWhatsApp;
    facture.dateEnvoiWhatsApp = raw.dateEnvoiWhatsApp;
    facture.telephoneEnvoye = raw.telephoneEnvoye;
    facture.downloadToken = raw.downloadToken;
    facture.downloadTokenExpiresAt = raw.downloadTokenExpiresAt;
    facture.genereParId = raw.genereParId;
    facture.createdAt = raw.createdAt;
    facture.updatedAt = raw.updatedAt;
    // Add relations
    (facture as any).commande = raw.commande;
    (facture as any).generePar = raw.generePar;
    return facture;
  }

  async findByDownloadToken(token: string): Promise<Facture | null> {
    const raw = await this.withRetry('findFactureByDownloadToken', () =>
      this.prisma.facture.findFirst({
        where: {
          downloadToken: token,
          downloadTokenExpiresAt: {
            gt: new Date(), // Token must not be expired
          },
        },
        include: {
          commande: {
            include: {
              acheteur: true,
            },
          },
        },
      }),
    );
    return raw ? this.toDomain(raw) : null;
  }
}
