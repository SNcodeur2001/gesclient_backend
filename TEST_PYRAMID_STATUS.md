# Pyramide de Tests - État Actuel

## Résumé

```
         /\
        /  \      E2E (3 tests)            ← ✅ En place
       /----\     
      /      \    
     /--------\   Intégration (7 tests)   ← ✅ En place
    /          \  
   /------------\ Unitaires (25 tests)    ← ✅ En place
  /              
 /________________\
```

---

## Tests Unitaires (25 tests) ✅

| Fichier | Tests | Ce qui est testé |
|---------|-------|------------------|
| `commande.entity.spec.ts` | 21 | calculerTVA, calculerMontantTTC, calculerAcompteMinimum, calculerMontantHT, validerTransition, validerAcompte |
| `collecte.entity.spec.ts` | 3 | calculerMontantCollecte |
| `app.controller.spec.ts` | 1 | Test par défaut |

---

## Tests d'Intégration (7 tests) ✅

| Fichier | Tests | Ce qui est testé |
|---------|-------|------------------|
| `login.use-case.spec.ts` | 3 | Login avec mocks - succès, email invalide, mot de passe invalide |
| `change-statut.use-case.spec.ts` | 4 | Changement de statut - transitions valides et invalides |

---

## Tests E2E (3 tests) ✅

| Fichier | Tests | Ce qui est testé |
|---------|-------|------------------|
| `test/auth.e2e-spec.ts` | 3 | Login endpoint - identifiants invalides, données manquantes, accès sans token |

**Note :** Les E2E nécessitent une DB. Pour les exécuter : `npm run test:e2e`

---

## CI/CD Actuel

| Étape | Status |
|-------|--------|
| ESLint | ✅ |
| TypeScript | ✅ |
| Build | ✅ |
| Tests unitaires + intégration | ✅ (32 tests) |
| Tests E2E | ✅ (3 tests - nécessite DB Neon) |
| Déploiement Render | ✅ (après CI réussi) |

---

## Résultat

```
Test Suites: 5 passed, 5 total
Tests:       32 passed, 32 total
Time:        0.603s
```

---

## Pour exécuter les tests

```bash
# Tests unitaires + intégration (rapide, ~1s)
npm test

# Tests E2E (lent, nécessite DB Neon)
npm run test:e2e

# Tests avec coverage
npm run test:cov
```

---

## Configuration E2E

Les tests E2E utilisent une base de données Neon séparée pour éviter d'affecter les données de production.

### Variables d'environnement

```bash
# Dans .env.test
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

### Pour exécuter les E2E

```bash
DATABASE_URL="postgresql://neondb_owner:xxx@..." npm run test:e2e
```
