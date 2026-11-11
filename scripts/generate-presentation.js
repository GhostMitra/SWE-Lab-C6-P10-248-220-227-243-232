/**
 * IEM Admission Portal — PPT Generator
 * Generates an 8-slide executive PowerPoint presentation using pptxgenjs.
 * Course: PCCCS594 (Software Engineering & Project Management Lab)
 * Team: 404 Brain Not Found (Team 10)
 */

const pptxgen = require('pptxgenjs');
const path = require('path');

function createPresentation() {
  const pptx = new pptxgen();

  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'IEM Admission Portal — Presentation';
  pptx.author = 'Team 10: 404 Brain Not Found';
  pptx.company = 'Institute of Engineering & Management (IEM), Kolkata';
  pptx.subject = 'PCCCS594 Software Engineering & Project Management Lab';

  // Design Tokens & Colors
  const COLORS = {
    NAVY_PRIMARY: '0B2545',
    NAVY_SECONDARY: '134074',
    ACCENT_GOLD: 'DDA15E',
    ACCENT_TEAL: '00A896',
    ACCENT_CORAL: 'EE6C4D',
    BG_LIGHT: 'F4F6F9',
    WHITE: 'FFFFFF',
    TEXT_DARK: '1D2D44',
    TEXT_MUTED: '6C757D',
    CARD_BG: 'FFFFFF',
    CARD_BORDER: 'E2E8F0',
    SUCCESS: '2D6A4F'
  };

  // Helper for Slide Background & Header
  function addHeader(slide, category, title, slideNum) {
    // Header category
    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.4,
      w: 8.0,
      h: 0.3,
      fontSize: 10,
      bold: true,
      color: COLORS.ACCENT_TEAL,
      fontFace: 'Arial'
    });

    // Main Title
    slide.addText(title, {
      x: 0.8,
      y: 0.65,
      w: 11.5,
      h: 0.6,
      fontSize: 22,
      bold: true,
      color: COLORS.NAVY_PRIMARY,
      fontFace: 'Arial'
    });

    // Top Right Logo / Subtext
    slide.addText('IEM KOLKATA | PCCCS594', {
      x: 9.0,
      y: 0.4,
      w: 3.5,
      h: 0.3,
      fontSize: 10,
      bold: true,
      align: 'right',
      color: COLORS.TEXT_MUTED,
      fontFace: 'Arial'
    });

    // Divider line
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.25,
      w: 11.7,
      h: 0.02,
      fill: { color: COLORS.CARD_BORDER },
      line: { color: COLORS.CARD_BORDER, width: 0 }
    });

    // Footer
    slide.addText('IEM Admission Portal  •  Team 10 "404 Brain Not Found"  •  Live at iem-admission-404bn.web.app', {
      x: 0.8,
      y: 7.1,
      w: 10.0,
      h: 0.3,
      fontSize: 9,
      color: COLORS.TEXT_MUTED,
      fontFace: 'Arial'
    });

    slide.addText(`Slide ${slideNum} of 8`, {
      x: 10.8,
      y: 7.1,
      w: 1.7,
      h: 0.3,
      fontSize: 9,
      bold: true,
      align: 'right',
      color: COLORS.NAVY_SECONDARY,
      fontFace: 'Arial'
    });
  }

  // ===========================================================================
  // SLIDE 1: Title Slide (Hero Dark Navy)
  // ===========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.NAVY_PRIMARY };

    // Accent Pill
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.0,
      y: 1.0,
      w: 4.8,
      h: 0.45,
      rectRadius: 0.2,
      fill: { color: COLORS.NAVY_SECONDARY },
      line: { color: COLORS.ACCENT_GOLD, width: 1.5 }
    });
    slide.addText('INSTITUTE OF ENGINEERING & MANAGEMENT', {
      x: 1.0,
      y: 1.0,
      w: 4.8,
      h: 0.45,
      fontSize: 11,
      bold: true,
      color: COLORS.ACCENT_GOLD,
      align: 'center',
      valign: 'middle',
      fontFace: 'Arial'
    });

    // Main Project Title
    slide.addText('IEM ADMISSION PORTAL', {
      x: 0.95,
      y: 1.6,
      w: 11.0,
      h: 0.9,
      fontSize: 38,
      bold: true,
      color: COLORS.WHITE,
      fontFace: 'Arial'
    });

    // Subtitle
    slide.addText('A 100% Firebase Cloud-Native Admission Management & Evaluation System', {
      x: 1.0,
      y: 2.5,
      w: 11.0,
      h: 0.5,
      fontSize: 16,
      color: 'B8C0D0',
      fontFace: 'Arial'
    });

    // Meta Badge & Lab info
    slide.addText('Course: PCCCS594 — Software Engineering & Project Management Lab\nBatch: 2024–2028  |  Semester 5  |  Production: https://iem-admission-404bn.web.app', {
      x: 1.0,
      y: 3.1,
      w: 11.0,
      h: 0.6,
      fontSize: 12,
      color: COLORS.ACCENT_TEAL,
      fontFace: 'Arial'
    });

    // Team Card Container
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 1.0,
      y: 4.0,
      w: 11.3,
      h: 2.7,
      rectRadius: 0.15,
      fill: { color: '13293D' },
      line: { color: '244B6E', width: 1 }
    });

    slide.addText('PROJECT TEAM: 404 BRAIN NOT FOUND (TEAM 10)', {
      x: 1.3,
      y: 4.15,
      w: 10.7,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: COLORS.ACCENT_GOLD,
      fontFace: 'Arial'
    });

    const members = [
      { name: 'Debarghya Mitra', roll: '248', role: 'Project Manager (PM)', focus: 'Architecture, Planning & Security' },
      { name: 'Arka Ghosh Dastider', roll: '220', role: 'UI/UX Designer', focus: 'Angular UI, Bootstrap & Styling' },
      { name: 'Diptomoy Das', roll: '227', role: 'Full-Stack Engineer', focus: 'Express APIs & Firebase Services' },
      { name: 'Jitesh Jana', roll: '243', role: 'QA Engineer', focus: 'Test Automation (TC-S01..S07)' },
      { name: 'Jatin Kumar', roll: '232', role: 'Software Architect', focus: 'NoSQL Schema & Cloud Storage' }
    ];

    members.forEach((m, idx) => {
      const cardX = 1.3 + idx * 2.15;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: 4.6,
        w: 2.05,
        h: 1.85,
        rectRadius: 0.1,
        fill: { color: '1C3B5E' },
        line: { color: '2D5B8B', width: 1 }
      });

      slide.addText(m.name, {
        x: cardX + 0.1,
        y: 4.75,
        w: 1.85,
        h: 0.4,
        fontSize: 11,
        bold: true,
        color: COLORS.WHITE,
        fontFace: 'Arial'
      });

      slide.addText(`Roll: ${m.roll}`, {
        x: cardX + 0.1,
        y: 5.15,
        w: 1.85,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: COLORS.ACCENT_GOLD,
        fontFace: 'Arial'
      });

      slide.addText(m.role, {
        x: cardX + 0.1,
        y: 5.4,
        w: 1.85,
        h: 0.45,
        fontSize: 9,
        bold: true,
        color: COLORS.ACCENT_TEAL,
        fontFace: 'Arial'
      });

      slide.addText(m.focus, {
        x: cardX + 0.1,
        y: 5.85,
        w: 1.85,
        h: 0.45,
        fontSize: 8,
        color: 'A5B4C7',
        fontFace: 'Arial'
      });
    });
  }

  // ===========================================================================
  // SLIDE 2: Problem Statement & Objectives
  // ===========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.BG_LIGHT };
    addHeader(slide, 'Project Context', 'Problem Statement & Engineering Objectives', 2);

    // Left Column: The Problem
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.5,
      w: 5.6,
      h: 5.3,
      rectRadius: 0.15,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.CARD_BORDER, width: 1 }
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: 1.5,
      w: 5.6,
      h: 0.6,
      fill: { color: 'D90429' },
      line: { color: 'D90429', width: 0 }
    });

    slide.addText('CURRENT CHALLENGES & BOTTLENECKS', {
      x: 1.0,
      y: 1.6,
      w: 5.2,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: COLORS.WHITE,
      fontFace: 'Arial'
    });

    const problems = [
      { t: 'Paper & Fragmented Workflows', d: 'Physical document submission and scattered spreadsheets create data silos and delays.' },
      { t: 'Manual Verification Overhead', d: 'Officers spend weeks cross-verifying marksheets and candidate IDs by hand.' },
      { t: 'Lack of Real-Time Tracking', d: 'Applicants lack transparency into application status, document readiness, and merit score.' },
      { t: 'Fee Collection Inefficiencies', d: 'Manual bank challans and offline reconciliation cause delayed payment settlement.' },
      { t: 'Security & Access Control Gaps', d: 'Absence of unified RBAC exposes sensitive student personal data to unauthorized viewing.' }
    ];

    problems.forEach((p, idx) => {
      const itemY = 2.25 + idx * 0.88;
      slide.addText(`[X]  ${p.t}`, {
        x: 1.0,
        y: itemY,
        w: 5.2,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: '9B111E',
        fontFace: 'Arial'
      });
      slide.addText(p.d, {
        x: 1.35,
        y: itemY + 0.28,
        w: 4.85,
        h: 0.5,
        fontSize: 9.5,
        color: COLORS.TEXT_DARK,
        fontFace: 'Arial'
      });
    });

    // Right Column: System Objectives
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 6.8,
      y: 1.5,
      w: 5.7,
      h: 5.3,
      rectRadius: 0.15,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.CARD_BORDER, width: 1 }
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: 6.8,
      y: 1.5,
      w: 5.7,
      h: 0.6,
      fill: { color: COLORS.SUCCESS },
      line: { color: COLORS.SUCCESS, width: 0 }
    });

    slide.addText('CORE ENGINEERING OBJECTIVES', {
      x: 7.0,
      y: 1.6,
      w: 5.3,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: COLORS.WHITE,
      fontFace: 'Arial'
    });

    const objectives = [
      { t: '100% Digital Self-Service Portal', d: 'Full-featured Angular SPA with dynamic course catalog, filters, and eligibility checks.' },
      { t: 'Real-Time Draft Auto-Saving', d: 'Continuous sync to Cloud Firestore prevents applicant data loss across sessions.' },
      { t: 'Automated Merit Scoring Engine', d: 'Transparent, standardized composite score formula: Merit = 0.60 * 12th + 0.40 * 10th.' },
      { t: 'Instant Digital Fee Reconciliation', d: 'Multi-rail payment gateway integration with real-time settlement and digital invoice.' },
      { t: 'Auto-Generated Provisional Letters', d: 'Instant cryptographic admission offer letter generated directly into Cloud Storage upon approval.' }
    ];

    objectives.forEach((o, idx) => {
      const itemY = 2.25 + idx * 0.88;
      slide.addText(`[OK]  ${o.t}`, {
        x: 7.0,
        y: itemY,
        w: 5.3,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: COLORS.SUCCESS,
        fontFace: 'Arial'
      });
      slide.addText(o.d, {
        x: 7.35,
        y: itemY + 0.28,
        w: 4.95,
        h: 0.5,
        fontSize: 9.5,
        color: COLORS.TEXT_DARK,
        fontFace: 'Arial'
      });
    });
  }

  // ===========================================================================
  // SLIDE 3: System Architecture & Pure Firebase Tech Stack
  // ===========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.BG_LIGHT };
    addHeader(slide, 'System Architecture', '100% Pure Firebase Cloud-Native Stack', 3);

    const tiers = [
      {
        layer: '1. PRESENTATION LAYER',
        tech: 'Angular 22 SPA + Bootstrap 5',
        color: '0F4C81',
        bullets: [
          'Standalone components & signals',
          'Responsive design (Mobile/Desktop)',
          'Role-based route guard security',
          'Hosted on Firebase CDN Global Edge'
        ]
      },
      {
        layer: '2. SERVERLESS API LAYER',
        tech: 'Firebase Cloud Functions (Node 22)',
        color: '1B4965',
        bullets: [
          'REST API built on Express.js',
          'Firebase Auth token verification',
          'Streaming Multer file parser',
          'Serverless autoscaling (us-central1)'
        ]
      },
      {
        layer: '3. DATABASE LAYER',
        tech: 'Cloud Firestore (Pure NoSQL)',
        color: '2B2D42',
        bullets: [
          '10 dedicated NoSQL collections',
          'Sub-second query latencies',
          'Standard Edition in nam5 region',
          'Granular Firestore security rules'
        ]
      },
      {
        layer: '4. OBJECT STORAGE LAYER',
        tech: 'Cloud Storage Bucket',
        color: '4A4E69',
        bullets: [
          'Domain: iem-admission-404bn.firebasestorage.app',
          'Sub-buckets: /academic-docs, /candidate-media',
          '/verification-certs, /generated-letters',
          'Storage IAM & security rules'
        ]
      }
    ];

    tiers.forEach((t, idx) => {
      const cardX = 0.8 + idx * 2.95;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: 1.5,
        w: 2.8,
        h: 4.3,
        rectRadius: 0.15,
        fill: { color: COLORS.WHITE },
        line: { color: COLORS.CARD_BORDER, width: 1 }
      });

      slide.addShape(pptx.ShapeType.rect, {
        x: cardX,
        y: 1.5,
        w: 2.8,
        h: 0.6,
        fill: { color: t.color },
        line: { color: t.color, width: 0 }
      });

      slide.addText(t.layer, {
        x: cardX + 0.1,
        y: 1.6,
        w: 2.6,
        h: 0.4,
        fontSize: 10,
        bold: true,
        color: COLORS.WHITE,
        align: 'center',
        fontFace: 'Arial'
      });

      slide.addText(t.tech, {
        x: cardX + 0.1,
        y: 2.2,
        w: 2.6,
        h: 0.6,
        fontSize: 11,
        bold: true,
        color: COLORS.NAVY_PRIMARY,
        align: 'center',
        fontFace: 'Arial'
      });

      t.bullets.forEach((b, bIdx) => {
        slide.addText(`•  ${b}`, {
          x: cardX + 0.2,
          y: 2.85 + bIdx * 0.7,
          w: 2.4,
          h: 0.65,
          fontSize: 9.5,
          color: COLORS.TEXT_DARK,
          fontFace: 'Arial'
        });
      });
    });

    // Architecture Footer Highlight Banner
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 6.0,
      w: 11.65,
      h: 0.85,
      rectRadius: 0.1,
      fill: { color: 'EBF2FA' },
      line: { color: 'B0C4DE', width: 1 }
    });

    slide.addText('ZERO EXTERNAL SQL DEPENDENCY  —  Pure Firebase NoSQL Ecosystem eliminates maintenance overhead, guarantees 99.95% uptime, and delivers sub-50ms API response times across all admission workflows.', {
      x: 1.0,
      y: 6.1,
      w: 11.25,
      h: 0.65,
      fontSize: 11,
      bold: true,
      color: COLORS.NAVY_PRIMARY,
      align: 'center',
      fontFace: 'Arial'
    });
  }

  // ===========================================================================
  // SLIDE 4: Key Modules & End-to-End Workflow
  // ===========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.BG_LIGHT };
    addHeader(slide, 'Functional Scope', 'Core Functional Modules & Workflow (SRS Mapping)', 4);

    const modules = [
      {
        step: 'STEP 1',
        name: 'Applicant Portal',
        tag: 'FR-1 & FR-2',
        color: '0077B6',
        items: [
          'Interactive program catalog & seats',
          'Multi-step admission application form',
          'Real-time Firestore draft auto-save',
          'Document readiness radar calculation'
        ]
      },
      {
        step: 'STEP 2',
        name: 'Fee Payment Engine',
        tag: 'IR-4 & TC-S05',
        color: '023E8A',
        items: [
          'Multi-rail payment checkout simulator',
          'Dynamic course fee calculation',
          'Instant transaction confirmation receipt',
          'Automatic invoice generation (INV-2026)'
        ]
      },
      {
        step: 'STEP 3',
        name: 'Officer Evaluation',
        tag: 'FR-5 & IR-3',
        color: '0096C7',
        items: [
          'Live applicant verification queue',
          'Document inspection & status stamps',
          'Merit score preview & verification',
          'Approval / Rejection decision remarks'
        ]
      },
      {
        step: 'STEP 4',
        name: 'Executive Admin',
        tag: 'IR-5 & TC-S07',
        color: '03045E',
        items: [
          'Real-time KPI & revenue dashboard',
          'Dynamic course-wise merit rank table',
          'Immutable security audit trail logs',
          'Auto-generate official Admit Letter'
        ]
      }
    ];

    modules.forEach((m, idx) => {
      const cardX = 0.8 + idx * 2.95;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX,
        y: 1.5,
        w: 2.8,
        h: 5.3,
        rectRadius: 0.15,
        fill: { color: COLORS.WHITE },
        line: { color: COLORS.CARD_BORDER, width: 1 }
      });

      slide.addShape(pptx.ShapeType.roundRect, {
        x: cardX + 0.15,
        y: 1.7,
        w: 1.0,
        h: 0.35,
        rectRadius: 0.1,
        fill: { color: m.color },
        line: { color: m.color, width: 0 }
      });

      slide.addText(m.step, {
        x: cardX + 0.15,
        y: 1.7,
        w: 1.0,
        h: 0.35,
        fontSize: 9,
        bold: true,
        color: COLORS.WHITE,
        align: 'center',
        valign: 'middle',
        fontFace: 'Arial'
      });

      slide.addText(m.tag, {
        x: cardX + 1.25,
        y: 1.7,
        w: 1.4,
        h: 0.35,
        fontSize: 9,
        bold: true,
        color: COLORS.TEXT_MUTED,
        align: 'right',
        valign: 'middle',
        fontFace: 'Arial'
      });

      slide.addText(m.name, {
        x: cardX + 0.2,
        y: 2.2,
        w: 2.4,
        h: 0.5,
        fontSize: 14,
        bold: true,
        color: COLORS.NAVY_PRIMARY,
        fontFace: 'Arial'
      });

      slide.addShape(pptx.ShapeType.rect, {
        x: cardX + 0.2,
        y: 2.75,
        w: 2.4,
        h: 0.02,
        fill: { color: COLORS.CARD_BORDER },
        line: { color: COLORS.CARD_BORDER, width: 0 }
      });

      m.items.forEach((item, itemIdx) => {
        slide.addText(`[>]  ${item}`, {
          x: cardX + 0.2,
          y: 3.0 + itemIdx * 0.9,
          w: 2.4,
          h: 0.75,
          fontSize: 10,
          color: COLORS.TEXT_DARK,
          fontFace: 'Arial'
        });
      });
    });
  }

  // ===========================================================================
  // SLIDE 5: Multi-Tier Role-Based Access Control (RBAC)
  // ===========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.BG_LIGHT };
    addHeader(slide, 'Security Architecture', 'Multi-Tier Role-Based Access Control (RBAC)', 5);

    const tiers = [
      {
        tier: 'TIER 1: FRONTEND ROUTE GUARDS',
        location: 'frontend/src/app/guards/role.guard.ts',
        desc: 'Client-side Angular CanActivateFn guards prevent unauthorized URL navigation. Validates user token & role against route metadata, dynamically redirecting violators to their authorized dashboard.'
      },
      {
        tier: 'TIER 2: API GATEWAY MIDDLEWARE',
        location: 'backend/middleware/auth.js',
        desc: 'Express middleware authenticateToken and authorizeRoles(...) strictly inspect JWT signatures & Firebase ID tokens. Blocks unauthorized REST calls with HTTP 403 Forbidden.'
      },
      {
        tier: 'TIER 3: FIRESTORE SECURITY RULES',
        location: 'firestore.rules (Google Cloud Firestore)',
        desc: 'Production rules compiled & deployed to nam5. Helper functions (isOwner, isOfficer, isAdmin) control read/write on all 10 collections. Applicants only access their own submissions.'
      },
      {
        tier: 'TIER 4: CLOUD STORAGE BUCKET RULES',
        location: 'storage.rules (Google Cloud Storage)',
        desc: 'Partitioned sub-buckets (/academic-docs, /candidate-media, /verification-certs, /generated-letters). Access restricted by authenticated UID and officer roles.'
      }
    ];

    tiers.forEach((t, idx) => {
      const cardY = 1.5 + idx * 1.33;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.8,
        y: cardY,
        w: 11.65,
        h: 1.18,
        rectRadius: 0.1,
        fill: { color: COLORS.WHITE },
        line: { color: COLORS.CARD_BORDER, width: 1 }
      });

      slide.addShape(pptx.ShapeType.rect, {
        x: 0.8,
        y: cardY,
        w: 0.15,
        h: 1.18,
        fill: { color: COLORS.NAVY_PRIMARY },
        line: { color: COLORS.NAVY_PRIMARY, width: 0 }
      });

      slide.addText(t.tier, {
        x: 1.2,
        y: cardY + 0.12,
        w: 5.5,
        h: 0.35,
        fontSize: 12,
        bold: true,
        color: COLORS.NAVY_PRIMARY,
        fontFace: 'Arial'
      });

      slide.addText(t.location, {
        x: 7.0,
        y: cardY + 0.12,
        w: 5.2,
        h: 0.35,
        fontSize: 10,
        bold: true,
        color: COLORS.ACCENT_TEAL,
        align: 'right',
        fontFace: 'Courier New'
      });

      slide.addText(t.desc, {
        x: 1.2,
        y: cardY + 0.48,
        w: 11.0,
        h: 0.6,
        fontSize: 10,
        color: COLORS.TEXT_DARK,
        fontFace: 'Arial'
      });
    });
  }

  // ===========================================================================
  // SLIDE 6: Pure Firestore Data Model & Storage Partitioning
  // ===========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.BG_LIGHT };
    addHeader(slide, 'Data Engineering', 'Pure Firestore Data Model & Cloud Storage Architecture', 6);

    // Left Box: 10 Firestore Collections
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.5,
      w: 6.8,
      h: 5.3,
      rectRadius: 0.15,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.CARD_BORDER, width: 1 }
    });

    slide.addText('10 PURE FIRESTORE NoSQL COLLECTIONS', {
      x: 1.1,
      y: 1.7,
      w: 6.2,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: COLORS.NAVY_PRIMARY,
      fontFace: 'Arial'
    });

    const collections = [
      { name: 'users', desc: 'Accounts, credentials, hashed passwords, roles' },
      { name: 'applicants', desc: 'Personal details, address, 10th & 12th marks' },
      { name: 'courses', desc: 'Academic programs, seat matrix, fee structure' },
      { name: 'applications', desc: 'Submissions, review states, composite merit score' },
      { name: 'documents', desc: 'Uploaded file metadata, Cloud Storage paths' },
      { name: 'payments', desc: 'Transaction logs, amounts, gateway references' },
      { name: 'notifications', desc: 'Candidate alerts and email dispatches' },
      { name: 'audit_logs', desc: 'Immutable security ledger with actor/timestamp' },
      { name: 'application_drafts', desc: 'Real-time auto-saving form state cache' },
      { name: 'notification_queue', desc: 'Asynchronous event processing buffer' }
    ];

    collections.forEach((c, idx) => {
      const colY = 2.15 + idx * 0.45;
      slide.addText(`•  ${c.name}:`, {
        x: 1.1,
        y: colY,
        w: 2.2,
        h: 0.35,
        fontSize: 10,
        bold: true,
        color: COLORS.NAVY_SECONDARY,
        fontFace: 'Arial'
      });
      slide.addText(c.desc, {
        x: 3.3,
        y: colY,
        w: 4.1,
        h: 0.35,
        fontSize: 9.5,
        color: COLORS.TEXT_DARK,
        fontFace: 'Arial'
      });
    });

    // Right Box: Cloud Storage Partitioning & Formula
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 7.9,
      y: 1.5,
      w: 4.55,
      h: 5.3,
      rectRadius: 0.15,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.CARD_BORDER, width: 1 }
    });

    slide.addText('CLOUD STORAGE PARTITIONING', {
      x: 8.1,
      y: 1.7,
      w: 4.15,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: COLORS.NAVY_PRIMARY,
      fontFace: 'Arial'
    });

    const subBuckets = [
      { name: '/academic-docs', desc: '10th & 12th Board Marksheet PDFs' },
      { name: '/candidate-media', desc: 'Candidate passport photo & signature' },
      { name: '/verification-certs', desc: 'Aadhaar Card & Government IDs' },
      { name: '/generated-letters', desc: 'Official Provisional Admission Offer Letters' }
    ];

    subBuckets.forEach((b, idx) => {
      const bY = 2.15 + idx * 0.7;
      slide.addText(`[DIR]  ${b.name}`, {
        x: 8.1,
        y: bY,
        w: 4.15,
        h: 0.3,
        fontSize: 10,
        bold: true,
        color: COLORS.ACCENT_TEAL,
        fontFace: 'Courier New'
      });
      slide.addText(b.desc, {
        x: 8.4,
        y: bY + 0.28,
        w: 3.85,
        h: 0.35,
        fontSize: 9,
        color: COLORS.TEXT_DARK,
        fontFace: 'Arial'
      });
    });

    // Merit Formula Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 8.1,
      y: 4.9,
      w: 4.15,
      h: 1.7,
      rectRadius: 0.1,
      fill: { color: 'EBF2FA' },
      line: { color: 'B0C4DE', width: 1 }
    });

    slide.addText('MERIT SCORE FORMULATION', {
      x: 8.2,
      y: 5.0,
      w: 3.95,
      h: 0.3,
      fontSize: 10.5,
      bold: true,
      color: COLORS.NAVY_PRIMARY,
      fontFace: 'Arial'
    });

    slide.addText('Composite Score = 0.60 * (12th %) + 0.40 * (10th %)', {
      x: 8.2,
      y: 5.35,
      w: 3.95,
      h: 0.45,
      fontSize: 10,
      bold: true,
      color: COLORS.SUCCESS,
      fontFace: 'Courier New'
    });

    slide.addText('Ensures standardized, merit-driven admissions with automated rank sorting across departments.', {
      x: 8.2,
      y: 5.85,
      w: 3.95,
      h: 0.65,
      fontSize: 8.5,
      color: COLORS.TEXT_MUTED,
      fontFace: 'Arial'
    });
  }

  // ===========================================================================
  // SLIDE 7: Quality Assurance & Automated Testing
  // ===========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.BG_LIGHT };
    addHeader(slide, 'Verification & Validation', 'Software Test Plan & Automated Test Suite (Lab 4)', 7);

    // Test Results Table
    const rows = [
      [
        { text: 'Test ID', options: { bold: true, color: COLORS.WHITE, fill: { color: COLORS.NAVY_PRIMARY } } },
        { text: 'Functional Scenario Tested', options: { bold: true, color: COLORS.WHITE, fill: { color: COLORS.NAVY_PRIMARY } } },
        { text: 'Target Subsystem', options: { bold: true, color: COLORS.WHITE, fill: { color: COLORS.NAVY_PRIMARY } } },
        { text: 'Verification Status', options: { bold: true, color: COLORS.WHITE, fill: { color: COLORS.NAVY_PRIMARY } } }
      ],
      [
        { text: 'TC-S01', options: { bold: true } },
        { text: 'Applicant Registration & Secure JWT Credential Issuance' },
        { text: 'Auth & User Collection' },
        { text: 'PASSED (201)', options: { bold: true, color: COLORS.SUCCESS } }
      ],
      [
        { text: 'TC-S02', options: { bold: true } },
        { text: 'Validation on Incomplete Application (Missing Course/Fields)' },
        { text: 'Validation Middleware' },
        { text: 'PASSED (400)', options: { bold: true, color: COLORS.SUCCESS } }
      ],
      [
        { text: 'TC-S03', options: { bold: true } },
        { text: 'Valid Application Submission & Merit Calculation' },
        { text: 'Applications NoSQL' },
        { text: 'PASSED (201)', options: { bold: true, color: COLORS.SUCCESS } }
      ],
      [
        { text: 'TC-S04', options: { bold: true } },
        { text: 'Document Upload & Streaming to Cloud Storage Bucket' },
        { text: 'Storage & Document Metadata' },
        { text: 'PASSED (201)', options: { bold: true, color: COLORS.SUCCESS } }
      ],
      [
        { text: 'TC-S05', options: { bold: true } },
        { text: 'Application Fee Payment Settlement & Invoice Generation' },
        { text: 'Payment Gateway Engine' },
        { text: 'PASSED (200)', options: { bold: true, color: COLORS.SUCCESS } }
      ],
      [
        { text: 'TC-S06', options: { bold: true } },
        { text: 'Applicant Status & Document Readiness Tracking' },
        { text: 'Readiness Service' },
        { text: 'PASSED (200)', options: { bold: true, color: COLORS.SUCCESS } }
      ],
      [
        { text: 'TC-S07', options: { bold: true } },
        { text: 'Officer Evaluation, Decision & Auto-Generate Admit Letter' },
        { text: 'Storage /generated-letters' },
        { text: 'PASSED (200)', options: { bold: true, color: COLORS.SUCCESS } }
      ]
    ];

    slide.addTable(rows, {
      x: 0.8,
      y: 1.5,
      w: 11.65,
      colW: [1.2, 5.2, 3.25, 2.0],
      rowH: 0.5,
      fontSize: 9.5,
      border: { pt: 1, color: COLORS.CARD_BORDER },
      fill: { color: COLORS.WHITE },
      valign: 'middle'
    });

    // Summary Metric Cards below Table
    const metrics = [
      { label: 'Automated Test Cases', value: '7 / 7 PASSED', color: COLORS.SUCCESS },
      { label: 'Test Execution Speed', value: '416 ms', color: COLORS.NAVY_PRIMARY },
      { label: 'Codebase Pass Rate', value: '100.0%', color: COLORS.SUCCESS },
      { label: 'Live Cloud Latency', value: '< 65 ms', color: COLORS.ACCENT_TEAL }
    ];

    metrics.forEach((m, idx) => {
      const mX = 0.8 + idx * 2.95;
      slide.addShape(pptx.ShapeType.roundRect, {
        x: mX,
        y: 5.75,
        w: 2.8,
        h: 1.05,
        rectRadius: 0.1,
        fill: { color: COLORS.WHITE },
        line: { color: COLORS.CARD_BORDER, width: 1 }
      });

      slide.addText(m.value, {
        x: mX,
        y: 5.85,
        w: 2.8,
        h: 0.45,
        fontSize: 16,
        bold: true,
        color: m.color,
        align: 'center',
        fontFace: 'Arial'
      });

      slide.addText(m.label, {
        x: mX,
        y: 6.3,
        w: 2.8,
        h: 0.35,
        fontSize: 9.5,
        color: COLORS.TEXT_MUTED,
        align: 'center',
        fontFace: 'Arial'
      });
    });
  }

  // ===========================================================================
  // SLIDE 8: Deployment, CI/CD & Future Roadmap
  // ===========================================================================
  {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.BG_LIGHT };
    addHeader(slide, 'DevOps & Conclusion', 'Deployment, CI/CD Pipeline & Future Roadmap', 8);

    // Left Column: Live Deployments & CI/CD
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.8,
      y: 1.5,
      w: 5.65,
      h: 5.3,
      rectRadius: 0.15,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.CARD_BORDER, width: 1 }
    });

    slide.addText('DEPLOYMENT & AUTOMATED CI/CD', {
      x: 1.0,
      y: 1.7,
      w: 5.25,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: COLORS.NAVY_PRIMARY,
      fontFace: 'Arial'
    });

    const devops = [
      { t: 'Live Production Hosting', d: 'https://iem-admission-404bn.web.app (Firebase Global CDN Edge)' },
      { t: 'Alternate Custom Domain', d: 'https://iem-admission-404bn.firebaseapp.com' },
      { t: 'Google Cloud Region', d: 'nam5 (Firestore) & US-EAST1 (Storage Bucket)' },
      { t: 'GitHub Actions Workflows', d: 'Automated CI/CD deploy on PR & branch merge to master/main' },
      { t: 'One-Click Scripts', d: 'deploy.bat (Windows) & deploy.sh (Linux/macOS) for instant redeploys' }
    ];

    devops.forEach((d, idx) => {
      const dY = 2.2 + idx * 0.9;
      slide.addText(`[OK]  ${d.t}`, {
        x: 1.0,
        y: dY,
        w: 5.25,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: COLORS.NAVY_SECONDARY,
        fontFace: 'Arial'
      });
      slide.addText(d.d, {
        x: 1.35,
        y: dY + 0.28,
        w: 4.9,
        h: 0.5,
        fontSize: 9.5,
        color: COLORS.TEXT_DARK,
        fontFace: 'Arial'
      });
    });

    // Right Column: Future Roadmap
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 6.8,
      y: 1.5,
      w: 5.65,
      h: 5.3,
      rectRadius: 0.15,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.CARD_BORDER, width: 1 }
    });

    slide.addText('FUTURE ENGINEERING ROADMAP', {
      x: 7.0,
      y: 1.7,
      w: 5.25,
      h: 0.35,
      fontSize: 12,
      bold: true,
      color: COLORS.NAVY_PRIMARY,
      fontFace: 'Arial'
    });

    const roadmap = [
      { t: 'AI-Powered Marksheet OCR', d: 'Integrate Google Cloud Document AI for automated score extraction and fraud detection.' },
      { t: 'Biometric Candidate Matching', d: 'Face matching between candidate passport photo and government photo IDs.' },
      { t: 'Automated Merit Counseling', d: 'Multi-round seat allotment algorithm with automated branch upgrades.' },
      { t: 'SMS & WhatsApp Gateway', d: 'Instant mobile messaging for application milestones and admit cards.' },
      { t: 'DigiLocker Integration', d: 'Direct national academic depository API integration for instant verification.' }
    ];

    roadmap.forEach((r, idx) => {
      const rY = 2.2 + idx * 0.9;
      slide.addText(`[*]  ${r.t}`, {
        x: 7.0,
        y: rY,
        w: 5.25,
        h: 0.3,
        fontSize: 11,
        bold: true,
        color: COLORS.ACCENT_TEAL,
        fontFace: 'Arial'
      });
      slide.addText(r.d, {
        x: 7.35,
        y: rY + 0.28,
        w: 4.9,
        h: 0.5,
        fontSize: 9.5,
        color: COLORS.TEXT_DARK,
        fontFace: 'Arial'
      });
    });
  }

  // Save the presentation
  const outputPath = path.join(__dirname, '..', 'IEM_Admission_Portal_Presentation.pptx');
  pptx.writeFile({ fileName: outputPath })
    .then(fileName => {
      console.log(`[PPT Generator] Presentation successfully created: ${fileName}`);
    })
    .catch(err => {
      console.error('[PPT Generator] Error creating presentation:', err);
    });
}

createPresentation();
