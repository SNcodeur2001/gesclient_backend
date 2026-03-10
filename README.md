<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
</p>

<h1 align="center">GesClient Proplast - Backend API</h1>

<p align="center">
  API REST de gestion opérationnelle pour une entreprise de collecte et vente de plastique
</p>

---

## Description

**GesClient** est une application backend développée avec **NestJS** pour la gestion opérationnelle d'une entreprise de collecte et vente de plastique (Proplast).

### Fonctionnalités principales

- **Gestion des Clients** : Apporteurs et Acheteurs avec import/export Excel
- **Gestion des Commandes** : Création, suivi, paiements (acomptes/soldes)
- **Gestion des Collectes** : Enregistrement des apports de plastiques
- **Facturation** : Génération PDF automatique et envoi par WhatsApp
- **Dashboard** : Statistiques globales pour le directeur
- **Audit** : Traçabilité complète des actions

### Technologies

| Technologie | Description |
|-------------|-------------|
| NestJS 11.x | Framework Node.js |
| TypeScript 5.x | Langage |
| PostgreSQL | Base de données |
| Prisma 7.x | ORM |
| JWT + Refresh Tokens | Authentification |
| pdfmake | Génération PDF |
| Meta WhatsApp API | Envoi de factures |

---

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 14+

### Installation

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev
```

### Configuration

Créer un fichier `.env` :

```env
DATABASE_URL=postgresql://user:password@localhost:5432/gesclient
JWT_SECRET=votre_secret_jwt
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Lancement

```bash
# Mode développement
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

---

## Documentation

| Fichier | Description |
|---------|-------------|
| `DOCUMENTATION_COMPLETE.md` | Documentation complète et détaillée |
| `DIAGRAMMES.md` | Diagrammes UML (Use Case, Classes, Séquences) |

### Swagger API

Une fois l'application démarrée :
- **UI Swagger** : http://localhost:3000/api/docs
- **JSON OpenAPI** : http://localhost:3000/api/docs-json

### Identifiants de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Directeur | directeur@proplast.com | Test1234! |
| Commercial | commercial@proplast.com | Test1234! |
| Collecteur | collecteur@proplast.com | Test1234! |

---

## Architecture

Le projet utilise **Clean Architecture** avec **Domain-Driven Design (DDD)** :

```
src/
├── domain/           # Entités, Enums, Exceptions, Ports
├── application/      # Use Cases (Logique métier)
├── infrastructure/  # Implémentations (Prisma, Services)
└── presentation/    # Controllers & DTOs (API REST)
```

---

## Commandes utiles

```bash
# Linting
npm run lint

# Tests
npm run test
npm run test:cov

# Docker
docker-compose up --build
```

---

## API Endpoints

### Auth
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Rafraîchir token
- `POST /api/v1/auth/logout` - Déconnexion
- `GET /api/v1/auth/me` - Profil utilisateur

### Clients
- `GET /api/v1/clients` - Liste paginée
- `POST /api/v1/clients` - Créer
- `PATCH /api/v1/clients/:id` - Modifier
- `DELETE /api/v1/clients/:id` - Supprimer (Directeur)
- `POST /api/v1/clients/import` - Import Excel
- `GET /api/v1/clients/export` - Export CSV
- `GET /api/v1/clients/export/excel` - Export Excel

### Commandes
- `GET /api/v1/commandes` - Liste
- `POST /api/v1/commandes` - Créer
- `POST /api/v1/commandes/:id/paiements` - Ajouter paiement
- `PATCH /api/v1/commandes/:id/statut` - Changer statut

### Collectes
- `GET /api/v1/collectes` - Liste
- `POST /api/v1/collectes` - Créer
- `GET /api/v1/collectes/stats` - Statistiques

### Factures
- `POST /api/v1/factures/commandes/:id/facture/proforma` - Générer proforma
- `POST /api/v1/factures/commandes/:id/facture/definitive` - Générer définitive
- `GET /api/v1/factures/:id/pdf` - Télécharger PDF
- `POST /api/v1/factures/:id/envoyer-whatsapp` - Envoyer par WhatsApp

### Autres
- `GET /api/v1/stats/dashboard` - Dashboard (Directeur)
- `GET /api/v1/audit` - Journaux d'audit (Directeur)
- `GET /api/v1/notifications` - Notifications

---

## Licence

MIT License

---

*Pour une documentation complète, voir `DOCUMENTATION_COMPLETE.md`*
