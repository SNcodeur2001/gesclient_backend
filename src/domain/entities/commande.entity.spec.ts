import { Commande } from './commande.entity';
import { CommandeType } from '../enums/commande-type.enum';
import { CommandeStatut } from '../enums/commande-statut.enum';
import { AcompteInsuffisantException } from '../exceptions/acompte-insuffisant.exception';
import { CommandeStatutInvalideException } from '../exceptions/commande-statut-invalide.exception';

/**
 * Tests Pyramide - Couverture essentiel
 * 
 * Unit Tests (15 tests)
 * - Entity: Commande (8 tests)
 * - Use Cases: Login, CreateCommande, ChangeStatut (7 tests)
 * 
 * Integration Tests (5 tests) - Controllers
 * 
 * E2E Tests (0 tests) - À ajouter plus tard
 */

describe('Commande Entity', () => {
  describe('calculerTVA', () => {
    it.each([
      { type: CommandeType.SUR_PLACE, montantHT: 100000, expectedTVA: 0, description: 'SUR_PLACE sans TVA' },
      { type: CommandeType.A_DISTANCE, montantHT: 100000, expectedTVA: 20000, description: 'A_DISTANCE avec 20% TVA' },
      { type: CommandeType.SUR_PLACE, montantHT: 50000, expectedTVA: 0, description: 'SUR_PLACE petit montant' },
      { type: CommandeType.A_DISTANCE, montantHT: 50000, expectedTVA: 10000, description: 'A_DISTANCE petit montant' },
    ])('$description', ({ type, montantHT, expectedTVA }) => {
      expect(Commande.calculerTVA(montantHT, type)).toBe(expectedTVA);
    });
  });

  describe('calculerMontantTTC', () => {
    it.each([
      { montantHT: 100000, tva: 0, expected: 100000 },
      { montantHT: 100000, tva: 20000, expected: 120000 },
      { montantHT: 50000, tva: 10000, expected: 60000 },
    ])('montantHT=$montantHT, tva=$tva → $expected', ({ montantHT, tva, expected }) => {
      expect(Commande.calculerMontantTTC(montantHT, tva)).toBe(expected);
    });
  });

  describe('calculerAcompteMinimum', () => {
    it.each([
      { type: CommandeType.SUR_PLACE, montantTTC: 100000, expected: null, description: 'SUR_PLACE pas d\'acompte' },
      { type: CommandeType.A_DISTANCE, montantTTC: 100000, expected: 50000, description: 'A_DISTANCE 50% acompte' },
      { type: CommandeType.A_DISTANCE, montantTTC: 200000, expected: 100000, description: 'A_DISTANCE grand montant' },
    ])('$description', ({ type, montantTTC, expected }) => {
      expect(Commande.calculerAcompteMinimum(montantTTC, type)).toBe(expected);
    });
  });

  describe('calculerMontantHT', () => {
    it.each([
      { items: [{ quantite: 100, prixUnitaire: 300 }], expected: 30000, description: 'Un seul item' },
      { items: [{ quantite: 100, prixUnitaire: 300 }, { quantite: 50, prixUnitaire: 200 }], expected: 40000, description: 'Deux items' },
      { items: [], expected: 0, description: 'Aucun item' },
    ])('$description', ({ items, expected }) => {
      expect(Commande.calculerMontantHT(items)).toBe(expected);
    });
  });

  describe('validerTransition', () => {
    it.each([
      { from: CommandeStatut.EN_PREPARATION, to: CommandeStatut.PRETE, valid: true },
      { from: CommandeStatut.PRETE, to: CommandeStatut.FINALISEE, valid: true },
      { from: CommandeStatut.EN_PREPARATION, to: CommandeStatut.FINALISEE, valid: false },
      { from: CommandeStatut.PRETE, to: CommandeStatut.EN_PREPARATION, valid: false },
      { from: CommandeStatut.EN_ATTENTE_ACOMPTE, to: CommandeStatut.PRETE, valid: false },
    ])('Transition $from → $to', ({ from, to, valid }) => {
      const commande = new Commande();
      commande.statut = from;
      
      if (valid) {
        expect(() => commande.validerTransition(to)).not.toThrow();
      } else {
        expect(() => commande.validerTransition(to)).toThrow(CommandeStatutInvalideException);
      }
    });
  });

  describe('validerAcompte', () => {
    it('devrait lancer exception si acompte insuffisant', () => {
      const commande = new Commande();
      commande.acompteMinimum = 50000;
      commande.montantTTC = 100000;
      
      expect(() => commande.validerAcompte(30000)).toThrow(AcompteInsuffisantException);
    });

    it('ne devrait pas lancer si acompte >= minimum', () => {
      const commande = new Commande();
      commande.acompteMinimum = 50000;
      commande.montantTTC = 100000;
      
      expect(() => commande.validerAcompte(50000)).not.toThrow();
    });

    it('ne devrait pas lancer si pas d\'acompte minimum (SUR_PLACE)', () => {
      const commande = new Commande();
      commande.acompteMinimum = null;
      commande.montantTTC = 100000;
      
      expect(() => commande.validerAcompte(10000)).not.toThrow();
    });
  });
});
