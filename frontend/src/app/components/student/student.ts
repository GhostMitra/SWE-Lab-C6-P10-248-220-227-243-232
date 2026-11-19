import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Application } from '../../services/api.service';

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-4 my-2">
      
      <!-- APPLICANT PROFILE WELCOME BANNER -->
      <div class="card card-modern p-4 mb-4 border-0 shadow-sm bg-white">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          
          <div class="d-flex align-items-center gap-3">
            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                 style="width: 52px; height: 52px; font-size: 1.25rem; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%) !important;">
              {{ api.currentUser()?.fullName?.charAt(0) || 'S' }}
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <h3 class="fw-bold text-dark mb-0">{{ api.currentUser()?.fullName }}</h3>
                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1">
                  Applicant ID: #{{ api.currentUser()?.userId }}
                </span>
              </div>
              <p class="text-muted small mb-0 mt-1">
                Registered Email: <strong>{{ api.currentUser()?.email }}</strong> • 
                <span class="text-success"><i class="bi bi-shield-check me-1"></i>Verified IEM Applicant</span>
              </p>
            </div>
          </div>

          <div class="d-flex gap-2">
            <a routerLink="/apply" class="btn btn-iem-primary shadow-sm">
              <i class="bi bi-file-earmark-plus me-1.5"></i> Submit New Application
            </a>
          </div>

        </div>
      </div>

      <!-- APPLICATIONS DOSSIER LIST -->
      <div *ngIf="applications().length > 0; else noAppsTpl">
        <div class="card card-modern mb-4 border-0 p-4 p-md-5" *ngFor="let app of applications()">
          
          <!-- Dossier Header & Status Pill -->
          <div class="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3.5 mb-4 gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="text-muted small text-uppercase fw-bold font-mono">Dossier Reference:</span>
                <span class="badge bg-light text-dark font-mono border px-2 py-1 fs-6">{{ app.applicationId }}</span>
              </div>
              <div class="small text-muted">
                <i class="bi bi-calendar-event me-1"></i> Submitted on: <strong>{{ app.applicationDate | date:'mediumDate' }}</strong>
              </div>
            </div>

            <div>
              <span class="badge-status shadow-xs fs-6" [ngClass]="{
                'badge-submitted': app.status === 'SUBMITTED',
                'badge-under-review': app.status === 'UNDER_REVIEW',
                'badge-approved': app.status === 'APPROVED',
                'badge-rejected': app.status === 'REJECTED',
                'badge-completed': app.status === 'COMPLETED'
              }">
                <i class="bi" [ngClass]="{
                  'bi-hourglass-split': app.status === 'SUBMITTED',
                  'bi-search': app.status === 'UNDER_REVIEW',
                  'bi-check-circle-fill': app.status === 'APPROVED' || app.status === 'COMPLETED',
                  'bi-x-circle-fill': app.status === 'REJECTED'
                }"></i>
                {{ app.status }}
              </span>
            </div>
          </div>

          <!-- Application Progress Stepper -->
          <div class="stepper-container mb-4">
            
            <div class="stepper-step completed">
              <div class="stepper-circle"><i class="bi bi-check-lg"></i></div>
              <div class="stepper-title">Registration</div>
            </div>

            <div class="stepper-step completed">
              <div class="stepper-circle"><i class="bi bi-check-lg"></i></div>
              <div class="stepper-title">Profile Data</div>
            </div>

            <div class="stepper-step" [class.completed]="isFeePaid(app)" [class.active]="!isFeePaid(app)">
              <div class="stepper-circle">
                <i class="bi" [ngClass]="isFeePaid(app) ? 'bi-check-lg' : 'bi-credit-card'"></i>
              </div>
              <div class="stepper-title">Fee Payment</div>
            </div>

            <div class="stepper-step" [class.completed]="app.status === 'APPROVED' || app.status === 'COMPLETED'" [class.active]="app.status === 'UNDER_REVIEW' || app.status === 'SUBMITTED'">
              <div class="stepper-circle">
                <i class="bi" [ngClass]="app.status === 'APPROVED' ? 'bi-check-lg' : 'bi-search'"></i>
              </div>
              <div class="stepper-title">Officer Review</div>
            </div>

            <div class="stepper-step" [class.completed]="app.status === 'APPROVED' || app.status === 'COMPLETED'">
              <div class="stepper-circle">
                <i class="bi bi-mortarboard-fill"></i>
              </div>
              <div class="stepper-title">Admit Letter</div>
            </div>

          </div>

          <!-- PROVISIONAL ADMISSION CELEBRATION BANNER (IF APPROVED) -->
          <div class="card border-0 mb-4 p-4 rounded-4 shadow-sm" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 5px solid #10b981 !important;"
               *ngIf="app.status === 'APPROVED' || app.status === 'COMPLETED'">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div class="d-flex align-items-center gap-3">
                <div class="bg-success text-white p-3 rounded-circle shadow-sm">
                  <i class="bi bi-patch-check-fill fs-2"></i>
                </div>
                <div>
                  <h5 class="fw-bold text-success mb-1">Congratulations! Provisional Admission Granted</h5>
                  <p class="text-dark small mb-0" style="max-width: 580px;">
                    Your academic credentials and board cutoffs have been authenticated by the Central Admission Committee. You are eligible for provisional enrollment in <strong>{{ app.courseName }}</strong>.
                  </p>
                </div>
              </div>
              <div>
                <a [href]="'http://localhost:5000/api/storage/buckets/generated-letters/Admit_Letter_' + app.applicationId + '.html'" target="_blank"
                   class="btn btn-success btn-lg px-4 py-2.5 fw-bold shadow">
                  <i class="bi bi-file-earmark-arrow-down-fill me-1.5"></i> Download Offer Letter (PDF)
                </a>
              </div>
            </div>
          </div>

          <!-- UNPAID FEE ALERT (IF PENDING) -->
          <div class="alert alert-warning py-3 px-4 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 shadow-xs"
               *ngIf="!isFeePaid(app)">
            <div class="d-flex align-items-center gap-2.5">
              <i class="bi bi-exclamation-triangle-fill fs-3 text-warning"></i>
              <div>
                <strong class="text-dark">Application Fee Payment Pending (₹ {{ app.applicationFee }})</strong>
                <div class="small text-muted">Complete the payment checkout to initiate official officer document review.</div>
              </div>
            </div>
            <a [routerLink]="['/apply']" [queryParams]="{ step: 3, appId: app.applicationId }" class="btn btn-warning btn-sm fw-bold px-3 py-2 shadow-xs">
              <i class="bi bi-credit-card me-1"></i> Pay Application Fee Now
            </a>
          </div>

          <!-- Details Grid -->
          <div class="row g-4 mb-4">
            
            <!-- Program & Payment Details -->
            <div class="col-md-6">
              <div class="p-4 bg-light rounded-3 border h-100">
                <h6 class="fw-bold text-dark mb-3">
                  <i class="bi bi-mortarboard text-primary me-2"></i>Target Program & Choice
                </h6>
                <div class="d-flex justify-content-between small mb-2 border-bottom pb-2">
                  <span class="text-muted">Degree Program:</span>
                  <strong class="text-dark">{{ app.courseName }}</strong>
                </div>
                <div class="d-flex justify-content-between small mb-2 border-bottom pb-2">
                  <span class="text-muted">Course Code:</span>
                  <span class="badge bg-white text-dark border font-mono">{{ app.courseCode }}</span>
                </div>
                <div class="d-flex justify-content-between small mb-2 border-bottom pb-2">
                  <span class="text-muted">Degree Level:</span>
                  <strong class="text-dark">{{ app.degree }}</strong>
                </div>
                <div class="d-flex justify-content-between small align-items-center pt-1">
                  <span class="text-muted">Application Fee Status:</span>
                  <span class="badge" [ngClass]="isFeePaid(app) ? 'bg-success' : 'bg-warning text-dark'">
                    {{ isFeePaid(app) ? ('PAID' + (app.payment?.transactionId ? ' (' + app.payment?.transactionId + ')' : '')) : 'UNPAID' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Basis Path Readiness Checklist -->
            <div class="col-md-6">
              <div class="p-4 bg-light rounded-3 border h-100">
                <h6 class="fw-bold text-dark mb-3">
                  <i class="bi bi-shield-check text-success me-2"></i>Readiness Checklist (Basis Path)
                </h6>
                <div class="d-flex justify-content-between small mb-2 border-bottom pb-2">
                  <span>1. Personal & Academic Data:</span>
                  <span [ngClass]="app.readiness?.formComplete ? 'text-success fw-bold' : 'text-danger fw-bold'">
                    <i class="bi" [ngClass]="app.readiness?.formComplete ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ app.readiness?.formComplete ? 'VERIFIED' : 'PENDING' }}
                  </span>
                </div>
                <div class="d-flex justify-content-between small mb-2 border-bottom pb-2">
                  <span>2. Cloud Storage Marksheets:</span>
                  <span [ngClass]="app.readiness?.documentsUploaded ? 'text-success fw-bold' : 'text-danger fw-bold'">
                    <i class="bi" [ngClass]="app.readiness?.documentsUploaded ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ app.readiness?.documentsUploaded ? 'ATTACHED (' + (app.documents?.length || 0) + ' Files)' : 'REQUIRED' }}
                  </span>
                </div>
                <div class="d-flex justify-content-between small mb-2 border-bottom pb-2">
                  <span>3. Application Fee Received:</span>
                  <span [ngClass]="isFeePaid(app) ? 'text-success fw-bold' : 'text-danger fw-bold'">
                    <i class="bi" [ngClass]="isFeePaid(app) ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ isFeePaid(app) ? 'CLEARED' : 'UNPAID' }}
                  </span>
                </div>
                <div class="p-2.5 rounded-2 border small text-center mt-3"
                     [ngClass]="app.readiness?.isReady ? 'bg-success bg-opacity-10 text-success fw-bold border-success border-opacity-25' : 'bg-warning bg-opacity-10 text-warning-text fw-bold border-warning border-opacity-25'">
                  Overall Readiness: {{ app.readiness?.isReady ? 'READY FOR OFFICER EVALUATION' : 'ACTION REQUIRED TO COMPLETE DOSSIER' }}
                </div>
              </div>
            </div>

          </div>

          <!-- Stored Documents Table -->
          <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2.5">
              <h6 class="fw-bold text-dark mb-0">
                <i class="bi bi-cloud-check-fill text-info me-2"></i>Documents Stored in Firebase Storage Bucket
              </h6>
              <span class="badge bg-light text-muted border font-mono" style="font-size: 0.72rem;">
                gs://iem-admission-404bn.firebasestorage.app
              </span>
            </div>

            <div class="table-modern-wrapper shadow-xs" *ngIf="app.documents && app.documents.length > 0; else noDocsTpl">
              <table class="table-modern">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>File Name</th>
                    <th>Bucket Location</th>
                    <th>Verification Status</th>
                    <th class="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let doc of app.documents">
                    <td><span class="badge bg-secondary bg-opacity-15 text-dark font-mono border">{{ doc.docType }}</span></td>
                    <td class="fw-semibold">{{ doc.fileName }}</td>
                    <td class="font-mono text-muted small" style="font-size: 0.75rem;">/{{ doc.docType }}/{{ doc.fileName }}</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'bg-success': doc.verificationStatus === 'VERIFIED',
                        'bg-warning text-dark': doc.verificationStatus === 'PENDING',
                        'bg-danger': doc.verificationStatus === 'REJECTED'
                      }">
                        {{ doc.verificationStatus }}
                      </span>
                    </td>
                    <td class="text-end">
                      <a [href]="api.getFileUrl(doc.filePath)" target="_blank" class="btn btn-sm btn-outline-primary py-1 px-2.5" style="font-size: 0.8rem;">
                        <i class="bi bi-eye me-1"></i>View File
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ng-template #noDocsTpl>
              <div class="alert alert-light border text-center py-4 text-muted small rounded-3">
                <i class="bi bi-cloud-arrow-up fs-3 text-primary d-block mb-1"></i>
                No certificates uploaded yet. 
                <a [routerLink]="['/apply']" [queryParams]="{ step: 2, appId: app.applicationId }" class="alert-link ms-1 fw-bold">
                  Upload Required Marksheets Now
                </a>
              </div>
            </ng-template>
          </div>

          <!-- Officer Remarks Banner (If Available) -->
          <div class="alert alert-info py-3 px-3.5 mb-3 rounded-3 small border border-info border-opacity-25" *ngIf="app.reviewRemarks">
            <strong class="d-flex align-items-center gap-1.5 mb-1 text-primary">
              <i class="bi bi-chat-left-text-fill"></i> Admission Officer Feedback:
            </strong>
            <div class="text-dark">{{ app.reviewRemarks }}</div>
          </div>

          <!-- Dossier Footer -->
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-3 border-top text-muted small">
            <div>
              Synced with: <span class="badge bg-light text-dark border font-mono"><i class="bi bi-fire text-warning me-1"></i>Cloud Firestore</span>
            </div>
            <div class="d-flex gap-2">
              <!-- If fee not paid: check if required documents uploaded -->
              <ng-container *ngIf="!isFeePaid(app)">
                <a *ngIf="!app.readiness?.documentsUploaded"
                   [routerLink]="['/apply']" [queryParams]="{ step: 2, appId: app.applicationId }"
                   class="btn btn-sm btn-outline-danger fw-bold">
                  <i class="bi bi-upload me-1"></i> Upload Required Docs First
                </a>
                <a *ngIf="app.readiness?.documentsUploaded"
                   [routerLink]="['/apply']" [queryParams]="{ step: 3, appId: app.applicationId }"
                   class="btn btn-sm btn-warning fw-bold text-dark">
                  <i class="bi bi-credit-card me-1"></i> Pay Application Fee (₹ {{ app.applicationFee }})
                </a>
              </ng-container>

              <!-- If approved -> Admit letter -->
              <a *ngIf="app.status === 'APPROVED' || app.status === 'COMPLETED'" [href]="api.getFileUrl('/api/storage/buckets/generated-letters/Admit_Letter_' + app.applicationId + '.html')" target="_blank" class="btn btn-sm btn-success fw-bold">
                <i class="bi bi-file-earmark-pdf-fill me-1"></i> Download Official Admit Letter
              </a>
            </div>
          </div>

        </div>
      </div>

      <!-- Empty State -->
      <ng-template #noAppsTpl>
        <div class="card card-modern p-5 text-center border-0 bg-white">
          <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
               style="width: 72px; height: 72px; font-size: 2rem;">
            <i class="bi bi-folder2-open"></i>
          </div>
          <h4 class="fw-bold text-dark">No Applications Submitted Yet</h4>
          <p class="text-muted mx-auto mb-4" style="max-width: 460px;">
            You have not submitted an admission application for the 2026 academic batch. Choose an engineering or computing program to start your journey.
          </p>
          <div>
            <a routerLink="/apply" class="btn btn-iem-primary btn-lg px-4 py-2.5 shadow-sm">
              <i class="bi bi-pencil-square me-1.5"></i> Start Application Now
            </a>
          </div>
        </div>
      </ng-template>

      <!-- System Notifications Drawer -->
      <div class="card card-modern p-4 border-0 mt-4 bg-white" *ngIf="notifications().length > 0">
        <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
          <i class="bi bi-bell-fill text-warning"></i> Recent System Alerts & Dispatch Logs
        </h6>
        <div class="list-group list-group-flush">
          <div class="list-group-item px-0 py-3 border-bottom" *ngFor="let n of notifications()">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold text-dark small">{{ n.subject }}</span>
              <span class="text-muted font-mono" style="font-size: 0.72rem;">{{ n.sentAt | date:'short' }}</span>
            </div>
            <div class="small text-muted">{{ n.message }}</div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class StudentComponent implements OnInit {
  api = inject(ApiService);
  applications = signal<Application[]>([]);
  notifications = signal<any[]>([]);

  ngOnInit(): void {
    this.loadApplications();
    this.loadNotifications();
  }

  isFeePaid(app: any): boolean {
    if (!app) return false;
    if (app.paymentStatus === 'PAID' || app.paymentStatus === 'SUCCESS') return true;
    if (app.readiness?.feePaid) return true;
    const s = app.payment?.status;
    return s === 'SUCCESS' || s === 'COMPLETED' || s === 'PAID';
  }

  loadApplications(): void {
    this.api.getMyApplications().subscribe({
      next: (res) => {
        if (res.success) {
          this.applications.set(res.applications);
        }
      },
      error: (err) => console.error('Error fetching applications', err)
    });
  }

  loadNotifications(): void {
    this.api.getMyNotifications().subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.set(res.notifications);
        }
      },
      error: (err) => console.error('Error fetching notifications', err)
    });
  }
}
