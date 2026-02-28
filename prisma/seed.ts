import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('Test1234!', 10);

  await prisma.user.upsert({
    where: { email: 'directeur@proplast.com' },
    update: {},
    create: {
      nom: 'Diallo',
      prenom: 'Mamadou',
      email: 'directeur@proplast.com',
      password,
      role: 'DIRECTEUR',
    },
  });

  await prisma.user.upsert({
    where: { email: 'commercial@proplast.com' },
    update: {},
    create: {
      nom: 'Martin',
      prenom: 'Sarah',
      email: 'commercial@proplast.com',
      password,
      role: 'COMMERCIAL',
    },
  });

  await prisma.user.upsert({
    where: { email: 'collecteur@proplast.com' },
    update: {},
    create: {
      nom: 'Sow',
      prenom: 'Ibrahim',
      email: 'collecteur@proplast.com',
      password,
      role: 'COLLECTEUR',
    },
  });

  console.log('✅ Seed terminé — 3 utilisateurs créés');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());