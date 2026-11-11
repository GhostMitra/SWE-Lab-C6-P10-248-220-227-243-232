import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-iem-primary sticky-top shadow-sm py-2">
      <div class="container-fluid px-4">
        <!-- Brand -->
        <a class="navbar-brand d-flex align-items-center gap-2" routerLink="/">
          <div class="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 38px; height: 38px; font-size: 1.1rem; color: #1e3a8a !important;">
            IEM
          </div>
          <div>
            <div class="fw-bold tracking-tight" style="font-size: 1.15rem; line-height: 1.2;">IEM ADMISSION PORTAL</div>
            <div class="text-white-50 small" style="font-size: 0.72rem;">Institute of Engineering & Management, Kolkata</div>
          </div>
        </a>

        <!-- Mobile toggle -->
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navMenu">
          <!-- Left Nav links -->
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-1">
            <li class="nav-item">
              <a class="nav-link px-3" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
                <i class="bi bi-house me-1"></i> Programs & Catalog
              </a>
            </li>

            <!-- Applicant Links -->
            <li class="nav-item" *ngIf="api.currentUser()?.role === 'APPLICANT'">
              <a class="nav-link px-3" routerLink="/student" routerLinkActive="active">
                <i class="bi bi-person-badge me-1"></i> My Portal & Status
              </a>
            </li>
            <li class="nav-item" *ngIf="api.currentUser()?.role === 'APPLICANT'">
              <a class="nav-link px-3" routerLink="/apply" routerLinkActive="active">
                <i class="bi bi-file-earmark-plus me-1"></i> New Application / Pay Fee
              </a>
            </li>

            <!-- Officer Links -->
            <li class="nav-item" *ngIf="api.currentUser()?.role === 'ADMISSION_OFFICER' || api.currentUser()?.role === 'ADMINISTRATOR'">
              <a class="nav-link px-3" routerLink="/officer" routerLinkActive="active">
                <i class="bi bi-clipboard-check me-1"></i> Officer Evaluation Portal
              </a>
            </li>

            <!-- Admin Links -->
            <li class="nav-item" *ngIf="api.currentUser()?.role === 'ADMINISTRATOR'">
              <a class="nav-link px-3" routerLink="/admin" routerLinkActive="active">
                <i class="bi bi-speedometer2 me-1"></i> Admin Analytics & Control
              </a>
            </li>
          </ul>

          <!-- Architecture & Firebase Badges -->
          <div class="d-flex align-items-center gap-2">
            <!-- Firebase Status Pill (Clickable) -->
            <button type="button" class="btn btn-sm btn-outline-warning d-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill" (click)="showFirebaseModal.set(true)">
              <i class="bi bi-fire text-warning"></i>
              <span class="small fw-bold">Firebase Active</span>
              <span class="badge bg-warning text-dark py-0 px-1" style="font-size: 0.65rem;">Config</span>
            </button>

            <!-- Logged In / Guest -->
            <ng-container *ngIf="api.isAuthenticated(); else guestTpl">
              <div class="dropdown">
                <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2 px-3 py-1.5" type="button" data-bs-toggle="dropdown">
                  <i class="bi bi-person-circle"></i>
                  <div class="text-start">
                    <div class="fw-semibold text-truncate" style="max-width: 130px; font-size: 0.82rem;">{{ api.currentUser()?.fullName }}</div>
                    <div class="text-warning small text-uppercase" style="font-size: 0.65rem; font-weight: 700;">{{ api.currentUser()?.role }}</div>
                  </div>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow">
                  <li class="px-3 py-2 border-bottom">
                    <div class="small fw-bold">{{ api.currentUser()?.fullName }}</div>
                    <div class="small text-muted">{{ api.currentUser()?.email }}</div>
                    <span class="badge bg-secondary mt-1">{{ api.currentUser()?.role }}</span>
                  </li>
                  <li *ngIf="api.currentUser()?.role === 'APPLICANT'">
                    <a class="dropdown-item" routerLink="/student"><i class="bi bi-speedometer me-2"></i>My Dashboard</a>
                  </li>
                  <li *ngIf="api.currentUser()?.role === 'ADMISSION_OFFICER'">
                    <a class="dropdown-item" routerLink="/officer"><i class="bi bi-folder-check me-2"></i>Applications Queue</a>
                  </li>
                  <li *ngIf="api.currentUser()?.role === 'ADMINISTRATOR'">
                    <a class="dropdown-item" routerLink="/admin"><i class="bi bi-shield-lock me-2"></i>Admin Console</a>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <button class="dropdown-item text-danger" (click)="onLogout()">
                      <i class="bi bi-box-arrow-right me-2"></i>Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            </ng-container>

            <ng-template #guestTpl>
              <a routerLink="/auth" class="btn btn-warning btn-sm fw-bold px-3 py-1.5 shadow-sm">
                <i class="bi bi-box-arrow-in-right me-1"></i> Sign In / Register
              </a>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>

    <!-- FIREBASE STATUS & CONFIGURATION MODAL -->
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.6);" *ngIf="showFirebaseModal()">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-iem-primary text-white py-3">
            <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
              <i class="bi bi-fire text-warning fs-4"></i> Firebase Integration & Capability Center
            </h5>
            <button type="button" class="btn-close btn-close-white" (click)="showFirebaseModal.set(false)"></button>
          </div>
          <div class="modal-body p-4">
            <div class="alert alert-success d-flex align-items-center gap-2 py-2 mb-3 small">
              <i class="bi bi-check-circle-fill fs-5"></i>
              <div>
                <strong>Firebase Integration Enabled:</strong> Pure Firebase Architecture with Firebase Authentication, Cloud Storage Buckets, and Cloud Firestore (Pure NoSQL Database - No SQL required).
              </div>
            </div>

            <!-- Service Status Grid -->
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="p-3 border rounded-3 bg-light h-100">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="fw-bold small text-dark"><i class="bi bi-shield-lock-fill text-primary me-1"></i> Firebase Authentication</span>
                    <span class="badge bg-success">ACTIVE</span>
                  </div>
                  <div class="text-muted small">Google SSO & Email/Password Auth tokens validated via Firebase Admin SDK.</div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="p-3 border rounded-3 bg-light h-100">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="fw-bold small text-dark"><i class="bi bi-cloud-arrow-up-fill text-info me-1"></i> Firebase Storage Bucket</span>
                    <span class="badge bg-info text-dark">ATTACHED</span>
                  </div>
                  <div class="text-muted small font-monospace" style="font-size: 0.72rem;">gs://{{ fb.config.storageBucket }}</div>
                  <div class="text-muted small">Sub-buckets: academic-docs, candidate-media, generated-letters.</div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="p-3 border rounded-3 bg-light h-100">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="fw-bold small text-dark"><i class="bi bi-database-fill text-warning me-1"></i> Firebase Cloud Firestore</span>
                    <span class="badge bg-success">CONNECTED</span>
                  </div>
                  <div class="text-muted small">Pure NoSQL database: users, applications, courses, payments, documents, and audit logs.</div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="p-3 border rounded-3 bg-light h-100">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="fw-bold small text-dark"><i class="bi bi-shield-check text-success me-1"></i> Firestore Security Rules</span>
                    <span class="badge bg-success">DEPLOYED</span>
                  </div>
                  <div class="text-muted small">Live security rules & composite indexes deployed to Cloud Firestore (nam5).</div>
                </div>
              </div>
            </div>

            <!-- Configuration Details -->
            <h6 class="fw-bold text-dark mb-2">Project Credentials (firebase.json & .firebaserc)</h6>
            <div class="bg-dark text-white p-3 rounded-3 small font-monospace mb-3" style="font-size: 0.78rem;">
              <div><strong>Project ID:</strong> {{ fb.config.projectId }}</div>
              <div><strong>Auth Domain:</strong> {{ fb.config.authDomain }}</div>
              <div><strong>Storage Bucket:</strong> gs://{{ fb.config.storageBucket }}</div>
              <div><strong>Firestore Database:</strong> projects/{{ fb.config.projectId }}/databases/(default)</div>
              <div><strong>Architecture:</strong> Pure Firebase NoSQL Serverless (No SQL)</div>
            </div>
          </div>
          <div class="modal-footer py-2">
            <button type="button" class="btn btn-secondary btn-sm" (click)="showFirebaseModal.set(false)">Close</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NavbarComponent {
  api = inject(ApiService);
  fb = inject(FirebaseService);
  router = inject(Router);

  showFirebaseModal = signal<boolean>(false);

  onLogout(): void {
    this.api.logout();
    this.fb.signOut();
    this.router.navigate(['/auth']);
  }
}
