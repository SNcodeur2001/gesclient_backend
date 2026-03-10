# Visily Prompt - GesClient Proplast Application

**IMPORTANT: Write this entire prompt in English for Visily to generate UI mockups.**

---

## 1. VISUAL IDENTITY

### Application Name
**GesClient — Proplast**

### Color Palette
- **Sidebar Background:** `#0F172A` (Dark navy blue)
- **Accent/Primary:** `#2563EB` (Bright blue)
- **Main Background:** `#F8FAFC` (Light gray-white)
- **Text Primary:** `#1E293B` (Dark slate)
- **Text Secondary:** `#64748B` (Medium gray)
- **Success:** `#16A34A` (Green)
- **Danger/Error:** `#DC2626` (Red)
- **Warning:** `#D97706` (Orange/Amber)
- **Card Background:** `#FFFFFF` (White)
- **Border:** `#E2E8F0` (Light gray)

### Typography
- **Font Family:** Inter (or equivalent modern sans-serif)
- **Headings:** Bold, sizes: H1 (24px), H2 (20px), H3 (16px)
- **Body Text:** Regular, 14px
- **Small Text:** 12px
- **Line Height:** 1.5

### UI Components Style
- **Cards:** White background with subtle box-shadow (`0 1px 3px rgba(0,0,0,0.1)`), border-radius 8px
- **Tables:** Alternating row colors (white / `#F8FAFC`), header with `#F1F5F9` background
- **Badges:** Rounded pills (border-radius 9999px), various colors for statuses
- **Buttons:** Primary (blue `#2563EB`), Secondary (gray), Danger (red), border-radius 6px
- **Inputs:** Border `#E2E8F0`, focus border `#2563EB`, border-radius 6px
- **Modals:** Centered, white background, overlay `rgba(0,0,0,0.5)`

---

## 2. GLOBAL LAYOUT

### Fixed Sidebar (Left)
- **Width:** 260px fixed
- **Background:** `#0F172A`
- **Logo Area:** Top section with "GesClient" text in white, font-size 20px bold
- **Navigation Menu:** 
  - Icons + Labels in white/light gray
  - Active item: Blue accent bar on left, lighter background
  - Menu items: Dashboard, Clients, Commandes, Collectes, Factures, Notifications, Audit (Director only)
- **User Profile Section:** Bottom of sidebar
  - Avatar circle (40px)
  - User name and role below
  - Logout button

### Fixed Header (Top)
- **Height:** 64px
- **Background:** White with bottom border
- **Left:** Page title (e.g., "Dashboard", "Clients")
- **Right:** 
  - Bell icon with notification badge counter (red circle with number)
  - User avatar dropdown

### Main Content Area
- **Background:** `#F8FAFC`
- **Padding:** 24px
- **Max Width:** None (full width with padding)

### Sidebar Variants by Role

**DIRECTEUR (Director):**
- Full menu: Dashboard, Clients, Commandes, Collectes, Factures, Notifications, Audit

**COMMERCIAL (Sales):**
- Limited menu: Dashboard, Clients, Commandes, Notifications
- NO: Collectes, Factures, Audit

**COLLECTEUR (Collector):**
- Limited menu: Dashboard, Collectes, Notifications
- NO: Clients, Commandes, Factures, Audit

---

## 3. SCREENS TO DESIGN (15 total screens)

### 3.1 Login Page (`/login`)
- Centered card on light background
- Logo at top
- Email input field
- Password input field
- "Login" primary button
- "Forgot password?" link below
- Background: Gradient or subtle pattern

---

### 3.2 Dashboard - Director (`/dashboard`)
**KPI Cards Row (4 cards):**
1. **Total Clients** - Number (e.g., "248"), label "Total Clients", up arrow icon
2. **Orders This Month** - Number (e.g., "45"), label "Commandes ce mois"
3. **Collections This Month** - Number with unit (e.g., "2,450 kg"), label "Collectes ce mois"
4. **Revenue This Month** - Amount in FCA (e.g., "12,450,000 FCA"), label "Chiffre d'affaires"

