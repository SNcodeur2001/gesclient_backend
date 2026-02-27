export class CommandeNotFoundException extends Error {
  constructor(id: string) {
    super(`Commande ${id} introuvable`);
    this.name = 'CommandeNotFoundException';
  }
}