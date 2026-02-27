import { CommandeStatut } from
  '../enums/commande-statut.enum';

export class CommandeStatutInvalideException extends Error {
  constructor(
    public readonly statutActuel: CommandeStatut,
    public readonly statutDemande: CommandeStatut,
  ) {
    super(
      `Transition impossible : ${statutActuel} → ${statutDemande}`
    );
    this.name = 'CommandeStatutInvalideException';
  }
}