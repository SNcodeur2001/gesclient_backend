export class AcompteInsuffisantException extends Error {
  constructor(
    public readonly montantRecu: number,
    public readonly montantMinimum: number,
    public readonly montantTTC: number,
  ) {
    super('Acompte insuffisant');
    this.name = 'AcompteInsuffisantException';
  }
}