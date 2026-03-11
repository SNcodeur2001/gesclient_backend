import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import type { FactureRepository } from '../../../domain/ports/repositories/facture.repository';
import { Facture } from '../../../domain/entities/facture.entity';
import type { FactureType } from '../../../domain/enums/facture-type.enum';
import type { FactureStatut } from '../../../domain/enums/facture-statut.enum';

@Injectable()
export class PrismaFactureRepository implements FactureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<Facture>): Promise<Facture> {
    const raw = await this.prisma.facture.create({
      data: {
        numero: data.numero!,
        type: data.type as any,
        commandeId: data.commandeId!,
        montantHT: data.montantHT!,
        tva: data.tva!,
        montantTTC: data.montantTTC!,
        fichierPath: data.fichierPath,
        statut: (data.statut as any) || 'GENEREE',
        envoyeeWhatsApp: data.envoyeeWhatsApp || false,
        dateEnvoiWhatsApp: data.dateEnvoiWhatsApp,
        telephoneEnvoye: data.telephoneEnvoye,
        genereParId: data.genereParId!,
      },
    });
    return this.toDomain(raw);
  }

  async findById(id: string): Promise<Facture | null> {
    const raw = await this.prisma.facture.findUnique({
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
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findByCommandeId(commandeId: string): Promise<Facture[]> {
    const raws = await this.prisma.facture.findMany({
      where: { commandeId },
      include: {
        commande: {
          include: {
            acheteur: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return raws.map((r) => this.toDomain(r));
  }

  async findByType(
    commandeId: string,
    type: FactureType,
  ): Promise<Facture | null> {
    const raw = await this.prisma.facture.findFirst({
      where: {
        commandeId,
        type: type as any,
      },
      orderBy: { createdAt: 'desc' },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async update(id: string, data: Partial<Facture>): Promise<Facture> {
    const updateData: any = {};
    if (data.fichierPath) {
      updateData.fichierPath = data.fichierPath;
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
    if (data.downloadToken) {
      updateData.downloadToken = data.downloadToken;
    }
    if (data.downloadTokenExpiresAt) {
      updateData.downloadTokenExpiresAt = data.downloadTokenExpiresAt;
    }

    const raw = await this.prisma.facture.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(raw);
  }

  async updateStatut(id: string, statut: FactureStatut): Promise<Facture> {
    const raw = await this.prisma.facture.update({
      where: { id },
      data: { statut: statut as any },
    });
    return this.toDomain(raw);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: Facture[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.facture.findMany({
        skip,
        take: limit,
        include: {
          commande: {
            include: {
              acheteur: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.facture.count(),
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
    const raw = await this.prisma.facture.findFirst({
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
    });
    return raw ? this.toDomain(raw) : null;
  }
}
