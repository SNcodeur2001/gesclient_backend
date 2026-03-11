/**
 * Setup E2E Tests
 *
 * Ce fichier s'exécute avant les tests E2E.
 * Laissez l'application utiliser sa propre configuration Prisma.
 */

export async function setupE2E() {
  console.log('🧪 Démarrage des tests E2E...');
}

export async function teardownE2E() {
  console.log('🧹 Nettoyage final des tests E2E...');
}
