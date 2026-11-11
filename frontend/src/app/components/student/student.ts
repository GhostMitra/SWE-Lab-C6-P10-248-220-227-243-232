import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Application } from '../../services/api.service';

@Component({
  selector: 'app-student',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container py-4">
      <!-- Welcome Header -->
      <div class="card card-custom p-4 mb-4 border-0 bg-white shadow-sm">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div class="d-flex align-items-center gap-2">
              <h3 class="fw-bold text-dark mb-0">Welcome, {{ api.currentUser()?.fullName }}</h3>
              <span class="badge bg-primary text-uppercase">{{ api.currentUser()?.role }}</span>
            </div>
            <p class="text-muted small mb-0 mt-1">
              Registered Email: <strong>{{ api.currentUser()?.email }}</strong> | Student ID: #{{ api.currentUser()?.userId }}
            </p>
          </div>
          <div class="d-flex gap-2">
            <a routerLink="/apply" class="btn btn-iem-primary">
              <i class="bi bi-file-earmark-plus me-1"></i> Submit New Application
            </a>
          </div>
        </div>
      </div>

      <!-- Applications List or Empty State -->
      <div *ngIf="applications().length > 0; else noAppsTpl">
        <div class="card card-custom mb-4 border-0 p-4" *ngFor="let app of applications()">
          <!-- Card Header & Status Banner -->
          <div class="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-4 gap-2">
            <div>
              <span class="text-muted small text-uppercase fw-bold">Application Dossier</span>
              <h4 class="fw-bold text-primary mb-0">{{ app.applicationId }}</h4>
              <small class="text-muted">Applied on: {{ app.applicationDate | date:'mediumDate' }}</small>
            </div>
            <div class="text-end">
              <span class="badge-status" [ngClass]="{
                'badge-submitted': app.status === 'SUBMITTED',
                'badge-under-review': app.status === 'UNDER_REVIEW',
                'badge-approved': app.status === 'APPROVED',
                'badge-rejected': app.status === 'REJECTED',
                'badge-completed': app.status === 'COMPLETED'
              }">
                Status: {{ app.status }}
              </span>
            </div>
          </div>

          <!-- Application Stepper (Interactive Timeline) -->
          <div class="stepper-container mb-4">
            <div class="stepper-step completed">
              <div class="stepper-circle"><i class="bi bi-check-lg"></i></div>
              <div class="stepper-title">Registration</div>
            </div>
            <div class="stepper-step completed">
              <div class="stepper-circle"><i class="bi bi-check-lg"></i></div>
              <div class="stepper-title">Application Form</div>
            </div>
            <div class="stepper-step" [class.completed]="app.payment?.status === 'SUCCESS'" [class.active]="app.payment?.status !== 'SUCCESS'">
              <div class="stepper-circle">
                <i class="bi" [ngClass]="app.payment?.status === 'SUCCESS' ? 'bi-check-lg' : 'bi-credit-card'"></i>
              </div>
              <div class="stepper-title">Fee Payment</div>
            </div>
            <div class="stepper-step" [class.completed]="app.status === 'APPROVED' || app.status === 'COMPLETED'" [class.active]="app.status === 'UNDER_REVIEW' || app.status === 'SUBMITTED'">
              <div class="stepper-circle">
                <i class="bi" [ngClass]="app.status === 'APPROVED' ? 'bi-patch-check-fill' : 'bi-search'"></i>
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

          <!-- Details Grid -->
          <div class="row g-4 mb-4">
            <div class="col-md-6">
              <div class="p-3 bg-light rounded-3 border h-100">
                <h6 class="fw-bold text-dark mb-3"><i class="bi bi-book-half text-primary me-2"></i>Course & Choice Details</h6>
                <div class="small mb-2"><strong>Program:</strong> {{ app.courseName }} ({{ app.courseCode }})</div>
                <div class="small mb-2"><strong>Level:</strong> {{ app.degree }}</div>
                <div class="small mb-2"><strong>Application Fee:</strong> ₹ {{ app.applicationFee }}</div>
                <div class="small">
                  <strong>Payment Status:</strong> 
                  <span class="badge ms-1" [ngClass]="app.payment?.status === 'SUCCESS' ? 'bg-success' : 'bg-warning text-dark'">
                    {{ app.payment?.status === 'SUCCESS' ? 'PAID (' + app.payment?.transactionId + ')' : 'UNPAID / PENDING' }}
                  </span>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="p-3 bg-light rounded-3 border h-100">
                <h6 class="fw-bold text-dark mb-3"><i class="bi bi-check2-all text-success me-2"></i>Readiness Checklist (Basis Path)</h6>
                <div class="d-flex justify-content-between small mb-1.5">
                  <span>1. Form Information Complete:</span>
                  <span [ngClass]="app.readiness?.formComplete ? 'text-success fw-bold' : 'text-danger fw-bold'">
                    <i class="bi" [ngClass]="app.readiness?.formComplete ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ app.readiness?.formComplete ? 'COMPLETE' : 'INCOMPLETE' }}
                  </span>
                </div>
                <div class="d-flex justify-content-between small mb-1.5">
                  <span>2. Cloud Bucket Documents:</span>
                  <span [ngClass]="app.readiness?.documentsUploaded ? 'text-success fw-bold' : 'text-danger fw-bold'">
                    <i class="bi" [ngClass]="app.readiness?.documentsUploaded ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ app.readiness?.documentsUploaded ? 'UPLOADED (' + app.documents?.length + ' files)' : 'PENDING UPLOAD' }}
                  </span>
                </div>
                <div class="d-flex justify-content-between small mb-2">
                  <span>3. Application Fee Paid:</span>
                  <span [ngClass]="app.readiness?.feePaid ? 'text-success fw-bold' : 'text-danger fw-bold'">
                    <i class="bi" [ngClass]="app.readiness?.feePaid ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                    {{ app.readiness?.feePaid ? 'PAID' : 'PENDING' }}
                  </span>
                </div>
                <div class="p-2 rounded border small text-center" [ngClass]="app.readiness?.isReady ? 'bg-success bg-opacity-10 text-success fw-bold' : 'bg-warning bg-opacity-10 text-dark'">
                  Overall Application Readiness: {{ app.readiness?.isReady ? 'READY FOR EVALUATION' : 'ACTION REQUIRED' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Documents in Cloud Storage Bucket -->
          <div class="mb-4">
            <h6 class="fw-bold text-dark mb-2"><i class="bi bi-cloud-check-fill text-info me-2"></i>Documents Stored in Firebase Storage Bucket</h6>
            <div class="table-responsive" *ngIf="app.documents && app.documents.length > 0; else noDocsTpl">
              <table class="table table-sm table-bordered align-middle mb-0">
                <thead class="table-light">
                  <tr class="small">
                    <th>Document Type</th>
                    <th>File Name</th>
                    <th>Bucket Location</th>
                    <th>Verification Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let doc of app.documents">
                    <td><span class="badge bg-secondary font-monospace">{{ doc.docType }}</span></td>
                    <td class="small fw-semibold">{{ doc.fileName }}</td>
                    <td class="small text-muted font-monospace">gs://iem-admission-portal.appspot.com</td>
                    <td>
                      <span class="badge" [ngClass]="{
                        'bg-success': doc.verificationStatus === 'VERIFIED',
                        'bg-warning text-dark': doc.verificationStatus === 'PENDING',
                        'bg-danger': doc.verificationStatus === 'REJECTED'
                      }">
                        {{ doc.verificationStatus }}
                      </span>
                      <small class="d-block text-muted" *ngIf="doc.verificationNotes">{{ doc.verificationNotes }}</small>
                    </td>
                    <td>
                      <a [href]="'http://localhost:5000' + doc.filePath" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.75rem;">
                        <i class="bi bi-eye me-1"></i>View File
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noDocsTpl>
              <div class="alert alert-warning small py-2 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i> No documents uploaded yet.
                <a [routerLink]="['/apply']" [queryParams]="{ step: 2, appId: app.applicationId }" class="alert-link ms-1">Upload Required Documents Now</a>
              </div>
            </ng-template>
          </div>

          <!-- Officer Remarks Banner -->
          <div class="alert alert-info py-2 px-3 mb-3 small" *ngIf="app.reviewRemarks">
            <strong><i class="bi bi-chat-left-dots-fill me-1"></i> Admission Officer Notes:</strong> {{ app.reviewRemarks }}
          </div>

          <!-- Actions Footer -->
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2 border-top">
            <div class="small text-muted">
              Database: <span class="badge bg-light text-dark border"><i class="bi bi-fire text-warning me-1"></i>Firebase Cloud Firestore NoSQL</span>
            </div>
            <div class="d-flex gap-2">
              <!-- If fee not paid -->
              <a *ngIf="app.payment?.status !== 'SUCCESS'" [routerLink]="['/apply']" [queryParams]="{ step: 3, appId: app.applicationId }" class="btn btn-sm btn-warning fw-bold">
                <i class="bi bi-credit-card me-1"></i> Pay Application Fee (₹ {{ app.applicationFee }})
              </a>

              <!-- If approved -> Admit letter -->
              <a *ngIf="app.status === 'APPROVED' || app.status === 'COMPLETED'" [href]="'http://localhost:5000/api/storage/buckets/generated-letters/Admit_Letter_' + app.applicationId + '.html'" target="_blank" class="btn btn-sm btn-success fw-bold">
                <i class="bi bi-file-earmark-pdf-fill me-1"></i> Download Official Admit Letter
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <ng-template #noAppsTpl>
        <div class="card card-custom p-5 text-center border-0">
          <div class="text-muted mb-3"><i class="bi bi-folder2-open display-4"></i></div>
          <h4 class="fw-bold">No Applications Submitted Yet</h4>
          <p class="text-muted mx-auto" style="max-width: 480px;">
            You have not submitted an admission application for the 2026 academic batch. Choose a program and submit your academic details.
          </p>
          <div>
            <a routerLink="/apply" class="btn btn-iem-primary">
              <i class="bi bi-pencil-square me-1"></i> Start Application Now
            </a>
          </div>
        </div>
      </ng-template>

      <!-- In-App Notifications Drawer -->
      <div class="card card-custom p-4 border-0 mt-4" *ngIf="notifications().length > 0">
        <h6 class="fw-bold text-dark mb-3"><i class="bi bi-bell-fill text-warning me-2"></i>Recent System Alerts & Email Dispatches</h6>
        <div class="list-group list-group-flush">
          <div class="list-group-item px-0 py-2.5" *ngFor="let n of notifications()">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold text-dark small">{{ n.subject }}</span>
              <span class="text-muted" style="font-size: 0.72rem;">{{ n.sentAt | date:'short' }}</span>
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
