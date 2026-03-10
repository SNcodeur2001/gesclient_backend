# Diagrammes PlantUML - GesClient Proplast

Ce fichier contient tous les diagrammes UML au format PlantUML pour le projet GesClient.

---

## 1. Diagrammes de Cas d'Utilisation

### 1.1 Cas d'Utilisation - Directeur

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Directeur" as Directeur #gold

rectangle "Gestion des Clients" {
  (Consulter la liste des clients) as UC1
  (Créer un client) as UC2
  (Modifier un client) as UC3
  (Supprimer un client) as UC4
  (Exporter clients CSV/Excel) as UC5
  (Importer clients Excel) as UC6
}

rectangle "Gestion des Commandes" {
  (Voir toutes les commandes) as UC7
  (Consulter détail commande) as UC8
  (Changer statut commande) as UC9
  (Générer facture) as UC10
  (Envoyer facture WhatsApp) as UC11
}

rectangle "Gestion des Collectes" {
  (Voir toutes les collectes) as UC12
  (Consulter détail collecte) as UC13
  (Voir statistiques collectes) as UC14
}

rectangle "Suivi et Reporting" {
  (Voir dashboard) as UC15
  (Consulter les audits) as UC16
  (Voir les notifications) as UC17
  (Marquer notification lue) as UC18
}

rectangle "Gestion des Utilisateurs" {
  (Gérer les utilisateurs) as UC19
}

Directeur --> UC1
Directeur --> UC2
Directeur --> UC3
Directeur --> UC4
Directeur --> UC5
Directeur --> UC6
Directeur --> UC7
Directeur --> UC8
Directeur --> UC9
Directeur --> UC10
Directeur --> UC11
Directeur --> UC12
Directeur --> UC13
Directeur --> UC14
Directeur --> UC15
Directeur --> UC16
Directeur --> UC17
Directeur --> UC18
Directeur --> UC19

@enduml
```

### 1.2 Cas d'Utilisation - Commercial

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Commercial" as Commercial #lightblue

rectangle "Gestion des Clients" {
  (Consulter mes clients) as UC1
  (Créer un client) as UC2
  (Modifier un client) as UC3
  (Exporter clients) as UC4
}

rectangle "Gestion des Commandes" {
  (Créer une commande) as UC5
  (Voir mes commandes) as UC6
  (Consulter détail commande) as UC7
  (Ajouter un paiement) as UC8
  (Changer statut commande) as UC9
}

rectangle "Suivi" {
  (Voir mes notifications) as UC10
  (Marquer notification lue) as UC11
}

Commercial --> UC1
Commercial --> UC2
Commercial --> UC3
Commercial --> UC4
Commercial --> UC5
Commercial --> UC6
Commercial --> UC7
Commercial --> UC8
Commercial --> UC9
Commercial --> UC10
Commercial --> UC11

@enduml
```

### 1.3 Cas d'Utilisation - Collecteur

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Collecteur" as Collecteur #lightgreen

rectangle "Gestion des Collectes" {
  (Créer une collecte) as UC1
  (Voir mes collectes) as UC2
  (Consulter détail collecte) as UC3
}

rectangle "Gestion des Apporteurs" {
  (Créer un apporteur) as UC4
}

rectangle "Suivi" {
  (Voir mes notifications) as UC5
  (Voir statistiques collectes) as UC6
}

Collecteur --> UC1
Collecteur --> UC2
Collecteur --> UC3
Collecteur --> UC4
Collecteur --> UC5
Collecteur --> UC6

@enduml
```

---

## 2. Diagramme de Classes

```plantuml
@startuml
skinparam linetype ortho
skinparam nodesep 50
skinparam ranksep 70

' Enumérations
enum Role {
  DIRECTEUR
  COMMERCIAL
  COLLECTEUR
}

enum ClientType {
  APPORTEUR
  ACHETEUR
}

enum ClientStatut {
  ACTIF
  PROSPECT
  INACTIF
}

