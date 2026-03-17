# GesClient Proplast - Documentation Complète

> API REST de gestion opérationnelle pour une entreprise de collecte et vente de plastique
> 
> **Dernière mise à jour :** Mars 2026

---

## Table des Matières

1. [Projet](#1-projet--contexte)
2. [Architecture](#2-architecture)
3. [Technologies](#3-technologies)
4. [Modèle de Données](#4-modèle-de-données)
5. [Acteurs et Permissions](#5-acteurs-et-permissions)
6. [Processus Métier](#6-processus-métier)
7. [API Endpoints](#7-api-endpoints)
8. [Sécurité](#8-sécurité)
9. [Installation](#9-installation--démarrage)
10. [Tests](#10-tests)
11. [Diagrammes UML](#11-diagrammes-uml)

---

## 1. Projet / Contexte

### 1.1 Description

**GesClient** est une API REST built avec **NestJS** pour la gestion opérationnelle d'une entreprise de collecte et vente de plastique (Proplast). Elle gère l'ensemble du cycle commercial :

- **Clients** : Apporteurs (fournisseurs de plastique) et Acheteurs
- **Collectes** : Réception de plastique auprès des apporteurs
- **Commandes** : Ventes aux acheteurs avec gestion des paiements
- **Factures** : Génération PDF et envoi par WhatsApp
- **Paiements** : Acomptes et soldes
- **Notifications** : Alertes en temps réel
- **Audit** : Traçabilité complète des actions

### 1.2 Caractéristiques principales

| Caractéristique | Détail |
|----------------|--------|
| **API Prefix** | `/api/v1` |
| **Swagger UI** | `http://localhost:3000/api/docs` |
| **Authentification** | JWT + Refresh Tokens |
| **Base de données** | PostgreSQL |
| **Architecture** | Clean Architecture / DDD |
| **Cache** | Redis |
| **Rate Limiting** | Activé (throttler) |

---

## 2. Architecture

### 2.1 Structure Clean Architecture

```
src/
├── domain/              # Entités, Enums, Exceptions, Ports (Interfaces)
├── application/         # Use Cases (Logique métier)
├── infrastructure/      # Implémentations (Prisma, Services)
└── presentation/       # Controllers & DTOs (API REST)
```

### 2.2 Flux de données

```
Request → Controller → Use Case → Repository → Prisma → PostgreSQL
              ↓
         Entity/DTO
```

### 2.3 Structure détaillée des dossiers

```
src/
├── main.ts                                    # Point d'entrée
├── app.module.ts                             # Module principal
│
├── application/                               # Couche Application (Use Cases)
│   ├── auth/
│   │   ├── login.use-case.ts
│   │   ├── login.use-case.spec.ts            # Test unitaire
│   │   ├── logout.use-case.ts
│   │   ├── refresh-token.use-case.ts
│   │   └── get-profile.use-case.ts
│   ├── clients/
│   │   ├── get-clients.use-case.ts
│   │   ├── get-client-by-id.use-case.ts
│   │   ├── create-client.use-case.ts
│   │   ├── update-client.use-case.ts
│   │   ├── delete-client.use-case.ts
│   │   ├── import-clients.use-case.ts
│   │   ├── export-clients.use-case.ts
│   │   └── export-clients-excel.use-case.ts
│   │   └── export-clients-template.use-case.ts
│   ├── commandes/
│   │   ├── create-commande.use-case.ts
│   │   ├── get-commandes.use-case.ts
│   │   ├── get-commande-by-id.use-case.ts
│   │   ├── add-paiement.use-case.ts
│   │   ├── change-statut.use-case.ts
│   │   └── change-statut.use-case.spec.ts   # Test unitaire
│   ├── collectes/
│   │   ├── create-collecte.use-case.ts
│   │   ├── get-collectes.use-case.ts
│   │   ├── get-collecte-by-id.use-case.ts
│   │   └── get-collectes-stats.use-case.ts
│   ├── factures/
│   │   ├── generate-facture.use-case.ts
│   │   ├── get-facture-pdf.use-case.ts
│   │   └── send-facture-whatsapp.use-case.ts
│   ├── notifications/
│   │   ├── get-notifications.use-case.ts
│   │   └── mark-as-read.use-case.ts
│   ├── stats/
│   │   └── get-dashboard.use-case.ts
│   └── audit/
│       └── get-audit-logs.use-case.ts
│
├── domain/                                   # Couche Métier
│   ├── entities/                             # Classes métier
│   │   ├── user.entity.ts
│   │   ├── client.entity.ts
│   │   ├── commande.entity.ts
│   │   ├── commande.entity.spec.ts          # Test unitaire
│   │   ├── commande-item.entity.ts
│   │   ├── collecte.entity.ts
│   │   ├── collecte.entity.spec.ts          # Test unitaire
│   │   ├── collecte-item.entity.ts
│   │   ├── paiement.entity.ts
│   │   ├── facture.entity.ts
│   │   ├── notification.entity.ts
│   │   ├── refresh-token.entity.ts
│   │   └── audit-log.entity.ts
│   ├── enums/                                # Constantes
│   │   ├── role.enum.ts
│   │   ├── client-type.enum.ts
│   │   ├── client-statut.enum.ts
│   │   ├── commande-type.enum.ts
│   │   ├── commande-statut.enum.ts
│   │   ├── paiement-type.enum.ts
│   │   ├── mode-paiement.enum.ts
│   │   ├── facture-type.enum.ts
│   │   ├── facture-statut.enum.ts
│   │   ├── notification-type.enum.ts
│   │   └── audit-action.enum.ts
│   ├── exceptions/                           # Exceptions métier
│   │   ├── invalid-credentials.exception.ts
│   │   ├── client-not-found.exception.ts
│   │   ├── client-already-exists.exception.ts
│   │   ├── commande-not-found.exception.ts
│   │   ├── commande-statut-invalide.exception.ts
│   │   └── acompte-insuffisant.exception.ts
│   └── ports/                                # Interfaces
│       ├── repositories/                      # Ports de données
│       │   ├── user.repository.ts
│       │   ├── client.repository.ts
│       │   ├── commande.repository.ts
│       │   ├── collecte.repository.ts
│       │   ├── paiement.repository.ts
│       │   ├── facture.repository.ts
│       │   ├── notification.repository.ts
│       │   ├── refresh-token.repository.ts
│       │   ├── stats.repository.ts
│       │   └── audit-log.repository.ts
│       └── services/                          # Ports de services
│           ├── hash.service.ts
│           ├── token.service.ts
│           └── whatsapp.service.ts
│
├── infrastructure/                           # Couche Infrastructure
│   ├── database/
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts
│   │   └── repositories/                     # Implémentations Prisma
│   │       ├── prisma-user.repository.ts
│   │       ├── prisma-client.repository.ts
│   │       ├── prisma-commande.repository.ts
│   │       ├── prisma-collecte.repository.ts
│   │       ├── prisma-paiement.repository.ts
│   │       ├── prisma-facture.repository.ts
│   │       ├── prisma-notification.repository.ts
│   │       ├── prisma-refresh-token.repository.ts
│   │       ├── prisma-audit-log.repository.ts
│   │       └── prisma-stats.repository.ts
│   ├── services/
│   │   ├── jwt-token.service.ts
│   │   ├── bcrypt-hash.service.ts
│   │   ├── token-blacklist.service.ts
│   │   ├── pdf-generator.service.ts
│   │   ├── whatsapp.service.ts
│   │   └── file-storage.service.ts
│   └── filters/
│       └── domain-exception.filter.ts
│
└── presentation/                            # Couche Présentation (API)
    ├── auth/
    │   ├── auth.controller.ts
    │   ├── auth.module.ts
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts
    │   │   ├── jwt.strategy.ts
    │   │   ├── roles.decorator.ts
    │   │   └── roles.guard.ts
    │   └── dto/
    ├── clients/
    │   ├── clients.controller.ts
    │   ├── clients.module.ts
    │   └── dto/
    ├── commandes/
    │   ├── commandes.controller.ts
    │   ├── commandes.module.ts
    │   └── dto/
    ├── collectes/
    │   ├── collectes.controller.ts
    │   ├── collectes.module.ts
    │   └── dto/
    ├── factures/
    │   ├── factures.controller.ts
    │   ├── factures.module.ts
    │   └── dto/
    ├── notifications/
    ├── stats/
    └── audit/
```

---

## 3. Technologies

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| Framework | NestJS | 11.0.1 |
| Langage | TypeScript | 5.7.3 |
| Base de données | PostgreSQL | 14+ |
| ORM | Prisma | 7.4.2 |
| Authentification | JWT + Refresh Tokens | - |
| Validation | class-validator | 0.15.1 |
| Documentation | Swagger/OpenAPI | - |
| Excel | xlsx | 0.18.5 |
| PDF | pdfmake | 0.2.16 |
| WhatsApp | Meta Cloud API | - |
| Cache | Redis + cache-manager | - |
| Rate Limiting | @nestjs/throttler | 6.5.0 |
| Hash | bcryptjs | 3.0.3 |

---

## 4. Modèle de Données

### 4.1 Schéma de Base de Données

#### Enums

```typescript
enum Role {
  DIRECTEUR    // Responsable de l'entreprise - Accès complet
  COMMERCIAL  // Vendeur terrain - Gestion clients et commandes
  COLLECTEUR  // Responsable des collectes - Enregistrement collectes
}

enum ClientType {
  APPORTEUR   // Fournisseur de matériaux (plastique)
  ACHETEUR    // Client qui achète des produits
}

enum ClientStatut {
  ACTIF       // Client actif
  PROSPECT    // Potentiel client
  INACTIF     // Client inactif
}

enum CommandeType {
  SUR_PLACE   // Commandé retiré sur place (pas de TVA)
  A_DISTANCE  // Commande livrée (TVA 20%, acompt 50%)
}

enum CommandeStatut {
  EN_ATTENTE_ACOMPTE  // En attente du paiement de l'acompte
  EN_PREPARATION      // Commande en cours de préparation
  PRETE               // Commande prête à être livrée/retirée
  FINALISEE           // Commande terminée et payée
}

enum PaiementType {
  ACOMPTE   // Acompte initial
  SOLDE     // Paiement du reste
}

enum ModePaiement {
  ESPECES      // Paiement en espèces
  VIREMENT     // Virement bancaire
  CHEQUE       // Paiement par chèque
  MOBILE_MONEY // Paiement par mobile money
}

enum FactureType {
  PROFORMA     // Facture proforma (avant paiement complet)
  DEFINITIVE   // Facture définitive (après paiement)
}

enum FactureStatut {
  GENEREE    // Facture générée
  ENVOYEE    // Envoyée par WhatsApp
  TELECHARGE // Téléchargée par le client
}

enum NotificationType {
  NOUVELLE_COLLECTE    // Nouvelle collecte enregistrée
  ACOMPTE_RECU         // Acompte reçu sur une commande
  COMMANDE_PRETE       // Commande prête
  COMMANDE_FINALISEE   // Commande finalisée
  IMPORT_TERMINE       // Import de clients terminé
  COMMANDE_EN_ATTENTE  // Commande en attente
}

enum AuditAction {
  CREATE    // Création d'une entité
  UPDATE    // Modification d'une entité
  DELETE    // Suppression d'une entité
  LOGIN     // Connexion utilisateur
  IMPORT    // Import de données
  EXPORT    // Export de données
}
```

#### Entités

##### User (Utilisateur)

```typescript
class User {
  id: string;           // UUID unique
  nom: string;          // Nom de famille
  prenom: string;       // Prénom
  email: string;        // Email professionnel (unique)
  password: string;     // Mot de passe hashé (bcrypt)
  role: Role;           // DIRECTEUR | COMMERCIAL | COLLECTEUR
  actif: boolean;       // Statut du compte
  createdAt: Date;
  updatedAt: Date;
}
```

##### Client

```typescript
class Client {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;       // Unique
  telephone?: string;
  adresse?: string;
  type: ClientType;     // APPORTEUR | ACHETEUR
  statut: ClientStatut; // ACTIF | PROSPECT | INACTIF
  totalRevenue: number; // Revenue total généré (pour les acheteurs)
  notes?: string;
  assignedUserId?: string; // Commercial assigné
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;     // Soft delete
}
```

##### Commande

```typescript
class Commande {
  id: string;
  reference: string;           // Unique (auto-générée: CMD-2026-0001)
  type: CommandeType;          // SUR_PLACE | A_DISTANCE
  statut: CommandeStatut;      // EN_ATTENTE_ACOMPTE | EN_PREPARATION | PRETE | FINALISEE
  acheteurId: string;          // ID du client acheteur
  produit?: string;            // Ancien système - un seul produit
  quantite?: number;
  prixUnitaire?: number;
  montantHT: number;           // Montant hors taxes
  tva: number;                 // TVA (20% pour A_DISTANCE, 0 pour SUR_PLACE)
  montantTTC: number;          // Montant toutes taxes comprises
  acomteMinimum: number | null; // Acompte minimum requis (50% pour A_DISTANCE)
  acomteVerse: number;        // Montant de l'acompte versé
  soldeRestant: number;        // Solde à payer
  commercialId: string;        // Commercial responsable
  createdAt: Date;
  updatedAt: Date;
}
```

##### CommandeItem (Nouveau système - plusieurs produits)

```typescript
class CommandeItem {
  id: string;
  commandeId: string;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  createdAt: Date;
}
```

##### Collecte

```typescript
class Collecte {
  id: string;
  apporteurId: string;      // ID du client apporteur
  quantiteKg?: number;      // Ancien système - un seul type
  prixUnitaire?: number;
  montantTotal: number;     // Montant total (quantité × prix)
  notes?: string;
  collecteurId: string;    // ID du collecteur
  createdAt: Date;
}
```

##### CollecteItem (Nouveau système - plusieurs types de plastiques)

```typescript
class CollecteItem {
  id: string;
  collecteId: string;
  typePlastique: string;   // Type de plastique
  quantiteKg: number;
  prixUnitaire: number;
  createdAt: Date;
}
```

##### Paiement

```typescript
class Paiement {
  id: string;
  commandeId: string;
  type: PaiementType;      // ACOMPTE | SOLDE
  montant: number;
  modePaiement: ModePaiement;
  valideParId: string;      // Utilisateur qui a validé
  createdAt: Date;
}
```

##### Facture

```typescript
class Facture {
  id: string;
  numero: string;              // Unique (PROF-2026-0001 ou FAC-2026-0001)
  type: FactureType;            // PROFORMA | DEFINITIVE
  commandeId: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  fichierBlob?: Buffer;         // PDF stocké en base (PostgreSQL BYTEA)
  fichierPath?: string;         // Chemin du fichier si stocké sur disque
  statut: FactureStatut;        // GENEREE | ENVOYEE | TELECHARGE
  envoyeeWhatsApp: boolean;
  dateEnvoiWhatsApp?: Date;
  telephoneEnvoye?: string;
  downloadToken?: string;       // Token de téléchargement usage unique
  downloadTokenExpiresAt?: Date;
  genereParId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

##### Notification

```typescript
class Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  lu: boolean;                  // Lu ou non
  lien?: string;               // Lien vers l'élément concerné
  clientId?: string;
  commandeId?: string;
  createdAt: Date;
}
```

##### AuditLog

```typescript
class AuditLog {
  id: string;
  userId: string;
  action: AuditAction;         // CREATE | UPDATE | DELETE | LOGIN | IMPORT | EXPORT
  entite: string;              // Nom de l'entité (Client, Commande, etc.)
  entiteId: string;
  ancienneValeur?: JSON;
  nouvelleValeur?: JSON;
  description?: string;        // Description de l'action
  createdAt: Date;
}
```

##### RefreshToken

```typescript
class RefreshToken {
  id: string;
  token: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}
```

---

## 5. Acteurs et Permissions

### 5.1 Tableau des rôles

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **DIRECTEUR** | Responsable de l'entreprise | Accès complet, peut voir toutes les données, supprimer des clients, consulter les audits |
| **COMMERCIAL** | Vendeur terrain | Gère les clients et commandes, enregistre les paiements, génère des factures |
| **COLLECTEUR** | Responsable des collectes | Enregistre les collectes de matériaux, voit ses propres statistiques |

### 5.2 Fonctionnalités par acteur

#### Directeur

| Fonctionnalité | Description |
|----------------|-------------|
| **Dashboard** | Consultation des statistiques globales (ventes, collectes, revenus) |
| **Gestion Clients** | Consultation, création, modification, suppression de clients |
| **Gestion Commandes** | Consultation de toutes les commandes |
| **Gestion Collectes** | Consultation de toutes les collectes |
| **Gestion Factures** | Consultation des factures générées, envoi WhatsApp |
| **Audit** | Consultation des journaux d'audit de toutes les actions |
| **Statistiques** | Dashboard complet avec indicateurs clés |

#### Commercial

| Fonctionnalité | Description |
|----------------|-------------|
| **Gestion Clients** | Consultation, création, modification des clients assignés |
| **Gestion Commandes** | Création, consultation, modification du statut des commandes |
| **Paiements** | Enregistrement des acomptes et soldes |
| **Factures** | Génération de factures proforma/définitives, envoi par WhatsApp |
| **Notifications** | Réception de notifications pour les événements clés |
| **Export** | Export CSV/Excel des clients |

#### Collecteur

| Fonctionnalité | Description |
|----------------|-------------|
| **Gestion Collectes** | Création, consultation des collectes effectuées |
| **Gestion Apporteurs** | Création d'apporteurs à la volée |
| **Statistiques** | Consultation de ses propres statistiques de collecte |
| **Notifications** | Réception de notifications pour les nouvelles collectes |

---

## 6. Processus Métier

### 6.1 Authentification

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Utilisateur │────▶│  /auth/login │────▶│  JWT Token  │
│             │     │             │     │  + Refresh  │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Processus :**
1. L'utilisateur envoie ses identifiants (email + password)
2. Le système vérifie les credentials
3. Si valides, retourne un **access_token** (15 min) et un **refresh_token** (7 jours)
4. L'access_token expire après 15 minutes
5. Le refresh_token permet d'obtenir un nouveau access_token

**Déconnexion :**
- Le refresh token est révoqué
- L'utilisateur est déconnecté

### 6.2 Gestion des Clients

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Création   │────▶│  Modification│────▶│  Suppression│
│  Client    │     │   Client    │     │   (Directeur│
└─────────────┘     └─────────────┘     │    seul)    │
                                          └─────────────┘
```

**Import de Clients :**
1. Le commercial télécharge un fichier Excel
2. Le système lit et valide les données
3. Les clients sont créés ou mis à jour (par email)
4. Une notification est envoyée à la fin
5. Un log d'audit est créé

**Export de Clients :**
- Export CSV ou Excel avec filtres possibles (type, statut)

### 6.3 Gestion des Commandes

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Création      │────▶│  Envoi         │────▶│  Préparation   │
│  Commande      │     │  Acompte       │     │  Commande      │
└────────────────┘     └────────────────┘     └────────────────┘
                                                      │
                                    ┌────────────────┐ │
                                    │  Paiement      │◀────┘
                                    │  Solde         │
                                    └────────────────┘
                                            │
                                    ┌────────────────┐
                                    │  Finalisation  │
                                    │  Commande      │
                                    └────────────────┘
```

**Création d'une Commande :**
1. Le commercial sélectionne un acheteur (ou crée un nouveau)
2. Il saisit les produits (nouveau système avec items ou ancien système)
3. Le système calcule :
   - `montantHT = Σ(quantite × prixUnitaire)`
   - `tva = 20% du montantHT` (si A_DISTANCE, sinon 0)
   - `montantTTC = montantHT + tva`
   - `acompteMinimum = 50% du montantTTC` (si A_DISTANCE, sinon null)
4. La commande est créée avec le statut initial

**Statuts et transitions :**
| Statut actuel | Transition possible |
|--------------|---------------------|
| EN_ATTENTE_ACOMPTE | → EN_PREPARATION (après acompte ≥ minimum) |
| EN_PREPARATION | → PRETE |
| PRETE | → FINALISEE (après paiement complet) |
| FINALISEE | (terminal) |

### 6.4 Gestion des Paiements

**Enregistrement d'un Paiement :**
1. Le commercial enregistre le paiement
2. Si c'est un acompte : vérifie que le montant ≥ acompteminimum
3. Met à jour `acompteVerse` et `soldeRestant`
4. Met à jour le statut selon les règles

**Génération automatique de factures :**

| Moment | Type de facture générée |
|--------|------------------------|
| Paiement SUR_PLACE (complet) | **Définitive** |
| Paiement A_DISTANCE acompt < 100% | **Proforma** |
| Paiement A_DISTANCE acompt = 100% | **Définitive** |
| Paiement Solde (A_DISTANCE) | **Définitive** |

### 6.5 Gestion des Collectes

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Sélection  │────▶│  Saisie     │────▶│  Calcul     │
│  Apporteur  │     │  Quantité   │     │  Montant    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Enregistrement d'une Collecte :**
1. Le collecteur sélectionne un apporteur (ou crée un nouveau)
2. Il saisit les types de plastiques et quantités
3. Le système calcule : `montantTotal = Σ(quantiteKg × prixUnitaire)`
4. La collecte est enregistrée
5. Le directeur est notifié

### 6.6 Génération des Factures PDF

**Format des numéros de facture :**
- Proforma : `PROF-2026-A1B2C3D4`
- Définitive : `FAC-2026-E5F6G7H8`

**Structure du PDF :**
- En-tête (logo, titre, numéro, date)
- Informations client
- Tableau des produits
- Totaux (HT, TVA, TTC)
- Pied de page

### 6.7 Envoi par WhatsApp

```
Utilisateur clique "Envoyer WhatsApp"
  → Récupérer numéro client
  → Générer PDF si pas existant
  → Appeler API WhatsApp Meta
  → Mettre à jour Facture: envoyeeWhatsApp = true
```

**Message WhatsApp :**
```
Bonjour {nom_client},

Votre {type_facture} N°{numero_facture} d'un montant de {montant} FCFA est disponible.

Merci pour votre confiance!
{Entreprise}
```

---

## 7. API Endpoints

### 7.1 Authentification

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/auth/login` | Connexion utilisateur | Public |
| POST | `/auth/refresh` | Rafraîchir le token | Public |
| POST | `/auth/logout` | Déconnexion | Auth |
| GET | `/auth/me` | Profil utilisateur | Auth |

### 7.2 Clients

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/clients` | Lister les clients (pagination, filtres) | Auth |
| GET | `/clients/:id` | Détail d'un client | Auth |
| POST | `/clients` | Créer un client | Auth |
| PATCH | `/clients/:id` | Modifier un client | Auth |
| DELETE | `/clients/:id` | Supprimer un client | DIRECTEUR |
| POST | `/clients/import` | Importer depuis Excel | Auth |
| GET | `/clients/export` | Exporter en CSV | Auth |
| GET | `/clients/export/excel` | Exporter en Excel | Auth |
| GET | `/clients/template` | Télécharger template Excel | Auth |

**Paramètres de filtrage pour /clients :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Résultats par page (défaut: 10)
- `search` : Recherche par nom ou email
- `type` : Filtrer par type (APPORTEUR, ACHETEUR)
- `statut` : Filtrer par statut (ACTIF, PROSPECT, INACTIF)

### 7.3 Commandes

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/commandes` | Créer une commande | COMMERCIAL |
| GET | `/commandes` | Lister les commandes | COMMERCIAL, DIRECTEUR |
| GET | `/commandes/:id` | Détail d'une commande | COMMERCIAL, DIRECTEUR |
| POST | `/commandes/:id/paiements` | Enregistrer un paiement | COMMERCIAL |
| PATCH | `/commandes/:id/statut` | Changer le statut | COMMERCIAL |

**Paramètres de filtrage pour /commandes :**
- `page`, `limit` : Pagination
- `search` : Recherche par référence ou produit
- `statut` : Filtrer par statut
- `type` : Filtrer par type (SUR_PLACE, A_DISTANCE)
- `dateDebut`, `dateFin` : Filtrer par date

### 7.4 Collectes

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/collectes` | Enregistrer une collecte | COLLECTEUR |
| GET | `/collectes` | Lister les collectes | COLLECTEUR, DIRECTEUR |
| GET | `/collectes/:id` | Détail d'une collecte | COLLECTEUR, DIRECTEUR |
| GET | `/collectes/stats` | Statistiques des collectes | COLLECTEUR, DIRECTEUR |

**Paramètres de filtrage pour /collectes :**
- `page`, `limit` : Pagination
- `search` : Recherche par nom d'apporteur
- `dateDebut`, `dateFin` : Filtrer par date

### 7.5 Factures

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/factures` | Liste paginée des factures | COMMERCIAL, DIRECTEUR |
| POST | `/factures/commandes/:commandeId/facture/proforma` | Générer proforma | COMMERCIAL, DIRECTEUR |
| POST | `/factures/commandes/:commandeId/facture/definitive` | Générer définitive | COMMERCIAL, DIRECTEUR |
| GET | `/factures/:id/pdf` | Télécharger le PDF | COMMERCIAL, DIRECTEUR, Token externe |
| POST | `/factures/:id/envoyer-whatsapp` | Envoyer par WhatsApp | COMMERCIAL, DIRECTEUR |

### 7.6 Notifications

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/notifications` | Liste des notifications | Auth |
| PATCH | `/notifications/:id/read` | Marquer comme lu | Auth |
| PATCH | `/notifications/read-all` | Tout marquer comme lu | Auth |

### 7.7 Statistiques

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/stats/dashboard` | Dashboard du directeur | DIRECTEUR |

### 7.8 Audit

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/audit` | Journaux d'audit | DIRECTEUR |

**Paramètres de filtrage pour /audit :**
- `page`, `limit` : Pagination
- `userId` : Filtrer par utilisateur
- `action` : Filtrer par type d'action (CREATE, UPDATE, DELETE, LOGIN, IMPORT, EXPORT)
- `entite` : Filtrer par entité (Client, Commande, etc.)
- `dateDebut`, `dateFin` : Filtrer par date

---

## 8. Sécurité

### 8.1 Authentification

- **JWT (JSON Web Tokens)** pour l'authentification sans état
- **Access Token** : Durée de vie courte (15 minutes)
- **Refresh Token** : Durée de vie longue (7 jours), stocké en base avec hash
- **Token Blacklist** : Les tokens révoqués sont blacklistés

### 8.2 Autorisation

- **RBAC (Role-Based Access Control)** basé sur les rôles
- Guards JWT pour vérifier la validité des tokens
- Guards Roles pour vérifier les permissions

### 8.3 Protection des données

- **Mot de passe** : Hashé avec bcrypt (salt rounds: 10)
- **Refresh tokens** : Hashés avant stockage en base
- **Audit** : Toutes les actions sensibles sont journalisées
- **Rate Limiting** : Limitation des requêtes (100 requêtes/10 secondes par défaut)

### 8.4 Exceptions de sécurité

| Exception | Description |
|-----------|-------------|
| `InvalidCredentialsException` | Email ou mot de passe incorrect |
| `ClientNotFoundException` | Client introuvable |
| `ClientAlreadyExistsException` | Client déjà existant (email) |
| `CommandeNotFoundException` | Commande introuvable |
| `CommandeStatutInvalideException` | Transition de statut invalide |
| `AcompteInsuffisantException` | Montant de l'acompte insuffisant |

---

## 9. Installation / Démarrage

### 9.1 Prérequis

- Node.js 20+
- PostgreSQL 14+
- Redis (pour le cache)
- npm ou yarn

### 9.2 Variables d'environnement (.env)

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/gesclient

# JWT
JWT_SECRET=votre_secret_jwt_très_long_et_complexe

# Application
PORT=3000
APP_URL=http://localhost:3000

# Redis (Cache)
REDIS_HOST=localhost
REDIS_PORT=6379

# WhatsApp Business
WHATSAPP_BUSINESS_PHONE=221771234567
```

### 9.3 Commandes

```bash
# Installation des dépendances
npm install

# Génération du client Prisma
npx prisma generate

# Migration de la base de données
npx prisma migrate dev

# Démarrage en mode développement
npm run start:dev

# Démarrage en mode production
npm run build
npm run start:prod

# Démarrage avec Docker
docker-compose up --build

# Tests
npm run test
npm run test:cov
npm run test:watch
```

### 9.4 Accès Swagger

Une fois l'application démarrée :
- **Swagger UI** : `http://localhost:3000/api/docs`
- **JSON OpenAPI** : `http://localhost:3000/api/docs-json`

---

## 10. Tests

### 10.1 Identifiants de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Directeur | directeur@proplast.com | Test1234! |
| Commercial | commercial@proplast.com | Test1234! |
| Collecteur | collecteur@proplast.com | Test1234! |

### 10.2 Couverture des tests

#### Tests unitaires (.spec.ts)

| Fichier | Description |
|---------|-------------|
| `login.use-case.spec.ts` | Test de l'authentification |
| `change-statut.use-case.spec.ts` | Test des transitions de statut |
| `commande.entity.spec.ts` | Test de la logique métier Commande |
| `collecte.entity.spec.ts` | Test de la logique métier Collecte |
| `app.controller.spec.ts` | Test du controller principal |

#### Tests E2E

Configuration disponible dans `test/jest-e2e.json`

### 10.3 Résumé des tests

| Catégorie | Status |
|-----------|--------|
| Authentification | ✅ Tests unitaires |
| Clients | ✅ Tests fonctionnels |
| Commandes | ✅ Tests unitaires (transitions strictes) |
| Collectes | ✅ Tests unitaires |
| Factures | ✅ Implémenté |
| Notifications | ✅ Fonctionnel |
| Audit | ✅ Complet |
| Dashboard | ✅ Disponible pour Directeur |

---

## 11. Diagrammes UML

> Voir le fichier [`DIAGRAMMES.md`](DIAGRAMMES.md) pour les diagrammes PlantUML complets.

### 11.1 Diagrammes de Cas d'Utilisation

- **Directeur** : Gestion complète (clients, commandes, collectes, factures, audits, dashboard)
- **Commercial** : Gestion clients, commandes, paiements, factures
- **Collecteur** : Gestion collectes, apporteurs, statistiques

### 11.2 Diagramme de Classes

Modèle complet avec toutes les entités, énumérations et relations

### 11.3 Diagrammes de Séquence

1. **Authentification** - Login complet avec refresh token
2. **Commande** - Création + Paiements avec calculs (HT, TVA, acomptes)
3. **Collecte** - Création avec multi-types de plastiques

---

## Annexe : Commandes cURL

```bash
# Variables
BASE_URL=http://localhost:3000/api/v1

# Login
curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"directeur@proplast.com","password":"Test1234!"}'

# Lister clients
curl -s -X GET "$BASE_URL/clients?page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"

# Créer commande
curl -s -X POST $BASE_URL/commandes \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type":"SUR_PLACE","acheteurId":"<ID>","produit":"Test","quantite":10,"prixUnitaire":100}'

# Ajouter paiement
curl -s -X POST $BASE_URL/commandes/<ID>/paiements \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"type":"ACOMPTE","montant":500,"modePaiement":"ESPECES"}'

# Dashboard
curl -s -X GET $BASE_URL/stats/dashboard \
  -H "Authorization: Bearer <TOKEN_DIRECTEUR>"
```

---

*Document généré à partir du code source - GesClient Proplast - Mars 2026*
