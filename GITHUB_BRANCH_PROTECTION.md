# Protéger la branche main - GitHub

## Le flux de travail sécurisé

```
dev (travail) → PR → CI passe → Merger → main → CI passe → Deploy Render
```

---

## Étape 1 : Activer les Branch Protected Rules

1. Allez sur **GitHub** → Votre repo → **Settings**
2. Dans le menu左侧, cliquez sur **Branches**
3. Cliquez sur **Add rule**
4. Configurez :

```
Branch name pattern: main
```

**Règles à cocher :**

| Règle | Description |
|-------|-------------|
| ✅ Require pull request reviews before merging | Oblige à reviewer avant merge |
| ✅ Require status checks to pass before merging | Oblige CI à passer |
| ✅ Require conversation resolution before merging | Oblige à résoudre les commentaires |
| ✅ Require branches to be up to date | Oblige à être à jour avec main |

5. Cliquez **Save changes**

---

## Étape 2 : Configurer les Status Checks

Dans la même page, après avoir coché "Require status checks" :

1. Cherchez **ci.yml** dans la liste
2. Cochez tous les jobs :
   - ✅ lint
   - ✅ typecheck
   - ✅ build
   - ✅ test
3. Cliquez **Save changes**

---

## Étape 3 : Mettre à jour le CI (optionnel)

Le CI actuel déjà blokera le merge si un job échoue. Pas de changement nécessaire.

---

## Résultat

| Action | Ce qui se passe |
|--------|----------------|
| Push direct sur main | ❌ Refusé |
| PR sans tests | ❌ Merge bloqué |
| PR avec CI qui échoue | ❌ Merge bloqué |
| PR avec CI qui passe + 1 reviewer | ✅ Merge autorisé |
| Merge vers main | CI s'exécute → Deploy vers Render |

---

## Schéma

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Push      │     │   CI/CD     │     │   Merge     │
│   dev       │────▶│   Vérif     │────▶│   Allowed   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
               ✅ Réussi      ❌ Échoué
                    │             │
                    ▼             ▼
            ┌───────────┐   ┌───────────┐
            │  Merger   │   │  Bloquer  │
            │ vers main │   │   Merge   │
            └───────────┘   └───────────┘
```

---

## Résumé des permissions

| Type d'utilisateur | Peut push sur main ? | Peut merger sans review ? |
|-------------------|---------------------|-------------------------|
| Admin | ✅ Oui (si pas protégé) | ✅ Oui |
| Maintainer | ❌ Non | ❌ Non |
| Collaborator | ❌ Non | ❌ Non |

**Recommandation :** Protéger `main` et utiliser des PRs pour fusionner le code.