enum CommandeType {
  SUR_PLACE
  A_DISTANCE
}

enum CommandeStatut {
  EN_ATTENTE_ACOMPTE
  EN_PREPARATION
  PRETE
  FINALISEE
}

enum PaiementType {
  ACOMPTE
  SOLDE
}

enum ModePaiement {
  ESPECES
  VIREMENT
  CHEQUE
  MOBILE_MONEY
}

enum FactureType {
  PROFORMA
  DEFINITIVE
}

enum FactureStatut {
  GENEREE
  ENVOYEE
  TELECHARGE
}

enum NotificationType {
  NOUVELLE_COLLECTE
  ACOMPTE_RECU
  COMMANDE_PRETE
  COMMANDE_FINALISEE
  COMMANDE_EN_ATTENTE
}

' Classes principales
class User {
  -id: String
  -nom: String
  -prenom: String
  -email: String
  -password: String
  -role: Role
  -actif: Boolean
  -createdAt: DateTime
  -updatedAt: DateTime
}

class Client {
  -id: String
  -nom: String
  -prenom: String
  -email: String
  -telephone: String
  -adresse: String
  -type: ClientType
  -statut: ClientStatut
  -totalRevenue: Float
  -notes: String
  -createdAt: DateTime
}

class Commande {
  -id: String
  -reference: String
  -type: CommandeType
  -statut: CommandeStatut
  -montantHT: Float
  -tva: Float
  -montantTTC: Float
  -acompteMinimum: Float
  -acompteVerse: Float
  -soldeRestant: Float
  -createdAt: DateTime
  --
  +calculerMontantHT()
  +calculerTVA()
  +calculerMontantTTC()
  +calculerAcompteMinimum()
  +validerAcompte()
  +validerTransition()
}

class CommandeItem {
  -id: String
  -produit: String
  -quantite: Float
  -prixUnitaire: Float
}

class Collecte {
  -id: String
  -quantiteKg: Float
  -prixUnitaire: Float
  -montantTotal: Float
  -notes: String
  -createdAt: DateTime
}

class CollecteItem {
  -id: String
  -typePlastique: String
  -quantiteKg: Float
  -prixUnitaire: Float
}

class Paiement {
  -id: String
  -type: PaiementType
  -montant: Float
  -modePaiement: ModePaiement
  -createdAt: DateTime
}

class Facture {
  -id: String
  -numero: String
  -type: FactureType
  -montantHT: Float
  -tva: Float
  -montantTTC: Float
  -statut: FactureStatut
  -envoyeeWhatsApp: Boolean
  -createdAt: DateTime
}

class Notification {
  -id: String
  -type: NotificationType
  -message: String
  -lu: Boolean
  -lien: String
  -createdAt: DateTime
}

class AuditLog {
  -id: String
  -action: String
  -entite: String
  -entiteId: String
  -ancienneValeur: JSON
  -nouvelleValeur: JSON
  -createdAt: DateTime
}

class RefreshToken {
  -id: String
  -token: String
  -tokenHash: String
  -expiresAt: DateTime
  -revokedAt: DateTime
}

' Relations
User "1" -- "*" Client : "clients assigns"
User "1" -- "*" Commande : "commandes"
User "1" -- "*" Collecte : "collectes"
User "1" -- "*" Paiement : "paiements"
User "1" -- "*" Facture : "factures genérées"
User "1" -- "*" Notification : "notifications"
User "1" -- "*" AuditLog : "auditLogs"
User "1" -- "*" RefreshToken : "refreshTokens"

Client "1" -- "*" Commande : "achète"
Client "1" -- "*" Collecte : "apporte"
Client "1" -- "*" Notification : "reçoit"

Commande "1" -- "*" CommandeItem : "contient"
Commande "1" -- "*" Paiement : "reçoit"
Commande "1" -- "*" Facture : "génère"
Commande "1" -- "*" Notification : "génère"

Collecte "1" -- "*" CollecteItem : "contient"

