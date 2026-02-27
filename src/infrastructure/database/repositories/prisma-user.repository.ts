import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserRepository } from '../../../domain/ports/repositories/user.repository';
import { User } from '../../../domain/entities/user.entity';
import { Role } from '../../../domain/enums/role.enum';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id },
    });
    return raw ? this.toDomain(raw) : null;
  }

  async create(
    data: Omit<User, 'id' | 'createdAt'>,
  ): Promise<User> {
    const raw = await this.prisma.user.create({ data });
    return this.toDomain(raw);
  }

  async findDirecteur(): Promise<User | null> {
    const raw = await this.prisma.user.findFirst({
      where: { role: 'DIRECTEUR', actif: true },
    });
    return raw ? this.toDomain(raw) : null;
  }

  private toDomain(raw: any): User {
    const user = new User();
    user.id = raw.id;
    user.nom = raw.nom;
    user.prenom = raw.prenom;
    user.email = raw.email;
    user.password = raw.password;
    user.role = raw.role as Role;
    user.actif = raw.actif;
    user.createdAt = raw.createdAt;
    return user;
  }
}
