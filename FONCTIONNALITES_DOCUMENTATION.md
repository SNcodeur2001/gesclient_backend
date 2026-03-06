# Documentation Fonctionnelle - GesClient Backend

## Table des Matières

1. [Acteurs du Système](#acteurs-du-système)
2. [Fonctionnalités par Acteur](#fonctionnalités-par-acteur)
3. [Entités et Énumérations](#entités-et-énumérations)
4. [Processus Métier](#processus-métier)
5. [Endpoints API](#endpoints-api)

---

## 1. Acteurs du Système

Le système GesClient définit trois rôles d'utilisateurs avec des permissions spécifiques :

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **DIRECTEUR** | Responsable de l'entreprise | Accès complet, peut voir toutes les données, supprimer des clients, consulter les audits |
| **COMMERCIAL** | Vendeur terrain | Gère les clients et commandes, enregistre les paiements |
| **COLLECTEUR** | Responsable des collectes | Enregistre les collectes de matériaux |

### Structure d'un Utilisateur

```typescript
class User {
  id: string;           // UUID unique
  nom: string;           // Nom de famille
  prenom: string;       // Prénom
  email: string;        // Email professionnel
  password: string;     // Mot de passe hashé
  role: Role;           // DIRECTEUR | COMMERCIAL | COLLECTEUR
  actif: boolean;       // Statut du compte
  createdAt: Date;      // Date de création
}
```

---

## 2. Fonctionnalités par Acteur

### 2.1 DIRECTEUR

| Fonctionnalité | Description |
|----------------|-------------|
| **Dashboard** | Consultation des statistiques globales (ventes, collectes, revenus) |
| **Gestion Clients** | Consultation, création, modification, suppression de clients |
| **Gestion Commandes** | Consultation de toutes les commandes |
| **Gestion Collectes** | Consultation de toutes les collectes |
| **Audit** | Consultation des journaux d'audit de toutes les actions |

### 2.2 COMMERCIAL

| Fonctionnalité | Description |
|----------------|-------------|
| **Gestion Clients** | Consultation, création, modification des clients qui lui sont assignés |
| **Gestion Commandes** | Création, consultation, modification du statut des commandes |
| **Paiements** | Enregistrement des acomptes et soldes |
| **Notifications** | Réception de notifications pour les événements clés |

### 2.3 COLLECTEUR

| Fonctionnalité | Description |
|----------------|-------------|
| **Gestion Collectes** | Création, consultation des collectes effectuées |
| **Statistiques** | Consultation de ses propres statistiques de collecte |
| **Notifications** | Réception de notifications pour les nouvelles collectes |

---

## 3. Entités et Énumérations

### 3.1 Client

Représente un client du système (apporteur ou acheteur).

```typescript
class Client {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  type: ClientType;       // APPORTEUR | ACHETEUR
  statut: ClientStatut;   // ACTIF | PROSPECT | INACTIF
  totalRevenue: number;   // Revenue total généré
  notes?: string;
  assignedUserId?: string; // Commercial assigné
  createdAt: Date;
  deletedAt?: Date;
}
```

**Types de Client :**
- `APPORTEUR` : Fournisseur de matériaux (plastique, métal, etc.)
- `ACHETEUR` : Client qui achète des produits

**Statuts de Client :**
- `ACTIF` : Client actif
- `PROSPECT` : Potentiel client
- `INACTIF` : Client inactif

### 3.2 Commande

Représente une commande de produits.

```typescript
class Commande {
  id: string;
  reference: string;           // Référence unique (auto-générée)
  type: CommandeType;          // SUR_PLACE | A_DISTANCE
  statut: CommandeStatut;      // Statut de la commande
  acheteurId: string;          // ID du client acheteur
  produit: string;             // Nom du produit
  quantite: number;            // Quantité commandée
  prixUnitaire: number;        // Prix unitaire
  montantHT: number;           // Montant hors taxes
  tva: number;                 // TVA (20% pour A_DISTANCE)
  montantTTC: number;          // Montant toutes taxes comprises
  acompteMinimum: number | null; // Acompte minimum requis
  acompteVerse: number;       // Montant de l'acompte versé
  soldeRestant: number;        // Solde à payer
  commercialId: string;       // Commercial responsable
  createdAt: Date;
}
```

**Types de Commande :**
- `SUR_PLACE` : Commande retirée sur place (pas de TVA, pas d'acompte minimum)
- `A_DISTANCE` : Commande livrée (TVA 20%, acompte minimum 50%)

**Statuts de Commande :**
- `EN_ATTENTE_ACOMPTE` : En attente du paiement de l'acompte
- `EN_PREPARATION` : Commande en cours de préparation
- `PRETE` : Commande prête à être livrée/retirée
- `FINALISEE` : Commande terminée et payée

### 3.3 Paiement

Représente un paiement effectué pour une commande.

```typescript
class Paiement {
  id: string;
  commandeId: string;
  type: PaiementType;     // ACOMPTE | SOLDE
  montant: number;
  modePaiement: ModePaiement;
  valideParId: string;    // Utilisateur qui a validé
  createdAt: Date;
}
```

**Types de Paiement :**
- `ACOMPTE` : Acompte initial
- `SOLDE` : Paiement du reste

**Modes de Paiement :**
- `ESPECES` : Paiement en espèces
- `VIREMENT` : Virement bancaire
- `CHEQUE` : Paiement par chèque
- `MOBILE_MONEY` : Paiement par mobile money

### 3.4 Collecte

Représente une collecte de matériaux auprès d'un apporteur.

```typescript
class Collecte {
  id: string;
  apporteurId: string;    // ID du client apporteur
  quantiteKg: number;    // Quantité collectée en kg
  prixUnitaire: number;  // Prix au kg
  montantTotal: number;  // Montant total (quantité × prix)
  notes?: string;
  collecteurId: string;  // ID du collecteur
  createdAt: Date;
}
```

### 3.5 Notification

Représente une notification pour un utilisateur.

```typescript
class Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  lu: boolean;           // Lu ou non
  lien?: string;        // Lien vers l'élément concerné
  clientId?: string;
  commandeId?: string;
  createdAt: Date;
}
```

**Types de Notification :**
- `NOUVELLE_COLLECTE` : Nouvelle collecte enregistrée
- `ACOMPTE_RECU` : Acompte reçu sur une commande
- `COMMANDE_PRETE` : Commande prête
- `COMMANDE_FINALISEE` : Commande finalisée
- `IMPORT_TERMINE` : Import de clients terminé
- `COMMANDE_EN_ATTENTE` : Commande en attente

---

## 4. Processus Métier

### 4.1 Processus d'Authentification

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Utilisateur │────▶│  /auth/login │────▶│  JWT Token  │
│             │     │             │     │  + Refresh  │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Processus :**
1. L'utilisateur envoie ses identifiants (email + password)
2. Le système vérifie les credentials
3. Si valides, retourne un **access_token** et un **refresh_token**
4. L'access_token expire après 15 minutes
5. Le refresh_token permet de obtenir un nouveau access_token

**Déconnexion :**
- Les tokens sont ajoutés à une blacklist
- L'utilisateur est déconnecté

### 4.2 Processus de Gestion des Clients

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
3. Les clients sont créés ou mis à jour
4. Une notification est envoyée à la fin

**Export de Clients :**
- Export CSV ou Excel avec filtres possibles (type, statut)

### 4.3 Processus de Gestion des Commandes

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Création      │────▶│  Envoi         │────▶│  Préparation   │
│  Commande      │     │  Acompte       │     │  Commande      │
└────────────────┘     └────────────────┘     └────────────────┘
                                                      │
                        ┌────────────────┐            │
                        │  Paiement      │◀───────────┘
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
2. Il saisit le produit, quantité et prix unitaire
3. Le système calcule :
   - `montantHT = quantite × prixUnitaire`
   - `tva = 20% du montantHT` (si A_DISTANCE)
   - `montantTTC = montantHT + tva`
   - `accompteMinimum = 50% du montantTTC` (si A_DISTANCE)
4. La commande est créée avec le statut `EN_ATTENTE_ACOMPTE`

**Enregistrement d'un Paiement :**
1. Le commercial enregistre le paiement
2. Si c'est un acompte : vérifie que le montant ≥ acompteminimum
3. Met à jour `acompteVerse` et `soldeRestant`
4. Si `accompteVerse >= acomteMinimum`, passe en `EN_PREPARATION`

**Changement de Statut :**
- `EN_ATTENTE_ACOMPTE` → `EN_PREPARATION` (après acompte)
- `EN_PREPARATION` → `PRETE`
- `PRETE` → `FINALISEE` (après paiement complet)

### 4.4 Processus de Gestion des Collectes

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Sélection  │────▶│  Saisie     │────▶│  Calcul     │
│  Apporteur  │     │  Quantité   │     │  Montant    │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Enregistrement d'une Collecte :**
1. Le collecteur sélectionne un apporteur (ou crée un nouveau)
2. Il saisit la quantité en kg et le prix unitaire
3. Le système calcule : `montantTotal = quantiteKg × prixUnitaire`
4. La collecte est enregistrée

---

## 5. Endpoints API

### 5.1 Authentification

| Méthode | Endpoint | Description | Accès |
|---------|----------|--------------|-------|
| POST | [`/auth/login`](/src/presentation/auth/auth.controller.ts:40) | Connexion utilisateur | Public |
| POST | [`/auth/refresh`](/src/presentation/auth/auth.controller.ts:52) | Rafraîchir le token | Public |
| POST | [`/auth/logout`](/src/presentation/auth/auth.controller.ts:63) | Déconnexion | Auth |
| GET | [`/auth/me`](/src/presentation/auth/auth.controller.ts:84) | Profil utilisateur | Auth |

### 5.2 Clients

| Méthode | Endpoint | Description | Accès |
|---------|----------|--------------|-------|
| GET | [`/clients`](/src/presentation/clients/clients.controller.ts:68) | Lister les clients (pagination, filtres) | Auth |
| GET | [`/clients/:id`](/src/presentation/clients/clients.controller.ts:189) | Détail d'un client | Auth |
| POST | [`/clients`](/src/presentation/clients/clients.controller.ts:209) | Créer un client | Auth |
| PATCH | [`/clients/:id`](/src/presentation/clients/clients.controller.ts:231) | Modifier un client | Auth |
| DELETE | [`/clients/:id`](/src/presentation/clients/clients.controller.ts:254) | Supprimer un client | DIRECTEUR |
| POST | [`/clients/import`](/src/presentation/clients/clients.controller.ts:155) | Importer depuis Excel | Auth |
| GET | [`/clients/export`](/src/presentation/clients/clients.controller.ts:96) | Exporter en CSV | Auth |
| GET | [`/clients/export/excel`](/src/presentation/clients/clients.controller.ts:119) | Exporter en Excel | Auth |
| GET | [`/clients/template`](/src/presentation/clients/clients.controller.ts:142) | Télécharger template | Auth |

**Paramètres de filtrage pour /clients :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Résultats par page (défaut: 10)
- `search` : Recherche par nom ou email
- `type` : Filtrer par type (APPORTEUR, ACHETEUR)
- `statut` : Filtrer par statut (ACTIF, PROSPECT, INACTIF)

### 5.3 Commandes

| Méthode | Endpoint | Description | Accès |
|---------|----------|--------------|-------|
| POST | [`/commandes`](/src/presentation/commandes/commandes.controller.ts:55) | Créer une commande | COMMERCIAL |
| GET | [`/commandes`](/src/presentation/commandes/commandes.controller.ts:70) | Lister les commandes | COMMERCIAL, DIRECTEUR |
| GET | [`/commandes/:id`](/src/presentation/commandes/commandes.controller.ts:106) | Détail d'une commande | COMMERCIAL, DIRECTEUR |
| POST | [`/commandes/:id/paiements`](/src/presentation/commandes/commandes.controller.ts:121) | Enregistrer un paiement | COMMERCIAL |
| PATCH | [`/commandes/:id/statut`](/src/presentation/commandes/commandes.controller.ts:139) | Changer le statut | COMMERCIAL |

**Paramètres de filtrage pour /commandes :**
- `page`, `limit` : Pagination
- `search` : Recherche par référence ou produit
- `statut` : Filtrer par statut
- `type` : Filtrer par type (SUR_PLACE, A_DISTANCE)
- `dateDebut`, `dateFin` : Filtrer par date

### 5.4 Collectes

| Méthode | Endpoint | Description | Accès |
|---------|----------|--------------|-------|
| POST | [`/collectes`](/src/presentation/collectes/collectes.controller.ts:43) | Enregistrer une collecte | COLLECTEUR |
| GET | [`/collectes`](/src/presentation/collectes/collectes.controller.ts:59) | Lister les collectes | COLLECTEUR, DIRECTEUR |
| GET | [`/collectes/:id`](/src/presentation/collectes/collectes.controller.ts:89) | Détail d'une collecte | COLLECTEUR, DIRECTEUR |
| GET | [`/collectes/stats`](/src/presentation/collectes/collectes.controller.ts:104) | Statistiques des collectes | COLLECTEUR, DIRECTEUR |

**Paramètres de filtrage pour /collectes :**
- `page`, `limit` : Pagination
- `search` : Recherche par nom d'apporteur
- `dateDebut`, `dateFin` : Filtrer par date

### 5.5 Notifications

| Méthode | Endpoint | Description | Accès |
|---------|----------|--------------|-------|
| GET | [`/notifications`](/src/presentation/notifications/notifications.controller.ts:27) | Liste des notifications | Auth |
| PATCH | [`/notifications/:id/read`](/src/presentation/notifications/notifications.controller.ts:44) | Marquer comme lu | Auth |
| PATCH | [`/notifications/read-all`](/src/presentation/notifications/notifications.controller.ts:63) | Tout marquer comme lu | Auth |

### 5.6 Statistiques

| Méthode | Endpoint | Description | Accès |
|---------|----------|--------------|-------|
| GET | [`/stats/dashboard`](/src/presentation/stats/stats.controller.ts:19) | Dashboard du directeur | DIRECTEUR |

### 5.7 Audit

| Méthode | Endpoint | Description | Accès |
|---------|----------|--------------|-------|
| GET | [`/audit`](/src/presentation/audit/audit.controller.ts:29) | Journaux d'audit | DIRECTEUR |

**Paramètres de filtrage pour /audit :**
- `page`, `limit` : Pagination
- `userId` : Filtrer par utilisateur
- `action` : Filtrer par type d'action
- `entite` : Filtrer par entité (Client, Commande, etc.)
- `dateDebut`, `dateFin` : Filtrer par date

---

## 6. Détails des Opérations

### 6.1 Import de Clients (Excel)

Le fichier Excel doit contenir les colonnes suivantes :
- `nom` : Nom du client (obligatoire)
- `prenom` : Prénom
- `email` : Email
- `telephone` : Téléphone
- `adresse` : Adresse
- `type` : Type (APPORTEUR ou ACHETEUR)
- `notes` : Notes

**Processus :**
1. Téléversement du fichier .xlsx
2. Validation des données
3. Pour chaque ligne :
   - Si le client existe (par email), mise à jour
   - Sinon, création d'un nouveau client
4. Génération d'une notification à la fin de l'import

### 6.2 Calculs Automatiques

**Commande :**
```typescript
// Calcul de la TVA
TVA = (type === 'A_DISTANCE') ? montantHT * 0.20 : 0

// Calcul de l'acompte minimum
acompteMinimum = (type === 'A_DISTANCE') ? montantTTC * 0.50 : null

// Montant TTC
montantTTC = montantHT + TVA

// Solde restant
soldeRestant = montantTTC - acompteVerse
```

**Collecte :**
```typescript
// Montant total
montantTotal = quantiteKg * prixUnitaire
```

---

## 7. Gestion des Erreurs

Le système utilise des exceptions personnalisées pour gérer les erreurs métier :

| Exception | Description |
|-----------|-------------|
| `InvalidCredentialsException` | Email ou mot de passe incorrect |
| `ClientNotFoundException` | Client introuvable |
| `ClientAlreadyExistsException` | Client déjà existant |
| `CommandeNotFoundException` | Commande introuvable |
| `CommandeStatutInvalideException` | Transition de statut invalide |
| `AcompteInsuffisantException` | Montant de l'acompte insuffisant |

---

## 8. Sécurité

- **Authentification** : JWT (JSON Web Tokens)
- **Mot de passe** : Hashé avec bcrypt
- **Autorisations** : Basées sur les rôles (RBAC)
- **Audit** : Toutes les actions sensibles sont journalisées

---

*Document généré automatiquement à partir du code source du backend GesClient*
