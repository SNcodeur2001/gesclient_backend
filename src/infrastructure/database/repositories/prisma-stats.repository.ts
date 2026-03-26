import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StatsRepository } from '../../../domain/ports/repositories/stats.repository';
import { CommandeStatut } from '../../../domain/enums/commande-statut.enum';
import { ClientType } from '../../../domain/enums/client-type.enum';

@Injectable()
export class PrismaStatsRepository implements StatsRepository {
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

  async getDashboard(): Promise<{
    collecte: {
      tonnageMois: number;
      montantMois: number;
      variationMois: string;
    };
    commercial: {
      chiffreAffairesMois: number;
      commandesEnCours: number;
      enAttenteAcompte: number;
      variationMois: string;
    };
    clients: {
      totalApporteurs: number;
      totalAcheteurs: number;
      nouveauxCeMois: number;
    };
    topApporteurs: {
      id: string;
      nom: string;
      tonnage: number;
      montant: number;
    }[];
    topAcheteurs: {
      id: string;
      nom: string;
      chiffreAffaires: number;
    }[];
    evolutionCollecte: { mois: string; tonnage: number }[];
    evolutionCA: { mois: string; montant: number }[];
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Execute queries in small batches to reduce connection spikes
    const [
      currentMonthCollecte,
      lastMonthCollecte,
      currentMonthCommandes,
      lastMonthCommandes,
    ] = await Promise.all([
      this.withRetry('currentMonthCollecte', () =>
        this.prisma.collecte.aggregate({
          where: { createdAt: { gte: startOfMonth } },
          _sum: { quantiteKg: true, montantTotal: true },
        }),
      ),
      this.withRetry('lastMonthCollecte', () =>
        this.prisma.collecte.aggregate({
          where: {
            createdAt: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
          _sum: { quantiteKg: true, montantTotal: true },
        }),
      ),
      this.withRetry('currentMonthCommandes', () =>
        this.prisma.commande.aggregate({
          where: { createdAt: { gte: startOfMonth } },
          _sum: { montantTTC: true },
        }),
      ),
      this.withRetry('lastMonthCommandes', () =>
        this.prisma.commande.aggregate({
          where: {
            createdAt: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
          _sum: { montantTTC: true },
        }),
      ),
    ]);

    const [
      commandesEnCours,
      enAttenteAcompte,
      totalApporteurs,
      totalAcheteurs,
      nouveauxClients,
      topApporteursRaw,
      topAcheteursRaw,
    ] = await Promise.all([
      this.withRetry('commandesEnCours', () =>
        this.prisma.commande.count({
          where: {
            statut: {
              in: [CommandeStatut.EN_PREPARATION, CommandeStatut.PRETE],
            },
          },
        }),
      ),
      this.withRetry('enAttenteAcompte', () =>
        this.prisma.commande.count({
          where: { statut: CommandeStatut.EN_PREPARATION },
        }),
      ),
      this.withRetry('totalApporteurs', () =>
        this.prisma.client.count({
          where: { type: ClientType.APPORTEUR, deletedAt: null },
        }),
      ),
      this.withRetry('totalAcheteurs', () =>
        this.prisma.client.count({
          where: { type: ClientType.ACHETEUR, deletedAt: null },
        }),
      ),
      this.withRetry('nouveauxClients', () =>
        this.prisma.client.count({
          where: {
            createdAt: { gte: startOfMonth },
            deletedAt: null,
          },
        }),
      ),
      this.withRetry('topApporteurs', () =>
        this.prisma.collecte.groupBy({
          by: ['apporteurId'],
          _sum: { quantiteKg: true, montantTotal: true },
          orderBy: { _sum: { montantTotal: 'desc' } },
          take: 5,
        }),
      ),
      this.withRetry('topAcheteurs', () =>
        this.prisma.commande.groupBy({
          by: ['acheteurId'],
          _sum: { montantTTC: true },
          orderBy: { _sum: { montantTTC: 'desc' } },
          take: 5,
        }),
      ),
    ]);

    const [evolutionCollecteRaw, evolutionCA] = await Promise.all([
      this.withRetry('evolutionCollecte', () =>
        this.prisma.collecte.findMany({
          where: {
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            },
          },
          select: { createdAt: true, quantiteKg: true },
        }),
      ),
      this.withRetry('evolutionCA', () =>
        this.prisma.commande.findMany({
          where: {
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
            },
          },
          select: { createdAt: true, montantTTC: true },
        }),
      ),
    ]);

    // Calculate variations
    const calculateVariation = (current: number, last: number): string => {
      if (last === 0) return current > 0 ? '+100%' : '0%';
      const diff = ((current - last) / last) * 100;
      return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
    };

    // Get client names for top lists
    const apporteurIds = topApporteursRaw.map((r) => r.apporteurId);
    const acheteurIds = topAcheteursRaw.map((r) => r.acheteurId);
    const allClientIds = [...new Set([...apporteurIds, ...acheteurIds])];

    const clients = await this.prisma.client.findMany({
      where: { id: { in: allClientIds } },
      select: { id: true, nom: true, type: true },
    });

    const clientMap = new Map(clients.map((c) => [c.id, c]));

    // Process evolution data
    const monthlyCollecteMap = new Map<string, number>();
    const monthlyCAMap = new Map<string, number>();

    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyCollecteMap.set(monthKey, 0);
      monthlyCAMap.set(monthKey, 0);
    }

    for (const c of evolutionCollecteRaw) {
      const monthKey = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyCollecteMap.get(monthKey) || 0;
      monthlyCollecteMap.set(monthKey, current + (c.quantiteKg || 0));
    }

    for (const c of evolutionCA) {
      const monthKey = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyCAMap.get(monthKey) || 0;
      monthlyCAMap.set(monthKey, current + c.montantTTC);
    }

    return {
      collecte: {
        tonnageMois: currentMonthCollecte._sum.quantiteKg || 0,
        montantMois: currentMonthCollecte._sum.montantTotal || 0,
        variationMois: calculateVariation(
          currentMonthCollecte._sum.quantiteKg || 0,
          lastMonthCollecte._sum.quantiteKg || 0,
        ),
      },
      commercial: {
        chiffreAffairesMois: currentMonthCommandes._sum.montantTTC || 0,
        commandesEnCours,
        enAttenteAcompte,
        variationMois: calculateVariation(
          currentMonthCommandes._sum.montantTTC || 0,
          lastMonthCommandes._sum.montantTTC || 0,
        ),
      },
      clients: {
        totalApporteurs,
        totalAcheteurs,
        nouveauxCeMois: nouveauxClients,
      },
      topApporteurs: topApporteursRaw.map((r) => {
        const client = clientMap.get(r.apporteurId);
        return {
          id: r.apporteurId,
          nom: client?.nom || 'Inconnu',
          tonnage: r._sum.quantiteKg || 0,
          montant: r._sum.montantTotal || 0,
        };
      }),
      topAcheteurs: topAcheteursRaw.map((r) => {
        const client = clientMap.get(r.acheteurId);
        return {
          id: r.acheteurId,
          nom: client?.nom || 'Inconnu',
          chiffreAffaires: r._sum.montantTTC || 0,
        };
      }),
      evolutionCollecte: Array.from(monthlyCollecteMap.entries())
        .map(([mois, tonnage]) => ({ mois, tonnage }))
        .sort((a, b) => a.mois.localeCompare(b.mois)),
      evolutionCA: Array.from(monthlyCAMap.entries())
        .map(([mois, montant]) => ({ mois, montant }))
        .sort((a, b) => a.mois.localeCompare(b.mois)),
    };
  }
}
