# Priorités de Tests - Projet GesClient

## Analyse du Projet

Après analyse du code, voici ce qui est le plus pertinent à tester :

---

## 🔴 UNIT TESTS (Priorité HAUTE)

### 1. **Commande Entity** - Logique métier pure
| Méthode | Pourquoi tester |
|---------|------------------|
| `calculerMontantHT()` | Calcul central, souvent utilisé |
| `calculerTVA()` | 20% pour A_DISTANCE, 0% pour SUR_PLACE |
| `calculerMontantTTC()` | Simple mais critique |
| `calculerAcompteMinimum()` | 50% pour A_DISTANCE |
| `validerAcompte()` | Lance exception si insuffisant |
| `validerTransition()` | Contrôle les changements de statut |

**Nombre de tests :** 8-10

---

### 2. **LoginUseCase** - Point d'entrée critique
| Scénario | Résultat attendu |
|----------|------------------|
| Bon email + bon mdp | Retourne tokens |
| Mauvais email | Lance InvalidCredentialsException |
| Bon email + mauvais mdp | Lance InvalidCredentialsException |
| Utilisateur inactif | ??? (à vérifier) |

**Nombre de tests :** 4-5

---

### 3. **CreateCommandeUseCase** - Complexe avec plein de logique
| Scénario | Résultat attendu |
|----------|------------------|
| Commandes SUR_PLACE | Pas de TVA, pas d'acompte requis |
| Commandes A_DISTANCE | TVA 20%, acompte 50% |
| Nouveau client (acheteurInfo) | Crée le client |
| Client existant | Utilise l'ID |
| Plusieurs items | Calcule correctement |
| Sans produits | Erreur |

**Nombre de tests :** 10-15

---

### 4. **AddPaiementUseCase** - Logique de paiement critique
| Scénario | Résultat attendu |
|----------|------------------|
| Acompte < minimum | Erreur AcompteInsuffisant |
| Acompte >= minimum | Met à jour acompteVerse |
| Solde avant paiement | Met à jour soldeRestant |
| Paiement 100% | Génère facture définitive |
| Paiement partiel | Génère facture proforma |

**Nombre de tests :** 10-12

---

### 5. **ChangeStatutUseCase** - Transitions de statut
| Scénario | Résultat attendu |
|----------|------------------|
| EN_PREPARATION → PRETE | OK |
| PRETE → FINALISEE | OK |
| EN_PREPARATION → FINALISEE | ERREUR |
| PRETE → EN_PREPARATION | ERREUR |

**Nombre de tests :** 5-6

---

## 🟡 INTEGRATION TESTS (Priorité MOYENNE)

### Controllers à tester avec mocks

| Controller | Endpoints critiques |
|------------|-------------------|
| `AuthController` | POST /auth/login |
| `ClientsController` | POST /clients, GET /clients |
| `CommandesController` | POST /commandes, POST /commandes/:id/paiements |
| `CollectesController` | POST /collectes |
| `FacturesController` | POST /factures/.../definitive |

**Nombre de tests :** 15-20

---

## 🟢 E2E TESTS (Priorité BASSE - à faire après)

### Flux critiques à automateiser

| Flux | Étapes |
|------|--------|
| **Login → Créer Client → Créer Commande** | 1. Login 2. Create client 3. Create order 4. Add payment |
| **Login → Créer Collecte** | 1. Login 2. Create collecte |
| **Login → Générer Facture** | 1. Login 2. Create order 3. Add payment 4. Generate invoice |

**Nombre de tests :** 5-8

---

## Résumé - Pyramide de Tests

```
         /\
        /  \      E2E (5 tests)
       /----\     Flux complets
      /      \
     /--------\   Integration (15 tests)
    /          \  Controllers avec mocks
   /------------\ Unitaires (40 tests)
  /              \ Entities + Use Cases
 /________________\
```

---

## Fichiers à créer

```
src/
├── domain/entities/
│   └── commande.entity.spec.ts      ← 8 tests
│   └── collecte.entity.spec.ts       ← 5 tests
├── application/auth/
│   └── login.use-case.spec.ts        ← 5 tests
├── application/commandes/
│   └── create-commande.use-case.spec.ts  ← 12 tests
│   └── add-paiement.use-case.spec.ts     ← 10 tests
│   └── change-statut.use-case.spec.ts    ← 6 tests
```

**Total : ~50 tests unitaires** (40-50 minutes pour écrire, 30 secondes pour exécuter à chaque push)

---

## Impact sur le développement

**AVANT :**
```
Push → Render déploie → Tester manuellement 30 endpoints → Merger si OK
```

**APRÈS :**
```
Push → CI exécute 50 tests → Si OK → Render déploie automatiquement
```

**Avantages :**
- Tests passent en 30 secondes
- Plus besoin de tester manuellement
- Confiance dans le code
- Détection des régressions immédiates
