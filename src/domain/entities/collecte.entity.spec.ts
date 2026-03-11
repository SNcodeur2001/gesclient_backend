import { calculerMontantCollecte } from './collecte.entity';

/**
 * Tests légers pour Collecte Entity
 */
describe('Collecte Entity', () => {
  describe('calculerMontantCollecte', () => {
    it.each([
      {
        items: [
          { quantiteKg: 100, prixUnitaire: 200 },
          { quantiteKg: 50, prixUnitaire: 150 },
        ],
        expected: 27500,
        description: 'Deux types plastique',
      },
      {
        items: [{ quantiteKg: 150, prixUnitaire: 200 }],
        expected: 30000,
        description: 'Un seul type',
      },
      { items: [], expected: 0, description: 'Aucun item' },
    ])('$description', ({ items, expected }) => {
      expect(calculerMontantCollecte(items)).toBe(expected);
    });
  });
});