**Charts Section:**
- Line chart: "Revenue Evolution" (last 6 months)
- Bar chart: "Plastic Collections" (last 6 months)

**Recent Activity Table:**
- Columns: Date, Type, Description, Amount
- 5 sample rows with realistic data

**Top Lists:**
- Left: "Top Apporteurs" (top suppliers) - Table with Name, Tonnage, Amount
- Right: "Top Buyers" - Table with Name, Orders, Total Spent

---

### 3.3 Dashboard - Commercial (`/dashboard`)
**KPI Cards Row (3 cards):**
1. **My Clients** - Number
2. **My Orders** - Number
3. **Pending Payments** - Number with amount

**Quick Actions:**
- "New Order" button
- "Add Client" button

**Recent Orders Table:**
- Columns: Reference, Client, Date, Amount, Status Badge
- 5 sample rows

---

### 3.3 Dashboard - Collecteur (`/dashboard`)
**KPI Cards Row (3 cards):**
1. **Total Collections** - Number
2. **Total Weight** - kg
3. **Total Earned** - FCA

**Stats Chart:**
- Line chart: "My Collections Over Time"

**Recent Collections Table:**
- Columns: Date, Apporteur, Weight, Amount
- 5 sample rows

---

### 3.4 Clients List (`/clients`)
**Filter Bar:**
- Search input (by name/email)
- Dropdown: Type (All, Apporteur, Acheteur)
- Dropdown: Status (All, Actif, Prospect, Inactif)
- "Add Client" button (primary)

**Data Table:**
| Column | Description |
|--------|-------------|
| Name | Full name (e.g., "Moussa Diop") |
| Type | Badge (APPORTEUR = green, ACHETEUR = blue) |
| Phone | Phone number |
| Email | Email address |
| Status | Badge (ACTIF = green, PROSPECT = orange, INACTIF = gray) |
| Total Revenue | Amount in FCA |
| Actions | Edit button, Delete button (Director only) |

**Pagination:** Bottom of table with page numbers

**Sample Data (Senegalese names):**
- "Moussa Diop", Apporteur, +221 77 123 45 67, Actif, 450,000 FCA
- "Aminata Sow", Acheteuse, +221 76 987 65 43, Prospect
- "Cheikh Mbaye", Apporteur, +221 70 111 22 33, Actif, 780,000 FCA

---

### 3.5 Client Detail (`/clients/:id`)
**Header Section:**
- Client name (large)
- Type badge
- Status badge
- Edit button
- Back to list button

**Info Cards:**
- Contact Information card: Email, Phone, Address
- Business Statistics card: Total Revenue, Number of Orders/Collections

**Related Orders Table:**
- List of orders for this client
- Columns: Reference, Date, Amount, Status

**History Timeline:**
- Chronological list of activities

---

### 3.6 Client Form - Create/Edit (`/clients/new` or `/clients/:id/edit`)
**Form Fields:**
- Nom* (text input)
- Prénom (text input)
- Email (email input)
- Téléphone (text input)
- Adresse (text input)
- Type* (dropdown: Apporteur / Acheteur)
- Statut (dropdown: Actif / Prospect / Inactif)
- Notes (textarea)

**Buttons:**
- "Cancel" (secondary)
- "Save" (primary)

---

### 3.7 Orders List (`/commandes`)
**Filter Bar:**
- Search input (by reference or product)
- Dropdown: Status (All, EN_ATTENTE_ACOMPTE, EN_PREPARATION, PRETE, FINALISEE)
- Dropdown: Type (All, SUR_PLACE, A_DISTANCE)
- Date range picker (from/to)
- "New Order" button (Commercial only)

**Data Table:**
| Column | Description |
|--------|-------------|
| Reference | Order ID (e.g., "CMD-2026-0001") |
| Client | Buyer name |
| Type | Badge (SUR_PLACE = blue, A_DISTANCE = purple) |
| Amount | Total in FCA |
| Status | Status badge (see colors below) |
| Date | Created date |
| Actions | View, Add Payment, Change Status |

