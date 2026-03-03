# 🔗 Algorand Supply Chain — Blockchain-Powered Supply Chain Management Platform
A full-stack, production-ready **B2B SaaS platform** that brings **transparency, traceability, and AI-powered risk analysis** to supply chain operations using the **Algorand blockchain**. Every critical event — from batch creation to risk detection — is immutably recorded on-chain, and a public verification page with QR codes lets anyone verify product authenticity.
---
## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Installation & Setup](#-installation--setup)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Root-Level Setup (Algorand Scripts)](#2-root-level-setup-algorand-scripts)
  - [3. SaaS Backend Setup](#3-saas-backend-setup)
  - [4. Dashboard (Next.js Frontend) Setup](#4-dashboard-nextjs-frontend-setup)
  - [5. FastAPI Risk-Analysis Microservice](#5-fastapi-risk-analysis-microservice)
- [Running the Application](#-running-the-application)
- [Key Features](#-key-features)
- [API Reference](#-api-reference)
  - [Next.js API Routes (Dashboard)](#nextjs-api-routes-dashboard)
  - [Express Backend API Routes](#express-backend-api-routes)
  - [FastAPI Microservice](#fastapi-microservice-1)
- [AI Agents](#-ai-agents)
- [Algorand Blockchain Integration](#-algorand-blockchain-integration)
- [Firebase & Firestore](#-firebase--firestore)
- [Database Schema (Prisma)](#-database-schema-prisma)
- [Deployment](#-deployment)
- [License](#-license)
---
## 🏗 Architecture Overview
```
┌──────────────────┐      ┌─────────────────────┐      ┌──────────────────────┐
│   Next.js 16     │      │  Express + Prisma    │      │  FastAPI (Python)     │
│   Dashboard      │◄────►│  SaaS Backend        │◄────►│  Risk Analysis       │
│   (Port 3000)    │      │  (Port 3001)         │      │  Microservice        │
│                  │      │                      │      │  (Port 8000)         │
│  • Firebase Auth │      │  • RBAC Middleware    │      │                      │
│  • Gemini AI     │      │  • Firebase Admin     │      │  POST /analyze-batch │
│  • Algorand SDK  │      │  • PostgreSQL (DB)    │      └──────────────────────┘
│  • Recharts      │      │  • Prisma ORM         │
│  • QR Codes      │      └──────────┬────────────┘
└──────────┬───────┘                 │
           │                         │
           ▼                         ▼
   ┌───────────────┐        ┌───────────────────┐
   │  Cloud         │        │  Algorand          │
   │  Firestore     │        │  Testnet           │
   │  (NoSQL DB)    │        │  (Blockchain)      │
   └───────────────┘        └───────────────────┘
```
---
## 🧰 Tech Stack
| Layer           | Technology                                                         |
| --------------- | ------------------------------------------------------------------ |
| **Frontend**    | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion    |
| **Auth**        | Firebase Authentication (Google Sign-In)                           |
| **Database**    | Cloud Firestore (NoSQL) + PostgreSQL 15 (via Prisma ORM)           |
| **Backend API** | Express 5 (Node.js) with Firebase Admin SDK                        |
| **Blockchain**  | Algorand Testnet (`algosdk` v3.5) — AlgoNode public endpoints      |
| **AI / ML**     | Google Gemini API (`@google/generative-ai`), FastAPI risk analysis |
| **Charts**      | Recharts 3                                                         |
| **QR Codes**    | `qrcode.react`                                                     |
| **Infra**       | Docker Compose (PostgreSQL), Uvicorn (FastAPI)                     |
---
## 📂 Project Structure
```
algorand/
│
├── .env                          # Root env (Algorand mnemonic, DB URL)
├── .env.example                  # Template for root env vars
├── package.json                  # Root dependencies (algosdk, pg, dotenv)
├── requirements.txt              # Python dependencies (fastapi, uvicorn, pydantic)
├── firestore.rules               # Cloud Firestore security rules
│
├── setup_wallet.js               # 🔑 Generate new Algorand wallet + save to .env
├── supply_chain_recorder.js      # 📝 Record risk events on Algorand + save TxID to PostgreSQL
├── main.py                       # 🐍 FastAPI microservice for batch risk analysis
│
├── dashboard/                    # 🖥  Next.js 16 Frontend Application
│   ├── .env.local                # Firebase + Algorand + Gemini keys
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── (marketing)/      # Public marketing / landing pages
│   │   │   ├── login/            # Firebase Google Sign-In page
│   │   │   ├── onboarding/       # Company onboarding wizard
│   │   │   ├── dashboard/        # Main dashboard (overview, charts)
│   │   │   ├── orders/           # Orders management + order detail
│   │   │   ├── supply-chain/     # Supply chain pipeline tracking
│   │   │   ├── alerts/           # Anomaly & risk alerts page
│   │   │   ├── blockchain/       # Blockchain ledger & transactions
│   │   │   ├── agents/           # AI Agents hub page
│   │   │   ├── team/             # Team member management
│   │   │   ├── admin/            # Super-admin panel
│   │   │   ├── company-admin/    # Company-admin panel
│   │   │   ├── settings/         # User settings
│   │   │   ├── verify/[batchId]/ # 🌐 Public certificate verification page
│   │   │   └── api/              # Next.js API routes
│   │   │       ├── agents/       # AI Agent endpoints
│   │   │       │   ├── chain-chat/       # Gemini-powered supply chain chat
│   │   │       │   ├── compliance/       # Compliance analysis engine
│   │   │       │   ├── forecast/         # Demand forecasting agent
│   │   │       │   ├── risk-guard/       # Risk detection agent
│   │   │       │   └── trust-score/      # Supplier trust scoring
│   │   │       ├── algorand/
│   │   │       │   ├── record/           # Record batch data on-chain
│   │   │       │   └── record-risk/      # Record risk events on-chain
│   │   │       ├── batches/              # Batch CRUD
│   │   │       ├── orders/               # Order CRUD
│   │   │       ├── onboarding/           # Company onboarding
│   │   │       ├── public/               # Public verification data
│   │   │       └── risks/                # Risk event management
│   │   ├── components/
│   │   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   │   ├── ConditionalLayout.tsx     # Auth-aware layout wrapper
│   │   │   ├── LoginButton.tsx           # Google sign-in button
│   │   │   ├── AnomaliesAlerts.tsx       # Alert display widget
│   │   │   ├── EfficiencyChart.tsx       # Recharts efficiency chart
│   │   │   ├── ProductionTimeline.tsx    # Production timeline widget
│   │   │   └── ui/                       # Shared UI primitives
│   │   ├── context/
│   │   │   └── AuthContext.tsx           # Firebase auth React context
│   │   └── lib/
│   │       ├── algorand.ts              # Algorand SDK wrapper (wallet gen, encrypt, record)
│   │       ├── firebase.ts              # Firebase client config
│   │       ├── firestore.ts             # Firestore CRUD helpers
│   │       └── mockData.ts              # Fallback mock data
│   └── public/                          # Static assets (logo, favicon, images)
│
└── saas-backend/                 # ⚙️  Express + Prisma Backend
    ├── .env                      # Backend env (DB URL, Firebase service account)
    ├── docker-compose.yml        # PostgreSQL 15 container
    ├── package.json
    ├── prisma/
    │   └── schema.prisma         # Database schema (Company, User, Order, Batch, RiskEvent)
    ├── src/
    │   ├── index.ts              # Express app entry point
    │   ├── config/
    │   │   └── firebase-admin.ts # Firebase Admin SDK setup
    │   ├── middleware/
    │   │   ├── auth.ts           # Firebase token verification middleware
    │   │   └── rbac.ts           # Role-based access control middleware
    │   └── routes/
    │       ├── admin.ts          # SuperAdmin routes
    │       ├── batches.ts        # Batch CRUD + stage updates
    │       ├── companies.ts      # Company management
    │       ├── orders.ts         # Order management
    │       └── public.ts         # Public verification endpoints
    └── tsconfig.json
```
---
## ✅ Prerequisites
Make sure the following are installed on your machine before proceeding:
| Tool        | Version | Purpose                             | Install Link                                                  |
| ----------- | ------- | ----------------------------------- | ------------------------------------------------------------- |
| **Node.js** | ≥ 18.x  | JavaScript runtime                  | [nodejs.org](https://nodejs.org/)                             |
| **npm**     | ≥ 9.x   | Package manager (bundled with Node) | Included with Node.js                                         |
| **Python**  | ≥ 3.9   | FastAPI microservice                | [python.org](https://www.python.org/downloads/)               |
| **Docker**  | Latest  | PostgreSQL container                | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git**     | Latest  | Version control                     | [git-scm.com](https://git-scm.com/)                           |
---
## 🔐 Environment Variables
### Root `.env` (Algorand + PostgreSQL)
Create a `.env` file in the project root (or use `setup_wallet.js` to generate one):
```env
# PostgreSQL Database Connection String
DATABASE_URL=postgresql://saas_user:saas_password@localhost:5432/saas_db
# Algorand Testnet Central Wallet Mnemonic (25 words)
ALGORAND_WALLET_MNEMONIC="word1 word2 word3 ... word25"
```
### Dashboard `.env.local` (`dashboard/.env.local`)
```env
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
# Algorand Testnet Central Wallet Mnemonic (25 words)
ALGORAND_WALLET_MNEMONIC="word1 word2 word3 ... word25"
# Google Gemini API Key (for AI agents)
GEMINI_API_KEY="your_gemini_api_key"
```
### SaaS Backend `.env` (`saas-backend/.env`)
```env
DATABASE_URL=postgresql://saas_user:saas_password@localhost:5432/saas_db
PORT=3001
FIREBASE_SERVICE_ACCOUNT_KEY=path/to/serviceAccountKey.json
```
---
## 🚀 Installation & Setup
### 1. Clone the Repository
```bash
git clone https://github.com/your-username/algorand-supply-chain.git
cd algorand-supply-chain
```
### 2. Root-Level Setup (Algorand Scripts)
```bash
# Install root dependencies (algosdk, pg, dotenv)
npm install
# Generate a new Algorand Testnet wallet and save mnemonic to .env
node setup_wallet.js
```
After running `setup_wallet.js`, you will see an output like:
```
✅ Generated new Algorand Testnet Account and saved to .env
Public Address:
ABCDEFG...XYZ
Please fund this address using the Algorand Testnet Dispenser:
👉 https://bank.testnet.algorand.network/
```
> **⚠️ IMPORTANT:** You **must** fund the generated wallet address with testnet ALGOs using the [Algorand Testnet Dispenser](https://bank.testnet.algorand.network/) before any blockchain transactions will work.
### 3. SaaS Backend Setup
```bash
# Navigate to the backend directory
cd saas-backend
# Install Node.js dependencies
npm install
# Start PostgreSQL using Docker Compose
docker compose up -d
# The PostgreSQL container will be available at:
#   Host: localhost
#   Port: 5432
#   User: saas_user
#   Password: saas_password
#   Database: saas_db
```
#### Set up the Prisma database schema:
```bash
# Generate the Prisma client
npx prisma generate
# Apply the database migrations (creates all tables)
npx prisma db push
# (Optional) Open Prisma Studio to inspect the database
npx prisma studio
```
#### Configure Firebase Admin SDK:
1. Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts.
2. Click **"Generate new private key"** to download the JSON file.
3. Save it somewhere secure and reference the path in `saas-backend/.env` as `FIREBASE_SERVICE_ACCOUNT_KEY`.
### 4. Dashboard (Next.js Frontend) Setup
```bash
# Navigate to the dashboard directory
cd dashboard
# Install dependencies
npm install
```
#### Configure Firebase Client:
1. Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → General.
2. Under "Your apps", click **Web app** (or create one) and copy the config values.
3. Paste them into `dashboard/.env.local` as the `NEXT_PUBLIC_FIREBASE_*` variables.
#### Configure Gemini AI:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create an API key.
2. Paste the key into `dashboard/.env.local` as `GEMINI_API_KEY`.
### 5. FastAPI Risk-Analysis Microservice
```bash
# From the project root, install Python dependencies
pip install -r requirements.txt
```
---
## ▶ Running the Application
You need **four terminals** to run all services:
### Terminal 1 — PostgreSQL (Docker)
```bash
cd saas-backend
docker compose up -d
```
### Terminal 2 — SaaS Backend (Express API)
```bash
cd saas-backend
npx tsx src/index.ts
```
The backend will start on **http://localhost:3001**.
> **Health check:** `GET http://localhost:3001/health`
### Terminal 3 — Dashboard (Next.js)
```bash
cd dashboard
npm run dev
```
The frontend will start on **http://localhost:3000**.
### Terminal 4 — FastAPI Microservice (Python)
```bash
# From the project root
python main.py
```
> Or using uvicorn directly:
>
> ```bash
> uvicorn main:app --host 0.0.0.0 --port 8000 --reload
> ```
The FastAPI service will start on **http://localhost:8000**.
> **API docs:** `http://localhost:8000/docs` (Swagger UI auto-generated by FastAPI)
---
## ✨ Key Features
### 🔐 Authentication & Authorization
- **Google Sign-In** via Firebase Authentication
- **Role-Based Access Control (RBAC)** — `SuperAdmin`, `Admin`, `Manager`, `Employee`
- Auth-aware layout: marketing pages are public; dashboard routes are protected
- Admin redirect for specific admin email addresses
### 📦 Order & Batch Management
- Create, view, and manage customer orders
- Break orders into trackable **batches** with customizable supply-chain stages
- Employees submit **stage data entries** (temperature, quality inspection, notes) as batches progress
- Latency anomaly detection triggers when stage transitions exceed expected intervals
### ⛓ Algorand Blockchain Integration
- **On-chain recording**: Batch data and risk events are recorded as 0-ALGO self-transfer transactions with JSON payloads in the `note` field
- **Wallet management**: Auto-generate wallets per user, encrypted with AES-256-GCM
- **Transaction verification**: Look up any transaction via the Algorand Indexer
- **Explorer links**: Direct links to [Pera Explorer](https://testnet.explorer.perawallet.app/) for each transaction
### 🤖 AI Agents (Gemini-Powered)
- **ChainChat** — Conversational AI for supply chain queries
- **Compliance** — Automated compliance scoring across 6 checks (blockchain traceability, cold chain, documentation, QA, risk management, data completeness)
- **Forecast** — Demand forecasting agent
- **RiskGuard** — Real-time risk detection and alerting
- **TrustScore** — Supplier trust/reliability scoring
### 📊 Dashboard & Visualization
- Real-time overview dashboard with KPI cards
- **Efficiency charts** (Recharts) and **production timeline** widgets
- **Anomaly alerts** display with severity indicators
- **Blockchain ledger** page showing all on-chain transactions
### 🌐 Public Verification
- **Certificate of Authenticity** page at `/verify/[batchId]`
- Displays product origin, supply chain stages, risk events, and blockchain proof
- **QR code generation** — downloadable QR codes linking to the verification page
- No authentication required — fully public for consumers
### 👥 Team & Company Management
- Invite team members and assign roles
- Company onboarding wizard with custom pipeline stage configuration
- Company-admin and super-admin panels
---
## 📡 API Reference
### Next.js API Routes (Dashboard)
All routes are prefixed with `/api/` and served from the Next.js app on port 3000.
| Method | Endpoint                       | Description                              | Auth Required |
| ------ | ------------------------------ | ---------------------------------------- | ------------- |
| POST   | `/api/agents/chain-chat`       | Chat with Gemini AI about supply chain   | Yes           |
| POST   | `/api/agents/compliance`       | Run compliance analysis on batch data    | Yes           |
| POST   | `/api/agents/forecast`         | Get demand forecast predictions          | Yes           |
| POST   | `/api/agents/risk-guard`       | Analyze batch for risk detection         | Yes           |
| POST   | `/api/agents/trust-score`      | Calculate supplier trust score           | Yes           |
| POST   | `/api/algorand/record`         | Record batch data on Algorand blockchain | Yes           |
| POST   | `/api/algorand/record-risk`    | Record risk event on Algorand blockchain | Yes           |
| GET    | `/api/batches`                 | Get batches for a company                | Yes           |
| POST   | `/api/batches`                 | Create a new batch                       | Yes           |
| GET    | `/api/orders`                  | Get orders for a company                 | Yes           |
| POST   | `/api/orders`                  | Create a new order                       | Yes           |
| POST   | `/api/onboarding`              | Onboard a new company                    | Yes           |
| GET    | `/api/public/verify/[batchId]` | Get public batch verification data       | **No**        |
| GET    | `/api/risks`                   | Get risk events for a company            | Yes           |
### Express Backend API Routes
Served from the Express backend on port 3001. All routes prefixed with `/api/`.
| Method | Endpoint           | Description                      | Auth Required |
| ------ | ------------------ | -------------------------------- | ------------- |
| GET    | `/health`          | Health check endpoint            | No            |
| GET    | `/api/public/*`    | Public verification endpoints    | No            |
| \*     | `/api/admin/*`     | SuperAdmin-only routes           | Yes (SA)      |
| \*     | `/api/companies/*` | Company management               | Yes           |
| \*     | `/api/orders/*`    | Order CRUD operations            | Yes           |
| \*     | `/api/batches/*`   | Batch management + stage updates | Yes           |
### FastAPI Microservice
Served on port 8000.
| Method | Endpoint         | Description                    | Request Body                                                                                                |
| ------ | ---------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| POST   | `/analyze-batch` | Analyze batch timing for risks | `{ "batchId": "string", "stage": "string", "timeElapsedMinutes": float, "expectedIntervalMinutes": float }` |
**Response:**
```json
{
  "Risk Type": "High Latency Risk",
  "Confidence Score": 0.85,
  "Batch ID": "BATCH-7890"
}
```
---
## 🤖 AI Agents
The platform includes 5 AI agents accessible from the **Agents** page in the dashboard:
### 1. ChainChat 💬
- **Endpoint:** `POST /api/agents/chain-chat`
- **Power:** Google Gemini generative AI
- **Use case:** Ask natural-language questions about your supply chain, get insights, and troubleshoot issues
- **Input:** `{ "message": "string", "companyId": "string" }`
### 2. Compliance Agent ✅
- **Endpoint:** `POST /api/agents/compliance`
- **Use case:** Runs 6 automated compliance checks and returns a score (0–100%)
- **Checks performed:**
  1. Blockchain Traceability — % of batches recorded on Algorand
  2. Cold Chain Compliance — Temperature monitoring and violations
  3. Stage Documentation — Completeness of batch stage entries
  4. Quality Assurance — Inspection pass/fail rates
  5. Risk Management — High-risk event documentation
  6. Data Completeness — Missing fields in batch entries
### 3. Forecast Agent 📈
- **Endpoint:** `POST /api/agents/forecast`
- **Use case:** Demand forecasting based on historical order patterns
### 4. RiskGuard 🛡
- **Endpoint:** `POST /api/agents/risk-guard`
- **Use case:** Real-time anomaly/risk detection for batch timing and supply chain flow
### 5. TrustScore 🏆
- **Endpoint:** `POST /api/agents/trust-score`
- **Use case:** Evaluates supplier reliability and generates a trust score
---
## ⛓ Algorand Blockchain Integration
### How It Works
1. **Wallet Generation** (`setup_wallet.js` or `lib/algorand.ts`):
   - Generates a new Algorand keypair + 25-word mnemonic
   - Stores the mnemonic in environment variables
   - Per-user wallets are encrypted with AES-256-GCM before storage
2. **Recording Events** (`lib/algorand.ts`):
   - Constructs a **0-ALGO self-transfer** transaction
   - Embeds a JSON payload in the transaction's `note` field
   - Signs with the wallet's secret key
   - Submits to the **Algorand Testnet** via [AlgoNode](https://algonode.io/) public endpoints
   - Waits for confirmation (up to 4 rounds)
   - Returns the Transaction ID (TxID)
3. **Verification** (`lookupTransaction`):
   - Queries the Algorand Testnet Indexer
   - Decodes the `note` field to retrieve the original JSON payload
   - Provides the confirmation round number
4. **Explorer URLs**:
   - Each transaction links to: `https://testnet.explorer.perawallet.app/tx/{txId}`
### Standalone Testing
You can test the blockchain recording directly:
```bash
# From the project root (make sure .env has a funded mnemonic)
node supply_chain_recorder.js
```
This sends a sample risk event to the Algorand Testnet and prints the TxID.
---
## 🔥 Firebase & Firestore
### Authentication
- **Provider:** Google Sign-In via Firebase Auth
- **Frontend:** Firebase Client SDK (React Context in `AuthContext.tsx`)
- **Backend:** Firebase Admin SDK for token verification (middleware in `saas-backend/src/middleware/auth.ts`)
### Firestore Collections
| Collection         | Access                   | Description                                    |
| ------------------ | ------------------------ | ---------------------------------------------- |
| `pending_requests` | Public create, Auth read | Access request submissions                     |
| `companies`        | Public read, Auth write  | Company profiles and pipeline stages           |
| `users`            | Auth read/write          | User profiles linked to Firebase UID           |
| `company_roles`    | Public read, Auth write  | Role assignments (read needed for login check) |
| `orders`           | Auth read/write          | Customer orders                                |
| `batches`          | Public read, Auth write  | Batch records (public for verification page)   |
| `risk_events`      | Public read, Auth write  | Risk event records (public for verification)   |
| `batch_entries`    | Public read, Auth write  | Stage-by-stage data entries for each batch     |
### Deploying Firestore Rules
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools
# Login to Firebase
firebase login
# Deploy the security rules
firebase deploy --only firestore:rules
```
---
## 🗄 Database Schema (Prisma)
The Express backend uses **Prisma ORM** with **PostgreSQL**. The schema is defined in `saas-backend/prisma/schema.prisma`:
```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     Company       │     │      Order        │     │      Batch       │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (UUID)         │────►│ id (UUID)         │────►│ id (UUID)        │
│ name              │     │ description       │     │ batchNumber      │
│ stages[]          │     │ quantity          │     │ currentStage     │
│ createdAt         │     │ expectedInterval  │     │ status           │
│ updatedAt         │     │ status            │     │ algorandTxId?    │
└──────────────────┘     │ companyId (FK)    │     │ companyId (FK)   │
        │                 └──────────────────┘     │ orderId? (FK)    │
        │                                          └──────────────────┘
        │                                                   │
        ▼                                                   ▼
┌──────────────────┐                             ┌──────────────────┐
│      User         │                             │    RiskEvent      │
├──────────────────┤                             ├──────────────────┤
│ id (UUID)         │                             │ id (UUID)        │
│ firebaseUid       │                             │ riskType         │
│ email             │                             │ confidenceScore  │
│ role (Enum)       │                             │ stage            │
│ companyId (FK)    │                             │ algorandTxId?    │
└──────────────────┘                             │ batchId (FK)     │
                                                  │ companyId (FK)   │
  Roles: SuperAdmin │ Admin │ Manager │ Employee  └──────────────────┘
```
### Useful Prisma Commands
```bash
cd saas-backend
# Generate Prisma Client after schema changes
npx prisma generate
# Push schema to database (without migrations)
npx prisma db push
# Create formal migration
npx prisma migrate dev --name <migration-name>
# Open Prisma Studio (visual DB editor)
npx prisma studio
# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```
---
## 🌍 Deployment
### Frontend (Next.js)
Deploy to **Vercel** (recommended):
```bash
cd dashboard
npx vercel --prod
```
Or build a production bundle:
```bash
npm run build
npm start
```
### Backend (Express)
Deploy to any Node.js hosting (e.g., Railway, Render, Fly.io):
```bash
cd saas-backend
npx tsx src/index.ts
```
### FastAPI Microservice
Deploy via Docker or any Python hosting:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```
### PostgreSQL
Use Docker Compose locally or a managed service (e.g., Supabase, Neon, AWS RDS):
```bash
cd saas-backend
docker compose up -d
```
---
## 📝 License
This project is licensed under the **ISC License**.
---
<p align="center">
  Built with ❤️ using <strong>Algorand</strong>, <strong>Next.js</strong>, <strong>Firebase</strong>, and <strong>Gemini AI</strong>
</p>