User "1" -- "*" Client : "assigned"

@enduml
```

---

## 3. Diagrammes de Séquence

### 3.1 Séquence - Authentification (Complet)

```plantuml
@startuml
actor "Utilisateur" as User
participant "API Gateway" as Gateway
participant "Auth Controller" as AuthCtrl
participant "Login Use Case" as LoginUC
participant "User Repository" as UserRepo
participant "Hash Service" as HashSvc
participant "Token Service" as TokenSvc
participant "RefreshToken Repo" as RTRepo
participant "Audit Log Repo" as AuditRepo
participant "Base de données" as DB

title Séquence d'Authentification - Login

User -> Gateway: POST /auth/login\n(email, password)
activate Gateway

Gateway -> AuthCtrl: login(email, password)
activate AuthCtrl

AuthCtrl -> LoginUC: execute(email, password)
activate LoginUC

' Étape 1: Recherche utilisateur
LoginUC -> UserRepo: findByEmail(email)
UserRepo -> DB: SELECT * FROM users WHERE email = ?
activate DB
DB --> UserRepo: User (ou null)
deactivate DB

alt Utilisateur non trouvé
  LoginUC --> AuthCtrl: InvalidCredentialsException
  AuthCtrl --> Gateway: 401 Unauthorized
  Gateway --> User: Erreur authentification
else Utilisateur trouvé
  ' Étape 2: Vérification mot de passe
  LoginUC -> HashSvc: compare(password, user.password)
  activate HashSvc
  HashSvc --> LoginUC: true/false
  deactivate HashSvc
  
  alt Mot de passe invalide
    LoginUC --> AuthCtrl: InvalidCredentialsException
    AuthCtrl --> Gateway: 401 Unauthorized
    Gateway --> User: Erreur authentification
  else Mot de passe valide
  
    ' Étape 3: Génération Access Token
    LoginUC -> TokenSvc: signAccessToken({id, email, role})
    activate TokenSvc
    TokenSvc --> LoginUC: access_token (JWT)
    deactivate TokenSvc
    
    ' Étape 4: Génération Refresh Token
    LoginUC -> TokenSvc: signRefreshToken({id})
    activate TokenSvc
    TokenSvc --> LoginUC: refresh_token (JWT)
    deactivate TokenSvc
    
    ' Étape 5: Hash et stockage du refresh token
    LoginUC -> HashSvc: hash(refresh_token)
    activate HashSvc
    HashSvc --> LoginUC: refreshTokenHash
    deactivate HashSvc
    
    LoginUC -> RTRepo: create({token, tokenHash, userId, expiresAt})
    RTRepo -> DB: INSERT INTO refresh_tokens
    activate DB
    DB --> RTRepo: Confirmation
    deactivate DB
    
    ' Étape 6: Audit log
    LoginUC -> AuditRepo: log({userId, action: LOGIN, ...})
    AuditRepo -> DB: INSERT INTO audit_logs
    activate DB
    DB --> AuditRepo: Confirmation
    deactivate DB
    
    ' Réponse finale
    LoginUC --> AuthCtrl: {access_token, refresh_token}
    deactivate LoginUC
    
    AuthCtrl --> Gateway: 200 OK + tokens
    deactivate AuthCtrl
    
    Gateway --> User: Connexion réussie\n+ tokens
    deactivate Gateway
  end
end

@enduml
```

### 3.2 Séquence - Commande avec Calculs (Complet)

```plantuml
@startuml
actor "Commercial" as Commercial
participant "API Gateway" as Gateway
participant "Commandes Controller" as CmdCtrl
participant "CreateCommande Use Case" as CreateCmdUC
participant "AddPaiement Use Case" as AddPmtUC
participant "GenerateFacture Use Case" as GenFactUC
participant "Commande Entity" as CmdEntity
participant "Client Repository" as ClientRepo
participant "Commande Repository" as CmdRepo
participant "Paiement Repository" as PmtRepo
participant "Notification Repository" as NotifRepo
participant "Audit Log Repo" as AuditRepo
participant "Facture Repository" as FactRepo
participant "Base de données" as DB

