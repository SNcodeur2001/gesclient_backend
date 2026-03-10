import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from './login.use-case';
import { USER_REPOSITORY } from '../../domain/ports/repositories/user.repository';
import { HASH_SERVICE } from '../../domain/ports/services/hash.service';
import { TOKEN_SERVICE } from '../../domain/ports/services/token.service';
import { AUDIT_LOG_REPOSITORY } from '../../domain/ports/repositories/audit-log.repository';
import { REFRESH_TOKEN_REPOSITORY } from '../../domain/ports/repositories/refresh-token.repository';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { Role } from '../../domain/enums/role.enum';

/**
 * Tests d'Intégration - LoginUseCase
 * Utilise des mocks pour les dépendances externes
 */
describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: any;
  let hashService: any;
  let tokenService: any;
  let auditRepo: any;
  let refreshTokenRepo: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@proplast.sn',
    password: 'hashed_password',
    role: Role.COMMERCIAL,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: { findByEmail: jest.fn() },
        },
        {
          provide: HASH_SERVICE,
          useValue: { compare: jest.fn(), hash: jest.fn() },
        },
        {
          provide: TOKEN_SERVICE,
          useValue: { signAccessToken: jest.fn(), signRefreshToken: jest.fn() },
        },
        {
          provide: AUDIT_LOG_REPOSITORY,
          useValue: { log: jest.fn() },
        },
        {
          provide: REFRESH_TOKEN_REPOSITORY,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    userRepo = module.get(USER_REPOSITORY);
    hashService = module.get(HASH_SERVICE);
    tokenService = module.get(TOKEN_SERVICE);
    auditRepo = module.get(AUDIT_LOG_REPOSITORY);
    refreshTokenRepo = module.get(REFRESH_TOKEN_REPOSITORY);
  });

  it('devrait retourner les tokens si email et mot de passe corrects', async () => {
    // Arrange
    userRepo.findByEmail.mockResolvedValue(mockUser);
    hashService.compare.mockResolvedValue(true);
    tokenService.signAccessToken.mockReturnValue('access_token_xyz');
    tokenService.signRefreshToken.mockReturnValue('refresh_token_xyz');
    hashService.hash.mockResolvedValue('hashed_refresh');
    refreshTokenRepo.create.mockResolvedValue({});

    // Act
    const result = await useCase.execute('test@proplast.sn', 'password123');

    // Assert
    expect(result.access_token).toBe('access_token_xyz');
    expect(result.refresh_token).toBe('refresh_token_xyz');
    expect(refreshTokenRepo.create).toHaveBeenCalled();
    expect(auditRepo.log).toHaveBeenCalled();
  });

  it('devrait lancer InvalidCredentialsException si utilisateur non trouvé', async () => {
    // Arrange
    userRepo.findByEmail.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute('unknown@proplast.sn', 'password123'))
      .rejects.toThrow(InvalidCredentialsException);
  });

  it('devrait lancer InvalidCredentialsException si mot de passe incorrect', async () => {
    // Arrange
    userRepo.findByEmail.mockResolvedValue(mockUser);
    hashService.compare.mockResolvedValue(false);

    // Act & Assert
    await expect(useCase.execute('test@proplast.sn', 'wrong_password'))
      .rejects.toThrow(InvalidCredentialsException);
  });
});
