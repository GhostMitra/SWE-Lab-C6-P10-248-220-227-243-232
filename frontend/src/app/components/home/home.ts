import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Course } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero Banner -->
    <div class="bg-iem-primary text-white py-5 position-relative overflow-hidden">
      <div class="container px-4 py-3 position-relative" style="z-index: 2;">
        <div class="row align-items-center g-4">
          <div class="col-lg-8">
            <span class="badge bg-warning text-dark px-3 py-1.5 fw-bold mb-3 text-uppercase tracking-wider">
              <i class="bi bi-mortarboard-fill me-1"></i> Admissions 2026-2027 Open
            </span>
            <h1 class="display-5 fw-extrabold mb-3">
              Shape Your Engineering & Computing Career at <span class="text-warning">IEM Kolkata</span>
            </h1>
            <p class="lead text-white-50 mb-4" style="font-size: 1.15rem; max-width: 680px;">
              Institute of Engineering & Management, Salt Lake, Kolkata — West Bengal's Premier Autonomous Institute. Apply online, upload credentials to secure cloud storage, and track your admission status in real-time.
            </p>
            <div class="d-flex flex-wrap gap-3">
              <a routerLink="/apply" class="btn btn-warning btn-lg fw-bold px-4 py-2.5 shadow">
                <i class="bi bi-pencil-square me-2"></i>Apply for Admission
              </a>
              <a routerLink="/auth" class="btn btn-outline-light btn-lg px-4 py-2.5">
                <i class="bi bi-person-check me-2"></i>Sign In & Track Status
              </a>
            </div>
          </div>
          <div class="col-lg-4">
            <div class="card bg-white text-dark border-0 shadow-lg p-4 rounded-4">
              <div class="d-flex align-items-center gap-3 mb-3 border-bottom pb-3">
                <div class="bg-primary text-white p-2.5 rounded-3">
                  <i class="bi bi-award-fill fs-3"></i>
                </div>
                <div>
                  <h6 class="fw-bold mb-0">Team 404 Brain Not Found</h6>
                  <small class="text-muted">PCCCS594 SWE & PM Lab Portal</small>
                </div>
              </div>
              <ul class="list-unstyled mb-3 small">
                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Client:</strong> Angular 22 Single Page App</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Backend:</strong> Firebase Cloud Functions & Express API</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Firebase Database:</strong> Cloud Firestore (Pure NoSQL Architecture)</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Firebase Storage:</strong> Cloud Storage Bucket (Docs & Letters)</li>
                <li class="mb-2"><i class="bi bi-check-circle-fill text-success me-2"></i><strong>Firebase Auth:</strong> Google & Email/Password Authentication</li>
              </ul>
              <div class="bg-light p-2.5 rounded-3 border text-center small text-muted">
                <i class="bi bi-shield-lock-fill text-primary me-1"></i> 100% Serverless Cloud Native Architecture (No SQL)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Architecture & Pipeline Bar -->
    <div class="bg-white border-bottom py-3 shadow-sm">
      <div class="container px-4">
        <div class="row g-3 text-center text-md-start align-items-center">
          <div class="col-md-4 border-end">
            <div class="d-flex align-items-center gap-2 justify-content-center justify-content-md-start">
              <i class="bi bi-fire fs-2 text-warning"></i>
              <div>
                <div class="fw-bold text-dark small">Firebase Cloud Firestore</div>
                <div class="text-muted" style="font-size: 0.75rem;">Pure NoSQL Multi-Collection Store</div>
              </div>
            </div>
          </div>
          <div class="col-md-4 border-end">
            <div class="d-flex align-items-center gap-2 justify-content-center justify-content-md-start">
              <i class="bi bi-cloud-arrow-up fs-2 text-info"></i>
              <div>
                <div class="fw-bold text-dark small">Cloud Storage Bucket</div>
                <div class="text-muted" style="font-size: 0.75rem;">gs://iem-admission-404bn.firebasestorage.app</div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="d-flex align-items-center gap-2 justify-content-center justify-content-md-start">
              <i class="bi bi-shield-check fs-2 text-success"></i>
              <div>
                <div class="fw-bold text-dark small">Firebase Security Rules</div>
                <div class="text-muted" style="font-size: 0.75rem;">Role-Based Firestore & Storage Rules</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Courses & Programs Section -->
    <div class="container px-4 py-5">
      <div class="text-center mb-5">
        <span class="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 text-uppercase">Academic Programs</span>
        <h2 class="fw-bold text-dark mt-2">Available Degree Programs & Eligibility</h2>
        <p class="text-muted mx-auto" style="max-width: 600px;">
          Review the programs offered for the 2026 academic batch. Ensure minimum 10th & 12th board eligibility marks before submitting an application.
        </p>
      </div>

      <div class="row g-4" *ngIf="courses().length > 0; else loadingTpl">
        <div class="col-md-6 col-lg-4" *ngFor="let course of courses()">
          <div class="card h-100 card-custom border-0 overflow-hidden">
            <div class="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-start">
              <span class="badge bg-primary text-white fw-bold">{{ course.degree }}</span>
              <span class="badge bg-success bg-opacity-10 text-success fw-bold">
                <i class="bi bi-person-check-fill me-1"></i>{{ course.seats }} Seats
              </span>
            </div>
            <div class="card-body px-4">
              <h5 class="fw-bold text-dark mb-2">{{ course.courseName }}</h5>
              <div class="text-muted small mb-3 font-monospace">Course Code: {{ course.courseCode }}</div>
              
              <div class="bg-light p-3 rounded-3 mb-3 border">
                <div class="small fw-bold text-secondary mb-1"><i class="bi bi-shield-check me-1"></i>Eligibility Criteria:</div>
                <div class="small text-dark">{{ course.eligibilityCriteria }}</div>
              </div>

              <div class="d-flex justify-content-between small text-muted mb-2">
                <span>Min. 10th Aggregate:</span>
                <strong class="text-dark">{{ course.minTenthPercentage }}%</strong>
              </div>
              <div class="d-flex justify-content-between small text-muted mb-3">
                <span>Min. 12th Aggregate:</span>
                <strong class="text-dark">{{ course.minTwelfthPercentage }}%</strong>
              </div>
              <div class="d-flex justify-content-between small text-muted border-top pt-2">
                <span>Application Fee:</span>
                <strong class="text-success fs-6">₹ {{ course.applicationFee }}</strong>
              </div>
            </div>
            <div class="card-footer bg-white border-0 px-4 pb-4 pt-0">
              <a [routerLink]="['/apply']" [queryParams]="{ courseId: course.courseId }" class="btn btn-iem-primary w-100">
                Apply for {{ course.courseCode }} <i class="bi bi-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <ng-template #loadingTpl>
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <div class="text-muted mt-2">Loading programs from Firebase Cloud Firestore...</div>
        </div>
      </ng-template>
    </div>

    <!-- 4 Core Screens Reference from Worksheet -->
    <div class="bg-white py-5 border-top border-bottom">
      <div class="container px-4">
        <div class="text-center mb-5">
          <span class="badge bg-warning text-dark fw-bold px-3 py-1 text-uppercase">System Architecture</span>
          <h2 class="fw-bold text-dark mt-2">Modeled directly from Lab 3 & Lab 4 Design Artifacts</h2>
          <p class="text-muted mx-auto" style="max-width: 650px;">
            This prototype implements all four core screens detailed in the SWE & PM Lab assignment worksheet and draws upon the UML Class, DFD, Sequence, and HLD specifications.
          </p>
        </div>

        <div class="row g-4">
          <div class="col-md-3">
            <div class="card p-3 h-100 border rounded-3 bg-light">
              <div class="fw-bold text-primary mb-1"><i class="bi bi-1-circle-fill me-1"></i> Screen 1: Admin Dashboard</div>
              <div class="small text-muted mb-2">Executive KPI control module, admission statistics, system settings, user management, and merit list generator.</div>
              <a routerLink="/admin" class="btn btn-sm btn-outline-primary mt-auto">Open Admin View</a>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card p-3 h-100 border rounded-3 bg-light">
              <div class="fw-bold text-primary mb-1"><i class="bi bi-2-circle-fill me-1"></i> Screen 2: Officer Portal</div>
              <div class="small text-muted mb-2">Applications review queue, document authentication checklist, applicant dossier, and approve/reject decision audit.</div>
              <a routerLink="/officer" class="btn btn-sm btn-outline-primary mt-auto">Open Officer View</a>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card p-3 h-100 border rounded-3 bg-light">
              <div class="fw-bold text-primary mb-1"><i class="bi bi-3-circle-fill me-1"></i> Screen 3: Student Portal</div>
              <div class="small text-muted mb-2">Application tracking stepper, readiness checklist, status timeline, and downloadable official admit letter.</div>
              <a routerLink="/student" class="btn btn-sm btn-outline-primary mt-auto">Open Student View</a>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card p-3 h-100 border rounded-3 bg-light">
              <div class="fw-bold text-primary mb-1"><i class="bi bi-4-circle-fill me-1"></i> Screen 4: Upload & Payment</div>
              <div class="small text-muted mb-2">Multi-step form, Cloud Storage Bucket document upload (10th/12th marksheets), and payment gateway checkout.</div>
              <a routerLink="/apply" class="btn btn-sm btn-outline-primary mt-auto">Open Upload & Pay</a>
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
