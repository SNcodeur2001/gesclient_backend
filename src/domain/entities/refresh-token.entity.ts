export class RefreshToken {
  id!: string;
  token!: string;
  tokenHash!: string;
  userId!: string;
  expiresAt!: Date;
  revokedAt?: Date | null;
  createdAt!: Date;
}
