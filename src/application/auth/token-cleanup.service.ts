import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/repositories/refresh-token.repository';
import type { RefreshTokenRepository } from '../../domain/ports/repositories/refresh-token.repository';

/**
 * Service de nettoyage des tokens expirés.
 * 
 * Ce service gère deux types de nettoyage :
 * 1. Au démarrage du serveur (onModuleInit) - nettoyage immédiat
 * 2. Chaque jour à minuit (@Cron) - nettoyage programmé
 * 
 * Cela garantit que les tokens expirés sont supprimés même si le serveur
 * a été arrêté pendant une période prolongée.
 */
@Injectable()
export class TokenCleanupService implements OnModuleInit {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  /**
   * S'exécute automatiquement au démarrage du module.
   * Supprime tous les tokens qui ont expiré pendant l'arrêt du serveur.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('🔄 Nettoyage des tokens expirés au démarrage...');
    
    try {
      const deletedCount = await this.refreshTokenRepo.deleteExpired();
      this.logger.log(`✅ ${deletedCount} token(s) expiré(s) supprimé(s) au démarrage`);
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage au démarrage', error);
    }
  }

  /**
   * S'exécute automatiquement chaque jour à minuit.
   * Supprime les tokens qui ont expiré depuis le dernier nettoyage.
   * 
   * Note: Ce nettoyage ne s'exécute que si le serveur est allumé.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    this.logger.log('🧹 Nettoyage programmé des tokens expirés...');
    
    try {
      const deletedCount = await this.refreshTokenRepo.deleteExpired();
      this.logger.log(`✅ ${deletedCount} token(s) expiré(s) supprimé(s) par le cron`);
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage programmé', error);
    }
  }
}