**Status Badge Colors:**
- `EN_ATTENTE_ACOMPTE` = Orange `#D97706`
- `EN_PREPARATION` = Blue `#2563EB`
- `PRETE` = Purple `#7C3AED`
- `FINALISEE` = Green `#16A34A`

**Sample Data:**
- "CMD-2026-0001", "Aminata Sow", "A_DISTANCE", 450,000 FCA, "EN_PREPARATION", "2026-03-05"
- "CMD-2026-0002", "Cheikh Mbaye", "SUR_PLACE", 125,000 FCA, "FINALISEE", "2026-03-08"

---

### 3.8 Order Detail (`/commandes/:id`)
**Header Section:**
- Order reference (large)
- Status badge (colored)
- Type badge
- Date created

**Financial Summary Card:**
- Montant HT (excl. tax)
- TVA (0% for SUR_PLACE, 20% for A_DISTANCE)
- Montant TTC (incl. tax)
- Acompte Minimum required
- Acompte Versé (paid)
- Solde Restant (remaining)

**Products Table:**
| Column | Description |
|--------|-------------|
| Product | Product name (e.g., "Granulés PEHD") |
| Quantity | Weight in kg |
| Unit Price | Price per kg |
| Subtotal | Quantity × Unit Price |

**Payments Table:**
| Column | Description |
|--------|-------------|
| Date | Payment date |
| Type | ACOMPTE / SOLDE |
| Amount | Amount paid |
| Mode | ESPÈCES / VIREMENT / MOBILE_MONEY / CHÈQUE |

**Action Buttons:**
- "Add Payment" (if not fully paid)
- "Change Status"
- "Generate Invoice"
- "Send via WhatsApp"

---

### 3.9 New Order Form (`/commandes/new`)
**Form Fields:**
- **Type*** (radio: Sur place / À distance)
- **Client*** (dropdown with search - select existing buyer OR create new)
- **New Client Info** (collapsible section):
  - Nom*
  - Téléphone
  - Email
- **Products** (dynamic list):
  - Product name* (text, e.g., "Granulés PEHD", "Plastique PP", "Broyat PET")
  - Quantity (number in kg)*
  - Unit Price (number in FCA)*
  - "Add another product" button
  - "Remove" button for each row
- **Calculated totals display:**
  - Subtotal (auto-calculated)
  - TVA (0% or 20%)
  - Total TTC (auto-calculated)
  - Required deposit (50% for A_DISTANCE, none for SUR_PLACE)

**Buttons:**
- "Cancel"
- "Create Order"

---

### 3.10 Payment Modal
**Modal Fields:**
- **Payment Type*** (radio: Acompte / Solde)
- **Amount*** (number input, pre-filled with remaining balance)
- **Payment Mode*** (dropdown: Espèces, Virement, Chèque, Mobile Money)
- **Notes** (optional textarea)

**Display:**
- Order reference
- Remaining balance
- Required minimum (for deposit)

**Buttons:**
- "Cancel"
- "Record Payment"

---

### 3.11 Collections List (`/collectes`)
**Filter Bar:**
- Search input (by apporteur name)
- Date range picker
- "New Collection" button (Collector only)

**Data Table:**
| Column | Description |
|--------|-------------|
| ID | Collection ID |
| Apporteur | Supplier name |
| Date | Collection date |
| Weight | Total kg collected |
| Amount | Total in FCA |
| Collector | Who collected |
| Actions | View Details |

**Sample Data:**
- "COL-2026-0001", "Moussa Diop", "2026-03-09", 150 kg, 30,000 FCA, "Ousmane"
- "COL-2026-0002", "Aminata Faye", "2026-03-10", 85 kg, 17,000 FCA, "Ousmane"

---

### 3.12 Collection Detail (`/collectes/:id`)
**Header Section:**
- Collection ID
- Date
- Collector name

**Apporteur Info:**
- Name, Phone

**Items Table:**
| Column | Description |
|--------|-------------|
| Plastic Type | Type (e.g., "Plastique PP", "PEHD", "PET") |
| Weight | kg |
| Unit Price | FCA/kg |
| Subtotal | FCA |

**Notes:** Any notes from collector

