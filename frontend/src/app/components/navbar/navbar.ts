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
    <nav class="navbar navbar-expand-lg navbar-dark glass-navbar sticky-top py-2.5 shadow-sm">
      <div class="container-fluid px-3 px-md-4">
        
        <!-- Brand / Institution Emblem -->
        <a class="navbar-brand d-flex align-items-center gap-2.5 text-decoration-none" routerLink="/">
          <div class="bg-gradient text-white rounded-3 d-flex align-items-center justify-content-center fw-extrabold shadow-sm"
               style="width: 40px; height: 40px; font-size: 1.15rem; background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%); border: 1px solid rgba(255,255,255,0.25);">
            IEM
          </div>
          <div class="d-flex flex-column">
            <span class="fw-bold tracking-tight text-white" style="font-size: 1.08rem; line-height: 1.2;">
              IEM ADMISSION PORTAL
            </span>
            <span class="text-white-50" style="font-size: 0.72rem; letter-spacing: 0.02em;">
              Institute of Engineering & Management, Kolkata
            </span>
          </div>
        </a>

        <!-- Mobile Navigation Toggle -->
        <button class="navbar-toggler border-0 p-2 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-label="Toggle navigation">
          <i class="bi bi-list fs-2 text-white"></i>
        </button>

        <!-- Navbar Links & Actions -->
        <div class="collapse navbar-collapse" id="navMenu">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-1">
            <li class="nav-item">
              <a class="nav-link px-3 rounded-pill text-white" routerLink="/" routerLinkActive="active bg-white bg-opacity-10 fw-bold" [routerLinkActiveOptions]="{exact: true}">
                <i class="bi bi-grid-1x2 me-1.5 text-warning"></i> Programs & Catalog
              </a>
            </li>

            <!-- Applicant Links -->
            <li class="nav-item" *ngIf="api.isApplicant()">
              <a class="nav-link px-3 rounded-pill text-white" routerLink="/student" routerLinkActive="active bg-white bg-opacity-10 fw-bold">
                <i class="bi bi-person-badge me-1.5 text-info"></i> My Student Portal
              </a>
            </li>
            <li class="nav-item" *ngIf="api.isApplicant()">
              <a class="nav-link px-3 rounded-pill text-white" routerLink="/apply" routerLinkActive="active bg-white bg-opacity-10 fw-bold">
                <i class="bi bi-file-earmark-plus me-1.5 text-success"></i> New Application
              </a>
            </li>

            <!-- Officer Links -->
            <li class="nav-item" *ngIf="api.isOfficer()">
              <a class="nav-link px-3 rounded-pill text-white" routerLink="/officer" routerLinkActive="active bg-white bg-opacity-10 fw-bold">
                <i class="bi bi-clipboard-check me-1.5 text-info"></i> Officer Review Desk
              </a>
            </li>

            <!-- Admin Links -->
            <li class="nav-item" *ngIf="api.isAdmin()">
              <a class="nav-link px-3 rounded-pill text-white" routerLink="/admin" routerLinkActive="active bg-white bg-opacity-10 fw-bold">
                <i class="bi bi-speedometer2 me-1.5 text-danger"></i> Executive Console
              </a>
            </li>
          </ul>

          <!-- Right Status & Profile Controls -->
          <div class="d-flex flex-wrap align-items-center gap-2.5 mt-2 mt-lg-0">
            
            <!-- Live Cloud Status Pill -->
            <button type="button" class="btn btn-sm btn-outline-light border-opacity-25 d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill"
                    style="background: rgba(255, 255, 255, 0.05); font-size: 0.82rem;"
                    (click)="showFirebaseModal.set(true)" title="View Cloud Infrastructure Status">
              <span class="status-dot status-dot-active"></span>
              <span class="fw-semibold text-white">Firebase Cloud</span>
              <span class="badge bg-warning text-dark py-0.5 px-1.5" style="font-size: 0.65rem;">Active</span>
            </button>

            <!-- Authenticated Profile Dropdown -->
            <ng-container *ngIf="api.isAuthenticated(); else guestTpl">
              <div class="dropdown">
                <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill shadow-sm"
                        style="background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2);"
                        type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                       style="width: 26px; height: 26px; font-size: 0.76rem;">
                    {{ api.currentUser()?.fullName?.charAt(0) || 'U' }}
                  </div>
                  <div class="text-start pe-1">
                    <div class="fw-semibold text-truncate text-white" style="max-width: 120px; font-size: 0.84rem; line-height: 1.1;">
                      {{ api.currentUser()?.fullName }}
                    </div>
                    <div class="text-warning small text-uppercase" style="font-size: 0.64rem; font-weight: 700;">
                      {{ api.currentUser()?.role }}
                    </div>
                  </div>
                </button>

                <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 mt-2 p-2" style="min-width: 240px;">
                  <li class="px-3 py-2 bg-light rounded-2 mb-2">
                    <div class="fw-bold text-dark small">{{ api.currentUser()?.fullName }}</div>
                    <div class="text-muted small text-truncate" style="font-size: 0.76rem;">{{ api.currentUser()?.email }}</div>
                    <span class="badge bg-primary bg-opacity-10 text-primary mt-1 fw-bold" style="font-size: 0.68rem;">
                      {{ api.currentUser()?.role }}
                    </span>
                  </li>

                  <li *ngIf="api.isApplicant()">
                    <a class="dropdown-item rounded-2 py-2 small" routerLink="/student">
                      <i class="bi bi-speedometer2 text-primary me-2"></i>My Dashboard
                    </a>
                  </li>
                  <li *ngIf="api.isApplicant()">
                    <a class="dropdown-item rounded-2 py-2 small" routerLink="/apply">
                      <i class="bi bi-pencil-square text-success me-2"></i>Apply for Course
                    </a>
                  </li>
                  <li *ngIf="api.isOfficer()">
                    <a class="dropdown-item rounded-2 py-2 small fw-bold text-primary" routerLink="/officer">
                      <i class="bi bi-clipboard-check-fill text-primary me-2"></i>Officer Review Desk
                    </a>
                  </li>
                  <li *ngIf="api.isAdmin()">
                    <a class="dropdown-item rounded-2 py-2 small fw-bold text-danger" routerLink="/admin">
                      <i class="bi bi-shield-lock-fill text-danger me-2"></i>Executive Control Console
                    </a>
                  </li>

                  <li><hr class="dropdown-divider my-2"></li>
                  <li>
                    <button class="dropdown-item rounded-2 py-2 small text-danger fw-semibold" (click)="onLogout()">
                      <i class="bi bi-box-arrow-right me-2"></i>Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            </ng-container>

            <!-- Guest State -->
            <ng-template #guestTpl>
              <div class="d-flex align-items-center gap-2">
                <a routerLink="/auth" class="btn btn-iem-accent btn-sm px-3.5 py-1.5 rounded-pill shadow-sm">
                  <i class="bi bi-box-arrow-in-right me-1"></i> Sign In / Register
                </a>
              </div>
            </ng-template>

          </div>
        </div>
      </div>
    </nav>

    <!-- FIREBASE CAPABILITY & CLOUD STATUS MODAL -->
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);" *ngIf="showFirebaseModal()">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-xl">
          <div class="modal-header bg-iem-primary text-white py-3.5 px-4">
            <div class="d-flex align-items-center gap-2.5">
              <div class="bg-warning text-dark p-2 rounded-3 d-flex align-items-center justify-content-center shadow-sm">
                <i class="bi bi-fire fs-4"></i>
              </div>
              <div>
                <h5 class="modal-title fw-bold mb-0">Firebase Cloud Native Architecture</h5>
                <small class="text-white-50">Enterprise Telemetry & Serverless Infrastructure Center</small>
              </div>
            </div>
            <button type="button" class="btn-close btn-close-white" (click)="showFirebaseModal.set(false)" aria-label="Close"></button>
          </div>

          <div class="modal-body p-4 bg-light">
            <!-- Architecture Banner -->
            <div class="card border-0 bg-white p-3.5 rounded-3 shadow-sm mb-4">
              <div class="d-flex align-items-center gap-3">
                <i class="bi bi-check-circle-fill text-success fs-2"></i>
                <div>
                  <div class="fw-bold text-dark">Pure Firebase Serverless Architecture (No SQL Required)</div>
                  <div class="text-muted small">
                    This prototype implements an end-to-end cloud native stack with Firebase Authentication, Cloud Storage Buckets, Cloud Functions, and Firebase Cloud Firestore multi-collection NoSQL store.
                  </div>
                </div>
              </div>
            </div>

            <!-- Service Status Grid -->
            <div class="row g-3 mb-4">
              <div class="col-md-6">
                <div class="p-3 border rounded-3 bg-white h-100 shadow-xs">
                  <div class="d-flex align-items-center justify-content-between mb-1.5">
                    <span class="fw-bold small text-dark"><i class="bi bi-shield-lock-fill text-primary me-1.5"></i> Firebase Auth</span>
                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">ACTIVE</span>
                  </div>
                  <div class="text-muted small">Google SSO & Email/Password tokens authenticated and verified via Firebase Admin SDK.</div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="p-3 border rounded-3 bg-white h-100 shadow-xs">
                  <div class="d-flex align-items-center justify-content-between mb-1.5">
                    <span class="fw-bold small text-dark"><i class="bi bi-cloud-arrow-up-fill text-info me-1.5"></i> Cloud Storage Bucket</span>
                    <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">ATTACHED</span>
                  </div>
                  <div class="text-muted small font-mono" style="font-size: 0.72rem;">gs://{{ fb.config.storageBucket }}</div>
                  <div class="text-muted small mt-1">Multi-bucket partitioning: academic marksheets, candidate media, offer letters.</div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="p-3 border rounded-3 bg-white h-100 shadow-xs">
                  <div class="d-flex align-items-center justify-content-between mb-1.5">
                    <span class="fw-bold small text-dark"><i class="bi bi-database-fill text-warning me-1.5"></i> Cloud Firestore</span>
                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">CONNECTED</span>
                  </div>
                  <div class="text-muted small">10 NoSQL Collections: users, applicants, courses, applications, payments, and audit logs.</div>
                </div>
              </div>

              <div class="col-md-6">
                <div class="p-3 border rounded-3 bg-white h-100 shadow-xs">
                  <div class="d-flex align-items-center justify-content-between mb-1.5">
                    <span class="fw-bold small text-dark"><i class="bi bi-shield-check text-success me-1.5"></i> Security Rules</span>
                    <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">DEPLOYED</span>
                  </div>
                  <div class="text-muted small">Strict role-based Firestore and Cloud Storage security rules active.</div>
                </div>
              </div>
            </div>

            <!-- Configuration Details Code Box -->
            <div class="card border-0 bg-dark text-white p-3.5 rounded-3 shadow-inner">
              <div class="d-flex justify-content-between align-items-center mb-2 text-warning small fw-bold font-mono">
                <span><i class="bi bi-code-slash me-1"></i> ACTIVE ENVIRONMENT CONFIGURATION</span>
                <span class="badge bg-secondary font-mono" style="font-size: 0.65rem;">nam5 (US Central)</span>
              </div>
              <div class="font-mono small text-white-50" style="font-size: 0.78rem; line-height: 1.6;">
                <div><span class="text-white fw-bold">Project ID:</span> {{ fb.config.projectId }}</div>
                <div><span class="text-white fw-bold">Auth Domain:</span> {{ fb.config.authDomain }}</div>
                <div><span class="text-white fw-bold">Storage Bucket:</span> gs://{{ fb.config.storageBucket }}</div>
                <div><span class="text-white fw-bold">Firestore Database:</span> projects/{{ fb.config.projectId }}/databases/(default)</div>
              </div>
            </div>
          </div>

          <div class="modal-footer bg-white py-2.5 px-4 d-flex justify-content-between">
            <span class="small text-muted font-mono" style="font-size: 0.75rem;">SWE & PM Lab Prototype — Team 404 Brain Not Found</span>
            <button type="button" class="btn btn-outline-secondary btn-sm px-4" (click)="showFirebaseModal.set(false)">Close</button>
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
