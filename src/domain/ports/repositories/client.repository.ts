import { Client } from '../../entities/client.entity';
import { ClientType } from '../../enums/client-type.enum';
import { ClientStatut } from '../../enums/client-statut.enum';

export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';

export interface ClientRepository {
  findById(id: string): Promise<Client | null>;
  findByEmail(email: string): Promise<Client | null>;
  findAll(filters: {
    type?: ClientType;
    statut?: ClientStatut;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: Client[]; total: number }>;
  create(data: Omit<Client, 'id' | 'createdAt'>): Promise<Client>;
  update(id: string, data: Partial<Client>): Promise<Client>;
  softDelete(id: string): Promise<void>;
  exportAll(filters: {
    type?: ClientType;
    statut?: ClientStatut;
  }): Promise<Client[]>;
  createMany(
    data: Omit<Client, 'id' | 'createdAt'>[],
  ): Promise<number>;
}
