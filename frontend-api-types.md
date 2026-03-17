# Structures de Données Frontend - API GesClient

> Ce fichier contient toutes les interfaces et types TypeScript nécessaires pour consommer l'API du backend.
> **NOTE: Ce fichier est ignoré par git et ne doit pas être commité.**

## Table des Matières

1. [Énumérations](#énumérations)
2. [Authentification](#authentification)
3. [Utilisateurs](#utilisateurs)
4. [Clients](#clients)
5. [Collectes](#collectes)
6. [Commandes](#commandes)
7. [Paiements](#paiements)
8. [Factures](#factures)
9. [Notifications](#notifications)
10. [Audit](#audit)
11. [Dashboard/Stats](#dashboardstats)
12. [Réponses Paginée](#réponses-paginée)

---

## Énumérations

### Role

```typescript
enum Role {
  DIRECTEUR = 'DIRECTEUR',
  COMMERCIAL = 'COMMERCIAL',
  COLLECTEUR = 'COLLECTEUR',
}
```

### ClientType

```typescript
enum ClientType {
  APPORTEUR = 'APPORTEUR',
  ACHETEUR = 'ACHETEUR',
}
```

### ClientStatut

```typescript
enum ClientStatut {
  ACTIF = 'ACTIF',
  PROSPECT = 'PROSPECT',
  INACTIF = 'INACTIF',
}
```

### CommandeType

```typescript
enum CommandeType {
  SUR_PLACE = 'SUR_PLACE',
  A_DISTANCE = 'A_DISTANCE',
}
```

### CommandeStatut

```typescript
enum CommandeStatut {
  EN_ATTENTE_ACOMPTE = 'EN_ATTENTE_ACOMPTE',
  EN_PREPARATION = 'EN_PREPARATION',
  PRETE = 'PRETE',
  FINALISEE = 'FINALISEE',
}
```

### PaiementType

```typescript
enum PaiementType {
  ACOMPTE = 'ACOMPTE',
  SOLDE = 'SOLDE',
}
```

### ModePaiement

```typescript
enum ModePaiement {
  ESPECES = 'ESPECES',
  VIREMENT = 'VIREMENT',
  CHEQUE = 'CHEQUE',
  MOBILE_MONEY = 'MOBILE_MONEY',
}
```

### FactureType

```typescript
enum FactureType {
  PROFORMA = 'PROFORMA',
  DEFINITIVE = 'DEFINITIVE',
}
```

### FactureStatut

```typescript
enum FactureStatut {
  GENEREE = 'GENEREE',
  ENVOYEE = 'ENVOYEE',
  TELECHARGE = 'TELECHARGE',
}
```

### NotificationType

```typescript
enum NotificationType {
  NOUVELLE_COLLECTE = 'NOUVELLE_COLLECTE',
  ACOMPTE_RECU = 'ACOMPTE_RECU',
  COMMANDE_PRETE = 'COMMANDE_PRETE',
  COMMANDE_FINALISEE = 'COMMANDE_FINALISEE',
  IMPORT_TERMINE = 'IMPORT_TERMINE',
  COMMANDE_EN_ATTENTE = 'COMMANDE_EN_ATTENTE',
}
```

### AuditAction

```typescript
enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
}
```

---

## Authentification

### LoginDto (Request)

```typescript
interface LoginDto {
  email: string;      // ex: 'user@proplast.com'
  password: string;   // ex: 'Test1234!'
}
```

### AuthResponseDto (Response)

```typescript
interface AuthResponseDto {
  access_token: string;   // JWT token
  refresh_token: string;   // Refresh token
  user: UserDto;
}
```

### UserDto

```typescript
interface UserDto {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
}
```

### RefreshTokenDto (Request)

```typescript
interface RefreshTokenDto {
  refresh_token: string;
}
```

### LogoutDto (Request)

```typescript
interface LogoutDto {
  refresh_token?: string;  // Optionnel
}
```

---

## Utilisateurs

### User (Entity)

```typescript
interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Clients

### CreateClientDto (Request)

```typescript
interface CreateClientDto {
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  notes?: string;
  type?: ClientType;       // Default: APPORTEUR
  statut?: ClientStatut;   // Default: PROSPECT
}
```

### UpdateClientDto (Request)

```typescript
// Tous les champs de CreateClientDto sont optionnels
type UpdateClientDto = Partial<CreateClientDto>;
```

### ClientResponseDto (Response)

```typescript
interface ClientResponseDto {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  type: ClientType;
  statut: ClientStatut;
  totalRevenue: number;
  notes: string | null;
  createdAt: Date;
  assignedTo?: AssignedUserDto;
}

interface AssignedUserDto {
  id: string;
  nom: string;
  prenom: string;
  role: Role;
}
```

### Client List Parameters (Query)

```typescript
interface ClientListParams {
  page?: number;      // Default: 1
  limit?: number;     // Default: 10
  search?: string;    // Recherche par nom ou email
  type?: ClientType;  // Filtrer par type
  statut?: ClientStatut;  // Filtrer par statut
}
```

### Import Clients (Request)

```typescript
// Content-Type: multipart/form-data
// Body: FormData avec champ 'file' (Fichier Excel .xlsx)
```

---

## Collectes

### CreateCollecteDto (Request)

```typescript
interface CreateCollecteDto {
  // Système moderne - plusieurs types de plastiques
  items?: CollecteItemDto[];
  
  // Système ancien - un seul type (compatibilité)
  apporteurId?: string;
  quantiteKg?: number;
  prixUnitaire?: number;
  
  notes?: string;
  
  // Pour création automatique d'apporteur
  apporteurInfo?: {
    nom: string;
    telephone?: string;
  };
}

interface CollecteItemDto {
  typePlastique: string;  // ex: 'Plastique PP'
  quantiteKg: number;
  prixUnitaire: number;
}
```

### CollecteResponseDto (Response)

```typescript
interface CollecteResponseDto {
  id: string;
  apporteurId: string;
  apporteur: {
    id: string;
    nom: string;
    telephone?: string;
  };
  quantiteKg: number | null;
  prixUnitaire: number | null;
  montantTotal: number;
  notes: string | null;
  collecteurId: string;
  collecteur: {
    id: string;
    nom: string;
    prenom: string;
  };
  items?: CollecteItemResponse[];
  createdAt: Date;
}

interface CollecteItemResponse {
  id: string;
  typePlastique: string;
  quantiteKg: number;
  prixUnitaire: number;
}
```

### Collecte List Parameters (Query)

```typescript
interface CollecteListParams {
  page?: number;
  limit?: number;
  search?: string;     // Recherche par nom d'apporteur
  dateDebut?: string;  // Format: 'YYYY-MM-DD'
  dateFin?: string;    // Format: 'YYYY-MM-DD'
}
```

### CollecteStats (Response)

```typescript
// Structure définie dans le dashboard
```

---

## Commandes

### CreateCommandeDto (Request)

```typescript
interface CreateCommandeDto {
  type: CommandeType;
  
  // Acheteur existant (par ID)
  acheteurId?: string;
  
  // Ou création rapide d'acheteur
  acheteurInfo?: {
    nom: string;
    email?: string;
    telephone?: string;
  };
  
  // Système moderne - plusieurs produits
  items?: CommandeItemDto[];
  
  // Système ancien - un seul produit (compatibilité)
  produit?: string;
  quantite?: number;
  prixUnitaire?: number;
}

interface CommandeItemDto {
  produit: string;      // ex: 'Granulés PEHD'
  quantite: number;
  prixUnitaire: number;
}
```

### ChangeStatutDto (Request)

```typescript
interface ChangeStatutDto {
  statut: CommandeStatut;
}
```

### CommandeResponseDto (Response)

```typescript
interface CommandeResponseDto {
  id: string;
  reference: string;
  type: CommandeType;
  statut: CommandeStatut;
  acheteurId: string;
  acheteur: {
    id: string;
    nom: string;
    telephone?: string;
  };
  // Système ancien
  produit?: string;
  quantite?: number;
  prixUnitaire?: number;
  
  // Montants
  montantHT: number;
  tva: number;
  montantTTC: number;
  acompteMinimum: number | null;
  acompteVerse: number;
  soldeRestant: number;
  
  // Système moderne
  items?: CommandeItemResponse[];
  
  // Relations
  paiements?: PaiementResponse[];
  
  commercialId: string;
  commercial: {
    id: string;
    nom: string;
    prenom: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

interface CommandeItemResponse {
  id: string;
  produit: string;
  quantite: number;
  prixUnitaire: number;
}
```

### Commande List Parameters (Query)

```typescript
interface CommandeListParams {
  page?: number;
  limit?: number;
  search?: string;      // Recherche par référence ou produit
  statut?: CommandeStatut;
  type?: CommandeType;
  dateDebut?: string;   // Format: 'YYYY-MM-DD'
  dateFin?: string;     // Format: 'YYYY-MM-DD'
}
```

---

## Paiements

### CreatePaiementDto (Request)

```typescript
interface CreatePaiementDto {
  type: PaiementType;      // ACOMPTE ou SOLDE
  montant: number;
  modePaiement: ModePaiement;
}
```

### PaiementResponse (Response)

```typescript
interface PaiementResponse {
  id: string;
  commandeId: string;
  type: PaiementType;
  montant: number;
  modePaiement: ModePaiement;
  valideParId: string;
  validePar: {
    id: string;
    nom: string;
    prenom: string;
  };
  createdAt: Date;
}
```

---

## Factures

### GenerateFactureDto (Response)

```typescript
interface GenerateFactureResponse {
  id: string;
  numero: string;
  type: FactureType;
  montantTTC: number;
}
```

### FactureResponse (Response)

```typescript
interface FactureResponse {
  id: string;
  numero: string;
  type: FactureType;
  commandeId: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  statut: FactureStatut;
  envoyeeWhatsApp: boolean;
  dateEnvoiWhatsApp?: Date;
  telephoneEnvoye?: string;
  genereParId: string;
  generePar: {
    id: string;
    nom: string;
    prenom: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### FacturePaginationDto (Query)

```typescript
interface FacturePaginationDto {
  page?: number;   // Default: 1
  limit?: number;  // Default: 20, Max: 100
}
```

### Facture List Response

```typescript
interface FactureListResponse {
  data: FactureResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### SendFactureWhatsApp (Response)

```typescript
interface SendFactureWhatsAppResponse {
  success: boolean;
  message: string;
}
```

---

## Notifications

### NotificationResponseDto (Response)

```typescript
interface NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  lu: boolean;
  lien?: string;
  clientId?: string;
  commandeId?: string;
  createdAt: Date;
}
```

### Notification List Parameters (Query)

```typescript
interface NotificationListParams {
  lu?: boolean;  // true = lues, false = non lues, undefined = toutes
}
```

### MarkAsRead Response

```typescript
interface MarkAsReadResponse {
  success: boolean;
  message: string;  // ex: 'Notification marquée comme lue'
}

interface MarkAllAsReadResponse {
  success: boolean;
  message: string;  // ex: '5 notification(s) marquée(s) comme lue(s)'
}
```

---

## Audit

### AuditLogResponseDto (Response)

```typescript
interface AuditLogResponseDto {
  id: string;
  userId: string;
  action: AuditAction;
  entite: string;         // ex: 'Client', 'Commande', etc.
  entiteId: string;
  ancienneValeur?: object;
  nouvelleValeur?: object;
  createdAt: Date;
}
```

### Audit Log List Parameters (Query)

```typescript
interface AuditLogListParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: AuditAction;
  entite?: string;      // ex: 'Client', 'Commande', etc.
  dateDebut?: string;
  dateFin?: string;
}
```

---

## Dashboard/Stats

### DashboardResponse

```typescript
interface DashboardResponse {
  collecte: {
    tonnageMois: number;
    montantMois: number;
    variationMois: string;  // ex: '+15.5%'
  };
  commercial: {
    chiffreAffairesMois: number;
    commandesEnCours: number;
    enAttenteAcompte: number;
    variationMois: string;
  };
  clients: {
    totalApporteurs: number;
    totalAcheteurs: number;
    nouveauxCeMois: number;
  };
  topApporteurs: {
    id: string;
    nom: string;
    tonnage: number;
    montant: number;
  }[];
  topAcheteurs: {
    id: string;
    nom: string;
    chiffreAffaires: number;
  }[];
  evolutionCollecte: {
    mois: string;    // ex: '2025-01'
    tonnage: number;
  }[];
  evolutionCA: {
    mois: string;
    montant: number;
  }[];
}
```

---

## Réponses Paginée

### PaginatedResponse<T>

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### ApiResponse<T>

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
```

---

## Exemples d'Appels API

### Authentication

```typescript
// Login
POST /api/auth/login
Body: { email: string, password: string }

// Refresh Token
POST /api/auth/refresh
Body: { refresh_token: string }

// Logout
POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
Body: { refresh_token?: string }

// Get Profile
GET /api/auth/me
Headers: { Authorization: Bearer <token> }
```

### Clients

```typescript
// List Clients
GET /api/clients?page=1&limit=10&search=test&type=APPORTEUR&statut=ACTIF
Headers: { Authorization: Bearer <token> }

// Get Client by ID
GET /api/clients/:id
Headers: { Authorization: Bearer <token> }

// Create Client
POST /api/clients
Headers: { Authorization: Bearer <token> }
Body: CreateClientDto

// Update Client
PATCH /api/clients/:id
Headers: { Authorization: Bearer <token> }
Body: UpdateClientDto

// Delete Client (Directeur only)
DELETE /api/clients/:id
Headers: { Authorization: Bearer <token> }

// Export CSV
GET /api/clients/export?type=APPORTEUR&statut=ACTIF
Headers: { Authorization: Bearer <token> }

// Export Excel
GET /api/clients/export/excel?type=APPORTEUR
Headers: { Authorization: Bearer <token> }

// Download Template
GET /api/clients/template

// Import Clients
POST /api/clients/import
Headers: { Authorization: Bearer <token> }
Content-Type: multipart/form-data
Body: FormData with file field
```

### Commandes

```typescript
// List Commandes
GET /api/commandes?page=1&limit=10&statut=EN_PREPARATION&type=SUR_PLACE
Headers: { Authorization: Bearer <token> }

// Get Commande by ID
GET /api/commandes/:id
Headers: { Authorization: Bearer <token> }

// Create Commande (Commercial only)
POST /api/commandes
Headers: { Authorization: Bearer <token> }
Body: CreateCommandeDto

// Add Paiement (Commercial only)
POST /api/commandes/:id/paiements
Headers: { Authorization: Bearer <token> }
Body: CreatePaiementDto

// Change Statut (Commercial only)
PATCH /api/commandes/:id/statut
Headers: { Authorization: Bearer <token> }
Body: ChangeStatutDto
```

### Collectes

```typescript
// List Collectes
GET /api/collectes?page=1&limit=10&search=test&dateDebut=2025-01-01
Headers: { Authorization: Bearer <token> }

// Get Collecte by ID
GET /api/collectes/:id
Headers: { Authorization: Bearer <token> }

// Create Collecte (Collecteur only)
POST /api/collectes
Headers: { Authorization: Bearer <token> }
Body: CreateCollecteDto

// Get Stats
GET /api/collectes/stats
Headers: { Authorization: Bearer <token> }
```

### Factures

```typescript
// List Factures
GET /api/factures?page=1&limit=20
Headers: { Authorization: Bearer <token> }

// Generate Proforma
POST /api/factures/commandes/:commandeId/facture/proforma
Headers: { Authorization: Bearer <token> }

// Generate Definitive
POST /api/factures/commandes/:commandeId/facture/definitive
Headers: { Authorization: Bearer <token> }

// Download PDF
GET /api/factures/:id/pdf
Headers: { Authorization: Bearer <token> }

// Download PDF (External with token)
GET /api/factures/:id/pdf?token=<download_token>

// Send via WhatsApp
POST /api/factures/:id/envoyer-whatsapp
Headers: { Authorization: Bearer <token> }
```

### Notifications

```typescript
// List Notifications
GET /api/notifications?lu=false
Headers: { Authorization: Bearer <token> }

// Mark as Read
PATCH /api/notifications/:id/read
Headers: { Authorization: Bearer <token> }

// Mark All as Read
PATCH /api/notifications/read-all
Headers: { Authorization: Bearer <token> }
```

### Audit

```typescript
// List Audit Logs (Directeur only)
GET /api/audit?page=1&limit=10&userId=&action=CREATE&entite=Client
Headers: { Authorization: Bearer <token> }
```

---

## Notes Importantes

1. **Authentification**: Tous les endpoints (sauf `/auth/login` et `/auth/refresh`) nécessitent le header `Authorization: Bearer <token>`

2. **Rôles**: Certains endpoints sont restreints par rôle:
   - `DIRECTEUR`: Accès complet
   - `COMMERCIAL`: Commandes, Factures, Clients assignés
   - `COLLECTEUR`: Collectes

3. **Pagination**: Les endpoints de liste retournent une structure paginée avec `data` et `pagination`

4. **Dates**: Les dates sont au format ISO 8601 (ex: `2025-01-15T10:30:00.000Z`)

5. **Fichiers**: 
   - Import: `multipart/form-data` avec champ `file`
   - Export: Retourne le fichier binaire directement

6. **Système de produits**: Le backend supporte à la fois l'ancien système (un seul produit) et le nouveau système (plusieurs produits via `items`)
