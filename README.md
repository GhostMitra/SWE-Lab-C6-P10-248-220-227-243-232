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

- **Live Production Portal (Firebase Hosting):** [https://iem-admission-404bn.web.app](https://iem-admission-404bn.web.app)
- **Alternate Domain:** [https://iem-admission-404bn.firebaseapp.com](https://iem-admission-404bn.firebaseapp.com)
- **Backend API (Google Cloud Functions Gen 2):** [https://us-central1-iem-admission-404bn.cloudfunctions.net/api](https://us-central1-iem-admission-404bn.cloudfunctions.net/api)
- **Firebase Project Console:** [https://console.firebase.google.com/project/iem-admission-404bn/overview](https://console.firebase.google.com/project/iem-admission-404bn/overview)
- **GitHub Repository:** [https://github.com/GhostMitra/SWE-Lab-C6-P10-248-220-227-243-232](https://github.com/GhostMitra/SWE-Lab-C6-P10-248-220-227-243-232)
- **Firebase Project ID:** `iem-admission-404bn`
- **Cloud Storage Bucket:** `gs://iem-admission-404bn.firebasestorage.app`

---

## 1. System Overview & Current Cloud Native Architecture

The system is engineered according to the **SRS (Assignment 2)**, **HLD & System Modeling Diagrams (Assignment 3)**, and **Software Test Plan (Assignment 4)**. It runs a **100% Pure Firebase & Google Cloud Serverless Architecture**:

```
                                 ┌────────────────────────────────────────────────────────┐
                                 │                CLIENT / BROWSER TIER                   │
                                 │       Angular 22 Single-Page Application (SPA)        │
                                 │       • Standalone Components & Signals                │
                                 │       • Bootstrap 5 Responsive UI & Custom Icons       │
                                 │       • Firebase Client SDK v10 (Google Sign-In)       │
                                 └───────────────────────────┬────────────────────────────┘
                                                             │ HTTPS (JSON / Multipart)
                                                             ▼
                                 ┌────────────────────────────────────────────────────────┐
                                 │                 EDGE & ROUTING TIER                    │
                                 │                 Firebase Hosting                       │
                                 │   • Static assets cached globally on Google CDN        │
                                 │   • Rewrites `/api/**` -> Cloud Functions Gen 2 API    │
                                 └───────────────────────────┬────────────────────────────┘
                                                             │
                                                             ▼
                                 ┌────────────────────────────────────────────────────────┐
                                 │              SERVERLESS BACKEND LAYER                  │
                                 │       Google Cloud Functions Gen 2 (Node.js 22)        │
                                 │   • Express.js REST API (`backend/index.js`)           │
                                 │   • JWT Authentication & Role-Based Access Control     │
                                 │   • Busboy universal streaming multipart parser        │
                                 │   • Application Readiness Engine & Merit List Ranker   │
                                 └───────────────┬────────────────────────┬───────────────┘
                                                 │                        │
                       ┌─────────────────────────┴─────────┐    ┌─────────┴────────────────────────┐
                       ▼                                   │    ▼                                  │
       ┌───────────────────────────────┐                   │  ┌──────────────────────────────────┐ │
       │      DATABASE SERVICES        │                   │  │       CLOUD OBJECT STORAGE       │ │
       │   Firebase Cloud Firestore    │                   │  │  Google Cloud Storage Bucket     │ │
       │        (Pure NoSQL)           │                   │  │ gs://iem-admission-404bn.        │ │
       │                               │                   │  │   firebasestorage.app            │ │
       │ • users                       │                   │  │                                  │ │
       │ • applicants                  │                   │  │ • /academic-docs                 │ │
       │ • applications                │                   │  │   (10th & 12th Marksheets)       │ │
       │ • documents                   │                   │  │ • /candidate-media               │ │
       │ • courses                     │                   │  │   (Separate Photo & Signature)   │ │
       │ • payments                    │                   │  │ • /verification-certs            │ │
       │ • audit_logs                  │                   │  │   (Govt Photo ID Proofs)         │ │
       │ • notifications               │                   │  │ • /generated-letters             │ │
       │ • application_drafts          │                   │  │   (Official Admit Offer Letters) │ │
       │ • notification_queue          │                   │  └──────────────────────────────────┘ │
       └───────────────────────────────┘                   └───────────────────────────────────────┘
```

### Key Architectural Pillars

1. **Frontend (Angular 22 SPA)**:
   - Built with Angular Standalone Components, inject-based dependencies, and reactive signals (`signal`, `computed`).
   - Serves role-specific interfaces: Applicant Flow (`/apply`), Student Dashboard (`/student`), Admission Officer Portal (`/officer`), and Admin Executive Control (`/admin`).
   - Enforces real-time field validation, document prerequisite indicators, and instant mock payment checkout.

2. **Backend API (Google Cloud Functions Gen 2 & Express.js)**:
   - Hosted serverlessly on Google Cloud Functions (Gen 2) with Node.js 22 runtime and auto-scaling (`us-central1`).
   - Handles `req.rawBody` buffer consumption natively via a custom Busboy multipart parser, preventing Cloud Functions stream exhaustion crashes.
   - Modular REST routing for Authentication, Applications, Documents, Payments, Admin Analytics, and Audit Logging.

3. **Database (Cloud Firestore NoSQL)**:
   - 10 structured collections with document-level indexing and automated synchronization.
   - Real-time draft auto-saving into `application_drafts/{userId}`.
   - Immutable security audit logs recorded to `audit_logs` on every critical action.
   - Security enforced at the database level via `firestore.rules`.

4. **Cloud Object Storage (Firebase Cloud Storage Bucket)**:
   - Dedicated bucket: `gs://iem-admission-404bn.firebasestorage.app`.
   - Streaming uploads backed by Application Default Credentials (ADC) with automatic `/tmp` fallback for zero-downtime serverless resilience.
   - Automated generation of printable Provisional Admission Offer Letters (`Admit_Letter_{appId}.html`) upon application approval.
   - Enforced by `storage.rules`.

---

## 2. Core Business Rules & Security Enforcements

### A. Role-Based Account Creation & Public Registration Guard
- **Strict Student-Only Public Registration**:
  - The public registration endpoint (`POST /api/auth/register`) strictly rejects any attempts to create accounts with privileged roles (`ADMINISTRATOR`, `ADMIN`, `ADMISSION_OFFICER`, `OFFICER`) by returning **`HTTP 403 Forbidden`**.
  - All public user sign-ups are hard-locked to role **`APPLICANT`**.
  - Official staff accounts (Admission Officers and Administrators) are pre-provisioned securely by IEM.
  - The registration UI displays a read-only role indicator (*"Student / Applicant"*), preventing role tampering.

### B. Mandatory Document Requirements & Payment Gate
- Fee payment checkout (`POST /api/payments/initiate`) is **locked** until all **5 mandatory documents** are uploaded to Cloud Storage:
  1. **Class 10th Secondary Marksheet** (`MARKSHEET_10`) $\rightarrow$ `/academic-docs`
  2. **Class 12th Higher Secondary Marksheet** (`MARKSHEET_12`) $\rightarrow$ `/academic-docs`
  3. **Passport Size Photograph** (`PHOTO`) $\rightarrow$ `/candidate-media`
  4. **Government Photo ID Proof** (`PHOTO_ID` / Aadhaar / Passport / Voter ID) $\rightarrow$ `/verification-certs`
  5. **Candidate Signature** (`SIGNATURE`) $\rightarrow$ `/candidate-media`
- **Strictly Separated Photo & Signature Uploads**:
  - Step 2 provides dedicated side-by-side cards for **Passport Photograph** and **Candidate Signature** with independent file inputs, status badges (`UPLOADED` vs `REQUIRED`), and direct file preview links.
  - Combined uploads are disallowed; both files must exist as independent objects in the Cloud Storage bucket.

### C. Admission Evaluation & Merit Ranking
- Real-time resolution of candidate academic percentages (`tenthPercentage` and `twelfthPercentage`) in both Applicant Dossier and Merit Ranking tables.
- Merit score calculated dynamically:
  $$\text{Merit Score} = (0.60 \times \text{12th \%}) + (0.40 \times \text{10th \%})$$
- Admission Officers can view uploaded documents via direct Cloud Storage bucket URLs, verify or reject them, and approve applications with official remarks.

---

## 3. Four Core Screens Implemented

1. **Screen 1: Admin Dashboard & Executive Control (`/admin`)**
   - Live KPI telemetry (Total applications, confirmed fee revenue, storage bucket count, and Firestore collection sizes).
   - Ranked Merit List with course-specific filters.
   - Cloud Storage Bucket inspector and immutable audit trail.
2. **Screen 2: Admission Officer Review Portal (`/officer`)**
   - Application queue filtered by status (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`).
   - Complete Applicant Dossier with bio, academic percentages, and documents.
   - One-click document verification (`VERIFIED` / `REJECTED`) and Admit Letter issuance.
3. **Screen 3: Student Portal (`/student`)**
   - Interactive 5-step application timeline stepper.
   - White-box basis path readiness indicators (`Form Information`, `Cloud Bucket Documents`, `Fee Paid`).
   - Table of uploaded documents in Cloud Storage with direct view links.
   - Instant download for the official Provisional Admission Offer Letter once approved.
4. **Screen 4: Multi-Step Application, Document Upload & Payment Checkout (`/apply`)**
   - **Step 1**: Personal & academic marks entry with real-time draft saving.
   - **Step 2**: Dedicated upload cards for Passport Photo, Candidate Signature, Photo ID, and Marksheets.
   - **Step 3**: Gated Payment Gateway Checkout (₹1,000 via UPI, Card, NetBanking) with instant transaction receipt generation.

---

## 4. Automated CI/CD & Deployment Guide

### Automated CI/CD via GitHub Actions
Every commit pushed or merged to `master` or `main` automatically triggers our GitHub Actions pipeline (`.github/workflows/firebase-hosting-merge.yml`):

1. **Environment Setup**: Provisions Node.js 22 runtime on Ubuntu.
2. **Dependency Installation**: Restores locked backend and frontend dependencies.
3. **Automated Verification**: Executes test suite (`npm test`) covering **TC-S01 to TC-S07**:
   - `TC-S01`: Student registration and 403 Forbidden check on Admin creation attempt.
   - `TC-S02`: Form validation and missing field error handling.
   - `TC-S03`: Cloud Firestore application persistence.
   - `TC-S04`: Gated payment verification (locked when documents are missing).
   - `TC-S04.1`: Upload of all 5 mandatory documents (Photo, Photo ID, Signature, 10th & 12th marksheets).
   - `TC-S05`: Fee payment initiation and gateway authorization.
   - `TC-S06`: Application status tracking and candidate timeline.
   - `TC-S07`: Admission Officer evaluation and Provisional Admit Letter generation.
4. **Angular Compilation**: Compiles production bundle with optimized chunking (`npm run build`).
5. **Firebase Deployment**: Deploys the web application to Firebase Hosting live channel (`https://iem-admission-404bn.web.app`).

### Manual CLI Deployment Commands

- **Deploy Backend (Cloud Functions Gen 2)**:
  ```bash
  gcloud functions deploy api --gen2 --runtime=nodejs22 --region=us-central1 --source=backend --entry-point=api --trigger-http --allow-unauthenticated --memory=512Mi --timeout=60s --project=iem-admission-404bn
  ```
- **Deploy Frontend (Firebase Hosting)**:
  ```bash
  cd frontend && npm run build && cd ..
  npx firebase-tools deploy --only hosting --project iem-admission-404bn
  ```
- **Deploy Security Rules (Storage & Firestore)**:
  ```bash
  npx firebase-tools deploy --only firestore:rules,storage --project iem-admission-404bn
  ```

---

## 5. Demo Test Accounts (1-Click Login on UI)

The sign-in screen contains 1-click quick-login buttons for demonstration:

| Role | Email | Password | Pre-seeded Status |
| :--- | :--- | :--- | :--- |
| **Student / Applicant** | `student@iem.edu.in` | `Student@123` | Application submitted & fee paid |
| **Admission Officer** | `officer@iem.edu.in` | `Officer@123` | Access to evaluation queue & document verification |
| **Administrator** | `admin@iem.edu.in` | `Admin@123` | Executive control, KPI stats, merit list & audit logs |

---

## 6. Project Directory Structure

```
SWE-Lab/
├── backend/
│   ├── config/
│   │   └── firebase.js              # Firebase Admin SDK & Client configuration
│   ├── database/
│   │   ├── firestore_collections.json # Local NoSQL persistent collections store
│   │   └── schema.sql               # Reference relational SQL schema
│   ├── middleware/
│   │   └── auth.js                  # JWT token verification & Role-Based Access Control
│   ├── models/
│   │   ├── firestore-models.js      # Pure Cloud Firestore NoSQL Models & Repositories
│   │   └── sql-models.js            # Compatibility repository layer
│   ├── routes/
│   │   ├── admin.routes.js          # Executive Analytics, KPI stats & Merit List
│   │   ├── application.routes.js    # Multi-step application workflow
│   │   ├── auth.routes.js           # Student registration (with 403 staff guard) & login
│   │   ├── course.routes.js         # Academic programs & eligibility criteria
│   │   ├── document.routes.js       # Multipart document upload & status verification
│   │   ├── payment.routes.js        # Gated payment gateway checkout & receipts
│   │   └── storage.routes.js        # Cloud Storage bucket direct streaming fallback
│   ├── services/
│   │   ├── readiness.service.js     # White-box basis path readiness evaluation
│   │   └── storage-bucket.service.js# Cloud Storage bucket sync & Admit Letter generator
│   ├── test/
│   │   └── integration-test.js      # Automated test suite (TC-S01 to TC-S07)
│   ├── index.js                     # Google Cloud Functions Gen 2 entry point (`exports.api`)
│   ├── server.js                    # Express HTTP server & static bundle host
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── admin/           # Screen 1: Admin Dashboard & Merit List
│   │   │   │   ├── apply/           # Screen 4: Application Form, Separate Photo/Signature & Payment
│   │   │   │   ├── auth/            # Sign In / Registration with Student-only guard
│   │   │   │   ├── home/            # Academic Course Catalog & Cutoffs
│   │   │   │   ├── navbar/          # Top Navigation Bar & Cloud Architecture pill
│   │   │   │   ├── officer/         # Screen 2: Admission Officer Review & Document Check
│   │   │   │   └── student/         # Screen 3: Student Status Stepper & Admit Letter download
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts   # Unified Reactive API Service
│   │   │   │   └── firebase.service.ts # Firebase Client SDK v10 (Google Auth)
│   │   │   ├── app.routes.ts        # Client-side routing
│   │   │   └── app.ts               # Root component
│   │   └── styles.css               # Global theme & styling
│   ├── angular.json                 # Angular CLI workspace configuration
│   └── package.json
├── .github/
│   └── workflows/
│       ├── firebase-hosting-merge.yml        # CI/CD deployment on merge/push to master/main
│       └── firebase-hosting-pull-request.yml # CI/CD deployment on pull requests
├── firestore.rules                  # Firebase Cloud Firestore security rules
├── storage.rules                    # Firebase Cloud Storage security rules
├── firebase.json                    # Firebase Hosting, Functions & Storage configuration
├── .firebaserc                      # Firebase project identifier mapping (`iem-admission-404bn`)
└── README.md                        # Project documentation
```
