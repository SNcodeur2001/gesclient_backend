# Plan Détaillé: Génération de PDF et Envoi WhatsApp

## 1. Modifications Base de Données

### 1.1 Nouvelle Table: Facture

```prisma
model Facture {
  id              String      @id @default(uuid())
  commandeId      String
  commande        Commande    @relation(fields: [commandeId], references: [id])
  numero          String      @unique // FAC-2026-0001
  type            FactureType // PROFORMA, DEFINITIVE
  montantHT       Float
  tva             Float
  montantTTC      Float
  montantVerse    Float       // montant déjà payé
  resteAPayer    Float
  fichierChemine  String?     // chemin du fichier PDF
  fichierBlob     Bytes?      // stockage BLOB du PDF
  estEnvoyee      Boolean     @default(false)
  dateEnvoi       DateTime?
  envoiWhatsapp   Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

enum FactureType {
  PROFORMA
  DEFINITIVE
}
```

### 1.2 Extension Table Commande

```prisma
model Commande {
  // ... champs existants
  factures         Facture[]
  referenceProforma String?  // lien vers proforma si différent
}
```

---

## 2. Nouveaux Endpoints API

| Méthode | Route | Description | Rôle |
|---------|-------|-------------|------|
| GET | /factures | Lister les factures | Commercial, Directeur |
| GET | /factures/:id | Détail facture | Commercial, Directeur |
| GET | /factures/:id/pdf | Télécharger PDF | Commercial, Directeur |
| POST | /commandes/:id/facture/proforma | Générer proforma | Commercial |
| POST | /commandes/:id/facture/definitive | Générer définitive | Commercial |
| POST | /factures/:id/envoyer-whatsapp | Envoyer WhatsApp | Commercial |

---

## 3. Librairie PDF Recommandée

**pdfmake** - Création via code JavaScript, contrôle total du layout, support des tableaux

```bash
npm install pdfmake
npm install @types/pdfmake --save-dev
```

---

## 4. Structure Template Facture

### En-tête
- Logo entreprise
- FACTURE PROFORMA ou FACTURE DÉFINITIVE
- Numéro, date de génération

### Informations Client
- Nom, prénom, adresse, téléphone, email

### Détails Commande
- Référence commande
- Type: SUR_PLACE / A_DISTANCE

### Tableau Produits
| Désignation | Qté | Prix Unit. | Montant |
|-------------|-----|-------------|---------|
| Produit X   | 10  | 5 000       | 50 000  |

### Totaux
```
Sous-total HT:    XXX XXX
TVA (20%):        XXX XXX
TOTAL TTC:        XXX XXX
```

---

## 5. Use Cases à Créer/Modifier

### Nouveaux Use Cases
- GenerateFactureUseCase - Génère PDF et l'enregistre
- GetFacturePdfUseCase - Retourne PDF en base64
- SendFactureWhatsAppUseCase - Envoie via WhatsApp
- ListFacturesUseCase - Liste paginée

### Use Cases à Modifier
- AddPaiementUseCase - Appeler génération auto après paiement
- CreateCommandeUseCase - SUR_PLACE: générer définitive immédiate

### Logique de Génération Automatique

```
CAS 1: SUR_PLACE
  → Paiement complet → Facture DEFINITIVE immédiate

CAS 2: A_DISTANCE
  → Acompte → Générer PROFORMA
  → Solde → Générer DÉFINITIVE

CAS 3: A_DISTANCE avec acompte = total (quand PRETE)
  → Générer PROFORMA + DÉFINITIVE
```

---

## 6. Intégration WhatsApp

### Service WhatsApp (Port + Implémentation)

```typescript
// domain/ports/services/whatsapp.service.ts
export interface WhatsAppService {
  sendMessage(numero: string, message: string, document?: Buffer, filename?: string): Promise<string>;
}
```

### Configuration .env

```env
WHATSAPP_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### Flux d'Envoi

```
Utilisateur clique "Envoyer WhatsApp"
  → Récupérer numéro client
  → Générer PDF si pas existant
  → Appeler API WhatsApp Meta
  → Enregistrer dans WhatsAppLog
  → Mettre à jour Facture: estEnvoyee = true
```

### Message WhatsApp

```
Bonjour {nom_client},

Votre {type_facture} N°{numero_facture} d'un montant de {montant} FCFA est disponible.

Détails:
- Commande: {reference_commande}
- Montant: {montant} FCA

Merci pour votre confiance!
{Nom entreprise}
```

---

## 7. Structure des Fichiers

```
src/
├── domain/
│   ├── entities/
│   │   └── facture.entity.ts          [NOUVEAU]
│   ├── enums/
│   │   └── facture-type.enum.ts       [NOUVEAU]
│   └── ports/
│       └── services/
│           └── whatsapp.service.ts     [NOUVEAU]
│
├── application/
│   └── factures/                       [NOUVEAU]
│       ├── generate-facture.use-case.ts
│       ├── get-facture-pdf.use-case.ts
│       ├── send-facture-whatsapp.use-case.ts
│       └── list-factures.use-case.ts
│
├── infrastructure/
│   └── services/
│       ├── pdf-generator.service.ts    [NOUVEAU]
│       └── whatsapp-meta.service.ts    [NOUVEAU]
│
└── presentation/
    └── factures/                       [NOUVEAU]
        ├── factures.controller.ts
        ├── factures.module.ts
        └── dto/
```

---

## 8. Liste des Tâches

### Phase 1: Base de données
- [ ] Créer migration Prisma pour table Facture
- [ ] Créer enum FactureType
- [ ] Mettre à jour schema.prisma
- [ ] Exécuter migration

### Phase 2: Domain Layer
- [ ] Créer entity Facture
- [ ] Créer port WhatsAppService

### Phase 3: Infrastructure
- [ ] Implémenter PdfGeneratorService
- [ ] Implémenter WhatsAppService
- [ ] Implémenter FactureRepository

### Phase 4: Application Layer
- [ ] Créer GenerateFactureUseCase
- [ ] Créer GetFacturePdfUseCase
- [ ] Créer SendFactureWhatsAppUseCase
- [ ] Modifier AddPaiementUseCase
- [ ] Modifier CreateCommandeUseCase

### Phase 5: Presentation Layer
- [ ] Créer FacturesController
- [ ] Créer FacturesModule
- [ ] Créer DTOs

### Phase 6: Tests
- [ ] Tester génération PDF
- [ ] Tester envoi WhatsApp
- [ ] Tester flux complet

---

## 9. Considérations Techniques

### Stockage PDF
- Stocker dans PostgreSQL (type BYTEA)

### Format Téléphone WhatsApp
Format: 221771234567 (sans + ni espaces)

### Génération Numéro Facture
```
PROFORMA:  FAC-PRO-2026-0001
DEFINITIVE: FAC-2026-0001
```

---

## 10. Résumé des Choix

| Aspect | Choix |
|--------|-------|
| Librairie PDF | pdfmake |
| Stockage PDF | BLOB PostgreSQL |
| Envoi WhatsApp | Meta Cloud API |
| Déclenchement | Auto après paiement + manuel |

---

Ce plan est-il conforme à vos attentes ?