import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit {
  public readonly prisma: PrismaClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter }) as PrismaClient;
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // Expose commonly used methods
  get user() {
    return this.prisma.user;
  }

  get client() {
    return this.prisma.client;
  }

  get collecte() {
    return this.prisma.collecte;
  }

  get commande() {
    return this.prisma.commande;
  }

  get paiement() {
    return this.prisma.paiement;
  }

  get notification() {
    return this.prisma.notification;
  }

  get auditLog() {
    return this.prisma.auditLog;
  }

  get import() {
    return this.prisma.import;
  }
}
