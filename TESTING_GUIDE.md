# Guide des Tests - GesClient Backend

## Le Problème Actuel

Vous avez 30+ endpoints et vous testez manuellement chacun d'eux après chaque modification. Ce n'est pas évolutif.

**La solution :** Tests automatisés

---

## Types de Tests

### 1. Tests Unitaires (Unit Tests)

**Objectif :** Tester une fonction/logique métier isolée

**Exemple :**
```typescript
// Test d'une fonction de calcul
describe('calculateMontantTTC', () => {
  it('devrait calculer correctement avec TVA 20%', () => {
    const result = calculateMontantTTC(100000, 0.20);
    expect(result).toBe(120000);
  });
});
```

**Dans NestJS, on teste :**
- Use Cases (logique métier)
- Services (méthodes avec logique)
- Entities (méthodes de calcul)

**Temps d'exécution :** Millisecondes
**Couverture recommandée :** 80% de la logique métier

---

### 2. Tests d'Intégration (Integration Tests)

**Objectif :** Tester plusieurs composants ensemble

**Exemple :**
```typescript
// Test d'un use case avec son repository
describe('CreateClientUseCase', () => {
  it('devrait créer un client avec les bonnes données', async () => {
    const client = await createClient.execute({
      nom: 'Diop',
      type: 'ACHETEUR'
    });
    expect(client.id).toBeDefined();
    expect(client.nom).toBe('Diop');
  });
});
```

**Dans NestJS, on teste :**
- Use Cases avec mock du repository
- Controllers avec mock des use cases

**Temps d'exécution :** Secondes

---

### 3. Tests E2E (End-to-End)

**Objectif :** Tester l'API complète comme un client

**Exemple :**
```typescript
// Test d'un endpoint POST
describe('POST /clients', () => {
  it('devrait créer un client', async () => {
    const response = await request(app.getHttpServer())
      .post('/clients')
      .send({ nom: 'Diop', type: 'ACHETEUR' })
      .expect(201);
    
    expect(response.body.success).toBe(true);
  });
});
```

**Dans NestJS, on teste :**
- Tous les endpoints API
- Authentification
- Flux complets (créer → lire → modifier → supprimer)

**Temps d'exécution :** Minutes (pour beaucoup de tests)

---

## Stratégie Recommandée

### Pyramide des Tests

```
        /\
       /  \      E2E (peu)
      /----\     - 5-10 tests critiques
     /      \
    /--------\   Intégration (moyen)
   /          \  - 20-30 tests
  /------------\ Unitaires (beaucoup)
 /              \ - 50-100 tests
/________________\
```

### Priorités pour GesClient

| Priorité | Type | Nombre suggéré |
|----------|------|----------------|
| 1 | Unitaires sur les Use Cases | 30-50 |
| 2 | Intégration sur les Controllers | 20-30 |
| 3 | E2E sur les flux critiques | 5-10 |

---

## Outils Utilisés

| Outil | Rôle |
|-------|------|
| Jest | Framework de test (déjà installé) |
| Supertest | Tests HTTP pour E2E |
| ts-mockito | Mocks pour les dépendances |
| faker | Données de test réalistes |

---

## Exemple Concret pour GesClient

### Test Unitaire - CreateCommandeUseCase

```typescript
// src/application/commandes/create-commande.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CreateCommandeUseCase } from './create-commande.use-case';
import { CommandeRepository } from '../../../domain/ports/repositories/commande.repository';
import { ClientRepository } from '../../../domain/ports/repositories/client.repository';

describe('CreateCommandeUseCase', () => {
  let useCase: CreateCommandeUseCase;
  let commandeRepo: any;
  let clientRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCommandeUseCase,
        {
          provide: 'CommandeRepository',
          useValue: { create: jest.fn(), countAll: jest.fn() }
        },
        {
          provide: 'ClientRepository',
          useValue: { findById: jest.fn() }
        }
      ]
    }).compile();

    useCase = module.get<CreateCommandeUseCase>(CreateCommandeUseCase);
    commandeRepo = module.get('CommandeRepository');
    clientRepo = module.get('ClientRepository');
  });

  it('devrait créer une commande avec le bon statut initial', async () => {
    // Arrange
    clientRepo.findById.mockResolvedValue({ id: '1', nom: 'Test' });
    commandeRepo.countAll.mockResolvedValue(5);
    commandeRepo.create.mockResolvedValue({ id: 'cmd-1' });

    // Act
    const result = await useCase.execute({
      type: 'SUR_PLACE',
      acheteurId: '1',
      items: [{ produit: 'PEHD', quantite: 100, prixUnitaire: 300 }],
      commercialId: 'user-1'
    });

    // Assert
    expect(result.statut).toBe('EN_PREPARATION'); // SUR_PLACE = EN_PREPARATION
  });

  it('devrait calculer correctement le montant HT', async () => {
    // Arrange
    clientRepo.findById.mockResolvedValue({ id: '1', nom: 'Test' });
    commandeRepo.countAll.mockResolvedValue(5);
    commandeRepo.create.mockResolvedValue({ id: 'cmd-1' });

    // Act
    const result = await useCase.execute({
      type: 'SUR_PLACE',
      acheteurId: '1',
      items: [
        { produit: 'PEHD', quantite: 100, prixUnitaire: 300 }, // 30,000
        { produit: 'PP', quantite: 50, prixUnitaire: 200 }    // 10,000
      ],
      commercialId: 'user-1'
    });

    // Assert
    expect(result.montantHT).toBe(40000);
    expect(result.montantTTC).toBe(40000); // SUR_PLACE = sans TVA
  });
});
```

---

## Comment exécuter les Tests

```bash
# Tous les tests
npm test

# Tests avec coverage
npm test -- --coverage

# Tests en mode watch (développement)
npm test -- --watch

# Tests e2e seulement
npm test -- --testPathPattern=e2e

# Tests unitaires seulement
npm test -- --testPathPattern=spec
```

---

## Intégration CI/CD

Avec les tests automatisés, votre flux devient :

```
Développement → Push dev → CI exécute tests → Résultat
                                      ↓
                              Si échoué → Pas de merge
                              Si réussi → Déploiement possible
```

**Avantages :**
- Plus besoin de tester manuellement
- Confiance dans le code
- Détection rapide des régressions

---

## Résumé

| Type | Ce qu'on teste | Durée | Fréquence |
|------|---------------|-------|-----------|
| Unitaire | Logique métier isolée | ms | À chaque push |
| Intégration | Use case + repository | s | À chaque push |
| E2E | API complète | min | Avant merge |

**Prochaine étape :** Créer les tests unitaires pour les use cases les plus critiques (CreateCommande, CreateCollecte, Login).