title Séquence - Création Commande + Paiement avec Calculs

' ===================== CRÉATION COMMANDE =====================

Commercial -> Gateway: POST /commandes\n(type, items[], acheteurId)
activate Gateway

Gateway -> CmdCtrl: create(createCommandeDto)
activate CmdCtrl

CmdCtrl -> CreateCmdUC: execute(input)
activate CreateCmdUC

' 1. Résoudre l'acheteur
alt Client existant
  CreateCmdUC -> ClientRepo: findById(acheteurId)
else Nouveau client
  CreateCmdUC -> ClientRepo: create(acheteurInfo)
  ClientRepo -> DB: INSERT INTO clients
  activate DB
  DB --> ClientRepo: Client créé
  deactivate DB
end

' 2. Déterminer les produits
note right of CreateCmdUC
  Nouveau système: plusieurs produits
  ou Ancien système: un seul produit
end note

' 3. Calculs métier - Appel méthode statique
CreateCmdUC -> CmdEntity: calculerMontantHT(items[])
activate CmdEntity
CmdEntity --> CreateCmdUC: montantHT (somme qté × prix)
deactivate CmdEntity

CreateCmdUC -> CmdEntity: calculerTVA(montantHT, type)
activate CmdEntity
alt type = A_DISTANCE
  CmdEntity --> CreateCmdUC: tva = montantHT × 20%
else type = SUR_PLACE
  CmdEntity --> CreateCmdUC: tva = 0
end
deactivate CmdEntity

CreateCmdUC -> CmdEntity: calculerMontantTTC(montantHT, tva)
activate CmdEntity
CmdEntity --> CreateCmdUC: montantTTC = montantHT + tva
deactivate CmdEntity

CreateCmdUC -> CmdEntity: calculerAcompteMinimum(montantTTC, type)
activate CmdEntity
alt type = A_DISTANCE
  CmdEntity --> CreateCmdUC: acompteMinimum = montantTTC × 50%
else type = SUR_PLACE
  CmdEntity --> CreateCmdUC: acompteMinimum = null
end
deactivate CmdEntity

' 4. Déterminer statut initial
note right of CreateCmdUC
  Si A_DISTANCE: EN_ATTENTE_ACOMPTE
  Si SUR_PLACE: EN_PREPARATION
end note

' 5. Générer référence unique
CreateCmdUC -> CmdRepo: countAll()
CmdRepo -> DB: SELECT COUNT(*) FROM commandes
activate DB
DB --> CmdRepo: count
deactivate DB

CreateCmdUC -> CmdEntity: Générer référence CMD-YYYY-XXXX

' 6. Persister la commande
CreateCmdUC -> CmdRepo: create(createData)
CmdRepo -> DB: INSERT INTO commandes + commande_items
activate DB
DB --> CmdRepo: Commande créée
deactivate DB

' 7. Audit
CreateCmdUC -> AuditRepo: log(CREATE, Commande)
AuditRepo -> DB: INSERT INTO audit_logs
activate DB
DB --> AuditRepo: Confirmation
deactivate DB

' 8. Notification au directeur
CreateCmdUC -> NotifRepo: create(COMMANDE_EN_ATTENTE)
NotifRepo -> DB: INSERT INTO notifications
activate DB
DB --> NotifRepo: Confirmation
deactivate DB

CreateCmdUC --> CmdCtrl: Commande
deactivate CreateCmdUC

CmdCtrl --> Gateway: 201 Created + commande
deactivate CmdCtrl

Gateway --> Commercial: Commande créée\navec calculs (HT, TVA, TTC, acompte)
deactivate Gateway

' ===================== AJOUT PAIEMENT =====================

Commercial -> Gateway: POST /commandes/:id/paiements\n(type, montant, mode)
activate Gateway

