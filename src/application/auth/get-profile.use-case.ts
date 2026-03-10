import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/ports/repositories/user.repository';
import type { UserRepository } from '../../domain/ports/repositories/user.repository';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: UserRepository,
  ) {}

  async execute(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new InvalidCredentialsException();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userSafe } = user;
    return userSafe;
  }
}
