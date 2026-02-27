import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { HashService } from '../../domain/ports/services/hash.service';

@Injectable()
export class BcryptHashService implements HashService {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, 10);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