**Total:** Sum of all items

---

### 3.13 New Collection Form (`/collectes/new`)
**Form Fields:**
- **Apporteur** (dropdown with search OR create new)
- **New Apporteur Info** (collapsible):
  - Nom*
  - Téléphone
- **Plastic Items** (dynamic list):
  - Type de plastique* (dropdown: PP, PEHD, PET, LDPE, Broyat Mixte, etc.)
  - Quantité (kg)*
  - Prix unitaire (FCA/kg)*
  - "Add another type" button
- **Notes** (textarea)

**Auto-calculation:** Total = Sum of (Quantity × Unit Price)

**Buttons:**
- "Cancel"
- "Create Collection"

---

### 3.14 Invoices List (`/factures`)
**Filter Bar:**
- Search by invoice number
- Type filter (All, Proforma, Définitif)
- Date range

**Data Table:**
| Column | Description |
|--------|-------------|
| Invoice Number | (e.g., "FAC-2026-0001") |
| Type | Badge (PROFORMA = gray, DÉFINITIVE = green) |
| Order Ref | Related order |
| Client | Buyer name |
| Amount | Total in FCA |
| Status | GENERATED / SENT / DOWNLOADED |
| Date | Created date |
| Actions | Download PDF, Send WhatsApp |

**Sample Data:**
- "FAC-2026-0001", "DÉFINITIVE", "CMD-2026-0001", "Aminata Sow", 540,000 FCA, "SENT"
- "FAC-2026-0002", "PROFORMA", "CMD-2026-0003", "Cheikh Mbaye", 225,000 FCA, "GENERATED"

---

### 3.15 Notifications Page (`/notifications`)
**Filter Tabs:**
- All | Unread | Read

**Notification List:**
Each notification is a card with:
- Icon (based on type)
- Message text
- Time ago (e.g., "Il y a 2 heures")
- Read/Unread indicator (dot for unread)
- Click to mark as read
- Link to related item

**Notification Types:**
- `NOUVELLE_COLLECTE` = Collection icon
- `ACOMPTE_RECU` = Payment icon (green)
- `COMMANDE_PRETE` = Package icon (purple)
- `COMMANDE_FINALISEE` = Check icon (green)
- `COMMANDE_EN_ATTENTE` = Clock icon (orange)
- `IMPORT_TERMINE` = Upload icon (blue)

**Sample Data:**
- "Nouvelle collecte de Moussa Diop: 150 kg - 30,000 FCA" (2h ago, unread)
- "Acompte reçu pour CMD-2026-0002: 125,000 FCA" (Yesterday, read)
- "Commande CMD-2026-0001 prête pour retrait" (Yesterday, unread)

---

### 3.16 Audit Trail (`/audit`) - DIRECTOR ONLY
**Filter Bar:**
- User filter (dropdown)
- Action filter (dropdown: CREATE, UPDATE, DELETE, LOGIN, IMPORT, EXPORT)
- Entity filter (dropdown: Client, Commande, Collecte, User, etc.)
- Date range

**Data Table:**
| Column | Description |
|--------|-------------|
| Date | Timestamp |
| User | Who performed action |
| Action | Badge (CREATE=green, UPDATE=blue, DELETE=red, LOGIN=gray) |
| Entity | What was affected (e.g., "Commande") |
| Entity ID | ID of the item |
| Changes | Summary (e.g., "Status changed: EN_PREPARATION → PRETE") |
| Details | Expand button to see JSON diff |

**Sample Data:**
- "2026-03-10 14:30", "Admin", "CREATE", "Client", "cl-001", "Created new client: Aminata Sow"
- "2026-03-10 11:15", "Commercial 1", "UPDATE", "Commande", "cmd-001", "Status: EN_ATTENTE_ACOMPTE → EN_PREPARATION"
- "2026-03-09 09:00", "Admin", "LOGIN", "User", "user-001", "User logged in"

---

## 4. COMPONENT SPECIFICATIONS

