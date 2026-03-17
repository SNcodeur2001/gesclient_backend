# Guide - Tests E2E avec Base de Données Séparée

## Option : Deux bases de données Neon

Pour éviter de toucher à la base de données de production, utilisez deux bases de données :
- **Production** : Votre DB actuelle
- **Test** : Une deuxième DB Neon gratuite

---

## Étape 1 : Créer une base de données test sur Neon

1. Connectez-vous à [Neon](https://neon.tech)
2. Créez un nouveau projet "GesClient Test"
3. Copiez l'URL de connexion (elle ressemble à : `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/gesclient-test`)

---

## Étape 2 : Configurer les variables d'environnement

Créez un fichier `.env.test` :

```env
# Base de données de TEST (Neon Test)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/gesclient-test?sslmode=require"
```

---

## Étape 3 : Mettre à jour le fichier E2E setup

Modifiez `test/setup-e2e.ts` pour utiliser la bonne URL :

```typescript
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Charger les variables d'environnement de test
config({ path: '.env.test' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

---

## Étape 4 : Créer les tables de test

```bash
# Appliquer le schema à la DB de test
DATABASE_URL="votre_url_test" npx prisma db push
```

---

## Étape 5 : Exécuter les tests E2E

```bash
# Avec la variable d'environnement de test
DATABASE_URL="votre_url_test" npm run test:e2e
```

---

## Résumé des commandes

```bash
# 1. Créer une 2ème DB sur Neon (gratuit)
# 2. Créer fichier .env.test avec DATABASE_URL de la DB test
# 3. Appliquer le schema
DATABASE_URL="url_test" npx prisma db push

# 4. Lancer les E2E
DATABASE_URL="url_test" npm run test:e2e
```

---

## Alternative : CI GitHub

Dans votre workflow CI, vous pouvez ajouter :

```yaml
test:e2e:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    
    - run: npm ci
    
    - name: Run E2E Tests
      run: npm run test:e2e
      env:
        DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

---

## Pour vérifier que tout fonctionne

```bash
# Tester la connexion à la DB test
DATABASE_URL="votre_url_test" npx prisma studio
```

Cela ouvrira Prisma Studio sur la base de test (pas la prod!).
