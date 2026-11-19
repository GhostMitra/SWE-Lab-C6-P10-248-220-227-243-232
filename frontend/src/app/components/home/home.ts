import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Course } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- HERO SECTION WITH DYNAMIC MESH GRADIENT -->
    <div class="hero-gradient-mesh text-white py-5 py-lg-6 position-relative overflow-hidden">
      <div class="hero-mesh-overlay"></div>
      
      <div class="container px-4 py-4 position-relative" style="z-index: 2;">
        <div class="row align-items-center g-5">
          
          <div class="col-lg-7">
            <!-- Admission Status Pill (High-Contrast Top Yellow Bar) -->
            <div class="hero-admission-badge mb-3.5 shadow">
              <i class="bi bi-mortarboard-fill"></i>
              <span>Admissions 2026–2027 Open</span>
              <span class="status-dot ms-1"></span>
            </div>

            <!-- Hero Headline -->
            <h1 class="display-4 fw-extrabold mb-3.5 tracking-tight" style="line-height: 1.15;">
              Step Into Engineering & Computing Excellence at <span class="text-warning">IEM Kolkata</span>
            </h1>

            <p class="lead text-white-50 mb-4" style="font-size: 1.12rem; max-width: 620px; line-height: 1.65;">
              Institute of Engineering & Management, Salt Lake, Kolkata — West Bengal's Premier Autonomous Institute. Apply online, upload academic credentials directly to secure cloud storage, and track your admission progress in real time.
            </p>

            <!-- Call to Actions (Context-Aware for Logged In / Guest) -->
            <div class="d-flex flex-wrap gap-3 mb-4">
              <!-- GUEST USER (NOT LOGGED IN) -->
              <ng-container *ngIf="!api.isAuthenticated()">
                <a routerLink="/apply" class="btn btn-iem-accent btn-lg px-4 py-3 rounded-3 shadow">
                  <i class="bi bi-pencil-square me-1.5"></i> Apply for Admission
                </a>
                <a routerLink="/auth" class="btn btn-outline-light btn-lg px-4 py-3 rounded-3 border-opacity-50">
                  <i class="bi bi-person-check me-1.5"></i> Sign In & Track Status
                </a>
              </ng-container>

              <!-- AUTHENTICATED USER (LOGGED IN) -->
              <ng-container *ngIf="api.isAuthenticated()">
                <!-- Applicant / Student Role -->
                <ng-container *ngIf="api.isApplicant()">
                  <a routerLink="/apply" class="btn btn-iem-accent btn-lg px-4 py-3 rounded-3 shadow">
                    <i class="bi bi-pencil-square me-1.5"></i> Apply for Admission
                  </a>
                  <a routerLink="/student" class="btn btn-outline-light btn-lg px-4 py-3 rounded-3 border-opacity-75">
                    <i class="bi bi-radar me-1.5 text-warning"></i> Track My Application
                  </a>
                </ng-container>

                <!-- Admission Officer Role -->
                <ng-container *ngIf="api.isOfficer() && !api.isAdmin()">
                  <a routerLink="/officer" class="btn btn-iem-accent btn-lg px-4 py-3 rounded-3 shadow">
                    <i class="bi bi-clipboard-check-fill me-1.5"></i> Return to Officer Review Desk
                  </a>
                  <a routerLink="/apply" class="btn btn-outline-light btn-lg px-4 py-3 rounded-3 border-opacity-75">
                    <i class="bi bi-pencil-square me-1.5"></i> Test Application Form
                  </a>
                </ng-container>

                <!-- Administrator Role -->
                <ng-container *ngIf="api.isAdmin()">
                  <a routerLink="/admin" class="btn btn-iem-accent btn-lg px-4 py-3 rounded-3 shadow">
                    <i class="bi bi-speedometer2 me-1.5"></i> Executive Admin Console
                  </a>
                </ng-container>
              </ng-container>
            </div>

            <!-- Trust Highlights -->
            <div class="d-flex flex-wrap gap-4 pt-3 border-top border-white border-opacity-15 text-white-50 small">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-shield-fill-check text-warning fs-5"></i>
                <span>NAAC 'A' Grade & NBA Accredited</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-lightning-charge-fill text-warning fs-5"></i>
                <span>Dynamic Composite Merit Scoring</span>
              </div>
            </div>
          </div>

          <!-- Hero Right Showcase Card -->
          <div class="col-lg-5">
            <div class="card border-0 shadow-xl rounded-4 p-4 text-dark" style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px);">
              
              <div class="d-flex align-items-center gap-3 pb-3 mb-3 border-bottom">
                <div class="bg-primary text-white p-3 rounded-3 shadow-sm d-flex align-items-center justify-content-center">
                  <i class="bi bi-award-fill fs-3"></i>
                </div>
                <div>
                  <h6 class="fw-bold text-dark mb-0.5">IEM Central Admissions Portal</h6>
                  <span class="badge bg-primary bg-opacity-10 text-primary fw-bold" style="font-size: 0.72rem;">
                    Autonomous Counseling Gateway
                  </span>
                </div>
              </div>

              <!-- Fast Facts -->
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <div class="p-2.5 bg-light rounded-3 border text-center">
                    <div class="fw-extrabold text-primary fs-5 mb-0">100%</div>
                    <small class="text-muted" style="font-size: 0.75rem;">Placement Record</small>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-2.5 bg-light rounded-3 border text-center">
                    <div class="fw-extrabold text-success fs-5 mb-0">Tier-1</div>
                    <small class="text-muted" style="font-size: 0.75rem;">NBA Autonomous</small>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-2.5 bg-light rounded-3 border text-center">
                    <div class="fw-extrabold text-warning fs-5 mb-0">5+</div>
                    <small class="text-muted" style="font-size: 0.75rem;">Flagship Programs</small>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-2.5 bg-light rounded-3 border text-center">
                    <div class="fw-extrabold text-info fs-5 mb-0">Cloud</div>
                    <small class="text-muted" style="font-size: 0.75rem;">Pure Serverless</small>
                  </div>
                </div>
              </div>

              <!-- Architecture Snapshot -->
              <div class="bg-light p-3 rounded-3 border mb-3 small">
                <div class="d-flex align-items-center gap-2 fw-bold text-dark mb-1">
                  <i class="bi bi-cpu text-primary"></i> Team 404 Brain Not Found
                </div>
                <div class="text-muted" style="font-size: 0.78rem;">
                  PCCCS594 SWE & PM Lab Capstone Project • Angular 22 Single Page Architecture with Firebase Serverless Backend.
                </div>
              </div>

              <!-- Direct Portal Buttons -->
              <div class="d-grid gap-2">
                <!-- Applicant Direct Links -->
                <ng-container *ngIf="api.isApplicant()">
                  <a routerLink="/student" class="btn btn-sm btn-iem-soft w-100 py-2.5 text-start d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-radar text-primary me-1.5"></i> Track My Application Status</span>
                    <i class="bi bi-arrow-right small text-primary"></i>
                  </a>
                  <a routerLink="/apply" class="btn btn-sm btn-outline-primary w-100 py-2.5 text-start d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-file-earmark-plus me-1.5"></i> Apply for New Program</span>
                    <i class="bi bi-arrow-right small"></i>
                  </a>
                </ng-container>

                <!-- Officer Direct Links -->
                <ng-container *ngIf="api.isOfficer() && !api.isAdmin()">
                  <a routerLink="/officer" class="btn btn-sm btn-iem-primary w-100 py-2.5 text-start d-flex justify-content-between align-items-center shadow-xs">
                    <span><i class="bi bi-clipboard-check me-1.5"></i> Review Applications Desk</span>
                    <i class="bi bi-arrow-right small"></i>
                  </a>
                </ng-container>

                <!-- Admin Direct Links -->
                <ng-container *ngIf="api.isAdmin()">
                  <a routerLink="/admin" class="btn btn-sm btn-iem-primary w-100 py-2.5 text-start d-flex justify-content-between align-items-center shadow-xs">
                    <span><i class="bi bi-speedometer2 me-1.5"></i> Executive Admin Console</span>
                    <i class="bi bi-arrow-right small"></i>
                  </a>
                </ng-container>

                <!-- Unauthenticated Guest Links -->
                <ng-container *ngIf="!api.isAuthenticated()">
                  <a routerLink="/student" class="btn btn-sm btn-iem-soft w-100 py-2 text-start d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-person-circle me-1.5"></i> Open Applicant Dashboard</span>
                    <i class="bi bi-chevron-right small"></i>
                  </a>
                  <a routerLink="/officer" class="btn btn-sm btn-outline-secondary w-100 py-2 text-start d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-clipboard-check me-1.5"></i> Officer Evaluation Desk</span>
                    <i class="bi bi-chevron-right small"></i>
                  </a>
                </ng-container>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- QUICK TELEMETRY & CAPABILITY BANNER -->
    <div class="bg-white border-bottom py-3.5 shadow-xs">
      <div class="container px-4">
        <div class="row g-4 text-center text-md-start align-items-center">
          
          <div class="col-md-4 border-end-md">
            <div class="d-flex align-items-center gap-3 justify-content-center justify-content-md-start">
              <div class="bg-warning bg-opacity-10 text-warning p-2.5 rounded-3">
                <i class="bi bi-fire fs-3"></i>
              </div>
              <div>
                <div class="fw-bold text-dark small">Cloud Firestore NoSQL</div>
                <div class="text-muted" style="font-size: 0.76rem;">Instant Real-Time Multi-Collection Store</div>
              </div>
            </div>
          </div>

          <div class="col-md-4 border-end-md">
            <div class="d-flex align-items-center gap-3 justify-content-center justify-content-md-start">
              <div class="bg-info bg-opacity-10 text-info p-2.5 rounded-3">
                <i class="bi bi-cloud-arrow-up-fill fs-3"></i>
              </div>
              <div>
                <div class="fw-bold text-dark small">Secure Storage Bucket</div>
                <div class="text-muted" style="font-size: 0.76rem;">Partitioned Marksheets & Offer Letters</div>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="d-flex align-items-center gap-3 justify-content-center justify-content-md-start">
              <div class="bg-success bg-opacity-10 text-success p-2.5 rounded-3">
                <i class="bi bi-shield-check fs-3"></i>
              </div>
              <div>
                <div class="fw-bold text-dark small">Automated Merit Engine</div>
                <div class="text-muted" style="font-size: 0.76rem;">Rank = 60% of 12th + 40% of 10th</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- DEGREE PROGRAMS & ADMISSION CATALOG -->
    <div class="container px-4 py-5 my-2">
      <div class="text-center mb-5">
        <span class="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1.5 text-uppercase rounded-pill">
          Academic Programs 2026–2027
        </span>
        <h2 class="display-6 fw-bold text-dark mt-2.5 mb-2">Available Degree Programs & Eligibility</h2>
        <p class="text-muted mx-auto" style="max-width: 620px; font-size: 1rem;">
          Choose your desired specialization. Applications are evaluated based on Board cutoffs and composite academic marks.
        </p>

        <!-- Category Filters -->
        <div class="d-inline-flex nav-pills-modern mt-3">
          <button type="button" class="nav-link border-0" [class.active]="selectedCategory() === 'ALL'" (click)="selectedCategory.set('ALL')">
            All Programs ({{ courses().length }})
          </button>
          <button type="button" class="nav-link border-0" [class.active]="selectedCategory() === 'BTECH'" (click)="selectedCategory.set('BTECH')">
            B.Tech Engineering
          </button>
          <button type="button" class="nav-link border-0" [class.active]="selectedCategory() === 'COMPUTING'" (click)="selectedCategory.set('COMPUTING')">
            BCA & MCA
          </button>
        </div>
      </div>

      <!-- Programs Grid -->
      <div class="row g-4" *ngIf="filteredCourses().length > 0; else emptyOrLoadingTpl">
        <div class="col-md-6 col-lg-4" *ngFor="let course of filteredCourses()">
          <div class="card h-100 card-modern border-0 overflow-hidden d-flex flex-column">
            
            <!-- Card Header -->
            <div class="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-start">
              <span class="badge bg-primary text-white fw-bold px-2.5 py-1 rounded-pill" style="font-size: 0.74rem;">
                {{ course.degree || (course.courseCode.startsWith('BTECH') ? 'B.Tech' : course.courseCode) }} • {{ course.durationYears }} Years
              </span>
              <span class="badge bg-success bg-opacity-10 text-success fw-bold px-2.5 py-1 rounded-pill" style="font-size: 0.74rem;">
                <i class="bi bi-people-fill me-1"></i>{{ course.seats || 120 }} Total Seats
              </span>
            </div>

            <!-- Card Body -->
            <div class="card-body px-4 pt-1 flex-grow-1">
              <h5 class="fw-bold text-dark mb-1">{{ course.courseName }}</h5>
              <div class="text-muted small mb-3 font-mono">Code: {{ course.courseCode }}</div>

              <!-- Eligibility Box -->
              <div class="bg-light p-3 rounded-3 mb-3 border">
                <div class="small fw-bold text-secondary mb-1">
                  <i class="bi bi-patch-check-fill text-primary me-1"></i> Minimum Board Criteria:
                </div>
                <div class="small text-dark fw-medium" style="line-height: 1.45;">{{ course.eligibilityCriteria }}</div>
              </div>

              <!-- Percentages Grid -->
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <div class="p-2 border rounded-2 text-center bg-white shadow-2xs">
                    <div class="text-muted small fw-semibold" style="font-size: 0.72rem;">Min. 10th Aggregate</div>
                    <strong class="text-primary fs-6 fw-bold">{{ course.minTenthPercentage }}%</strong>
                  </div>
                </div>
                <div class="col-6">
                  <div class="p-2 border rounded-2 text-center bg-white shadow-2xs">
                    <div class="text-muted small fw-semibold" style="font-size: 0.72rem;">Min. 12th Aggregate</div>
                    <strong class="text-primary fs-6 fw-bold">{{ course.minTwelfthPercentage }}%</strong>
                  </div>
                </div>
              </div>

              <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                <span class="small text-muted fw-semibold">Application Fee:</span>
                <span class="fw-extrabold text-success fs-5">₹ {{ course.applicationFee }}</span>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="card-footer bg-white border-0 px-4 pb-4 pt-1">
              <a [routerLink]="['/apply']" [queryParams]="{ courseId: course.courseId }" class="btn btn-iem-primary w-100 py-2.5">
                Apply for {{ course.courseCode }} <i class="bi bi-arrow-right ms-1"></i>
              </a>
            </div>

          </div>
        </div>
      </div>

      <!-- Loading / Empty Fallback -->
      <ng-template #emptyOrLoadingTpl>
        <div class="text-center py-5">
          <div class="spinner-border text-primary mb-3" role="status"></div>
          <div class="text-muted">Loading degree programs from Firebase Cloud Firestore...</div>
        </div>
      </ng-template>
    </div>

    <!-- 4 CORE SCREENS: SYSTEM ARCHITECTURE WORKBENCH -->
    <div class="bg-white py-5 border-top border-bottom">
      <div class="container px-4">
        
        <div class="text-center mb-5">
          <span class="badge bg-warning bg-opacity-20 text-dark fw-bold px-3 py-1.5 text-uppercase rounded-pill">
            System Architecture
          </span>
          <h2 class="display-6 fw-bold text-dark mt-2.5 mb-2">Designed According to Lab 3 & Lab 4 Specifications</h2>
          <p class="text-muted mx-auto" style="max-width: 650px;">
            This prototype fulfills the complete SWE & PM Lab assignment worksheet, covering all 4 core screens backed by Firebase Cloud Firestore, Storage Bucket, and Cloud Functions.
          </p>
        </div>

        <div class="row g-4">
          
          <!-- Screen 1: Admin Dashboard -->
          <div class="col-md-6 col-lg-3">
            <div class="card p-4 h-100 card-modern border bg-white d-flex flex-column">
              <div class="kpi-icon-box bg-danger bg-opacity-10 text-danger mb-3">
                <i class="bi bi-speedometer2"></i>
              </div>
              <div class="fw-bold text-dark mb-1">Screen 1: Admin Console</div>
              <p class="small text-muted flex-grow-1">
                Executive telemetry, revenue analytics, dynamic merit rank calculations, and Cloud Storage bucket file explorer.
              </p>
              <a routerLink="/admin" class="btn btn-sm btn-outline-danger w-100 mt-2">
                Open Admin View <i class="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>

          <!-- Screen 2: Officer Review -->
          <div class="col-md-6 col-lg-3">
            <div class="card p-4 h-100 card-modern border bg-white d-flex flex-column">
              <div class="kpi-icon-box bg-info bg-opacity-10 text-info mb-3">
                <i class="bi bi-clipboard-check"></i>
              </div>
              <div class="fw-bold text-dark mb-1">Screen 2: Officer Desk</div>
              <p class="small text-muted flex-grow-1">
                Central evaluation queue, applicant dossier review, credential verification checklist, and admission decision audit.
              </p>
              <a routerLink="/officer" class="btn btn-sm btn-outline-info w-100 mt-2">
                Open Officer View <i class="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>

          <!-- Screen 3: Student Portal -->
          <div class="col-md-6 col-lg-3">
            <div class="card p-4 h-100 card-modern border bg-white d-flex flex-column">
              <div class="kpi-icon-box bg-primary bg-opacity-10 text-primary mb-3">
                <i class="bi bi-person-badge"></i>
              </div>
              <div class="fw-bold text-dark mb-1">Screen 3: Student Portal</div>
              <p class="small text-muted flex-grow-1">
                Interactive admission tracking stepper, basis path readiness audit, review remarks, and downloadable admit offer letter.
              </p>
              <a routerLink="/student" class="btn btn-sm btn-outline-primary w-100 mt-2">
                Open Student View <i class="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>

          <!-- Screen 4: Application & Payment -->
          <div class="col-md-6 col-lg-3">
            <div class="card p-4 h-100 card-modern border bg-white d-flex flex-column">
              <div class="kpi-icon-box bg-success bg-opacity-10 text-success mb-3">
                <i class="bi bi-cloud-arrow-up"></i>
              </div>
              <div class="fw-bold text-dark mb-1">Screen 4: Upload & Pay</div>
              <p class="small text-muted flex-grow-1">
                3-Step application wizard, direct Cloud Storage bucket uploads (10th/12th marksheets), and payment gateway checkout.
              </p>
              <a routerLink="/apply" class="btn btn-sm btn-outline-success w-100 mt-2">
                Open Upload & Pay <i class="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- ADMISSION TIMELINE & STEPS -->
    <div class="container px-4 py-5 my-2">
      <div class="text-center mb-5">
        <span class="badge bg-secondary bg-opacity-10 text-secondary fw-bold px-3 py-1.5 text-uppercase rounded-pill">
          Simple & Fast Process
        </span>
        <h2 class="display-6 fw-bold text-dark mt-2.5 mb-2">How to Apply for IEM Admission</h2>
      </div>

      <div class="row g-4 text-center">
        <div class="col-sm-6 col-lg-3">
          <div class="p-4 bg-white rounded-4 border shadow-xs h-100">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-3" style="width: 48px; height: 48px; font-size: 1.2rem;">
              1
            </div>
            <h6 class="fw-bold text-dark">Register & Select Program</h6>
            <p class="small text-muted mb-0">Create your applicant account and pick your desired specialization from the catalog.</p>
          </div>
        </div>

        <div class="col-sm-6 col-lg-3">
          <div class="p-4 bg-white rounded-4 border shadow-xs h-100">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-3" style="width: 48px; height: 48px; font-size: 1.2rem;">
              2
            </div>
            <h6 class="fw-bold text-dark">Fill Profile & Academic Marks</h6>
            <p class="small text-muted mb-0">Provide 10th and 12th board marks with auto-saving NoSQL drafts in Firestore.</p>
          </div>
        </div>

        <div class="col-sm-6 col-lg-3">
          <div class="p-4 bg-white rounded-4 border shadow-xs h-100">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-3" style="width: 48px; height: 48px; font-size: 1.2rem;">
              3
            </div>
            <h6 class="fw-bold text-dark">Upload Credentials & Pay Fee</h6>
            <p class="small text-muted mb-0">Stream PDFs to Cloud Storage bucket and complete the fee payment checkout.</p>
          </div>
        </div>

        <div class="col-sm-6 col-lg-3">
          <div class="p-4 bg-white rounded-4 border shadow-xs h-100">
            <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold mx-auto mb-3" style="width: 48px; height: 48px; font-size: 1.2rem;">
              <i class="bi bi-check-lg"></i>
            </div>
            <h6 class="fw-bold text-dark">Review & Offer Letter</h6>
            <p class="small text-muted mb-0">Track verification in real time and download your official Provisional Admission Letter.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ADMISSION SCHEDULE & KEY DATES CALENDAR -->
    <div class="bg-light py-5 border-top">
      <div class="container px-4">
        <div class="text-center mb-5">
          <span class="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1.5 text-uppercase rounded-pill">
            <i class="bi bi-calendar3 me-1"></i> Admission Calendar 2026–2027
          </span>
          <h2 class="display-6 fw-bold text-dark mt-2.5 mb-2">Important Dates & Key Milestones</h2>
          <p class="text-muted mx-auto" style="max-width: 620px;">
            Key dates for online application submission, document verification, merit list publication, and counseling.
          </p>
        </div>

        <div class="row g-4">
          <div class="col-md-6 col-lg-3">
            <div class="card card-modern h-100 p-4 border-0 shadow-sm bg-white position-relative">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge-status badge-approved px-2.5 py-1 font-mono">PHASE 1</span>
                <span class="small text-muted font-mono">March 1, 2026</span>
              </div>
              <h5 class="fw-bold text-dark mb-1">Applications Open</h5>
              <p class="small text-muted mb-0">Centralized online application portal opens for all undergraduate and postgraduate engineering courses.</p>
            </div>
          </div>

          <div class="col-md-6 col-lg-3">
            <div class="card card-modern h-100 p-4 border-0 shadow-sm bg-white position-relative">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge-status badge-under-review px-2.5 py-1 font-mono">PHASE 2</span>
                <span class="small text-muted font-mono">July 15, 2026</span>
              </div>
              <h5 class="fw-bold text-dark mb-1">Application Deadline</h5>
              <p class="small text-muted mb-0">Last date for submission of personal and academic details, marksheet uploads, and fee settlements.</p>
            </div>
          </div>

          <div class="col-md-6 col-lg-3">
            <div class="card card-modern h-100 p-4 border-0 shadow-sm bg-white position-relative">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge-status badge-submitted px-2.5 py-1 font-mono">PHASE 3</span>
                <span class="small text-muted font-mono">July 16–22, 2026</span>
              </div>
              <h5 class="fw-bold text-dark mb-1">Document Auditing</h5>
              <p class="small text-muted mb-0">Central Admissions Committee evaluates candidate credentials and marksheet PDFs stored in Cloud Storage.</p>
            </div>
          </div>

          <div class="col-md-6 col-lg-3">
            <div class="card card-modern h-100 p-4 border-0 shadow-sm bg-white position-relative">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge-status badge-completed px-2.5 py-1 font-mono">PHASE 4</span>
                <span class="small text-muted font-mono">July 25, 2026</span>
              </div>
              <h5 class="fw-bold text-dark mb-1">Merit List & Offer Letters</h5>
              <p class="small text-muted mb-0">Ranked composite merit list published and official downloadable Provisional Admission Offer Letters generated.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  api = inject(ApiService);
  courses = signal<Course[]>([]);
  selectedCategory = signal<'ALL' | 'BTECH' | 'COMPUTING'>('ALL');

  filteredCourses = computed(() => {
    const list = this.courses();
    const cat = this.selectedCategory();
    if (cat === 'BTECH') {
      return list.filter(c => c.degree === 'B.Tech' || c.degree?.includes('B.Tech') || c.courseCode?.startsWith('BTECH'));
    }
    if (cat === 'COMPUTING') {
      return list.filter(c => c.degree === 'BCA' || c.degree === 'MCA' || c.courseCode === 'BCA' || c.courseCode === 'MCA');
    }
    return list;
  });

  ngOnInit(): void {
    this.api.getCourses().subscribe({
      next: (res) => {
        if (res.success) {
          this.courses.set(res.courses);
        }
      },
      error: (err) => console.error('Failed to load courses', err)
    });
  }
}
