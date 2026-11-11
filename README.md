# IEM Admission Portal — Prototype System

> **Institute of Engineering & Management (IEM), Kolkata**  
> **Course:** PCCCS594 — Software Engineering & Project Management Laboratory  
> **Team:** 404 Brain Not Found (Team 10 — Batch 2024–2028, 5th Semester / 3rd Year)  
> **Team Members:**
> - **Debarghya Mitra (248)** — Project Manager
> - **Arka Ghosh Dastider (220)** — UI/UX Designer
> - **Diptomoy Das (227)** — Full-Stack Engineer
> - **Jitesh Jana (243)** — Quality Assurance (QA) Engineer
> - **Jatin Kumar (232)** — Software Architect

---

## Live Deployments & Console

- **Live Production URL (Firebase Hosting):** [https://iem-admission-404bn.web.app](https://iem-admission-404bn.web.app)
- **Alternate Domain:** [https://iem-admission-404bn.firebaseapp.com](https://iem-admission-404bn.firebaseapp.com)
- **Firebase Project Console:** [https://console.firebase.google.com/project/iem-admission-404bn/overview](https://console.firebase.google.com/project/iem-admission-404bn/overview)
- **GitHub Repository:** [https://github.com/GhostMitra/SWE-Lab-C6-P10-248-220-227-243-232](https://github.com/GhostMitra/SWE-Lab-C6-P10-248-220-227-243-232)
- **Local Development Portal:** [http://localhost:5000](http://localhost:5000)
- **Firebase Project ID:** `iem-admission-404bn`

---

## 1. System Overview & Architecture

This prototype is built according to the **SRS (Assignment 2)**, **HLD & System Modeling Diagrams (Assignment 3)**, and **Software Test Plan (Assignment 4)**.

It implements a modern **100% Firebase & MEAN hybrid persistence architecture** (No MongoDB — pure Firebase NoSQL & SQL):
1. **Frontend**:
   - **Angular 22 Single Page Application**: Standalone components, reactive signals, responsive Bootstrap 5 interface, and Firebase Client SDK v10.
2. **Backend Services & Cloud Functions**:
   - **Express.js API Layer**: Modular routing, Multer upload streaming, JWT verification, and Firebase Admin SDK.
   - **Firebase Cloud Functions**: Serverless runtime exportable via `backend/index.js` (`exports.api`).
3. **NoSQL Database (Firebase Cloud Firestore)**:
   - Application draft auto-saving (`application_drafts/{userId}`).
   - Asynchronous notification queue (`notification_queue`).
   - Unformatted audit logging (`audit_logs`).
   - Security rules defined in `firestore.rules`.
4. **Relational SQL Database (Firebase Data Connect / Cloud SQL / PostgreSQL Schema)**:
   - Strict relational schema matching the **UML Class Diagram** (`users`, `applicants`, `admission_officers`, `administrators`, `courses`, `applications`, `documents`, `payments`, `notifications`, `audit_trail`).
   - ACID transaction support, foreign key cascades, composite merit ranking, and eligibility checks.
   - Defined in `dataconnect/schema/schema.gql`, `dataconnect/connector/queries.gql`, and `backend/database/schema.sql`.
5. **Cloud Object Storage (Firebase Cloud Storage Bucket)**:
   - Bucket URI: `gs://iem-admission-404bn.appspot.com`
   - Sub-buckets:
     - `/academic-docs`: 10th & 12th Marksheet PDFs.
     - `/candidate-media`: Passport photos & signatures.
     - `/verification-certs`: Aadhaar / Government ID proofs.
     - `/generated-letters`: Official downloadable Provisional Admission Offer Letters.
   - Security rules defined in `storage.rules`.

---

## 2. Firebase Capabilities & Deployment Guide

The system is engineered from the ground up to be **100% Firebase-capable**, supporting:

### A. Firebase Authentication (Auth SDK v10)
- **Google Sign-In**: Integrated with `GoogleAuthProvider` popup/redirect.
- **Email & Password**: Direct user creation and authentication.
- **Server Verification**: The Express API verifies Firebase JWT ID tokens via the `firebase-admin` SDK (`admin.auth().verifyIdToken()`).

### B. Firebase Cloud Storage Bucket (`gs://iem-admission-portal.appspot.com`)
- **Direct & Streamed Upload**: Student marksheets and certificates are routed to partitioned sub-buckets (`/academic-docs`, `/candidate-media`, `/verification-certs`).
- **Security Rules**: Enforced via [`storage.rules`](file:///C:/Users/debarghaya/Projects/SWE-Lab/storage.rules).
- **Official Admit Letters**: Auto-generated into `/generated-letters` upon application approval.

### C. Firebase Cloud Firestore (NoSQL Document Store)
- **Draft Autosaving**: In-progress admission form drafts sync to Firestore collection `application_drafts/{userId}`.
- **Audit Logging**: Application submission and approval events sync to `audit_logs`.
- **Security Rules**: Defined in [`firestore.rules`](file:///C:/Users/debarghaya/Projects/SWE-Lab/firestore.rules).

### D. Firebase Data Connect (SQL Database Engine on Cloud SQL)
- **Relational PostgreSQL Schema**: Defined in [`dataconnect/schema/schema.gql`](file:///C:/Users/debarghaya/Projects/SWE-Lab/dataconnect/schema/schema.gql).
- **Connector Queries & Mutations**: Defined in [`dataconnect/connector/queries.gql`](file:///C:/Users/debarghaya/Projects/SWE-Lab/dataconnect/connector/queries.gql) and [`dataconnect/connector/mutations.gql`](file:///C:/Users/debarghaya/Projects/SWE-Lab/dataconnect/connector/mutations.gql).

### E. Deploying to Firebase

#### Option 1: 1-Click Deployment Script
- **Windows (Command Prompt / PowerShell)**:
  ```cmd
  deploy.bat
  ```
- **Linux / macOS**:
  ```bash
  chmod +x deploy.sh
  ./deploy.sh
  ```
*This compiles the Angular production bundle, sets the Firebase project to `iem-admission-404bn`, and deploys Hosting, Firestore rules/indexes, and Storage rules.*

#### Option 2: Automated GitHub Actions CI/CD (Deploy on Merge & PR)
GitHub Actions workflows are configured in `.github/workflows/`:
- [`.github/workflows/firebase-hosting-merge.yml`](file:///.github/workflows/firebase-hosting-merge.yml): Triggered on push/merge to `master` or `main`.
- [`.github/workflows/firebase-hosting-pull-request.yml`](file:///.github/workflows/firebase-hosting-pull-request.yml): Triggered on Pull Requests (creates live preview channels).

Every time code is pushed to `master` or `main`:
1. Installs backend and frontend dependencies using locked packages.
2. Runs the automated verification test suite (PCCCS594 TC-S01 to TC-S07).
3. Compiles the Angular production distribution (`npm run build`).
4. Automatically deploys to Firebase Hosting via `FirebaseExtended/action-hosting-deploy`.

To enable automatic GitHub deployment:
1. Generate a Firebase CI token via `npx firebase-tools login:ci` OR obtain a service account JSON key from Firebase Console -> Project Settings -> Service accounts.
2. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
3. Add a repository secret:
   - Name: `FIREBASE_TOKEN` (for CLI token) or `FIREBASE_SERVICE_ACCOUNT_IEM_ADMISSION_404BN` (for Service Account JSON).
4. Any `git push` to `master` or `main` will automatically build and deploy to [https://iem-admission-404bn.web.app](https://iem-admission-404bn.web.app)!

#### Option 3: Manual Firebase CLI
1. **Link your Firebase Project**:
   ```bash
   npx firebase-tools use iem-admission-404bn
   ```
2. **Build & Deploy Hosting (Angular Frontend)**:
   ```bash
   cd frontend && npm run build && cd ..
   npx firebase-tools deploy --only hosting
   ```
3. **Deploy Security Rules (Storage & Firestore)**:
   ```bash
   npx firebase-tools deploy --only storage,firestore
   ```
4. **Deploy Backend API (Cloud Functions - requires Blaze Plan)**:
   ```bash
   npx firebase-tools deploy --only functions
   ```
5. **Run Local Firebase Emulator Suite**:
   ```bash
   npx firebase-tools emulators:start
   ```

---

## 3. Diagram Traceability & Functional Modules

The prototype directly mirrors the design diagrams submitted in the laboratory worksheet:

| Diagram | Implemented Feature in Prototype | Source Artifact |
| :--- | :--- | :--- |
| **UML Use Case** | Role-based authentication (Applicant, Officer, Admin), Catalog Explorer, Multi-step Application, Document Upload, Payment Checkout, Dossier Review, Merit List, and Admit Letter. | `IEM_Admission_Portal_UseCase_4_3_Portrait.drawio` |
| **Level-0 & Level-1 DFD** | 1.0 Registration & Login (D1 Users), 2.0 Application Management (D2 Applications), 3.0 Fee Processing (D3 Payments), 4.0 Review & Evaluation, 5.0 Notifications & Letters. | `IEM_Admission_Portal_DFD_4_3_Portrait.drawio` |
| **UML Sequence** | End-to-end synchronized calls: Form submission -> Readiness validation -> Gateway charge authorization -> Status update to `SUBMITTED` -> Officer review -> Admit letter generation. | `IEM_Admission_Portal_Sequence_4_3_Portrait.drawio` |
| **UML Activity** | Complete decision branching for form validation, payment failure retry, document verification, and approve/reject decision path. | `IEM_Admission_Portal_Activity_4_3_Portrait.drawio` |
| **UML Class & Structure Chart** | Executive Control Module (0.0) down to Subsystems 1.0–5.0; exact entity attributes and relationships implemented in `backend/database/schema.sql` and `models/sql-models.js`. | `IEM_Admission_Portal_Class_and_StructureChart_4_3_Portrait.drawio` |
| **High-Level Architecture (HLD)** | 5-layer enterprise stack: Presentation (Angular SPA) -> API Gateway -> Microservices (Express) -> Relational DB (SQL) + NoSQL Cache + Cloud Object Storage Bucket -> Payment & Notification Gateways. | `IEM_Admission_Portal_HLD_Architecture_4_3_Portrait.drawio` |

---

## 3. Four Core Screens Implemented (Worksheet Section 6)

1. **Screen 1: Admin Dashboard & Executive Control (`/admin`)**
   - KPI telemetry (Total applications, fee revenue collected, storage bucket bytes, SQL table count).
   - Dynamically ranked Merit List calculated via formula:  
     $$\text{Merit Score} = (0.60 \times \text{12th \%}) + (0.40 \times \text{10th \%})$$
   - Storage Bucket Inspector displaying files stored in `gs://iem-admission-portal.appspot.com`.
   - Relational SQL User Management and NoSQL Document Store inspection.
2. **Screen 2: Admission Officer Portal (`/officer`)**
   - Queue of submitted applications with status filtering (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`).
   - Detailed Applicant Dossier view with candidate bio and academic marks.
   - Document authentication checklist (Verify/Reject buttons for 10th marksheet, 12th marksheet, and ID proof).
   - Approve / Reject decision panel with mandatory audit remarks.
3. **Screen 3: Student Portal (`/student`)**
   - Interactive 5-step application timeline stepper.
   - White-Box Basis Path Readiness Checklist (`formComplete`, `documentsUploaded`, `feePaid`).
   - Storage bucket files list with instant view links.
   - Download Official Provisional Admission Offer Letter once approved.
4. **Screen 4: Document Upload & Payment Portal (`/apply`)**
   - Multi-step form with program selection (B.Tech CSE, IT, ECE, BCA, MCA).
   - "Auto-Save Draft to NoSQL Store" button (demonstrating MongoDB draft caching).
   - Cloud Storage Bucket document upload interface (PDF/PNG/JPG).
   - Secure Fee Payment Gateway Checkout (₹1,000 via UPI, Card, or NetBanking) with instant transaction receipt generation.

---

## 4. Quick Start & Execution

### Prerequisites
- Node.js (v18+ or v22+)
- npm (v9+)

### Single-Command Launch (Unified Production Mode)
Run:
```bash
npm start
```
or double-click `start.bat` on Windows.

Then open your browser at:
**[http://localhost:5000](http://localhost:5000)**

*(The Express backend serves the pre-built Angular Single Page Application and the full REST API together on port 5000).*

### Running Automated Test Suite (Assignment 4 Test Plan)
To verify all test cases (TC-S01 through TC-S07):
```bash
npm test
```

### Re-seeding the Database
To reset the relational SQL database, NoSQL store, and default users:
```bash
npm run seed
```

---

## 5. Demo Test Accounts (1-Click Login on UI)

The portal includes 1-click quick-login buttons on the Sign In page for rapid grading and demonstration:

| Role | Email | Password | Pre-seeded State |
| :--- | :--- | :--- | :--- |
| **Student / Applicant** | `applicant@iem.edu.in` | `Student@123` | Application `APP-2026-1001` submitted & paid |
| **Admission Officer** | `officer@iem.edu.in` | `Officer@123` | Access to evaluation queue & document verification |
| **Administrator** | `admin@iem.edu.in` | `Admin@123` | Executive control, KPI stats, merit list & audit logs |

---

## 6. Project Directory Structure

```
SWE-Lab/
├── backend/
│   ├── config/
│   │   ├── database.js          # Relational SQL Database Connection & Query Engine
│   │   └── firebase.js          # Firebase Admin SDK & Client configuration
│   ├── database/
│   │   ├── schema.sql           # SQL Schema (Users, Apps, Docs, Payments, Audit)
│   │   ├── seed.js              # Initial database seed script
│   │   └── iem_admission.sqlite # Persistent Relational SQL Database
│   ├── dataconnect/             # Firebase Data Connect (PostgreSQL) Config
│   │   ├── dataconnect.yaml
│   │   └── schema/schema.gql
│   ├── middleware/
│   │   └── auth.js              # JWT & Firebase Token Verification & RBAC
│   ├── models/
│   │   ├── sql-models.js        # SQL Relational Repositories
│   │   └── mongo-models.js      # MongoDB / Document Store (Drafts & Logs)
│   ├── routes/
│   │   ├── admin.routes.js       # Executive Analytics & Merit List
│   │   ├── application.routes.js # Multi-step Application & Workflow
│   │   ├── auth.routes.js        # Register, Login, Firebase Auth
│   │   ├── course.routes.js      # Academic Programs & Cutoffs
│   │   ├── document.routes.js    # Document Metadata & Verification
│   │   ├── nosql.routes.js       # NoSQL Inspection Endpoints
│   │   ├── notification.routes.js# User Notification Alerts
│   │   ├── payment.routes.js     # Payment Gateway Simulation
│   │   └── storage.routes.js     # Cloud Storage Bucket Streaming
│   ├── services/
│   │   ├── readiness.service.js  # White-box Basis Path Model
│   │   └── storage-bucket.service.js # Cloud Object Storage & Admit Letter Generator
│   ├── storage-bucket/          # Cloud Object Storage Directories
│   │   ├── academic-docs/       # 10th & 12th Marksheet PDFs
│   │   ├── candidate-media/     # Photos & Signatures
│   │   ├── generated-letters/   # Official Admission Letters
│   │   └── verification-certs/  # Identity Proofs
│   ├── test/
│   │   └── integration-test.js  # Automated Test Suite (TC-S01 to TC-S07)
│   ├── package.json
│   └── server.js                # Express Server & Static Frontend Host
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── admin/       # Screen 1: Admin Dashboard
│   │   │   │   ├── apply/       # Screen 4: Form, Bucket Upload & Payment
│   │   │   │   ├── auth/        # Authentication & Role Switcher
│   │   │   │   ├── home/        # Academic Course Catalog
│   │   │   │   ├── navbar/      # Top Navigation & Architecture Pill
│   │   │   │   ├── officer/     # Screen 2: Admission Officer Review
│   │   │   │   └── student/     # Screen 3: Student Status & Stepper
│   │   │   ├── services/
│   │   │   │   └── api.service.ts # Unified Reactive API & Signal Store
│   │   │   ├── app.routes.ts    # Client-side Routing
│   │   │   ├── app.ts           # Root Standalone Component
│   │   │   └── app.html         # Shell Layout & Team Footer
│   │   ├── styles.css           # Global Theme & Stepper Styling
│   │   └── index.html           # HTML Shell & Fonts
│   └── package.json
├── firebase.json                # Firebase Hosting, Storage & Emulator Config
├── .firebaserc                  # Firebase Project Mapping
├── storage.rules                # Firebase Storage Bucket Security Rules
├── package.json                 # Root Scripts
├── start.bat                    # Windows One-Click Launcher
└── README.md
```
