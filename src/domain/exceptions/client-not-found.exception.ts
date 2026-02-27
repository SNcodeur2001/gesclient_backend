export class ClientNotFoundException extends Error {
  constructor(id: string) {
    super(`Client ${id} introuvable`);
    this.name = 'ClientNotFoundException';
  }
}