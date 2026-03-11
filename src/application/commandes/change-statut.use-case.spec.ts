import { Test, TestingModule } from '@nestjs/testing';
import { ChangeStatutUseCase } from './change-statut.use-case';
import { COMMANDE_REPOSITORY } from '../../domain/ports/repositories/commande.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/ports/repositories/audit-log.repository';
import { NOTIFICATION_REPOSITORY } from '../../domain/ports/repositories/notification.repository';
import { USER_REPOSITORY } from '../../domain/ports/repositories/user.repository';
import { WhatsAppService } from '../../infrastructure/services/whatsapp.service';
import { ConfigService } from '@nestjs/config';
import { CommandeStatut } from '../../domain/enums/commande-statut.enum';
import { CommandeStatutInvalideException } from '../../domain/exceptions/commande-statut-invalide.exception';

/**
 * Tests d'Intégration - ChangeStatutUseCase
 */
describe('ChangeStatutUseCase', () => {
  let useCase: ChangeStatutUseCase;
  let commandeRepo: any;
  let auditRepo: any;

  const mockCommande = {
    id: 'cmd-1',
    reference: 'CMD-2026-0001',
    statut: CommandeStatut.EN_PREPARATION,
    montantTTC: 120000,
    acheteur: { nom: 'Diop', telephone: '+221771234567' },
    items: [{ produit: 'PEHD', quantite: 100, prixUnitaire: 300 }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeStatutUseCase,
        {
          provide: COMMANDE_REPOSITORY,
          useValue: { findById: jest.fn(), update: jest.fn() },
        },
        {
          provide: AUDIT_LOG_REPOSITORY,
          useValue: { log: jest.fn() },
        },
        {
          provide: NOTIFICATION_REPOSITORY,
          useValue: { create: jest.fn() },
        },
        {
          provide: USER_REPOSITORY,
          useValue: { findDirecteur: jest.fn() },
        },
        {
          provide: WhatsAppService,
          useValue: {
            generateWhatsAppLink: jest
              .fn()
              .mockReturnValue('https://wa.me/221771234567'),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<ChangeStatutUseCase>(ChangeStatutUseCase);
    commandeRepo = module.get(COMMANDE_REPOSITORY);
    auditRepo = module.get(AUDIT_LOG_REPOSITORY);
  });

  it('devrait changer le statut de EN_PREPARATION à PRETE', async () => {
    // Arrange
    commandeRepo.findById.mockResolvedValue(mockCommande);
    commandeRepo.update.mockResolvedValue({
      ...mockCommande,
      statut: CommandeStatut.PRETE,
    });

    // Act
    const result = await useCase.execute(
      'cmd-1',
      CommandeStatut.PRETE,
      'user-1',
    );

    // Assert
    expect(result.statut).toBe(CommandeStatut.PRETE);
    expect(auditRepo.log).toHaveBeenCalled();
  });

  it('devrait changer le statut de PRETE à FINALISEE', async () => {
    // Arrange
    commandeRepo.findById.mockResolvedValue({
      ...mockCommande,
      statut: CommandeStatut.PRETE,
    });
    commandeRepo.update.mockResolvedValue({
      ...mockCommande,
      statut: CommandeStatut.FINALISEE,
    });

    // Act
    const result = await useCase.execute(
      'cmd-1',
      CommandeStatut.FINALISEE,
      'user-1',
    );

    // Assert
    expect(result.statut).toBe(CommandeStatut.FINALISEE);
  });

  it('devrait lancer une exception pour transition invalide', async () => {
    // Arrange - EN_PREPARATION ne peut pas aller directement à FINALISEE
    commandeRepo.findById.mockResolvedValue(mockCommande);

    // Act & Assert
    await expect(
      useCase.execute('cmd-1', CommandeStatut.FINALISEE, 'user-1'),
    ).rejects.toThrow(CommandeStatutInvalideException);
  });

  it('devrait lancer une exception pour transition PRETE → PRETE (identique)', async () => {
    // Arrange - Passer de PRETE à PRETE n'est pas autorisé
    commandeRepo.findById.mockResolvedValue({
      ...mockCommande,
      statut: CommandeStatut.PRETE,
    });

    // Act & Assert
    await expect(
      useCase.execute('cmd-1', CommandeStatut.PRETE, 'user-1'),
    ).rejects.toThrow(CommandeStatutInvalideException);
  });
});