Gateway -> CmdCtrl: addPaiement(paiementDto)
activate CmdCtrl

CmdCtrl -> AddPmtUC: execute(input)
activate AddPmtUC

' 1. Récupérer la commande
AddPmtUC -> CmdRepo: findById(commandeId)
CmdRepo -> DB: SELECT * FROM commandes WHERE id = ?
activate DB
DB --> CmdRepo: Commande
deactivate DB

' 2. Instancier entité Domain
AddPmtUC -> CmdEntity: new Commande() + affecter données

alt Type = ACOMPTE
  ' Vérification acompte minimum
  AddPmtUC -> CmdEntity: validerAcompte(montant)
  alt montant < acomteMinimum
    CmdEntity --> AddPmtUC: AcompteInsuffisantException
    AddPmtUC --> CmdCtrl: 400 Bad Request
    CmdCtrl --> Gateway: Erreur
    Gateway --> Commercial: Acompte insuffisant
  end
  
  ' Calculs nouveaux soldes
  note right of AddPmtUC
    nouveauAcompteVerse = ancien + montant
    nouveauSoldeRestant = montantTTC - nouveauAcompteVerse
  end note
  
  ' Génération automatique facture
  alt SUR_PLACE ou A_DISTANCE 100%
    AddPmtUC -> GenFactUC: execute(commandeId, DEFINITIVE)
  else A_DISTANCE acompt < 100%
    AddPmtUC -> GenFactUC: execute(commandeId, PROFORMA)
  end
  
  activate GenFactUC
  GenFactUC -> FactRepo: create(factureData)
  FactRepo -> DB: INSERT INTO factures
  activate DB
  DB --> FactRepo: Facture créée
  deactivate DB
  GenFactUC --> AddPmtUC: Facture générée
  deactivate GenFactUC
  
else Type = SOLDE
  ' Vérification statut
  alt statut != PRETE
    AddPmtUC --> CmdCtrl: 400 Bad Request
  end
  
  ' Vérification montant
  alt montant != soldeRestant
    AddPmtUC --> CmdCtrl: 400 Bad Request
  end
  
  ' Génération définitive
  AddPmtUC -> GenFactUC: execute(commandeId, DEFINITIVE)
  activate GenFactUC
  GenFactUC -> FactRepo: create(factureData)
  FactRepo -> DB: INSERT INTO factures
  activate DB
  DB --> FactRepo: Facture créée
  deactivate DB
  GenFactUC --> AddPmtUC: Facture générée
  deactivate GenFactUC
  
  ' Mise à jour revenue client
  AddPmtUC -> ClientRepo: findById(acheteurId)
  AddPmtUC -> ClientRepo: update(acheteurId, totalRevenue + montantTTC)
end

' 3. Créer le paiement
AddPmtUC -> PmtRepo: create(paiementData)
PmtRepo -> DB: INSERT INTO paiements
activate DB
DB --> PmtRepo: Confirmation
deactivate DB

' 4. Mettre à jour la commande
AddPmtUC -> CmdRepo: update(commandeId, {statut, acompteVerse, soldeRestant})
CmdRepo -> DB: UPDATE commandes
activate DB
DB --> CmdRepo: Confirmation
deactivate DB

' 5. Notifications
AddPmtUC -> NotifRepo: create(ACOMPTE_RECU ou COMMANDE_FINALISEE)
NotifRepo -> DB: INSERT INTO notifications
activate DB
DB --> NotifRepo: Confirmation
deactivate DB

' 6. Audit
AddPmtUC -> AuditRepo: log(UPDATE, Commande)
AuditRepo -> DB: INSERT INTO audit_logs
activate DB
DB --> AuditRepo: Confirmation
deactivate DB

AddPmtUC --> CmdCtrl: Résultat + facture
deactivate AddPmtUC

CmdCtrl --> Gateway: 200 OK + paiement + facture
deactivate CmdCtrl

Gateway --> Commercial: Paiement enregistré\n+ facture générée
deactivate Gateway