### Status Badges (Exact Colors)
```css
/* Order Status */
.en-attente-acompte { background: #FEF3C7; color: #D97706; }  /* Orange */
.en-preparation { background: #DBEAFE; color: #2563EB; }       /* Blue */
.prete { background: #EDE9FE; color: #7C3AED; }                /* Purple */
.finalisee { background: #DCFCE7; color: #16A34A; }             /* Green */

/* Invoice Type */
.proforma { background: #F3F4F6; color: #6B7280; }             /* Gray */
.definitive { background: #DCFCE7; color: #16A34A; }            /* Green */

/* Client */
.actif { background: #DCFCE7; color: #16A34A; }                /* Green */
.prospect { background: #FEF3C7; color: #D97706; }             /* Orange */
.inactif { background: #F3F4F6; color: #6B7280; }              /* Gray */

/* Client Type */
.apporteur { background: #DCFCE7; color: #16A34A; }             /* Green */
.acheteur { background: #DBEAFE; color: #2563EB; }             /* Blue */

/* Audit Actions */
.create { background: #DCFCE7; color: #16A34A; }                /* Green */
.update { background: #DBEAFE; color: #2563EB; }                /* Blue */
.delete { background: #FEE2E2; color: #DC2626; }                /* Red */
.login { background: #F3F4F6; color: #6B7280; }                 /* Gray */
```

### Table Styling
- Header: Background `#F1F5F9`, text bold, font-size 12px, uppercase
- Rows: Alternating white and `#F8FAFC`
- Hover: `#F1F5F9`
- Border between rows: 1px `#E2E8F0`

### Form Inputs
- Height: 40px
- Border: 1px `#E2E8F0`
- Focus: Border `#2563EB`, box-shadow `0 0 0 3px rgba(37,99,235,0.1)`
- Border-radius: 6px
- Label: Above input, font-size 14px, font-weight 500

### Buttons
- Primary: Background `#2563EB`, text white, hover `#1D4ED8`
- Secondary: Background white, border `#E2E8F0`, text `#1E293B`, hover background `#F8FAFC`
- Danger: Background `#DC2626`, text white, hover `#B91C1C`
- Height: 40px (default), 36px (small)
- Border-radius: 6px

---

## 5. SAMPLE DATA FOR REALISM

### Senegalese Names
- Moussa Diop, Aminata Sow, Cheikh Mbaye, Fatou Faye, Ousmane Kane
- Mamadou Sy, Mariama Bâ, Papa Diarra, Ngoné Diop, Ibrahima Fall
- Souleymane Ndiaye, Adama Touré, Khady Gning, Abdoulaye Diallo, Astou Kane

### Plastic Types (for Collections)
- Plastique PP (Polypropylène)
- PEHD (Polyéthylène haute densité)
- PET (Polyéthylène téréphtalate)
- LDPE (Polyéthylène basse densité)
- Broyat Mixte
- Plastique Clean (cleaned)

### Products (for Orders)
- Granulés PEHD
- Granulés PP
- Broyat PET clair
- Broyat PET foncé
- Plaques d extrusion

### Amounts (in FCA)
- Small: 15,000 - 50,000
- Medium: 50,000 - 200,000
- Large: 200,000 - 1,000,000
- Very large: 1,000,000+

---

## 6. TOTAL SCREENS SUMMARY

| # | Screen | Role Access |
|---|--------|-------------|
| 1 | Login | All |
| 2 | Dashboard - Director | Director |
| 3 | Dashboard - Commercial | Commercial |
| 4 | Dashboard - Collector | Collector |
| 5 | Clients List | Director, Commercial |
| 6 | Client Detail | Director, Commercial |
| 7 | Client Form (Create/Edit) | Director, Commercial |
| 8 | Orders List | Director, Commercial |
| 9 | Order Detail | Director, Commercial |
| 10 | New Order Form | Commercial |
| 11 | Payment Modal | Commercial |
| 12 | Collections List | Director, Collector |
| 13 | Collection Detail | Director, Collector |
| 14 | New Collection Form | Collector |
| 15 | Invoices List | Director, Commercial |
| 16 | Notifications | All |
| 17 | Audit Trail | Director |

**Total: 17 unique screens to design**
