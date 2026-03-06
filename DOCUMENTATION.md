# GesClient Backend - Documentation Technique

> API de gestion opérationnelle pour Proplast (gestion des clients, commandes, collectes et paiements)

---

## Table des Matières

1. [Aperçu du Projet](#1-aperçu-du-projet)
2. [Architecture](#2-architecture)
3. [Technologies](#3-technologies)
4. [Modèles de Données](#4-modèles-de-données)
5. [API Endpoints](#5-api-endpoints)
6. [Installation & Démarrage](#6-installation--démarrage)
7. [Structure des Fichiers](#7-structure-des-fichiers)

---

## 1. Aperçu du Projet

GesClient est une API REST built avec **NestJS** pour la gestion opérationnelle d'une entreprise de collecte et vente de plastique. Elle gère :

- **Clients** (apporteurs & acheteurs)
- **Collectes** (réception de plastique auprès des apporteurs)
- **Commandes** (ventes aux acheteurs)
- **Paiements** (acomptes & soldes)
- **Notifications** (alertes en temps réel)
- **Audit** (traçabilité des actions)

**API Prefix** : `/api/v1`  
**Swagger UI** : `http://localhost:3000/api/docs`

---

## 2. Architecture

Le projet suit l'architecture **Clean Architecture** avec **Domain-Driven Design (DDD)** :

```
src/
├── domain/           # Entités, Enums, Exceptions, Ports (Interfaces)
├── application/      # Use Cases (Logique métier)
├── infrastructure/   # Implémentations (Prisma, Services)
└── presentation/    # Controllers & DTOs (API REST)
```

### Flux de données

```
Request → Controller → Use Case → Repository → Prisma → PostgreSQL
                ↓
           Entity/DTO
```

---

## 3. Technologies

| Categorie | Technologie |
|-----------|-------------|
| Framework | NestJS 11.x |
| Langage | TypeScript 5.x |
| Base de données | PostgreSQL |
| ORM | Prisma 7.x |
| Authentification | JWT + Refresh Tokens |
| Cache | Redis |
| Validation | class-validator |
| Documentation | Swagger/OpenAPI |
| Excel | xlsx |

---

## 4. Modèles de Données

### 4.1 Enumérations

| Enum | Valeurs |
|------|---------|
| **Role** | `DIRECTEUR`, `COMMERCIAL`, `COLLECTEUR` |
| **ClientType** | `APPORTEUR` (fournisseur), `ACHETEUR` (client) |
| **ClientStatut** | `ACTIF`, `PROSPECT`, `INACTIF` |
| **CommandeType** | `SUR_PLACE`, `A_DISTANCE` |
| **CommandeStatut** | `EN_ATTENTE_ACOMPTE`, `EN_PREPARATION`, `PRETE`, `FINALISEE` |
| **PaiementType** | `ACOMPTE`, `SOLDE` |
| **ModePaiement** | `ESPECES`, `VIREMENT`, `CHEQUE`, `MOBILE_MONEY` |

### 4.2 Entités Principales

- **User** : Utilisateurs de l'application (dirigeants, commerciaux, collecteurs)
- **Client** : Apporteurs et acheteurs
- **Collecte** : Réception de plastique (quantité, prix, apporteur, collecteur)
- **Commande** : Commande client (produit, quantité, prix, statut)
- **Paiement** : Paiement связанный к команде
- **Notification** : Alertes pour les utilisateurs
- **AuditLog** : Journal des actions (traçabilité)
- **RefreshToken** : Tokens de rafraîchissement

---

## 5. API Endpoints

### 5.1 Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/auth/login` | Connexion (email + password) |
| `POST` | `/auth/refresh` | Rafraîchir le token |
| `POST` | `/auth/logout` | Déconnexion |
| `GET` | `/auth/me` | Profil utilisateur |

### 5.2 Clients

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/clients` | Liste paginée (filtres: search, type, statut) |
| `GET` | `/clients/:id` | Détails client |
| `POST` | `/clients` | Créer client |
| `PATCH` | `/clients/:id` | Modifier client |
| `DELETE` | `/clients/:id` | Supprimer (_DIRECTeur only_) |
| `POST` | `/clients/import` | Importer depuis Excel |
| `GET` | `/clients/export` | Exporter CSV |
| `GET` | `/clients/export/excel` | Exporter Excel |
| `GET` | `/clients/template` | Télécharger template |

### 5.3 Collectes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/collectes` | Liste des collectes |
| `POST` | `/collectes` | Créer collecte |
| `GET` | `/collectes/stats` | Statistiques |

### 5.4 Commandes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/commandes` | Liste des commandes |
| `POST` | `/commandes` | Créer commande |
| `PATCH` | `/commandes/:id/statut` | Changer statut |
| `POST` | `/commandes/:id/paiements` | Ajouter paiement |

### 5.5 Notifications

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/notifications` | Liste des notifications |
| `PATCH` | `/notifications/:id/read` | Marquer comme lu |

### 5.6 Statistiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/stats/dashboard` | Dashboard global |

### 5.7 Audit

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/audit` | Logs d'audit |

---

## 6. Installation & Démarrage

### 6.1 Prérequis

- Node.js 20+
- PostgreSQL
- Redis

### 6.2 Variables d'environnement (.env)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/gesclient
JWT_SECRET=votre_secret_jwt
PORT=3000
FRONTEND_URL=http://localhost:5173
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 6.3 Commandes

```bash
# Installation des dépendances
npm install

# Génération du client Prisma
npx prisma generate

# Migration de la base de données
npx prisma migrate dev

# Démarrage en mode développement
npm run start:dev

# Démarrage avec Docker
docker-compose up --build

# Tests
npm run test
npm run test:cov
```

---

## 7. Structure des Fichiers

```
src/
├── main.ts                          # Point d'entrée
├── app.module.ts                    # Module principal
├── application/                     # Use Cases
│   ├── auth/
│   │   ├── login.use-case.ts
│   │   ├── logout.use-case.ts
│   │   ├── refresh-token.use-case.ts
│   │   └── get-profile.use-case.ts
│   ├── clients/
│   │   ├── get-clients.use-case.ts
│   │   ├── create-client.use-case.ts
│   │   ├── update-client.use-case.ts
│   │   ├── delete-client.use-case.ts
│   │   ├── import-clients.use-case.ts
│   │   └── export-*.use-case.ts
│   ├── collectes/
│   ├── commandes/
│   ├── notifications/
│   ├── stats/
│   └── audit/
├── domain/                          # Couche métier
│   ├── entities/                    # Classes métier
│   │   ├── client.entity.ts
│   │   ├── commande.entity.ts
│   │   ├── collecte.entity.ts
│   │   └── ...
│   ├── enums/                       # Constantes
│   │   ├── role.enum.ts
│   │   ├── client-type.enum.ts
│   │   └── ...
│   ├── exceptions/                  # Exceptions métier
│   │   ├── client-not-found.exception.ts
│   │   └── ...
│   └── ports/                       # Interfaces
│       ├── repositories/            # Ports de données
│       └── services/                # Ports de services
├── infrastructure/                  # Implémentations
│   ├── database/
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts
│   │   └── repositories/            # Implémentations Prisma
│   │       ├── prisma-client.repository.ts
│   │       └── ...
│   ├── services/
│   │   ├── jwt-token.service.ts
│   │   ├── bcrypt-hash.service.ts
│   │   └── token-blacklist.service.ts
│   └── filters/
│       └── domain-exception.filter.ts
└── presentation/                    # API REST
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.module.ts
    │   ├── guards/                  # JWT & RBAC
    │   └── dto/
    ├── clients/
    │   ├── clients.controller.ts
    │   ├── clients.module.ts
    │   └── dto/
    ├── collectes/
    ├── commandes/
    ├── notifications/
    ├── stats/
    └── audit/
```

---

## Glossaire

| Terme | Définition |
|-------|------------|
| **Apporteur** | Fournisseur de plastique (personne qui apporte la matière) |
| **Acheteur** | Client qui achète du plastique |
| **Collecte** | Opération de réception de plastique auprès d'un apporteur |
| **Acompte** | Paiement partiel obligatoire pour les commandes à distance |
| **Solde** | Paiement restant dû |
| **Use Case** | Scénario métier (logique d'application) |
| **Repository** | Interface d'accès aux données |
| **DTO** | Data Transfer Object (objet de transfert) |

---

*Dernière mise à jour : Mars 2026*