@enduml
```

### 3.3 Séquence - Collecte (Troisième plus pertinent)

```plantuml
@startuml
actor "Collecteur" as Collecteur
participant "API Gateway" as Gateway
participant "Collectes Controller" as CollCtrl
participant "CreateCollecte Use Case" as CreateCollUC
participant "Collecte Entity" as CollEntity
participant "Client Repository" as ClientRepo
participant "Collecte Repository" as CollRepo
participant "Notification Repository" as NotifRepo
participant "Audit Log Repo" as AuditRepo
participant "Base de données" as DB

title Séquence - Création d'une Collecte

Collecteur -> Gateway: POST /collectes\n(apporteurId?, items[], notes)
activate Gateway

Gateway -> CollCtrl: create(createCollecteDto)
activate CollCtrl

CollCtrl -> CreateCollUC: execute(input)
activate CreateCollUC

' 1. Résoudre l'apporteur
alt Apporteur existant
  CreateCollUC -> ClientRepo: findById(apporteurId)
else Nouveau apporteur (créé à la volée)
  CreateCollUC -> ClientRepo: create({nom, telephone, type: APPORTEUR})
  ClientRepo -> DB: INSERT INTO clients
  activate DB
  DB --> ClientRepo: Apporteur créé
  deactivate DB
end

' 2. Déterminer les types de plastiques
note right of CreateCollUC
  Nouveau système: plusieurs types de plastiques
  ou Ancien système: un seul type
end note

' 3. Calcul montant total
CreateCollUC -> CollEntity: calculerMontantTotal(items[])
activate CollEntity
note right of CollEntity
  Pour chaque item:
  montant = quantiteKg × prixUnitaire
  Somme de tous les items
end note
CollEntity --> CreateCollUC: montantTotal
deactivate CollEntity

' 4. Créer la collecte
CreateCollUC -> CollRepo: create(collecteData)
CollRepo -> DB: INSERT INTO collectes + collecte_items
activate DB
DB --> CollRepo: Collecte créée
deactivate DB

' 5. Audit
CreateCollUC -> AuditRepo: log(CREATE, Collecte)
AuditRepo -> DB: INSERT INTO audit_logs
activate DB
DB --> AuditRepo: Confirmation
deactivate DB

' 6. Notification au directeur
CreateCollUC -> NotifRepo: create(NOUVELLE_COLLECTE)
NotifRepo -> DB: INSERT INTO notifications
activate DB
DB --> NotifRepo: Confirmation
deactivate DB

CreateCollUC --> CollCtrl: Collecte créée
deactivate CreateCollUC

CollCtrl --> Gateway: 201 Created + collecte
deactivate CollCtrl

Gateway --> Collecteur: Collecte créée\npour [montantTotal] FCFA
deactivate Gateway

' ===================== CONSULTATION STATS =====================

Collecteur -> Gateway: GET /collectes/stats\n(collecteurId?)
activate Gateway

Gateway -> CollCtrl: getStats(collecteurId?)
activate CollCtrl

CollCtrl -> CollRepo: getStatsByCollecteur(collecteurId)
CollRepo -> DB: Requête agrégée
activate DB
DB --> CollRepo: {totalCollectes, totalMontant, quantiteTotale}
deactivate DB

CollCtrl --> Gateway: 200 OK + statistiques
deactivate CollCtrl

Gateway --> Collecteur: Statistiques des collectes
deactivate Gateway

@enduml
```

---

## Instructions d'utilisation

### Générer les diagrammes

Vous pouvez utiliser [PlantUML Online Viewer](https://www.plantuml.com/plantuml/) ou installer une extension VS Code comme "PlantUML" pour prévisualiser ces diagrammes.

### Plugins VS Code recommandés
- **PlantUML** par jebbs
- **Markdown Preview Enhanced** pour prévisualiser les fichiers .md

### Commandes pour générer les images

```bash
# Installer PlantUML
npm install -g plantuml

# Générer un diagramme
