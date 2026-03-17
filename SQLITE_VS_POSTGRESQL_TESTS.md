# SQLite vs PostgreSQL pour Tests E2E avec Prisma

## Pourquoi SQLite ne fonctionne pas bien avec Prisma

### 1. Différences de types de données

SQLite et PostgreSQL ont des types de données différents :

| PostgreSQL | SQLite | Problème |
|------------|--------|----------|
| `UUID` | TEXT | Doit utiliser `String` |
| `TIMESTAMP` | TEXT | Doit utiliser `DateTime` |
| `JSONB` | TEXT | Pas de support natif |
| `ARRAY` | TEXT | Pas de support |

### 2. Votre projet utilise PostgreSQL

Votre schéma Prisma (`schema.prisma`) utilise :
- `String` pour la plupart des champs (OK)
- Pas de `UUID` (utilise `@default(uuid())` qui fonctionne avec SQLite)

**En théorie, SQLite pourrait fonctionner** pour votre projet car vous n'utilisez pas de types PostgreSQL avancés.

---

## Option SQLite (si vous voulez quand même essayer)

### Avantages
- ✅ Gratuit, pas de compte à créer
- ✅ Pas de configuration réseau
- ✅ Fichier local, aucun accès internet
- ✅ Très rapide pour les tests

### Inconvénients
- ⚠️ Test local seulement (pas dans CI/CD facilement)
- ⚠️ Comportement potentiellement différent de PostgreSQL
- ⚠️ Pas de support des transactions distribuées

### Comment configurer SQLite

```bash
# Installer le driver SQLite pour Prisma
npm install @prisma/adapter-libsql @libsql/client
```

Modifier `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Puis :

```bash
# Créer la DB
npx prisma db push

# Tester
npm run test:e2e
```

---

## Recommandation

| Situation | Choix |
|-----------|-------|
| Tests locaux rapides | SQLite (si ça fonctionne) |
| CI/CD GitHub | PostgreSQL (Neon gratuit) |
| identical prod behavior | PostgreSQL |

---

## Résumé

**SQLite** = Possible mais potentiellement problématique
**PostgreSQL (Neon)** = Plus stable, même comportement que prod

Je recommende de garder la configuration Neon actuelle pour les tests E2E car :
1. C'est gratuit (1 projet gratuit)
2. Même comportement que la prod
3. Fonctionne dans le CI/CD
